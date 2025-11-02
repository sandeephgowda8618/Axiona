# Axiona Documentation Index

This directory contains comprehensive documentation for the Axiona study platform project.

## 📋 Latest Updates
- [Project Update Summary Nov 2024](./PROJECT_UPDATE_SUMMARY_NOV2024.md) - **Recent major updates and cleanup**
- [Complete Project Structure Nov 2025](./COMPLETE_PROJECT_STRUCTURE_NOV2025.md) - **Full current project structure**
- [StudyPES Material Retrieval](./STUDYPES_MATERIAL_RETRIEVAL.md) - StudyPES materials analysis and processing

## Quick Start
- [Main README](../README.md) - Project overview and setup instructions
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Current project status and completed features

## Architecture & System Design
- [Tech Stack](./architecture/TECH_STACK.md) - Technologies, frameworks, and tools used
- [Video Conference Architecture](./architecture/VIDEO_CONFERENCE_ARCHITECTURE.md) - WebRTC and Socket.IO implementation

## Backend Documentation
- [Backend Implementation Guide](./backend/AXIONA_BACKEND_IMPLEMENTATION.md) - Complete backend structure and API documentation
- [Backend Recovery Guide](./backend/BACKEND_RECOVERY_GUIDE.md) - Instructions for rebuilding the backend from scratch
- [Authentication System](./backend/AUTH_SYSTEM_GUIDE.md) - Firebase authentication integration
- [Database ERD](./backend/DATABASE_ERD.md) - Database schema and relationships
- [Study Materials Database](./backend/DATABASE_STUDY_MATERIALS_GUIDE.md) - Study materials data structure
- [Backend Cleanup Summary](./backend/BACKEND_CLEANUP_SUMMARY.md) - Cleanup and optimization changes
- [Dynamic Data Audit](./backend/DYNAMIC_DATA_AUDIT.md) - Data flow and audit trail
- [Scripts Documentation](./backend/SCRIPTS_README.md) - Utility scripts and automation

## Data Processing & Schema
- [Enhanced Metadata Template](./ENHANCED_METADATA_TEMPLATE.md) - Metadata structure for books and materials
- [Integration Summary](./INTEGRATION_SUMMARY.md) - System integration documentation
- [Library Schema Documentation](./LIBRARY_SCHEMA_DOCUMENTATION.md) - Library system database schema
- [MongoDB Schema Template](./MONGODB_SCHEMA_TEMPLATE.md) - MongoDB collection schemas

## Features
- [PDF Highlight System](./features/PDF_HIGHLIGHT_SYSTEM.md) - PDF viewing and annotation system
- [Video Conference Status](./features/VIDEO_CONFERENCE_IMPLEMENTATION_STATUS.md) - Real-time meetings implementation

## Frontend Documentation
- [Component Library](./frontend/COMPONENT_LIBRARY.md) - Reusable UI components
- [CSS Migration Guide](./frontend/CSS_MIGRATION_GUIDE.md) - Styling and CSS organization
- [Landing Page Checklist](./frontend/LANDING_PAGE_CHECKLIST.md) - Landing page implementation status
- [Page Documentation](./frontend/pages/) - Individual page components and features

## Project Management & Cleanup
- [API and Database Mapping](./API_AND_DATABASE_MAPPING.md) - API endpoints and database mapping
- [Cleanup and Optimization Guide](./CLEANUP_AND_OPTIMIZATION_GUIDE.md) - System cleanup procedures
- [Frontend Components Mapping](./FRONTEND_COMPONENTS_MAPPING.md) - Frontend component organization
- [Project Structure and Functionality Mapping](./PROJECT_STRUCTURE_AND_FUNCTIONALITY_MAPPING.md) - Complete project mapping

## Current Status (November 2025)

### ✅ Recently Completed
- **StudyPES Analysis**: Implemented filtering and analysis of study materials vs reference books
- **System Cleanup**: Removed temporary unprocessed books system completely
- **Data Pipeline Optimization**: Cleaned up old pipeline files, retained working batch processor
- **Documentation Organization**: Consolidated all documentation into structured folders
- **Database Integration**: 118 books in MongoDB with proper metadata structure

### ✅ Core Features Stable
- **Backend**: Complete REST API with Express.js, MongoDB, Firebase authentication
- **Study Materials**: PDF upload, viewing, notes, and highlights (private to users)
- **Real-time Notes**: Live note synchronization for authenticated users
- **Video Conferencing**: Complete Socket.IO + WebRTC backend and frontend services implementation
- **Database**: Optimized models and queries with compound indexes for performance
- **Authentication**: Firebase integration with automatic user creation
- **Library System**: Book management with advanced filtering and search

### 🎯 Current Focus Areas
- **StudyPES Content**: Expanding AFLL (0), DSA (1), and Mathematics (2) materials
- **Metadata Enhancement**: Processing remaining comp(X) titled books (27 items)
- **Search Optimization**: Advanced filtering and recommendation systems
2. Add meeting room management features
3. Implement production deployment scripts
4. Add comprehensive testing suite

## Recent Updates (December 2024)
- **Documentation Organization**: All .md files moved to structured `documentation/` folder
- **Performance Optimization**: Highlight model optimized with compound indexes
- **Backend Services**: Video conference backend fully implemented and tested
- **Frontend Services**: Socket.IO, WebRTC, and API services implemented
- **Repository**: All changes committed and pushed to remote repository
2. Add meeting room management features
3. Implement production deployment scripts
4. Add comprehensive testing suite

## Development Guidelines
- All notes and highlights are private to the user who created them
- Firebase UID is used as the primary user identifier
- Socket.IO handles real-time communication for meetings
- WebRTC manages peer-to-peer video/audio connections
- MongoDB stores all application data with optimized queries

## File Organization
```
documentation/
├── INDEX.md (this file)
├── README.md (documentation overview)
├── IMPLEMENTATION_SUMMARY.md (current status)
├── architecture/ (system design docs)
├── backend/ (server-side documentation)
├── features/ (feature-specific guides)
└── frontend/ (client-side documentation)
```

For questions or contributions, refer to the main project README.md.
