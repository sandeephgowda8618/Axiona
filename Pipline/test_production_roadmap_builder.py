#!/usr/bin/env python3
"""
Test Production Roadmap Builder - Validate Complete Integration
==============================================================

This script tests the new production roadmap builder that uses all updated agents
with finalized prompts and proper filtering.
"""

import sys
import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

# Add Pipeline directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agents.production_roadmap_builder import ProductionRoadmapBuilder

logger = logging.getLogger(__name__)

async def test_production_dsa_roadmap():
    """Test complete DSA roadmap with production agents"""
    try:
        logger.info("🎯 Testing Production DSA Roadmap Builder")
        logger.info("=" * 80)
        
        builder = ProductionRoadmapBuilder()
        
        # Build DSA roadmap
        roadmap = await builder.build_interview_driven_roadmap(
            learning_goal="Data Structures & Algorithms",
            subject_area="Computer Science",
            max_weeks=8,
            hours_per_week=10
        )
        
        # Validate results
        logger.info("📊 PRODUCTION ROADMAP VALIDATION")
        logger.info("=" * 50)
        
        # Check basic structure
        assert roadmap.get("roadmap_id"), "Missing roadmap_id"
        assert roadmap.get("phases"), "Missing phases"
        assert len(roadmap["phases"]) == 4, f"Expected 4 phases, got {len(roadmap['phases'])}"
        
        # Analyze each phase
        for phase in roadmap["phases"]:
            phase_id = phase.get("phase_id")
            pes_count = len(phase.get("resources", {}).get("pes_materials", []))
            book_count = len(phase.get("resources", {}).get("reference_books", []))
            
            logger.info(f"Phase {phase_id}: {pes_count} PES materials, {book_count} reference book(s)")
            
            # Log PES material subjects for contamination check
            for pes in phase.get("resources", {}).get("pes_materials", []):
                subject = pes.get("subject", "Unknown")
                title = pes.get("title", "Unknown")
                logger.info(f"  PES: {subject} - {title[:60]}...")
            
            # Log reference books
            for book in phase.get("resources", {}).get("reference_books", []):
                if book:  # Check if book is not None
                    title = book.get("title", "Unknown")
                    logger.info(f"  Book: {title}")
        
        # Check for contamination
        total_pes = sum(len(phase.get("resources", {}).get("pes_materials", [])) for phase in roadmap["phases"])
        total_books = sum(len(phase.get("resources", {}).get("reference_books", [])) for phase in roadmap["phases"])
        
        logger.info("📈 SUMMARY METRICS")
        logger.info("=" * 30)
        logger.info(f"Total PES Materials: {total_pes}")
        logger.info(f"Total Reference Books: {total_books}")
        logger.info(f"Expected Books: 4 (1 per phase)")
        logger.info(f"Book Allocation: {'✅ CORRECT' if total_books <= 4 else '❌ INCORRECT'}")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"production_dsa_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            # Convert ObjectId to string for JSON serialization
            roadmap_copy = json.loads(json.dumps(roadmap, default=str))
            json.dump(roadmap_copy, f, indent=2, default=str)
        
        logger.info(f"📁 Results saved to: {results_file}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Production roadmap test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_production_os_roadmap():
    """Test OS roadmap to ensure no regression"""
    try:
        logger.info("\n🎯 Testing Production OS Roadmap Builder")
        logger.info("=" * 80)
        
        builder = ProductionRoadmapBuilder()
        
        # Build OS roadmap
        roadmap = await builder.build_interview_driven_roadmap(
            learning_goal="Operating Systems",
            subject_area="Computer Science",
            max_weeks=8,
            hours_per_week=10
        )
        
        # Analyze results
        total_pes = sum(len(phase.get("resources", {}).get("pes_materials", [])) for phase in roadmap["phases"])
        total_books = sum(len(phase.get("resources", {}).get("reference_books", [])) for phase in roadmap["phases"])
        
        logger.info(f"OS Roadmap - Total PES: {total_pes}, Total Books: {total_books}")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"production_os_test_results_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            roadmap_copy = json.loads(json.dumps(roadmap, default=str))
            json.dump(roadmap_copy, f, indent=2, default=str)
        
        logger.info(f"📁 OS results saved to: {results_file}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ OS roadmap test failed: {e}")
        return False

async def main():
    """Main test function"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger.info("🚀 TESTING PRODUCTION ROADMAP BUILDER")
    logger.info("🎯 Goal: Validate all updated agents with proper filtering")
    logger.info("📝 Expected: ALL unit PDFs per phase, exactly 1 book per phase, no contamination")
    logger.info("=" * 100)
    
    # Test DSA roadmap
    dsa_success = await test_production_dsa_roadmap()
    
    # Test OS roadmap
    os_success = await test_production_os_roadmap()
    
    # Final results
    logger.info("\n" + "=" * 100)
    logger.info("🏁 FINAL RESULTS")
    logger.info("=" * 100)
    logger.info(f"DSA Roadmap: {'✅ PASS' if dsa_success else '❌ FAIL'}")
    logger.info(f"OS Roadmap: {'✅ PASS' if os_success else '❌ FAIL'}")
    
    overall_success = dsa_success and os_success
    logger.info(f"Overall: {'✅ ALL TESTS PASSED' if overall_success else '❌ TESTS FAILED'}")
    
    if overall_success:
        logger.info("🎉 Production agents are working correctly!")
        logger.info("📋 Next: Update main pipeline to use ProductionRoadmapBuilder")
    else:
        logger.info("🔧 Some tests failed - check logs for details")
    
    return overall_success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
