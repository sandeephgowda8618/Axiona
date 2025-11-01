# Fixed Main.py with Proper Error Handling

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

from core.collections import ChromaCollectionManager
from core.query_router import QueryRouter
from config.chroma_config import chroma_client
from config.settings import config
from models.api_models import (
    QueryRequest, SearchResponse, MultiSearchRequest, MultiSearchResponse,
    RoadmapRequest, RoadmapResponse, BookFilterRequest, BookFilterResponse,
    VideoFilterRequest, VideoFilterResponse, IngestionRequest, IngestionResponse,
    HealthResponse, ReadinessResponse, CollectionStatsResponse,
    MongoBookIngestRequest, MongoBookIngestResponse, MongoBookSearchRequest, 
    MongoBookSearchResponse, MongoBookInfo
)

# Import LLaMA model
try:
    from core.llama_model import LLaMAModel
except ImportError:
    LLaMAModel = None

# Import core components for new RAG system
from core.collections_simple import ChromaCollectionManager as ChromaDBManager
from services.book_ingestion import get_book_ingestion_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="MCP RAG Server",
    description="Model Context Protocol RAG System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global components
collection_manager: Optional[ChromaCollectionManager] = None
query_router: Optional[QueryRouter] = None
llama_model: Optional[LLaMAModel] = None

# New simplified RAG components
chroma_manager: Optional[ChromaDBManager] = None
book_ingestion_service = None

def ensure_components_initialized():
    """Ensure all global components are properly initialized"""
    if collection_manager is None:
        raise HTTPException(status_code=500, detail="Collection manager not initialized")
    if query_router is None:
        raise HTTPException(status_code=500, detail="Query router not initialized")
    if llama_model is None:
        raise HTTPException(status_code=500, detail="LLaMA model not initialized")
    return collection_manager, query_router, llama_model

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global collection_manager, query_router, llama_model, chroma_manager, book_ingestion_service
    
    try:
        logger.info("Initializing MCP RAG Server...")
        
        # Initialize collection manager (legacy)
        collection_manager = ChromaCollectionManager(chroma_client)
        
        # Initialize query router (legacy)
        query_router = QueryRouter(collection_manager)
        
        # Initialize new simplified components
        chroma_manager = ChromaDBManager(chroma_client)
        
        # Initialize book ingestion service
        book_ingestion_service = get_book_ingestion_service(chroma_manager)
        await book_ingestion_service.initialize()
        
        # Initialize LLaMA model
        if LLaMAModel:
            llama_model = LLaMAModel()
            await llama_model.initialize()
        else:
            logger.warning("LLaMA model not available - some features will be disabled")
        
        logger.info("MCP RAG Server initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize server: {e}")
        raise

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )

@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Docker"""
    try:
        cm, _, _ = ensure_components_initialized()
        stats = cm.list_all_collections()
        return {
            "status": "ready",
            "collections": len(stats),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@app.get("/collections")
async def list_collections():
    """List all available collections"""
    try:
        cm, _, _ = ensure_components_initialized()
        stats = cm.list_all_collections()
        return {"collections": stats}
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections/{namespace}/stats")
async def get_collection_stats(namespace: str):
    """Get statistics for a specific collection"""
    try:
        cm, _, _ = ensure_components_initialized()
        stats = cm.get_collection_stats(namespace)
        return {"namespace": namespace, "stats": stats}
    except Exception as e:
        logger.error(f"Failed to get collection stats for {namespace}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search_documents(request: QueryRequest):
    """Search documents using semantic similarity"""
    try:
        cm, qr, _ = ensure_components_initialized()
        
        logger.info(f"Search request: '{request.query[:50]}...'")
        
        results = await qr.search(
            query=request.query,
            namespace=request.namespace,
            n_results=request.n_results,
            filters=request.filters
        )
        
        return SearchResponse(**results)
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/multi-search", response_model=MultiSearchResponse)
async def multi_namespace_search(request: MultiSearchRequest):
    """Search across multiple namespaces"""
    try:
        cm, qr, _ = ensure_components_initialized()
        
        logger.info(f"Multi-namespace search: '{request.query[:50]}...'")
        
        results = await qr.multi_namespace_search(
            query=request.query,
            namespaces=request.namespaces or [],
            n_results_per_namespace=request.n_results_per_namespace,
            filters=request.filters
        )
        
        return MultiSearchResponse(**results)
        
    except Exception as e:
        logger.error(f"Multi-namespace search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents", response_model=DocumentBatchResponse)
async def add_documents(request: DocumentBatch):
    """Add documents to a collection"""
    try:
        cm, _, _ = ensure_components_initialized()
        
        logger.info(f"Adding {len(request.documents)} documents to namespace '{request.namespace}'")
        
        documents = [doc.dict() for doc in request.documents]
        count = cm.add_documents(request.namespace, documents)
        
        return DocumentBatchResponse(
            message=f"Successfully added {count} documents",
            namespace=request.namespace,
            document_count=count
        )
        
    except Exception as e:
        logger.error(f"Failed to add documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents", response_model=DocumentDeleteResponse)
async def delete_documents(request: DocumentDeleteRequest):
    """Delete specific documents from a collection"""
    try:
        cm, _, _ = ensure_components_initialized()
        
        logger.info(f"Deleting {len(request.document_ids)} documents from namespace '{request.namespace}'")
        
        count = cm.delete_documents(request.namespace, request.document_ids)
        
        return DocumentDeleteResponse(
            message=f"Successfully deleted {count} documents",
            namespace=request.namespace,
            deleted_count=count
        )
        
    except Exception as e:
        logger.error(f"Failed to delete documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/collections/{namespace}/reset", response_model=CollectionResetResponse)
async def reset_collection(namespace: str, request: CollectionResetRequest):
    """Reset a collection (delete all documents)"""
    try:
        cm, _, _ = ensure_components_initialized()
        
        logger.info(f"Resetting collection '{namespace}'")
        
        success = cm.reset_collection(namespace)
        
        return CollectionResetResponse(
            message=f"Collection '{namespace}' reset successfully" if success else "Reset failed",
            namespace=namespace,
            success=success
        )
        
    except Exception as e:
        logger.error(f"Failed to reset collection {namespace}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/roadmap", response_model=RoadmapResponse)
async def generate_roadmap(request: RoadmapRequest):
    """Generate learning roadmap using LLaMA"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"Roadmap generation request: {request.dict()}")
        
        roadmap = await lm.generate_roadmap(request.dict())
        
        return RoadmapResponse(roadmap=roadmap, user_id=request.user_id)
        
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/books/filter", response_model=BookFilterResponse)
async def filter_books(request: BookFilterRequest):
    """Filter and recommend books using LLaMA"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"Book filtering request: {request.dict()}")
        
        recommendations_data = await lm.filter_books(request.dict())
        
        # Convert to proper format
        from models.api_models import BookRecommendation
        recommendations = [
            BookRecommendation(**book) for book in recommendations_data
        ]
        
        return BookFilterResponse(recommendations=recommendations)
        
    except Exception as e:
        logger.error(f"Book filtering failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/videos/filter", response_model=VideoFilterResponse)
async def filter_videos(request: VideoFilterRequest):
    """Filter and recommend videos using LLaMA"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"Video recommendation request: {request.dict()}")
        
        video_data = await lm.recommend_videos(request.dict())
        
        return VideoFilterResponse(video_sequence=video_data)
        
    except Exception as e:
        logger.error(f"Video filtering failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-roadmap")
async def smart_roadmap_generation(request: RoadmapRequest):
    """Generate a smart roadmap with context"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"Smart roadmap generation for: {request.dict()}")
        
        # Get relevant context from knowledge base
        context_results = await qr.smart_search(
            query=f"learning path {request.subject} {request.level}",
            namespace="roadmaps",
            n_results=5
        )
        
        # Generate roadmap with context
        roadmap = await lm.generate_roadmap(
            user_profile=request.dict(),
            context=context_results.get("documents", [])
        )
        
        return RoadmapResponse(roadmap=roadmap, user_id=request.user_id)
        
    except Exception as e:
        logger.error(f"Smart roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-pdfs")
async def search_pdfs_with_context(request: QueryRequest):
    """Search PDFs with enhanced context"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"PDF search with context: '{request.query[:50]}...'")
        
        # Get relevant context
        context_results = await qr.smart_search(
            query=request.query,
            namespace="pdfs",
            n_results=request.n_results,
            filters=request.filters
        )
        
        # Enhance results with LLaMA
        response = await lm.search_pdfs(
            query=request.query,
            context=context_results.get("documents", [])
        )
        
        return SearchResponse(
            documents=response.get("documents", []),
            metadata=response.get("metadata", {}),
            query=request.query
        )
        
    except Exception as e:
        logger.error(f"PDF search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-books")
async def recommend_books_with_context(request: BookFilterRequest):
    """Recommend books with enhanced context"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"Book recommendation with context: {request.dict()}")
        
        # Get relevant context
        context_results = await qr.smart_search(
            query=f"books {request.subject} {request.level}",
            namespace="books",
            n_results=10
        )
        
        # Get recommendations with context
        recommendations = await lm.filter_books(
            criteria=request.dict(),
            context=context_results.get("documents", [])
        )
        
        from models.api_models import BookRecommendation
        book_recommendations = [
            BookRecommendation(**book) for book in recommendations
        ]
        
        return BookFilterResponse(recommendations=book_recommendations)
        
    except Exception as e:
        logger.error(f"Book recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend-videos")
async def recommend_videos_with_context(request: VideoFilterRequest):
    """Recommend videos with enhanced context"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        logger.info(f"Video recommendation with context: {request.dict()}")
        
        # Get relevant context
        context_results = await qr.smart_search(
            query=f"videos {request.subject} {request.level}",
            namespace="videos",
            n_results=10
        )
        
        # Get video sequence with context
        video_sequence = await lm.recommend_videos(
            criteria=request.dict(),
            context=context_results.get("documents", [])
        )
        
        return VideoFilterResponse(video_sequence=video_sequence)
        
    except Exception as e:
        logger.error(f"Video recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest/drive", response_model=DriveIngestResponse)
async def ingest_google_drive_folder(request: DriveIngestRequest):
    """Ingest content from Google Drive folder"""
    try:
        cm, _, _ = ensure_components_initialized()
        
        logger.info(f"Starting Google Drive ingestion for folder: {request.folder_id}")
        
        from processors.google_drive_processor import GoogleDriveProcessor
        
        # Initialize Google Drive processor
        processor = GoogleDriveProcessor()
        
        if not await processor.initialize():
            raise HTTPException(status_code=500, detail="Failed to initialize Google Drive processor")
        
        # Process the folder
        processed_data = await processor.process_drive_folder(
            request.folder_id,
            request.download_dir
        )
        
        # Ingest into collections
        ingestion_results = {}
        
        for content_type in ["pdfs", "videos", "books", "roadmaps"]:
            items = processed_data.get(content_type, [])
            if items:
                count = cm.add_documents(content_type, items)
                ingestion_results[content_type] = count
                logger.info(f"Ingested {count} {content_type}")
        
        return DriveIngestResponse(
            message="Google Drive folder processed successfully",
            folder_id=request.folder_id,
            ingestion_results=ingestion_results,
            total_files=processed_data["metadata"]["total_files"]
        )
        
    except Exception as e:
        logger.error(f"Google Drive ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# MongoDB Book Management Endpoints
@app.post("/books/ingest", response_model=MongoBookIngestResponse)
async def ingest_mongodb_books(request: MongoBookIngestRequest):
    """Ingest books from MongoDB into ChromaDB for RAG search"""
    try:
        if not book_ingestion_service:
            raise HTTPException(status_code=500, detail="Book ingestion service not initialized")
        
        logger.info(f"Starting book ingestion with filters: subject={request.subject_filter}, difficulty={request.difficulty_filter}")
        
        stats, errors = await book_ingestion_service.ingest_books_from_mongodb(
            namespace=request.namespace,
            subject_filter=request.subject_filter,
            difficulty_filter=request.difficulty_filter,
            limit=request.limit,
            force_update=request.force_update
        )
        
        success = stats.books_ingested > 0 or (stats.books_processed == 0 and stats.total_books_found == 0)
        message = f"Ingested {stats.books_ingested} books, skipped {stats.books_skipped}, {stats.errors} errors"
        
        return MongoBookIngestResponse(
            success=success,
            message=message,
            stats=stats,
            errors=errors
        )
        
    except Exception as e:
        logger.error(f"Book ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/books/status")
async def get_book_ingestion_status(namespace: str = "reference_books"):
    """Get status of ingested books in ChromaDB"""
    try:
        if not book_ingestion_service:
            raise HTTPException(status_code=500, detail="Book ingestion service not initialized")
        
        status = await book_ingestion_service.get_book_ingestion_status(namespace)
        return status
        
    except Exception as e:
        logger.error(f"Failed to get book status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/books/search-rag", response_model=MongoBookSearchResponse)
async def search_ingested_books(request: MongoBookSearchRequest):
    """Search books that have been ingested into ChromaDB"""
    try:
        if not book_ingestion_service:
            raise HTTPException(status_code=500, detail="Book ingestion service not initialized")
        
        # Use search query or fall back to browsing
        search_query = request.query or "books education learning"
        
        results = await book_ingestion_service.search_ingested_books(
            query=search_query,
            namespace="reference_books",
            n_results=request.limit
        )
        
        # Convert results to response format
        books = []
        for result in results:
            metadata = result.get('metadata', {})
            book_info = MongoBookInfo(
                id=metadata.get('book_id', result['id']),
                title=metadata.get('title', 'Unknown Title'),
                author=metadata.get('author'),
                subject=metadata.get('subject'),
                difficulty=metadata.get('difficulty'),
                rating=metadata.get('rating'),
                pages=metadata.get('pages'),
                file_path=metadata.get('file_path'),
                tags=metadata.get('tags', [])
            )
            books.append(book_info)
        
        return MongoBookSearchResponse(
            books=books,
            total_count=len(books)
        )
        
    except Exception as e:
        logger.error(f"Book search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/books/mongodb")
async def browse_mongodb_books(
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 20
):
    """Browse books directly from MongoDB"""
    try:
        if not book_ingestion_service:
            raise HTTPException(status_code=500, detail="Book ingestion service not initialized")
        
        mongo_manager = await book_ingestion_service.mongo_manager
        if not mongo_manager:
            raise HTTPException(status_code=500, detail="MongoDB manager not available")
        
        # Get books based on filters
        if subject:
            books = await mongo_manager.get_books_by_subject(subject)
        elif difficulty:
            books = await mongo_manager.get_books_by_difficulty(difficulty)
        else:
            books = await mongo_manager.get_all_books()
        
        # Limit results
        if limit and limit < len(books):
            books = books[:limit]
        
        return {
            "books": books,
            "total_count": len(books)
        }
        
    except Exception as e:
        logger.error(f"MongoDB browse failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_system_status():
    """Get comprehensive system status"""
    try:
        cm, qr, lm = ensure_components_initialized()
        
        # Get collection statistics
        stats = cm.list_all_collections()
        
        # System status
        status = {
            "status": "operational",
            "timestamp": datetime.utcnow().isoformat(),
            "collections": stats,
            "components": {
                "collection_manager": "initialized",
                "query_router": "initialized",
                "llama_model": {
                    "status": "initialized" if lm else "not_available",
                    "provider": getattr(lm, 'provider', 'unknown') if lm else None,
                    "model": getattr(lm, 'model_name', 'unknown') if lm else None
                }
            }
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
