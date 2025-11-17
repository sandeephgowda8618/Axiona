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
import fitz  # PyMuPDF for PDF text extraction
import io
from bson import ObjectId
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
    
    async def extract_pdf_content(self, file_id: str) -> str:
        """Extract text content from a PDF file stored in GridFS"""
        try:
            # Find the PDF file in GridFS
            file_doc = await asyncio.to_thread(
                self.fs.find_one, 
                {"_id": ObjectId(file_id)}
            )
            
            if not file_doc:
                raise ValueError(f"File with ID {file_id} not found in GridFS")
            
            # Read the PDF file content
            pdf_data = await asyncio.to_thread(self.fs.download, file_doc._id)
            
            # Extract text from PDF using PyMuPDF
            pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
            text_content = ""
            for page in pdf_document:
                text_content += page.get_text()
            
            pdf_document.close()
            
            logger.info(f"Extracted content from PDF file ID: {file_id}")
            return text_content.strip()
            
        except Exception as e:
            logger.error(f"Error extracting PDF content from file ID {file_id}: {e}")
            return ""
    
    async def get_pdf_content_by_gridfs_id(self, gridfs_id: str, start_page: int = 1, num_pages: int = 5) -> Dict[str, Any]:
        """
        Extract text content from PDF stored in GridFS
        
        Args:
            gridfs_id: GridFS ID of the PDF file
            start_page: Starting page number (1-indexed)
            num_pages: Number of pages to extract (default: 5 for context)
            
        Returns:
            Dictionary with extracted text content and metadata
        """
        try:
            if not self.fs:
                raise Exception("GridFS not initialized")
            
            # Convert string ID to ObjectId if needed
            object_id = ObjectId(gridfs_id) if isinstance(gridfs_id, str) else gridfs_id
            
            # Find the file in GridFS
            file_doc = await asyncio.to_thread(
                self.fs.find_one,
                {"_id": object_id}
            )
            
            if not file_doc:
                logger.warning(f"PDF file with GridFS ID {gridfs_id} not found")
                return {"text": "", "pages": 0, "error": "File not found"}
            
            # Download the PDF data
            pdf_data = await asyncio.to_thread(self.fs.get, file_doc._id)
            pdf_bytes = pdf_data.read()
            
            # Extract text using PyMuPDF
            pdf_stream = io.BytesIO(pdf_bytes)
            pdf_document = fitz.open("pdf", pdf_stream)
            
            total_pages = pdf_document.page_count
            text_content = ""
            
            # Calculate actual page range
            end_page = min(start_page + num_pages - 1, total_pages)
            pages_extracted = []
            
            for page_num in range(start_page - 1, end_page):  # Convert to 0-indexed
                page = pdf_document.load_page(page_num)
                page_text = page.get_text()
                text_content += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
                pages_extracted.append(page_num + 1)
            
            pdf_document.close()
            
            logger.info(f"Extracted text from PDF {gridfs_id}, pages {pages_extracted}")
            
            return {
                "text": text_content.strip(),
                "total_pages": total_pages,
                "pages_extracted": pages_extracted,
                "start_page": start_page,
                "file_id": str(gridfs_id),
                "filename": file_doc.filename if hasattr(file_doc, 'filename') else 'unknown.pdf'
            }
            
        except Exception as e:
            logger.error(f"Error extracting PDF content from GridFS {gridfs_id}: {e}")
            return {
                "text": "",
                "total_pages": 0,
                "pages_extracted": [],
                "error": str(e)
            }

    async def find_pdf_by_context(self, context: str, subject: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Find PDF in database based on context (filename, title, etc.)
        
        Args:
            context: Context string (could be filename, title, URL)
            subject: Optional subject filter
            
        Returns:
            Dictionary with PDF metadata and GridFS ID
        """
        try:
            # Search in PES materials first
            query = {}
            if subject:
                query["subject"] = {"$regex": subject, "$options": "i"}
                
            # Search by various fields
            context_query = {
                "$or": [
                    {"title": {"$regex": context, "$options": "i"}},
                    {"pdf_path": {"$regex": context, "$options": "i"}},
                    {"file_url": {"$regex": context, "$options": "i"}},
                    {"filename": {"$regex": context, "$options": "i"}}
                ]
            }
            
            if query:
                query.update(context_query)
            else:
                query = context_query
                
            # Search PES materials
            pes_material = await asyncio.to_thread(
                self._collections['pes_materials'].find_one, 
                query
            )
            
            if pes_material and pes_material.get('gridfs_id'):
                return {
                    "gridfs_id": str(pes_material['gridfs_id']),
                    "title": pes_material.get('title', 'Unknown'),
                    "subject": pes_material.get('subject', 'Unknown'),
                    "type": "pes_material",
                    "unit": pes_material.get('unit'),
                    "file_url": pes_material.get('file_url', '')
                }
            
            # Search reference books
            book = await asyncio.to_thread(
                self._collections['reference_books'].find_one,
                context_query
            )
            
            if book and book.get('gridfs_id'):
                return {
                    "gridfs_id": str(book['gridfs_id']),
                    "title": book.get('title', 'Unknown'),
                    "subject": book.get('subject', 'Unknown'),
                    "type": "reference_book",
                    "author": book.get('author'),
                    "difficulty": book.get('difficulty')
                }
                
            logger.warning(f"No PDF found for context: {context}")
            return None
            
        except Exception as e:
            logger.error(f"Error finding PDF by context {context}: {e}")
            return None

# Global database manager instance
db_manager = DatabaseManager()
