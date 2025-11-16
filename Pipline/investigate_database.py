"""
Database Schema Investigation
===========================

Quick script to investigate the actual database schema and content
to understand why semantic filtering is not working correctly.
"""

import json
import logging
from config.database import db_manager
from config.settings import Settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def investigate_database_schema():
    """Investigate the actual database content and schema"""
    
    try:
        db = db_manager.get_database()
        
        print("Database Schema Investigation")
        print("=" * 50)
        
        # List all collections
        collections = db.list_collection_names()
        print(f"Available collections: {collections}")
        
        # Investigate PES materials
        print(f"\n=== PES MATERIALS INVESTIGATION ===")
        pes_collection = Settings.MATERIALS_COLLECTION
        print(f"Collection: {pes_collection}")
        
        # Sample documents
        pes_docs = list(db[pes_collection].find({}).limit(5))
        print(f"Total PES documents: {db[pes_collection].count_documents({})}")
        
        if pes_docs:
            print(f"\nSample PES document structure:")
            sample = pes_docs[0]
            for key in sample.keys():
                value = sample[key]
                if isinstance(value, str) and len(value) > 50:
                    value = value[:50] + "..."
                print(f"  {key}: {value} ({type(value).__name__})")
                
            print(f"\nSubjects found in PES collection:")
            subjects = db[pes_collection].distinct("subject")
            for subject in subjects[:10]:  # Show first 10
                count = db[pes_collection].count_documents({"subject": subject})
                print(f"  {subject}: {count} documents")
            
            print(f"\nUnits found in PES collection:")
            units = [doc["unit"] for doc in pes_docs if doc.get("unit") is not None]
            unique_units = list(set(units))
            print(f"  Available units (from sample): {sorted(unique_units) if unique_units else 'Mixed unit types'}")
            
            # Check unit data types
            unit_types = {}
            for doc in pes_docs:
                unit = doc.get("unit")
                unit_type = type(unit).__name__
                unit_types[unit_type] = unit_types.get(unit_type, 0) + 1
            print(f"  Unit data types: {unit_types}")
            
            # Check for Unit 1 OS materials specifically
            os_unit1 = list(db[pes_collection].find({
                "unit": 1,
                "subject": {"$regex": "Operating", "$options": "i"}
            }))
            print(f"\nOS Unit 1 materials: {len(os_unit1)}")
            for doc in os_unit1[:3]:
                print(f"  - {doc.get('title', 'No title')}")
        
        # Investigate reference books
        print(f"\n=== REFERENCE BOOKS INVESTIGATION ===")
        books_collection = Settings.BOOKS_COLLECTION 
        print(f"Collection: {books_collection}")
        
        books_count = db[books_collection].count_documents({})
        print(f"Total reference books: {books_count}")
        
        if books_count > 0:
            # Sample book
            sample_book = db[books_collection].find_one({})
            print(f"\nSample reference book structure:")
            for key in sample_book.keys():
                value = sample_book[key]
                if isinstance(value, str) and len(value) > 50:
                    value = value[:50] + "..."
                print(f"  {key}: {value} ({type(value).__name__})")
            
            # Check subjects/categories
            subjects = db[books_collection].distinct("subject")
            print(f"\nBook subjects: {subjects[:10]}")
            
            categories = db[books_collection].distinct("category") 
            print(f"Book categories: {categories[:10]}")
        
        # Investigate videos
        print(f"\n=== VIDEO CONTENT INVESTIGATION ===")
        video_collections = ["video_urls", "videos", "youtube_videos"]
        
        video_found = False
        for collection_name in video_collections:
            if collection_name in collections:
                video_count = db[collection_name].count_documents({})
                print(f"Collection '{collection_name}': {video_count} documents")
                
                if video_count > 0:
                    video_found = True
                    sample_video = db[collection_name].find_one({})
                    print(f"\nSample video structure from '{collection_name}':")
                    for key in sample_video.keys():
                        value = sample_video[key]
                        if isinstance(value, str) and len(value) > 50:
                            value = value[:50] + "..."
                        print(f"  {key}: {value} ({type(value).__name__})")
                    
                    # Check content types
                    content_types = db[collection_name].distinct("content_type")
                    print(f"Content types: {content_types}")
                    break
        
        if not video_found:
            print("No video collections found or all are empty")
        
        # Check specific filtering issues
        print(f"\n=== FILTERING ISSUE ANALYSIS ===")
        
        # Test the problematic query that returned mixed subjects
        problematic_filter = {
            "$and": [
                {"unit": 1},
                {"$or": [
                    {"subject": {"$regex": "Operating Systems", "$options": "i"}},
                    {"$or": [
                        {"pdf_path": {"$regex": "OS", "$options": "i"}},
                        {"pdf_path": {"$regex": "operating", "$options": "i"}}
                    ]},
                    {"$or": [
                        {"title": {"$regex": "operating|os|system|kernel|process|thread|memory|filesystem", "$options": "i"}},
                        {"key_concepts": {"$in": ["operating", "os", "system", "kernel", "process", "thread", "memory", "filesystem"]}}
                    ]}
                ]}
            ]
        }
        
        mixed_results = list(db[pes_collection].find(problematic_filter))
        print(f"\nProblematic query returned {len(mixed_results)} results:")
        
        for doc in mixed_results:
            title = doc.get("title", "No title")
            subject = doc.get("subject", "No subject")
            unit = doc.get("unit", "No unit")
            print(f"  Unit {unit} | {subject} | {title}")
        
        # Analyze why non-OS materials match
        print(f"\n=== CROSS-CONTAMINATION ANALYSIS ===")
        
        non_os_matches = [doc for doc in mixed_results if "Operating" not in doc.get("subject", "")]
        
        for doc in non_os_matches:
            title = doc.get("title", "")
            subject = doc.get("subject", "")
            concepts = doc.get("key_concepts", [])
            
            print(f"\nOff-topic match: {subject}")
            print(f"  Title: {title}")
            print(f"  Concepts: {concepts}")
            
            # Check which part of the filter matched
            matches = []
            if "memory" in title.lower():
                matches.append("'memory' in title")
            if "system" in title.lower():
                matches.append("'system' in title")
            
            print(f"  Likely matched on: {matches}")
        
    except Exception as e:
        logger.error(f"Investigation failed: {str(e)}")
        print(f"Error: {e}")

if __name__ == "__main__":
    investigate_database_schema()
