from typing import Dict, Any, List, Optional
try:
    from backend.models.schemas import DocumentMetadata
except ImportError:
    from models.schemas import DocumentMetadata

class VectorStoreManager:
    def __init__(self):
        # Maps doc_id -> { "vectorstore": FAISS_instance, "metadata": DocumentMetadata }
        self._stores: Dict[str, Dict[str, Any]] = {}

    def add_store(self, doc_id: str, vectorstore: Any, metadata: DocumentMetadata):
        self._stores[doc_id] = {
            "vectorstore": vectorstore,
            "metadata": metadata
        }

    def get_store(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return self._stores.get(doc_id)

    def delete_store(self, doc_id: str) -> bool:
        if doc_id in self._stores:
            del self._stores[doc_id]
            return True
        return False

    def list_documents(self) -> List[DocumentMetadata]:
        return [store["metadata"] for store in self._stores.values()]

    def get_all_chunks(self, doc_id: str) -> List[str]:
        """Return every chunk text stored in the FAISS index for doc_id."""
        store = self._stores.get(doc_id)
        if not store:
            return []
        try:
            docs = store["vectorstore"].docstore._dict.values()
            return [doc.page_content for doc in docs]
        except Exception:
            return []


# Singleton instance
vector_store_manager = VectorStoreManager()
