# ChromaDB Configuration - Updated for New API
import chromadb
import os
from pathlib import Path

class ChromaDBConfig:
    def __init__(self, persist_directory: str = "./vector_db"):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
    def get_client(self):
        """Get ChromaDB client instance using new API"""
        return chromadb.PersistentClient(
            path=str(self.persist_directory)
        )
    
    def get_production_client(self, host: str = "localhost", port: int = 8000):
        """Get ChromaDB client for production (server mode)"""
        return chromadb.HttpClient(host=host, port=port)

# Global configuration
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIRECTORY", "./vector_db")
chroma_config = ChromaDBConfig(CHROMA_PERSIST_DIR)

# Initialize global client
if os.getenv("ENVIRONMENT") == "production":
    chroma_client = chroma_config.get_production_client(
        host=os.getenv("CHROMA_HOST", "localhost"),
        port=int(os.getenv("CHROMA_PORT", 8000))
    )
else:
    chroma_client = chroma_config.get_client()
