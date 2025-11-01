#!/usr/bin/env python3
"""
Quick PDF Search Test
====================

A simple script to quickly test if PDF search is working correctly.
Runs a few basic queries and shows results.

Usage:
    python test/quick_search_test.py
"""

import os
import sys
import logging
import asyncio

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.chroma_manager import ChromaManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def quick_test():
    """Run quick search tests"""
    logger.info("Starting quick PDF search test...")
    
    try:
        # Initialize ChromaDB
        chroma_manager = ChromaManager(os.getenv("CHROMA_DB_PATH", "./chromadb"))
        await chroma_manager.initialize()
        
        # Check collection status
        if 'books' not in chroma_manager.collections:
            logger.error("No 'books' collection found in ChromaDB")
            return False
            
        collection = chroma_manager.collections['books']
        doc_count = collection.count()
        logger.info(f"ChromaDB collection has {doc_count} documents")
        
        if doc_count == 0:
            logger.error("No documents found in ChromaDB. Please run ingestion first.")
            return False
        
        # Test queries
        test_queries = [
            "Python programming",
            "machine learning algorithms", 
            "data structures",
            "operating systems",
            "database management"
        ]
        
        for i, query in enumerate(test_queries, 1):
            logger.info(f"\n--- Test {i}: {query} ---")
            
            try:
                results = collection.query(
                    query_texts=[query],
                    n_results=3
                )
                
                if results and results.get('metadatas') and results['metadatas'][0]:
                    logger.info(f"Found {len(results['metadatas'][0])} results:")
                    
                    for j, metadata in enumerate(results['metadatas'][0], 1):
                        logger.info(f"  {j}. Metadata: {metadata}")
                else:
                    logger.warning(f"No results found for query: {query}")
                    
            except Exception as e:
                logger.error(f"Error searching for '{query}': {e}")
        
        logger.info("\n✅ Quick test completed!")
        return True
        
    except Exception as e:
        logger.error(f"Quick test failed: {e}")
        return False

async def main():
    success = await quick_test()
    return 0 if success else 1

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(result)
