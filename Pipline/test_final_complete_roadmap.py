#!/usr/bin/env python3
"""
Final Complete Roadmap Test - Using Existing Infrastructure
=========================================================

Uses the existing test infrastructure but analyzes results to show
the improvement from the corrected agent prompts.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from datetime import datetime
from utils.json_utils import safe_json_dump

# Import the existing test
from test_complete_interview_driven import test_complete_interview_driven_roadmap

def analyze_roadmap_quality(roadmap_data):
    """Analyze the quality of generated roadmap"""
    
    analysis = {
        "timestamp": datetime.now().isoformat(),
        "overall_quality": "UNKNOWN",
        "phase_analysis": [],
        "resource_distribution": {
            "total_pes": 0,
            "total_books": 0, 
            "total_videos": 0,
            "phases_with_pes": 0,
            "phases_with_books": 0,
            "phases_with_videos": 0
        },
        "contamination_check": {
            "contaminated_pes": [],
            "contaminated_books": [],
            "total_issues": 0
        },
        "improvements": [],
        "remaining_issues": []
    }
    
    if not roadmap_data or "final_roadmap" not in roadmap_data:
        analysis["overall_quality"] = "FAILED"
        analysis["remaining_issues"].append("No roadmap data found")
        return analysis
    
    roadmap = roadmap_data["final_roadmap"]
    phases = roadmap.get("phases", [])
    
    print("\n🔍 ANALYZING ROADMAP QUALITY")
    print("=" * 60)
    
    for phase in phases:
        phase_id = phase.get("phase_id", 0)
        resources = phase.get("resources", {})
        
        # Analyze PES materials
        pes_materials = resources.get("pes_materials", [])
        pes_count = len(pes_materials)
        analysis["resource_distribution"]["total_pes"] += pes_count
        
        if pes_count > 0:
            analysis["resource_distribution"]["phases_with_pes"] += 1
            
        # Check for PES contamination
        for pes in pes_materials:
            title = pes.get("title", "").lower()
            subject = pes.get("subject", "").lower()
            
            # Check for off-topic content
            contamination_keywords = [
                "programming in c", "data structures", "database", 
                "microprocessor", "electronics", "chemistry", "mathematics"
            ]
            
            for keyword in contamination_keywords:
                if keyword in title or keyword in subject:
                    analysis["contamination_check"]["contaminated_pes"].append({
                        "phase": phase_id,
                        "title": title[:50] + "...",
                        "contamination": keyword
                    })
                    break
        
        # Analyze reference books  
        reference_books = resources.get("reference_books", [])
        if not reference_books:
            # Check for single reference_book
            reference_book = resources.get("reference_book", {})
            if reference_book:
                reference_books = [reference_book]
        
        book_count = len(reference_books)
        analysis["resource_distribution"]["total_books"] += book_count
        
        if book_count > 0:
            analysis["resource_distribution"]["phases_with_books"] += 1
            
        # Check for book contamination
        for book in reference_books:
            title = book.get("title", "").lower() 
            
            # OS-specific books should contain OS-related terms
            os_keywords = ["operating system", "os", "system", "unix", "linux"]
            irrelevant_keywords = ["python", "instrumentation", "analysis and design"]
            
            is_os_relevant = any(keyword in title for keyword in os_keywords)
            is_irrelevant = any(keyword in title for keyword in irrelevant_keywords)
            
            if not is_os_relevant or is_irrelevant:
                analysis["contamination_check"]["contaminated_books"].append({
                    "phase": phase_id,
                    "title": title[:50] + "...",
                    "reason": "Not OS-specific" if not is_os_relevant else "Contains irrelevant content"
                })
        
        # Analyze videos
        videos = resources.get("videos", {})
        playlists = videos.get("playlists", [])
        oneshot = videos.get("oneshot", {})
        
        video_count = len(playlists) + (1 if oneshot else 0)
        analysis["resource_distribution"]["total_videos"] += video_count
        
        if video_count > 0:
            analysis["resource_distribution"]["phases_with_videos"] += 1
        
        # Phase summary
        phase_quality = "GOOD"
        if pes_count == 0:
            phase_quality = "POOR" 
        elif book_count == 0:
            phase_quality = "FAIR"
            
        analysis["phase_analysis"].append({
            "phase_id": phase_id,
            "phase_title": phase.get("phase_title", "Unknown"),
            "pes_count": pes_count,
            "book_count": book_count,
            "video_count": video_count,
            "quality": phase_quality
        })
        
        print(f"\n📋 Phase {phase_id}: {phase.get('phase_title', 'Unknown')}")
        print(f"  📚 PES Materials: {pes_count}")
        print(f"  📖 Reference Books: {book_count}")
        print(f"  🎥 Videos: {video_count}")
        print(f"  🎯 Quality: {phase_quality}")
    
    # Calculate contamination issues
    analysis["contamination_check"]["total_issues"] = (
        len(analysis["contamination_check"]["contaminated_pes"]) +
        len(analysis["contamination_check"]["contaminated_books"])
    )
    
    # Determine improvements
    if analysis["resource_distribution"]["phases_with_pes"] == len(phases):
        analysis["improvements"].append("All phases have PES materials")
    elif analysis["resource_distribution"]["phases_with_pes"] > 0:
        analysis["improvements"].append(f"{analysis['resource_distribution']['phases_with_pes']}/{len(phases)} phases have PES materials")
    
    if analysis["contamination_check"]["total_issues"] == 0:
        analysis["improvements"].append("No cross-contamination detected")
    
    if analysis["resource_distribution"]["phases_with_books"] == len(phases):
        analysis["improvements"].append("All phases have reference books")
        
    # Identify remaining issues
    if analysis["resource_distribution"]["phases_with_pes"] < len(phases):
        missing_phases = len(phases) - analysis["resource_distribution"]["phases_with_pes"]
        analysis["remaining_issues"].append(f"{missing_phases} phases missing PES materials")
        
    if analysis["contamination_check"]["total_issues"] > 0:
        analysis["remaining_issues"].append(f"{analysis['contamination_check']['total_issues']} contamination issues found")
    
    # Overall quality assessment
    if len(analysis["remaining_issues"]) == 0:
        analysis["overall_quality"] = "EXCELLENT"
    elif analysis["contamination_check"]["total_issues"] == 0:
        analysis["overall_quality"] = "GOOD"
    elif analysis["resource_distribution"]["phases_with_pes"] >= len(phases) // 2:
        analysis["overall_quality"] = "FAIR"
    else:
        analysis["overall_quality"] = "POOR"
        
    return analysis

def main():
    """Run final comprehensive test"""
    
    print("🚀 FINAL COMPLETE ROADMAP TEST")
    print("=" * 70)
    print("Testing complete interview-driven roadmap with quality analysis")
    
    # Run the complete test
    print("\n🔄 Running Complete Interview-Driven Test...")
    roadmap_results = test_complete_interview_driven_roadmap()
    
    # Analyze quality
    print("\n🔍 Analyzing Roadmap Quality...")
    quality_analysis = analyze_roadmap_quality(roadmap_results)
    
    # Final summary
    print("\n📊 FINAL QUALITY ANALYSIS")
    print("=" * 60)
    
    print(f"🎯 Overall Quality: {quality_analysis['overall_quality']}")
    print(f"📚 Total PES Materials: {quality_analysis['resource_distribution']['total_pes']}")
    print(f"📖 Total Reference Books: {quality_analysis['resource_distribution']['total_books']}")
    print(f"🎥 Total Videos: {quality_analysis['resource_distribution']['total_videos']}")
    print(f"🚨 Contamination Issues: {quality_analysis['contamination_check']['total_issues']}")
    
    # Show improvements
    if quality_analysis["improvements"]:
        print(f"\n✅ IMPROVEMENTS:")
        for improvement in quality_analysis["improvements"]:
            print(f"  - {improvement}")
    
    # Show remaining issues
    if quality_analysis["remaining_issues"]:
        print(f"\n❌ REMAINING ISSUES:")
        for issue in quality_analysis["remaining_issues"]:
            print(f"  - {issue}")
    
    # Show contamination details if any
    if quality_analysis["contamination_check"]["total_issues"] > 0:
        print(f"\n🔍 CONTAMINATION DETAILS:")
        
        for pes_issue in quality_analysis["contamination_check"]["contaminated_pes"][:3]:
            print(f"  📚 Phase {pes_issue['phase']}: {pes_issue['title']} (contains '{pes_issue['contamination']}')")
            
        for book_issue in quality_analysis["contamination_check"]["contaminated_books"][:3]:
            print(f"  📖 Phase {book_issue['phase']}: {book_issue['title']} ({book_issue['reason']})")
    
    # Save complete results
    complete_results = {
        "roadmap_results": roadmap_results,
        "quality_analysis": quality_analysis,
        "test_metadata": {
            "test_name": "Final Complete Roadmap Test",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0_corrected"
        }
    }
    
    output_file = f"final_roadmap_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    safe_json_dump(complete_results, output_file)
    print(f"\n💾 Complete results saved to: {output_file}")
    
    # Final status
    if quality_analysis["overall_quality"] in ["EXCELLENT", "GOOD"]:
        print(f"\n🎉 SUCCESS: {quality_analysis['overall_quality']} roadmap generated!")
    else:
        print(f"\n⚠️ NEEDS IMPROVEMENT: {quality_analysis['overall_quality']} roadmap quality")
    
    return complete_results

if __name__ == "__main__":
    main()
