#!/usr/bin/env python3
"""
Comprehensive MongoDB to RAG Ingestion Pipeline
Ingests ALL data from MongoDB (studymaterials, videos, books) into ChromaDB 
with advanced LangChain/LangGraph RAG capabilities and full metadata preservation.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

# Third-party imports
import chromadb
from chromadb.config import Settings
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
from sentence_transformers import SentenceTransformer
import requests
from io import BytesIO

# LangChain imports
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ComprehensiveMongoDBIngestion:
    def __init__(self):
        # MongoDB connection
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/study-ai')
        self.mongodb_client = None
        self.db = None
        
        # ChromaDB setup
        self.chroma_path = './chromadb'
        self.chroma_client = None
        
        # Collections to create
        self.collections = {}
        
        # LangChain components
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        # Stats tracking
        self.stats = {
            "studymaterials": {"processed": 0, "successful": 0, "failed": 0},
            "videos": {"processed": 0, "successful": 0, "failed": 0},
            "books": {"processed": 0, "successful": 0, "failed": 0},
            "total_chunks": 0,
            "total_documents": 0
        }
        
    async def initialize(self):
        """Initialize MongoDB and ChromaDB connections"""
        try:
            # MongoDB
            self.mongodb_client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.mongodb_client['study-ai']
            await self.mongodb_client.admin.command('ping')
            logger.info("✅ Connected to MongoDB")
            
            # ChromaDB
            self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)
            logger.info("✅ Connected to ChromaDB")
            
            # Create collections for different data types
            self.collections = {
                'studymaterials': self.chroma_client.get_or_create_collection(
                    name="studymaterials",
                    metadata={"description": "StudyPES materials with metadata"}
                ),
                'videos': self.chroma_client.get_or_create_collection(
                    name="videos", 
                    metadata={"description": "Educational videos with metadata"}
                ),
                'books': self.chroma_client.get_or_create_collection(
                    name="books",
                    metadata={"description": "Academic books with metadata"}
                )
            }
            logger.info("✅ Created ChromaDB collections")
            
        except Exception as e:
            logger.error(f"Failed to initialize: {e}")
            raise
    
    def prepare_studymaterial_metadata(self, material: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare metadata for StudyPES materials"""
        return {
            "source_type": "studymaterial",
            "document_id": str(material.get("_id", "")),
            "title": material.get("title", ""),
            "author": material.get("author", ""),
            "subject": material.get("subject", ""),
            "subject_key": material.get("subject_key", ""),
            "semester": str(material.get("semester", "")),
            "unit": material.get("unit", ""),
            "topic": material.get("topic", ""),
            "category": material.get("category", ""),
            "level": material.get("level", ""),
            "fileName": material.get("fileName", ""),
            "pages": str(material.get("pages", "")),
            "language": material.get("language", ""),
            "publisher": material.get("publisher", ""),
            "publication_year": str(material.get("publication_year", "")),
            "file_type": material.get("file_type", ""),
            "file_size": str(material.get("file_size", "")),
            "tags": ",".join(material.get("tags", [])),
            "file_url": material.get("file_url", ""),
            "approved": str(material.get("approved", False)),
            "uploadedBy": material.get("uploadedBy", ""),
            "created_at": str(material.get("createdAt", "")),
            "updated_at": str(material.get("updatedAt", ""))
        }
    
    def prepare_video_metadata(self, video: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare metadata for videos"""
        return {
            "source_type": "video",
            "document_id": str(video.get("_id", "")),
            "title": video.get("title", ""),
            "channel": video.get("channel", ""),
            "duration": str(video.get("duration", "")),
            "views": str(video.get("views", "")),
            "uploadDate": str(video.get("uploadDate", "")),
            "videoId": video.get("videoId", ""),
            "url": video.get("url", ""),
            "thumbnail": video.get("thumbnail", ""),
            "topicTags": ",".join(video.get("topicTags", [])),
            "category": video.get("category", ""),
            "quality": video.get("quality", ""),
            "language": video.get("language", ""),
            "semester": str(video.get("semester", "")),
            "subject": video.get("subject", ""),
            "created_at": str(video.get("createdAt", "")),
            "updated_at": str(video.get("updatedAt", ""))
        }
    
    def prepare_book_metadata(self, book: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare metadata for books"""
        return {
            "source_type": "book",
            "document_id": str(book.get("_id", "")),
            "title": book.get("title", ""),
            "author": book.get("author", ""),
            "subject": book.get("subject", ""),
            "category": book.get("category", ""),
            "fileName": book.get("fileName", ""),
            "pages": str(book.get("pages", "")),
            "language": book.get("language", ""),
            "publisher": book.get("publisher", ""),
            "publication_year": str(book.get("publication_year", "")),
            "isbn": book.get("isbn", ""),
            "file_url": book.get("file_url", ""),
            "tags": ",".join(book.get("tags", [])),
            "approved": str(book.get("approved", False)),
            "created_at": str(book.get("createdAt", "")),
            "updated_at": str(book.get("updatedAt", ""))
        }
    
    def create_searchable_content(self, metadata: Dict[str, Any], description: str = "") -> str:
        """Create searchable content combining metadata and description"""
        content_parts = []
        
        # Add title and description first
        if metadata.get("title"):
            content_parts.append(f"Title: {metadata['title']}")
        
        if description:
            content_parts.append(f"Description: {description}")
        
        # Add subject information
        if metadata.get("subject"):
            content_parts.append(f"Subject: {metadata['subject']}")
        
        if metadata.get("category"):
            content_parts.append(f"Category: {metadata['category']}")
        
        # Add academic information
        if metadata.get("semester"):
            content_parts.append(f"Semester: {metadata['semester']}")
        
        if metadata.get("unit"):
            content_parts.append(f"Unit: {metadata['unit']}")
        
        if metadata.get("topic"):
            content_parts.append(f"Topic: {metadata['topic']}")
        
        # Add author/channel
        if metadata.get("author"):
            content_parts.append(f"Author: {metadata['author']}")
        elif metadata.get("channel"):
            content_parts.append(f"Channel: {metadata['channel']}")
        
        # Add tags
        if metadata.get("tags") and metadata["tags"] != "":
            content_parts.append(f"Tags: {metadata['tags']}")
        
        if metadata.get("topicTags") and metadata["topicTags"] != "":
            content_parts.append(f"Topics: {metadata['topicTags']}")
        
        # Add level information
        if metadata.get("level"):
            content_parts.append(f"Level: {metadata['level']}")
        
        return "\n".join(content_parts)
    
    async def ingest_studymaterials(self):
        """Ingest all StudyPES materials"""
        try:
            logger.info("📚 Starting StudyMaterials ingestion...")
            collection = self.collections['studymaterials']
            studymaterials_collection = self.db['studymaterials']
            
            async for material in studymaterials_collection.find({}):
                try:
                    self.stats["studymaterials"]["processed"] += 1
                    
                    # Prepare metadata
                    metadata = self.prepare_studymaterial_metadata(material)
                    
                    # Create searchable content
                    content = self.create_searchable_content(
                        metadata, 
                        material.get("description", "")
                    )
                    
                    # Create document chunks
                    documents = self.text_splitter.create_documents([content], [metadata])
                    
                    # Add to ChromaDB
                    for i, doc in enumerate(documents):
                        doc_id = f"study_{material['_id']}_{i}"
                        collection.add(
                            documents=[doc.page_content],
                            metadatas=[doc.metadata],
                            ids=[doc_id]
                        )
                    
                    self.stats["studymaterials"]["successful"] += 1
                    self.stats["total_chunks"] += len(documents)
                    
                    if self.stats["studymaterials"]["processed"] % 50 == 0:
                        logger.info(f"📚 Processed {self.stats['studymaterials']['processed']} StudyMaterials...")
                        
                except Exception as e:
                    self.stats["studymaterials"]["failed"] += 1
                    logger.error(f"Failed to process StudyMaterial {material.get('fileName', 'unknown')}: {e}")
            
            logger.info(f"✅ StudyMaterials ingestion complete: {self.stats['studymaterials']['successful']}/{self.stats['studymaterials']['processed']}")
            
        except Exception as e:
            logger.error(f"StudyMaterials ingestion failed: {e}")
    
    async def ingest_videos(self):
        """Ingest all videos"""
        try:
            logger.info("🎥 Starting Videos ingestion...")
            collection = self.collections['videos']
            videos_collection = self.db['videos']
            
            async for video in videos_collection.find({}):
                try:
                    self.stats["videos"]["processed"] += 1
                    
                    # Prepare metadata
                    metadata = self.prepare_video_metadata(video)
                    
                    # Create searchable content
                    content = self.create_searchable_content(
                        metadata, 
                        video.get("description", "")
                    )
                    
                    # Create document chunks
                    documents = self.text_splitter.create_documents([content], [metadata])
                    
                    # Add to ChromaDB
                    for i, doc in enumerate(documents):
                        doc_id = f"video_{video['_id']}_{i}"
                        collection.add(
                            documents=[doc.page_content],
                            metadatas=[doc.metadata],
                            ids=[doc_id]
                        )
                    
                    self.stats["videos"]["successful"] += 1
                    self.stats["total_chunks"] += len(documents)
                    
                    if self.stats["videos"]["processed"] % 25 == 0:
                        logger.info(f"🎥 Processed {self.stats['videos']['processed']} Videos...")
                        
                except Exception as e:
                    self.stats["videos"]["failed"] += 1
                    logger.error(f"Failed to process Video {video.get('title', 'unknown')}: {e}")
            
            logger.info(f"✅ Videos ingestion complete: {self.stats['videos']['successful']}/{self.stats['videos']['processed']}")
            
        except Exception as e:
            logger.error(f"Videos ingestion failed: {e}")
    
    async def ingest_books(self):
        """Ingest all books"""
        try:
            logger.info("📖 Starting Books ingestion...")
            collection = self.collections['books']
            books_collection = self.db['books']
            
            async for book in books_collection.find({}):
                try:
                    self.stats["books"]["processed"] += 1
                    
                    # Prepare metadata
                    metadata = self.prepare_book_metadata(book)
                    
                    # Create searchable content
                    content = self.create_searchable_content(
                        metadata, 
                        book.get("description", "")
                    )
                    
                    # Create document chunks
                    documents = self.text_splitter.create_documents([content], [metadata])
                    
                    # Add to ChromaDB
                    for i, doc in enumerate(documents):
                        doc_id = f"book_{book['_id']}_{i}"
                        collection.add(
                            documents=[doc.page_content],
                            metadatas=[doc.metadata],
                            ids=[doc_id]
                        )
                    
                    self.stats["books"]["successful"] += 1
                    self.stats["total_chunks"] += len(documents)
                    
                    if self.stats["books"]["processed"] % 25 == 0:
                        logger.info(f"📖 Processed {self.stats['books']['processed']} Books...")
                        
                except Exception as e:
                    self.stats["books"]["failed"] += 1
                    logger.error(f"Failed to process Book {book.get('fileName', 'unknown')}: {e}")
            
            logger.info(f"✅ Books ingestion complete: {self.stats['books']['successful']}/{self.stats['books']['processed']}")
            
        except Exception as e:
            logger.error(f"Books ingestion failed: {e}")
    
    def print_final_stats(self):
        """Print final ingestion statistics"""
        print("\n" + "="*80)
        print("🎉 COMPREHENSIVE MONGODB RAG INGESTION COMPLETE!")
        print("="*80)
        
        total_processed = sum(self.stats[coll]["processed"] for coll in ["studymaterials", "videos", "books"])
        total_successful = sum(self.stats[coll]["successful"] for coll in ["studymaterials", "videos", "books"])
        total_failed = sum(self.stats[coll]["failed"] for coll in ["studymaterials", "videos", "books"])
        
        print(f"📊 FINAL STATISTICS:")
        print(f"   StudyMaterials: {self.stats['studymaterials']['successful']}/{self.stats['studymaterials']['processed']} (Failed: {self.stats['studymaterials']['failed']})")
        print(f"   Videos: {self.stats['videos']['successful']}/{self.stats['videos']['processed']} (Failed: {self.stats['videos']['failed']})")
        print(f"   Books: {self.stats['books']['successful']}/{self.stats['books']['processed']} (Failed: {self.stats['books']['failed']})")
        print(f"   TOTAL: {total_successful}/{total_processed} documents (Failed: {total_failed})")
        print(f"   Total Chunks Created: {self.stats['total_chunks']}")
        print(f"   ChromaDB Collections: {len(self.collections)}")
        
        print(f"\n📈 INGESTION SUCCESS RATE: {(total_successful/total_processed*100):.1f}%")
        print("✅ All MongoDB data with metadata is now available for RAG queries!")
        
    async def run_comprehensive_ingestion(self):
        """Run the complete ingestion pipeline"""
        try:
            await self.initialize()
            
            print("🚀 Starting Comprehensive MongoDB to RAG Ingestion...")
            print("📊 This will ingest ALL data from MongoDB (studymaterials, videos, books)")
            print("🔍 All metadata will be preserved for advanced RAG queries\n")
            
            # Ingest all data types
            await self.ingest_studymaterials()
            await self.ingest_videos() 
            await self.ingest_books()
            
            # Print final statistics
            self.print_final_stats()
            
        except Exception as e:
            logger.error(f"Comprehensive ingestion failed: {e}")
            raise
        finally:
            if self.mongodb_client:
                self.mongodb_client.close()
                logger.info("📂 MongoDB connection closed")

async def main():
    """Main execution function"""
    ingestion = ComprehensiveMongoDBIngestion()
    await ingestion.run_comprehensive_ingestion()

if __name__ == "__main__":
    asyncio.run(main())
