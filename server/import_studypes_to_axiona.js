const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function importStudyPESToAxiona() {
  console.log('🚀 Starting StudyPES import to Axiona database...\n');
  
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Connect to axiona database
    const db = client.db('axiona');
    const booksCollection = db.collection('books');
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
    
    // Load StudyPES metadata
    const metadataPath = path.join(__dirname, '..', 'StudyPES_material_retrival', 'StudyPES_data.json');
    const materialsDir = path.join(__dirname, '..', 'StudyPES_material_retrival', 'materials');
    
    console.log('📁 Loading metadata from:', metadataPath);
    console.log('📁 Materials directory:', materialsDir);
    
    const rawData = fs.readFileSync(metadataPath, 'utf8');
    const studyPESData = JSON.parse(rawData);
    
    console.log(`📊 Found ${studyPESData.length} materials in metadata\n`);
    
    // Clear existing StudyPES materials from axiona database
    console.log('🧹 Clearing existing StudyPES materials from axiona database...');
    const deleteResult = await booksCollection.deleteMany({ source: 'StudyPES' });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing records\n`);
    
    // Statistics tracking
    const stats = {
      processed: 0,
      successful: 0,
      fileUploaded: 0,
      fileNotFound: 0,
      errors: 0,
      byFileType: {
        pdf: { found: 0, uploaded: 0 },
        pptx: { found: 0, uploaded: 0 },
        docx: { found: 0, uploaded: 0 },
        pps: { found: 0, uploaded: 0 },
        other: { found: 0, uploaded: 0 }
      }
    };
    
    // Process each material
    for (const [index, material] of studyPESData.entries()) {
      stats.processed++;
      console.log(`\n[${index + 1}/${studyPESData.length}] Processing: ${material.title}`);
      
      try {
        // Get file extension
        const fileName = material.fileName || 'unknown';
        const extension = path.extname(fileName).toLowerCase().replace('.', '') || 'unknown';
        const filePath = path.join(materialsDir, fileName);
        
        // Track file type
        if (stats.byFileType[extension]) {
          stats.byFileType[extension].found++;
        } else {
          stats.byFileType.other.found++;
        }
        
        let gridFSFileId = null;
        
        // Check if file exists and upload to GridFS
        if (fs.existsSync(filePath)) {
          console.log(`   📄 File found: ${fileName} (${extension.toUpperCase()})`);
          
          try {
            // Upload file to GridFS
            const uploadStream = bucket.openUploadStream(fileName, {
              metadata: {
                originalName: fileName,
                materialId: material.title,
                subject: material.subject,
                unit: material.unit,
                semester: material.semester,
                fileType: extension,
                uploadedAt: new Date(),
                source: 'StudyPES'
              }
            });
            
            const fileStream = fs.createReadStream(filePath);
            await new Promise((resolve, reject) => {
              fileStream.pipe(uploadStream);
              uploadStream.on('finish', () => {
                gridFSFileId = uploadStream.id;
                resolve();
              });
              uploadStream.on('error', reject);
            });
            
            console.log(`   ✅ File uploaded to GridFS: ${gridFSFileId}`);
            stats.fileUploaded++;
            
            if (stats.byFileType[extension]) {
              stats.byFileType[extension].uploaded++;
            } else {
              stats.byFileType.other.uploaded++;
            }
            
          } catch (uploadError) {
            console.log(`   ❌ Error uploading file: ${uploadError.message}`);
            stats.errors++;
          }
        } else {
          console.log(`   ⚠️  File not found: ${filePath}`);
          stats.fileNotFound++;
        }
        
        // Create document record with comprehensive metadata
        const bookRecord = {
          // Core identification
          title: material.title,
          description: material.description || `StudyPES material for ${material.subject}`,
          author: material.author || 'StudyPES Materials',
          source: 'StudyPES',
          
          // Academic information
          subject: material.subject,
          unit: material.unit,
          semester: material.semester || null,
          year: material.year || '2024',
          level: material.level || 'Intermediate',
          difficulty: material.difficulty || 'Intermediate',
          
          // File information
          fileName: fileName,
          fileSize: material.file_size || fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          pages: material.pages || 0,
          fileType: extension.toUpperCase(),
          gridFSFileId: gridFSFileId,
          
          // URLs (for backward compatibility)
          url: gridFSFileId ? `/api/pdfs/file/${gridFSFileId}` : null,
          pdfUrl: gridFSFileId ? `/api/pdfs/file/${gridFSFileId}` : null,
          
          // Categorization
          category: material.category || 'StudyPES',
          domain: material.subject,
          tags: material.tags || [material.subject, `Unit ${material.unit}`, extension.toUpperCase()],
          topic: material.topic || material.title,
          
          // Metadata
          language: material.language || 'English',
          publisher: material.publisher || 'StudyPES',
          isbn: material.isbn || '',
          
          // Timestamps
          createdAt: material.createdAt || new Date(),
          updatedAt: material.updatedAt || new Date(),
          addedDate: new Date(),
          
          // StudyPES specific
          studyPESId: `studypes_${index + 1}`,
          originalFileName: fileName,
          hasFile: !!gridFSFileId,
          fileStatus: gridFSFileId ? 'available' : 'missing'
        };
        
        // Insert into database
        const insertResult = await booksCollection.insertOne(bookRecord);
        console.log(`   💾 Saved to database: ${insertResult.insertedId}`);
        stats.successful++;
        
      } catch (error) {
        console.log(`   ❌ Error processing material: ${error.message}`);
        stats.errors++;
      }
      
      // Progress indicator
      if ((index + 1) % 50 === 0 || index === studyPESData.length - 1) {
        const progress = ((index + 1) / studyPESData.length * 100).toFixed(1);
        console.log(`\n📈 Progress: ${progress}% (${index + 1}/${studyPESData.length})`);
      }
    }
    
    // Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT COMPLETE - FINAL STATISTICS');
    console.log('='.repeat(60));
    
    console.log(`📋 Materials processed: ${stats.processed}`);
    console.log(`✅ Successfully imported: ${stats.successful}`);
    console.log(`📁 Files uploaded to GridFS: ${stats.fileUploaded}`);
    console.log(`❌ Files not found: ${stats.fileNotFound}`);
    console.log(`⚠️  Errors: ${stats.errors}`);
    
    console.log('\n📈 BY FILE TYPE:');
    Object.entries(stats.byFileType).forEach(([type, counts]) => {
      if (counts.found > 0) {
        const successRate = ((counts.uploaded / counts.found) * 100).toFixed(1);
        console.log(`   ${type.toUpperCase().padEnd(6)}: ${counts.uploaded}/${counts.found} uploaded (${successRate}%)`);
      }
    });
    
    // Verify final database state
    console.log('\n🔍 VERIFICATION:');
    const totalRecords = await booksCollection.countDocuments({ source: 'StudyPES' });
    const recordsWithFiles = await booksCollection.countDocuments({ 
      source: 'StudyPES', 
      gridFSFileId: { $ne: null } 
    });
    const recordsWithoutFiles = await booksCollection.countDocuments({ 
      source: 'StudyPES', 
      gridFSFileId: null 
    });
    
    console.log(`📊 Total StudyPES records: ${totalRecords}`);
    console.log(`✅ Records with files: ${recordsWithFiles}`);
    console.log(`❌ Records without files: ${recordsWithoutFiles}`);
    
    // Verify GridFS
    const gridFSFiles = await bucket.find({ 'metadata.source': 'StudyPES' }).toArray();
    console.log(`🗄️  GridFS files: ${gridFSFiles.length}`);
    
    console.log('\n🎯 SUCCESS RATE:');
    const overallSuccess = ((stats.successful / stats.processed) * 100).toFixed(1);
    const fileSuccess = ((stats.fileUploaded / stats.processed) * 100).toFixed(1);
    console.log(`📋 Metadata import: ${overallSuccess}%`);
    console.log(`📁 File upload: ${fileSuccess}%`);
    
    console.log('\n✅ StudyPES import to Axiona database completed!');
    console.log('🚀 All materials are now stored in GridFS - no static files needed!');
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the import
console.log('StudyPES to Axiona Database Import Tool');
console.log('=====================================');
importStudyPESToAxiona().catch(console.error);
