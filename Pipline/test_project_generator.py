#!/usr/bin/env python3
"""
Test Production Project Generator Agent
=======================================

Test the new LLM-based Project Generator Agent to ensure it generates
proper project structures without fallbacks.
"""

import sys
import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

# Add Pipeline directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.production_project_generator_agent import ProductionProjectGeneratorAgent

logger = logging.getLogger(__name__)

async def test_project_generation():
    """Test project generation with realistic inputs"""
    try:
        logger.info("🎯 Testing Production Project Generator Agent")
        logger.info("=" * 80)
        
        agent = ProductionProjectGeneratorAgent()
        
        # Test data - Operating Systems
        learning_goal = "Operating Systems"
        skill_level = "Intermediate"
        
        prerequisite_graph = {
            "prerequisites": [
                {"concept": "Basic Programming", "importance": 0.9},
                {"concept": "Data Structures", "importance": 0.8},
                {"concept": "Computer Architecture", "importance": 0.7}
            ],
            "learning_path": ["Fundamentals", "Process Management", "Memory Management", "Advanced Topics"]
        }
        
        phases_content = [
            {
                "phase_id": 1,
                "title": "OS Fundamentals", 
                "concepts": ["OS Introduction", "System Calls", "OS Architecture"],
                "difficulty": "Beginner",
                "learning_objectives": ["Understand OS role", "Learn system call interface"]
            },
            {
                "phase_id": 2,
                "title": "Process Management",
                "concepts": ["Processes", "Threads", "Scheduling Algorithms"],
                "difficulty": "Intermediate", 
                "learning_objectives": ["Implement scheduling algorithms", "Understand process lifecycle"]
            },
            {
                "phase_id": 3,
                "title": "Memory Management",
                "concepts": ["Memory Allocation", "Virtual Memory", "Paging"],
                "difficulty": "Intermediate",
                "learning_objectives": ["Design memory allocators", "Understand virtual memory"]
            },
            {
                "phase_id": 4,
                "title": "File Systems & Advanced Topics",
                "concepts": ["File Systems", "I/O Management", "Security"],
                "difficulty": "Advanced",
                "learning_objectives": ["Implement file operations", "Understand security mechanisms"]
            }
        ]
        
        # Generate project
        logger.info("Generating project...")
        result = await agent.generate_course_project(
            learning_goal=learning_goal,
            skill_level=skill_level,
            prerequisite_graph=prerequisite_graph,
            phases_content=phases_content
        )
        
        # Validate results
        logger.info("📊 PROJECT GENERATION VALIDATION")
        logger.info("=" * 50)
        
        # Check basic structure
        assert "course_project" in result, "Missing course_project"
        assert "meta" in result, "Missing meta"
        
        project = result["course_project"]
        
        # Check required fields
        required_fields = [
            "title", "description", "objectives", "difficulty", 
            "estimated_time_hours", "deliverables", "milestones", 
            "assessment_criteria"
        ]
        
        for field in required_fields:
            assert field in project, f"Missing required field: {field}"
        
        # Check deliverables
        assert len(project["deliverables"]) > 0, "No deliverables found"
        logger.info(f"✅ Found {len(project['deliverables'])} deliverables")
        
        for i, deliverable in enumerate(project["deliverables"]):
            name = deliverable.get("name", "Unknown")
            del_type = deliverable.get("type", "Unknown")
            due_phase = deliverable.get("due_phase", "Unknown")
            logger.info(f"  Deliverable {i+1}: {name} ({del_type}) - Due Phase {due_phase}")
        
        # Check milestones
        assert len(project["milestones"]) > 0, "No milestones found"
        logger.info(f"✅ Found {len(project['milestones'])} milestones")
        
        for i, milestone in enumerate(project["milestones"]):
            name = milestone.get("milestone", "Unknown")
            phase = milestone.get("phase", "Unknown")
            hours = milestone.get("estimated_hours", "Unknown")
            logger.info(f"  Milestone {i+1}: {name} - Phase {phase} ({hours}h)")
        
        # Check assessment criteria
        assert len(project["assessment_criteria"]) > 0, "No assessment criteria found"
        total_weight = sum(criterion.get("weight", 0) for criterion in project["assessment_criteria"])
        logger.info(f"✅ Found {len(project['assessment_criteria'])} assessment criteria (total weight: {total_weight:.2f})")
        
        for criterion in project["assessment_criteria"]:
            name = criterion.get("criterion", "Unknown")
            weight = criterion.get("weight", 0)
            logger.info(f"  Criterion: {name} ({weight:.1%})")
        
        # Log project details
        logger.info("📋 PROJECT DETAILS")
        logger.info("=" * 30)
        logger.info(f"Title: {project['title']}")
        logger.info(f"Difficulty: {project['difficulty']}")
        logger.info(f"Estimated Time: {project['estimated_time_hours']} hours")
        logger.info(f"Description: {project['description'][:100]}...")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"project_generator_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"📁 Results saved to: {results_file}")
        
        logger.info("✅ PROJECT GENERATOR TEST PASSED")
        return True
        
    except Exception as e:
        logger.error(f"❌ Project generator test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_dsa_project():
    """Test DSA project generation"""
    try:
        logger.info("\n🎯 Testing DSA Project Generation")
        logger.info("=" * 80)
        
        agent = ProductionProjectGeneratorAgent()
        
        # Test data - Data Structures & Algorithms
        learning_goal = "Data Structures & Algorithms"
        skill_level = "Beginner"
        
        prerequisite_graph = {
            "prerequisites": [
                {"concept": "Programming Fundamentals", "importance": 0.9},
                {"concept": "Mathematics", "importance": 0.7}
            ],
            "learning_path": ["Arrays & Strings", "Trees & Graphs", "Algorithms", "Advanced Concepts"]
        }
        
        phases_content = [
            {
                "phase_id": 1,
                "title": "Basic Data Structures",
                "concepts": ["Arrays", "Linked Lists", "Stacks", "Queues"],
                "difficulty": "Beginner"
            },
            {
                "phase_id": 2,
                "title": "Trees and Graphs",
                "concepts": ["Binary Trees", "BST", "Graph Representation"],
                "difficulty": "Intermediate"
            },
            {
                "phase_id": 3,
                "title": "Sorting and Searching",
                "concepts": ["Sorting Algorithms", "Search Algorithms", "Hash Tables"],
                "difficulty": "Intermediate"
            },
            {
                "phase_id": 4,
                "title": "Advanced Algorithms",
                "concepts": ["Dynamic Programming", "Greedy Algorithms", "Graph Algorithms"],
                "difficulty": "Advanced"
            }
        ]
        
        # Generate project
        result = await agent.generate_course_project(
            learning_goal=learning_goal,
            skill_level=skill_level,
            prerequisite_graph=prerequisite_graph,
            phases_content=phases_content
        )
        
        project = result["course_project"]
        logger.info(f"DSA Project: {project['title']}")
        logger.info(f"Deliverables: {len(project['deliverables'])}")
        logger.info(f"Time Estimate: {project['estimated_time_hours']} hours")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ DSA project test failed: {e}")
        return False

async def main():
    """Main test function"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger.info("🚀 TESTING PRODUCTION PROJECT GENERATOR AGENT")
    logger.info("🎯 Goal: Validate LLM-based project generation with strict schema")
    logger.info("📝 Expected: Comprehensive projects with deliverables, milestones, assessments")
    logger.info("=" * 100)
    
    # Test OS project
    os_success = await test_project_generation()
    
    # Test DSA project 
    dsa_success = await test_dsa_project()
    
    # Final results
    logger.info("\n" + "=" * 100)
    logger.info("🏁 FINAL RESULTS")
    logger.info("=" * 100)
    logger.info(f"OS Project Generation: {'✅ PASS' if os_success else '❌ FAIL'}")
    logger.info(f"DSA Project Generation: {'✅ PASS' if dsa_success else '❌ FAIL'}")
    
    overall_success = os_success and dsa_success
    logger.info(f"Overall: {'✅ ALL TESTS PASSED' if overall_success else '❌ TESTS FAILED'}")
    
    if overall_success:
        logger.info("🎉 Production Project Generator is working correctly!")
        logger.info("📋 Next: Update Time Planner Agent")
    else:
        logger.info("🔧 Some tests failed - check logs for details")
    
    return overall_success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
