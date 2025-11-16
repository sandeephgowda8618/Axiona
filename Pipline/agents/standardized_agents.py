"""
Standardized Retrieval Agents
============================

Standalone agent implementations that return JSON-only responses
according to the TODO specification.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from core.vector_db import VectorDBManager
from core.metadata_builder import MetadataBuilder
from config.database import db_manager
from config.settings import Settings
from core.ollama_service import ollama_service
from utils.json_utils import stringify_ids, clean_mongodb_result

logger = logging.getLogger(__name__)

class StandardizedRetrievalAgents:
    """Standardized retrieval agents that return JSON-only responses"""
    
    def __init__(self):
        self.vector_db = VectorDBManager(persist_directory="./chromadb")
        self.db = db_manager.get_database()
    
    async def pdf_search_agent(self, query: str, k: int = 10) -> Dict[str, Any]:
        """
        PDF/Document search agent - returns JSON array of metadata objects
        Searches both pes_materials and reference_books collections
        Ensures unique documents (no duplicates from multiple chunks)
        """
        try:
            # Vector search in ChromaDB
            results = self.vector_db.search_documents(
                collection_name="educational_content",
                query_text=query,
                n_results=k * 3  # Get more results to handle filtering
            )
            
            search_results = []
            seen_document_ids = set()  # Track documents we've already added
            
            if results and results.get("documents"):
                for i, doc_text in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                    source_id = metadata.get("source_id", "")
                    content_type = metadata.get("content_type", "")
                    
                    # Skip if we've already processed this document
                    if source_id in seen_document_ids:
                        continue
                    
                    # Determine collection and fetch full document
                    if content_type == "reference_book":
                        collection_name = Settings.BOOKS_COLLECTION
                    elif content_type == "pes_material":
                        collection_name = Settings.MATERIALS_COLLECTION
                    else:
                        continue
                    
                    doc = self.db[collection_name].find_one({"_id": source_id})
                    if doc:
                        # Mark this document as seen
                        seen_document_ids.add(source_id)
                        
                        # Calculate scores
                        semantic_score = 1.0 - (results["distances"][0][i] if results.get("distances") else 0.0)
                        pedagogical_score = 0.9 if content_type == "reference_book" else 0.8
                        relevance_score = MetadataBuilder.calculate_relevance_score(
                            semantic_score=semantic_score,
                            pedagogical_score=pedagogical_score,
                            recency_score=0.5,
                            engagement_score=0.3
                        )
                        
                        # Build standardized metadata
                        metadata_obj = MetadataBuilder.build_document_metadata(
                            mongo_doc=doc,
                            semantic_score=semantic_score,
                            relevance_score=relevance_score,
                            snippet=doc_text[:200] + "..." if len(doc_text) > 200 else doc_text
                        )
                        search_results.append(metadata_obj)
                        
                        # Stop when we have enough unique documents
                        if len(search_results) >= k:
                            break
            
            # Sort by relevance score 
            search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            # Return standardized response envelope
            return MetadataBuilder.build_search_response(
                results=search_results[:k],
                query=query,
                search_type="pdf_search",
                top_k=k
            )
            
        except Exception as e:
            logger.error(f"PDF search error: {e}")
            return MetadataBuilder.build_search_response(
                results=[],
                query=query,
                search_type="pdf_search",
                top_k=k
            )
    
    async def book_search_agent(self, query: str, k: int = 10) -> Dict[str, Any]:
        """
        Book search agent - returns JSON array of reference book metadata
        Searches only reference_books collection with book-specific fields
        Ensures unique books (no duplicates from multiple chunks)
        """
        try:
            # Vector search in ChromaDB with book filter
            results = self.vector_db.search_documents(
                collection_name="educational_content",
                query_text=query,
                n_results=k * 5  # Get more to filter for books only and handle duplicates
            )
            
            search_results = []
            seen_book_ids = set()  # Track books we've already added
            
            if results and results.get("documents"):
                for i, doc_text in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                    source_id = metadata.get("source_id", "")
                    content_type = metadata.get("content_type", "")
                    
                    # Only process reference books and avoid duplicates
                    if content_type != "reference_book" or source_id in seen_book_ids:
                        continue
                    
                    book = self.db[Settings.BOOKS_COLLECTION].find_one({"_id": source_id})
                    if book:
                        # Mark this book as seen
                        seen_book_ids.add(source_id)
                        
                        # Calculate scores (books get higher pedagogical scores)
                        semantic_score = 1.0 - (results["distances"][0][i] if results.get("distances") else 0.0)
                        pedagogical_score = 0.95  # Books are high quality educational content
                        relevance_score = MetadataBuilder.calculate_relevance_score(
                            semantic_score=semantic_score,
                            pedagogical_score=pedagogical_score,
                            recency_score=0.4,  # Books change less frequently
                            engagement_score=0.2
                        )
                        
                        # Build metadata with book-specific fields
                        metadata_obj = MetadataBuilder.build_document_metadata(
                            mongo_doc=book,
                            semantic_score=semantic_score,
                            relevance_score=relevance_score,
                            snippet=doc_text[:250] + "..." if len(doc_text) > 250 else doc_text
                        )
                        search_results.append(metadata_obj)
                        
                        # Stop when we have enough unique books
                        if len(search_results) >= k:
                            break
            
            # If we don't have enough results from vector search, supplement with direct MongoDB search
            if len(search_results) < k:
                # Try MongoDB text search or title regex search
                mongo_results = self.db[Settings.BOOKS_COLLECTION].find({
                    "$or": [
                        {"title": {"$regex": query, "$options": "i"}},
                        {"summary": {"$regex": query, "$options": "i"}},
                        {"key_concepts": {"$in": [query.split()]}}
                    ]
                }).limit(k - len(search_results))
                
                for book in mongo_results:
                    book_id = str(book.get("_id", ""))
                    if book_id not in seen_book_ids:
                        seen_book_ids.add(book_id)
                        
                        # Lower relevance score for direct MongoDB matches
                        relevance_score = 0.4
                        
                        metadata_obj = MetadataBuilder.build_document_metadata(
                            mongo_doc=book,
                            semantic_score=0.3,  # Lower semantic score for text-based match
                            relevance_score=relevance_score,
                            snippet=f"Title match: {book.get('title', '')[:200]}..."
                        )
                        search_results.append(metadata_obj)
            
            # Sort by relevance score
            search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            # Return standardized response envelope
            return MetadataBuilder.build_search_response(
                results=search_results[:k],
                query=query,
                search_type="book_search",
                top_k=k
            )
            
        except Exception as e:
            logger.error(f"Book search error: {e}")
            return MetadataBuilder.build_search_response(
                results=[],
                query=query,
                search_type="book_search",
                top_k=k
            )
    
    async def video_search_agent(self, query: str, k: int = 10) -> Dict[str, Any]:
        """
        Video search agent - returns JSON array of video metadata
        Searches videos collection and includes video-specific metadata
        """
        try:
            # Search videos directly in MongoDB (since they may not be in ChromaDB)
            # Use text search if available, otherwise get all and filter
            video_cursor = self.db[Settings.VIDEOS_COLLECTION].find(
                {"$text": {"$search": query}} if self.db[Settings.VIDEOS_COLLECTION].index_information().get("title_text") else {}
            ).limit(k)
            
            search_results = []
            
            for video in video_cursor:
                # Calculate basic relevance score for videos
                # This could be enhanced with video-specific scoring
                title_match = any(word.lower() in video.get("title", "").lower() for word in query.split())
                relevance_score = 0.8 if title_match else 0.5
                
                metadata_obj = MetadataBuilder.build_video_metadata(
                    mongo_doc=video,
                    relevance_score=relevance_score,
                    snippet=f"Video: {video.get('title', '')} - Duration: {video.get('duration_seconds', 0)} seconds"
                )
                search_results.append(metadata_obj)
            
            # If no text search results, fall back to title search
            if not search_results:
                video_cursor = self.db[Settings.VIDEOS_COLLECTION].find(
                    {"title": {"$regex": query, "$options": "i"}}
                ).limit(k)
                
                for video in video_cursor:
                    relevance_score = 0.6  # Lower score for regex match
                    metadata_obj = MetadataBuilder.build_video_metadata(
                        mongo_doc=video,
                        relevance_score=relevance_score,
                        snippet=f"Video: {video.get('title', '')}"
                    )
                    search_results.append(metadata_obj)
            
            # Sort by relevance score
            search_results.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            # Return standardized response envelope
            return MetadataBuilder.build_search_response(
                results=search_results[:k],
                query=query,
                search_type="video_search",
                top_k=k
            )
            
        except Exception as e:
            logger.error(f"Video search error: {e}")
            return MetadataBuilder.build_search_response(
                results=[],
                query=query,
                search_type="video_search",
                top_k=k
            )

class StandardizedQuizGenerator:
    """Quiz generator that returns structured JSON with source provenance"""
    
    def __init__(self):
        self.vector_db = VectorDBManager(persist_directory="./chromadb")
        self.db = db_manager.get_database()
    
    async def generate_quiz(
        self, 
        topic: str, 
        n_questions: int = 10, 
        difficulty: str = "intermediate",
        format: str = "mcq"
    ) -> Dict[str, Any]:
        """
        Generate quiz with source provenance
        
        Args:
            topic: Topic for quiz questions
            n_questions: Number of questions to generate
            difficulty: Difficulty level (beginner/intermediate/advanced)
            format: Question format (mcq for now)
        
        Returns:
            Structured quiz JSON with source chunks
        """
        try:
            # Search for relevant content chunks
            results = self.vector_db.search_documents(
                collection_name="educational_content",
                query_text=topic,
                n_results=min(20, n_questions * 3)  # Get enough content for questions
            )
            
            source_chunks = []
            content_for_quiz = []
            
            if results and results.get("documents"):
                for i, doc_text in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                    source_id = metadata.get("source_id", "")
                    chunk_id = f"{source_id}_chunk_{i}"
                    
                    source_chunks.append(chunk_id)
                    content_for_quiz.append(doc_text)
            
            # Generate quiz using LLM with the content
            quiz_prompt = f"""Create a quiz about {topic} with {n_questions} multiple choice questions at {difficulty} level.

Base your questions on this educational content:
{chr(10).join(content_for_quiz[:5])}

Return ONLY a JSON object with this structure:
{{
  "topic": "{topic}",
  "n_questions": {n_questions},
  "questions": [
    {{
      "id": "q1",
      "type": "mcq",
      "stem": "Question text here?",
      "choices": [
        {{"id": "a", "text": "Option A", "is_correct": false}},
        {{"id": "b", "text": "Option B", "is_correct": true}},
        {{"id": "c", "text": "Option C", "is_correct": false}},
        {{"id": "d", "text": "Option D", "is_correct": false}}
      ],
      "explanation": "Explanation why B is correct",
      "difficulty": "{difficulty}"
    }}
  ]
}}

Ensure exactly {n_questions} questions, each with 4 choices and exactly one correct answer."""
            
            # Call LLM
            response = await ollama_service.generate_response(quiz_prompt, temperature=0.3)
            
            # Parse LLM response
            try:
                quiz_data = json.loads(response)
            except json.JSONDecodeError:
                # Fallback if LLM doesn't return valid JSON
                quiz_data = {
                    "topic": topic,
                    "n_questions": n_questions,
                    "questions": [
                        {
                            "id": f"q{i+1}",
                            "type": "mcq",
                            "stem": f"Sample question {i+1} about {topic}?",
                            "choices": [
                                {"id": "a", "text": "Option A", "is_correct": False},
                                {"id": "b", "text": "Option B", "is_correct": True},
                                {"id": "c", "text": "Option C", "is_correct": False},
                                {"id": "d", "text": "Option D", "is_correct": False}
                            ],
                            "explanation": "Sample explanation",
                            "difficulty": difficulty
                        } for i in range(n_questions)
                    ]
                }
            
            # Add metadata with source provenance
            quiz_data["meta"] = {
                "generated_at": datetime.now().isoformat(),
                "source_chunks": source_chunks[:10]  # Limit source chunks
            }
            
            return quiz_data
            
        except Exception as e:
            logger.error(f"Quiz generation error: {e}")
            return {
                "topic": topic,
                "n_questions": 0,
                "questions": [],
                "meta": {
                    "generated_at": datetime.now().isoformat(),
                    "source_chunks": [],
                    "error": str(e)
                }
            }

# Global instances for easy import
retrieval_agents = StandardizedRetrievalAgents()
quiz_generator = StandardizedQuizGenerator()
