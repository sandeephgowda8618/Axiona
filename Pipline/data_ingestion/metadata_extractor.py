"""
Metadata Extraction Module for Pipeline RAG System

This module extracts metadata from PDF files and other documents,
combining PDF content extraction with AI-enhanced metadata generation.
"""

import os
import requests
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
import tempfile
import time
from urllib.parse import urlparse

from .source_processor import SourceDataProcessor
from .metadata_generator import MetadataGenerator
from utils.pdf_processor import PDFProcessor

logger = logging.getLogger(__name__)

class MetadataExtractor:
    """Extract and enhance metadata from PDF files and documents"""
    
    def __init__(self, use_ai: bool = True, download_timeout: int = 30):
        self.source_processor = SourceDataProcessor()
        self.metadata_generator = MetadataGenerator(use_ai=use_ai)
        self.pdf_processor = PDFProcessor()
        self.download_timeout = download_timeout
        
        # Create temp directory for downloads
        self.temp_dir = Path(tempfile.gettempdir()) / "pipeline_metadata_extraction"
        self.temp_dir.mkdir(exist_ok=True)
        
        logger.info("Initialized MetadataExtractor")
    
    def extract_from_source(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Extract metadata from all books in the source data"""
        
        # Get prepared source data
        source_entries = self.source_processor.prepare_for_extraction(limit=limit)
        
        if not source_entries:
            logger.error("No source entries to process")
            return []
        
        extracted_metadata = []
        total = len(source_entries)
        
        logger.info(f"Starting metadata extraction for {total} entries")
        
        for i, entry in enumerate(source_entries, 1):
            logger.info(f"Processing {i}/{total}: {entry.get('pdf_name', 'Unknown')}")
            
            try:
                metadata = self.extract_from_entry(entry)
                if metadata:
                    extracted_metadata.append(metadata)
                    logger.info(f"Successfully extracted metadata for: {entry.get('pdf_name')}")
                else:
                    logger.warning(f"Failed to extract metadata for: {entry.get('pdf_name')}")
                    
            except Exception as e:
                logger.error(f"Error processing {entry.get('pdf_name')}: {e}")
                continue
            
            # Add delay between downloads to be respectful
            if i < total:
                time.sleep(1)
        
        logger.info(f"Completed metadata extraction: {len(extracted_metadata)}/{total} successful")
        return extracted_metadata
    
    def extract_from_entry(self, entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract metadata from a single source entry"""
        
        url = entry.get("download_url", "")
        filename = entry.get("pdf_name", "")
        
        if not url or not filename:
            logger.warning(f"Missing URL or filename for entry: {entry}")
            return None
        
        # Create initial metadata from source entry
        base_metadata = {
            "filename": filename,
            "source_url": url,
            "original_url": entry.get("original_url", url),
            "processing_id": entry.get("processing_id"),
            "file_type": "pdf",
            "source": "reference_books"
        }
        
        # Try to download and extract content
        try:
            pdf_metadata = self._extract_pdf_metadata(url, filename)
            if pdf_metadata:
                base_metadata.update(pdf_metadata)
            else:
                # If PDF extraction fails, create minimal metadata
                base_metadata.update({
                    "title": self._extract_title_from_filename(filename),
                    "content_preview": "",
                    "page_count": 0,
                    "file_size": 0
                })
            
            # Enhance with AI/rule-based metadata
            enhanced_metadata = self.metadata_generator.enhance_metadata(base_metadata)
            
            return enhanced_metadata
            
        except Exception as e:
            logger.error(f"Failed to extract metadata from {url}: {e}")
            return None
    
    def _extract_pdf_metadata(self, url: str, filename: str) -> Optional[Dict[str, Any]]:
        """Download PDF and extract metadata"""
        
        temp_file = None
        try:
            # Download PDF to temp file
            temp_file = self._download_file(url, filename)
            if not temp_file or not temp_file.exists():
                logger.warning(f"Failed to download PDF from {url}")
                return None
            
            # Extract metadata using PDFProcessor
            pdf_metadata = self.pdf_processor.extract_text_from_pdf(str(temp_file))
            
            # Add download information
            pdf_metadata["downloaded_size"] = temp_file.stat().st_size
            pdf_metadata["download_success"] = True
            
            return pdf_metadata
            
        except Exception as e:
            logger.error(f"Error extracting PDF metadata from {url}: {e}")
            return None
        finally:
            # Clean up temp file
            if temp_file and temp_file.exists():
                try:
                    temp_file.unlink()
                except Exception as e:
                    logger.warning(f"Failed to clean up temp file {temp_file}: {e}")
    
    def _download_file(self, url: str, filename: str) -> Optional[Path]:
        """Download file to temporary location"""
        
        try:
            # Create safe filename
            safe_filename = "".join(c for c in filename if c.isalnum() or c in ".-_")
            temp_file = self.temp_dir / safe_filename
            
            # Download with timeout
            response = requests.get(url, timeout=self.download_timeout, stream=True)
            response.raise_for_status()
            
            # Save to temp file
            with open(temp_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.debug(f"Downloaded {url} to {temp_file}")
            return temp_file
            
        except requests.RequestException as e:
            logger.warning(f"Failed to download {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error downloading {url}: {e}")
            return None
    
    def _extract_title_from_filename(self, filename: str) -> str:
        """Extract a readable title from filename"""
        
        # Remove extension
        title = Path(filename).stem
        
        # Replace common separators with spaces
        title = title.replace("_", " ").replace("-", " ").replace(".", " ")
        
        # Clean up multiple spaces
        title = " ".join(title.split())
        
        # Capitalize words
        title = " ".join(word.capitalize() for word in title.split())
        
        return title
    
    def save_metadata(self, metadata_list: List[Dict[str, Any]], output_file: str) -> None:
        """Save extracted metadata to JSON file"""
        
        import json
        
        try:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(metadata_list, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(metadata_list)} metadata entries to {output_path}")
            
        except Exception as e:
            logger.error(f"Failed to save metadata to {output_file}: {e}")
    
    def get_extraction_stats(self, metadata_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get statistics about the extraction process"""
        
        stats = {
            "total_processed": len(metadata_list),
            "successful_downloads": 0,
            "subjects": {},
            "difficulty_levels": {},
            "total_pages": 0,
            "average_file_size": 0
        }
        
        total_size = 0
        
        for metadata in metadata_list:
            if metadata.get("download_success"):
                stats["successful_downloads"] += 1
            
            subject = metadata.get("subject", "Unknown")
            stats["subjects"][subject] = stats["subjects"].get(subject, 0) + 1
            
            difficulty = metadata.get("difficulty", "Unknown")
            stats["difficulty_levels"][difficulty] = stats["difficulty_levels"].get(difficulty, 0) + 1
            
            stats["total_pages"] += metadata.get("page_count", 0)
            file_size = metadata.get("downloaded_size", 0)
            total_size += file_size
        
        if stats["total_processed"] > 0:
            stats["average_file_size"] = total_size / stats["total_processed"]
        
        return stats

if __name__ == "__main__":
    # Test the metadata extractor
    extractor = MetadataExtractor(use_ai=False)  # Test without AI first
    
    # Extract metadata from first 3 books
    logger.info("Testing metadata extraction...")
    metadata_list = extractor.extract_from_source(limit=3)
    
    # Print results
    print(f"\nExtracted metadata for {len(metadata_list)} books:")
    for metadata in metadata_list:
        print(f"\nTitle: {metadata.get('title', 'Unknown')}")
        print(f"Subject: {metadata.get('subject', 'Unknown')}")
        print(f"Difficulty: {metadata.get('difficulty', 'Unknown')}")
        print(f"Key Concepts: {', '.join(metadata.get('key_concepts', []))}")
    
    # Save results
    if metadata_list:
        output_file = "/Users/sandeeph/Documents/s2/Axiona/Pipline/Data/extracted_metadata.json"
        extractor.save_metadata(metadata_list, output_file)
        
        # Show stats
        stats = extractor.get_extraction_stats(metadata_list)
        print(f"\nExtraction Statistics:")
        print(f"Total Processed: {stats['total_processed']}")
        print(f"Successful Downloads: {stats['successful_downloads']}")
        print(f"Subjects: {stats['subjects']}")
        print(f"Difficulty Levels: {stats['difficulty_levels']}")
