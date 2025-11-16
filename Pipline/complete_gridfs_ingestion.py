#!/usr/bin/env python3
"""
Complete GridFS Ingestion with PDF Processing
===========================================
Comprehensive ingestion script that:
1. Reads PES materials metadata from Data/PES_materials/PES_slides.json
2. Reads reference books metadata from Data/Refrence_books/Refrence_books
3. Finds corresponding PDF files and stores them in GridFS
4. Updates metadata in MongoDB and ChromaDB with GridFS IDs
5. Processes and chunks PDFs for better searchability
"""

import json
import pymongo
import gridfs
import chromadb
import os
from pathlib import Path
import hashlib
from datetime import datetime
import logging
from typing import Dict, List, Any, Optional
import PyPDF2
import re

# Set up logging and suppress PDF warnings
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.getLogger("PyPDF2").setLevel(logging.ERROR)  # Suppress PDF parsing warnings
logger = logging.getLogger(__name__)

# Import Ollama embedding function
try:
    from chromadb.utils.embedding_functions import OllamaEmbeddingFunction
    OLLAMA_AVAILABLE = True
except ImportError:
    logger.warning("Ollama embedding not available, falling back to default")
    OLLAMA_AVAILABLE = False

class CompleteGridFSIngestion:
    def __init__(self):
        """Initialize MongoDB, GridFS, and ChromaDB connections"""
        # MongoDB and GridFS
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client.educational_content
        self.fs = gridfs.GridFS(self.db)
        
        # ChromaDB with optimized embedding function
        self.chroma_client = chromadb.PersistentClient(path="./chromadb")
        
        # Set up embedding function (use Ollama if available, otherwise default)
        if OLLAMA_AVAILABLE:
            try:
                self.embedding_function = OllamaEmbeddingFunction(
                    model_name="nomic-embed-text",
                    url="http://localhost:11434/api/embeddings"
                )
                logger.info("✅ Using Ollama embeddings with nomic-embed-text")
            except Exception as e:
                logger.warning(f"Ollama embedding failed, using default: {e}")
                self.embedding_function = None
        else:
            self.embedding_function = None
        
        # Collections
        self.pes_collection = self.db.pes_materials
        self.books_collection = self.db.reference_books
        self.videos_collection = self.db.videos
        self.chunks_collection = self.db.chunks
        
        # Data paths
        self.base_path = Path("Data")
        self.pes_metadata_path = self.base_path / "PES_materials" / "PES_slides.json"
        self.pes_pdfs_path = self.base_path / "PES_materials" / "PES_slides"
        self.books_metadata_path = self.base_path / "Refrence_books" / "Refrence_books"
        self.books_pdfs_path = self.base_path / "Refrence_books" / "Refrence_books_pdf"
        
        # Batch processing settings
        self.batch_size = 32  # Process embeddings in batches
        self.embedding_batch = {
            'documents': [],
            'metadatas': [],
            'ids': []
        }
        
        # Statistics
        self.stats = {
            'pes_processed': 0,
            'pes_pdfs_found': 0,
            'pes_pdfs_stored': 0,
            'books_processed': 0,
            'books_pdfs_found': 0,
            'books_pdfs_stored': 0,
            'total_chunks': 0,
            'errors': []
        }

    def clear_all_data(self):
        """Clear all existing data from MongoDB and ChromaDB"""
        logger.info("🧹 Clearing all existing data...")
        
        # Clear MongoDB collections
        collections_to_clear = ['pes_materials', 'reference_books', 'videos', 'chunks']
        for collection_name in collections_to_clear:
            count = self.db[collection_name].count_documents({})
            if count > 0:
                self.db[collection_name].delete_many({})
                logger.info(f"   Cleared {count} documents from {collection_name}")
        
        # Clear GridFS
        gridfs_count = self.db.fs.files.count_documents({})
        if gridfs_count > 0:
            self.db.fs.files.delete_many({})
            self.db.fs.chunks.delete_many({})
            logger.info(f"   Cleared {gridfs_count} GridFS files")
        
        # Clear ChromaDB
        try:
            collections = self.chroma_client.list_collections()
            for collection in collections:
                # Get all IDs first, then delete them
                try:
                    all_data = collection.get()
                    if all_data and all_data.get('ids'):
                        collection.delete(ids=all_data['ids'])
                        logger.info(f"   Cleared {len(all_data['ids'])} items from ChromaDB collection: {collection.name}")
                except Exception as e:
                    # If that fails, delete the entire collection
                    self.chroma_client.delete_collection(collection.name)
                    logger.info(f"   Deleted ChromaDB collection: {collection.name}")
        except Exception as e:
            logger.warning(f"   ChromaDB clear warning: {e}")
        
        logger.info("✅ All data cleared successfully")

    def add_to_embedding_batch(self, document: str, metadata: Dict[str, Any], doc_id: str):
        """Add document to embedding batch"""
        self.embedding_batch['documents'].append(document)
        self.embedding_batch['metadatas'].append(metadata)
        self.embedding_batch['ids'].append(doc_id)

    def flush_embedding_batch(self, chroma_collection):
        """Flush the current embedding batch to ChromaDB"""
        if not self.embedding_batch['documents']:
            return

        try:
            logger.info(f"   🔗 Adding batch of {len(self.embedding_batch['documents'])} documents to ChromaDB...")
            chroma_collection.add(
                documents=self.embedding_batch['documents'],
                metadatas=self.embedding_batch['metadatas'],
                ids=self.embedding_batch['ids']
            )
            
            # Clear the batch
            self.embedding_batch = {
                'documents': [],
                'metadatas': [],
                'ids': []
            }
            logger.info("   ✅ Batch added successfully")
            
        except Exception as e:
            logger.error(f"Error adding batch to ChromaDB: {e}")
            self.stats['errors'].append(f"ChromaDB batch error: {e}")
            # Clear the batch even on error to prevent infinite retries
            self.embedding_batch = {
                'documents': [],
                'metadatas': [],
                'ids': []
            }

    def extract_pdf_text(self, pdf_path: Path) -> str:
        """Extract text content from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    except Exception as e:
                        logger.warning(f"Error extracting page from {pdf_path}: {e}")
                        continue
                
                # Clean up text
                text = re.sub(r'\s+', ' ', text).strip()
                return text
                
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {e}")
            return ""

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            
            # If this is not the last chunk, try to end at a sentence boundary
            if end < text_length:
                # Look for sentence endings within the last 200 characters
                sentence_end = text.rfind('.', start + chunk_size - 200, end)
                if sentence_end > start:
                    end = sentence_end + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            
            # Prevent infinite loop
            if start >= text_length:
                break
        
        return chunks

    def store_pdf_in_gridfs(self, pdf_path: Path, metadata: Dict[str, Any]) -> Optional[str]:
        """Store PDF file in GridFS and return the GridFS ID"""
        try:
            if not pdf_path.exists():
                logger.warning(f"PDF file not found: {pdf_path}")
                return None
            
            # Create GridFS metadata
            gridfs_metadata = {
                'original_filename': pdf_path.name,
                'file_size': pdf_path.stat().st_size,
                'upload_date': datetime.now(),
                'content_type': 'application/pdf',
                'source': metadata.get('source', 'unknown'),
                'document_type': metadata.get('content_type', 'unknown'),
            }
            
            # Add specific metadata based on content type
            if 'pes' in metadata.get('content_type', ''):
                gridfs_metadata.update({
                    'subject': metadata.get('subject'),
                    'semester': metadata.get('semester'),
                    'unit': metadata.get('unit')
                })
            elif 'reference_book' in metadata.get('content_type', ''):
                gridfs_metadata.update({
                    'title': metadata.get('title'),
                    'author': metadata.get('author'),
                    'subject': metadata.get('subject')
                })
            
            # Store file in GridFS
            with open(pdf_path, 'rb') as pdf_file:
                gridfs_id = self.fs.put(
                    pdf_file,
                    filename=pdf_path.name,
                    metadata=gridfs_metadata
                )
            
            logger.info(f"   ✅ Stored {pdf_path.name} in GridFS with ID: {gridfs_id}")
            return str(gridfs_id)
            
        except Exception as e:
            logger.error(f"Error storing PDF in GridFS {pdf_path}: {e}")
            self.stats['errors'].append(f"GridFS storage error for {pdf_path}: {e}")
            return None

    def process_pes_materials(self):
        """Process PES materials with PDF storage"""
        logger.info("📚 Processing PES Materials...")
        
        try:
            # Read PES metadata
            with open(self.pes_metadata_path, 'r', encoding='utf-8') as f:
                pes_data = json.load(f)
            
            logger.info(f"Found {len(pes_data)} PES materials in metadata")
            
            # Create ChromaDB collection with optimized settings
            try:
                chroma_collection = self.chroma_client.create_collection(
                    name="educational_content",
                    metadata={"description": "Educational content with GridFS integration"}
                )
                logger.info("✅ Created new ChromaDB collection")
            except ValueError:
                chroma_collection = self.chroma_client.get_collection("educational_content")
                logger.info("✅ Using existing ChromaDB collection")
            
            for item in pes_data:
                try:
                    self.stats['pes_processed'] += 1
                    
                    # Extract filename and find PDF
                    filename = item.get('fileName', '')
                    if not filename:
                        logger.warning(f"No filename found for PES item: {item.get('title', 'Unknown')}")
                        continue
                    
                    pdf_path = self.pes_pdfs_path / filename
                    
                    # Check if PDF exists
                    gridfs_id = None
                    pdf_text = ""
                    
                    if pdf_path.exists() and pdf_path.suffix.lower() == '.pdf':
                        self.stats['pes_pdfs_found'] += 1
                        logger.info(f"   Processing: {filename}")
                        
                        # Store PDF in GridFS
                        gridfs_id = self.store_pdf_in_gridfs(pdf_path, {
                            'content_type': 'pes_material',
                            'source': 'PES_slides',
                            'subject': item.get('subject'),
                            'semester': item.get('semester'),
                            'unit': item.get('unit')
                        })
                        
                        if gridfs_id:
                            self.stats['pes_pdfs_stored'] += 1
                        
                        # Extract text from PDF
                        pdf_text = self.extract_pdf_text(pdf_path)
                        
                    else:
                        # Check for other formats
                        for ext in ['.pptx', '.docx', '.pps']:
                            alt_path = self.pes_pdfs_path / filename.replace('.pdf', ext)
                            if alt_path.exists():
                                logger.info(f"   Found {ext} file: {alt_path.name}")
                                # For now, we'll just note the file exists but not process content
                                break
                    
                    # Prepare MongoDB document
                    mongo_doc = {
                        '_id': item.get('_id', f"pes_{self.stats['pes_processed']:03d}"),
                        'title': item.get('title', ''),
                        'content': pdf_text[:500] if pdf_text else item.get('content', ''),  # Store preview
                        'subject': item.get('subject', ''),
                        'semester': item.get('semester'),
                        'unit': item.get('unit'),
                        'fileName': filename,
                        'file_url': item.get('file_url', ''),
                        'content_type': 'pes_material',
                        'source': 'PES_slides',
                        'created_at': datetime.now(),
                        'full_content': pdf_text,  # Store full content for search
                    }
                    
                    # Store in MongoDB first
                    self.pes_collection.replace_one(
                        {'_id': mongo_doc['_id']}, 
                        mongo_doc, 
                        upsert=True
                    )
                    
                    # Add GridFS ID if PDF was stored and update MongoDB
                    if gridfs_id:
                        # Find the document by filename to ensure correct update
                        existing_doc = self.pes_collection.find_one({'fileName': filename})
                        if existing_doc:
                            update_id = existing_doc['_id']
                        else:
                            update_id = mongo_doc['_id']
                        
                        # Update MongoDB with GridFS ID
                        self.pes_collection.update_one(
                            {'fileName': filename},  # Use fileName to find correct document
                            {
                                '$set': {
                                    'gridfs_id': gridfs_id,
                                    'has_pdf': True,
                                    'pdf_stored': True,
                                    'pdf_path': str(pdf_path)
                                }
                            }
                        )
                        logger.info(f"   ✅ Updated document with fileName '{filename}' (ID: {update_id}) with GridFS ID: {gridfs_id}")
                    else:
                        # Update MongoDB to indicate no PDF
                        self.pes_collection.update_one(
                            {'fileName': filename},
                            {
                                '$set': {
                                    'has_pdf': False,
                                    'pdf_stored': False
                                }
                            }
                        )
                    
                    # Process text chunks for ChromaDB
                    text_to_embed = pdf_text if pdf_text else item.get('content', item.get('title', ''))
                    
                    if text_to_embed:
                        chunks = self.chunk_text(text_to_embed)
                        
                        for i, chunk in enumerate(chunks):
                            chunk_id = f"pes_{mongo_doc['_id']}_{i}"
                            
                            # Store chunk metadata
                            chunk_metadata = {
                                'source_id': mongo_doc['_id'],
                                'content_type': 'pes_material',
                                'subject': item.get('subject', ''),
                                'semester': str(item.get('semester', '')),
                                'unit': str(item.get('unit', '')),
                                'title': item.get('title', ''),
                                'filename': filename,
                                'chunk_index': i,
                                'total_chunks': len(chunks),
                                'source': 'PES_slides'
                            }
                            
                            # Add GridFS ID to chunk metadata if available
                            if gridfs_id:
                                chunk_metadata['gridfs_id'] = gridfs_id
                            
                            # Store in chunks collection
                            chunk_doc = {
                                '_id': chunk_id,
                                'content': chunk,
                                'metadata': chunk_metadata,
                                'created_at': datetime.now()
                            }
                            self.chunks_collection.replace_one(
                                {'_id': chunk_id}, 
                                chunk_doc, 
                                upsert=True
                            )
                            
                            # Add to embedding batch instead of directly to ChromaDB
                            self.add_to_embedding_batch(chunk, chunk_metadata, chunk_id)
                            self.stats['total_chunks'] += 1
                            
                            # Flush batch when it reaches batch size
                            if len(self.embedding_batch['documents']) >= self.batch_size:
                                self.flush_embedding_batch(chroma_collection)
                    
                    if self.stats['pes_processed'] % 50 == 0:
                        logger.info(f"   Processed {self.stats['pes_processed']} PES materials...")
                
                except Exception as e:
                    logger.error(f"Error processing PES item: {e}")
                    self.stats['errors'].append(f"PES processing error: {e}")
            
            # Flush any remaining embeddings in the batch
            self.flush_embedding_batch(chroma_collection)
            
            logger.info(f"✅ PES materials completed: {self.stats['pes_processed']} processed, {self.stats['pes_pdfs_found']} PDFs found, {self.stats['pes_pdfs_stored']} stored in GridFS")
            
        except Exception as e:
            logger.error(f"Error processing PES materials: {e}")
            self.stats['errors'].append(f"PES materials error: {e}")

    def process_reference_books(self):
        """Process reference books with PDF storage"""
        logger.info("📖 Processing Reference Books...")
        
        try:
            # Read reference books metadata
            with open(self.books_metadata_path, 'r', encoding='utf-8') as f:
                books_data = json.load(f)
            
            logger.info(f"Found {len(books_data)} reference books in metadata")
            
            # Get ChromaDB collection
            chroma_collection = self.chroma_client.get_collection("educational_content")
            
            for item in books_data:
                try:
                    self.stats['books_processed'] += 1
                    
                    # Extract filename and find PDF
                    filename = item.get('filename', '')
                    if not filename:
                        logger.warning(f"No filename found for book: {item.get('title', 'Unknown')}")
                        continue
                    
                    pdf_path = self.books_pdfs_path / filename
                    
                    # Check if PDF exists and store it
                    gridfs_id = None
                    pdf_text = ""
                    
                    if pdf_path.exists():
                        self.stats['books_pdfs_found'] += 1
                        logger.info(f"   Processing: {filename}")
                        
                        # Store PDF in GridFS
                        gridfs_id = self.store_pdf_in_gridfs(pdf_path, {
                            'content_type': 'reference_book',
                            'source': 'reference_books',
                            'title': item.get('title'),
                            'author': item.get('author'),
                            'subject': item.get('subject')
                        })
                        
                        if gridfs_id:
                            self.stats['books_pdfs_stored'] += 1
                        
                        # Extract text from PDF
                        pdf_text = self.extract_pdf_text(pdf_path)
                    
                    # Generate unique ID based on filename to avoid duplicates
                    # Extract number from filename (e.g., comp(1).pdf -> 1)
                    import re
                    match = re.search(r'comp\((\d+)\)\.pdf', filename)
                    if match:
                        book_num = int(match.group(1))
                        unique_id = f"book_{book_num:03d}"
                    else:
                        unique_id = f"book_{self.stats['books_processed']:03d}"
                    
                    # Prepare MongoDB document
                    mongo_doc = {
                        '_id': unique_id,  # Use unique ID based on filename
                        'title': item.get('title', ''),
                        'author': item.get('author', ''),
                        'subject': item.get('subject', ''),
                        'filename': filename,
                        'file_url': item.get('file_url', ''),
                        'summary': item.get('summary', ''),
                        'key_concepts': item.get('key_concepts', []),
                        'difficulty': item.get('difficulty', ''),
                        'target_audience': item.get('target_audience', ''),
                        'content_type': 'reference_book',
                        'source': 'reference_books',
                        'created_at': datetime.now(),
                        'full_content': pdf_text,  # Store full content for search
                    }
                    
                    # Store in MongoDB first
                    self.books_collection.replace_one(
                        {'_id': mongo_doc['_id']}, 
                        mongo_doc, 
                        upsert=True
                    )
                    
                    # Add GridFS ID if PDF was stored and update MongoDB
                    if gridfs_id:
                        # Find the document by filename to ensure correct update
                        existing_doc = self.books_collection.find_one({'filename': filename})
                        if existing_doc:
                            update_id = existing_doc['_id']
                        else:
                            update_id = mongo_doc['_id']
                        
                        # Update MongoDB with GridFS ID
                        self.books_collection.update_one(
                            {'filename': filename},  # Use filename to find correct document
                            {
                                '$set': {
                                    'gridfs_id': gridfs_id,
                                    'has_pdf': True,
                                    'pdf_stored': True,
                                    'pdf_path': str(pdf_path)
                                }
                            }
                        )
                        logger.info(f"   ✅ Updated document with filename '{filename}' (ID: {update_id}) with GridFS ID: {gridfs_id}")
                    else:
                        # Update MongoDB to indicate no PDF
                        self.books_collection.update_one(
                            {'filename': filename},
                            {
                                '$set': {
                                    'has_pdf': False,
                                    'pdf_stored': False
                                }
                            }
                        )
                    
                    # Process text chunks for ChromaDB
                    text_to_embed = pdf_text if pdf_text else (item.get('summary', '') + ' ' + ' '.join(item.get('key_concepts', [])))
                    
                    if text_to_embed:
                        chunks = self.chunk_text(text_to_embed)
                        
                        for i, chunk in enumerate(chunks):
                            chunk_id = f"book_{unique_id}_{i}"
                            
                            # Store chunk metadata
                            chunk_metadata = {
                                'source_id': unique_id,
                                'content_type': 'reference_book',
                                'title': item.get('title', ''),
                                'author': item.get('author', ''),
                                'subject': item.get('subject', ''),
                                'filename': filename,
                                'difficulty': item.get('difficulty', ''),
                                'chunk_index': i,
                                'total_chunks': len(chunks),
                                'source': 'reference_books'
                            }
                            
                            # Add GridFS ID to chunk metadata if available
                            if gridfs_id:
                                chunk_metadata['gridfs_id'] = gridfs_id
                            
                            # Store in chunks collection
                            chunk_doc = {
                                '_id': chunk_id,
                                'content': chunk,
                                'metadata': chunk_metadata,
                                'created_at': datetime.now()
                            }
                            self.chunks_collection.replace_one(
                                {'_id': chunk_id}, 
                                chunk_doc, 
                                upsert=True
                            )
                            
                            # Add to embedding batch instead of directly to ChromaDB
                            self.add_to_embedding_batch(chunk, chunk_metadata, chunk_id)
                            self.stats['total_chunks'] += 1
                            
                            # Flush batch when it reaches batch size
                            if len(self.embedding_batch['documents']) >= self.batch_size:
                                self.flush_embedding_batch(chroma_collection)
                    
                    if self.stats['books_processed'] % 25 == 0:
                        logger.info(f"   Processed {self.stats['books_processed']} reference books...")
                
                except Exception as e:
                    logger.error(f"Error processing book item: {e}")
                    self.stats['errors'].append(f"Book processing error: {e}")
            
            # Flush any remaining embeddings in the batch
            self.flush_embedding_batch(chroma_collection)
            
            logger.info(f"✅ Reference books completed: {self.stats['books_processed']} processed, {self.stats['books_pdfs_found']} PDFs found, {self.stats['books_pdfs_stored']} stored in GridFS")
            
        except Exception as e:
            logger.error(f"Error processing reference books: {e}")
            self.stats['errors'].append(f"Reference books error: {e}")

    def process_videos(self):
        """Process video metadata (no GridFS storage needed)"""
        logger.info("🎥 Processing Video Metadata...")
        
        try:
            video_data_path = self.base_path / "Viedo_urls.txt"
            
            if not video_data_path.exists():
                logger.warning("Video data file not found")
                return
            
            # Read video URLs
            with open(video_data_path, 'r', encoding='utf-8') as f:
                video_urls = [line.strip() for line in f if line.strip()]
            
            logger.info(f"Found {len(video_urls)} video URLs")
            
            # Get ChromaDB collection
            chroma_collection = self.chroma_client.get_collection("educational_content")
            
            for i, url in enumerate(video_urls):
                try:
                    # Create basic metadata for video
                    video_doc = {
                        '_id': f"video_{i:03d}",
                        'title': f"Educational Video {i+1}",
                        'url': url,
                        'content_type': 'youtube_video',
                        'source': 'video_urls',
                        'created_at': datetime.now(),
                    }
                    
                    # Store in MongoDB
                    self.videos_collection.replace_one(
                        {'_id': video_doc['_id']}, 
                        video_doc, 
                        upsert=True
                    )
                    
                    # Add to ChromaDB using batch processing
                    chunk_metadata = {
                        'source_id': video_doc['_id'],
                        'content_type': 'youtube_video',
                        'title': video_doc['title'],
                        'url': url,
                        'source': 'video_urls'
                    }
                    
                    self.add_to_embedding_batch(
                        f"Educational Video: {url}",
                        chunk_metadata,
                        video_doc['_id']
                    )
                    
                except Exception as e:
                    logger.error(f"Error processing video URL: {e}")
                    self.stats['errors'].append(f"Video processing error: {e}")
            
            # Flush any remaining embeddings in the batch
            self.flush_embedding_batch(chroma_collection)
            
            logger.info(f"✅ Videos completed: {len(video_urls)} processed")
            
        except Exception as e:
            logger.error(f"Error processing videos: {e}")
            self.stats['errors'].append(f"Videos error: {e}")

    def verify_ingestion(self):
        """Verify the ingestion results"""
        logger.info("\n📊 INGESTION VERIFICATION")
        logger.info("=" * 50)
        
        # MongoDB counts
        pes_count = self.pes_collection.count_documents({})
        books_count = self.books_collection.count_documents({})
        videos_count = self.videos_collection.count_documents({})
        chunks_count = self.chunks_collection.count_documents({})
        
        # GridFS counts
        gridfs_count = self.db.fs.files.count_documents({})
        
        # ChromaDB counts
        try:
            chroma_collection = self.chroma_client.get_collection("educational_content")
            chroma_count = chroma_collection.count()
        except:
            chroma_count = 0
        
        # GridFS metadata with IDs
        pes_with_gridfs = self.pes_collection.count_documents({"gridfs_id": {"$exists": True}})
        books_with_gridfs = self.books_collection.count_documents({"gridfs_id": {"$exists": True}})
        
        logger.info(f"📚 PES Materials: {pes_count} documents ({pes_with_gridfs} with GridFS IDs)")
        logger.info(f"📖 Reference Books: {books_count} documents ({books_with_gridfs} with GridFS IDs)")
        logger.info(f"🎥 Videos: {videos_count} documents")
        logger.info(f"📄 Text Chunks: {chunks_count} documents")
        logger.info(f"🗄️  GridFS Files: {gridfs_count}")
        logger.info(f"🔗 ChromaDB Vectors: {chroma_count}")
        
        # Show some sample records with GridFS IDs
        logger.info("\n🔍 Sample Records with GridFS IDs:")
        
        # Sample PES with GridFS
        pes_sample = self.pes_collection.find_one({"gridfs_id": {"$exists": True}})
        if pes_sample:
            logger.info(f"PES Sample: {pes_sample['title'][:50]}... (GridFS ID: {pes_sample['gridfs_id']})")
        
        # Sample Book with GridFS
        book_sample = self.books_collection.find_one({"gridfs_id": {"$exists": True}})
        if book_sample:
            logger.info(f"Book Sample: {book_sample['title'][:50]}... (GridFS ID: {book_sample['gridfs_id']})")
        
        # Summary statistics
        logger.info(f"\n📈 PROCESSING STATISTICS:")
        logger.info(f"PES Materials: {self.stats['pes_processed']} processed, {self.stats['pes_pdfs_stored']} PDFs stored")
        logger.info(f"Reference Books: {self.stats['books_processed']} processed, {self.stats['books_pdfs_stored']} PDFs stored") 
        logger.info(f"Total Chunks: {self.stats['total_chunks']}")
        
        if self.stats['errors']:
            logger.warning(f"❌ Errors encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors'][:5]:  # Show first 5 errors
                logger.warning(f"  - {error}")

    def run_complete_ingestion(self):
        """Run the complete ingestion process"""
        start_time = datetime.now()
        logger.info("🚀 Starting Complete GridFS Ingestion Process")
        logger.info("=" * 60)
        
        try:
            # Step 1: Clear existing data
            self.clear_all_data()
            
            # Step 2: Process PES materials
            self.process_pes_materials()
            
            # Step 3: Process reference books
            self.process_reference_books()
            
            # Step 4: Process videos
            self.process_videos()
            
            # Step 5: Verify ingestion
            self.verify_ingestion()
            
            # Calculate total time
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info(f"\n✅ COMPLETE INGESTION FINISHED")
            logger.info(f"Total time: {duration}")
            logger.info(f"All PDFs are now stored in GridFS with linked metadata!")
            
        except Exception as e:
            logger.error(f"Fatal error in ingestion process: {e}")
            raise

def main():
    """Main execution function"""
    ingestion = CompleteGridFSIngestion()
    ingestion.run_complete_ingestion()

if __name__ == "__main__":
    main()
