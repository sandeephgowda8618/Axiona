from gridfs import GridFS
from bson import ObjectId
from typing import BinaryIO, Optional, Dict, Any, List
import os
import logging
from datetime import datetime
from config.database import db_manager

logger = logging.getLogger(__name__)

class GridFSHandler:
    """Handles GridFS file operations"""
    
    def __init__(self):
        self.fs = db_manager.get_gridfs()
    
    def upload_file(self, file_data: BinaryIO, filename: str, 
                   content_type: str = "application/octet-stream", 
                   metadata: Optional[Dict] = None) -> Optional[ObjectId]:
        """Upload file to GridFS"""
        try:
            # Prepare metadata
            file_metadata = {
                "uploadDate": datetime.utcnow(),
                "contentType": content_type,
                **(metadata or {})
            }
            
            # Upload to GridFS
            gridfs_id = self.fs.put(
                file_data,
                filename=filename,
                contentType=content_type,
                metadata=file_metadata
            )
            
            logger.info(f"Uploaded file {filename} to GridFS with ID: {gridfs_id}")
            return gridfs_id
            
        except Exception as e:
            logger.error(f"Failed to upload file {filename}: {e}")
            return None
    
    def upload_from_path(self, file_path: str, filename: Optional[str] = None,
                        content_type: Optional[str] = None, 
                        metadata: Optional[Dict] = None) -> Optional[ObjectId]:
        """Upload file from local path to GridFS"""
        try:
            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                return None
            
            # Auto-detect filename and content type
            if not filename:
                filename = os.path.basename(file_path)
            
            if not content_type:
                ext = os.path.splitext(file_path)[1].lower()
                content_type_map = {
                    '.pdf': 'application/pdf',
                    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.txt': 'text/plain'
                }
                content_type = content_type_map.get(ext, 'application/octet-stream')
            
            # Upload file
            with open(file_path, 'rb') as file_data:
                return self.upload_file(file_data, filename, content_type, metadata)
                
        except Exception as e:
            logger.error(f"Failed to upload from path {file_path}: {e}")
            return None
    
    def get_file(self, gridfs_id: ObjectId) -> Optional[Any]:
        """Get file from GridFS by ID"""
        try:
            if self.fs.exists({"_id": gridfs_id}):
                return self.fs.get(gridfs_id)
            else:
                logger.warning(f"File with ID {gridfs_id} not found")
                return None
        except Exception as e:
            logger.error(f"Failed to get file {gridfs_id}: {e}")
            return None
    
    def get_file_info(self, gridfs_id: ObjectId) -> Optional[Dict[str, Any]]:
        """Get file metadata from GridFS"""
        try:
            file_obj = self.get_file(gridfs_id)
            if file_obj:
                return {
                    "_id": file_obj._id,
                    "filename": file_obj.filename,
                    "length": file_obj.length,
                    "contentType": file_obj.content_type,
                    "uploadDate": file_obj.upload_date,
                    "metadata": file_obj.metadata
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get file info {gridfs_id}: {e}")
            return None
    
    def delete_file(self, gridfs_id: ObjectId) -> bool:
        """Delete file from GridFS"""
        try:
            if self.fs.exists({"_id": gridfs_id}):
                self.fs.delete(gridfs_id)
                logger.info(f"Deleted file {gridfs_id} from GridFS")
                return True
            else:
                logger.warning(f"File {gridfs_id} not found for deletion")
                return False
        except Exception as e:
            logger.error(f"Failed to delete file {gridfs_id}: {e}")
            return False
    
    def file_exists(self, gridfs_id: ObjectId) -> bool:
        """Check if file exists in GridFS"""
        try:
            return self.fs.exists({"_id": gridfs_id})
        except Exception as e:
            logger.error(f"Failed to check file existence {gridfs_id}: {e}")
            return False
    
    def list_files(self, filter_dict: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """List files in GridFS with optional filter"""
        try:
            files = []
            for grid_file in self.fs.find(filter_dict or {}):
                file_info = {
                    "_id": grid_file._id,
                    "filename": grid_file.filename,
                    "length": grid_file.length,
                    "contentType": grid_file.content_type,
                    "uploadDate": grid_file.upload_date,
                    "metadata": grid_file.metadata
                }
                files.append(file_info)
            return files
        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []

# Global GridFS handler instance
gridfs_handler = GridFSHandler()
