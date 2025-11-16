"""
Complete LangGraph Workflow Implementation
==========================================

Implements the full educational roadmap generation pipeline using LangGraph
with all agents, statistics tracking, and standardized JSON schemas.
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    from langgraph.graph import StateGraph, END
except ImportError:
    # Fallback for development
    class StateGraph:
        def __init__(self, state_schema): pass
        def add_node(self, name, func): pass
        def add_edge(self, from_node, to_node): pass
        def set_entry_point(self, node): pass
        def compile(self): return self
        
    END = "__end__"

from .state import RoadmapState, create_initial_state
from .complete_agents import (
    interview_node, skill_evaluation_node, gap_detection_node,
    prerequisite_graph_node, pes_retrieval_node, reference_book_retrieval_node,
    video_retrieval_node, project_generation_node, time_planning_node,
    roadmap_stats
)
from core.db_manager import db_manager

logger = logging.getLogger(__name__)

class EducationalRoadmapWorkflow:
    """Complete LangGraph workflow for educational roadmap generation"""
    
    def __init__(self):
        self.graph = None
        self.compiled_workflow = None
        self.stats = roadmap_stats
        self._build_graph()
    
    def _build_graph(self):
        """Build the complete LangGraph workflow"""
        try:
            # Create the state graph
            workflow = StateGraph(RoadmapState)
            
            # Add all agent nodes
            workflow.add_node("interview", interview_node)
            workflow.add_node("skill_evaluation", skill_evaluation_node)  
            workflow.add_node("gap_detection", gap_detection_node)
            workflow.add_node("prerequisite_graph", prerequisite_graph_node)
            workflow.add_node("pes_retrieval", pes_retrieval_node)
            workflow.add_node("reference_book_retrieval", reference_book_retrieval_node)
            workflow.add_node("video_retrieval", video_retrieval_node)
            workflow.add_node("project_generation", project_generation_node)
            workflow.add_node("time_planning", time_planning_node)
            workflow.add_node("final_assembly", self._final_assembly_node)
            
            # Define the workflow sequence
            workflow.set_entry_point("interview")
            
            # Sequential execution with proper dependencies
            workflow.add_edge("interview", "skill_evaluation")
            workflow.add_edge("skill_evaluation", "gap_detection") 
            workflow.add_edge("gap_detection", "prerequisite_graph")
            
            # Resource retrieval in sequence (can be parallelized later)
            workflow.add_edge("prerequisite_graph", "pes_retrieval")
            workflow.add_edge("pes_retrieval", "reference_book_retrieval")
            workflow.add_edge("reference_book_retrieval", "video_retrieval")
            
            # Project and timeline generation
            workflow.add_edge("video_retrieval", "project_generation")
            workflow.add_edge("project_generation", "time_planning")
            
            # Final assembly and completion
            workflow.add_edge("time_planning", "final_assembly")
            workflow.add_edge("final_assembly", END)
            
            # Compile the workflow
            self.graph = workflow
            self.compiled_workflow = workflow.compile()
            
            logger.info("🎯 LangGraph workflow compiled successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to build workflow: {e}")
            # Create a mock workflow for development
            self.graph = None
            self.compiled_workflow = self._create_mock_workflow()
    
    def _create_mock_workflow(self):
        """Create a mock workflow for development when LangGraph is not available"""
        class MockWorkflow:
            async def ainvoke(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
                # Execute nodes sequentially
                state = initial_state.copy()
                
                # Execute the pipeline manually
                state = await interview_node(state)
                state = await skill_evaluation_node(state)
                state = await gap_detection_node(state)
                state = await prerequisite_graph_node(state)
                state = await pes_retrieval_node(state)
                state = await reference_book_retrieval_node(state)
                state = await video_retrieval_node(state)
                state = await project_generation_node(state)
                state = await time_planning_node(state)
                
                # Final assembly
                workflow = EducationalRoadmapWorkflow()
                state = await workflow._final_assembly_node(state)
                
                return state
        
        logger.warning("⚠️ Using mock workflow for development")
        return MockWorkflow()
    
    async def _final_assembly_node(self, state: RoadmapState) -> RoadmapState:
        """Final assembly node to create the complete roadmap"""
        start_time = datetime.now()
        logger.info("🎯 Starting Final Assembly Node")
        
        try:
            # End the statistics timer
            self.stats.end_timer()
            
            # Assemble the complete roadmap
            roadmap = self._assemble_complete_roadmap(state)
            
            # Add generation metadata
            generation_metadata = {
                "generated_at": datetime.now().isoformat(),
                "pipeline_version": "2.0_langgraph",
                "total_phases": len(state.get("learning_phases", [])),
                "components_included": {
                    "interview": bool(state.get("interview_questions")),
                    "skill_evaluation": bool(state.get("skill_evaluation")),
                    "gap_detection": bool(state.get("knowledge_gaps")),
                    "prerequisite_graph": bool(state.get("prerequisite_graph")),
                    "pes_materials": bool(state.get("pes_materials")),
                    "reference_books": bool(state.get("reference_books")),
                    "video_content": bool(state.get("video_content")),
                    "course_project": bool(state.get("course_project")),
                    "learning_schedule": bool(state.get("learning_schedule"))
                },
                "statistics": self.stats.get_summary()
            }
            
            # Validate the roadmap
            validation_results = self._validate_roadmap(roadmap)
            
            # Update state with final results
            state["generation_metadata"] = generation_metadata
            state["validation_results"] = validation_results
            state["processing_step"] = "completed"
            if "completed_steps" not in state:
                state["completed_steps"] = []
            state["completed_steps"].append("final_assembly")
            
            # Track final statistics
            duration = (datetime.now() - start_time).total_seconds()
            self.stats.track_node_timing("final_assembly_node", duration)
            
            total_resources = self._count_total_resources(state)
            
            logger.info(f"✅ Final assembly completed: {total_resources} total resources")
            logger.info(f"📊 Generation statistics: {generation_metadata['statistics']['total_duration_minutes']:.1f} minutes")
            
            return state
            
        except Exception as e:
            logger.error(f"❌ Final assembly failed: {e}")
            if "errors" not in state:
                state["errors"] = []
            state["errors"].append(f"Final assembly failed: {str(e)}")
            return state
    
    def _assemble_complete_roadmap(self, state: RoadmapState) -> Dict[str, Any]:
        """Assemble the complete roadmap from state"""
        
        # Build phases with resources
        phases_with_resources = []
        
        for phase in state.get("learning_phases", []):
            phase_id = phase.get("phase_id", 1)
            
            # Get resources for this phase
            pes_materials = state.get("pes_materials", {}).get(f"phase_{phase_id}", {}).get("results", [])
            reference_book = state.get("reference_books", {}).get(f"phase_{phase_id}", {}).get("result")
            video_content = state.get("video_content", {}).get(f"phase_{phase_id}", {})
            
            # Build resource list
            resources = []
            
            # Add PES materials
            for material in pes_materials:
                resources.append({
                    "type": "pes_material",
                    "metadata": material
                })
            
            # Add reference book
            if reference_book:
                resources.append({
                    "type": "reference_book",
                    "metadata": reference_book
                })
            
            # Add video content
            if video_content and not video_content.get("error"):
                resources.append({
                    "type": "video_content",
                    "metadata": video_content
                })
            
            # Assemble complete phase
            complete_phase = {
                "phase_id": phase_id,
                "phase_title": f"Phase {phase_id}: {phase.get('title', f'Learning Phase {phase_id}')}",
                "difficulty": phase.get("difficulty", "beginner"),
                "concepts": phase.get("concepts", []),
                "estimated_duration_hours": self._estimate_phase_hours(phase),
                "learning_objectives": self._generate_learning_objectives(phase),
                "resources": resources,
                "prerequisites": self._get_phase_prerequisites(phase, state),
                "assessments": self._generate_phase_assessments(phase)
            }
            
            phases_with_resources.append(complete_phase)
        
        # Build complete roadmap
        roadmap = {
            "roadmap_id": f"roadmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "learning_goal": state.get("learning_goal", ""),
            "subject": state.get("subject", ""),
            "user_profile": {
                "skill_level": state.get("skill_evaluation", {}).get("skill_level", "beginner"),
                "strengths": state.get("skill_evaluation", {}).get("strengths", []),
                "weaknesses": state.get("skill_evaluation", {}).get("weaknesses", []),
                "knowledge_gaps": state.get("knowledge_gaps", []),
                "prerequisites_needed": state.get("prerequisites_needed", [])
            },
            "phases": phases_with_resources,
            "course_project": state.get("course_project", {}),
            "learning_schedule": state.get("learning_schedule", {}),
            "analytics": {
                "total_phases": len(phases_with_resources),
                "total_estimated_hours": sum(p["estimated_duration_hours"] for p in phases_with_resources),
                "skill_gaps_identified": len(state.get("knowledge_gaps", [])),
                "prerequisites_required": len(state.get("prerequisites_needed", []))
            },
            "meta": state.get("generation_metadata", {})
        }
        
        return roadmap
    
    def _estimate_phase_hours(self, phase: Dict[str, Any]) -> int:
        """Estimate hours for a phase based on difficulty and content"""
        base_hours = 10
        difficulty_multiplier = {
            "beginner": 1.0,
            "intermediate": 1.3,
            "advanced": 1.6
        }
        
        difficulty = phase.get("difficulty", "beginner")
        concept_count = len(phase.get("concepts", []))
        
        estimated = int(base_hours * difficulty_multiplier.get(difficulty, 1.0) * max(1, concept_count / 3))
        return min(25, max(8, estimated))  # Cap between 8-25 hours
    
    def _generate_learning_objectives(self, phase: Dict[str, Any]) -> List[str]:
        """Generate learning objectives for a phase"""
        concepts = phase.get("concepts", [])
        objectives = []
        
        for concept in concepts[:3]:  # Max 3 objectives per phase
            objectives.append(f"Master {concept} fundamentals and applications")
        
        return objectives
    
    def _get_phase_prerequisites(self, phase: Dict[str, Any], state: RoadmapState) -> List[str]:
        """Get prerequisites for a phase"""
        phase_id = phase.get("phase_id", 1)
        
        if phase_id == 1:
            return state.get("prerequisites_needed", [])[:2]  # Basic prerequisites
        else:
            # Prerequisites are concepts from previous phase
            prev_phase = next((p for p in state.get("learning_phases", []) 
                             if p.get("phase_id") == phase_id - 1), None)
            if prev_phase:
                return prev_phase.get("concepts", [])[:2]
        
        return []
    
    def _generate_phase_assessments(self, phase: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate assessments for a phase"""
        concepts = phase.get("concepts", [])
        assessments = []
        
        # Quiz assessment
        assessments.append({
            "type": "quiz",
            "title": f"Phase {phase.get('phase_id', 1)} Knowledge Check",
            "question_count": min(10, len(concepts) * 3),
            "topics": concepts
        })
        
        # Practical assessment
        if phase.get("phase_id", 1) > 1:
            assessments.append({
                "type": "practical",
                "title": f"Phase {phase.get('phase_id', 1)} Hands-on Exercise",
                "duration_hours": 2,
                "topics": concepts[:2]
            })
        
        return assessments
    
    def _validate_roadmap(self, roadmap: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the complete roadmap structure"""
        validation_results = {
            "valid": True,
            "warnings": [],
            "errors": [],
            "completeness_score": 0.0,
            "structure_check": {},
            "resource_distribution": {}
        }
        
        try:
            # Check required fields
            required_fields = ["roadmap_id", "learning_goal", "subject", "phases"]
            for field in required_fields:
                if field not in roadmap or not roadmap[field]:
                    validation_results["errors"].append(f"Missing required field: {field}")
                    validation_results["valid"] = False
            
            # Check phases
            phases = roadmap.get("phases", [])
            if len(phases) != 4:
                validation_results["warnings"].append(f"Expected 4 phases, got {len(phases)}")
            
            # Check resource distribution
            total_resources = 0
            resource_types = {"pes_material": 0, "reference_book": 0, "video_content": 0}
            
            for phase in phases:
                phase_resources = phase.get("resources", [])
                total_resources += len(phase_resources)
                
                for resource in phase_resources:
                    resource_type = resource.get("type", "unknown")
                    if resource_type in resource_types:
                        resource_types[resource_type] += 1
            
            validation_results["resource_distribution"] = resource_types
            validation_results["resource_distribution"]["total"] = total_resources
            
            # Calculate completeness score
            completeness_factors = []
            completeness_factors.append(1.0 if roadmap.get("learning_goal") else 0.0)
            completeness_factors.append(1.0 if len(phases) == 4 else len(phases) / 4)
            completeness_factors.append(1.0 if roadmap.get("course_project") else 0.0)
            completeness_factors.append(1.0 if roadmap.get("learning_schedule") else 0.0)
            completeness_factors.append(1.0 if total_resources > 0 else 0.0)
            
            validation_results["completeness_score"] = sum(completeness_factors) / len(completeness_factors)
            
            # Structure check
            validation_results["structure_check"] = {
                "has_user_profile": bool(roadmap.get("user_profile")),
                "has_analytics": bool(roadmap.get("analytics")),
                "has_metadata": bool(roadmap.get("meta")),
                "phases_have_resources": all(p.get("resources") for p in phases),
                "phases_have_assessments": all(p.get("assessments") for p in phases)
            }
            
        except Exception as e:
            validation_results["errors"].append(f"Validation error: {str(e)}")
            validation_results["valid"] = False
        
        return validation_results
    
    def _count_total_resources(self, state: RoadmapState) -> int:
        """Count total resources across all phases"""
        total = 0
        
        # Count PES materials
        for phase_data in state.get("pes_materials", {}).values():
            total += len(phase_data.get("results", []))
        
        # Count reference books
        for phase_data in state.get("reference_books", {}).values():
            if phase_data.get("result"):
                total += 1
        
        # Count video content
        total += len(state.get("video_content", {}))
        
        return total
    
    async def generate_roadmap(
        self, 
        learning_goal: str, 
        subject: str,
        user_background: str = "beginner",
        hours_per_week: int = 10,
        deadline: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a complete educational roadmap"""
        
        logger.info(f"🚀 Starting roadmap generation for: {learning_goal}")
        
        # Start statistics tracking
        self.stats.start_timer()
        
        # Initialize state
        initial_state = create_initial_state(
            learning_goal=learning_goal,
            subject=subject,
            user_background=user_background,
            hours_per_week=hours_per_week,
            deadline=deadline
        )
        
        try:
            # Ensure database connection
            if not await db_manager.connect():
                logger.error("❌ Failed to connect to database")
                raise Exception("Database connection failed")
            
            # Execute the workflow
            result = await self.compiled_workflow.ainvoke(initial_state)
            
            # Build final roadmap
            final_roadmap = self._assemble_complete_roadmap(result)
            
            logger.info("✅ Roadmap generation completed successfully")
            return final_roadmap
            
        except Exception as e:
            logger.error(f"❌ Roadmap generation failed: {e}")
            
            # Return error roadmap
            return {
                "roadmap_id": f"error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "learning_goal": learning_goal,
                "subject": subject,
                "error": str(e),
                "generated_at": datetime.now().isoformat(),
                "status": "failed"
            }
        
        finally:
            await db_manager.close()

# Global workflow instance
educational_workflow = EducationalRoadmapWorkflow()
