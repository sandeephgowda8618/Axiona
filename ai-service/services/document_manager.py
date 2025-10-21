"""
Document manager service for StudySpace AI platform.
Handles document uploading, storage, and tracking of processing status.
"""
import json
import shutil
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class DocumentManager:
    """Manages the lifecycle of documents for the RAG pipeline in StudySpace."""
    
    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = Path(storage_dir or os.getenv("STORAGE_DIR", "./storage/documents"))
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.docs_file = self.storage_dir / "uploaded_docs.json"
        self.documents = self._load_documents()

    def _load_documents(self) -> Dict:
        """Loads document metadata from a JSON file."""
        if self.docs_file.exists():
            try:
                with open(self.docs_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Ensure backward compatibility for the is_indexed flag
                    for doc_info in data.values():
                        doc_info.setdefault('is_indexed', False)
                    return data
            except Exception as e:
                logger.error(f"Error loading documents metadata: {e}")
                return {}
        return {}

    def _save_documents(self):
        """Saves the current document metadata to the JSON file."""
        try:
            with open(self.docs_file, 'w', encoding='utf-8') as f:
                json.dump(self.documents, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving documents metadata: {e}")

    def upload_document(self, file_path: str, title: Optional[str] = None, user_id: Optional[str] = None) -> Optional[str]:
        """
        Copies a document to storage and records its metadata.
        Returns document ID if successful, None otherwise.
        """
        source_path = Path(file_path)
        if not source_path.exists():
            logger.error(f"File not found at {file_path}")
            return None

        # Create unique document ID
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        doc_id = f"doc_{timestamp}_{source_path.stem}"
        stored_path = self.storage_dir / f"{doc_id}{source_path.suffix}"

        try:
            shutil.copy2(source_path, stored_path)
            self.documents[doc_id] = {
                "title": title or source_path.name,
                "stored_file": str(stored_path),
                "file_type": source_path.suffix.lower(),
                "size": source_path.stat().st_size,
                "upload_date": datetime.now().isoformat(),
                "user_id": user_id,
                "is_indexed": False
            }
            self._save_documents()
            logger.info(f"Document uploaded successfully: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            return None

    def get_document_info(self, doc_id: str) -> Optional[Dict]:
        """Get information about a specific document."""
        return self.documents.get(doc_id)

    def list_documents(self, user_id: Optional[str] = None) -> List[Dict]:
        """
        Returns list of all uploaded documents.
        If user_id is provided, filters to that user's documents.
        """
        documents = []
        for doc_id, doc_info in self.documents.items():
            if user_id and doc_info.get('user_id') != user_id:
                continue
            
            doc_data = {
                "id": doc_id,
                "title": doc_info['title'],
                "file_type": doc_info['file_type'],
                "size": doc_info['size'],
                "upload_date": doc_info['upload_date'],
                "is_indexed": doc_info.get('is_indexed', False),
                "user_id": doc_info.get('user_id')
            }
            documents.append(doc_data)
        
        return documents

    def delete_document(self, doc_id: str) -> bool:
        """Delete a document and its metadata."""
        if doc_id not in self.documents:
            return False
        
        try:
            # Remove the physical file
            stored_file = Path(self.documents[doc_id]['stored_file'])
            if stored_file.exists():
                stored_file.unlink()
            
            # Remove from metadata
            del self.documents[doc_id]
            self._save_documents()
            logger.info(f"Document deleted: {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {e}")
            return False

    def get_unindexed_paths(self) -> List[str]:
        """Returns file paths of documents not yet processed."""
        return [doc['stored_file'] for doc in self.documents.values() 
                if not doc.get('is_indexed')]

    def get_all_paths(self) -> List[str]:
        """Returns all stored document file paths."""
        return [doc['stored_file'] for doc in self.documents.values()]

    def mark_as_indexed(self, stored_file_path: str):
        """Marks a document as processed in the metadata."""
        for doc_info in self.documents.values():
            if doc_info['stored_file'] == stored_file_path:
                doc_info['is_indexed'] = True
        self._save_documents()

    def get_document_content(self, doc_id: str) -> Optional[str]:
        """Get the file path for a document's content."""
        if doc_id in self.documents:
            return self.documents[doc_id]['stored_file']
        return None
