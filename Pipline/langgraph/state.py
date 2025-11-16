"""
LangGraph State Management for Educational Roadmap System
"""
from typing import Dict, List, Optional, Any, TypedDict
from datetime import datetime
import json

"""
LangGraph State Management for Educational Roadmap System
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

# Use regular dict instead of TypedDict for flexibility
RoadmapState = Dict[str, Any]

def create_initial_state(
    learning_goal: str,
    subject: str,
    user_background: str = "beginner",
    hours_per_week: int = 10,
    deadline: Optional[str] = None
) -> RoadmapState:
    """Create initial state for roadmap generation"""
    return {
        # User Input & Context
        "learning_goal": learning_goal,
        "subject": subject,
        "user_background": user_background,
        "target_expertise": "intermediate",
        "hours_per_week": hours_per_week,
        "deadline": deadline,
        
        # Initialize empty collections
        "interview_questions": [],
        "interview_answers": [],
        "skill_evaluation": {},
        "knowledge_gaps": [],
        "prerequisites_needed": [],
        "prerequisite_graph": {},
        "learning_phases": [],
        "phase_difficulties": {},
        "difficulty_factors": [],
        "pes_materials": {},
        "reference_books": {},
        "video_content": {},
        "course_project": {},
        "learning_schedule": {},
        "generation_metadata": {},
        "validation_results": {},
        "pipeline_stats": {},
        "errors": [],
        "warnings": [],
        "current_phase": 0,
        "processing_step": "initialized",
        "completed_steps": []
    }
