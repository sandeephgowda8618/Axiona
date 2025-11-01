# Test Configuration for PDF Search Test Suite
# ============================================

# Test suite settings
TEST_SETTINGS = {
    # Number of results to retrieve for each test query
    "default_top_k": 5,
    
    # Minimum success rate threshold for test suite to pass
    "success_rate_threshold": 70,
    
    # Maximum time allowed per query (seconds)
    "query_timeout": 30,
    
    # Enable detailed logging
    "verbose_logging": True,
    
    # Save detailed results to files
    "save_results": True
}

# Expected file patterns for different domains
DOMAIN_PATTERNS = {
    "python": ["python", "py", "programming", "script"],
    "machine_learning": ["machine learning", "ML", "AI", "neural", "deep learning"],
    "algorithms": ["algorithm", "DSA", "data structure", "sorting", "searching"],
    "operating_systems": ["operating system", "OS", "process", "memory", "kernel"],
    "databases": ["database", "DBMS", "SQL", "relational", "NoSQL"],
    "networking": ["network", "TCP", "IP", "protocol", "internet"],
    "web_development": ["web", "HTML", "CSS", "JavaScript", "frontend", "backend"],
    "security": ["security", "crypto", "encryption", "cybersecurity"],
    "mathematics": ["math", "statistics", "probability", "calculus", "algebra"],
    "software_engineering": ["software engineering", "design pattern", "OOP", "SOLID"]
}

# Test queries with expected domains
TEST_QUERIES = [
    {
        "query": "Python programming tutorial basics syntax",
        "expected_domains": ["python", "programming"],
        "description": "Python programming fundamentals",
        "priority": "high"
    },
    {
        "query": "machine learning algorithms neural networks deep learning",
        "expected_domains": ["machine_learning", "algorithms"],
        "description": "Machine learning and AI concepts",
        "priority": "high"
    },
    {
        "query": "data structures algorithms arrays linked lists trees sorting",
        "expected_domains": ["algorithms"],
        "description": "Data structures and algorithms",
        "priority": "high"
    },
    {
        "query": "operating systems process management memory scheduling",
        "expected_domains": ["operating_systems"],
        "description": "Operating systems fundamentals",
        "priority": "high"
    },
    {
        "query": "database management SQL relational DBMS normalization",
        "expected_domains": ["databases"],
        "description": "Database management concepts",
        "priority": "high"
    },
    {
        "query": "software engineering design patterns object oriented programming",
        "expected_domains": ["software_engineering"],
        "description": "Software engineering and design patterns",
        "priority": "medium"
    },
    {
        "query": "computer networks TCP IP protocols networking communication",
        "expected_domains": ["networking"],
        "description": "Computer networking protocols",
        "priority": "medium"
    },
    {
        "query": "web development HTML CSS JavaScript frontend backend",
        "expected_domains": ["web_development"],
        "description": "Web development technologies",
        "priority": "medium"
    },
    {
        "query": "cybersecurity encryption cryptography security protocols",
        "expected_domains": ["security"],
        "description": "Cybersecurity and cryptography",
        "priority": "medium"
    },
    {
        "query": "mathematics statistics probability calculus linear algebra",
        "expected_domains": ["mathematics"],
        "description": "Mathematics and statistics",
        "priority": "low"
    }
]

# MongoDB collection validation queries
VALIDATION_QUERIES = [
    {"field": "file_url", "exists": True, "description": "All books have file URLs"},
    {"field": "title", "exists": True, "description": "All books have titles"},
    {"field": "subject", "exists": True, "description": "All books have subjects"},
    {"field": "category", "in": ["reference", "textbook", "manual"], "description": "Valid categories"}
]

# ChromaDB validation checks
CHROMADB_CHECKS = [
    {"check": "collection_exists", "description": "ChromaDB collection exists"},
    {"check": "documents_count", "min_count": 50, "description": "Sufficient documents indexed"},
    {"check": "metadata_completeness", "required_fields": ["file_name", "title"], "description": "Required metadata fields present"}
]

# Report settings
REPORT_SETTINGS = {
    "include_query_details": True,
    "include_top_results": 3,
    "include_performance_metrics": True,
    "save_failed_queries": True,
    "generate_recommendations": True
}
