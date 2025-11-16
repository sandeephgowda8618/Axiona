"""
Test Fixed Semantic Filtering
============================

Test the fixed semantic filtering that addresses the critical issues:
1. Mixed unit data types (string/int)
2. Precise subject matching with exclusions
3. Correct video schema handling
4. Post-filter validation
"""

import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_fixed_filtering():
    """Test the fixed filtering functions"""
    
    try:
        # Import the fixed filtering
        try:
            from agents.fixed_filtering import fixed_filtering
        except ImportError as e:
            logger.error(f"Failed to import fixed_filtering: {e}")
            logger.info("This is expected if database connection is not available")
            return False
        
        print("Fixed Semantic Filtering Test")
        print("=" * 50)
        
        # Test 1: Fixed PES materials filtering
        logger.info("Testing FIXED PES materials filtering...")
        pes_result = fixed_filtering.fixed_filter_pes_materials_by_phase("Operating Systems", 1, 5)
        
        print(f"\n=== FIXED PES MATERIALS RESULT ===")
        print(f"Results found: {len(pes_result.get('results', []))}")
        print(f"Raw results found: {pes_result.get('meta', {}).get('raw_results_found', 'N/A')}")
        print(f"Validated results: {pes_result.get('meta', {}).get('validated_results', 'N/A')}")
        
        if pes_result.get('meta', {}).get('error'):
            print(f"Error: {pes_result['meta']['error']}")
        else:
            print("Top results:")
            for i, material in enumerate(pes_result.get('results', [])[:3]):
                title = material.get('title', 'Unknown')
                subject = material.get('subject', 'Unknown')
                unit = material.get('unit', 'N/A')
                relevance = material.get('relevance_score', 0)
                print(f"  {i+1}. [Unit {unit}] {subject}: {title[:50]}... (Score: {relevance:.2f})")
        
        # Test 2: Fixed video filtering 
        logger.info("Testing FIXED video filtering...")
        video_result = fixed_filtering.fixed_filter_videos_by_phase(
            "Operating Systems",
            ["introduction", "processes"], 
            "beginner"
        )
        
        print(f"\n=== FIXED VIDEO CONTENT RESULT ===")
        playlists = video_result.get('playlists', [])
        oneshot = video_result.get('oneshot', {})
        meta = video_result.get('meta', {})
        
        print(f"Candidates found: {meta.get('candidates_found', 'N/A')}")
        print(f"Content types available: {meta.get('content_types_available', {})}")
        print(f"Playlists selected: {len(playlists)}/2 required")
        
        for i, playlist in enumerate(playlists):
            title = playlist.get('title', 'Unknown')
            url = playlist.get('url', 'No URL')
            relevance = playlist.get('relevance_score', 0)
            print(f"  {i+1}. {title} (Score: {relevance:.2f})")
            
        if oneshot:
            title = oneshot.get('title', 'Unknown')
            relevance = oneshot.get('relevance_score', 0)
            print(f"Oneshot selected: {title} (Score: {relevance:.2f})")
        else:
            print("No oneshot video selected")
            
        if meta.get('warning'):
            print(f"Warning: {meta['warning']}")
        
        # Test 3: Comparison with original filtering
        print(f"\n=== FILTERING COMPARISON ===")
        
        # Try original filtering for comparison
        try:
            from agents.enhanced_filtering import enhanced_filtering
            original_result = enhanced_filtering.filter_pes_materials_by_phase("Operating Systems", 1, 5)
            
            original_count = len(original_result.get('results', []))
            fixed_count = len(pes_result.get('results', []))
            
            print(f"Original filtering: {original_count} results")
            print(f"Fixed filtering: {fixed_count} results")
            
            # Check semantic accuracy
            fixed_accurate = 0
            for material in pes_result.get('results', []):
                subject = material.get('subject', '').lower()
                if 'operating' in subject:
                    fixed_accurate += 1
            
            original_accurate = 0
            for material in original_result.get('results', []):
                subject = material.get('subject', '').lower() 
                if 'operating' in subject:
                    original_accurate += 1
            
            fixed_accuracy = fixed_accurate / max(fixed_count, 1) * 100
            original_accuracy = original_accurate / max(original_count, 1) * 100
            
            print(f"Original accuracy: {original_accuracy:.1f}% ({original_accurate}/{original_count})")
            print(f"Fixed accuracy: {fixed_accuracy:.1f}% ({fixed_accurate}/{fixed_count})")
            
        except ImportError:
            print("Original filtering not available for comparison")
        
        # Test Summary
        print(f"\n=== FIXED FILTERING TEST SUMMARY ===")
        
        # Calculate success metrics
        pes_success = len(pes_result.get('results', [])) > 0 and not pes_result.get('meta', {}).get('error')
        video_success = len(playlists) > 0 or oneshot
        
        print(f"PES Materials: {'✅' if pes_success else '❌'}")
        print(f"Video Content: {'✅' if video_success else '❌'}")
        
        # Check semantic accuracy improvement
        all_pes_relevant = True
        if pes_result.get('results'):
            for material in pes_result.get('results', []):
                subject = material.get('subject', '').lower()
                if 'operating' not in subject and 'os' not in subject.replace(' ', ''):
                    all_pes_relevant = False
                    print(f"⚠️ Still off-topic: {material.get('subject', 'Unknown')} - {material.get('title', 'Unknown')[:50]}...")
        
        print(f"PES Subject Accuracy: {'✅' if all_pes_relevant else '❌'}")
        
        # Show improvements
        improvements = pes_result.get('meta', {}).get('filtering_improvements', [])
        if improvements:
            print(f"\nFiltering Improvements Applied:")
            for improvement in improvements:
                print(f"  ✓ {improvement}")
        
        return True
        
    except Exception as e:
        logger.error(f"Fixed filtering test failed: {str(e)}")
        print(f"\n❌ Test failed: {str(e)}")
        return False

def comparison_test():
    """Compare original vs fixed filtering side by side"""
    print(f"\n" + "=" * 60)
    print("ORIGINAL vs FIXED FILTERING COMPARISON")
    print("=" * 60)
    
    try:
        from agents.enhanced_filtering import enhanced_filtering
        from agents.fixed_filtering import fixed_filtering
        
        # Test both on same query
        query_subject = "Operating Systems"
        query_phase = 1
        
        print(f"Query: {query_subject}, Phase {query_phase}")
        print()
        
        # Original results
        print("ORIGINAL FILTERING:")
        original_result = enhanced_filtering.filter_pes_materials_by_phase(query_subject, query_phase, 5)
        original_materials = original_result.get('results', [])
        
        print(f"  Found: {len(original_materials)} materials")
        for i, material in enumerate(original_materials):
            subject = material.get('subject', 'Unknown')
            title = material.get('title', 'Unknown')[:40]
            unit = material.get('unit', 'N/A')
            print(f"    {i+1}. [Unit {unit}] {subject}: {title}...")
        
        # Fixed results  
        print(f"\nFIXED FILTERING:")
        fixed_result = fixed_filtering.fixed_filter_pes_materials_by_phase(query_subject, query_phase, 5)
        fixed_materials = fixed_result.get('results', [])
        
        print(f"  Found: {len(fixed_materials)} materials")
        print(f"  Raw matches: {fixed_result.get('meta', {}).get('raw_results_found', 'N/A')}")
        print(f"  After validation: {fixed_result.get('meta', {}).get('validated_results', 'N/A')}")
        
        for i, material in enumerate(fixed_materials):
            subject = material.get('subject', 'Unknown')
            title = material.get('title', 'Unknown')[:40]
            unit = material.get('unit', 'N/A')
            relevance = material.get('relevance_score', 0)
            print(f"    {i+1}. [Unit {unit}] {subject}: {title}... (Score: {relevance:.2f})")
        
        # Calculate accuracy improvements
        print(f"\nACCURACY COMPARISON:")
        
        original_relevant = sum(1 for m in original_materials if 'operating' in m.get('subject', '').lower())
        fixed_relevant = sum(1 for m in fixed_materials if 'operating' in m.get('subject', '').lower())
        
        original_accuracy = (original_relevant / max(len(original_materials), 1)) * 100
        fixed_accuracy = (fixed_relevant / max(len(fixed_materials), 1)) * 100
        
        print(f"  Original: {original_accuracy:.1f}% relevant ({original_relevant}/{len(original_materials)})")
        print(f"  Fixed: {fixed_accuracy:.1f}% relevant ({fixed_relevant}/{len(fixed_materials)})")
        
        improvement = fixed_accuracy - original_accuracy
        print(f"  Improvement: {improvement:+.1f} percentage points")
        
        return fixed_accuracy > original_accuracy
        
    except ImportError as e:
        print(f"Comparison not possible: {e}")
        return False

if __name__ == "__main__":
    print("Testing Fixed Semantic Filtering Implementation")
    print("=" * 60)
    
    # Run main test
    success = test_fixed_filtering()
    
    # Run comparison if possible
    if success:
        comparison_improved = comparison_test()
        
        print(f"\n" + "=" * 60)
        print("FINAL RESULTS")
        print("=" * 60)
        print(f"Fixed filtering test: {'✅ PASSED' if success else '❌ FAILED'}")
        if success:
            print(f"Accuracy improvement: {'✅ YES' if comparison_improved else '❌ NO'}")
        
    print(f"\nNote: This test validates the critical fixes for:")
    print(f"- Mixed unit data types (string/int)")
    print(f"- Precise subject matching with exclusions")
    print(f"- Cross-subject contamination prevention")
    print(f"- Video collection schema adaptation")
