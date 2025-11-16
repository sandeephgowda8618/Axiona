"""
Database Manager for MongoDB Operations
======================================

Provides unified interface for MongoDB, GridFS, and ChromaDB operations
for the multi-agent educational roadmap system.
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
import gridfs
from config.settings import Settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Unified database manager for MongoDB and GridFS operations"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.fs = None
        self._collections = {}
        
    async def connect(self) -> bool:
        """Initialize database connections"""
        try:
            # Connect to MongoDB
            self.client = MongoClient(Settings.MONGODB_URI)
            self.db = self.client[Settings.MONGODB_DATABASE]
            self.fs = gridfs.GridFS(self.db)
            
            # Test connection
            await asyncio.to_thread(self.client.admin.command, 'ismaster')
            
            # Initialize collections
            self._collections = {
                'reference_books': self.db.reference_books,
                'pes_materials': self.db.pes_materials,
                'video_urls': self.db.video_urls,
                'users': self.db.users,
                'roadmaps': self.db.roadmaps
            }
            
            logger.info("✅ Database connection established successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False
    
    def get_collection(self, collection_name: str) -> Collection:
        """Get MongoDB collection by name"""
        if collection_name not in self._collections:
            raise ValueError(f"Collection '{collection_name}' not found")
        return self._collections[collection_name]
    
    async def find_documents(
        self, 
        collection_name: str, 
        filter_query: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        sort: Optional[List] = None
    ) -> List[Dict[str, Any]]:
        """Find documents in a collection"""
        try:
            collection = self.get_collection(collection_name)
            filter_query = filter_query or {}
            
            cursor = collection.find(filter_query)
            
            if sort:
                cursor = cursor.sort(sort)
            if limit:
                cursor = cursor.limit(limit)
                
            documents = await asyncio.to_thread(list, cursor)
            
            # Convert ObjectId to string for JSON serialization
            for doc in documents:
                if '_id' in doc:
                    doc['id'] = str(doc['_id'])
                    
            logger.debug(f"Found {len(documents)} documents in {collection_name}")
            return documents
            
        except Exception as e:
            logger.error(f"Error finding documents in {collection_name}: {e}")
            return []
    
    async def find_pes_materials(
        self, 
        subject: str, 
        unit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Find PES materials with subject and optional unit filtering"""
        try:
            filter_query: Dict[str, Any] = {"subject": {"$regex": f"^{subject}$", "$options": "i"}}
            
            if unit is not None:
                # Handle both string and integer unit values
                filter_query["unit"] = {"$in": [unit, str(unit)]}
            
            documents = await self.find_documents("pes_materials", filter_query)
            
            # Add standardized metadata
            for doc in documents:
                doc["content_type"] = "pes_material"
                doc["source"] = "PES_slides"
                if "relevance_score" not in doc:
                    doc["relevance_score"] = 0.9  # Default high relevance
                if "semantic_score" not in doc:
                    doc["semantic_score"] = 0.85
                if "snippet" not in doc:
                    doc["snippet"] = doc.get("summary", "")[:200] + "..."
                    
            logger.info(f"Retrieved {len(documents)} PES materials for {subject}, unit {unit}")
            return documents
            
        except Exception as e:
            logger.error(f"Error retrieving PES materials: {e}")
            return []
    
    async def find_reference_books(
        self, 
        subject: Optional[str] = None, 
        difficulty: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Find reference books with optional filtering"""
        try:
            filter_query: Dict[str, Any] = {}
            
            if subject:
                # Match subject in title, summary, or key_concepts
                filter_query["$or"] = [
                    {"title": {"$regex": subject, "$options": "i"}},
                    {"summary": {"$regex": subject, "$options": "i"}},
                    {"key_concepts": {"$regex": subject, "$options": "i"}}
                ]
            
            if difficulty:
                filter_query["difficulty"] = {"$regex": f"^{difficulty}$", "$options": "i"}
            
            documents = await self.find_documents("reference_books", filter_query, limit=1)
            
            # Add standardized metadata
            for doc in documents:
                doc["content_type"] = "reference_book"
                doc["source"] = "reference_books"
                if "relevance_score" not in doc:
                    doc["relevance_score"] = 0.88
                if "semantic_score" not in doc:
                    doc["semantic_score"] = 0.85
                if "snippet" not in doc:
                    doc["snippet"] = doc.get("summary", "")[:200] + "..."
                    
            logger.info(f"Retrieved {len(documents)} reference books for {subject}, difficulty {difficulty}")
            return documents
            
        except Exception as e:
            logger.error(f"Error retrieving reference books: {e}")
            return []
    
    async def save_roadmap(self, roadmap_data: Dict[str, Any]) -> str:
        """Save a generated roadmap to the database"""
        try:
            collection = self.get_collection("roadmaps")
            
            # Add metadata
            roadmap_data["created_at"] = datetime.now().isoformat()
            roadmap_data["last_updated"] = datetime.now().isoformat()
            
            result = await asyncio.to_thread(collection.insert_one, roadmap_data)
            roadmap_id = str(result.inserted_id)
            
            logger.info(f"Roadmap saved with ID: {roadmap_id}")
            return roadmap_id
            
        except Exception as e:
            logger.error(f"Error saving roadmap: {e}")
            raise
    
    async def get_roadmap(self, roadmap_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a roadmap by ID"""
        try:
            from bson import ObjectId
            collection = self.get_collection("roadmaps")
            
            roadmap = await asyncio.to_thread(
                collection.find_one, 
                {"_id": ObjectId(roadmap_id)}
            )
            
            if roadmap:
                roadmap["id"] = str(roadmap["_id"])
                
            return roadmap
            
        except Exception as e:
            logger.error(f"Error retrieving roadmap {roadmap_id}: {e}")
            return None
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform database health check"""
        try:
            # Check MongoDB connection
            if self.client:
                await asyncio.to_thread(self.client.admin.command, 'ping')
            
            # Count documents in collections
            collection_counts = {}
            for name, collection in self._collections.items():
                count = await asyncio.to_thread(collection.count_documents, {})
                collection_counts[name] = count
            
            return {
                "status": "healthy",
                "mongodb_connected": True,
                "gridfs_available": bool(self.fs),
                "collections": collection_counts,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def close(self):
        """Close database connections"""
        if self.client:
            self.client.close()
            logger.info("Database connections closed")

# Global database manager instance
db_manager = DatabaseManager()
