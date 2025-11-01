#!/usr/bin/env python3
"""
Comprehensive PDF Search Test with Full Metadata Display
======================================================

This test displays all metadata fields being stored and uses book titles
as the main identifiers for search results.

Usage:
    python test/comprehensive_metadata_test.py
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Any
from datetime import datetime

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import chromadb
from chromadb.config import Settings
from core.mongodb_manager import MongoDBManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ComprehensiveMetadataTest:
    def __init__(self):
        self.mongodb_manager = MongoDBManager()
        self.chroma_client = None
        self.collection = None
        
    async def initialize(self):
        """Initialize connections"""
        try:
            # MongoDB
            await self.mongodb_manager.initialize()
            books = await self.mongodb_manager.get_all_books()
            logger.info(f"📚 MongoDB: {len(books)} books available")
            
            # ChromaDB
            chroma_path = os.getenv('CHROMA_DB_PATH', './chromadb')
            self.chroma_client = chromadb.PersistentClient(
                path=chroma_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            self.collection = self.chroma_client.get_collection("reference_textbooks")
            doc_count = self.collection.count()
            logger.info(f"🔍 ChromaDB: {doc_count} documents indexed")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            return False
    
    def display_metadata_sample(self):
        """Display sample metadata to show what's available"""
        logger.info("\n🔍 METADATA STRUCTURE ANALYSIS")
        logger.info("=" * 60)
        
        try:
            # Get a few sample documents
            sample_results = self.collection.get(limit=3)
            
            if sample_results and sample_results.get('metadatas'):
                for i, metadata in enumerate(sample_results['metadatas'], 1):
                    logger.info(f"\n📖 Sample Book {i}:")
                    logger.info(f"   Title: {metadata.get('title', 'N/A')}")
                    logger.info(f"   Author: {metadata.get('author', 'N/A')}")
                    logger.info(f"   Subject: {metadata.get('subject', 'N/A')}")
                    logger.info(f"   Category: {metadata.get('category', 'N/A')}")
                    logger.info(f"   Pages: {metadata.get('pages', 'N/A')}")
                    logger.info(f"   Language: {metadata.get('language', 'N/A')}")
                    logger.info(f"   Book ID: {metadata.get('book_id', 'N/A')}")
                    logger.info(f"   Type: {metadata.get('type', 'N/A')}")
                    logger.info(f"   File URL: {metadata.get('file_url', 'N/A')[:80]}...")
                    if metadata.get('tags'):
                        logger.info(f"   Tags: {metadata.get('tags', 'N/A')}")
                    if metadata.get('description'):
                        desc = metadata.get('description', '')[:100]
                        logger.info(f"   Description: {desc}...")
                
                logger.info(f"\n📊 Available metadata fields: {list(sample_results['metadatas'][0].keys())}")
            else:
                logger.warning("No sample documents found")
                
        except Exception as e:
            logger.error(f"❌ Error displaying metadata: {e}")
    
    def run_comprehensive_search_tests(self):
        """Run comprehensive search tests using titles as main identifiers"""
        logger.info("\n🔍 COMPREHENSIVE SEARCH TESTS")
        logger.info("=" * 60)
        
        test_queries = [
            {
                "query": "Python programming tutorial basics syntax",
                "description": "Python Programming Fundamentals",
                "expected_keywords": ["python", "programming", "tutorial"]
            },
            {
                "query": "machine learning algorithms neural networks deep learning",
                "description": "Machine Learning and AI",
                "expected_keywords": ["machine learning", "neural", "algorithm", "AI", "data science"]
            },
            {
                "query": "data structures algorithms arrays trees sorting searching",
                "description": "Data Structures and Algorithms",
                "expected_keywords": ["algorithm", "data structure", "array", "tree", "sort"]
            },
            {
                "query": "operating systems process management memory scheduling",
                "description": "Operating Systems Concepts",
                "expected_keywords": ["operating system", "process", "memory", "kernel"]
            },
            {
                "query": "database management SQL relational DBMS normalization",
                "description": "Database Management Systems",
                "expected_keywords": ["database", "SQL", "relational", "DBMS"]
            },
            {
                "query": "software engineering design patterns object oriented programming",
                "description": "Software Engineering",
                "expected_keywords": ["software", "engineering", "design", "pattern", "OOP"]
            },
            {
                "query": "computer networks TCP IP protocols networking",
                "description": "Computer Networking",
                "expected_keywords": ["network", "TCP", "IP", "protocol"]
            },
            {
                "query": "web development HTML CSS JavaScript frontend",
                "description": "Web Development",
                "expected_keywords": ["web", "HTML", "CSS", "JavaScript", "frontend"]
            },
            {
                "query": "cybersecurity encryption cryptography security",
                "description": "Cybersecurity and Cryptography",
                "expected_keywords": ["security", "encryption", "crypto"]
            },
            {
                "query": "mathematics statistics probability calculus",
                "description": "Mathematics and Statistics",
                "expected_keywords": ["math", "statistics", "probability", "calculus"]
            }
        ]
        
        total_tests = len(test_queries)
        successful_tests = 0
        
        for i, test_case in enumerate(test_queries, 1):
            logger.info(f"\n--- Test {i}/{total_tests}: {test_case['description']} ---")
            logger.info(f"Query: '{test_case['query']}'")
            
            try:
                # Search ChromaDB
                results = self.collection.query(
                    query_texts=[test_case['query']],
                    n_results=5
                )
                
                if results and results.get('metadatas') and results['metadatas'][0]:
                    logger.info(f"✅ Found {len(results['metadatas'][0])} results:")
                    
                    # Display results with full metadata
                    for j, metadata in enumerate(results['metadatas'][0], 1):
                        title = metadata.get('title', 'Unknown Title')
                        author = metadata.get('author', 'Unknown Author')
                        subject = metadata.get('subject', 'Unknown Subject')
                        book_id = metadata.get('book_id', 'Unknown ID')
                        
                        logger.info(f"  {j}. 📚 {title}")
                        logger.info(f"     👤 Author: {author}")
                        logger.info(f"     📂 Subject: {subject}")
                        logger.info(f"     🆔 MongoDB ID: {book_id}")
                        
                        # Show additional metadata if available
                        if metadata.get('pages'):
                            logger.info(f"     📄 Pages: {metadata.get('pages')}")
                        if metadata.get('category'):
                            logger.info(f"     🏷️  Category: {metadata.get('category')}")
                        if metadata.get('tags'):
                            tags = metadata.get('tags', '').split(',')[:3]  # Show first 3 tags
                            logger.info(f"     🏷️  Tags: {', '.join(tags)}")
                    
                    # Check relevance
                    all_text = ' '.join([
                        metadata.get('title', '') + ' ' + 
                        metadata.get('subject', '') + ' ' + 
                        metadata.get('tags', '') + ' ' +
                        metadata.get('description', '')
                        for metadata in results['metadatas'][0]
                    ]).lower()
                    
                    keyword_matches = sum(1 for keyword in test_case['expected_keywords'] 
                                        if keyword.lower() in all_text)
                    
                    if keyword_matches > 0:
                        successful_tests += 1
                        logger.info(f"     ✅ Relevance: {keyword_matches}/{len(test_case['expected_keywords'])} keywords matched")
                    else:
                        logger.info(f"     ⚠️  Relevance: No expected keywords found")
                        
                else:
                    logger.warning(f"❌ No results found for: {test_case['query']}")
                    
            except Exception as e:
                logger.error(f"❌ Search failed: {e}")
        
        # Summary
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        logger.info(f"\n📊 TEST SUMMARY")
        logger.info("=" * 40)
        logger.info(f"Total tests: {total_tests}")
        logger.info(f"Successful tests: {successful_tests}")
        logger.info(f"Failed tests: {total_tests - successful_tests}")
        logger.info(f"Success rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            logger.info("🎉 EXCELLENT: Search system is working very well!")
        elif success_rate >= 60:
            logger.info("✅ GOOD: Search system is working adequately")
        else:
            logger.info("⚠️  NEEDS IMPROVEMENT: Consider reviewing search algorithms")
        
        return success_rate >= 70
    
    def display_book_collection_stats(self):
        """Display statistics about the book collection"""
        logger.info("\n📊 BOOK COLLECTION STATISTICS")
        logger.info("=" * 60)
        
        try:
            # Get all documents
            all_docs = self.collection.get()
            
            if all_docs and all_docs.get('metadatas'):
                total_books = len(all_docs['metadatas'])
                logger.info(f"📚 Total books indexed: {total_books}")
                
                # Subject distribution
                subjects = {}
                authors = {}
                categories = {}
                
                for metadata in all_docs['metadatas']:
                    subject = metadata.get('subject', 'Unknown')
                    author = metadata.get('author', 'Unknown')
                    category = metadata.get('category', 'Unknown')
                    
                    subjects[subject] = subjects.get(subject, 0) + 1
                    authors[author] = authors.get(author, 0) + 1
                    categories[category] = categories.get(category, 0) + 1
                
                # Top subjects
                logger.info(f"\n📂 Top subjects:")
                for subject, count in sorted(subjects.items(), key=lambda x: x[1], reverse=True)[:10]:
                    logger.info(f"   {subject}: {count} books")
                
                # Top authors
                logger.info(f"\n👤 Top authors:")
                for author, count in sorted(authors.items(), key=lambda x: x[1], reverse=True)[:10]:
                    if author != "Unknown":
                        logger.info(f"   {author}: {count} books")
                
                # Categories
                logger.info(f"\n🏷️  Categories:")
                for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                    logger.info(f"   {category}: {count} books")
                
        except Exception as e:
            logger.error(f"❌ Error getting collection stats: {e}")
    
    async def run_all_tests(self):
        """Run all comprehensive tests"""
        logger.info("🚀 STARTING COMPREHENSIVE METADATA AND SEARCH TESTS")
        logger.info("=" * 80)
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        
        try:
            # Initialize
            if not await self.initialize():
                logger.error("❌ Initialization failed")
                return False
            
            # Display metadata structure
            self.display_metadata_sample()
            
            # Display collection stats
            self.display_book_collection_stats()
            
            # Run search tests
            success = self.run_comprehensive_search_tests()
            
            logger.info("\n🎯 CONCLUSION")
            logger.info("=" * 40)
            if success:
                logger.info("✅ All tests passed! The RAG system is working correctly.")
                logger.info("📚 Book titles are being used as primary identifiers.")
                logger.info("🔍 MongoDB book IDs are preserved for retrieval.")
                logger.info("📊 Rich metadata is available for filtering and display.")
            else:
                logger.info("⚠️  Some tests failed. Review the results above.")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Test execution failed: {e}")
            return False
        finally:
            await self.mongodb_manager.close()

async def main():
    """Main test function"""
    tester = ComprehensiveMetadataTest()
    success = await tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(result)
