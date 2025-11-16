"""
Production Integrated Roadmap Generator
=======================================

This is the main roadmap generator that integrates all production-ready agents:
- Interview Agent (LLM-based)
- Skill Evaluator Agent (LLM-based) 
- Gap Detector Agent (LLM-based)
- Prerequisite Graph Agent (LLM-based)
- Difficulty Estimator Agent (LLM-based)
- RAG PES Material Retrieval Agent (RAG + LLM)
- RAG Reference Book Retrieval Agent (RAG + LLM)
- YouTube Video Retrieval Agent (API + LLM fallback)
- Project Generator Agent (LLM-based)
- Time Planner Agent (LLM-based)

Created: November 16, 2025
Purpose: Unified roadmap generation with all production agents
"""

import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional

from agents.base_agent import BaseAgent, AgentState
from agents.interview_agent import InterviewAgent
from agents.skill_evaluator_agent import SkillEvaluatorAgent
from agents.gap_detector_agent import GapDetectorAgent
from agents.prerequisite_graph_agent import PrerequisiteGraphAgent
from agents.difficulty_estimator_agent import DifficultyEstimatorAgent
from agents.production_rag_pes_agent import ProductionRAGPESMaterialAgent
from agents.production_rag_reference_book_agent import ProductionRAGReferenceBookAgent
from agents.youtube_video_agent import YouTubeVideoSearchAgent
from agents.production_project_generator_agent import ProductionProjectGeneratorAgent
from agents.production_time_planner_agent import ProductionTimePlannerAgent

logger = logging.getLogger(__name__)

class ProductionRoadmapOrchestrator(BaseAgent):
    """Production Roadmap Orchestrator - Integrates all production agents"""
    
    def __init__(self):
        super().__init__("ProductionRoadmapOrchestrator", temperature=0.2, max_tokens=1000)
        
        # Initialize all production agents
        self.interview_agent = InterviewAgent()
        self.skill_evaluator = SkillEvaluatorAgent()
        self.gap_detector = GapDetectorAgent()
        self.prerequisite_graph = PrerequisiteGraphAgent()
        self.difficulty_estimator = DifficultyEstimatorAgent()
        self.pes_retrieval = ProductionRAGPESMaterialAgent()
        self.reference_book_retrieval = ProductionRAGReferenceBookAgent()
        self.video_retrieval = YouTubeVideoSearchAgent()
        self.project_generator = ProductionProjectGeneratorAgent()
        self.time_planner = ProductionTimePlannerAgent()
        
    async def generate_complete_roadmap(
        self,
        subject: str,
        user_background: Optional[str] = None,
        target_expertise: Optional[str] = None,
        time_constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete learning roadmap using all production agents
        
        Args:
            subject: Target subject to learn
            user_background: User's background information
            target_expertise: Desired expertise level
            time_constraints: Time and schedule constraints
            
        Returns:
            Complete roadmap with all components
        """
        try:
            logger.info(f"🚀 Starting complete roadmap generation for: {subject}")
            start_time = datetime.now()
            
            # Initialize state
            state = AgentState(session_id="roadmap_generation", user_id="system")
            state.data["subject"] = subject
            state.data["user_background"] = user_background or "No specific background provided"
            state.data["target_expertise"] = target_expertise or "Intermediate"
            state.data["time_constraints"] = time_constraints or {"hours_per_week": 10}
            
            roadmap = {
                "subject": subject,
                "generation_metadata": {
                    "started_at": start_time.isoformat(),
                    "agent_version": "production_v2.0",
                    "pipeline_type": "fully_integrated"
                },
                "phases": [],
                "resources": {
                    "pes_materials": {},
                    "reference_books": {},
                    "videos": {},
                    "projects": {},
                    "learning_schedule": {}
                }
            }
            state.data["roadmap"] = roadmap
            
            # Step 1: Conduct Interview
            logger.info("📝 Step 1: Conducting user interview...")
            state = self.interview_agent.process(state)
            
            if state.data.get("status") == "failed":
                raise ValueError(f"Interview failed: {state.data.get('error')}")
            
            interview_result = state.data.get("interview_result", {})
            logger.info(f"Interview completed: {len(interview_result.get('questions', []))} questions processed")
            
            # Step 2: Skill Evaluation
            logger.info("🎯 Step 2: Evaluating user skills...")
            state = self.skill_evaluator.process(state)
            
            if state.data.get("status") == "failed":
                raise ValueError(f"Skill evaluation failed: {state.data.get('error')}")
            
            skill_assessment = state.data.get("skill_assessment", {})
            current_level = skill_assessment.get("overall_level", "Beginner")
            logger.info(f"Skill evaluation completed: {current_level} level")
            
            # Step 3: Gap Detection
            logger.info("🔍 Step 3: Detecting knowledge gaps...")
            state = self.gap_detector.process(state)
            
            if state.data.get("status") == "failed":
                raise ValueError(f"Gap detection failed: {state.data.get('error')}")
            
            gap_analysis = state.data.get("gap_analysis", {})
            learning_gaps = gap_analysis.get("critical_gaps", [])
            logger.info(f"Gap detection completed: {len(learning_gaps)} critical gaps identified")
            
            # Step 4: Prerequisite Graph
            logger.info("📊 Step 4: Building prerequisite graph...")
            state = self.prerequisite_graph.process(state)
            
            if state.data.get("status") == "failed":
                raise ValueError(f"Prerequisite graph failed: {state.data.get('error')}")
            
            prerequisite_graph = state.data.get("prerequisite_graph", {})
            learning_phases = prerequisite_graph.get("learning_phases", [])
            logger.info(f"Prerequisite graph completed: {len(learning_phases)} learning phases")
            
            # Step 5: Difficulty Estimation
            logger.info("📈 Step 5: Estimating phase difficulties...")
            state = self.difficulty_estimator.process(state)
            
            if state.data.get("status") == "failed":
                raise ValueError(f"Difficulty estimation failed: {state.data.get('error')}")
            
            difficulty_analysis = state.data.get("difficulty_analysis", {})
            logger.info("Difficulty estimation completed")
            
            # Step 6: Resource Retrieval (PES, Books, Videos)
            logger.info("📚 Step 6: Retrieving learning resources...")
            
            # Process each phase for resource retrieval
            phases_with_resources = []
            
            for phase in learning_phases:
                phase_id = phase.get("phase_id", 1)
                phase_concepts = phase.get("concepts", [])
                phase_difficulty = phase.get("difficulty", "Beginner")
                
                logger.info(f"Processing Phase {phase_id}: {phase.get('title', 'Unknown')}")
                
                # Set current phase in state
                state.data["current_phase"] = phase_id
                state.data["phase_concepts"] = phase_concepts
                state.data["phase_difficulty"] = phase_difficulty
                
                # 6a: RAG PES Materials
                logger.info(f"  📄 Retrieving PES materials for Phase {phase_id}...")
                state = self.pes_retrieval.process(state)
                
                # 6b: RAG Reference Books
                logger.info(f"  📖 Retrieving reference books for Phase {phase_id}...")
                state = self.reference_book_retrieval.process(state)
                
                # 6c: YouTube Videos  
                logger.info(f"  🎥 Retrieving videos for Phase {phase_id}...")
                try:
                    # Use YouTube video search agent
                    video_query = f"{subject} {' '.join(phase_concepts[:3])}"
                    video_results = await self.video_retrieval.search_videos(video_query, max_results=5)
                    
                    # Store video results in roadmap format
                    roadmap = state.data.get("roadmap", {})
                    if "videos" not in roadmap:
                        roadmap["videos"] = {}
                    
                    roadmap["videos"][f"phase_{phase_id}"] = {
                        "results": video_results,
                        "meta": {
                            "query": video_query,
                            "phase": phase_id,
                            "total_found": len(video_results)
                        }
                    }
                    state.data["roadmap"] = roadmap
                    
                except Exception as e:
                    logger.warning(f"Video retrieval failed for Phase {phase_id}: {e}")
                    # Create empty result structure
                    roadmap = state.data.get("roadmap", {})
                    if "videos" not in roadmap:
                        roadmap["videos"] = {}
                    roadmap["videos"][f"phase_{phase_id}"] = {
                        "results": [],
                        "meta": {"error": str(e), "phase": phase_id}
                    }
                    state.data["roadmap"] = roadmap
                
                # Add resource counts to phase
                roadmap = state.data.get("roadmap", {})
                pes_materials = roadmap.get("pes_materials", {}).get(f"phase_{phase_id}", {})
                reference_books = roadmap.get("reference_books", {}).get(f"phase_{phase_id}", {})
                videos = roadmap.get("videos", {}).get(f"phase_{phase_id}", {})
                
                pes_count = len(pes_materials.get("results", [])) if pes_materials.get("results") else 0
                book_count = 1 if reference_books.get("result") else 0
                video_count = len(videos.get("results", [])) if videos.get("results") else 0
                
                phase["resources"] = {
                    "pes_materials_count": pes_count,
                    "reference_books_count": book_count,
                    "videos_count": video_count
                }
                
                phases_with_resources.append(phase)
                logger.info(f"  ✅ Phase {phase_id} resources: {pes_count} PES, {book_count} books, {video_count} videos")
            
            # Update roadmap phases
            state.data["roadmap"]["phases"] = phases_with_resources
            
            # Step 7: Project Generation
            logger.info("🛠️ Step 7: Generating course project...")
            state = self.project_generator.process(state)
            
            if state.data.get("status") == "failed":
                logger.warning(f"Project generation failed: {state.data.get('error')}")
            else:
                course_project = state.data.get("course_project", {})
                logger.info(f"Project generation completed: {course_project.get('project', {}).get('title', 'Unknown')}")
            
            # Step 8: Time Planning
            logger.info("⏰ Step 8: Creating learning schedule...")
            state = self.time_planner.process(state)
            
            if state.data.get("status") == "failed":
                logger.warning(f"Time planning failed: {state.data.get('error')}")
            else:
                learning_schedule = state.data.get("learning_schedule", {})
                schedule_weeks = learning_schedule.get("learning_schedule", {}).get("total_duration_weeks", 0)
                logger.info(f"Time planning completed: {schedule_weeks}-week schedule")
            
            # Step 9: Final Assembly
            logger.info("🔧 Step 9: Assembling final roadmap...")
            
            final_roadmap = state.data.get("roadmap", {})
            
            # Add generation metadata
            end_time = datetime.now()
            generation_time = (end_time - start_time).total_seconds()
            
            final_roadmap["generation_metadata"].update({
                "completed_at": end_time.isoformat(),
                "generation_time_seconds": generation_time,
                "total_phases": len(phases_with_resources),
                "agents_used": [
                    "interview", "skill_evaluator", "gap_detector", "prerequisite_graph",
                    "difficulty_estimator", "rag_pes_retrieval", "rag_reference_book_retrieval", 
                    "video_retrieval", "project_generator", "time_planner"
                ]
            })
            
            # Add summary statistics
            total_pes = sum(phase.get("resources", {}).get("pes_materials_count", 0) for phase in phases_with_resources)
            total_books = sum(phase.get("resources", {}).get("reference_books_count", 0) for phase in phases_with_resources)
            total_videos = sum(phase.get("resources", {}).get("videos_count", 0) for phase in phases_with_resources)
            
            final_roadmap["summary"] = {
                "subject": subject,
                "user_level": current_level,
                "total_phases": len(phases_with_resources),
                "total_resources": {
                    "pes_materials": total_pes,
                    "reference_books": total_books,
                    "videos": total_videos
                },
                "estimated_duration_weeks": learning_schedule.get("learning_schedule", {}).get("total_duration_weeks", 8),
                "generation_time_minutes": round(generation_time / 60, 2)
            }
            
            logger.info(f"🎉 Complete roadmap generated successfully in {generation_time:.1f}s")
            logger.info(f"📊 Final stats: {len(phases_with_resources)} phases, {total_pes} PES materials, {total_books} books, {total_videos} videos")
            
            return final_roadmap
            
        except Exception as e:
            logger.error(f"Roadmap generation failed: {e}")
            raise ValueError(f"Complete roadmap generation failed: {str(e)}")

async def generate_roadmap_for_subject(subject: str, **kwargs) -> Dict[str, Any]:
    """
    Convenience function to generate a roadmap for a subject
    
    Args:
        subject: Subject to generate roadmap for
        **kwargs: Additional parameters (user_background, target_expertise, etc.)
        
    Returns:
        Complete roadmap dictionary
    """
    orchestrator = ProductionRoadmapOrchestrator()
    return await orchestrator.generate_complete_roadmap(subject, **kwargs)

def process(self, state: AgentState) -> AgentState:
    """Process method for BaseAgent compatibility"""
    # This orchestrator is primarily used via generate_complete_roadmap
    # but we provide this for interface compliance
    try:
        subject = state.data.get("subject", "Unknown Subject")
        
        # Run async generation
        result = asyncio.run(self.generate_complete_roadmap(subject))
        
        state.data["roadmap"] = result
        state.data["status"] = "completed"
        
        return state
        
    except Exception as e:
        logger.error(f"Orchestrator process failed: {e}")
        state.data["status"] = "failed"
        state.data["error"] = str(e)
        return state
