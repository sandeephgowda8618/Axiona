from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import logging
import uuid
from datetime import datetime

from agents.roadmap_agent import RoadmapAgent
from agents.interview_agent import InterviewAgent
from agents.skill_evaluator_agent import SkillEvaluatorAgent
from agents.roadmap_builder_agent import RoadmapBuilderAgent
from agents.base_agent import AgentState
from config.database import db_manager

logger = logging.getLogger(__name__)
roadmap_router = APIRouter()

# Pydantic models for API
class RoadmapStartRequest(BaseModel):
    user_id: str
    query: Optional[str] = "Create a personalized learning roadmap"
    user_profile: Optional[Dict[str, Any]] = {}

class InterviewAnswerRequest(BaseModel):
    session_id: str
    user_id: str
    answers: List[Dict[str, str]]

class QuizAnswerRequest(BaseModel):
    session_id: str
    user_id: str
    quiz_answers: List[Dict[str, Any]]

# Global agent instances
roadmap_agent = RoadmapAgent()
interview_agent = InterviewAgent()
skill_evaluator = SkillEvaluatorAgent()
roadmap_builder = RoadmapBuilderAgent()

@roadmap_router.post("/start")
async def start_roadmap(request: RoadmapStartRequest) -> Dict[str, Any]:
    """Start a new roadmap generation process"""
    try:
        logger.info(f"Starting roadmap for user: {request.user_id}")
        
        # Generate unique session ID
        session_id = f"roadmap_{uuid.uuid4().hex[:8]}"
        
        # Create initial state
        state = AgentState(
            session_id=session_id,
            user_id=request.user_id,
            data={
                "user_profile": request.user_profile,
                "query": request.query
            }
        )
        
        # Run roadmap agent to initialize
        state = roadmap_agent.process(state)
        
        if state.data.get("status") == "failed":
            raise HTTPException(status_code=400, detail=state.data.get("error"))
        
        # Run interview agent to generate questions
        state = interview_agent.process(state)
        
        if state.data.get("status") == "failed":
            raise HTTPException(status_code=500, detail=state.data.get("error"))
        
        # Store session in database
        roadmap_sessions = db_manager.get_collection("roadmap_sessions")
        session_doc = {
            "_id": session_id,
            "user_id": request.user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "interview_pending",
            **state.data.get("roadmap", {})
        }
        
        roadmap_sessions.insert_one(session_doc)
        
        # Return interview questions
        interview_data = state.data.get("roadmap", {}).get("interview", {})
        
        response = {
            "session_id": session_id,
            "status": "interview_questions_ready",
            "questions": interview_data.get("questions", []),
            "message": "Please answer the following questions to personalize your roadmap"
        }
        
        logger.info(f"Roadmap started successfully: {session_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting roadmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to start roadmap generation")

@roadmap_router.post("/answer")
async def submit_interview_answers(request: InterviewAnswerRequest) -> Dict[str, Any]:
    """Submit answers to interview questions"""
    try:
        logger.info(f"Processing interview answers for session: {request.session_id}")
        
        # Get session from database
        roadmap_sessions = db_manager.get_collection("roadmap_sessions")
        session_doc = roadmap_sessions.find_one({"_id": request.session_id})
        
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session_doc.get("user_id") != request.user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Create state from session
        state = AgentState(
            session_id=request.session_id,
            user_id=request.user_id,
            data={"roadmap": session_doc}
        )
        
        # Process answers with interview agent
        state = interview_agent.process_answers(state, request.answers)
        
        if state.data.get("status") == "failed":
            raise HTTPException(status_code=500, detail=state.data.get("error"))
        
        # Run skill evaluator to generate quiz
        state = skill_evaluator.process(state)
        
        if state.data.get("status") == "failed":
            raise HTTPException(status_code=500, detail=state.data.get("error"))
        
        # Update session in database
        updated_roadmap = state.data.get("roadmap", {})
        roadmap_sessions.update_one(
            {"_id": request.session_id},
            {
                "$set": {
                    **updated_roadmap,
                    "updated_at": datetime.utcnow(),
                    "status": "skill_quiz_ready"
                }
            }
        )
        
        # Return skill evaluation quiz
        skill_eval = updated_roadmap.get("skill_evaluation", {})
        
        response = {
            "session_id": request.session_id,
            "status": "skill_quiz_ready",
            "quiz": {
                "quiz_id": skill_eval.get("baseline_quiz_id"),
                "questions": skill_eval.get("quiz_questions", [])
            },
            "message": "Please complete this quick assessment to evaluate your current skills"
        }
        
        logger.info(f"Interview answers processed successfully: {request.session_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing interview answers: {e}")
        raise HTTPException(status_code=500, detail="Failed to process answers")

@roadmap_router.post("/quiz")
async def submit_quiz_answers(request: QuizAnswerRequest) -> Dict[str, Any]:
    """Submit answers to skill evaluation quiz"""
    try:
        logger.info(f"Processing quiz answers for session: {request.session_id}")
        
        # Get session from database
        roadmap_sessions = db_manager.get_collection("roadmap_sessions")
        session_doc = roadmap_sessions.find_one({"_id": request.session_id})
        
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session_doc.get("user_id") != request.user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Create state from session
        state = AgentState(
            session_id=request.session_id,
            user_id=request.user_id,
            data={"roadmap": session_doc}
        )
        
        # Process quiz results
        state = skill_evaluator.process_quiz_results(state, request.quiz_answers)
        
        if state.data.get("status") == "failed":
            raise HTTPException(status_code=500, detail=state.data.get("error"))
        
        # Build roadmap with roadmap builder agent
        state = roadmap_builder.process(state)
        
        if state.data.get("status") == "failed":
            raise HTTPException(status_code=500, detail=state.data.get("error"))
        
        # Finalize roadmap
        state = roadmap_agent.finalize_roadmap(state)
        
        # Update session in database
        updated_roadmap = state.data.get("roadmap", {})
        roadmap_sessions.update_one(
            {"_id": request.session_id},
            {
                "$set": {
                    **updated_roadmap,
                    "updated_at": datetime.utcnow(),
                    "status": "completed"
                }
            }
        )
        
        response = {
            "session_id": request.session_id,
            "status": "completed",
            "message": "Your personalized roadmap has been generated!",
            "roadmap_url": f"/roadmap/final/{request.session_id}"
        }
        
        logger.info(f"Roadmap generation completed: {request.session_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing quiz answers: {e}")
        raise HTTPException(status_code=500, detail="Failed to process quiz")

@roadmap_router.get("/final/{session_id}")
async def get_final_roadmap(session_id: str) -> Dict[str, Any]:
    """Get the final generated roadmap"""
    try:
        logger.info(f"Retrieving final roadmap: {session_id}")
        
        roadmap_sessions = db_manager.get_collection("roadmap_sessions")
        session_doc = roadmap_sessions.find_one({"_id": session_id})
        
        if not session_doc:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        if session_doc.get("status") != "completed":
            raise HTTPException(status_code=400, detail="Roadmap not yet completed")
        
        # Format response
        phases = session_doc.get("phases", {})
        
        formatted_phases = {}
        for phase_key, phase_data in phases.items():
            formatted_phases[phase_key] = {
                "name": phase_data.get("name"),
                "duration_weeks": phase_data.get("duration_weeks"),
                "learning_objectives": phase_data.get("learning_objectives", []),
                "estimated_total_hours": phase_data.get("estimated_total_hours", 0),
                "materials": {
                    "pes_slides": phase_data.get("pes_materials", []),
                    "books": phase_data.get("book_chapters", []),
                    "videos": {
                        "playlists": phase_data.get("playlists", []),
                        "individual": phase_data.get("one_shot_videos", [])
                    },
                    "projects": phase_data.get("projects", [])
                },
                "assessments": phase_data.get("quizzes", [])
            }
        
        response = {
            "session_id": session_id,
            "user_id": session_doc.get("user_id"),
            "created_at": session_doc.get("created_at"),
            "status": "completed",
            "skill_evaluation": {
                "final_score": session_doc.get("skill_evaluation", {}).get("final_score"),
                "skill_breakdown": session_doc.get("skill_evaluation", {}).get("skill_breakdown", {})
            },
            "phases": formatted_phases,
            "total_estimated_hours": sum(
                phase.get("estimated_total_hours", 0) 
                for phase in phases.values()
            ),
            "estimated_completion_weeks": sum(
                phase.get("duration_weeks", 0) 
                for phase in phases.values()
            )
        }
        
        logger.info(f"Final roadmap retrieved successfully: {session_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving final roadmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve roadmap")

@roadmap_router.get("/progress/{session_id}")
async def get_roadmap_progress(session_id: str) -> Dict[str, Any]:
    """Get progress for a roadmap session"""
    try:
        roadmap_sessions = db_manager.get_collection("roadmap_sessions")
        session_doc = roadmap_sessions.find_one({"_id": session_id})
        
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        progress = session_doc.get("progress", {})
        
        response = {
            "session_id": session_id,
            "status": session_doc.get("status"),
            "progress": {
                "phase_status": progress.get("phase_status", {}),
                "percent_complete": progress.get("percent_complete", 0.0),
                "last_activity": progress.get("last_activity")
            },
            "current_phase": None  # Would determine current phase based on progress
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to get progress")
