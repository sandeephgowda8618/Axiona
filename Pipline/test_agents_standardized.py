#!/usr/bin/env python3
"""
Test Standardized Agents
========================

Test the new standardized agents that return JSON-only responses.
"""

import asyncio
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.standardized_agents import retrieval_agents, quiz_generator

async def test_pdf_search():
    """Test PDF search agent"""
    print("🔍 Testing PDF Search Agent...")
    
    query = "operating systems memory management"
    result = await retrieval_agents.pdf_search_agent(query, k=5)
    
    print(f"Query: {query}")
    print(f"Results returned: {len(result.get('results', []))}")
    print(f"Search type: {result.get('meta', {}).get('search_type')}")
    
    if result.get('results'):
        example = result['results'][0]
        print(f"Example result:")
        print(f"  ID: {example.get('id')}")
        print(f"  Title: {example.get('title', '')[:60]}...")
        print(f"  Content type: {example.get('content_type')}")
        print(f"  Relevance score: {example.get('relevance_score')}")
        print(f"  Snippet: {example.get('snippet', '')[:100]}...")
    
    return bool(result.get('results'))

async def test_book_search():
    """Test book search agent"""
    print("\n📚 Testing Book Search Agent...")
    
    query = "computer architecture"
    result = await retrieval_agents.book_search_agent(query, k=3)
    
    print(f"Query: {query}")
    print(f"Results returned: {len(result.get('results', []))}")
    
    if result.get('results'):
        for i, book in enumerate(result['results']):
            print(f"Book {i+1}:")
            print(f"  ID: {book.get('id')}")
            print(f"  Title: {book.get('title', '')[:50]}...")
            print(f"  Authors: {book.get('authors', [])}")
            print(f"  Relevance score: {book.get('relevance_score')}")
            if book.get('isbn'):
                print(f"  ISBN: {book.get('isbn')}")
            if book.get('publisher'):
                print(f"  Publisher: {book.get('publisher')}")
    
    return bool(result.get('results'))

async def test_video_search():
    """Test video search agent"""
    print("\n🎥 Testing Video Search Agent...")
    
    query = "programming tutorial"
    result = await retrieval_agents.video_search_agent(query, k=3)
    
    print(f"Query: {query}")
    print(f"Results returned: {len(result.get('results', []))}")
    
    if result.get('results'):
        for i, video in enumerate(result['results']):
            print(f"Video {i+1}:")
            print(f"  ID: {video.get('id')}")
            print(f"  Title: {video.get('title', '')[:50]}...")
            print(f"  URL: {video.get('url', '')[:50]}...")
            print(f"  Relevance score: {video.get('relevance_score')}")
    
    return bool(result.get('results'))

async def test_quiz_generator():
    """Test quiz generator"""
    print("\n🧪 Testing Quiz Generator...")
    
    topic = "operating systems"
    result = await quiz_generator.generate_quiz(
        topic=topic,
        n_questions=3,
        difficulty="intermediate"
    )
    
    print(f"Topic: {topic}")
    print(f"Questions generated: {len(result.get('questions', []))}")
    print(f"Source chunks used: {len(result.get('meta', {}).get('source_chunks', []))}")
    
    if result.get('questions'):
        example_q = result['questions'][0]
        print(f"Example question:")
        print(f"  ID: {example_q.get('id')}")
        print(f"  Stem: {example_q.get('stem', '')[:80]}...")
        print(f"  Choices: {len(example_q.get('choices', []))}")
        print(f"  Difficulty: {example_q.get('difficulty')}")
        
        # Check if exactly one answer is correct
        correct_answers = sum(1 for choice in example_q.get('choices', []) if choice.get('is_correct'))
        print(f"  Correct answers: {correct_answers} (should be 1)")
    
    return bool(result.get('questions'))

async def test_response_format_validation():
    """Test that all responses match the required JSON schema"""
    print("\n✅ Testing Response Format Validation...")
    
    # Test PDF search format
    pdf_result = await retrieval_agents.pdf_search_agent("test query", k=1)
    pdf_valid = (
        isinstance(pdf_result, dict) and
        'results' in pdf_result and
        'meta' in pdf_result and
        isinstance(pdf_result['results'], list) and
        pdf_result['meta'].get('search_type') == 'pdf_search'
    )
    print(f"PDF search format valid: {pdf_valid}")
    
    # Test book search format
    book_result = await retrieval_agents.book_search_agent("test query", k=1)
    book_valid = (
        isinstance(book_result, dict) and
        'results' in book_result and
        'meta' in book_result and
        book_result['meta'].get('search_type') == 'book_search'
    )
    print(f"Book search format valid: {book_valid}")
    
    # Test video search format
    video_result = await retrieval_agents.video_search_agent("test query", k=1)
    video_valid = (
        isinstance(video_result, dict) and
        'results' in video_result and
        'meta' in video_result and
        video_result['meta'].get('search_type') == 'video_search'
    )
    print(f"Video search format valid: {video_valid}")
    
    # Test quiz format
    quiz_result = await quiz_generator.generate_quiz("test", n_questions=1)
    quiz_valid = (
        isinstance(quiz_result, dict) and
        'topic' in quiz_result and
        'questions' in quiz_result and
        'meta' in quiz_result and
        isinstance(quiz_result['questions'], list)
    )
    print(f"Quiz format valid: {quiz_valid}")
    
    return pdf_valid and book_valid and video_valid and quiz_valid

async def main():
    """Run all agent tests"""
    print("🚀 Testing Standardized Agents Implementation\n")
    
    tests = [
        ("PDF Search Agent", test_pdf_search),
        ("Book Search Agent", test_book_search),
        ("Video Search Agent", test_video_search),
        ("Quiz Generator", test_quiz_generator),
        ("Response Format Validation", test_response_format_validation)
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
        print("🎉 All standardized agent tests passed!")
        print("✨ Agents are ready for production use.")
    else:
        print("⚠️ Some agent tests failed. Review implementation.")

if __name__ == "__main__":
    asyncio.run(main())
