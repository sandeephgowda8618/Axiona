#!/usr/bin/env python3
"""
Data Structures and Algorithms Roadmap Generation Test
====================================================

Tests roadmap generation specifically for DSA subject using the corrected agents.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Import JSON utilities for ObjectId handling
from utils.json_utils import stringify_ids, safe_json_dump

from agents.interview_pipeline import (
    interview_agent, skill_evaluator, gap_detector,
    prerequisite_graph, difficulty_estimator, project_generator, time_planner
)
from agents.roadmap_builder_standardized import roadmap_builder

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_dsa_roadmap():
    """Generate a complete roadmap for Data Structures and Algorithms"""
    
    print("🚀 GENERATING DATA STRUCTURES AND ALGORITHMS ROADMAP")
    print("=" * 70)
    
    learning_goal = "Data Structures and Algorithms"
    subject_area = "Computer Science"
    timestamp = datetime.now()
    
    results = {
        "test_name": "DSA Roadmap Generation Test",
        "timestamp": timestamp.isoformat(),
        "learning_goal": learning_goal,
        "subject_area": subject_area,
        "steps_completed": 0,
        "results": {},
        "final_roadmap": None,
        "overall_status": "UNKNOWN"
    }
    
    try:
        # Step 1: Generate interview questions
        print("\n📋 Step 1: Generating Interview Questions...")
        questions_result = await interview_agent.generate_questions(learning_goal, subject_area)
        
        if questions_result and "questions" in questions_result:
            print(f"✅ Generated {len(questions_result['questions'])} interview questions")
            results["results"]["interview_generation"] = {
                "success": True,
                "num_questions": len(questions_result['questions']),
                "questions": questions_result['questions']
            }
        else:
            print("⚠️ Using fallback questions")
            results["results"]["interview_generation"] = {
                "success": False,
                "fallback_used": True
            }
        
        results["steps_completed"] += 1
        
        # Step 2: Simulate realistic DSA answers
        print("\n💬 Step 2: Simulating DSA-specific Answers...")
        dsa_answers = {
            "q1": "I have basic programming knowledge and understand simple data structures like arrays and linked lists, but want to master advanced algorithms and data structures for technical interviews and competitive programming.",
            "q2": "I prefer learning through coding practice and solving problems, combined with understanding the theoretical foundations and time complexity analysis.",
            "q3": "I can dedicate 12-15 hours per week consistently for learning and practicing DSA problems.",
            "q4": "I'm most interested in graph algorithms, dynamic programming, and tree data structures for their applications in real-world problem solving.",
            "q5": "I have strong programming skills in Python and Java, experience with basic sorting algorithms, but need to improve on advanced topics like backtracking and greedy algorithms."
        }
        print(f"📝 Generated {len(dsa_answers)} realistic DSA answers")
        results["steps_completed"] += 1
        
        # Step 3: Skill evaluation
        print("\n🎯 Step 3: Evaluating DSA Skills...")
        try:
            skill_result = await skill_evaluator.evaluate_skills("dsa_interview_001", dsa_answers)
        except:
            skill_result = None
        
        if skill_result:
            print(f"✅ Skill evaluation: Level = {skill_result.get('skill_level', 'unknown')}")
            results["results"]["skill_evaluation"] = {
                "success": True,
                "overall_level": skill_result.get('skill_level', 'beginner'),
                "has_strengths": bool(skill_result.get('strengths')),
                "has_weaknesses": bool(skill_result.get('weaknesses'))
            }
        else:
            skill_result = {"skill_level": "intermediate", "strengths": ["programming"], "weaknesses": ["advanced algorithms"]}
            results["results"]["skill_evaluation"] = {"success": False, "fallback_used": True}
        
        results["steps_completed"] += 1
        
        # Step 4: Gap detection
        print("\n🔍 Step 4: Detecting Knowledge Gaps...")
        gaps_result = await gap_detector.detect_gaps(learning_goal, skill_result)
        
        if gaps_result:
            print(f"✅ Gap detection: {len(gaps_result.get('gaps', []))} gaps identified")
            results["results"]["gap_detection"] = {
                "success": True,
                "num_gaps": len(gaps_result.get('gaps', [])),
                "gaps": gaps_result.get('gaps', [])
            }
        else:
            gaps_result = {"gaps": ["dynamic programming", "graph algorithms"], "prerequisites_needed": ["basic algorithms"]}
            results["results"]["gap_detection"] = {"success": False, "fallback_used": True}
        
        results["steps_completed"] += 1
        
        # Step 5: Prerequisite graph
        print("\n🕸️ Step 5: Building Prerequisite Graph...")
        graph_result = await prerequisite_graph.build_prerequisite_graph(learning_goal, gaps_result)
        
        if graph_result:
            print(f"✅ Prerequisite graph: {len(graph_result.get('nodes', []))} concepts mapped")
            results["results"]["prerequisite_graph"] = {
                "success": True,
                "num_nodes": len(graph_result.get('nodes', [])),
                "num_edges": len(graph_result.get('edges', []))
            }
        else:
            graph_result = {
                "nodes": ["arrays", "linked lists", "trees", "graphs", "algorithms"],
                "edges": [{"from": "arrays", "to": "linked lists"}],
                "learning_phases": [
                    {"phase_id": 1, "concepts": ["arrays", "linked lists", "stacks", "queues"]},
                    {"phase_id": 2, "concepts": ["trees", "heaps", "hashing"]},
                    {"phase_id": 3, "concepts": ["graphs", "sorting algorithms", "searching"]},
                    {"phase_id": 4, "concepts": ["dynamic programming", "greedy algorithms", "advanced topics"]}
                ]
            }
            results["results"]["prerequisite_graph"] = {"success": False, "fallback_used": True}
        
        results["steps_completed"] += 1
        
        # Step 6: Difficulty estimation
        print("\n📊 Step 6: Estimating Difficulty Progression...")
        try:
            difficulty_result = await difficulty_estimator.estimate_difficulty(learning_goal, graph_result, skill_result)
        except:
            difficulty_result = None
        
        if difficulty_result:
            print(f"✅ Difficulty estimation: {len(difficulty_result.get('phase_difficulties', {}))} phases planned")
            results["results"]["difficulty_estimation"] = {
                "success": True,
                "phase_difficulties": difficulty_result.get('phase_difficulties', {}),
                "adaptive_factors": difficulty_result.get('adaptive_factors', [])
            }
        else:
            difficulty_result = {
                "phase_difficulties": {"1": "beginner", "2": "intermediate", "3": "intermediate", "4": "advanced"},
                "adaptive_factors": ["programming_experience", "mathematical_background"]
            }
            results["results"]["difficulty_estimation"] = {"success": False, "fallback_used": True}
        
        results["steps_completed"] += 1
        
        # Step 7: Generate complete roadmap
        print("\n🗺️ Step 7: Generating Complete DSA Roadmap...")
        
        try:
            roadmap = await roadmap_builder.build_interview_driven_roadmap(
                learning_goal=learning_goal,
                subject_area=subject_area,
                interview_answers=dsa_answers
            )
        except Exception as e:
            print(f"⚠️ Roadmap generation failed: {e}")
            roadmap = None
        
        if roadmap:
            print(f"✅ Complete roadmap: {len(roadmap.get('phases', []))} phases generated")
            results["results"]["complete_roadmap"] = {
                "success": True,
                "roadmap_id": roadmap.get('roadmap_id'),
                "num_phases": len(roadmap.get('phases', [])),
                "has_project": bool(roadmap.get('course_project')),
                "has_schedule": bool(roadmap.get('learning_schedule'))
            }
            
            # Analyze DSA-specific content
            phases = roadmap.get('phases', [])
            total_pes = 0
            total_books = 0
            dsa_specific_content = 0
            
            for phase in phases:
                resources = phase.get('resources', {})
                pes_materials = resources.get('pes_materials', [])
                books = resources.get('reference_books', [])
                
                if not books:
                    book = resources.get('reference_book', {})
                    if book:
                        books = [book]
                
                total_pes += len(pes_materials)
                total_books += len(books)
                
                # Check for DSA-specific content
                for pes in pes_materials:
                    title = pes.get('title', '').lower()
                    if any(keyword in title for keyword in ['data structures', 'algorithm', 'dsa', 'sorting', 'graph']):
                        dsa_specific_content += 1
                
                for book in books:
                    title = book.get('title', '').lower()
                    if any(keyword in title for keyword in ['data structures', 'algorithm', 'programming', 'computer science']):
                        dsa_specific_content += 1
            
            results["results"]["dsa_analysis"] = {
                "total_pes_materials": total_pes,
                "total_books": total_books,
                "dsa_specific_items": dsa_specific_content,
                "dsa_relevance_rate": dsa_specific_content / (total_pes + total_books) if (total_pes + total_books) > 0 else 0
            }
            
            results["final_roadmap"] = roadmap
            results["overall_status"] = "SUCCESS"
        else:
            print("❌ Roadmap generation failed")
            results["results"]["complete_roadmap"] = {"success": False}
            results["overall_status"] = "FAILED"
        
        results["steps_completed"] += 1
        
        # Summary
        print("\n📊 DSA ROADMAP GENERATION SUMMARY")
        print("=" * 60)
        
        if results["overall_status"] == "SUCCESS":
            roadmap = results["final_roadmap"]
            print(f"✅ Roadmap ID: {roadmap.get('roadmap_id')}")
            print(f"📚 Total Phases: {len(roadmap.get('phases', []))}")
            print(f"📖 PES Materials: {results['results']['dsa_analysis']['total_pes_materials']}")
            print(f"📘 Reference Books: {results['results']['dsa_analysis']['total_books']}")
            print(f"🎯 DSA Relevance: {results['results']['dsa_analysis']['dsa_relevance_rate']:.2%}")
            print(f"⏰ Duration: {roadmap.get('learning_schedule', {}).get('total_weeks', 'N/A')} weeks")
            
            # Show phase breakdown
            for i, phase in enumerate(roadmap.get('phases', [])[:4], 1):
                resources = phase.get('resources', {})
                pes_count = len(resources.get('pes_materials', []))
                book_count = len(resources.get('reference_books', []))
                if not book_count and resources.get('reference_book'):
                    book_count = 1
                
                print(f"📋 Phase {i}: {pes_count} PES materials, {book_count} books")
        
        # Save results
        output_file = f"dsa_roadmap_results_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        safe_json_dump(results, output_file)
        print(f"\n💾 Results saved to: {output_file}")
        
        return results
        
    except Exception as e:
        logger.error(f"DSA roadmap generation failed: {e}")
        results["overall_status"] = "FAILED"
        results["error"] = str(e)
        return results

async def main():
    """Main test function"""
    print("🎯 Starting Data Structures and Algorithms Roadmap Generation")
    print("=" * 70)
    
    results = await test_dsa_roadmap()
    
    print("\n🏁 DSA Roadmap Test completed!")
    return results

if __name__ == "__main__":
    asyncio.run(main())
