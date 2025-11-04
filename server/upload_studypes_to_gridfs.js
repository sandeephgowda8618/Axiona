const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/study-ai');

let db;

async function uploadStudyPESToGridFS() {
  try {
    console.log('🔄 Starting StudyPES PDF upload to GridFS...');
    
    // Create GridFS bucket with custom collection names
    const bucket = new GridFSBucket(db, { 
      bucketName: 'pdfs',
      chunkSizeBytes: 1024 * 1024 // 1MB chunks
    });

    // Get StudyPES materials directory
    const materialsDir = path.join(__dirname, '..', 'StudyPES_material_retrival', 'materials');
    
    if (!fs.existsSync(materialsDir)) {
      console.error('❌ StudyPES materials directory not found:', materialsDir);
      return;
    }

    // Get all PDF files
    const pdfFiles = fs.readdirSync(materialsDir).filter(file => file.endsWith('.pdf'));
    console.log(`📁 Found ${pdfFiles.length} PDF files to upload`);

    const uploadPromises = pdfFiles.map(async (filename) => {
      const filePath = path.join(materialsDir, filename);
      
      try {
        // Check if file already exists in GridFS
        const existingFile = await bucket.find({ filename }).toArray();
        if (existingFile.length > 0) {
          console.log(`⏭️  Skipping ${filename} (already exists)`);
          return existingFile[0]._id;
        }

        // Determine domain based on filename
        let domain = 'StudyPES';
        if (filename.includes('AFLL')) domain = 'AFLL';
        else if (filename.includes('DSA')) domain = 'DSA';
        else if (filename.includes('Math')) domain = 'Math';
        else if (filename.includes('Operating')) domain = 'OS';
        else if (filename.includes('Machine_Learning')) domain = 'ML';

        // Upload to GridFS
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: { 
            domain: domain,
            category: 'StudyPES',
            uploadedAt: new Date()
          }
        });

        const readStream = fs.createReadStream(filePath);
        
        return new Promise((resolve, reject) => {
          readStream.pipe(uploadStream);
          
          uploadStream.on('finish', () => {
            console.log(`✅ Uploaded ${filename} (ID: ${uploadStream.id})`);
            resolve(uploadStream.id);
          });
          
          uploadStream.on('error', (error) => {
            console.error(`❌ Error uploading ${filename}:`, error);
            reject(error);
          });
        });

      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error);
        throw error;
      }
    });

    // Wait for all uploads to complete
    const uploadedIds = await Promise.all(uploadPromises);
    console.log(`✅ Successfully uploaded ${uploadedIds.length} PDFs to GridFS`);

    return uploadedIds;

  } catch (error) {
    console.error('❌ Error uploading to GridFS:', error);
    throw error;
  }
}

async function updateStudyPESMaterials() {
  try {
    console.log('🔄 Updating StudyPES materials with GridFS file IDs...');
    
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
    const booksCollection = db.collection('books');
    
    // Get all StudyPES materials
    const studyPESMaterials = await booksCollection.find({ 
      category: 'StudyPES' 
    }).toArray();
    
    console.log(`📚 Found ${studyPESMaterials.length} StudyPES materials to update`);

    for (const material of studyPESMaterials) {
      try {
        // Extract filename from URL
        const filename = material.fileName || path.basename(material.url || material.pdfUrl || '');
        
        if (!filename || !filename.endsWith('.pdf')) {
          console.log(`⏭️  Skipping ${material.title} (no valid filename)`);
          continue;
        }

        // Find corresponding GridFS file
        const gridfsFiles = await bucket.find({ filename }).toArray();
        
        if (gridfsFiles.length > 0) {
          const gridfsFile = gridfsFiles[0];
          
          // Update material with GridFS file ID
          await booksCollection.updateOne(
            { _id: material._id },
            { 
              $set: { 
                gridFSFileId: gridfsFile._id,
                pdfUrl: `/api/pdf/${gridfsFile._id}`,
                url: `/api/pdf/${gridfsFile._id}`,
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`✅ Updated ${material.title} with GridFS ID: ${gridfsFile._id}`);
        } else {
          console.log(`⚠️  No GridFS file found for ${filename}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating material ${material.title}:`, error);
      }
    }

    console.log('✅ Finished updating StudyPES materials');

  } catch (error) {
    console.error('❌ Error updating materials:', error);
    throw error;
  }
}

async function main() {
  try {
    // Wait for database connection
    await new Promise((resolve, reject) => {
      mongoose.connection.once('open', () => {
        db = mongoose.connection.db;
        console.log('✅ Connected to MongoDB');
        resolve();
      });
      mongoose.connection.on('error', reject);
    });
    
    // Upload PDFs to GridFS
    await uploadStudyPESToGridFS();
    
    // Update materials with GridFS references
    await updateStudyPESMaterials();
    
    console.log('🎉 All done! StudyPES PDFs are now served via GridFS');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
