# Core RAG Implementation - Embedding and Vector Storage

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from core.collections_simple import ChromaCollectionManager
from config.chroma_config import chroma_client
from models.api_models import (
    QueryRequest, SearchResponse, SearchResult,
    IngestionRequest, IngestionResponse,
    HealthResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Core RAG System",
    description="Document Embedding and Vector Storage System",
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

def ensure_initialized():
    """Ensure collection manager is initialized"""
    if collection_manager is None:
        raise HTTPException(status_code=500, detail="Collection manager not initialized")
    return collection_manager

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global collection_manager
    
    try:
        logger.info("Initializing Core RAG System...")
        
        # Initialize collection manager with sentence transformers
        collection_manager = ChromaCollectionManager(chroma_client)
        
        logger.info("Core RAG System initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize system: {e}")
        raise

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="Core RAG System",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/collections")
async def list_collections():
    """List all available collections"""
    try:
        cm = ensure_initialized()
        stats = cm.list_all_collections()
        return {"collections": stats}
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections/{namespace}/stats")
async def get_collection_stats(namespace: str):
    """Get statistics for a specific collection"""
    try:
        cm = ensure_initialized()
        stats = cm.get_collection_stats(namespace)
        return {"namespace": namespace, "stats": stats}
    except Exception as e:
        logger.error(f"Failed to get collection stats for {namespace}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed", response_model=IngestionResponse)
async def embed_documents(request: IngestionRequest):
    """Process and embed documents into vector storage"""
    try:
        cm = ensure_initialized()
        
        logger.info(f"Embedding {len(request.documents)} documents into namespace '{request.namespace}'")
        
        # Process documents and convert to embeddings
        processed_docs = []
        for i, doc in enumerate(request.documents):
            processed_doc = {
                "id": doc.get("id", f"{request.namespace}_{i}"),
                "text": doc.get("text", ""),
                "metadata": {
                    **doc.get("metadata", {}),
                    "namespace": request.namespace,
                    "ingested_at": datetime.utcnow().isoformat()
                }
            }
            processed_docs.append(processed_doc)
        
        # Add to ChromaDB (this will automatically create embeddings)
        count = cm.add_documents(request.namespace, processed_docs)
        
        logger.info(f"Successfully embedded {count} documents")
        
        return IngestionResponse(
            message=f"Successfully embedded {count} documents",
            namespace=request.namespace,
            document_count=count,
            status="success",
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to embed documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search_vectors(request: QueryRequest):
    """Search documents using vector similarity"""
    try:
        cm = ensure_initialized()
        
        logger.info(f"Vector search: '{request.query[:50]}...' in namespace '{request.namespace}'")
        
        # Perform vector similarity search
        namespace = request.namespace or "documents"
        
        # Get the collection
        collection = cm.get_or_create_collection(namespace)
        
        # Query the collection
        results = collection.query(
            query_texts=[request.query],
            n_results=request.n_results,
            where=request.filters if request.filters else None
        )
        
        # Format results
        search_results = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] and results["metadatas"][0] else {}
                distance = results["distances"][0][i] if results["distances"] and results["distances"][0] else 0.0
                doc_id = results["ids"][0][i] if results["ids"] and results["ids"][0] else f"doc_{i}"
                
                # Convert distance to relevance score (closer distance = higher relevance)
                relevance_score = max(0.0, 1.0 - distance)
                
                search_result = SearchResult(
                    id=doc_id,
                    content=doc,
                    metadata=metadata,
                    relevance_score=relevance_score,
                    namespace=namespace
                )
                search_results.append(search_result)
        
        return SearchResponse(
            namespace=namespace,
            query=request.query,
            results=search_results,
            total_found=len(search_results),
            auto_detected=False,
            detection_confidence=None,
            filters_applied=request.filters,
            search_timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/{namespace}")
async def search_namespace(namespace: str, request: QueryRequest):
    """Search in a specific namespace"""
    # Override the namespace from URL
    request.namespace = namespace
    return await search_vectors(request)

@app.get("/embeddings/test")
async def test_embeddings():
    """Test embedding functionality with sample data"""
    try:
        cm = ensure_initialized()
        
        # Sample documents for testing
        sample_docs = [
            {
                "id": "test_1",
                "text": "Machine learning is a subset of artificial intelligence that enables computers to learn without being explicitly programmed.",
                "metadata": {"subject": "machine_learning", "type": "definition"}
            },
            {
                "id": "test_2", 
                "text": "Python is a high-level programming language known for its simplicity and readability.",
                "metadata": {"subject": "programming", "type": "definition"}
            },
            {
                "id": "test_3",
                "text": "Vector databases store high-dimensional vectors and enable fast similarity search.",
                "metadata": {"subject": "databases", "type": "definition"}
            }
        ]
        
        # Embed the sample documents
        count = cm.add_documents("test", sample_docs)
        
        # Test search
        collection = cm.get_or_create_collection("test")
        results = collection.query(
            query_texts=["What is machine learning?"],
            n_results=2
        )
        
        return {
            "embedded_documents": count,
            "test_search_results": {
                "query": "What is machine learning?",
                "documents": results["documents"][0] if results["documents"] else [],
                "distances": results["distances"][0] if results["distances"] else [],
                "metadata": results["metadatas"][0] if results["metadatas"] else []
            }
        }
        
    except Exception as e:
        logger.error(f"Embedding test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_system_status():
    """Get system status"""
    try:
        cm = ensure_initialized()
        
        # Get collection statistics
        stats = cm.list_all_collections()
        
        return {
            "status": "operational",
            "timestamp": datetime.utcnow().isoformat(),
            "collections": stats,
            "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            "vector_database": "ChromaDB",
            "components": {
                "collection_manager": "initialized",
                "vector_storage": "ready"
            }
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
