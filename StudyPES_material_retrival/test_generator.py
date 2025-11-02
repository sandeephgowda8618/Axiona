#!/usr/bin/env python3
"""
StudyPES Metadata Generator - Test Version (First 20 files)
"""

import os
import json
import fitz  # PyMuPDF
from datetime import datetime, timezone
import time
import re
from typing import Dict, List, Optional, Any
import requests

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "YOUR_GOOGLE_API_KEY_HERE")
GEMINI_MODEL = "models/gemini-2.0-flash"
MATERIALS_FOLDER = "materials"
OUTPUT_FILE = "StudyPES_data_test.json"
MAX_FILES = 20  # Limit for testing

# Subject mapping dictionary
SUBJECT_MAPPING = {
    "Chemistry": "Chemistry",
    "Physics": "Physics", 
    "DSA": "Data Structures & Algorithms",
    "AFLL": "Automata & Formal Language Theory",
    "Computer_Networks": "Computer Networks",
    "Operating_System": "Operating Systems",
    "DBMS": "Database Management Systems",
    "Linear_Algebra": "Linear Algebra",
    "Microprocessor_And_computer_Architecture": "Microprocessor & Architecture",
    "Data_Analytics": "Data Analytics",
    "EPD": "Electronic Product Design",
    "Mechanical": "Mechanical Engineering"
}

def parse_filename(filename: str) -> Optional[Dict[str, Any]]:
    """Parse filename according to pattern: Sem<semester>_<Subject>_U<unit>_<Topic>.pdf"""
    name_without_ext = filename.replace('.pdf', '')
    pattern = r'Sem(\d+)_([^_]+)_U(\d+)_(.+)'
    match = re.match(pattern, name_without_ext)
    
    if not match:
        return None
        
    semester = int(match.group(1))
    subject_key = match.group(2)
    unit_number = match.group(3)
    topic_raw = match.group(4)
    
    subject = SUBJECT_MAPPING.get(subject_key, subject_key)
    topic = topic_raw.replace('_', ' ')
    unit = f"Unit-{unit_number} : {topic}"
    title = f"{subject} - {unit}"
    file_url = f"/api/pdfs/{filename}"
    thumbnail = f"assets/thumbs/{subject.lower().replace(' ', '_').replace('&', 'and')}.svg"
    
    return {
        'fileName': filename,
        'fileUrl': file_url,
        'title': title,
        'shortTitle': topic,
        'subject': subject,
        'unit': unit,
        'semester': semester,
        'thumbnail': thumbnail
    }

def get_page_count(filepath: str) -> int:
    """Extract page count from PDF file."""
    try:
        doc = fitz.open(filepath)
        page_count = len(doc)
        doc.close()
        return page_count
    except Exception:
        return 0

def generate_simple_metadata(filename: str, subject: str, topic: str) -> Dict[str, Any]:
    """Generate simple metadata without AI for testing."""
    return {
        'description': f"Study notes for {subject} covering {topic}.",
        'summary': f"Covers {topic} concepts in {subject}.",
        'keyConcepts': [topic.lower().replace(' ', '_')],
        'tags': [topic.lower().replace(' ', ''), subject.lower().replace(' ', '')],
        'prerequisites': [],
        'difficulty': "Intermediate"
    }

def main():
    print("🚀 StudyPES Metadata Generator - Test Mode")
    print(f"📁 Processing max {MAX_FILES} files from: {MATERIALS_FOLDER}")
    print("-" * 60)
    
    if not os.path.exists(MATERIALS_FOLDER):
        print(f"❌ Materials folder not found: {MATERIALS_FOLDER}")
        return
    
    pdf_files = [f for f in os.listdir(MATERIALS_FOLDER) if f.endswith('.pdf')][:MAX_FILES]
    metadata_list = []
    processed = 0
    skipped = 0
    
    for i, filename in enumerate(pdf_files, 1):
        print(f"[{i}/{len(pdf_files)}] Processing: {filename}")
        
        parsed = parse_filename(filename)
        if not parsed:
            print(f"❌ Invalid filename format: {filename}")
            skipped += 1
            continue
        
        filepath = os.path.join(MATERIALS_FOLDER, filename)
        page_count = get_page_count(filepath)
        
        if page_count < 150:
            difficulty = "Beginner"
        elif page_count < 400:
            difficulty = "Intermediate"
        else:
            difficulty = "Advanced"
        
        # Generate simple metadata
        ai_metadata = generate_simple_metadata(filename, parsed['subject'], parsed['shortTitle'])
        
        current_time = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        
        metadata = {
            'fileName': parsed['fileName'],
            'fileUrl': parsed['fileUrl'],
            'title': parsed['title'],
            'shortTitle': parsed['shortTitle'],
            'authors': ["Unknown"],
            'subject': parsed['subject'],
            'unit': parsed['unit'],
            'semester': parsed['semester'],
            'pageCount': page_count,
            'difficulty': difficulty,
            'description': ai_metadata['description'],
            'summary': ai_metadata['summary'],
            'prerequisites': ai_metadata['prerequisites'],
            'keyConcepts': ai_metadata['keyConcepts'],
            'tags': ai_metadata['tags'],
            'thumbnail': parsed['thumbnail'],
            'views': 0,
            'downloads': 0,
            'lastAccessedAt': None,
            'uploadedAt': None,
            'indexedAt': current_time,
            'metadataVersion': 1
        }
        
        metadata_list.append(metadata)
        processed += 1
        print(f"✅ Processed: {filename} ({page_count} pages, {difficulty})")
    
    # Save results
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata_list, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"✅ Processed: {processed} files")
    print(f"⚠️  Skipped: {skipped} files")
    print(f"💾 Output: {OUTPUT_FILE}")
    print("🎉 Test complete!")

if __name__ == "__main__":
    main()
