#!/usr/bin/env python3
"""
Reference Textbook Ingestion Script
Ingests all PDF textbooks from MongoDB into ChromaDB for RAG functionality
"""

import os
import sys
import asyncio
import logging
import tempfile
import requests
from pathlib import Path
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
from sentence_transformers import SentenceTransformer
import PyPDF2
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ReferenceTextbookIngestion:
    def __init__(self):
        # MongoDB setup
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/study-ai')
        self.mongodb_client = None
        self.db = None
        
        # ChromaDB setup
        self.chroma_path = os.getenv('CHROMA_DB_PATH', './chromadb')
        self.chroma_client = None
        self.collection = None
        
        # Embedding model
        self.embedding_model = None
        
        # Statistics
        self.stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "skipped": 0
        }
        
    async def initialize(self):
        """Initialize all connections and models"""
        try:
            # Initialize MongoDB
            self.mongodb_client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.mongodb_client['study-ai']
            await self.mongodb_client.admin.command('ping')
            logger.info("✅ Connected to MongoDB")
            
            # Initialize ChromaDB
            Path(self.chroma_path).mkdir(parents=True, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(
                path=self.chroma_path,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection for reference textbooks
            self.collection = self.chroma_client.get_or_create_collection(
                name="reference_textbooks",
                metadata={"description": "Reference textbook content and metadata for educational RAG"}
            )
            logger.info("✅ Connected to ChromaDB")
            
            # Initialize embedding model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Loaded embedding model")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Initialization failed: {e}")
            return False
    
    async def fetch_reference_books_from_mongodb(self) -> List[Dict[str, Any]]:
        """Fetch all reference books with GitHub URLs from MongoDB"""
        try:
            books_collection = self.db['books']
            
            # Find books with GitHub URLs (our reference textbooks)
            query = {
                "file_url": {
                    "$regex": "github.com",
                    "$options": "i"
                }
            }
            
            books = []
            async for book in books_collection.find(query):
                book['_id'] = str(book['_id'])
                books.append(book)
            
            logger.info(f"📚 Found {len(books)} reference textbooks with GitHub URLs")
            return books
            
        except Exception as e:
            logger.error(f"❌ Error fetching reference books: {e}")
            return []
    
    def extract_textbook_content(self, pdf_content: bytes, max_pages: int = 15) -> str:
        """Extract comprehensive text content from PDF textbook"""
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_parts = []
            total_pages = min(max_pages, len(pdf_reader.pages))
            
            for page_num in range(total_pages):
                try:
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text.strip():
                        text_parts.append(f"Page {page_num + 1}: {page_text.strip()}")
                except Exception as e:
                    logger.warning(f"Error extracting page {page_num + 1}: {e}")
                    continue
            
            return "\n\n".join(text_parts)
            
        except Exception as e:
            logger.error(f"❌ Error extracting PDF content: {e}")
            return ""
    
    def download_and_extract_textbook(self, url: str, filename: str) -> str:
        """Download textbook PDF and extract comprehensive content"""
        try:
            # Check if already exists in local folder
            local_path = Path(f"../META_dataretreval/github_refrences/{filename}")
            if local_path.exists():
                logger.info(f"📁 Using local textbook: {filename}")
                with open(local_path, 'rb') as f:
                    pdf_content = f.read()
                return self.extract_textbook_content(pdf_content)
            
            # Download from GitHub
            logger.info(f"📥 Downloading textbook: {filename}")
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            pdf_content = response.content
            return self.extract_textbook_content(pdf_content)
            
        except Exception as e:
            logger.error(f"❌ Error downloading/extracting {filename}: {e}")
            return ""
    
    def prepare_textbook_for_rag(self, book: Dict[str, Any], textbook_content: str) -> Dict[str, Any]:
        """Prepare comprehensive textbook data for RAG search"""
        # Create rich, searchable content
        content_sections = []
        
        # Title and Author
        if book.get('title'):
            content_sections.append(f"TITLE: {book['title']}")
        
        if book.get('author'):
            content_sections.append(f"AUTHOR: {book['author']}")
        
        # Subject and Category
        if book.get('subject'):
            content_sections.append(f"SUBJECT: {book['subject']}")
        
        if book.get('category'):
            content_sections.append(f"CATEGORY: {book['category']}")
        
        # Description and Tags
        if book.get('description'):
            content_sections.append(f"DESCRIPTION: {book['description']}")
        
        if book.get('tags'):
            content_sections.append(f"KEYWORDS: {', '.join(book['tags'])}")
        
        # Add key concepts from enhanced metadata
        if book.get('key_concepts'):
            key_concepts = book['key_concepts']
            if isinstance(key_concepts, list):
                content_sections.append(f"KEY CONCEPTS: {', '.join(key_concepts)}")
            else:
                content_sections.append(f"KEY CONCEPTS: {key_concepts}")
        
        # Add learning metadata for better matching
        if book.get('difficulty'):
            content_sections.append(f"DIFFICULTY LEVEL: {book['difficulty']}")
        
        if book.get('target_audience'):
            content_sections.append(f"TARGET AUDIENCE: {book['target_audience']}")
        
        # Add summary if available
        if book.get('summary'):
            content_sections.append(f"SUMMARY: {book['summary']}")
        
        # Add prerequisites for educational context
        if book.get('prerequisites'):
            prereqs = book['prerequisites']
            if isinstance(prereqs, list):
                content_sections.append(f"PREREQUISITES: {', '.join(prereqs)}")
            else:
                content_sections.append(f"PREREQUISITES: {prereqs}")
        
        # Main textbook content
        if textbook_content:
            content_sections.append(f"CONTENT:\n{textbook_content}")
        
        # Create comprehensive searchable text
        document_text = "\n\n".join(content_sections)
        
        # Prepare detailed metadata for retrieval
        metadata = {
            "book_id": book['_id'],
            "title": book.get('title', ''),
            "author": book.get('author', ''),
            "subject": book.get('subject', ''),
            "category": book.get('category', ''),
            "pages": book.get('pages', 0),
            "file_url": book.get('file_url', ''),
            "tags": ','.join(book.get('tags', [])) if book.get('tags') else '',
            "description": book.get('description', ''),
            "summary": book.get('summary', ''),
            "key_concepts": ','.join(book.get('key_concepts', [])) if book.get('key_concepts') else '',
            "difficulty": book.get('difficulty', ''),
            "target_audience": book.get('target_audience', ''),
            "prerequisites": ','.join(book.get('prerequisites', [])) if book.get('prerequisites') else '',
            "language": book.get('language', 'English'),
            "format": book.get('format', 'PDF'),
            "source": book.get('source', 'GitHub'),
            "type": "reference_textbook"
        }
        
        return {
            "id": f"textbook_{book['_id']}",
            "text": document_text,
            "metadata": metadata
        }
    
    async def ingest_textbook(self, book: Dict[str, Any]) -> bool:
        """Ingest a single reference textbook into ChromaDB"""
        try:
            textbook_id = f"textbook_{book['_id']}"
            
            # Check if already exists
            try:
                existing = self.collection.get(ids=[textbook_id])
                if existing['ids']:
                    logger.info(f"⏭️  Skipping {book.get('title', 'Unknown')} - already indexed")
                    self.stats["skipped"] += 1
                    return True
            except:
                pass  # Document doesn't exist, continue with ingestion
            
            # Download and extract comprehensive textbook content
            textbook_content = ""
            if book.get('file_url') and 'github.com' in book.get('file_url', ''):
                textbook_content = self.download_and_extract_textbook(
                    book['file_url'],
                    book.get('fileName', f"{book['_id']}.pdf")
                )
            
            # Prepare document for RAG
            document = self.prepare_textbook_for_rag(book, textbook_content)
            
            # Add to ChromaDB with comprehensive indexing
            self.collection.add(
                documents=[document['text']],
                metadatas=[document['metadata']],
                ids=[document['id']]
            )
            
            logger.info(f"✅ Indexed textbook: {book.get('title', 'Unknown')} ({len(textbook_content)} chars)")
            self.stats["successful"] += 1
            return True
            
        except Exception as e:
            logger.error(f"❌ Error indexing {book.get('title', 'Unknown')}: {e}")
            self.stats["failed"] += 1
            return False
    
    async def run_textbook_ingestion(self):
        """Run the complete reference textbook ingestion process"""
        logger.info("🚀 Starting Reference Textbook Ingestion for RAG...")
        
        try:
            # Initialize
            if not await self.initialize():
                return False
            
            # Fetch reference textbooks
            textbooks = await self.fetch_reference_books_from_mongodb()
            if not textbooks:
                logger.error("❌ No reference textbooks found")
                return False
            
            # Process each textbook
            self.stats["total_processed"] = len(textbooks)
            
            for i, textbook in enumerate(textbooks, 1):
                logger.info(f"📖 Processing {i}/{len(textbooks)}: {textbook.get('title', 'Unknown')}")
                
                await self.ingest_textbook(textbook)
                
                # Small delay to avoid overwhelming the system
                await asyncio.sleep(0.3)
            
            # Final summary
            logger.info("\n📊 Reference Textbook Ingestion Summary:")
            logger.info(f"📚 Total textbooks processed: {self.stats['total_processed']}")
            logger.info(f"✅ Successfully indexed: {self.stats['successful']}")
            logger.info(f"⏭️  Already indexed (skipped): {self.stats['skipped']}")
            logger.info(f"❌ Failed to index: {self.stats['failed']}")
            
            success_rate = (self.stats['successful'] / self.stats['total_processed']) * 100 if self.stats['total_processed'] > 0 else 0
            logger.info(f"📈 Success rate: {success_rate:.1f}%")
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Reference textbook ingestion failed: {e}")
            return False
        finally:
            if self.mongodb_client:
                self.mongodb_client.close()
    
    async def verify_ingestion(self):
        """Verify the ingestion with sample searches"""
        logger.info("\n🔍 Verifying Reference Textbook Search...")
        
        verification_queries = [
            "Python programming fundamentals",
            "data structures algorithms",
            "machine learning basics",
            "operating system concepts",
            "database management systems",
            "computer networks",
            "software engineering",
            "artificial intelligence"
        ]
        
        for query in verification_queries:
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=3
                )
                
                logger.info(f"🔍 Query: '{query}'")
                if results['documents'] and results['documents'][0]:
                    for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0]), 1):
                        logger.info(f"   {i}. {metadata.get('title', 'Unknown')} by {metadata.get('author', 'Unknown')}")
                        logger.info(f"      📁 File: {metadata.get('filename', 'N/A')}")
                else:
                    logger.info("   No results found")
                logger.info("")
                
            except Exception as e:
                logger.error(f"❌ Error verifying query '{query}': {e}")

async def main():
    """Main function for reference textbook ingestion"""
    ingestion = ReferenceTextbookIngestion()
    success = await ingestion.run_textbook_ingestion()
    
    if success:
        await ingestion.verify_ingestion()
        logger.info("🎉 Reference textbook ingestion completed successfully!")
    else:
        logger.error("💥 Reference textbook ingestion failed!")
        
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
