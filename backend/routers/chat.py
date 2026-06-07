from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

try:
    from backend.models.schemas import ChatRequest
    from backend.store.vector_store import vector_store_manager
    from backend.services.retriever import retrieve_chunks, retrieve_chunks_multi
    from backend.services.llm import stream_groq_response, stream_groq_response_multi
except ImportError:
    from models.schemas import ChatRequest
    from store.vector_store import vector_store_manager
    from services.retriever import retrieve_chunks, retrieve_chunks_multi
    from services.llm import stream_groq_response, stream_groq_response_multi

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in request.history]

    # Validate all doc_ids exist
    stores = {}
    for doc_id in request.doc_ids:
        store = vector_store_manager.get_store(doc_id)
        if not store:
            raise HTTPException(
                status_code=404,
                detail=f"Document {doc_id} not found"
            )
        stores[doc_id] = store

    sse_headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    }

    # Single doc mode
    if len(request.doc_ids) == 1:
        store = stores[request.doc_ids[0]]
        vectorstore = store["vectorstore"]
        metadata = store["metadata"].model_dump() if store.get("metadata") else None
        context_docs = retrieve_chunks(vectorstore, request.question, k=5)
        return StreamingResponse(
            stream_groq_response(context_docs, history_dicts, request.question, metadata),
            media_type="text/event-stream",
            headers=sse_headers
        )

    # Multi doc mode
    multi_chunks = retrieve_chunks_multi(stores, request.question, k_per_doc=3)
    return StreamingResponse(
        stream_groq_response_multi(multi_chunks, history_dicts, request.question),
        media_type="text/event-stream",
        headers=sse_headers
    )