#!/usr/bin/env python3
"""
Quick Setup Script for Multi-Agent RAG Pipeline
===============================================

This script helps set up the RAG pipeline system quickly.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        return False
    logger.info(f"Python version: {sys.version}")
    return True

def install_dependencies():
    """Install required Python packages"""
    logger.info("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False

def create_env_file():
    """Create .env file with default values"""
    env_path = Path(".env")
    
    if env_path.exists():
        logger.info("✓ .env file already exists")
        return True
    
    logger.info("Creating .env file with default configuration...")
    
    env_content = """# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=multi_agent_rag_system

# ChromaDB Configuration  
CHROMA_PERSIST_DIR=./chromadb
CHROMA_COLLECTION_PREFIX=rag_system

# Embedding Model Configuration
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG_MODE=true

# LLM Configuration (optional - configure for your local model)
LLM_MODEL_PATH=
LLM_CONTEXT_LENGTH=4096
LLM_TEMPERATURE=0.7

# Google API (optional - for enhanced metadata generation)
GOOGLE_API_KEY=
GEMINI_MODEL=models/gemini-1.5-pro
"""
    
    try:
        with open(env_path, "w") as f:
            f.write(env_content)
        logger.info("✓ .env file created")
        return True
    except Exception as e:
        logger.error(f"Failed to create .env file: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    directories = [
        "chromadb",
        "logs",
        "Data/temp"
    ]
    
    for dir_path in directories:
        try:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
            logger.info(f"✓ Created directory: {dir_path}")
        except Exception as e:
            logger.error(f"Failed to create directory {dir_path}: {e}")
            return False
    
    return True

def check_mongodb():
    """Check if MongoDB is accessible"""
    try:
        import pymongo
        
        # Use default MongoDB URI for setup
        mongodb_uri = "mongodb://localhost:27017/"
        
        client = pymongo.MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        logger.info("✓ MongoDB connection successful")
        return True
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}")
        logger.warning("Please ensure MongoDB is running on the configured port")
        return False

def test_basic_functionality():
    """Test basic system functionality"""
    logger.info("Testing basic functionality...")
    
    try:
        # Test source processor
        from ingestion.source_processor import SourceDataProcessor
        processor = SourceDataProcessor()
        books = processor.load_source_data()
        
        if books:
            logger.info(f"✓ Successfully loaded {len(books)} books")
        else:
            logger.warning("No books loaded - check data files")
            
    except Exception as e:
        logger.error(f"Basic functionality test failed: {e}")
        return False
    
    return True

def print_next_steps():
    """Print instructions for next steps"""
    print("\n" + "="*60)
    print("🎉 SETUP COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\nNext steps:")
    print("1. Ensure MongoDB is running:")
    print("   mongod --dbpath /path/to/data")
    print("\n2. Test the ingestion pipeline:")
    print("   python test_ingestion.py")
    print("\n3. Start the API server:")
    print("   python api/main.py")
    print("\n4. Access the API at:")
    print("   http://localhost:8000")
    print("\n5. View API documentation at:")
    print("   http://localhost:8000/docs")
    print("\nFor more information, see README.md")
    print("="*60)

def main():
    """Main setup function"""
    logger.info("Starting Multi-Agent RAG Pipeline Setup...")
    logger.info("="*50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        logger.error("Directory creation failed")
        sys.exit(1)
    
    # Create .env file
    if not create_env_file():
        logger.error("Environment file creation failed")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        logger.error("Dependency installation failed")
        sys.exit(1)
    
    # Check MongoDB (optional)
    mongodb_ok = check_mongodb()
    
    # Test basic functionality
    if not test_basic_functionality():
        logger.error("Basic functionality test failed")
        if not mongodb_ok:
            logger.info("This might be due to MongoDB not being available")
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    main()
