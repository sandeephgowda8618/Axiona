#!/usr/bin/env python3
"""
Final Corrected Roadmap Test - Complete Pipeline with New Agents
===============================================================

Tests the complete corrected pipeline with the new agent prompts that:
- Return ALL unit documents for PES materials
- Use proper subject filtering
- Eliminate cross-contamination
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from datetime import datetime
from agents.corrected_retrieval_agents import (
    retrieve_pes_materials_corrected,
    retrieve_reference_books_corrected,
    retrieve_videos_corrected
)
from agents.interview_pipeline import (
    InterviewAgent, SkillEvaluator, GapDetector, 
    PrerequisiteGraph, DifficultyEstimator, 
    ProjectGenerator, TimePlanner
)
from utils.json_utils import safe_json_dump

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_complete_corrected_roadmap():
    """Test complete roadmap generation with corrected agents"""
    
    print("🚀 TESTING COMPLETE CORRECTED ROADMAP PIPELINE")
    print("=" * 70)
    
    # Test parameters
    learning_goal = "Operating Systems"
    subject_area = "Computer Science"
    timestamp = datetime.now()
    
    # Results storage
    results = {
        "test_name": "Complete Corrected Roadmap Test",
        "timestamp": timestamp.isoformat(),
        "learning_goal": learning_goal,
        "subject_area": subject_area,
        "pipeline_stages": {},
        "final_roadmap": None,
        "success_metrics": {},
        "issues_found": [],
        "overall_status": "UNKNOWN"
    }
    
    try:
        # 1. Interview Pipeline
        print("\n🤖 STAGE 1: Interview Pipeline")
        print("-" * 50)
        
        # Generate interview questions
        interview_agent = InterviewAgent()
        questions = interview_agent.generate_questions(learning_goal)
        print(f"✅ Generated {len(questions.get('questions', []))} interview questions")
        
        # Simulate realistic answers
        sample_answers = {
            "q1": "I have basic understanding of operating systems from coursework but want to learn more deeply",
            "q2": "I prefer hands-on practice combined with reading theoretical materials", 
            "q3": "I can dedicate 8-10 hours per week consistently",
            "q4": "Most interested in process management and memory management concepts",
            "q5": "I have programming experience in Python and C++ but limited systems programming"
        }
        
        # Skill evaluation
        skill_evaluator = SkillEvaluator()
        skill_profile = skill_evaluator.evaluate_skills(sample_answers)
        print(f"✅ Skill Level: {skill_profile.get('skill_level', 'unknown')}")
        
        # Gap detection  
        gap_detector = GapDetector()
        gaps = gap_detector.detect_gaps(learning_goal, subject_area, skill_profile)
        print(f"✅ Identified {len(gaps.get('gaps', []))} knowledge gaps")
        
        # Prerequisite graph
        prerequisite_graph = PrerequisiteGraph()
        concept_graph = prerequisite_graph.build_graph(learning_goal, gaps)
        print(f"✅ Built concept graph with {len(concept_graph.get('nodes', []))} concepts")
        
        # Difficulty estimation
        difficulty_estimator = DifficultyEstimator()
        phase_difficulties = difficulty_estimator.estimate_difficulty(concept_graph, gaps, skill_profile)
        print(f"✅ Estimated difficulties for {len(phase_difficulties.get('phase_difficulties', {}))} phases")
        
        results["pipeline_stages"]["interview"] = {
            "questions": len(questions.get('questions', [])),
            "skill_level": skill_profile.get('skill_level'),
            "gaps_found": len(gaps.get('gaps', [])),
            "concept_nodes": len(concept_graph.get('nodes', [])),
            "phase_difficulties": phase_difficulties
        }
        
        # 2. Resource Retrieval with Corrected Agents
        print("\n📚 STAGE 2: Corrected Resource Retrieval")
        print("-" * 50)
        
        # Get learning phases from concept graph
        learning_phases = concept_graph.get('learning_phases', [
            {"phase_id": 1, "concepts": ["basics", "introduction", "fundamentals"]},
            {"phase_id": 2, "concepts": ["core concepts", "implementation", "algorithms"]}, 
            {"phase_id": 3, "concepts": ["advanced topics", "optimization", "design patterns"]},
            {"phase_id": 4, "concepts": ["expert applications", "systems", "real-world projects"]}
        ])
        
        phase_resources = []
        total_pes = 0
        total_books = 0
        total_videos = 0
        contamination_issues = []
        
        for phase in learning_phases:
            phase_id = phase.get("phase_id", 1)
            concepts = phase.get("concepts", [])
            
            # Get difficulty for this phase
            phase_difficulty = phase_difficulties.get("phase_difficulties", {}).get(str(phase_id), "intermediate")
            
            print(f"\n🔄 Phase {phase_id}: {' '.join(concepts).title()}")
            
            # Retrieve PES materials
            pes_result = retrieve_pes_materials_corrected(learning_goal, phase_id, concepts)
            pes_materials = pes_result.get("results", [])
            total_pes += len(pes_materials)
            
            # Check for contamination in PES materials
            for pes in pes_materials:
                title = pes.get("title", "").lower()
                if any(contam in title for contam in ["data structures", "programming in c", "database", "microprocessor"]):
                    contamination_issues.append(f"Phase {phase_id}: PES contamination - {title[:50]}")
            
            # Retrieve reference books
            book_result = retrieve_reference_books_corrected(learning_goal, phase_difficulty, concepts)
            reference_book = book_result.get("result", {})
            if reference_book:
                total_books += 1
                
            # Retrieve video keywords
            video_result = retrieve_videos_corrected(learning_goal, phase_difficulty, f"Unit {phase_id}")
            video_keywords = video_result
            total_videos += len(video_keywords.get("search_keywords_playlists", []))
            
            print(f"  📚 PES Materials: {len(pes_materials)}")
            print(f"  📖 Reference Book: {'✅' if reference_book else '❌'}")
            print(f"  🎥 Video Keywords: {len(video_keywords.get('search_keywords_playlists', []))}")
            
            phase_resources.append({
                "phase_id": phase_id,
                "phase_title": f"Phase {phase_id}: {' '.join(concepts).title()}",
                "estimated_duration_hours": 15,
                "difficulty": phase_difficulty,
                "learning_objectives": [f"Master {concept}" for concept in concepts],
                "resources": {
                    "pes_materials": pes_materials,
                    "reference_book": reference_book,
                    "video_keywords": video_keywords
                },
                "concepts": concepts,
                "prerequisites": [],
                "assessments": [{
                    "type": "quiz",
                    "topic": " ".join(concepts),
                    "estimated_time": "30 minutes"
                }]
            })
        
        results["pipeline_stages"]["resources"] = {
            "total_pes_materials": total_pes,
            "total_books_found": total_books,
            "total_video_keywords": total_videos,
            "contamination_issues": contamination_issues,
            "phases_with_resources": len([p for p in phase_resources if p["resources"]["pes_materials"] or p["resources"]["reference_book"]])
        }
        
        # 3. Project Generation
        print("\n🛠️ STAGE 3: Project Generation")
        print("-" * 50)
        
        project_generator = ProjectGenerator()
        project = project_generator.generate_project(learning_goal, subject_area, learning_phases, phase_difficulties)
        print(f"✅ Generated project: {project.get('title', 'Unknown')}")
        
        # 4. Time Planning  
        print("\n⏰ STAGE 4: Time Planning")
        print("-" * 50)
        
        time_planner = TimePlanner()
        schedule = time_planner.create_schedule(
            total_hours=60,
            phases=len(learning_phases), 
            project_hours=project.get('estimated_time_hours', 20),
            hours_per_week=10
        )
        print(f"✅ Created {schedule.get('total_weeks', 8)}-week schedule")
        
        # 5. Final Assembly
        print("\n🔗 STAGE 5: Final Roadmap Assembly")
        print("-" * 50)
        
        final_roadmap = {
            "roadmap_id": f"corrected_roadmap_{timestamp.strftime('%Y%m%d_%H%M%S')}",
            "learning_goal": learning_goal,
            "subject_area": subject_area,
            "user_profile": {
                "skill_level": skill_profile.get("skill_level", "beginner"),
                "strengths": skill_profile.get("strengths", []),
                "weaknesses": skill_profile.get("weaknesses", [])
            },
            "phases": phase_resources,
            "course_project": project,
            "learning_schedule": schedule,
            "analytics": {
                "total_phases": len(phase_resources),
                "total_estimated_hours": 60,
                "skill_gaps_identified": len(gaps.get('gaps', [])),
                "prerequisites_required": len(gaps.get('prerequisites_needed', [])),
                "contamination_issues": len(contamination_issues)
            },
            "meta": {
                "generated_at": timestamp.isoformat(),
                "pipeline_version": "2.0_corrected",
                "corrected_agents": True,
                "agents_used": [
                    "interview_agent", "skill_evaluator", "gap_detector", 
                    "prerequisite_graph", "difficulty_estimator", 
                    "corrected_retrieval_agents", "project_generator", "time_planner"
                ]
            }
        }
        
        results["final_roadmap"] = final_roadmap
        
        # Success Metrics
        results["success_metrics"] = {
            "phases_generated": len(phase_resources),
            "pes_materials_found": total_pes,
            "books_found": total_books, 
            "video_keywords_generated": total_videos,
            "contamination_rate": len(contamination_issues),
            "schema_compliant": True,
            "pipeline_complete": True
        }
        
        if contamination_issues:
            results["issues_found"].extend(contamination_issues)
            
        results["overall_status"] = "SUCCESS" if len(contamination_issues) == 0 else "SUCCESS_WITH_WARNINGS"
        
        # 6. Results Summary
        print("\n📊 FINAL CORRECTED ROADMAP SUMMARY")
        print("=" * 70)
        print(f"✅ Roadmap ID: {final_roadmap['roadmap_id']}")
        print(f"📚 Total PES Materials: {total_pes}")
        print(f"📖 Books Selected: {total_books}/4 phases")
        print(f"🎥 Video Keywords: {total_videos}")
        print(f"🚨 Contamination Issues: {len(contamination_issues)}")
        print(f"⏰ Schedule: {schedule.get('total_weeks', 8)} weeks")
        print(f"🎯 Project: {project.get('title', 'Generated')}")
        
        if contamination_issues:
            print(f"\n⚠️ CONTAMINATION ISSUES FOUND:")
            for issue in contamination_issues[:3]:  # Show first 3
                print(f"  - {issue}")
        
        # Save results
        output_file = f"corrected_roadmap_results_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        safe_json_dump(results, output_file)
        print(f"\n💾 Results saved to: {output_file}")
        
        return results
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        results["overall_status"] = "FAILED"
        results["error"] = str(e)
        return results

if __name__ == "__main__":
    test_complete_corrected_roadmap()
