"""
Search API Routes for Educational Content
========================================

Provides vector-based search across PES materials, reference books, and videos.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
import logging
from core.vector_db import vector_db
from config.database import db_manager
from config.settings import Settings

logger = logging.getLogger(__name__)
search_router = APIRouter()

@search_router.get("/pdf")
async def search_pdf(
    q: str = Query(..., description="Search query"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    unit: Optional[str] = Query(None, description="Filter by unit"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
) -> List[Dict[str, Any]]:
    """Search for PDF materials using vector similarity and filters"""
    try:
        logger.info(f"PDF search query: '{q}' with filters - semester: {semester}, subject: {subject}, unit: {unit}")
        
        # Build ChromaDB filters
        chroma_filters = {}
        if subject:
            chroma_filters["subject"] = subject
        if semester:
            chroma_filters["semester"] = semester
        if unit:
            chroma_filters["unit"] = unit
        
        # Perform vector search
        search_results = vector_db.search_similar(
            collection_key="materials",
            query=q,
            n_results=limit * 2,  # Get more results for additional filtering
            filters=chroma_filters if chroma_filters else None
        )
        
        # Get material metadata from MongoDB
        pes_materials_collection = db_manager.get_collection(Settings.MATERIALS_COLLECTION)
        results = []
        seen_ids = set()
        
        for result in search_results:
            # Get source document ID from metadata
            source_id = result.get("metadata", {}).get("source_id")
            if not source_id or source_id in seen_ids:
                continue
            seen_ids.add(source_id)
                
            # Get full material metadata from MongoDB
            material = pes_materials_collection.find_one({"_id": source_id})
            if not material:
                logger.warning(f"Material not found in MongoDB: {source_id}")
                continue
            
            # Extract snippet from search result
            snippet = result.get("document", "")[:300] + "..." if len(result.get("document", "")) > 300 else result.get("document", "")
            
            # Apply additional tag filtering if specified
            if tags:
                tag_list = [tag.strip().lower() for tag in tags.split(",")]
                material_tags = [tag.lower() for tag in material.get("tags", [])]
                if not any(tag in material_tags for tag in tag_list):
                    continue
            
            # Format result
            formatted_result = {
                "id": material["_id"],
                "title": material.get("title", "Untitled"),
                "subject": material.get("subject", "Unknown"),
                "semester": material.get("semester", None),
                "unit": material.get("unit", None),
                "fileName": material.get("fileName", ""),
                "file_url": f"/api/files/stream/{material['_id']}" if material.get("gridfs_id") else None,
                "gridfs_id": str(material["gridfs_id"]) if material.get("gridfs_id") else None,
                "snippet": snippet,
                "tags": material.get("tags", []),
                "score": 1.0 - result.get("distance", 0.0),  # Convert distance to similarity score
                "content_type": material.get("content_type", "pes_material"),
                "has_pdf": material.get("has_pdf", False)
            }
            results.append(formatted_result)
            
            # Stop when we reach the desired limit
            if len(results) >= limit:
                break
        
        logger.info(f"Returning {len(results)} PDF search results")
        return results
        
    except Exception as e:
        logger.error(f"PDF search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@search_router.get("/books")
async def search_books(
    q: str = Query(..., description="Search query"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    author: Optional[str] = Query(None, description="Filter by author"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
) -> List[Dict[str, Any]]:
    """Search for reference books using vector similarity and metadata filters"""
    try:
        logger.info(f"Book search query: '{q}' with filters - subject: {subject}, difficulty: {difficulty}")
        
        # Build ChromaDB filters
        chroma_filters = {}
        if subject:
            chroma_filters["subject"] = subject
        if difficulty:
            chroma_filters["difficulty"] = difficulty
        if author:
            chroma_filters["author"] = author
            
        # Perform vector search
        search_results = vector_db.search_similar(
            collection_key="books",
            query=q,
            n_results=limit * 2,
            filters=chroma_filters if chroma_filters else None
        )
        
        # Get book metadata from MongoDB
        books_collection = db_manager.get_collection(Settings.BOOKS_COLLECTION)
        results = []
        seen_ids = set()
        
        for result in search_results:
            source_id = result.get("metadata", {}).get("source_id")
            if not source_id or source_id in seen_ids:
                continue
            seen_ids.add(source_id)
                
            # Get full book metadata
            book = books_collection.find_one({"_id": source_id})
            if not book:
                continue
            
            # Extract snippet
            snippet = result.get("document", "")[:400] + "..." if len(result.get("document", "")) > 400 else result.get("document", "")
            
            formatted_result = {
                "id": book["_id"], 
                "title": book.get("title", "Untitled"),
                "author": book.get("author", "Unknown Author"),
                "subject": book.get("subject", "Unknown"),
                "summary": book.get("summary", ""),
                "key_concepts": book.get("key_concepts", []),
                "difficulty": book.get("difficulty", "Unknown"),
                "target_audience": book.get("target_audience", ""),
                "file_url": f"/api/books/stream/{book['_id']}" if book.get("gridfs_id") else None,
                "gridfs_id": str(book["gridfs_id"]) if book.get("gridfs_id") else None,
                "snippet": snippet,
                "score": 1.0 - result.get("distance", 0.0),
                "content_type": book.get("content_type", "reference_book"),
                "has_pdf": book.get("has_pdf", False)
            }
            results.append(formatted_result)
            
            if len(results) >= limit:
                break
        
        logger.info(f"Returning {len(results)} book search results")
        return results
        
    except Exception as e:
        logger.error(f"Book search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@search_router.get("/videos") 
async def search_videos(
    q: str = Query(..., description="Search query"),
    channel: Optional[str] = Query(None, description="Filter by channel name"),
    min_duration: Optional[int] = Query(None, description="Minimum duration in seconds"),
    max_duration: Optional[int] = Query(None, description="Maximum duration in seconds"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
) -> List[Dict[str, Any]]:
    """Search for educational videos using vector similarity"""
    try:
        logger.info(f"Video search query: '{q}' with filters - channel: {channel}")
        
        # Build ChromaDB filters
        chroma_filters = {}
        if channel:
            chroma_filters["channel"] = channel
            
        # Perform vector search
        search_results = vector_db.search_similar(
            collection_key="videos", 
            query=q,
            n_results=limit * 2,
            filters=chroma_filters if chroma_filters else None
        )
        
        # Get video metadata from MongoDB
        videos_collection = db_manager.get_collection(Settings.VIDEOS_COLLECTION)
        results = []
        seen_ids = set()
        
        for result in search_results:
            source_id = result.get("metadata", {}).get("source_id")
            if not source_id or source_id in seen_ids:
                continue
            seen_ids.add(source_id)
                
            # Get full video metadata
            video = videos_collection.find_one({"_id": source_id})
            if not video:
                continue
            
            # Apply duration filters
            duration = video.get("duration_seconds", 0)
            if min_duration and duration < min_duration:
                continue
            if max_duration and duration > max_duration:
                continue
            
            snippet = result.get("document", "")[:300] + "..." if len(result.get("document", "")) > 300 else result.get("document", "")
            
            formatted_result = {
                "id": video["_id"],
                "title": video.get("title", "Untitled Video"),
                "url": video.get("url", ""),
                "channel": video.get("channel", "Unknown Channel"),
                "duration_seconds": duration,
                "views": video.get("views", 0),
                "topic_tags": video.get("topic_tags", []),
                "snippet": snippet,
                "score": 1.0 - result.get("distance", 0.0),
                "content_type": video.get("content_type", "youtube_video")
            }
            results.append(formatted_result)
            
            if len(results) >= limit:
                break
        
        logger.info(f"Returning {len(results)} video search results")
        return results
        
    except Exception as e:
        logger.error(f"Video search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@search_router.get("/unified")
async def unified_search(
    q: str = Query(..., description="Search query across all content types"),
    content_types: Optional[str] = Query(None, description="Content types to search (pdf,books,videos)"),
    limit: int = Query(15, ge=1, le=50, description="Total number of results to return")
) -> Dict[str, Any]:
    """Unified search across all educational content types"""
    try:
        # Determine which content types to search
        if content_types:
            search_types = [t.strip() for t in content_types.split(",")]
        else:
            search_types = ["pdf", "books", "videos"]
        
        results = {
            "query": q,
            "total_results": 0,
            "results_by_type": {}
        }
        
        per_type_limit = max(1, limit // len(search_types))
        
        # Search PDFs/materials
        if "pdf" in search_types:
            pdf_results = await search_pdf(q=q, limit=per_type_limit)
            results["results_by_type"]["materials"] = pdf_results
            
        # Search books
        if "books" in search_types:
            book_results = await search_books(q=q, limit=per_type_limit)
            results["results_by_type"]["books"] = book_results
            
        # Search videos
        if "videos" in search_types:
            video_results = await search_videos(q=q, limit=per_type_limit)
            results["results_by_type"]["videos"] = video_results
        
        # Calculate total
        total = sum(len(results_list) for results_list in results["results_by_type"].values())
        results["total_results"] = total
        
        logger.info(f"Unified search for '{q}' returned {total} total results")
        return results
        
    except Exception as e:
        logger.error(f"Unified search error: {e}")
        raise HTTPException(status_code=500, detail=f"Unified search failed: {str(e)}")
            if tags:
                tag_list = [tag.strip() for tag in tags.split(",")]
                material_tags = material.get("tags", [])
                if not any(tag in material_tags for tag in tag_list):
                    continue
            
            # Format result
            formatted_result = {
                "material_id": material["_id"],
                "title": material.get("title", ""),
                "file_url": material.get("file_url", ""),
                "snippet": result["text"][:300] + "..." if len(result["text"]) > 300 else result["text"],
                "tags": material.get("tags", []),
                "semester": material.get("semester_id"),
                "subject": material.get("subject_id"),
                "unit": material.get("unit"),
                "score": result["score"],
                "pages": material.get("pages"),
                "file_type": material.get("file_type")
            }
            
            results.append(formatted_result)
            
            if len(results) >= limit:
                break
        
        logger.info(f"Found {len(results)} PDF results")
        return results
        
    except Exception as e:
        logger.error(f"PDF search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@search_router.get("/books")
async def search_books(
    q: str = Query(..., description="Search query"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    author: Optional[str] = Query(None, description="Filter by author"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
) -> List[Dict[str, Any]]:
    """Search for reference books using vector similarity and filters"""
    try:
        logger.info(f"Books search query: {q}")
        
        # Perform vector search
        search_results = vector_db.search_similar(
            collection_key="books",
            query=q,
            n_results=limit * 2
        )
        
        # Get book metadata from MongoDB
        books_collection = db_manager.get_collection("reference_books")
        results = []
        
        for result in search_results:
            book_id = result["metadata"].get("source_id")
            if not book_id:
                continue
                
            book = books_collection.find_one({"_id": book_id})
            if not book:
                continue
            
            # Apply filters
            if difficulty and book.get("difficulty") != difficulty:
                continue
            if subject and subject.lower() not in book.get("subject", "").lower():
                continue
            if author and author.lower() not in book.get("author", "").lower():
                continue
            
            # Format result
            formatted_result = {
                "book_id": book["_id"],
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "file_url": book.get("file_url", ""),
                "summary": book.get("summary", "")[:200] + "..." if len(book.get("summary", "")) > 200 else book.get("summary", ""),
                "key_concepts": book.get("key_concepts", []),
                "difficulty": book.get("difficulty"),
                "pages": book.get("pages"),
                "score": result["score"],
                "tags": book.get("tags", [])
            }
            
            results.append(formatted_result)
            
            if len(results) >= limit:
                break
        
        logger.info(f"Found {len(results)} book results")
        return results
        
    except Exception as e:
        logger.error(f"Books search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@search_router.get("/videos")
async def search_videos(
    q: str = Query(..., description="Search query"),
    channel: Optional[str] = Query(None, description="Filter by channel"),
    min_duration: Optional[int] = Query(None, description="Minimum duration in seconds"),
    max_duration: Optional[int] = Query(None, description="Maximum duration in seconds"),
    sort_by: str = Query("relevance", description="Sort by: relevance, views, duration"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
) -> List[Dict[str, Any]]:
    """Search for tutorial videos using vector similarity and filters"""
    try:
        logger.info(f"Videos search query: {q}")
        
        # Perform vector search
        search_results = vector_db.search_similar(
            collection_key="videos",
            query=q,
            n_results=limit * 2
        )
        
        # Get video metadata from MongoDB
        videos_collection = db_manager.get_collection("videos")
        results = []
        
        for result in search_results:
            video_id = result["metadata"].get("source_id")
            if not video_id:
                continue
                
            video = videos_collection.find_one({"_id": video_id})
            if not video:
                continue
            
            # Apply filters
            if channel and channel.lower() not in video.get("channel", "").lower():
                continue
            
            duration = video.get("duration_seconds", 0)
            if min_duration and duration < min_duration:
                continue
            if max_duration and duration > max_duration:
                continue
            
            # Format result
            formatted_result = {
                "video_id": video["_id"],
                "title": video.get("title", ""),
                "video_url": video.get("video_url", ""),
                "thumbnail_url": video.get("thumbnail_url", ""),
                "channel": video.get("channel", ""),
                "duration_seconds": duration,
                "views": video.get("views", 0),
                "topic_tags": video.get("topic_tags", []),
                "score": result["score"],
                "playlist_id": video.get("playlist_id")
            }
            
            results.append(formatted_result)
            
            if len(results) >= limit:
                break
        
        # Sort results
        if sort_by == "views":
            results.sort(key=lambda x: x.get("views", 0), reverse=True)
        elif sort_by == "duration":
            results.sort(key=lambda x: x.get("duration_seconds", 0))
        # Default is relevance (already sorted by vector similarity)
        
        logger.info(f"Found {len(results)} video results")
        return results
        
    except Exception as e:
        logger.error(f"Videos search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")
