"""
RAG-powered chat router for StudySpace AI platform.
Handles chat queries using the RAG pipeline.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import logging
import os
from pathlib import Path

from ..services.rag_pipeline import RAGPipeline
from ..services.document_manager import DocumentManager
from ..services.config import RAGConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG Chat"])

# Initialize RAG components
rag_config = RAGConfig()
document_manager = DocumentManager()
rag_pipeline = RAGPipeline(rag_config, document_manager)

# Build pipeline on startup
retriever, doc_chain = rag_pipeline.build_pipeline()

class ChatQuery(BaseModel):
    question: str
    user_id: Optional[str] = None
    context_type: Optional[str] = "general"  # general, quiz, summary, roadmap

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None
    context_type: str

class DocumentUploadResponse(BaseModel):
    document_id: str
    title: str
    status: str
    message: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(query: ChatQuery):
    """
    Chat with the RAG system using uploaded course materials.
    """
    try:
        # Check if pipeline is ready
        if not retriever or not doc_chain:
            raise HTTPException(
                status_code=503,
                detail="RAG pipeline not ready. Please ensure documents are uploaded and indexed."
            )
        
        # Process the query through RAG pipeline
        answer = rag_pipeline.query(query.question)
        
        if not answer:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate response. Please try again."
            )
        
        return ChatResponse(
            answer=answer,
            context_type=query.context_type,
            sources=[]  # TODO: Extract sources from retriever
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing chat query"
        )

@router.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    """
    Upload a document to be indexed by the RAG system.
    """
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.txt', '.md', '.py', '.js', '.html', '.css'}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_extension} not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Create temporary file path
        temp_dir = Path("./temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        temp_file_path = temp_dir / file.filename
        
        # Save uploaded file temporarily
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Upload to document manager
        doc_id = document_manager.upload_document(
            str(temp_file_path),
            title=title or file.filename,
            user_id=user_id
        )
        
        # Clean up temp file
        temp_file_path.unlink()
        
        if not doc_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload document"
            )
        
        # Rebuild RAG pipeline to include new document
        global retriever, doc_chain
        retriever, doc_chain = rag_pipeline.build_pipeline()
        
        return DocumentUploadResponse(
            document_id=doc_id,
            title=title or file.filename,
            status="uploaded",
            message="Document uploaded and indexed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload document"
        )

@router.get("/documents")
async def list_documents(user_id: Optional[str] = None):
    """
    List all uploaded documents, optionally filtered by user.
    """
    try:
        documents = document_manager.list_documents(user_id=user_id)
        return {
            "documents": documents,
            "total": len(documents)
        }
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve documents"
        )

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document from the system.
    """
    try:
        success = document_manager.delete_document(document_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )
        
        # Rebuild RAG pipeline after document deletion
        global retriever, doc_chain
        retriever, doc_chain = rag_pipeline.build_pipeline()
        
        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document"
        )

@router.get("/status")
async def get_rag_status():
    """
    Get the current status of the RAG pipeline.
    """
    try:
        status = rag_pipeline.get_pipeline_status()
        return {
            "status": "operational" if all([
                status["embeddings_loaded"],
                status["retriever_ready"],
                status["document_chain_ready"]
            ]) else "initializing",
            "details": status
        }
    except Exception as e:
        logger.error(f"Error getting RAG status: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get system status"
        )

@router.post("/generate-quiz")
async def generate_quiz(query: ChatQuery):
    """
    Generate quiz questions based on course materials.
    """
    try:
        if not retriever or not doc_chain:
            raise HTTPException(
                status_code=503,
                detail="RAG pipeline not ready"
            )
        
        # Modify the question to focus on quiz generation
        quiz_prompt = f"""Based on the course materials provided, generate 5 multiple-choice questions about: {query.question}

        For each question, provide:
        1. The question text
        2. Four answer options (A, B, C, D)
        3. The correct answer
        4. A brief explanation

        Format the output as a structured quiz."""
        
        quiz_content = rag_pipeline.query(quiz_prompt)
        
        if not quiz_content:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate quiz"
            )
        
        return {
            "quiz_content": quiz_content,
            "topic": query.question,
            "type": "multiple_choice"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate quiz"
        )

@router.post("/generate-summary")
async def generate_summary(query: ChatQuery):
    """
    Generate a summary of course materials on a specific topic.
    """
    try:
        if not retriever or not doc_chain:
            raise HTTPException(
                status_code=503,
                detail="RAG pipeline not ready"
            )
        
        # Modify the question to focus on summarization
        summary_prompt = f"""Provide a comprehensive summary of the course materials related to: {query.question}

        Include:
        1. Key concepts and definitions
        2. Main points and principles
        3. Important examples or case studies
        4. Practical applications

        Structure the summary with clear headings and bullet points for easy study."""
        
        summary_content = rag_pipeline.query(summary_prompt)
        
        if not summary_content:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate summary"
            )
        
        return {
            "summary": summary_content,
            "topic": query.question,
            "type": "study_summary"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate summary"
        )
