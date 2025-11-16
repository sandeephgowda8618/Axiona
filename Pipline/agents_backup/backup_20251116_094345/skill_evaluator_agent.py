from agents.base_agent import BaseAgent, AgentState
from core.vector_db import vector_db
from typing import List, Dict, Any
import random

class SkillEvaluatorAgent(BaseAgent):
    """Agent that evaluates user skills through adaptive quizzes"""
    
    def __init__(self):
        super().__init__("SkillEvaluatorAgent", temperature=0.0, max_tokens=400)
    
    def get_system_prompt(self) -> str:
        return """You are SkillEvaluatorAgent. Given user answers and optionally run a short adaptive baseline quiz (3-8 MCQs).

Input: { session_id, user_profile, interview_answers }
Use RAG to select 6 context chunks for quiz generation.
Output: { baseline_quiz_id, score, per_skill_scores: {skill:score}, evidence_chunks:[content_chunk_ids] }

Constraints: Use deterministic scoring. Return numeric scores 0..1."""
    
    def process(self, state: AgentState) -> AgentState:
        """Evaluate user skills through quiz and self-assessment"""
        try:
            self.log_action(state, "Starting skill evaluation")
            
            roadmap = state.data.get("roadmap", {})
            interview = roadmap.get("interview", {})
            
            # Extract target subject from interview
            target_subject = self._extract_target_subject(interview.get("answers", []))
            
            # Generate baseline quiz
            quiz_data = self._generate_baseline_quiz(target_subject)
            
            # Calculate preliminary scores from interview
            preliminary_scores = self._calculate_preliminary_scores(interview)
            
            # Store skill evaluation data
            skill_evaluation = {
                "baseline_quiz_id": quiz_data["quiz_id"],
                "quiz_questions": quiz_data["questions"],
                "preliminary_score": preliminary_scores.get("overall", 0.5),
                "skill_breakdown": preliminary_scores,
                "evidence_chunks": quiz_data["evidence_chunks"],
                "quiz_completed": False,
                "final_score": None
            }
            
            roadmap["skill_evaluation"] = skill_evaluation
            state.data["roadmap"] = roadmap
            state.data["status"] = "skill_quiz_ready"
            state.data["next_agent"] = "SkillEvaluatorAgent"  # Waiting for quiz completion
            
            self.log_action(state, f"Generated baseline quiz with {len(quiz_data['questions'])} questions")
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error in skill evaluation: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
    def process_quiz_results(self, state: AgentState, quiz_answers: List[Dict[str, Any]]) -> AgentState:
        """Process quiz results and calculate final skill scores"""
        try:
            self.log_action(state, "Processing quiz results")
            
            roadmap = state.data.get("roadmap", {})
            skill_evaluation = roadmap.get("skill_evaluation", {})
            
            # Calculate quiz score
            quiz_score = self._calculate_quiz_score(
                skill_evaluation.get("quiz_questions", []), 
                quiz_answers
            )
            
            # Update skill breakdown based on quiz performance
            skill_breakdown = self._update_skill_breakdown(
                skill_evaluation.get("skill_breakdown", {}),
                quiz_answers,
                skill_evaluation.get("quiz_questions", [])
            )
            
            # Finalize skill evaluation
            skill_evaluation.update({
                "quiz_completed": True,
                "final_score": quiz_score,
                "skill_breakdown": skill_breakdown,
                "quiz_answers": quiz_answers
            })
            
            roadmap["skill_evaluation"] = skill_evaluation
            state.data["roadmap"] = roadmap
            state.data["status"] = "skill_evaluation_completed"
            state.data["next_agent"] = "ConceptGapDetectorAgent"
            
            self.log_action(state, f"Skill evaluation completed with score: {quiz_score:.2f}")
            
            return state
            
        except Exception as e:
            self.logger.error(f"Error processing quiz results: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
    
    def _extract_target_subject(self, answers: List[Dict[str, str]]) -> str:
        """Extract the target subject from interview answers"""
        target_subject = "general"
        
        for answer in answers:
            if answer.get("question_id") == "q1":  # Subject question
                subject_text = answer.get("answer", "").lower()
                
                # Map common subjects
                if any(term in subject_text for term in ["machine learning", "ml", "ai"]):
                    target_subject = "machine_learning"
                elif any(term in subject_text for term in ["data structures", "algorithms", "dsa"]):
                    target_subject = "data_structures"
                elif any(term in subject_text for term in ["database", "sql", "dbms"]):
                    target_subject = "database"
                elif any(term in subject_text for term in ["python", "programming"]):
                    target_subject = "programming"
                else:
                    target_subject = "general"
                break
        
        return target_subject
    
    def _generate_baseline_quiz(self, target_subject: str) -> Dict[str, Any]:
        """Generate a baseline quiz for the target subject"""
        try:
            # Search for relevant content chunks
            search_results = vector_db.search_similar(
                collection_key="materials",
                query=f"{target_subject} fundamentals basics introduction",
                n_results=6
            )
            
            evidence_chunks = [result["id"] for result in search_results]
            
            # Generate quiz questions based on subject
            questions = self._create_subject_questions(target_subject, search_results)
            
            quiz_data = {
                "quiz_id": f"baseline_{target_subject}_{random.randint(1000, 9999)}",
                "questions": questions,
                "evidence_chunks": evidence_chunks
            }
            
            return quiz_data
            
        except Exception as e:
            self.logger.error(f"Error generating baseline quiz: {e}")
            return {
                "quiz_id": f"baseline_fallback_{random.randint(1000, 9999)}",
                "questions": self._create_fallback_questions(),
                "evidence_chunks": []
            }
    
    def _create_subject_questions(self, subject: str, context_chunks: List[Dict]) -> List[Dict[str, Any]]:
        """Create questions specific to the subject"""
        # This would typically use LLM with context chunks
        # For now, returning template questions
        
        question_templates = {
            "machine_learning": [
                {
                    "id": "ml_q1",
                    "question": "What is the main goal of supervised learning?",
                    "options": [
                        "Learn without labeled data",
                        "Learn from labeled input-output pairs",
                        "Learn by trial and error",
                        "Learn from unlabeled data"
                    ],
                    "correct_answer": "B",
                    "difficulty": "easy"
                },
                {
                    "id": "ml_q2",
                    "question": "Which of the following is an example of a classification algorithm?",
                    "options": [
                        "Linear Regression",
                        "K-Means Clustering",
                        "Decision Tree",
                        "PCA"
                    ],
                    "correct_answer": "C",
                    "difficulty": "medium"
                }
            ],
            "data_structures": [
                {
                    "id": "ds_q1",
                    "question": "What is the time complexity of accessing an element in an array?",
                    "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
                    "correct_answer": "A",
                    "difficulty": "easy"
                },
                {
                    "id": "ds_q2",
                    "question": "Which data structure follows LIFO principle?",
                    "options": ["Queue", "Stack", "Array", "Linked List"],
                    "correct_answer": "B",
                    "difficulty": "easy"
                }
            ]
        }
        
        return question_templates.get(subject, self._create_fallback_questions())
    
    def _create_fallback_questions(self) -> List[Dict[str, Any]]:
        """Create generic questions when subject-specific ones aren't available"""
        return [
            {
                "id": "gen_q1",
                "question": "How would you rate your problem-solving skills?",
                "options": ["Beginner", "Intermediate", "Advanced", "Expert"],
                "correct_answer": "B",  # No wrong answer for self-assessment
                "difficulty": "easy"
            },
            {
                "id": "gen_q2",
                "question": "How comfortable are you with mathematical concepts?",
                "options": ["Not comfortable", "Somewhat comfortable", "Comfortable", "Very comfortable"],
                "correct_answer": "C",
                "difficulty": "easy"
            }
        ]
    
    def _calculate_preliminary_scores(self, interview: Dict) -> Dict[str, float]:
        """Calculate preliminary skill scores from interview"""
        scores = {"overall": 0.5}  # Default middle score
        
        skill_report = interview.get("skill_self_report", {})
        overall_level = skill_report.get("overall_level", "beginner")
        
        level_mapping = {
            "beginner": 0.2,
            "intermediate": 0.6, 
            "advanced": 0.8
        }
        
        scores["overall"] = level_mapping.get(overall_level, 0.5)
        scores["self_assessment"] = scores["overall"]
        
        return scores
    
    def _calculate_quiz_score(self, questions: List[Dict], answers: List[Dict]) -> float:
        """Calculate quiz score from answers"""
        if not questions or not answers:
            return 0.5  # Default score
        
        correct_answers = 0
        total_questions = len(questions)
        
        # Create lookup for correct answers
        correct_lookup = {q["id"]: q["correct_answer"] for q in questions}
        
        for answer in answers:
            question_id = answer.get("question_id")
            user_answer = answer.get("answer")
            
            if question_id in correct_lookup and user_answer == correct_lookup[question_id]:
                correct_answers += 1
        
        return correct_answers / total_questions if total_questions > 0 else 0.5
    
    def _update_skill_breakdown(self, initial_scores: Dict, quiz_answers: List[Dict], 
                               questions: List[Dict]) -> Dict[str, float]:
        """Update skill breakdown based on quiz performance"""
        updated_scores = initial_scores.copy()
        
        # Simple implementation - could be more sophisticated
        quiz_score = self._calculate_quiz_score(questions, quiz_answers)
        
        # Weight the quiz score with self-assessment
        self_assessment = initial_scores.get("self_assessment", 0.5)
        final_score = (quiz_score * 0.7) + (self_assessment * 0.3)  # Quiz weighted more
        
        updated_scores.update({
            "overall": final_score,
            "quiz_performance": quiz_score,
            "adjusted_score": final_score
        })
        
        return updated_scores
