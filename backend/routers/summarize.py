import json
from typing import AsyncGenerator, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

try:
    from backend.store.vector_store import vector_store_manager
    from backend.services.llm import get_groq_client
except ImportError:
    from store.vector_store import vector_store_manager
    from services.llm import get_groq_client

router = APIRouter()

BATCH_SIZE = 20

BATCH_SYSTEM_PROMPT = (
    "Summarize the following section of a document clearly and concisely. "
    "Focus on key points, findings, and important facts."
)

COMBINE_SYSTEM_PROMPT = (
    "You are given multiple partial summaries of sections of a document. "
    "Combine them into one well-structured final summary with these sections:\n\n"
    "## Overview\n"
    "## Key Points\n"
    "## Important Details\n"
    "## Conclusion\n\n"
    "Be concise and avoid repetition."
)


class SummarizeRequest(BaseModel):
    doc_id: str


def _batched(lst: List[str], size: int) -> List[List[str]]:
    """Split a list into batches of at most `size` items."""
    return [lst[i : i + size] for i in range(0, len(lst), size)]


async def _collect_groq_text(client, system_prompt: str, user_content: str) -> str:
    """Run a NON-streaming Groq call and return the full text."""
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_content},
        ],
        stream=False,
    )
    return completion.choices[0].message.content or ""


async def _stream_summarize(doc_id: str) -> AsyncGenerator[str, None]:
    """Core generator: batch-summarise then stream the final combined summary."""
    # ── 1. Validate doc exists ──────────────────────────────────────────────
    chunks: List[str] = vector_store_manager.get_all_chunks(doc_id)
    if not chunks:
        yield f"data: {json.dumps({'type': 'error', 'content': 'Document not found or has no content.'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    try:
        client = get_groq_client()
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': f'Groq client error: {str(e)}'})} \n\n"
        yield "data: [DONE]\n\n"
        return

    # ── 2. Batch summarisation (for large documents) ─────────────────────────
    batches = _batched(chunks, BATCH_SIZE)
    partial_summaries: List[str] = []

    if len(batches) > 1:
        # Notify the client we are pre-processing
        yield f"data: {json.dumps({'type': 'token', 'token': f'*Processing {len(chunks)} chunks in {len(batches)} batches…*\n\n'})}\n\n"

        for i, batch in enumerate(batches, 1):
            user_content = f"Document section {i} of {len(batches)}:\n\n" + "\n\n".join(batch)
            try:
                partial = await _collect_groq_text(client, BATCH_SYSTEM_PROMPT, user_content)
                partial_summaries.append(partial)
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'content': f'Batch {i} failed: {str(e)}'})} \n\n"
                yield "data: [DONE]\n\n"
                return
    else:
        # Single batch — send everything directly
        partial_summaries = ["\n\n".join(chunks)]

    # ── 3. Final streaming combination call ──────────────────────────────────
    combined_input = "\n\n---\n\n".join(
        f"Section {i+1} Summary:\n{s}" for i, s in enumerate(partial_summaries)
    )

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": COMBINE_SYSTEM_PROMPT},
                {"role": "user",   "content": combined_input},
            ],
            stream=True,
        )
        for chunk in completion:
            token = chunk.choices[0].delta.content
            if token:
                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': f'Streaming error: {str(e)}'})} \n\n"

    yield "data: [DONE]\n\n"


@router.post("/summarize")
async def summarize_document(request: SummarizeRequest):
    """
    Stream a structured summary of all chunks for the given doc_id.
    SSE format identical to /chat.
    """
    # Quick existence check before starting the stream
    if not vector_store_manager.get_store(request.doc_id):
        raise HTTPException(status_code=404, detail="Document not found.")

    return StreamingResponse(
        _stream_summarize(request.doc_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
