#!/usr/bin/env python3
"""
Simple PDF Search Test Script
============================

A working test script for PDF search functionality using the actual
MongoDB and ChromaDB interfaces.

Usage:
    python test/simple_test.py
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Any

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.mongodb_manager import MongoDBManager
from core.chroma_manager import ChromaManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimplePDFSearchTester:
    def __init__(self):
        self.mongodb_manager = MongoDBManager()
        self.chroma_manager = ChromaManager(os.getenv("CHROMA_DB_PATH", "./chromadb"))
        
    async def test_search_functionality(self):
        """Test basic search functionality"""
        logger.info("🚀 Starting Simple PDF Search Test")
        
        try:
            # Initialize MongoDB
            await self.mongodb_manager.initialize()
            books = await self.mongodb_manager.get_all_books()
            logger.info(f"📚 MongoDB has {len(books)} books")
            
            # Initialize ChromaDB
            await self.chroma_manager.initialize()
            
            # Get book collection
            if 'books' not in self.chroma_manager.collections:
                logger.error("❌ No 'books' collection found in ChromaDB")
                return False
                
            collection = self.chroma_manager.collections['books']
            doc_count = collection.count()
            logger.info(f"🔍 ChromaDB has {doc_count} documents")
            
            if doc_count == 0:
                logger.warning("⚠️ No documents in ChromaDB. Run ingestion first!")
                return False
            
            # Test queries
            test_queries = [
                "Python programming tutorial",
                "machine learning algorithms", 
                "data structures and algorithms",
                "operating systems concepts",
                "database management SQL"
            ]
            
            success_count = 0
            
            for i, query in enumerate(test_queries, 1):
                logger.info(f"\n--- Test {i}: '{query}' ---")
                
                try:
                    # Search using ChromaDB directly
                    results = collection.query(
                        query_texts=[query],
                        n_results=3
                    )
                    
                    if results and results.get('metadatas') and results['metadatas'][0]:
                        logger.info(f"✅ Found {len(results['metadatas'][0])} results:")
                        
                        for j, metadata in enumerate(results['metadatas'][0], 1):
                            file_name = metadata.get('file_name', 'Unknown')
                            title = metadata.get('title', 'Unknown')
                            logger.info(f"  {j}. {file_name} - {title}")
                        
                        success_count += 1
                    else:
                        logger.warning(f"❌ No results for: {query}")
                        
                except Exception as e:
                    logger.error(f"❌ Search failed for '{query}': {e}")
            
            # Summary
            logger.info(f"\n📊 RESULTS SUMMARY:")
            logger.info(f"Total tests: {len(test_queries)}")
            logger.info(f"Successful searches: {success_count}")
            logger.info(f"Success rate: {(success_count/len(test_queries)*100):.1f}%")
            
            return success_count >= len(test_queries) * 0.7  # 70% success rate
            
        except Exception as e:
            logger.error(f"❌ Test failed: {e}")
            return False
        finally:
            await self.mongodb_manager.close()

async def main():
    """Main test function"""
    tester = SimplePDFSearchTester()
    success = await tester.test_search_functionality()
    
    if success:
        logger.info("🎉 Test completed successfully!")
        return 0
    else:
        logger.error("❌ Test failed!")
        return 1

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(result)
