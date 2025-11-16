"""
Updated Interview Agent with Production-Ready Prompt
"""

from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from utils.json_response_utils import parse_llm_json_response
from typing import List, Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

class InterviewAgent(BaseAgent):
    """Updated Interview Agent with finalized production prompt"""
    
    def __init__(self):
        super().__init__("InterviewAgent", temperature=0.2, max_tokens=300)
    
    def get_system_prompt(self) -> str:
        return """You are the Interview Agent for an educational roadmap system.  
Your task is to generate exactly 5 interview questions in pure JSON.

PURPOSE:
- Determine the user's background knowledge
- Detect missing prerequisites
- Understand learning preferences
- Capture time availability
- Establish difficulty alignment

REQUIREMENTS:
- Return ONLY a JSON array named "questions"
- Include: question_id, question_text, question_type, category, required, context
- No explanations, no natural language outside JSON

OUTPUT FORMAT:
{
  "questions": [
    {
      "question_id": "q1",
      "question_text": "...",
      "question_type": "open_ended",
      "category": "current_knowledge",
      "required": true,
      "context": "Purpose of question"
    }
  ]
}

Return ONLY valid JSON."""
    
    async def generate_interview_questions(self, subject: str) -> List[Dict[str, Any]]:
        """Generate interview questions using finalized prompt"""
        try:
            # Build prompt with subject injection
            user_prompt = f"""Generate exactly 5 interview questions for a student wanting to learn {subject}. 
Return ONLY JSON in this EXACT format - do not change field names:

{{
  "questions": [
    {{
      "question_id": "q1",
      "question_text": "What is your current level of experience with {subject}?",
      "question_type": "open_ended",
      "category": "current_knowledge",
      "required": true,
      "context": "Assess baseline knowledge"
    }},
    {{
      "question_id": "q2", 
      "question_text": "How many hours per week can you dedicate to studying?",
      "question_type": "numeric",
      "category": "time_availability", 
      "required": true,
      "context": "Determine time constraints"
    }},
    {{
      "question_id": "q3",
      "question_text": "What specific goals do you want to achieve?",
      "question_type": "open_ended",
      "category": "learning_goals",
      "required": true, 
      "context": "Understand motivation"
    }},
    {{
      "question_id": "q4",
      "question_text": "What technical background do you have?",
      "question_type": "multiple_choice",
      "category": "prerequisites",
      "required": false,
      "context": "Assess prerequisites"
    }},
    {{
      "question_id": "q5", 
      "question_text": "Do you prefer hands-on or theoretical learning?",
      "question_type": "single_choice",
      "category": "learning_preference",
      "required": false,
      "context": "Tailor methodology"
    }}
  ]
}}

Use this exact structure. Customize the question_text for {subject} but keep all other fields exactly as shown."""
            
            # Get LLM response with system prompt
            from core.ollama_service import ollama_service
            response = await ollama_service.generate_response(user_prompt, temperature=0.2)
            
            # Parse and validate JSON response
            interview_data = parse_llm_json_response(response, "InterviewAgent")
            questions = interview_data.get("questions", [])
            
            if not questions or len(questions) != 5:
                logger.warning(f"Expected 5 questions, got {len(questions)}, raising error")
                raise ValueError(f"LLM must return exactly 5 questions, got {len(questions)}")
                
            return questions
            
        except Exception as e:
            logger.error(f"Error generating interview questions: {e}")
            raise
    
    # Remove fallback questions - force LLM to work properly or fail
    # def _generate_fallback_questions(...) - REMOVED

    async def process(self, state: AgentState) -> AgentState:
        """Generate interview questions using finalized prompt"""
        try:
            self.log_action(state, "Starting user interview with production prompt")
            
            # Get context
            roadmap = state.data.get("roadmap", {})
            user_profile = state.data.get("user_profile", {})
            subject = roadmap.get("subject", "the subject")
            
            # Generate questions
            questions = await self.generate_interview_questions(subject)
            
            # Store in roadmap
            interview_data = {
                "questions": questions,
                "answers": [],
                "skill_self_report": {},
                "completed": False,
                "subject": subject
            }
            
            roadmap["interview"] = interview_data
            state.data["roadmap"] = roadmap
            state.data["status"] = "interview_questions_ready"
            state.data["next_agent"] = "InterviewAgent"
            
            self.log_action(state, f"Generated {len(questions)} interview questions for {subject}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in interview process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
