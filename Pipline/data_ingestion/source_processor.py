"""
Source Data Processing Module for Pipeline RAG System

This module handles the processing of source book data, converting URLs,
and preparing data for metadata extraction and ingestion into the RAG system.
"""

import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SourceDataProcessor:
    """Process the cleaned source data and convert to metadata format"""
    
    def __init__(self, source_file: Optional[str] = None):
        # Default to looking for books_data.json in Pipeline/Data directory
        if source_file is None:
            pipeline_root = Path(__file__).parent.parent
            source_file = str(pipeline_root / "Data" / "books_data.json")
        
        self.source_file = Path(source_file)
        
        if not self.source_file.exists():
            logger.warning(f"Source file not found at {self.source_file}")
        
    def load_source_data(self) -> List[Dict[str, str]]:
        """Load the cleaned source data from JSON file"""
        try:
            if not self.source_file.exists():
                logger.error(f"Source file not found: {self.source_file}")
                return []
                
            with open(self.source_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Loaded {len(data)} book entries from source data")
            return data
            
        except Exception as e:
            logger.error(f"Failed to load source data: {e}")
            return []
    
    def convert_github_urls(self, data: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Convert GitHub blob URLs to raw download URLs"""
        converted = []
        
        for entry in data:
            converted_entry = entry.copy()
            
            # Convert GitHub blob URL to raw URL
            url = entry.get("url", "")
            if "github.com" in url and "blob" in url:
                # Convert from: https://github.com/user/repo/blob/master/file.pdf
                # To: https://github.com/user/repo/raw/master/file.pdf
                raw_url = url.replace("/blob/", "/raw/")
                converted_entry["url"] = raw_url
                converted_entry["download_url"] = raw_url
                converted_entry["original_url"] = url
                logger.debug(f"Converted GitHub URL: {url} -> {raw_url}")
            else:
                converted_entry["download_url"] = url
                converted_entry["original_url"] = url
            
            converted.append(converted_entry)
        
        logger.info(f"Converted {len(converted)} entries with GitHub URLs")
        return converted
    
    def prepare_for_extraction(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Prepare book data for metadata extraction"""
        
        # Load source data
        source_data = self.load_source_data()
        if not source_data:
            logger.error("No source data loaded")
            return []
        
        # Convert URLs
        converted_data = self.convert_github_urls(source_data)
        
        # Apply limit if specified
        if limit:
            converted_data = converted_data[:limit]
            logger.info(f"Limited to {limit} books for processing")
        
        # Add processing metadata
        for i, entry in enumerate(converted_data):
            entry["processing_id"] = str(i)
            entry["status"] = "pending"
            
        logger.info(f"Prepared {len(converted_data)} entries for extraction")
        return converted_data
    
    def get_book_info(self, index: Optional[int] = None) -> Dict[str, Any]:
        """Get book information by index"""
        source_data = self.load_source_data()
        
        if index is not None and 0 <= index < len(source_data):
            return source_data[index]
        
        return {}
    
    def get_download_urls(self, limit: Optional[int] = None) -> List[str]:
        """Get list of download URLs for processing"""
        prepared_data = self.prepare_for_extraction(limit=limit)
        return [entry.get("download_url", "") for entry in prepared_data if entry.get("download_url")]
    
    def validate_source_data(self) -> Dict[str, Any]:
        """Validate the source data and return statistics"""
        source_data = self.load_source_data()
        
        if not source_data:
            return {"valid": False, "error": "No data loaded"}
        
        stats = {
            "total_entries": len(source_data),
            "valid_urls": 0,
            "github_urls": 0,
            "missing_fields": [],
            "sample_entries": source_data[:3] if source_data else []
        }
        
        required_fields = ["pdf_name", "url"]
        
        for entry in source_data:
            # Check for valid URL
            if entry.get("url"):
                stats["valid_urls"] += 1
                if "github.com" in entry["url"]:
                    stats["github_urls"] += 1
            
            # Check for missing required fields
            for field in required_fields:
                if not entry.get(field):
                    if field not in stats["missing_fields"]:
                        stats["missing_fields"].append(field)
        
        stats["valid"] = stats["valid_urls"] > 0
        return stats

if __name__ == "__main__":
    # Test the processor
    processor = SourceDataProcessor()
    
    # Validate source data
    validation = processor.validate_source_data()
    print("Source Data Validation:", json.dumps(validation, indent=2))
    
    if validation["valid"]:
        # Prepare URLs for extraction (first 5 books)
        prepared_data = processor.prepare_for_extraction(limit=5)
        print(f"\nPrepared {len(prepared_data)} entries for extraction")
        
        # Show sample entries
        for entry in prepared_data[:3]:
            print(f"\nBook: {entry.get('pdf_name', 'Unknown')}")
            print(f"Download URL: {entry.get('download_url', 'None')}")
