#!/usr/bin/env python3
"""
Complete Standardized System Test
=================================

Comprehensive test of the full standardized system including:
- Standardized retrieval agents
- 4-phase roadmap builder  
- Quiz generator with provenance
- API endpoints with proper schemas
"""

import asyncio
import sys
import os
import json
import requests
import time
from concurrent.futures import ThreadPoolExecutor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.standardized_agents import retrieval_agents, quiz_generator
from agents.roadmap_builder_standardized import roadmap_builder

async def test_standardized_agents():
    """Test all standardized agents"""
    print("🤖 Testing Standardized Agents...\n")
    
    tests = []
    
    # Test PDF search
    try:
        pdf_result = await retrieval_agents.pdf_search_agent("operating systems memory management", k=3)
        pdf_success = (
            isinstance(pdf_result, dict) and
            "results" in pdf_result and
            "meta" in pdf_result and
            pdf_result["meta"]["search_type"] == "pdf_search"
        )
        tests.append(("PDF Search", pdf_success))
        print(f"📄 PDF Search: {'✅' if pdf_success else '❌'} ({len(pdf_result.get('results', []))} results)")
        
        if pdf_success and pdf_result["results"]:
            example = pdf_result["results"][0]
            print(f"   Example: {example.get('title', '')[:50]}...")
            print(f"   Content type: {example.get('content_type')}")
            print(f"   Relevance: {example.get('relevance_score', 0)}")
    except Exception as e:
        print(f"📄 PDF Search: ❌ Error: {e}")
        tests.append(("PDF Search", False))
    
    # Test Book search
    try:
        book_result = await retrieval_agents.book_search_agent("computer architecture", k=3)
        book_success = (
            isinstance(book_result, dict) and
            book_result["meta"]["search_type"] == "book_search"
        )
        tests.append(("Book Search", book_success))
        print(f"📚 Book Search: {'✅' if book_success else '❌'} ({len(book_result.get('results', []))} results)")
        
        if book_success and book_result["results"]:
            # Verify deduplication
            book_ids = [book["id"] for book in book_result["results"]]
            unique_ids = set(book_ids)
            dedup_success = len(book_ids) == len(unique_ids)
            tests.append(("Book Deduplication", dedup_success))
            print(f"   Deduplication: {'✅' if dedup_success else '❌'} ({len(unique_ids)} unique books)")
    except Exception as e:
        print(f"📚 Book Search: ❌ Error: {e}")
        tests.append(("Book Search", False))
        tests.append(("Book Deduplication", False))
    
    # Test Video search
    try:
        video_result = await retrieval_agents.video_search_agent("programming tutorial", k=3)
        video_success = (
            isinstance(video_result, dict) and
            video_result["meta"]["search_type"] == "video_search"
        )
        tests.append(("Video Search", video_success))
        print(f"🎥 Video Search: {'✅' if video_success else '❌'} ({len(video_result.get('results', []))} results)")
    except Exception as e:
        print(f"🎥 Video Search: ❌ Error: {e}")
        tests.append(("Video Search", False))
    
    print()
    return tests

async def test_roadmap_builder():
    """Test 4-phase roadmap builder"""
    print("🗺️ Testing 4-Phase Roadmap Builder...\n")
    
    tests = []
    
    try:
        roadmap = await roadmap_builder.build_course_roadmap(
            course_name="Operating Systems",
            course_code="CS402",
            subject="Operating Systems",
            total_hours=60
        )
        
        # Structure validation
        structure_valid = (
            "phases" in roadmap and
            len(roadmap["phases"]) == 4 and
            "meta" in roadmap and
            roadmap.get("overall_duration_hours") == 60
        )
        tests.append(("Roadmap Structure", structure_valid))
        
        # Phase content validation
        phase_content_scores = []
        for i, phase in enumerate(roadmap.get("phases", [])):
            score = 0
            if phase.get("pes_materials"):
                score += 1
            if phase.get("reference_book"):
                score += 1
            if phase.get("videos", {}).get("playlists"):
                score += 1
            if phase.get("project"):
                score += 1
            phase_content_scores.append(score)
        
        avg_content_score = sum(phase_content_scores) / len(phase_content_scores) if phase_content_scores else 0
        content_quality = avg_content_score >= 3.0  # At least 3/4 resource types per phase
        tests.append(("Phase Content Quality", content_quality))
        
        # Progressive difficulty validation
        difficulties = [phase.get("difficulty", "") for phase in roadmap.get("phases", [])]
        expected_progression = ["Beginner", "Intermediate", "Intermediate", "Advanced"]
        difficulty_progression = difficulties == expected_progression
        tests.append(("Difficulty Progression", difficulty_progression))
        
        print(f"📊 Roadmap Structure: {'✅' if structure_valid else '❌'}")
        print(f"📈 Content Quality: {'✅' if content_quality else '❌'} (avg {avg_content_score:.1f}/4)")
        print(f"🎯 Difficulty Progression: {'✅' if difficulty_progression else '❌'}")
        print(f"   Expected: {expected_progression}")
        print(f"   Actual: {difficulties}")
        
    except Exception as e:
        print(f"🗺️ Roadmap Builder: ❌ Error: {e}")
        tests.append(("Roadmap Structure", False))
        tests.append(("Phase Content Quality", False))
        tests.append(("Difficulty Progression", False))
    
    print()
    return tests

async def test_quiz_generator():
    """Test quiz generator with provenance"""
    print("🧪 Testing Quiz Generator...\n")
    
    tests = []
    
    try:
        quiz = await quiz_generator.generate_quiz(
            topic="operating systems",
            n_questions=3,
            difficulty="intermediate"
        )
        
        # Structure validation
        structure_valid = (
            "questions" in quiz and
            "meta" in quiz and
            len(quiz["questions"]) == 3
        )
        tests.append(("Quiz Structure", structure_valid))
        
        # Question validation
        question_quality = True
        for question in quiz.get("questions", []):
            if not (question.get("stem") and 
                   question.get("choices") and
                   len(question.get("choices", [])) >= 2):
                question_quality = False
                break
                
            # Check exactly one correct answer
            correct_count = sum(1 for choice in question.get("choices", []) 
                              if choice.get("is_correct"))
            if correct_count != 1:
                question_quality = False
                break
        
        tests.append(("Question Quality", question_quality))
        
        # Provenance validation
        provenance_valid = (
            quiz.get("meta", {}).get("source_chunks") and
            len(quiz["meta"]["source_chunks"]) > 0
        )
        tests.append(("Source Provenance", provenance_valid))
        
        print(f"📝 Quiz Structure: {'✅' if structure_valid else '❌'}")
        print(f"🎯 Question Quality: {'✅' if question_quality else '❌'}")
        print(f"📚 Source Provenance: {'✅' if provenance_valid else '❌'} ({len(quiz.get('meta', {}).get('source_chunks', []))} chunks)")
        
    except Exception as e:
        print(f"🧪 Quiz Generator: ❌ Error: {e}")
        tests.append(("Quiz Structure", False))
        tests.append(("Question Quality", False))
        tests.append(("Source Provenance", False))
    
    print()
    return tests

def test_api_endpoints():
    """Test API endpoints if server is running"""
    print("🌐 Testing API Endpoints...\n")
    
    tests = []
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        health_ok = response.status_code == 200
        tests.append(("API Health", health_ok))
        print(f"❤️ Health Check: {'✅' if health_ok else '❌'}")
    except requests.exceptions.RequestException:
        tests.append(("API Health", False))
        print("❤️ Health Check: ❌ (API server not running)")
        return tests  # Skip other tests if server is not running
    
    # Test search endpoints
    search_endpoints = [
        ("/api/search/pdf", "PDF Search API"),
        ("/api/search/book", "Book Search API"),
        ("/api/search/video", "Video Search API")
    ]
    
    for endpoint, name in search_endpoints:
        try:
            payload = {"query": "test", "k": 2}
            response = requests.post(f"{base_url}{endpoint}", json=payload, timeout=10)
            endpoint_ok = (
                response.status_code == 200 and
                "data" in response.json() and
                "success" in response.json()
            )
            tests.append((name, endpoint_ok))
            print(f"🔍 {name}: {'✅' if endpoint_ok else '❌'}")
        except Exception as e:
            tests.append((name, False))
            print(f"🔍 {name}: ❌ Error: {str(e)[:50]}...")
    
    # Test roadmap endpoint
    try:
        payload = {"goal": "learn Operating Systems", "total_hours": 40}
        response = requests.post(f"{base_url}/api/roadmap", json=payload, timeout=30)
        roadmap_ok = (
            response.status_code == 200 and
            "data" in response.json() and
            response.json()["data"].get("phases")
        )
        tests.append(("Roadmap API", roadmap_ok))
        print(f"🗺️ Roadmap API: {'✅' if roadmap_ok else '❌'}")
    except Exception as e:
        tests.append(("Roadmap API", False))
        print(f"🗺️ Roadmap API: ❌ Error: {str(e)[:50]}...")
    
    # Test quiz endpoint
    try:
        payload = {"topic": "test", "n_questions": 2}
        response = requests.post(f"{base_url}/api/quiz/generate", json=payload, timeout=15)
        quiz_ok = (
            response.status_code == 200 and
            "data" in response.json()
        )
        tests.append(("Quiz API", quiz_ok))
        print(f"🧪 Quiz API: {'✅' if quiz_ok else '❌'}")
    except Exception as e:
        tests.append(("Quiz API", False))
        print(f"🧪 Quiz API: ❌ Error: {str(e)[:50]}...")
    
    print()
    return tests

async def test_schema_compliance():
    """Test compliance with TODO schema specifications"""
    print("✅ Testing Schema Compliance...\n")
    
    tests = []
    
    # Test search response envelope
    try:
        result = await retrieval_agents.pdf_search_agent("test", k=1)
        envelope_compliance = (
            "results" in result and
            "meta" in result and
            "query" in result["meta"] and
            "search_type" in result["meta"] and
            "returned" in result["meta"] and
            "top_k" in result["meta"] and
            "timestamp" in result["meta"]
        )
        tests.append(("Search Envelope Schema", envelope_compliance))
        print(f"📋 Search Envelope: {'✅' if envelope_compliance else '❌'}")
        
        # Test metadata object schema
        if result["results"]:
            metadata = result["results"][0]
            required_fields = ["id", "title", "content_type", "source", "relevance_score", "semantic_score"]
            metadata_compliance = all(field in metadata for field in required_fields)
            tests.append(("Metadata Object Schema", metadata_compliance))
            print(f"📊 Metadata Object: {'✅' if metadata_compliance else '❌'}")
        else:
            tests.append(("Metadata Object Schema", False))
            print("📊 Metadata Object: ❌ (No results to validate)")
            
    except Exception as e:
        print(f"📋 Schema Compliance: ❌ Error: {e}")
        tests.append(("Search Envelope Schema", False))
        tests.append(("Metadata Object Schema", False))
    
    # Test roadmap schema
    try:
        roadmap = await roadmap_builder.build_course_roadmap("Test Course", total_hours=40)
        roadmap_schema_compliance = (
            "course_name" in roadmap and
            "overall_duration_hours" in roadmap and
            "phases" in roadmap and
            "meta" in roadmap and
            len(roadmap["phases"]) == 4
        )
        tests.append(("Roadmap Schema", roadmap_schema_compliance))
        print(f"🗺️ Roadmap Schema: {'✅' if roadmap_schema_compliance else '❌'}")
        
        # Test phase schema
        if roadmap["phases"]:
            phase = roadmap["phases"][0]
            phase_fields = ["phase_id", "phase_title", "estimated_hours", "pes_materials", "reference_book", "videos", "project"]
            phase_compliance = all(field in phase for field in phase_fields)
            tests.append(("Phase Schema", phase_compliance))
            print(f"📑 Phase Schema: {'✅' if phase_compliance else '❌'}")
        else:
            tests.append(("Phase Schema", False))
            print("📑 Phase Schema: ❌ (No phases to validate)")
            
    except Exception as e:
        print(f"🗺️ Roadmap Schema: ❌ Error: {e}")
        tests.append(("Roadmap Schema", False))
        tests.append(("Phase Schema", False))
    
    print()
    return tests

async def main():
    """Run comprehensive standardized system test"""
    print("🚀 COMPREHENSIVE STANDARDIZED SYSTEM TEST\n")
    print("=" * 60)
    print()
    
    all_tests = []
    
    # Run all test suites
    test_suites = [
        ("Standardized Agents", test_standardized_agents),
        ("Roadmap Builder", test_roadmap_builder),
        ("Quiz Generator", test_quiz_generator),
        ("Schema Compliance", test_schema_compliance)
    ]
    
    for suite_name, test_func in test_suites:
        print(f"🧪 {suite_name.upper()} TESTS")
        print("-" * 40)
        try:
            suite_tests = await test_func()
            all_tests.extend(suite_tests)
        except Exception as e:
            print(f"❌ {suite_name} test suite failed: {e}")
            all_tests.append((f"{suite_name} Suite", False))
        print()
    
    # API tests (separate since they may fail if server not running)
    print("🧪 API ENDPOINT TESTS")
    print("-" * 40)
    api_tests = test_api_endpoints()
    all_tests.extend(api_tests)
    
    # Final summary
    print("📊 FINAL SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in all_tests if result)
    total = len(all_tests)
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"✅ Tests Passed: {passed}/{total}")
    print(f"📈 Success Rate: {success_rate:.1f}%")
    print()
    
    # Group results by category
    categories = {}
    for test_name, result in all_tests:
        category = test_name.split()[0] if " " in test_name else "Other"
        if category not in categories:
            categories[category] = {"passed": 0, "total": 0}
        categories[category]["total"] += 1
        if result:
            categories[category]["passed"] += 1
    
    print("📊 Results by Category:")
    for category, stats in categories.items():
        rate = (stats["passed"] / stats["total"]) * 100
        status = "✅" if rate >= 80 else "⚠️" if rate >= 60 else "❌"
        print(f"   {status} {category}: {stats['passed']}/{stats['total']} ({rate:.0f}%)")
    
    print()
    
    if success_rate >= 90:
        print("🎉 EXCELLENT! Standardized system is production ready.")
        print("✨ All major components are working correctly.")
    elif success_rate >= 75:
        print("✅ GOOD! System is mostly functional with minor issues.")
        print("🔧 Some components may need attention.")
    elif success_rate >= 50:
        print("⚠️ PARTIAL! System has significant issues.")
        print("🛠️ Major components need debugging.")
    else:
        print("❌ CRITICAL! System has major failures.")
        print("🚨 Immediate attention required.")

if __name__ == "__main__":
    asyncio.run(main())
