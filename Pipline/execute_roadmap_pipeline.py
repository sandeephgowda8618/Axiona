"""
Simplified Educational Roadmap Pipeline Execution
================================================

Direct execution of the multi-agent educational roadmap system
without complex LangGraph dependencies for immediate testing.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def execute_simple_roadmap_pipeline(
    learning_goal: str,
    subject: str,
    user_background: str = "beginner",
    hours_per_week: int = 10
) -> Dict[str, Any]:
    """Execute the roadmap pipeline directly without LangGraph"""
    
    logger.info(f"🚀 Starting roadmap generation for: {learning_goal}")
    start_time = datetime.now()
    
    try:
        # Import agents
        from langgraph.complete_agents import (
            interview_node, skill_evaluation_node, gap_detection_node,
            prerequisite_graph_node, pes_retrieval_node, reference_book_retrieval_node,
            video_retrieval_node, project_generation_node, time_planning_node,
            roadmap_stats
        )
        from langgraph.state import create_initial_state
        from core.db_manager import db_manager
        
        # Start statistics tracking
        roadmap_stats.start_timer()
        
        # Initialize database connection
        db_connected = await db_manager.connect()
        if not db_connected:
            logger.warning("⚠️ Database connection failed, using mock data")
        
        # Create initial state
        state = create_initial_state(
            learning_goal=learning_goal,
            subject=subject,
            user_background=user_background,
            hours_per_week=hours_per_week
        )
        
        # Execute pipeline sequentially
        pipeline_steps = [
            ("Interview", interview_node),
            ("Skill Evaluation", skill_evaluation_node),
            ("Gap Detection", gap_detection_node),
            ("Prerequisite Graph", prerequisite_graph_node),
            ("PES Retrieval", pes_retrieval_node),
            ("Reference Book Retrieval", reference_book_retrieval_node),
            ("Video Retrieval", video_retrieval_node),
            ("Project Generation", project_generation_node),
            ("Time Planning", time_planning_node)
        ]
        
        for step_name, step_function in pipeline_steps:
            logger.info(f"📊 Executing {step_name}...")
            try:
                state = await step_function(state)
                logger.info(f"✅ {step_name} completed")
            except Exception as e:
                logger.error(f"❌ {step_name} failed: {e}")
                state["errors"].append(f"{step_name} failed: {str(e)}")
        
        # End statistics tracking
        roadmap_stats.end_timer()
        
        # Build final roadmap
        roadmap = assemble_final_roadmap(state, roadmap_stats)
        
        execution_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"✅ Roadmap generation completed in {execution_time:.1f}s")
        
        return roadmap
        
    except Exception as e:
        logger.error(f"❌ Pipeline execution failed: {e}")
        return create_error_roadmap(learning_goal, subject, str(e))
    
    finally:
        try:
            await db_manager.close()
        except:
            pass

def assemble_final_roadmap(state: Dict[str, Any], stats) -> Dict[str, Any]:
    """Assemble the final roadmap from state"""
    
    # Build phases with resources
    phases = []
    
    for phase_data in state.get("learning_phases", []):
        phase_id = phase_data.get("phase_id", 1)
        
        # Collect resources for this phase
        resources = []
        
        # PES materials
        pes_data = state.get("pes_materials", {}).get(f"phase_{phase_id}", {})
        if isinstance(pes_data, dict) and "results" in pes_data:
            for material in pes_data["results"]:
                resources.append({
                    "type": "pes_material",
                    "metadata": material
                })
        
        # Reference books
        book_data = state.get("reference_books", {}).get(f"phase_{phase_id}", {})
        if isinstance(book_data, dict) and book_data.get("result"):
            resources.append({
                "type": "reference_book",
                "metadata": book_data["result"]
            })
        
        # Video content
        video_data = state.get("video_content", {}).get(f"phase_{phase_id}", {})
        if isinstance(video_data, dict) and not video_data.get("error"):
            resources.append({
                "type": "video_content",
                "metadata": video_data
            })
        
        # Build complete phase
        phase = {
            "phase_id": phase_id,
            "phase_title": f"Phase {phase_id}: {phase_data.get('title', 'Learning Phase')}",
            "difficulty": phase_data.get("difficulty", "beginner"),
            "concepts": phase_data.get("concepts", []),
            "estimated_duration_hours": estimate_phase_hours(phase_data),
            "learning_objectives": generate_learning_objectives(phase_data),
            "resources": resources,
            "prerequisites": get_phase_prerequisites(phase_data, state),
            "assessments": generate_assessments(phase_data)
        }
        
        phases.append(phase)
    
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
        "phases": phases,
        "course_project": state.get("course_project", {}),
        "learning_schedule": state.get("learning_schedule", {}),
        "analytics": {
            "total_phases": len(phases),
            "total_estimated_hours": sum(p["estimated_duration_hours"] for p in phases),
            "skill_gaps_identified": len(state.get("knowledge_gaps", [])),
            "prerequisites_required": len(state.get("prerequisites_needed", [])),
            "total_resources": sum(len(p["resources"]) for p in phases)
        },
        "meta": {
            "generated_at": datetime.now().isoformat(),
            "pipeline_version": "2.0_simplified",
            "statistics": stats.get_summary() if stats else {},
            "errors": state.get("errors", []),
            "warnings": state.get("warnings", [])
        }
    }
    
    return roadmap

def estimate_phase_hours(phase: Dict[str, Any]) -> int:
    """Estimate hours for a phase"""
    base_hours = 12
    difficulty_multiplier = {"beginner": 1.0, "intermediate": 1.3, "advanced": 1.6}
    difficulty = phase.get("difficulty", "beginner")
    concept_count = len(phase.get("concepts", []))
    
    estimated = int(base_hours * difficulty_multiplier.get(difficulty, 1.0) * max(1, concept_count / 3))
    return min(25, max(8, estimated))

def generate_learning_objectives(phase: Dict[str, Any]) -> list:
    """Generate learning objectives for a phase"""
    concepts = phase.get("concepts", [])
    objectives = []
    
    for concept in concepts[:3]:
        objectives.append(f"Master {concept} fundamentals and applications")
    
    return objectives

def get_phase_prerequisites(phase: Dict[str, Any], state: Dict[str, Any]) -> list:
    """Get prerequisites for a phase"""
    phase_id = phase.get("phase_id", 1)
    
    if phase_id == 1:
        return state.get("prerequisites_needed", [])[:2]
    else:
        # Previous phase concepts as prerequisites
        prev_phase = next((p for p in state.get("learning_phases", []) 
                         if p.get("phase_id") == phase_id - 1), None)
        if prev_phase:
            return prev_phase.get("concepts", [])[:2]
    
    return []

def generate_assessments(phase: Dict[str, Any]) -> list:
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
    
    # Practical assessment for advanced phases
    if phase.get("phase_id", 1) > 1:
        assessments.append({
            "type": "practical",
            "title": f"Phase {phase.get('phase_id', 1)} Hands-on Exercise",
            "duration_hours": 2,
            "topics": concepts[:2]
        })
    
    return assessments

def create_error_roadmap(learning_goal: str, subject: str, error: str) -> Dict[str, Any]:
    """Create an error roadmap when generation fails"""
    return {
        "roadmap_id": f"error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "learning_goal": learning_goal,
        "subject": subject,
        "error": error,
        "status": "failed",
        "generated_at": datetime.now().isoformat(),
        "phases": [],
        "meta": {
            "pipeline_version": "2.0_simplified",
            "error_details": error
        }
    }

async def run_test_scenarios():
    """Run test scenarios for validation"""
    
    print("🧪 Running Educational Roadmap Pipeline Tests")
    print("=" * 60)
    
    test_scenarios = [
        {
            "name": "Operating Systems - Beginner",
            "learning_goal": "Master Operating Systems",
            "subject": "Operating Systems",
            "user_background": "beginner",
            "hours_per_week": 10
        },
        {
            "name": "Data Structures - Intermediate",
            "learning_goal": "Learn Data Structures and Algorithms",
            "subject": "Data Structures", 
            "user_background": "intermediate",
            "hours_per_week": 8
        },
        {
            "name": "Computer Networks - Beginner",
            "learning_goal": "Understand Computer Networks",
            "subject": "Computer Networks",
            "user_background": "beginner",
            "hours_per_week": 6
        }
    ]
    
    results = []
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n📊 Test {i}: {scenario['name']}")
        print("-" * 30)
        
        start_time = datetime.now()
        
        try:
            roadmap = await execute_simple_roadmap_pipeline(
                learning_goal=scenario["learning_goal"],
                subject=scenario["subject"],
                user_background=scenario["user_background"],
                hours_per_week=scenario["hours_per_week"]
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Analyze results
            phases = roadmap.get("phases", [])
            total_resources = sum(len(p.get("resources", [])) for p in phases)
            has_project = bool(roadmap.get("course_project"))
            has_schedule = bool(roadmap.get("learning_schedule"))
            
            success = not roadmap.get("error")
            
            result = {
                "scenario": scenario["name"],
                "success": success,
                "execution_time": execution_time,
                "phases_count": len(phases),
                "total_resources": total_resources,
                "has_project": has_project,
                "has_schedule": has_schedule,
                "error": roadmap.get("error")
            }
            
            results.append(result)
            
            if success:
                print(f"✅ Success: {execution_time:.1f}s")
                print(f"📚 Phases: {len(phases)}")
                print(f"🎯 Resources: {total_resources}")
                print(f"🛠️ Project: {'Yes' if has_project else 'No'}")
                print(f"⏰ Schedule: {'Yes' if has_schedule else 'No'}")
                
                # Save to file
                output_file = f"roadmap_{i}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(output_file, 'w') as f:
                    json.dump(roadmap, f, indent=2, default=str)
                print(f"💾 Saved to: {output_file}")
                
            else:
                print(f"❌ Failed: {roadmap.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
            results.append({
                "scenario": scenario["name"],
                "success": False,
                "error": str(e)
            })
    
    # Summary
    print(f"\n📋 Test Summary")
    print("=" * 60)
    
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    print(f"✅ Successful: {len(successful)}/{len(results)}")
    print(f"❌ Failed: {len(failed)}/{len(results)}")
    
    if successful:
        avg_time = sum(r["execution_time"] for r in successful) / len(successful)
        avg_resources = sum(r["total_resources"] for r in successful) / len(successful)
        
        print(f"⏱️ Average execution time: {avg_time:.1f}s")
        print(f"📊 Average resources: {avg_resources:.1f}")
    
    print(f"\n🎉 Testing completed!")
    return results

if __name__ == "__main__":
    asyncio.run(run_test_scenarios())
