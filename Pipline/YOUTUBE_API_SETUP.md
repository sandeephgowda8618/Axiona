# YouTube API Video Search Configuration
# =====================================

## Overview
The enhanced video search now uses YouTube Data API v3 to dynamically find relevant educational content instead of relying on a limited pre-stored video database.

## Setup Instructions

### 1. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "YouTube Data API v3" 
4. Go to "Credentials" and create an API Key
5. (Optional) Restrict the API key to YouTube Data API v3

### 2. Configure Environment Variable

Add your API key to the environment:

```bash
# Option 1: Export in terminal
export YOUTUBE_API_KEY="your_api_key_here"

# Option 2: Add to .env file
echo "YOUTUBE_API_KEY=your_api_key_here" >> .env

# Option 3: Add to your shell profile
echo 'export YOUTUBE_API_KEY="your_api_key_here"' >> ~/.bashrc
```

### 3. Test the Integration

```bash
# Test YouTube agent
python test_youtube_agent.py

# Test enhanced filtering with YouTube
python test_enhanced_filtering_fixed.py
```

## Features

### Dynamic Video Search
- **Real-time YouTube Search**: Finds current, relevant educational content
- **Subject-Specific Filtering**: Uses curated search terms for each subject
- **Educational Channel Preference**: Prioritizes known educational channels
- **Duration Filtering**: Ensures appropriate video lengths (30min-4hr for oneshots)

### Quality Scoring
- **Relevance Scoring**: Matches video content to phase concepts
- **Educational Keywords**: Prefers tutorials, courses, comprehensive guides
- **Channel Reputation**: Weights results from known educational channels
- **Duration Appropriateness**: Scores based on optimal learning durations

### Intelligent Fallback
- **API Rate Limiting**: Built-in rate limiting and caching
- **Graceful Degradation**: Falls back to database search if API fails
- **Offline Mode**: Works without API key using fallback videos

### Resource Allocation
- **2 Playlists per Phase**: Comprehensive coverage
- **1 Oneshot per Phase**: Quick overview option
- **Subject Filtering**: Only returns relevant educational content
- **Difficulty Matching**: Aligns with phase difficulty levels

## API Limits & Costs

### YouTube API Quotas
- **Daily Quota**: 10,000 units per day (free tier)
- **Search Cost**: 100 units per search request
- **Video Details**: 1 unit per video
- **Estimated Usage**: ~150 searches per day with current implementation

### Caching Strategy
- **6-hour Cache**: Reduces API calls for repeated searches  
- **Subject-based Caching**: Cache by subject + difficulty + concepts
- **Memory Cache**: Simple in-memory cache (can be upgraded to Redis)

## Educational Channels

The system prioritizes content from verified educational channels:

### Operating Systems
- Neso Academy, GATE Smashers, Knowledge Gate
- MIT OpenCourseWare, Stanford Online
- Education 4u, Tutorials Point

### Data Structures & Algorithms  
- mycodeschool, Abdul Bari, Jenny's lectures
- GeeksforGeeks, HackerRank, Programiz
- MIT OpenCourseWare, Stanford Online

### Databases
- Gate Smashers, Database Star
- Programming with Mosh, MySQL Tutorial

### Computer Networks
- Neso Academy, Network Direction
- Cisco, Network Chuck

### Mathematics
- Khan Academy, Professor Leonard
- 3Blue1Brown, MIT OpenCourseWare

## Search Strategy

### Query Building
```python
# Subject-specific terms
"Operating Systems": {
    "core_terms": ["operating system", "OS", "process management"], 
    "advanced_terms": ["kernel", "system calls", "threading"],
    "exclude_terms": ["installation", "troubleshooting"]
}

# Dynamic query construction
queries = [
    f"{subject} complete course tutorial",
    f"{concept} {subject} explained", 
    f"{advanced_term} comprehensive guide"
]
```

### Content Types
- **Playlists**: Multi-video series for comprehensive learning
- **Oneshots**: Single comprehensive videos for quick overview
- **Duration Filters**: 30min-20hr for playlists, 30min-4hr for oneshots

## Integration Points

### Enhanced Filtering
```python
# Automatic YouTube integration
result = enhanced_filtering.filter_videos_by_phase(
    subject="Operating Systems",
    phase_concepts=["processes", "threads"], 
    phase_difficulty="beginner"
)
# Returns: 2 playlists + 1 oneshot from YouTube API
```

### Roadmap Builder
```python
# Seamless integration in roadmap generation
phase["resources"]["videos"] = {
    "playlists": [...],  # From YouTube API
    "oneshot": {...},    # From YouTube API  
    "source": "youtube_api"
}
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   ```bash
   # Check environment variable
   echo $YOUTUBE_API_KEY
   
   # Test API key
   python test_youtube_agent.py
   ```

2. **Quota Exceeded**
   - Check Google Cloud Console quota usage
   - Wait 24 hours for quota reset
   - Upgrade to paid plan if needed

3. **No Results Found**
   - Check subject spelling
   - Verify concepts are educational
   - Review search terms in youtube_video_agent.py

4. **Fallback Mode**
   ```python
   # System automatically falls back to:
   # 1. Database search (if videos exist)
   # 2. Fallback video templates
   # 3. Error reporting with suggestions
   ```

### Debug Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enables detailed logging:
# - API request/response details
# - Search query construction  
# - Scoring and selection process
# - Cache hit/miss information
```

## Performance Optimization

### Caching Recommendations
```python
# Production setup:
# 1. Use Redis for persistent caching
# 2. Implement cache warming for popular subjects
# 3. Add cache invalidation for updated content
```

### API Efficiency  
```python
# Current optimizations:
# 1. Batch requests where possible
# 2. Cache results for 6 hours
# 3. Rate limiting to prevent quota exhaustion
# 4. Intelligent query reduction
```

## Future Enhancements

1. **Advanced Filtering**: Transcript analysis, closed captions
2. **Quality Metrics**: Like/dislike ratios, comment analysis
3. **Personalization**: User preference learning
4. **Multi-language Support**: Non-English educational content
5. **Live Content**: Integration with live streams and premieres

## Security Notes

- **API Key Protection**: Never commit API keys to version control
- **Rate Limiting**: Built-in protection against API abuse
- **Error Handling**: Graceful fallback prevents system failure
- **Input Validation**: All search terms are validated and sanitized
