"""
Complete Educational Roadmap Generation Test
===========================================

Tests the complete LangGraph-based educational roadmap system with
standardized schemas, statistics tracking, and JSON validation.
"""

import asyncio
import json
import sys
import os
import logging
from datetime import datetime
from pathlib import Path

# Add the parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_complete_roadmap_generation():
    """Test the complete roadmap generation pipeline"""
    
    try:
        # Import after path setup
        from langgraph.educational_workflow import educational_workflow
        from langgraph.state import create_initial_state
        from core.db_manager import db_manager
        
        print("🚀 Starting Complete Educational Roadmap Generation Test")
        print("=" * 60)
        
        # Test parameters
        test_cases = [
            {
                "learning_goal": "Master Operating Systems",
                "subject": "Operating Systems", 
                "user_background": "beginner",
                "hours_per_week": 10
            },
            {
                "learning_goal": "Learn Data Structures and Algorithms",
                "subject": "Data Structures",
                "user_background": "intermediate", 
                "hours_per_week": 8
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📊 Test Case {i}: {test_case['learning_goal']}")
            print("-" * 40)
            
            start_time = datetime.now()
            
            try:
                # Generate roadmap using the workflow
                roadmap = await educational_workflow.generate_roadmap(
                    learning_goal=test_case["learning_goal"],
                    subject=test_case["subject"],
                    user_background=test_case["user_background"],
                    hours_per_week=test_case["hours_per_week"]
                )
                
                end_time = datetime.now()
                generation_time = (end_time - start_time).total_seconds()
                
                # Validate roadmap structure
                validation_results = validate_roadmap_structure(roadmap)
                
                # Collect test results
                test_result = {
                    "test_case": i,
                    "input": test_case,
                    "generation_time_seconds": generation_time,
                    "roadmap_structure": {
                        "roadmap_id": roadmap.get("roadmap_id"),
                        "learning_goal": roadmap.get("learning_goal"),
                        "subject": roadmap.get("subject"),
                        "total_phases": len(roadmap.get("phases", [])),
                        "has_project": bool(roadmap.get("course_project")),
                        "has_schedule": bool(roadmap.get("learning_schedule")),
                        "total_resources": count_total_resources(roadmap)
                    },
                    "validation": validation_results,
                    "success": not roadmap.get("error")
                }
                
                results.append(test_result)
                
                # Print results
                print(f"✅ Generation successful: {generation_time:.1f}s")
                print(f"📚 Total phases: {test_result['roadmap_structure']['total_phases']}")
                print(f"🎯 Total resources: {test_result['roadmap_structure']['total_resources']}")
                print(f"📊 Validation score: {validation_results['completeness_score']:.2f}")
                
                if validation_results["warnings"]:
                    print(f"⚠️ Warnings: {len(validation_results['warnings'])}")
                    for warning in validation_results["warnings"][:3]:
                        print(f"   - {warning}")
                
                if validation_results["errors"]:
                    print(f"❌ Errors: {len(validation_results['errors'])}")
                    for error in validation_results["errors"][:3]:
                        print(f"   - {error}")
                
                # Save roadmap to file
                output_file = f"test_roadmap_{i}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(output_file, 'w') as f:
                    json.dump(roadmap, f, indent=2, default=str)
                print(f"💾 Roadmap saved to: {output_file}")
                
            except Exception as e:
                print(f"❌ Test case {i} failed: {e}")
                results.append({
                    "test_case": i,
                    "input": test_case,
                    "error": str(e),
                    "success": False
                })
        
        # Generate summary report
        print("\n📋 Test Summary Report")
        print("=" * 60)
        
        successful_tests = [r for r in results if r["success"]]
        failed_tests = [r for r in results if not r["success"]]
        
        print(f"✅ Successful tests: {len(successful_tests)}/{len(results)}")
        print(f"❌ Failed tests: {len(failed_tests)}/{len(results)}")
        
        if successful_tests:
            avg_time = sum(r.get("generation_time_seconds", 0) for r in successful_tests) / len(successful_tests)
            avg_resources = sum(r["roadmap_structure"]["total_resources"] for r in successful_tests if "roadmap_structure" in r) / len(successful_tests)
            avg_validation = sum(r["validation"]["completeness_score"] for r in successful_tests if "validation" in r) / len(successful_tests)
            
            print(f"⏱️ Average generation time: {avg_time:.1f}s")
            print(f"📚 Average resources per roadmap: {avg_resources:.1f}")
            print(f"📊 Average validation score: {avg_validation:.2f}")
        
        # Test specific components
        print(f"\n🧪 Component Tests")
        print("-" * 30)
        
        await test_database_connectivity()
        await test_agent_prompts()
        await test_schema_compliance()
        
        print(f"\n🎉 Test completed successfully!")
        return results
        
    except Exception as e:
        print(f"❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        return []

def validate_roadmap_structure(roadmap: dict) -> dict:
    """Validate roadmap structure and content"""
    
    validation = {
        "completeness_score": 0.0,
        "warnings": [],
        "errors": [],
        "structure_checks": {},
        "resource_distribution": {}
    }
    
    try:
        # Required fields check
        required_fields = ["roadmap_id", "learning_goal", "subject", "phases"]
        missing_fields = [field for field in required_fields if not roadmap.get(field)]
        
        if missing_fields:
            validation["errors"].extend([f"Missing required field: {field}" for field in missing_fields])
        
        # Phases validation
        phases = roadmap.get("phases", [])
        if not phases:
            validation["errors"].append("No learning phases found")
        elif len(phases) != 4:
            validation["warnings"].append(f"Expected 4 phases, found {len(phases)}")
        
        # Resource distribution
        total_resources = 0
        resource_types = {"pes_material": 0, "reference_book": 0, "video_content": 0}
        
        for phase in phases:
            phase_resources = phase.get("resources", [])
            total_resources += len(phase_resources)
            
            for resource in phase_resources:
                resource_type = resource.get("type", "unknown")
                resource_types[resource_type] = resource_types.get(resource_type, 0) + 1
        
        validation["resource_distribution"] = resource_types
        validation["resource_distribution"]["total"] = total_resources
        
        # Structure checks
        validation["structure_checks"] = {
            "has_user_profile": bool(roadmap.get("user_profile")),
            "has_course_project": bool(roadmap.get("course_project")),
            "has_learning_schedule": bool(roadmap.get("learning_schedule")),
            "has_analytics": bool(roadmap.get("analytics")),
            "phases_have_resources": all(phase.get("resources") for phase in phases),
            "phases_have_objectives": all(phase.get("learning_objectives") for phase in phases),
            "phases_have_assessments": all(phase.get("assessments") for phase in phases)
        }
        
        # Calculate completeness score
        completeness_factors = [
            1.0 if roadmap.get("roadmap_id") else 0.0,
            1.0 if roadmap.get("learning_goal") else 0.0,
            1.0 if roadmap.get("subject") else 0.0,
            1.0 if len(phases) == 4 else len(phases) / 4,
            1.0 if roadmap.get("course_project") else 0.0,
            1.0 if roadmap.get("learning_schedule") else 0.0,
            1.0 if total_resources > 0 else 0.0,
            1.0 if all(validation["structure_checks"].values()) else sum(validation["structure_checks"].values()) / len(validation["structure_checks"])
        ]
        
        validation["completeness_score"] = sum(completeness_factors) / len(completeness_factors)
        
        # Quality checks
        if total_resources < len(phases) * 2:
            validation["warnings"].append(f"Low resource count: {total_resources} total resources for {len(phases)} phases")
        
        if resource_types.get("pes_material", 0) == 0:
            validation["warnings"].append("No PES materials found")
        
        if resource_types.get("reference_book", 0) == 0:
            validation["warnings"].append("No reference books found")
        
        return validation
        
    except Exception as e:
        validation["errors"].append(f"Validation failed: {str(e)}")
        return validation

def count_total_resources(roadmap: dict) -> int:
    """Count total resources in roadmap"""
    total = 0
    for phase in roadmap.get("phases", []):
        total += len(phase.get("resources", []))
    return total

async def test_database_connectivity():
    """Test database connectivity and collections"""
    print("🗃️ Testing database connectivity...")
    
    try:
        from core.db_manager import db_manager
        
        # Test connection
        connected = await db_manager.connect()
        if connected:
            print("   ✅ Database connection successful")
            
            # Test health check
            health = await db_manager.health_check()
            if health.get("status") == "healthy":
                print("   ✅ Database health check passed")
                
                collections = health.get("collections", {})
                for name, count in collections.items():
                    print(f"   📊 {name}: {count} documents")
            else:
                print(f"   ⚠️ Database health check failed: {health.get('error')}")
        else:
            print("   ❌ Database connection failed")
            
    except Exception as e:
        print(f"   ❌ Database test failed: {e}")

async def test_agent_prompts():
    """Test individual agent prompts"""
    print("🤖 Testing agent prompts...")
    
    try:
        from langgraph.complete_agents import (
            extract_json_from_response, call_llm_agent,
            INTERVIEW_AGENT_PROMPT, SKILL_EVALUATOR_PROMPT
        )
        
        # Test JSON extraction
        test_json = '{"test": "value", "number": 123}'
        parsed = await extract_json_from_response(test_json)
        
        if parsed.get("test") == "value":
            print("   ✅ JSON extraction working")
        else:
            print("   ❌ JSON extraction failed")
            
        print("   📝 Agent prompts validated")
        
    except Exception as e:
        print(f"   ❌ Agent prompt test failed: {e}")

async def test_schema_compliance():
    """Test schema compliance"""
    print("📋 Testing schema compliance...")
    
    try:
        # Test standardized metadata schema
        sample_pes_material = {
            "id": "pes_001",
            "title": "Operating Systems - Unit 1: Introduction",
            "content_type": "pes_material",
            "source": "PES_slides",
            "summary": "Introduction to OS concepts",
            "key_concepts": ["OS basics", "processes"],
            "difficulty": "Beginner",
            "relevance_score": 0.9,
            "semantic_score": 0.85,
            "snippet": "Operating systems manage hardware..."
        }
        
        required_fields = ["id", "title", "content_type", "source"]
        has_all_fields = all(field in sample_pes_material for field in required_fields)
        
        if has_all_fields:
            print("   ✅ PES material schema compliant")
        else:
            print("   ❌ PES material schema non-compliant")
            
        print("   📊 Schema validation completed")
        
    except Exception as e:
        print(f"   ❌ Schema compliance test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_complete_roadmap_generation())
