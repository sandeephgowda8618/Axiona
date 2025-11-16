import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiMetadataGenerator:
    """Uses Gemini AI to infer key_concepts, difficulty, and enhanced content_preview."""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "models/gemini-1.5-pro")
        
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        
        logger.info(f"Initialized Gemini AI with model: {self.model_name}")
    
    def enhance_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Enhance metadata with AI-generated fields"""
        
        enhanced = metadata.copy()
        
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
            response = self.model.generate_content(prompt)
            ai_response = response.text.strip()
            
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
            logger.warning(f"Gemini returned invalid JSON: {ai_response[:200]}... Error: {e}")
            raise Exception("Invalid JSON from Gemini AI")
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
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
        key_concepts = self._extract_key_concepts(text)
        
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
                "mobile", "security", "artificial intelligence", "machine learning"
            ],
            "Mathematics": [
                "calculus", "algebra", "geometry", "statistics", "probability",
                "mathematical", "theorem", "proof", "equation", "function",
                "matrix", "vector", "optimization", "analysis"
            ],
            "Data Science": [
                "data science", "analytics", "visualization", "pandas", "numpy",
                "machine learning", "deep learning", "neural network", "regression",
                "classification", "clustering", "statistical analysis"
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
            "getting started", "first", "basic", "simple", "easy"
        ]
        
        advanced_indicators = [
            "advanced", "expert", "professional", "comprehensive", "complete",
            "mastery", "deep", "sophisticated", "complex", "research"
        ]
        
        expert_indicators = [
            "research", "theoretical", "phd", "graduate", "doctoral",
            "cutting edge", "state of the art", "novel", "breakthrough"
        ]
        
        if any(indicator in text for indicator in expert_indicators):
            return "Expert"
        elif any(indicator in text for indicator in advanced_indicators):
            return "Advanced"
        elif any(indicator in text for indicator in beginner_indicators):
            return "Beginner"
        else:
            return "Intermediate"
    
    def _extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts using pattern matching"""
        
        concept_patterns = {
            # Programming
            "python", "java", "javascript", "c++", "programming", "coding",
            "algorithms", "data structures", "object oriented", "functional programming",
            
            # Data Science/ML
            "machine learning", "deep learning", "neural networks", "artificial intelligence",
            "data analysis", "statistics", "regression", "classification", "clustering",
            "scikit-learn", "tensorflow", "pytorch", "pandas", "numpy",
            
            # Mathematics
            "linear algebra", "calculus", "probability", "statistics", "optimization",
            "mathematical analysis", "discrete mathematics", "geometry",
            
            # Computer Science
            "software engineering", "web development", "database", "networking",
            "cybersecurity", "operating systems", "distributed systems",
            "computer graphics", "human computer interaction",
            
            # Other
            "project management", "devops", "cloud computing", "big data",
            "blockchain", "internet of things", "mobile development"
        }
        
        found_concepts = []
        for concept in concept_patterns:
            if concept in text:
                found_concepts.append(concept.title())
        
        # Return top 8 concepts
        return found_concepts[:8] if found_concepts else ["Computer Science", "Technical"]
    
    def _generate_summary(self, title: str, subject: str) -> str:
        """Generate a basic summary"""
        if not title:
            return f"A comprehensive resource covering key topics in {subject}."
        
        return f"This book '{title}' provides comprehensive coverage of important concepts in {subject}. " \
               f"It serves as a valuable reference for understanding fundamental and advanced topics in the field."
    
    def _determine_audience_and_prereqs(self, subject: str, difficulty: str) -> tuple:
        """Determine target audience and prerequisites"""
        
        audience_map = {
            "Beginner": "Students, Newcomers",
            "Intermediate": "Students, Professionals",
            "Advanced": "Professionals, Researchers", 
            "Expert": "Researchers, Experts"
        }
        
        prereq_map = {
            ("Computer Science", "Beginner"): ["Basic computer literacy"],
            ("Computer Science", "Intermediate"): ["Programming fundamentals", "Basic algorithms"],
            ("Computer Science", "Advanced"): ["Data structures", "Programming experience", "Mathematical foundations"],
            ("Computer Science", "Expert"): ["Advanced algorithms", "Research experience", "Mathematical maturity"],
            
            ("Mathematics", "Beginner"): ["High school mathematics"],
            ("Mathematics", "Intermediate"): ["Calculus", "Linear algebra basics"],
            ("Mathematics", "Advanced"): ["Advanced calculus", "Linear algebra", "Proof techniques"],
            ("Mathematics", "Expert"): ["Graduate-level mathematics", "Research experience"],
            
            ("Data Science", "Beginner"): ["Basic statistics", "Programming basics"],
            ("Data Science", "Intermediate"): ["Python/R", "Statistics", "Basic machine learning"],
            ("Data Science", "Advanced"): ["Advanced statistics", "Machine learning", "Programming proficiency"],
            ("Data Science", "Expert"): ["Advanced ML", "Research methods", "Mathematical foundations"]
        }
        
        target_audience = audience_map.get(difficulty, "General audience")
        prerequisites = prereq_map.get((subject, difficulty), ["Basic knowledge in the field"])
        
        return target_audience, prerequisites
    
    def process_metadata_batch(self, metadata_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process a batch of metadata entries with Gemini AI"""
        
        enhanced_list = []
        
        for i, metadata in enumerate(metadata_list, 1):
            try:
                logger.info(f"Processing {i}/{len(metadata_list)}: {metadata.get('title', 'Unknown')}")
                enhanced = self.enhance_metadata(metadata)
                enhanced_list.append(enhanced)
                
            except Exception as e:
                logger.error(f"Failed to enhance {metadata.get('filename', 'unknown')}: {e}")
                # Keep original metadata if enhancement fails
                enhanced_list.append(metadata)
        
        return enhanced_list

if __name__ == "__main__":
    # Test Gemini enhancement
    enhancer = GeminiMetadataGenerator()
    
    test_metadata = {
        "title": "Introduction to Algorithms",
        "content_preview": "This book provides a comprehensive introduction to algorithms and data structures. It covers sorting, searching, graph algorithms, dynamic programming, and computational complexity...",
        "filename": "intro_algorithms.pdf"
    }
    
    enhanced = enhancer.enhance_metadata(test_metadata)
    print(json.dumps(enhanced, indent=2))
