#!/usr/bin/env python3
"""
Enhanced GridFS Ingestion with Metadata Linking
==============================================
This script:
1. Reads existing metadata from JSON and MongoDB
2. Stores actual PDF files in GridFS
3. Links GridFS IDs to metadata documents
4. Updates both MongoDB and ChromaDB with complete metadata
"""

import pymongo
import gridfs
import chromadb
import json
import hashlib
from pathlib import Path
from datetime import datetime
import PyPDF2
import io
import os

class EnhancedGridFSIngestion:
    def __init__(self):
        # MongoDB setup
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client.educational_content
        self.fs = gridfs.GridFS(self.db)
        
        # ChromaDB setup
        self.chroma_client = chromadb.PersistentClient(path="./chromadb")
        
        # Collections
        self.pes_collection = self.db.pes_materials
        self.books_collection = self.db.reference_books
        self.videos_collection = self.db.videos
        
        # Data paths
        self.pes_data_file = Path("./Data/PES_materials/PES_slides.json")
        self.books_metadata_file = Path("./Data/Refrence_books/Refrence_books")
        self.books_pdf_dir = Path("./Data/Refrence_books/Refrence_books_pdf")
        
        print("🚀 Enhanced GridFS Ingestion System Initialized")
    
    def get_pdf_metadata(self, pdf_path):
        """Extract metadata from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                metadata = {
                    'page_count': len(pdf_reader.pages),
                    'file_size': os.path.getsize(pdf_path),
                    'creation_date': datetime.now(),
                }
                
                # Try to get PDF metadata
                if pdf_reader.metadata:
                    pdf_info = pdf_reader.metadata
                    if pdf_info.title:
                        metadata['pdf_title'] = pdf_info.title
                    if pdf_info.author:
                        metadata['pdf_author'] = pdf_info.author
                    if pdf_info.creator:
                        metadata['pdf_creator'] = pdf_info.creator
                
                return metadata
        except Exception as e:
            print(f"   ⚠️ Could not extract PDF metadata: {e}")
            return {'file_size': os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0}
    
    def store_pdf_in_gridfs(self, pdf_path, filename, metadata=None):
        """Store PDF file in GridFS and return the GridFS ID"""
        try:
            with open(pdf_path, 'rb') as pdf_file:
                # Create comprehensive metadata for GridFS
                gridfs_metadata = {
                    'content_type': 'application/pdf',
                    'upload_date': datetime.now(),
                    'original_path': str(pdf_path),
                    'file_hash': hashlib.md5(pdf_file.read()).hexdigest()
                }
                
                # Add additional metadata if provided
                if metadata:
                    gridfs_metadata.update(metadata)
                
                # Reset file pointer
                pdf_file.seek(0)
                
                # Store in GridFS
                gridfs_id = self.fs.put(
                    pdf_file,
                    filename=filename,
                    metadata=gridfs_metadata
                )
                
                print(f"   ✅ Stored {filename} in GridFS with ID: {gridfs_id}")
                return gridfs_id
                
        except Exception as e:
            print(f"   ❌ Failed to store {filename} in GridFS: {e}")
            return None
    
    def enhance_pes_materials_with_gridfs(self):
        """Enhance PES materials metadata with GridFS IDs"""
        print("\n📚 ENHANCING PES MATERIALS WITH GRIDFS")
        print("=" * 50)
        
        if not self.pes_data_file.exists():
            print("❌ PES slides JSON file not found!")
            return
        
        # Load PES data
        with open(self.pes_data_file, 'r', encoding='utf-8') as f:
            pes_data = json.load(f)
        
        print(f"📖 Found {len(pes_data)} PES materials")
        
        # Check for PDF files directory (assuming they exist somewhere)
        # For now, we'll simulate the process and add filename info
        
        updated_count = 0
        for i, item in enumerate(pes_data):
            doc_id = f"pes_{i:03d}"
            
            # Get existing document from MongoDB
            existing_doc = self.pes_collection.find_one({"_id": doc_id})
            if not existing_doc:
                continue
            
            # Prepare enhanced metadata
            enhanced_metadata = existing_doc.copy()
            
            # Add filename information from original JSON
            if 'fileName' in item:
                enhanced_metadata['filename'] = item['fileName']
            if 'file_url' in item:
                enhanced_metadata['file_url'] = item['file_url']
            
            # Simulate PDF storage (since actual PDFs might not be available)
            # In a real scenario, you'd check if the PDF exists and store it
            pdf_filename = item.get('fileName', f"pes_{i:03d}.pdf")
            
            # For demonstration, create a placeholder GridFS ID
            # In real implementation, you'd store the actual PDF
            gridfs_id = None
            
            # Check if PDF exists in a potential directory
            potential_pdf_path = Path(f"./Data/PES_materials/pdfs/{pdf_filename}")
            if potential_pdf_path.exists():
                pdf_metadata = self.get_pdf_metadata(potential_pdf_path)
                gridfs_id = self.store_pdf_in_gridfs(
                    potential_pdf_path, 
                    pdf_filename,
                    pdf_metadata
                )
            
            # Add GridFS ID to metadata (even if None for now)
            enhanced_metadata['gridfs_id'] = gridfs_id
            enhanced_metadata['has_pdf_file'] = gridfs_id is not None
            enhanced_metadata['last_updated'] = datetime.now()
            
            # Update MongoDB
            self.pes_collection.replace_one({"_id": doc_id}, enhanced_metadata)
            updated_count += 1
            
            if (i + 1) % 50 == 0:
                print(f"   📝 Updated {i + 1}/{len(pes_data)} PES materials")
        
        print(f"✅ Enhanced {updated_count} PES materials with filename metadata")
    
    def enhance_books_with_gridfs(self):
        """Enhance reference books metadata with actual GridFS storage"""
        print("\n📖 ENHANCING REFERENCE BOOKS WITH GRIDFS")
        print("=" * 50)
        
        if not self.books_pdf_dir.exists():
            print("❌ Reference books PDF directory not found!")
            return
        
        # Get list of PDF files
        pdf_files = list(self.books_pdf_dir.glob("*.pdf"))
        print(f"📁 Found {len(pdf_files)} PDF files")
        
        updated_count = 0
        gridfs_stored_count = 0
        
        # Get existing books from MongoDB
        existing_books = list(self.books_collection.find())
        print(f"📚 Found {len(existing_books)} books in MongoDB")
        
        for book_doc in existing_books:
            book_id = book_doc['_id']
            
            # Try to find matching PDF file
            # Strategy 1: Look for book_xxx.pdf pattern
            pdf_filename = f"{book_id}.pdf"
            pdf_path = self.books_pdf_dir / pdf_filename
            
            # Strategy 2: Look for comp(xxx).pdf pattern if book_xxx.pdf doesn't exist
            if not pdf_path.exists():
                book_number = book_id.replace('book_', '')
                if book_number.isdigit():
                    comp_filename = f"comp({book_number}).pdf"
                    comp_path = self.books_pdf_dir / comp_filename
                    if comp_path.exists():
                        pdf_path = comp_path
                        pdf_filename = comp_filename
            
            # Enhanced metadata
            enhanced_metadata = book_doc.copy()
            enhanced_metadata['filename'] = pdf_filename
            enhanced_metadata['last_updated'] = datetime.now()
            
            # Store PDF in GridFS if found
            gridfs_id = None
            if pdf_path.exists():
                print(f"   📄 Processing: {pdf_filename}")
                
                # Get PDF metadata
                pdf_metadata = self.get_pdf_metadata(pdf_path)
                pdf_metadata.update({
                    'book_title': book_doc.get('title', ''),
                    'book_author': book_doc.get('author', ''),
                    'book_subject': book_doc.get('subject', ''),
                    'book_id': book_id
                })
                
                # Store in GridFS
                gridfs_id = self.store_pdf_in_gridfs(pdf_path, pdf_filename, pdf_metadata)
                if gridfs_id:
                    gridfs_stored_count += 1
            else:
                print(f"   ⚠️ PDF not found for {book_id}: {pdf_filename}")
            
            # Add GridFS info to metadata
            enhanced_metadata['gridfs_id'] = gridfs_id
            enhanced_metadata['has_pdf_file'] = gridfs_id is not None
            enhanced_metadata['pdf_path'] = str(pdf_path) if pdf_path.exists() else None
            
            # Update MongoDB
            self.books_collection.replace_one({"_id": book_id}, enhanced_metadata)
            updated_count += 1
        
        print(f"✅ Enhanced {updated_count} books metadata")
        print(f"📁 Stored {gridfs_stored_count} PDFs in GridFS")
    
    def update_chromadb_with_gridfs_metadata(self):
        """Update ChromaDB vectors with enhanced metadata including GridFS IDs"""
        print("\n🔗 UPDATING CHROMADB WITH GRIDFS METADATA")
        print("=" * 50)
        
        try:
            # Get or create ChromaDB collection
            try:
                collection = self.chroma_client.get_collection("educational_content")
            except:
                collection = self.chroma_client.create_collection("educational_content")
            
            # Clear existing vectors to refresh with enhanced metadata
            collection.delete()
            collection = self.chroma_client.create_collection("educational_content")
            
            total_added = 0
            
            # Process each MongoDB collection
            collections_to_process = [
                (self.pes_collection, "pes_material"),
                (self.books_collection, "reference_book"),
                (self.videos_collection, "youtube_video")
            ]
            
            for mongo_collection, content_type in collections_to_process:
                print(f"   🔄 Processing {content_type}s...")
                
                documents = list(mongo_collection.find())
                
                for doc in documents:
                    # Prepare metadata for ChromaDB
                    metadata = {
                        'content_type': content_type,
                        'id': doc['_id'],
                        'title': doc.get('title', ''),
                        'subject': doc.get('subject', ''),
                        'created_at': str(doc.get('created_at', '')),
                        'filename': doc.get('filename', ''),
                        'has_pdf_file': doc.get('has_pdf_file', False),
                        'last_updated': str(doc.get('last_updated', ''))
                    }
                    
                    # Add GridFS ID if present
                    if doc.get('gridfs_id'):
                        metadata['gridfs_id'] = str(doc['gridfs_id'])
                    
                    # Add content type specific metadata
                    if content_type == "pes_material":
                        metadata.update({
                            'semester': str(doc.get('semester', '')),
                            'unit': str(doc.get('unit', ''))
                        })
                    elif content_type == "reference_book":
                        metadata.update({
                            'author': doc.get('author', ''),
                            'summary': doc.get('summary', '')[:200] + '...' if len(doc.get('summary', '')) > 200 else doc.get('summary', '')
                        })
                    elif content_type == "youtube_video":
                        metadata.update({
                            'url': doc.get('url', ''),
                            'duration': str(doc.get('duration', ''))
                        })
                    
                    # Add to ChromaDB
                    collection.add(
                        ids=[doc['_id']],
                        metadatas=[metadata],
                        documents=[doc.get('content', doc.get('summary', doc.get('title', '')))]
                    )
                    
                    total_added += 1
                
                print(f"   ✅ Added {len(documents)} {content_type}s to ChromaDB")
            
            print(f"🔗 Total documents added to ChromaDB: {total_added}")
            
        except Exception as e:
            print(f"❌ Failed to update ChromaDB: {e}")
    
    def verify_enhanced_metadata(self):
        """Verify the enhanced metadata with GridFS IDs"""
        print("\n🔍 VERIFYING ENHANCED METADATA")
        print("=" * 50)
        
        # Check MongoDB
        collections_info = [
            (self.pes_collection, "PES Materials"),
            (self.books_collection, "Reference Books"),
            (self.videos_collection, "Videos")
        ]
        
        total_with_gridfs = 0
        total_documents = 0
        
        for collection, name in collections_info:
            count = collection.count_documents({})
            gridfs_count = collection.count_documents({"gridfs_id": {"$exists": True, "$ne": None}})
            filename_count = collection.count_documents({"filename": {"$exists": True}})
            
            print(f"📊 {name}:")
            print(f"   Total: {count}")
            print(f"   With filenames: {filename_count}")
            print(f"   With GridFS IDs: {gridfs_count}")
            
            # Show sample enhanced document
            sample = collection.find_one({"gridfs_id": {"$exists": True}})
            if sample:
                print(f"   Sample with GridFS: {sample['_id']} -> GridFS ID: {sample.get('gridfs_id')}")
            
            total_documents += count
            total_with_gridfs += gridfs_count
            print()
        
        # Check GridFS
        gridfs_count = self.db.fs.files.count_documents({})
        print(f"📁 Total GridFS files: {gridfs_count}")
        
        # Check ChromaDB
        try:
            collection = self.chroma_client.get_collection("educational_content")
            chroma_count = collection.count()
            print(f"🔗 ChromaDB vectors: {chroma_count}")
            
            # Test search with GridFS metadata
            results = collection.query(
                query_texts=["data structures"],
                n_results=2,
                include=['metadatas']
            )
            
            print(f"🔍 Sample search results with metadata:")
            metadatas = results.get('metadatas', [[]])
            if metadatas and metadatas[0]:
                for i, metadata in enumerate(metadatas[0]):
                    print(f"   Result {i+1}: {metadata}")
            else:
                print("   No metadata found in search results")
            
        except Exception as e:
            print(f"❌ ChromaDB verification failed: {e}")
        
        print(f"\n📈 SUMMARY:")
        print(f"   MongoDB documents: {total_documents}")
        print(f"   Documents with GridFS IDs: {total_with_gridfs}")
        print(f"   GridFS files stored: {gridfs_count}")
    
    def run_enhanced_ingestion(self):
        """Run the complete enhanced ingestion process"""
        print("🚀 STARTING ENHANCED GRIDFS INGESTION")
        print("=" * 60)
        print(f"📅 Timestamp: {datetime.now()}")
        
        # Step 1: Enhance PES materials
        self.enhance_pes_materials_with_gridfs()
        
        # Step 2: Enhance reference books with actual GridFS storage
        self.enhance_books_with_gridfs()
        
        # Step 3: Update ChromaDB with enhanced metadata
        self.update_chromadb_with_gridfs_metadata()
        
        # Step 4: Verify everything
        self.verify_enhanced_metadata()
        
        print("\n🎉 ENHANCED GRIDFS INGESTION COMPLETE!")

def main():
    """Main function"""
    ingestion = EnhancedGridFSIngestion()
    ingestion.run_enhanced_ingestion()

if __name__ == "__main__":
    main()
