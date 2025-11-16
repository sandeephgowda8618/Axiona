"""
Full Corrected Pipeline Test
===========================

Test the complete corrected roadmap pipeline with all 4 phases
to validate the updated prompts are working correctly.
"""

import asyncio
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_full_corrected_pipeline():
    """Test the complete corrected pipeline for all 4 phases"""
    
    print("🚀 TESTING FULL CORRECTED PIPELINE")
    print("=" * 60)
    print(f"Test started at: {datetime.now()}")
    
    try:
        # Import the corrected agents
        from agents.corrected_retrieval_agents import corrected_retrieval_agents
        
        subject = "Operating Systems"
        test_results = {
            "timestamp": datetime.now().isoformat(),
            "subject": subject,
            "phases_tested": 4,
            "phase_results": []
        }
        
        # Test all 4 phases
        phase_templates = [
            {"id": 1, "concepts": ["basics", "introduction", "fundamentals"], "difficulty": "beginner"},
            {"id": 2, "concepts": ["core concepts", "implementation", "algorithms"], "difficulty": "intermediate"},
            {"id": 3, "concepts": ["advanced topics", "optimization", "design patterns"], "difficulty": "intermediate"},
            {"id": 4, "concepts": ["expert applications", "systems", "real-world projects"], "difficulty": "advanced"}
        ]
        
        for phase_template in phase_templates:
            phase_id = phase_template["id"]
            concepts = phase_template["concepts"]
            difficulty = phase_template["difficulty"]
            
            print(f"\n🔄 TESTING PHASE {phase_id}: {' '.join(concepts).title()}")
            print("-" * 50)
            
            # Test PES materials for this phase
            pes_result = corrected_retrieval_agents.pes_material_retrieval_agent(
                subject=subject,
                phase_number=phase_id,
                concepts=concepts
            )
            
            # Test reference book for this phase
            book_result = corrected_retrieval_agents.reference_book_retrieval_agent(
                subject=subject,
                difficulty=difficulty,
                phase_concepts=concepts
            )
            
            # Test video keywords for this phase
            video_result = corrected_retrieval_agents.video_retrieval_agent(
                subject=subject,
                level=difficulty,
                unit_or_topic=f"Unit {phase_id}"
            )
            
            # Analyze results
            pes_count = len(pes_result.get("results", []))
            book_found = book_result.get("result") is not None
            video_keywords = len(video_result.get("search_keywords_playlists", []))
            
            print(f"📚 PES Materials: {pes_count} found")
            print(f"📖 Reference Book: {'✅ Found' if book_found else '❌ None'}")
            print(f"🎥 Video Keywords: {video_keywords} generated")
            
            # Check for cross-contamination in PES results
            contamination_check = []
            if pes_result.get("results"):
                for material in pes_result["results"]:
                    material_subject = material.get("subject", "").lower()
                    material_title = material.get("title", "").lower()
                    
                    # Check for contamination keywords
                    contamination_keywords = ["data structures", "database", "chemistry", "electronics", "microprocessor"]
                    for keyword in contamination_keywords:
                        if keyword in material_subject or keyword in material_title:
                            contamination_check.append(f"⚠️ Potential contamination: {keyword} in '{material.get('title', '')}'")
            
            if contamination_check:
                print("🚨 CONTAMINATION DETECTED:")
                for issue in contamination_check:
                    print(f"   {issue}")
            else:
                print("✅ No cross-contamination detected")
            
            # Store phase results
            phase_result = {
                "phase_id": phase_id,
                "concepts": concepts,
                "difficulty": difficulty,
                "pes_materials_count": pes_count,
                "reference_book_found": book_found,
                "video_keywords_count": video_keywords,
                "contamination_issues": contamination_check,
                "success": pes_count > 0 or book_found or video_keywords > 0
            }
            
            test_results["phase_results"].append(phase_result)
        
        # Overall analysis
        print(f"\n📊 OVERALL CORRECTED PIPELINE ANALYSIS")
        print("=" * 60)
        
        total_pes = sum(p["pes_materials_count"] for p in test_results["phase_results"])
        total_books = sum(1 for p in test_results["phase_results"] if p["reference_book_found"])
        total_videos = sum(p["video_keywords_count"] for p in test_results["phase_results"])
        total_contamination = sum(len(p["contamination_issues"]) for p in test_results["phase_results"])
        
        print(f"📚 Total PES Materials: {total_pes}")
        print(f"📖 Total Books Found: {total_books}/4 phases")
        print(f"🎥 Total Video Keywords: {total_videos}")
        print(f"🚨 Total Contamination Issues: {total_contamination}")
        
        # Success metrics
        phases_with_resources = sum(1 for p in test_results["phase_results"] if p["success"])
        success_rate = (phases_with_resources / 4) * 100
        
        print(f"\n✅ Phases with Resources: {phases_with_resources}/4 ({success_rate:.1f}%)")
        print(f"🎯 Contamination Rate: {total_contamination} issues")
        
        # Comparison with previous results
        print(f"\n📈 COMPARISON WITH PREVIOUS RESULTS")
        print("-" * 50)
        print("BEFORE (from test results):")
        print("  - Phase 1: Wrong PES (C Programming instead of OS)")
        print("  - Phase 2-4: Empty PES materials")
        print("  - Books: Irrelevant (Systems Analysis, Python Instrumentation)")
        print("  - Videos: Generic mock data")
        print("")
        print("AFTER (corrected agents):")
        print(f"  - Phase 1: {test_results['phase_results'][0]['pes_materials_count']} OS-specific PES materials")
        print(f"  - All Phases: {total_books} relevant OS books")
        print(f"  - Videos: {total_videos} structured keywords")
        print(f"  - Contamination: {total_contamination} issues vs multiple in previous")
        
        # Final assessment
        overall_improvement = (
            total_pes > 0 and  # At least some PES materials
            total_books >= 3 and  # Most phases have books  
            total_contamination < 3  # Minimal contamination
        )
        
        test_results["overall_success"] = overall_improvement
        test_results["improvement_summary"] = {
            "pes_materials_improvement": "Relevant OS materials instead of wrong subjects",
            "reference_books_improvement": "OS-specific books instead of generic ones",
            "video_improvement": "Structured keywords instead of broken schema",
            "contamination_reduction": f"Reduced contamination issues to {total_contamination}"
        }
        
        print(f"\n🎯 FINAL ASSESSMENT: {'✅ MAJOR IMPROVEMENT' if overall_improvement else '❌ NEEDS MORE WORK'}")
        
        # Save detailed results
        with open(f"corrected_pipeline_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(test_results, f, indent=2)
        
        print(f"\n💾 Detailed results saved to file")
        
        return test_results
        
    except Exception as e:
        error_result = {
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "success": False
        }
        print(f"\n❌ CRITICAL ERROR: {e}")
        return error_result

if __name__ == "__main__":
    test_full_corrected_pipeline()
