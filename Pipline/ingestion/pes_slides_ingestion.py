"""
PES Slides Data Ingestion System
=================================

This module handles the complete ingestion of PES slides data:
1. Parse PES_slides.txt structure (Semester → Subject → Materials)
2. Upload PDFs to GridFS
3. Store metadata in MongoDB with GridFS references
4. Create embeddings and store in ChromaDB
"""

import os
import re
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
import gridfs
from bson import ObjectId
import fitz  # PyMuPDF for PDF processing

from config.database import db_manager
from config.settings import Settings
from core.vector_db import vector_db
from core.embeddings import embedding_manager

logger = logging.getLogger(__name__)

class PESDataParser:
    """Parse PES slides text data into structured format"""
    
    def __init__(self):
        self.current_semester = None
        self.current_subject = None
        self.materials = []
        
    def parse_pes_slides_txt(self, file_path: str) -> Dict[str, Any]:
        """Parse the PES_slides.txt file into structured data"""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Split into sections
        sections = re.split(r'SEMESTER\s*–\s*(\d+)', content)[1:]  # Skip empty first element
        
        structured_data = {}
        
        for i in range(0, len(sections), 2):
            semester_num = sections[i].strip()
            semester_content = sections[i + 1] if i + 1 < len(sections) else ""
            
            semester_data = self._parse_semester_content(semester_num, semester_content)
            structured_data[f"sem{semester_num}"] = semester_data
        
        return structured_data
    
    def _parse_semester_content(self, semester_num: str, content: str) -> Dict[str, Any]:
        """Parse content of a semester"""
        semester_data = {
            "semester_number": int(semester_num),
            "semester_id": f"sem{semester_num}",
            "subjects": {}
        }
        
        # Split by subjects (lines that don't start with spaces)
        lines = content.strip().split('\n')
        current_subject = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this is a subject line (doesn't start with a number)
            if not re.match(r'^\s*\d+', line) and line:
                current_subject = line.strip()
                semester_data["subjects"][current_subject] = {
                    "subject_name": current_subject,
                    "subject_id": self._create_subject_id(current_subject),
                    "materials": []
                }
            elif current_subject and re.match(r'^\s*\d+', line):
                # This is a material line
                material = self._parse_material_line(line, semester_num, current_subject)
                if material:
                    semester_data["subjects"][current_subject]["materials"].append(material)
        
        return semester_data
    
    def _parse_material_line(self, line: str, semester_num: str, subject_name: str) -> Optional[Dict[str, Any]]:
        """Parse a material line like '255  Electrochemical Equilibria  →  Sem1_Chemistry_U2_Electrochemistry.pdf'"""
        # Match pattern: number + title + arrow + filename
        match = re.match(r'(\d+)\s+(.+?)\s+→\s+(.+)$', line.strip())
        if not match:
            return None
            
        material_id, title, filename = match.groups()
        
        # Extract unit info from filename
        unit_match = re.search(r'_U(\d+)', filename)
        unit = f"U{unit_match.group(1)}" if unit_match else "U1"
        
        # Determine file type
        file_type = filename.split('.')[-1].lower()
        
        return {
            "_id": f"mat_{material_id.zfill(3)}",
            "material_id": int(material_id),
            "title": title.strip(),
            "subject_name": subject_name,
            "subject_id": self._create_subject_id(subject_name),
            "semester_id": f"sem{semester_num}",
            "semester_number": int(semester_num),
            "unit": unit,
            "file_name": filename.strip(),
            "file_type": file_type,
            "topic": title.strip(),
            "tags": self._generate_tags(title, subject_name),
            "difficulty": self._estimate_difficulty(semester_num, unit),
            "language": "English",
            "source": "PES_University"
        }
    
    def _create_subject_id(self, subject_name: str) -> str:
        """Create a subject ID from name"""
        # Convert to lowercase and replace spaces/special chars
        subject_id = re.sub(r'[^a-zA-Z0-9]', '_', subject_name.lower())
        subject_id = re.sub(r'_+', '_', subject_id).strip('_')
        return subject_id
    
    def _generate_tags(self, title: str, subject: str) -> List[str]:
        """Generate tags from title and subject"""
        tags = [subject]
        
        # Add key terms from title
        title_words = re.findall(r'\w+', title.lower())
        important_words = [word for word in title_words if len(word) > 3]
        tags.extend(important_words[:3])  # Add up to 3 important words
        
        return list(set(tags))  # Remove duplicates
    
    def _estimate_difficulty(self, semester_num: str, unit: str) -> str:
        """Estimate difficulty based on semester and unit"""
        sem_num = int(semester_num)
        if sem_num <= 2:
            return "Beginner"
        elif sem_num <= 4:
            return "Intermediate"
        else:
            return "Advanced"

class PESIngestionPipeline:
    """Complete ingestion pipeline for PES slides"""
    
    def __init__(self):
        self.db = db_manager.get_database()
        self.fs = gridfs.GridFS(self.db)
        self.parser = PESDataParser()
        
        # Collections
        self.materials_collection = self.db[Settings.MATERIALS_COLLECTION]
        self.semesters_collection = self.db.get_collection("semesters")
        self.subjects_collection = self.db.get_collection("subjects")
        self.chunks_collection = self.db[Settings.CHUNKS_COLLECTION]
        
        # Ensure collections and indexes
        self._setup_collections()
    
    def _setup_collections(self):
        """Setup collections and indexes"""
        # Create semesters collection indexes
        self.semesters_collection.create_index("semester_number", unique=True)
        
        # Create subjects collection indexes
        self.subjects_collection.create_index([("semester_id", 1), ("subject_id", 1)], unique=True)
        
        # Create materials collection indexes
        self.materials_collection.create_index("semester_id")
        self.materials_collection.create_index("subject_id")
        self.materials_collection.create_index("unit")
        self.materials_collection.create_index([("semester_id", 1), ("subject_id", 1), ("unit", 1)])
        
        logger.info("Collections and indexes setup completed")
    
    async def ingest_pes_data(self, pes_txt_path: str, pes_slides_folder: str) -> Dict[str, Any]:
        """Complete PES data ingestion pipeline"""
        logger.info("Starting PES data ingestion...")
        
        stats = {
            "semesters": 0,
            "subjects": 0,
            "materials_processed": 0,
            "materials_uploaded": 0,
            "embeddings_created": 0,
            "errors": 0,
            "start_time": datetime.now()
        }
        
        try:
            # Step 1: Parse PES slides text data
            logger.info("Parsing PES slides data structure...")
            structured_data = self.parser.parse_pes_slides_txt(pes_txt_path)
            
            # Step 2: Process each semester
            for semester_id, semester_data in structured_data.items():
                await self._process_semester(semester_data, pes_slides_folder, stats)
            
            stats["end_time"] = datetime.now()
            stats["duration"] = (stats["end_time"] - stats["start_time"]).total_seconds()
            
            logger.info(f"PES data ingestion completed: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"PES data ingestion failed: {e}")
            stats["errors"] += 1
            return stats
    
    async def _process_semester(self, semester_data: Dict[str, Any], slides_folder: str, stats: Dict[str, Any]):
        """Process a complete semester"""
        # Insert/update semester document
        semester_doc = {
            "_id": semester_data["semester_id"],
            "semester_number": semester_data["semester_number"],
            "name": f"Semester {semester_data['semester_number']}",
            "display_name": f"Semester {semester_data['semester_number']}",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        self.semesters_collection.replace_one(
            {"_id": semester_doc["_id"]},
            semester_doc,
            upsert=True
        )
        stats["semesters"] += 1
        
        # Process subjects
        for subject_name, subject_data in semester_data["subjects"].items():
            await self._process_subject(subject_data, semester_data["semester_id"], slides_folder, stats)
    
    async def _process_subject(self, subject_data: Dict[str, Any], semester_id: str, slides_folder: str, stats: Dict[str, Any]):
        """Process a subject and its materials"""
        # Insert/update subject document
        subject_doc = {
            "_id": subject_data["subject_id"],
            "semester_id": semester_id,
            "subject_name": subject_data["subject_name"],
            "display_name": subject_data["subject_name"],
            "material_count": len(subject_data["materials"]),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        self.subjects_collection.replace_one(
            {"_id": subject_doc["_id"], "semester_id": semester_id},
            subject_doc,
            upsert=True
        )
        stats["subjects"] += 1
        
        # Process materials
        for material_data in subject_data["materials"]:
            await self._process_material(material_data, slides_folder, stats)
    
    async def _process_material(self, material_data: Dict[str, Any], slides_folder: str, stats: Dict[str, Any]):
        """Process a single material (PDF)"""
        stats["materials_processed"] += 1
        
        try:
            # Check if already processed
            existing = self.materials_collection.find_one({"_id": material_data["_id"]})
            if existing and existing.get("processing_status") == "completed":
                logger.info(f"Material {material_data['_id']} already processed, skipping...")
                return
            
            # Find the PDF file
            pdf_path = self._find_pdf_file(slides_folder, material_data["file_name"])
            if not pdf_path:
                logger.warning(f"PDF file not found for {material_data['file_name']}")
                stats["errors"] += 1
                return
            
            # Upload PDF to GridFS
            gridfs_id = await self._upload_to_gridfs(pdf_path, material_data)
            if not gridfs_id:
                stats["errors"] += 1
                return
            
            # Update material metadata with GridFS info
            material_data.update({
                "gridfs_id": gridfs_id,
                "file_url": f"/api/files/stream/{material_data['_id']}",
                "file_size": os.path.getsize(pdf_path),
                "processing_status": "completed",
                "embedding_status": "pending",
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            })
            
            # Extract page count and content
            try:
                doc = fitz.open(pdf_path)
                material_data["page_count"] = len(doc)
                
                # Extract text for the first page as preview
                if len(doc) > 0:
                    first_page_text = doc[0].get_text()[:500]
                    material_data["content_preview"] = first_page_text
                
                doc.close()
            except Exception as e:
                logger.warning(f"Could not extract PDF info for {pdf_path}: {e}")
                material_data["page_count"] = 0
                material_data["content_preview"] = ""
            
            # Insert/update material in MongoDB
            self.materials_collection.replace_one(
                {"_id": material_data["_id"]},
                material_data,
                upsert=True
            )
            
            stats["materials_uploaded"] += 1
            
            # Create embeddings and chunks
            await self._create_embeddings_and_chunks(pdf_path, material_data, stats)
            
            logger.info(f"Successfully processed material: {material_data['title']}")
            
        except Exception as e:
            logger.error(f"Error processing material {material_data.get('_id', 'unknown')}: {e}")
            stats["errors"] += 1
    
    def _find_pdf_file(self, slides_folder: str, filename: str) -> Optional[str]:
        """Find PDF file in the slides folder"""
        slides_path = Path(slides_folder)
        
        # Try direct match first
        direct_path = slides_path / filename
        if direct_path.exists():
            return str(direct_path)
        
        # Search recursively
        for pdf_file in slides_path.rglob("*.pdf"):
            if pdf_file.name == filename:
                return str(pdf_file)
        
        # Try similar matches (case insensitive)
        for pdf_file in slides_path.rglob("*.pdf"):
            if pdf_file.name.lower() == filename.lower():
                return str(pdf_file)
        
        return None
    
    async def _upload_to_gridfs(self, file_path: str, material_data: Dict[str, Any]) -> Optional[ObjectId]:
        """Upload file to GridFS"""
        try:
            with open(file_path, "rb") as file:
                gridfs_id = self.fs.put(
                    file,
                    filename=material_data["file_name"],
                    contentType="application/pdf",
                    metadata={
                        "material_id": material_data["_id"],
                        "title": material_data["title"],
                        "semester_id": material_data["semester_id"],
                        "subject_id": material_data["subject_id"],
                        "unit": material_data["unit"]
                    },
                    uploadDate=datetime.utcnow()
                )
            
            logger.info(f"Uploaded {material_data['file_name']} to GridFS with ID: {gridfs_id}")
            return gridfs_id
            
        except Exception as e:
            logger.error(f"Failed to upload {file_path} to GridFS: {e}")
            return None
    
    async def _create_embeddings_and_chunks(self, pdf_path: str, material_data: Dict[str, Any], stats: Dict[str, Any]):
        """Create embeddings and chunks for the PDF"""
        try:
            # Extract text from PDF
            doc = fitz.open(pdf_path)
            chunks = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                
                if text.strip():  # Only process pages with text
                    chunks.append({
                        "page_number": page_num + 1,
                        "text": text,
                        "chunk_type": "page"
                    })
            
            doc.close()
            
            if not chunks:
                logger.warning(f"No text extracted from {pdf_path}")
                return
            
            # Create embeddings and store in ChromaDB
            vector_documents = []
            chunk_documents = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{material_data['_id']}_chunk_{i:03d}"
                
                # Generate embedding
                embedding = embedding_manager.encode_text(chunk["text"])
                
                # Prepare for vector DB
                vector_documents.append({
                    "id": chunk_id,
                    "text": chunk["text"],
                    "metadata": {
                        "source_id": material_data["_id"],
                        "source_type": "material",
                        "semester_id": material_data["semester_id"],
                        "subject_id": material_data["subject_id"],
                        "unit": material_data["unit"],
                        "page_number": chunk["page_number"],
                        "title": material_data["title"]
                    },
                    "embedding": embedding
                })
                
                # Prepare chunk document for MongoDB
                chunk_documents.append({
                    "_id": chunk_id,
                    "source_id": material_data["_id"],
                    "source_type": "materials",
                    "gridfs_id": material_data["gridfs_id"],
                    "page_number": chunk["page_number"],
                    "chunk_text": chunk["text"][:3000],  # Limit text size
                    "token_count": len(chunk["text"].split()),
                    "embedding": embedding,
                    "metadata": {
                        "semester_id": material_data["semester_id"],
                        "subject_id": material_data["subject_id"],
                        "unit": material_data["unit"],
                        "title": material_data["title"]
                    },
                    "createdAt": datetime.utcnow()
                })
            
            # Add to ChromaDB
            if vector_documents:
                success = vector_db.add_documents("materials", vector_documents)
                if success:
                    stats["embeddings_created"] += len(vector_documents)
            
            # Store chunks in MongoDB
            if chunk_documents:
                self.chunks_collection.insert_many(chunk_documents)
            
            # Update material status
            self.materials_collection.update_one(
                {"_id": material_data["_id"]},
                {
                    "$set": {
                        "embedding_status": "completed",
                        "chunk_count": len(chunks),
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Created {len(chunks)} embeddings for {material_data['title']}")
            
        except Exception as e:
            logger.error(f"Error creating embeddings for {material_data['_id']}: {e}")
            # Mark as failed
            self.materials_collection.update_one(
                {"_id": material_data["_id"]},
                {"$set": {"embedding_status": "failed", "updatedAt": datetime.utcnow()}}
            )
            stats["errors"] += 1

# Global instance
pes_ingestion_pipeline = PESIngestionPipeline()
