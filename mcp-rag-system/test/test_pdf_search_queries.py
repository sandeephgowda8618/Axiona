#!/usr/bin/env python3
"""
Comprehensive Test Suite for PDF Search Queries
==============================================

This script tests the RAG pipeline by running real-world search queries
and verifying that the correct PDF files are returned from our MongoDB collection.

Tests cover various domains:
- Computer Science fundamentals
- Programming languages
- Data structures and algorithms
- Machine learning and AI
- Operating systems
- Database management
- Software engineering

Usage:
    python test/test_pdf_search_queries.py
"""

import os
import sys
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

# Add the parent directory to Python path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from core.mongodb_manager import MongoDBManager
from core.chroma_manager import ChromaManager
import os

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

class PDFSearchTester:
    """Test suite for PDF search functionality"""
    
    def __init__(self):
        """Initialize the test suite"""
        self.mongodb_manager = MongoDBManager()
        self.chroma_manager = ChromaManager(os.getenv("CHROMA_PERSIST_DIRECTORY", "./vector_db"))
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    async def setup(self):
        """Setup test environment"""
        logger.info("Setting up test environment...")
        
        # Verify MongoDB connection
        try:
            await self.mongodb_manager.connect()
            books = await self.mongodb_manager.get_all_books()
            book_count = len(books)
            logger.info(f"MongoDB connected. Total books: {book_count}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
            
        # Verify ChromaDB connection
        try:
            collection = self.chroma_manager.collection
            doc_count = collection.count() if collection else 0
            logger.info(f"ChromaDB connected. Total documents: {doc_count}")
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {e}")
            return False
            
        return True
        
    def teardown(self):
        """Cleanup test environment"""
        logger.info("Cleaning up test environment...")
        self.mongodb_manager.close()
        
    def run_search_query(self, query: str, expected_domains: List[str] = None, 
                        top_k: int = 5) -> Dict[str, Any]:
        """
        Run a search query and return results with metadata
        
        Args:
            query: Search query string
            expected_domains: List of expected domain keywords in results
            top_k: Number of top results to return
            
        Returns:
            Dictionary with query results and metadata
        """
        try:
            # Search ChromaDB
            results = self.chroma_manager.search(query, n_results=top_k)
            
            if not results or not results.get('metadatas'):
                return {
                    'query': query,
                    'success': False,
                    'error': 'No results returned',
                    'results': []
                }
            
            # Extract file names and metadata
            search_results = []
            for i, metadata in enumerate(results['metadatas'][0]):
                result = {
                    'file_name': metadata.get('file_name', 'Unknown'),
                    'title': metadata.get('title', 'Unknown'),
                    'subject': metadata.get('subject', 'Unknown'),
                    'author': metadata.get('author', 'Unknown'),
                    'distance': results['distances'][0][i] if results.get('distances') else None,
                    'content_preview': results['documents'][0][i][:200] + "..." if results.get('documents') else None
                }
                search_results.append(result)
            
            # Check if expected domains are present in results
            domain_match = True
            if expected_domains:
                result_text = ' '.join([
                    str(r.get('title', '')) + ' ' + 
                    str(r.get('subject', '')) + ' ' + 
                    str(r.get('content_preview', ''))
                    for r in search_results
                ]).lower()
                
                domain_match = any(domain.lower() in result_text for domain in expected_domains)
            
            return {
                'query': query,
                'success': True,
                'domain_match': domain_match,
                'expected_domains': expected_domains,
                'results_count': len(search_results),
                'results': search_results
            }
            
        except Exception as e:
            logger.error(f"Search query failed for '{query}': {e}")
            return {
                'query': query,
                'success': False,
                'error': str(e),
                'results': []
            }
    
    def test_query(self, query: str, expected_domains: List[str] = None, 
                   description: str = None) -> bool:
        """
        Test a single search query
        
        Args:
            query: Search query string
            expected_domains: List of expected domain keywords
            description: Test description
            
        Returns:
            True if test passed, False otherwise
        """
        self.total_tests += 1
        test_name = description or f"Query: {query}"
        
        logger.info(f"Running test {self.total_tests}: {test_name}")
        
        result = self.run_search_query(query, expected_domains)
        
        # Determine if test passed
        passed = (
            result['success'] and 
            result['results_count'] > 0 and
            (not expected_domains or result['domain_match'])
        )
        
        if passed:
            self.passed_tests += 1
            logger.info(f"✅ PASSED: Found {result['results_count']} relevant results")
        else:
            logger.warning(f"❌ FAILED: {result.get('error', 'No relevant results found')}")
        
        # Log top results
        if result.get('results'):
            logger.info("Top results:")
            for i, res in enumerate(result['results'][:3], 1):
                logger.info(f"  {i}. {res['file_name']} - {res['title']}")
        
        # Store result
        self.test_results.append({
            'test_number': self.total_tests,
            'description': test_name,
            'query': query,
            'expected_domains': expected_domains,
            'passed': passed,
            'result': result
        })
        
        return passed
    
    def run_comprehensive_tests(self):
        """Run all comprehensive test cases"""
        logger.info("Starting comprehensive PDF search tests...")
        
        # Test 1: Python programming
        self.test_query(
            "Python programming tutorial basics syntax",
            expected_domains=["python", "programming", "tutorial"],
            description="Python programming fundamentals"
        )
        
        # Test 2: Machine learning algorithms
        self.test_query(
            "machine learning algorithms neural networks deep learning",
            expected_domains=["machine learning", "neural", "algorithm", "AI"],
            description="Machine learning and AI concepts"
        )
        
        # Test 3: Data structures and algorithms
        self.test_query(
            "data structures algorithms arrays linked lists trees sorting",
            expected_domains=["data structure", "algorithm", "array", "tree", "sort"],
            description="Data structures and algorithms"
        )
        
        # Test 4: Operating systems concepts
        self.test_query(
            "operating systems process management memory scheduling",
            expected_domains=["operating system", "process", "memory", "schedule"],
            description="Operating systems fundamentals"
        )
        
        # Test 5: Database management systems
        self.test_query(
            "database management SQL relational DBMS normalization",
            expected_domains=["database", "SQL", "relational", "DBMS"],
            description="Database management concepts"
        )
        
        # Test 6: Software engineering practices
        self.test_query(
            "software engineering design patterns object oriented programming",
            expected_domains=["software", "engineering", "design", "pattern", "OOP"],
            description="Software engineering and design patterns"
        )
        
        # Test 7: Computer networks
        self.test_query(
            "computer networks TCP IP protocols networking communication",
            expected_domains=["network", "TCP", "IP", "protocol", "communication"],
            description="Computer networking protocols"
        )
        
        # Test 8: Web development
        self.test_query(
            "web development HTML CSS JavaScript frontend backend",
            expected_domains=["web", "HTML", "CSS", "JavaScript", "frontend"],
            description="Web development technologies"
        )
        
        # Test 9: Cybersecurity and cryptography
        self.test_query(
            "cybersecurity encryption cryptography security protocols",
            expected_domains=["security", "encryption", "crypto", "protocol"],
            description="Cybersecurity and cryptography"
        )
        
        # Test 10: Artificial intelligence
        self.test_query(
            "artificial intelligence expert systems knowledge representation",
            expected_domains=["artificial intelligence", "expert", "knowledge", "AI"],
            description="Artificial intelligence systems"
        )
        
        # Test 11: Mathematics and statistics
        self.test_query(
            "mathematics statistics probability calculus linear algebra",
            expected_domains=["math", "statistics", "probability", "calculus", "algebra"],
            description="Mathematics and statistics"
        )
        
        # Test 12: Computer graphics and visualization
        self.test_query(
            "computer graphics 3D rendering visualization OpenGL",
            expected_domains=["graphics", "3D", "render", "visual", "OpenGL"],
            description="Computer graphics and visualization"
        )
        
        # Test 13: Mobile app development
        self.test_query(
            "mobile app development Android iOS Swift Java Kotlin",
            expected_domains=["mobile", "app", "Android", "iOS", "Swift"],
            description="Mobile application development"
        )
        
        # Test 14: Cloud computing
        self.test_query(
            "cloud computing AWS Azure distributed systems scalability",
            expected_domains=["cloud", "AWS", "Azure", "distributed", "scale"],
            description="Cloud computing platforms"
        )
        
        # Test 15: Data science and analytics
        self.test_query(
            "data science analytics big data pandas numpy visualization",
            expected_domains=["data science", "analytics", "pandas", "numpy", "visualization"],
            description="Data science and analytics tools"
        )
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        report = {
            'test_summary': {
                'total_tests': self.total_tests,
                'passed_tests': self.passed_tests,
                'failed_tests': self.total_tests - self.passed_tests,
                'success_rate': round(success_rate, 2),
                'timestamp': datetime.now().isoformat()
            },
            'test_results': self.test_results,
            'recommendations': []
        }
        
        # Add recommendations based on results
        if success_rate < 80:
            report['recommendations'].append(
                "Consider improving document indexing or expanding the knowledge base"
            )
        if success_rate < 60:
            report['recommendations'].append(
                "Review search algorithms and metadata quality"
            )
        if success_rate >= 90:
            report['recommendations'].append(
                "Excellent performance! Consider adding more specialized test cases"
            )
            
        return report
    
    def save_report(self, report: Dict[str, Any]):
        """Save test report to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"test/test_report_{timestamp}.json"
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            logger.info(f"Test report saved to: {report_file}")
        except Exception as e:
            logger.error(f"Failed to save test report: {e}")
    
    def run_all_tests(self):
        """Run complete test suite"""
        logger.info("=" * 60)
        logger.info("STARTING COMPREHENSIVE PDF SEARCH TEST SUITE")
        logger.info("=" * 60)
        
        # Setup
        if not self.setup():
            logger.error("Test setup failed. Aborting tests.")
            return False
        
        try:
            # Run all tests
            self.run_comprehensive_tests()
            
            # Generate and display report
            report = self.generate_report()
            
            logger.info("=" * 60)
            logger.info("TEST RESULTS SUMMARY")
            logger.info("=" * 60)
            logger.info(f"Total Tests: {report['test_summary']['total_tests']}")
            logger.info(f"Passed: {report['test_summary']['passed_tests']}")
            logger.info(f"Failed: {report['test_summary']['failed_tests']}")
            logger.info(f"Success Rate: {report['test_summary']['success_rate']}%")
            
            if report['recommendations']:
                logger.info("\nRecommendations:")
                for rec in report['recommendations']:
                    logger.info(f"- {rec}")
            
            # Save detailed report
            self.save_report(report)
            
            # Return success based on threshold
            return report['test_summary']['success_rate'] >= 70
            
        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            return False
        finally:
            self.teardown()

def main():
    """Main test execution function"""
    tester = PDFSearchTester()
    success = tester.run_all_tests()
    
    if success:
        logger.info("🎉 Test suite completed successfully!")
        return 0
    else:
        logger.error("❌ Test suite failed!")
        return 1

if __name__ == "__main__":
    exit(main())
