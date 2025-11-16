"""
Test PES Slides Ingestion
=========================

Script to test and run the PES slides ingestion pipeline.
"""

import asyncio
import logging
from pathlib import Path
from ingestion.pes_slides_ingestion import pes_ingestion_pipeline

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def test_pes_ingestion():
    """Test the PES slides ingestion pipeline"""
    
    # Define paths
    pes_txt_path = "./Data/PES_materials/PES_slides.txt"
    pes_slides_folder = "./Data/PES_slides"
    
    # Check if files exist
    if not Path(pes_txt_path).exists():
        print(f"❌ PES slides data file not found: {pes_txt_path}")
        return
    
    if not Path(pes_slides_folder).exists():
        print(f"❌ PES slides folder not found: {pes_slides_folder}")
        return
    
    print("🚀 Starting PES slides ingestion...")
    print(f"📄 Data file: {pes_txt_path}")
    print(f"📁 Slides folder: {pes_slides_folder}")
    
    # Run ingestion
    stats = await pes_ingestion_pipeline.ingest_pes_data(
        pes_txt_path=pes_txt_path,
        pes_slides_folder=pes_slides_folder
    )
    
    # Print results
    print("\n📊 Ingestion Results:")
    print(f"   Semesters: {stats.get('semesters', 0)}")
    print(f"   Subjects: {stats.get('subjects', 0)}")
    print(f"   Materials processed: {stats.get('materials_processed', 0)}")
    print(f"   Materials uploaded: {stats.get('materials_uploaded', 0)}")
    print(f"   Embeddings created: {stats.get('embeddings_created', 0)}")
    print(f"   Errors: {stats.get('errors', 0)}")
    print(f"   Duration: {stats.get('duration', 0):.2f} seconds")
    
    if stats.get('errors', 0) == 0:
        print("✅ PES slides ingestion completed successfully!")
    else:
        print(f"⚠️ PES slides ingestion completed with {stats.get('errors', 0)} errors")

if __name__ == "__main__":
    asyncio.run(test_pes_ingestion())
