#!/usr/bin/env python3
"""
Simple DSA Roadmap Test - Using Working Infrastructure
====================================================

Generate a roadmap for Data Structures and Algorithms using existing test framework.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import json
from datetime import datetime
from utils.json_utils import safe_json_dump

# Test the corrected agents directly for DSA
from agents.corrected_retrieval_agents import (
    retrieve_pes_materials_corrected,
    retrieve_reference_books_corrected, 
    retrieve_videos_corrected
)

def test_dsa_corrected_agents():
    """Test corrected agents specifically for DSA subject"""
    
    print("🚀 TESTING DSA WITH CORRECTED AGENTS")
    print("=" * 60)
    
    subject = "Data Structures and Algorithms"
    results = {
        "test_subject": subject,
        "timestamp": datetime.now().isoformat(),
        "phases": [],
        "summary": {}
    }
    
    # Define DSA phases
    dsa_phases = [
        {"phase_id": 1, "concepts": ["arrays", "linked lists", "stacks", "queues"], "difficulty": "beginner"},
        {"phase_id": 2, "concepts": ["trees", "heaps", "hashing"], "difficulty": "intermediate"}, 
        {"phase_id": 3, "concepts": ["graphs", "sorting", "searching"], "difficulty": "intermediate"},
        {"phase_id": 4, "concepts": ["dynamic programming", "greedy", "advanced"], "difficulty": "advanced"}
    ]
    
    total_pes = 0
    total_books = 0
    total_videos = 0
    contamination_issues = []
    
    for phase in dsa_phases:
        phase_id = phase["phase_id"]
        concepts = phase["concepts"]
        difficulty = phase["difficulty"]
        
        print(f"\n🔄 PHASE {phase_id}: {' '.join(concepts).title()}")
        print("-" * 50)
        
        # Test PES materials
        try:
            pes_result = retrieve_pes_materials_corrected(subject, phase_id, concepts)
            pes_materials = pes_result.get("results", [])
            total_pes += len(pes_materials)
            
            # Check for contamination
            for pes in pes_materials:
                title = pes.get("title", "").lower()
                if "operating system" in title or "database" in title or "networking" in title:
                    contamination_issues.append(f"Phase {phase_id}: {title[:50]}")
            
            print(f"📚 PES Materials: {len(pes_materials)} found")
            if pes_materials:
                sample = pes_materials[0]
                print(f"  📄 Sample: {sample.get('title', 'N/A')[:60]}...")
        
        except Exception as e:
            print(f"❌ PES Error: {e}")
            pes_materials = []
        
        # Test reference books
        try:
            book_result = retrieve_reference_books_corrected(subject, difficulty, concepts)
            reference_book = book_result.get("result", {})
            if reference_book:
                total_books += 1
                print(f"📖 Reference Book: ✅ {reference_book.get('title', 'N/A')[:50]}...")
            else:
                print(f"📖 Reference Book: ❌ None found")
        
        except Exception as e:
            print(f"❌ Book Error: {e}")
            reference_book = {}
        
        # Test video keywords
        try:
            video_result = retrieve_videos_corrected(subject, difficulty, f"Unit {phase_id}")
            playlists = video_result.get("search_keywords_playlists", [])
            oneshot = video_result.get("search_keywords_oneshot", "")
            total_videos += len(playlists)
            
            print(f"🎥 Video Keywords: {len(playlists)} playlists + {'1' if oneshot else '0'} oneshot")
            if playlists:
                print(f"  🎬 Sample: {playlists[0][:50]}...")
        
        except Exception as e:
            print(f"❌ Video Error: {e}")
            video_result = {}
        
        # Store phase results
        phase_result = {
            "phase_id": phase_id,
            "concepts": concepts,
            "difficulty": difficulty,
            "pes_count": len(pes_materials),
            "has_book": bool(reference_book),
            "video_keywords": len(playlists),
            "contamination_issues": []
        }
        
        # Check for contamination in this phase
        for pes in pes_materials:
            title = pes.get("title", "").lower()
            if any(bad_keyword in title for bad_keyword in ["operating system", "database", "networking", "electronics"]):
                phase_result["contamination_issues"].append(f"PES: {title[:40]}...")
        
        if reference_book:
            book_title = reference_book.get("title", "").lower()
            if not any(good_keyword in book_title for good_keyword in ["data structure", "algorithm", "programming", "computer science"]):
                phase_result["contamination_issues"].append(f"Book: {book_title[:40]}...")
        
        results["phases"].append(phase_result)
    
    # Summary
    results["summary"] = {
        "total_pes_materials": total_pes,
        "total_books_found": total_books,
        "total_video_keywords": total_videos,
        "total_contamination_issues": len(contamination_issues),
        "phases_with_pes": sum(1 for p in results["phases"] if p["pes_count"] > 0),
        "phases_with_books": sum(1 for p in results["phases"] if p["has_book"]),
        "avg_pes_per_phase": total_pes / 4 if total_pes > 0 else 0
    }
    
    print(f"\n📊 DSA CORRECTED AGENTS SUMMARY")
    print("=" * 60)
    print(f"📚 Total PES Materials: {total_pes}")
    print(f"📖 Total Books Found: {total_books}/4 phases")
    print(f"🎥 Total Video Keywords: {total_videos}")
    print(f"🚨 Contamination Issues: {len(contamination_issues)}")
    print(f"✅ Phases with PES: {results['summary']['phases_with_pes']}/4")
    print(f"✅ Phases with Books: {results['summary']['phases_with_books']}/4")
    
    if contamination_issues:
        print(f"\n⚠️ CONTAMINATION DETECTED:")
        for issue in contamination_issues[:3]:
            print(f"  - {issue}")
    else:
        print(f"\n🎉 NO CONTAMINATION DETECTED!")
    
    # Determine quality
    if total_pes >= 4 and total_books >= 2 and len(contamination_issues) == 0:
        quality = "EXCELLENT"
    elif total_pes >= 2 and total_books >= 1 and len(contamination_issues) <= 1:
        quality = "GOOD"
    elif total_pes >= 1 or total_books >= 1:
        quality = "FAIR"
    else:
        quality = "POOR"
    
    results["summary"]["overall_quality"] = quality
    print(f"\n🎯 OVERALL QUALITY: {quality}")
    
    return results

def main():
    """Main test function"""
    print("🎯 DSA Roadmap Generation Test with Corrected Agents")
    print("=" * 70)
    
    # Test corrected agents
    dsa_results = test_dsa_corrected_agents()
    
    # Save results
    output_file = f"dsa_corrected_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    safe_json_dump(dsa_results, output_file)
    
    print(f"\n💾 Results saved to: {output_file}")
    print("\n🏁 DSA Test completed!")
    
    return dsa_results

if __name__ == "__main__":
    main()
