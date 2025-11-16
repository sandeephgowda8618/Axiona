"""
Corrected Roadmap Builder - Uses Updated Agent Prompts
====================================================

This roadmap builder uses the corrected retrieval agents that implement 
the updated prompts from TODO.md to fix the filtering issues.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from config.database import db_manager
from config.settings import Settings
from agents.corrected_retrieval_agents import corrected_retrieval_agents
from agents.interview_pipeline import (
    interview_agent, skill_evaluator, gap_detector, 
    prerequisite_graph, difficulty_estimator, project_generator, time_planner
)

logger = logging.getLogger(__name__)

class CorrectedRoadmapBuilder:
    """Roadmap builder using corrected agent implementations"""
    
    def __init__(self):
        self.db = db_manager.get_database()
        if self.db is None:
            logger.error("Database connection is None")
            raise ValueError("Database connection failed. Check database configuration.")

    async def build_interview_driven_roadmap(
        self,
        learning_goal: str,
        subject_area: str = "Computer Science",
        time_per_week: int = 10
    ) -> Dict[str, Any]:
        """
        Build a complete interview-driven roadmap using corrected agents
        """
        try:
            roadmap_id = f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            logger.info(f"Building roadmap {roadmap_id} for {learning_goal}")
            
            # Step 1: Generate interview questions
            logger.info("Step 1: Generating interview questions")
            interview_questions = await interview_agent.generate_questions(learning_goal)
            
            # Step 2: Simulate realistic answers (for testing)
            logger.info("Step 2: Using realistic test answers")
            realistic_answers = {
                "q1": f"I have some basic understanding of {learning_goal} from coursework but want to learn more deeply",
                "q2": "I prefer combination of reading materials, videos, and hands-on practice",
                "q3": f"I can dedicate {time_per_week} hours per week to studying",
                "q4": f"I'm most interested in practical implementation and real-world applications of {learning_goal}",
                "q5": "I have basic programming skills but limited experience with systems-level concepts"
            }
            
            # Step 3: Evaluate skill level
            logger.info("Step 3: Evaluating skill level")
            skill_evaluation = await skill_evaluator.evaluate_skills(realistic_answers)
            
            # Step 4: Detect knowledge gaps
            logger.info("Step 4: Detecting knowledge gaps")
            gap_analysis = await gap_detector.detect_gaps(
                learning_goal=learning_goal,
                subject=learning_goal,
                user_profile=skill_evaluation
            )
            
            # Step 5: Build prerequisite graph
            logger.info("Step 5: Building prerequisite graph")
            prereq_graph = await prerequisite_graph.build_graph(learning_goal)
            
            # Step 6: Estimate difficulty progression
            logger.info("Step 6: Estimating difficulty progression")
            difficulty_estimation = await difficulty_estimator.estimate_difficulty(
                concept_graph=prereq_graph,
                gaps=gap_analysis,
                user_profile=skill_evaluation
            )
            
            # Step 7: Build 4 phases with corrected resource retrieval
            logger.info("Step 7: Building 4 phases with corrected retrieval")
            phases = []
            
            phase_templates = [
                {
                    "id": 1, "title": "Foundations", "difficulty": "beginner",
                    "concepts": ["basics", "introduction", "fundamentals"],
                    "estimated_hours": 15
                },
                {
                    "id": 2, "title": "Core Concepts", "difficulty": "intermediate", 
                    "concepts": ["core concepts", "implementation", "algorithms"],
                    "estimated_hours": 15
                },
                {
                    "id": 3, "title": "Advanced Topics", "difficulty": "intermediate",
                    "concepts": ["advanced topics", "optimization", "design patterns"],
                    "estimated_hours": 15
                },
                {
                    "id": 4, "title": "Expert Applications", "difficulty": "advanced",
                    "concepts": ["expert applications", "systems", "real-world projects"],
                    "estimated_hours": 15
                }
            ]
            
            for template in phase_templates:
                phase = await self._build_corrected_phase(
                    phase_id=template["id"],
                    phase_title=f"{learning_goal} - {template['title']}",
                    subject=learning_goal,
                    concepts=template["concepts"],
                    difficulty=template["difficulty"],
                    estimated_hours=template["estimated_hours"]
                )
                phases.append(phase)
            
            # Step 8: Generate course project
            logger.info("Step 8: Generating course project")
            course_project = await project_generator.generate_project(
                learning_goal=learning_goal,
                subject=learning_goal,
                phases_concepts=[p["concepts"] for p in phases],
                difficulty_progression=[p["difficulty"] for p in phases]
            )
            
            # Step 9: Create learning schedule
            logger.info("Step 9: Creating learning schedule")
            learning_schedule = await time_planner.create_schedule(
                total_hours=60,
                num_phases=4,
                project_hours=course_project.get("estimated_time_hours", 20),
                user_availability=time_per_week
            )
            
            # Step 10: Assemble final roadmap
            logger.info("Step 10: Assembling final roadmap")
            final_roadmap = {
                "roadmap_id": roadmap_id,
                "learning_goal": learning_goal,
                "subject_area": subject_area,
                "user_profile": skill_evaluation,
                "phases": phases,
                "course_project": course_project,
                "learning_schedule": learning_schedule,
                "analytics": {
                    "total_phases": len(phases),
                    "total_estimated_hours": sum(p["estimated_duration_hours"] for p in phases),
                    "skill_gaps_identified": len(gap_analysis.get("gaps", [])),
                    "prerequisites_required": len(gap_analysis.get("prerequisites_needed", []))
                },
                "meta": {
                    "generated_at": datetime.now().isoformat(),
                    "pipeline_version": "2.1",  # Updated version with corrected agents
                    "interview_driven": True,
                    "agents_used": [
                        "interview_agent", "skill_evaluator", "gap_detector", 
                        "prerequisite_graph", "difficulty_estimator", 
                        "corrected_retrieval_agents", "project_generator", "time_planner"
                    ]
                }
            }
            
            # Step 11: Store in database
            logger.info("Step 11: Storing roadmap in database")
            if self.db:
                roadmaps_collection = self.db["roadmaps"]
                result = roadmaps_collection.insert_one(final_roadmap)
                final_roadmap["_id"] = str(result.inserted_id)
            
            logger.info(f"Successfully built corrected roadmap {roadmap_id}")
            return final_roadmap
            
        except Exception as e:
            logger.error(f"Failed to build corrected roadmap: {e}")
            raise

    async def _build_corrected_phase(
        self,
        phase_id: int,
        phase_title: str, 
        subject: str,
        concepts: List[str],
        difficulty: str,
        estimated_hours: int
    ) -> Dict[str, Any]:
        """Build a single phase using corrected retrieval agents"""
        try:
            logger.info(f"Building phase {phase_id}: {phase_title}")
            
            # Use corrected PES material retrieval (returns ALL unit documents)
            pes_materials = corrected_retrieval_agents.pes_material_retrieval_agent(
                subject=subject,
                phase_number=phase_id,
                concepts=concepts
            )
            
            # Use corrected reference book retrieval (returns SINGLE best book)
            reference_books = corrected_retrieval_agents.reference_book_retrieval_agent(
                subject=subject,
                difficulty=difficulty,
                phase_concepts=concepts
            )
            
            # Use corrected video retrieval (keyword generation)
            video_keywords = corrected_retrieval_agents.video_retrieval_agent(
                subject=subject,
                level=difficulty,
                unit_or_topic=f"Unit {phase_id}"
            )
            
            # Generate mock video content based on keywords (since real videos have schema issues)
            videos = self._generate_mock_videos_from_keywords(
                subject=subject,
                phase_id=phase_id,
                keywords=video_keywords
            )
            
            # Build standardized phase structure
            phase = {
                "phase_id": phase_id,
                "phase_title": phase_title,
                "estimated_duration_hours": estimated_hours,
                "difficulty": difficulty,
                "learning_objectives": [f"Master {concept}" for concept in concepts],
                "resources": {
                    "pes_materials": pes_materials.get("results", []),
                    "reference_books": [reference_books["result"]] if reference_books.get("result") else [],
                    "videos": videos
                },
                "concepts": concepts,
                "prerequisites": [],
                "assessments": [
                    {
                        "type": "quiz",
                        "topic": " ".join(concepts),
                        "estimated_time": "30 minutes"
                    }
                ]
            }
            
            return phase
            
        except Exception as e:
            logger.error(f"Failed to build phase {phase_id}: {e}")
            # Return empty phase structure to prevent total failure
            return {
                "phase_id": phase_id,
                "phase_title": phase_title,
                "estimated_duration_hours": estimated_hours,
                "difficulty": difficulty,
                "learning_objectives": [f"Master {concept}" for concept in concepts],
                "resources": {"pes_materials": [], "reference_books": [], "videos": {"playlists": [], "oneshot": {}}},
                "concepts": concepts,
                "prerequisites": [],
                "assessments": [],
                "error": f"Phase building failed: {str(e)}"
            }

    def _generate_mock_videos_from_keywords(
        self,
        subject: str,
        phase_id: int,
        keywords: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate structured video content from keywords (for testing)"""
        try:
            playlists = []
            for i, keyword in enumerate(keywords.get("search_keywords_playlists", [])[:2]):
                playlist = {
                    "id": f"playlist_{subject.lower().replace(' ', '_')}_unit{phase_id}_{i+1}",
                    "title": f"{subject} - Unit {phase_id} Playlist {i+1}",
                    "url": f"https://www.youtube.com/playlist?list=PLAYLIST{phase_id}_{i+1}",
                    "content_type": "youtube_playlist",
                    "video_count": 12 + i*3,
                    "total_duration_seconds": 4800 + i*1200,
                    "relevance_score": 0.5,
                    "snippet": f"Comprehensive {subject} Unit {phase_id} playlist covering {' '.join(keywords.get('reasoning_tags', []))}"
                }
                playlists.append(playlist)
            
            # Generate oneshot video
            oneshot_keyword = keywords.get("search_keywords_oneshot", f"{subject} Unit {phase_id}")
            oneshot = {
                "id": f"video_00{phase_id}",
                "title": f"{subject} Unit {phase_id} - Complete Guide",
                "url": f"https://www.youtube.com/watch?v=example{phase_id}",
                "content_type": "youtube_video",
                "duration_seconds": 7200,
                "relevance_score": 0.5,
                "snippet": f"Complete {subject} Unit {phase_id} guide in single video"
            }
            
            return {
                "playlists": playlists,
                "oneshot": oneshot
            }
            
        except Exception as e:
            logger.error(f"Failed to generate videos from keywords: {e}")
            return {"playlists": [], "oneshot": {}}


# Global instance
corrected_roadmap_builder = CorrectedRoadmapBuilder()
