import sys
import os

# ─── Ensure imports work from both:
#   (a)  root dir → python -m uvicorn backend.main:app
#   (b)  backend/ → uvicorn main:app --reload
_this_dir   = os.path.dirname(os.path.abspath(__file__))   # .../backend
_parent_dir = os.path.dirname(_this_dir)                    # .../SmartBot(RAG)
for _p in [_this_dir, _parent_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Load .env from the backend directory wherever we are launched from
from dotenv import load_dotenv
load_dotenv(os.path.join(_this_dir, ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from routers import upload, chat, documents, summarize
except ImportError:
    from backend.routers import upload, chat, documents, summarize

app = FastAPI(
    title="Document Q&A Chatbot API",
    description="Backend API for document upload, processing, RAG, and streaming Q&A response",
    version="1.0.0"
)

# CORS – allow both localhost and 127.0.0.1 origins used by Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router,    tags=["Upload"])
app.include_router(chat.router,      tags=["Chat"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(summarize.router, prefix="/api", tags=["Summarize"])

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
