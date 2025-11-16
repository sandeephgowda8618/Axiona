"""
Production RAG-Enhanced PES Material Retrieval Agent
===================================================

This agent uses RAG (Retrieval-Augmented Generation) + LLM for intelligent PES material selection:
1. RAG retrieves ALL matching documents with standardized metadata
2. LLM analyzes and selects the most relevant materials for the phase concepts
3. Returns comprehensive metadata array for selected materials

Created: November 16, 2025
Purpose: Replace simple database filtering with intelligent RAG + LLM selection
"""

import json
import logging
from typing import Dict, List, Any, Optional
from agents.base_agent import BaseAgent, AgentState
from core.vector_db import VectorDBManager
from config.database import db_manager
from core.ollama_service import ollama_service

logger = logging.getLogger(__name__)

class ProductionRAGPESMaterialAgent(BaseAgent):
    """Production RAG-enhanced PES Material Agent with intelligent selection"""
    
    def __init__(self):
        super().__init__("ProductionRAGPESMaterialAgent", temperature=0.2, max_tokens=2000)
        self.vector_db = VectorDBManager()
        
    def get_system_prompt(self) -> str:
        return """You are the RAG-Enhanced PES Material Selection Agent.

INPUT:
- subject (e.g., "Operating Systems")
- phase_number (1-4, maps to unit numbers)
- concepts (key learning concepts for this phase)
- retrieved_materials (ALL materials from RAG retrieval)

TASK:
Analyze the retrieved PES materials and intelligently select the most relevant ones for the specific phase and concepts. Use semantic understanding to match materials to learning objectives.

SELECTION CRITERIA:
1. CONCEPT RELEVANCE: Materials must cover the specific phase concepts
2. UNIT ALIGNMENT: Prefer materials from the correct unit (phase_number)
3. DIFFICULTY PROGRESSION: Match difficulty to phase progression
4. CONTENT QUALITY: Prioritize comprehensive, well-structured materials
5. COMPLETENESS: Ensure all major concepts are covered

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
      "snippet": "Operating systems manage computer hardware resources...",
      "selection_reason": "Covers fundamental OS concepts aligned with Phase 1 objectives"
    }
  ],
  "meta": {
    "subject": "Operating Systems",
    "phase": 1,
    "unit_mapped": 1,
    "total_candidates": 8,
    "selected_count": 3,
    "selection_method": "RAG + LLM intelligent filtering",
    "concepts_targeted": ["OS basics", "system calls"],
    "coverage_analysis": "All phase concepts adequately covered"
  }
}

SELECTION RULES:
- Select ALL materials needed to cover the phase concepts completely
- Prioritize materials from the correct unit, but include cross-unit materials if they're highly relevant
- Maintain diversity in content types (slides, notes, examples)
- Ensure no critical concepts are left uncovered
- Remove duplicate or redundant materials
- Provide clear selection reasoning

Return ONLY JSON."""

    def _clean_and_parse_json(self, response: str) -> dict:
        """Clean and parse JSON response from LLM"""
        try:
            import json
            
            logger.info(f"Cleaning PES LLM response. Original length: {len(response)}")
            
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
                logger.info(f"Extracted PES JSON portion: {cleaned[:200]}...")
            else:
                start_idx = cleaned.find("{")
                end_idx = cleaned.rfind("}") + 1
                if start_idx != -1 and end_idx > start_idx:
                    cleaned = cleaned[start_idx:end_idx]
                else:
                    logger.error("No JSON structure found in PES response")
                    return {}
            
            parsed = json.loads(cleaned)
            logger.info("Successfully parsed PES JSON response")
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"PES JSON decode error: {e}")
            return {}
        except Exception as e:
            logger.error(f"PES JSON parsing error: {e}")
            return {}

    async def _rag_retrieve_all_materials(self, subject: str, phase_number: int) -> List[Dict[str, Any]]:
        """Use RAG to retrieve ALL matching PES materials with standardized metadata"""
        try:
            logger.info(f"RAG retrieval for {subject}, Unit {phase_number}")
            
            # Get MongoDB collection for direct retrieval
            collection = db_manager.get_collection("pes_materials")
            
            # Primary query: exact subject + unit match
            primary_query = {
                "subject": {"$regex": f"^{subject}$", "$options": "i"},
                "unit": {"$in": [phase_number, str(phase_number)]}
            }
            
            # Secondary query: subject match with related units
            secondary_query = {
                "subject": {"$regex": f"^{subject}$", "$options": "i"}
            }
            
            logger.info(f"Primary MongoDB query: {primary_query}")
            
            # Execute primary query
            primary_docs = list(collection.find(primary_query))
            logger.info(f"Primary retrieval: {len(primary_docs)} documents")
            
            # Execute secondary query for broader context
            secondary_docs = list(collection.find(secondary_query))
            logger.info(f"Secondary retrieval: {len(secondary_docs)} documents")
            
            # Combine and deduplicate
            all_docs = []
            seen_ids = set()
            
            # Prioritize primary results
            for doc in primary_docs:
                doc_id = str(doc.get("_id", ""))
                if doc_id not in seen_ids:
                    all_docs.append(doc)
                    seen_ids.add(doc_id)
            
            # Add secondary results
            for doc in secondary_docs:
                doc_id = str(doc.get("_id", ""))
                if doc_id not in seen_ids:
                    all_docs.append(doc)
                    seen_ids.add(doc_id)
            
            # Convert to standardized metadata
            standardized_materials = []
            for doc in all_docs:
                # Validate subject match
                doc_subject = doc.get("subject", "").lower()
                target_subject = subject.lower()
                
                if target_subject not in doc_subject:
                    logger.warning(f"Skipping cross-contaminated document: {doc.get('title', 'Unknown')} - Subject: {doc_subject}")
                    continue
                
                # Convert to standardized metadata
                metadata = self._convert_to_standardized_metadata(doc)
                standardized_materials.append(metadata)
            
            logger.info(f"RAG retrieved {len(standardized_materials)} standardized PES materials")
            return standardized_materials
            
        except Exception as e:
            logger.error(f"Error in RAG retrieval: {e}")
            return []

    def _convert_to_standardized_metadata(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to standardized metadata format"""
        doc_id = str(doc.get("_id", ""))
        
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
        
        # Add optional fields
        if "gridfs_id" in doc:
            metadata["gridfs_id"] = str(doc["gridfs_id"])
        if "semester" in doc:
            metadata["semester"] = doc["semester"]
        if "created_at" in doc:
            metadata["created_at"] = doc["created_at"]
        if "page_count" in doc:
            metadata["page_count"] = doc["page_count"]
            
        return metadata

    async def retrieve_pes_materials(
        self,
        subject: str,
        phase_number: int,
        concepts: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        RAG + LLM enhanced PES material retrieval
        
        Args:
            subject: Subject name (e.g., "Operating Systems")
            phase_number: Learning phase (1-4) mapped to unit numbers
            concepts: List of concepts for this phase
            
        Returns:
            Dict with intelligently selected PES materials and metadata
        """
        try:
            logger.info(f"RAG + LLM retrieval for {subject}, Phase {phase_number}")
            
            # Step 1: RAG retrieval of all matching materials
            all_materials = await self._rag_retrieve_all_materials(subject, phase_number)
            
            if not all_materials:
                return {
                    "results": [],
                    "meta": {
                        "subject": subject,
                        "phase": phase_number,
                        "unit_mapped": phase_number,
                        "total_candidates": 0,
                        "selected_count": 0,
                        "selection_method": "RAG retrieval",
                        "error": f"No PES materials found for {subject} Unit {phase_number}"
                    }
                }
            
            logger.info(f"RAG found {len(all_materials)} candidate materials")
            
            # Step 2: LLM intelligent selection
            concepts_list = concepts or []
            
            # Build LLM prompt for intelligent selection
            prompt = f"""Analyze and select the most relevant PES materials for learning:

Subject: {subject}
Phase: {phase_number} (Unit {phase_number})
Concepts: {concepts_list}

Retrieved Materials ({len(all_materials)} total):
{json.dumps(all_materials, indent=2)}

Select the materials that:
1. Best cover the phase concepts: {concepts_list}
2. Are appropriate for Phase {phase_number} progression
3. Provide comprehensive coverage without redundancy
4. Match the subject focus exactly

Return your selection with clear reasoning for each material."""

            # Get LLM response
            raw_response = await ollama_service.generate_response(prompt, temperature=self.temperature)
            logger.info(f"Raw LLM response for PES selection: {raw_response[:300]}...")
            
            # Parse LLM selection
            parsed_response = self._clean_and_parse_json(raw_response)
            
            if not isinstance(parsed_response, dict) or "results" not in parsed_response:
                # Fallback: return all materials if LLM parsing fails
                logger.warning("LLM selection failed, returning all retrieved materials")
                return {
                    "results": all_materials,
                    "meta": {
                        "subject": subject,
                        "phase": phase_number,
                        "unit_mapped": phase_number,
                        "total_candidates": len(all_materials),
                        "selected_count": len(all_materials),
                        "selection_method": "RAG retrieval (LLM fallback)",
                        "concepts_targeted": concepts_list,
                        "warning": "LLM selection failed, returned all materials"
                    }
                }
            
            selected_materials = parsed_response.get("results", [])
            
            # Validate selected materials have proper metadata
            validated_materials = []
            for material in selected_materials:
                if isinstance(material, dict) and "id" in material:
                    validated_materials.append(material)
            
            # Ensure we have at least some materials
            if not validated_materials:
                logger.warning("No valid materials from LLM selection, using top RAG results")
                validated_materials = all_materials[:5]  # Take top 5 as fallback
            
            # Build final response with enriched metadata
            result = {
                "results": validated_materials,
                "meta": {
                    "subject": subject,
                    "phase": phase_number,
                    "unit_mapped": phase_number,
                    "total_candidates": len(all_materials),
                    "selected_count": len(validated_materials),
                    "selection_method": "RAG + LLM intelligent selection",
                    "concepts_targeted": concepts_list,
                    "coverage_analysis": f"Selected {len(validated_materials)} materials to cover phase concepts",
                    "retrieval_stats": {
                        "rag_retrieved": len(all_materials),
                        "llm_selected": len(selected_materials),
                        "final_validated": len(validated_materials)
                    }
                }
            }
            
            logger.info(f"Final selection: {len(validated_materials)} materials for {subject} Phase {phase_number}")
            return result
            
        except Exception as e:
            logger.error(f"Error in RAG + LLM PES retrieval: {e}")
            return {
                "results": [],
                "meta": {
                    "subject": subject,
                    "phase": phase_number,
                    "unit_mapped": phase_number,
                    "total_candidates": 0,
                    "selected_count": 0,
                    "selection_method": "error_fallback",
                    "error": str(e)
                }
            }

    async def process(self, state: AgentState) -> AgentState:
        """Process state for RAG + LLM PES material retrieval"""
        try:
            self.log_action(state, "Starting RAG + LLM PES material retrieval")
            
            # Extract data from state
            roadmap = state.data.get("roadmap", {})
            subject = roadmap.get("subject", "Unknown Subject")
            current_phase = state.data.get("current_phase", 1)
            concepts = state.data.get("phase_concepts", [])
            
            # Retrieve materials using RAG + LLM
            results = await self.retrieve_pes_materials(subject, current_phase, concepts)
            
            # Store results in state
            if "pes_materials" not in roadmap:
                roadmap["pes_materials"] = {}
            
            roadmap["pes_materials"][f"phase_{current_phase}"] = results
            state.data["roadmap"] = roadmap
            
            # Log results
            num_results = len(results.get("results", []))
            selection_method = results.get("meta", {}).get("selection_method", "unknown")
            self.log_action(state, f"Retrieved {num_results} PES materials via {selection_method}")
            
            return state
            
        except Exception as e:
            logger.error(f"Error in RAG + LLM PES retrieval process: {e}")
            state.data["status"] = "failed"
            state.data["error"] = str(e)
            return state
