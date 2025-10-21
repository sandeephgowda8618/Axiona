# StudySpace AI Services Documentation

## Overview

The StudySpace AI Service provides intelligent educational features through a Retrieval Augmented Generation (RAG) system. This service enables students to interact with their course materials through natural language queries, automatic quiz generation, and content summarization.

## Architecture

```
StudySpace AI Service
├── FastAPI Application (main.py)
├── Services/
│   ├── Document Manager    - File handling & metadata
│   ├── RAG Pipeline       - AI retrieval & generation
│   └── Configuration      - System settings
├── Routers/
│   └── RAG Chat          - API endpoints
└── Storage/
    ├── Documents         - Uploaded files
    └── ChromaDB          - Vector database
```

## Core Services

### 1. Document Manager (`services/document_manager.py`)

The Document Manager handles the complete lifecycle of educational documents within the RAG system.

#### **Class: DocumentManager**

**Purpose**: Manages document uploads, storage, metadata tracking, and indexing status for the RAG pipeline.

#### **Key Methods**

```python
class DocumentManager:
    def __init__(self, storage_dir: Optional[str] = None)
    # Initializes storage directory and loads existing document metadata
    
    def upload_document(self, file_path: str, title: Optional[str] = None, 
                       user_id: Optional[str] = None) -> Optional[str]
    # Uploads and stores a document with metadata tracking
    # Returns: Document ID if successful, None otherwise
    
    def list_documents(self, user_id: Optional[str] = None) -> List[Dict]
    # Lists all documents, optionally filtered by user
    # Returns: List of document metadata dictionaries
    
    def delete_document(self, doc_id: str) -> bool
    # Safely removes document and its metadata
    # Returns: True if successful, False otherwise
    
    def get_unindexed_paths(self) -> List[str]
    # Returns paths of documents not yet processed by RAG
    # Used by RAG pipeline to identify new content
    
    def mark_as_indexed(self, stored_file_path: str)
    # Marks document as processed by RAG pipeline
    # Updates indexing status in metadata
```

#### **Document Metadata Schema**

```json
{
  "doc_id": {
    "title": "Document Title",
    "stored_file": "/path/to/stored/file.pdf",
    "file_type": ".pdf",
    "size": 1048576,
    "upload_date": "2025-10-15T10:30:00",
    "user_id": "user123",
    "is_indexed": false
  }
}
```

#### **Supported File Types**
- **PDF**: `.pdf` - Course materials, textbooks, papers
- **Text**: `.txt` - Plain text documents
- **Markdown**: `.md` - Formatted documentation
- **Code**: `.py`, `.js`, `.html`, `.css` - Programming materials

#### **Features**
- **User Isolation**: Documents can be filtered by user ID
- **Metadata Persistence**: JSON-based storage for quick access
- **Error Handling**: Comprehensive logging and error recovery
- **Storage Management**: Automatic directory creation and cleanup

---

### 2. RAG Pipeline (`services/rag_pipeline.py`)

The RAG Pipeline implements sophisticated retrieval and generation capabilities for educational AI.

#### **Class: RAGPipeline**

**Purpose**: Orchestrates document processing, vector storage, retrieval, and LLM-powered response generation.

#### **Key Methods**

```python
class RAGPipeline:
    def __init__(self, config: RAGConfig, document_manager: DocumentManager)
    # Initializes RAG components with configuration and document manager
    
    def build_pipeline(self) -> Tuple[Optional[object], Optional[object]]
    # Constructs complete RAG pipeline with retrieval and generation
    # Returns: (retriever, document_chain) tuple
    
    def query(self, question: str) -> Optional[str]
    # Processes natural language query through RAG pipeline
    # Returns: Generated answer based on indexed documents
    
    def get_pipeline_status(self) -> dict
    # Returns current status of all RAG components
    # Used for system monitoring and debugging
```

#### **RAG Architecture Components**

##### **1. Document Processing**
```python
def _load_and_split_docs(self, file_paths: List[str]) -> List
# - Loads documents using appropriate loaders (PDF, text)
# - Splits content into optimized chunks (1000 chars, 150 overlap)
# - Handles multiple document formats
```

##### **2. Embeddings & Vector Storage**
```python
def _initialize_embeddings(self)
# - Uses HuggingFace sentence-transformers
# - Model: "all-MiniLM-L6-v2" (efficient, high-quality)
# - Stores vectors in ChromaDB for fast retrieval
```

##### **3. Hybrid Retrieval System**
```python
def _load_or_create_bm25(self) -> Optional[BM25Retriever]
# - BM25 for keyword-based search
# - Vector search for semantic similarity
# - Ensemble retriever combines both methods
# - Cross-encoder reranking for precision
```

##### **4. LLM Integration**
```python
def _initialize_llm(self)
# - Groq API integration for fast inference
# - Model: "mixtral-8x7b-32768" (high capability)
# - Educational prompt engineering
```

#### **Educational Prompt Templates**

The RAG system uses specialized prompts optimized for learning:

```python
EDUCATIONAL_PROMPT = """
You are an expert educational AI assistant for StudySpace. 
Answer based *only* on the provided context from course materials.

Provide clear, well-structured explanations that help students learn.
Break down complex concepts into digestible parts.
If examples would help, provide them.

Context from course materials:
{context}

Student Question: {input}

Educational Response:
"""
```

#### **Pipeline Flow**

```
1. User Query
    ↓
2. Hybrid Retrieval (BM25 + Vector)
    ↓
3. Cross-Encoder Reranking
    ↓
4. Context Selection (Top 5 documents)
    ↓
5. LLM Generation with Educational Prompting
    ↓
6. Structured Response
```

---

### 3. Configuration Management (`services/config.py`)

Centralized configuration for all AI service components.

#### **Class: RAGConfig**

**Purpose**: Manages model configurations, storage paths, and system settings.

#### **Model Configurations**

```python
class RAGConfig:
    # Embedding Model
    EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
    # - Fast, efficient embeddings
    # - Good balance of speed and quality
    # - 384-dimensional vectors
    
    # Language Model
    API_MODEL_NAME = "mixtral-8x7b-32768"
    # - High-capability instruction-following
    # - Large context window (32k tokens)
    # - Fast inference via Groq
    
    # Reranker Model
    RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    # - Precise relevance scoring
    # - Optimized for question-answering
    # - Improves retrieval accuracy
```

#### **Storage & Database Settings**

```python
# File Storage
STORAGE_DIR = "./storage"
CHROMA_DB_PATH = "./storage/chroma_db"

# Model Optimization
MODEL_KWARGS = {"device": "cpu"}  # Configurable for GPU
```

#### **Environment Variables**

```bash
# Required API Keys
GROQ_API_KEY=your_groq_api_key_here

# Optional Overrides
STORAGE_DIR=/custom/storage/path
EMBEDDING_MODEL_NAME=custom-model-name
```

---

## API Endpoints (`routers/rag_chat.py`)

### Core Endpoints

#### **POST /api/rag/chat**
**Purpose**: Main conversational AI endpoint

```python
# Request
{
    "question": "Explain supervised learning",
    "user_id": "student123",
    "context_type": "general"  # general, quiz, summary
}

# Response
{
    "answer": "Supervised learning is a machine learning approach...",
    "sources": ["doc_123", "doc_456"],
    "context_type": "general",
    "status": "success"
}
```

#### **POST /api/rag/upload-document**
**Purpose**: Document upload and indexing

```python
# Form Data
file: binary_file_data
title: "Machine Learning Textbook Chapter 1"
user_id: "student123"

# Response
{
    "document_id": "doc_20251015_103000_chapter1",
    "title": "Machine Learning Textbook Chapter 1",
    "status": "uploaded",
    "message": "Document uploaded and indexed successfully"
}
```

#### **GET /api/rag/documents**
**Purpose**: List user's documents

```python
# Response
{
    "documents": [
        {
            "id": "doc_123",
            "title": "ML Chapter 1",
            "file_type": ".pdf",
            "size": 1048576,
            "upload_date": "2025-10-15T10:30:00",
            "is_indexed": true,
            "user_id": "student123"
        }
    ],
    "total": 1
}
```

### Specialized AI Features

#### **POST /api/rag/generate-quiz**
**Purpose**: Automatic quiz generation from course materials

```python
# Request
{
    "question": "supervised learning algorithms",
    "user_id": "student123"
}

# Response
{
    "quiz_content": "## Quiz: Supervised Learning\n\n1. Which of the following...",
    "topic": "supervised learning algorithms",
    "type": "multiple_choice"
}
```

#### **POST /api/rag/generate-summary**
**Purpose**: Content summarization for study guides

```python
# Request
{
    "question": "neural networks and deep learning",
    "user_id": "student123"
}

# Response
{
    "summary": "## Neural Networks Summary\n\n### Key Concepts...",
    "topic": "neural networks and deep learning",
    "type": "study_summary"
}
```

#### **GET /api/rag/status**
**Purpose**: System health monitoring

```python
# Response
{
    "status": "operational",
    "details": {
        "embeddings_loaded": true,
        "retriever_ready": true,
        "document_chain_ready": true,
        "total_documents": 15,
        "unindexed_documents": 0
    }
}
```

---

## Installation & Setup

### Dependencies

```bash
# Core FastAPI
pip install fastapi uvicorn python-multipart pydantic

# RAG System
pip install langchain langchain-community langchain-chroma
pip install sentence-transformers chromadb
pip install PyMuPDF python-docx transformers torch

# Utilities
pip install python-dotenv aiofiles httpx rich
```

### Environment Setup

```bash
# Create .env file
GROQ_API_KEY=your_groq_api_key_here
STORAGE_DIR=./storage
CHROMA_DB_PATH=./storage/chroma_db
```

### Directory Structure

```bash
ai-service/
├── main.py                 # FastAPI application
├── main_simple.py          # Basic service (no RAG deps)
├── requirements.txt        # Full dependencies
├── requirements-basic.txt  # Basic dependencies
├── .env                   # Environment variables
├── services/
│   ├── __init__.py
│   ├── config.py          # Configuration management
│   ├── document_manager.py # Document handling
│   └── rag_pipeline.py    # RAG implementation
├── routers/
│   ├── __init__.py
│   └── rag_chat.py        # API endpoints
└── storage/
    ├── documents/         # Uploaded files
    ├── chroma_db/        # Vector database
    └── uploaded_docs.json # Document metadata
```

---

## Usage Examples

### Basic Service Test

```bash
# Start basic service
python main_simple.py

# Test health endpoint
curl http://localhost:8000/health

# Test basic chat
curl -X POST "http://localhost:8000/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is machine learning?"}'
```

### Full RAG Service

```bash
# Start full RAG service (after installing dependencies)
python main.py

# Upload document
curl -X POST "http://localhost:8000/api/rag/upload-document" \
  -F "file=@textbook.pdf" \
  -F "title=ML Textbook" \
  -F "user_id=student123"

# Query with RAG
curl -X POST "http://localhost:8000/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Explain supervised learning with examples",
    "user_id": "student123"
  }'

# Generate quiz
curl -X POST "http://localhost:8000/api/rag/generate-quiz" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "machine learning algorithms",
    "user_id": "student123"
  }'
```

---

## Performance & Optimization

### Model Performance
- **Embedding Speed**: ~1000 docs/second for chunking
- **Query Latency**: <2 seconds for typical queries
- **Memory Usage**: ~2GB RAM for full pipeline
- **Storage**: ~50MB per 1000 document chunks

### Scaling Considerations
- **ChromaDB**: Handles millions of vectors efficiently
- **Async FastAPI**: Non-blocking I/O for concurrent requests
- **Caching**: BM25 retriever cached for performance
- **Batching**: Document processing in batches

### Configuration Tuning

```python
# Chunk size optimization
CHUNK_SIZE = 1000        # Larger for more context
CHUNK_OVERLAP = 150      # Overlap to preserve meaning

# Retrieval parameters
BM25_K = 15             # Keyword results
VECTOR_K = 15           # Semantic results
RERANK_TOP_N = 5        # Final results after reranking

# LLM settings
TEMPERATURE = 0.1       # Low for factual responses
MAX_TOKENS = 1000       # Response length limit
```

---

## Error Handling & Logging

### Error Types

```python
# Document errors
FileNotFoundError       # File upload issues
JSONDecodeError        # Metadata corruption
PermissionError        # Storage access issues

# RAG errors
EmbeddingError         # Model loading failures
RetrievalError         # Search system issues
LLMError              # Generation failures

# API errors
ValidationError        # Request format issues
AuthenticationError    # API key problems
RateLimitError        # Service limits exceeded
```

### Logging Configuration

```python
import logging

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Usage in services
logger = logging.getLogger(__name__)
logger.info("Document uploaded successfully")
logger.error("RAG pipeline initialization failed")
```

---

## Security & Best Practices

### Data Security
- **File Validation**: Strict file type checking
- **Path Sanitization**: Prevent directory traversal
- **User Isolation**: User-specific document access
- **API Key Management**: Environment variable storage

### Performance Best Practices
- **Lazy Loading**: Models loaded on first use
- **Connection Pooling**: Efficient database connections
- **Caching Strategies**: Multiple levels of caching
- **Resource Cleanup**: Proper file handle management

### Monitoring & Maintenance
- **Health Checks**: System status endpoints
- **Metrics Collection**: Usage and performance stats
- **Error Tracking**: Comprehensive error logging
- **Storage Monitoring**: Disk usage tracking

---

## Troubleshooting

### Common Issues

#### 1. **Dependencies Not Found**
```bash
# Solution: Install missing packages
pip install -r requirements.txt
```

#### 2. **GROQ_API_KEY Not Set**
```bash
# Solution: Add to .env file
echo "GROQ_API_KEY=your_key_here" >> .env
```

#### 3. **ChromaDB Permission Error**
```bash
# Solution: Check directory permissions
chmod 755 storage/chroma_db
```

#### 4. **Document Upload Fails**
```python
# Check: File size limits, supported formats
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
SUPPORTED_TYPES = {'.pdf', '.txt', '.md', '.py', '.js'}
```

#### 5. **RAG Responses Poor Quality**
```python
# Tune: Retrieval parameters
CHUNK_SIZE = 1500      # Increase context
RERANK_TOP_N = 3       # Reduce noise
TEMPERATURE = 0.05     # More deterministic
```

---

## Development & Extension

### Adding New File Types

```python
# In document_manager.py
SUPPORTED_EXTENSIONS = {
    '.pdf': PyMuPDFLoader,
    '.txt': TextLoader,
    '.docx': DocxLoader,     # Add new type
    '.pptx': PowerPointLoader # Add new type
}
```

### Custom Prompt Templates

```python
# In rag_pipeline.py
QUIZ_PROMPT = """
Generate a quiz based on the course materials provided.
Create {num_questions} multiple-choice questions.
Include explanations for correct answers.

Course Materials:
{context}

Topic: {topic}

Quiz:
"""
```

### Additional API Endpoints

```python
# In routers/rag_chat.py
@router.post("/api/rag/generate-flashcards")
async def generate_flashcards(query: FlashcardQuery):
    # Implementation for flashcard generation
    pass

@router.post("/api/rag/explain-concept")  
async def explain_concept(query: ConceptQuery):
    # Implementation for concept explanation
    pass
```

This documentation provides a comprehensive guide to the StudySpace AI Services, covering all aspects from architecture to deployment and troubleshooting.
