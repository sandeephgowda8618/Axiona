import fitz  # PyMuPDF
import os
from typing import List, Dict, Any, Tuple
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class PDFProcessor:
    """Processes PDF files for text extraction and metadata"""
    
    def __init__(self):
        pass
    
    def extract_text_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract text and metadata from PDF file"""
        try:
            if not os.path.exists(file_path):
                logger.error(f"PDF file not found: {file_path}")
                return {}
            
            # Open PDF
            doc = fitz.open(file_path)
            
            # Extract basic metadata
            metadata = {
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "creator": doc.metadata.get("creator", ""),
                "producer": doc.metadata.get("producer", ""),
                "creation_date": doc.metadata.get("creationDate", ""),
                "modification_date": doc.metadata.get("modDate", ""),
                "page_count": doc.page_count,
                "file_size": os.path.getsize(file_path)
            }
            
            # Extract text from all pages
            pages_text = []
            full_text = ""
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                page_text = page.get_text()
                pages_text.append({
                    "page_number": page_num + 1,
                    "text": page_text,
                    "char_count": len(page_text),
                    "word_count": len(page_text.split())
                })
                full_text += f"\n{page_text}"
            
            doc.close()
            
            # Calculate statistics
            total_chars = len(full_text)
            total_words = len(full_text.split())
            
            result = {
                "metadata": metadata,
                "full_text": full_text.strip(),
                "pages": pages_text,
                "statistics": {
                    "total_characters": total_chars,
                    "total_words": total_words,
                    "average_words_per_page": total_words / doc.page_count if doc.page_count > 0 else 0
                }
            }
            
            logger.info(f"Extracted text from PDF: {Path(file_path).name}, {doc.page_count} pages")
            return result
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF {file_path}: {e}")
            return {}
    
    def extract_text_by_pages(self, file_path: str, start_page: int = 1, 
                             end_page: int = None) -> str:
        """Extract text from specific page range"""
        try:
            doc = fitz.open(file_path)
            
            if end_page is None:
                end_page = doc.page_count
            
            # Adjust for 0-based indexing
            start_idx = max(0, start_page - 1)
            end_idx = min(doc.page_count, end_page)
            
            text = ""
            for page_num in range(start_idx, end_idx):
                page = doc[page_num]
                text += f"\n{page.get_text()}"
            
            doc.close()
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error extracting pages {start_page}-{end_page} from {file_path}: {e}")
            return ""
    
    def get_pdf_info(self, file_path: str) -> Dict[str, Any]:
        """Get basic PDF information without extracting full text"""
        try:
            doc = fitz.open(file_path)
            
            info = {
                "filename": Path(file_path).name,
                "page_count": doc.page_count,
                "file_size": os.path.getsize(file_path),
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "creation_date": doc.metadata.get("creationDate", ""),
                "is_encrypted": doc.needs_pass,
                "is_pdf": True
            }
            
            doc.close()
            return info
            
        except Exception as e:
            logger.error(f"Error getting PDF info for {file_path}: {e}")
            return {"is_pdf": False, "error": str(e)}
    
    def validate_pdf(self, file_path: str) -> bool:
        """Check if file is a valid PDF"""
        try:
            doc = fitz.open(file_path)
            is_valid = doc.page_count > 0
            doc.close()
            return is_valid
        except:
            return False
    
    def extract_images_info(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract information about images in the PDF"""
        try:
            doc = fitz.open(file_path)
            images_info = []
            
            for page_num in range(doc.page_count):
                page = doc[page_num]
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    images_info.append({
                        "page": page_num + 1,
                        "image_index": img_index,
                        "xref": img[0],
                        "smask": img[1],
                        "width": img[2],
                        "height": img[3],
                        "bpc": img[4],  # bits per component
                        "colorspace": img[5],
                        "alt": img[6],
                        "name": img[7],
                        "filter": img[8]
                    })
            
            doc.close()
            return images_info
            
        except Exception as e:
            logger.error(f"Error extracting image info from {file_path}: {e}")
            return []
