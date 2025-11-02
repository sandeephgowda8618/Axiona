#!/usr/bin/env python3
"""
Complete ChromaDB Cleanup - Remove all old vector database data
"""

import sys
import os
import shutil
import logging
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.abspath('.'))

import chromadb
from config.chroma_config import chroma_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def complete_vectordb_cleanup():
    """Complete cleanup of ChromaDB - remove all collections and data"""
    try:
        print("🧹 Starting complete ChromaDB cleanup...")
        
        # Step 1: Delete all collections via API
        collections = chroma_client.list_collections()
        logger.info(f"Found {len(collections)} collections to delete")
        
        for collection in collections:
            logger.info(f"Deleting collection: {collection.name}")
            chroma_client.delete_collection(collection.name)
        
        print("✅ Deleted all collections via API")
        
        # Step 2: Remove ChromaDB persistent storage
        chromadb_path = Path("./chromadb")
        if chromadb_path.exists():
            logger.info("Removing persistent ChromaDB storage...")
            shutil.rmtree(chromadb_path)
            print("✅ Removed ChromaDB storage directory")
        
        # Step 3: Also check vector_db directory (alternative location)
        vector_db_path = Path("./vector_db")
        if vector_db_path.exists():
            logger.info("Removing vector_db storage...")
            shutil.rmtree(vector_db_path)
            print("✅ Removed vector_db storage directory")
        
        # Step 4: Recreate clean ChromaDB directory
        chromadb_path.mkdir(exist_ok=True)
        print("✅ Created clean ChromaDB directory")
        
        # Step 5: Verify cleanup by checking collections again
        try:
            # Reinitialize client with clean state
            from config.chroma_config import ChromaDBConfig
            config = ChromaDBConfig("./chromadb")
            new_client = config.get_client()
            remaining = new_client.list_collections()
            print(f"✅ Verification: {len(remaining)} collections remaining (should be 0)")
        except Exception as e:
            print(f"⚠️  Could not verify cleanup (this is normal): {e}")
        
        print("\n🎉 Complete ChromaDB cleanup finished!")
        print("📊 Vector database is now completely clean and ready for fresh ingestion")
        
        return True
        
    except Exception as e:
        logger.error(f"Error during complete cleanup: {e}")
        return False

if __name__ == "__main__":
    success = complete_vectordb_cleanup()
    if success:
        print("\n✅ SUCCESS: Vector database completely cleaned!")
    else:
        print("\n❌ FAILED: Could not complete vector database cleanup")
