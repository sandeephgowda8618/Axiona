"""
MongoDB Manager for RAG System
Handles direct database connections and queries for StudyPES materials
"""

import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from config.settings import config

logger = logging.getLogger(__name__)

class MongoDBManager:
    """MongoDB connection and query manager for RAG system"""
    
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.collection = None
        self.uri = config.MONGODB_URI
        self.database_name = config.MONGODB_DATABASE
        self.collection_name = config.MONGODB_COLLECTION
        
    async def connect(self) -> bool:
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.uri)
            self.db = self.client[self.database_name]
            self.collection = self.db[self.collection_name]
            
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {self.database_name}")
            return True
            
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def get_all_books(self) -> List[Dict[str, Any]]:
        """Get all books from MongoDB"""
        try:
            if not self.collection:
                raise Exception("Not connected to MongoDB")
                
            books = list(self.collection.find({}))
            logger.info(f"Retrieved {len(books)} books from MongoDB")
            return books
            
        except Exception as e:
            logger.error(f"Error retrieving books from MongoDB: {e}")
            return []
    
    async def get_studypes_subjects_and_units(self) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
        """Get all StudyPES materials organized by subject and unit"""
        try:
            if not self.collection:
                raise Exception("Not connected to MongoDB")
            
            # Query for StudyPES materials
            studypes_filter = {
                "$or": [
                    {"source": {"$regex": "StudyPES", "$options": "i"}},
                    {"category": {"$regex": "StudyPES", "$options": "i"}},
                    {"type": {"$regex": "StudyPES", "$options": "i"}},
                    {"title": {"$regex": "StudyPES", "$options": "i"}}
                ]
            }
            
            books = list(self.collection.find(studypes_filter))
            logger.info(f"Found {len(books)} StudyPES materials in MongoDB")
            
            # Organize by subject and unit
            subjects_data = {}
            
            for book in books:
                # Extract subject and unit from the book data
                subject = self._extract_subject(book)
                unit = self._extract_unit(book)
                
                if subject not in subjects_data:
                    subjects_data[subject] = {}
                
                if unit not in subjects_data[subject]:
                    subjects_data[subject][unit] = []
                
                # Add book info to the unit
                material_info = {
                    "id": str(book.get("_id", "")),
                    "title": book.get("title", "Untitled"),
                    "description": book.get("description", ""),
                    "url": book.get("url", ""),
                    "pdfUrl": book.get("pdfUrl", book.get("url", "")),
                    "fileSize": book.get("fileSize", "N/A"),
                    "pages": book.get("pages", 0),
                    "author": book.get("author", "Unknown"),
                    "semester": book.get("semester", 0),
                    "year": book.get("year", ""),
                    "type": book.get("type", "PDF"),
                    "difficulty": book.get("difficulty", "Medium")
                }
                
                subjects_data[subject][unit].append(material_info)
            
            # Sort subjects and units
            for subject in subjects_data:
                for unit in subjects_data[subject]:
                    subjects_data[subject][unit].sort(key=lambda x: x["title"])
            
            logger.info(f"Organized into {len(subjects_data)} subjects")
            return subjects_data
            
        except Exception as e:
            logger.error(f"Error organizing StudyPES materials: {e}")
            return {}
    
    def _extract_subject(self, book: Dict[str, Any]) -> str:
        """Extract subject from book metadata"""
        # Try different fields that might contain subject info
        subject_fields = ["subject", "category", "course", "domain"]
        
        for field in subject_fields:
            if field in book and book[field]:
                return str(book[field]).strip()
        
        # Try to extract from title or description
        title = book.get("title", "").lower()
        description = book.get("description", "").lower()
        
        # Common subject patterns
        subject_patterns = {
            "data structures": "Data Structures & Algorithms",
            "algorithms": "Data Structures & Algorithms", 
            "database": "Database Management Systems",
            "networks": "Computer Networks",
            "operating system": "Operating Systems",
            "software engineering": "Software Engineering",
            "machine learning": "Machine Learning",
            "web technology": "Web Technology",
            "mathematics": "Mathematics",
            "physics": "Physics",
            "chemistry": "Chemistry",
            "electronics": "Electronics",
            "mechanical": "Mechanical Engineering"
        }
        
        for pattern, subject in subject_patterns.items():
            if pattern in title or pattern in description:
                return subject
        
        return "General"
    
    def _extract_unit(self, book: Dict[str, Any]) -> str:
        """Extract unit from book metadata"""
        # Try different fields that might contain unit info
        unit_fields = ["unit", "chapter", "module", "section"]
        
        for field in unit_fields:
            if field in book and book[field]:
                return f"Unit {str(book[field]).strip()}"
        
        # Try to extract from title
        title = book.get("title", "")
        
        # Look for unit patterns in title
        import re
        unit_patterns = [
            r"unit\s*(\d+)",
            r"chapter\s*(\d+)",
            r"module\s*(\d+)",
            r"part\s*(\d+)"
        ]
        
        for pattern in unit_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                return f"Unit {match.group(1)}"
        
        # Default unit based on semester or other criteria
        semester = book.get("semester", 0)
        if semester:
            return f"Semester {semester}"
        
        return "General Materials"
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get basic statistics about the MongoDB collection"""
        try:
            if not self.collection:
                raise Exception("Not connected to MongoDB")
                
            total_count = self.collection.count_documents({})
            studypes_count = self.collection.count_documents({
                "$or": [
                    {"source": {"$regex": "StudyPES", "$options": "i"}},
                    {"category": {"$regex": "StudyPES", "$options": "i"}},
                    {"type": {"$regex": "StudyPES", "$options": "i"}}
                ]
            })
            
            return {
                "total_documents": total_count,
                "studypes_materials": studypes_count,
                "connection_status": "connected",
                "database": self.database_name,
                "collection": self.collection_name
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {
                "total_documents": 0,
                "studypes_materials": 0,
                "connection_status": "error",
                "error": str(e)
            }

# Singleton instance
_mongo_manager: Optional[MongoDBManager] = None

async def get_mongo_manager() -> MongoDBManager:
    """Get or create MongoDB manager instance"""
    global _mongo_manager
    
    if _mongo_manager is None:
        _mongo_manager = MongoDBManager()
        await _mongo_manager.connect()
    
    return _mongo_manager
