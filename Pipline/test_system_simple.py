#!/usr/bin/env python3
"""
Complete System Test Suite - Simplified
=======================================

Tests all components of the Multi-Agent RAG system.
"""

import asyncio
import json
import time
import logging
from typing import Dict, Any
from pathlib import Path
import sys

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SystemTester:
    """Comprehensive system testing class"""
    
    def __init__(self):
        self.results = {}
        self.start_time = time.time()
        
    async def test_mongodb(self):
        """Test MongoDB connection and data"""
        logger.info("🗄️ Testing MongoDB...")
        
        try:
            from config.database import db_manager
            db = db_manager.get_database()
            
            if db is None:
                logger.error("❌ Database connection failed")
                return False
            
            # Test collections
            collections = ['pes_materials', 'reference_books', 'videos', 'chunks']
            results = {}
            
            for collection_name in collections:
                try:
                    collection = db[collection_name]
                    count = collection.count_documents({})
                    results[collection_name] = count
                    logger.info(f"  ✅ {collection_name}: {count} documents")
                except Exception as e:
                    results[collection_name] = f"Error: {e}"
                    logger.warning(f"  ⚠️ {collection_name}: {e}")
            
            # Test GridFS
            try:
                gridfs_count = db.fs.files.count_documents({})
                results['gridfs'] = gridfs_count
                logger.info(f"  ✅ GridFS: {gridfs_count} files")
            except Exception as e:
                results['gridfs'] = f"Error: {e}"
                logger.warning(f"  ⚠️ GridFS: {e}")
            
            self.results['mongodb'] = results
            return True
            
        except Exception as e:
            logger.error(f"❌ MongoDB Error: {e}")
            self.results['mongodb'] = {'error': str(e)}
            return False
    
    async def test_chromadb(self):
        """Test ChromaDB connection"""
        logger.info("🔍 Testing ChromaDB...")
        
        try:
            from core.vector_db import vector_db
            
            # Try to access collections
            try:
                # Test search functionality
                results = vector_db.search_documents("educational_content", "test query", 1)
                
                if results and 'documents' in results:
                    logger.info("  ✅ ChromaDB search successful")
                    self.results['chromadb'] = {'status': 'working', 'search_test': 'passed'}
                    return True
                else:
                    logger.info("  ✅ ChromaDB connected but no data")
                    self.results['chromadb'] = {'status': 'connected', 'search_test': 'no_data'}
                    return True
                    
            except Exception as e:
                logger.warning(f"  ⚠️ ChromaDB search failed: {e}")
                self.results['chromadb'] = {'status': 'connected', 'error': str(e)}
                return False
                
        except Exception as e:
            logger.error(f"❌ ChromaDB Error: {e}")
            self.results['chromadb'] = {'error': str(e)}
            return False
    
    async def test_ollama(self):
        """Test Ollama LLM"""
        logger.info("🧠 Testing Ollama LLM...")
        
        try:
            from core.ollama_service import ollama_service
            
            # Test connection
            is_connected = await ollama_service.check_connection()
            
            if not is_connected:
                logger.error("❌ Ollama not connected")
                self.results['ollama'] = {'status': 'disconnected'}
                return False
            
            logger.info("  ✅ Ollama connected")
            
            # Test models
            models = await ollama_service.list_models()
            logger.info(f"  ✅ Available models: {models}")
            
            # Test generation
            response = await ollama_service.generate_response(
                "What is 2+2? Answer in one word.",
                temperature=0.1
            )
            
            if response and len(response) > 0:
                logger.info(f"  ✅ Generation test: '{response.strip()}'")
                self.results['ollama'] = {
                    'status': 'working',
                    'models': models,
                    'test_response': response.strip()
                }
                return True
            else:
                logger.error("❌ Generation failed")
                self.results['ollama'] = {'status': 'connected', 'generation': 'failed'}
                return False
                
        except Exception as e:
            logger.error(f"❌ Ollama Error: {e}")
            self.results['ollama'] = {'error': str(e)}
            return False
    
    async def test_data_integrity(self):
        """Test data integrity and samples"""
        logger.info("📚 Testing Data Integrity...")
        
        try:
            from config.database import db_manager
            db = db_manager.get_database()
            
            if db is None:
                logger.warning("  ⚠️ Database not available")
                return False
            
            # Sample PES material
            try:
                pes_sample = db['pes_materials'].find_one({'gridfs_id': {'$exists': True}})
                if pes_sample:
                    title = pes_sample.get('title', 'Unknown')
                    subject = pes_sample.get('subject', 'Unknown')
                    logger.info(f"  ✅ PES Sample: {title[:50]}... ({subject})")
                else:
                    logger.warning("  ⚠️ No PES materials with files found")
            except Exception as e:
                logger.warning(f"  ⚠️ PES materials error: {e}")
            
            # Sample reference book
            try:
                book_sample = db['reference_books'].find_one({'gridfs_id': {'$exists': True}})
                if book_sample:
                    title = book_sample.get('title', 'Unknown')
                    author = book_sample.get('author', 'Unknown')
                    logger.info(f"  ✅ Book Sample: {title[:50]}... by {author}")
                else:
                    logger.warning("  ⚠️ No reference books with files found")
            except Exception as e:
                logger.warning(f"  ⚠️ Reference books error: {e}")
            
            # Sample chunks
            try:
                chunk_count = db['chunks'].count_documents({})
                if chunk_count > 0:
                    chunk_sample = db['chunks'].find_one()
                    content = chunk_sample.get('content', '')[:100] if chunk_sample else ''
                    logger.info(f"  ✅ Chunks: {chunk_count} total, sample: {content}...")
                else:
                    logger.warning("  ⚠️ No text chunks found")
            except Exception as e:
                logger.warning(f"  ⚠️ Chunks error: {e}")
            
            self.results['data_integrity'] = 'tested'
            return True
            
        except Exception as e:
            logger.error(f"❌ Data Integrity Error: {e}")
            self.results['data_integrity'] = {'error': str(e)}
            return False
    
    async def test_rag_flow(self):
        """Test RAG pipeline"""
        logger.info("🔗 Testing RAG Pipeline...")
        
        try:
            from core.ollama_service import ollama_service
            from core.vector_db import vector_db
            
            query = "What is machine learning?"
            
            # Step 1: Search for context
            search_results = vector_db.search_documents("educational_content", query, 3)
            
            if search_results and search_results.get('documents'):
                docs = search_results['documents'][0] if search_results['documents'] else []
                logger.info(f"  ✅ Found {len(docs)} context documents")
                
                if docs:
                    # Step 2: Generate with context
                    context_text = "\n\n".join(docs[:2])  # Use first 2 docs
                    
                    rag_response = await ollama_service.generate_with_context(
                        query=query,
                        context_chunks=docs[:2],
                        system_prompt="Answer based on the provided context. Be concise.",
                        max_context_length=500
                    )
                    
                    if rag_response and len(rag_response) > 20:
                        logger.info(f"  ✅ RAG response: {rag_response[:100]}...")
                        self.results['rag_pipeline'] = {
                            'status': 'working',
                            'context_found': len(docs),
                            'response_length': len(rag_response)
                        }
                        return True
                    else:
                        logger.warning("  ⚠️ RAG response too short or empty")
                        return False
                else:
                    logger.warning("  ⚠️ No documents found for RAG")
                    return False
            else:
                logger.warning("  ⚠️ Search failed for RAG")
                return False
                
        except Exception as e:
            logger.error(f"❌ RAG Pipeline Error: {e}")
            self.results['rag_pipeline'] = {'error': str(e)}
            return False
    
    async def test_agents(self):
        """Test agent components"""
        logger.info("🤖 Testing Agent Components...")
        
        try:
            # Test system prompts
            from agents.system_prompts import SystemPrompts
            
            prompts = SystemPrompts()
            
            # Check if prompts exist
            prompt_tests = {
                'query_router': bool(hasattr(prompts, 'QUERY_ROUTER') and prompts.QUERY_ROUTER),
                'pdf_search': bool(hasattr(prompts, 'PDF_SEARCH_AGENT') and prompts.PDF_SEARCH_AGENT),
                'book_search': bool(hasattr(prompts, 'BOOK_SEARCH_AGENT') and prompts.BOOK_SEARCH_AGENT)
            }
            
            for name, exists in prompt_tests.items():
                if exists:
                    logger.info(f"  ✅ {name} prompt loaded")
                else:
                    logger.warning(f"  ⚠️ {name} prompt missing")
            
            self.results['agents'] = prompt_tests
            return all(prompt_tests.values())
            
        except Exception as e:
            logger.error(f"❌ Agent Components Error: {e}")
            self.results['agents'] = {'error': str(e)}
            return False
    
    def generate_report(self):
        """Generate test report"""
        end_time = time.time()
        duration = end_time - self.start_time
        
        # Count successes
        total_tests = len(self.results)
        successful_tests = sum(1 for result in self.results.values() 
                             if not (isinstance(result, dict) and 'error' in result))
        
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'duration_seconds': round(duration, 2),
            'total_tests': total_tests,
            'successful_tests': successful_tests,
            'success_rate': round(success_rate, 1),
            'results': self.results
        }
        
        return report
    
    async def run_all_tests(self):
        """Run all tests"""
        logger.info("🚀 Starting Complete System Test")
        logger.info("=" * 50)
        
        tests = [
            ("MongoDB", self.test_mongodb),
            ("ChromaDB", self.test_chromadb),
            ("Ollama LLM", self.test_ollama),
            ("Data Integrity", self.test_data_integrity),
            ("RAG Pipeline", self.test_rag_flow),
            ("Agent Components", self.test_agents)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                if result:
                    passed += 1
                    logger.info(f"✅ {test_name}: PASSED")
                else:
                    logger.warning(f"⚠️ {test_name}: FAILED")
            except Exception as e:
                logger.error(f"❌ {test_name}: ERROR - {e}")
        
        # Generate final report
        report = self.generate_report()
        
        # Save report
        report_file = f"system_test_report_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info("=" * 50)
        logger.info(f"📊 TEST SUMMARY")
        logger.info(f"Passed: {passed}/{total}")
        logger.info(f"Success Rate: {report['success_rate']}%")
        logger.info(f"Duration: {report['duration_seconds']}s")
        logger.info(f"Report: {report_file}")
        
        if passed >= total * 0.8:  # 80% success threshold
            logger.info("🎉 System is healthy!")
            return True
        else:
            logger.warning("⚠️ System has issues that need attention")
            return False

async def main():
    """Run the complete test suite"""
    tester = SystemTester()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
