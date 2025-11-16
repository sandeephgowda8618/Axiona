from agents.base_agent import BaseAgent, AgentState
from typing import List, Dict, Any

class InterviewAgent(BaseAgent):
    """Agent responsible for conducting user interviews to gather learning preferences"""
    
    def __init__(self):
        super().__init__("InterviewAgent", temperature=0.2, max_tokens=250)
    
    def get_system_prompt(self) -> str:
        return """You are InterviewAgent. Ask 3-5 concise, targeted questions to collect goals, constraints, prior experience, and time availability. Use user's profile if available.

Input: { session_id, user_profile }
Output: { answers: [{q, a}], confidence_estimates, timestamp }

Rules: Questions must be diagnostic (prereqs, prior projects, time/week). Do not ask more than 5 questions. Save answers verbatim."""
    
    def process(self, state: AgentState) -> AgentState:
        """Generate interview questions and process user responses"""
        try:
            self.log_action(state, "Starting user interview")
            
            # Get roadmap data
            roadmap = state.data.get("roadmap", {})
            user_profile = state.data.get("user_profile", {})
            
            # Generate interview questions
            questions = self._generate_questions(user_profile)
            
            # Store questions in roadmap
            interview_data = {
                "questions": questions,
                "answers": [],
                "skill_self_report": {},
                "completed": False
            }
            
            roadmap["interview"] = interview_data
            state.data["roadmap"] = roadmap
            state.data["status"] = "interview_questions_ready"
            state.data["next_agent"] = "InterviewAgent"  # Waiting for user responses
            
            self.log_action(state, f"Generated {len(questions)} interview questions")
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error in interview process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
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
    
    def _generate_questions(self, user_profile: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate targeted interview questions"""
        questions = [
            {
                "id": "q1",
                "question": "What subject or skill do you want to learn? (e.g., Machine Learning, Data Structures, etc.)",
                "type": "open_text",
                "category": "goal"
            },
            {
                "id": "q2", 
                "question": "What is your current experience level with this subject?",
                "type": "choice",
                "options": ["Complete Beginner", "Some Basics", "Intermediate", "Advanced"],
                "category": "experience"
            },
            {
                "id": "q3",
                "question": "How many hours per week can you dedicate to studying?",
                "type": "choice",
                "options": ["2-4 hours", "5-8 hours", "9-12 hours", "13+ hours"],
                "category": "time_availability"
            },
            {
                "id": "q4",
                "question": "What type of learning materials do you prefer?",
                "type": "multiple_choice",
                "options": ["Videos", "Reading/PDFs", "Interactive Quizzes", "Hands-on Projects"],
                "category": "learning_style"
            },
            {
                "id": "q5",
                "question": "Do you have any specific goals or deadlines for learning this subject?",
                "type": "open_text",
                "category": "constraints"
            }
        ]
        
        return questions
    
    def _extract_skill_levels(self, answers: List[Dict[str, str]]) -> Dict[str, str]:
        """Extract skill level assessments from user answers"""
        skill_report = {}
        
        for answer in answers:
            question_id = answer.get("question_id", "")
            answer_text = answer.get("answer", "").lower()
            
            if question_id == "q2":  # Experience level question
                if "beginner" in answer_text:
                    skill_report["overall_level"] = "beginner"
                elif "intermediate" in answer_text:
                    skill_report["overall_level"] = "intermediate"
                elif "advanced" in answer_text:
                    skill_report["overall_level"] = "advanced"
                else:
                    skill_report["overall_level"] = "beginner"
            
            elif question_id == "q3":  # Time availability
                if "2-4" in answer_text:
                    skill_report["time_per_week"] = "low"
                elif "5-8" in answer_text:
                    skill_report["time_per_week"] = "medium"
                elif "9-12" in answer_text:
                    skill_report["time_per_week"] = "high"
                else:
                    skill_report["time_per_week"] = "very_high"
        
        return skill_report
