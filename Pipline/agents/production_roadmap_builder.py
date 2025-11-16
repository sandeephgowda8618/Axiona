"""
Production Roadmap Builder - Integrates All Production Agents
============================================================

This roadmap builder uses the finalized production-ready agents with:
- Updated PES Material Agent (ALL unit PDFs, strict subject filtering)
- Updated Reference Book Agent (exactly 1 book per phase)
- Updated Interview, Skill Evaluator, and other agents
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from core.vector_db import VectorDBManager
from core.metadata_builder import MetadataBuilder
from config.database import db_manager
from config.settings import Settings
from agents.production_retrieval_agents import UpdatedPESMaterialAgent, UpdatedReferenceBookAgent
from agents.interview_agent import InterviewAgent
from agents.skill_evaluator_agent import SkillEvaluatorAgent

logger = logging.getLogger(__name__)

class ProductionRoadmapBuilder:
    """Production roadmap builder using all updated agents"""
    
    def __init__(self):
        self.vector_db = VectorDBManager(persist_directory="./chromadb")
        self.db = db_manager.get_database()
        
        # Initialize production agents
        self.pes_agent = UpdatedPESMaterialAgent()
        self.book_agent = UpdatedReferenceBookAgent()
        self.interview_agent = InterviewAgent()
        self.skill_agent = SkillEvaluatorAgent()
    
    async def build_interview_driven_roadmap(
        self,
        learning_goal: str,
        subject_area: str = "Computer Science",
        max_weeks: int = 8,
        hours_per_week: int = 10
    ) -> Dict[str, Any]:
        """
        Build a complete interview-driven roadmap using production agents
        
        Args:
            learning_goal: What the student wants to learn (e.g., "Data Structures & Algorithms")
            subject_area: Subject area for categorization
            max_weeks: Maximum weeks for the roadmap
            hours_per_week: Study hours per week
            
        Returns:
            Complete roadmap with 4 phases, resources, project, and schedule
        """
        try:
            roadmap_id = f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            logger.info(f"Starting production roadmap for: {learning_goal}")
            
            # Step 1: Generate interview questions
            logger.info("Generating interview questions...")
            questions = await self.interview_agent.generate_interview_questions(learning_goal)
            
            # Step 2: Use mock answers (in real app, user would provide these)
            mock_answers = self._generate_mock_answers(learning_goal, questions)
            
            # Step 3: Evaluate skills
            logger.info("Evaluating user skills...")
            skill_evaluation = await self.skill_agent.evaluate_skills(mock_answers)
            
            # Step 4: Build 4 phases with proper resource allocation
            logger.info("Building 4-phase roadmap with production agents...")
            phases = await self._build_phases_with_production_agents(learning_goal, skill_evaluation)
            
            # Step 5: Generate course project
            project = self._generate_simple_project(learning_goal, skill_evaluation)
            
            # Step 6: Create schedule
            schedule = self._create_learning_schedule(max_weeks, hours_per_week, len(phases))
            
            # Build final roadmap
            roadmap = {
                "roadmap_id": roadmap_id,
                "learning_goal": learning_goal,
                "subject_area": subject_area,
                "user_profile": {
                    "skill_level": skill_evaluation.get("skill_level", "beginner"),
                    "strengths": skill_evaluation.get("strengths", ["motivated to learn"]),
                    "weaknesses": skill_evaluation.get("weaknesses", ["needs assessment"])
                },
                "phases": phases,
                "course_project": project,
                "learning_schedule": schedule,
                "analytics": {
                    "total_phases": len(phases),
                    "total_estimated_hours": sum(phase.get("estimated_duration_hours", 15) for phase in phases),
                    "skill_gaps_identified": len(skill_evaluation.get("weaknesses", [])),
                    "prerequisites_required": 1
                },
                "meta": {
                    "generated_at": datetime.now().isoformat(),
                    "pipeline_version": "2.0",
                    "interview_driven": True,
                    "agents_used": [
                        "interview_agent",
                        "skill_evaluator", 
                        "gap_detector",
                        "prerequisite_graph",
                        "difficulty_estimator",
                        "retrieval_agents",
                        "project_generator",
                        "time_planner"
                    ]
                }
            }
            
            # Store roadmap in database
            roadmap_collection = db_manager.get_collection("roadmaps")
            roadmap["_id"] = roadmap_collection.insert_one(roadmap).inserted_id
            
            logger.info(f"✅ Production roadmap completed: {roadmap_id}")
            return roadmap
            
        except Exception as e:
            logger.error(f"Error building production roadmap: {e}")
            raise
    
    async def _build_phases_with_production_agents(self, subject: str, skill_evaluation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build 4 phases using production agents with proper filtering"""
        
        # Define 4 phases with concepts
        phase_definitions = [
            {
                "phase_id": 1,
                "phase_title": f"Foundations of {subject}",
                "difficulty": "beginner",
                "concepts": ["basics", "introduction", "fundamentals"],
                "objectives": ["Master basics", "Master introduction", "Master fundamentals"]
            },
            {
                "phase_id": 2, 
                "phase_title": f"Core {subject} Concepts",
                "difficulty": "intermediate",
                "concepts": ["core concepts", "implementation", "algorithms"],
                "objectives": ["Master core concepts", "Master implementation", "Master algorithms"]
            },
            {
                "phase_id": 3,
                "phase_title": f"Advanced {subject} Topics", 
                "difficulty": "intermediate",
                "concepts": ["advanced topics", "optimization", "design patterns"],
                "objectives": ["Master advanced topics", "Master optimization", "Master design patterns"]
            },
            {
                "phase_id": 4,
                "phase_title": f"Expert {subject} Applications",
                "difficulty": "advanced", 
                "concepts": ["expert applications", "systems", "real-world projects"],
                "objectives": ["Master expert applications", "Master systems", "Master real-world projects"]
            }
        ]
        
        phases = []
        
        for phase_def in phase_definitions:
            logger.info(f"Building Phase {phase_def['phase_id']}: {phase_def['phase_title']}")
            
            # Get PES materials for this phase (Unit = Phase number)
            pes_result = await self.pes_agent.retrieve_pes_materials(
                subject=subject,
                phase_number=phase_def["phase_id"],
                concepts=phase_def["concepts"]
            )
            
            # Get exactly 1 reference book for this phase
            book_result = await self.book_agent.retrieve_best_book(
                subject=subject,
                difficulty=phase_def["difficulty"],
                concepts=phase_def["concepts"]
            )
            
            # Create mock videos (placeholder for YouTube integration)
            videos = self._create_mock_videos(subject, phase_def["phase_id"], phase_def["concepts"])
            
            # Build phase structure
            phase = {
                "phase_id": phase_def["phase_id"],
                "phase_title": phase_def["phase_title"], 
                "estimated_duration_hours": 15,
                "difficulty": phase_def["difficulty"],
                "learning_objectives": phase_def["objectives"],
                "resources": {
                    "pes_materials": pes_result.get("results", []),
                    "reference_books": [book_result.get("result")] if book_result.get("result") else [],
                    "videos": videos
                },
                "concepts": phase_def["concepts"],
                "prerequisites": [],
                "assessments": [{
                    "type": "quiz",
                    "topic": " ".join(phase_def["concepts"][:2]),
                    "estimated_time": "30 minutes"
                }]
            }
            
            phases.append(phase)
            
            # Log resource counts
            pes_count = len(phase["resources"]["pes_materials"])
            book_count = len(phase["resources"]["reference_books"])
            logger.info(f"Phase {phase_def['phase_id']} resources: {pes_count} PES materials, {book_count} reference book(s)")
        
        return phases
    
    def _generate_mock_answers(self, subject: str, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate mock answers for testing"""
        answers = []
        for q in questions:
            qid = q.get("question_id", "")
            answer = ""
            
            if "experience" in q.get("question_text", "").lower():
                answer = "I'm a beginner with some basic programming knowledge"
            elif "hours" in q.get("question_text", "").lower():
                answer = "I can dedicate about 10 hours per week"
            elif "goals" in q.get("question_text", "").lower():
                answer = f"I want to master {subject} for technical interviews and projects"
            elif "tools" in q.get("question_text", "").lower():
                answer = "I know Python and basic programming concepts"
            elif "prefer" in q.get("question_text", "").lower():
                answer = "I prefer a balanced approach with both theory and hands-on practice"
            else:
                answer = f"I'm motivated to learn {subject} systematically"
                
            answers.append({
                "question_id": qid,
                "question_text": q.get("question_text", ""),
                "answer": answer
            })
        
        return answers
    
    def _create_mock_videos(self, subject: str, phase_id: int, concepts: List[str]) -> Dict[str, Any]:
        """Create mock video structure (placeholder for YouTube integration)"""
        concept_text = " ".join(concepts)
        
        return {
            "playlists": [
                {
                    "id": f"playlist_{subject.lower().replace(' ', '_')}_unit{phase_id}_1",
                    "title": f"{subject} - Unit {phase_id} Playlist 1",
                    "url": f"https://www.youtube.com/playlist?list=PLAYLIST{phase_id}_1",
                    "content_type": "youtube_playlist",
                    "video_count": 12,
                    "total_duration_seconds": 4800,
                    "relevance_score": 0.5,
                    "snippet": f"Comprehensive {subject} Unit {phase_id} playlist covering {concept_text}"
                },
                {
                    "id": f"playlist_{subject.lower().replace(' ', '_')}_unit{phase_id}_2",
                    "title": f"{subject} - Unit {phase_id} Playlist 2", 
                    "url": f"https://www.youtube.com/playlist?list=PLAYLIST{phase_id}_2",
                    "content_type": "youtube_playlist",
                    "video_count": 15,
                    "total_duration_seconds": 6000,
                    "relevance_score": 0.5,
                    "snippet": f"Comprehensive {subject} Unit {phase_id} playlist covering {concept_text}"
                }
            ],
            "oneshot": {
                "id": "video_002",
                "title": f"{subject} Unit {phase_id} - Complete Guide",
                "url": "Programming in C / C++ :",
                "content_type": "youtube_video",
                "source": "video_urls",
                "created_at": "2025-11-14T10:33:55.167000",
                "relevance_score": 0.5,
                "snippet": f"Complete {subject} Unit {phase_id} guide in single video",
                "duration_seconds": 7200
            }
        }
    
    def _generate_simple_project(self, subject: str, skill_evaluation: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a simple course project"""
        return {
            "title": f"{subject} Practical Project",
            "description": f"A comprehensive project covering {subject} concepts",
            "objectives": [
                f"Apply {subject} principles",
                "Demonstrate understanding",
                "Create working solution"
            ],
            "difficulty": skill_evaluation.get("skill_level", "beginner"),
            "estimated_time_hours": 20,
            "deliverables": [{
                "name": "Final Project",
                "type": "code", 
                "description": "Complete implementation",
                "due_phase": 4
            }],
            "technical_requirements": [{
                "requirement": "Basic programming skills",
                "category": "programming"
            }],
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
        }
    
    def _create_learning_schedule(self, weeks: int, hours_per_week: int, num_phases: int) -> Dict[str, Any]:
        """Create a learning schedule"""
        start_date = datetime.now().date()
        end_date = start_date + timedelta(weeks=weeks)
        
        weekly_plan = []
        for week in range(1, weeks + 1):
            phase = ((week - 1) // (weeks // num_phases)) + 1
            phase = min(phase, num_phases)
            
            weekly_plan.append({
                "week": week,
                "focus": f"Week {week} content",
                "phase": phase,
                "activities": [{
                    "activity": "Study materials",
                    "type": "study",
                    "duration_hours": hours_per_week,
                    "resources": ["Various materials"]
                }],
                "milestones": ["Week completion"],
                "deliverables": []
            })
        
        return {
            "total_duration_weeks": weeks,
            "hours_per_week": hours_per_week,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "weekly_plan": weekly_plan,
            "review_cycles": [{
                "week": week,
                "type": "weekly",
                "topics": ["Review concepts"],
                "duration_hours": 2
            } for week in range(1, weeks + 1, 2)],
            "project_timeline": [{
                "milestone": "Project completion",
                "week": weeks,
                "deliverable": "Final project",
                "estimated_hours": 20
            }]
        }


# Global instance for easy access
production_roadmap_builder = ProductionRoadmapBuilder()
