"""
Enhanced Semantic Filtering for Multi-Agent RAG System
=====================================================

This module implements the critical semantic filtering improvements
identified in the TODO.md analysis. These functions provide precise
subject, unit, and difficulty-based filtering for educational resources.

Created: November 15, 2025
Purpose: Fix unrelated resource retrieval issues identified in test analysis
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

from config.database import db_manager
from config.settings import Settings
from utils.json_utils import stringify_ids

logger = logging.getLogger(__name__)

class EnhancedSemanticFiltering:
    """Enhanced filtering logic for precise educational resource retrieval"""
    
    def __init__(self):
        try:
            self.db = db_manager.get_database()
            if self.db is None:
                logger.error("Database connection is None")
                raise ValueError("Database connection failed. Check database configuration.")
            logger.info("Enhanced filtering initialized with database connection")
        except Exception as e:
            logger.error(f"Failed to initialize enhanced filtering: {e}")
            raise
        
        # Subject category mappings for precise filtering
        self.subject_categories = {
            "Operating Systems": {
                "keywords": ["operating", "os", "system", "kernel", "process", "thread", "memory", "filesystem"],
                "folder_patterns": ["OS", "operating", "system"],
                "book_categories": ["systems", "operating systems", "computer systems"]
            },
            "Data Structures": {
                "keywords": ["data structure", "algorithm", "dsa", "tree", "graph", "array", "linked"],
                "folder_patterns": ["DSA", "algorithms", "datastructures"],
                "book_categories": ["algorithms", "data structures", "programming"]
            },
            "Databases": {
                "keywords": ["database", "sql", "dbms", "nosql", "query", "relation"],
                "folder_patterns": ["DB", "database", "sql"],
                "book_categories": ["database", "sql", "dbms"]
            },
            "Mathematics": {
                "keywords": ["math", "calculus", "algebra", "statistics", "probability"],
                "folder_patterns": ["Math", "mathematics", "stats"],
                "book_categories": ["mathematics", "statistics", "calculus"]
            },
            "Computer Networks": {
                "keywords": ["network", "protocol", "tcp", "ip", "routing", "communication"],
                "folder_patterns": ["Networks", "networking", "communication"],
                "book_categories": ["networking", "communication", "protocols"]
            }
        }
        
        # Phase-to-unit mapping (standardized across subjects)
        self.phase_unit_mapping = {
            1: {"unit": 1, "difficulty": "beginner", "concepts": ["introduction", "basics", "fundamentals"]},
            2: {"unit": 2, "difficulty": "intermediate", "concepts": ["implementation", "algorithms", "core"]},
            3: {"unit": 3, "difficulty": "intermediate", "concepts": ["advanced", "optimization", "complex"]},
            4: {"unit": 4, "difficulty": "advanced", "concepts": ["integration", "projects", "applications"]}
        }
    
    def filter_pes_materials_by_phase(self, subject: str, phase_number: int, max_results: int = 10) -> Dict[str, Any]:
        """
        Filter PES materials by subject and unit for specific phase
        
        Args:
            subject: Course subject (OS, DSA, Math, etc.)
            phase_number: Target phase (1-4) maps to unit number
            max_results: Maximum materials to return
            
        Returns:
            Dict with filtered PES materials or error information
        """
        try:
            phase_info = self.phase_unit_mapping.get(phase_number, {})
            target_unit = phase_info.get("unit", phase_number)
            
            # Get subject keywords for filtering
            subject_info = self.subject_categories.get(subject, {})
            subject_keywords = subject_info.get("keywords", [subject.lower()])
            folder_patterns = subject_info.get("folder_patterns", [subject])
            
            # Build MongoDB filter query
            filters = {
                "$and": [
                    # Unit-based filtering (exact match)
                    {"unit": target_unit},
                    
                    # Subject-based filtering (multiple criteria)
                    {"$or": [
                        # Subject field exact match
                        {"subject": {"$regex": subject, "$options": "i"}},
                        
                        # Folder path analysis
                        {"$or": [
                            {"pdf_path": {"$regex": pattern, "$options": "i"}} 
                            for pattern in folder_patterns
                        ]},
                        
                        # Title/content keyword matching
                        {"$or": [
                            {"title": {"$regex": "|".join(subject_keywords), "$options": "i"}},
                            {"key_concepts": {"$in": subject_keywords}}
                        ]}
                    ]}
                ]
            }
            
            logger.info(f"PES Materials Query - Subject: {subject}, Phase: {phase_number}, Unit: {target_unit}")
            logger.debug(f"Filters: {filters}")
            
            # Execute query
            if self.db is None:
                raise RuntimeError("Database connection is not available")
                
            cursor = self.db[Settings.MATERIALS_COLLECTION].find(filters).limit(max_results)
            results = list(cursor)
            
            # Clean and process results
            processed_results = []
            for doc in results:
                # Validate unit match (double-check)
                doc_unit = doc.get("unit")
                if doc_unit != target_unit:
                    logger.warning(f"Unit mismatch: expected {target_unit}, got {doc_unit}")
                    continue
                
                # Add relevance scoring
                relevance_score = self._calculate_pes_relevance(doc, subject, phase_info)
                
                # Build standardized metadata
                processed_doc = stringify_ids(doc)
                processed_doc["relevance_score"] = relevance_score
                processed_doc["content_type"] = "pes_material"
                processed_doc["source"] = "PES_slides"
                
                processed_results.append(processed_doc)
            
            # Sort by relevance
            processed_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            # Validation and error handling
            if not processed_results:
                error_msg = f"No Unit {target_unit} materials found for {subject}"
                suggestion = f"Check if PES materials exist for {subject} Unit {target_unit}"
                
                logger.warning(f"PES Materials Search Failed: {error_msg}")
                
                return {
                    "results": [],
                    "meta": {
                        "query": f"{subject} Phase {phase_number}",
                        "search_type": "pes_materials",
                        "returned": 0,
                        "top_k": max_results,
                        "timestamp": datetime.utcnow().isoformat(),
                        "error": error_msg,
                        "suggestion": suggestion,
                        "filters_applied": {
                            "subject": subject,
                            "unit": target_unit,
                            "phase": phase_number
                        }
                    }
                }
            
            logger.info(f"Found {len(processed_results)} PES materials for {subject} Unit {target_unit}")
            
            return {
                "results": processed_results,
                "meta": {
                    "query": f"{subject} Phase {phase_number}",
                    "search_type": "pes_materials",
                    "returned": len(processed_results),
                    "top_k": max_results,
                    "timestamp": datetime.utcnow().isoformat(),
                    "filters_applied": {
                        "subject": subject,
                        "unit": target_unit,
                        "phase": phase_number
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in PES materials filtering: {str(e)}")
            return {
                "results": [],
                "meta": {
                    "error": f"Internal error: {str(e)}",
                    "query": f"{subject} Phase {phase_number}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def filter_reference_books_by_subject(self, subject: str, phase_concepts: List[str], 
                                         difficulty: str = "intermediate") -> Dict[str, Any]:
        """
        Select the single best reference book for a subject and phase
        
        Args:
            subject: Course subject area
            phase_concepts: List of concepts for this phase
            difficulty: Target difficulty level
            
        Returns:
            Dict with single best-matching reference book or error information
        """
        try:
            # Get subject category information
            subject_info = self.subject_categories.get(subject, {})
            book_categories = subject_info.get("book_categories", [subject.lower()])
            subject_keywords = subject_info.get("keywords", [subject.lower()])
            
            # Build comprehensive filter query
            filters = {
                "$or": [
                    # Title-based subject matching
                    {"title": {"$regex": "|".join(book_categories), "$options": "i"}},
                    
                    # Summary/description matching
                    {"summary": {"$regex": "|".join(subject_keywords), "$options": "i"}},
                    
                    # Key concepts overlap
                    {"key_concepts": {"$in": subject_keywords + book_categories}},
                    
                    # Category field matching (if exists)
                    {"category": {"$regex": "|".join(book_categories), "$options": "i"}}
                ]
            }
            
            # Add difficulty filtering (flexible)
            difficulty_options = [difficulty]
            if difficulty == "beginner":
                difficulty_options.extend(["introductory", "basic"])
            elif difficulty == "intermediate":
                difficulty_options.extend(["intermediate", "advanced"])  # Allow some flexibility
            elif difficulty == "advanced":
                difficulty_options.extend(["advanced", "expert"])
                
            filters["$or"].append({
                "difficulty": {"$in": difficulty_options}
            })
            
            logger.info(f"Reference Books Query - Subject: {subject}, Difficulty: {difficulty}")
            logger.debug(f"Filters: {filters}")
            
            # Execute query
            if self.db is None:
                raise RuntimeError("Database connection is not available")
                
            candidates = list(self.db[Settings.BOOKS_COLLECTION].find(filters))
            
            if not candidates:
                # Try broader search without difficulty constraint
                broader_filters = {
                    "$or": [
                        {"title": {"$regex": "|".join(book_categories), "$options": "i"}},
                        {"summary": {"$regex": "|".join(subject_keywords), "$options": "i"}},
                        {"key_concepts": {"$in": subject_keywords + book_categories}}
                    ]
                }
                candidates = list(self.db[Settings.BOOKS_COLLECTION].find(broader_filters))
                
                if not candidates:
                    error_msg = f"No reference books found for {subject}"
                    suggestion = "Consider expanding search criteria or adding more books to the database"
                    
                    logger.warning(f"Reference Books Search Failed: {error_msg}")
                    
                    return {
                        "result": None,
                        "meta": {
                            "query": f"{subject} - {difficulty}",
                            "search_type": "reference_books",
                            "timestamp": datetime.utcnow().isoformat(),
                            "error": error_msg,
                            "suggestion": suggestion,
                            "filters_applied": {
                                "subject": subject,
                                "difficulty": difficulty,
                                "phase_concepts": phase_concepts
                            }
                        }
                    }
            
            # Score and select the best book
            best_book = self._score_and_select_best_book(candidates, phase_concepts, subject)
            
            # Add chapter recommendations
            best_book["recommended_chapters"] = self._map_concepts_to_chapters(best_book, phase_concepts)
            
            # Clean and prepare final result
            processed_book = stringify_ids(best_book)
            processed_book["content_type"] = "reference_book"
            processed_book["source"] = "reference_books"
            
            logger.info(f"Selected reference book for {subject}: {best_book.get('title', 'Unknown')}")
            
            return {
                "result": processed_book,
                "meta": {
                    "query": f"{subject} - {difficulty}",
                    "search_type": "reference_books", 
                    "timestamp": datetime.utcnow().isoformat(),
                    "candidates_evaluated": len(candidates),
                    "filters_applied": {
                        "subject": subject,
                        "difficulty": difficulty,
                        "phase_concepts": phase_concepts
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in reference books filtering: {str(e)}")
            return {
                "result": None,
                "meta": {
                    "error": f"Internal error: {str(e)}",
                    "query": f"{subject} - {difficulty}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def filter_videos_by_phase(self, subject: str, phase_concepts: List[str], 
                              phase_difficulty: str) -> Dict[str, Any]:
        """
        Curate exactly 2 playlists + 1 oneshot for a phase using YouTube API
        
        Args:
            subject: Course subject
            phase_concepts: Concepts to cover in this phase
            phase_difficulty: Difficulty level for this phase
            
        Returns:
            Dict with 'playlists' (2 items) and 'oneshot' (1 item)
        """
        try:
            # Try YouTube API search first
            try:
                from agents.youtube_video_agent import youtube_agent
                logger.info(f"Using YouTube API for video search: {subject}")
                
                result = youtube_agent.search_educational_videos(
                    subject=subject,
                    phase_concepts=phase_concepts,
                    difficulty=phase_difficulty,
                    target_playlists=2,
                    target_oneshots=1
                )
                
                # Validate results
                playlists = result.get("playlists", [])
                oneshot = result.get("oneshot", {})
                
                if len(playlists) >= 2 and oneshot:
                    logger.info(f"YouTube API success: 2 playlists + 1 oneshot for {subject}")
                    return result
                else:
                    logger.warning(f"YouTube API partial results: {len(playlists)} playlists, oneshot: {bool(oneshot)}")
                    # Continue to fallback database search
                    
            except ImportError:
                logger.info("YouTube agent not available, using database search")
            except Exception as e:
                logger.warning(f"YouTube API search failed: {e}, falling back to database")
            
            # Fallback to database search (original implementation)
            return self._search_videos_from_database(subject, phase_concepts, phase_difficulty)
            
        except Exception as e:
            logger.error(f"Error in video filtering: {str(e)}")
            return {
                "playlists": [],
                "oneshot": {},
                "meta": {
                    "error": f"Internal error: {str(e)}",
                    "query": f"{subject} - {phase_difficulty}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def _search_videos_from_database(self, subject: str, phase_concepts: List[str], 
                                   phase_difficulty: str) -> Dict[str, Any]:
        """
        Original database video search as fallback
        """
        try:
            # Get subject information
            subject_info = self.subject_categories.get(subject, {})
            subject_keywords = subject_info.get("keywords", [subject.lower()])
            
            # Build base subject filter
            subject_filter = {
                "$or": [
                    {"title": {"$regex": subject, "$options": "i"}},
                    {"title": {"$regex": "|".join(subject_keywords), "$options": "i"}},
                    {"description": {"$regex": "|".join(subject_keywords), "$options": "i"}},
                    {"tags": {"$in": subject_keywords}},
                    {"channel": {"$regex": subject, "$options": "i"}}
                ]
            }
            
            # Add concept-specific filtering
            if phase_concepts:
                concept_filter = {
                    "$or": [
                        {"title": {"$regex": "|".join(phase_concepts), "$options": "i"}},
                        {"description": {"$regex": "|".join(phase_concepts), "$options": "i"}},
                        {"tags": {"$in": phase_concepts}}
                    ]
                }
                subject_filter = {"$and": [subject_filter, concept_filter]}
            
            logger.info(f"Database Video Search - Subject: {subject}, Phase: {phase_difficulty}")
            
            # Get playlist candidates (duration 30min - 20hr)
            playlist_filter = {
                **subject_filter,
                "content_type": "youtube_playlist",
                "total_duration_seconds": {"$gte": 1800, "$lte": 72000}  # 30min - 20hr
            }
            
            if self.db is None:
                raise RuntimeError("Database connection is not available")
                
            playlist_candidates = list(self.db["video_urls"].find(playlist_filter))
            logger.debug(f"Found {len(playlist_candidates)} playlist candidates")
            
            # Get oneshot candidates (duration 30min - 4hr)
            oneshot_filter = {
                **subject_filter,
                "content_type": "youtube_video",
                "duration_seconds": {"$gte": 1800, "$lte": 14400}  # 30min - 4hr
            }
            
            oneshot_candidates = list(self.db["video_urls"].find(oneshot_filter))
            logger.debug(f"Found {len(oneshot_candidates)} oneshot candidates")
            
            # Select best videos using semantic scoring
            selected_playlists = self._select_best_videos(playlist_candidates, phase_concepts, 2)
            selected_oneshot = self._select_best_videos(oneshot_candidates, phase_concepts, 1)
            
            # Check if we have sufficient content
            missing_content = {}
            if len(selected_playlists) < 2:
                missing_content["playlists"] = 2 - len(selected_playlists)
            if len(selected_oneshot) < 1:
                missing_content["oneshot"] = 1 - len(selected_oneshot)
            
            # Clean results
            processed_playlists = [stringify_ids(video) for video in selected_playlists]
            processed_oneshot = stringify_ids(selected_oneshot[0]) if selected_oneshot else {}
            
            if missing_content:
                error_msg = f"Insufficient video content for complete {subject} Phase coverage"
                suggestion = "YouTube API search recommended for better video coverage"
                
                logger.warning(f"Database Video Search Incomplete: {error_msg}")
                logger.debug(f"Missing: {missing_content}")
                
                return {
                    "playlists": processed_playlists,
                    "oneshot": processed_oneshot,
                    "meta": {
                        "query": f"{subject} - {phase_difficulty}",
                        "search_type": "database_fallback",
                        "timestamp": datetime.utcnow().isoformat(),
                        "warning": error_msg,
                        "suggestion": suggestion,
                        "missing": missing_content,
                        "filters_applied": {
                            "subject": subject,
                            "phase_concepts": phase_concepts,
                            "difficulty": phase_difficulty
                        }
                    }
                }
            
            logger.info(f"Database video selection complete for {subject}: 2 playlists + 1 oneshot")
            
            return {
                "playlists": processed_playlists,
                "oneshot": processed_oneshot,
                "meta": {
                    "query": f"{subject} - {phase_difficulty}",
                    "search_type": "database",
                    "timestamp": datetime.utcnow().isoformat(),
                    "candidates_evaluated": {
                        "playlists": len(playlist_candidates),
                        "oneshots": len(oneshot_candidates)
                    },
                    "filters_applied": {
                        "subject": subject,
                        "phase_concepts": phase_concepts,
                        "difficulty": phase_difficulty
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Database video search error: {str(e)}")
            return {
                "playlists": [],
                "oneshot": {},
                "meta": {
                    "error": f"Database search error: {str(e)}",
                    "query": f"{subject} - {phase_difficulty}",
                    "search_type": "database_fallback",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def _calculate_pes_relevance(self, doc: Dict[str, Any], subject: str, phase_info: Dict[str, Any]) -> float:
        """Calculate relevance score for PES material"""
        score = 0.0
        
        # Base score for correct unit
        if doc.get("unit") == phase_info.get("unit"):
            score += 0.4
        
        # Subject matching score
        if subject.lower() in doc.get("subject", "").lower():
            score += 0.3
        
        # Title relevance score
        title = doc.get("title", "").lower()
        phase_concepts = phase_info.get("concepts", [])
        for concept in phase_concepts:
            if concept.lower() in title:
                score += 0.1
        
        # Difficulty alignment
        doc_difficulty = doc.get("difficulty", "").lower()
        phase_difficulty = phase_info.get("difficulty", "").lower()
        if doc_difficulty == phase_difficulty:
            score += 0.2
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _score_and_select_best_book(self, candidates: List[Dict], phase_concepts: List[str], subject: str) -> Dict[str, Any]:
        """Score and select the best reference book from candidates"""
        if not candidates:
            return {}
        
        scored_books = []
        
        for book in candidates:
            score = 0.0
            
            # Subject relevance (40% weight)
            title = book.get("title", "").lower()
            summary = book.get("summary", "").lower()
            subject_words = subject.lower().split()
            
            for word in subject_words:
                if word in title:
                    score += 0.2
                if word in summary:
                    score += 0.1
            
            # Concept coverage (30% weight)
            key_concepts = book.get("key_concepts", [])
            concept_overlap = len(set([c.lower() for c in phase_concepts]) & 
                                 set([c.lower() for c in key_concepts]))
            score += (concept_overlap / max(len(phase_concepts), 1)) * 0.3
            
            # Quality indicators (30% weight)
            if book.get("isbn"):
                score += 0.1  # Has ISBN
            if book.get("edition"):
                score += 0.1  # Has edition info
            if len(summary) > 100:
                score += 0.1  # Detailed summary
            
            book["computed_relevance_score"] = score
            scored_books.append(book)
        
        # Sort by score and return best
        scored_books.sort(key=lambda x: x.get("computed_relevance_score", 0), reverse=True)
        best_book = scored_books[0]
        best_book["relevance_score"] = best_book.get("computed_relevance_score", 0)
        
        return best_book
    
    def _map_concepts_to_chapters(self, book: Dict[str, Any], phase_concepts: List[str]) -> List[str]:
        """Map phase concepts to book chapters"""
        # This is a simplified implementation
        # In production, you'd want to analyze table of contents or chapter summaries
        recommended = []
        
        title = book.get("title", "").lower()
        summary = book.get("summary", "").lower()
        
        # Basic heuristic mapping
        if any("introduction" in c.lower() or "basic" in c.lower() for c in phase_concepts):
            recommended.append("Chapter 1")
            if "fundamental" in summary or "introduction" in summary:
                recommended.append("Chapter 2")
        
        if any("algorithm" in c.lower() or "implementation" in c.lower() for c in phase_concepts):
            recommended.extend(["Chapter 3", "Chapter 4"])
        
        if any("advanced" in c.lower() or "optimization" in c.lower() for c in phase_concepts):
            recommended.extend(["Chapter 5", "Chapter 6"])
        
        return recommended[:4]  # Limit to 4 chapters max
    
    def _select_best_videos(self, candidates: List[Dict], phase_concepts: List[str], count: int) -> List[Dict]:
        """Select best videos from candidates based on semantic relevance"""
        if not candidates:
            return []
        
        scored_videos = []
        
        for video in candidates:
            score = 0.0
            
            # Title relevance
            title = video.get("title", "").lower()
            for concept in phase_concepts:
                if concept.lower() in title:
                    score += 0.3
            
            # Description relevance
            description = video.get("description", "").lower()
            for concept in phase_concepts:
                if concept.lower() in description:
                    score += 0.2
            
            # Duration score (prefer reasonable durations)
            duration = video.get("duration_seconds", 0) or video.get("total_duration_seconds", 0)
            if 1800 <= duration <= 7200:  # 30min - 2hr is optimal
                score += 0.3
            elif 7200 < duration <= 14400:  # 2hr - 4hr is good
                score += 0.2
            
            # Channel quality (placeholder - could be enhanced with reputation data)
            if video.get("channel"):
                score += 0.2
            
            video["computed_relevance_score"] = score
            scored_videos.append(video)
        
        # Sort by score and return top N
        scored_videos.sort(key=lambda x: x.get("computed_relevance_score", 0), reverse=True)
        
        selected = []
        for video in scored_videos[:count]:
            video["relevance_score"] = video.get("computed_relevance_score", 0)
            selected.append(video)
        
        return selected

# Global instance for easy access
enhanced_filtering = EnhancedSemanticFiltering()
