from fastapi import APIRouter, HTTPException
from typing import List

try:
    from backend.models.schemas import DocumentMetadata
    from backend.store.vector_store import vector_store_manager
except ImportError:
    from models.schemas import DocumentMetadata
    from store.vector_store import vector_store_manager

router = APIRouter()

@router.get("/documents", response_model=List[DocumentMetadata])
async def list_documents():
    return vector_store_manager.list_documents()

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    success = vector_store_manager.delete_store(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "ok", "message": f"Document {doc_id} successfully deleted"}
