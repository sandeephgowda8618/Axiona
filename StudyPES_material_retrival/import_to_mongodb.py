#!/usr/bin/env python3
"""
MongoDB Import Script for StudyPES Materials
Imports the generated metadata into MongoDB study-ai database
Maps to existing StudyMaterial schema
"""

import json
import pymongo
from pymongo import MongoClient
from datetime import datetime
import logging
import os
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StudyPESMongoImporter:
    def __init__(self, mongo_uri="mongodb://localhost:27017/", database_name="study-ai"):
        """Initialize MongoDB connection"""
        self.mongo_uri = mongo_uri
        self.database_name = database_name
        self.client = None
        self.db = None
        self.collection = None
        
        # Subject mapping from StudyPES to schema enum
        self.subject_mapping = {
            "Data Structures & Algorithms": "CS",
            "Data Structures and its Applications": "CS", 
            "Database Management Systems": "CS",
            "Computer Networks": "CS",
            "Operating Systems": "CS",
            "Software Engineering": "CS",
            "Design and Analysis of Algorithms": "CS",
            "Design, Analysis, and Algorithm": "CS",
            "Design Thinking": "CS",
            "Web Technology": "IT",
            "Machine Learning": "IT",
            "Data Analytics": "IT",
            "Automata & Formal Language Theory": "CS",
            "Automata Formal Language and Logic": "CS",
            "Automata Formal Languages & Logic": "CS",
            "Digital Design & Computer Organization": "Electronics",
            "Digital Design and Computer Organization": "Electronics",
            "DIGITAL DESIGN AND COMPUTER ORGANIZATION": "Electronics",
            "Electronic Principles & Devices": "Electronics",
            "Electronic Principles and Devices": "Electronics",
            "Electrical Engineering": "Electronics",
            "Electrical Machines": "Electronics",
            "Electrical and Electronics Engineering": "Electronics",
            "Mechanical Engineering": "Mechanical",
            "Mechanical Engineering Science": "Mechanical",
            "Engineering Mathematics - II": "Mathematics",
            "Engineering Mathematics – I": "Mathematics", 
            "Engineering Mathematics-II": "Mathematics",
            "Mathematics": "Mathematics",
            "Mathematics for Computer Science Engineers": "Mathematics",
            "Linear Algebra": "Mathematics",
            "Chemistry": "Chemistry",
            "Physics": "Physics",
            "Environmental Studies & Life Sciences": "Biology",
            "Environmental Studies and Life Sciences": "Biology",
            "Constitution of India": "General",
            "Innovation and Entrepreneurship": "General",
            "Essentials of Innovation and Entrepreneurship": "General"
        }
        
        # Class mapping from semester to year
        self.class_mapping = {
            1: "1st Year",
            2: "1st Year", 
            3: "2nd Year",
            4: "2nd Year",
            5: "3rd Year",
            6: "3rd Year",
            7: "4th Year",
            8: "4th Year"
        }
        
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.database_name]
            self.collection = self.db.studymaterials  # Collection name from schema
            
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {self.database_name}")
            logger.info(f"📊 Collection: studymaterials")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
        
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.database_name]
            self.collection = self.db.materials  # or whatever collection name you use
            
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {self.database_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def check_existing_data(self):
        """Check existing data in the collection"""
        try:
            count = self.collection.count_documents({})
            logger.info(f"📊 Current documents in collection: {count}")
            
            if count > 0:
                # Show a few sample documents
                sample = list(self.collection.find().limit(3))
                logger.info("📋 Sample existing documents:")
                for i, doc in enumerate(sample, 1):
                    logger.info(f"  {i}. {doc.get('title', 'No title')[:60]}...")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Error checking existing data: {e}")
            return 0
    
    def load_json_data(self, json_file_path):
        """Load data from JSON file"""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"📂 Loaded {len(data)} records from {json_file_path}")
            return data
            
        except Exception as e:
            logger.error(f"❌ Error loading JSON file: {e}")
            return []
    
    def prepare_document(self, record):
        """Prepare a document for MongoDB insertion"""
        # Add metadata fields
        document = {
            **record,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "source": "StudyPES_AI_Generated",
            "status": "active"
        }
        
        # Ensure required fields exist
        if "semester" not in document:
            document["semester"] = 1
        if "subject_key" not in document:
            document["subject_key"] = "GEN"
        if "unit" not in document:
            document["unit"] = "1"
        
        return document
    
    def import_data(self, json_file_path, batch_size=50):
        """Import data from JSON file to MongoDB"""
        try:
            # Load data
            data = self.load_json_data(json_file_path)
            if not data:
                return False
            
            # Check for duplicates (by fileName)
            existing_files = set()
            try:
                existing_docs = self.collection.find({}, {"fileName": 1})
                existing_files = {doc["fileName"] for doc in existing_docs if "fileName" in doc}
                logger.info(f"🔍 Found {len(existing_files)} existing files")
            except:
                pass
            
            # Prepare documents for insertion
            new_documents = []
            duplicates = 0
            
            for record in data:
                file_name = record.get("fileName", "")
                
                if file_name in existing_files:
                    duplicates += 1
                    continue
                
                document = self.prepare_document(record)
                new_documents.append(document)
            
            logger.info(f"📊 Statistics:")
            logger.info(f"  Total records in JSON: {len(data)}")
            logger.info(f"  Duplicates found: {duplicates}")
            logger.info(f"  New records to import: {len(new_documents)}")
            
            if not new_documents:
                logger.info("ℹ️ No new data to import")
                return True
            
            # Import in batches
            imported_count = 0
            failed_count = 0
            
            for i in range(0, len(new_documents), batch_size):
                batch = new_documents[i:i + batch_size]
                
                try:
                    result = self.collection.insert_many(batch)
                    imported_count += len(result.inserted_ids)
                    logger.info(f"✅ Imported batch {i//batch_size + 1}: {len(batch)} documents")
                    
                except Exception as e:
                    failed_count += len(batch)
                    logger.error(f"❌ Failed to import batch {i//batch_size + 1}: {e}")
            
            # Final summary
            logger.info("🎉 Import completed!")
            logger.info(f"✅ Successfully imported: {imported_count}")
            logger.info(f"❌ Failed to import: {failed_count}")
            logger.info(f"📊 Total documents in collection: {self.collection.count_documents({})}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error during import: {e}")
            return False
    
    def create_indexes(self):
        """Create useful indexes for the collection"""
        try:
            indexes = [
                ("fileName", 1),
                ("subject", 1),
                ("semester", 1),
                ("subject_key", 1),
                ("unit", 1),
                ("category", 1),
                ("tags", 1)
            ]
            
            for field, direction in indexes:
                try:
                    self.collection.create_index([(field, direction)])
                    logger.info(f"✅ Created index on: {field}")
                except Exception as e:
                    logger.warning(f"⚠️ Index creation failed for {field}: {e}")
            
        except Exception as e:
            logger.error(f"❌ Error creating indexes: {e}")
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("🔌 MongoDB connection closed")

def main():
    """Main import function"""
    importer = StudyPESMongoImporter()
    
    try:
        # Connect to MongoDB
        if not importer.connect():
            return
        
        # Check existing data
        existing_count = importer.check_existing_data()
        
        # Import new data
        json_file = "StudyPES_data.json"
        success = importer.import_data(json_file)
        
        if success:
            # Create indexes for better performance
            importer.create_indexes()
            
            # Final check
            final_count = importer.collection.count_documents({})
            new_records = final_count - existing_count
            logger.info(f"🎯 Import Summary:")
            logger.info(f"   Before: {existing_count} documents")
            logger.info(f"   After: {final_count} documents")
            logger.info(f"   New: {new_records} documents added")
        
    except Exception as e:
        logger.error(f"❌ Import failed: {e}")
    
    finally:
        importer.close()

if __name__ == "__main__":
    main()
