# LLaMA Model with LangChain Integration
import logging
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime

# LangChain imports
from langchain_community.llms import Ollama
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from langchain_core.outputs import LLMResult
from langchain_core.prompts import PromptTemplate

# Updated imports for LangChain v1.0
try:
    from langchain.chains.llm import LLMChain
    from langchain.memory import ConversationBufferMemory
except ImportError:
    # Fallback for newer versions
    from langchain_core.runnables import RunnableLambda
    LLMChain = None
    ConversationBufferMemory = None

# Alternative cloud providers
try:
    import replicate
    REPLICATE_AVAILABLE = True
except ImportError:
    REPLICATE_AVAILABLE = False

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    GOOGLE_GENAI_AVAILABLE = True
except ImportError:
    GOOGLE_GENAI_AVAILABLE = False

from config.settings import config

logger = logging.getLogger(__name__)

class LLaMAModel:
    """LLaMA model with LangChain integration for RAG operations"""
    
    def __init__(self, model_name: str = "llama2:7b", provider: str = "ollama"):
        self.model_name = model_name
        self.provider = provider
        self.llm = None
        self.chains = {}
        self.memory = ConversationBufferMemory(return_messages=True)
        
    async def initialize(self):
        """Initialize the LLaMA model with LangChain"""
        try:
            logger.info(f"Initializing LLaMA model: {self.model_name} via {self.provider}")
            
            if self.provider == "ollama":
                self.llm = Ollama(
                    model=self.model_name,
                    temperature=0.7,
                    top_k=40,
                    top_p=0.9,
                    num_predict=512
                )
                
            elif self.provider == "replicate" and REPLICATE_AVAILABLE:
                # We'll implement a custom LangChain wrapper for Replicate
                self.llm = ReplicateLLaMA(model=self.model_name)
                
            elif self.provider == "gemini" and GOOGLE_GENAI_AVAILABLE:
                self.llm = ChatGoogleGenerativeAI(
                    model=self.model_name if self.model_name != "llama2:7b" else "gemini-pro",
                    temperature=0.7,
                    max_output_tokens=512
                )
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
            
            # Initialize chains
            await self._initialize_chains()
            
            logger.info("LLaMA model initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize LLaMA model: {e}")
            raise
    
    async def _initialize_chains(self):
        """Initialize LangChain chains for different tasks"""
        
        # Roadmap generation chain
        roadmap_template = PromptTemplate(
            input_variables=["context", "domain", "skill_level", "daily_time", "previous_answers"],
            template="""
            You are an expert learning advisor. Based on this context: {context}

            Create a detailed, personalized learning roadmap for a student with:
            - Domain: {domain}
            - Skill level: {skill_level}
            - Daily study time: {daily_time} minutes
            - Previous answers: {previous_answers}

            Requirements for the roadmap:
            1. Divide the roadmap into multiple phases (n phases based on subject complexity).
            2. Each phase must include:
               - Phase name and brief description
               - At least 2 recommended videos
               - At least 2 PDFs or lecture notes
               - 1 recommended reference book
               - Quizzes to assess learning
            3. Optimize each phase for the user's daily study time and current skill level.
            4. Ensure content progresses from beginner to advanced (difficulty increases gradually).
            5. Return the roadmap in JSON format with this structure:
            {{
                "phases": [
                    {{
                        "phase_name": "Phase 1: ...",
                        "description": "...",
                        "videos": ["video_url1", "video_url2"],
                        "pdfs": ["pdf1", "pdf2"],
                        "reference_book": "Book Title",
                        "quizzes": ["quiz1_id", "quiz2_id"]
                    }},
                    ...
                ]
            }}
            """
        )
        
        self.chains["roadmap"] = LLMChain(
            llm=self.llm,
            prompt=roadmap_template,
            memory=self.memory
        )
        
        # Book filtering chain
        book_template = PromptTemplate(
            input_variables=["context", "query", "academic_level"],
            template="""
            You are an expert academic advisor. 
            From these reference books: {context}
            
            Topic: {query}
            Academic Level: {academic_level}
            
            Rank and recommend the **top 5 books** most relevant to this topic. 
            Return a JSON list with only these fields for each book:
            - id
            - name/title
            - pdf filename
            - difficulty level
            
            Example output:
            [
                {{"id": "book1", "name": "Machine Learning Basics", "pdf": "ml_basics.pdf", "level": "Beginner"}},
                {{"id": "book2", "name": "Deep Learning with Python", "pdf": "dl_python.pdf", "level": "Intermediate"}}
            ]
            """
        )
        
        self.chains["books"] = LLMChain(
            llm=self.llm,
            prompt=book_template
        )
        
        # Video filtering chain
        video_template = PromptTemplate(
            input_variables=["context", "query", "duration_preference"],
            template="""
            You are an expert learning guide. From these tutorial videos: {context}
            
            Topic: {query}
            Duration Preference: {duration_preference}
            
            Recommend the best learning sequence. Return **only JSON** with these fields for each video:
            - id
            - name/title
            - level (Beginner/Intermediate/Advanced)
            - duration
            - video URL/filepath

            Also, group videos into:
            1. Beginner (watch first)
            2. Intermediate (build upon basics)
            3. Advanced/Project (apply knowledge)
            
            Include estimated total learning time for the sequence.
            
            Example output:
            {{
              "beginner": [
                {{"id": "vid1", "name": "Intro to DSA", "duration": "15m", "level": "Beginner", "url": "video1.mp4"}}
              ],
              "intermediate": [
                {{"id": "vid2", "name": "Recursion in DSA", "duration": "20m", "level": "Intermediate", "url": "video2.mp4"}}
              ],
              "advanced": [],
              "estimated_total_time": "2h 30m"
            }}
            """
        )
        
        self.chains["videos"] = LLMChain(
            llm=self.llm,
            prompt=video_template
        )
        
        # PDF search chain
        pdf_template = PromptTemplate(
            input_variables=["context", "query", "subject", "difficulty"],
            template="""
            Based on these PDF sections: {context}
            
            User query: {query}
            Subject: {subject}
            Difficulty: {difficulty}
            
            Provide:
            1. A concise summary of relevant content
            2. Key concepts to focus on
            3. Recommended PDFs with page numbers
            4. Related topics to explore
            
            Format as JSON:
            {{
                "summary": "...",
                "key_concepts": ["concept1", "concept2"],
                "recommended_pdfs": [
                    {{"title": "PDF Title", "pages": "10-15", "relevance": "high"}}
                ],
                "related_topics": ["topic1", "topic2"]
            }}
            """
        )
        
        self.chains["pdfs"] = LLMChain(
            llm=self.llm,
            prompt=pdf_template
        )
    
    async def generate_roadmap(self, user_profile: Dict[str, Any], context: str = "") -> Dict[str, Any]:
        """Generate personalized learning roadmap using LangChain"""
        try:
            result = await self.chains["roadmap"].ainvoke({
                "context": context,
                "domain": user_profile.get("domain", ""),
                "skill_level": user_profile.get("skill_level", "beginner"),
                "daily_time": user_profile.get("daily_time", 60),
                "previous_answers": user_profile.get("previous_answers", {})
            })
            
            # Extract text from result
            if isinstance(result, dict) and "text" in result:
                result_text = result["text"]
            else:
                result_text = str(result)
            
            # Parse JSON response
            try:
                roadmap = json.loads(result_text)
                return roadmap
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {"phases": [], "error": "Failed to parse roadmap JSON"}
                
        except Exception as e:
            logger.error(f"Roadmap generation failed: {e}")
            raise
    
    async def filter_books(self, criteria: Dict[str, Any], context: str = "") -> List[Dict[str, Any]]:
        """Filter and recommend books using LangChain"""
        try:
            result = await self.chains["books"].ainvoke({
                "context": context,
                "query": criteria.get("query", ""),
                "academic_level": criteria.get("academic_level")
            })
            
            # Extract text from LangChain result
            response_text = result.get("text", "") if isinstance(result, dict) else str(result)
            
            # Parse JSON response
            try:
                books = json.loads(response_text)
                return books if isinstance(books, list) else []
            except json.JSONDecodeError:
                logger.warning("Failed to parse books JSON response")
                return []
                
        except Exception as e:
            logger.error(f"Book filtering failed: {e}")
            raise
    
    async def recommend_videos(self, user_profile: Dict[str, Any], context: str = "") -> Dict[str, Any]:
        """Recommend videos using LangChain"""
        try:
            result = await self.chains["videos"].ainvoke({
                "context": context,
                "query": user_profile.get("query", ""),
                "duration_preference": user_profile.get("duration_preference")
            })
            
            # Extract text from LangChain result
            response_text = result.get("text", "") if isinstance(result, dict) else str(result)
            
            # Parse JSON response
            try:
                videos = json.loads(response_text)
                return videos
            except json.JSONDecodeError:
                return {"beginner": [], "intermediate": [], "advanced": [], "estimated_total_time": "0h"}
                
        except Exception as e:
            logger.error(f"Video recommendation failed: {e}")
            raise
    
    async def search_pdfs(self, query: str, context: str = "", filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Search and summarize PDF content using LangChain"""
        try:
            filters = filters or {}
            
            result = await self.chains["pdfs"].ainvoke({
                "context": context,
                "query": query,
                "subject": filters.get("subject", ""),
                "difficulty": filters.get("difficulty", "")
            })
            
            # Extract text from LangChain result
            response_text = result.get("text", "") if isinstance(result, dict) else str(result)
            
            # Parse JSON response
            try:
                pdf_results = json.loads(response_text)
                return pdf_results
            except json.JSONDecodeError:
                return {
                    "summary": response_text,
                    "key_concepts": [],
                    "recommended_pdfs": [],
                    "related_topics": []
                }
                
        except Exception as e:
            logger.error(f"PDF search failed: {e}")
            raise
    
    async def generate_response(self, prompt: str, max_tokens: int = 512) -> str:
        """Generate a simple text response"""
        try:
            if self.llm is None:
                raise ValueError("LLM not initialized")
                
            if hasattr(self.llm, 'ainvoke'):
                result = await self.llm.ainvoke(prompt)
                # Handle different response types
                if hasattr(result, 'content'):
                    return str(result.content)
                elif isinstance(result, str):
                    return result
                else:
                    return str(result)
            elif hasattr(self.llm, 'agenerate'):
                # Fallback for LLMs without ainvoke
                result = await self.llm.agenerate([prompt])
                return result.generations[0][0].text.strip()
            else:
                # For custom implementations like ReplicateLLaMA
                if hasattr(self.llm, 'ainvoke'):
                    result = await self.llm.ainvoke(prompt)
                    return str(result)
                else:
                    raise ValueError("LLM does not support async operations")
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            raise


class ReplicateLLaMA:
    """Custom LangChain wrapper for Replicate LLaMA models"""
    
    def __init__(self, model: str = "meta/llama-2-7b-chat"):
        if not REPLICATE_AVAILABLE:
            raise ImportError("Replicate not available. Install with: pip install replicate")
        
        self.model = model
    
    async def agenerate(self, prompts: List[str], **kwargs) -> LLMResult:
        """Generate responses for multiple prompts"""
        from langchain_core.outputs import LLMResult, Generation
        
        results = []
        for prompt in prompts:
            output = replicate.run(
                self.model,
                input={
                    "prompt": prompt,
                    "max_new_tokens": kwargs.get("max_tokens", 512),
                    "temperature": kwargs.get("temperature", 0.7)
                }
            )
            text = "".join(output)
            results.append([Generation(text=text)])
        
        return LLMResult(generations=results)
    
    async def ainvoke(self, prompt: str, **kwargs) -> str:
        """Run a single prompt"""
        result = await self.agenerate([prompt], **kwargs)
        return result.generations[0][0].text
