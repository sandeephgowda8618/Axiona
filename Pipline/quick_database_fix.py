"""
Quick Database Analysis and Fix
==============================

Based on the investigation, we found critical issues:
1. Unit field is stored as string "1", "2", etc., not integer 1, 2
2. Subject field variations need better handling
3. Video collection exists but schema needs investigation

Let's create targeted fixes.
"""

import json
from config.database import db_manager
from config.settings import Settings

def analyze_and_fix():
    """Quick analysis and propose fixes"""
    
    db = db_manager.get_database()
    
    print("Quick Analysis Results:")
    print("=" * 50)
    
    # 1. Check unit field issue
    print("1. UNIT FIELD ANALYSIS:")
    pes_docs = list(db[Settings.MATERIALS_COLLECTION].find({}).limit(10))
    
    unit_examples = {}
    for doc in pes_docs:
        unit = doc.get("unit")
        unit_type = type(unit).__name__
        if unit_type not in unit_examples:
            unit_examples[unit_type] = []
        unit_examples[unit_type].append(unit)
    
    for unit_type, examples in unit_examples.items():
        print(f"  {unit_type}: {examples[:5]}")
    
    # 2. Check Operating Systems materials specifically
    print(f"\n2. OPERATING SYSTEMS MATERIALS:")
    
    # Try different unit type searches
    os_unit_string = list(db[Settings.MATERIALS_COLLECTION].find({
        "unit": "1", 
        "subject": {"$regex": "Operating", "$options": "i"}
    }))
    
    os_unit_int = list(db[Settings.MATERIALS_COLLECTION].find({
        "unit": 1,
        "subject": {"$regex": "Operating", "$options": "i"}
    }))
    
    print(f"  OS Unit '1' (string): {len(os_unit_string)} docs")
    print(f"  OS Unit 1 (int): {len(os_unit_int)} docs")
    
    if os_unit_string:
        print(f"  Example: {os_unit_string[0]['title']}")
    
    # 3. Check what caused cross-contamination
    print(f"\n3. CROSS-CONTAMINATION ANALYSIS:")
    
    # Test our problematic filter with correct unit type
    fixed_filter = {
        "$and": [
            {"unit": "1"},  # Use string instead of int!
            {"subject": {"$regex": "Operating", "$options": "i"}}
        ]
    }
    
    fixed_results = list(db[Settings.MATERIALS_COLLECTION].find(fixed_filter))
    print(f"  Fixed filter (unit='1'): {len(fixed_results)} docs")
    
    for doc in fixed_results:
        print(f"    - {doc['subject']}: {doc['title'][:60]}...")
    
    # 4. Check subjects that contain problematic keywords
    print(f"\n4. SUBJECT KEYWORD CONTAMINATION:")
    
    # Find subjects that contain "memory" (this likely caused the issue)
    memory_subjects = db[Settings.MATERIALS_COLLECTION].distinct("subject", {
        "title": {"$regex": "memory", "$options": "i"}
    })
    
    print(f"  Subjects with 'memory' in title: {memory_subjects}")
    
    # 5. Video collection check
    print(f"\n5. VIDEO COLLECTION CHECK:")
    video_count = db["videos"].count_documents({})
    print(f"  Total videos: {video_count}")
    
    if video_count > 0:
        sample_video = db["videos"].find_one({})
        print(f"  Sample video keys: {list(sample_video.keys())}")
        print(f"  Content type: {sample_video.get('content_type', 'Not set')}")
    
    return {
        "unit_field_type": "string",
        "os_materials_available": len(os_unit_string),
        "video_collection_exists": video_count > 0,
        "cross_contamination_cause": "keyword overlap in titles"
    }

def suggest_fixes():
    """Suggest specific fixes for the filtering issues"""
    
    print("\n" + "=" * 50)
    print("SUGGESTED FIXES:")
    print("=" * 50)
    
    print("""
1. UNIT FILTERING FIX:
   - Change: {"unit": phase_number} 
   - To:     {"unit": str(phase_number)}
   
2. SUBJECT FILTERING FIX:
   - Use exact subject matching first
   - Add negative filters to exclude irrelevant subjects
   - Example: {"subject": "Operating Systems"} (exact match)
   
3. KEYWORD FILTERING FIX:
   - Remove overly broad keywords like "memory", "system"
   - Use subject-specific keywords only
   - Add exclusion patterns
   
4. VIDEO SCHEMA FIX:
   - Use "videos" collection (exists with data)
   - Check and adapt to actual schema structure
   
5. ENHANCED QUERY STRUCTURE:
   {
     "unit": "1",                               # String, not int
     "subject": {"$regex": "^Operating", "$options": "i"},  # Starts with, more precise  
     "$and": [
       {"subject": {"$not": {"$regex": "Data|Database|Chemistry", "$options": "i"}}}
     ]
   }
""")

if __name__ == "__main__":
    analysis = analyze_and_fix()
    suggest_fixes()
    
    print(f"\nAnalysis Summary:")
    for key, value in analysis.items():
        print(f"  {key}: {value}")
