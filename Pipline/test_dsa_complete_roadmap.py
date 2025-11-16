#!/usr/bin/env python3
"""
DSA (Data Structures and Algorithms) Roadmap Test - Modified
==========================================================

Modified version of the complete interview test to generate a roadmap for
Data Structures and Algorithms instead of Operating Systems.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Import JSON utilities for ObjectId handling
from utils.json_utils import stringify_ids, safe_json_dump, validate_json_serializable

from agents.interview_pipeline import (
    interview_agent, skill_evaluator, gap_detector,
    prerequisite_graph, difficulty_estimator, project_generator, time_planner
)
from agents.roadmap_builder_standardized import roadmap_builder
from agents.standardized_agents import retrieval_agents

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_dsa_roadmap():
    """Test complete DSA roadmap generation"""
    
    print("🎯 Starting DSA (Data Structures and Algorithms) Roadmap Test")
    print("=" * 80)
    
    # Test configuration for DSA
    learning_goal = "Data Structures and Algorithms"
    subject_area = "Computer Science"
    
    test_start_time = datetime.now()
    
    results = {
        "test_name": "DSA Interview-Driven Roadmap Test",
        "timestamp": test_start_time.isoformat(),
        "learning_goal": learning_goal,
        "subject_area": subject_area,
        "steps_completed": 0,
        "results": {},
        "final_roadmap": None,
        "overall_status": "UNKNOWN"
    }
    
    try:
        # Step 1: Interview Questions Generation
        logger.info("\n📋 Step 1: Testing Interview Question Generation for DSA...")
        try:
            questions = await interview_agent.generate_questions(learning_goal, subject_area)
            
            interview_success = isinstance(questions, dict) and "questions" in questions
            num_questions = len(questions.get("questions", []))
            
            results["results"]["interview_generation"] = {
                "success": interview_success,
                "num_questions": num_questions,
                "interview_id": f"interview_{test_start_time.strftime('%Y%m%d_%H%M%S')}",
                "has_progress": True
            }
            
            logger.info(f"✅ Interview generation: {num_questions} questions generated")
            results["steps_completed"] += 1
            
        except Exception as e:
            logger.error(f"❌ Interview generation failed: {e}")
            results["results"]["interview_generation"] = {"success": False, "error": str(e)}
        
        # Step 2: Simulate DSA-focused user answers
        logger.info("\n💬 Step 2: Simulating DSA-focused User Answers...")
        
        # DSA-specific realistic answers
        sample_answers = {
            "q1": "I have basic programming knowledge in Python and Java, but limited experience with complex data structures and algorithms",
            "q2": "I prefer hands-on coding practice combined with theoretical understanding of algorithm complexity", 
            "q3": "I can dedicate 10-12 hours per week consistently for learning",
            "q4": "Most interested in graph algorithms, dynamic programming, and understanding Big O notation deeply",
            "q5": "I have some experience with arrays and basic sorting, but want to master advanced algorithms for technical interviews"
        }
        
        logger.info(f"📝 Generated {len(sample_answers)} DSA-focused answers")
        
        # Skip to roadmap generation using the roadmap builder directly
        logger.info("\n🗺️  Step 10: Testing Complete DSA Roadmap Generation...")
        try:
            # Use the roadmap builder to create a complete DSA roadmap
            final_roadmap = await roadmap_builder.build_interview_driven_roadmap(
                learning_goal=learning_goal,
                subject_area=subject_area,
                interview_answers=sample_answers,
                user_constraints={
                    "hours_per_week": 12,
                    "total_weeks": 8,
                    "difficulty_preference": "progressive"
                }
            )
            
            roadmap_success = isinstance(final_roadmap, dict)
            roadmap_id = final_roadmap.get("roadmap_id", "unknown") if isinstance(final_roadmap, dict) else "unknown"
            num_phases = len(final_roadmap.get("phases", [])) if isinstance(final_roadmap, dict) else 0
            
            results["results"]["complete_roadmap"] = {
                "success": roadmap_success,
                "roadmap_id": roadmap_id,
                "num_phases": num_phases,
                "has_project": bool(final_roadmap.get("course_project")) if isinstance(final_roadmap, dict) else False,
                "has_schedule": bool(final_roadmap.get("learning_schedule")) if isinstance(final_roadmap, dict) else False,
                "pipeline_version": "2.0_DSA"
            }
            
            results["final_roadmap"] = final_roadmap
            results["steps_completed"] += 1
            
            logger.info(f"✅ Complete DSA roadmap: {num_phases} phases, project included")
            
        except Exception as e:
            logger.error(f"❌ Complete roadmap generation failed: {e}")
            results["results"]["complete_roadmap"] = {"success": False, "error": str(e)}
        
        # Validation
        logger.info("\n✅ Step 11: Validating Final DSA Roadmap JSON...")
        try:
            if results["final_roadmap"]:
                is_valid, validation_error = validate_json_serializable(results["final_roadmap"])
                
                results["results"]["validation"] = {
                    "schema_valid": is_valid,
                    "errors": [validation_error] if validation_error and validation_error != "OK" else [],
                    "warnings": [],
                    "total_errors": 0 if is_valid else 1,
                    "total_warnings": 0
                }
                
                logger.info(f"✅ DSA roadmap schema validation: {'PASSED' if is_valid else 'FAILED'}")
                results["steps_completed"] += 1
            else:
                results["results"]["validation"] = {
                    "schema_valid": False,
                    "errors": ["No roadmap generated"],
                    "warnings": [],
                    "total_errors": 1,
                    "total_warnings": 0
                }
        except Exception as e:
            logger.error(f"❌ Validation failed: {e}")
            results["results"]["validation"] = {"success": False, "error": str(e)}
        
        # Determine overall status
        if results.get("final_roadmap") and results["results"]["complete_roadmap"]["success"]:
            results["overall_status"] = "SUCCESS"
        else:
            results["overall_status"] = "FAILED"
        
        return results
        
    except Exception as e:
        logger.error(f"❌ DSA test failed with critical error: {e}")
        results["overall_status"] = "CRITICAL_FAILURE"
        results["error"] = str(e)
        return results

async def main():
    """Main test execution"""
    results = await test_dsa_roadmap()
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 DSA TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"Overall Status: {results['overall_status']}")
    print(f"Learning Goal: {results['learning_goal']}")
    print(f"Steps Completed: {results['steps_completed']}")
    
    # Print step-by-step results
    for step_name, step_result in results.get("results", {}).items():
        if isinstance(step_result, dict):
            status = "✅ PASS" if step_result.get("success", False) else "❌ FAIL"
            print(f"{step_name}: {status}")
    
    # Save results
    output_filename = f"dsa_roadmap_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    success = safe_json_dump(results, output_filename)
    
    if success:
        print(f"\n📁 Saving detailed test results to: {output_filename}")
        print(f"✅ Test results successfully saved to: {output_filename}")
    else:
        print(f"❌ Failed to save test results to: {output_filename}")
    
    # Print final roadmap summary if available
    if results.get("final_roadmap"):
        roadmap = results["final_roadmap"]
        print(f"\n🗺️ FINAL DSA ROADMAP SUMMARY:")
        print(f"  Roadmap ID: {roadmap.get('roadmap_id', 'unknown')}")
        print(f"  Phases: {len(roadmap.get('phases', []))}")
        print(f"  Has Project: {'Yes' if roadmap.get('course_project') else 'No'}")
        print(f"  Has Schedule: {'Yes' if roadmap.get('learning_schedule') else 'No'}")
        print(f"  Total Estimated Hours: {roadmap.get('analytics', {}).get('total_estimated_hours', 'unknown')}")
        
        # Show some DSA-specific analysis
        phases = roadmap.get("phases", [])
        if phases:
            print(f"\n📚 DSA PHASE BREAKDOWN:")
            for i, phase in enumerate(phases, 1):
                pes_count = len(phase.get("resources", {}).get("pes_materials", []))
                book_count = len(phase.get("resources", {}).get("reference_books", []))
                concepts = ", ".join(phase.get("concepts", []))
                print(f"  Phase {i}: {phase.get('phase_title', 'Unknown')} - {pes_count} PES, {book_count} books")
                if concepts:
                    print(f"    Concepts: {concepts}")
    
    print("\n🏁 DSA Test completed!")
    return results

if __name__ == "__main__":
    asyncio.run(main())
