# Environment Configuration
import os
from pathlib import Path
from typing import Optional

class Config:
    """Application configuration"""
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # API Settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    API_WORKERS: int = int(os.getenv("API_WORKERS", 1))
    
    # ChromaDB Settings
    CHROMA_PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "./vector_db")
    CHROMA_HOST: Optional[str] = os.getenv("CHROMA_HOST")
    CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", 8000))
    
    # Google Gemini Settings (Primary AI)
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "models/gemini-1.5-pro")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "models/embedding-001")
    
    # Perplexity Settings (LLM Alternative)
    PERPLEXITY_API_KEY: Optional[str] = os.getenv("PERPLEXITY_API_KEY")
    PERPLEXITY_MODEL: str = os.getenv("PERPLEXITY_MODEL", "pplx-70b-online")
    
    # Fallback Local Embeddings
    LOCAL_EMBEDDING_MODEL: str = os.getenv("LOCAL_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    USE_LOCAL_EMBEDDINGS: bool = os.getenv("USE_LOCAL_EMBEDDINGS", "false").lower() == "true"
    
    # Search Settings
    DEFAULT_SEARCH_RESULTS: int = int(os.getenv("DEFAULT_SEARCH_RESULTS", 5))
    MAX_SEARCH_RESULTS: int = int(os.getenv("MAX_SEARCH_RESULTS", 20))
    
    # Cache Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", 3600))  # 1 hour
    ENABLE_CACHE: bool = os.getenv("ENABLE_CACHE", "true").lower() == "true"
    
    # PDF Processing
    PDF_CHUNK_SIZE: int = int(os.getenv("PDF_CHUNK_SIZE", 1000))
    PDF_CHUNK_OVERLAP: int = int(os.getenv("PDF_CHUNK_OVERLAP", 200))
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", 60))  # seconds
    
    # MongoDB Settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "study-ai")
    MONGODB_COLLECTION: str = os.getenv("MONGODB_COLLECTION", "books")
    
    # Monitoring
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    METRICS_PORT: int = int(os.getenv("METRICS_PORT", 9090))
    
    @classmethod
    def validate(cls):
        """Validate configuration"""
        errors = []
        
        if cls.ENVIRONMENT == "production":
            if not cls.GOOGLE_API_KEY and not cls.LOCAL_EMBEDDING_MODEL:
                errors.append("Either GOOGLE_API_KEY or LOCAL_EMBEDDING_MODEL must be set")
            
            if cls.CHROMA_HOST and not cls.CHROMA_PORT:
                errors.append("CHROMA_PORT must be set when using CHROMA_HOST")
        
        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")
        
        return True

# Initialize and validate config
config = Config()
config.validate()
