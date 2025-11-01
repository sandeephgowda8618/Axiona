#!/usr/bin/env python3
"""
Main Pipeline Script for PDF Metadata Extraction
Processes PDF URLs from Source_data_clean.js and generates enhanced metadata
"""

import os
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
import logging
from datetime import datetime

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from extract_metadata import PDFMetadataExtractor
from generate_ai_metadata import GeminiMetadataGenerator
from source_data_processor import SourceDataProcessor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MetadataExtractionPipeline:
    """Main pipeline for processing PDF URLs and generating metadata"""
    
    def __init__(self, source_file: str = "books_data.json", output_dir: str = "output"):
        self.source_file = source_file
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.source_processor = SourceDataProcessor(source_file)
        self.pdf_extractor = PDFMetadataExtractor()
        
        try:
            self.ai_enhancer = GeminiMetadataGenerator()
            logger.info("Gemini AI enhancer initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini AI: {e}")
            self.ai_enhancer = None
    
    def run_pipeline(self, limit: int = None, start_from: int = 0) -> Dict[str, Any]:
        """Run the complete metadata extraction pipeline"""
        
        start_time = datetime.now()
        logger.info("=" * 60)
        logger.info("STARTING METADATA EXTRACTION PIPELINE")
        logger.info("=" * 60)
        
        # Step 1: Load source data
        logger.info("Step 1: Loading PDF URLs from source data...")
        
        # Calculate the actual limit accounting for start_from
        total_limit = None
        if limit and start_from:
            total_limit = start_from + limit
        elif limit:
            total_limit = limit
        
        pdf_urls = self.source_processor.prepare_for_extraction(limit=total_limit)
        
        if not pdf_urls:
            logger.error("No PDF URLs found in source data!")
            return {"error": "No PDF URLs found"}
        
        logger.info(f"Found {len(pdf_urls)} PDF URLs in source data")
        
        # Apply filtering
        if start_from > 0:
            pdf_urls = pdf_urls[start_from:]
            logger.info(f"Starting from index {start_from}, processing {len(pdf_urls)} URLs")
        
        if limit and len(pdf_urls) > limit:
            pdf_urls = pdf_urls[:limit]
            logger.info(f"Limited to {limit} PDFs for processing")
        
        # Step 2: Extract basic metadata
        logger.info("\nStep 2: Downloading PDFs and extracting basic metadata...")
        basic_metadata = self.pdf_extractor.process_pdf_urls(pdf_urls)
        
        logger.info(f"Successfully extracted metadata from {len(basic_metadata)} PDFs")
        
        if not basic_metadata:
            logger.error("No PDFs were successfully processed!")
            return {"error": "No PDFs processed successfully"}
        
        # Step 3: Enhance with AI
        enhanced_metadata = basic_metadata
        if self.ai_enhancer:
            logger.info("\nStep 3: Enhancing metadata with Gemini AI...")
            enhanced_metadata = self.ai_enhancer.process_metadata_batch(basic_metadata)
            logger.info("AI enhancement completed")
        else:
            logger.warning("Skipping AI enhancement (not available)")
        
        # Step 4: Save results
        logger.info("\nStep 4: Saving results...")
        results = self._save_results(enhanced_metadata)
        
        # Pipeline summary
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info("\n" + "=" * 60)
        logger.info("PIPELINE COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        logger.info(f"Total PDFs processed: {len(enhanced_metadata)}")
        logger.info(f"Processing time: {duration:.1f} seconds")
        logger.info(f"Output files saved to: {self.output_dir}")
        logger.info("=" * 60)
        
        return {
            "success": True,
            "processed_count": len(enhanced_metadata),
            "processing_time": duration,
            "output_files": results["files"],
            "metadata": enhanced_metadata
        }
    
    def _save_results(self, metadata_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Save results in multiple formats"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON for backend use
        json_file = self.output_dir / f"metadata_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(metadata_list, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved metadata.json: {json_file}")
        
        # Save as JS for frontend use
        js_file = self.output_dir / f"source_{timestamp}.js"
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write("// Generated PDF Metadata\n")
            f.write(f"// Generated on: {datetime.now().isoformat()}\n")
            f.write(f"// Total entries: {len(metadata_list)}\n\n")
            f.write("export const SourceData = ")
            json.dump(metadata_list, f, indent=2, ensure_ascii=False)
            f.write(";\n")
        logger.info(f"Saved source.js: {js_file}")
        
        # Save summary report
        report_file = self.output_dir / f"report_{timestamp}.md"
        self._generate_report(metadata_list, report_file)
        logger.info(f"Saved report: {report_file}")
        
        return {
            "files": {
                "json": str(json_file),
                "js": str(js_file),
                "report": str(report_file)
            },
            "count": len(metadata_list)
        }
    
    def _generate_report(self, metadata_list: List[Dict[str, Any]], report_file: Path):
        """Generate a summary report"""
        
        # Analyze the data
        subjects = {}
        difficulties = {}
        total_pages = 0
        total_size = 0
        
        for item in metadata_list:
            # Count subjects
            subject = item.get('subject', 'Unknown')
            subjects[subject] = subjects.get(subject, 0) + 1
            
            # Count difficulties  
            difficulty = item.get('difficulty', 'Unknown')
            difficulties[difficulty] = difficulties.get(difficulty, 0) + 1
            
            # Sum pages
            pages = item.get('pages', 0)
            if isinstance(pages, int):
                total_pages += pages
            
            # Sum file sizes (rough estimate)
            file_size = item.get('file_size', '0 MB')
            if 'MB' in file_size:
                try:
                    size_mb = float(file_size.replace(' MB', ''))
                    total_size += size_mb
                except:
                    pass
        
        # Write report
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("# PDF Metadata Extraction Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Summary\n\n")
            f.write(f"- **Total PDFs Processed:** {len(metadata_list)}\n")
            f.write(f"- **Total Pages:** {total_pages:,}\n")
            f.write(f"- **Total Size:** {total_size:.1f} MB\n\n")
            
            f.write("## Subject Distribution\n\n")
            for subject, count in sorted(subjects.items(), key=lambda x: x[1], reverse=True):
                f.write(f"- **{subject}:** {count} books\n")
            f.write("\n")
            
            f.write("## Difficulty Distribution\n\n")
            for difficulty, count in sorted(difficulties.items(), key=lambda x: x[1], reverse=True):
                f.write(f"- **{difficulty}:** {count} books\n")
            f.write("\n")
            
            f.write("## Book List\n\n")
            for i, item in enumerate(metadata_list, 1):
                title = item.get('title', 'Unknown Title')
                subject = item.get('subject', 'Unknown')
                difficulty = item.get('difficulty', 'Unknown')
                pages = item.get('pages', 'Unknown')
                
                f.write(f"{i}. **{title}**\n")
                f.write(f"   - Subject: {subject}\n")
                f.write(f"   - Difficulty: {difficulty}\n")
                f.write(f"   - Pages: {pages}\n")
                f.write(f"   - File: {item.get('filename', 'Unknown')}\n\n")

def main():
    """Main function to run the pipeline"""
    
    # Configuration
    LIMIT = 10  # Process 10 PDFs for larger batch testing
    START_FROM = 0  # Start from beginning
    
    try:
        pipeline = MetadataExtractionPipeline()
        
        logger.info("Starting PDF metadata extraction pipeline...")
        logger.info(f"Processing limit: {LIMIT if LIMIT else 'All'}")
        logger.info(f"Starting from index: {START_FROM}")
        
        results = pipeline.run_pipeline(limit=LIMIT, start_from=START_FROM)
        
        if results.get("success"):
            logger.info("\n🎉 Pipeline completed successfully!")
            logger.info(f"📚 Processed {results['processed_count']} PDFs")
            logger.info(f"⏱️  Total time: {results['processing_time']:.1f} seconds")
            logger.info(f"📁 Output files: {results['output_files']}")
        else:
            logger.error(f"❌ Pipeline failed: {results.get('error')}")
            return 1
            
    except Exception as e:
        logger.error(f"❌ Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
