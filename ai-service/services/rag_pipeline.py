"""
RAG Pipeline service for StudySpace AI platform.
Handles document processing, retrieval, and LLM chain initialization.
"""
import os
import pickle
import logging
from pathlib import Path
from typing import Optional, Tuple, List

# LangChain and related imports
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import PyMuPDFLoader, TextLoader
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain_groq import ChatGroq

# Local imports
from .config import RAGConfig
from .document_manager import DocumentManager

logger = logging.getLogger(__name__)

class RAGPipeline:
    """RAG Pipeline for StudySpace AI platform."""
    
    def __init__(self, config: RAGConfig, document_manager: DocumentManager):
        self.config = config
        self.document_manager = document_manager
        self.embeddings = None
        self.vector_store = None
        self.retriever = None
        self.llm = None
        self.document_chain = None
        
        # Initialize embeddings
        self._initialize_embeddings()
        
    def _initialize_embeddings(self):
        """Initialize the embedding model."""
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.config.EMBEDDING_MODEL_NAME,
                model_kwargs=self.config.MODEL_KWARGS
            )
            logger.info(f"Initialized embeddings with model: {self.config.EMBEDDING_MODEL_NAME}")
        except Exception as e:
            logger.error(f"Error initializing embeddings: {e}")
            raise

    def _load_and_split_docs(self, file_paths: List[str]) -> List:
        """Loads and splits document content into chunks for retrieval."""
        all_docs = []
        
        for file_path in file_paths:
            path = Path(file_path)
            loader = None
            
            try:
                if path.suffix.lower() == ".pdf":
                    loader = PyMuPDFLoader(str(path))
                elif path.suffix.lower() in ['.txt', '.md', '.py', '.js', '.html', '.css']:
                    loader = TextLoader(str(path), encoding='utf-8')
                else:
                    logger.warning(f"Skipping unsupported file: {path.name}")
                    continue
                
                logger.info(f"Loading document: {path.name}")
                all_docs.extend(loader.load())
                
            except Exception as e:
                logger.error(f"Error loading document {path.name}: {e}")
                continue

        if not all_docs:
            return []

        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=150
        )
        
        split_docs = text_splitter.split_documents(all_docs)
        logger.info(f"Created {len(split_docs)} chunks from {len(file_paths)} document(s)")
        return split_docs

    def _initialize_llm(self):
        """Initialize the LLM based on configuration."""
        try:
            if not os.getenv("GROQ_API_KEY"):
                logger.error("Groq API key not found. LLM disabled.")
                return None
            
            self.llm = ChatGroq(
                model_name=self.config.API_MODEL_NAME,
                temperature=0.1,
                groq_api_key=os.getenv("GROQ_API_KEY")
            )
            logger.info(f"Initialized LLM with model: {self.config.API_MODEL_NAME}")
            return self.llm
            
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            return None

    def _create_document_chain(self):
        """Creates the LangChain chain for answering questions based on context."""
        if not self.llm:
            return None
            
        # Educational-focused prompt template
        qa_prompt = ChatPromptTemplate.from_template(
            """You are an expert educational AI assistant for StudySpace. Answer the question based *only* on the provided context from the course materials.
            
            Provide clear, well-structured explanations that help students learn. Use markdown formatting for better readability.
            Break down complex concepts into digestible parts. If examples would help, provide them.
            
            If the answer is not in the provided context, state that clearly and suggest what additional information might be needed.

            Context from course materials:
            {context}

            Student Question: {input}

            Educational Response:
            """
        )
        
        try:
            self.document_chain = create_stuff_documents_chain(self.llm, qa_prompt)
            logger.info("Document chain created successfully")
            return self.document_chain
        except Exception as e:
            logger.error(f"Error creating document chain: {e}")
            return None

    def _load_or_create_bm25(self) -> Optional[BM25Retriever]:
        """Creates or loads a cached BM25 retriever."""
        all_doc_paths = self.document_manager.get_all_paths()
        if not all_doc_paths:
            return None

        bm25_cache_file = Path(self.config.STORAGE_DIR) / "bm25_cache.pkl"
        
        # Rebuild if cache is missing or if there are new, unindexed docs
        if not bm25_cache_file.exists() or self.document_manager.get_unindexed_paths():
            logger.info("Building new BM25 index...")
            all_docs_for_bm25 = self._load_and_split_docs(all_doc_paths)
            if not all_docs_for_bm25:
                return None
                
            try:
                bm25_retriever = BM25Retriever.from_documents(all_docs_for_bm25)
                with open(bm25_cache_file, "wb") as f:
                    pickle.dump(bm25_retriever, f)
                logger.info("BM25 retriever built and cached")
            except Exception as e:
                logger.error(f"Error creating BM25 retriever: {e}")
                return None
        else:
            logger.info("Loading cached BM25 retriever...")
            try:
                with open(bm25_cache_file, "rb") as f:
                    bm25_retriever = pickle.load(f)
            except Exception as e:
                logger.error(f"Error loading BM25 cache: {e}")
                return None
        
        bm25_retriever.k = 15
        return bm25_retriever

    def build_pipeline(self) -> Tuple[Optional[object], Optional[object]]:
        """
        Build the complete RAG pipeline.
        Returns the retriever and the document chain.
        """
        logger.info("Building RAG pipeline...")
        
        try:
            # Process new documents and update ChromaDB
            unindexed_paths = self.document_manager.get_unindexed_paths()
            db_path = Path(self.config.CHROMA_DB_PATH)
            
            if unindexed_paths:
                logger.info("Processing new documents for vector store...")
                new_docs_split = self._load_and_split_docs(unindexed_paths)
                
                if db_path.exists() and any(db_path.iterdir()):
                    # Add to existing vector store
                    self.vector_store = Chroma(
                        persist_directory=str(db_path),
                        embedding_function=self.embeddings
                    )
                    self.vector_store.add_documents(new_docs_split)
                else:
                    # Create new vector store
                    self.vector_store = Chroma.from_documents(
                        new_docs_split,
                        self.embeddings,
                        persist_directory=str(db_path)
                    )
                
                # Mark documents as indexed
                for path in unindexed_paths:
                    self.document_manager.mark_as_indexed(path)
                logger.info("New documents indexed in Chroma DB")
            
            # Load existing vector store
            if not db_path.exists() or not any(db_path.iterdir()):
                logger.error("No documents processed. Please upload documents first.")
                return None, None
                
            if not self.vector_store:
                self.vector_store = Chroma(
                    persist_directory=str(db_path),
                    embedding_function=self.embeddings
                )
            
            vector_retriever = self.vector_store.as_retriever(search_kwargs={"k": 15})
            
            # Create BM25 retriever
            bm25_retriever = self._load_or_create_bm25()
            if not bm25_retriever:
                logger.warning("BM25 retriever not available, using only vector retriever")
                self.retriever = vector_retriever
            else:
                # Create ensemble retriever
                ensemble_retriever = EnsembleRetriever(
                    retrievers=[bm25_retriever, vector_retriever],
                    weights=[0.5, 0.5]
                )
                
                # Add reranker for better results
                try:
                    cross_encoder = HuggingFaceCrossEncoder(
                        model_name=self.config.RERANKER_MODEL_NAME,
                        model_kwargs=self.config.MODEL_KWARGS
                    )
                    compressor = CrossEncoderReranker(model=cross_encoder, top_n=5)
                    self.retriever = ContextualCompressionRetriever(
                        base_compressor=compressor,
                        base_retriever=ensemble_retriever
                    )
                    logger.info("Reranker added to retrieval pipeline")
                except Exception as e:
                    logger.warning(f"Could not initialize reranker, using ensemble retriever: {e}")
                    self.retriever = ensemble_retriever
            
            # Initialize LLM and document chain
            self._initialize_llm()
            self._create_document_chain()
            
            logger.info("RAG pipeline built successfully")
            return self.retriever, self.document_chain
            
        except Exception as e:
            logger.error(f"Error building RAG pipeline: {e}")
            return None, None

    def query(self, question: str) -> Optional[str]:
        """
        Query the RAG pipeline with a question.
        Returns the answer or None if there's an error.
        """
        if not self.retriever or not self.document_chain:
            logger.error("RAG pipeline not properly initialized")
            return None
        
        try:
            # Retrieve relevant documents
            docs = self.retriever.get_relevant_documents(question)
            
            # Generate answer using the document chain
            result = self.document_chain.invoke({
                "input": question,
                "context": docs
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return None

    def get_pipeline_status(self) -> dict:
        """Get the current status of the RAG pipeline."""
        return {
            "embeddings_loaded": self.embeddings is not None,
            "vector_store_loaded": self.vector_store is not None,
            "retriever_ready": self.retriever is not None,
            "llm_ready": self.llm is not None,
            "document_chain_ready": self.document_chain is not None,
            "total_documents": len(self.document_manager.documents),
            "unindexed_documents": len(self.document_manager.get_unindexed_paths())
        }
