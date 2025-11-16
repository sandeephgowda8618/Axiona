"""
Complete Interview-Driven Roadmap Test
=====================================

This test simulates the full end-to-end flow:
1. Interview questions generation
2. Hardcoded answers submission 
3. Skill evaluation from answers
4. Gap detection and prerequisite analysis
5. Difficulty estimation
6. Resource retrieval (PES, books, videos)
7. Course project generation
8. Time schedule planning
9. Final roadmap JSON assembly and validation

Tests the complete multi-agent RAG educational system.
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

class CompleteRoadmapTester:
    """Tests the complete interview-driven roadmap generation pipeline"""
    
    def __init__(self):
        self.test_results = {}
        self.final_roadmap = None
    
    async def run_complete_test(self) -> Dict[str, Any]:
        """Run the complete end-to-end test"""
        logger.info("🚀 Starting Complete Interview-Driven Roadmap Test")
        
        try:
            # Test Configuration
            learning_goal = "Operating Systems"
            subject_area = "Computer Science"
            
            # Step 1: Test Interview Question Generation
            logger.info("\n📋 Step 1: Testing Interview Question Generation...")
            interview_data = await self._test_interview_generation(learning_goal, subject_area)
            
            # Step 2: Simulate User Answers (Hardcoded)
            logger.info("\n💬 Step 2: Simulating User Answers...")
            user_answers = self._generate_realistic_answers(interview_data)
            
            # Step 3: Test Skill Evaluation
            logger.info("\n🎯 Step 3: Testing Skill Evaluation...")
            skill_eval = await self._test_skill_evaluation(interview_data["interview_id"], user_answers)
            
            # Step 4: Test Gap Detection
            logger.info("\n🔍 Step 4: Testing Gap Detection...")
            gap_analysis = await self._test_gap_detection(learning_goal, skill_eval)
            
            # Step 5: Test Prerequisite Graph
            logger.info("\n🕸️  Step 5: Testing Prerequisite Graph...")
            prereq_graph = await self._test_prerequisite_graph(learning_goal, gap_analysis)
            
            # Step 6: Test Difficulty Estimation
            logger.info("\n📊 Step 6: Testing Difficulty Estimation...")
            difficulty_est = await self._test_difficulty_estimation(skill_eval, prereq_graph, learning_goal)
            
            # Step 7: Test Resource Retrieval
            logger.info("\n📚 Step 7: Testing Resource Retrieval...")
            resources = await self._test_resource_retrieval(learning_goal, subject_area)
            
            # Step 8: Test Project Generation
            logger.info("\n🛠️  Step 8: Testing Course Project Generation...")
            course_project = await self._test_project_generation(learning_goal, skill_eval, prereq_graph, resources)
            
            # Step 9: Test Time Planning
            logger.info("\n⏰ Step 9: Testing Time Planning...")
            schedule = await self._test_time_planning(resources, course_project)
            
            # Step 10: Test Complete Roadmap Generation
            logger.info("\n🗺️  Step 10: Testing Complete Roadmap Generation...")
            complete_roadmap = await self._test_complete_roadmap(learning_goal, subject_area, user_answers)
            
            # Step 11: Validate Final Roadmap JSON
            logger.info("\n✅ Step 11: Validating Final Roadmap JSON...")
            validation_results = self._validate_roadmap_schema(complete_roadmap)
            
            # Compile Results
            test_summary = {
                "test_name": "Complete Interview-Driven Roadmap Test",
                "timestamp": datetime.now().isoformat(),
                "learning_goal": learning_goal,
                "subject_area": subject_area,
                "steps_completed": 11,
                "results": {
                    "interview_generation": self.test_results.get("interview_generation", {}),
                    "skill_evaluation": self.test_results.get("skill_evaluation", {}),
                    "gap_detection": self.test_results.get("gap_detection", {}),
                    "prerequisite_graph": self.test_results.get("prerequisite_graph", {}),
                    "difficulty_estimation": self.test_results.get("difficulty_estimation", {}),
                    "resource_retrieval": self.test_results.get("resource_retrieval", {}),
                    "project_generation": self.test_results.get("project_generation", {}),
                    "time_planning": self.test_results.get("time_planning", {}),
                    "complete_roadmap": self.test_results.get("complete_roadmap", {}),
                    "validation": validation_results
                },
                "final_roadmap": complete_roadmap,
                "overall_status": "SUCCESS" if all(r.get("success", False) for r in self.test_results.values()) else "PARTIAL"
            }
            
            logger.info(f"\n🎉 Complete Test Finished: {test_summary['overall_status']}")
            return test_summary
            
        except Exception as e:
            logger.error(f"❌ Complete test failed: {e}")
            return {
                "test_name": "Complete Interview-Driven Roadmap Test",
                "timestamp": datetime.now().isoformat(),
                "status": "FAILED",
                "error": str(e),
                "results": self.test_results
            }
    
    async def _test_interview_generation(self, learning_goal: str, subject_area: str) -> Dict[str, Any]:
        """Test interview question generation"""
        try:
            interview_data = await interview_agent.generate_questions(
                learning_goal=learning_goal,
                subject_area=subject_area,
                num_questions=5
            )
            
            success = (
                "questions" in interview_data and 
                len(interview_data["questions"]) == 5 and
                "interview_id" in interview_data
            )
            
            self.test_results["interview_generation"] = {
                "success": success,
                "num_questions": len(interview_data.get("questions", [])),
                "interview_id": interview_data.get("interview_id"),
                "has_progress": "progress" in interview_data
            }
            
            logger.info(f"✅ Interview generation: {len(interview_data.get('questions', []))} questions generated")
            return interview_data
            
        except Exception as e:
            logger.error(f"❌ Interview generation failed: {e}")
            self.test_results["interview_generation"] = {"success": False, "error": str(e)}
            raise
    
    def _generate_realistic_answers(self, interview_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate realistic user answers for testing"""
        answers = {}
        
        # Sample realistic answers for OS learning
        sample_responses = [
            "I have some basic understanding of operating systems from coursework but want to learn more deeply",
            "I prefer a combination of reading and hands-on practice, with video explanations for complex topics",
            "I can dedicate about 8-10 hours per week to learning",
            "I'm most interested in understanding how memory management and process scheduling work",
            "I have basic programming knowledge in Python and some C++ but limited systems programming experience"
        ]
        
        questions = interview_data.get("questions", [])
        for i, question in enumerate(questions):
            q_id = question["id"]
            q_type = question.get("type", "open_ended")
            
            if q_type == "scale":
                answers[q_id] = "3"  # Intermediate level
            elif q_type == "multiple_choice":
                answers[q_id] = question.get("options", ["Some experience"])[0]
            else:  # open_ended
                answers[q_id] = sample_responses[i % len(sample_responses)]
        
        logger.info(f"📝 Generated {len(answers)} realistic answers")
        return answers
    
    async def _test_skill_evaluation(self, interview_id: str, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Test skill evaluation from answers"""
        try:
            skill_eval = await skill_evaluator.evaluate_skills(interview_id, answers)
            
            success = (
                "skill_evaluation" in skill_eval and
                "overall_level" in skill_eval["skill_evaluation"]
            )
            
            self.test_results["skill_evaluation"] = {
                "success": success,
                "overall_level": skill_eval.get("skill_evaluation", {}).get("overall_level"),
                "has_strengths": bool(skill_eval.get("skill_evaluation", {}).get("strengths")),
                "has_weaknesses": bool(skill_eval.get("skill_evaluation", {}).get("weaknesses"))
            }
            
            logger.info(f"✅ Skill evaluation: Level = {skill_eval.get('skill_evaluation', {}).get('overall_level', 'unknown')}")
            return skill_eval
            
        except Exception as e:
            logger.error(f"❌ Skill evaluation failed: {e}")
            self.test_results["skill_evaluation"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_gap_detection(self, learning_goal: str, skill_eval: Dict[str, Any]) -> Dict[str, Any]:
        """Test knowledge gap detection"""
        try:
            gap_analysis = await gap_detector.detect_gaps(learning_goal, skill_eval, "intermediate")
            
            success = (
                "gap_analysis" in gap_analysis and
                "identified_gaps" in gap_analysis["gap_analysis"]
            )
            
            gaps = gap_analysis.get("gap_analysis", {}).get("identified_gaps", [])
            self.test_results["gap_detection"] = {
                "success": success,
                "num_gaps": len(gaps),
                "has_prerequisites": bool(gap_analysis.get("gap_analysis", {}).get("missing_prerequisites")),
                "has_recommendations": bool(gap_analysis.get("gap_analysis", {}).get("learning_path_recommendations"))
            }
            
            logger.info(f"✅ Gap detection: {len(gaps)} gaps identified")
            return gap_analysis
            
        except Exception as e:
            logger.error(f"❌ Gap detection failed: {e}")
            self.test_results["gap_detection"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_prerequisite_graph(self, learning_goal: str, gap_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Test prerequisite graph generation"""
        try:
            prereq_graph = await prerequisite_graph.build_prerequisite_graph(learning_goal, gap_analysis)
            
            success = (
                "prerequisite_graph" in prereq_graph and
                "nodes" in prereq_graph["prerequisite_graph"]
            )
            
            nodes = prereq_graph.get("prerequisite_graph", {}).get("nodes", [])
            edges = prereq_graph.get("prerequisite_graph", {}).get("edges", [])
            
            self.test_results["prerequisite_graph"] = {
                "success": success,
                "num_nodes": len(nodes),
                "num_edges": len(edges),
                "has_learning_phases": bool(prereq_graph.get("prerequisite_graph", {}).get("learning_phases"))
            }
            
            logger.info(f"✅ Prerequisite graph: {len(nodes)} nodes, {len(edges)} edges")
            return prereq_graph
            
        except Exception as e:
            logger.error(f"❌ Prerequisite graph failed: {e}")
            self.test_results["prerequisite_graph"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_difficulty_estimation(self, skill_eval: Dict[str, Any], prereq_graph: Dict[str, Any], target_goal: str) -> Dict[str, Any]:
        """Test difficulty level estimation"""
        try:
            difficulty_est = await difficulty_estimator.estimate_difficulty(skill_eval, prereq_graph, target_goal)
            
            success = (
                "difficulty_estimation" in difficulty_est and
                "recommended_progression" in difficulty_est["difficulty_estimation"]
            )
            
            progression = difficulty_est.get("difficulty_estimation", {}).get("recommended_progression", [])
            
            self.test_results["difficulty_estimation"] = {
                "success": success,
                "num_phases": len(progression),
                "has_adaptive_factors": bool(difficulty_est.get("difficulty_estimation", {}).get("adaptive_factors")),
                "has_adjustments": bool(difficulty_est.get("difficulty_estimation", {}).get("difficulty_adjustments"))
            }
            
            logger.info(f"✅ Difficulty estimation: {len(progression)} phases planned")
            return difficulty_est
            
        except Exception as e:
            logger.error(f"❌ Difficulty estimation failed: {e}")
            self.test_results["difficulty_estimation"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_resource_retrieval(self, learning_goal: str, subject_area: str) -> Dict[str, Any]:
        """Test resource retrieval agents"""
        try:
            # Test each retrieval agent
            pdf_results = await retrieval_agents.pdf_search_agent(f"{learning_goal} fundamentals", k=5)
            book_results = await retrieval_agents.book_search_agent(learning_goal, k=3)
            video_results = await retrieval_agents.video_search_agent(f"{learning_goal} tutorial", k=4)
            
            success = all([
                "results" in pdf_results,
                "results" in book_results,
                "results" in video_results
            ])
            
            self.test_results["resource_retrieval"] = {
                "success": success,
                "pdf_results": len(pdf_results.get("results", [])),
                "book_results": len(book_results.get("results", [])),
                "video_results": len(video_results.get("results", []))
            }
            
            resources = {
                "pdf_results": pdf_results,
                "book_results": book_results,
                "video_results": video_results
            }
            
            logger.info(f"✅ Resource retrieval: {sum([len(r.get('results', [])) for r in resources.values()])} total resources")
            return resources
            
        except Exception as e:
            logger.error(f"❌ Resource retrieval failed: {e}")
            self.test_results["resource_retrieval"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_project_generation(self, learning_goal: str, skill_eval: Dict[str, Any], prereq_graph: Dict[str, Any], resources: Dict[str, Any]) -> Dict[str, Any]:
        """Test course project generation"""
        try:
            # Create mock phases data for project generation
            mock_phases = [
                {"phase_id": 1, "concepts": ["OS basics", "processes"], "estimated_hours": 15},
                {"phase_id": 2, "concepts": ["memory management", "paging"], "estimated_hours": 15},
                {"phase_id": 3, "concepts": ["file systems", "I/O"], "estimated_hours": 15},
                {"phase_id": 4, "concepts": ["synchronization", "deadlocks"], "estimated_hours": 15}
            ]
            
            skill_level = skill_eval.get("skill_evaluation", {}).get("overall_level", "beginner")
            
            course_project = await project_generator.generate_course_project(
                learning_goal=learning_goal,
                skill_level=skill_level,
                prerequisite_graph=prereq_graph,
                phases_content=mock_phases
            )
            
            success = (
                "course_project" in course_project and
                "title" in course_project["course_project"]
            )
            
            project_data = course_project.get("course_project", {})
            
            self.test_results["project_generation"] = {
                "success": success,
                "project_title": project_data.get("title"),
                "has_deliverables": bool(project_data.get("deliverables")),
                "has_milestones": bool(project_data.get("milestones")),
                "estimated_hours": project_data.get("estimated_time_hours", 0)
            }
            
            logger.info(f"✅ Project generation: '{project_data.get('title', 'Unknown')}' ({project_data.get('estimated_time_hours', 0)}h)")
            return course_project
            
        except Exception as e:
            logger.error(f"❌ Project generation failed: {e}")
            self.test_results["project_generation"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_time_planning(self, resources: Dict[str, Any], course_project: Dict[str, Any]) -> Dict[str, Any]:
        """Test time planning and scheduling"""
        try:
            # Create mock phases for scheduling
            mock_phases = [
                {"phase_id": 1, "estimated_duration_hours": 15},
                {"phase_id": 2, "estimated_duration_hours": 15},
                {"phase_id": 3, "estimated_duration_hours": 15},
                {"phase_id": 4, "estimated_duration_hours": 15}
            ]
            
            user_constraints = {
                "hours_per_week": 10,
                "preferred_pace": "normal",
                "deadline": "2026-02-01"
            }
            
            schedule = await time_planner.generate_schedule(
                phases=mock_phases,
                course_project=course_project,
                user_constraints=user_constraints
            )
            
            success = (
                "learning_schedule" in schedule and
                "weekly_plan" in schedule["learning_schedule"]
            )
            
            schedule_data = schedule.get("learning_schedule", {})
            weekly_plan = schedule_data.get("weekly_plan", [])
            
            self.test_results["time_planning"] = {
                "success": success,
                "total_weeks": schedule_data.get("total_duration_weeks", 0),
                "hours_per_week": schedule_data.get("hours_per_week", 0),
                "weekly_activities": len(weekly_plan),
                "has_milestones": bool(schedule_data.get("project_timeline"))
            }
            
            logger.info(f"✅ Time planning: {schedule_data.get('total_duration_weeks', 0)} weeks, {len(weekly_plan)} activities")
            return schedule
            
        except Exception as e:
            logger.error(f"❌ Time planning failed: {e}")
            self.test_results["time_planning"] = {"success": False, "error": str(e)}
            raise
    
    async def _test_complete_roadmap(self, learning_goal: str, subject_area: str, user_answers: Dict[str, Any]) -> Dict[str, Any]:
        """Test complete roadmap generation using interview pipeline"""
        try:
            user_constraints = {
                "hours_per_week": 10,
                "preferred_pace": "normal",
                "deadline": "2026-03-01"
            }
            
            complete_roadmap = await roadmap_builder.build_interview_driven_roadmap(
                learning_goal=learning_goal,
                subject_area=subject_area,
                interview_answers=user_answers,
                user_constraints=user_constraints
            )
            
            success = (
                "phases" in complete_roadmap and
                "course_project" in complete_roadmap and
                "learning_schedule" in complete_roadmap
            )
            
            phases = complete_roadmap.get("phases", [])
            
            self.test_results["complete_roadmap"] = {
                "success": success,
                "roadmap_id": complete_roadmap.get("roadmap_id"),
                "num_phases": len(phases),
                "has_project": bool(complete_roadmap.get("course_project")),
                "has_schedule": bool(complete_roadmap.get("learning_schedule")),
                "pipeline_version": complete_roadmap.get("meta", {}).get("pipeline_version")
            }
            
            self.final_roadmap = complete_roadmap
            
            logger.info(f"✅ Complete roadmap: {len(phases)} phases, project included, schedule generated")
            return complete_roadmap
            
        except Exception as e:
            logger.error(f"❌ Complete roadmap failed: {e}")
            self.test_results["complete_roadmap"] = {"success": False, "error": str(e)}
            raise
    
    def _validate_roadmap_schema(self, roadmap: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the final roadmap JSON against the specified schema"""
        try:
            validation_results = {
                "schema_valid": True,
                "errors": [],
                "warnings": []
            }
            
            # Required top-level fields
            required_fields = ["roadmap_id", "learning_goal", "phases", "course_project", "learning_schedule", "meta"]
            for field in required_fields:
                if field not in roadmap:
                    validation_results["errors"].append(f"Missing required field: {field}")
                    validation_results["schema_valid"] = False
            
            # Validate phases structure
            phases = roadmap.get("phases", [])
            if not phases:
                validation_results["errors"].append("No phases found")
                validation_results["schema_valid"] = False
            else:
                for i, phase in enumerate(phases):
                    phase_errors = []
                    required_phase_fields = ["phase_id", "phase_title", "estimated_duration_hours"]
                    
                    for field in required_phase_fields:
                        if field not in phase:
                            phase_errors.append(f"Phase {i+1} missing field: {field}")
                    
                    if phase_errors:
                        validation_results["errors"].extend(phase_errors)
                        validation_results["schema_valid"] = False
            
            # Validate course project structure
            course_project = roadmap.get("course_project", {})
            if not course_project:
                validation_results["errors"].append("Course project missing")
                validation_results["schema_valid"] = False
            else:
                required_project_fields = ["title", "description", "estimated_time_hours"]
                for field in required_project_fields:
                    if field not in course_project:
                        validation_results["errors"].append(f"Course project missing field: {field}")
                        validation_results["schema_valid"] = False
            
            # Validate learning schedule
            schedule = roadmap.get("learning_schedule", {})
            if not schedule:
                validation_results["errors"].append("Learning schedule missing")
                validation_results["schema_valid"] = False
            else:
                required_schedule_fields = ["total_duration_weeks", "weekly_plan"]
                for field in required_schedule_fields:
                    if field not in schedule:
                        validation_results["errors"].append(f"Learning schedule missing field: {field}")
                        validation_results["schema_valid"] = False
            
            # Validation summary
            validation_results["total_errors"] = len(validation_results["errors"])
            validation_results["total_warnings"] = len(validation_results["warnings"])
            
            if validation_results["schema_valid"]:
                logger.info("✅ Roadmap schema validation: PASSED")
            else:
                logger.warning(f"⚠️ Roadmap schema validation: FAILED ({validation_results['total_errors']} errors)")
            
            return validation_results
            
        except Exception as e:
            logger.error(f"❌ Schema validation failed: {e}")
            return {
                "schema_valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "warnings": [],
                "total_errors": 1,
                "total_warnings": 0
            }


async def main():
    """Main test execution"""
    print("🎯 Starting Complete Interview-Driven Roadmap Test")
    print("=" * 60)
    
    tester = CompleteRoadmapTester()
    results = await tester.run_complete_test()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    # Print summary
    print(f"Overall Status: {results.get('overall_status', 'UNKNOWN')}")
    print(f"Learning Goal: {results.get('learning_goal', 'N/A')}")
    print(f"Steps Completed: {results.get('steps_completed', 0)}")
    
    # Print individual step results
    step_results = results.get("results", {})
    for step_name, step_data in step_results.items():
        status = "✅ PASS" if step_data.get("success", False) else "❌ FAIL"
        print(f"{step_name}: {status}")
        if not step_data.get("success", False) and "error" in step_data:
            print(f"  Error: {step_data['error']}")
    
    # Save detailed results
    output_file = f"complete_roadmap_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # Convert ObjectIds to strings for JSON serialization
    def convert_objectids(obj):
        if hasattr(obj, '__dict__'):
            for key, value in obj.__dict__.items():
                if hasattr(value, '__name__') and value.__name__ == 'ObjectId':
                    obj.__dict__[key] = str(value)
        return obj
    
    # Clean the results for JSON serialization using enhanced utility
    print(f"\n📁 Saving detailed test results to: {output_file}")
    
    # First check if results are JSON serializable
    is_serializable, error_msg = validate_json_serializable(results)
    if not is_serializable:
        print(f"⚠️ JSON serialization issue detected: {error_msg}")
        print("🔧 Applying ObjectId cleanup...")
    
    # Use safe JSON dump with ObjectId handling
    success = safe_json_dump(results, output_file)
    if success:
        print(f"✅ Test results successfully saved to: {output_file}")
    else:
        print(f"❌ Failed to save test results to: {output_file}")
        print("📝 Will continue with summary display...")
    
    # Print final roadmap summary if available
    if "final_roadmap" in results:
        roadmap = results["final_roadmap"]
        print(f"\n🗺️ FINAL ROADMAP SUMMARY:")
        print(f"  Roadmap ID: {roadmap.get('roadmap_id', 'N/A')}")
        print(f"  Phases: {len(roadmap.get('phases', []))}")
        print(f"  Has Project: {'Yes' if roadmap.get('course_project') else 'No'}")
        print(f"  Has Schedule: {'Yes' if roadmap.get('learning_schedule') else 'No'}")
        print(f"  Total Estimated Hours: {roadmap.get('analytics', {}).get('total_estimated_hours', 0)}")
    
    print("\n🏁 Test completed!")
    return results


if __name__ == "__main__":
    asyncio.run(main())
