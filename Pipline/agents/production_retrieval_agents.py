"""
Updated PES Material Retrieval Agent with Production-Ready Prompts
=================================================================

This agent implements the finalized prompt for PES material retrieval with:
- Strict subject filtering (no cross-contamination)
- Unit-based retrieval (phase_number -> unit mapping)
- Return ALL matching documents (no artificial limits)
- Proper JSON schema compliance
"""

from typing import Dict, List, Any, Optional
import json
import logging
from core.vector_db import VectorDBManager
from config.database import db_manager
from agents.base_agent import BaseAgent, AgentState

logger = logging.getLogger(__name__)

class UpdatedPESMaterialAgent(BaseAgent):
    """Updated PES Material Retrieval Agent with finalized production prompt"""
    
    def __init__(self):
        super().__init__("UpdatedPESMaterialAgent", temperature=0.0, max_tokens=100)
        self.vector_db = VectorDBManager()
        
    def get_system_prompt(self) -> str:
        return """You are the PES Material Retrieval Agent.

INPUT:
- subject (e.g., "Operating Systems")
- phase_number (1 → Unit 1, 2 → Unit 2, 3 → Unit 3, 4 → Unit 4)
- concepts (list of phase concepts)

TASK:
Retrieve ALL PES materials from MongoDB (collection: pes_materials) for the given subject and unit.
Return EVERY document that matches both subject and unit criteria - do NOT limit results.

RETRIEVAL LOGIC:
1. SUBJECT FILTER (EXACT MATCH):
   - subject must match exactly (case-insensitive)
   - EXCLUDE materials from other subjects: DSA, DBMS, Microprocessor, Electronics, Software Engineering, Math, Networks, etc.

2. UNIT FILTER (FLEXIBLE TYPE):
   - unit must equal phase_number
   - Accept both: unit == "1" (string) OR unit == 1 (integer)
   - Ignore documents where unit is null/missing

3. RETURN ALL MATCHING DOCUMENTS:
   - Phase 1 (Unit 1): If 2 documents exist → return both
   - Phase 2 (Unit 2): If 5 documents exist → return all 5
   - Phase 3 (Unit 3): If 1 document exists → return that 1
   - Phase 4 (Unit 4): If 3 documents exist → return all 3
   - DO NOT limit, rank, or filter further

4. QUALITY VALIDATION:
   - Verify title/summary relevance to subject
   - Remove any cross-contamination from unrelated subjects
   - Maintain original document order or sort by relevance_score

RETURN JSON ONLY:
{
  "results": [
    {
      "id": "pes_001", 
      "title": "Operating Systems - Unit 1: Introduction to OS",
      "subject": "Operating Systems",
      "unit": 1,
      "content_type": "pes_material",
      "source": "PES_slides", 
      "file_url": "/uploads/studypes/os_unit1_intro.pdf",
      "pdf_path": "Data/PES_materials/OS/Unit1/os_intro.pdf",
      "summary": "Introduction to operating systems, basic concepts",
      "key_concepts": ["OS basics", "system calls", "processes"],
      "difficulty": "Beginner",
      "relevance_score": 0.92,
      "semantic_score": 0.88,
      "snippet": "Operating systems manage computer hardware resources..."
    }
  ],
  "meta": {
    "subject": "Operating Systems",
    "phase": 1,
    "unit_mapped": 1, 
    "total_results": 2,
    "query_info": "Retrieved ALL Unit 1 materials for Operating Systems"
  }
}

CRITICAL RULES:
- Return ALL documents matching subject + unit (no artificial limits)
- Do NOT hallucinate or invent documents
- Use empty array if no matches: {"results": [], "meta": {...}, "error": "No Unit X materials found for subject Y"}
- Maintain consistency with standardized metadata schema

Return ONLY JSON."""

    async def retrieve_pes_materials(self, subject: str, phase_number: int, concepts: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Retrieve ALL PES materials for the given subject and phase/unit
        
        Args:
            subject: Subject name (e.g., "Operating Systems", "Data Structures and Algorithms")
            phase_number: Learning phase (1-4) mapped to unit numbers
            concepts: Optional list of concepts for this phase
            
        Returns:
            Dict with results array and metadata
        """
        try:
            logger.info(f"Retrieving PES materials for {subject}, Unit {phase_number}")
            
            # Get MongoDB collection
            collection = db_manager.get_collection("pes_materials")
            
            # Execute query - get ALL matching documents
            query = {
                "subject": {"$regex": f"^{subject}$", "$options": "i"},
                "unit": {"$in": [phase_number, str(phase_number)]}
            }
            
            logger.info(f"MongoDB query: {query}")
            
            # Execute query - get ALL matching documents
            cursor = collection.find(query)
            documents = list(cursor)
            
            logger.info(f"Found {len(documents)} documents for {subject} Unit {phase_number}")
            
            # Convert MongoDB documents to standardized metadata
            results = []
            for doc in documents:
                # Validate subject match (additional safety check)
                doc_subject = doc.get("subject", "").lower()
                target_subject = subject.lower()
                
                if target_subject not in doc_subject:
                    logger.warning(f"Skipping cross-contaminated document: {doc.get('title', 'Unknown')} - Subject: {doc_subject}")
                    continue
                
                # Convert to standardized metadata
                metadata = self._convert_to_standardized_metadata(doc)
                results.append(metadata)
            
            # Sort by relevance if available, otherwise by title
            results.sort(key=lambda x: (
                -x.get("relevance_score", 0.0),  # Higher relevance first
                x.get("title", "")  # Then alphabetical
            ))
            
            return {
                "results": results,
                "meta": {
                    "subject": subject,
                    "phase": phase_number,
                    "unit_mapped": phase_number,
                    "total_results": len(results),
                    "query_info": f"Retrieved ALL Unit {phase_number} materials for {subject}",
                    "concepts_requested": concepts or []
                }
            }
            
        except Exception as e:
            logger.error(f"Error retrieving PES materials: {e}")
            return {
                "results": [],
                "meta": {
                    "subject": subject,
                    "phase": phase_number,
                    "unit_mapped": phase_number,
                    "total_results": 0,
                    "query_info": f"Error retrieving materials: {str(e)}"
                },
                "error": str(e)
            }
    
    def _convert_to_standardized_metadata(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to standardized metadata format"""
        # Extract ObjectId as string
        doc_id = str(doc.get("_id", ""))
        
        # Build standardized metadata
        metadata = {
            "id": doc_id,
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
        
        # Add optional fields if present
        if "gridfs_id" in doc:
            metadata["gridfs_id"] = str(doc["gridfs_id"])
        if "semester" in doc:
            metadata["semester"] = doc["semester"]
        if "created_at" in doc:
            metadata["created_at"] = doc["created_at"]
        if "page_count" in doc:
            metadata["page_count"] = doc["page_count"]
            
        return metadata

    def process(self, state: AgentState) -> AgentState:
        """Process state for PES material retrieval"""
        try:
            self.log_action(state, "Starting PES material retrieval with updated agent")
            
            # Get request parameters
            roadmap = state.data.get("roadmap", {})
            subject = roadmap.get("subject", "Unknown Subject")
            current_phase = state.data.get("current_phase", 1)
            concepts = state.data.get("phase_concepts", [])
            
            # Retrieve materials
            import asyncio
            results = asyncio.run(self.retrieve_pes_materials(subject, current_phase, concepts))
            
            # Store results in state
            if "pes_materials" not in roadmap:
                roadmap["pes_materials"] = {}
            
            roadmap["pes_materials"][f"phase_{current_phase}"] = results
            state.data["roadmap"] = roadmap
            
            # Log results
            num_results = len(results.get("results", []))
            self.log_action(state, f"Retrieved {num_results} PES materials for {subject} Phase {current_phase}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in PES material retrieval process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state


class UpdatedReferenceBookAgent(BaseAgent):
    """Updated Reference Book Retrieval Agent - EXACTLY 1 book per phase"""
    
    def __init__(self):
        super().__init__("UpdatedReferenceBookAgent", temperature=0.0, max_tokens=100)
        
    def get_system_prompt(self) -> str:
        return """You are the Reference Book Retrieval Agent.

INPUT:
- subject
- difficulty
- phase concepts

TASK:
- Select the SINGLE best matching reference book
- Use metadata from collection: reference_books
- Filter by subject relevance (OS/DSA/CN/DBMS)
- Filter by difficulty
- Map chapters to phase concepts
- NO hallucination of books or chapters

OUTPUT JSON ONLY:
{
  "result": {
    "id": "book_001",
    "title": "...",
    "authors": ["..."],
    "isbn": "...",
    "summary": "...",
    "difficulty": "...",
    "key_concepts": [...],
    "recommended_chapters": ["Chapter 1", "Chapter 2"],
    "relevance_score": 0.91,
    "semantic_score": 0.89,
    "snippet": "..."
  }
}"""

    async def retrieve_best_book(self, subject: str, difficulty: str, concepts: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Retrieve EXACTLY 1 best reference book for the subject and difficulty
        
        Args:
            subject: Subject name
            difficulty: Difficulty level (Beginner/Intermediate/Advanced)
            concepts: Phase concepts to match against
            
        Returns:
            Dict with single best book result
        """
        try:
            logger.info(f"Retrieving best reference book for {subject}, difficulty: {difficulty}")
            
            # Get MongoDB collection
            collection = db_manager.get_collection("reference_books")
            
            # Subject mapping for filtering
            subject_keywords = {
                "Operating Systems": ["operating", "system", "os"],
                "Data Structures & Algorithms": ["algorithm", "data.structure", "data structure", "dsa"],
                "Data Structures and Algorithms": ["algorithm", "data.structure", "data structure", "dsa"],  
                "Computer Networks": ["network", "networking", "communication"],
                "Database Management Systems": ["database", "dbms", "sql"]
            }
            
            # Build query for subject relevance
            keywords = subject_keywords.get(subject, [subject.lower().replace(" ", ".")])
            
            # Create flexible regex pattern
            subject_pattern = "|".join([kw.replace(".", r"[\s\.]") for kw in keywords])
            
            # Query with subject filters (more flexible)
            query = {
                "$or": [
                    {"title": {"$regex": subject_pattern, "$options": "i"}},
                    {"summary": {"$regex": subject_pattern, "$options": "i"}},
                    {"key_concepts": {"$regex": subject_pattern, "$options": "i"}}
                ]
            }
            
            # Find all matching books
            cursor = collection.find(query)
            books = list(cursor)
            
            if not books:
                # Fallback: try without difficulty filter
                logger.warning(f"No books found with difficulty filter, trying without...")
                cursor = collection.find(query)
                books = list(cursor)
            
            if not books:
                return {
                    "result": None,
                    "error": f"No reference books found for subject: {subject}"
                }
            
            # Score books and select the best one
            scored_books = []
            for book in books:
                score = self._calculate_book_relevance(book, subject, difficulty, concepts)
                scored_books.append((score, book))
            
            # Sort by score and get the best book
            scored_books.sort(key=lambda x: x[0], reverse=True)
            best_score, best_book = scored_books[0]
            
            logger.info(f"Selected best book: {best_book.get('title', 'Unknown')} (score: {best_score:.2f})")
            
            # Convert to standardized format
            result = self._convert_book_to_metadata(best_book)
            result["relevance_score"] = best_score
            
            return {
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Error retrieving reference book: {e}")
            return {
                "result": None,
                "error": str(e)
            }
    
    def _calculate_book_relevance(self, book: Dict[str, Any], subject: str, difficulty: str, concepts: Optional[List[str]]) -> float:
        """Calculate relevance score for a book"""
        score = 0.0
        
        title = book.get("title", "").lower()
        summary = book.get("summary", "").lower()
        book_concepts = book.get("key_concepts", [])
        book_difficulty = book.get("difficulty", "").lower()
        
        # Subject relevance (40%)
        subject_lower = subject.lower()
        if subject_lower in title:
            score += 0.4
        elif subject_lower in summary:
            score += 0.3
        elif any(word in title for word in subject_lower.split()):
            score += 0.2
        
        # Difficulty match (30%)
        if difficulty.lower() == book_difficulty:
            score += 0.3
        else:
            # Handle complex difficulty strings like "beginner–intermediate"
            try:
                difficulty_levels = ["beginner", "intermediate", "advanced"]
                target_idx = difficulty_levels.index(difficulty.lower())
                
                # Check if book difficulty contains target level
                if difficulty.lower() in book_difficulty:
                    score += 0.3
                # Check adjacent difficulties
                elif any(level in book_difficulty for level in difficulty_levels):
                    book_level_idx = None
                    for i, level in enumerate(difficulty_levels):
                        if level in book_difficulty:
                            book_level_idx = i
                            break
                    if book_level_idx is not None and abs(target_idx - book_level_idx) == 1:
                        score += 0.15
            except (ValueError, IndexError):
                # Skip difficulty scoring if parsing fails
                pass
        
        # Concept overlap (30%)
        if concepts and book_concepts:
            concept_overlap = 0
            for concept in concepts:
                concept_lower = concept.lower()
                for book_concept in book_concepts:
                    if concept_lower in book_concept.lower() or book_concept.lower() in concept_lower:
                        concept_overlap += 1
                        break
            if concept_overlap > 0:
                score += 0.3 * (concept_overlap / len(concepts))
        
        return score
    
    def _convert_book_to_metadata(self, book: Dict[str, Any]) -> Dict[str, Any]:
        """Convert book document to standardized metadata"""
        return {
            "id": str(book.get("_id", "")),
            "title": book.get("title", "Unknown Title"),
            "authors": book.get("authors", []),
            "isbn": book.get("isbn", ""),
            "summary": book.get("summary", ""),
            "difficulty": book.get("difficulty", "Beginner"),
            "key_concepts": book.get("key_concepts", []),
            "content_type": "reference_book",
            "source": "reference_books",
            "gridfs_id": str(book.get("gridfs_id", "")),
            "file_url": book.get("file_url", ""),
            "pdf_path": book.get("pdf_path", ""),
            "semantic_score": 0.85,
            "snippet": book.get("summary", "")[:200] if book.get("summary") else ""
        }

    def process(self, state: AgentState) -> AgentState:
        """Process state for reference book retrieval"""
        try:
            self.log_action(state, "Starting reference book retrieval with updated agent")
            
            # Get request parameters
            roadmap = state.data.get("roadmap", {})
            subject = roadmap.get("subject", "Unknown Subject")
            current_phase = state.data.get("current_phase", 1)
            difficulty = state.data.get("phase_difficulty", "Beginner")
            concepts = state.data.get("phase_concepts", [])
            
            # Retrieve best book
            import asyncio
            result = asyncio.run(self.retrieve_best_book(subject, difficulty, concepts))
            
            # Store results in state
            if "reference_books" not in roadmap:
                roadmap["reference_books"] = {}
                
            roadmap["reference_books"][f"phase_{current_phase}"] = result
            state.data["roadmap"] = roadmap
            
            # Log results
            book_title = result.get("result", {}).get("title", "None") if result.get("result") else "None"
            self.log_action(state, f"Selected reference book for {subject} Phase {current_phase}: {book_title}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in reference book retrieval process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
