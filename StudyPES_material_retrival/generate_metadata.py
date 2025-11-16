#!/usr/bin/env python3
"""
StudyPES Metadata Generator
Automatically generates metadata for university course PDFs using AI
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
OUTPUT_FILE = "StudyPES_data.json"

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
    "Data_Analytics": "Data Analytics"
}

class StudyPESMetadataGenerator:
    def __init__(self):
        """Initialize the metadata generator with AI configuration."""
        # Configure Google Gemini API
        self.api_key = GOOGLE_API_KEY
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL.replace('models/', '')}:generateContent"
        
        # Statistics
        self.processed_files = 0
        self.skipped_files = 0
        self.errors = []
        
        print("🚀 StudyPES Metadata Generator initialized")
        print(f"📁 Scanning folder: {MATERIALS_FOLDER}")
        print(f"📄 Output file: {OUTPUT_FILE}")
        print(f"🤖 AI Model: {GEMINI_MODEL}")
        print("-" * 60)

    def parse_filename(self, filename: str) -> Optional[Dict[str, Any]]:
        """
        Parse filename according to pattern: Sem<semester>_<Subject>_U<unit>_<Topic>.pdf
        Returns extracted metadata or None if parsing fails.
        """
        # Remove .pdf extension
        name_without_ext = filename.replace('.pdf', '')
        
        # Pattern: Sem1_Chemistry_U1_Spectroscopy
        pattern = r'Sem(\d+)_([^_]+)_U(\d+)_(.+)'
        match = re.match(pattern, name_without_ext)
        
        if not match:
            return None
            
        semester = int(match.group(1))
        subject_key = match.group(2)
        unit_number = match.group(3)
        topic_raw = match.group(4)
        
        # Map subject
        subject = SUBJECT_MAPPING.get(subject_key, subject_key)
        
        # Format topic (replace underscores with spaces)
        topic = topic_raw.replace('_', ' ')
        
        # Create unit string
        unit = f"Unit-{unit_number} : {topic}"
        
        # Create title
        title = f"{subject} - {unit}"
        
        # Create file URL
        file_url = f"/api/pdfs/{filename}"
        
        # Create thumbnail path
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

    def get_page_count(self, filepath: str) -> int:
        """Extract page count from PDF file."""
        try:
            doc = fitz.open(filepath)
            page_count = len(doc)
            doc.close()
            return page_count
        except Exception as e:
            print(f"⚠️  Could not read {filepath}: {e}")
            return 0

    def determine_difficulty(self, page_count: int) -> str:
        """Determine difficulty based on page count."""
        if page_count < 150:
            return "Beginner"
        elif page_count < 400:
            return "Intermediate"
        else:
            return "Advanced"

    def generate_ai_metadata(self, filename: str, subject: str, topic: str, unit: str, semester: int) -> Dict[str, Any]:
        """
        Generate AI metadata (description, summary, keyConcepts, tags, prerequisites) using Gemini API.
        """
        prompt = f"""You are a university-course metadata generator.
I will give you only a PDF filename that follows the pattern Sem<semester>_<Subject>_U<unit>_<Topic>.pdf.
You must guess the academic content from the filename and return only a flat JSON object with these keys:
{{ "description", "summary", "keyConcepts", "tags", "prerequisites", "difficulty" }}

Rules:
- description: 1 academic sentence (≤250 chars), no fluff.
- summary: 1 short student-friendly line (≤120 chars).
- keyConcepts: 3–6 concrete concepts students learn.
- tags: 3–6 lowercase single-word keywords, no spaces.
- prerequisites: up to 2 short phrases.
- difficulty: one of ["Beginner", "Intermediate", "Advanced"].

Filename: {filename}
Subject: {subject}
Topic: {topic}
Unit: {unit}
Semester: {semester}

Return only valid JSON, no other text."""

        try:
            # Prepare request payload
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 1,
                    "topP": 1,
                    "maxOutputTokens": 2048,
                }
            }
            
            headers = {
                "Content-Type": "application/json",
            }
            
            # Make API request
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"API request failed: {response.status_code} - {response.text}")
            
            response_data = response.json()
            
            # Extract generated text
            if 'candidates' in response_data and len(response_data['candidates']) > 0:
                candidate = response_data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    generated_text = candidate['content']['parts'][0]['text']
                else:
                    raise Exception("No content in API response")
            else:
                raise Exception("No candidates in API response")
            
            # Clean the response text
            response_text = generated_text.strip()
            
            # Remove any markdown code blocks
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Parse JSON
            ai_metadata = json.loads(response_text)
            
            # Validate required fields
            required_fields = ['description', 'summary', 'keyConcepts', 'tags', 'prerequisites', 'difficulty']
            for field in required_fields:
                if field not in ai_metadata:
                    ai_metadata[field] = self._get_default_value(field)
            
            return ai_metadata
            
        except Exception as e:
            print(f"⚠️  AI generation failed for {filename}: {e}")
            # Return default metadata
            return {
                'description': f"Study notes for {subject} covering {topic}.",
                'summary': f"Covers {topic} concepts in {subject}.",
                'keyConcepts': [topic.lower()],
                'tags': [topic.lower().replace(' ', '')],
                'prerequisites': [],
                'difficulty': "Intermediate"
            }

    def _get_default_value(self, field: str) -> Any:
        """Get default value for missing AI metadata fields."""
        defaults = {
            'description': "Academic course material.",
            'summary': "University study notes.",
            'keyConcepts': [],
            'tags': [],
            'prerequisites': [],
            'difficulty': "Intermediate"
        }
        return defaults.get(field, "")

    def process_pdf(self, filename: str) -> Optional[Dict[str, Any]]:
        """Process a single PDF file and return metadata."""
        filepath = os.path.join(MATERIALS_FOLDER, filename)
        
        # Parse filename
        parsed = self.parse_filename(filename)
        if not parsed:
            print(f"❌ Invalid filename format: {filename}")
            self.skipped_files += 1
            return None
        
        print(f"📄 Processing: {filename}")
        
        # Get page count
        page_count = self.get_page_count(filepath)
        
        # Determine difficulty from page count
        difficulty_from_pages = self.determine_difficulty(page_count)
        
        # Generate AI metadata
        ai_metadata = self.generate_ai_metadata(
            filename, 
            parsed['subject'], 
            parsed['shortTitle'], 
            parsed['unit'], 
            parsed['semester']
        )
        
        # Use AI difficulty if available, otherwise use page-based difficulty
        difficulty = ai_metadata.get('difficulty', difficulty_from_pages)
        
        # Current timestamp
        current_time = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        
        # Assemble complete metadata
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
            'description': ai_metadata.get('description', f"Study notes for {parsed['subject']} covering {parsed['shortTitle']}."),
            'summary': ai_metadata.get('summary', f"Covers {parsed['shortTitle']} concepts in {parsed['subject']}."),
            'prerequisites': ai_metadata.get('prerequisites', []),
            'keyConcepts': ai_metadata.get('keyConcepts', []),
            'tags': ai_metadata.get('tags', []),
            'thumbnail': parsed['thumbnail'],
            'views': 0,
            'downloads': 0,
            'lastAccessedAt': None,
            'uploadedAt': None,
            'indexedAt': current_time,
            'metadataVersion': 1
        }
        
        self.processed_files += 1
        print(f"✅ Processed: {filename} ({page_count} pages, {difficulty})")
        
        # Small delay to respect API rate limits
        time.sleep(0.5)
        
        return metadata

    def scan_and_process(self) -> List[Dict[str, Any]]:
        """Scan materials folder and process all PDF files."""
        if not os.path.exists(MATERIALS_FOLDER):
            print(f"❌ Materials folder not found: {MATERIALS_FOLDER}")
            return []
        
        # Get all PDF files
        pdf_files = [f for f in os.listdir(MATERIALS_FOLDER) if f.endswith('.pdf')]
        total_files = len(pdf_files)
        
        print(f"📚 Found {total_files} PDF files")
        print("-" * 60)
        
        metadata_list = []
        
        for i, filename in enumerate(pdf_files, 1):
            print(f"[{i}/{total_files}] ", end="")
            try:
                metadata = self.process_pdf(filename)
                if metadata:
                    metadata_list.append(metadata)
                
                # Save progress every 10 files
                if i % 10 == 0:
                    self.save_partial_json(metadata_list, f"StudyPES_data_partial_{i}.json")
                    print(f"💾 Saved partial progress: {i} files processed")
                    
            except KeyboardInterrupt:
                print(f"\n⚠️  Process interrupted at file {i}. Saving partial results...")
                self.save_partial_json(metadata_list, f"StudyPES_data_partial_{i}.json")
                break
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")
                self.errors.append(f"{filename}: {e}")
                self.skipped_files += 1
        
        return metadata_list

    def save_partial_json(self, metadata_list: List[Dict[str, Any]], filename: str) -> None:
        """Save partial metadata list to JSON file."""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(metadata_list, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"❌ Failed to save partial JSON: {e}")

    def save_json(self, metadata_list: List[Dict[str, Any]]) -> None:
        """Save metadata list to JSON file."""
        try:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(metadata_list, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved metadata to: {OUTPUT_FILE}")
        except Exception as e:
            print(f"❌ Failed to save JSON: {e}")

    def print_summary(self) -> None:
        """Print processing summary."""
        print("\n" + "=" * 60)
        print("📊 PROCESSING SUMMARY")
        print("=" * 60)
        print(f"✅ Successfully processed: {self.processed_files} files")
        print(f"⚠️  Skipped files: {self.skipped_files}")
        print(f"❌ Errors: {len(self.errors)}")
        
        if self.errors:
            print("\n🔍 Error Details:")
            for error in self.errors[:5]:  # Show first 5 errors
                print(f"  • {error}")
            if len(self.errors) > 5:
                print(f"  • ... and {len(self.errors) - 5} more errors")
        
        success_rate = (self.processed_files / (self.processed_files + self.skipped_files)) * 100 if (self.processed_files + self.skipped_files) > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        print(f"📄 Output File: {OUTPUT_FILE}")
        print("🎉 StudyPES metadata generation complete!")

def main():
    """Main function to run the metadata generator."""
    generator = StudyPESMetadataGenerator()
    
    # Process all PDFs
    metadata_list = generator.scan_and_process()
    
    # Save to JSON file
    if metadata_list:
        generator.save_json(metadata_list)
    else:
        print("❌ No valid metadata generated.")
    
    # Print summary
    generator.print_summary()

if __name__ == "__main__":
    main()
