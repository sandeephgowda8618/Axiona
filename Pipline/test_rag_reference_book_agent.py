#!/usr/bin/env python3

"""
Test RAG Reference Book Retrieval Agent
=======================================

Test the production RAG reference book agent with real database queries
and LLM-based intelligent book selection.
"""

import sys
import os
import asyncio
import logging

# Add the Pipline directory to path
sys.path.append('/Users/sandeeph/Documents/s2/Axiona/Pipline')

from agents.production_rag_reference_book_agent import ProductionRAGReferenceBookAgent
from config.database import db_manager

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_rag_reference_book_agent():
    """Test the RAG Reference Book Agent with multiple subjects"""
    
    print("🧪 TESTING RAG REFERENCE BOOK RETRIEVAL AGENT")
    print("=" * 60)
    
    # Initialize agent
    agent = ProductionRAGReferenceBookAgent()
    
    # Test cases
    test_cases = [
        {
            "subject": "Operating Systems",
            "difficulty": "Beginner",
            "concepts": ["processes", "threads", "synchronization"]
        },
        {
            "subject": "Data Structures & Algorithms", 
            "difficulty": "Intermediate",
            "concepts": ["arrays", "sorting", "searching", "trees"]
        },
        {
            "subject": "Computer Networks",
            "difficulty": "Advanced", 
            "concepts": ["tcp", "routing", "protocols"]
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        subject = test_case["subject"]
        difficulty = test_case["difficulty"] 
        concepts = test_case["concepts"]
        
        print(f"\n📖 TEST {i}: {subject} ({difficulty})")
        print(f"Concepts: {concepts}")
        print("-" * 50)
        
        try:
            # Test the agent
            result = await agent.retrieve_best_book(
                subject=subject,
                difficulty=difficulty,
                concepts=concepts
            )
            
            # Analyze results
            if result.get("result"):
                book = result["result"]
                candidates_found = result.get("candidates_found", 0)
                
                print(f"✅ SUCCESS: Found reference book")
                print(f"📚 Title: {book.get('title', 'Unknown')}")
                print(f"👥 Authors: {', '.join(book.get('authors', []))}")
                print(f"📊 Difficulty: {book.get('difficulty', 'Unknown')}")
                print(f"🎯 Relevance Score: {book.get('relevance_score', 'N/A')}")
                print(f"🔍 Candidates Found: {candidates_found}")
                
                # Show key concepts if available
                key_concepts = book.get('key_concepts', [])
                if key_concepts:
                    print(f"🔑 Key Concepts: {', '.join(key_concepts[:3])}...")
                
                # Show recommended chapters if available
                rec_chapters = book.get('recommended_chapters', [])
                if rec_chapters:
                    print(f"📑 Recommended: {', '.join(rec_chapters[:2])}...")
                
                results.append({
                    "subject": subject,
                    "success": True,
                    "title": book.get('title'),
                    "candidates": candidates_found
                })
                
            else:
                error = result.get("error", "Unknown error")
                candidates_found = result.get("candidates_found", 0)
                print(f"❌ FAILED: {error}")
                print(f"🔍 Candidates Found: {candidates_found}")
                
                results.append({
                    "subject": subject,
                    "success": False,
                    "error": error,
                    "candidates": candidates_found
                })
            
        except Exception as e:
            print(f"💥 ERROR: {e}")
            logger.error(f"Test failed for {subject}: {e}")
            
            results.append({
                "subject": subject,
                "success": False,
                "error": str(e),
                "candidates": 0
            })
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 RAG REFERENCE BOOK AGENT TEST SUMMARY")
    print("=" * 60)
    
    successful_tests = sum(1 for r in results if r["success"])
    total_tests = len(results)
    total_candidates = sum(r.get("candidates", 0) for r in results)
    
    print(f"✅ Successful Tests: {successful_tests}/{total_tests}")
    print(f"🔍 Total Candidates Found: {total_candidates}")
    print(f"📈 Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    
    # Individual results
    for result in results:
        status = "✅" if result["success"] else "❌"
        title = result.get("title", result.get("error", "Unknown"))
        candidates = result.get("candidates", 0)
        print(f"{status} {result['subject']}: {title[:50]}... ({candidates} candidates)")
    
    # Recommendations
    print(f"\n📋 NEXT STEPS:")
    if successful_tests == total_tests:
        print("🎉 All tests passed! RAG Reference Book Agent is ready for integration.")
    else:
        failed_subjects = [r["subject"] for r in results if not r["success"]]
        print(f"⚠️ Fix issues with: {', '.join(failed_subjects)}")
        print("💡 Check database content and LLM selection logic")
    
    return results

def test_database_connection():
    """Test basic database connectivity"""
    try:
        print("🔍 Testing database connection...")
        
        # Test reference books collection
        collection = db_manager.get_collection("reference_books")
        count = collection.count_documents({})
        
        print(f"📖 Reference books in database: {count}")
        
        if count > 0:
            # Sample a few books
            sample_books = list(collection.find({}).limit(3))
            print("📚 Sample books:")
            for book in sample_books:
                title = book.get("title", "Unknown")
                subject_hints = []
                
                # Look for subject indicators
                for field in ["title", "summary", "key_concepts"]:
                    content = str(book.get(field, "")).lower()
                    if any(keyword in content for keyword in ["operating", "system", "os"]):
                        subject_hints.append("OS")
                    if any(keyword in content for keyword in ["algorithm", "data structure"]):
                        subject_hints.append("DSA") 
                    if any(keyword in content for keyword in ["network", "tcp", "protocol"]):
                        subject_hints.append("Networks")
                
                subject_str = ", ".join(subject_hints) if subject_hints else "Unknown"
                print(f"  📖 {title[:40]}... (Subjects: {subject_str})")
        
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 RAG REFERENCE BOOK AGENT TEST SUITE")
    print("=" * 60)
    
    # Test database connection first
    if not test_database_connection():
        print("❌ Database connection failed. Exiting.")
        sys.exit(1)
    
    print()
    
    # Run async test
    try:
        asyncio.run(test_rag_reference_book_agent())
        print(f"\n✅ Test completed successfully!")
        
    except KeyboardInterrupt:
        print(f"\n⏹️ Test interrupted by user")
        
    except Exception as e:
        print(f"\n💥 Test suite failed: {e}")
        logger.error(f"Test suite error: {e}")
        sys.exit(1)
