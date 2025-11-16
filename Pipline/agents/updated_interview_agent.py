from agents.base_agent import BaseAgent, AgentState
from core.ollama_service import ollama_service
from typing import List, Dict, Any
import json

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
      "question_text": "What is your current level of experience with [SUBJECT]?",
      "question_type": "open_ended",
      "category": "current_knowledge",
      "required": true,
      "context": "Assess baseline knowledge"
    },
    {
      "question_id": "q2", 
      "question_text": "How many hours per week can you dedicate to studying?",
      "question_type": "numeric",
      "category": "time_availability",
      "required": true,
      "context": "Determine time constraints for roadmap planning"
    },
    {
      "question_id": "q3",
      "question_text": "What specific goals do you want to achieve by learning [SUBJECT]?",
      "question_type": "open_ended", 
      "category": "learning_goals",
      "required": true,
      "context": "Understand motivation and target outcomes"
    },
    {
      "question_id": "q4",
      "question_text": "What programming languages or technical tools are you familiar with?",
      "question_type": "multiple_choice",
      "category": "prerequisites",
      "required": false,
      "context": "Assess technical prerequisites"
    },
    {
      "question_id": "q5",
      "question_text": "Do you prefer hands-on projects, theoretical study, or a balanced approach?",
      "question_type": "single_choice",
      "category": "learning_preference",
      "required": false,
      "context": "Tailor teaching methodology"
    }
  ]
}

Return ONLY valid JSON."""
    
    async def process(self, state: AgentState) -> AgentState:
        """Generate interview questions using finalized prompt"""
        try:
            self.log_action(state, "Starting user interview with finalized prompt")
            
            # Get context
            roadmap = state.data.get("roadmap", {})
            user_profile = state.data.get("user_profile", {})
            subject = roadmap.get("subject", "the subject")
            
            # Build prompt with subject injection
            prompt = f"Generate 5 interview questions for a student wanting to learn {subject}. Focus on their background, time availability, goals, prerequisites, and learning preferences."
            
            # Get LLM response
            response = await ollama_service.generate_response(prompt, temperature=0.2)
            
            # Parse JSON response
            try:
                interview_data = json.loads(response)
                questions = interview_data.get("questions", [])
                
                if not questions or len(questions) != 5:
                    raise ValueError(f"Expected 5 questions, got {len(questions)}")
                    
            except json.JSONDecodeError as e:
                self.logger.error(f"Invalid JSON from interview agent: {e}")
                # Fallback questions
                questions = self._generate_fallback_questions(subject)
            
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
            self.logger.error(f"Error in interview process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
    def _generate_fallback_questions(self, subject: str) -> List[Dict[str, Any]]:
        """Fallback questions if LLM fails"""
        return [
            {
                "question_id": "q1",
                "question_text": f"What is your current level of experience with {subject}?",
                "question_type": "open_ended",
                "category": "current_knowledge", 
                "required": True,
                "context": "Assess baseline knowledge"
            },
            {
                "question_id": "q2",
                "question_text": "How many hours per week can you dedicate to studying?",
                "question_type": "numeric",
                "category": "time_availability",
                "required": True,
                "context": "Determine time constraints"
            },
            {
                "question_id": "q3", 
                "question_text": f"What specific goals do you want to achieve by learning {subject}?",
                "question_type": "open_ended",
                "category": "learning_goals",
                "required": True,
                "context": "Understand motivation"
            },
            {
                "question_id": "q4",
                "question_text": "What programming languages or technical tools are you familiar with?",
                "question_type": "multiple_choice",
                "category": "prerequisites",
                "required": False,
                "context": "Assess technical prerequisites"
            },
            {
                "question_id": "q5",
                "question_text": "Do you prefer hands-on projects, theoretical study, or a balanced approach?",
                "question_type": "single_choice", 
                "category": "learning_preference",
                "required": False,
                "context": "Tailor teaching methodology"
            }
        ]
    
    def process_answers(self, state: AgentState, user_answers: List[Dict[str, str]]) -> AgentState:
        """Process user answers to interview questions"""
        try:
            self.log_action(state, "Processing interview answers")
            
            roadmap = state.data.get("roadmap", {})
            interview = roadmap.get("interview", {})
            
            # Store answers
            interview["answers"] = user_answers
            interview["completed"] = True
            
            # Extract skill self-report from answers  
            skill_report = self._extract_skill_levels(user_answers)
            interview["skill_self_report"] = skill_report
            
            roadmap["interview"] = interview
            state.data["roadmap"] = roadmap
            state.data["status"] = "interview_completed"
            state.data["next_agent"] = "SkillEvaluatorAgent"
            
            self.log_action(state, "Interview answers processed")
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error processing answers: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
    def _extract_skill_levels(self, answers: List[Dict[str, str]]) -> Dict[str, Any]:
        """Extract skill levels from user responses"""
        skill_report = {
            "experience_level": "beginner",
            "time_availability": 5,  # hours per week
            "learning_goals": [],
            "prerequisites": [],
            "learning_preference": "balanced"
        }
        
        for answer in answers:
            qid = answer.get("question_id", "")
            response = answer.get("answer", "").lower()
            
            if qid == "q1":  # Experience level
                if "advanced" in response or "expert" in response:
                    skill_report["experience_level"] = "advanced"
                elif "intermediate" in response or "some" in response:
                    skill_report["experience_level"] = "intermediate" 
                else:
                    skill_report["experience_level"] = "beginner"
                    
            elif qid == "q2":  # Time availability
                try:
                    hours = int(''.join(filter(str.isdigit, response)))
                    skill_report["time_availability"] = max(1, min(40, hours))
                except:
                    skill_report["time_availability"] = 5
                    
            elif qid == "q3":  # Goals
                skill_report["learning_goals"] = [response]
                
            elif qid == "q4":  # Prerequisites
                skill_report["prerequisites"] = response.split(",")
                
            elif qid == "q5":  # Learning preference
                if "hands-on" in response or "project" in response:
                    skill_report["learning_preference"] = "practical"
                elif "theoretical" in response or "theory" in response:
                    skill_report["learning_preference"] = "theoretical"
                else:
                    skill_report["learning_preference"] = "balanced"
        
        return skill_report
