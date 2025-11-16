"""
Interview Pipeline Implementation
===============================

Complete interview pipeline with structured agents:
- Interview Agent: Generates JSON questions with context/progress
- Skill Evaluator: Analyzes answers and identifies skill levels
- Gap Detector: Identifies knowledge gaps and prerequisites
- Prerequisite Graph: Creates learning dependency graph
- Difficulty Estimator: Estimates appropriate difficulty levels
- Time Planner: Creates schedule with milestones and review cycles
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta

from core.ollama_service import ollama_service
from config.database import db_manager
from agents.standardized_agents import retrieval_agents

logger = logging.getLogger(__name__)


class InterviewAgent:
    """Generates structured interview questions based on learning goals"""
    
    def __init__(self):
        self.db = db_manager.get_database()
    
    async def generate_questions(
        self,
        learning_goal: str,
        subject_area: str,
        context: Optional[Dict[str, Any]] = None,
        num_questions: int = 5
    ) -> Dict[str, Any]:
        """Generate structured interview questions to assess user knowledge"""
        
        context = context or {}
        
        interview_prompt = f"""Generate exactly {num_questions} interview questions to assess a student's current knowledge level for learning: {learning_goal} in {subject_area}.

Return ONLY a JSON object with this exact structure:
{{
  "interview_id": "interview_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
  "learning_goal": "{learning_goal}",
  "subject_area": "{subject_area}",
  "questions": [
    {{
      "id": "q1",
      "type": "open_ended|multiple_choice|scale",
      "category": "prerequisite_knowledge|experience_level|specific_concepts|learning_preferences|time_constraints",
      "question": "What is your experience with...",
      "context": "This helps us understand your background",
      "required": true,
      "options": [] // only for multiple_choice type
    }}
  ],
  "progress": {{
    "current_question": 1,
    "total_questions": {num_questions},
    "completion_percentage": 0
  }},
  "meta": {{
    "generated_at": "{datetime.now().isoformat()}",
    "version": "1.0"
  }}
}}

Focus on assessing:
1. Prerequisites and background knowledge
2. Experience level with related concepts
3. Specific knowledge areas
4. Learning preferences and constraints
5. Time availability and goals

Each question should be clear, focused, and help determine appropriate learning path difficulty."""

        try:
            response = await ollama_service.generate_response(interview_prompt, temperature=0.3)
            interview_data = json.loads(response)
            
            # Store interview session
            await self._store_interview_session(interview_data)
            
            return interview_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Interview generation JSON error: {e}")
            return self._fallback_interview(learning_goal, subject_area, num_questions)
        except Exception as e:
            logger.error(f"Interview generation error: {e}")
            return self._fallback_interview(learning_goal, subject_area, num_questions)
    
    async def process_answers(
        self,
        interview_id: str,
        answers: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process user answers and update interview progress"""
        
        try:
            # Update stored answers
            collection = self.db["interview_sessions"]
            collection.update_one(
                {"interview_id": interview_id},
                {
                    "$set": {
                        "answers": answers,
                        "completed_at": datetime.now().isoformat(),
                        "status": "completed"
                    }
                }
            )
            
            return {
                "interview_id": interview_id,
                "status": "completed",
                "answers_processed": len(answers),
                "next_step": "skill_evaluation"
            }
            
        except Exception as e:
            logger.error(f"Answer processing error: {e}")
            return {"interview_id": interview_id, "status": "error", "error": str(e)}
    
    async def _store_interview_session(self, interview_data: Dict[str, Any]) -> None:
        """Store interview session in database"""
        try:
            collection = self.db["interview_sessions"]
            collection.insert_one({
                **interview_data,
                "status": "active",
                "created_at": datetime.now().isoformat()
            })
        except Exception as e:
            logger.error(f"Interview storage error: {e}")
    
    def _fallback_interview(self, learning_goal: str, subject_area: str, num_questions: int) -> Dict[str, Any]:
        """Fallback interview questions if LLM fails"""
        return {
            "interview_id": f"interview_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "learning_goal": learning_goal,
            "subject_area": subject_area,
            "questions": [
                {
                    "id": f"q{i+1}",
                    "type": "scale",
                    "category": "experience_level",
                    "question": f"Rate your experience with {subject_area} (1-5 scale)",
                    "context": "This helps us determine your starting level",
                    "required": True,
                    "options": ["1 - No experience", "2 - Beginner", "3 - Some experience", "4 - Intermediate", "5 - Advanced"]
                } for i in range(num_questions)
            ],
            "progress": {"current_question": 1, "total_questions": num_questions, "completion_percentage": 0},
            "meta": {"generated_at": datetime.now().isoformat(), "version": "1.0", "fallback": True}
        }


class SkillEvaluator:
    """Analyzes interview answers to determine current skill levels"""
    
    async def evaluate_skills(self, interview_id: str, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate user skills based on interview answers"""
        
        evaluation_prompt = f"""Analyze the following interview answers and determine the user's skill levels.

Interview Answers:
{json.dumps(answers, indent=2)}

Return ONLY a JSON object with this structure:
{{
  "skill_evaluation": {{
    "overall_level": "beginner|intermediate|advanced",
    "subject_areas": [
      {{
        "area": "string",
        "level": "beginner|intermediate|advanced",
        "confidence": 0.0, // 0.0-1.0
        "evidence": ["string"] // key points from answers
      }}
    ],
    "strengths": ["string"],
    "weaknesses": ["string"],
    "recommended_starting_level": "beginner|intermediate|advanced"
  }},
  "meta": {{
    "evaluated_at": "{datetime.now().isoformat()}",
    "interview_id": "{interview_id}"
  }}
}}

Base evaluation on:
1. Self-reported experience levels
2. Specific knowledge demonstrated
3. Confidence in responses
4. Learning goals complexity"""

        try:
            response = await ollama_service.generate_response(evaluation_prompt, temperature=0.2)
            evaluation_data = json.loads(response)
            
            # Store evaluation
            collection = db_manager.get_database()["skill_evaluations"]
            collection.insert_one({
                **evaluation_data,
                "interview_id": interview_id,
                "created_at": datetime.now().isoformat()
            })
            
            return evaluation_data
            
        except Exception as e:
            logger.error(f"Skill evaluation error: {e}")
            return self._fallback_evaluation(interview_id)
    
    def _fallback_evaluation(self, interview_id: str) -> Dict[str, Any]:
        """Fallback evaluation if LLM fails"""
        return {
            "skill_evaluation": {
                "overall_level": "beginner",
                "subject_areas": [{"area": "general", "level": "beginner", "confidence": 0.5, "evidence": ["fallback"]}],
                "strengths": ["motivated to learn"],
                "weaknesses": ["needs assessment"],
                "recommended_starting_level": "beginner"
            },
            "meta": {"evaluated_at": datetime.now().isoformat(), "interview_id": interview_id, "fallback": True}
        }


class GapDetector:
    """Identifies knowledge gaps and learning prerequisites"""
    
    async def detect_gaps(
        self,
        learning_goal: str,
        skill_evaluation: Dict[str, Any],
        target_level: str = "intermediate"
    ) -> Dict[str, Any]:
        """Detect knowledge gaps between current and target levels"""
        
        gap_prompt = f"""Identify knowledge gaps for a student with the following skill evaluation who wants to achieve: {learning_goal} at {target_level} level.

Current Skill Evaluation:
{json.dumps(skill_evaluation, indent=2)}

Return ONLY a JSON object:
{{
  "gap_analysis": {{
    "identified_gaps": [
      {{
        "gap_id": "string",
        "concept": "string",
        "current_level": "none|basic|intermediate|advanced",
        "required_level": "basic|intermediate|advanced",
        "priority": "high|medium|low",
        "estimated_hours": 0
      }}
    ],
    "missing_prerequisites": [
      {{
        "prerequisite": "string",
        "importance": "critical|important|helpful",
        "estimated_hours": 0
      }}
    ],
    "learning_path_recommendations": [
      {{
        "phase": 1,
        "focus_areas": ["string"],
        "estimated_duration": "string"
      }}
    ]
  }},
  "meta": {{
    "analyzed_at": "{datetime.now().isoformat()}",
    "target_goal": "{learning_goal}",
    "target_level": "{target_level}"
  }}
}}"""

        try:
            response = await ollama_service.generate_response(gap_prompt, temperature=0.3)
            gap_data = json.loads(response)
            
            # Store gap analysis
            collection = db_manager.get_database()["gap_analyses"]
            collection.insert_one({
                **gap_data,
                "learning_goal": learning_goal,
                "created_at": datetime.now().isoformat()
            })
            
            return gap_data
            
        except Exception as e:
            logger.error(f"Gap detection error: {e}")
            return self._fallback_gaps(learning_goal, target_level)
    
    def _fallback_gaps(self, learning_goal: str, target_level: str) -> Dict[str, Any]:
        """Fallback gap analysis"""
        return {
            "gap_analysis": {
                "identified_gaps": [{
                    "gap_id": "general",
                    "concept": learning_goal,
                    "current_level": "none",
                    "required_level": target_level,
                    "priority": "high",
                    "estimated_hours": 40
                }],
                "missing_prerequisites": [],
                "learning_path_recommendations": [{
                    "phase": 1,
                    "focus_areas": [learning_goal],
                    "estimated_duration": "4-6 weeks"
                }]
            },
            "meta": {"analyzed_at": datetime.now().isoformat(), "target_goal": learning_goal, "target_level": target_level, "fallback": True}
        }


class PrerequisiteGraph:
    """Creates learning dependency graphs"""
    
    async def build_prerequisite_graph(
        self,
        learning_goal: str,
        gap_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build prerequisite dependency graph"""
        
        graph_prompt = f"""Create a prerequisite dependency graph for learning: {learning_goal}

Gap Analysis Context:
{json.dumps(gap_analysis, indent=2)}

Return ONLY a JSON object:
{{
  "prerequisite_graph": {{
    "nodes": [
      {{
        "id": "string",
        "concept": "string",
        "level": "beginner|intermediate|advanced",
        "estimated_hours": 0,
        "is_prerequisite": true,
        "is_core": false
      }}
    ],
    "edges": [
      {{
        "from": "node_id",
        "to": "node_id", 
        "relationship": "prerequisite|builds_on|reinforces",
        "strength": 0.0 // 0.0-1.0
      }}
    ],
    "learning_phases": [
      {{
        "phase": 1,
        "concepts": ["node_id"],
        "dependencies_satisfied": true
      }}
    ]
  }},
  "meta": {{
    "generated_at": "{datetime.now().isoformat()}",
    "learning_goal": "{learning_goal}"
  }}
}}"""

        try:
            response = await ollama_service.generate_response(graph_prompt, temperature=0.2)
            graph_data = json.loads(response)
            
            # Store graph
            collection = db_manager.get_database()["prerequisite_graphs"]
            collection.insert_one({
                **graph_data,
                "learning_goal": learning_goal,
                "created_at": datetime.now().isoformat()
            })
            
            return graph_data
            
        except Exception as e:
            logger.error(f"Prerequisite graph error: {e}")
            return self._fallback_graph(learning_goal)
    
    def _fallback_graph(self, learning_goal: str) -> Dict[str, Any]:
        """Fallback prerequisite graph"""
        return {
            "prerequisite_graph": {
                "nodes": [{
                    "id": "core_concept",
                    "concept": learning_goal,
                    "level": "beginner",
                    "estimated_hours": 20,
                    "is_prerequisite": False,
                    "is_core": True
                }],
                "edges": [],
                "learning_phases": [{
                    "phase": 1,
                    "concepts": ["core_concept"],
                    "dependencies_satisfied": True
                }]
            },
            "meta": {"generated_at": datetime.now().isoformat(), "learning_goal": learning_goal, "fallback": True}
        }


class DifficultyEstimator:
    """Estimates appropriate difficulty levels for content"""
    
    async def estimate_difficulty(
        self,
        skill_evaluation: Dict[str, Any],
        prerequisite_graph: Dict[str, Any],
        target_goal: str
    ) -> Dict[str, Any]:
        """Estimate appropriate difficulty progression"""
        
        difficulty_prompt = f"""Estimate appropriate difficulty levels for learning path to: {target_goal}

Skill Evaluation:
{json.dumps(skill_evaluation, indent=2)}

Prerequisite Graph:
{json.dumps(prerequisite_graph, indent=2)}

Return ONLY a JSON object:
{{
  "difficulty_estimation": {{
    "recommended_progression": [
      {{
        "phase": 1,
        "difficulty": "beginner|intermediate|advanced", 
        "concepts": ["string"],
        "rationale": "string"
      }}
    ],
    "adaptive_factors": {{
      "user_confidence": 0.0, // 0.0-1.0
      "prior_knowledge": 0.0, // 0.0-1.0
      "learning_pace": "slow|normal|fast"
    }},
    "difficulty_adjustments": [
      {{
        "concept": "string",
        "base_difficulty": "string",
        "adjusted_difficulty": "string",
        "adjustment_reason": "string"
      }}
    ]
  }},
  "meta": {{
    "estimated_at": "{datetime.now().isoformat()}",
    "target_goal": "{target_goal}"
  }}
}}"""

        try:
            response = await ollama_service.generate_response(difficulty_prompt, temperature=0.2)
            difficulty_data = json.loads(response)
            
            # Store estimation
            collection = db_manager.get_database()["difficulty_estimations"]
            collection.insert_one({
                **difficulty_data,
                "target_goal": target_goal,
                "created_at": datetime.now().isoformat()
            })
            
            return difficulty_data
            
        except Exception as e:
            logger.error(f"Difficulty estimation error: {e}")
            return self._fallback_difficulty(target_goal)
    
    def _fallback_difficulty(self, target_goal: str) -> Dict[str, Any]:
        """Fallback difficulty estimation"""
        return {
            "difficulty_estimation": {
                "recommended_progression": [{
                    "phase": 1,
                    "difficulty": "beginner",
                    "concepts": [target_goal],
                    "rationale": "Starting with fundamentals"
                }],
                "adaptive_factors": {
                    "user_confidence": 0.5,
                    "prior_knowledge": 0.3,
                    "learning_pace": "normal"
                },
                "difficulty_adjustments": []
            },
            "meta": {"estimated_at": datetime.now().isoformat(), "target_goal": target_goal, "fallback": True}
        }


class ProjectGenerator:
    """Generates course-level projects based on learning goals"""
    
    async def generate_course_project(
        self,
        learning_goal: str,
        skill_level: str,
        prerequisite_graph: Dict[str, Any],
        phases_content: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate a comprehensive course project"""
        
        project_prompt = f"""Generate a comprehensive course project for learning: {learning_goal} at {skill_level} level.

Prerequisite Graph:
{json.dumps(prerequisite_graph, indent=2)}

Course Phases:
{json.dumps(phases_content, indent=2)}

Return ONLY a JSON object:
{{
  "course_project": {{
    "title": "string",
    "description": "string",
    "objectives": ["string"],
    "difficulty": "beginner|intermediate|advanced",
    "estimated_time_hours": 0,
    "deliverables": [
      {{
        "name": "string",
        "type": "code|report|presentation|demo",
        "description": "string",
        "due_phase": 0 // which phase it's due
      }}
    ],
    "technical_requirements": [
      {{
        "requirement": "string",
        "category": "programming|tools|platforms|knowledge"
      }}
    ],
    "milestones": [
      {{
        "milestone": "string",
        "description": "string",
        "phase": 0,
        "estimated_hours": 0
      }}
    ],
    "assessment_criteria": [
      {{
        "criterion": "string",
        "weight": 0.0, // percentage as decimal
        "description": "string"
      }}
    ]
  }},
  "meta": {{
    "generated_at": "{datetime.now().isoformat()}",
    "learning_goal": "{learning_goal}",
    "target_level": "{skill_level}"
  }}
}}

The project should:
1. Integrate concepts from all phases
2. Be appropriate for the skill level
3. Have clear deliverables and milestones
4. Include practical application of learned concepts"""

        try:
            response = await ollama_service.generate_response(project_prompt, temperature=0.3)
            project_data = json.loads(response)
            
            # Store project
            collection = db_manager.get_database()["course_projects"]
            collection.insert_one({
                **project_data,
                "learning_goal": learning_goal,
                "created_at": datetime.now().isoformat()
            })
            
            return project_data
            
        except Exception as e:
            logger.error(f"Project generation error: {e}")
            return self._fallback_project(learning_goal, skill_level)
    
    def _fallback_project(self, learning_goal: str, skill_level: str) -> Dict[str, Any]:
        """Fallback project generation"""
        return {
            "course_project": {
                "title": f"{learning_goal} Practical Project",
                "description": f"A comprehensive project covering {learning_goal} concepts",
                "objectives": [f"Apply {learning_goal} principles", "Demonstrate understanding", "Create working solution"],
                "difficulty": skill_level,
                "estimated_time_hours": 20,
                "deliverables": [{
                    "name": "Final Project",
                    "type": "code",
                    "description": "Complete implementation",
                    "due_phase": 4
                }],
                "technical_requirements": [{"requirement": "Basic programming skills", "category": "programming"}],
                "milestones": [{
                    "milestone": "Project completion",
                    "description": "Finish all requirements",
                    "phase": 4,
                    "estimated_hours": 20
                }],
                "assessment_criteria": [{
                    "criterion": "Functionality",
                    "weight": 1.0,
                    "description": "Does it work as expected"
                }]
            },
            "meta": {"generated_at": datetime.now().isoformat(), "learning_goal": learning_goal, "target_level": skill_level, "fallback": True}
        }


class TimePlanner:
    """Generates time schedules with milestones and review cycles"""
    
    async def generate_schedule(
        self,
        phases: List[Dict[str, Any]],
        course_project: Dict[str, Any],
        user_constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate a comprehensive learning schedule"""
        
        constraints = user_constraints or {"hours_per_week": 10, "preferred_pace": "normal"}
        
        schedule_prompt = f"""Generate a detailed learning schedule with milestones and review cycles.

Course Phases:
{json.dumps(phases, indent=2)}

Course Project:
{json.dumps(course_project, indent=2)}

User Constraints:
{json.dumps(constraints, indent=2)}

Return ONLY a JSON object:
{{
  "learning_schedule": {{
    "total_duration_weeks": 0,
    "hours_per_week": 0,
    "start_date": "{datetime.now().date().isoformat()}",
    "end_date": "YYYY-MM-DD",
    "weekly_plan": [
      {{
        "week": 1,
        "focus": "string",
        "phase": 1,
        "activities": [
          {{
            "activity": "string",
            "type": "study|practice|project|review|assessment",
            "duration_hours": 0,
            "resources": ["string"]
          }}
        ],
        "milestones": ["string"],
        "deliverables": ["string"]
      }}
    ],
    "review_cycles": [
      {{
        "week": 0,
        "type": "weekly|phase|midterm|final",
        "topics": ["string"],
        "duration_hours": 0
      }}
    ],
    "project_timeline": [
      {{
        "milestone": "string",
        "week": 0,
        "deliverable": "string",
        "estimated_hours": 0
      }}
    ]
  }},
  "meta": {{
    "generated_at": "{datetime.now().isoformat()}",
    "planning_version": "1.0"
  }}
}}

Schedule should include:
1. Weekly breakdown of activities
2. Regular review cycles 
3. Project milestone integration
4. Buffer time for reinforcement"""

        try:
            response = await ollama_service.generate_response(schedule_prompt, temperature=0.2)
            schedule_data = json.loads(response)
            
            # Store schedule
            collection = db_manager.get_database()["learning_schedules"]
            collection.insert_one({
                **schedule_data,
                "created_at": datetime.now().isoformat()
            })
            
            return schedule_data
            
        except Exception as e:
            logger.error(f"Schedule generation error: {e}")
            return self._fallback_schedule(constraints)
    
    def _fallback_schedule(self, constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback schedule generation"""
        hours_per_week = constraints.get("hours_per_week", 10)
        total_weeks = 8
        
        return {
            "learning_schedule": {
                "total_duration_weeks": total_weeks,
                "hours_per_week": hours_per_week,
                "start_date": datetime.now().date().isoformat(),
                "end_date": (datetime.now() + timedelta(weeks=total_weeks)).date().isoformat(),
                "weekly_plan": [{
                    "week": i+1,
                    "focus": f"Week {i+1} content",
                    "phase": (i // 2) + 1,
                    "activities": [{
                        "activity": "Study materials",
                        "type": "study",
                        "duration_hours": hours_per_week,
                        "resources": ["Various materials"]
                    }],
                    "milestones": ["Week completion"],
                    "deliverables": []
                } for i in range(total_weeks)],
                "review_cycles": [{
                    "week": i,
                    "type": "weekly",
                    "topics": ["Review concepts"],
                    "duration_hours": 2
                } for i in range(1, total_weeks + 1, 2)],
                "project_timeline": [{
                    "milestone": "Project completion",
                    "week": total_weeks,
                    "deliverable": "Final project",
                    "estimated_hours": 20
                }]
            },
            "meta": {"generated_at": datetime.now().isoformat(), "planning_version": "1.0", "fallback": True}
        }


# Global instances
interview_agent = InterviewAgent()
skill_evaluator = SkillEvaluator()
gap_detector = GapDetector()
prerequisite_graph = PrerequisiteGraph()
difficulty_estimator = DifficultyEstimator()
project_generator = ProjectGenerator()
time_planner = TimePlanner()
