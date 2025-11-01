# MongoDB to ChromaDB Book Ingestion Service
import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from core.mongodb_manager import get_mongo_manager
from core.collections_simple import ChromaCollectionManager as ChromaDBManager
from models.api_models import MongoBookIngestStats

logger = logging.getLogger(__name__)

class BookIngestionService:
    """Service for ingesting MongoDB books into ChromaDB"""
    
    def __init__(self, chroma_manager: ChromaDBManager):
        self.chroma_manager = chroma_manager
        self.mongo_manager = None
    
    async def initialize(self):
        """Initialize the service"""
        self.mongo_manager = await get_mongo_manager()
        logger.info("Book ingestion service initialized")
    
    async def ingest_books_from_mongodb(
        self,
        namespace: str = "reference_books",
        subject_filter: Optional[str] = None,
        difficulty_filter: Optional[str] = None,
        limit: Optional[int] = None,
        force_update: bool = False
    ) -> Tuple[MongoBookIngestStats, List[str]]:
        """
        Ingest books from MongoDB into ChromaDB
        
        Args:
            namespace: ChromaDB namespace for the books
            subject_filter: Filter books by subject
            difficulty_filter: Filter books by difficulty
            limit: Maximum number of books to process
            force_update: Force re-ingestion of existing books
            
        Returns:
            Tuple of (stats, errors)
        """
        start_time = time.time()
        errors = []
        books_processed = 0
        books_ingested = 0
        books_skipped = 0
        total_books_found = 0
        
        try:
            # Ensure MongoDB manager is initialized
            if not self.mongo_manager:
                await self.initialize()
            
            # Get books from MongoDB based on filters
            if subject_filter:
                books = await self.mongo_manager.get_books_by_subject(subject_filter)
            elif difficulty_filter:
                books = await self.mongo_manager.get_books_by_difficulty(difficulty_filter)
            else:
                books = await self.mongo_manager.get_all_books()
            
            total_books_found = len(books)
            logger.info(f"Found {total_books_found} books in MongoDB")
            
            # Apply limit if specified
            if limit and limit < len(books):
                books = books[:limit]
                logger.info(f"Limited to {limit} books for processing")
            
            # Ensure ChromaDB collection exists
            collection = self.chroma_manager.get_or_create_collection(namespace)
            
            # Get existing book IDs to avoid duplicates (unless force_update)
            existing_ids = set()
            if not force_update:
                try:
                    # Get all existing document IDs that start with 'book_'
                    existing_docs = collection.get()
                    if existing_docs and existing_docs['ids']:
                        existing_ids = {doc_id for doc_id in existing_docs['ids'] if doc_id.startswith('book_')}
                    logger.info(f"Found {len(existing_ids)} existing books in ChromaDB")
                except Exception as e:
                    logger.warning(f"Could not check existing books: {e}")
            
            # Process each book
            batch_documents = []
            batch_metadatas = []
            batch_ids = []
            batch_size = 10  # Process in batches to avoid memory issues
            
            for book in books:
                try:
                    books_processed += 1
                    
                    # Prepare book for embedding
                    document = self.mongo_manager.prepare_book_for_embedding(book)
                    doc_id = document['id']
                    
                    # Skip if already exists and not forcing update
                    if not force_update and doc_id in existing_ids:
                        books_skipped += 1
                        logger.debug(f"Skipping existing book: {book.get('title', doc_id)}")
                        continue
                    
                    # Add to batch
                    batch_documents.append(document['text'])
                    batch_metadatas.append(document['metadata'])
                    batch_ids.append(doc_id)
                    
                    # Process batch when it reaches batch_size
                    if len(batch_documents) >= batch_size:
                        success_count = await self._process_batch(
                            collection, batch_documents, batch_metadatas, batch_ids
                        )
                        books_ingested += success_count
                        
                        # Reset batch
                        batch_documents = []
                        batch_metadatas = []
                        batch_ids = []
                    
                except Exception as e:
                    error_msg = f"Error processing book {book.get('title', 'Unknown')}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            # Process remaining documents in final batch
            if batch_documents:
                success_count = await self._process_batch(
                    collection, batch_documents, batch_metadatas, batch_ids
                )
                books_ingested += success_count
            
            processing_time = time.time() - start_time
            
            stats = MongoBookIngestStats(
                total_books_found=total_books_found,
                books_processed=books_processed,
                books_ingested=books_ingested,
                books_skipped=books_skipped,
                errors=len(errors),
                processing_time_seconds=round(processing_time, 2)
            )
            
            logger.info(f"Book ingestion completed: {books_ingested} ingested, {books_skipped} skipped, {len(errors)} errors")
            return stats, errors
            
        except Exception as e:
            error_msg = f"Fatal error during book ingestion: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            
            processing_time = time.time() - start_time
            stats = MongoBookIngestStats(
                total_books_found=total_books_found,
                books_processed=books_processed,
                books_ingested=books_ingested,
                books_skipped=books_skipped,
                errors=len(errors),
                processing_time_seconds=round(processing_time, 2)
            )
            
            return stats, errors
    
    async def _process_batch(
        self, 
        collection, 
        documents: List[str], 
        metadatas: List[Dict[str, Any]], 
        ids: List[str]
    ) -> int:
        """Process a batch of documents and return number of successful ingestions"""
        try:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logger.debug(f"Successfully ingested batch of {len(documents)} books")
            return len(documents)
            
        except Exception as e:
            logger.error(f"Error ingesting batch: {e}")
            # Try to ingest individual documents if batch fails
            success_count = 0
            for i, (doc, metadata, doc_id) in enumerate(zip(documents, metadatas, ids)):
                try:
                    collection.add(
                        documents=[doc],
                        metadatas=[metadata],
                        ids=[doc_id]
                    )
                    success_count += 1
                except Exception as individual_error:
                    logger.error(f"Error ingesting individual book {doc_id}: {individual_error}")
            
            return success_count
    
    async def get_book_ingestion_status(self, namespace: str = "reference_books") -> Dict[str, Any]:
        """Get status of books in ChromaDB"""
        try:
            collection = self.chroma_manager.get_or_create_collection(namespace)
            
            # Get all documents
            all_docs = collection.get()
            
            if not all_docs or not all_docs['ids']:
                return {
                    "total_books": 0,
                    "book_ids": [],
                    "subjects": [],
                    "difficulties": []
                }
            
            # Filter for book documents
            book_docs = []
            book_subjects = set()
            book_difficulties = set()
            
            for i, doc_id in enumerate(all_docs['ids']):
                if doc_id.startswith('book_'):
                    book_docs.append(doc_id)
                    
                    # Extract metadata if available
                    if all_docs.get('metadatas') and i < len(all_docs['metadatas']):
                        metadata = all_docs['metadatas'][i]
                        if metadata.get('subject'):
                            book_subjects.add(metadata['subject'])
                        if metadata.get('difficulty'):
                            book_difficulties.add(metadata['difficulty'])
            
            return {
                "total_books": len(book_docs),
                "book_ids": book_docs[:10],  # Show first 10 IDs
                "subjects": list(book_subjects),
                "difficulties": list(book_difficulties)
            }
            
        except Exception as e:
            logger.error(f"Error getting book ingestion status: {e}")
            return {
                "error": str(e),
                "total_books": 0,
                "book_ids": [],
                "subjects": [],
                "difficulties": []
            }
    
    async def search_ingested_books(
        self, 
        query: str, 
        namespace: str = "reference_books",
        n_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Search ingested books in ChromaDB"""
        try:
            collection = self.chroma_manager.get_or_create_collection(namespace)
            
            # Search for books
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"type": "reference_book"}  # Filter for reference books
            )
            
            search_results = []
            if results and results['ids'] and results['ids'][0]:
                for i, doc_id in enumerate(results['ids'][0]):
                    result = {
                        "id": doc_id,
                        "distance": results['distances'][0][i] if results.get('distances') else 0.0,
                        "metadata": results['metadatas'][0][i] if results.get('metadatas') else {},
                        "document": results['documents'][0][i] if results.get('documents') else ""
                    }
                    search_results.append(result)
            
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching ingested books: {e}")
            return []

# Global book ingestion service instance
book_ingestion_service = None

def get_book_ingestion_service(chroma_manager: ChromaDBManager) -> BookIngestionService:
    """Get or create book ingestion service instance"""
    global book_ingestion_service
    
    if book_ingestion_service is None:
        book_ingestion_service = BookIngestionService(chroma_manager)
    
    return book_ingestion_service
