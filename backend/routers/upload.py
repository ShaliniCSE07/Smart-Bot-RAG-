from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime
import uuid

try:
    from backend.models.schemas import DocumentMetadata
    from backend.services.parser import extract_text
    from backend.services.chunker import chunk_text
    from backend.services.retriever import create_vector_store
    from backend.store.vector_store import vector_store_manager
except ImportError:
    from models.schemas import DocumentMetadata
    from services.parser import extract_text
    from services.chunker import chunk_text
    from services.retriever import create_vector_store
    from store.vector_store import vector_store_manager

router = APIRouter()

@router.post("/upload", response_model=DocumentMetadata)
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Filename missing")
        
    try:
        content_bytes = await file.read()
        file_size = len(content_bytes)
        
        # Check for empty file
        if file_size == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
            
        # Parse / extract text — returns dict with text + stats
        parse_result = extract_text(content_bytes, filename)
        text        = parse_result["text"]
        page_count  = parse_result.get("page_count")
        word_count  = parse_result.get("word_count")
        char_count  = parse_result.get("char_count")
        file_type   = parse_result.get("file_type")

        # Split into chunks
        chunks = chunk_text(text)
        if not chunks:
            raise HTTPException(status_code=400, detail="No text chunks generated from document")

        # Embed and index via FAISS
        vectorstore = create_vector_store(chunks)

        # Generate metadata
        doc_id = str(uuid.uuid4())
        metadata = DocumentMetadata(
            doc_id=doc_id,
            filename=filename,
            upload_time=datetime.now().isoformat(),
            file_size=file_size,
            file_type=file_type,
            page_count=page_count,
            word_count=word_count,
            char_count=char_count,
        )
        
        # Store in-memory
        vector_store_manager.add_store(doc_id, vectorstore, metadata)
        
        return metadata
        
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
