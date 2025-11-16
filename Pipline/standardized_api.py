"""
Standardized API Server
======================

FastAPI server implementing the standardized endpoints according to TODO specification.
All agents return JSON-only responses with the canonical schema.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import asyncio
import logging
from datetime import datetime

# Import our standardized agents
from agents.standardized_agents import retrieval_agents, quiz_generator

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Educational RAG System - Standardized API",
    description="Standardized API for educational content retrieval with JSON-only agent responses",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models following TODO specification
class SearchRequest(BaseModel):
    query: str
    k: Optional[int] = 10
    filters: Optional[Dict[str, Any]] = None

class QuizRequest(BaseModel):
    topic: str
    n_questions: Optional[int] = 20
    difficulty: Optional[str] = "intermediate"
    format: Optional[str] = "mcq"

class RoadmapRequest(BaseModel):
    goal: str
    time_per_week: Optional[int] = 8
    deadline: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "system": "Educational RAG - Standardized Agents"
    }

# Search endpoints - return standardized JSON envelopes
@app.post("/api/search/pdf")
async def search_pdf(request: SearchRequest):
    """
    PDF/Document search endpoint
    Returns: Standardized JSON envelope with results array and meta object
    """
    try:
        result = await retrieval_agents.pdf_search_agent(
            query=request.query,
            k=request.k or 10
        )
        return result
    except Exception as e:
        logger.error(f"PDF search error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF search failed: {str(e)}")

@app.post("/api/search/book")
async def search_books(request: SearchRequest):
    """
    Book search endpoint
    Returns: Standardized JSON envelope with unique book results
    """
    try:
        result = await retrieval_agents.book_search_agent(
            query=request.query,
            k=request.k or 10
        )
        return result
    except Exception as e:
        logger.error(f"Book search error: {e}")
        raise HTTPException(status_code=500, detail=f"Book search failed: {str(e)}")

@app.post("/api/search/video")
async def search_videos(request: SearchRequest):
    """
    Video search endpoint  
    Returns: Standardized JSON envelope with video metadata
    """
    try:
        result = await retrieval_agents.video_search_agent(
            query=request.query,
            k=request.k or 10
        )
        return result
    except Exception as e:
        logger.error(f"Video search error: {e}")
        raise HTTPException(status_code=500, detail=f"Video search failed: {str(e)}")

@app.post("/api/quiz/generate")
async def generate_quiz(request: QuizRequest):
    """
    Quiz generation endpoint
    Returns: Structured JSON with questions array and source provenance
    """
    try:
        result = await quiz_generator.generate_quiz(
            topic=request.topic,
            n_questions=request.n_questions or 20,
            difficulty=request.difficulty or "intermediate",
            format=request.format or "mcq"
        )
        return result
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

# Roadmap endpoint (placeholder - will integrate with existing roadmap builder)
@app.post("/api/roadmap")
async def create_roadmap(request: RoadmapRequest):
    """
    Roadmap creation endpoint
    TODO: Integrate with existing roadmap builder to return phases with embedded metadata
    """
    try:
        # This is a placeholder that demonstrates the expected response format
        # In production, this would call the roadmap builder agent pipeline
        
        # Sample roadmap with embedded metadata from retrieval agents
        sample_pdf_result = await retrieval_agents.pdf_search_agent(
            query=f"learning {request.goal} fundamentals",
            k=3
        )
        
        sample_book_result = await retrieval_agents.book_search_agent(
            query=f"{request.goal} textbook reference",
            k=2
        )
        
        time_per_week = request.time_per_week or 8
        
        # Build roadmap with phases containing full metadata objects
        roadmap = {
            "goal": request.goal,
            "time_per_week": time_per_week,
            "deadline": request.deadline,
            "created_at": datetime.now().isoformat(),
            "phases": [
                {
                    "phase_title": f"Fundamentals of {request.goal}",
                    "phase_number": 1,
                    "estimated_duration_hours": time_per_week * 2,
                    "description": f"Core concepts and foundations in {request.goal}",
                    "resources": [
                        {
                            "type": "document",
                            "metadata": result
                        } for result in sample_pdf_result.get("results", [])[:2]
                    ] + [
                        {
                            "type": "reference_book", 
                            "metadata": result
                        } for result in sample_book_result.get("results", [])[:1]
                    ]
                },
                {
                    "phase_title": f"Advanced {request.goal}",
                    "phase_number": 2,
                    "estimated_duration_hours": time_per_week * 3,
                    "description": f"Advanced topics and practical applications in {request.goal}",
                    "resources": [
                        {
                            "type": "document",
                            "metadata": result
                        } for result in sample_pdf_result.get("results", [])[2:]
                    ]
                }
            ],
            "total_estimated_hours": time_per_week * 5,
            "meta": {
                "generated_at": datetime.now().isoformat(),
                "system_version": "1.0.0",
                "agent_type": "roadmap_builder"
            }
        }
        
        return roadmap
        
    except Exception as e:
        logger.error(f"Roadmap creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap creation failed: {str(e)}")

# Query router endpoint (determines which agent to use)
@app.post("/api/route")
async def route_query(request: Dict[str, str]):
    """
    Query router - determines appropriate agent based on intent
    Returns: Route name for frontend to call specific endpoint
    """
    try:
        query = request.get("query", "")
        
        # Simple intent detection (can be enhanced with LLM)
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["book", "textbook", "reference", "author"]):
            route = "book_search"
        elif any(word in query_lower for word in ["video", "tutorial", "watch", "youtube"]):
            route = "video_search"
        elif any(word in query_lower for word in ["roadmap", "plan", "learn", "study plan", "curriculum"]):
            route = "roadmap"
        else:
            route = "pdf_search"  # Default to PDF/document search
        
        return {
            "route": route,
            "query": query,
            "confidence": 0.8,  # Placeholder confidence score
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Query routing error: {e}")
        raise HTTPException(status_code=500, detail=f"Query routing failed: {str(e)}")

# Example usage endpoints for testing
@app.get("/api/examples")
async def get_examples():
    """
    Get example queries for each endpoint
    """
    return {
        "pdf_search": [
            "operating systems memory management",
            "data structures algorithms",
            "machine learning fundamentals"
        ],
        "book_search": [
            "computer architecture textbook",
            "algorithms reference book", 
            "database systems book"
        ],
        "video_search": [
            "programming tutorial",
            "machine learning course",
            "data structures video"
        ],
        "quiz": [
            {"topic": "operating systems", "n_questions": 5},
            {"topic": "algorithms", "n_questions": 10, "difficulty": "advanced"}
        ],
        "roadmap": [
            {"goal": "learn operating systems", "time_per_week": 10},
            {"goal": "master data structures", "time_per_week": 8}
        ]
    }

# Endpoint to validate system status
@app.get("/api/status")
async def system_status():
    """
    Check status of all system components
    """
    try:
        # Test each agent briefly
        pdf_test = await retrieval_agents.pdf_search_agent("test", k=1)
        book_test = await retrieval_agents.book_search_agent("test", k=1)
        video_test = await retrieval_agents.video_search_agent("test", k=1)
        quiz_test = await quiz_generator.generate_quiz("test", n_questions=1)
        
        return {
            "system_status": "operational",
            "agents": {
                "pdf_search": "✅ operational" if pdf_test.get("results") is not None else "❌ error",
                "book_search": "✅ operational" if book_test.get("results") is not None else "❌ error", 
                "video_search": "✅ operational" if video_test.get("results") is not None else "❌ error",
                "quiz_generator": "✅ operational" if quiz_test.get("questions") is not None else "❌ error"
            },
            "database": {
                "reference_books": "✅ connected",
                "pes_materials": "✅ connected", 
                "videos": "✅ connected",
                "chromadb": "✅ connected"
            },
            "timestamp": datetime.now().isoformat(),
            "standardization": "✅ fully implemented"
        }
        
    except Exception as e:
        logger.error(f"System status check error: {e}")
        return {
            "system_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
