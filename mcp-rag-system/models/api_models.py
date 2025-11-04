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

class RoadmapResource(BaseModel):
    """Rich resource information for roadmap display"""
    title: str = Field(..., description="Resource title")
    author: Optional[str] = Field(None, description="Resource author")
    subject: Optional[str] = Field(None, description="Subject area")
    file_name: Optional[str] = Field(None, description="File name")
    file_url: Optional[str] = Field(None, description="Download URL")
    document_id: Optional[str] = Field(None, description="MongoDB document ID")
    file_type: Optional[str] = Field(None, description="File type (PDF, PPTX, etc.)")
    level: Optional[str] = Field(None, description="Difficulty level")
    tags: Optional[str] = Field(None, description="Resource tags")
    pages: Optional[str] = Field(None, description="Number of pages")
    duration: Optional[str] = Field(None, description="Video duration")
    views: Optional[str] = Field(None, description="View count for videos")
    semester: Optional[str] = Field(None, description="Academic semester")
    unit: Optional[str] = Field(None, description="Unit number")
    topic: Optional[str] = Field(None, description="Specific topic")
    url: Optional[str] = Field(None, description="External URL")
    video_id: Optional[str] = Field(None, description="Video ID")
    isbn: Optional[str] = Field(None, description="Book ISBN")
    publisher: Optional[str] = Field(None, description="Publisher")
    publication_year: Optional[str] = Field(None, description="Publication year")
    category: Optional[str] = Field(None, description="Resource category")
    approved: Optional[str] = Field(None, description="Approval status")
    source_type: str = Field(..., description="Source type (studymaterial, video, book)")
    relevance_score: float = Field(..., description="Relevance score (0-1)")

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



class RoadmapResponse(BaseModel):
    """Response model for roadmap generation"""
    roadmap: Dict[str, Any] = Field(..., description="Generated learning roadmap")
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

# Roadmap Generation Models
class RoadmapPhaseData(BaseModel):
    """Data for a single phase of the roadmap wizard"""
    goal: Optional[str] = None
    currentLevel: Optional[str] = None
    experience: Optional[str] = None
    timeCommitment: Optional[str] = None
    timeframe: Optional[str] = None
    learningStyle: Optional[str] = None
    budget: Optional[str] = None
    primaryMotivation: Optional[str] = None
    successMetric: Optional[str] = None

class RoadmapGenerationRequest(BaseModel):
    """Request model for roadmap generation"""
    user_id: Optional[str] = Field(None, description="User ID for personalization")
    phase1: Optional[Dict[str, Any]] = Field(None, description="Goals and objectives phase")
    phase2: Optional[Dict[str, Any]] = Field(None, description="Background and experience phase")
    phase3: Optional[Dict[str, Any]] = Field(None, description="Timeline and commitment phase")
    phase4: Optional[Dict[str, Any]] = Field(None, description="Resources and preferences phase")
    phase5: Optional[Dict[str, Any]] = Field(None, description="Motivation and success phase")
    search_namespaces: Optional[List[str]] = Field(
        default=["roadmap", "pdf", "books", "videos"], 
        description="Namespaces to search for relevant content"
    )
    max_resources: int = Field(5, description="Maximum number of resources to include", ge=1, le=10)
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user_123",
                "phase1": {
                    "goal": "Learn machine learning"
                },
                "phase2": {
                    "currentLevel": "beginner",
                    "experience": "Some Python programming"
                },
                "phase3": {
                    "timeCommitment": "10 hours",
                    "timeframe": "week"
                },
                "phase4": {
                    "learningStyle": "hands-on",
                    "budget": "free"
                },
                "phase5": {
                    "primaryMotivation": "career_change",
                    "successMetric": "Build a portfolio project"
                }
            }
        }

class RoadmapPhase(BaseModel):
    """Individual phase in a generated roadmap"""
    title: str = Field(..., description="Phase title")
    content: str = Field(..., description="Phase content and instructions")
    duration: Optional[str] = Field(None, description="Estimated duration")
    objectives: Optional[List[str]] = Field(None, description="Learning objectives")
    resources: Optional[List[str]] = Field(None, description="Recommended resources")
    milestones: Optional[List[str]] = Field(None, description="Success milestones")

class RoadmapGenerationResponse(BaseModel):
    """Response model for generated roadmap"""
    user_profile: str = Field(..., description="Formatted user profile summary")
    roadmap_content: str = Field(..., description="Generated roadmap content")
    phases: List[RoadmapPhase] = Field(..., description="Structured roadmap phases")
    estimated_duration: str = Field(..., description="Total estimated duration")
    personalization_score: float = Field(..., description="Personalization quality score (0-1)")
    relevant_resources: int = Field(..., description="Number of relevant resources found")
    model_used: str = Field(..., description="LLM model used for generation")
    generated_at: str = Field(..., description="ISO timestamp of generation")
    success: bool = Field(True, description="Generation success status")
    resource_metadata: Optional[List[RoadmapResource]] = Field(None, description="Detailed resource metadata for frontend display")
    
class RoadmapSearchRequest(BaseModel):
    """Request model for searching roadmap-related content"""
    query: str = Field(..., description="Search query derived from user profile")
    user_level: str = Field("intermediate", description="User skill level")
    goal: Optional[str] = Field(None, description="User's learning goal")
    namespaces: List[str] = Field(
        default=["roadmap", "pdf", "books", "videos"],
        description="Namespaces to search"
    )
    n_results: int = Field(5, description="Number of results per namespace", ge=1, le=10)

# StudyPES Material Models
class StudyPESMaterial(BaseModel):
    """Individual StudyPES material"""
    id: str = Field(..., description="Material ID")
    title: str = Field(..., description="Material title")
    description: Optional[str] = Field("", description="Material description")
    url: Optional[str] = Field("", description="Material URL")
    pdfUrl: Optional[str] = Field("", description="PDF URL")
    fileSize: Optional[str] = Field("N/A", description="File size")
    pages: Optional[int] = Field(0, description="Number of pages")
    author: Optional[str] = Field("Unknown", description="Author")
    semester: Optional[int] = Field(0, description="Semester")
    year: Optional[str] = Field("", description="Academic year")
    type: Optional[str] = Field("PDF", description="Material type")
    difficulty: Optional[str] = Field("Medium", description="Difficulty level")

class StudyPESUnit(BaseModel):
    """Unit containing StudyPES materials"""
    name: str = Field(..., description="Unit name")
    materials: List[StudyPESMaterial] = Field(..., description="Materials in this unit")

class StudyPESSubject(BaseModel):
    """Subject containing units and materials"""
    name: str = Field(..., description="Subject name")
    units: Dict[str, List[StudyPESMaterial]] = Field(..., description="Units with their materials")
    totalMaterials: int = Field(..., description="Total number of materials in subject")

class StudyPESSubjectsResponse(BaseModel):
    """Response model for StudyPES subjects endpoint"""
    subjects: Dict[str, StudyPESSubject] = Field(..., description="All subjects organized by name")
    totalSubjects: int = Field(..., description="Total number of subjects")
    totalMaterials: int = Field(..., description="Total number of materials across all subjects")
    success: bool = Field(True, description="Request success status")
    message: str = Field("StudyPES materials retrieved successfully", description="Response message")
