import os
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    # MongoDB Configuration
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "axiona_rag_pipeline")
    
    # Collections
    MATERIALS_COLLECTION: str = os.getenv("MONGODB_COLLECTION_MATERIALS", "pes_materials")
    BOOKS_COLLECTION: str = os.getenv("MONGODB_COLLECTION_BOOKS", "reference_books") 
    VIDEOS_COLLECTION: str = os.getenv("MONGODB_COLLECTION_VIDEOS", "videos")
    ROADMAPS_COLLECTION: str = os.getenv("MONGODB_COLLECTION_ROADMAPS", "roadmap_sessions")
    SESSIONS_COLLECTION: str = os.getenv("MONGODB_COLLECTION_SESSIONS", "user_sessions")
    CHUNKS_COLLECTION: str = os.getenv("MONGODB_COLLECTION_CHUNKS", "chunks")
    QUIZZES_COLLECTION: str = os.getenv("MONGODB_COLLECTION_QUIZZES", "quizzes")
    
    # GridFS Buckets
    MATERIALS_BUCKET: str = os.getenv("GRIDFS_BUCKET_MATERIALS", "materials_fs")
    BOOKS_BUCKET: str = os.getenv("GRIDFS_BUCKET_BOOKS", "books_fs")
    VIDEOS_BUCKET: str = os.getenv("GRIDFS_BUCKET_VIDEOS", "videos_fs")
    
    # ChromaDB Configuration
    CHROMADB_PATH: str = os.getenv("CHROMADB_PATH", "./Data/chromadb")
    CHROMADB_MATERIALS: str = os.getenv("CHROMADB_COLLECTION_MATERIALS", "material_embeddings")
    CHROMADB_BOOKS: str = os.getenv("CHROMADB_COLLECTION_BOOKS", "book_embeddings")
    CHROMADB_VIDEOS: str = os.getenv("CHROMADB_COLLECTION_VIDEOS", "video_embeddings")
    
    # Embedding Configuration
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    
    # Ollama LLM Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1")
    OLLAMA_TEMPERATURE: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.7"))
    OLLAMA_MAX_TOKENS: int = int(os.getenv("OLLAMA_MAX_TOKENS", "4096"))
    CHROMADB_VIDEOS: str = os.getenv("CHROMADB_COLLECTION_VIDEOS", "video_embeddings")
    
    # Embedding Configuration
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    
    # AI Model Configuration
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "models/gemini-1.5-pro")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    # Local LLM Configuration
    LOCAL_LLM_MODEL: str = os.getenv("LOCAL_LLM_MODEL", "llama2")
    LOCAL_LLM_HOST: str = os.getenv("LOCAL_LLM_HOST", "http://localhost:11434")
    LOCAL_LLM_TIMEOUT: int = int(os.getenv("LOCAL_LLM_TIMEOUT", "300"))
    
    # FastAPI Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_WORKERS: int = int(os.getenv("API_WORKERS", "4"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:8080"
    ]
    
    # File Processing Configuration
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1024"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    PDF_PROCESSING_TIMEOUT: int = int(os.getenv("PDF_PROCESSING_TIMEOUT", "120"))
    
    # Batch Processing Configuration
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "10"))
    MAX_CONCURRENT_DOWNLOADS: int = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "5"))
    DOWNLOAD_TIMEOUT: int = int(os.getenv("DOWNLOAD_TIMEOUT", "60"))
    RETRY_ATTEMPTS: int = int(os.getenv("RETRY_ATTEMPTS", "3"))
    
    # Data Directories
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", "./Data"))
    DOWNLOADS_DIR: Path = Path(os.getenv("DOWNLOADS_DIR", "./Data/downloads"))
    METADATA_DIR: Path = Path(os.getenv("METADATA_DIR", "./Data/metadata"))
    EMBEDDINGS_DIR: Path = Path(os.getenv("EMBEDDINGS_DIR", "./Data/embeddings"))
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "./logs/pipeline.log")
    
    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key_for_sessions_here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Agent Configuration
    MAX_INTERVIEW_QUESTIONS: int = int(os.getenv("MAX_INTERVIEW_QUESTIONS", "10"))
    ROADMAP_MAX_DURATION_WEEKS: int = int(os.getenv("ROADMAP_MAX_DURATION_WEEKS", "52"))
    DIFFICULTY_LEVELS: List[str] = os.getenv("DIFFICULTY_LEVELS", "").split(",") if os.getenv("DIFFICULTY_LEVELS") else [
        "Beginner", "Intermediate", "Advanced", "Expert"
    ]
    SUBJECT_AREAS: List[str] = os.getenv("SUBJECT_AREAS", "").split(",") if os.getenv("SUBJECT_AREAS") else [
        "Computer Science", "Mathematics", "Data Science", "Physics", "Engineering", "Business"
    ]

# Create an instance for easy importing
settings = Settings()

# Create directories on initialization
def ensure_directories():
    """Create necessary directories if they don't exist"""
    dirs_to_create = [
        settings.DATA_DIR,
        settings.DOWNLOADS_DIR,
        settings.METADATA_DIR,
        settings.EMBEDDINGS_DIR,
        Path(settings.LOG_FILE).parent
    ]
    
    for dir_path in dirs_to_create:
        dir_path.mkdir(parents=True, exist_ok=True)

# Initialize directories
ensure_directories()
