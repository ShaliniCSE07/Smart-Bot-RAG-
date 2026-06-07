import os
import json
from typing import List, Dict, Any, Optional
from groq import Groq, DefaultHttpxClient
from dotenv import load_dotenv

load_dotenv()

def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    return Groq(api_key=api_key, http_client=DefaultHttpxClient())

def build_messages(
    context_chunks: List[str],
    history: List[Dict[str, str]],
    question: str,
    metadata: Optional[Dict] = None
) -> List[Dict[str, str]]:
    context_text = "\n\n".join([f"[Chunk {i+1}]: {chunk}" for i, chunk in enumerate(context_chunks)])

    # Build metadata section
    if metadata:
        page_info = metadata.get("page_count") or "N/A"
        meta_section = f"""Document Information:
- Filename: {metadata.get('filename', 'N/A')}
- File type: {metadata.get('file_type', 'N/A')}
- Total pages: {page_info}
- Word count: {metadata.get('word_count', 'N/A')}
- Character count: {metadata.get('char_count', 'N/A')}

"""
    else:
        meta_section = ""

    system_prompt = (
        "You are a helpful assistant answering questions about an uploaded document.\n"
        "Use the Document Information section to answer metadata questions like page count, "
        "word count, and filename directly.\n"
        "For content questions, use the Context section below.\n"
        "If the answer is not available, say so honestly.\n\n"
        f"{meta_section}"
        f"Context:\n{context_text}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    return messages

async def stream_groq_response(
    context_docs: List[Any],
    history: List[Dict[str, str]],
    question: str,
    metadata: Optional[Dict] = None
):
    try:
        client = get_groq_client()
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': f'Groq client error: {str(e)}'})}\n\n"
        return

    context_chunks = [doc.page_content for doc in context_docs]
    sources = [
        {"index": i + 1, "content": doc.page_content, "metadata": doc.metadata}
        for i, doc in enumerate(context_docs)
    ]

    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    messages = build_messages(context_chunks, history, question, metadata)

    full_answer = ""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stream=True
        )
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                full_answer += content
                yield f"data: {json.dumps({'type': 'token', 'token': content})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': f'Streaming error: {str(e)}'})}\n\n"
        yield "data: [DONE]\n\n"
        return

    # Generate follow-up suggestions after streaming completes
    try:
        suggestions = generate_followup_questions(question, full_answer, context_chunks)
        if suggestions:
            yield f"data: {json.dumps({'type': 'suggestions', 'suggestions': suggestions})}\n\n"
    except Exception as e:
        # Fail silently - don't break chat if suggestions fail
        pass

    yield "data: [DONE]\n\n"


def generate_followup_questions(
    question: str,
    answer: str,
    context_chunks: List[str]
) -> List[str]:
    """
    Generate 3 follow-up questions based on document context, user question, and assistant answer.
    Returns a list of up to 3 question strings, or empty list on failure.
    """
    try:
        client = get_groq_client()
        context_preview = "\n".join(context_chunks[:3])
        
        prompt = f"""Based on the following document context, user question, and assistant answer, generate exactly 3 short follow-up questions the user might want to ask next.

Document context (excerpt):
{context_preview}

User question: {question}
Assistant answer: {answer}

Rules:
- Each question must be specific to this document
- Keep each question under 12 words
- Do not number them
- Return ONLY a JSON array of 3 strings, nothing else
- Example format: ["Question 1?", "Question 2?", "Question 3?"]
"""
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            stream=False
        )
        
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        
        try:
            questions = json.loads(raw)
            if isinstance(questions, list) and len(questions) > 0:
                return questions[:3]
        except Exception:
            pass
        return []
    except Exception as e:
        # Fail silently - never break chat due to suggestions
        return []

def build_messages_multi(
    multi_chunks: List[Dict],
    history: List[Dict[str, str]],
    question: str
) -> List[Dict[str, str]]:
    from collections import defaultdict
    grouped = defaultdict(list)
    for chunk in multi_chunks:
        grouped[chunk["filename"]].append(chunk["page_content"])

    context_parts = []
    for filename, chunks in grouped.items():
        context_parts.append(f"=== From: {filename} ===")
        for i, chunk in enumerate(chunks):
            context_parts.append(f"[Chunk {i+1}]: {chunk}")
        context_parts.append("")

    context_text = "\n".join(context_parts)

    system_prompt = (
        "You are a helpful assistant. The user is querying "
        "multiple documents at once.\n"
        "Answer based on ALL the context provided below.\n"
        "Each section is labeled with its source document.\n"
        "When answering, cite which document the information "
        "comes from using: (Source: filename.pdf)\n"
        "If information spans multiple documents, combine it "
        "and cite each source separately.\n"
        "If the answer is not found in any document, say: "
        "'I could not find this in any of the selected "
        "documents.'\n\n"
        f"Context:\n{context_text}"
    )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": question})
    return messages

async def stream_groq_response_multi(
    multi_chunks: List[Dict],
    history: List[Dict[str, str]],
    question: str
):
    try:
        client = get_groq_client()
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        return

    sources = [
        {
            "index": i + 1,
            "filename": chunk["filename"],
            "doc_id": chunk["doc_id"],
            "content": chunk["page_content"]
        }
        for i, chunk in enumerate(multi_chunks)
    ]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    messages = build_messages_multi(multi_chunks, history, question)

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            stream=True
        )
        full_answer = ""
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                full_answer += content
                yield f"data: {json.dumps({'type': 'token', 'token': content})}\n\n"

        try:
            context_chunks = [c["page_content"] for c in multi_chunks[:3]]
            suggestions = generate_followup_questions(
                question, full_answer, context_chunks
            )
            yield f"data: {json.dumps({'type': 'suggestions', 'suggestions': suggestions})}\n\n"
        except Exception:
            pass

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    yield "data: [DONE]\n\n"