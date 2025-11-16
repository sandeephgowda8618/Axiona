from pymongo import MongoClient
from gridfs import GridFS
import logging
from config.settings import Settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages MongoDB connections and GridFS operations"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.fs = None
        self.connect()
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(Settings.MONGODB_URI)
            self.db = self.client[Settings.MONGODB_DATABASE]
            self.fs = GridFS(self.db)
            
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {Settings.MONGODB_DATABASE}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_collection(self, name: str):
        """Get MongoDB collection"""
        return self.db[name]
    
    def get_database(self):
        """Get MongoDB database instance"""
        return self.db
    
    def get_gridfs(self):
        """Get GridFS instance"""
        if self.fs is None:
            raise RuntimeError("GridFS not initialized")
        return self.fs
    
    def create_indexes(self):
        """Create all necessary indexes"""
        logger.info("Creating database indexes...")
        
        # Materials indexes
        materials = self.get_collection("materials")
        materials.create_index([("semester_id", 1), ("subject_id", 1), ("unit", 1)])
        materials.create_index([("tags", 1)])
        materials.create_index([("title", "text"), ("topic", "text")])
        
        # Reference books indexes
        books = self.get_collection("reference_books")
        books.create_index([("key_concepts", 1), ("difficulty", 1)])
        books.create_index([("title", "text"), ("author", "text"), ("summary", "text")])
        
        # Videos indexes
        videos = self.get_collection("videos")
        videos.create_index([("topic_tags", 1)])
        videos.create_index([("playlist_id", 1)])
        
        # Vector chunks indexes
        vector_chunks = self.get_collection("vector_chunks")
        vector_chunks.create_index([("source_collection", 1), ("source_id", 1)])
        vector_chunks.create_index([("embedding", "2dsphere")])
        
        # Roadmap sessions indexes
        roadmap_sessions = self.get_collection("roadmap_sessions")
        roadmap_sessions.create_index([("user_id", 1), ("status", 1)])
        
        # Subjects and semesters
        subjects = self.get_collection("subjects")
        subjects.create_index([("semester_id", 1)])
        
        semesters = self.get_collection("semesters")
        semesters.create_index([("semester_number", 1)])
        
        logger.info("Database indexes created successfully")
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")

# Global database instance
db_manager = DatabaseManager()
