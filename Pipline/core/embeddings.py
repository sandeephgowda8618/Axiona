from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Union
import logging
from config.settings import Settings

logger = logging.getLogger(__name__)

class EmbeddingManager:
    """Manages text embeddings using sentence-transformers"""
    
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the embedding model"""
        try:
            logger.info(f"Loading embedding model: {Settings.EMBEDDING_MODEL}")
            self.model = SentenceTransformer(Settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def encode_text(self, text: str) -> List[float]:
        """Encode single text to embedding"""
        try:
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to encode text: {e}")
            return []
    
    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """Encode multiple texts to embeddings"""
        try:
            embeddings = self.model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Failed to encode batch: {e}")
            return []
    
    def cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return dot_product / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Failed to calculate cosine similarity: {e}")
            return 0.0
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings"""
        return Settings.EMBEDDING_DIMENSION

# Global embedding instance
embedding_manager = EmbeddingManager()
