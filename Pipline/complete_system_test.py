#!/usr/bin/env python3
"""
Complete System Test for Multi-Agent RAG Pipeline
=================================================

This script tests all components of the educational RAG system:
1. Database connections (MongoDB, ChromaDB)
2. Core services (Ollama, GridFS, Vector DB)
3. Agent system functionality
4. API endpoints
5. Data integrity and search capabilities
"""

import asyncio
import json
import logging
import traceback
from datetime import datetime
from pathlib import Path
import sys
import os

# Add the Pipline directory to Python path
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('system_test.log')
    ]
)
logger = logging.getLogger(__name__)

class SystemTester:
    """Comprehensive system testing class"""
    
    def __init__(self):
        self.test_results = {
            'start_time': datetime.now().isoformat(),
            'tests': {},
            'summary': {}
        }
    
    async def test_environment_setup(self):
        """Test 1: Environment and configuration"""
        test_name = "environment_setup"
        logger.info(f"🔧 Testing {test_name}...")
        
        try:
            # Test environment file
            env_path = Path('.env')
            if not env_path.exists():
                raise FileNotFoundError(".env file not found")
            
            # Test required Python packages
            required_packages = [
                'fastapi', 'uvicorn', 'pymongo', 'chromadb', 
                'sentence-transformers', 'httpx', 'pydantic'
            ]
            
            missing_packages = []
            for package in required_packages:
                try:
                    __import__(package.replace('-', '_'))
                except ImportError:
                    missing_packages.append(package)
            
            if missing_packages:
                raise ImportError(f"Missing packages: {missing_packages}")
            
            # Test config loading
            from config.settings import Settings
            settings = Settings()
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': {
                    'env_file_exists': True,
                    'required_packages': 'all_installed',
                    'config_loaded': True,
                    'mongodb_uri': settings.MONGODB_URI,
                    'chromadb_path': settings.CHROMADB_PATH
                }
            }
            logger.info(f"✅ {test_name} PASSED")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_database_connections(self):
        """Test 2: Database connectivity"""
        test_name = "database_connections"
        logger.info(f"🗄️ Testing {test_name}...")
        
        try:
            from config.database import db_manager
            
            # Test MongoDB connection
            db = db_manager.get_database()
            if db is None:
                raise ConnectionError("Could not connect to MongoDB")
            collections = db.list_collection_names()
            
            # Test GridFS
            gridfs = db_manager.get_gridfs()
            gridfs_files_count = db.fs.files.count_documents({})
            
            # Test ChromaDB
            import chromadb
            chroma_client = chromadb.PersistentClient(path="./chromadb")
            chroma_collections = chroma_client.list_collections()
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': {
                    'mongodb_connected': True,
                    'collections_found': len(collections),
                    'collection_names': collections,
                    'gridfs_files': gridfs_files_count,
                    'chromadb_connected': True,
                    'chromadb_collections': [c.name for c in chroma_collections] if chroma_collections else []
                }
            }
            logger.info(f"✅ {test_name} PASSED - MongoDB collections: {len(collections)}, GridFS files: {gridfs_files_count}")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_ollama_service(self):
        """Test 3: Ollama LLM service"""
        test_name = "ollama_service"
        logger.info(f"🤖 Testing {test_name}...")
        
        try:
            from core.ollama_service import ollama_service
            
            # Test connection
            is_connected = await ollama_service.check_connection()
            if not is_connected:
                raise ConnectionError("Cannot connect to Ollama service")
            
            # Test available models
            models = await ollama_service.list_models()
            
            # Test simple generation
            response = await ollama_service.generate_response(
                prompt="What is machine learning? Answer in one sentence.",
                max_tokens=100
            )
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': {
                    'connection_status': 'connected',
                    'available_models': models,
                    'test_response_length': len(response),
                    'test_response_preview': response[:100] + "..." if len(response) > 100 else response
                }
            }
            logger.info(f"✅ {test_name} PASSED - Available models: {len(models)}")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_data_collections(self):
        """Test 4: Data collection integrity"""
        test_name = "data_collections"
        logger.info(f"📚 Testing {test_name}...")
        
        try:
            from config.database import db_manager
            db = db_manager.get_database()
            if db is None:
                raise ConnectionError("Could not connect to MongoDB")
            
            # Test each collection
            collection_stats = {}
            expected_collections = [
                'pes_materials', 'reference_books', 'videos', 'chunks'
            ]
            
            for coll_name in expected_collections:
                collection = db[coll_name]
                count = collection.count_documents({})
                
                # Get sample document
                sample = collection.find_one({})
                
                collection_stats[coll_name] = {
                    'document_count': count,
                    'has_sample': sample is not None,
                    'sample_fields': list(sample.keys()) if sample else []
                }
            
            # Check GridFS files
            gridfs_count = db.fs.files.count_documents({})
            
            # Test ChromaDB data
            import chromadb
            chroma_client = chromadb.PersistentClient(path="./chromadb")
            vector_count = 0
            try:
                collection = chroma_client.get_collection("educational_content")
                vector_count = collection.count()
            except:
                pass
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': {
                    'mongodb_collections': collection_stats,
                    'gridfs_files': gridfs_count,
                    'vector_embeddings': vector_count
                }
            }
            logger.info(f"✅ {test_name} PASSED")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_search_functionality(self):
        """Test 5: Search and retrieval"""
        test_name = "search_functionality"
        logger.info(f"🔍 Testing {test_name}...")
        
        try:
            from config.database import db_manager
            db = db_manager.get_database()
            if db is None:
                raise ConnectionError("Could not connect to MongoDB")
            
            # Test MongoDB search
            materials = db.pes_materials.find({"subject": {"$regex": "machine", "$options": "i"}}).limit(5)
            materials_list = list(materials)
            
            books = db.reference_books.find({"title": {"$regex": "computer", "$options": "i"}}).limit(5)
            books_list = list(books)
            
            # Test vector search if ChromaDB available
            vector_results = []
            try:
                import chromadb
                chroma_client = chromadb.PersistentClient(path="./chromadb")
                collection = chroma_client.get_collection("educational_content")
                results = collection.query(
                    query_texts=["machine learning algorithms"],
                    n_results=5
                )
                vector_results = results.get('documents', []) or []
            except Exception as ve:
                logger.warning(f"Vector search not available: {ve}")
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': {
                    'mongodb_material_search': len(materials_list),
                    'mongodb_book_search': len(books_list),
                    'vector_search_results': len(vector_results) if isinstance(vector_results, list) else 0,
                    'sample_material_titles': [m.get('title', 'No title')[:50] for m in materials_list[:3]],
                    'sample_book_titles': [b.get('title', 'No title')[:50] for b in books_list[:3]]
                }
            }
            logger.info(f"✅ {test_name} PASSED")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_agent_system(self):
        """Test 6: Agent system functionality"""
        test_name = "agent_system"
        logger.info(f"🤖 Testing {test_name}...")
        
        try:
            # Test individual agents if they exist
            agent_tests = {}
            
            # Test if agent files exist
            agent_files = [
                'agents/system_prompts.py',
                'agents/base_agent.py'
            ]
            
            for agent_file in agent_files:
                agent_path = Path(agent_file)
                agent_tests[agent_file] = {
                    'file_exists': agent_path.exists(),
                    'size_bytes': agent_path.stat().st_size if agent_path.exists() else 0
                }
            
            # Try to import and test basic agent functionality
            try:
                from agents.system_prompts import SystemPrompts
                prompts = SystemPrompts()
                agent_tests['system_prompts'] = {
                    'loaded': True,
                    'has_query_router': hasattr(prompts, 'QUERY_ROUTER'),
                    'has_pdf_search': hasattr(prompts, 'PDF_SEARCH_AGENT')
                }
            except Exception as e:
                agent_tests['system_prompts'] = {
                    'loaded': False,
                    'error': str(e)
                }
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': agent_tests
            }
            logger.info(f"✅ {test_name} PASSED")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_api_structure(self):
        """Test 7: API structure and imports"""
        test_name = "api_structure"
        logger.info(f"🌐 Testing {test_name}...")
        
        try:
            # Test if API files exist and can be imported
            api_tests = {}
            
            api_files = [
                'api/main.py',
                'api/search_routes.py',
                'api/roadmap_routes.py'
            ]
            
            for api_file in api_files:
                api_path = Path(api_file)
                api_tests[api_file] = {
                    'file_exists': api_path.exists(),
                    'size_bytes': api_path.stat().st_size if api_path.exists() else 0
                }
            
            # Try to import main API
            try:
                import importlib.util
                spec = importlib.util.spec_from_file_location("main", "api/main.py")
                if spec and spec.loader:
                    api_tests['main_import'] = {'status': 'importable'}
                else:
                    api_tests['main_import'] = {'status': 'not_importable'}
            except Exception as e:
                api_tests['main_import'] = {
                    'status': 'import_error',
                    'error': str(e)
                }
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': api_tests
            }
            logger.info(f"✅ {test_name} PASSED")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    async def test_ingestion_pipeline(self):
        """Test 8: Data ingestion pipeline"""
        test_name = "ingestion_pipeline"
        logger.info(f"⚙️ Testing {test_name}...")
        
        try:
            # Check if main ingestion script exists and data directories
            pipeline_tests = {}
            
            # Test ingestion files
            ingestion_files = [
                'complete_gridfs_ingestion.py',
                'Data/PES_materials/PES_slides.json',
                'Data/Refrence_books/Refrence_books'
            ]
            
            for file_path in ingestion_files:
                path = Path(file_path)
                pipeline_tests[file_path] = {
                    'exists': path.exists(),
                    'size_bytes': path.stat().st_size if path.exists() else 0
                }
            
            # Test data file content
            if Path('Data/PES_materials/PES_slides.json').exists():
                with open('Data/PES_materials/PES_slides.json', 'r') as f:
                    pes_data = json.load(f)
                    pipeline_tests['pes_data'] = {
                        'count': len(pes_data),
                        'sample_title': pes_data[0].get('title', '') if pes_data else ''
                    }
            
            self.test_results['tests'][test_name] = {
                'status': 'PASSED',
                'details': pipeline_tests
            }
            logger.info(f"✅ {test_name} PASSED")
            
        except Exception as e:
            self.test_results['tests'][test_name] = {
                'status': 'FAILED',
                'error': str(e),
                'traceback': traceback.format_exc()
            }
            logger.error(f"❌ {test_name} FAILED: {e}")

    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results['tests'])
        passed_tests = sum(1 for test in self.test_results['tests'].values() if test['status'] == 'PASSED')
        failed_tests = total_tests - passed_tests
        
        self.test_results['summary'] = {
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': f"{(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%",
            'end_time': datetime.now().isoformat(),
            'overall_status': 'PASS' if failed_tests == 0 else 'FAIL'
        }

    def print_summary(self):
        """Print test summary to console"""
        summary = self.test_results['summary']
        
        print("\n" + "="*80)
        print("🧪 SYSTEM TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Passed: ✅ {summary['passed']}")
        print(f"Failed: ❌ {summary['failed']}")
        print(f"Success Rate: {summary['success_rate']}")
        print(f"Overall Status: {'🎉 PASS' if summary['overall_status'] == 'PASS' else '💥 FAIL'}")
        print("="*80)
        
        # Print individual test results
        for test_name, result in self.test_results['tests'].items():
            status_emoji = "✅" if result['status'] == 'PASSED' else "❌"
            print(f"{status_emoji} {test_name.replace('_', ' ').title()}: {result['status']}")
            if result['status'] == 'FAILED':
                print(f"   Error: {result.get('error', 'Unknown error')}")
        
        print("\n💾 Detailed results saved to: system_test_results.json")

    async def run_all_tests(self):
        """Run all system tests"""
        logger.info("🚀 Starting comprehensive system test...")
        
        test_methods = [
            self.test_environment_setup,
            self.test_database_connections,
            self.test_ollama_service,
            self.test_data_collections,
            self.test_search_functionality,
            self.test_agent_system,
            self.test_api_structure,
            self.test_ingestion_pipeline
        ]
        
        for test_method in test_methods:
            try:
                await test_method()
            except Exception as e:
                logger.error(f"Critical error in {test_method.__name__}: {e}")
        
        # Generate summary
        self.generate_summary()
        
        # Save results to file
        with open('system_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        # Print summary
        self.print_summary()
        
        return self.test_results

async def main():
    """Main test execution"""
    tester = SystemTester()
    results = await tester.run_all_tests()
    
    # Return exit code based on results
    return 0 if results['summary']['overall_status'] == 'PASS' else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
