#!/usr/bin/env python3
"""
Test Standardized Roadmap Builder
=================================

Test the complete 4-phase roadmap generation with all resource types.
"""

import asyncio
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.roadmap_builder_standardized import roadmap_builder

async def test_roadmap_generation():
    """Test complete roadmap generation"""
    print("🗺️ Testing Standardized Roadmap Builder...\n")
    
    # Generate roadmap for Operating Systems
    roadmap = await roadmap_builder.build_course_roadmap(
        course_name="Operating Systems",
        course_code="CS402",
        subject="Operating Systems",
        total_hours=60,
        user_level="intermediate"
    )
    
    print(f"📚 Course: {roadmap.get('course_name')}")
    print(f"📊 Total Hours: {roadmap.get('overall_duration_hours')}")
    print(f"📈 Phases: {len(roadmap.get('phases', []))}")
    print(f"🎯 Generated: {roadmap.get('meta', {}).get('generated_on', 'N/A')}\n")
    
    # Analyze each phase
    success_count = 0
    for i, phase in enumerate(roadmap.get("phases", [])):
        print(f"🔹 Phase {phase.get('phase_id', i+1)}: {phase.get('phase_title', 'Unknown')}")
        print(f"   ⏱️ Hours: {phase.get('estimated_hours', 0)}")
        print(f"   📘 PES Materials: {len(phase.get('pes_materials', []))}")
        
        # Check reference book
        ref_book = phase.get('reference_book')
        if ref_book:
            print(f"   📖 Reference Book: {ref_book.get('title', 'N/A')[:50]}...")
            if ref_book.get('recommended_chapters'):
                print(f"       Chapters: {', '.join(ref_book['recommended_chapters'])}")
        else:
            print(f"   📖 Reference Book: None")
        
        # Check videos
        videos = phase.get('videos', {})
        playlists = videos.get('playlists', [])
        oneshot = videos.get('oneshot')
        print(f"   🎥 Playlists: {len(playlists)}")
        print(f"   🎬 Oneshot: {'Yes' if oneshot else 'No'}")
        
        # Check project
        project = phase.get('project')
        if project:
            print(f"   🚀 Project: {project.get('title', 'N/A')}")
            print(f"       Complexity: {project.get('complexity', 'N/A')}")
            print(f"       Hours: {project.get('estimated_time_hours', 0)}")
        else:
            print(f"   🚀 Project: None")
        
        # Count successful phase
        if (phase.get('pes_materials') or 
            ref_book or 
            playlists or 
            oneshot or 
            project):
            success_count += 1
        
        print()
    
    # Validation
    total_phases = len(roadmap.get("phases", []))
    success_rate = (success_count / total_phases) if total_phases > 0 else 0
    
    print(f"📊 Roadmap Quality Assessment:")
    print(f"   ✅ Successful phases: {success_count}/{total_phases}")
    print(f"   📈 Success rate: {success_rate:.1%}")
    print(f"   🎯 Required structure: {'✅ Valid' if total_phases == 4 else '❌ Invalid'}")
    
    # Show sample phase content
    if roadmap.get("phases"):
        sample_phase = roadmap["phases"][0]
        print(f"\n📋 Sample Phase 1 Content:")
        
        if sample_phase.get('pes_materials'):
            sample_pes = sample_phase['pes_materials'][0]
            print(f"   📘 Sample PES: {sample_pes.get('title', '')[:60]}...")
            print(f"       Unit: {sample_pes.get('unit', 'N/A')}")
            print(f"       Relevance: {sample_pes.get('relevance_score', 0)}")
        
        if sample_phase.get('reference_book'):
            sample_book = sample_phase['reference_book']
            print(f"   📖 Reference: {sample_book.get('title', '')[:60]}...")
            print(f"       Authors: {', '.join(sample_book.get('authors', []))}")
            print(f"       Relevance: {sample_book.get('relevance_score', 0)}")
        
        if sample_phase.get('videos', {}).get('playlists'):
            sample_playlist = sample_phase['videos']['playlists'][0]
            print(f"   🎥 Playlist: {sample_playlist.get('title', '')[:60]}...")
            print(f"       Videos: {sample_playlist.get('video_count', 0)}")
    
    return success_rate >= 0.7  # 70% success threshold

async def test_multiple_subjects():
    """Test roadmap generation for different subjects"""
    print("\n🔍 Testing Multiple Subject Areas...\n")
    
    subjects = [
        ("Data Structures", "Computer Science"),
        ("Machine Learning", "Artificial Intelligence"),
        ("Database Systems", "Computer Science")
    ]
    
    results = []
    for course_name, subject in subjects:
        print(f"📚 Testing: {course_name}")
        
        try:
            roadmap = await roadmap_builder.build_course_roadmap(
                course_name=course_name,
                subject=subject,
                total_hours=48,
                user_level="beginner"
            )
            
            phases = len(roadmap.get("phases", []))
            has_error = bool(roadmap.get("error"))
            
            print(f"   Phases: {phases}/4")
            print(f"   Status: {'❌ Error' if has_error else '✅ Success'}")
            
            results.append(not has_error and phases == 4)
            
        except Exception as e:
            print(f"   Status: ❌ Exception: {str(e)[:50]}...")
            results.append(False)
        
        print()
    
    success_count = sum(results)
    print(f"📊 Multi-subject test: {success_count}/{len(subjects)} successful")
    
    return success_count >= len(subjects) * 0.7

async def test_roadmap_structure_validation():
    """Test that roadmap follows the exact JSON structure specification"""
    print("\n✅ Testing Roadmap Structure Validation...\n")
    
    roadmap = await roadmap_builder.build_course_roadmap(
        course_name="Operating Systems",
        total_hours=60
    )
    
    # Required top-level fields
    required_fields = ["course_name", "course_code", "overall_duration_hours", "phases", "meta"]
    missing_fields = [f for f in required_fields if f not in roadmap]
    
    print(f"📋 Top-level structure:")
    print(f"   Required fields: {len(required_fields)}")
    print(f"   Present fields: {len(required_fields) - len(missing_fields)}")
    print(f"   Missing: {missing_fields if missing_fields else 'None'}")
    
    # Phase structure validation
    phase_issues = []
    for i, phase in enumerate(roadmap.get("phases", [])):
        required_phase_fields = ["phase_id", "phase_title", "estimated_hours", "pes_materials", "reference_book", "videos", "project"]
        missing_phase_fields = [f for f in required_phase_fields if f not in phase]
        
        if missing_phase_fields:
            phase_issues.append(f"Phase {i+1}: missing {missing_phase_fields}")
        
        # Video structure validation
        videos = phase.get("videos", {})
        if not isinstance(videos, dict) or "playlists" not in videos or "oneshot" not in videos:
            phase_issues.append(f"Phase {i+1}: invalid video structure")
    
    print(f"   Phase structure issues: {len(phase_issues)}")
    if phase_issues:
        for issue in phase_issues[:3]:  # Show first 3 issues
            print(f"     - {issue}")
    
    # Meta validation
    meta = roadmap.get("meta", {})
    required_meta = ["generated_on", "course_subject", "total_phases", "agent_version"]
    missing_meta = [f for f in required_meta if f not in meta]
    
    print(f"   Meta fields missing: {missing_meta if missing_meta else 'None'}")
    
    structure_valid = (
        len(missing_fields) == 0 and
        len(phase_issues) == 0 and
        len(missing_meta) == 0 and
        len(roadmap.get("phases", [])) == 4
    )
    
    print(f"   Overall structure: {'✅ Valid' if structure_valid else '❌ Invalid'}")
    
    return structure_valid

async def main():
    """Run all roadmap tests"""
    print("🚀 Testing Standardized Roadmap Builder Implementation\n")
    
    tests = [
        ("Roadmap Generation", test_roadmap_generation),
        ("Multiple Subjects", test_multiple_subjects),
        ("Structure Validation", test_roadmap_structure_validation)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print(f"\n📊 Test Results Summary:")
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All roadmap builder tests passed!")
        print("🗺️ 4-phase roadmap generation is ready for production.")
    else:
        print("⚠️ Some roadmap tests failed. Review implementation.")

if __name__ == "__main__":
    asyncio.run(main())
