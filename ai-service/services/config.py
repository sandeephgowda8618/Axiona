"""
StudySpace RAG Configuration
Adapted from prob.lm repository for educational content processing
"""

import torch
from pathlib import Path
from rich.console import Console

# Console for logging
console = Console()

# ==============================================================================
# PATHS AND DIRECTORIES
# ==============================================================================
BASE_DIR = Path(__file__).parent.parent
STORAGE_DIR = BASE_DIR / "storage"
DB_PATH = STORAGE_DIR / "chroma_db"
BM25_CACHE_FILE = STORAGE_DIR / "bm25_retriever.pkl"

# Create directories if they don't exist
STORAGE_DIR.mkdir(exist_ok=True)
DB_PATH.mkdir(exist_ok=True)

# ==============================================================================
# GPU DETECTION & SETUP
# ==============================================================================
def detect_gpu_setup():
    """Detects and configures GPU for optimal performance."""
    if torch.cuda.is_available():
        device_name = torch.cuda.get_device_name(0)
        memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        console.print(f"[bold green]GPU Detected: {device_name} ({memory_gb:.1f} GB)[/bold green]")
        return {'device': 'cuda', 'name': device_name, 'memory_gb': memory_gb}
    else:
        console.print("[yellow]No GPU detected. Using CPU for processing.[/yellow]")
        return {'device': 'cpu', 'name': 'cpu', 'memory_gb': 0}

# ==============================================================================
# GLOBAL CONFIGURATION
# ==============================================================================
GPU_CONFIG = detect_gpu_setup()
MODEL_KWARGS = {'device': GPU_CONFIG['device']}

# Application toggles
USE_API_LLM = False              # True for Groq API, False for local Ollama
USE_SEMANTIC_CHUNKING = False    # True for semantic chunking, False for recursive
PDF_SUPPORT = True               # Enable PDF processing
RERANKING_ENABLED = True         # Enable cross-encoder reranking

# Model configurations
LOCAL_MODEL_NAME = "llama3.2:1b"                                    # Ollama model
API_MODEL_NAME = "gemma2-9b-it"                                     # Groq model
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"     # Embeddings
RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"        # Reranker

# StudySpace-specific configurations
SUBJECTS = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
    "Data Structures", "Algorithms", "Database Systems", "Operating Systems",
    "Machine Learning", "Artificial Intelligence", "Software Engineering"
]

# RAG pipeline settings
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
TOP_K_RETRIEVAL = 5
RERANKER_TOP_K = 3

# Quiz generation settings
QUIZ_DIFFICULTIES = ["beginner", "intermediate", "advanced"]
QUIZ_TYPES = ["multiple_choice", "true_false", "short_answer"]
MAX_QUIZ_QUESTIONS = 20

# Roadmap generation settings
DEFAULT_ROADMAP_WEEKS = 4
ROADMAP_DIFFICULTIES = ["beginner", "intermediate", "advanced"]

# ==============================================================================
# FEATURE AVAILABILITY CHECKS
# ==============================================================================
try:
    import langchain_experimental
    SEMANTIC_CHUNKING_AVAILABLE = True
except ImportError:
    SEMANTIC_CHUNKING_AVAILABLE = False
    if USE_SEMANTIC_CHUNKING:
        console.print("[yellow]Semantic chunking disabled - langchain_experimental not available[/yellow]")
        USE_SEMANTIC_CHUNKING = False

try:
    import groq
    GROQ_API_AVAILABLE = True
except ImportError:
    GROQ_API_AVAILABLE = False
    if USE_API_LLM:
        console.print("[yellow]Groq API disabled - groq package not available[/yellow]")

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    console.print("[red]Warning: Ollama not available. Install ollama package.[/red]")

# ==============================================================================
# PROMPT TEMPLATES
# ==============================================================================

# Chat prompt for academic questions
ACADEMIC_CHAT_PROMPT = """You are StudyBuddy, an AI tutor specializing in academic subjects. Use the provided context from course materials to answer the student's question accurately and helpfully.

Context from course materials:
{context}

Student's question: {question}

Instructions:
1. Answer based primarily on the provided context
2. If the context doesn't contain relevant information, clearly state this
3. Provide clear, educational explanations suitable for students
4. Include examples when helpful
5. Suggest related topics for further study

Answer:"""

# Roadmap generation prompt
ROADMAP_PROMPT = """Create a detailed study roadmap for the following requirements:

Subject: {subject}
Duration: {duration_weeks} weeks
Difficulty Level: {difficulty_level}
Learning Goals: {learning_goals}

Context from course materials:
{context}

Create a structured weekly plan including:
1. Week-by-week topic breakdown
2. Learning objectives for each week
3. Recommended study hours per week
4. Key concepts and skills to master
5. Suggested practice problems or projects
6. Prerequisites and preparation needed

Format as a JSON structure with weeks, topics, objectives, and time estimates.

Roadmap:"""

# Quiz generation prompt
QUIZ_PROMPT = """Generate {num_questions} quiz questions about {topic} in {subject} at {difficulty} level.

Context from course materials:
{context}

Requirements:
1. Create diverse question types (multiple choice, true/false, short answer)
2. Include clear, accurate questions with correct answers
3. For multiple choice, provide 4 options with only one correct answer
4. Include brief explanations for correct answers
5. Ensure questions test understanding, not just memorization

Format as JSON with question, options (if applicable), correct_answer, explanation, and type.

Quiz Questions:"""
