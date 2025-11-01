# MongoDB Integration for RAG System
import os
import logging
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from datetime import datetime

logger = logging.getLogger(__name__)

class MongoDBManager:
    """Manages MongoDB connections and book metadata operations"""
    
    def __init__(self, connection_string: Optional[str] = None):
        self.connection_string = connection_string or os.getenv(
            "MONGODB_URI", 
            "mongodb://localhost:27017/study-ai"
        )
        self.database_name = "study-ai"
        self.books_collection = "books"
        
        # Initialize clients
        self.async_client = None
        self.sync_client = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB"""
        return await self.initialize()
        
    async def disconnect(self):
        """Disconnect from MongoDB"""
        await self.close()
        
    async def initialize(self):
        """Initialize MongoDB connections"""
        try:
            # Async client for FastAPI
            self.async_client = AsyncIOMotorClient(self.connection_string)
            self.db = self.async_client[self.database_name]
            
            # Test connection
            await self.async_client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {self.database_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    async def get_all_books(self) -> List[Dict[str, Any]]:
        """Get all books from MongoDB"""
        try:
            books_collection = self.db[self.books_collection]
            books = []
            
            async for book in books_collection.find({}):
                # Convert MongoDB ObjectId to string
                book['_id'] = str(book['_id'])
                books.append(book)
            
            logger.info(f"Retrieved {len(books)} books from MongoDB")
            return books
            
        except Exception as e:
            logger.error(f"Error retrieving books: {e}")
            return []
    
    async def get_books_by_subject(self, subject: str) -> List[Dict[str, Any]]:
        """Get books filtered by subject"""
        try:
            books_collection = self.db[self.books_collection]
            books = []
            
            # Case-insensitive search
            query = {"subject": {"$regex": subject, "$options": "i"}}
            
            async for book in books_collection.find(query):
                book['_id'] = str(book['_id'])
                books.append(book)
            
            logger.info(f"Retrieved {len(books)} books for subject: {subject}")
            return books
            
        except Exception as e:
            logger.error(f"Error retrieving books by subject: {e}")
            return []
    
    async def get_books_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """Get books filtered by difficulty level"""
        try:
            books_collection = self.db[self.books_collection]
            books = []
            
            query = {"difficulty": {"$regex": difficulty, "$options": "i"}}
            
            async for book in books_collection.find(query):
                book['_id'] = str(book['_id'])
                books.append(book)
            
            logger.info(f"Retrieved {len(books)} books for difficulty: {difficulty}")
            return books
            
        except Exception as e:
            logger.error(f"Error retrieving books by difficulty: {e}")
            return []
    
    async def search_books(self, query: str) -> List[Dict[str, Any]]:
        """Search books by title, author, or description"""
        try:
            books_collection = self.db[self.books_collection]
            books = []
            
            # Text search across multiple fields
            search_query = {
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"author": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"subject": {"$regex": query, "$options": "i"}},
                    {"tags": {"$in": [query]}}
                ]
            }
            
            async for book in books_collection.find(search_query):
                book['_id'] = str(book['_id'])
                books.append(book)
            
            logger.info(f"Found {len(books)} books matching query: {query}")
            return books
            
        except Exception as e:
            logger.error(f"Error searching books: {e}")
            return []
    
    async def get_book_by_id(self, book_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific book by ID"""
        try:
            from bson import ObjectId
            books_collection = self.db[self.books_collection]
            
            book = await books_collection.find_one({"_id": ObjectId(book_id)})
            
            if book:
                book['_id'] = str(book['_id'])
                return book
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving book by ID: {e}")
            return None
    
    def prepare_book_for_embedding(self, book: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare book metadata for vector embedding"""
        
        # Create a searchable text content from book metadata
        content_parts = []
        
        if book.get('title'):
            content_parts.append(f"Title: {book['title']}")
        
        if book.get('author'):
            content_parts.append(f"Author: {book['author']}")
        
        if book.get('description'):
            content_parts.append(f"Description: {book['description']}")
        
        if book.get('subject'):
            content_parts.append(f"Subject: {book['subject']}")
        
        if book.get('tags'):
            content_parts.append(f"Tags: {', '.join(book['tags'])}")
        
        if book.get('key_concepts'):
            content_parts.append(f"Key Concepts: {', '.join(book['key_concepts'])}")
        
        # Create the document for ChromaDB
        document = {
            "id": f"book_{book['_id']}",
            "text": " | ".join(content_parts),
            "metadata": {
                "book_id": book['_id'],
                "title": book.get('title', ''),
                "author": book.get('author', ''),
                "subject": book.get('subject', ''),
                "difficulty": book.get('difficulty', ''),
                "isbn": book.get('isbn', ''),
                "publication_year": book.get('publication_year'),
                "pages": book.get('pages'),
                "rating": book.get('rating'),
                "file_path": book.get('file_path', ''),
                "download_url": book.get('download_url', ''),
                "type": "reference_book",
                "source": "mongodb",
                "tags": ', '.join(book.get('tags', [])) if book.get('tags') else '',
                "key_concepts": ', '.join(book.get('key_concepts', [])) if book.get('key_concepts') else '',
                "prerequisites": ', '.join(book.get('prerequisites', [])) if book.get('prerequisites') else '',
                "target_audience": book.get('target_audience', ''),
                "language": book.get('language', 'en'),
                "format": book.get('format', 'pdf'),
                "added_to_rag": datetime.utcnow().isoformat()
            }
        }
        
        return document
    
    async def get_books_with_urls(self) -> List[Dict[str, Any]]:
        """Get all books that have GitHub URLs (the 97 PDFs we added)"""
        try:
            books_collection = self.db[self.books_collection]
            books = []
            
            # Find books with GitHub URLs
            query = {
                "file_url": {
                    "$regex": "github.com",
                    "$options": "i"
                }
            }
            
            async for book in books_collection.find(query):
                book['_id'] = str(book['_id'])
                books.append(book)
            
            logger.info(f"Retrieved {len(books)} books with GitHub URLs")
            return books
            
        except Exception as e:
            logger.error(f"Error retrieving books with URLs: {e}")
            return []
    
    async def close(self):
        """Close MongoDB connections"""
        if self.async_client:
            self.async_client.close()
            logger.info("MongoDB connections closed")

# Global MongoDB manager instance
mongo_manager = None

async def get_mongo_manager() -> MongoDBManager:
    """Get or create MongoDB manager instance"""
    global mongo_manager
    
    if mongo_manager is None:
        mongo_manager = MongoDBManager()
        await mongo_manager.initialize()
    
    return mongo_manager
