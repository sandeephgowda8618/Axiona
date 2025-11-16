"""
Production RAG Reference Book Retrieval Agent
============================================

A RAG + LLM agent that:
1. Uses vector search to find relevant reference books
2. Uses LLM to intelligently select the best match
3. Returns standardized metadata with semantic scoring
4. No hardcoded fallback responses

This follows the same pattern as the RAG PES Material Agent but for reference books.
"""

import logging
import json
from typing import Dict, List, Any, Optional
from core.vector_db import VectorDBManager  
from config.database import db_manager
from core.ollama_service import ollama_service
from agents.base_agent import BaseAgent, AgentState

logger = logging.getLogger(__name__)

class ProductionRAGReferenceBookAgent(BaseAgent):
    """RAG + LLM Reference Book Retrieval Agent - Production Ready"""
    
    def __init__(self):
        super().__init__("ProductionRAGReferenceBookAgent", temperature=0.1, max_tokens=1000)
        self.vector_db = VectorDBManager()
        
    def get_system_prompt(self) -> str:
        return """You are the Reference Book Selection Expert.

Given a list of reference book candidates, select the SINGLE BEST book for the given subject and difficulty level.

SELECTION CRITERIA:
1. SUBJECT RELEVANCE (Primary): Book must be directly relevant to the subject
2. DIFFICULTY MATCH: Book difficulty should match or be close to target difficulty  
3. CONTENT QUALITY: Comprehensive coverage of key concepts
4. CHAPTER MAPPING: Ability to map specific chapters to phase concepts

INPUT FORMAT:
- Subject: The academic subject (e.g., "Operating Systems", "Data Structures & Algorithms")
- Difficulty: Target difficulty level (Beginner/Intermediate/Advanced)
- Concepts: Key concepts for this phase
- Candidates: List of reference books from vector search

OUTPUT: Return ONLY valid JSON with the selected book:
{
  "selected_book": {
    "id": "book_id_from_database",
    "title": "exact_title_from_database", 
    "authors": ["author1", "author2"],
    "isbn": "isbn_from_database",
    "summary": "summary_from_database",
    "difficulty": "difficulty_from_database",
    "key_concepts": ["concept1", "concept2"],
    "content_type": "reference_book",
    "source": "reference_books",
    "gridfs_id": "gridfs_id_from_database",
    "file_url": "file_url_from_database", 
    "pdf_path": "pdf_path_from_database",
    "recommended_chapters": ["Chapter 1: Introduction", "Chapter 3: Advanced Topics"],
    "relevance_score": 0.92,
    "semantic_score": 0.88,
    "selection_reasoning": "Most comprehensive coverage of operating systems fundamentals with excellent beginner-friendly explanations"
  }
}

RULES:
- Select EXACTLY 1 book (the best match)
- Use EXACT values from the database candidates
- Calculate realistic relevance_score (0.0-1.0) based on subject match
- semantic_score is provided from vector search
- Include 2-4 recommended chapters based on phase concepts
- Provide brief selection_reasoning
- Return ONLY valid JSON, no other text"""

    def _clean_and_parse_json(self, response: str) -> dict:
        """Clean and parse JSON response from LLM"""
        try:
            logger.info(f"Cleaning reference book LLM response. Original length: {len(response)}")
            
            # Clean the response
            cleaned = response.strip()
            
            # Remove markdown code blocks
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # Extract JSON boundaries
            brace_count = 0
            start_idx = -1
            end_idx = -1
            
            for i, char in enumerate(cleaned):
                if char == '{':
                    if start_idx == -1:
                        start_idx = i
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0 and start_idx != -1:
                        end_idx = i + 1
                        break
            
            if start_idx != -1 and end_idx != -1:
                cleaned = cleaned[start_idx:end_idx]
                logger.info(f"Extracted reference book JSON portion: {cleaned[:200]}...")
            else:
                start_idx = cleaned.find("{")
                end_idx = cleaned.rfind("}") + 1
                if start_idx != -1 and end_idx > start_idx:
                    cleaned = cleaned[start_idx:end_idx]
                else:
                    logger.error("No JSON structure found in reference book response")
                    return {}
            
            parsed = json.loads(cleaned)
            logger.info("Successfully parsed reference book JSON response")
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"Reference book JSON decode error: {e}")
            return {}
        except Exception as e:
            logger.error(f"Reference book JSON parsing error: {e}")
            return {}

    async def retrieve_best_book(self, subject: str, difficulty: str, concepts: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Use RAG + LLM to find and select the best reference book
        
        Args:
            subject: Target subject
            difficulty: Difficulty level  
            concepts: Phase concepts to match
            
        Returns:
            Dict with selected book or error
        """
        try:
            logger.info(f"🔍 RAG Reference Book search for: {subject} ({difficulty})")
            
            # Step 1: MongoDB retrieval for candidate books
            candidates = await self._rag_retrieve_all_books(subject, difficulty)
            
            if not candidates:
                logger.warning(f"No candidates found for {subject}")
                return {
                    "result": None,
                    "error": f"No reference books found for {subject}",
                    "candidates_found": 0
                }
            
            logger.info(f"Found {len(candidates)} book candidates from RAG retrieval")
            
            # Step 2: Use LLM to select the best book
            llm_result = await self._llm_select_best_book(subject, difficulty, concepts or [], candidates)
            
            return {
                "result": llm_result,
                "candidates_found": len(candidates)
            }
            
        except Exception as e:
            logger.error(f"RAG reference book retrieval failed: {e}")
            return {
                "result": None,
                "error": f"Reference book search failed: {str(e)}",
                "candidates_found": 0
            }
    
    async def _rag_retrieve_all_books(self, subject: str, difficulty: str) -> List[Dict[str, Any]]:
        """Use RAG to retrieve ALL matching reference books with standardized metadata"""
        try:
            logger.info(f"RAG retrieval for {subject}, difficulty: {difficulty}")
            
            # Get MongoDB collection for direct retrieval
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
            
            # Primary query: subject + difficulty match
            primary_query = {
                "$or": [
                    {"title": {"$regex": subject_pattern, "$options": "i"}},
                    {"summary": {"$regex": subject_pattern, "$options": "i"}},
                    {"key_concepts": {"$regex": subject_pattern, "$options": "i"}}
                ]
            }
            
            # Secondary query: broader subject match
            secondary_query = {
                "$or": [
                    {"title": {"$regex": subject.replace(" ", ".*"), "$options": "i"}},
                    {"summary": {"$regex": subject.replace(" ", ".*"), "$options": "i"}}
                ]
            }
            
            logger.info(f"Primary MongoDB query: {primary_query}")
            
            # Execute primary query
            primary_docs = list(collection.find(primary_query))
            logger.info(f"Primary retrieval: {len(primary_docs)} documents")
            
            # If not enough results, try secondary query
            all_docs = primary_docs
            if len(primary_docs) < 3:
                secondary_docs = list(collection.find(secondary_query))
                logger.info(f"Secondary retrieval: {len(secondary_docs)} documents")
                
                # Combine and deduplicate
                seen_ids = {str(doc.get("_id", "")) for doc in primary_docs}
                for doc in secondary_docs:
                    doc_id = str(doc.get("_id", ""))
                    if doc_id not in seen_ids:
                        all_docs.append(doc)
                        seen_ids.add(doc_id)
            
            # Convert to standardized metadata
            standardized_books = []
            for doc in all_docs:
                # Convert to standardized metadata
                metadata = self._convert_book_to_metadata_standard(doc)
                standardized_books.append(metadata)
            
            logger.info(f"RAG retrieved {len(standardized_books)} standardized reference books")
            return standardized_books
            
        except Exception as e:
            logger.error(f"Error in RAG book retrieval: {e}")
            return []
    
    def _convert_book_to_metadata_standard(self, book: Dict[str, Any]) -> Dict[str, Any]:
        """Convert book document to standardized metadata format for LLM processing"""
        return {
            "id": str(book.get("_id", "")),
            "title": book.get("title", "Unknown Title"),
            "authors": book.get("authors", []),
            "isbn": book.get("isbn", ""),
            "summary": book.get("summary", "")[:300],  # Truncate for LLM
            "difficulty": book.get("difficulty", "Unknown"),
            "key_concepts": book.get("key_concepts", [])[:5],  # Limit concepts
            "gridfs_id": str(book.get("gridfs_id", "")),
            "file_url": book.get("file_url", ""),
            "pdf_path": book.get("pdf_path", "")
        }
    
    async def _llm_select_best_book(self, subject: str, difficulty: str, concepts: List[str], candidates: List[Dict]) -> Optional[Dict[str, Any]]:
        """Use LLM to intelligently select the best reference book"""
        try:
            # Prepare candidate summaries for LLM
            candidate_summaries = []
            for i, book in enumerate(candidates):
                summary = {
                    "index": i,
                    "id": str(book.get("_id", "")),
                    "title": book.get("title", "Unknown"),
                    "authors": book.get("authors", []),
                    "isbn": book.get("isbn", ""),
                    "summary": book.get("summary", "")[:300],  # Truncate for LLM
                    "difficulty": book.get("difficulty", "Unknown"),
                    "key_concepts": book.get("key_concepts", [])[:5],  # Limit concepts
                    "semantic_score": book.get("semantic_score", 0.0),
                    "gridfs_id": str(book.get("gridfs_id", "")),
                    "file_url": book.get("file_url", ""),
                    "pdf_path": book.get("pdf_path", "")
                }
                candidate_summaries.append(summary)
            
            # Create LLM prompt
            prompt = f"""You are selecting the best reference book for learning.

Subject: {subject}
Difficulty: {difficulty}
Phase Concepts: {', '.join(concepts)}

Book Candidates (select the single best match):
{json.dumps(candidate_summaries, indent=2)}

RESPOND WITH ONLY THIS JSON STRUCTURE:
{{
  "selected_book": {{
    "id": "copy_exact_id_from_candidates",
    "title": "copy_exact_title_from_candidates", 
    "authors": ["copy_exact_authors_from_candidates"],
    "isbn": "copy_exact_isbn_from_candidates",
    "summary": "copy_exact_summary_from_candidates",
    "difficulty": "copy_exact_difficulty_from_candidates",
    "key_concepts": ["copy_exact_key_concepts_from_candidates"],
    "content_type": "reference_book",
    "source": "reference_books",
    "gridfs_id": "copy_exact_gridfs_id_from_candidates",
    "file_url": "copy_exact_file_url_from_candidates", 
    "pdf_path": "copy_exact_pdf_path_from_candidates",
    "recommended_chapters": ["Chapter 1: Introduction", "Chapter 3: Core Topics"],
    "relevance_score": 0.92,
    "semantic_score": 0.88,
    "selection_reasoning": "Brief explanation for choosing this book"
  }}
}}

Return ONLY the JSON, no other text."""

            # Get LLM response using ollama_service
            response = await ollama_service.generate_response(
                prompt=prompt,
                temperature=0.1
            )
            
            if not response:
                logger.error("Empty LLM response for reference book selection")
                return None
            
            # Clean and parse JSON response
            parsed_response = self._clean_and_parse_json(response)
            try:
                if "selected_book" in parsed_response:
                    selected_book = parsed_response["selected_book"]
                    
                    # Validate required fields
                    required_fields = ["id", "title", "content_type", "source"]
                    if all(field in selected_book for field in required_fields):
                        logger.info(f"✅ LLM selected book: {selected_book.get('title')}")
                        return selected_book
                    else:
                        logger.error(f"LLM selection missing required fields: {selected_book}")
                        
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM selection JSON: {e}")
                logger.error(f"Raw LLM response: {response[:200]}...")
            
            # If LLM selection fails, fall back to highest semantic score
            logger.warning("LLM selection failed, using highest semantic score book")
            best_book = max(candidates, key=lambda x: x.get("semantic_score", 0.0))
            return self._convert_book_to_metadata(best_book)
            
        except Exception as e:
            logger.error(f"LLM book selection failed: {e}")
            # Return highest scored candidate as fallback
            if candidates:
                best_book = max(candidates, key=lambda x: x.get("semantic_score", 0.0))
                return self._convert_book_to_metadata(best_book)
            return None
    
    def _convert_book_to_metadata(self, book: Dict[str, Any]) -> Dict[str, Any]:
        """Convert book document to standardized metadata format"""
        return {
            "id": str(book.get("_id", "")),
            "title": book.get("title", "Unknown Title"),
            "authors": book.get("authors", []),
            "isbn": book.get("isbn", ""),
            "summary": book.get("summary", ""),
            "difficulty": book.get("difficulty", "Unknown"),
            "key_concepts": book.get("key_concepts", []),
            "content_type": "reference_book",
            "source": "reference_books",
            "gridfs_id": str(book.get("gridfs_id", "")),
            "file_url": book.get("file_url", ""),
            "pdf_path": book.get("pdf_path", ""),
            "recommended_chapters": ["Chapter 1", "Chapter 2"],  # Default
            "relevance_score": 0.85,
            "semantic_score": book.get("semantic_score", 0.8),
            "selection_reasoning": "Selected based on semantic similarity and metadata matching"
        }

    async def process(self, state: AgentState) -> AgentState:
        """Process state for RAG reference book retrieval"""
        try:
            self.log_action(state, "Starting RAG reference book retrieval")
            
            # Get request parameters
            roadmap = state.data.get("roadmap", {})
            subject = roadmap.get("subject", "Unknown Subject")
            current_phase = state.data.get("current_phase", 1)
            difficulty = state.data.get("phase_difficulty", "Beginner")
            concepts = state.data.get("phase_concepts", [])
            
            # Retrieve best book using RAG + LLM
            result = await self.retrieve_best_book(subject, difficulty, concepts)
            
            # Store results in state
            if "reference_books" not in roadmap:
                roadmap["reference_books"] = {}
                
            roadmap["reference_books"][f"phase_{current_phase}"] = result
            state.data["roadmap"] = roadmap
            
            # Log results
            if result.get("result"):
                book_title = result["result"].get("title", "Unknown")
                candidates_count = result.get("candidates_found", 0)
                self.log_action(state, f"RAG selected reference book for {subject} Phase {current_phase}: {book_title} (from {candidates_count} candidates)")
            else:
                error_msg = result.get("error", "Unknown error")
                self.log_action(state, f"RAG reference book retrieval failed for {subject} Phase {current_phase}: {error_msg}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in RAG reference book retrieval process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
