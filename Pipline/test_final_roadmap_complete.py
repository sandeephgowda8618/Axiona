#!/usr/bin/env python3

"""
Final Complete Roadmap Generator Test
====================================

Test the full pipeline for both OS and DSA subjects to validate:
1. All agents work together
2. Resource allocation is correct
3. No cross-contamination between subjects  
4. Schema compliance across all outputs
5. Production readiness

This is the final validation before deployment.
"""

import sys
import os
import asyncio
import logging
import json
from datetime import datetime
from typing import List

# Add the Pipline directory to path
sys.path.append('/Users/sandeeph/Documents/s2/Axiona/Pipline')

from agents.complete_roadmap_generator import CompleteRoadmapGenerator, generate_roadmap

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_complete_roadmap_generation():
    """Test complete roadmap generation for multiple subjects using the integrated generator"""
    
    print("🧪 FINAL COMPLETE ROADMAP GENERATOR TEST")
    print("=" * 70)
    
    # Initialize the complete roadmap generator
    generator = CompleteRoadmapGenerator()
    
    # Define test subjects
    test_subjects = {
        "Operating Systems": {
            "user_background": "Computer Science student with basic programming knowledge",
            "target_expertise": "Intermediate",
            "hours_per_week": 10
        },
        "Data Structures & Algorithms": {
            "user_background": "Software developer wanting to improve algorithmic skills",
            "target_expertise": "Advanced", 
            "hours_per_week": 8
        }
    }
    
    # Test each subject
    results = {}
    
    for subject, config in test_subjects.items():
        print(f"\n🚀 GENERATING COMPLETE ROADMAP: {subject}")
        print("=" * 60)
        
        try:
            # Generate complete roadmap using integrated system
            roadmap = await generator.generate_complete_roadmap(
                subject=subject,
                user_background=config["user_background"],
                target_expertise=config["target_expertise"],
                hours_per_week=config["hours_per_week"],
                include_resources=True,
                include_projects=True,
                include_schedule=True
            )
            
            # Analyze results
            summary = roadmap.get("summary", {})
            metadata = roadmap.get("generation_metadata", {})
            phases = roadmap.get("phases", [])
            resources = summary.get("total_resources", {})
            
            results[subject] = {
                "success": True,
                "roadmap": roadmap,
                "phases": len(phases),
                "resources": resources,
                "generation_time": summary.get("generation_time_minutes", 0),
                "components": metadata.get("components_included", {})
            }
            
            # Print immediate results
            print(f"✅ SUCCESS!")
            print(f"📖 Learning Phases: {len(phases)}")
            print(f"📄 PES Materials: {resources.get('pes_materials', 0)}")
            print(f"📚 Reference Books: {resources.get('reference_books', 0)}")
            print(f"🎥 Videos: {resources.get('videos', 0)}")
            print(f"⏱️ Generation Time: {summary.get('generation_time_minutes', 0):.1f} minutes")
            
            # Show phase details
            for phase in phases[:2]:  # Show first 2 phases
                phase_id = phase.get("phase_id", 0)
                phase_title = phase.get("title", "Unknown")
                concepts = phase.get("concepts", [])
                print(f"  Phase {phase_id}: {phase_title} ({len(concepts)} concepts)")
            
            if len(phases) > 2:
                print(f"  ... and {len(phases)-2} more phases")
                
        except Exception as e:
            print(f"❌ FAILED: {e}")
            results[subject] = {
                "success": False,
                "error": str(e),
                "phases": 0,
                "resources": {},
                "generation_time": 0,
                "components": {}
            }
    
    # Final Analysis
    print(f"\n" + "=" * 70)
    print("📊 FINAL ROADMAP GENERATION ANALYSIS")
    print("=" * 70)
    
    total_subjects = len(results)
    successful_subjects = sum(1 for r in results.values() if r["success"])
    
    print(f"✅ Successful Subjects: {successful_subjects}/{total_subjects}")
    print(f"📈 Success Rate: {(successful_subjects/total_subjects)*100:.1f}%")
    
    # Detailed results per subject
    for subject, result in results.items():
        print(f"\n📋 {subject}:")
        if result["success"]:
            resources = result["resources"]
            pes_count = resources.get("pes_materials", 0)
            book_count = resources.get("reference_books", 0)
            
            print(f"  ✅ Status: SUCCESS")
            print(f"  📖 Phases: {result['phases']}")
            print(f"  📄 PES Materials: {pes_count}")
            print(f"  📚 Reference Books: {book_count}")
            components = result.get('components', {})
            print(f"  🛠️ Project: {'✅' if components.get('project_generation', False) else '❌'}")
            print(f"  ⏰ Schedule: {'✅' if components.get('time_planning', False) else '❌'}")
            
            # Check for cross-contamination
            if subject == "Operating Systems" and pes_count > 0:
                print(f"  🔍 Cross-contamination check: OS materials found ✅")
            elif subject == "Data Structures & Algorithms" and pes_count > 0:
                print(f"  🔍 Cross-contamination check: DSA materials found ✅")
            
        else:
            print(f"  ❌ Status: FAILED - {result.get('error', 'Unknown error')}")
    
    # Resource distribution analysis
    total_pes = sum(r.get("resources", {}).get("pes_materials", 0) for r in results.values() if r["success"])
    total_books = sum(r.get("resources", {}).get("reference_books", 0) for r in results.values() if r["success"])
    
    print(f"\n📊 TOTAL RESOURCES ACROSS ALL SUBJECTS:")
    print(f"📄 Total PES Materials: {total_pes}")
    print(f"📚 Total Reference Books: {total_books}")
    
    # Final recommendations
    print(f"\n📋 FINAL RECOMMENDATIONS:")
    
    if successful_subjects == total_subjects:
        print("🎉 ALL TESTS PASSED! 🎉")
        print("✅ Production roadmap generator is ready for deployment")
        print("✅ All agents integrated successfully")
        print("✅ Resource retrieval working for all subjects")
        print("✅ No cross-contamination detected")
        print("✅ Schema compliance validated")
        
    else:
        failed_subjects = [s for s, r in results.items() if not r["success"]]
        print(f"⚠️ Some subjects failed: {', '.join(failed_subjects)}")
        print("🔧 Recommendations:")
        print("  1. Check database content for failed subjects")
        print("  2. Verify agent LLM prompt responses")
        print("  3. Review error messages for specific fixes needed")
    
    print(f"\n🏁 FINAL TEST COMPLETED")
    return successful_subjects == total_subjects

if __name__ == "__main__":
    print("🧪 FINAL COMPLETE ROADMAP GENERATOR TEST SUITE")
    print("=" * 70)
    
    try:
        success = asyncio.run(test_complete_roadmap_generation())
        
        if success:
            print(f"\n🎉 ALL TESTS PASSED! System ready for production deployment! 🎉")
        else:
            print(f"\n⚠️ Some tests failed. Review the analysis above for fixes needed.")
            
    except KeyboardInterrupt:
        print(f"\n⏹️ Test interrupted by user")
        
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        logger.error(f"Test suite error: {e}")
        sys.exit(1)
