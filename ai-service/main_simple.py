"""
Simplified main FastAPI application for StudySpace AI Service
Start with basic functionality, ready for RAG integration
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    logger.info("🚀 Initializing StudySpace AI Service...")
    
    # Create necessary directories
    os.makedirs("./storage/documents", exist_ok=True)
    os.makedirs("./storage/chroma_db", exist_ok=True)
    os.makedirs("./temp_uploads", exist_ok=True)
    
    logger.info("✅ AI Service initialized successfully!")
    
    yield
    
    logger.info("🛑 Shutting down AI Service...")

# Create FastAPI app with lifespan management
app = FastAPI(
    title="StudySpace AI Service",
    description="RAG-based AI service for personalized learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class ChatQuery(BaseModel):
    question: str
    user_id: Optional[str] = None
    context_type: Optional[str] = "general"

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    context_type: str
    status: str = "success"

class ServiceStatus(BaseModel):
    status: str
    service: str
    version: str
    rag_available: bool = False

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "StudySpace AI Service is running!",
        "version": "1.0.0",
        "features": [
            "Basic FastAPI Backend",
            "Ready for RAG Integration",
            "Document Upload Endpoints", 
            "Chat Interface Ready"
        ]
    }

@app.get("/health", response_model=ServiceStatus)
async def health_check():
    """Detailed health check"""
    return ServiceStatus(
        status="healthy",
        service="StudySpace AI Service",
        version="1.0.0",
        rag_available=False
    )

# Basic chat endpoint (without RAG for now)
@app.post("/api/rag/chat", response_model=ChatResponse)
async def chat_basic(query: ChatQuery):
    """
    Basic chat endpoint - will be enhanced with RAG capabilities
    """
    try:
        # For now, return a basic response
        response = f"Thank you for your question: '{query.question}'. RAG system is being integrated and will provide detailed answers based on your course materials soon!"
        
        return ChatResponse(
            answer=response,
            context_type=query.context_type,
            sources=[]
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing chat query"
        )

@app.get("/api/rag/status")
async def get_rag_status():
    """
    Get the current status of the RAG pipeline
    """
    return {
        "status": "initializing",
        "message": "RAG system is being set up. Basic chat functionality is available.",
        "details": {
            "embeddings_loaded": False,
            "retriever_ready": False,
            "document_chain_ready": False,
            "total_documents": 0,
            "unindexed_documents": 0
        }
    }

@app.post("/api/rag/upload-document")
async def upload_document_placeholder():
    """
    Document upload endpoint - will be enhanced with actual processing
    """
    return {
        "message": "Document upload endpoint ready. RAG processing will be added soon.",
        "status": "placeholder"
    }

@app.get("/api/rag/documents")
async def list_documents():
    """
    List documents endpoint
    """
    return {
        "documents": [],
        "total": 0,
        "message": "Document management system ready for integration"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
