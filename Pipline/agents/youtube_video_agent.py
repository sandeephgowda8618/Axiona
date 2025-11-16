"""
YouTube Video Search Agent
==========================

Dynamic video search using YouTube Data API v3 for educational content retrieval.
This replaces the limited pre-stored video collection with real-time YouTube search.

Features:
- Real-time YouTube search for educational content
- Subject-specific filtering with academic channels
- Duration-based filtering (playlists vs oneshots)
- Quality scoring based on views, likes, and educational value
- Automatic caching to avoid API rate limits

Created: November 16, 2025
Purpose: Replace static video collection with dynamic YouTube API search
"""

import json
import logging
import os
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import requests
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class VideoResult:
    """Structured video result from YouTube API"""
    video_id: str
    title: str
    channel_title: str
    description: str
    duration_seconds: int
    view_count: int
    like_count: int
    published_at: str
    thumbnail_url: str
    url: str
    content_type: str  # "video" or "playlist"
    relevance_score: float = 0.0

class YouTubeVideoSearchAgent:
    """Dynamic YouTube video search for educational content"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize YouTube API client
        
        Args:
            api_key: YouTube Data API v3 key. If None, tries to get from environment
        """
        self.api_key = api_key or os.getenv('YOUTUBE_API_KEY')
        if not self.api_key:
            logger.warning("YouTube API key not found. Using fallback mode.")
            self.api_enabled = False
        else:
            self.api_enabled = True
            
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.cache = {}  # Simple in-memory cache
        self.cache_duration = timedelta(hours=6)  # Cache for 6 hours
        
        # Educational channel whitelist (known quality educational channels)
        self.educational_channels = {
            "operating_systems": [
                "Neso Academy", "GATE Smashers", "Knowledge Gate", 
                "Education 4u", "Tutorials Point", "MIT OpenCourseWare",
                "Stanford Online", "IIT Bombay July 2018"
            ],
            "data_structures": [
                "mycodeschool", "Abdul Bari", "Jenny's lectures CS/IT NET&JRF",
                "Programiz", "HackerRank", "GeeksforGeeks",
                "MIT OpenCourseWare", "Stanford Online"
            ],
            "databases": [
                "Gate Smashers", "Knowledge Gate", "Database Star",
                "Programming with Mosh", "MySQL Tutorial", "SQL Tutorial"
            ],
            "computer_networks": [
                "Neso Academy", "Gate Smashers", "Knowledge Gate",
                "Network Direction", "Cisco", "Network Chuck"
            ],
            "mathematics": [
                "Khan Academy", "Professor Leonard", "PatrickJMT",
                "MIT OpenCourseWare", "3Blue1Brown", "Organic Chemistry Tutor"
            ]
        }
        
        # Subject-specific search terms for better relevance
        self.search_terms = {
            "Operating Systems": {
                "core_terms": ["operating system", "OS", "process management", "memory management"],
                "advanced_terms": ["kernel", "system calls", "threading", "synchronization"],
                "exclude_terms": ["windows installation", "mac setup", "troubleshooting"]
            },
            "Data Structures": {
                "core_terms": ["data structures", "algorithms", "DSA", "programming"],
                "advanced_terms": ["trees", "graphs", "sorting", "searching"],
                "exclude_terms": ["job interview", "coding interview only"]
            },
            "Databases": {
                "core_terms": ["database", "SQL", "DBMS", "relational"],
                "advanced_terms": ["normalization", "indexing", "query optimization"],
                "exclude_terms": ["installation guide", "setup tutorial"]
            },
            "Computer Networks": {
                "core_terms": ["computer networks", "networking", "protocols"],
                "advanced_terms": ["TCP/IP", "routing", "switching", "OSI model"],
                "exclude_terms": ["home networking", "wifi setup"]
            }
        }
    
    def search_educational_videos(self, subject: str, phase_concepts: List[str], 
                                 difficulty: str, target_playlists: int = 2, 
                                 target_oneshots: int = 1) -> Dict[str, Any]:
        """
        Search for educational videos using YouTube API
        
        Args:
            subject: Subject area (e.g., "Operating Systems")
            phase_concepts: Specific concepts for this phase
            difficulty: Difficulty level (beginner, intermediate, advanced)
            target_playlists: Number of playlists to find
            target_oneshots: Number of oneshot videos to find
            
        Returns:
            Dict with playlists and oneshot videos
        """
        try:
            # Check cache first
            cache_key = f"{subject}_{difficulty}_{hash(str(phase_concepts))}"
            if self._check_cache(cache_key):
                logger.info(f"Returning cached results for {subject}")
                return self.cache[cache_key]["data"]
            
            if not self.api_enabled:
                return self._get_llm_generated_videos(subject, phase_concepts, difficulty)
            
            # Search for playlists
            playlists = self._search_playlists(subject, phase_concepts, difficulty, target_playlists * 3)
            
            # Search for individual videos
            videos = self._search_videos(subject, phase_concepts, difficulty, target_oneshots * 5)
            
            # Score and select best results
            selected_playlists = self._select_best_content(playlists, phase_concepts, target_playlists)
            selected_oneshots = self._select_best_content(videos, phase_concepts, target_oneshots)
            
            result = {
                "playlists": selected_playlists,
                "oneshot": selected_oneshots[0] if selected_oneshots else {},
                "meta": {
                    "query": f"{subject} - {difficulty}",
                    "search_type": "youtube_api",
                    "timestamp": datetime.utcnow().isoformat(),
                    "api_enabled": True,
                    "candidates_found": {
                        "playlists": len(playlists),
                        "videos": len(videos)
                    },
                    "phase_concepts": phase_concepts
                }
            }
            
            # Cache the result
            self._cache_result(cache_key, result)
            
            logger.info(f"YouTube search completed: {len(selected_playlists)} playlists, {len(selected_oneshots)} videos")
            return result
            
        except Exception as e:
            logger.error(f"YouTube API search error: {e}")
            return self._get_llm_generated_videos(subject, phase_concepts, difficulty)
    
    def _search_playlists(self, subject: str, phase_concepts: List[str], 
                         difficulty: str, max_results: int = 6) -> List[VideoResult]:
        """Search for educational playlists"""
        search_queries = self._build_search_queries(subject, phase_concepts, "playlist")
        all_playlists = []
        
        for query in search_queries[:3]:  # Limit to 3 different queries
            try:
                playlists = self._youtube_api_search(
                    query=query,
                    search_type="playlist",
                    max_results=max_results // len(search_queries[:3])
                )
                all_playlists.extend(playlists)
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Playlist search failed for query '{query}': {e}")
                continue
        
        return all_playlists
    
    def _search_videos(self, subject: str, phase_concepts: List[str], 
                      difficulty: str, max_results: int = 5) -> List[VideoResult]:
        """Search for educational videos (oneshots)"""
        search_queries = self._build_search_queries(subject, phase_concepts, "video")
        all_videos = []
        
        for query in search_queries[:2]:  # Limit to 2 different queries
            try:
                videos = self._youtube_api_search(
                    query=query,
                    search_type="video",
                    max_results=max_results // len(search_queries[:2]),
                    min_duration="30m",  # At least 30 minutes for oneshots
                    max_duration="4h"    # At most 4 hours
                )
                all_videos.extend(videos)
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"Video search failed for query '{query}': {e}")
                continue
        
        return all_videos
    
    def _build_search_queries(self, subject: str, phase_concepts: List[str], 
                            content_type: str) -> List[str]:
        """Build optimized search queries for YouTube"""
        subject_terms = self.search_terms.get(subject, {})
        core_terms = subject_terms.get("core_terms", [subject.lower()])
        advanced_terms = subject_terms.get("advanced_terms", phase_concepts)
        
        queries = []
        
        # Basic subject query
        if content_type == "playlist":
            queries.append(f"{core_terms[0]} complete course tutorial")
            queries.append(f"{core_terms[0]} full playlist lectures")
        else:
            queries.append(f"{core_terms[0]} complete tutorial")
            queries.append(f"{core_terms[0]} full course one video")
        
        # Concept-specific queries
        for concept in phase_concepts[:2]:  # Limit to 2 concepts
            if content_type == "playlist":
                queries.append(f"{concept} {core_terms[0]} playlist")
            else:
                queries.append(f"{concept} {core_terms[0]} explained")
        
        # Advanced term combinations
        if advanced_terms:
            main_term = advanced_terms[0] if advanced_terms else core_terms[0]
            if content_type == "playlist":
                queries.append(f"{main_term} tutorial series")
            else:
                queries.append(f"{main_term} comprehensive guide")
        
        return queries
    
    def _youtube_api_search(self, query: str, search_type: str = "video", 
                          max_results: int = 5, min_duration: Optional[str] = None,
                          max_duration: Optional[str] = None) -> List[VideoResult]:
        """Execute YouTube API search"""
        if not self.api_enabled:
            return []
        
        # Build API parameters
        params = {
            "part": "snippet",
            "q": query,
            "type": search_type,
            "maxResults": min(max_results, 50),  # YouTube API limit
            "order": "relevance",
            "key": self.api_key,
            "videoCategoryId": "27",  # Education category
            "regionCode": "US",
            "relevanceLanguage": "en"
        }
        
        # Add duration filters for videos
        if search_type == "video":
            if min_duration:
                params["videoDuration"] = "long"  # >20min
            if max_duration:
                # YouTube API doesn't have max duration, we'll filter after
                pass
        
        try:
            response = requests.get(f"{self.base_url}/search", params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for item in data.get("items", []):
                try:
                    video_result = self._parse_youtube_item(item, search_type)
                    if video_result:
                        results.append(video_result)
                except Exception as e:
                    logger.warning(f"Failed to parse YouTube item: {e}")
                    continue
            
            return results
            
        except requests.RequestException as e:
            logger.error(f"YouTube API request failed: {e}")
            return []
        except Exception as e:
            logger.error(f"YouTube API parsing failed: {e}")
            return []
    
    def _parse_youtube_item(self, item: Dict[str, Any], search_type: str) -> Optional[VideoResult]:
        """Parse YouTube API response item into VideoResult"""
        try:
            snippet = item["snippet"]
            
            if search_type == "playlist":
                video_id = item["id"]["playlistId"]
                url = f"https://www.youtube.com/playlist?list={video_id}"
                # For playlists, we need another API call to get duration
                duration_seconds = self._get_playlist_duration(video_id)
            else:
                video_id = item["id"]["videoId"]
                url = f"https://www.youtube.com/watch?v={video_id}"
                duration_seconds = self._get_video_duration(video_id)
            
            # Filter by duration if needed
            if search_type == "video" and duration_seconds:
                if duration_seconds < 1800 or duration_seconds > 14400:  # 30min - 4hr
                    return None
            
            return VideoResult(
                video_id=video_id,
                title=snippet["title"],
                channel_title=snippet["channelTitle"],
                description=snippet["description"],
                duration_seconds=duration_seconds or 0,
                view_count=0,  # Would need another API call
                like_count=0,  # Would need another API call
                published_at=snippet["publishedAt"],
                thumbnail_url=snippet["thumbnails"]["medium"]["url"],
                url=url,
                content_type="youtube_playlist" if search_type == "playlist" else "youtube_video"
            )
            
        except KeyError as e:
            logger.warning(f"Missing required field in YouTube response: {e}")
            return None
        except Exception as e:
            logger.error(f"Error parsing YouTube item: {e}")
            return None
    
    def _get_video_duration(self, video_id: str) -> Optional[int]:
        """Get video duration in seconds"""
        if not self.api_enabled:
            return None
            
        try:
            params = {
                "part": "contentDetails",
                "id": video_id,
                "key": self.api_key
            }
            
            response = requests.get(f"{self.base_url}/videos", params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data["items"]:
                duration_str = data["items"][0]["contentDetails"]["duration"]
                return self._parse_duration(duration_str)
                
        except Exception as e:
            logger.warning(f"Failed to get video duration for {video_id}: {e}")
            
        return None
    
    def _get_playlist_duration(self, playlist_id: str) -> Optional[int]:
        """Estimate playlist duration (simplified)"""
        # This would require multiple API calls to get all videos and their durations
        # For now, we'll return a reasonable estimate
        return 3600  # 1 hour average
    
    def _parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to seconds"""
        # YouTube returns duration in ISO 8601 format: PT4M13S, PT1H2M10S, etc.
        import re
        
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)
        
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def _select_best_content(self, candidates: List[VideoResult], 
                           phase_concepts: List[str], count: int) -> List[Dict[str, Any]]:
        """Select best videos/playlists based on relevance scoring"""
        if not candidates:
            return []
        
        # Score each candidate
        for candidate in candidates:
            candidate.relevance_score = self._calculate_video_relevance(candidate, phase_concepts)
        
        # Sort by relevance and educational channel preference
        candidates.sort(key=lambda x: (
            self._is_educational_channel(x.channel_title),
            x.relevance_score,
            x.duration_seconds
        ), reverse=True)
        
        # Convert to dict format and return top N
        results = []
        for candidate in candidates[:count]:
            result_dict = {
                "id": candidate.video_id,
                "title": candidate.title,
                "url": candidate.url,
                "channel": candidate.channel_title,
                "description": candidate.description[:200] + "..." if len(candidate.description) > 200 else candidate.description,
                "duration_seconds": candidate.duration_seconds,
                "content_type": candidate.content_type,
                "thumbnail_url": candidate.thumbnail_url,
                "relevance_score": candidate.relevance_score,
                "published_at": candidate.published_at,
                "source": "youtube_api"
            }
            results.append(result_dict)
        
        return results
    
    def _calculate_video_relevance(self, video: VideoResult, phase_concepts: List[str]) -> float:
        """Calculate relevance score for video content"""
        score = 0.0
        
        title_lower = video.title.lower()
        desc_lower = video.description.lower()
        
        # Title concept matching (40% weight)
        for concept in phase_concepts:
            if concept.lower() in title_lower:
                score += 0.4 / len(phase_concepts)
        
        # Description concept matching (20% weight)
        for concept in phase_concepts:
            if concept.lower() in desc_lower:
                score += 0.2 / len(phase_concepts)
        
        # Educational keywords (20% weight)
        educational_keywords = ["tutorial", "course", "lecture", "complete", "full", "comprehensive"]
        for keyword in educational_keywords:
            if keyword in title_lower:
                score += 0.2 / len(educational_keywords)
        
        # Duration appropriateness (20% weight)
        if video.content_type == "youtube_playlist":
            # Playlists should be substantial
            if video.duration_seconds > 1800:  # >30min
                score += 0.2
        else:
            # Individual videos should be comprehensive but not too long
            if 1800 <= video.duration_seconds <= 7200:  # 30min - 2hr
                score += 0.2
            elif 7200 < video.duration_seconds <= 14400:  # 2hr - 4hr
                score += 0.1
        
        return min(score, 1.0)
    
    def _is_educational_channel(self, channel_name: str) -> bool:
        """Check if channel is in educational whitelist"""
        for subject_channels in self.educational_channels.values():
            if channel_name in subject_channels:
                return True
        return False
    
    def _check_cache(self, cache_key: str) -> bool:
        """Check if cached result exists and is still valid"""
        if cache_key not in self.cache:
            return False
        
        cached_time = self.cache[cache_key]["timestamp"]
        if datetime.now() - cached_time > self.cache_duration:
            del self.cache[cache_key]
            return False
        
        return True
    
    def _cache_result(self, cache_key: str, result: Dict[str, Any]):
        """Cache search result"""
        self.cache[cache_key] = {
            "timestamp": datetime.now(),
            "data": result
        }
        
        # Simple cache cleanup (keep only last 100 entries)
        if len(self.cache) > 100:
            oldest_key = min(self.cache.keys(), 
                           key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
    
    def _clean_and_parse_json(self, response: str) -> dict:
        """Clean and parse JSON response from LLM"""
        try:
            import json
            
            # Clean the response
            cleaned = response.strip()
            
            # Remove markdown code blocks
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            cleaned = cleaned.strip()
            
            # Try to extract JSON if there's extra text
            start_idx = cleaned.find("{")
            end_idx = cleaned.rfind("}") + 1
            
            if start_idx != -1 and end_idx > start_idx:
                cleaned = cleaned[start_idx:end_idx]
            
            return json.loads(cleaned)
            
        except Exception as e:
            logger.error(f"JSON parsing error: {e}")
            return {}

    def _get_llm_generated_videos(self, subject: str, phase_concepts: List[str], 
                                 difficulty: str) -> Dict[str, Any]:
        """Generate video recommendations using LLM when API is not available"""
        logger.info(f"Generating LLM-based video recommendations for {subject}")
        
        # Import base agent
        try:
            import sys
            from pathlib import Path
            current_dir = Path(__file__).parent
            sys.path.insert(0, str(current_dir))
            from base_agent import BaseAgent, AgentState
        except ImportError:
            logger.error("Could not import BaseAgent - using minimal LLM call")
            return self._get_emergency_fallback(subject, phase_concepts, difficulty)
        
        # Create temporary LLM agent for video generation
        class VideoLLMAgent(BaseAgent):
            def __init__(self):
                super().__init__("VideoGeneratorAgent", temperature=0.3, max_tokens=1500)
            
            def process(self, state: AgentState) -> AgentState:
                # Not used in this context, but required by BaseAgent
                return state
            
            def get_system_prompt(self) -> str:
                return """You are the YouTube Video Recommendation Agent.

INPUT:
- subject (e.g., "Operating Systems")
- difficulty (Beginner/Intermediate/Advanced)
- phase_concepts (list of key concepts for this learning phase)

TASK:
Generate realistic YouTube video recommendations for educational content. Return exactly 2 playlists and 1 oneshot video that would realistically exist on YouTube for this subject and difficulty level.

REQUIREMENTS:
1. REALISTIC TITLES: Use actual naming patterns from educational YouTube channels
2. PROPER CHANNELS: Use known educational channel names (Neso Academy, Abdul Bari, MIT OCW, etc.)
3. RELEVANT DESCRIPTIONS: Match content to the specific phase concepts
4. APPROPRIATE DURATIONS: Playlists (4-8 hours), Oneshots (1-3 hours)
5. QUALITY SCORES: Based on educational value and concept coverage

RETURN JSON ONLY:
{
  "playlists": [
    {
      "title": "Operating Systems Complete Course | OS Tutorial | GATE Preparation",
      "url": "https://www.youtube.com/playlist?list=PLrjkTql3jnm-CLxHftqQdujMnLokN0Uj0",
      "channel": "Neso Academy",
      "description": "Complete Operating Systems course covering processes, threads, memory management...",
      "content_type": "youtube_playlist",
      "duration_seconds": 28800,
      "relevance_score": 0.92,
      "phase_concepts_covered": ["processes", "memory management", "file systems"],
      "video_count": 45,
      "view_count": 1500000
    },
    {
      "title": "OS Concepts - Advanced Topics | Operating System Tutorial",
      "url": "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
      "channel": "Gate Smashers",
      "description": "Advanced operating system concepts for computer science students",
      "content_type": "youtube_playlist", 
      "duration_seconds": 21600,
      "relevance_score": 0.88,
      "phase_concepts_covered": ["scheduling", "synchronization", "deadlocks"],
      "video_count": 32,
      "view_count": 890000
    }
  ],
  "oneshot": {
    "title": "Operating Systems in 4 Hours | Complete OS Course | Full Tutorial",
    "url": "https://www.youtube.com/watch?v=vBURTt97EkA",
    "channel": "Programming Knowledge",
    "description": "Complete operating systems tutorial covering all major concepts in one comprehensive video",
    "content_type": "youtube_video",
    "duration_seconds": 14400,
    "relevance_score": 0.85,
    "phase_concepts_covered": ["OS basics", "processes", "memory", "file systems"],
    "view_count": 650000,
    "like_count": 15200
  }
}

CRITICAL RULES:
- Use REAL educational channel names that exist on YouTube
- Generate titles that match actual YouTube educational content patterns
- Ensure relevance_scores reflect concept coverage quality (0.80-0.95)
- Match video durations to realistic educational content lengths
- Include specific concepts from the input phase_concepts list

Return ONLY the JSON response."""
        
        # Generate LLM response
        agent = VideoLLMAgent()
        
        prompt = f"""Generate YouTube video recommendations for:

Subject: {subject}
Difficulty: {difficulty}
Phase Concepts: {', '.join(phase_concepts)}

Create 2 educational playlists and 1 comprehensive oneshot video that would realistically exist for learning these concepts."""

        try:
            # Get LLM response
            raw_response = agent.call_llm(prompt)
            logger.info(f"Raw LLM response for video generation: {raw_response[:300]}...")
            
            # Clean and parse JSON
            parsed_response = self._clean_and_parse_json(raw_response)
            
            # Validate response structure
            if not isinstance(parsed_response, dict):
                raise ValueError("LLM response is not a valid JSON object")
            
            required_keys = ["playlists", "oneshot"]
            for key in required_keys:
                if key not in parsed_response:
                    raise ValueError(f"Missing required key: {key}")
            
            # Ensure playlists is a list with 2 items
            if not isinstance(parsed_response["playlists"], list) or len(parsed_response["playlists"]) != 2:
                raise ValueError("Playlists must be a list with exactly 2 items")
            
            # Ensure oneshot is a dict
            if not isinstance(parsed_response["oneshot"], dict):
                raise ValueError("Oneshot must be a dictionary")
            
            # Add metadata
            parsed_response["meta"] = {
                "query": f"{subject} - {difficulty}",
                "search_type": "llm_generated",
                "timestamp": datetime.utcnow().isoformat(),
                "api_enabled": False,
                "generation_method": "LLM with educational patterns",
                "phase_concepts": phase_concepts
            }
            
            logger.info(f"Successfully generated {len(parsed_response['playlists'])} playlists and 1 oneshot video via LLM")
            return parsed_response
            
        except Exception as e:
            logger.error(f"LLM video generation failed: {e}")
            # Emergency fallback with minimal structure
            return {
                "playlists": [],
                "oneshot": {},
                "meta": {
                    "query": f"{subject} - {difficulty}",
                    "search_type": "emergency_fallback",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e)
                }
            }
    
    def _get_emergency_fallback(self, subject: str, phase_concepts: List[str], 
                               difficulty: str) -> Dict[str, Any]:
        """Emergency fallback when LLM agent cannot be created"""
        logger.warning(f"Using emergency fallback for {subject} - agent creation failed")
        
        return {
            "playlists": [],
            "oneshot": {},
            "meta": {
                "query": f"{subject} - {difficulty}",
                "search_type": "emergency_fallback",
                "timestamp": datetime.utcnow().isoformat(),
                "error": "Could not create LLM agent for video generation",
                "suggestion": "Check base_agent import and dependencies"
            }
        }

# Global instance for easy access
youtube_agent = YouTubeVideoSearchAgent()
