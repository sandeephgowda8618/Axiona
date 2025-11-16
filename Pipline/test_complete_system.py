#!/usr/bin/env python3
"""
Complete System Test Suite
==========================

Tests all components of the Multi-Agent RAG system:
1. Database connections (MongoDB, ChromaDB)
2. LLM integration (Ollama)
3. Data ingestion and retrieval
4. Agent functionality 
5. API endpoints
6. End-to-end workflows
"""

import asyncio
import json
import time
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import sys
import traceback

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SystemTester:
    """Comprehensive system testing class"""
    
    def __init__(self):
        self.results = {
            'database': {},
            'llm': {},
            'ingestion': {},
            'agents': {},
            'api': {},
            'integration': {}
        }
        self.start_time = time.time()
        
    async def test_database_connections(self):
        """Test MongoDB and ChromaDB connections"""
        logger.info("🗄️ Testing Database Connections...")
        
        try:
            # Test MongoDB
            from config.database import db_manager
            db = db_manager.get_database()
            
            if db is None:
                logger.error("❌ MongoDB database is None")
                self.results['database']['error'] = "Database connection failed"
                return
            
            # Test collections
            collections = ['pes_materials', 'reference_books', 'videos', 'chunks']
            for collection_name in collections:
                try:
                    collection = db[collection_name]
                    count = collection.count_documents({})
                    self.results['database'][collection_name] = {
                        'status': 'connected',
                        'document_count': count
                    }
                    logger.info(f"  ✅ {collection_name}: {count} documents")
                except Exception as e:
                    self.results['database'][collection_name] = {'error': str(e)}
                    logger.warning(f"  ⚠️ {collection_name}: {e}")
            
            # Test GridFS
            try:
                gridfs_count = db.fs.files.count_documents({})
                self.results['database']['gridfs'] = {
                    'status': 'connected',
                    'file_count': gridfs_count
                }
                logger.info(f"  ✅ GridFS: {gridfs_count} files")
            except Exception as e:
                self.results['database']['gridfs'] = {'error': str(e)}
                logger.warning(f"  ⚠️ GridFS: {e}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB Error: {e}")
            self.results['database']['mongodb_error'] = str(e)
        
        try:
            # Test ChromaDB
            from core.vector_db import vector_db
            
            try:
                collections = vector_db.client.list_collections()
                
                for collection in collections:
                    try:
                        coll = vector_db.client.get_collection(collection.name)
                        count = coll.count()
                        self.results['database'][f'chroma_{collection.name}'] = {
                            'status': 'connected',
                            'vector_count': count
                        }
                        logger.info(f"  ✅ ChromaDB {collection.name}: {count} vectors")
                    except Exception as e:
                        logger.warning(f"  ⚠️ ChromaDB {collection.name}: {e}")
                        
            except Exception as e:
                logger.warning(f"  ⚠️ ChromaDB collections error: {e}")
                # Try to access a specific collection
                try:
                    coll = vector_db.client.get_collection("educational_content")
                    count = coll.count()
                    self.results['database']['chroma_educational_content'] = {
                        'status': 'connected',
                        'vector_count': count
                    }
                    logger.info(f"  ✅ ChromaDB educational_content: {count} vectors")
                except Exception as e2:
                    self.results['database']['chroma_error'] = str(e2)
                    logger.warning(f"  ⚠️ ChromaDB educational_content: {e2}")
                    
        except Exception as e:
            logger.error(f"❌ ChromaDB Error: {e}")
            self.results['database']['chromadb_error'] = str(e)
    
    async def test_llm_integration(self):
        """Test Ollama LLM integration"""
        logger.info("🧠 Testing LLM Integration...")
        
        try:
            from core.ollama_service import ollama_service
            
            # Test connection
            is_connected = await ollama_service.check_connection()
            self.results['llm']['connection'] = is_connected
            
            if is_connected:
                logger.info("  ✅ Ollama connection successful")
                
                # Test model listing
                models = await ollama_service.list_models()
                self.results['llm']['available_models'] = models
                logger.info(f"  ✅ Available models: {models}")
                
                # Test simple generation
                test_prompt = "What is machine learning? Respond in exactly 2 sentences."
                response = await ollama_service.generate_response(test_prompt)
                
                self.results['llm']['test_generation'] = {
                    'prompt': test_prompt,
                    'response': response[:200] + "..." if len(response) > 200 else response,
                    'success': len(response) > 10 and "error" not in response.lower()
                }
                
                if len(response) > 10:
                    logger.info(f"  ✅ LLM generation successful: {response[:100]}...")
                else:
                    logger.error(f"  ❌ LLM generation failed: {response}")
            else:
                logger.error("  ❌ Ollama connection failed")
                
        except Exception as e:
            logger.error(f"❌ LLM Error: {e}")
            self.results['llm']['error'] = str(e)
    
    async def test_data_retrieval(self):
        """Test data retrieval and RAG functionality"""
        logger.info("📚 Testing Data Retrieval...")
        
        try:
            from config.database import db_manager
            db = db_manager.get_database()
            
            if db is None:
                logger.warning("  ⚠️ Database connection not available")
                self.results['ingestion']['error'] = "Database not connected"
                return
            
            # Test PES materials retrieval
            try:
                pes_collection = db['pes_materials']
                sample_material = pes_collection.find_one({'gridfs_id': {'$exists': True}})
                
                if sample_material:
                    self.results['ingestion']['pes_sample'] = {
                        'title': sample_material.get('title', 'Unknown'),
                        'has_gridfs': bool(sample_material.get('gridfs_id')),
                        'subject': sample_material.get('subject', 'Unknown')
                    }
                    logger.info(f"  ✅ PES Material sample: {sample_material['title'][:50]}...")
                else:
                    logger.warning("  ⚠️ No PES materials with GridFS found")
            except Exception as e:
                logger.warning(f"  ⚠️ PES materials error: {e}")
            
            # Test reference books retrieval
            try:
                books_collection = db['reference_books']
                sample_book = books_collection.find_one({'gridfs_id': {'$exists': True}})
                
                if sample_book:
                    self.results['ingestion']['book_sample'] = {
                        'title': sample_book.get('title', 'Unknown'),
                        'author': sample_book.get('author', 'Unknown'),
                        'has_gridfs': bool(sample_book.get('gridfs_id'))
                    }
                    logger.info(f"  ✅ Reference Book sample: {sample_book['title'][:50]}...")
                else:
                    logger.warning("  ⚠️ No reference books with GridFS found")
            except Exception as e:
                logger.warning(f"  ⚠️ Reference books error: {e}")
            
            # Test chunks retrieval
            try:
                chunks_collection = db['chunks']
                chunk_count = chunks_collection.count_documents({})
                sample_chunk = chunks_collection.find_one()
                
                if sample_chunk:
                    self.results['ingestion']['chunks'] = {
                        'total_count': chunk_count,
                        'sample_content': sample_chunk.get('content', '')[:100] + "...",
                        'has_metadata': bool(sample_chunk.get('metadata'))
                    }
                    logger.info(f"  ✅ Text chunks: {chunk_count} total")
                else:
                    logger.warning("  ⚠️ No text chunks found")
            except Exception as e:
                logger.warning(f"  ⚠️ Text chunks error: {e}")
            
        except Exception as e:
            logger.error(f"❌ Data Retrieval Error: {e}")
            self.results['ingestion']['error'] = str(e)
    
    async def test_search_functionality(self):
        """Test semantic search functionality"""
        logger.info("🔍 Testing Search Functionality...")
        
        try:
            # Test vector similarity search
            from core.vector_db import vector_db
            
            test_queries = [
                "machine learning algorithms",
                "linear algebra matrices",
                "data structures arrays",
                "chemistry thermodynamics"
            ]
            
            search_results = {}
            
            for query in test_queries:
                try:
                    # Try to get educational_content collection
                    results = vector_db.search_documents("educational_content", query, 5)
                    
                    search_results[query] = {
                        'found_results': len(results.get('documents', [[]])[0]) if results.get('documents') else 0,
                        'sample_result': results.get('documents', [[]])[0][0][:100] + "..." if results.get('documents', [[]])[0] else "No results"
                    }
                    result_count = len(results.get('documents', [[]])[0]) if results.get('documents') else 0
                    logger.info(f"  ✅ Search '{query}': {result_count} results")
                    
                except Exception as e:
                    search_results[query] = {'error': str(e)}
                    logger.warning(f"  ⚠️ Search '{query}' failed: {e}")
            
            self.results['api']['search_tests'] = search_results
            
        except Exception as e:
            logger.error(f"❌ Search Error: {e}")
            self.results['api']['search_error'] = str(e)
    
    async def test_agent_functionality(self):
        """Test individual agent functionality"""
        logger.info("🤖 Testing Agent Functionality...")
        
        try:
            # Test system prompts
            from agents.system_prompts import SystemPrompts
            
            prompts = SystemPrompts()
            self.results['agents']['prompts_loaded'] = {
                'query_router': bool(prompts.QUERY_ROUTER),
                'pdf_search': bool(prompts.PDF_SEARCH_AGENT),
                'book_search': bool(prompts.BOOK_SEARCH_AGENT)
            }
            logger.info("  ✅ System prompts loaded")
            
            # Test query routing with LLM
            from core.ollama_service import ollama_service
            
            test_queries = [
                "Find materials on linear algebra",
                "I need a good book on machine learning",
                "Create a learning plan for data structures"
            ]
            
            routing_results = {}
            
            for query in test_queries:
                try:
                    response = await ollama_service.generate_response(
                        prompt=f"Query: {query}",
                        system_prompt=prompts.QUERY_ROUTER,
                        temperature=0.1
                    )
                    
                    routing_results[query] = {
                        'response': response.strip(),
                        'success': any(route in response.lower() for route in ['pdf_search', 'book_search', 'video_search', 'roadmap'])
                    }
                    logger.info(f"  ✅ Query routing '{query[:30]}...': {response.strip()}")
                    
                except Exception as e:
                    routing_results[query] = {'error': str(e)}
                    logger.warning(f"  ⚠️ Query routing failed: {e}")
            
            self.results['agents']['routing_tests'] = routing_results
            
        except Exception as e:
            logger.error(f"❌ Agent Error: {e}")
            self.results['agents']['error'] = str(e)
    
    async def test_rag_pipeline(self):
        """Test end-to-end RAG pipeline"""
        logger.info("🔗 Testing RAG Pipeline...")
        
        try:
            from core.ollama_service import ollama_service
            from core.vector_db import vector_db_manager
            
            test_query = "Explain linear regression in machine learning"
            
            # Step 1: Vector search for context
            try:
                collection = vector_db_manager.get_collection("educational_content")
                search_results = collection.query(
                    query_texts=[test_query],
                    n_results=3
                )
                
                context_chunks = search_results.get('documents', [[]])[0]
                
                if context_chunks:
                    logger.info(f"  ✅ Retrieved {len(context_chunks)} context chunks")
                    
                    # Step 2: Generate response with context
                    rag_response = await ollama_service.generate_with_context(
                        query=test_query,
                        context_chunks=context_chunks,
                        system_prompt="You are an educational AI assistant. Use the provided context to give accurate, helpful answers about educational topics.",
                        max_context_length=1000
                    )
                    
                    self.results['integration']['rag_test'] = {
                        'query': test_query,
                        'context_found': len(context_chunks),
                        'response_length': len(rag_response),
                        'response_preview': rag_response[:200] + "..." if len(rag_response) > 200 else rag_response,
                        'success': len(rag_response) > 50 and "error" not in rag_response.lower()
                    }
                    
                    logger.info(f"  ✅ RAG response generated: {len(rag_response)} chars")
                    
                else:
                    logger.warning("  ⚠️ No context chunks found for RAG test")
                    self.results['integration']['rag_test'] = {'error': 'No context found'}
                    
            except Exception as e:
                logger.error(f"  ❌ RAG pipeline error: {e}")
                self.results['integration']['rag_error'] = str(e)
            
        except Exception as e:
            logger.error(f"❌ RAG Pipeline Error: {e}")
            self.results['integration']['error'] = str(e)
    
    async def test_api_endpoints(self):
        """Test API endpoints if available"""
        logger.info("🌐 Testing API Endpoints...")
        
        try:
            # Check if API files exist
            from pathlib import Path
            api_main = Path("api/main.py")
            
            if api_main.exists():
                logger.info("  ✅ API files found")
                self.results['api']['files_exist'] = True
                
                # Try to import API components
                try:
                    from api.main import app
                    self.results['api']['app_loaded'] = True
                    logger.info("  ✅ FastAPI app loaded successfully")
                except Exception as e:
                    self.results['api']['app_error'] = str(e)
                    logger.warning(f"  ⚠️ API app loading error: {e}")
            else:
                logger.info("  ℹ️ API files not found - testing components only")
                self.results['api']['files_exist'] = False
                
        except Exception as e:
            logger.error(f"❌ API Error: {e}")
            self.results['api']['error'] = str(e)
    
    def generate_report(self):
        """Generate comprehensive test report"""
        end_time = time.time()
        duration = end_time - self.start_time
        
        report = {
            'test_summary': {
                'duration_seconds': round(duration, 2),
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'total_tests': sum(len(category) for category in self.results.values())
            },
            'results': self.results
        }
        
        # Calculate success metrics
        successes = 0
        total = 0
        
        for category, tests in self.results.items():
            for test_name, result in tests.items():
                total += 1
                if isinstance(result, dict):
                    if result.get('success', True) and 'error' not in result:
                        successes += 1
                elif 'error' not in str(result):
                    successes += 1
        
        report['test_summary']['success_rate'] = round((successes / total * 100) if total > 0 else 0, 1)
        
        return report
    
    async def run_all_tests(self):
        """Run comprehensive system test suite"""
        logger.info("🚀 Starting Comprehensive System Test Suite")
        logger.info("=" * 60)
        
        try:
            await self.test_database_connections()
            await self.test_llm_integration()
            await self.test_data_retrieval()
            await self.test_search_functionality()
            await self.test_agent_functionality()
            await self.test_rag_pipeline()
            await self.test_api_endpoints()
            
            # Generate and save report
            report = self.generate_report()
            
            # Save detailed report
            report_file = f"test_report_{int(time.time())}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            # Print summary
            logger.info("=" * 60)
            logger.info(f"📊 TEST SUMMARY")
            logger.info(f"Duration: {report['test_summary']['duration_seconds']}s")
            logger.info(f"Success Rate: {report['test_summary']['success_rate']}%")
            logger.info(f"Total Tests: {report['test_summary']['total_tests']}")
            logger.info(f"Report saved to: {report_file}")
            
            # Print category results
            for category, results in self.results.items():
                error_count = sum(1 for r in results.values() if isinstance(r, dict) and 'error' in r)
                success_count = len(results) - error_count
                status = "✅" if error_count == 0 else "⚠️" if success_count > 0 else "❌"
                logger.info(f"{status} {category.upper()}: {success_count}/{len(results)} passed")
            
            return report
            
        except Exception as e:
            logger.error(f"❌ Critical test error: {e}")
            logger.error(traceback.format_exc())
            return {'error': str(e)}

async def main():
    """Main test execution"""
    tester = SystemTester()
    report = await tester.run_all_tests()
    
    # Print final status
    if report.get('error'):
        print(f"\n❌ Testing failed: {report['error']}")
        return 1
    else:
        success_rate = report['test_summary']['success_rate']
        if success_rate >= 90:
            print(f"\n🎉 System is healthy! Success rate: {success_rate}%")
            return 0
        elif success_rate >= 70:
            print(f"\n⚠️ System has issues but is functional. Success rate: {success_rate}%")
            return 0
        else:
            print(f"\n❌ System has major issues. Success rate: {success_rate}%")
            return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
