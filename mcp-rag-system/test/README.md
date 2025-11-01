# PDF Search Test Suite
======================

This directory contains comprehensive tests for the RAG (Retrieval-Augmented Generation) pipeline, specifically testing PDF search functionality across our MongoDB and ChromaDB integration.

## Overview

The test suite validates that:
- All PDF documents are properly indexed in ChromaDB
- Search queries return relevant results from the correct MongoDB files
- Metadata is correctly associated with search results
- The system handles various domain-specific queries (CS, ML, algorithms, etc.)

## Test Files

### `test_pdf_search_queries.py`
The main comprehensive test suite that runs 15+ real-world search queries across different domains:
- Computer Science fundamentals
- Programming languages (Python, etc.)
- Machine Learning and AI
- Data Structures and Algorithms
- Operating Systems
- Database Management
- Software Engineering
- Networking
- Web Development
- Cybersecurity
- Mathematics and Statistics

**Usage:**
```bash
cd /Users/sandeeph/Documents/s2/Axiona/mcp-rag-system
python test/test_pdf_search_queries.py
```

**Output:**
- Detailed console logs showing test progress
- Test results log file: `test/test_results_YYYYMMDD_HHMMSS.log`
- JSON report file: `test/test_report_YYYYMMDD_HHMMSS.json`

### `quick_search_test.py`
A lightweight test script for quick validation of search functionality.

**Usage:**
```bash
python test/quick_search_test.py
```

### `test_config.py`
Configuration file containing:
- Test settings and thresholds
- Domain patterns for result validation
- Pre-defined test queries
- MongoDB and ChromaDB validation checks

## Test Results Interpretation

### Success Criteria
- **Success Rate Threshold:** 70% of tests must pass
- **Result Relevance:** Search results must contain expected domain keywords
- **MongoDB Integration:** Correct file names must be returned from MongoDB
- **Performance:** Queries should complete within reasonable time

### Test Output
Each test shows:
- ✅ **PASSED**: Query returned relevant results with expected domains
- ❌ **FAILED**: Query failed or returned irrelevant results

### Report Structure
```json
{
  "test_summary": {
    "total_tests": 15,
    "passed_tests": 13,
    "failed_tests": 2,
    "success_rate": 86.67,
    "timestamp": "2024-11-01T22:45:30"
  },
  "test_results": [...],
  "recommendations": [...]
}
```

## Running Tests

### Prerequisites
1. MongoDB must be running with populated books collection
2. ChromaDB must be populated with PDF content (run ingestion script first)
3. All dependencies installed (`pip install -r requirements.txt`)

### Full Test Suite
```bash
# Navigate to project root
cd /Users/sandeeph/Documents/s2/Axiona/mcp-rag-system

# Run comprehensive tests
python test/test_pdf_search_queries.py

# Run quick validation
python test/quick_search_test.py
```

### Expected Behavior
1. **Setup Phase**: Connects to MongoDB and ChromaDB, verifies document counts
2. **Test Execution**: Runs each query and validates results
3. **Reporting**: Generates detailed logs and JSON reports
4. **Cleanup**: Closes database connections

## Troubleshooting

### Common Issues

**No results found:**
- Verify ChromaDB ingestion completed successfully
- Check document count: should be ~97 reference PDFs
- Run ingestion script: `python scripts/main_reference_textbook_ingest.py`

**MongoDB connection errors:**
- Verify MongoDB is running
- Check connection string in `.env` file
- Ensure books collection exists with file_url field

**Low success rate:**
- Review failed queries in detailed logs
- Check if document content matches expected domains
- Consider updating search parameters or expanding knowledge base

**Missing dependencies:**
- Install requirements: `pip install -r requirements.txt`
- Verify Python environment has all necessary packages

## Test Development

### Adding New Tests
1. Add query configuration to `test_config.py`
2. Update domain patterns if needed
3. Run test suite to validate new queries

### Custom Test Queries
```python
# Example: Add to TEST_QUERIES in test_config.py
{
    "query": "your custom search query",
    "expected_domains": ["domain1", "domain2"],
    "description": "Test description",
    "priority": "high"  # high, medium, low
}
```

### Performance Monitoring
The test suite tracks:
- Query execution time
- Result relevance scores
- MongoDB file name accuracy
- ChromaDB document retrieval success

## Integration with CI/CD

For automated testing in CI/CD pipelines:

```bash
# Run tests with exit codes
python test/test_pdf_search_queries.py
echo "Exit code: $?"

# Generate machine-readable reports
python test/test_pdf_search_queries.py --format=json --output=test_results.json
```

## Maintenance

### Regular Testing
- Run tests after each ingestion update
- Validate after MongoDB schema changes
- Test with new PDF additions to knowledge base

### Performance Optimization
- Monitor query response times
- Adjust ChromaDB search parameters if needed
- Update test thresholds based on content quality

---

**Note**: This test suite is designed to work with the specific MongoDB and ChromaDB setup for the Axiona educational platform's RAG pipeline.
