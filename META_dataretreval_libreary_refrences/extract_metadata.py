import os
import json
import requests
import re
from typing import List, Dict, Any, Optional
from pathlib import Path
import PyPDF2
import pdfminer
from pdfminer.high_level import extract_text
from pdfminer.pdfparser import PDFSyntaxError
import pytesseract
from PIL import Image
import fitz  # PyMuPDF for PDF to image conversion
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFMetadataExtractor:
    """Handles file downloading, PDF parsing, OCR, and raw metadata extraction."""
    
    def __init__(self, download_folder: str = "github_refrences"):
        self.download_folder = Path(download_folder)
        self.download_folder.mkdir(exist_ok=True)
        
    def download_pdf(self, url: str, filename: str) -> Optional[str]:
        """Download PDF from GitHub URL"""
        try:
            logger.info(f"Downloading: {filename}")
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            file_path = self.download_folder / filename
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            file_size = os.path.getsize(file_path)
            logger.info(f"Downloaded {filename} ({file_size / (1024*1024):.1f} MB)")
            
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Failed to download {filename}: {e}")
            return None
    
    def extract_pdf_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from PDF file"""
        metadata = {
            "file_path": file_path,
            "filename": os.path.basename(file_path),
            "file_size": self._format_file_size(os.path.getsize(file_path)),
            "title": "",
            "author": "",
            "subject": "",
            "pages": 0,
            "content_preview": "",
            "format": "PDF",
            "processed_at": datetime.utcnow().isoformat() + "Z",
            "source": "GitHub"
        }
        
        try:
            # Try to extract using PyPDF2 first
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Basic metadata
                metadata["pages"] = len(pdf_reader.pages)
                
                # PDF info metadata
                if pdf_reader.metadata:
                    metadata["title"] = pdf_reader.metadata.get('/Title', '') or ""
                    metadata["author"] = pdf_reader.metadata.get('/Author', '') or ""
                    metadata["subject"] = pdf_reader.metadata.get('/Subject', '') or ""
                
                # Extract first page text for preview
                if len(pdf_reader.pages) > 0:
                    first_page = pdf_reader.pages[0]
                    text = first_page.extract_text()
                    metadata["content_preview"] = self._clean_text(text)[:500]
                
        except Exception as e:
            logger.warning(f"PyPDF2 failed for {file_path}, trying pdfminer: {e}")
            
            try:
                # Fallback to pdfminer
                text = extract_text(file_path)
                metadata["content_preview"] = self._clean_text(text)[:500]
                
                # Try to get page count with PyMuPDF
                doc = fitz.open(file_path)
                metadata["pages"] = doc.page_count
                doc.close()
                
            except Exception as e2:
                logger.warning(f"pdfminer also failed for {file_path}: {e2}")
                
                # Last resort: OCR
                metadata["content_preview"] = self._extract_with_ocr(file_path)
        
        # If no title found, derive from filename
        if not metadata["title"]:
            metadata["title"] = self._derive_title_from_filename(metadata["filename"])
        
        return metadata
    
    def _extract_with_ocr(self, file_path: str) -> str:
        """Extract text using OCR as last resort"""
        try:
            logger.info(f"Attempting OCR extraction for {file_path}")
            
            # Convert first page to image
            doc = fitz.open(file_path)
            page = doc[0]
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # OCR
            text = pytesseract.image_to_string(img)
            doc.close()
            
            return self._clean_text(text)[:500]
            
        except Exception as e:
            logger.error(f"OCR failed for {file_path}: {e}")
            return ""
    
    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove non-printable characters
        text = ''.join(char for char in text if char.isprintable() or char.isspace())
        
        return text
    
    def _derive_title_from_filename(self, filename: str) -> str:
        """Derive a readable title from filename"""
        # Remove extension
        title = os.path.splitext(filename)[0]
        
        # Replace common separators with spaces
        title = re.sub(r'[_\-\.]+', ' ', title)
        
        # Remove numbers and common prefixes
        title = re.sub(r'^(comp|book|pdf)?\(?\d+\)?', '', title, flags=re.IGNORECASE)
        
        # Capitalize words
        title = ' '.join(word.capitalize() for word in title.split())
        
        return title.strip()
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Format file size in human readable format"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024**2:
            return f"{size_bytes/1024:.1f} KB"
        elif size_bytes < 1024**3:
            return f"{size_bytes/(1024**2):.1f} MB"
        else:
            return f"{size_bytes/(1024**3):.1f} GB"
    
    def process_pdf_urls(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Process multiple PDF URLs and extract metadata"""
        results = []
        
        for i, url in enumerate(urls):
            try:
                # Generate filename from URL
                filename = f"book_{i+1:03d}.pdf"
                if url.split('/')[-1].endswith('.pdf'):
                    filename = url.split('/')[-1]
                
                # Download PDF
                file_path = self.download_pdf(url, filename)
                if not file_path:
                    continue
                
                # Extract metadata
                metadata = self.extract_pdf_metadata(file_path)
                metadata["file_url"] = url
                metadata["_id"] = f"pdf_{i+1:03d}"
                
                results.append(metadata)
                
            except Exception as e:
                logger.error(f"Failed to process {url}: {e}")
                continue
        
        return results

if __name__ == "__main__":
    # Test with a single URL
    extractor = PDFMetadataExtractor()
    
    test_urls = [
        "https://github.com/manjunath5496/Computer-Science-Reference-Books/blob/master/comp(1).pdf"
    ]
    
    results = extractor.process_pdf_urls(test_urls)
    
    for result in results:
        print(json.dumps(result, indent=2))
