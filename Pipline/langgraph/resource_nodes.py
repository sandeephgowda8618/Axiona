"""
Resource Retrieval Nodes for LangGraph Educational Roadmap System
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from langgraph.state import RoadmapState
from core.ollama_service import ollama_service

logger = logging.getLogger(__name__)

# Import the statistics tracker
from langgraph.nodes import roadmap_stats

async def pes_retrieval_node(state: RoadmapState) -> RoadmapState:
    """Retrieve PES materials for all phases"""
    start_time = datetime.now()
    logger.info("🎯 Starting PES Material Retrieval Node")
    
    try:
        phases = state["learning_phases"]
        pes_materials = {}
        
        for phase in phases:
            phase_id = phase.get("phase_id", 1)
            concepts = phase.get("concepts", [])
            
            # Retrieve PES materials for this phase
            materials = await retrieve_pes_materials_for_phase(
                subject=state["subject"],
                phase_number=phase_id,
                concepts=concepts
            )
            
            pes_materials[f"phase_{phase_id}"] = materials
            
        # Update state
        state["pes_materials"] = pes_materials
        state["processing_step"] = "pes_retrieval_completed"
        state["completed_steps"].append("pes_retrieval")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        total_materials = sum(len(materials.get("results", [])) for materials in pes_materials.values())
        roadmap_stats.track_node_timing("pes_retrieval_node", duration)
        roadmap_stats.track_agent_call("pes_retrieval", True, duration)
        roadmap_stats.track_resources("pes_materials", total_materials)
        
        logger.info(f"✅ PES retrieval completed: {total_materials} materials across {len(phases)} phases")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("pes_retrieval", False, duration)
        
        logger.error(f"❌ PES retrieval failed: {e}")
        state["errors"].append(f"PES retrieval failed: {str(e)}")
        state["pes_materials"] = {}
        
        return state

async def retrieve_pes_materials_for_phase(subject: str, phase_number: int, concepts: List[str]) -> Dict[str, Any]:
    """Retrieve PES materials for a specific phase using MongoDB"""
    try:
        # Import here to avoid circular imports
        from core.db_manager import db_manager
        
        # Get MongoDB collection
        collection = db_manager.get_collection("pes_materials")
        
        # Primary query: exact subject + unit match
        primary_query = {
            "subject": {"$regex": f"^{subject}$", "$options": "i"},
            "unit": {"$in": [phase_number, str(phase_number)]}
        }
        
        logger.info(f"PES query for {subject} Phase {phase_number}: {primary_query}")
        
        # Execute query
        docs = list(collection.find(primary_query))
        
        if not docs:
            # Try broader subject match
            secondary_query = {"subject": {"$regex": subject, "$options": "i"}}
            docs = list(collection.find(secondary_query).limit(5))
        
        # Convert to standardized metadata
        standardized_materials = []
        for doc in docs:
            # Validate subject relevance
            doc_subject = doc.get("subject", "").lower()
            target_subject = subject.lower()
            
            # Skip cross-contaminated documents
            excluded_subjects = ["data structures", "dbms", "microprocessor", "electronics", "software engineering"]
            if any(excluded in doc_subject for excluded in excluded_subjects) and target_subject not in doc_subject:
                continue
            
            # Convert to standardized format
            metadata = {
                "id": str(doc.get("_id", "")),
                "title": doc.get("title", "Unknown Title"),
                "subject": doc.get("subject", "Unknown Subject"),
                "unit": doc.get("unit"),
                "content_type": "pes_material",
                "source": "PES_slides",
                "file_url": doc.get("file_url", ""),
                "pdf_path": doc.get("pdf_path", ""),
                "summary": doc.get("summary", ""),
                "key_concepts": doc.get("key_concepts", []),
                "difficulty": doc.get("difficulty", "Beginner"),
                "relevance_score": doc.get("relevance_score", 0.85),
                "semantic_score": doc.get("semantic_score", 0.80),
                "snippet": doc.get("snippet", doc.get("summary", "")[:200])
            }
            
            # Add optional fields
            if "gridfs_id" in doc:
                metadata["gridfs_id"] = str(doc["gridfs_id"])
            if "semester" in doc:
                metadata["semester"] = doc["semester"]
            if "created_at" in doc:
                metadata["created_at"] = doc["created_at"]
            
            standardized_materials.append(metadata)
        
        return {
            "results": standardized_materials,
            "meta": {
                "subject": subject,
                "phase": phase_number,
                "unit_mapped": phase_number,
                "total_results": len(standardized_materials),
                "search_type": "pes_search",
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving PES materials for {subject} Phase {phase_number}: {e}")
        return {
            "results": [],
            "meta": {
                "subject": subject,
                "phase": phase_number,
                "unit_mapped": phase_number,
                "total_results": 0,
                "error": str(e)
            }
        }

async def reference_book_retrieval_node(state: RoadmapState) -> RoadmapState:
    """Retrieve reference books for all phases"""
    start_time = datetime.now()
    logger.info("🎯 Starting Reference Book Retrieval Node")
    
    try:
        phases = state["learning_phases"]
        reference_books = {}
        
        for phase in phases:
            phase_id = phase.get("phase_id", 1)
            concepts = phase.get("concepts", [])
            difficulty = phase.get("difficulty", "beginner")
            
            # Retrieve best reference book for this phase
            book_result = await retrieve_reference_book_for_phase(
                subject=state["subject"],
                difficulty=difficulty,
                concepts=concepts
            )
            
            reference_books[f"phase_{phase_id}"] = book_result
        
        # Update state
        state["reference_books"] = reference_books
        state["processing_step"] = "reference_book_retrieval_completed"
        state["completed_steps"].append("reference_book_retrieval")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        total_books = sum(1 for book in reference_books.values() if book.get("result"))
        roadmap_stats.track_node_timing("reference_book_retrieval_node", duration)
        roadmap_stats.track_agent_call("reference_book_retrieval", True, duration)
        roadmap_stats.track_resources("reference_books", total_books)
        
        logger.info(f"✅ Reference book retrieval completed: {total_books} books across {len(phases)} phases")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("reference_book_retrieval", False, duration)
        
        logger.error(f"❌ Reference book retrieval failed: {e}")
        state["errors"].append(f"Reference book retrieval failed: {str(e)}")
        state["reference_books"] = {}
        
        return state

async def retrieve_reference_book_for_phase(subject: str, difficulty: str, concepts: List[str]) -> Dict[str, Any]:
    """Retrieve the best reference book for a phase"""
    try:
        # Import here to avoid circular imports
        from core.db_manager import db_manager
        
        # Get MongoDB collection
        collection = db_manager.get_collection("reference_books")
        
        # Subject category mapping
        subject_categories = {
            "Operating Systems": ["operating", "system", "os", "kernel"],
            "Data Structures": ["algorithm", "data structure", "dsa"],
            "Algorithms": ["algorithm", "data structure", "dsa"],
            "Databases": ["database", "sql", "dbms"],
            "Networks": ["network", "networking", "communication"],
            "Computer Architecture": ["architecture", "organization", "computer"]
        }
        
        category_keywords = subject_categories.get(subject, [subject.lower()])
        
        # Build query
        query = {
            "$or": [
                {"title": {"$regex": "|".join(category_keywords), "$options": "i"}},
                {"key_concepts": {"$elemMatch": {"$regex": "|".join(category_keywords), "$options": "i"}}},
                {"summary": {"$regex": "|".join(category_keywords), "$options": "i"}}
            ]
        }
        
        logger.info(f"Reference book query for {subject}: {query}")
        
        # Execute query
        docs = list(collection.find(query))
        
        if not docs:
            return {
                "result": None,
                "meta": {
                    "error": f"No reference books found for {subject}",
                    "subject": subject,
                    "difficulty": difficulty
                }
            }
        
        # Score and select best book
        best_book = None
        best_score = 0
        
        for doc in docs:
            score = calculate_book_relevance_score(doc, subject, concepts, difficulty)
            if score > best_score:
                best_score = score
                best_book = doc
        
        if best_book:
            # Convert to standardized format
            metadata = {
                "id": str(best_book.get("_id", "")),
                "title": best_book.get("title", "Unknown Title"),
                "authors": best_book.get("authors", []),
                "content_type": "reference_book",
                "source": "reference_books",
                "isbn": best_book.get("isbn", ""),
                "publisher": best_book.get("publisher", ""),
                "edition": best_book.get("edition", ""),
                "summary": best_book.get("summary", ""),
                "key_concepts": best_book.get("key_concepts", []),
                "difficulty": best_book.get("difficulty", difficulty),
                "relevance_score": best_score,
                "semantic_score": best_book.get("semantic_score", 0.85),
                "snippet": best_book.get("summary", "")[:200],
                "recommended_chapters": generate_chapter_recommendations(best_book, concepts)
            }
            
            # Add optional fields
            if "gridfs_id" in best_book:
                metadata["gridfs_id"] = str(best_book["gridfs_id"])
            if "file_url" in best_book:
                metadata["file_url"] = best_book["file_url"]
            if "created_at" in best_book:
                metadata["created_at"] = best_book["created_at"]
                
            return {
                "result": metadata,
                "meta": {
                    "subject": subject,
                    "difficulty": difficulty,
                    "candidates_found": len(docs),
                    "selection_score": best_score
                }
            }
        
        return {
            "result": None,
            "meta": {
                "error": f"No suitable reference book found for {subject}",
                "subject": subject,
                "difficulty": difficulty,
                "candidates_found": len(docs)
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving reference book for {subject}: {e}")
        return {
            "result": None,
            "meta": {
                "error": str(e),
                "subject": subject,
                "difficulty": difficulty
            }
        }

def calculate_book_relevance_score(book: Dict[str, Any], subject: str, concepts: List[str], difficulty: str) -> float:
    """Calculate relevance score for a reference book"""
    score = 0.0
    
    # Subject relevance (40%)
    title = book.get("title", "").lower()
    summary = book.get("summary", "").lower()
    subject_lower = subject.lower()
    
    if subject_lower in title:
        score += 0.4
    elif any(word in title for word in subject_lower.split()):
        score += 0.2
    elif subject_lower in summary:
        score += 0.1
    
    # Difficulty alignment (30%)
    book_difficulty = book.get("difficulty", "").lower()
    target_difficulty = difficulty.lower()
    
    if book_difficulty == target_difficulty:
        score += 0.3
    elif abs(["beginner", "intermediate", "advanced"].index(book_difficulty) - 
             ["beginner", "intermediate", "advanced"].index(target_difficulty)) <= 1:
        score += 0.15
    
    # Concept coverage (30%)
    book_concepts = [c.lower() for c in book.get("key_concepts", [])]
    target_concepts = [c.lower() for c in concepts]
    
    if book_concepts and target_concepts:
        overlap = set(book_concepts) & set(target_concepts)
        coverage = len(overlap) / len(target_concepts)
        score += 0.3 * coverage
    
    return min(score, 1.0)

def generate_chapter_recommendations(book: Dict[str, Any], concepts: List[str]) -> List[str]:
    """Generate chapter recommendations based on concepts"""
    # This is a simplified version - in practice, you'd use more sophisticated matching
    chapters = []
    
    for i, concept in enumerate(concepts[:4], 1):  # Limit to first 4 concepts
        chapters.append(f"Chapter {i}: {concept.title()}")
    
    return chapters

async def video_retrieval_node(state: RoadmapState) -> RoadmapState:
    """Retrieve video content for all phases"""
    start_time = datetime.now()
    logger.info("🎯 Starting Video Content Retrieval Node")
    
    try:
        phases = state["learning_phases"]
        video_content = {}
        
        for phase in phases:
            phase_id = phase.get("phase_id", 1)
            concepts = phase.get("concepts", [])
            difficulty = phase.get("difficulty", "beginner")
            
            # Generate video search keywords
            video_keywords = await generate_video_search_keywords(
                subject=state["subject"],
                difficulty=difficulty,
                concepts=concepts
            )
            
            video_content[f"phase_{phase_id}"] = video_keywords
        
        # Update state
        state["video_content"] = video_content
        state["processing_step"] = "video_retrieval_completed"
        state["completed_steps"].append("video_retrieval")
        
        # Track statistics
        duration = (datetime.now() - start_time).total_seconds()
        total_video_sets = len([v for v in video_content.values() if v.get("search_keywords_playlists")])
        roadmap_stats.track_node_timing("video_retrieval_node", duration)
        roadmap_stats.track_agent_call("video_retrieval", True, duration)
        roadmap_stats.track_resources("video_content", total_video_sets)
        
        logger.info(f"✅ Video retrieval completed: {total_video_sets} video sets across {len(phases)} phases")
        return state
        
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        roadmap_stats.track_agent_call("video_retrieval", False, duration)
        
        logger.error(f"❌ Video retrieval failed: {e}")
        state["errors"].append(f"Video retrieval failed: {str(e)}")
        state["video_content"] = {}
        
        return state

async def generate_video_search_keywords(subject: str, difficulty: str, concepts: List[str]) -> Dict[str, Any]:
    """Generate video search keywords using LLM"""
    try:
        system_prompt = """You are the YouTube Video Retrieval Agent.

INPUT:
- subject
- level (beginner/intermediate/advanced)
- concepts

TASK:
Generate keyword queries for:
- 2 playlists
- 1 oneshot video

RULES:
- Combine subject + concepts + difficulty
- Avoid contamination
- Return ONLY keyword queries (not actual videos)
- DO NOT hallucinate identifiers

OUTPUT JSON:
{
  "search_keywords_playlists": ["playlist query 1", "playlist query 2"],
  "search_keywords_oneshot": "oneshot video query",
  "reasoning_tags": ["subject", "concepts", "difficulty"]
}"""
        
        user_prompt = f"""Generate video search keywords for learning {subject}.

Subject: {subject}
Difficulty Level: {difficulty}
Key Concepts: {', '.join(concepts)}

Generate:
1. Two playlist search queries (comprehensive coverage)
2. One oneshot video query (complete topic overview)

Focus on educational content appropriate for {difficulty} level."""

        response = await ollama_service.generate_response(
            user_prompt,
            system_prompt=system_prompt,
            temperature=0.3
        )
        
        # Extract JSON
        def extract_json(text: str) -> Dict[str, Any]:
            import re
            text = re.sub(r'```json\s*', '', text)
            text = re.sub(r'```\s*', '', text)
            
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                try:
                    return json.loads(text[json_start:json_end])
                except json.JSONDecodeError:
                    pass
            
            # Fallback
            return generate_fallback_video_keywords(subject, difficulty, concepts)
        
        return extract_json(response)
        
    except Exception as e:
        logger.error(f"Error generating video keywords: {e}")
        return generate_fallback_video_keywords(subject, difficulty, concepts)

def generate_fallback_video_keywords(subject: str, difficulty: str, concepts: List[str]) -> Dict[str, Any]:
    """Generate fallback video search keywords"""
    concepts_str = " ".join(concepts[:2])  # Use first 2 concepts
    
    return {
        "search_keywords_playlists": [
            f"{subject} {difficulty} tutorial playlist",
            f"{concepts_str} {subject} course"
        ],
        "search_keywords_oneshot": f"{subject} {concepts_str} complete tutorial",
        "reasoning_tags": [subject, concepts_str, difficulty]
    }
