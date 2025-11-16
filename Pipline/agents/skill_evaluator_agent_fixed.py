"""
Fixed Skill Evaluator Agent with Robust JSON Parsing
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any
import json
import logging
import re

logger = logging.getLogger(__name__)

class SkillEvaluatorAgent(BaseAgent):
    """Fixed Skill Evaluator with robust JSON parsing"""
    
    def __init__(self):
        super().__init__("SkillEvaluatorAgent", temperature=0.2, max_tokens=300)
    
    def get_system_prompt(self) -> str:
        return """You are the Skill Evaluation Agent.  
Input: JSON answers from Interview Agent.  
Output: A JSON object describing the user's skill profile.

TASKS:
- Analyze answers
- Determine skill_level (beginner | intermediate | advanced)
- List strengths and weaknesses
- Identify potential learning risks
- NO hallucination

RETURN ONLY JSON with:
{
  "skill_level": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "analysis_notes": ["..."]
}"""

    def extract_json(self, text: str) -> str:
        """Extract JSON from LLM response that might have markdown or extra text"""
        # Remove markdown code fences
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        
        # Find JSON object
        json_start = text.find('{')
        json_end = text.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            return text[json_start:json_end]
        return text

    async def evaluate_skills(self, interview_answers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluate user skills from interview answers"""
        try:
            # Build prompt with answers
            answers_text = ""
            for answer in interview_answers:
                qid = answer.get("question_id", "")
                question = answer.get("question_text", "")
                response = answer.get("answer", "")
                answers_text += f"Q{qid}: {question}\nA: {response}\n\n"
            
            user_prompt = f"""Analyze these interview answers and return a JSON skill evaluation:

{answers_text}

Based on the answers, determine:
- skill_level: "beginner", "intermediate", or "advanced"
- strengths: array of specific strengths identified
- weaknesses: array of specific weaknesses/gaps identified  
- analysis_notes: array of analytical observations

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON.
- Do NOT add markdown fences like ```json or ```.
- Do NOT add introduction text.
- Do NOT add explanation after JSON.
- Output must begin with "{{" and end with "}}".
- If content is missing, return empty arrays.

Required JSON format:
{{
  "skill_level": "beginner",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "analysis_notes": ["note1", "note2"]
}}"""
            
            # Get LLM response
            response = await ollama_service.generate_response(user_prompt, temperature=0.2)
            
            # Parse JSON response with robust extraction
            try:
                clean_response = self.extract_json(response)
                skill_data = json.loads(clean_response)
                
                # Validate required fields
                required_fields = ["skill_level", "strengths", "weaknesses", "analysis_notes"]
                for field in required_fields:
                    if field not in skill_data:
                        raise ValueError(f"Missing required field: {field}")
                
                # Validate skill_level
                valid_levels = ["beginner", "intermediate", "advanced"]
                if skill_data["skill_level"] not in valid_levels:
                    raise ValueError(f"Invalid skill_level: {skill_data['skill_level']}")
                
                return skill_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from skill evaluator: {e}")
                logger.error(f"LLM Response: {response[:500]}...")
                # Try to parse with fallback
                return {
                    "skill_level": "beginner",
                    "strengths": [],
                    "weaknesses": ["Unable to parse LLM response"],
                    "analysis_notes": ["JSON parsing failed"]
                }
            
        except Exception as e:
            logger.error(f"Error evaluating skills: {e}")
            return {
                "skill_level": "beginner",
                "strengths": [],
                "weaknesses": ["Skill evaluation failed"],
                "analysis_notes": [f"Error: {str(e)}"]
            }

    async def process(self, state: AgentState) -> AgentState:
        """Process skill evaluation"""
        try:
            self.log_action(state, "Starting skill evaluation with production prompt")
            
            # Get interview answers
            roadmap = state.data.get("roadmap", {})
            interview_answers = roadmap.get("interview_answers", [])
            
            if not interview_answers:
                logger.error("No interview answers found - interview agent must provide answers")
                raise ValueError("Cannot evaluate skills without interview answers")
            
            # Evaluate skills
            skill_evaluation = await self.evaluate_skills(interview_answers)
            
            # Store results
            roadmap["skill_evaluation"] = skill_evaluation
            state.data["roadmap"] = roadmap
            
            self.log_action(state, f"Skill evaluation completed: {skill_evaluation.get('skill_level', 'unknown')} level")
            
        except Exception as e:
            logger.error(f"Error in skill evaluation: {e}")
            # Store error result
            roadmap = state.data.get("roadmap", {})
            roadmap["skill_evaluation"] = {
                "skill_level": "beginner",
                "strengths": [],
                "weaknesses": ["Evaluation failed"],
                "analysis_notes": [f"Error: {str(e)}"]
            }
            state.data["roadmap"] = roadmap
            raise
        
        return state
