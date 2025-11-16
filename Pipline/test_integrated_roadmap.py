#!/usr/bin/env python3

"""
Test Integrated Roadmap Generator
=================================

Test individual agents first, then test the integrated pipeline.
This will help us debug and validate each component before integration.
"""

import sys
import os
import asyncio
import logging

# Add the Pipline directory to path
sys.path.append('/Users/sandeeph/Documents/s2/Axiona/Pipline')

from agents.base_agent import AgentState
from agents.interview_agent import InterviewAgent
from agents.skill_evaluator_agent import SkillEvaluatorAgent
from agents.gap_detector_agent import GapDetectorAgent
from agents.prerequisite_graph_agent import PrerequisiteGraphAgent
from agents.difficulty_estimator_agent import DifficultyEstimatorAgent
from agents.production_rag_pes_agent import ProductionRAGPESMaterialAgent
from agents.production_rag_reference_book_agent import ProductionRAGReferenceBookAgent
from agents.production_project_generator_agent import ProductionProjectGeneratorAgent
from agents.production_time_planner_agent import ProductionTimePlannerAgent

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_integrated_roadmap_step_by_step():
    """Test the integrated roadmap generation step by step"""
    
    print("🧪 TESTING INTEGRATED ROADMAP GENERATION")
    print("=" * 60)
    
    subject = "Operating Systems"
    
    # Initialize state
    state = AgentState(session_id="test_session", user_id="test_user")
    state.data["subject"] = subject
    state.data["user_background"] = "Computer Science student with basic programming knowledge"
    state.data["target_expertise"] = "Intermediate"
    state.data["time_constraints"] = {"hours_per_week": 10}
    
    # Initialize roadmap structure
    roadmap = {
        "subject": subject,
        "phases": [],
        "resources": {
            "pes_materials": {},
            "reference_books": {},
            "projects": {},
            "learning_schedule": {}
        }
    }
    state.data["roadmap"] = roadmap
    
    print(f"📋 Subject: {subject}")
    print(f"👤 Background: {state.data['user_background']}")
    print(f"🎯 Target Level: {state.data['target_expertise']}")
    print()
    
    try:
        # Step 1: Interview Agent (async)
        print("📝 STEP 1: Interview Agent")
        print("-" * 40)
        
        interview_agent = InterviewAgent()
        state = await interview_agent.process(state)
        
        if state.data.get("status") == "failed":
            print(f"❌ Interview failed: {state.data.get('error')}")
            return False
        
        interview_result = state.data.get("interview_result", {})
        questions = interview_result.get("questions", [])
        
        # Also check roadmap structure
        roadmap = state.data.get("roadmap", {})
        interview_data = roadmap.get("interview", {})
        roadmap_questions = interview_data.get("questions", [])
        
        actual_questions = questions if questions else roadmap_questions
        print(f"✅ Generated {len(actual_questions)} interview questions")
        for i, q in enumerate(actual_questions[:3], 1):  # Show first 3
            if isinstance(q, dict):
                question_text = q.get('question_text', q.get('question', 'N/A'))
                print(f"  {i}. {question_text[:60]}...")
        
        # Simulate interview answers for the pipeline
        mock_answers = [
            {
                "question_id": "q1",
                "answer": "I have basic knowledge of operating systems from my computer science coursework. I understand what an OS is but lack practical experience.",
                "confidence_level": 6
            },
            {
                "question_id": "q2", 
                "answer": "I want to learn OS concepts for job interviews and to understand how systems work internally.",
                "confidence_level": 8
            },
            {
                "question_id": "q3",
                "answer": "I can dedicate about 10 hours per week to studying, mostly evenings and weekends.",
                "confidence_level": 9
            },
            {
                "question_id": "q4",
                "answer": "I prefer a mix of theoretical concepts and hands-on practical examples.",
                "confidence_level": 7
            },
            {
                "question_id": "q5",
                "answer": "I find concurrent programming and system internals challenging but interesting.",
                "confidence_level": 5
            }
        ]
        
        # Add interview answers to both locations for compatibility
        interview_result["answers"] = mock_answers
        state.data["interview_result"] = interview_result
        
        # Also add to roadmap structure (where skill evaluator looks)
        if "interview" not in roadmap:
            roadmap["interview"] = {}
        roadmap["interview"]["answers"] = mock_answers
        state.data["roadmap"] = roadmap
        
        print(f"✅ Added {len(mock_answers)} mock interview answers for pipeline testing")
        
        # Step 2: Skill Evaluator (async)
        print(f"\n🎯 STEP 2: Skill Evaluator")
        print("-" * 40)
        
        skill_evaluator = SkillEvaluatorAgent()
        state = await skill_evaluator.process(state)
        
        if state.data.get("status") == "failed":
            print(f"❌ Skill evaluation failed: {state.data.get('error')}")
            return False
        
        skill_assessment = state.data.get("skill_assessment", {})
        current_level = skill_assessment.get("overall_level", "Unknown")
        strengths = skill_assessment.get("strengths", [])
        print(f"✅ Current Level: {current_level}")
        print(f"✅ Identified {len(strengths)} strengths")
        
        # Step 3: Gap Detector (async)
        print(f"\n🔍 STEP 3: Gap Detector")
        print("-" * 40)
        
        gap_detector = GapDetectorAgent()
        state = await gap_detector.process(state)
        
        if state.data.get("status") == "failed":
            print(f"❌ Gap detection failed: {state.data.get('error')}")
            return False
        
        gap_analysis = state.data.get("gap_analysis", {})
        critical_gaps = gap_analysis.get("critical_gaps", [])
        print(f"✅ Identified {len(critical_gaps)} critical knowledge gaps")
        
        # Step 4: Prerequisite Graph (async)
        print(f"\n📊 STEP 4: Prerequisite Graph")
        print("-" * 40)
        
        prerequisite_agent = PrerequisiteGraphAgent()
        state = await prerequisite_agent.process(state)
        
        if state.data.get("status") == "failed":
            print(f"❌ Prerequisite graph failed: {state.data.get('error')}")
            return False
        
        prerequisite_graph = state.data.get("prerequisite_graph", {})
        learning_phases = prerequisite_graph.get("learning_phases", [])
        print(f"✅ Generated {len(learning_phases)} learning phases")
        
        for phase in learning_phases:
            phase_id = phase.get("phase_id", 0)
            title = phase.get("title", "Unknown")
            concepts = phase.get("concepts", [])
            print(f"  Phase {phase_id}: {title} ({len(concepts)} concepts)")
        
        # Step 5: Difficulty Estimator (async)
        print(f"\n📈 STEP 5: Difficulty Estimator")
        print("-" * 40)
        
        difficulty_agent = DifficultyEstimatorAgent()
        state = await difficulty_agent.process(state)
        
        if state.data.get("status") == "failed":
            print(f"❌ Difficulty estimation failed: {state.data.get('error')}")
            return False
        
        difficulty_analysis = state.data.get("difficulty_analysis", {})
        print(f"✅ Difficulty analysis completed")
        
        # Step 6: Resource Retrieval (Test Phase 1 only)
        print(f"\n📚 STEP 6: Resource Retrieval (Phase 1)")
        print("-" * 40)
        
        if learning_phases:
            phase_1 = learning_phases[0]
            phase_concepts = phase_1.get("concepts", [])
            phase_difficulty = phase_1.get("difficulty", "Beginner")
            
            # Set phase context
            state.data["current_phase"] = 1
            state.data["phase_concepts"] = phase_concepts
            state.data["phase_difficulty"] = phase_difficulty
            
            print(f"Testing with Phase 1: {phase_1.get('title', 'Unknown')}")
            print(f"Concepts: {phase_concepts[:3]}...")
            print(f"Difficulty: {phase_difficulty}")
            
            # Test RAG PES Materials (sync)
            print(f"\n  📄 Testing RAG PES Materials...")
            pes_agent = ProductionRAGPESMaterialAgent()
            state = pes_agent.process(state)
            
            roadmap = state.data.get("roadmap", {})
            pes_materials = roadmap.get("pes_materials", {}).get("phase_1", {})
            pes_count = len(pes_materials.get("results", [])) if pes_materials.get("results") else 0
            print(f"  ✅ Found {pes_count} PES materials")
            
            # Test RAG Reference Books (sync)
            print(f"\n  📖 Testing RAG Reference Books...")
            book_agent = ProductionRAGReferenceBookAgent()
            state = book_agent.process(state)
            
            reference_books = roadmap.get("reference_books", {}).get("phase_1", {})
            book_result = reference_books.get("result")
            book_title = book_result.get("title", "None") if book_result else "None"
            print(f"  ✅ Selected book: {book_title[:40]}...")
        
        # Step 7: Project Generator (sync)
        print(f"\n🛠️ STEP 7: Project Generator")
        print("-" * 40)
        
        project_agent = ProductionProjectGeneratorAgent()
        state = project_agent.process(state)
        
        if state.data.get("status") == "failed":
            print(f"⚠️ Project generation failed: {state.data.get('error')}")
        else:
            course_project = state.data.get("course_project", {})
            project_info = course_project.get("project", {})
            project_title = project_info.get("title", "Unknown")
            milestones = project_info.get("milestones", [])
            print(f"✅ Generated project: {project_title}")
            print(f"✅ Project has {len(milestones)} milestones")
        
        # Step 8: Time Planner (sync)
        print(f"\n⏰ STEP 8: Time Planner")
        print("-" * 40)
        
        time_agent = ProductionTimePlannerAgent()
        state = time_agent.process(state)
        
        if state.data.get("status") == "failed":
            print(f"⚠️ Time planning failed: {state.data.get('error')}")
        else:
            learning_schedule = state.data.get("learning_schedule", {})
            schedule_info = learning_schedule.get("learning_schedule", {})
            duration_weeks = schedule_info.get("total_duration_weeks", 0)
            weekly_plans = schedule_info.get("weekly_plan", [])
            print(f"✅ Generated {duration_weeks}-week schedule")
            print(f"✅ Schedule has {len(weekly_plans)} weekly plans")
        
        # Final Summary
        print(f"\n" + "=" * 60)
        print("📊 INTEGRATION TEST SUMMARY")
        print("=" * 60)
        
        results = {
            "interview": bool(questions),
            "skill_evaluation": bool(current_level != "Unknown"),
            "gap_detection": bool(critical_gaps),
            "prerequisite_graph": bool(learning_phases),
            "difficulty_estimation": bool(difficulty_analysis),
            "pes_retrieval": pes_count > 0,
            "book_retrieval": bool(book_result),
            "project_generation": bool(course_project.get("project")),
            "time_planning": bool(learning_schedule.get("learning_schedule"))
        }
        
        successful_components = sum(results.values())
        total_components = len(results)
        
        print(f"✅ Successful Components: {successful_components}/{total_components}")
        
        for component, success in results.items():
            status = "✅" if success else "❌"
            print(f"{status} {component.replace('_', ' ').title()}")
        
        success_rate = (successful_components / total_components) * 100
        print(f"\n📈 Overall Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Integration test PASSED! System ready for production.")
        else:
            print("⚠️ Integration test needs improvement. Check failing components.")
        
        return success_rate >= 80
        
    except Exception as e:
        print(f"\n💥 Integration test failed with error: {e}")
        logger.error(f"Integration test error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 INTEGRATED ROADMAP GENERATION TEST")
    print("=" * 60)
    
    try:
        success = asyncio.run(test_integrated_roadmap_step_by_step())
        
        if success:
            print(f"\n✅ All tests completed successfully!")
            
        else:
            print(f"\n❌ Some tests failed. Check individual components.")
            
    except KeyboardInterrupt:
        print(f"\n⏹️ Test interrupted by user")
        
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        logger.error(f"Test suite error: {e}")
        sys.exit(1)
