# Gemini + Perplexity RAG Implementation

import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

# Gemini integration
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Perplexity integration  
import httpx
import json

# Local embeddings
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class GeminiPerplexityRAG:
    """RAG system using Gemini for generation and Perplexity for enhanced search"""
    
    def __init__(self, gemini_api_key: str, perplexity_api_key: str):
        self.gemini_api_key = gemini_api_key
        self.perplexity_api_key = perplexity_api_key
        
        # Initialize Gemini
        self.gemini_llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.3
        )
        
        # Initialize local embeddings for ChromaDB
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Perplexity client
        self.perplexity_client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {perplexity_api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
        
        logger.info("Gemini + Perplexity RAG system initialized")
    
    async def enhanced_search(self, query: str, local_context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Enhanced search using both local ChromaDB and Perplexity"""
        try:
            # Get external context from Perplexity
            perplexity_context = await self._perplexity_search(query)
            
            # Combine local and external context
            combined_context = {
                "local_results": local_context or [],
                "perplexity_results": perplexity_context,
                "query": query,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return combined_context
            
        except Exception as e:
            logger.error(f"Enhanced search failed: {e}")
            return {
                "local_results": local_context or [],
                "perplexity_results": [],
                "error": str(e),
                "query": query
            }
    
    async def _perplexity_search(self, query: str) -> List[Dict]:
        """Search using Perplexity API"""
        try:
            payload = {
                "model": "llama-3.1-sonar-small-128k-online",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that provides accurate, up-to-date information for educational purposes. Focus on academic content, learning resources, and educational materials."
                    },
                    {
                        "role": "user", 
                        "content": f"Find current, relevant educational resources and information about: {query}. Include recent developments, best practices, and authoritative sources."
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.2,
                "stream": False
            }
            
            response = await self.perplexity_client.post(
                "https://api.perplexity.ai/chat/completions",
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                return [{
                    "content": content,
                    "source": "perplexity",
                    "timestamp": datetime.utcnow().isoformat(),
                    "model": "llama-3.1-sonar-small-128k-online"
                }]
            else:
                logger.error(f"Perplexity API error: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Perplexity search failed: {e}")
            return []
    
    async def generate_response(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate response using Gemini with combined context"""
        try:
            # Prepare context for Gemini
            local_context = context.get("local_results", [])
            perplexity_context = context.get("perplexity_results", [])
            
            # Create context string
            context_text = self._format_context(local_context, perplexity_context)
            
            # Create prompt
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an intelligent educational assistant that helps students learn effectively. 
                You have access to both local knowledge base content and current information from the web.
                
                Guidelines:
                - Provide accurate, helpful responses based on the context provided
                - Combine local knowledge with current information when relevant  
                - Focus on educational value and learning outcomes
                - Cite sources when possible
                - If context is insufficient, clearly state limitations
                """),
                ("user", """Query: {query}

Context from local knowledge base:
{local_context}

Current information from web:
{web_context}

Please provide a comprehensive, educational response that combines relevant information from both sources.""")
            ])
            
            # Format local context
            local_text = "\n".join([
                f"- {doc.get('content', '')[:200]}..." 
                for doc in local_context[:5]
            ]) if local_context else "No local context available"
            
            # Format web context  
            web_text = "\n".join([
                f"- {doc.get('content', '')[:300]}..."
                for doc in perplexity_context
            ]) if perplexity_context else "No web context available"
            
            # Generate response
            chain = prompt | self.gemini_llm | StrOutputParser()
            
            response = await chain.ainvoke({
                "query": query,
                "local_context": local_text,
                "web_context": web_text
            })
            
            return {
                "response": response,
                "query": query,
                "sources": {
                    "local_sources": len(local_context),
                    "web_sources": len(perplexity_context)
                },
                "timestamp": datetime.utcnow().isoformat(),
                "model": "gemini-1.5-flash"
            }
            
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return {
                "response": f"I apologize, but I encountered an error while generating a response: {str(e)}",
                "error": str(e),
                "query": query
            }
    
    def _format_context(self, local_context: List[Dict], web_context: List[Dict]) -> str:
        """Format context for prompt"""
        context_parts = []
        
        if local_context:
            context_parts.append("Local Knowledge Base:")
            for i, doc in enumerate(local_context[:3], 1):
                content = doc.get('content', '')[:200]
                context_parts.append(f"{i}. {content}...")
        
        if web_context:
            context_parts.append("\nCurrent Web Information:")
            for i, doc in enumerate(web_context, 1):
                content = doc.get('content', '')[:300]
                context_parts.append(f"{i}. {content}...")
        
        return "\n".join(context_parts)
    
    async def generate_roadmap(self, user_profile: Dict[str, Any], context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Generate learning roadmap using Gemini"""
        try:
            # Get enhanced context for roadmap generation
            query = f"learning roadmap for {user_profile.get('domain', 'general')} at {user_profile.get('skill_level', 'intermediate')} level"
            enhanced_context = await self.enhanced_search(query, context)
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", """You are an expert educational consultant who creates personalized learning roadmaps.
                Create structured, practical learning paths based on user profiles and available resources."""),
                ("user", """Create a detailed learning roadmap for:
                
User Profile: {user_profile}
Available Resources: {context}
Daily Time Available: {daily_time} minutes

Please structure the roadmap with:
1. Clear phases (beginner → intermediate → advanced)
2. Specific learning objectives for each phase
3. Recommended resources from the context
4. Time estimates and milestones
5. Assessment checkpoints

Format as a structured JSON-like response.""")
            ])
            
            chain = prompt | self.gemini_llm | StrOutputParser()
            
            roadmap = await chain.ainvoke({
                "user_profile": json.dumps(user_profile, indent=2),
                "context": self._format_context(
                    enhanced_context.get("local_results", []),
                    enhanced_context.get("perplexity_results", [])
                ),
                "daily_time": user_profile.get('daily_time', 60)
            })
            
            return {
                "roadmap": roadmap,
                "user_id": user_profile.get('user_id'),
                "generated_at": datetime.utcnow().isoformat(),
                "model": "gemini-1.5-flash"
            }
            
        except Exception as e:
            logger.error(f"Roadmap generation failed: {e}")
            return {"error": str(e)}
    
    async def recommend_resources(self, query: str, resource_type: str, context: Optional[List[Dict]] = None) -> List[Dict]:
        """Recommend educational resources using Gemini + Perplexity"""
        try:
            # Enhanced search for recommendations
            search_query = f"{resource_type} recommendations for {query}"
            enhanced_context = await self.enhanced_search(search_query, context)
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", f"""You are an expert educational resource curator specializing in {resource_type}.
                Analyze available resources and provide personalized recommendations."""),
                ("user", """Based on the query "{query}" and available resources, recommend the best {resource_type}.

Available Resources:
{context}

Provide recommendations in this format:
- Title: [Resource Title]
- Level: [beginner/intermediate/advanced] 
- Description: [Brief description]
- Why recommended: [Specific reasons]
- Estimated time: [Time to complete]

Focus on quality, relevance, and learning progression.""")
            ])
            
            chain = prompt | self.gemini_llm | StrOutputParser()
            
            recommendations = await chain.ainvoke({
                "query": query,
                "resource_type": resource_type,
                "context": self._format_context(
                    enhanced_context.get("local_results", []),
                    enhanced_context.get("perplexity_results", [])
                )
            })
            
            return [{
                "recommendations": recommendations,
                "query": query,
                "resource_type": resource_type,
                "timestamp": datetime.utcnow().isoformat()
            }]
            
        except Exception as e:
            logger.error(f"Resource recommendation failed: {e}")
            return []
    
    async def close(self):
        """Clean up resources"""
        await self.perplexity_client.aclose()
        logger.info("Gemini + Perplexity RAG system closed")
