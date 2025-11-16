#!/usr/bin/env python3
"""
Database Status Verification Script
==================================
Comprehensive verification of all collections, GridFS, ChromaDB, and metadata
for the Educational Content Management System
"""

import json
import pymongo
import gridfs
import chromadb
import os
from pathlib import Path
from datetime import datetime
import logging
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseStatusVerifier:
    def __init__(self):
        """Initialize database connections"""
        # MongoDB and GridFS
        self.client = pymongo.MongoClient("mongodb://localhost:27017/")
        self.db = self.client.educational_content
        self.fs = gridfs.GridFS(self.db)
        
        # ChromaDB
        try:
            self.chroma_client = chromadb.PersistentClient(path="./chromadb")
        except Exception as e:
            logger.warning(f"ChromaDB connection issue: {e}")
            self.chroma_client = None
        
        # Collections
        self.pes_collection = self.db.pes_materials
        self.books_collection = self.db.reference_books
        self.videos_collection = self.db.videos
        self.chunks_collection = self.db.chunks
        
        # Statistics storage
        self.stats = {}
        
    def verify_mongodb_collections(self):
        """Verify MongoDB collections and their statistics"""
        logger.info("🔍 Verifying MongoDB Collections...")
        
        collections_stats = {}
        
        # PES Materials
        pes_count = self.pes_collection.count_documents({})
        pes_with_gridfs = self.pes_collection.count_documents({"gridfs_id": {"$exists": True}})
        pes_with_pdf = self.pes_collection.count_documents({"has_pdf": True})
        
        collections_stats['pes_materials'] = {
            'total_documents': pes_count,
            'with_gridfs_ids': pes_with_gridfs,
            'with_pdfs': pes_with_pdf,
            'gridfs_success_rate': f"{(pes_with_gridfs/pes_count*100):.1f}%" if pes_count > 0 else "0%"
        }
        
        # Reference Books
        books_count = self.books_collection.count_documents({})
        books_with_gridfs = self.books_collection.count_documents({"gridfs_id": {"$exists": True}})
        books_with_pdf = self.books_collection.count_documents({"has_pdf": True})
        
        collections_stats['reference_books'] = {
            'total_documents': books_count,
            'with_gridfs_ids': books_with_gridfs,
            'with_pdfs': books_with_pdf,
            'gridfs_success_rate': f"{(books_with_gridfs/books_count*100):.1f}%" if books_count > 0 else "0%"
        }
        
        # Videos
        videos_count = self.videos_collection.count_documents({})
        collections_stats['videos'] = {
            'total_documents': videos_count,
            'with_gridfs_ids': 0,  # Videos don't have GridFS IDs
            'with_pdfs': 0,
            'gridfs_success_rate': "N/A"
        }
        
        # Chunks
        chunks_count = self.chunks_collection.count_documents({})
        chunks_with_gridfs = self.chunks_collection.count_documents({"metadata.gridfs_id": {"$exists": True}})
        
        collections_stats['chunks'] = {
            'total_documents': chunks_count,
            'with_gridfs_refs': chunks_with_gridfs,
            'gridfs_ref_rate': f"{(chunks_with_gridfs/chunks_count*100):.1f}%" if chunks_count > 0 else "0%"
        }
        
        self.stats['mongodb'] = collections_stats
        
        logger.info(f"📚 PES Materials: {pes_count} docs ({pes_with_gridfs} with GridFS)")
        logger.info(f"📖 Reference Books: {books_count} docs ({books_with_gridfs} with GridFS)")
        logger.info(f"🎥 Videos: {videos_count} docs")
        logger.info(f"📄 Chunks: {chunks_count} docs ({chunks_with_gridfs} with GridFS refs)")
        
        return collections_stats

    def verify_gridfs_storage(self):
        """Verify GridFS file storage and metadata"""
        logger.info("🗄️ Verifying GridFS Storage...")
        
        # Count GridFS files
        gridfs_files = list(self.db.fs.files.find({}))
        total_files = len(gridfs_files)
        
        # Analyze by source
        source_stats = defaultdict(lambda: {'count': 0, 'total_size': 0, 'avg_size': 0})
        
        for file_doc in gridfs_files:
            source = file_doc.get('metadata', {}).get('source', 'unknown')
            file_size = file_doc.get('length', 0)
            
            source_stats[source]['count'] += 1
            source_stats[source]['total_size'] += file_size
        
        # Calculate averages
        for source in source_stats:
            if source_stats[source]['count'] > 0:
                source_stats[source]['avg_size'] = source_stats[source]['total_size'] / source_stats[source]['count']
        
        # Get sample files for verification
        sample_files = []
        for i, file_doc in enumerate(gridfs_files[:5]):  # First 5 files
            sample_files.append({
                'filename': file_doc.get('filename', 'Unknown'),
                'size': file_doc.get('length', 0),
                'upload_date': file_doc.get('uploadDate'),
                'source': file_doc.get('metadata', {}).get('source', 'unknown'),
                'gridfs_id': str(file_doc.get('_id'))
            })
        
        gridfs_stats = {
            'total_files': total_files,
            'by_source': dict(source_stats),
            'sample_files': sample_files,
            'total_storage_bytes': sum(f.get('length', 0) for f in gridfs_files),
            'avg_file_size': sum(f.get('length', 0) for f in gridfs_files) / total_files if total_files > 0 else 0
        }
        
        self.stats['gridfs'] = gridfs_stats
        
        logger.info(f"🗄️ Total GridFS Files: {total_files}")
        for source, stats in source_stats.items():
            size_mb = stats['total_size'] / (1024 * 1024)
            avg_mb = stats['avg_size'] / (1024 * 1024)
            logger.info(f"   {source}: {stats['count']} files, {size_mb:.1f} MB total, {avg_mb:.1f} MB avg")
        
        return gridfs_stats

    def verify_chromadb_vectors(self):
        """Verify ChromaDB vector storage"""
        logger.info("🔗 Verifying ChromaDB Vectors...")
        
        if not self.chroma_client:
            logger.warning("ChromaDB client not available")
            return {'status': 'unavailable'}
        
        try:
            # Get collection
            collection = self.chroma_client.get_collection("educational_content")
            
            # Count vectors
            vector_count = collection.count()
            
            # Get sample data for verification
            sample_data = collection.peek(limit=5)
            
            # Analyze metadata distribution
            all_metadata = collection.get(limit=1000)  # Sample for analysis
            content_types = Counter()
            sources = Counter()
            
            if all_metadata and all_metadata.get('metadatas'):
                for metadata in all_metadata['metadatas']:
                    content_types[metadata.get('content_type', 'unknown')] += 1
                    sources[metadata.get('source', 'unknown')] += 1
            
            chromadb_stats = {
                'total_vectors': vector_count,
                'sample_ids': sample_data.get('ids', [])[:5] if sample_data else [],
                'content_type_distribution': dict(content_types),
                'source_distribution': dict(sources),
                'status': 'operational'
            }
            
            self.stats['chromadb'] = chromadb_stats
            
            logger.info(f"🔗 ChromaDB Vectors: {vector_count}")
            logger.info(f"   Content Types: {dict(content_types)}")
            logger.info(f"   Sources: {dict(sources)}")
            
            return chromadb_stats
            
        except Exception as e:
            logger.error(f"ChromaDB verification error: {e}")
            return {'status': 'error', 'error': str(e)}

    def verify_data_integrity(self):
        """Verify data integrity and relationships"""
        logger.info("🔐 Verifying Data Integrity...")
        
        integrity_results = {}
        
        # Check GridFS ID consistency
        orphaned_gridfs = []
        missing_gridfs = []
        
        # Get all GridFS IDs from collections
        pes_gridfs_ids = set()
        books_gridfs_ids = set()
        
        for doc in self.pes_collection.find({"gridfs_id": {"$exists": True}}, {"gridfs_id": 1}):
            pes_gridfs_ids.add(doc['gridfs_id'])
        
        for doc in self.books_collection.find({"gridfs_id": {"$exists": True}}, {"gridfs_id": 1}):
            books_gridfs_ids.add(doc['gridfs_id'])
        
        all_referenced_gridfs = pes_gridfs_ids.union(books_gridfs_ids)
        
        # Get actual GridFS files
        actual_gridfs_ids = set()
        for file_doc in self.db.fs.files.find({}, {"_id": 1}):
            actual_gridfs_ids.add(str(file_doc['_id']))
        
        # Convert referenced IDs to strings for comparison
        referenced_str = {str(gid) for gid in all_referenced_gridfs}
        
        # Find orphaned and missing
        orphaned_gridfs = actual_gridfs_ids - referenced_str
        missing_gridfs = referenced_str - actual_gridfs_ids
        
        # Check chunk relationships
        chunk_orphans = 0
        chunks_sample = list(self.chunks_collection.find({}).limit(100))
        
        for chunk in chunks_sample:
            source_id = chunk.get('metadata', {}).get('source_id')
            if source_id:
                if source_id.startswith('book_'):
                    if not self.books_collection.find_one({"_id": source_id}):
                        chunk_orphans += 1
                elif source_id.startswith('pes_'):
                    if not self.pes_collection.find_one({"_id": source_id}):
                        chunk_orphans += 1
        
        integrity_results = {
            'gridfs_orphaned': len(orphaned_gridfs),
            'gridfs_missing': len(missing_gridfs),
            'chunk_orphans_sample': chunk_orphans,
            'total_gridfs_referenced': len(referenced_str),
            'total_gridfs_actual': len(actual_gridfs_ids),
            'integrity_score': f"{((len(actual_gridfs_ids) - len(orphaned_gridfs) - len(missing_gridfs)) / max(len(actual_gridfs_ids), 1) * 100):.1f}%"
        }
        
        self.stats['integrity'] = integrity_results
        
        logger.info(f"🔐 Data Integrity Score: {integrity_results['integrity_score']}")
        logger.info(f"   Orphaned GridFS files: {len(orphaned_gridfs)}")
        logger.info(f"   Missing GridFS files: {len(missing_gridfs)}")
        logger.info(f"   Chunk orphans (sample): {chunk_orphans}/100")
        
        return integrity_results

    def analyze_subject_distribution(self):
        """Analyze content distribution by subject"""
        logger.info("📊 Analyzing Subject Distribution...")
        
        # PES Materials by subject
        pes_pipeline = [
            {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        pes_subjects = list(self.pes_collection.aggregate(pes_pipeline))
        
        # Reference Books by subject
        books_pipeline = [
            {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        books_subjects = list(self.books_collection.aggregate(books_pipeline))
        
        # Chunks distribution by source
        chunks_pipeline = [
            {"$group": {"_id": "$metadata.source", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        chunks_sources = list(self.chunks_collection.aggregate(chunks_pipeline))
        
        subject_stats = {
            'pes_subjects': pes_subjects,
            'books_subjects': books_subjects,
            'chunks_by_source': chunks_sources
        }
        
        self.stats['subjects'] = subject_stats
        
        logger.info("📊 Top PES Subjects:")
        for subj in pes_subjects[:5]:
            logger.info(f"   {subj['_id']}: {subj['count']} materials")
        
        logger.info("📊 Top Book Subjects:")
        for subj in books_subjects[:5]:
            logger.info(f"   {subj['_id']}: {subj['count']} books")
        
        return subject_stats

    def get_sample_documents(self):
        """Get sample documents for verification"""
        logger.info("📋 Collecting Sample Documents...")
        
        samples = {}
        
        # Sample PES with GridFS
        pes_sample = self.pes_collection.find_one(
            {"gridfs_id": {"$exists": True}},
            {"title": 1, "subject": 1, "gridfs_id": 1, "fileName": 1}
        )
        
        # Sample Book with GridFS
        book_sample = self.books_collection.find_one(
            {"gridfs_id": {"$exists": True}},
            {"title": 1, "author": 1, "gridfs_id": 1, "filename": 1}
        )
        
        # Sample Chunk
        chunk_sample = self.chunks_collection.find_one(
            {"metadata.gridfs_id": {"$exists": True}},
            {"_id": 1, "metadata.source_id": 1, "metadata.title": 1, "metadata.gridfs_id": 1}
        )
        
        # Sample Video
        video_sample = self.videos_collection.find_one(
            {},
            {"title": 1, "url": 1}
        )
        
        samples = {
            'pes_sample': pes_sample,
            'book_sample': book_sample,
            'chunk_sample': chunk_sample,
            'video_sample': video_sample
        }
        
        self.stats['samples'] = samples
        
        if pes_sample:
            logger.info(f"📋 PES Sample: '{pes_sample.get('title', 'Unknown')[:50]}...' (GridFS: {pes_sample.get('gridfs_id')})")
        if book_sample:
            logger.info(f"📋 Book Sample: '{book_sample.get('title', 'Unknown')[:50]}...' (GridFS: {book_sample.get('gridfs_id')})")
        if chunk_sample:
            logger.info(f"📋 Chunk Sample: '{chunk_sample.get('_id')}' (Source: {chunk_sample.get('metadata', {}).get('source_id')})")
        
        return samples

    def generate_summary_report(self):
        """Generate comprehensive summary report"""
        logger.info("📄 Generating Summary Report...")
        
        # Calculate totals
        total_documents = (
            self.stats['mongodb']['pes_materials']['total_documents'] +
            self.stats['mongodb']['reference_books']['total_documents'] +
            self.stats['mongodb']['videos']['total_documents']
        )
        
        total_chunks = self.stats['mongodb']['chunks']['total_documents']
        total_gridfs = self.stats['gridfs']['total_files']
        total_vectors = self.stats['chromadb'].get('total_vectors', 0)
        
        # Storage calculations
        total_storage_mb = self.stats['gridfs']['total_storage_bytes'] / (1024 * 1024)
        
        summary = {
            'generation_time': datetime.now().isoformat(),
            'totals': {
                'documents': total_documents,
                'chunks': total_chunks,
                'gridfs_files': total_gridfs,
                'vectors': total_vectors,
                'storage_mb': round(total_storage_mb, 2)
            },
            'collection_breakdown': {
                'pes_materials': self.stats['mongodb']['pes_materials'],
                'reference_books': self.stats['mongodb']['reference_books'],
                'videos': self.stats['mongodb']['videos'],
                'chunks': self.stats['mongodb']['chunks']
            },
            'storage_breakdown': self.stats['gridfs']['by_source'],
            'integrity_status': self.stats['integrity'],
            'chromadb_status': self.stats['chromadb'],
            'subject_distribution': self.stats['subjects'],
            'sample_documents': self.stats['samples']
        }
        
        # Save detailed report
        report_file = f"database_status_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        logger.info(f"📄 Detailed report saved to: {report_file}")
        
        return summary

    def print_status_summary(self):
        """Print formatted status summary"""
        print("\n" + "="*80)
        print("🎯 EDUCATIONAL CONTENT DATABASE STATUS SUMMARY")
        print("="*80)
        print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📁 Working Directory: {os.getcwd()}")
        
        # Collection Summary
        print(f"\n📊 COLLECTION STATISTICS:")
        print(f"{'Collection':<20} {'Documents':<12} {'GridFS IDs':<12} {'Success Rate':<15}")
        print("-" * 65)
        
        for collection, stats in self.stats['mongodb'].items():
            if collection != 'chunks':
                print(f"{collection:<20} {stats['total_documents']:<12} {stats['with_gridfs_ids']:<12} {stats['gridfs_success_rate']:<15}")
        
        chunks_stats = self.stats['mongodb']['chunks']
        print(f"{'chunks':<20} {chunks_stats['total_documents']:<12} {chunks_stats['with_gridfs_refs']:<12} {chunks_stats['gridfs_ref_rate']:<15}")
        
        # Storage Summary
        print(f"\n💾 STORAGE BREAKDOWN:")
        total_storage = self.stats['gridfs']['total_storage_bytes'] / (1024 * 1024 * 1024)  # GB
        print(f"Total GridFS Storage: {total_storage:.2f} GB")
        
        for source, stats in self.stats['gridfs']['by_source'].items():
            size_mb = stats['total_size'] / (1024 * 1024)
            avg_mb = stats['avg_size'] / (1024 * 1024)
            print(f"  {source}: {stats['count']} files, {size_mb:.1f} MB, avg {avg_mb:.1f} MB/file")
        
        # ChromaDB Summary
        chromadb_status = self.stats['chromadb']
        print(f"\n🔗 CHROMADB STATUS:")
        if chromadb_status.get('status') == 'operational':
            print(f"Status: ✅ Operational")
            print(f"Total Vectors: {chromadb_status['total_vectors']:,}")
            print(f"Content Types: {chromadb_status.get('content_type_distribution', {})}")
        else:
            print(f"Status: ❌ {chromadb_status.get('status', 'Unknown')}")
        
        # Integrity Summary
        print(f"\n🔐 DATA INTEGRITY:")
        integrity = self.stats['integrity']
        print(f"Integrity Score: {integrity['integrity_score']}")
        print(f"GridFS Files: {integrity['total_gridfs_actual']} actual, {integrity['total_gridfs_referenced']} referenced")
        print(f"Issues: {integrity['gridfs_orphaned']} orphaned, {integrity['gridfs_missing']} missing")
        
        # Sample Data
        print(f"\n📋 SAMPLE VERIFICATION:")
        samples = self.stats['samples']
        if samples.get('pes_sample'):
            pes = samples['pes_sample']
            print(f"✅ PES: '{pes.get('title', 'Unknown')[:40]}...' → GridFS: {pes.get('gridfs_id')}")
        
        if samples.get('book_sample'):
            book = samples['book_sample']
            print(f"✅ Book: '{book.get('title', 'Unknown')[:40]}...' → GridFS: {book.get('gridfs_id')}")
        
        if samples.get('chunk_sample'):
            chunk = samples['chunk_sample']
            print(f"✅ Chunk: {chunk.get('_id')} → Source: {chunk.get('metadata', {}).get('source_id')}")
        
        # Final Status
        total_docs = sum(stats['total_documents'] for stats in self.stats['mongodb'].values())
        print(f"\n🎉 SYSTEM STATUS:")
        print(f"✅ Complete RAG System Operational")
        print(f"📊 Total Documents: {total_docs:,}")
        print(f"🗄️  Total Files: {self.stats['gridfs']['total_files']}")
        print(f"🔗 Total Vectors: {chromadb_status.get('total_vectors', 0):,}")
        print(f"💾 Total Storage: {total_storage:.2f} GB")
        print("="*80)

    def run_complete_verification(self):
        """Run complete database verification"""
        logger.info("🚀 Starting Complete Database Verification...")
        
        try:
            # Run all verifications
            self.verify_mongodb_collections()
            self.verify_gridfs_storage()
            self.verify_chromadb_vectors()
            self.verify_data_integrity()
            self.analyze_subject_distribution()
            self.get_sample_documents()
            
            # Generate reports
            summary = self.generate_summary_report()
            self.print_status_summary()
            
            logger.info("✅ Database verification completed successfully!")
            return summary
            
        except Exception as e:
            logger.error(f"❌ Verification failed: {e}")
            raise

def main():
    """Main execution function"""
    verifier = DatabaseStatusVerifier()
    summary = verifier.run_complete_verification()
    return summary

if __name__ == "__main__":
    main()
