#!/usr/bin/env python3
"""
Test Production Time Planner Agent
===================================

Test the new LLM-based Time Planner Agent to ensure it generates
realistic schedules with proper time allocation and milestones.
"""

import sys
import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

# Add Pipeline directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.production_time_planner_agent import ProductionTimePlannerAgent

logger = logging.getLogger(__name__)

async def test_time_planning():
    """Test time planning with realistic inputs"""
    try:
        logger.info("🎯 Testing Production Time Planner Agent")
        logger.info("=" * 80)
        
        agent = ProductionTimePlannerAgent()
        
        # Test data - Learning Phases
        learning_phases = [
            {
                "phase_id": 1,
                "title": "Operating Systems Fundamentals",
                "concepts": ["OS Introduction", "System Calls", "OS Architecture", "Process Basics"],
                "difficulty": "Beginner",
                "estimated_hours": 12,
                "learning_objectives": ["Understand OS role", "Learn system call interface"],
                "resources": {
                    "pes_materials": [{"title": "OS Unit 1", "duration_hours": 4}],
                    "reference_books": [{"title": "Operating System Concepts", "chapters": ["1", "2"]}]
                }
            },
            {
                "phase_id": 2,
                "title": "Process Management",
                "concepts": ["Processes", "Threads", "Scheduling Algorithms", "IPC"],
                "difficulty": "Intermediate",
                "estimated_hours": 15,
                "learning_objectives": ["Implement scheduling algorithms", "Understand process lifecycle"],
                "resources": {
                    "pes_materials": [{"title": "OS Unit 2", "duration_hours": 6}],
                    "reference_books": [{"title": "Operating System Concepts", "chapters": ["3", "4", "5"]}]
                }
            },
            {
                "phase_id": 3,
                "title": "Memory Management",
                "concepts": ["Memory Allocation", "Virtual Memory", "Paging", "Segmentation"],
                "difficulty": "Intermediate",
                "estimated_hours": 18,
                "learning_objectives": ["Design memory allocators", "Understand virtual memory"],
                "resources": {
                    "pes_materials": [{"title": "OS Unit 3", "duration_hours": 7}],
                    "reference_books": [{"title": "Operating System Concepts", "chapters": ["8", "9"]}]
                }
            },
            {
                "phase_id": 4,
                "title": "File Systems & Advanced Topics",
                "concepts": ["File Systems", "I/O Management", "Security", "Distributed Systems"],
                "difficulty": "Advanced", 
                "estimated_hours": 20,
                "learning_objectives": ["Implement file operations", "Understand security mechanisms"],
                "resources": {
                    "pes_materials": [{"title": "OS Unit 4", "duration_hours": 8}],
                    "reference_books": [{"title": "Operating System Concepts", "chapters": ["10", "11", "15"]}]
                }
            }
        ]
        
        # Test data - Course Project
        course_project = {
            "course_project": {
                "title": "Operating System Implementation",
                "description": "Design and implement a basic operating system with process management, memory allocation, and file systems.",
                "objectives": [
                    "Implement a basic operating system with process management",
                    "Design and implement a memory allocator", 
                    "Develop a file system with I/O management"
                ],
                "difficulty": "Intermediate",
                "estimated_time_hours": 40,
                "deliverables": [
                    {
                        "name": "Process Manager Implementation",
                        "type": "code",
                        "description": "Implement process creation, scheduling, and termination.",
                        "due_phase": 2,
                        "estimated_hours": 10
                    },
                    {
                        "name": "Memory Allocator Design",
                        "type": "design document",
                        "description": "Design a memory allocator with virtual memory support.",
                        "due_phase": 3,
                        "estimated_hours": 12
                    },
                    {
                        "name": "File System Implementation",
                        "type": "code", 
                        "description": "Implement file system with I/O management and security features.",
                        "due_phase": 4,
                        "estimated_hours": 18
                    }
                ],
                "milestones": [
                    {
                        "milestone": "Basic Process Management",
                        "description": "Implement basic process creation, scheduling, and termination.",
                        "phase": 2,
                        "estimated_hours": 8
                    },
                    {
                        "milestone": "Memory Allocator Design",
                        "description": "Design memory allocator with virtual memory support.",
                        "phase": 3,
                        "estimated_hours": 10
                    },
                    {
                        "milestone": "File System Integration",
                        "description": "Integrate file system with existing OS components.",
                        "phase": 4,
                        "estimated_hours": 12
                    },
                    {
                        "milestone": "Final System Testing",
                        "description": "Test complete OS implementation and create documentation.",
                        "phase": 4,
                        "estimated_hours": 10
                    }
                ]
            }
        }
        
        # Test data - User Constraints
        user_constraints = {
            "hours_per_week": 10,
            "preferred_pace": "normal",
            "schedule_flexibility": "moderate",
            "daily_commitment": "1.5-2 hours",
            "weekend_availability": "high",
            "learning_style": "hands-on",
            "review_preference": "frequent"
        }
        
        # Generate schedule
        logger.info("Generating learning schedule...")
        result = await agent.generate_schedule(
            learning_phases=learning_phases,
            course_project=course_project,
            user_constraints=user_constraints
        )
        
        # Validate results
        logger.info("📊 SCHEDULE GENERATION VALIDATION")
        logger.info("=" * 50)
        
        # Check basic structure
        assert "learning_schedule" in result, "Missing learning_schedule"
        assert "meta" in result, "Missing meta"
        
        schedule = result["learning_schedule"]
        
        # Check required fields
        required_fields = [
            "total_duration_weeks", "hours_per_week", "start_date",
            "end_date", "weekly_plan", "review_cycles", "project_timeline"
        ]
        
        for field in required_fields:
            assert field in schedule, f"Missing required field: {field}"
        
        # Check weekly plans
        assert len(schedule["weekly_plan"]) > 0, "No weekly plans found"
        logger.info(f"✅ Found {len(schedule['weekly_plan'])} weekly plans")
        
        total_hours = 0
        for week in schedule["weekly_plan"]:
            week_num = week.get("week", "Unknown")
            focus = week.get("focus", "Unknown")
            activities = week.get("activities", [])
            week_hours = sum(activity.get("duration_hours", 0) for activity in activities)
            total_hours += week_hours
            
            logger.info(f"  Week {week_num}: {focus} ({week_hours}h, {len(activities)} activities)")
            
            # Check activities structure
            for i, activity in enumerate(activities):
                activity_name = activity.get("activity", "Unknown")
                activity_type = activity.get("type", "Unknown")
                activity_hours = activity.get("duration_hours", 0)
                logger.info(f"    Activity {i+1}: {activity_name} ({activity_type}, {activity_hours}h)")
        
        # Check review cycles
        assert len(schedule["review_cycles"]) > 0, "No review cycles found"
        logger.info(f"✅ Found {len(schedule['review_cycles'])} review cycles")
        
        for i, review in enumerate(schedule["review_cycles"]):
            week = review.get("week", "Unknown")
            review_type = review.get("type", "Unknown")
            topics = review.get("topics", [])
            hours = review.get("duration_hours", 0)
            logger.info(f"  Review {i+1}: Week {week} ({review_type}) - {len(topics)} topics ({hours}h)")
        
        # Check project timeline
        assert len(schedule["project_timeline"]) > 0, "No project timeline found"
        logger.info(f"✅ Found {len(schedule['project_timeline'])} project milestones")
        
        for i, milestone in enumerate(schedule["project_timeline"]):
            name = milestone.get("milestone", "Unknown")
            week = milestone.get("week", "Unknown")
            deliverable = milestone.get("deliverable", "Unknown")
            hours = milestone.get("estimated_hours", 0)
            phase = milestone.get("phase_alignment", "Unknown")
            logger.info(f"  Milestone {i+1}: {name} - Week {week}, Phase {phase} ({hours}h)")
        
        # Log schedule summary
        logger.info("📋 SCHEDULE SUMMARY")
        logger.info("=" * 30)
        logger.info(f"Total Duration: {schedule['total_duration_weeks']} weeks")
        logger.info(f"Hours Per Week: {schedule['hours_per_week']}")
        logger.info(f"Total Scheduled Hours: {total_hours}")
        logger.info(f"Start Date: {schedule['start_date']}")
        logger.info(f"End Date: {schedule['end_date']}")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"time_planner_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"📁 Results saved to: {results_file}")
        
        logger.info("✅ TIME PLANNER TEST PASSED")
        return True
        
    except Exception as e:
        logger.error(f"❌ Time planner test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_dsa_schedule():
    """Test DSA schedule generation"""
    try:
        logger.info("\n🎯 Testing DSA Schedule Generation")
        logger.info("=" * 80)
        
        agent = ProductionTimePlannerAgent()
        
        # DSA learning phases
        learning_phases = [
            {
                "phase_id": 1,
                "title": "Basic Data Structures",
                "concepts": ["Arrays", "Linked Lists", "Stacks", "Queues"],
                "difficulty": "Beginner",
                "estimated_hours": 10
            },
            {
                "phase_id": 2,
                "title": "Trees and Graphs",
                "concepts": ["Binary Trees", "BST", "Graph Representation", "Traversals"],
                "difficulty": "Intermediate",
                "estimated_hours": 12
            },
            {
                "phase_id": 3,
                "title": "Sorting and Searching",
                "concepts": ["Sorting Algorithms", "Search Algorithms", "Hash Tables"],
                "difficulty": "Intermediate",
                "estimated_hours": 14
            },
            {
                "phase_id": 4,
                "title": "Advanced Algorithms",
                "concepts": ["Dynamic Programming", "Greedy Algorithms", "Graph Algorithms"],
                "difficulty": "Advanced",
                "estimated_hours": 16
            }
        ]
        
        # DSA project
        course_project = {
            "course_project": {
                "title": "Algorithm Visualization and Implementation Platform",
                "estimated_time_hours": 30,
                "deliverables": [
                    {"name": "Data Structure Library", "due_phase": 2, "estimated_hours": 10},
                    {"name": "Algorithm Implementations", "due_phase": 3, "estimated_hours": 12},
                    {"name": "Visualization Interface", "due_phase": 4, "estimated_hours": 8}
                ]
            }
        }
        
        # Generate schedule
        result = await agent.generate_schedule(
            learning_phases=learning_phases,
            course_project=course_project,
            user_constraints={"hours_per_week": 8, "preferred_pace": "fast"}
        )
        
        schedule = result["learning_schedule"]
        logger.info(f"DSA Schedule: {schedule['total_duration_weeks']} weeks")
        logger.info(f"Weekly Plans: {len(schedule['weekly_plan'])}")
        logger.info(f"Review Cycles: {len(schedule['review_cycles'])}")
        logger.info(f"Project Milestones: {len(schedule['project_timeline'])}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ DSA schedule test failed: {e}")
        return False

async def main():
    """Main test function"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger.info("🚀 TESTING PRODUCTION TIME PLANNER AGENT")
    logger.info("🎯 Goal: Validate LLM-based schedule generation with realistic time allocation")
    logger.info("📝 Expected: Comprehensive schedules with weekly plans, reviews, project integration")
    logger.info("=" * 100)
    
    # Test OS schedule
    os_success = await test_time_planning()
    
    # Test DSA schedule
    dsa_success = await test_dsa_schedule()
    
    # Final results
    logger.info("\n" + "=" * 100)
    logger.info("🏁 FINAL RESULTS")
    logger.info("=" * 100)
    logger.info(f"OS Schedule Generation: {'✅ PASS' if os_success else '❌ FAIL'}")
    logger.info(f"DSA Schedule Generation: {'✅ PASS' if dsa_success else '❌ FAIL'}")
    
    overall_success = os_success and dsa_success
    logger.info(f"Overall: {'✅ ALL TESTS PASSED' if overall_success else '❌ TESTS FAILED'}")
    
    if overall_success:
        logger.info("🎉 Production Time Planner is working correctly!")
        logger.info("📋 Next: Update final Roadmap Orchestrator")
    else:
        logger.info("🔧 Some tests failed - check logs for details")
    
    return overall_success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
