const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

async function comprehensiveTestAxionaDB() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('axiona');
    const materialsCollection = db.collection('studypes_materials');
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    console.log('\n🔍 COMPREHENSIVE DATABASE TEST');
    console.log('===============================');
    
    // Test 1: Count all materials
    const totalMaterials = await materialsCollection.countDocuments();
    console.log(`📊 Total StudyPES materials: ${totalMaterials}`);
    
    // Test 2: Count materials with GridFS
    const withGridFS = await materialsCollection.countDocuments({ gridfs_id: { $ne: null } });
    const withoutGridFS = await materialsCollection.countDocuments({ gridfs_id: null });
    console.log(`✅ Materials with GridFS: ${withGridFS}`);
    console.log(`❌ Materials without GridFS: ${withoutGridFS}`);
    
    // Test 3: File type distribution
    console.log('\n📈 FILE TYPE DISTRIBUTION:');
    const fileTypes = await materialsCollection.aggregate([
      { $group: { _id: '$file_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    fileTypes.forEach(type => {
      console.log(`${type._id}: ${type.count} files`);
    });
    
    // Test 4: Subject distribution
    console.log('\n📚 SUBJECT DISTRIBUTION:');
    const subjects = await materialsCollection.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    subjects.slice(0, 10).forEach(subject => {
      console.log(`${subject._id}: ${subject.count} materials`);
    });
    
    // Test 5: GridFS file verification
    console.log('\n📁 GRIDFS VERIFICATION:');
    const gridFSFiles = await db.collection('fs.files').countDocuments();
    const gridFSChunks = await db.collection('fs.chunks').countDocuments();
    console.log(`Files in GridFS: ${gridFSFiles}`);
    console.log(`Chunks in GridFS: ${gridFSChunks}`);
    
    // Test 6: Sample materials with working GridFS
    console.log('\n🧪 TESTING SAMPLE MATERIALS:');
    const sampleMaterials = await materialsCollection.find({ 
      gridfs_id: { $ne: null },
      file_type: 'PDF' 
    }).limit(5).toArray();
    
    for (const material of sampleMaterials) {
      console.log(`\n📄 Testing: ${material.title}`);
      console.log(`   Subject: ${material.subject}`);
      console.log(`   Unit: ${material.unit}`);
      console.log(`   File: ${material.fileName}`);
      console.log(`   GridFS ID: ${material.gridfs_id}`);
      
      // Test if GridFS file exists
      try {
        const gridFSFile = await bucket.find({ _id: new ObjectId(material.gridfs_id) }).next();
        if (gridFSFile) {
          console.log(`   ✅ GridFS file found: ${gridFSFile.filename} (${gridFSFile.length} bytes)`);
        } else {
          console.log(`   ❌ GridFS file NOT found`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking GridFS: ${error.message}`);
      }
    }
    
    // Test 7: API-ready structure check
    console.log('\n🌐 API STRUCTURE TEST:');
    const apiTestSubject = 'Operating Systems';
    const subjectMaterials = await materialsCollection.find({ 
      subject: apiTestSubject 
    }).toArray();
    
    if (subjectMaterials.length > 0) {
      console.log(`📖 ${apiTestSubject}: ${subjectMaterials.length} materials`);
      
      // Group by units
      const units = {};
      subjectMaterials.forEach(material => {
        const unit = material.unit || 'Unknown';
        if (!units[unit]) units[unit] = [];
        units[unit].push(material);
      });
      
      Object.entries(units).forEach(([unit, materials]) => {
        const withFiles = materials.filter(m => m.gridfs_id).length;
        const withoutFiles = materials.filter(m => !m.gridfs_id).length;
        console.log(`   Unit ${unit}: ${materials.length} total (${withFiles} with files, ${withoutFiles} without)`);
      });
    }
    
    // Test 8: File accessibility test
    console.log('\n🔗 FILE ACCESSIBILITY TEST:');
    const testMaterial = await materialsCollection.findOne({ 
      gridfs_id: { $ne: null },
      subject: 'Operating Systems'
    });
    
    if (testMaterial) {
      console.log(`🧪 Testing file access for: ${testMaterial.title}`);
      try {
        // Try to read file metadata
        const fileInfo = await bucket.find({ _id: new ObjectId(testMaterial.gridfs_id) }).next();
        if (fileInfo) {
          console.log(`   ✅ File accessible: ${fileInfo.filename}`);
          console.log(`   📏 Size: ${fileInfo.length} bytes`);
          console.log(`   📅 Upload Date: ${fileInfo.uploadDate}`);
          console.log(`   🎯 This file can be served via: /api/files/${testMaterial.gridfs_id}`);
        }
      } catch (error) {
        console.log(`   ❌ File access error: ${error.message}`);
      }
    }
    
    // Test 9: Data integrity check
    console.log('\n🛡️  DATA INTEGRITY CHECK:');
    const missingTitles = await materialsCollection.countDocuments({ title: { $exists: false } });
    const missingSubjects = await materialsCollection.countDocuments({ subject: { $exists: false } });
    const missingFileNames = await materialsCollection.countDocuments({ fileName: { $exists: false } });
    
    console.log(`Missing titles: ${missingTitles}`);
    console.log(`Missing subjects: ${missingSubjects}`);
    console.log(`Missing fileNames: ${missingFileNames}`);
    
    // Test 10: Sample API response format
    console.log('\n📡 SAMPLE API RESPONSE FORMAT:');
    const apiSample = await materialsCollection.findOne({ 
      gridfs_id: { $ne: null },
      subject: 'Machine Learning'
    });
    
    if (apiSample) {
      const apiFormat = {
        id: apiSample._id.toString(),
        title: apiSample.title,
        subject: apiSample.subject,
        unit: apiSample.unit,
        fileName: apiSample.fileName,
        file_type: apiSample.file_type,
        pages: apiSample.pages,
        gridfs_id: apiSample.gridfs_id.toString(),
        fileUrl: `/api/files/${apiSample.gridfs_id}`,
        downloadUrl: `/api/files/${apiSample.gridfs_id}/download`
      };
      
      console.log('Sample API response format:');
      console.log(JSON.stringify(apiFormat, null, 2));
    }
    
    // Final Summary
    console.log('\n🎯 FINAL TEST SUMMARY:');
    console.log('======================');
    const successRate = ((withGridFS / totalMaterials) * 100).toFixed(1);
    console.log(`📊 Total Materials: ${totalMaterials}`);
    console.log(`✅ Success Rate: ${successRate}% (${withGridFS}/${totalMaterials})`);
    console.log(`📁 GridFS Files: ${gridFSFiles}`);
    console.log(`🗂️  Available Subjects: ${subjects.length}`);
    console.log(`📝 File Types: ${fileTypes.length}`);
    
    if (withGridFS === totalMaterials) {
      console.log('\n🏆 PERFECT! All materials have GridFS files.');
      console.log('🚀 Ready to update backend to use Axiona database!');
    } else {
      console.log(`\n⚠️  ${withoutGridFS} materials missing GridFS files.`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await client.close();
  }
}

// Run comprehensive test
comprehensiveTestAxionaDB().catch(console.error);
