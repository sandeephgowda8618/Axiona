#!/usr/bin/env python3
"""
Update MongoDB with Enhanced Metadata
Updates existing MongoDB books with enhanced metadata from the JSON file
"""

import os
import sys
import json
import asyncio
import logging
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MongoDBEnhancedMetadataUpdater:
    def __init__(self):
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/study-ai')
        self.mongodb_client = None
        self.db = None
        self.stats = {
            "total_processed": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0
        }
        
    async def initialize(self):
        """Initialize MongoDB connection"""
        try:
            self.mongodb_client = AsyncIOMotorClient(self.mongodb_uri)
            self.db = self.mongodb_client['study-ai']
            await self.mongodb_client.admin.command('ping')
            logger.info("✅ Connected to MongoDB")
            return True
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            return False
    
    def load_enhanced_metadata(self) -> List[Dict[str, Any]]:
        """Load enhanced metadata from JSON file"""
        try:
            json_path = "../META_dataretreval/batch_output/final_metadata_20251101_223839.json"
            
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"📚 Loaded {len(data)} enhanced metadata entries")
            return data
            
        except Exception as e:
            logger.error(f"❌ Error loading enhanced metadata: {e}")
            return []
    
    async def update_book_metadata(self, enhanced_book: Dict[str, Any]) -> bool:
        """Update a single book with enhanced metadata"""
        try:
            # Match by file_url since that's the primary identifier
            file_url = enhanced_book.get('file_url')
            if not file_url:
                logger.warning(f"⚠️  No file_url for {enhanced_book.get('filename', 'unknown')}")
                return False
            
            # Prepare update data with enhanced fields
            update_data = {}
            
            # Enhanced metadata fields
            if enhanced_book.get('key_concepts'):
                update_data['key_concepts'] = enhanced_book['key_concepts']
            
            if enhanced_book.get('difficulty'):
                update_data['difficulty'] = enhanced_book['difficulty']
                
            if enhanced_book.get('summary'):
                update_data['summary'] = enhanced_book['summary']
                
            if enhanced_book.get('target_audience'):
                update_data['target_audience'] = enhanced_book['target_audience']
                
            if enhanced_book.get('prerequisites'):
                update_data['prerequisites'] = enhanced_book['prerequisites']
            
            # Also update title and author if they're missing or empty
            if enhanced_book.get('title') and enhanced_book['title'].strip():
                update_data['title'] = enhanced_book['title']
                
            if enhanced_book.get('author') and enhanced_book['author'].strip():
                update_data['author'] = enhanced_book['author']
            
            # Only update if we have enhanced data
            if not update_data:
                logger.info(f"⏭️  No enhanced metadata for {enhanced_book.get('filename', 'unknown')}")
                self.stats["skipped"] += 1
                return True
            
            # Update the book in MongoDB
            books_collection = self.db['books']
            result = await books_collection.update_one(
                {"file_url": file_url},
                {"$set": update_data}
            )
            
            if result.matched_count > 0:
                if result.modified_count > 0:
                    logger.info(f"✅ Updated: {enhanced_book.get('title', enhanced_book.get('filename', 'unknown'))}")
                    self.stats["updated"] += 1
                else:
                    logger.info(f"⏭️  No changes needed: {enhanced_book.get('title', enhanced_book.get('filename', 'unknown'))}")
                    self.stats["skipped"] += 1
                return True
            else:
                logger.warning(f"⚠️  Book not found in MongoDB: {enhanced_book.get('filename', 'unknown')}")
                self.stats["failed"] += 1
                return False
                
        except Exception as e:
            logger.error(f"❌ Error updating {enhanced_book.get('filename', 'unknown')}: {e}")
            self.stats["failed"] += 1
            return False
    
    async def run_update(self):
        """Run the complete update process"""
        logger.info("🚀 Starting MongoDB Enhanced Metadata Update...")
        
        try:
            # Initialize
            if not await self.initialize():
                return False
            
            # Load enhanced metadata
            enhanced_books = self.load_enhanced_metadata()
            if not enhanced_books:
                logger.error("❌ No enhanced metadata found")
                return False
            
            # Process each book
            self.stats["total_processed"] = len(enhanced_books)
            
            for i, enhanced_book in enumerate(enhanced_books, 1):
                logger.info(f"📖 Processing {i}/{len(enhanced_books)}: {enhanced_book.get('filename', 'unknown')}")
                await self.update_book_metadata(enhanced_book)
                
                # Small delay to avoid overwhelming the database
                await asyncio.sleep(0.1)
            
            # Final summary
            logger.info("\n📊 MongoDB Enhanced Metadata Update Summary:")
            logger.info(f"📚 Total books processed: {self.stats['total_processed']}")
            logger.info(f"✅ Successfully updated: {self.stats['updated']}")
            logger.info(f"⏭️  Skipped (no changes): {self.stats['skipped']}")
            logger.info(f"❌ Failed to update: {self.stats['failed']}")
            
            success_rate = (self.stats['updated'] / self.stats['total_processed']) * 100 if self.stats['total_processed'] > 0 else 0
            logger.info(f"📈 Update rate: {success_rate:.1f}%")
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Update process failed: {e}")
            return False
        finally:
            if self.mongodb_client:
                self.mongodb_client.close()

async def main():
    """Main function"""
    updater = MongoDBEnhancedMetadataUpdater()
    success = await updater.run_update()
    
    if success:
        logger.info("🎉 MongoDB enhanced metadata update completed successfully!")
    else:
        logger.error("💥 MongoDB enhanced metadata update failed!")
        
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
