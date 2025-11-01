# API Models for MCP RAG Server
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request Models
class QueryRequest(BaseModel):
    """Request model for search queries"""
    query: str = Field(..., description="Search query text", min_length=1, max_length=1000)
    namespace: Optional[str] = Field(None, description="Target namespace (roadmap, pdf, books, videos)")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional filters for search")
    n_results: int = Field(5, description="Number of results to return", ge=1, le=20)
    user_id: Optional[str] = Field(None, description="User ID for personalization")
    user_level: str = Field("intermediate", description="User skill level")
    preferred_subjects: Optional[List[str]] = Field(None, description="User's preferred subjects")

class MultiSearchRequest(BaseModel):
    """Request model for multi-namespace search"""
    query: str = Field(..., description="Search query text", min_length=1, max_length=1000)
    namespaces: Optional[List[str]] = Field(None, description="List of namespaces to search")
    n_results_per_namespace: int = Field(3, description="Results per namespace", ge=1, le=10)
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional filters")

class IngestionRequest(BaseModel):
    """Request model for document ingestion"""
    namespace: str = Field(..., description="Target namespace for documents")
    documents: List[Dict[str, Any]] = Field(..., description="List of documents to ingest")
    
    class Config:
        schema_extra = {
            "example": {
                "namespace": "pdf",
                "documents": [
                    {
                        "id": "doc_001",
                        "text": "Document content here...",
                        "metadata": {
                            "title": "Sample Document",
                            "subject": "machine_learning",
                            "difficulty": "intermediate"
                        }
                    }
                ]
            }
        }

# Response Models
class SearchResult(BaseModel):
    """Individual search result"""
    id: str = Field(..., description="Document ID")
    content: str = Field(..., description="Document content")
    metadata: Dict[str, Any] = Field(..., description="Document metadata")
    relevance_score: float = Field(..., description="Relevance score (0-1)", ge=0, le=1)
    namespace: str = Field(..., description="Source namespace")
    display_title: Optional[str] = Field(None, description="Formatted title for display")
    page_reference: Optional[str] = Field(None, description="Page reference for PDFs")
    duration: Optional[str] = Field(None, description="Duration for videos")
    author: Optional[str] = Field(None, description="Author for books/papers")
    url: Optional[str] = Field(None, description="URL for videos/online content")

class SearchResponse(BaseModel):
    """Response model for search results"""
    namespace: str = Field(..., description="Search namespace")
    query: str = Field(..., description="Original query")
    results: List[SearchResult] = Field(..., description="Search results")
    total_found: int = Field(..., description="Number of results found")
    auto_detected: bool = Field(False, description="Whether namespace was auto-detected")
    detection_confidence: Optional[float] = Field(None, description="Confidence in auto-detection")
    filters_applied: Optional[Dict[str, Any]] = Field(None, description="Filters that were applied")
    search_timestamp: str = Field(..., description="ISO timestamp of search")

class MultiSearchResponse(BaseModel):
    """Response model for multi-namespace search"""
    query: str = Field(..., description="Original query")
    multi_namespace_results: List[SearchResult] = Field(..., description="Combined results from all namespaces")
    namespace_breakdown: Dict[str, Any] = Field(..., description="Results broken down by namespace")
    total_results: int = Field(..., description="Total number of results")
    search_timestamp: str = Field(..., description="ISO timestamp of search")

class IngestionResponse(BaseModel):
    """Response model for document ingestion"""
    message: str = Field(..., description="Status message")
    namespace: str = Field(..., description="Target namespace")
    document_count: int = Field(..., description="Number of documents processed")
    status: str = Field(..., description="Processing status")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class CollectionStatsResponse(BaseModel):
    """Response model for collection statistics"""
    namespace: str = Field(..., description="Namespace identifier")
    collection_name: str = Field(..., description="ChromaDB collection name")
    document_count: int = Field(..., description="Number of documents in collection")
    sample_metadata_keys: List[str] = Field(..., description="Sample metadata field names")
    embedding_function: str = Field(..., description="Embedding function being used")
    error: Optional[str] = Field(None, description="Error message if any")

# Document Models for Ingestion
class DocumentMetadata(BaseModel):
    """Standard metadata for documents"""
    title: Optional[str] = None
    subject: Optional[str] = None
    difficulty: Optional[str] = None
    author: Optional[str] = None
    created_at: Optional[str] = None
    source_url: Optional[str] = None

class PDFDocumentMetadata(DocumentMetadata):
    """Metadata specific to PDF documents"""
    pdf_id: str
    pdf_title: str
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    chunk_index: Optional[int] = None
    total_chunks: Optional[int] = None
    file_path: Optional[str] = None

class VideoDocumentMetadata(DocumentMetadata):
    """Metadata specific to video documents"""
    video_id: str
    duration_seconds: Optional[int] = None
    duration_formatted: Optional[str] = None
    instructor: Optional[str] = None
    platform: Optional[str] = None
    url: str
    thumbnail: Optional[str] = None
    tags: Optional[List[str]] = None
    view_count: Optional[int] = None
    rating: Optional[float] = None
    language: Optional[str] = None
    has_transcript: bool = False

class BookDocumentMetadata(DocumentMetadata):
    """Metadata specific to book documents"""
    book_id: str
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    edition: Optional[str] = None
    chapter: Optional[str] = None
    chapter_number: Optional[int] = None
    academic_level: Optional[str] = None

class RoadmapDocumentMetadata(DocumentMetadata):
    """Metadata specific to roadmap/learning path documents"""
    roadmap_id: str
    skill_level: Optional[str] = None
    estimated_time: Optional[str] = None
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    completion_criteria: Optional[List[str]] = None

# Error Models
class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Specific error code")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    path: Optional[str] = Field(None, description="Request path that caused error")

# Health Check Models
class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: str = Field(..., description="Check timestamp")

class ReadinessResponse(BaseModel):
    """Readiness check response"""
    status: str = Field(..., description="Readiness status")
    collections: int = Field(..., description="Number of available collections")
    timestamp: str = Field(..., description="Check timestamp")

# MCP-specific Request/Response Models
class RoadmapRequest(BaseModel):
    """Request model for roadmap generation"""
    user_id: str = Field(..., description="User ID")
    domain: str = Field(..., description="Learning domain/subject")
    skill_level: str = Field(..., description="Current skill level (beginner/intermediate/advanced)")
    daily_time: int = Field(..., description="Daily study time in minutes", ge=15, le=480)
    previous_answers: Dict[str, Any] = Field(..., description="Previous quiz/assessment answers")

class RoadmapPhase(BaseModel):
    """Individual phase in a learning roadmap"""
    phase_name: str = Field(..., description="Name of the learning phase")
    description: str = Field(..., description="Phase description")
    videos: List[str] = Field(..., description="List of recommended video URLs/IDs")
    pdfs: List[str] = Field(..., description="List of recommended PDF resources")
    reference_book: str = Field(..., description="Recommended reference book")
    quizzes: List[str] = Field(..., description="List of quiz IDs for assessment")

class RoadmapResponse(BaseModel):
    """Response model for roadmap generation"""
    roadmap: Dict[str, List[RoadmapPhase]] = Field(..., description="Generated learning roadmap")
    user_id: str = Field(..., description="User ID")
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class BookFilterRequest(BaseModel):
    """Request model for book filtering"""
    query: str = Field(..., description="Search query for books")
    academic_level: Optional[str] = Field(None, description="Academic level filter")

class BookRecommendation(BaseModel):
    """Individual book recommendation"""
    id: str = Field(..., description="Book ID")
    name: str = Field(..., description="Book title")
    pdf: str = Field(..., description="PDF filename")
    level: str = Field(..., description="Difficulty level")

class BookFilterResponse(BaseModel):
    """Response model for book filtering"""
    recommendations: List[BookRecommendation] = Field(..., description="List of recommended books")

class VideoFilterRequest(BaseModel):
    """Request model for video filtering"""
    query: str = Field(..., description="Search query for videos")
    duration_preference: Optional[str] = Field(None, description="Duration preference (short/medium/long)")

class VideoRecommendation(BaseModel):
    """Individual video recommendation"""
    id: str = Field(..., description="Video ID")
    name: str = Field(..., description="Video title")
    level: str = Field(..., description="Difficulty level")
    duration: str = Field(..., description="Video duration")
    url: str = Field(..., description="Video URL/filepath")

class VideoSequence(BaseModel):
    """Structured video learning sequence"""
    beginner: List[VideoRecommendation] = Field(..., description="Beginner-level videos")
    intermediate: List[VideoRecommendation] = Field(..., description="Intermediate-level videos")
    advanced: List[VideoRecommendation] = Field(..., description="Advanced-level videos")
    estimated_total_time: str = Field(..., description="Estimated total learning time")

class VideoFilterResponse(BaseModel):
    """Response model for video filtering"""
    video_sequence: VideoSequence = Field(..., description="Structured video learning sequence")

class MongoBookIngestRequest(BaseModel):
    """Request model for ingesting MongoDB books into ChromaDB"""
    subject_filter: Optional[str] = Field(None, description="Filter books by subject")
    difficulty_filter: Optional[str] = Field(None, description="Filter books by difficulty")
    limit: Optional[int] = Field(None, description="Limit number of books to ingest", ge=1, le=1000)
    namespace: str = Field("reference_books", description="ChromaDB namespace for books")
    force_update: bool = Field(False, description="Force re-ingestion of existing books")

class MongoBookIngestStats(BaseModel):
    """Statistics for book ingestion"""
    total_books_found: int = Field(..., description="Total books found in MongoDB")
    books_processed: int = Field(..., description="Number of books processed")
    books_ingested: int = Field(..., description="Number of books successfully ingested")
    books_skipped: int = Field(..., description="Number of books skipped (already exists)")
    errors: int = Field(..., description="Number of errors encountered")
    processing_time_seconds: float = Field(..., description="Total processing time")

class MongoBookIngestResponse(BaseModel):
    """Response model for MongoDB book ingestion"""
    success: bool = Field(..., description="Whether ingestion was successful")
    message: str = Field(..., description="Status message")
    stats: MongoBookIngestStats = Field(..., description="Ingestion statistics")
    errors: List[str] = Field(default=[], description="List of error messages")

class MongoBookSearchRequest(BaseModel):
    """Request model for searching MongoDB books"""
    query: Optional[str] = Field(None, description="Search query")
    subject: Optional[str] = Field(None, description="Subject filter")
    difficulty: Optional[str] = Field(None, description="Difficulty filter")
    limit: int = Field(20, description="Maximum number of results", ge=1, le=100)

class MongoBookInfo(BaseModel):
    """Information about a MongoDB book"""
    id: str = Field(..., description="Book ID")
    title: str = Field(..., description="Book title")
    author: Optional[str] = Field(None, description="Book author")
    subject: Optional[str] = Field(None, description="Book subject")
    difficulty: Optional[str] = Field(None, description="Difficulty level")
    rating: Optional[float] = Field(None, description="Book rating")
    pages: Optional[int] = Field(None, description="Number of pages")
    file_path: Optional[str] = Field(None, description="File path")
    tags: List[str] = Field(default=[], description="Book tags")

class MongoBookSearchResponse(BaseModel):
    """Response model for MongoDB book search"""
    books: List[MongoBookInfo] = Field(..., description="List of books found")
    total_count: int = Field(..., description="Total number of books found")

# Additional models for document management
class Document(BaseModel):
    """Individual document model"""
    id: str = Field(..., description="Document ID")
    text: str = Field(..., description="Document text content")
    metadata: Dict[str, Any] = Field(default={}, description="Document metadata")

class DocumentBatch(BaseModel):
    """Batch of documents for ingestion"""
    namespace: str = Field(..., description="Target namespace")
    documents: List[Document] = Field(..., description="List of documents")

class DocumentBatchResponse(BaseModel):
    """Response for document batch operations"""
    message: str = Field(..., description="Status message")
    namespace: str = Field(..., description="Target namespace")
    document_count: int = Field(..., description="Number of documents processed")

class DocumentDeleteRequest(BaseModel):
    """Request to delete specific documents"""
    namespace: str = Field(..., description="Source namespace")
    document_ids: List[str] = Field(..., description="List of document IDs to delete")

class DocumentDeleteResponse(BaseModel):
    """Response for document deletion"""
    message: str = Field(..., description="Status message")
    namespace: str = Field(..., description="Source namespace")
    deleted_count: int = Field(..., description="Number of documents deleted")

class CollectionResetRequest(BaseModel):
    """Request to reset a collection"""
    confirm: bool = Field(..., description="Confirmation flag")

class CollectionResetResponse(BaseModel):
    """Response for collection reset"""
    message: str = Field(..., description="Status message")
    namespace: str = Field(..., description="Collection namespace")
    success: bool = Field(..., description="Whether reset was successful")

class DriveIngestRequest(BaseModel):
    """Request for Google Drive ingestion"""
    folder_id: str = Field(..., description="Google Drive folder ID")
    download_dir: str = Field(..., description="Local download directory")

class DriveIngestResponse(BaseModel):
    """Response for Google Drive ingestion"""
    message: str = Field(..., description="Status message")
    folder_id: str = Field(..., description="Processed folder ID")
    ingestion_results: Dict[str, int] = Field(..., description="Results per content type")
    total_files: int = Field(..., description="Total files processed")
