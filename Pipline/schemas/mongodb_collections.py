"""
MongoDB Collection Schemas for Multi-Agent RAG System
=====================================================

This module defines the MongoDB collection schemas and database initialization.
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from pymongo import MongoClient, ASCENDING, TEXT
from config.settings import Settings
import logging

logger = logging.getLogger(__name__)

class MongoDBSchemas:
    """MongoDB schema definitions and collection initialization"""
    
    @staticmethod
    def create_indexes(db):
        """Create all necessary indexes for optimal performance"""
        try:
            # Materials collection indexes
            materials = db[Settings.MATERIALS_COLLECTION]
            materials.create_index([("title", TEXT), ("content", TEXT)])
            materials.create_index([("subject", ASCENDING)])
            materials.create_index([("difficulty", ASCENDING)])
            materials.create_index([("createdAt", ASCENDING)])
            
            # Reference books collection indexes
            books = db[Settings.BOOKS_COLLECTION]
            books.create_index([("title", TEXT), ("author", TEXT), ("summary", TEXT)])
            books.create_index([("subject", ASCENDING)])
            books.create_index([("difficulty", ASCENDING)])
            books.create_index([("key_concepts", ASCENDING)])
            
            # Videos collection indexes
            videos = db[Settings.VIDEOS_COLLECTION]
            videos.create_index([("title", TEXT), ("channel", TEXT)])
            videos.create_index([("topic_tags", ASCENDING)])
            videos.create_index([("duration_seconds", ASCENDING)])
            
            # Roadmap sessions collection indexes
            roadmaps = db[Settings.ROADMAPS_COLLECTION]
            roadmaps.create_index([("user_id", ASCENDING)])
            roadmaps.create_index([("status", ASCENDING)])
            roadmaps.create_index([("createdAt", ASCENDING)])
            
            # Vector chunks collection indexes
            chunks = db[Settings.CHUNKS_COLLECTION]
            chunks.create_index([("source_id", ASCENDING)])
            chunks.create_index([("source_type", ASCENDING)])
            chunks.create_index([("chunk_index", ASCENDING)])
            
            # User sessions collection indexes
            sessions = db[Settings.SESSIONS_COLLECTION]
            sessions.create_index([("user_id", ASCENDING)])
            sessions.create_index([("session_type", ASCENDING)])
            sessions.create_index([("createdAt", ASCENDING)])
            
            # Quizzes collection indexes
            quizzes = db[Settings.QUIZZES_COLLECTION]
            quizzes.create_index([("roadmap_session_id", ASCENDING)])
            quizzes.create_index([("concept", ASCENDING)])
            quizzes.create_index([("difficulty", ASCENDING)])
            
            logger.info("All MongoDB indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")

# Schema definitions as dictionaries for validation
MATERIALS_SCHEMA = {
    "_id": "str",  # Unique identifier
    "title": "str",  # Material title
    "content": "str",  # Full text content
    "file_url": "str",  # GridFS or external URL
    "subject": "str",  # Subject area (math, physics, etc.)
    "topic": "str",  # Specific topic
    "difficulty": "str",  # beginner, intermediate, advanced
    "file_type": "str",  # pdf, ppt, doc, etc.
    "file_size": "int",  # File size in bytes
    "page_count": "int",  # Number of pages
    "language": "str",  # Language of content
    "metadata": {
        "author": "str",
        "institution": "str",
        "academic_year": "str",
        "course_code": "str",
        "keywords": ["str"],
        "summary": "str"
    },
    "processing_status": "str",  # pending, processed, failed
    "embedding_status": "str",  # not_embedded, embedded, failed
    "chunk_count": "int",  # Number of chunks created
    "createdAt": "datetime",
    "updatedAt": "datetime"
}

REFERENCE_BOOKS_SCHEMA = {
    "_id": "str",
    "title": "str",
    "author": "str",
    "isbn": "str",
    "publisher": "str",
    "publication_year": "int",
    "edition": "str",
    "subject": "str",
    "difficulty": "str",  # beginner, intermediate, advanced
    "summary": "str",
    "key_concepts": ["str"],
    "chapter_breakdown": [
        {
            "chapter_number": "int",
            "title": "str",
            "page_range": "str",
            "concepts": ["str"]
        }
    ],
    "file_url": "str",  # GridFS reference
    "file_size": "int",
    "page_count": "int",
    "language": "str",
    "rating": "float",  # 1-5 star rating
    "prerequisites": ["str"],
    "learning_outcomes": ["str"],
    "processing_status": "str",
    "embedding_status": "str",
    "chunk_count": "int",
    "createdAt": "datetime",
    "updatedAt": "datetime"
}

VIDEOS_SCHEMA = {
    "_id": "str",
    "title": "str",
    "video_url": "str",
    "channel": "str",
    "instructor": "str",
    "duration_seconds": "int",
    "quality": "str",  # 720p, 1080p, etc.
    "subject": "str",
    "topic_tags": ["str"],
    "difficulty": "str",
    "description": "str",
    "transcript": "str",  # Auto-generated or manual
    "chapters": [
        {
            "title": "str",
            "start_time": "int",
            "end_time": "int",
            "concepts": ["str"]
        }
    ],
    "prerequisites": ["str"],
    "learning_outcomes": ["str"],
    "rating": "float",
    "view_count": "int",
    "language": "str",
    "subtitles_available": "bool",
    "processing_status": "str",
    "embedding_status": "str",
    "createdAt": "datetime",
    "updatedAt": "datetime"
}

ROADMAP_SESSIONS_SCHEMA = {
    "_id": "str",
    "user_id": "str",
    "session_type": "str",  # full_roadmap, quick_help, assessment
    "status": "str",  # in_progress, completed, abandoned
    "query": "str",  # Original user query
    
    # Interview stage
    "interview": {
        "questions": ["str"],
        "answers": [
            {
                "question": "str",
                "answer": "str",
                "timestamp": "datetime"
            }
        ],
        "completed": "bool"
    },
    
    # Skill evaluation
    "skill_evaluation": {
        "skill_breakdown": {
            "subject_name": "float"  # 0.0-1.0 proficiency
        },
        "overall_level": "str",  # beginner, intermediate, advanced
        "confidence_score": "float",
        "learning_style": "str",  # visual, auditory, kinesthetic, mixed
        "time_availability": "str",  # low, medium, high
        "strengths": ["str"],
        "weaknesses": ["str"]
    },
    
    # Concept gaps
    "concept_gaps": [
        {
            "concept": "str",
            "severity": "str",  # high, medium, low
            "explanation": "str",
            "estimated_learning_time": "int",  # hours
            "prerequisites": ["str"]
        }
    ],
    
    # Generated roadmap
    "roadmap": {
        "phases": [
            {
                "phase_number": "int",
                "title": "str",
                "description": "str",
                "estimated_duration": "int",  # hours
                "concepts": ["str"],
                "materials": [
                    {
                        "type": "str",  # pdf, book, video
                        "id": "str",
                        "title": "str",
                        "priority": "int",  # 1-5
                        "estimated_time": "int"
                    }
                ],
                "quizzes": ["str"],  # Quiz IDs
                "projects": ["str"],  # Project IDs
                "milestones": [
                    {
                        "title": "str",
                        "description": "str",
                        "deadline": "datetime"
                    }
                ]
            }
        ],
        "total_estimated_time": "int",
        "difficulty_progression": "str"
    },
    
    # Progress tracking
    "progress": {
        "current_phase": "int",
        "completed_materials": ["str"],
        "quiz_scores": [
            {
                "quiz_id": "str",
                "score": "float",
                "date": "datetime"
            }
        ],
        "project_completions": [
            {
                "project_id": "str",
                "status": "str",
                "submission_date": "datetime"
            }
        ],
        "time_spent": "int",  # minutes
        "completion_percentage": "float"
    },
    
    "createdAt": "datetime",
    "updatedAt": "datetime"
}

VECTOR_CHUNKS_SCHEMA = {
    "_id": "str",
    "source_id": "str",  # Reference to original document
    "source_type": "str",  # material, book, video
    "chunk_index": "int",  # Order within source
    "content": "str",  # Actual text content
    "metadata": {
        "page_number": "int",
        "section": "str",
        "concepts": ["str"],
        "difficulty": "str"
    },
    "embedding_id": "str",  # Reference to ChromaDB
    "token_count": "int",
    "processed_at": "datetime"
}

USER_SESSIONS_SCHEMA = {
    "_id": "str",
    "user_id": "str",
    "session_type": "str",  # search, roadmap, quiz, study
    "queries": [
        {
            "query": "str",
            "intent": "str",
            "results_count": "int",
            "timestamp": "datetime"
        }
    ],
    "interactions": [
        {
            "action": "str",  # view, download, bookmark
            "resource_id": "str",
            "resource_type": "str",
            "timestamp": "datetime"
        }
    ],
    "preferences": {
        "preferred_difficulty": "str",
        "learning_style": "str",
        "subject_interests": ["str"],
        "time_slots": ["str"]
    },
    "analytics": {
        "total_queries": "int",
        "most_searched_topics": ["str"],
        "preferred_resource_types": ["str"],
        "average_session_duration": "int"
    },
    "createdAt": "datetime",
    "lastActive": "datetime"
}

QUIZZES_SCHEMA = {
    "_id": "str",
    "roadmap_session_id": "str",
    "phase_number": "int",
    "concept": "str",
    "difficulty": "str",
    "questions": [
        {
            "question_id": "str",
            "type": "str",  # mcq, true_false, short_answer
            "question": "str",
            "options": ["str"],  # For MCQ
            "correct_answer": "str",
            "explanation": "str",
            "points": "int"
        }
    ],
    "time_limit": "int",  # minutes
    "passing_score": "float",  # percentage
    "attempts_allowed": "int",
    "created_by": "str",  # AI generated or manual
    "createdAt": "datetime"
}

def initialize_collections(db):
    """Initialize all collections with proper schemas and indexes"""
    try:
        # Create collections if they don't exist
        collections = [
            Settings.MATERIALS_COLLECTION,
            Settings.BOOKS_COLLECTION, 
            Settings.VIDEOS_COLLECTION,
            Settings.ROADMAPS_COLLECTION,
            Settings.CHUNKS_COLLECTION,
            Settings.SESSIONS_COLLECTION,
            Settings.QUIZZES_COLLECTION
        ]
        
        for collection_name in collections:
            if collection_name not in db.list_collection_names():
                db.create_collection(collection_name)
                logger.info(f"Created collection: {collection_name}")
        
        # Create indexes
        MongoDBSchemas.create_indexes(db)
        
        logger.info("All collections initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing collections: {e}")
        return False
