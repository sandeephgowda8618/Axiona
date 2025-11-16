"""
Difficulty Estimator Agent with LLM Integration - No Hardcoded Responses
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class DifficultyEstimatorAgent(BaseAgent):
    """Difficulty Estimator with LLM-generated assessments"""
    
    def __init__(self):
        super().__init__("DifficultyEstimatorAgent", temperature=0.1, max_tokens=300)
    
    def get_system_prompt(self) -> str:
        return """You are the Difficulty Estimator Agent.

INPUT:
- concept graph
- gaps
- user skill profile

TASK:
- Estimate difficulty for each phase
- Only "beginner", "intermediate", "advanced"

OUTPUT JSON:
{
  "phase_difficulties": {
    "1": "beginner",
    "2": "intermediate",
    "3": "intermediate",
    "4": "advanced"
  },
  "adaptive_factors": ["..."]
}"""

    async def estimate_difficulties(self, skill_profile: Dict[str, Any], graph_data: Dict[str, Any], gaps: List[str]) -> Dict[str, Any]:
        """Estimate phase difficulties using LLM"""
        try:
            skill_level = skill_profile.get("skill_level", "beginner")
            learning_phases = graph_data.get("learning_phases", [])
            
            # Build phase descriptions for analysis
            phase_descriptions = ""
            for phase in learning_phases:
                phase_id = phase.get("phase_id", 0)
                concepts = phase.get("concepts", [])
                phase_descriptions += f"Phase {phase_id}: {', '.join(concepts)}\n"
            
            user_prompt = f"""Estimate the difficulty level for each of the 4 learning phases based on user skill profile.

USER SKILL LEVEL: {skill_level}
IDENTIFIED GAPS: {', '.join(gaps) if gaps else 'None'}

LEARNING PHASES:
{phase_descriptions}

For each phase (1-4), determine difficulty level:
- "beginner": Basic concepts, introductory material
- "intermediate": Requires some background, moderate complexity  
- "advanced": Complex concepts, significant prerequisites

Also identify adaptive_factors that influenced your difficulty assessment.

Return ONLY JSON in the exact format specified."""
            
            # Get LLM response
            response = await ollama_service.generate_response(user_prompt, temperature=0.1)
            
            # Parse JSON response
            try:
                difficulty_data = json.loads(response)
                
                # Validate required fields
                required_fields = ["phase_difficulties", "adaptive_factors"]
                for field in required_fields:
                    if field not in difficulty_data:
                        raise ValueError(f"Missing required field: {field}")
                
                # Validate phase_difficulties structure
                phase_diffs = difficulty_data["phase_difficulties"]
                valid_levels = ["beginner", "intermediate", "advanced"]
                
                for i in range(1, 5):  # Phases 1-4
                    phase_key = str(i)
                    if phase_key not in phase_diffs:
                        raise ValueError(f"Missing difficulty for phase {i}")
                    if phase_diffs[phase_key] not in valid_levels:
                        raise ValueError(f"Invalid difficulty for phase {i}: {phase_diffs[phase_key]}")
                
                # Validate adaptive_factors
                if not isinstance(difficulty_data["adaptive_factors"], list):
                    raise ValueError("adaptive_factors must be a list")
                
                return difficulty_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from difficulty estimator: {e}")
                logger.error(f"LLM Response: {response[:200]}...")
                raise ValueError("Difficulty estimator must return valid JSON")
            
        except Exception as e:
            logger.error(f"Error estimating difficulties: {e}")
            raise

    async def process(self, state: AgentState) -> AgentState:
        """Process difficulty estimation"""
        try:
            self.log_action(state, "Starting difficulty estimation with LLM")
            
            # Get required data
            roadmap = state.data.get("roadmap", {})
            skill_evaluation = roadmap.get("skill_evaluation", {})
            prerequisite_graph = roadmap.get("prerequisite_graph", {})
            gap_analysis = roadmap.get("gap_analysis", {})
            gaps = gap_analysis.get("gaps", [])
            
            if not skill_evaluation:
                raise ValueError("Difficulty estimator requires skill evaluation")
            if not prerequisite_graph:
                raise ValueError("Difficulty estimator requires prerequisite graph")
            
            # Estimate difficulties using LLM
            difficulty_data = await self.estimate_difficulties(skill_evaluation, prerequisite_graph, gaps)
            
            # Store results
            roadmap["difficulty_estimation"] = difficulty_data
            state.data["roadmap"] = roadmap
            state.data["next_agent"] = "PESMaterialAgent"
            
            phase_diffs = difficulty_data.get("phase_difficulties", {})
            difficulty_summary = ", ".join([f"P{k}:{v}" for k, v in phase_diffs.items()])
            self.log_action(state, f"Difficulty estimation completed: {difficulty_summary}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in difficulty estimation: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
