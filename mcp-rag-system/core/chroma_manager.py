#!/usr/bin/env python3
"""
ChromaDB Manager for RAG Vector Database Operations
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings
import logging

logger = logging.getLogger(__name__)

class ChromaManager:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or os.getenv('CHROMA_DB_PATH', './chromadb')
        self.client = None
        self.collections = {}
        
    async def initialize(self):
        """Initialize ChromaDB client and collections"""
        try:
            # Ensure directory exists
            Path(self.db_path).mkdir(parents=True, exist_ok=True)
            
            # Initialize ChromaDB client
            self.client = chromadb.PersistentClient(
                path=self.db_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collections
            self.collections['books'] = self.client.get_or_create_collection(
                name="books",
                metadata={"description": "Book content and metadata for RAG"}
            )
            
            self.collections['videos'] = self.client.get_or_create_collection(
                name="videos", 
                metadata={"description": "Video metadata for recommendations"}
            )
            
            logger.info(f"✅ ChromaDB initialized at {self.db_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize ChromaDB: {e}")
            return False
    
    async def add_documents(
        self, 
        collection_name: str,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> bool:
        """Add documents to a collection"""
        try:
            if collection_name not in self.collections:
                self.collections[collection_name] = self.client.get_or_create_collection(name=collection_name)
            
            collection = self.collections[collection_name]
            
            # Add documents in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i + batch_size]
                batch_meta = metadatas[i:i + batch_size]
                batch_ids = ids[i:i + batch_size]
                
                collection.add(
                    documents=batch_docs,
                    metadatas=batch_meta,
                    ids=batch_ids
                )
            
            logger.info(f"✅ Added {len(documents)} documents to {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error adding documents to {collection_name}: {e}")
            return False
    
    async def search_similar_documents(
        self,
        query: str,
        collection_name: str = 'books',
        n_results: int = 10,
        metadata_filter: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            if collection_name not in self.collections:
                logger.warning(f"Collection {collection_name} not found")
                return []
            
            collection = self.collections[collection_name]
            
            # Perform similarity search
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=metadata_filter
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        'document': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'distance': results['distances'][0][i] if results['distances'] else 0,
                        'id': results['ids'][0][i] if results['ids'] else ''
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Error searching in {collection_name}: {e}")
            return []
    
    async def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get statistics for a collection"""
        try:
            if collection_name not in self.collections:
                return {"error": f"Collection {collection_name} not found"}
            
            collection = self.collections[collection_name]
            count = collection.count()
            
            return {
                "name": collection_name,
                "document_count": count,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting stats for {collection_name}: {e}")
            return {"error": str(e)}
    
    async def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection"""
        try:
            if self.client:
                self.client.delete_collection(name=collection_name)
                if collection_name in self.collections:
                    del self.collections[collection_name]
                logger.info(f"✅ Deleted collection: {collection_name}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"❌ Error deleting collection {collection_name}: {e}")
            return False
    
    async def reset_database(self) -> bool:
        """Reset the entire database"""
        try:
            if self.client:
                self.client.reset()
                self.collections = {}
                logger.info("✅ ChromaDB reset complete")
                return True
            return False
            
        except Exception as e:
            logger.error(f"❌ Error resetting database: {e}")
            return False
    
    def close(self):
        """Close the client connection"""
        try:
            self.client = None
            self.collections = {}
            logger.info("✅ ChromaDB connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing ChromaDB: {e}")
