#!/usr/bin/env python3
"""
Debug Reference Books Ingestion
Find out why only 5 books are being processed instead of 100
"""

import json
import pymongo
import gridfs
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def debug_reference_books_ingestion():
    """Debug the reference books ingestion process"""
    
    logger.info("🔍 DEBUGGING REFERENCE BOOKS INGESTION")
    logger.info("=" * 60)
    
    # Read metadata
    books_metadata_path = Path("Data/Refrence_books/Refrence_books")
    
    try:
        with open(books_metadata_path, 'r', encoding='utf-8') as f:
            books_data = json.load(f)
        
        logger.info(f"✅ Loaded {len(books_data)} books from metadata")
        
        # Check the data structure
        logger.info(f"\n📋 Sample of first 10 books:")
        for i, book in enumerate(books_data[:10], 1):
            logger.info(f"   {i}. Title: {book.get('title', 'No title')[:50]}...")
            logger.info(f"      ID: {book.get('_id', 'No ID')}")
            logger.info(f"      Filename: {book.get('filename', 'No filename')}")
            logger.info(f"      Author: {book.get('author', 'No author')}")
            logger.info("")
        
        # Check ID patterns
        ids = [book.get('_id') for book in books_data]
        unique_ids = set(ids)
        
        logger.info(f"🆔 ID Analysis:")
        logger.info(f"   Total books: {len(books_data)}")
        logger.info(f"   Total IDs: {len(ids)}")
        logger.info(f"   Unique IDs: {len(unique_ids)}")
        
        if len(ids) != len(unique_ids):
            logger.warning(f"   ⚠️  DUPLICATE IDs DETECTED!")
            
            # Find duplicates
            seen = set()
            duplicates = set()
            for book_id in ids:
                if book_id in seen:
                    duplicates.add(book_id)
                seen.add(book_id)
            
            logger.warning(f"   Duplicate IDs: {duplicates}")
        
        # Check filenames
        filenames = [book.get('filename') for book in books_data]
        unique_filenames = set(filenames)
        
        logger.info(f"\n📁 Filename Analysis:")
        logger.info(f"   Total filenames: {len(filenames)}")
        logger.info(f"   Unique filenames: {len(unique_filenames)}")
        
        if len(filenames) != len(unique_filenames):
            logger.warning(f"   ⚠️  DUPLICATE FILENAMES DETECTED!")
        
        # Check PDF availability
        books_pdfs_path = Path("Data/Refrence_books/Refrence_books_pdf")
        available_pdfs = set(f.name for f in books_pdfs_path.glob("*.pdf"))
        
        logger.info(f"\n📄 PDF Availability:")
        logger.info(f"   Available PDFs: {len(available_pdfs)}")
        
        missing_pdfs = []
        found_pdfs = []
        
        for book in books_data:
            filename = book.get('filename', '')
            if filename in available_pdfs:
                found_pdfs.append(filename)
            else:
                missing_pdfs.append(filename)
        
        logger.info(f"   PDFs found for books: {len(found_pdfs)}")
        logger.info(f"   PDFs missing: {len(missing_pdfs)}")
        
        if missing_pdfs:
            logger.warning(f"   Missing PDFs (first 10): {missing_pdfs[:10]}")
        
        # Simulate the ingestion logic to see what would happen
        logger.info(f"\n🔄 Simulating Ingestion Process:")
        
        # Connect to MongoDB
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client.educational_content
        books_collection = db.reference_books
        
        # Clear collection for fresh test
        books_collection.delete_many({})
        logger.info(f"   Cleared existing documents")
        
        # Process books one by one
        processed_count = 0
        
        for i, book in enumerate(books_data, 1):
            book_id = book.get('_id', f"book_{i:03d}")
            filename = book.get('filename', '')
            title = book.get('title', '')
            
            # Create document (simplified version)
            mongo_doc = {
                '_id': book_id,
                'title': title,
                'filename': filename,
                'content_type': 'reference_book',
                'source': 'reference_books'
            }
            
            try:
                # Use replace_one like in the original script
                result = books_collection.replace_one(
                    {'_id': book_id}, 
                    mongo_doc, 
                    upsert=True
                )
                
                processed_count += 1
                
                if i <= 10 or i % 20 == 0:
                    logger.info(f"   Processed book {i}: {title[:40]}... (ID: {book_id})")
                
            except Exception as e:
                logger.error(f"   Error processing book {i}: {e}")
        
        # Check final count
        final_count = books_collection.count_documents({})
        
        logger.info(f"\n📊 FINAL RESULTS:")
        logger.info(f"   Books in source: {len(books_data)}")
        logger.info(f"   Books processed: {processed_count}")
        logger.info(f"   Books in database: {final_count}")
        
        if final_count != len(books_data):
            logger.error(f"   ❌ MISMATCH: Expected {len(books_data)} but got {final_count}")
            
            # Show what's actually in the database
            logger.info(f"   📋 Books actually in database:")
            for doc in books_collection.find({}, {"_id": 1, "title": 1}):
                logger.info(f"      - {doc.get('_id')}: {doc.get('title', 'No title')[:50]}...")
        else:
            logger.info(f"   ✅ SUCCESS: All books processed correctly")
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error in debug process: {e}")

if __name__ == "__main__":
    debug_reference_books_ingestion()
