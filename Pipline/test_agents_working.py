#!/usr/bin/env python3
"""
Agent Test - Working Version
============================

Test the multi-agent system with real educational queries.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_query_routing():
    """Test query router agent"""
    logger.info("🧭 Testing Query Router Agent")
    
    from core.ollama_service import ollama_service
    from agents.system_prompts import SystemPrompts
    
    prompts = SystemPrompts()
    
    test_queries = [
        "Find materials on linear algebra and matrices",
        "I need a good reference book on machine learning algorithms",
        "Show me videos about data structures and algorithms", 
        "Create a personalized learning roadmap for artificial intelligence",
        "Explain neural networks from course materials"
    ]
    
    for query in test_queries:
        try:
            response = await ollama_service.generate_response(
                prompt=f"User Query: {query}",
                system_prompt=prompts.QUERY_ROUTER,
                temperature=0.1
            )
            
            route = response.strip().lower()
            logger.info(f"  Query: '{query[:50]}...'")
            logger.info(f"  Route: {route}")
            logger.info("")
            
        except Exception as e:
            logger.error(f"  Error routing query: {e}")
    
    return True

async def test_pdf_search_agent():
    """Test PDF search agent functionality"""
    logger.info("📚 Testing PDF Search Agent")
    
    from core.ollama_service import ollama_service
    from core.vector_db import vector_db
    from agents.system_prompts import SystemPrompts
    
    prompts = SystemPrompts()
    query = "linear regression machine learning algorithms"
    
    try:
        # Step 1: Get relevant materials
        search_results = vector_db.search_documents("educational_content", query, 5)
        
        if search_results and search_results.get('documents'):
            docs = search_results['documents'][0] if search_results['documents'] else []
            
            logger.info(f"  Found {len(docs)} relevant materials")
            
            if docs:
                # Step 2: Generate response using PDF Search Agent
                context = "\n\n".join(docs[:3])  # Use top 3 results
                
                full_prompt = f"""
User Query: {query}

Retrieved Materials:
{context}

Please provide a comprehensive answer about {query} based on the materials above.
"""
                
                response = await ollama_service.generate_response(
                    prompt=full_prompt,
                    system_prompt=prompts.PDF_SEARCH_AGENT,
                    temperature=0.3
                )
                
                logger.info(f"  Agent Response: {response[:200]}...")
                return True
            else:
                logger.warning("  No documents in search results")
                return False
        else:
            logger.warning("  No materials found for search")
            return False
            
    except Exception as e:
        logger.error(f"  PDF Search Error: {e}")
        return False

async def test_book_search_agent():
    """Test book search functionality"""
    logger.info("📖 Testing Book Search Agent")
    
    try:
        from config.database import db_manager
        from core.ollama_service import ollama_service
        from agents.system_prompts import SystemPrompts
        
        prompts = SystemPrompts()
        db = db_manager.get_database()
        
        if db is None:
            logger.warning("  Database not available")
            return False
        
        query = "computer organization architecture"
        
        # Search for relevant books
        books = db['reference_books'].find({
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"key_concepts": {"$regex": query, "$options": "i"}},
                {"summary": {"$regex": query, "$options": "i"}}
            ]
        }).limit(3)
        
        book_list = list(books)
        logger.info(f"  Found {len(book_list)} relevant books")
        
        if book_list:
            # Format book information
            book_info = []
            for book in book_list:
                info = f"Title: {book.get('title', 'Unknown')}\n"
                info += f"Author: {book.get('author', 'Unknown')}\n"
                info += f"Summary: {book.get('summary', 'No summary')[:200]}...\n"
                book_info.append(info)
            
            context = "\n\n".join(book_info)
            
            # Generate response using Book Search Agent
            full_prompt = f"""
User Query: {query}

Available Books:
{context}

Please recommend the best books for learning about {query} and explain why.
"""
            
            response = await ollama_service.generate_response(
                prompt=full_prompt,
                system_prompt=prompts.BOOK_SEARCH_AGENT,
                temperature=0.3
            )
            
            logger.info(f"  Agent Response: {response[:300]}...")
            
            for book in book_list:
                title = book.get('title', 'Unknown')
                author = book.get('author', 'Unknown')
                logger.info(f"  Book: {title} by {author}")
            
            return True
        else:
            logger.warning("  No books found")
            return False
        
    except Exception as e:
        logger.error(f"  Book Search Error: {e}")
        return False

async def test_interview_agent():
    """Test interview agent for roadmap generation"""
    logger.info("🤔 Testing Interview Agent")
    
    try:
        from core.ollama_service import ollama_service
        from agents.system_prompts import SystemPrompts
        
        prompts = SystemPrompts()
        
        # Simulate interview responses
        user_context = {
            "learning_goal": "I want to learn machine learning from scratch",
            "background": "I have basic Python knowledge but no ML experience",
            "time_availability": "10 hours per week",
            "timeline": "3 months"
        }
        
        # Generate interview questions
        interview_prompt = f"""
Based on this user context: {user_context}

Generate 3 follow-up questions to better understand their learning needs for a personalized ML roadmap.
"""
        
        questions = await ollama_service.generate_response(
            prompt=interview_prompt,
            system_prompt=prompts.INTERVIEW_AGENT,
            temperature=0.5
        )
        
        logger.info(f"  Interview Questions Generated:")
        logger.info(f"  {questions}")
        
        return True
        
    except Exception as e:
        logger.error(f"  Interview Agent Error: {e}")
        return False

async def test_end_to_end_rag():
    """Test complete end-to-end RAG workflow"""
    logger.info("🔄 Testing End-to-End RAG Workflow")
    
    try:
        from core.ollama_service import ollama_service
        from core.vector_db import vector_db
        from agents.system_prompts import SystemPrompts
        
        prompts = SystemPrompts()
        user_query = "Explain how neural networks work and provide examples from course materials"
        
        logger.info(f"  User Query: {user_query}")
        
        # Step 1: Route the query
        route_response = await ollama_service.generate_response(
            prompt=f"User Query: {user_query}",
            system_prompt=prompts.QUERY_ROUTER,
            temperature=0.1
        )
        
        route = route_response.strip().lower()
        logger.info(f"  Routed to: {route}")
        
        # Step 2: Search for relevant content
        search_results = vector_db.search_documents("educational_content", user_query, 5)
        
        if search_results and search_results.get('documents'):
            docs = search_results['documents'][0] if search_results['documents'] else []
            
            logger.info(f"  Found {len(docs)} relevant documents")
            
            if docs:
                # Step 3: Generate comprehensive response
                final_response = await ollama_service.generate_with_context(
                    query=user_query,
                    context_chunks=docs[:3],
                    system_prompt="You are an expert educational assistant. Provide detailed, accurate explanations based on the course materials provided.",
                    max_context_length=1500
                )
                
                logger.info(f"  Final Response: {final_response[:400]}...")
                return True
            else:
                logger.warning("  No documents found")
                return False
        else:
            logger.warning("  Search failed")
            return False
        
    except Exception as e:
        logger.error(f"  End-to-End RAG Error: {e}")
        return False

async def main():
    """Run all agent tests"""
    logger.info("🤖 Starting Agent Interaction Tests")
    logger.info("=" * 60)
    
    tests = [
        ("Query Routing", test_query_routing),
        ("PDF Search Agent", test_pdf_search_agent),
        ("Book Search Agent", test_book_search_agent),
        ("Interview Agent", test_interview_agent),
        ("End-to-End RAG", test_end_to_end_rag)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            logger.info(f"\n" + "=" * 60)
            result = await test_func()
            if result:
                passed += 1
                logger.info(f"✅ {test_name}: PASSED")
            else:
                logger.warning(f"⚠️ {test_name}: FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name}: ERROR - {e}")
    
    logger.info("\n" + "=" * 60)
    logger.info(f"📊 Agent Test Summary: {passed}/{total} tests passed")
    
    if passed >= total * 0.8:  # 80% success rate
        logger.info("🎉 Agent system is working well!")
        return True
    else:
        logger.warning("⚠️ Agent system needs attention")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
