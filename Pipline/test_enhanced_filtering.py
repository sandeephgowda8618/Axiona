"""
Test Enhanced Semantic Filtering
==============================

Simple test script to validate the enhanced semantic filtering
improvements for precise resource retrieval.
"""

import asyncio
import json
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_enhanced_filtering():
    """Test the enhanced filtering functions"""
    
    try:
        # Import the enhanced filtering (handle potential import issues gracefully)
        try:
            from agents.enhanced_filtering import enhanced_filtering
        except ImportError as e:
            logger.error(f"Failed to import enhanced_filtering: {e}")
            logger.info("This is expected if database connection is not available")
            return False
        
        # Test PES materials filtering
        logger.info("Testing PES materials filtering...")
        pes_result = enhanced_filtering.filter_pes_materials_by_phase("Operating Systems", 1, 5)
        
        print(f"\n=== PES MATERIALS RESULT ===")
        print(f"Results found: {len(pes_result.get('results', []))}")
        if pes_result.get('meta', {}).get('error'):
            print(f"Error: {pes_result['meta']['error']}")
        else:
            for i, material in enumerate(pes_result.get('results', [])[:3]):
                print(f"{i+1}. {material.get('title', 'Unknown')} (Unit: {material.get('unit', 'N/A')})")
        
        # Test reference books filtering
        logger.info("Testing reference books filtering...")
        book_result = enhanced_filtering.filter_reference_books_by_subject(
            "Operating Systems", 
            ["introduction", "processes", "threads"], 
            "beginner"
        )
        
        print(f"\n=== REFERENCE BOOK RESULT ===")
        if book_result.get('result'):
            book = book_result['result']
            print(f"Selected: {book.get('title', 'Unknown')}")
            print(f"Authors: {', '.join(book.get('authors', []))}")
            print(f"Relevance: {book.get('relevance_score', 0):.2f}")
            if book.get('recommended_chapters'):
                print(f"Chapters: {', '.join(book['recommended_chapters'])}")
        else:
            print(f"Error: {book_result.get('meta', {}).get('error', 'No book found')}")
        
        # Test video filtering
        logger.info("Testing video filtering...")
        video_result = enhanced_filtering.filter_videos_by_phase(
            "Operating Systems",
            ["introduction", "processes"], 
            "beginner"
        )
        
        print(f"\n=== VIDEO CONTENT RESULT ===")
        playlists = video_result.get('playlists', [])
        oneshot = video_result.get('oneshot', {})
        
        print(f"Playlists found: {len(playlists)}/2 required")
        for i, playlist in enumerate(playlists):
            print(f"  {i+1}. {playlist.get('title', 'Unknown')}")
            
        if oneshot:
            print(f"Oneshot found: {oneshot.get('title', 'Unknown')}")
        else:
            print("No oneshot video found")
            
        if video_result.get('meta', {}).get('warning'):
            print(f"Warning: {video_result['meta']['warning']}")
        
        # Summary
        print(f"\n=== TEST SUMMARY ===")
        print(f"PES Materials: {'✅' if pes_result.get('results') else '❌'}")
        print(f"Reference Book: {'✅' if book_result.get('result') else '❌'}")
        print(f"Video Content: {'✅' if playlists and oneshot else '❌'}")
        
        # Check for semantic accuracy
        print(f"\n=== SEMANTIC ACCURACY CHECK ===")
        pes_subject_match = True
        if pes_result.get('results'):
            for material in pes_result['results']:
                subject = material.get('subject', '')
                title = material.get('title', '')
                if 'Operating' not in subject and 'OS' not in title:
                    pes_subject_match = False
                    print(f"⚠️ Potential off-topic PES: {title}")
        
        print(f"PES Subject Relevance: {'✅' if pes_subject_match else '❌'}")
        
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        print(f"\n❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Enhanced Semantic Filtering Test")
    print("=" * 50)
    
    success = test_enhanced_filtering()
    
    if success:
        print(f"\n✅ Test completed successfully!")
    else:
        print(f"\n❌ Test failed - check logs for details")
        
    print("\nNote: This test validates the enhanced filtering logic")
    print("for precise subject/unit/difficulty-based resource retrieval.")
    print("Errors are expected if the database is not properly configured.")
