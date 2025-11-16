"""
AI Metadata Generator for Pipeline RAG System

This module uses AI (Gemini) to generate enhanced metadata for books and documents,
including key concepts, difficulty levels, and content summaries.
"""

import os
import json
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class MetadataGenerator:
    """Uses AI to infer key_concepts, difficulty, and enhanced content_preview."""
    
    def __init__(self, use_ai: bool = True):
        self.use_ai = use_ai
        self.model = None
        
        if use_ai:
            try:
                import google.generativeai as genai  # type: ignore
                self.api_key = os.getenv("GOOGLE_API_KEY")
                self.model_name = os.getenv("GEMINI_MODEL", "models/gemini-1.5-pro")
                
                if not self.api_key:
                    logger.warning("GOOGLE_API_KEY not found, falling back to rule-based metadata")
                    self.use_ai = False
                else:
                    # Configure Gemini
                    genai.configure(api_key=self.api_key)  # type: ignore
                    self.model = genai.GenerativeModel(self.model_name)  # type: ignore
                    logger.info(f"Initialized Gemini AI with model: {self.model_name}")
                    
            except ImportError:
                logger.warning("google-generativeai not installed, falling back to rule-based metadata")
                self.use_ai = False
            except Exception as e:
                logger.warning(f"Failed to initialize AI: {e}, falling back to rule-based metadata")
                self.use_ai = False
    
    def enhance_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance metadata with AI-generated or rule-based fields"""
        
        enhanced = metadata.copy()
        
        if self.use_ai and self.model:
            try:
                # Generate AI enhancements
                ai_data = self._generate_ai_metadata(
                    title=metadata.get("title", ""),
                    content_preview=metadata.get("content_preview", ""),
                    filename=metadata.get("filename", "")
                )
                
                # Add AI-generated fields
                enhanced.update(ai_data)
                logger.info(f"Successfully enhanced metadata for: {metadata.get('title', 'Unknown')}")
                
            except Exception as e:
                logger.error(f"AI enhancement failed for {metadata.get('filename', 'unknown')}: {e}")
                # Fallback to rule-based enhancement
                enhanced.update(self._fallback_enhancement(metadata))
                logger.info(f"Used fallback enhancement for: {metadata.get('title', 'Unknown')}")
        else:
            # Use rule-based enhancement
            enhanced.update(self._fallback_enhancement(metadata))
            logger.info(f"Used rule-based enhancement for: {metadata.get('title', 'Unknown')}")
        
        return enhanced
    
    def _generate_ai_metadata(self, title: str, content_preview: str, filename: str) -> Dict[str, Any]:
        """Generate metadata using Gemini AI"""
        
        prompt = f"""
        Analyze this technical book/document and provide metadata in JSON format.
        
        Title: {title}
        Filename: {filename}
        Content Preview: {content_preview[:1500]}
        
        Please analyze and return a JSON object with these exact fields:
        
        {{
            "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
            "difficulty": "Beginner|Intermediate|Advanced|Expert",
            "subject": "Computer Science|Mathematics|Data Science|Physics|Engineering|Business",
            "language": "English",
            "summary": "Brief 2-3 sentence summary of what the book covers",
            "target_audience": "Students|Professionals|Researchers|General",
            "prerequisites": ["prereq1", "prereq2", "prereq3"]
        }}
        
        Guidelines:
        - key_concepts: 5-8 main technical topics covered (e.g., "algorithms", "data structures", "machine learning")
        - difficulty: Based on technical complexity and required background
        - subject: Main academic/professional field
        - summary: Clear, informative description
        - target_audience: Primary intended readers
        - prerequisites: Required background knowledge
        
        Return ONLY the JSON object, no other text.
        """
        
        try:
            response = self.model.generate_content(prompt)  # type: ignore
            ai_response = response.text.strip()  # type: ignore
            
            # Clean the response to extract JSON
            if "```json" in ai_response:
                ai_response = ai_response.split("```json")[1].split("```")[0].strip()
            elif "```" in ai_response:
                ai_response = ai_response.split("```")[1].strip()
            
            # Remove any extra text before/after JSON
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                ai_response = ai_response[start_idx:end_idx]
            
            return json.loads(ai_response)
            
        except json.JSONDecodeError as e:
            logger.warning(f"AI returned invalid JSON: {ai_response[:200]}... Error: {e}")
            raise Exception("Invalid JSON from AI")
        except Exception as e:
            logger.error(f"AI API error: {e}")
            raise
    
    def _fallback_enhancement(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback enhancement when AI fails"""
        
        title = metadata.get("title", "").lower()
        content = metadata.get("content_preview", "").lower()
        filename = metadata.get("filename", "").lower()
        
        # Combined text for analysis
        text = f"{title} {content} {filename}"
        
        # Determine subject
        subject = self._detect_subject(text)
        
        # Determine difficulty
        difficulty = self._detect_difficulty(text)
        
        # Extract key concepts
        key_concepts = self._extract_key_concepts(text, subject)
        
        # Generate summary
        summary = self._generate_summary(title, subject)
        
        # Determine target audience and prerequisites
        target_audience, prerequisites = self._determine_audience_and_prereqs(subject, difficulty)
        
        return {
            "key_concepts": key_concepts,
            "difficulty": difficulty,
            "subject": subject,
            "language": "English",
            "summary": summary,
            "target_audience": target_audience,
            "prerequisites": prerequisites
        }
    
    def _detect_subject(self, text: str) -> str:
        """Detect the main subject area"""
        
        subjects = {
            "Computer Science": [
                "algorithm", "data structure", "programming", "software", "computer",
                "coding", "development", "system", "network", "database", "web",
                "mobile", "security", "artificial intelligence", "machine learning",
                "python", "java", "javascript", "c++", "programming"
            ],
            "Mathematics": [
                "calculus", "algebra", "geometry", "statistics", "probability",
                "mathematical", "theorem", "proof", "equation", "function",
                "matrix", "vector", "optimization", "analysis", "discrete"
            ],
            "Data Science": [
                "data science", "analytics", "visualization", "pandas", "numpy",
                "machine learning", "deep learning", "neural network", "regression",
                "classification", "clustering", "statistical analysis", "sklearn"
            ],
            "Physics": [
                "physics", "quantum", "mechanics", "thermodynamics", "electromagnetic",
                "relativity", "particle", "wave", "energy", "force"
            ],
            "Engineering": [
                "engineering", "design", "technical", "mechanical", "electrical",
                "civil", "chemical", "industrial", "systems engineering"
            ],
            "Business": [
                "business", "management", "finance", "economics", "marketing",
                "strategy", "leadership", "operations", "entrepreneurship"
            ]
        }
        
        for subject, keywords in subjects.items():
            if any(keyword in text for keyword in keywords):
                return subject
        
        return "Computer Science"  # Default
    
    def _detect_difficulty(self, text: str) -> str:
        """Detect difficulty level"""
        
        beginner_indicators = [
            "introduction", "beginner", "basics", "fundamentals", "primer",
            "getting started", "first", "basic", "simple", "easy", "tutorial"
        ]
        
        advanced_indicators = [
            "advanced", "expert", "professional", "comprehensive", "complete",
            "mastery", "deep", "sophisticated", "complex", "research", "graduate"
        ]
        
        intermediate_indicators = [
            "intermediate", "practical", "applied", "working", "real-world"
        ]
        
        if any(indicator in text for indicator in beginner_indicators):
            return "Beginner"
        elif any(indicator in text for indicator in advanced_indicators):
            return "Advanced"
        elif any(indicator in text for indicator in intermediate_indicators):
            return "Intermediate"
        else:
            return "Intermediate"  # Default
    
    def _extract_key_concepts(self, text: str, subject: str) -> List[str]:
        """Extract key concepts based on subject area"""
        
        concept_keywords = {
            "Computer Science": [
                "algorithms", "data structures", "programming", "databases", "networks",
                "security", "software engineering", "machine learning", "AI", "web development"
            ],
            "Mathematics": [
                "calculus", "linear algebra", "probability", "statistics", "discrete math",
                "optimization", "analysis", "geometry", "number theory", "topology"
            ],
            "Data Science": [
                "machine learning", "statistics", "data visualization", "regression",
                "classification", "clustering", "neural networks", "big data", "analytics"
            ],
            "Physics": [
                "mechanics", "thermodynamics", "electromagnetism", "quantum physics",
                "relativity", "optics", "atomic physics", "particle physics"
            ],
            "Engineering": [
                "design", "systems", "control", "signal processing", "circuits",
                "materials", "mechanics", "optimization", "modeling"
            ],
            "Business": [
                "management", "strategy", "finance", "marketing", "operations",
                "leadership", "economics", "analytics", "innovation"
            ]
        }
        
        concepts = []
        if subject in concept_keywords:
            for concept in concept_keywords[subject]:
                if concept.lower() in text:
                    concepts.append(concept)
        
        # Fallback if no concepts found
        if not concepts:
            concepts = concept_keywords.get(subject, ["general"])[:5]
        
        return concepts[:8]  # Limit to 8 concepts
    
    def _generate_summary(self, title: str, subject: str) -> str:
        """Generate a summary based on title and subject"""
        
        if not title:
            return f"A comprehensive resource covering key topics in {subject}."
        
        return f"This book '{title}' provides coverage of important concepts in {subject}, offering both theoretical foundations and practical applications."
    
    def _determine_audience_and_prereqs(self, subject: str, difficulty: str) -> tuple[str, List[str]]:
        """Determine target audience and prerequisites"""
        
        audience_mapping = {
            ("Beginner", "Computer Science"): ("Students", ["Basic math", "Logic"]),
            ("Intermediate", "Computer Science"): ("Students", ["Programming fundamentals", "Basic algorithms"]),
            ("Advanced", "Computer Science"): ("Professionals", ["Advanced programming", "Data structures", "Algorithms"]),
            ("Beginner", "Mathematics"): ("Students", ["High school math"]),
            ("Intermediate", "Mathematics"): ("Students", ["Calculus", "Linear algebra"]),
            ("Advanced", "Mathematics"): ("Researchers", ["Advanced calculus", "Abstract algebra"]),
            ("Beginner", "Data Science"): ("Students", ["Basic statistics", "Programming"]),
            ("Intermediate", "Data Science"): ("Professionals", ["Statistics", "Python/R", "Machine learning basics"]),
            ("Advanced", "Data Science"): ("Researchers", ["Advanced statistics", "Machine learning", "Deep learning"]),
        }
        
        key = (difficulty, subject)
        if key in audience_mapping:
            return audience_mapping[key]
        
        # Default mappings
        audience = "Students" if difficulty == "Beginner" else "Professionals"
        prereqs = ["Basic knowledge"] if difficulty == "Beginner" else ["Intermediate knowledge"]
        
        return audience, prereqs

if __name__ == "__main__":
    # Test the metadata generator
    generator = MetadataGenerator(use_ai=False)  # Test rule-based first
    
    # Test metadata
    test_metadata = {
        "title": "Introduction to Algorithms",
        "filename": "intro_algorithms.pdf",
        "content_preview": "This book covers fundamental algorithms and data structures including sorting, searching, graph algorithms, and dynamic programming."
    }
    
    enhanced = generator.enhance_metadata(test_metadata)
    print("Enhanced metadata:", json.dumps(enhanced, indent=2))
