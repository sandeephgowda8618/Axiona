const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function cleanAndImportStudyPESMaterials() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('axiona');
    
    // Step 1: Clean existing data
    console.log('\n🧹 CLEANING EXISTING DATA...');
    
    // Drop existing collections
    try {
      await db.collection('studypes_materials').drop();
      console.log('✅ Dropped studypes_materials collection');
    } catch (error) {
      console.log('⚠️  studypes_materials collection not found (this is OK)');
    }
    
    // Clean GridFS
    try {
      await db.collection('fs.files').drop();
      await db.collection('fs.chunks').drop();
      console.log('✅ Cleaned GridFS collections');
    } catch (error) {
      console.log('⚠️  GridFS collections not found (this is OK)');
    }
    
    // Step 2: Load metadata
    console.log('\n📁 LOADING METADATA...');
    const metadataPath = path.join(__dirname, '..', 'StudyPES_material_retrival', 'StudyPES_data.json');
    const materialsDir = path.join(__dirname, '..', 'StudyPES_material_retrival', 'materials');
    
    const rawData = fs.readFileSync(metadataPath, 'utf8');
    const studyPESData = JSON.parse(rawData);
    console.log(`📊 Found ${studyPESData.length} materials in metadata`);
    
    // Step 3: Create GridFS bucket
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    // Step 4: Import each material with proper GridFS mapping
    console.log('\n🚀 IMPORTING MATERIALS WITH GRIDFS MAPPING...');
    
    const materialsCollection = db.collection('studypes_materials');
    let successCount = 0;
    let errorCount = 0;
    let missingFileCount = 0;
    
    for (let i = 0; i < studyPESData.length; i++) {
      const material = studyPESData[i];
      const fileName = material.fileName;
      
      console.log(`\n${i + 1}/${studyPESData.length} Processing: ${material.title || 'Unknown Title'}`);
      console.log(`   File: ${fileName}`);
      
      if (!fileName) {
        console.log('   ❌ No fileName in metadata');
        errorCount++;
        continue;
      }
      
      const filePath = path.join(materialsDir, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ File not found: ${fileName}`);
        missingFileCount++;
        
        // Save metadata without gridfs_id
        const materialDoc = {
          ...material,
          source: 'StudyPES',
          gridfs_id: null, // No file available
          importedAt: new Date(),
          status: 'file_missing'
        };
        
        await materialsCollection.insertOne(materialDoc);
        continue;
      }
      
      try {
        // Upload file to GridFS
        console.log(`   📤 Uploading to GridFS...`);
        const fileStream = fs.createReadStream(filePath);
        const uploadStream = bucket.openUploadStream(fileName, {
          metadata: {
            originalName: fileName,
            subject: material.subject,
            title: material.title,
            uploadDate: new Date()
          }
        });
        
        // Upload file and get GridFS ID
        const gridfsId = await new Promise((resolve, reject) => {
          fileStream.pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => {
              resolve(uploadStream.id);
            });
        });
        
        console.log(`   ✅ Uploaded to GridFS with ID: ${gridfsId}`);
        
        // Save metadata with gridfs_id
        const materialDoc = {
          ...material,
          source: 'StudyPES',
          gridfs_id: gridfsId, // Map the GridFS ID
          importedAt: new Date(),
          status: 'available',
          file_accessible: true
        };
        
        await materialsCollection.insertOne(materialDoc);
        console.log(`   ✅ Saved metadata with gridfs_id mapping`);
        
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ Error uploading file: ${error.message}`);
        errorCount++;
        
        // Save metadata with error status
        const materialDoc = {
          ...material,
          source: 'StudyPES',
          gridfs_id: null,
          importedAt: new Date(),
          status: 'upload_error',
          error: error.message
        };
        
        await materialsCollection.insertOne(materialDoc);
      }
    }
    
    // Step 5: Verification
    console.log('\n📊 IMPORT SUMMARY:');
    console.log('==================');
    console.log(`✅ Successful uploads: ${successCount}`);
    console.log(`❌ Upload errors: ${errorCount}`);
    console.log(`📁 Missing files: ${missingFileCount}`);
    console.log(`📊 Total processed: ${studyPESData.length}`);
    
    // Verify database state
    const totalMaterials = await materialsCollection.countDocuments();
    const materialsWithGridFS = await materialsCollection.countDocuments({ gridfs_id: { $ne: null } });
    const materialsWithoutGridFS = await materialsCollection.countDocuments({ gridfs_id: null });
    
    console.log('\n🔍 DATABASE VERIFICATION:');
    console.log('==========================');
    console.log(`📚 Total materials in DB: ${totalMaterials}`);
    console.log(`✅ Materials with GridFS: ${materialsWithGridFS}`);
    console.log(`❌ Materials without GridFS: ${materialsWithoutGridFS}`);
    
    // Check GridFS files
    const gridfsFiles = await db.collection('fs.files').countDocuments();
    console.log(`📁 Files in GridFS: ${gridfsFiles}`);
    
    // Sample data check
    const sampleMaterials = await materialsCollection.find({ gridfs_id: { $ne: null } }).limit(3).toArray();
    console.log('\n📋 SAMPLE MATERIALS WITH GRIDFS:');
    sampleMaterials.forEach((material, index) => {
      console.log(`${index + 1}. ${material.title}`);
      console.log(`   Subject: ${material.subject}`);
      console.log(`   Unit: ${material.unit}`);
      console.log(`   FileName: ${material.fileName}`);
      console.log(`   GridFS ID: ${material.gridfs_id}`);
      console.log(`   Status: ${material.status}`);
      console.log('');
    });
    
    // File type distribution
    const fileTypes = await materialsCollection.aggregate([
      { $match: { gridfs_id: { $ne: null } } },
      { $group: { _id: '$file_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('📈 FILE TYPE DISTRIBUTION (WITH GRIDFS):');
    fileTypes.forEach(type => {
      console.log(`${type._id}: ${type.count} files`);
    });
    
    console.log('\n🎯 SUCCESS! StudyPES materials imported with proper GridFS mapping');
    console.log('Now you can update the backend to use the axiona database and gridfs_id field');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await client.close();
  }
}

// Run the import
cleanAndImportStudyPESMaterials().catch(console.error);
