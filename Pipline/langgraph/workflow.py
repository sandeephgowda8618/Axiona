"""
LangGraph Workflow Definition for Educational Roadmap System
"""
import logging
from typing import Dict, Any, List
from datetime import datetime

from langgraph.graph import StateGraph, END
from .state import RoadmapState
from .nodes import (
    interview_node, skill_evaluation_node, gap_detection_node, 
    prerequisite_graph_node, roadmap_stats
)
from .resource_nodes import (
    pes_retrieval_node, reference_book_retrieval_node, video_retrieval_node
)
from .project_timeline_nodes import (
    project_generation_node, time_planning_node
)

logger = logging.getLogger(__name__)

class RoadmapWorkflow:
    """LangGraph workflow for educational roadmap generation"""
    
    def __init__(self):
        self.graph = None
        self.compiled_workflow = None
        self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        
        # Create the state graph
        workflow = StateGraph(RoadmapState)
        
        # Add all nodes
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
        
        # Define the workflow edges
        workflow.set_entry_point("interview")
        
        # Sequential flow with conditional logic
        workflow.add_edge("interview", "skill_evaluation")
        workflow.add_edge("skill_evaluation", "gap_detection") 
        workflow.add_edge("gap_detection", "prerequisite_graph")
        
        # Resource retrieval happens in parallel after prerequisite graph
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
        
        logger.info("📊 LangGraph workflow compiled successfully")
    
    async def _final_assembly_node(self, state: RoadmapState) -> RoadmapState:
        """Final assembly node to create the complete roadmap"""
        start_time = datetime.now()
        logger.info("🎯 Starting Final Assembly Node")
        
        try:
            # End the statistics timer
            roadmap_stats.end_timer()
            
            # Assemble the complete roadmap
            roadmap = self._assemble_complete_roadmap(state)
            
            # Add generation metadata
            generation_metadata = {
                "generated_at": datetime.now().isoformat(),
                "pipeline_version": "2.0_langgraph",
                "total_phases": len(state["learning_phases"]),
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
                "statistics": roadmap_stats.get_summary()
            }
            
            # Validate the roadmap
            validation_results = self._validate_roadmap(roadmap)
            
            # Update state with final results
            state["generation_metadata"] = generation_metadata
            state["validation_results"] = validation_results
            state["processing_step"] = "completed"
            state["completed_steps"].append("final_assembly")
            
            # Track final statistics
            duration = (datetime.now() - start_time).total_seconds()
            roadmap_stats.track_node_timing("final_assembly_node", duration)
            
            total_resources = (
                sum(len(materials.get("results", [])) for materials in state.get("pes_materials", {}).values()) +
                sum(1 for book in state.get("reference_books", {}).values() if book.get("result")) +
                len(state.get("video_content", {}))
            )
            
            logger.info(f"✅ Final assembly completed: {total_resources} total resources")
            logger.info(f"📊 Generation statistics: {generation_metadata['statistics']['total_duration_minutes']:.1f} minutes")
            
            return state
            
        except Exception as e:
            logger.error(f"❌ Final assembly failed: {e}")
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
            
            # Add video content (as search keywords for now)
            if video_content:
                resources.append({
                    "type": "video_content",
                    "metadata": video_content
                })
            
            # Assemble complete phase
            complete_phase = {
                "phase_id": phase_id,
                "phase_title": phase.get("title", f"Phase {phase_id}"),
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
                "total_estimated_hours": sum(p.get("estimated_duration_hours", 0) for p in phases_with_resources),
                "skill_gaps_identified": len(state.get("knowledge_gaps", [])),
                "prerequisites_required": len(state.get("prerequisites_needed", [])),
                "total_resources": sum(len(p.get("resources", [])) for p in phases_with_resources)
            }
        }
        
        return roadmap
    
    def _estimate_phase_hours(self, phase: Dict[str, Any]) -> int:
        """Estimate hours for a phase"""
        difficulty = phase.get("difficulty", "beginner")
        concepts = phase.get("concepts", [])
        
        base_hours = {
            "beginner": 12,
            "intermediate": 15,
            "advanced": 18
        }
        
        return base_hours.get(difficulty, 12) + len(concepts) * 2
    
    def _generate_learning_objectives(self, phase: Dict[str, Any]) -> List[str]:
        """Generate learning objectives for a phase"""
        concepts = phase.get("concepts", [])
        objectives = []
        
        for concept in concepts:
            objectives.append(f"Master {concept}")
            
        if not objectives:
            objectives.append(f"Complete {phase.get('title', 'phase')} successfully")
            
        return objectives
    
    def _get_phase_prerequisites(self, phase: Dict[str, Any], state: RoadmapState) -> List[str]:
        """Get prerequisites for a phase"""
        phase_id = phase.get("phase_id", 1)
        
        # For phase 1, use general prerequisites
        if phase_id == 1:
            return state.get("prerequisites_needed", [])
        
        # For other phases, previous phases are prerequisites  
        previous_phases = []
        for p in state.get("learning_phases", []):
            if p.get("phase_id", 1) < phase_id:
                previous_phases.append(f"Phase {p.get('phase_id')}: {p.get('title', '')}")
        
        return previous_phases
    
    def _generate_phase_assessments(self, phase: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate assessment plans for a phase"""
        concepts = phase.get("concepts", [])
        
        assessments = []
        
        # Knowledge assessment
        assessments.append({
            "type": "quiz",
            "title": f"Phase {phase.get('phase_id', 1)} Knowledge Check",
            "topics": concepts,
            "estimated_time": "30 minutes"
        })
        
        # Practical assessment
        if concepts:
            assessments.append({
                "type": "practical_exercise",
                "title": f"Hands-on {concepts[0]} Exercise",
                "topics": concepts[:2],
                "estimated_time": "2 hours"
            })
        
        return assessments
    
    def _validate_roadmap(self, roadmap: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the complete roadmap"""
        validation = {
            "valid": True,
            "issues": [],
            "warnings": [],
            "statistics": {}
        }
        
        # Check required fields
        required_fields = ["roadmap_id", "learning_goal", "subject", "phases", "course_project"]
        for field in required_fields:
            if field not in roadmap or not roadmap[field]:
                validation["issues"].append(f"Missing required field: {field}")
                validation["valid"] = False
        
        # Validate phases
        phases = roadmap.get("phases", [])
        if len(phases) != 4:
            validation["warnings"].append(f"Expected 4 phases, got {len(phases)}")
        
        # Check resource distribution
        total_pes = sum(len([r for r in p.get("resources", []) if r.get("type") == "pes_material"]) for p in phases)
        total_books = sum(len([r for r in p.get("resources", []) if r.get("type") == "reference_book"]) for p in phases)
        total_videos = sum(len([r for r in p.get("resources", []) if r.get("type") == "video_content"]) for p in phases)
        
        validation["statistics"] = {
            "total_phases": len(phases),
            "total_pes_materials": total_pes,
            "total_reference_books": total_books,
            "total_video_content": total_videos,
            "total_resources": total_pes + total_books + total_videos
        }
        
        if total_pes == 0:
            validation["warnings"].append("No PES materials found")
        if total_books == 0:
            validation["warnings"].append("No reference books found")
        
        return validation
    
    async def generate_roadmap(self, initial_state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a complete educational roadmap using the LangGraph workflow"""
        
        logger.info("🚀 Starting LangGraph Roadmap Generation")
        
        # Initialize state with defaults
        full_state = RoadmapState(
            learning_goal=initial_state.get("learning_goal", ""),
            subject=initial_state.get("subject", ""),
            user_background=initial_state.get("user_background", ""),
            target_expertise=initial_state.get("target_expertise", "intermediate"),
            hours_per_week=initial_state.get("hours_per_week", 10),
            deadline=initial_state.get("deadline"),
            interview_questions=[],
            interview_answers=[],
            skill_evaluation={},
            knowledge_gaps=[],
            prerequisites_needed=[],
            prerequisite_graph={},
            learning_phases=[],
            phase_difficulties={},
            difficulty_factors=[],
            pes_materials={},
            reference_books={},
            video_content={},
            course_project={},
            learning_schedule={},
            generation_metadata={},
            validation_results={},
            pipeline_stats={},
            errors=[],
            warnings=[],
            current_phase=1,
            processing_step="initializing",
            completed_steps=[]
        )
        
        try:
            # Execute the workflow
            result = await self.compiled_workflow.ainvoke(full_state)
            
            # Assemble final response
            final_roadmap = self._assemble_complete_roadmap(result)
            
            # Add metadata
            final_response = {
                "roadmap": final_roadmap,
                "generation_metadata": result.get("generation_metadata", {}),
                "validation_results": result.get("validation_results", {}),
                "processing_summary": {
                    "completed_steps": result.get("completed_steps", []),
                    "errors": result.get("errors", []),
                    "warnings": result.get("warnings", []),
                    "processing_time": result.get("generation_metadata", {}).get("statistics", {}).get("total_duration_minutes", 0)
                }
            }
            
            logger.info("✅ LangGraph roadmap generation completed successfully")
            
            return final_response
            
        except Exception as e:
            logger.error(f"❌ LangGraph roadmap generation failed: {e}")
            
            # Return error response
            return {
                "roadmap": None,
                "error": str(e),
                "generation_metadata": {"failed_at": datetime.now().isoformat()},
                "processing_summary": {
                    "completed_steps": full_state.get("completed_steps", []),
                    "errors": [str(e)],
                    "warnings": []
                }
            }
