"""
Gap Detector Agent with LLM Integration - No Hardcoded Responses
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class GapDetectorAgent(BaseAgent):
    """Gap Detector with LLM-generated analysis"""
    
    def __init__(self):
        super().__init__("GapDetectorAgent", temperature=0.2, max_tokens=400)
    
    def get_system_prompt(self) -> str:
        return """You are the Concept Gap Detection Agent.

INPUT:
- learning_goal
- subject
- user skill profile

TASK:
- Detect missing fundamental concepts
- List actual knowledge gaps
- Suggest prerequisites required
- NO hallucination

OUTPUT (JSON only):
{
  "gaps": ["..."],
  "prerequisites_needed": ["..."],
  "num_gaps": 0
}"""

    async def detect_gaps(self, learning_goal: str, subject: str, skill_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Detect knowledge gaps using LLM"""
        try:
            skill_level = skill_profile.get("skill_level", "beginner")
            strengths = skill_profile.get("strengths", [])
            weaknesses = skill_profile.get("weaknesses", [])
            
            user_prompt = f"""Analyze the user's skill profile and detect knowledge gaps for learning {learning_goal}.

LEARNING GOAL: {learning_goal}
SUBJECT: {subject}

USER SKILL PROFILE:
- Current Level: {skill_level}
- Strengths: {', '.join(strengths)}
- Weaknesses: {', '.join(weaknesses)}

Based on this analysis, identify:
- gaps: Specific concept gaps that need to be addressed
- prerequisites_needed: Prerequisites that must be learned first
- num_gaps: Total number of gaps identified

Return ONLY JSON in the exact format specified."""
            
            # Get LLM response
            response = await ollama_service.generate_response(user_prompt, temperature=0.2)
            
            # Parse JSON response
            try:
                gap_data = json.loads(response)
                
                # Validate required fields
                required_fields = ["gaps", "prerequisites_needed", "num_gaps"]
                for field in required_fields:
                    if field not in gap_data:
                        raise ValueError(f"Missing required field: {field}")
                
                # Validate data types
                if not isinstance(gap_data["gaps"], list):
                    raise ValueError("gaps must be a list")
                if not isinstance(gap_data["prerequisites_needed"], list):
                    raise ValueError("prerequisites_needed must be a list")
                if not isinstance(gap_data["num_gaps"], int):
                    raise ValueError("num_gaps must be an integer")
                
                return gap_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from gap detector: {e}")
                logger.error(f"LLM Response: {response[:200]}...")
                raise ValueError("Gap detector must return valid JSON")
            
        except Exception as e:
            logger.error(f"Error detecting gaps: {e}")
            raise

    async def process(self, state: AgentState) -> AgentState:
        """Process gap detection"""
        try:
            self.log_action(state, "Starting gap detection with LLM")
            
            # Get required data
            roadmap = state.data.get("roadmap", {})
            learning_goal = roadmap.get("learning_goal", "Unknown")
            subject = roadmap.get("subject", "Unknown")
            skill_evaluation = roadmap.get("skill_evaluation", {})
            
            if not skill_evaluation:
                raise ValueError("Gap detector requires skill evaluation")
            
            # Detect gaps using LLM
            gap_analysis = await self.detect_gaps(learning_goal, subject, skill_evaluation)
            
            # Store results
            roadmap["gap_analysis"] = gap_analysis
            state.data["roadmap"] = roadmap
            state.data["next_agent"] = "PrerequisiteGraphAgent"
            
            num_gaps = gap_analysis.get("num_gaps", 0)
            self.log_action(state, f"Gap detection completed: {num_gaps} gaps identified")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in gap detection: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
