"""
Test Corrected Retrieval Agents
==============================

Direct test of the corrected retrieval agents to validate
the updated prompt implementations.
"""

import asyncio
import json
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_corrected_retrieval_agents():
    """Test the corrected retrieval agents directly"""
    
    print("🔧 TESTING CORRECTED RETRIEVAL AGENTS")
    print("=" * 60)
    print(f"Test started at: {datetime.now()}")
    
    try:
        # Import the corrected agents
        from agents.corrected_retrieval_agents import corrected_retrieval_agents
        
        # Test 1: PES Material Retrieval Agent
        print("\n📚 TEST 1: PES Material Retrieval Agent")
        print("-" * 40)
        
        pes_result = corrected_retrieval_agents.pes_material_retrieval_agent(
            subject="Operating Systems",
            phase_number=1,
            concepts=["basics", "introduction", "fundamentals"]
        )
        
        print(f"✅ PES Results: {len(pes_result.get('results', []))} materials found")
        print(f"📊 Subject filter: {pes_result.get('meta', {}).get('subject')}")
        print(f"🔢 Phase mapped: {pes_result.get('meta', {}).get('phase')}")
        print(f"📈 Total results: {pes_result.get('meta', {}).get('total_results')}")
        
        if pes_result.get("results"):
            sample_pes = pes_result["results"][0]
            print(f"📖 Sample PES: {sample_pes.get('title', 'No title')}")
            print(f"🎯 Subject: {sample_pes.get('subject', 'No subject')}")
            print(f"📅 Unit: {sample_pes.get('unit', 'No unit')}")
        
        if pes_result.get("error"):
            print(f"❌ PES Error: {pes_result['error']}")
        
        # Test 2: Reference Book Retrieval Agent
        print("\n📖 TEST 2: Reference Book Retrieval Agent")
        print("-" * 40)
        
        book_result = corrected_retrieval_agents.reference_book_retrieval_agent(
            subject="Operating Systems",
            difficulty="beginner", 
            phase_concepts=["basics", "introduction", "fundamentals"]
        )
        
        if book_result.get("result"):
            book = book_result["result"]
            print(f"✅ Best Book Found: {book.get('title', 'No title')}")
            print(f"👥 Authors: {', '.join(book.get('authors', []))}")
            print(f"📊 Relevance Score: {book.get('relevance_score', 0)}")
            print(f"📚 Recommended Chapters: {book.get('recommended_chapters', [])}")
        else:
            print(f"❌ Book Error: {book_result.get('error', 'No book found')}")
        
        # Test 3: Video Retrieval Agent
        print("\n🎥 TEST 3: Video Retrieval Agent")
        print("-" * 40)
        
        video_result = corrected_retrieval_agents.video_retrieval_agent(
            subject="Operating Systems",
            level="beginner",
            unit_or_topic="Unit 1"
        )
        
        print(f"✅ Video Keywords Generated")
        print(f"🎬 Playlist Keywords: {video_result.get('search_keywords_playlists', [])}")
        print(f"🎞️ Oneshot Keyword: {video_result.get('search_keywords_oneshot', 'None')}")
        print(f"🏷️ Reasoning Tags: {video_result.get('reasoning_tags', [])}")
        
        if video_result.get("error"):
            print(f"❌ Video Error: {video_result['error']}")
        
        # Summary Analysis
        print("\n📊 SUMMARY ANALYSIS")
        print("-" * 40)
        
        pes_success = len(pes_result.get("results", [])) > 0
        book_success = book_result.get("result") is not None
        video_success = len(video_result.get("search_keywords_playlists", [])) >= 2
        
        print(f"📚 PES Materials: {'✅ SUCCESS' if pes_success else '❌ FAILED'}")
        print(f"📖 Reference Books: {'✅ SUCCESS' if book_success else '❌ FAILED'}")  
        print(f"🎥 Video Keywords: {'✅ SUCCESS' if video_success else '❌ FAILED'}")
        
        overall_success = pes_success and book_success and video_success
        print(f"\n🎯 OVERALL RESULT: {'✅ ALL AGENTS WORKING' if overall_success else '❌ SOME AGENTS FAILED'}")
        
        # Detailed Results for Analysis
        print("\n📋 DETAILED RESULTS FOR ANALYSIS")
        print("-" * 40)
        
        detailed_results = {
            "timestamp": datetime.now().isoformat(),
            "test_subject": "Operating Systems",
            "test_phase": 1,
            "pes_materials": {
                "count": len(pes_result.get("results", [])),
                "sample_titles": [r.get("title", "") for r in pes_result.get("results", [])[:3]],
                "subjects_found": list(set(r.get("subject", "") for r in pes_result.get("results", []))),
                "units_found": list(set(r.get("unit", "") for r in pes_result.get("results", []))),
                "success": pes_success
            },
            "reference_book": {
                "found": book_success,
                "title": book_result.get("result", {}).get("title", "") if book_success else "",
                "relevance_score": book_result.get("result", {}).get("relevance_score", 0) if book_success else 0,
                "success": book_success
            },
            "videos": {
                "playlists_keywords_count": len(video_result.get("search_keywords_playlists", [])),
                "oneshot_keyword": video_result.get("search_keywords_oneshot", ""),
                "success": video_success
            },
            "overall_success": overall_success
        }
        
        print(json.dumps(detailed_results, indent=2))
        
        return detailed_results
        
    except Exception as e:
        error_result = {
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "success": False
        }
        print(f"\n❌ CRITICAL ERROR: {e}")
        print(json.dumps(error_result, indent=2))
        return error_result

if __name__ == "__main__":
    test_corrected_retrieval_agents()
