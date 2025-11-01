#!/usr/bin/env python3
"""
Metadata Inspector for ChromaDB
===============================

This script inspects the actual metadata structure stored in ChromaDB
to see what fields are available and how they're structured.
"""

import os
import sys
import logging
import json
from typing import Dict, Any

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.chroma_manager import ChromaManager

logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def inspect_metadata():
    """Inspect the metadata structure in ChromaDB"""
    logger.info("🔍 Inspecting ChromaDB Metadata Structure...")
    
    try:
        # Initialize ChromaDB
        chroma_manager = ChromaManager(os.getenv("CHROMA_DB_PATH", "./chromadb"))
        await chroma_manager.initialize()
        
        if 'books' not in chroma_manager.collections:
            logger.error("❌ No 'books' collection found")
            return
        
        collection = chroma_manager.collections['books']
        total_docs = collection.count()
        logger.info(f"📚 Total documents in collection: {total_docs}")
        
        # Get a few sample documents with all their metadata
        results = collection.get(
            limit=5,
            include=['documents', 'metadatas']
        )
        
        logger.info(f"\n📋 SAMPLE METADATA INSPECTION (First 5 documents):")
        logger.info("=" * 80)
        
        for i, metadata in enumerate(results['metadatas'], 1):
            logger.info(f"\n🔍 Document {i}:")
            logger.info("-" * 50)
            
            # Print all metadata fields
            for key, value in metadata.items():
                logger.info(f"  {key}: {value}")
            
            # Show a snippet of the document content
            if results['documents'] and len(results['documents']) > i-1:
                content_preview = results['documents'][i-1][:200] + "..."
                logger.info(f"  content_preview: {content_preview}")
            
            logger.info("-" * 50)
        
        # Analyze metadata fields across all documents
        logger.info(f"\n📊 METADATA FIELD ANALYSIS:")
        logger.info("=" * 80)
        
        # Get all documents to analyze field consistency
        all_results = collection.get(include=['metadatas'])
        field_stats = {}
        
        for metadata in all_results['metadatas']:
            for field in metadata.keys():
                if field not in field_stats:
                    field_stats[field] = {
                        'count': 0,
                        'sample_values': set()
                    }
                field_stats[field]['count'] += 1
                # Add sample values (limit to avoid memory issues)
                if len(field_stats[field]['sample_values']) < 5:
                    field_stats[field]['sample_values'].add(str(metadata[field])[:50])
        
        logger.info(f"Total documents analyzed: {len(all_results['metadatas'])}")
        logger.info("\nField Statistics:")
        
        for field, stats in sorted(field_stats.items()):
            coverage = (stats['count'] / len(all_results['metadatas'])) * 100
            sample_vals = list(stats['sample_values'])[:3]
            logger.info(f"  {field}: {stats['count']}/{len(all_results['metadatas'])} docs ({coverage:.1f}%)")
            logger.info(f"    Sample values: {sample_vals}")
        
        # Test search with metadata inspection
        logger.info(f"\n🔍 SEARCH RESULTS WITH FULL METADATA:")
        logger.info("=" * 80)
        
        test_queries = ["Python programming", "machine learning", "operating systems"]
        
        for query in test_queries:
            logger.info(f"\nQuery: '{query}'")
            search_results = collection.query(
                query_texts=[query],
                n_results=2,
                include=['documents', 'metadatas', 'distances']
            )
            
            if search_results['metadatas'] and search_results['metadatas'][0]:
                for j, metadata in enumerate(search_results['metadatas'][0], 1):
                    distance = search_results['distances'][0][j-1] if search_results['distances'] else 'N/A'
                    logger.info(f"  Result {j} (distance: {distance}):")
                    
                    # Show key metadata fields
                    key_fields = ['title', 'author', 'subject', 'file_name', 'fileName', 'category', 'book_id']
                    for field in key_fields:
                        if field in metadata:
                            logger.info(f"    {field}: {metadata[field]}")
                    
                    # Show any other interesting fields
                    other_fields = [k for k in metadata.keys() if k not in key_fields]
                    if other_fields:
                        logger.info(f"    other_fields: {other_fields}")
                    logger.info("")
            else:
                logger.info("  No results found")
        
        logger.info("\n✅ Metadata inspection completed!")
        
    except Exception as e:
        logger.error(f"❌ Inspection failed: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(inspect_metadata())
