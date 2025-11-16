from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import StreamingResponse
from bson import ObjectId
import logging
from config.database import db_manager
from core.gridfs_handler import gridfs_handler

logger = logging.getLogger(__name__)
file_router = APIRouter()

@file_router.get("/files/stream/{gridfs_id}")
async def stream_file(gridfs_id: str = Path(..., description="GridFS file ID")):
    """Stream file directly from GridFS by GridFS ID"""
    try:
        # Convert string to ObjectId
        try:
            obj_id = ObjectId(gridfs_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid GridFS ID")
        
        # Get file from GridFS
        grid_file = gridfs_handler.get_file(obj_id)
        
        if not grid_file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get file info
        file_info = gridfs_handler.get_file_info(obj_id)
        
        # Prepare headers
        headers = {
            "Content-Disposition": f'inline; filename="{grid_file.filename}"',
            "Content-Length": str(grid_file.length)
        }
        
        # Stream the file
        def file_generator():
            try:
                while True:
                    chunk = grid_file.read(1024 * 1024)  # Read 1MB chunks
                    if not chunk:
                        break
                    yield chunk
            finally:
                grid_file.close()
        
        return StreamingResponse(
            file_generator(),
            media_type=grid_file.content_type or "application/octet-stream",
            headers=headers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming file {gridfs_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream file")

@file_router.get("/materials/stream/{material_id}")
async def stream_material_file(material_id: str = Path(..., description="Material ID")):
    """Stream file by material ID"""
    try:
        # Get material metadata
        materials = db_manager.get_collection("materials")
        material = materials.find_one({"_id": material_id})
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Get GridFS ID from material
        gridfs_id = material.get("gridfs_id")
        if not gridfs_id:
            raise HTTPException(status_code=404, detail="File not found for this material")
        
        # Stream the file using the GridFS ID
        return await stream_file(str(gridfs_id))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming material file {material_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream material file")

@file_router.get("/books/stream/{book_id}")
async def stream_book_file(book_id: str = Path(..., description="Book ID")):
    """Stream book file by book ID"""
    try:
        # Get book metadata
        books = db_manager.get_collection("reference_books")
        book = books.find_one({"_id": book_id})
        
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Get GridFS ID from book
        gridfs_id = book.get("gridfs_id")
        if not gridfs_id:
            raise HTTPException(status_code=404, detail="File not found for this book")
        
        # Stream the file using the GridFS ID
        return await stream_file(str(gridfs_id))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming book file {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to stream book file")

@file_router.get("/files/info/{gridfs_id}")
async def get_file_info(gridfs_id: str = Path(..., description="GridFS file ID")):
    """Get file information from GridFS"""
    try:
        # Convert string to ObjectId
        try:
            obj_id = ObjectId(gridfs_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid GridFS ID")
        
        # Get file info
        file_info = gridfs_handler.get_file_info(obj_id)
        
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Format response
        response = {
            "gridfs_id": str(file_info["_id"]),
            "filename": file_info["filename"],
            "size_bytes": file_info["length"],
            "content_type": file_info["contentType"],
            "upload_date": file_info["uploadDate"],
            "metadata": file_info.get("metadata", {})
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file info {gridfs_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file info")

@file_router.get("/materials/info/{material_id}")
async def get_material_info(material_id: str = Path(..., description="Material ID")):
    """Get material information including file details"""
    try:
        # Get material metadata
        materials = db_manager.get_collection("materials")
        material = materials.find_one({"_id": material_id})
        
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        # Get file info if GridFS ID exists
        file_info = None
        gridfs_id = material.get("gridfs_id")
        if gridfs_id:
            try:
                obj_id = ObjectId(gridfs_id)
                file_info = gridfs_handler.get_file_info(obj_id)
            except Exception as e:
                logger.warning(f"Could not get file info for material {material_id}: {e}")
        
        # Format response
        response = {
            "material_id": material["_id"],
            "title": material.get("title"),
            "subject_id": material.get("subject_id"),
            "semester_id": material.get("semester_id"),
            "unit": material.get("unit"),
            "topic": material.get("topic"),
            "file_type": material.get("file_type"),
            "pages": material.get("pages"),
            "tags": material.get("tags", []),
            "level": material.get("level"),
            "file_info": {
                "gridfs_id": str(gridfs_id) if gridfs_id else None,
                "filename": file_info.get("filename") if file_info else material.get("file_name"),
                "size_bytes": file_info.get("length") if file_info else None,
                "content_type": file_info.get("contentType") if file_info else None,
                "upload_date": file_info.get("uploadDate") if file_info else None
            },
            "created_at": material.get("createdAt"),
            "updated_at": material.get("updatedAt")
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting material info {material_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get material info")
