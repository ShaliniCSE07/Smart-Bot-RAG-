from langchain_community.vectorstores import FAISS
from typing import List, Any, Dict
try:
    from backend.services.embedder import get_embeddings_model
except ImportError:
    from services.embedder import get_embeddings_model

def create_vector_store(chunks: List[str]) -> FAISS:
    embeddings = get_embeddings_model()
    # Create the FAISS index in-memory
    vectorstore = FAISS.from_texts(chunks, embeddings)
    return vectorstore

def retrieve_chunks(vectorstore: FAISS, query: str, k: int = 5) -> List[Any]:
    # similarity_search returns List[Document]
    return vectorstore.similarity_search(query, k=k)

def retrieve_chunks_multi(
    stores: Dict[str, Any],
    question: str,
    k_per_doc: int = 3
) -> List[Dict]:
    """
    Retrieve top k chunks from each selected document.
    Returns list of dicts:
    { doc_id, filename, page_content, metadata }
    """
    all_results = []
    for doc_id, store in stores.items():
        try:
            vectorstore = store["vectorstore"]
            filename = store["metadata"].filename
            docs = retrieve_chunks(vectorstore, question, k=k_per_doc)
            for doc in docs:
                all_results.append({
                    "doc_id": doc_id,
                    "filename": filename,
                    "page_content": doc.page_content,
                    "metadata": doc.metadata
                })
        except Exception:
            continue
    return all_results
