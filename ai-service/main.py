"""
StudySpace AI Service - RAG-based Learning Assistant
Main FastAPI application for AI-powered study features
"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Import routers
from routers import chat, quiz, summary
from routers.rag_chat import router as rag_router

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

# Include routers
app.include_router(rag_router, prefix="/api")
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(summary.router, prefix="/api/summary", tags=["summary"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "StudySpace AI Service is running!",
        "version": "1.0.0",
        "features": [
            "RAG-based Chat Assistant",
            "AI Quiz Generation",
            "Content Summarization", 
            "Personalized Study Roadmaps"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "StudySpace AI Service",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
