#!/usr/bin/env python3
"""
Comprehensive PDF Search Test Suite
===================================

This script runs 15+ real-world search queries across different domains
and validates that the correct MongoDB file names are returned for display.

The test validates:
- Search functionality across various computer science domains
- Correct MongoDB file metadata retrieval
- Result relevance and quality
- System performance and reliability

Usage:
    python test/comprehensive_search_test.py
"""

import os
import sys
import asyncio
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.mongodb_manager import MongoDBManager
from core.chroma_manager import ChromaManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'test/test_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComprehensivePDFSearchTest:
    def __init__(self):
        self.mongodb_manager = MongoDBManager()
        self.chroma_manager = ChromaManager(os.getenv("CHROMA_DB_PATH", "./chromadb"))
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    async def setup(self):
        """Setup test environment"""
        logger.info("Setting up test environment...")
        
        try:
            # Initialize MongoDB
            await self.mongodb_manager.initialize()
            books = await self.mongodb_manager.get_all_books()
            logger.info(f"📚 MongoDB connected. Total books: {len(books)}")
            
            # Initialize ChromaDB
            await self.chroma_manager.initialize()
            
            if 'books' not in self.chroma_manager.collections:
                logger.error("❌ No 'books' collection found in ChromaDB")
                return False
                
            collection = self.chroma_manager.collections['books']
            doc_count = collection.count()
            logger.info(f"🔍 ChromaDB connected. Total documents: {doc_count}")
            
            if doc_count == 0:
                logger.warning("⚠️ No documents in ChromaDB. Run ingestion first!")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Setup failed: {e}")
            return False
    
    async def run_search_query(self, query: str, expected_keywords: List[str] = None, 
                              top_k: int = 5) -> Dict[str, Any]:
        """
        Run a search query and return results with metadata
        
        Args:
            query: Search query string
            expected_keywords: List of expected keywords in results
            top_k: Number of top results to return
            
        Returns:
            Dictionary with query results and metadata
        """
        try:
            collection = self.chroma_manager.collections['books']
            
            # Search ChromaDB
            results = collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            if not results or not results.get('metadatas') or not results['metadatas'][0]:
                return {
                    'query': query,
                    'success': False,
                    'error': 'No results returned',
                    'results': [],
                    'relevance_score': 0
                }
            
            # Extract file names and metadata
            search_results = []
            relevance_score = 0
            
            for i, metadata in enumerate(results['metadatas'][0]):
                result = {
                    'file_name': metadata.get('file_name', 'Unknown'),
                    'title': metadata.get('title', 'Unknown'),
                    'subject': metadata.get('subject', 'Unknown'),
                    'author': metadata.get('author', 'Unknown'),
                    'difficulty': metadata.get('difficulty', 'Unknown'),
                    'rating': metadata.get('rating', 0),
                    'distance': results['distances'][0][i] if results.get('distances') else None,
                    'content_preview': results['documents'][0][i][:200] + "..." if results.get('documents') else None
                }
                search_results.append(result)
                
                # Calculate relevance score based on distance (lower is better)
                if results.get('distances'):
                    relevance_score += (1.0 - results['distances'][0][i])
            
            # Average relevance score
            if search_results:
                relevance_score /= len(search_results)
            
            # Check if expected keywords are present in results
            keyword_match = True
            if expected_keywords:
                result_text = ' '.join([
                    str(r.get('title', '')) + ' ' + 
                    str(r.get('subject', '')) + ' ' + 
                    str(r.get('content_preview', ''))
                    for r in search_results
                ]).lower()
                
                matched_keywords = [kw for kw in expected_keywords if kw.lower() in result_text]
                keyword_match = len(matched_keywords) > 0
            
            return {
                'query': query,
                'success': True,
                'keyword_match': keyword_match,
                'expected_keywords': expected_keywords,
                'results_count': len(search_results),
                'relevance_score': relevance_score,
                'results': search_results
            }
            
        except Exception as e:
            logger.error(f"❌ Search query failed for '{query}': {e}")
            return {
                'query': query,
                'success': False,
                'error': str(e),
                'results': [],
                'relevance_score': 0
            }
    
    async def test_query(self, query: str, expected_keywords: List[str] = None, 
                        description: str = None) -> bool:
        """
        Test a single search query
        
        Args:
            query: Search query string
            expected_keywords: List of expected keywords
            description: Test description
            
        Returns:
            True if test passed, False otherwise
        """
        self.total_tests += 1
        test_name = description or f"Query: {query}"
        
        logger.info(f"\n--- Test {self.total_tests}: {test_name} ---")
        
        result = await self.run_search_query(query, expected_keywords)
        
        # Determine if test passed
        passed = (
            result['success'] and 
            result['results_count'] > 0 and
            result['relevance_score'] > 0.5 and  # Good relevance threshold
            (not expected_keywords or result['keyword_match'])
        )
        
        if passed:
            self.passed_tests += 1
            logger.info(f"✅ PASSED: Found {result['results_count']} relevant results (score: {result['relevance_score']:.2f})")
        else:
            logger.warning(f"❌ FAILED: {result.get('error', 'Low relevance or no keyword match')}")
        
        # Log top results with MongoDB file names
        if result.get('results'):
            logger.info("📄 Top MongoDB files returned:")
            for i, res in enumerate(result['results'][:3], 1):
                file_name = res['file_name']
                title = res['title']
                subject = res['subject']
                logger.info(f"  {i}. File: {file_name}")
                logger.info(f"     Title: {title}")
                logger.info(f"     Subject: {subject}")
        
        # Store result
        self.test_results.append({
            'test_number': self.total_tests,
            'description': test_name,
            'query': query,
            'expected_keywords': expected_keywords,
            'passed': passed,
            'result': result
        })
        
        return passed
    
    async def run_comprehensive_tests(self):
        """Run all comprehensive test cases"""
        logger.info("🚀 Starting comprehensive PDF search tests...")
        
        # Test 1: Python programming
        await self.test_query(
            "Python programming tutorial basics syntax variables functions",
            expected_keywords=["python", "programming", "tutorial"],
            description="Python programming fundamentals"
        )
        
        # Test 2: Machine learning algorithms
        await self.test_query(
            "machine learning algorithms neural networks deep learning artificial intelligence",
            expected_keywords=["machine learning", "neural", "algorithm", "AI"],
            description="Machine learning and AI concepts"
        )
        
        # Test 3: Data structures and algorithms
        await self.test_query(
            "data structures algorithms arrays linked lists trees sorting searching",
            expected_keywords=["data structure", "algorithm", "array", "tree", "sort"],
            description="Data structures and algorithms"
        )
        
        # Test 4: Operating systems concepts
        await self.test_query(
            "operating systems process management memory scheduling concurrency",
            expected_keywords=["operating system", "process", "memory", "schedule"],
            description="Operating systems fundamentals"
        )
        
        # Test 5: Database management systems
        await self.test_query(
            "database management SQL relational DBMS normalization transactions",
            expected_keywords=["database", "SQL", "relational", "DBMS"],
            description="Database management concepts"
        )
        
        # Test 6: Software engineering practices
        await self.test_query(
            "software engineering design patterns object oriented programming UML",
            expected_keywords=["software", "engineering", "design", "pattern", "OOP"],
            description="Software engineering and design patterns"
        )
        
        # Test 7: Computer networks
        await self.test_query(
            "computer networks TCP IP protocols networking communication internet",
            expected_keywords=["network", "TCP", "IP", "protocol", "communication"],
            description="Computer networking protocols"
        )
        
        # Test 8: Web development
        await self.test_query(
            "web development HTML CSS JavaScript frontend backend frameworks",
            expected_keywords=["web", "HTML", "CSS", "JavaScript", "frontend"],
            description="Web development technologies"
        )
        
        # Test 9: Cybersecurity and cryptography
        await self.test_query(
            "cybersecurity encryption cryptography security protocols authentication",
            expected_keywords=["security", "encryption", "crypto", "protocol"],
            description="Cybersecurity and cryptography"
        )
        
        # Test 10: Artificial intelligence
        await self.test_query(
            "artificial intelligence expert systems knowledge representation reasoning",
            expected_keywords=["artificial intelligence", "expert", "knowledge", "AI"],
            description="Artificial intelligence systems"
        )
        
        # Test 11: Mathematics and statistics
        await self.test_query(
            "mathematics statistics probability calculus linear algebra discrete math",
            expected_keywords=["math", "statistics", "probability", "calculus", "algebra"],
            description="Mathematics and statistics"
        )
        
        # Test 12: Computer graphics and visualization
        await self.test_query(
            "computer graphics 3D rendering visualization OpenGL computer vision",
            expected_keywords=["graphics", "3D", "render", "visual", "OpenGL"],
            description="Computer graphics and visualization"
        )
        
        # Test 13: Mobile app development
        await self.test_query(
            "mobile app development Android iOS Swift Java Kotlin React Native",
            expected_keywords=["mobile", "app", "Android", "iOS", "Swift"],
            description="Mobile application development"
        )
        
        # Test 14: Cloud computing
        await self.test_query(
            "cloud computing AWS Azure distributed systems scalability microservices",
            expected_keywords=["cloud", "AWS", "Azure", "distributed", "scale"],
            description="Cloud computing platforms"
        )
        
        # Test 15: Data science and analytics
        await self.test_query(
            "data science analytics big data pandas numpy matplotlib visualization",
            expected_keywords=["data science", "analytics", "pandas", "numpy", "visualization"],
            description="Data science and analytics tools"
        )
        
        # Test 16: Algorithms and complexity
        await self.test_query(
            "algorithm complexity analysis big O notation computational complexity",
            expected_keywords=["algorithm", "complexity", "big O", "computational"],
            description="Algorithm complexity analysis"
        )
        
        # Test 17: Compiler design
        await self.test_query(
            "compiler design parsing lexical analysis syntax analysis code generation",
            expected_keywords=["compiler", "parsing", "lexical", "syntax"],
            description="Compiler design and construction"
        )
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        # Calculate average relevance score
        total_relevance = sum(r['result'].get('relevance_score', 0) for r in self.test_results)
        avg_relevance = total_relevance / len(self.test_results) if self.test_results else 0
        
        report = {
            'test_summary': {
                'total_tests': self.total_tests,
                'passed_tests': self.passed_tests,
                'failed_tests': self.total_tests - self.passed_tests,
                'success_rate': round(success_rate, 2),
                'average_relevance_score': round(avg_relevance, 3),
                'timestamp': datetime.now().isoformat()
            },
            'failed_tests': [r for r in self.test_results if not r['passed']],
            'test_results': self.test_results,
            'recommendations': []
        }
        
        # Add recommendations based on results
        if success_rate < 70:
            report['recommendations'].append(
                "❌ Consider improving document indexing or expanding the knowledge base"
            )
        elif success_rate < 85:
            report['recommendations'].append(
                "⚠️ Good performance, but consider improving search algorithms"
            )
        else:
            report['recommendations'].append(
                "✅ Excellent performance! System is working well"
            )
            
        if avg_relevance < 0.6:
            report['recommendations'].append(
                "📊 Consider improving relevance scoring or document chunking"
            )
            
        return report
    
    async def save_report(self, report: Dict[str, Any]):
        """Save test report to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"test/comprehensive_test_report_{timestamp}.json"
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            logger.info(f"📄 Detailed test report saved to: {report_file}")
        except Exception as e:
            logger.error(f"❌ Failed to save test report: {e}")
    
    async def run_all_tests(self):
        """Run complete test suite"""
        logger.info("=" * 80)
        logger.info("🚀 STARTING COMPREHENSIVE PDF SEARCH TEST SUITE")
        logger.info("=" * 80)
        
        # Setup
        if not await self.setup():
            logger.error("❌ Test setup failed. Aborting tests.")
            return False
        
        try:
            # Run all tests
            await self.run_comprehensive_tests()
            
            # Generate and display report
            report = self.generate_report()
            
            logger.info("=" * 80)
            logger.info("📊 TEST RESULTS SUMMARY")
            logger.info("=" * 80)
            logger.info(f"📈 Total Tests: {report['test_summary']['total_tests']}")
            logger.info(f"✅ Passed: {report['test_summary']['passed_tests']}")
            logger.info(f"❌ Failed: {report['test_summary']['failed_tests']}")
            logger.info(f"🎯 Success Rate: {report['test_summary']['success_rate']}%")
            logger.info(f"📊 Average Relevance Score: {report['test_summary']['average_relevance_score']}")
            
            if report['failed_tests']:
                logger.info(f"\n❌ Failed Tests:")
                for test in report['failed_tests']:
                    logger.info(f"  - {test['description']}: {test['query']}")
            
            if report['recommendations']:
                logger.info(f"\n💡 Recommendations:")
                for rec in report['recommendations']:
                    logger.info(f"  {rec}")
            
            # Save detailed report
            await self.save_report(report)
            
            # Return success based on threshold
            return report['test_summary']['success_rate'] >= 70
            
        except Exception as e:
            logger.error(f"❌ Test execution failed: {e}")
            return False
        finally:
            await self.mongodb_manager.close()

async def main():
    """Main test execution function"""
    tester = ComprehensivePDFSearchTest()
    success = await tester.run_all_tests()
    
    if success:
        logger.info("🎉 COMPREHENSIVE TEST SUITE COMPLETED SUCCESSFULLY!")
        return 0
    else:
        logger.error("❌ COMPREHENSIVE TEST SUITE FAILED!")
        return 1

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(result)
