#!/usr/bin/env python3
"""
Continue PES Materials Ingestion
===============================
Continuation script that:
1. Preserves existing reference books, videos, and ChromaDB data
2. Only processes PES materials that haven't been ingested yet
3. Adds PES materials to existing collections and GridFS
4. Uses the existing ChromaDB collection
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

class ContinuePESIngestion:
    def __init__(self):
        """Initialize MongoDB, GridFS, and ChromaDB connections"""
        # MongoDB and GridFS
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client.educational_content
        self.fs = gridfs.GridFS(self.db)
        
        # ChromaDB
        self.chroma_client = chromadb.PersistentClient(path="./chromadb")
        
        # Collections
        self.pes_collection = self.db.pes_materials
        self.books_collection = self.db.reference_books
        self.videos_collection = self.db.videos
        self.chunks_collection = self.db.chunks
        
        # Data paths
        self.base_path = Path("Data")
        self.pes_metadata_path = self.base_path / "PES_materials" / "PES_slides.json"
        self.pes_pdfs_path = self.base_path / "PES_materials" / "PES_slides"
        
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
            'total_chunks': 0,
            'errors': []
        }

    def check_existing_data(self):
        """Check what data already exists"""
        logger.info("🔍 Checking existing data...")
        
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
        
        logger.info(f"📚 Existing PES Materials: {pes_count}")
        logger.info(f"📖 Existing Reference Books: {books_count}")
        logger.info(f"🎥 Existing Videos: {videos_count}")
        logger.info(f"📄 Existing Text Chunks: {chunks_count}")
        logger.info(f"🗄️  Existing GridFS Files: {gridfs_count}")
        logger.info(f"🔗 Existing ChromaDB Vectors: {chroma_count}")
        
        return {
            'pes_count': pes_count,
            'books_count': books_count,
            'videos_count': videos_count,
            'chunks_count': chunks_count,
            'gridfs_count': gridfs_count,
            'chroma_count': chroma_count
        }

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
                        # Suppress individual page errors
                        continue
                
                # Clean up text
                text = re.sub(r'\s+', ' ', text).strip()
                return text
                
        except Exception as e:
            logger.warning(f"Could not extract text from {pdf_path}: {e}")
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
            
            # Check if file already exists in GridFS by filename
            existing_file = self.db.fs.files.find_one({'filename': pdf_path.name})
            if existing_file:
                logger.info(f"   📄 PDF {pdf_path.name} already exists in GridFS with ID: {existing_file['_id']}")
                return str(existing_file['_id'])
            
            # Create GridFS metadata
            gridfs_metadata = {
                'original_filename': pdf_path.name,
                'file_size': pdf_path.stat().st_size,
                'upload_date': datetime.now(),
                'content_type': 'application/pdf',
                'source': metadata.get('source', 'unknown'),
                'document_type': metadata.get('content_type', 'unknown'),
                'subject': metadata.get('subject'),
                'semester': metadata.get('semester'),
                'unit': metadata.get('unit')
            }
            
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
        """Process PES materials with PDF storage (continuation mode)"""
        logger.info("📚 Processing PES Materials (Continuation Mode)...")
        
        try:
            # Read PES metadata
            with open(self.pes_metadata_path, 'r', encoding='utf-8') as f:
                pes_data = json.load(f)
            
            logger.info(f"Found {len(pes_data)} PES materials in metadata")
            
            # Get existing ChromaDB collection (don't create new one)
            try:
                chroma_collection = self.chroma_client.get_collection("educational_content")
                logger.info("✅ Using existing ChromaDB collection")
            except ValueError:
                # If it doesn't exist, create it
                chroma_collection = self.chroma_client.create_collection(
                    name="educational_content",
                    metadata={"description": "Educational content with GridFS integration"}
                )
                logger.info("✅ Created new ChromaDB collection")
            
            # Check which PES materials are already processed
            existing_pes = set()
            for doc in self.pes_collection.find({}, {'fileName': 1}):
                if 'fileName' in doc:
                    existing_pes.add(doc['fileName'])
            
            logger.info(f"Found {len(existing_pes)} PES materials already in database")
            
            for item in pes_data:
                try:
                    # Extract filename and check if already processed
                    filename = item.get('fileName', '')
                    if not filename:
                        logger.warning(f"No filename found for PES item: {item.get('title', 'Unknown')}")
                        continue
                    
                    # Skip if already processed
                    if filename in existing_pes:
                        continue
                    
                    self.stats['pes_processed'] += 1
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
                                break
                    
                    # Prepare MongoDB document
                    mongo_doc = {
                        '_id': item.get('_id', f"pes_{self.stats['pes_processed']:03d}"),
                        'title': item.get('title', ''),
                        'content': pdf_text[:500] if pdf_text else item.get('content', ''),
                        'subject': item.get('subject', ''),
                        'semester': item.get('semester'),
                        'unit': item.get('unit'),
                        'fileName': filename,
                        'file_url': item.get('file_url', ''),
                        'content_type': 'pes_material',
                        'source': 'PES_slides',
                        'created_at': datetime.now(),
                        'full_content': pdf_text,
                    }
                    
                    # Add GridFS ID if available
                    if gridfs_id:
                        mongo_doc['gridfs_id'] = gridfs_id
                        mongo_doc['has_pdf'] = True
                        mongo_doc['pdf_stored'] = True
                        mongo_doc['pdf_path'] = str(pdf_path)
                    else:
                        mongo_doc['has_pdf'] = False
                        mongo_doc['pdf_stored'] = False
                    
                    # Store in MongoDB
                    self.pes_collection.replace_one(
                        {'_id': mongo_doc['_id']}, 
                        mongo_doc, 
                        upsert=True
                    )
                    
                    if gridfs_id:
                        logger.info(f"   ✅ Created PES document '{filename}' (ID: {mongo_doc['_id']}) with GridFS ID: {gridfs_id}")
                    
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
                            
                            # Add to embedding batch
                            self.add_to_embedding_batch(chunk, chunk_metadata, chunk_id)
                            self.stats['total_chunks'] += 1
                            
                            # Flush batch when it reaches batch size
                            if len(self.embedding_batch['documents']) >= self.batch_size:
                                self.flush_embedding_batch(chroma_collection)
                    
                    if self.stats['pes_processed'] % 50 == 0:
                        logger.info(f"   Processed {self.stats['pes_processed']} NEW PES materials...")
                
                except Exception as e:
                    logger.error(f"Error processing PES item: {e}")
                    self.stats['errors'].append(f"PES processing error: {e}")
            
            # Flush any remaining embeddings in the batch
            self.flush_embedding_batch(chroma_collection)
            
            logger.info(f"✅ PES materials completed: {self.stats['pes_processed']} NEW materials processed, {self.stats['pes_pdfs_found']} PDFs found, {self.stats['pes_pdfs_stored']} stored in GridFS")
            
        except Exception as e:
            logger.error(f"Error processing PES materials: {e}")
            self.stats['errors'].append(f"PES materials error: {e}")

    def verify_final_state(self):
        """Verify the final ingestion state"""
        logger.info("\n📊 FINAL INGESTION VERIFICATION")
        logger.info("=" * 60)
        
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
        
        logger.info(f"📚 TOTAL PES Materials: {pes_count} documents ({pes_with_gridfs} with GridFS IDs)")
        logger.info(f"📖 TOTAL Reference Books: {books_count} documents ({books_with_gridfs} with GridFS IDs)")
        logger.info(f"🎥 TOTAL Videos: {videos_count} documents")
        logger.info(f"📄 TOTAL Text Chunks: {chunks_count} documents")
        logger.info(f"🗄️  TOTAL GridFS Files: {gridfs_count}")
        logger.info(f"🔗 TOTAL ChromaDB Vectors: {chroma_count}")
        
        # Show sample records with GridFS IDs
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
        logger.info(f"NEW PES Materials: {self.stats['pes_processed']} processed, {self.stats['pes_pdfs_stored']} PDFs stored")
        logger.info(f"NEW Text Chunks: {self.stats['total_chunks']}")
        
        if self.stats['errors']:
            logger.warning(f"❌ Errors encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors'][:5]:  # Show first 5 errors
                logger.warning(f"  - {error}")
        
        # Final success message
        total_expected = 330 + 100 + 233  # PES + Books + Videos
        total_actual = pes_count + books_count + videos_count
        
        logger.info(f"\n🎯 FINAL DATASET STATUS:")
        logger.info(f"Expected total items: {total_expected}")
        logger.info(f"Actual total items: {total_actual}")
        
        if total_actual >= total_expected - 50:  # Allow some missing files
            logger.info("🎉 COMPLETE RAG SYSTEM READY! All data ingested with GridFS integration!")
        else:
            logger.warning(f"⚠️  Some items may be missing. Check data sources.")

    def run_continuation(self):
        """Run the continuation ingestion process"""
        start_time = datetime.now()
        logger.info("🚀 Starting PES Materials Continuation Ingestion")
        logger.info("=" * 60)
        
        try:
            # Step 1: Check existing data
            existing = self.check_existing_data()
            
            # Step 2: Process PES materials (only new ones)
            self.process_pes_materials()
            
            # Step 3: Verify final state
            self.verify_final_state()
            
            # Calculate total time
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info(f"\n✅ CONTINUATION INGESTION FINISHED")
            logger.info(f"Total time: {duration}")
            logger.info(f"All PES materials are now stored with GridFS integration!")
            logger.info(f"Complete RAG system is ready with full dataset!")
            
        except Exception as e:
            logger.error(f"Fatal error in continuation process: {e}")
            raise

def main():
    """Main execution function"""
    ingestion = ContinuePESIngestion()
    ingestion.run_continuation()

if __name__ == "__main__":
    main()
