"""
Ollama LLM Service
==================

This module provides integration with Ollama for local LLM inference.
Supports multiple models and provides unified interface for agent communication.
"""

import httpx
import json
import logging
from typing import Dict, List, Optional, AsyncGenerator, Any
from config.settings import Settings

logger = logging.getLogger(__name__)

class OllamaService:
    """Service for interacting with Ollama local LLM"""
    
    def __init__(self):
        self.base_url = Settings.OLLAMA_BASE_URL
        self.model = Settings.OLLAMA_MODEL
        self.temperature = Settings.OLLAMA_TEMPERATURE
        self.max_tokens = Settings.OLLAMA_MAX_TOKENS
        
    async def check_connection(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return False
    
    async def list_models(self) -> List[str]:
        """List available models in Ollama"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return [model["name"] for model in data.get("models", [])]
                return []
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    async def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """Generate response from Ollama model"""
        try:
            payload = {
                "model": model or self.model,
                "prompt": prompt,
                "stream": stream,
                "options": {
                    "temperature": temperature or self.temperature,
                    "num_predict": max_tokens or self.max_tokens
                }
            }
            
            if system_prompt:
                payload["system"] = system_prompt
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    if stream:
                        return await self._handle_stream_response(response)
                    else:
                        data = response.json()
                        return data.get("response", "").strip()
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    return "Error: Failed to generate response"
                    
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error: {str(e)}"
    
    async def _handle_stream_response(self, response) -> str:
        """Handle streaming response from Ollama"""
        full_response = ""
        async for line in response.aiter_lines():
            if line:
                try:
                    data = json.loads(line)
                    if "response" in data:
                        full_response += data["response"]
                    if data.get("done", False):
                        break
                except json.JSONDecodeError:
                    continue
        return full_response.strip()
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None
    ) -> str:
        """Chat completion using conversation format"""
        try:
            payload = {
                "model": model or self.model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature or self.temperature
                }
            }
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("message", {}).get("content", "").strip()
                else:
                    logger.error(f"Chat API error: {response.status_code} - {response.text}")
                    return "Error: Failed to generate chat response"
                    
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            return f"Error: {str(e)}"
    
    async def generate_with_context(
        self,
        query: str,
        context_chunks: List[str],
        system_prompt: str,
        max_context_length: int = 3000
    ) -> str:
        """Generate response with RAG context"""
        # Combine context chunks
        context = "\n\n".join(context_chunks[:max_context_length])
        
        # Create full prompt
        full_prompt = f"""Context:
{context}

Query: {query}

Please provide a comprehensive answer based on the context provided above."""
        
        return await self.generate_response(
            prompt=full_prompt,
            system_prompt=system_prompt
        )
    
    async def generate_structured_output(
        self,
        prompt: str,
        system_prompt: str,
        output_format: Dict[str, Any],
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate structured output (JSON) from LLM"""
        format_instruction = f"""
Please respond in the following JSON format:
{json.dumps(output_format, indent=2)}

Ensure your response is valid JSON that matches this structure exactly.
"""
        
        full_system_prompt = f"{system_prompt}\n\n{format_instruction}"
        
        response = await self.generate_response(
            prompt=prompt,
            system_prompt=full_system_prompt,
            model=model,
            temperature=0.3  # Lower temperature for structured output
        )
        
        # Try to parse JSON response
        try:
            # Extract JSON from response if it's wrapped in markdown or other text
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                response = response[json_start:json_end].strip()
            elif "```" in response:
                json_start = response.find("```") + 3
                json_end = response.find("```", json_start)
                response = response[json_start:json_end].strip()
            
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response was: {response}")
            return {"error": f"Invalid JSON response: {str(e)}"}

# Global Ollama service instance
ollama_service = OllamaService()
