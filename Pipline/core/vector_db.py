import chromadb
import logging

logger = logging.getLogger(__name__)

class VectorDBManager:
    def __init__(self, persist_directory="./chromadb"):
        self.client = chromadb.PersistentClient(path=persist_directory)
    
    def search_documents(self, collection_name, query_text, n_results=5):
        try:
            collection = self.client.get_collection(name=collection_name)
            results = collection.query(query_texts=[query_text], n_results=n_results)
            return results
        except Exception as e:
            logger.error(f"Search error: {e}")
            return {"documents": [], "metadatas": [], "distances": []}

vector_db = VectorDBManager()

