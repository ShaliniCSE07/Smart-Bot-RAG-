from pydantic import BaseModel, Field, model_validator
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str = Field(description="Role of the sender: 'user' or 'assistant'")
    content: str = Field(description="Content of the message")

class ChatRequest(BaseModel):
    doc_ids: List[str] = Field(
        description="List of doc_ids to query. One for single doc, multiple for multi-doc."
    )
    question: str = Field(description="The user's query")
    history: List[ChatMessage] = Field(default=[], description="The conversation history")

    @model_validator(mode="after")
    def check_doc_ids(self):
        if not self.doc_ids:
            raise ValueError("At least one doc_id is required")
        return self

class DocumentMetadata(BaseModel):
    doc_id: str
    filename: str
    upload_time: str
    file_size: int
    file_type: Optional[str] = None
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    char_count: Optional[int] = None

class SummarizeRequest(BaseModel):
    doc_id: str = Field(description="The unique document identifier to summarize")
