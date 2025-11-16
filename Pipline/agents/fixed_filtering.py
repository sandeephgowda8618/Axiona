"""
Critical Filtering Fixes
=======================

Immediate fixes for the semantic filtering issues based on database analysis:
1. Handle mixed unit data types (string/int)
2. Improve subject filtering precision  
3. Fix video collection schema
4. Remove overly broad keyword matching
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

class FixedSemanticFiltering:
    """Fixed semantic filtering with improved precision"""
    
    def __init__(self):
        try:
            self.db = db_manager.get_database()
            if self.db is None:
                logger.error("Database connection is None")
                raise ValueError("Database connection failed. Check database configuration.")
            logger.info("Fixed filtering initialized with database connection")
        except Exception as e:
            logger.error(f"Failed to initialize fixed filtering: {e}")
            raise
        
        # Fixed subject categories with precise matching
        self.precise_subject_mapping = {
            "Operating Systems": {
                "exact_subjects": ["Operating Systems"],  # Exact matches first
                "regex_subjects": ["^Operating", "OS"],   # Then regex patterns
                "exclude_subjects": ["Data Structures", "Database", "Chemistry", "Electronics", "Microprocessor", "Digital Design"]
            },
            "Data Structures": {
                "exact_subjects": ["Data Structures & Algorithms", "Data Structures and its Applications"],
                "regex_subjects": ["^Data Structures", "DSA"],
                "exclude_subjects": ["Operating", "Database", "Chemistry", "Electronics", "Network"]
            },
            "Computer Networks": {
                "exact_subjects": ["Computer Networks"],
                "regex_subjects": ["^Computer Networks", "Network"],
                "exclude_subjects": ["Data Structures", "Operating", "Database", "Chemistry"]
            }
        }
        
    def fixed_filter_pes_materials_by_phase(self, subject: str, phase_number: int, max_results: int = 10) -> Dict[str, Any]:
        """
        Fixed PES materials filtering with precise subject matching and unit type handling
        """
        try:
            # Get subject mapping
            subject_map = self.precise_subject_mapping.get(subject, {
                "exact_subjects": [subject],
                "regex_subjects": [f"^{subject}"],
                "exclude_subjects": []
            })
            
            # Build precise filter - try both string and int unit types
            unit_filters = [
                {"unit": str(phase_number)},  # String version
                {"unit": phase_number}        # Integer version  
            ]
            
            # Subject filtering with exclusions
            subject_filters = []
            
            # 1. Exact subject matches (highest priority)
            for exact_subject in subject_map["exact_subjects"]:
                subject_filters.append({"subject": exact_subject})
            
            # 2. Regex matches (medium priority)
            for regex_pattern in subject_map["regex_subjects"]:
                subject_filters.append({"subject": {"$regex": regex_pattern, "$options": "i"}})
            
            # 3. Exclusions (prevent contamination)
            exclude_patterns = "|".join(subject_map["exclude_subjects"])
            if exclude_patterns:
                exclusion_filter = {"subject": {"$not": {"$regex": exclude_patterns, "$options": "i"}}}
            else:
                exclusion_filter = {}
            
            # Combine filters
            final_filter = {
                "$and": [
                    {"$or": unit_filters},     # Either string or int unit
                    {"$or": subject_filters}   # Any of the subject patterns
                ]
            }
            
            # Add exclusions if any
            if exclusion_filter:
                final_filter["$and"].append(exclusion_filter)
            
            logger.info(f"Fixed PES Query - Subject: {subject}, Phase: {phase_number}")
            logger.debug(f"Filter: {final_filter}")
            
            # Execute query
            if self.db is None:
                raise RuntimeError("Database connection is not available")
                
            cursor = self.db[Settings.MATERIALS_COLLECTION].find(final_filter).limit(max_results)
            results = list(cursor)
            
            # Post-filter validation and scoring
            validated_results = []
            for doc in results:
                # Double-check subject relevance
                doc_subject = doc.get("subject", "").lower()
                target_subject = subject.lower()
                
                # Skip if subject doesn't contain target keywords
                if not any(keyword.lower() in doc_subject for keyword in [target_subject] + subject_map.get("regex_subjects", [])):
                    logger.debug(f"Skipping off-topic: {doc_subject}")
                    continue
                
                # Skip if contains excluded keywords
                excluded = False
                for exclude_word in subject_map.get("exclude_subjects", []):
                    if exclude_word.lower() in doc_subject:
                        logger.debug(f"Excluding contaminated: {doc_subject} (contains {exclude_word})")
                        excluded = True
                        break
                
                if excluded:
                    continue
                
                # Calculate relevance score
                relevance_score = self._calculate_fixed_relevance(doc, subject, phase_number)
                
                # Build standardized metadata
                processed_doc = stringify_ids(doc)
                processed_doc["relevance_score"] = relevance_score
                processed_doc["content_type"] = "pes_material"
                processed_doc["source"] = "PES_slides"
                processed_doc["filtering_method"] = "fixed_semantic"
                
                validated_results.append(processed_doc)
            
            # Sort by relevance
            validated_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            # Validation and error handling
            if not validated_results:
                error_msg = f"No relevant {subject} materials found for Phase {phase_number}"
                suggestion = f"Check if PES materials exist for {subject} or try broader subject search"
                
                logger.warning(f"Fixed PES Search Failed: {error_msg}")
                
                return {
                    "results": [],
                    "meta": {
                        "query": f"{subject} Phase {phase_number}",
                        "search_type": "fixed_pes_materials",
                        "returned": 0,
                        "top_k": max_results,
                        "timestamp": datetime.utcnow().isoformat(),
                        "error": error_msg,
                        "suggestion": suggestion,
                        "filters_applied": final_filter,
                        "raw_results_found": len(results),
                        "validated_results": 0
                    }
                }
            
            logger.info(f"Fixed PES Search: {len(validated_results)} relevant materials for {subject} Phase {phase_number}")
            
            return {
                "results": validated_results,
                "meta": {
                    "query": f"{subject} Phase {phase_number}",
                    "search_type": "fixed_pes_materials",
                    "returned": len(validated_results),
                    "top_k": max_results,
                    "timestamp": datetime.utcnow().isoformat(),
                    "filters_applied": final_filter,
                    "raw_results_found": len(results),
                    "validated_results": len(validated_results),
                    "filtering_improvements": [
                        "Mixed unit type handling (string/int)",
                        "Precise subject matching with exclusions", 
                        "Post-filter validation",
                        "Contamination prevention"
                    ]
                }
            }
            
        except Exception as e:
            logger.error(f"Error in fixed PES filtering: {str(e)}")
            return {
                "results": [],
                "meta": {
                    "error": f"Internal error: {str(e)}",
                    "query": f"{subject} Phase {phase_number}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def fixed_filter_videos_by_phase(self, subject: str, phase_concepts: List[str], 
                                    phase_difficulty: str) -> Dict[str, Any]:
        """
        Fixed video filtering using correct schema and subject precision
        """
        try:
            # Get subject mapping
            subject_map = self.precise_subject_mapping.get(subject, {
                "exact_subjects": [subject],
                "regex_subjects": [f"^{subject}"],
                "exclude_subjects": []
            })
            
            # Build subject filter for videos
            subject_filters = []
            
            # Subject-based filtering (more precise)
            for exact_subject in subject_map["exact_subjects"]:
                subject_filters.extend([
                    {"title": {"$regex": exact_subject, "$options": "i"}},
                    {"description": {"$regex": exact_subject, "$options": "i"}}
                ])
            
            for regex_pattern in subject_map["regex_subjects"]:
                subject_filters.extend([
                    {"title": {"$regex": regex_pattern, "$options": "i"}},
                    {"description": {"$regex": regex_pattern, "$options": "i"}}
                ])
            
            # Add concept-based filtering if provided
            if phase_concepts:
                concept_patterns = "|".join(phase_concepts)
                subject_filters.extend([
                    {"title": {"$regex": concept_patterns, "$options": "i"}},
                    {"description": {"$regex": concept_patterns, "$options": "i"}}
                ])
            
            # Exclusion filter
            exclude_patterns = "|".join(subject_map["exclude_subjects"]) 
            
            base_filter = {"$or": subject_filters}
            if exclude_patterns:
                base_filter = {
                    "$and": [
                        base_filter,
                        {"title": {"$not": {"$regex": exclude_patterns, "$options": "i"}}}
                    ]
                }
            
            logger.info(f"Fixed Video Search - Subject: {subject}, Phase: {phase_difficulty}")
            
            # Get all matching videos (no duration filtering yet - check schema first)
            if self.db is None:
                raise RuntimeError("Database connection is not available")
            
            all_candidates = list(self.db["videos"].find(base_filter))
            logger.debug(f"Found {len(all_candidates)} video candidates before filtering")
            
            # Analyze content types
            content_types = {}
            for video in all_candidates:
                content_type = video.get("content_type", "unknown")
                content_types[content_type] = content_types.get(content_type, 0) + 1
            
            logger.debug(f"Content types found: {content_types}")
            
            # Separate by type (adapt to actual schema)
            playlists = []
            oneshots = []
            
            for video in all_candidates:
                content_type = video.get("content_type", "")
                
                # Check if it's a playlist (could be "youtube_playlist" or just check URL patterns)
                is_playlist = (
                    content_type == "youtube_playlist" or 
                    "playlist" in content_type.lower() or
                    "list=" in video.get("url", "")
                )
                
                if is_playlist:
                    playlists.append(video)
                else:
                    oneshots.append(video) 
            
            # Select best videos (simplified - no duration filtering for now)
            selected_playlists = self._select_best_fixed_videos(playlists, phase_concepts, 2)
            selected_oneshot = self._select_best_fixed_videos(oneshots, phase_concepts, 1)
            
            # Clean results
            processed_playlists = [stringify_ids(video) for video in selected_playlists]
            processed_oneshot = stringify_ids(selected_oneshot[0]) if selected_oneshot else {}
            
            # Check completeness
            missing_content = {}
            if len(selected_playlists) < 2:
                missing_content["playlists"] = 2 - len(selected_playlists)
            if not selected_oneshot:
                missing_content["oneshot"] = 1
                
            meta_info = {
                "query": f"{subject} - {phase_difficulty}",
                "search_type": "fixed_videos",
                "timestamp": datetime.utcnow().isoformat(),
                "candidates_found": len(all_candidates),
                "content_types_available": content_types,
                "selection_results": {
                    "playlists": len(selected_playlists),
                    "oneshots": len(selected_oneshot)
                },
                "filters_applied": base_filter
            }
            
            if missing_content:
                warning_msg = f"Incomplete video content for {subject} Phase"
                logger.warning(f"Fixed Video Search: {warning_msg}")
                meta_info["warning"] = warning_msg
                meta_info["missing"] = missing_content
            else:
                logger.info(f"Fixed Video Search: Complete content for {subject} (2 playlists + 1 oneshot)")
            
            return {
                "playlists": processed_playlists,
                "oneshot": processed_oneshot,
                "meta": meta_info
            }
            
        except Exception as e:
            logger.error(f"Error in fixed video filtering: {str(e)}")
            return {
                "playlists": [],
                "oneshot": {},
                "meta": {
                    "error": f"Internal error: {str(e)}",
                    "query": f"{subject} - {phase_difficulty}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
    
    def _calculate_fixed_relevance(self, doc: Dict[str, Any], subject: str, phase_number: int) -> float:
        """Calculate relevance with improved precision"""
        score = 0.0
        
        # Subject exactness (50% weight)
        doc_subject = doc.get("subject", "").lower()
        target_subject = subject.lower()
        
        if doc_subject == target_subject:
            score += 0.5  # Exact match
        elif target_subject in doc_subject:
            score += 0.3  # Contains target
        elif any(word in doc_subject for word in target_subject.split()):
            score += 0.1  # Word overlap
        
        # Unit matching (30% weight)
        doc_unit = doc.get("unit")
        if str(doc_unit) == str(phase_number):
            score += 0.3
        
        # Title relevance (20% weight)
        title = doc.get("title", "").lower()
        if target_subject in title:
            score += 0.2
        
        return min(score, 1.0)
    
    def _select_best_fixed_videos(self, candidates: List[Dict], phase_concepts: List[str], count: int) -> List[Dict]:
        """Select best videos with improved scoring"""
        if not candidates:
            return []
        
        scored_videos = []
        
        for video in candidates:
            score = 0.0
            
            # Title relevance (40% weight)
            title = video.get("title", "").lower()
            for concept in phase_concepts:
                if concept.lower() in title:
                    score += 0.4 / len(phase_concepts)  # Distributed across concepts
            
            # URL quality indicators (20% weight)
            url = video.get("url", "")
            if "youtube.com" in url:
                score += 0.1
            if "playlist" in url and count == 2:  # For playlist selection
                score += 0.1
            elif "watch?v=" in url and count == 1:  # For oneshot selection  
                score += 0.1
            
            # Description relevance (20% weight)  
            description = video.get("description", "").lower()
            for concept in phase_concepts:
                if concept.lower() in description:
                    score += 0.2 / len(phase_concepts)
            
            # Recency (20% weight)
            created_at = video.get("created_at")
            if created_at:
                score += 0.2  # Assume all videos are reasonably recent
            
            video["computed_relevance_score"] = score
            scored_videos.append(video)
        
        # Sort and select top N
        scored_videos.sort(key=lambda x: x.get("computed_relevance_score", 0), reverse=True)
        
        selected = []
        for video in scored_videos[:count]:
            video["relevance_score"] = video.get("computed_relevance_score", 0)
            selected.append(video)
        
        return selected

# Global instance for easy access
fixed_filtering = FixedSemanticFiltering()
