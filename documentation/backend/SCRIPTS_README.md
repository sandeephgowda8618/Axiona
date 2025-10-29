# Database Seeding

This directory contains the database seeding script for the Study-AI platform.

## Scripts

### seedAllVideos.js
**The single source of truth for all video data.**

This script contains all videos (both standalone and playlist videos) and will:
- Clear the existing database
- Insert all videos in one organized structure
- Display a summary of the seeded data

#### Usage:
```bash
node scripts/seedAllVideos.js
```

#### What it includes:
- **6 Standalone videos**: SQL, Git, Docker, API Design, CSS Grid, TypeScript
- **3 Playlists with 10 total videos**:
  - JavaScript Fundamentals Complete Course (5 episodes)
  - React Complete Course - Beginner to Advanced (3 episodes)  
  - Python Data Science Complete Course (2 episodes)

#### Database Structure:
- Total: 16 videos
- No duplicates
- Clean, organized data
- Proper playlist relationships

## Database Schema
Videos include both standalone and playlist fields:
- Standalone videos: No `playlistId`
- Playlist videos: Include `playlistId`, `playlistTitle`, and `episodeNumber`

## Important Notes:
- Always use this single script for seeding
- Do not create multiple seeding files
- This script clears existing data before inserting new data
- Run this script whenever you need to reset or initialize the database
