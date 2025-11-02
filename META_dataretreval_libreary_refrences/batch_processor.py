#!/usr/bin/env python3
"""
Batch Processor for PDF Metadata Extraction
Processes all 100 PDFs in batches of 5, running for 20 epochs
"""

import os
import json
import sys
import time
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

class BatchMetadataProcessor:
    """Processes PDFs in batches continuously"""
    
    def __init__(self, source_file: str = "books_data.json", 
                 batch_size: int = 5, 
                 total_epochs: int = 20,
                 output_dir: str = "batch_output"):
        self.source_file = source_file
        self.batch_size = batch_size
        self.total_epochs = total_epochs
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
        
        # Track progress
        self.all_metadata = []
        self.processed_count = 0
        self.failed_count = 0
        self.start_time = None
    
    def run_batch_processing(self) -> Dict[str, Any]:
        """Run the complete batch processing pipeline"""
        
        self.start_time = datetime.now()
        
        logger.info("=" * 80)
        logger.info("STARTING BATCH METADATA EXTRACTION PIPELINE")
        logger.info("=" * 80)
        logger.info(f"📚 Total PDFs to process: {self.total_epochs * self.batch_size}")
        logger.info(f"📦 Batch size: {self.batch_size}")
        logger.info(f"🔄 Total epochs: {self.total_epochs}")
        logger.info(f"📁 Output directory: {self.output_dir}")
        logger.info("=" * 80)
        
        # Load all PDF URLs
        all_pdf_urls = self.source_processor.prepare_for_extraction(limit=None)
        total_available = len(all_pdf_urls)
        
        if total_available < (self.total_epochs * self.batch_size):
            logger.warning(f"Only {total_available} PDFs available, adjusting epochs...")
            self.total_epochs = total_available // self.batch_size
            logger.info(f"Adjusted to {self.total_epochs} epochs")
        
        # Process in batches
        for epoch in range(1, self.total_epochs + 1):
            try:
                success = self._process_epoch(epoch, all_pdf_urls)
                if not success:
                    logger.error(f"Epoch {epoch} failed, continuing...")
                
                # Save intermediate results every 5 epochs
                if epoch % 5 == 0:
                    self._save_intermediate_results(epoch)
                
                # Brief pause between epochs to prevent overwhelming APIs
                if epoch < self.total_epochs:
                    logger.info("⏸️  Brief pause between epochs...")
                    time.sleep(5)
                    
            except KeyboardInterrupt:
                logger.info("\n🛑 Processing interrupted by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in epoch {epoch}: {e}")
                continue
        
        # Final results
        return self._finalize_results()
    
    def _process_epoch(self, epoch: int, all_pdf_urls: List[str]) -> bool:
        """Process a single epoch (batch)"""
        
        start_idx = (epoch - 1) * self.batch_size
        end_idx = start_idx + self.batch_size
        batch_urls = all_pdf_urls[start_idx:end_idx]
        
        logger.info(f"\n{'='*20} EPOCH {epoch}/{self.total_epochs} {'='*20}")
        logger.info(f"📦 Processing PDFs {start_idx + 1} to {end_idx}")
        logger.info(f"🔗 Batch URLs: {len(batch_urls)} PDFs")
        
        epoch_start = time.time()
        
        try:
            # Step 1: Extract basic metadata
            logger.info("📥 Downloading and extracting metadata...")
            basic_metadata = self.pdf_extractor.process_pdf_urls(batch_urls)
            
            if not basic_metadata:
                logger.error(f"❌ No PDFs processed in epoch {epoch}")
                return False
            
            logger.info(f"✅ Extracted metadata from {len(basic_metadata)} PDFs")
            
            # Step 2: Enhance with AI
            enhanced_metadata = basic_metadata
            if self.ai_enhancer:
                logger.info("🤖 Enhancing with AI...")
                enhanced_metadata = self.ai_enhancer.process_metadata_batch(basic_metadata)
                logger.info("✅ AI enhancement completed")
            else:
                logger.warning("⚠️  AI enhancement skipped")
            
            # Update counters
            self.processed_count += len(enhanced_metadata)
            self.all_metadata.extend(enhanced_metadata)
            
            # Epoch summary
            epoch_time = time.time() - epoch_start
            logger.info(f"⏱️  Epoch {epoch} completed in {epoch_time:.1f} seconds")
            logger.info(f"📊 Total processed so far: {self.processed_count}/{self.total_epochs * self.batch_size}")
            logger.info(f"🎯 Progress: {(epoch/self.total_epochs)*100:.1f}%")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error processing epoch {epoch}: {e}")
            self.failed_count += self.batch_size
            return False
    
    def _save_intermediate_results(self, epoch: int):
        """Save intermediate results during processing"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save intermediate JSON
        json_file = self.output_dir / f"metadata_epoch_{epoch}_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.all_metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Intermediate results saved: {json_file}")
        logger.info(f"📈 {len(self.all_metadata)} PDFs processed so far")
    
    def _finalize_results(self) -> Dict[str, Any]:
        """Save final results and generate summary"""
        
        end_time = datetime.now()
        total_duration = (end_time - (self.start_time or end_time)).total_seconds()
        
        timestamp = end_time.strftime("%Y%m%d_%H%M%S")
        
        # Save final JSON
        json_file = self.output_dir / f"final_metadata_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.all_metadata, f, indent=2, ensure_ascii=False)
        
        # Save final JS export
        js_file = self.output_dir / f"final_source_{timestamp}.js"
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(f"// Generated PDF Metadata - Complete Collection\n")
            f.write(f"// Generated on: {end_time.isoformat()}\n")
            f.write(f"// Total entries: {len(self.all_metadata)}\n")
            f.write(f"// Processing time: {total_duration:.1f} seconds\n\n")
            f.write("export const SourceData = ")
            json.dump(self.all_metadata, f, indent=2, ensure_ascii=False)
            f.write(";\n")
        
        # Generate comprehensive report
        report_file = self.output_dir / f"final_report_{timestamp}.md"
        self._generate_comprehensive_report(report_file, total_duration)
        
        # Final summary
        logger.info("\n" + "=" * 80)
        logger.info("🎉 BATCH PROCESSING COMPLETED!")
        logger.info("=" * 80)
        logger.info(f"📚 Total PDFs processed: {len(self.all_metadata)}")
        logger.info(f"❌ Failed PDFs: {self.failed_count}")
        logger.info(f"⏱️  Total processing time: {total_duration:.1f} seconds")
        logger.info(f"⚡ Average time per PDF: {total_duration/max(len(self.all_metadata), 1):.1f} seconds")
        logger.info(f"📁 Output files saved to: {self.output_dir}")
        logger.info("=" * 80)
        
        return {
            "success": True,
            "processed_count": len(self.all_metadata),
            "failed_count": self.failed_count,
            "processing_time": total_duration,
            "output_files": {
                "json": str(json_file),
                "js": str(js_file),
                "report": str(report_file)
            }
        }
    
    def _generate_comprehensive_report(self, report_file: Path, duration: float):
        """Generate a comprehensive processing report"""
        
        # Analyze the data
        subjects = {}
        difficulties = {}
        languages = {}
        total_pages = 0
        total_size = 0
        
        for item in self.all_metadata:
            # Count subjects
            subject = item.get('subject', 'Unknown')
            subjects[subject] = subjects.get(subject, 0) + 1
            
            # Count difficulties  
            difficulty = item.get('difficulty', 'Unknown')
            difficulties[difficulty] = difficulties.get(difficulty, 0) + 1
            
            # Count languages
            language = item.get('language', 'Unknown')
            languages[language] = languages.get(language, 0) + 1
            
            # Sum pages
            pages = item.get('pages', 0)
            if isinstance(pages, int):
                total_pages += pages
            
            # Sum file sizes
            file_size = item.get('file_size', '0 MB')
            if 'MB' in str(file_size):
                try:
                    size_mb = float(str(file_size).replace(' MB', ''))
                    total_size += size_mb
                except:
                    pass
        
        # Write comprehensive report
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("# Complete PDF Metadata Extraction Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Processing Summary\n\n")
            f.write(f"- **Total PDFs Processed:** {len(self.all_metadata)}\n")
            f.write(f"- **Failed PDFs:** {self.failed_count}\n")
            f.write(f"- **Success Rate:** {(len(self.all_metadata)/(len(self.all_metadata)+self.failed_count)*100):.1f}%\n")
            f.write(f"- **Processing Time:** {duration:.1f} seconds ({duration/60:.1f} minutes)\n")
            f.write(f"- **Average Time per PDF:** {duration/max(len(self.all_metadata), 1):.1f} seconds\n")
            f.write(f"- **Total Pages:** {total_pages:,}\n")
            f.write(f"- **Total Size:** {total_size:.1f} MB\n\n")
            
            f.write("## Collection Analysis\n\n")
            
            f.write("### Subject Distribution\n\n")
            for subject, count in sorted(subjects.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.all_metadata)) * 100
                f.write(f"- **{subject}:** {count} books ({percentage:.1f}%)\n")
            f.write("\n")
            
            f.write("### Difficulty Distribution\n\n")
            for difficulty, count in sorted(difficulties.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.all_metadata)) * 100
                f.write(f"- **{difficulty}:** {count} books ({percentage:.1f}%)\n")
            f.write("\n")
            
            f.write("### Language Distribution\n\n")
            for language, count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.all_metadata)) * 100
                f.write(f"- **{language}:** {count} books ({percentage:.1f}%)\n")
            f.write("\n")
            
            f.write("## Complete Book Catalog\n\n")
            for i, item in enumerate(self.all_metadata, 1):
                title = item.get('title') or 'Unknown Title'
                subject = item.get('subject', 'Unknown')
                difficulty = item.get('difficulty', 'Unknown')
                pages = item.get('pages', 'Unknown')
                
                f.write(f"{i:3d}. **{title}**\n")
                f.write(f"     - Subject: {subject}\n")
                f.write(f"     - Difficulty: {difficulty}\n")
                f.write(f"     - Pages: {pages}\n")
                f.write(f"     - File: {item.get('filename', 'Unknown')}\n\n")

def main():
    """Main function to run batch processing"""
    
    # Configuration
    BATCH_SIZE = 5      # Process 5 PDFs per batch
    TOTAL_EPOCHS = 20   # Run for 20 epochs (20 × 5 = 100 PDFs)
    
    try:
        processor = BatchMetadataProcessor(
            batch_size=BATCH_SIZE,
            total_epochs=TOTAL_EPOCHS
        )
        
        logger.info("🚀 Starting batch PDF metadata extraction...")
        
        results = processor.run_batch_processing()
        
        if results.get("success"):
            logger.info("\n🎉 All epochs completed successfully!")
            logger.info(f"📚 Total processed: {results['processed_count']} PDFs")
            logger.info(f"⏱️  Total time: {results['processing_time']:.1f} seconds")
            logger.info(f"📁 Files: {results['output_files']}")
        else:
            logger.error("❌ Batch processing failed")
            return 1
            
    except Exception as e:
        logger.error(f"❌ Batch processing error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
