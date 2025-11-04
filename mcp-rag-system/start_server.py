#!/usr/bin/env python3
"""
Startup script for MCP RAG System
Runs the FastAPI server with proper initialization
"""

import uvicorn
import logging
import sys
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Start the MCP RAG System server"""
    
    logger.info("Starting MCP RAG System Server...")
    logger.info("Features:")
    logger.info("  ✓ Vector-based document search")
    logger.info("  ✓ Multi-namespace collections")
    logger.info("  ✓ AI-powered roadmap generation")
    logger.info("  ✓ MCP (Model Context Protocol) integration")
    logger.info("  ✓ RAG (Retrieval-Augmented Generation)")
    
    try:
        # Import the FastAPI app
        from core_rag import app
        
        # Start the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False  # Set to True for development
        )
        
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        logger.error("Make sure all dependencies are installed:")
        logger.error("  pip install fastapi uvicorn chromadb sentence-transformers transformers torch")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
