"""
FastAPI Main Application
========================

Complete Multi-Agent RAG System with Ollama integration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from config.database import db_manager
from config.settings import Settings
from agents.multi_agent_system_complete import multi_agent_system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Request/Response Models
class SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    top_k: int = 10

class RoadmapStartRequest(BaseModel):
    user_id: str
    learning_goals: List[str]
    query: str

class RoadmapContinueRequest(BaseModel):
    response: str

# Create FastAPI application
app = FastAPI(
    title="Multi-Agent RAG System",
    description="Educational platform with Ollama LLM, MongoDB, and personalized roadmaps",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    try:
        logger.info("Starting Multi-Agent RAG System...")
        db_manager.connect()
        logger.info("System started successfully")
    except Exception as e:
        logger.error(f"Startup failed: {e}")

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Multi-Agent RAG System",
        "version": "2.0.0"
    }

# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@app.post("/api/search/pdf")
async def search_pdfs(request: SearchRequest):
    """Search through PES materials and PDFs"""
    try:
        result = await multi_agent_system.process_query(
            query=f"pdf: {request.query}",
            user_id="api_user"
        )
        
        return {
            "results": result.get("search_results", []),
            "total_count": len(result.get("search_results", [])),
            "query": request.query,
            "intent": "pdf_search",
            "response": result.get("response", "")
        }
        
    except Exception as e:
        logger.error(f"PDF search error: {e}")
        raise HTTPException(status_code=500, detail="PDF search failed")

@app.post("/api/search/books")
async def search_books(request: SearchRequest):
    """Search through reference books"""
    try:
        result = await multi_agent_system.process_query(
            query=f"book: {request.query}",
            user_id="api_user"
        )
        
        return {
            "results": result.get("search_results", []),
            "total_count": len(result.get("search_results", [])),
            "query": request.query,
            "intent": "book_search",
            "response": result.get("response", "")
        }
        
    except Exception as e:
        logger.error(f"Book search error: {e}")
        raise HTTPException(status_code=500, detail="Book search failed")

@app.post("/api/search/videos")
async def search_videos(request: SearchRequest):
    """Search through tutorial videos"""
    try:
        result = await multi_agent_system.process_query(
            query=f"video: {request.query}",
            user_id="api_user"
        )
        
        return {
            "results": result.get("search_results", []),
            "total_count": len(result.get("search_results", [])),
            "query": request.query,
            "intent": "video_search",
            "response": result.get("response", "")
        }
        
    except Exception as e:
        logger.error(f"Video search error: {e}")
        raise HTTPException(status_code=500, detail="Video search failed")

# ============================================================================
# ROADMAP ENDPOINTS
# ============================================================================

@app.post("/api/roadmap/start")
async def start_roadmap(request: RoadmapStartRequest):
    """Start a new personalized roadmap generation"""
    try:
        query = f"Create a learning roadmap for: {', '.join(request.learning_goals)}"
        
        result = await multi_agent_system.process_query(
            query=f"roadmap: {query}",
            user_id=request.user_id
        )
        
        session_id = result.get("session_id")
        if not session_id:
            raise HTTPException(status_code=500, detail="Failed to create roadmap session")
        
        return {
            "session_id": session_id,
            "first_question": result.get("response", "Let's create your personalized learning roadmap!"),
            "message": "Roadmap session started successfully"
        }
        
    except Exception as e:
        logger.error(f"Roadmap start error: {e}")
        raise HTTPException(status_code=500, detail="Failed to start roadmap")

@app.post("/api/roadmap/sessions/{session_id}/continue")
async def continue_roadmap_interview(session_id: str, request: RoadmapContinueRequest):
    """Continue the roadmap interview with user response"""
    try:
        result = await multi_agent_system.continue_roadmap_interview(
            session_id=session_id,
            user_response=request.response
        )
        
        return {
            "next_question": result.get("response") if not result.get("completed") else None,
            "completed": result.get("completed", False),
            "session_id": session_id,
            "message": "Interview continued successfully"
        }
        
    except Exception as e:
        logger.error(f"Interview continuation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to continue interview")

@app.get("/api/roadmap/sessions/{session_id}/finalize")
async def finalize_roadmap(session_id: str):
    """Complete roadmap generation and return final result"""
    try:
        result = await multi_agent_system.finalize_roadmap(session_id)
        
        roadmap = result.get("roadmap", {})
        phases = roadmap.get("phases", {})
        phase_count = len(phases)
        total_duration = roadmap.get("schedule", {}).get("total_duration_weeks", 0)
        
        summary = f"Generated a {phase_count}-phase learning roadmap with estimated duration of {total_duration} weeks."
        
        return {
            "roadmap": roadmap,
            "session_id": session_id,
            "summary": summary,
            "response": result.get("response", "")
        }
        
    except Exception as e:
        logger.error(f"Roadmap finalization error: {e}")
        raise HTTPException(status_code=500, detail="Failed to finalize roadmap")

@app.get("/api/system/status")
async def get_system_status():
    """Get system component status"""
    try:
        from core.ollama_service import ollama_service
        
        # Test Ollama
        try:
            await ollama_service.generate_response("test", "Reply with 'ok'")
            ollama_status = "running"
        except:
            ollama_status = "unavailable"
        
        # Get database stats
        db = multi_agent_system.db
        db_stats = {
            "materials": db[Settings.MATERIALS_COLLECTION].count_documents({}),
            "books": db[Settings.BOOKS_COLLECTION].count_documents({}),
            "videos": db[Settings.VIDEOS_COLLECTION].count_documents({}),
            "sessions": db[Settings.ROADMAPS_COLLECTION].count_documents({})
        }
        
        return {
            "database": "connected",
            "ollama": ollama_status,
            "vector_db": "active", 
            "collections": db_stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"System status error: {e}")
        return {
            "database": "error",
            "ollama": "unknown",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
