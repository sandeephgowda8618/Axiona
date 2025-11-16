"""
Standardized API Implementation
==============================

FastAPI implementation that uses the standardized agents and follows
the TODO specification for endpoint contracts and response formats.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
import logging
import asyncio
from datetime import datetime

from agents.standardized_agents import retrieval_agents, quiz_generator
from agents.interview_pipeline import interview_agent
from agents.roadmap_builder_standardized import roadmap_builder
from utils.json_utils import prepare_api_response, stringify_ids

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Standardized Educational RAG API",
    description="Standardized API for educational content retrieval, roadmaps, and quizzes",
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

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    k: int = Field(default=10, ge=1, le=50, description="Number of results to return")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Optional search filters")

class RoadmapRequest(BaseModel):
    goal: str = Field(..., description="Learning goal (e.g., 'learn Operating Systems')")
    course_name: Optional[str] = Field(default=None, description="Specific course name")
    course_code: Optional[str] = Field(default=None, description="Course code")
    time_per_week: Optional[int] = Field(default=8, description="Hours per week available")
    deadline: Optional[str] = Field(default=None, description="Target completion date (ISO format)")
    user_level: Optional[str] = Field(default="beginner", description="User's current level")
    total_hours: Optional[int] = Field(default=60, description="Total course duration in hours")

class QuizRequest(BaseModel):
    topic: str = Field(..., description="Quiz topic")
    n_questions: int = Field(default=10, ge=1, le=50, description="Number of questions")
    difficulty: str = Field(default="intermediate", description="Difficulty level")
    format: str = Field(default="mcq", description="Question format")

class StandardResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str

class InterviewRequest(BaseModel):
    learning_goal: str = Field(..., description="What the user wants to learn")
    subject_area: str = Field(..., description="Subject domain")
    num_questions: int = Field(default=5, ge=3, le=10, description="Number of interview questions")

class InterviewAnswersRequest(BaseModel):
    interview_id: str = Field(..., description="Interview session ID")
    answers: Dict[str, Any] = Field(..., description="User's answers to interview questions")

class EnhancedRoadmapRequest(BaseModel):
    learning_goal: str = Field(..., description="Learning goal")
    subject_area: str = Field(..., description="Subject domain")
    interview_answers: Optional[Dict[str, Any]] = Field(default=None, description="Pre-collected interview answers")
    user_constraints: Optional[Dict[str, Any]] = Field(default=None, description="Time and learning constraints")

# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@app.post("/api/search/pdf")
async def search_pdf(request: SearchRequest) -> Dict[str, Any]:
    """
    Search for PDF documents and PES materials
    Returns standardized search response envelope
    """
    try:
        logger.info(f"PDF search request: {request.query}")
        
        result = await retrieval_agents.pdf_search_agent(
            query=request.query,
            k=request.k
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"PDF search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search/book")
async def search_books(request: SearchRequest) -> Dict[str, Any]:
    """
    Search for reference books
    Returns standardized search response envelope
    """
    try:
        logger.info(f"Book search request: {request.query}")
        
        result = await retrieval_agents.book_search_agent(
            query=request.query,
            k=request.k
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Book search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search/video")
async def search_videos(request: SearchRequest) -> Dict[str, Any]:
    """
    Search for educational videos
    Returns standardized search response envelope
    """
    try:
        logger.info(f"Video search request: {request.query}")
        
        result = await retrieval_agents.video_search_agent(
            query=request.query,
            k=request.k
        )
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Video search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ROADMAP ENDPOINT
# ============================================================================

@app.post("/api/roadmap")
async def generate_roadmap(request: RoadmapRequest) -> Dict[str, Any]:
    """
    Generate a complete 4-phase learning roadmap
    Returns structured roadmap with embedded metadata objects
    """
    try:
        logger.info(f"Roadmap request: {request.goal}")
        
        # Extract course name from goal if not provided
        course_name = request.course_name or request.goal.replace("learn ", "").replace("study ", "")
        
        # Generate roadmap
        roadmap = await roadmap_builder.build_course_roadmap(
            course_name=course_name,
            course_code=request.course_code or "",
            subject=course_name,
            total_hours=request.total_hours or 60,
            user_level=request.user_level or "beginner"
        )
        
        return {
            "success": True,
            "data": roadmap,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Roadmap generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# QUIZ ENDPOINT
# ============================================================================

@app.post("/api/quiz/generate")
async def generate_quiz(request: QuizRequest) -> Dict[str, Any]:
    """
    Generate a quiz with source provenance
    Returns structured quiz JSON with metadata
    """
    try:
        logger.info(f"Quiz request: {request.topic}, {request.n_questions} questions")
        
        quiz = await quiz_generator.generate_quiz(
            topic=request.topic,
            n_questions=request.n_questions,
            difficulty=request.difficulty,
            format=request.format
        )
        
        return {
            "success": True,
            "data": quiz,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# INTERVIEW ENDPOINTS
# ============================================================================

@app.post("/api/interview/generate")
async def generate_interview(request: InterviewRequest) -> Dict[str, Any]:
    """
    Generate an interview simulation
    Returns structured interview JSON with questions
    """
    try:
        logger.info(f"Interview request: {request.learning_goal}, {request.num_questions} questions")
        
        interview = await interview_agent.generate_questions(
            learning_goal=request.learning_goal,
            subject_area=request.subject_area,
            num_questions=request.num_questions
        )
        
        return {
            "success": True,
            "data": interview,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Interview generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# INTERVIEW PIPELINE ENDPOINTS
# ============================================================================

@app.post("/api/interview/start", summary="Start interview for learning assessment")
async def start_interview(request: InterviewRequest):
    """Start a new interview session to assess user's current knowledge"""
    try:
        logger.info(f"Starting interview for: {request.learning_goal}")
        
        interview_data = await interview_agent.generate_questions(
            learning_goal=request.learning_goal,
            subject_area=request.subject_area,
            num_questions=request.num_questions
        )
        
        return {
            "status": "success",
            "data": interview_data,
            "message": f"Interview started with {len(interview_data.get('questions', []))} questions"
        }
        
    except Exception as e:
        logger.error(f"Interview start error: {e}")
        raise HTTPException(status_code=500, detail=f"Interview generation failed: {str(e)}")

@app.post("/api/interview/submit", summary="Submit interview answers")
async def submit_interview_answers(request: InterviewAnswersRequest):
    """Submit user answers to interview questions"""
    try:
        logger.info(f"Processing answers for interview: {request.interview_id}")
        
        result = await interview_agent.process_answers(
            interview_id=request.interview_id,
            answers=request.answers
        )
        
        return {
            "status": "success", 
            "data": result,
            "message": "Interview answers processed successfully"
        }
        
    except Exception as e:
        logger.error(f"Interview submission error: {e}")
        raise HTTPException(status_code=500, detail=f"Answer processing failed: {str(e)}")

@app.post("/api/roadmap/interview-driven", summary="Generate roadmap using interview pipeline")
async def create_interview_driven_roadmap(request: EnhancedRoadmapRequest):
    """
    Generate a complete learning roadmap using the full interview pipeline:
    Interview → Skills → Gaps → Prerequisites → Difficulty → Resources → Project → Schedule
    """
    try:
        logger.info(f"Creating interview-driven roadmap for: {request.learning_goal}")
        
        roadmap = await roadmap_builder.build_interview_driven_roadmap(
            learning_goal=request.learning_goal,
            subject_area=request.subject_area,
            interview_answers=request.interview_answers,
            user_constraints=request.user_constraints
        )
        
        return {
            "status": "success",
            "data": roadmap,
            "message": "Interview-driven roadmap generated successfully",
            "meta": {
                "pipeline_used": "interview_driven",
                "agents_count": len(roadmap.get("meta", {}).get("agents_used", [])),
                "total_phases": roadmap.get("analytics", {}).get("total_phases", 0),
                "estimated_hours": roadmap.get("analytics", {}).get("total_estimated_hours", 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Interview-driven roadmap error: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "components": {
            "retrieval_agents": "active",
            "roadmap_builder": "active", 
            "quiz_generator": "active",
            "interview_agent": "active"
        }
    }

@app.get("/api/info")
async def api_info() -> Dict[str, Any]:
    """API information and available endpoints"""
    return {
        "title": "Standardized Educational RAG API",
        "version": "1.0.0",
        "description": "API following TODO standardization specification",
        "endpoints": {
            "search": {
                "pdf": "/api/search/pdf",
                "book": "/api/search/book", 
                "video": "/api/search/video"
            },
            "generation": {
                "roadmap": "/api/roadmap",
                "quiz": "/api/quiz/generate",
                "interview": "/api/interview/generate"
            },
            "utility": {
                "health": "/api/health",
                "info": "/api/info"
            }
        },
        "schemas": {
            "standardized_metadata": "Follows TODO specification",
            "search_envelope": "Consistent response format",
            "roadmap_structure": "4-phase with embedded metadata"
        },
        "timestamp": datetime.now().isoformat()
    }

# ============================================================================
# STARTUP EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting Standardized Educational RAG API")
    logger.info("✅ Retrieval agents initialized")
    logger.info("✅ Roadmap builder initialized") 
    logger.info("✅ Quiz generator initialized")
    logger.info("✅ Interview agent initialized")
    logger.info("🎯 API ready for requests")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("📝 Standardized Educational RAG API shutting down")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "standardized_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
