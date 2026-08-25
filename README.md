# 🤖 SmartBot RAG — Document Q&A Chatbot

A full-stack **Retrieval-Augmented Generation (RAG)** chatbot that lets you upload documents and have intelligent, context-aware conversations with them. Powered by **Groq's ultra-fast inference** and **FAISS vector search**.

---

## ✨ Features

### 📄 Document Management
- Upload multiple documents simultaneously (PDF, DOCX, XLSX, TXT)
- View document metadata — filename, file size, page count, word count, character count
- Select one or multiple documents to chat with at once
- Delete documents from the session
- Per-document summarization with a single click

### 💬 Intelligent Chat
- **RAG-powered answers** — responses are grounded in your actual document content
- **Real-time streaming** — tokens stream as they are generated (no waiting for full response)
- **Source citations** — every answer shows the exact document chunks it was derived from
- **Multi-document mode** — query across multiple documents simultaneously, with cross-document citations
- **Conversation history** — the model retains context across multiple turns
- **Follow-up question chips** — 3 AI-generated follow-up questions appear after each response for quick exploration
- **Collapsible source panel** — view and expand retrieved context chunks inline

### 🎨 UI/UX
- Dark-themed, glassmorphism-inspired interface
- Smooth token-by-token streaming with animated typing indicator
- Scroll-to-bottom button when reading previous messages
- Suggestion chips for one-click follow-up queries
- Responsive layout with sidebar document manager and main chat panel
- Markdown rendering in chat messages (bold, lists, code blocks, headings)

---

## 🏗️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.111.0 | REST API framework with async support |
| **Uvicorn** | 0.30.1 | ASGI server with hot-reload |
| **LangChain** | 0.2.5 | Document chunking & RAG pipeline orchestration |
| **FAISS** | 1.8.0 | In-memory vector store for semantic similarity search |
| **Sentence Transformers** | 3.0.1 | Local embedding model (`all-MiniLM-L6-v2`) for vectorizing chunks |
| **Groq SDK** | 0.9.0 | LLM inference client (ultra-low latency) |
| **PyMuPDF** | 1.24.5 | PDF text extraction |
| **python-docx** | 1.1.2 | DOCX text extraction |
| **openpyxl** | 3.1.5 | XLSX text extraction |
| **Pydantic** | 2.7.4 | Request/response schema validation |
| **python-dotenv** | 1.0.1 | Environment variable management |
| **python-multipart** | 0.0.9 | File upload parsing |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI framework |
| **Vite** | Fast dev server with HMR and ES module bundling |
| **Tailwind CSS** | Utility-first styling |
| **react-markdown** | Renders markdown in chat messages |
| **axios** | HTTP client for REST API calls |
| **Vanilla CSS / CSS Variables** | Custom design tokens for theming |

### AI & Models
| Model | Provider | Use |
|---|---|---|
| `openai/gpt-oss-120b` | Groq | Primary chat Q&A and summarization |
| `openai/gpt-oss-20b` | Groq | Follow-up question generation |
| `all-MiniLM-L6-v2` | Sentence Transformers (local) | Document chunk embeddings |

---

## 📁 Project Structure

```
SmartBot(RAG)/
├── backend/
│   ├── main.py                  # FastAPI app entry point, router registration
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # GROQ_API_KEY (not committed)
│   ├── models/
│   │   └── schemas.py           # Pydantic models (ChatRequest, DocumentMetadata)
│   ├── routers/
│   │   ├── upload.py            # POST /upload — file ingestion pipeline
│   │   ├── chat.py              # POST /chat — streaming RAG Q&A
│   │   ├── documents.py         # GET /documents, DELETE /documents/{id}
│   │   └── summarize.py         # POST /api/summarize — streaming summarization
│   ├── services/
│   │   ├── parser.py            # File text extraction (PDF, DOCX, XLSX, TXT)
│   │   ├── chunker.py           # LangChain recursive text splitter
│   │   ├── retriever.py         # FAISS vector store creation & similarity search
│   │   └── llm.py               # Groq streaming, follow-up generation
│   └── store/
│       └── vector_store.py      # In-memory VectorStoreManager singleton
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── App.jsx          # Root layout: sidebar + chat panel
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx   # Main chat UI with scroll management
│   │   │   ├── MessageBubble.jsx# Individual message with markdown & sources
│   │   │   ├── SuggestionChips.jsx # Follow-up question pill buttons
│   │   │   ├── SourceChunks.jsx # Collapsible retrieved context viewer
│   │   │   ├── DocumentList.jsx # Sidebar document cards
│   │   │   └── FileUploader.jsx # Drag-and-drop / click-to-upload zone
│   │   ├── context/
│   │   │   └── DocContext.jsx   # Document state (list, active/selected IDs)
│   │   ├── hooks/
│   │   │   └── useChat.js       # Chat state, streaming, suggestions logic
│   │   └── services/
│   │       └── api.js           # streamChat(), summarizeDoc(), REST wrappers
│   └── vite.config.js           # Dev proxy: /chat, /upload, /api → :8000
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/keys) (free tier available)

### 1. Clone the repository
```bash
git clone https://github.com/ShaliniCSE07/Smart-Bot-RAG-.git
cd Smart-Bot-RAG-
```

### 2. Backend setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo GROQ_API_KEY=your_key_here > .env
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

### 4. Run the application

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload
# API available at http://127.0.0.1:8000
# Swagger docs at http://127.0.0.1:8000/docs
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App available at http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload a document; returns metadata + `doc_id` |
| `GET` | `/documents` | List all uploaded documents |
| `DELETE` | `/documents/{doc_id}` | Remove a document from the session |
| `POST` | `/chat` | Stream a RAG Q&A response (SSE) |
| `POST` | `/api/summarize` | Stream a document summary (SSE) |
| `GET` | `/health` | Health check |

### SSE Event Types (chat & summarize)
```json
{ "type": "sources",     "sources": [...] }      // Retrieved context chunks
{ "type": "token",       "token": "..." }         // Streamed response token
{ "type": "suggestions", "suggestions": [...] }   // Follow-up question chips
{ "type": "error",       "content": "..." }       // Error message
```
```
data: [DONE]                                       // Stream complete
```

---

## ⚙️ How It Works

```
User uploads file
       │
       ▼
  Text Extraction (PyMuPDF / python-docx / openpyxl)
       │
       ▼
  Recursive Text Chunking (LangChain, ~500 tokens/chunk)
       │
       ▼
  Embedding (all-MiniLM-L6-v2, local, no API cost)
       │
       ▼
  FAISS Index stored in memory (keyed by doc_id)
       │
       ▼
User asks question
       │
       ▼
  Semantic Search → Top-5 relevant chunks retrieved
       │
       ▼
  Prompt assembled: [system + metadata + context + history + question]
       │
       ▼
  Groq LLM streams answer token-by-token via SSE
       │
       ▼
  Follow-up questions generated asynchronously
```

---

## 📝 Notes

- Documents are stored **in-memory only** — they are lost when the backend server restarts
- Embeddings run **locally** on CPU via Sentence Transformers (no extra API calls)
- The Vite dev server proxies all API calls, so there are no CORS issues during development
- To persist documents across restarts, a database + disk-based FAISS index would be needed

---


