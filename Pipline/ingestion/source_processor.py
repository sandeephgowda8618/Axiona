import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SourceDataProcessor:
    """Process the structured reference books data"""
    
    def __init__(self, source_file: str = "../Data/Refrence_books/Refrence_books"):
        # Get the absolute path relative to this file
        self.source_file = Path(__file__).parent / source_file
        
    def load_source_data(self) -> List[Dict[str, Any]]:
        """Load the structured reference books data"""
        try:
            with open(self.source_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Loaded {len(data)} structured book entries")
            return data
            
        except Exception as e:
            logger.error(f"Failed to load reference books data: {e}")
            return []
    
    def extract_book_metadata(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract and standardize metadata from structured books data"""
        processed_books = []
        
        for entry in data:
            # The data is already well-structured, just extract what we need
            book_metadata = {
                "id": entry.get("_id", f"book_{len(processed_books)}"),
                "title": entry.get("title", "Unknown Title"),
                "author": entry.get("author", "Unknown Author"), 
                "filename": entry.get("filename", ""),
                "file_path": entry.get("file_path", ""),
                "file_url": entry.get("file_url", ""),
                "file_size": entry.get("file_size", "Unknown"),
                "pages": entry.get("pages", 0),
                "subject": entry.get("subject", "Computer Science"),
                "category": entry.get("category", "Computer Science"),
                "difficulty": entry.get("difficulty", "Intermediate"),
                "language": entry.get("language", "English"),
                "format": entry.get("format", "PDF"),
                "key_concepts": entry.get("key_concepts", []),
                "description": entry.get("description", entry.get("summary", "")),
                "target_audience": entry.get("target_audience", "Students"),
                "prerequisites": entry.get("prerequisites", []),
                "tags": entry.get("tags", []),
                "content_preview": entry.get("content_preview", ""),
                "processed_at": entry.get("processed_at", ""),
                "source": entry.get("source", "GitHub")
            }
            
            processed_books.append(book_metadata)
        
        logger.info(f"Processed {len(processed_books)} book metadata entries")
        return processed_books
    
    def prepare_for_ingestion(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Prepare book data for ingestion into the RAG system"""
        
        # Load source data
        source_data = self.load_source_data()
        if not source_data:
            logger.error("No source data loaded")
            return []
        
        # Extract and process metadata
        processed_data = self.extract_book_metadata(source_data)
        
        # Apply limit if specified
        if limit:
            processed_data = processed_data[:limit]
            logger.info(f"Limited to {limit} books for processing")
        
        logger.info(f"Prepared {len(processed_data)} books for ingestion")
        return processed_data
    
    def get_download_urls(self, limit: Optional[int] = None) -> List[str]:
        """Get download URLs for PDF extraction"""
        prepared_data = self.prepare_for_ingestion(limit)
        urls = [entry["file_url"] for entry in prepared_data if entry.get("file_url")]
        return urls
    
    def get_book_info(self, index: Optional[int] = None) -> Dict[str, Any]:
        """Get book information by index"""
        source_data = self.load_source_data()
        
        if index is not None and 0 <= index < len(source_data):
            return source_data[index]
        
        return {}
    
    def get_books_by_subject(self, subject: str) -> List[Dict[str, Any]]:
        """Get books filtered by subject"""
        source_data = self.load_source_data()
        filtered_books = [
            book for book in source_data 
            if book.get("subject", "").lower() == subject.lower()
        ]
        logger.info(f"Found {len(filtered_books)} books for subject: {subject}")
        return filtered_books
    
    def get_books_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """Get books filtered by difficulty level"""
        source_data = self.load_source_data()
        filtered_books = [
            book for book in source_data 
            if book.get("difficulty", "").lower() == difficulty.lower()
        ]
        logger.info(f"Found {len(filtered_books)} books for difficulty: {difficulty}")
        return filtered_books
    
    def search_books(self, query: str, field: str = "title") -> List[Dict[str, Any]]:
        """Search books by a specific field"""
        source_data = self.load_source_data()
        query_lower = query.lower()
        
        matching_books = []
        for book in source_data:
            if field in book:
                field_value = str(book[field]).lower()
                if query_lower in field_value:
                    matching_books.append(book)
        
        logger.info(f"Found {len(matching_books)} books matching '{query}' in field '{field}'")
        return matching_books

if __name__ == "__main__":
    # Test the processor
    processor = SourceDataProcessor()
    
    # Load and show first few entries
    data = processor.load_source_data()
    print(f"Total books available: {len(data)}")
    
    if data:
        # Show first 3 books
        for i, book in enumerate(data[:3]):
            print(f"\n{i+1}. {book.get('title', 'Unknown Title')}")
            print(f"   Author: {book.get('author', 'Unknown Author')}")
            print(f"   Subject: {book.get('subject', 'Unknown Subject')}")
            print(f"   URL: {book.get('file_url', 'No URL')}")
        
        # Test subject filtering
        cs_books = processor.get_books_by_subject("Computer Science")
        print(f"\nFound {len(cs_books)} Computer Science books")
        
        # Test difficulty filtering
        beginner_books = processor.get_books_by_difficulty("Beginner")
        print(f"Found {len(beginner_books)} Beginner level books")
        
        # Test search
        python_books = processor.search_books("Python", "title")
        print(f"Found {len(python_books)} books with 'Python' in title")
        
        # Prepare for ingestion (first 5 books)
        prepared_data = processor.prepare_for_ingestion(limit=5)
        print(f"\nPrepared {len(prepared_data)} books for ingestion")
