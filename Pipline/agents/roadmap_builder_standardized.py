"""
Standardized Roadmap Builder Agent
=================================

Implements the 4-phase roadmap structure with normalized metadata objects
as specified in the TODO. Orchestrates multiple agents to build comprehensive
learning roadmaps including interview pipeline integration.
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
from core.ollama_service import ollama_service
from agents.standardized_agents import retrieval_agents
from agents.interview_pipeline import (
    interview_agent, skill_evaluator, gap_detector, 
    prerequisite_graph, difficulty_estimator, project_generator, time_planner
)

logger = logging.getLogger(__name__)

class StandardizedRoadmapBuilder:
    """Builds 4-phase structured roadmaps with full metadata integration"""
    
    def __init__(self):
        self.vector_db = VectorDBManager(persist_directory="./chromadb")
        self.db = db_manager.get_database()
    
    async def build_course_roadmap(
        self,
        course_name: str,
        course_code: str = "",
        subject: str = "",
        total_hours: int = 60,
        user_level: str = "beginner"
    ) -> Dict[str, Any]:
        """
        Build a complete 4-phase course roadmap
        
        Args:
            course_name: Name of the course (e.g., "Operating Systems")
            course_code: Course code (e.g., "CS402")
            subject: Subject area for PES material filtering
            total_hours: Total estimated course duration
            user_level: User's current level (beginner/intermediate/advanced)
        
        Returns:
            Complete roadmap JSON with 4 phases
        """
        try:
            # Phase configuration with progressive difficulty
            phase_configs = [
                {
                    "phase_id": 1,
                    "phase_title": f"Foundations of {course_name}",
                    "estimated_hours": int(total_hours * 0.2),  # 20%
                    "difficulty": "Beginner",
                    "unit": 1,
                    "concepts": ["basics", "introduction", "fundamentals"]
                },
                {
                    "phase_id": 2,
                    "phase_title": "Core Concepts",
                    "estimated_hours": int(total_hours * 0.25),  # 25%
                    "difficulty": "Intermediate",
                    "unit": 2,
                    "concepts": ["core", "implementation", "algorithms"]
                },
                {
                    "phase_id": 3,
                    "phase_title": "Advanced Topics",
                    "estimated_hours": int(total_hours * 0.25),  # 25%
                    "difficulty": "Intermediate",
                    "unit": 3,
                    "concepts": ["advanced", "optimization", "design"]
                },
                {
                    "phase_id": 4,
                    "phase_title": "Expert Applications",
                    "estimated_hours": int(total_hours * 0.3),   # 30%
                    "difficulty": "Advanced",
                    "unit": 4,
                    "concepts": ["expert", "applications", "systems"]
                }
            ]
            
            # Build phases concurrently for better performance
            phases = []
            for config in phase_configs:
                phase = await self._build_phase(
                    config=config,
                    course_name=course_name,
                    subject=subject or course_name
                )
                phases.append(phase)
            
            # Assemble final roadmap
            roadmap = {
                "course_name": course_name,
                "course_code": course_code or f"{course_name[:2].upper()}401",
                "overall_duration_hours": total_hours,
                "phases": phases,
                "meta": {
                    "generated_on": datetime.now().isoformat(),
                    "course_subject": subject or course_name,
                    "total_phases": len(phases),
                    "agent_version": "1.0",
                    "user_level": user_level
                }
            }
            
            return roadmap
            
        except Exception as e:
            logger.error(f"Roadmap building error: {e}")
            return {
                "course_name": course_name,
                "error": str(e),
                "phases": [],
                "meta": {
                    "generated_on": datetime.now().isoformat(),
                    "error": True
                }
            }
    
    async def _build_phase(
        self,
        config: Dict[str, Any],
        course_name: str,
        subject: str
    ) -> Dict[str, Any]:
        """
        Build a single phase with all required resources
        
        Args:
            config: Phase configuration (id, title, hours, difficulty, unit, concepts)
            course_name: Course name for resource search
            subject: Subject for PES material filtering
        
        Returns:
            Complete phase object with all resources
        """
        phase_id = config["phase_id"]
        unit = config["unit"]
        concepts = config["concepts"]
        difficulty = config["difficulty"]
        
        # Build phase structure
        phase = {
            "phase_id": phase_id,
            "phase_title": config["phase_title"],
            "estimated_hours": config["estimated_hours"],
            "difficulty": difficulty,
            "pes_materials": [],
            "reference_book": None,
            "videos": {
                "playlists": [],
                "oneshot": None
            },
            "project": None
        }
        
        try:
            # 1. Get PES Materials for this unit
            phase["pes_materials"] = await self._get_pes_materials(
                subject=subject,
                unit=unit
            )
            
            # 2. Get best reference book for phase concepts
            phase["reference_book"] = await self._get_reference_book(
                concepts=concepts,
                difficulty=difficulty,
                course_name=course_name
            )
            
            # 3. Get videos (2 playlists + 1 oneshot)
            phase["videos"] = await self._get_phase_videos(
                concepts=concepts,
                course_name=course_name,
                unit=unit
            )
            
            # 4. Generate project
            phase["project"] = await self._generate_project(
                phase_config=config,
                pes_materials=phase["pes_materials"],
                reference_book=phase["reference_book"],
                course_name=course_name
            )
            
        except Exception as e:
            logger.error(f"Phase {phase_id} building error: {e}")
            phase["error"] = str(e)
        
        return phase
    
    async def _get_pes_materials(
        self,
        subject: str,
        unit: int
    ) -> List[Dict[str, Any]]:
        """Get PES materials for specific unit"""
        try:
            # Query MongoDB directly for PES materials
            materials = []
            cursor = self.db[Settings.MATERIALS_COLLECTION].find({
                "subject": {"$regex": subject, "$options": "i"},
                "unit": unit
            }).limit(5)
            
            for material in cursor:
                # Convert to standardized metadata format
                metadata_obj = MetadataBuilder.build_document_metadata(
                    mongo_doc=material,
                    semantic_score=0.9,  # High score for exact unit match
                    relevance_score=0.95,  # Very relevant for phase
                    snippet=f"Unit {unit} material for {subject}"
                )
                materials.append(metadata_obj)
            
            return materials
            
        except Exception as e:
            logger.error(f"PES materials error for unit {unit}: {e}")
            return []
    
    async def _get_reference_book(
        self,
        concepts: List[str],
        difficulty: str,
        course_name: str
    ) -> Optional[Dict[str, Any]]:
        """Get the best reference book for phase concepts"""
        try:
            # Use book search agent to find relevant books
            search_query = f"{course_name} {' '.join(concepts)} {difficulty}"
            book_results = await retrieval_agents.book_search_agent(
                query=search_query,
                k=3
            )
            
            if book_results.get("results"):
                # Take the highest scoring book
                best_book = book_results["results"][0]
                
                # Add recommended chapters based on concepts
                best_book["recommended_chapters"] = self._get_recommended_chapters(
                    concepts=concepts,
                    difficulty=difficulty
                )
                
                return best_book
            
            return None
            
        except Exception as e:
            logger.error(f"Reference book error for {concepts}: {e}")
            return None
    
    async def _get_phase_videos(
        self,
        concepts: List[str],
        course_name: str,
        unit: int
    ) -> Dict[str, Any]:
        """Get videos for phase (2 playlists + 1 oneshot)"""
        try:
            videos = {
                "playlists": [],
                "oneshot": None
            }
            
            # Search for playlists
            playlist_query = f"{course_name} {' '.join(concepts)} playlist tutorial series"
            video_results = await retrieval_agents.video_search_agent(
                query=playlist_query,
                k=5
            )
            
            if video_results.get("results"):
                # Convert first 2 results to playlists (simulate playlist detection)
                for i, video in enumerate(video_results["results"][:2]):
                    playlist = {
                        "id": f"playlist_{course_name.lower()}_{unit}_{i+1}",
                        "title": f"{video['title']} (Playlist)",
                        "url": video["url"],
                        "content_type": "youtube_playlist",
                        "video_count": 15 + (i * 5),  # Simulated playlist size
                        "total_duration_seconds": 3600 + (i * 1800),  # Simulated duration
                        "relevance_score": video["relevance_score"],
                        "snippet": f"Playlist covering {' '.join(concepts)}"
                    }
                    videos["playlists"].append(playlist)
                
                # Use 3rd result as oneshot video
                if len(video_results["results"]) > 2:
                    oneshot_video = video_results["results"][2].copy()
                    oneshot_video["content_type"] = "youtube_video"
                    oneshot_video["snippet"] = f"Comprehensive {course_name} overview"
                    videos["oneshot"] = oneshot_video
            
            return videos
            
        except Exception as e:
            logger.error(f"Phase videos error for {concepts}: {e}")
            return {"playlists": [], "oneshot": None}
    
    async def _generate_project(
        self,
        phase_config: Dict[str, Any],
        pes_materials: List[Dict[str, Any]],
        reference_book: Optional[Dict[str, Any]],
        course_name: str
    ) -> Optional[Dict[str, Any]]:
        """Generate a project for the phase"""
        try:
            phase_id = phase_config["phase_id"]
            difficulty = phase_config["difficulty"]
            concepts = phase_config["concepts"]
            
            # Build project prompt
            project_prompt = f"""Generate a {difficulty} level project for Phase {phase_id} of {course_name}.

Phase concepts: {', '.join(concepts)}
Available resources: {len(pes_materials)} PES materials, {1 if reference_book else 0} reference book

Create a practical project that:
1. Reinforces the phase concepts
2. Has appropriate {difficulty} complexity
3. Can be completed in {phase_config['estimated_hours'] // 2} hours
4. Provides hands-on learning

Return ONLY a JSON object:
{{
  "project_id": "proj_phase{phase_id}_{phase_id:03d}",
  "title": "Project Name ({difficulty})",
  "objective": "Clear project goal",
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "estimated_time_hours": {phase_config['estimated_hours'] // 2},
  "resources_needed": ["Resource 1", "Resource 2"],
  "skills_practiced": ["Skill 1", "Skill 2"],
  "complexity": "{difficulty}",
  "deliverables": ["Deliverable 1", "Deliverable 2"]
}}"""
            
            # Call LLM to generate project
            response = await ollama_service.generate_response(
                prompt=project_prompt,
                temperature=0.3
            )
            
            try:
                project_data = json.loads(response)
                return project_data
            except json.JSONDecodeError:
                # Fallback project if LLM fails
                return {
                    "project_id": f"proj_phase{phase_id}_{phase_id:03d}",
                    "title": f"{course_name} Project Phase {phase_id} ({difficulty})",
                    "objective": f"Apply {course_name} concepts from Phase {phase_id}",
                    "requirements": [
                        f"Study Phase {phase_id} materials",
                        f"Implement {difficulty.lower()} solution",
                        "Document the implementation"
                    ],
                    "estimated_time_hours": phase_config["estimated_hours"] // 2,
                    "resources_needed": ["PES materials", "Reference book"],
                    "skills_practiced": concepts,
                    "complexity": difficulty,
                    "deliverables": ["Working implementation", "Documentation"]
                }
            
        except Exception as e:
            logger.error(f"Project generation error: {e}")
            return None
    
    def _get_recommended_chapters(
        self,
        concepts: List[str],
        difficulty: str
    ) -> List[str]:
        """Get recommended chapters based on concepts and difficulty"""
        # Simple mapping based on phase progression
        if "basics" in concepts or "fundamentals" in concepts:
            return ["Chapter 1", "Chapter 2"]
        elif "core" in concepts or "implementation" in concepts:
            return ["Chapter 3", "Chapter 4"]
        elif "advanced" in concepts or "optimization" in concepts:
            return ["Chapter 5", "Chapter 6"]
        elif "expert" in concepts or "applications" in concepts:
            return ["Chapter 7", "Chapter 8", "Chapter 9"]
        else:
            return ["Chapter 1"]
    
    async def build_interview_driven_roadmap(
        self,
        learning_goal: str,
        subject_area: str,
        interview_answers: Optional[Dict[str, Any]] = None,
        user_constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Build a complete roadmap using the interview pipeline
        
        This is the main orchestration method that implements the full flow:
        Interview → Skill Eval → Gap Detection → Prereq Graph → Difficulty → 
        Retrieval → Project Gen → Time Planner → Final Roadmap JSON
        
        Args:
            learning_goal: What the user wants to learn
            subject_area: Subject domain (e.g., "Operating Systems")
            interview_answers: Pre-collected answers (if available)
            user_constraints: Time, pace, and other constraints
        
        Returns:
            Complete roadmap with course_project and schedule
        """
        try:
            logger.info(f"Starting interview-driven roadmap for: {learning_goal}")
            
            # Step 1: Interview (if answers not provided)
            if not interview_answers:
                logger.info("Generating interview questions...")
                interview_data = await interview_agent.generate_questions(
                    learning_goal=learning_goal,
                    subject_area=subject_area
                )
                # For demo/testing, use sample answers if no real interview
                interview_answers = self._generate_sample_answers(interview_data)
                await interview_agent.process_answers(
                    interview_data["interview_id"], 
                    interview_answers
                )
            
            # Step 2: Skill Evaluation
            logger.info("Evaluating skills from interview answers...")
            skill_evaluation = await skill_evaluator.evaluate_skills(
                interview_id="demo_interview",
                answers=interview_answers
            )
            
            # Step 3: Gap Detection
            logger.info("Detecting knowledge gaps...")
            gap_analysis = await gap_detector.detect_gaps(
                learning_goal=learning_goal,
                skill_evaluation=skill_evaluation,
                target_level="intermediate"
            )
            
            # Step 4: Prerequisite Graph
            logger.info("Building prerequisite graph...")
            prereq_graph = await prerequisite_graph.build_prerequisite_graph(
                learning_goal=learning_goal,
                gap_analysis=gap_analysis
            )
            
            # Step 5: Difficulty Estimation
            logger.info("Estimating difficulty levels...")
            difficulty_estimation = await difficulty_estimator.estimate_difficulty(
                skill_evaluation=skill_evaluation,
                prerequisite_graph=prereq_graph,
                target_goal=learning_goal
            )
            
            # Step 6: Build 4-Phase Roadmap with Resources
            logger.info("Building 4-phase roadmap...")
            phases = await self._build_adaptive_phases(
                learning_goal=learning_goal,
                subject_area=subject_area,
                difficulty_estimation=difficulty_estimation,
                prereq_graph=prereq_graph
            )
            
            # Step 7: Generate Course Project
            logger.info("Generating course project...")
            course_project = await project_generator.generate_course_project(
                learning_goal=learning_goal,
                skill_level=skill_evaluation["skill_evaluation"]["overall_level"],
                prerequisite_graph=prereq_graph,
                phases_content=phases
            )
            
            # Step 8: Create Time Schedule
            logger.info("Creating learning schedule...")
            schedule = await time_planner.generate_schedule(
                phases=phases,
                course_project=course_project,
                user_constraints=user_constraints
            )
            
            # Step 9: Assemble Final Roadmap
            final_roadmap = {
                "roadmap_id": f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "learning_goal": learning_goal,
                "subject_area": subject_area,
                "user_profile": {
                    "skill_level": skill_evaluation["skill_evaluation"]["overall_level"],
                    "strengths": skill_evaluation["skill_evaluation"]["strengths"],
                    "weaknesses": skill_evaluation["skill_evaluation"]["weaknesses"]
                },
                "phases": phases,
                "course_project": course_project["course_project"],
                "learning_schedule": schedule["learning_schedule"],
                "analytics": {
                    "total_phases": len(phases),
                    "total_estimated_hours": sum(p["estimated_duration_hours"] for p in phases),
                    "skill_gaps_identified": len(gap_analysis["gap_analysis"]["identified_gaps"]),
                    "prerequisites_required": len(prereq_graph["prerequisite_graph"]["nodes"])
                },
                "meta": {
                    "generated_at": datetime.now().isoformat(),
                    "pipeline_version": "2.0",
                    "interview_driven": True,
                    "agents_used": [
                        "interview_agent", "skill_evaluator", "gap_detector",
                        "prerequisite_graph", "difficulty_estimator", 
                        "retrieval_agents", "project_generator", "time_planner"
                    ]
                }
            }
            
            # Store final roadmap
            try:
                db = db_manager.get_database()
                if db is not None:
                    collection = db["final_roadmaps"]
                    collection.insert_one(final_roadmap)
            except Exception as storage_error:
                logger.warning(f"Failed to store roadmap: {storage_error}")
            
            logger.info(f"✅ Interview-driven roadmap completed: {final_roadmap['roadmap_id']}")
            return final_roadmap
            
        except Exception as e:
            logger.error(f"Interview-driven roadmap error: {e}")
            # Fallback to basic roadmap
            return await self.build_course_roadmap(
                course_name=learning_goal,
                subject=subject_area
            )
    
    async def _build_adaptive_phases(
        self,
        learning_goal: str,
        subject_area: str,
        difficulty_estimation: Dict[str, Any],
        prereq_graph: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Build phases that adapt to user's skill level and prerequisites"""
        
        # Define 4-phase structure for complete course
        phase_definitions = [
            {
                "phase_id": 1,
                "phase_title": f"Foundations of {learning_goal}",
                "unit": 1,
                "difficulty": "beginner",
                "concepts": ["basics", "introduction", "fundamentals"],
                "estimated_hours": 15
            },
            {
                "phase_id": 2,
                "phase_title": f"Core {learning_goal} Concepts",
                "unit": 2,
                "difficulty": "intermediate",
                "concepts": ["core concepts", "implementation", "algorithms"],
                "estimated_hours": 15
            },
            {
                "phase_id": 3,
                "phase_title": f"Advanced {learning_goal} Topics",
                "unit": 3,
                "difficulty": "intermediate",
                "concepts": ["advanced topics", "optimization", "design patterns"],
                "estimated_hours": 15
            },
            {
                "phase_id": 4,
                "phase_title": f"Expert {learning_goal} Applications",
                "unit": 4,
                "difficulty": "advanced",
                "concepts": ["expert applications", "systems", "real-world projects"],
                "estimated_hours": 15
            }
        ]
        
        # Build each phase with proper resource allocation
        phases = []
        for phase_def in phase_definitions:
            
            # Get PES materials for this specific unit (ONLY pes_materials, no books)
            pes_materials = await self._get_unit_specific_pes_materials(
                subject_area=subject_area,
                unit=phase_def["unit"]
            )
            
            # Get reference books separately (only books, not mixed)
            reference_books = await self._get_phase_reference_books(
                concepts=phase_def["concepts"],
                difficulty=phase_def["difficulty"]
            )
            
            # Get videos with proper structure (2 playlists + 1 oneshot)
            videos = await self._get_phase_videos_structured(
                concepts=phase_def["concepts"],
                course_name=learning_goal,
                unit=phase_def["unit"]
            )
            
            # Build phase with corrected structure
            phase = {
                "phase_id": phase_def["phase_id"],
                "phase_title": phase_def["phase_title"],
                "estimated_duration_hours": phase_def["estimated_hours"],
                "difficulty": phase_def["difficulty"],
                "learning_objectives": [
                    f"Master {concept}" for concept in phase_def["concepts"][:3]
                ],
                "resources": {
                    "pes_materials": pes_materials,  # ONLY PES materials for this unit
                    "reference_books": reference_books,  # ONLY books
                    "videos": videos  # Properly structured videos
                },
                "concepts": phase_def["concepts"],
                "prerequisites": self._extract_phase_prerequisites(prereq_graph, phase_def["phase_id"]),
                "assessments": [
                    {
                        "type": "quiz",
                        "topic": " ".join(phase_def["concepts"][:2]),
                        "estimated_time": "30 minutes"
                    }
                ]
            }
            phases.append(phase)
        
        return phases
    
    async def _get_unit_specific_pes_materials(
        self,
        subject_area: str,
        unit: int
    ) -> List[Dict[str, Any]]:
        """Get ONLY PES materials for specific unit (no books mixed in)"""
        try:
            # Use PDF search but filter for PES materials only
            pes_query = f"{subject_area} unit {unit}"
            pdf_results = await retrieval_agents.pdf_search_agent(
                query=pes_query,
                k=10  # Get more to filter
            )
            
            # Filter to keep ONLY pes_material content_type
            pes_only = []
            if pdf_results.get("results"):
                for result in pdf_results["results"]:
                    if result.get("content_type") == "pes_material" and result.get("unit") == unit:
                        pes_only.append(result)
                    
                    # Limit to 3-5 PES materials per unit
                    if len(pes_only) >= 5:
                        break
            
            return pes_only
            
        except Exception as e:
            logger.error(f"PES materials error for unit {unit}: {e}")
            return []
    
    async def _get_phase_reference_books(
        self,
        concepts: List[str],
        difficulty: str
    ) -> List[Dict[str, Any]]:
        """Get ONLY reference books for phase (no PES materials mixed in)"""
        try:
            # Search for books using book search agent
            book_query = " ".join(concepts)
            book_results = await retrieval_agents.book_search_agent(
                query=book_query,
                k=5
            )
            
            # Filter to keep ONLY reference_book content_type
            books_only = []
            if book_results.get("results"):
                for result in book_results["results"]:
                    if result.get("content_type") == "reference_book":
                        # Add recommended chapters
                        result["recommended_chapters"] = self._get_recommended_chapters_for_concepts(concepts)
                        books_only.append(result)
                    
                    # Limit to 2 books per phase
                    if len(books_only) >= 2:
                        break
            
            return books_only
            
        except Exception as e:
            logger.error(f"Reference books error for {concepts}: {e}")
            return []
    
    async def _get_phase_videos_structured(
        self,
        concepts: List[str],
        course_name: str,
        unit: int
    ) -> Dict[str, Any]:
        """Get videos with proper structure: 2 playlists + 1 oneshot"""
        try:
            # Search for videos
            video_query = f"{course_name} {' '.join(concepts)} tutorial"
            video_results = await retrieval_agents.video_search_agent(
                query=video_query,
                k=6  # Get enough for 2 playlists + 1 oneshot
            )
            
            videos = {
                "playlists": [],
                "oneshot": None
            }
            
            if video_results.get("results"):
                video_list = video_results["results"]
                
                # Create 2 playlists from first 4 videos (2 videos each simulated playlist)
                for i in range(2):
                    if i < len(video_list):
                        base_video = video_list[i]
                        playlist = {
                            "id": f"playlist_{course_name.lower().replace(' ', '_')}_unit{unit}_{i+1}",
                            "title": f"{course_name} - Unit {unit} Playlist {i+1}",
                            "url": f"https://www.youtube.com/playlist?list=PLAYLIST{unit}_{i+1}",
                            "content_type": "youtube_playlist",
                            "video_count": 12 + (i * 3),  # Different playlist sizes
                            "total_duration_seconds": 4800 + (i * 1200),  # Different durations
                            "relevance_score": base_video.get("relevance_score", 0.8),
                            "snippet": f"Comprehensive {course_name} Unit {unit} playlist covering {' '.join(concepts[:2])}"
                        }
                        videos["playlists"].append(playlist)
                
                # Create 1 oneshot video
                if len(video_list) > 2:
                    oneshot_video = video_list[2].copy()
                    oneshot_video.update({
                        "title": f"{course_name} Unit {unit} - Complete Guide",
                        "content_type": "youtube_video",
                        "duration_seconds": 7200,  # 2 hour comprehensive video
                        "snippet": f"Complete {course_name} Unit {unit} guide in single video"
                    })
                    videos["oneshot"] = oneshot_video
            
            return videos
            
        except Exception as e:
            logger.error(f"Structured videos error for {concepts}: {e}")
            return {"playlists": [], "oneshot": None}
    
    def _get_recommended_chapters_for_concepts(self, concepts: List[str]) -> List[str]:
        """Get recommended chapters based on concepts"""
        if any(word in concepts for word in ["basics", "introduction", "fundamentals"]):
            return ["Chapter 1: Introduction", "Chapter 2: Fundamentals"]
        elif any(word in concepts for word in ["core", "implementation", "algorithms"]):
            return ["Chapter 3: Core Concepts", "Chapter 4: Implementation"]
        elif any(word in concepts for word in ["advanced", "optimization", "design"]):
            return ["Chapter 5: Advanced Topics", "Chapter 6: Optimization"]
        elif any(word in concepts for word in ["expert", "applications", "systems"]):
            return ["Chapter 7: Expert Applications", "Chapter 8: Systems Design"]
        else:
            return ["Chapter 1: Overview"]
    
    def _extract_phase_prerequisites(self, prereq_graph: Dict[str, Any], phase_num: int) -> List[str]:
        """Extract prerequisites relevant to a specific phase"""
        try:
            learning_phases = prereq_graph["prerequisite_graph"]["learning_phases"]
            for phase_info in learning_phases:
                if phase_info["phase"] == phase_num:
                    return phase_info.get("concepts", [])
            return []
        except (KeyError, IndexError):
            return []
    
    def _generate_sample_answers(self, interview_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate sample answers for testing purposes"""
        answers = {}
        
        for question in interview_data.get("questions", []):
            q_id = question["id"]
            q_type = question["type"]
            
            if q_type == "scale":
                answers[q_id] = "3"  # Intermediate level
            elif q_type == "multiple_choice":
                answers[q_id] = question.get("options", ["Some experience"])[0]
            else:  # open_ended
                answers[q_id] = "I have some experience but want to learn more systematically"
        
        return answers

# Global instance for easy import
roadmap_builder = StandardizedRoadmapBuilder()
