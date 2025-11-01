import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SourceDataProcessor:
    """Process the cleaned source data and convert to metadata format"""
    
    def __init__(self, source_file: str = "books_data.json"):
        self.source_file = Path(source_file)
        
    def load_source_data(self) -> List[Dict[str, str]]:
        """Load the cleaned source data from JSON file"""
        try:
            with open(self.source_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Loaded {len(data)} book entries from source data")
            return data
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
            
            converted.append(converted_entry)
        
        return converted
    
    def prepare_for_extraction(self, limit: Optional[int] = None) -> List[str]:
        """Prepare URLs for metadata extraction"""
        
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
        
        # Extract URLs
        urls = [entry["url"] for entry in converted_data if entry.get("url")]
        
        logger.info(f"Prepared {len(urls)} URLs for extraction")
        return urls
    
    def get_book_info(self, index: Optional[int] = None) -> Dict[str, Any]:
        """Get book information by index"""
        source_data = self.load_source_data()
        
        if index is not None and 0 <= index < len(source_data):
            return source_data[index]
        
        return {}

if __name__ == "__main__":
    # Test the processor
    processor = SourceDataProcessor()
    
    # Load and show first few entries
    data = processor.load_source_data()
    print(f"Total books available: {len(data)}")
    
    # Show first 3 books
    for i, book in enumerate(data[:3]):
        print(f"\n{i+1}. {book['pdf_name']}")
        print(f"   URL: {book['url']}")
    
    # Prepare URLs for extraction (first 5 books)
    urls = processor.prepare_for_extraction(limit=5)
    print(f"\nPrepared {len(urls)} URLs for extraction")
