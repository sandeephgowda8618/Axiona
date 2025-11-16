const { MongoClient } = require('mongodb');

async function fixStudyPESSource() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('study-ai');
    const booksCollection = db.collection('books');
    
    // First, let's identify StudyPES materials by checking the original data
    const fs = require('fs');
    const path = require('path');
    
    const studyPESDataPath = path.join(__dirname, '..', 'StudyPES_material_retrival', 'StudyPES_data.json');
    const rawData = fs.readFileSync(studyPESDataPath, 'utf8');
    const studyPESData = JSON.parse(rawData);
    
    console.log(`📁 Found ${studyPESData.length} materials in StudyPES_data.json`);
    
    // Get all titles from StudyPES data
    const studyPESTitles = studyPESData.map(material => material.title);
    
    console.log('🔍 Identifying StudyPES materials in database...');
    
    // Find materials in database that match StudyPES titles
    const studyPESMaterials = await booksCollection.find({
      title: { $in: studyPESTitles }
    }).toArray();
    
    console.log(`📊 Found ${studyPESMaterials.length} StudyPES materials in database`);
    
    if (studyPESMaterials.length > 0) {
      console.log('🔄 Updating source field to "StudyPES"...');
      
      // Update all StudyPES materials to have source: "StudyPES"
      const updateResult = await booksCollection.updateMany(
        { title: { $in: studyPESTitles } },
        { $set: { source: 'StudyPES' } }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} materials with source: "StudyPES"`);
      
      // Also update any missing fileName fields from the original data
      console.log('🔄 Updating fileName fields...');
      
      let fileNameUpdates = 0;
      for (const originalMaterial of studyPESData) {
        if (originalMaterial.fileName) {
          const updateFileNameResult = await booksCollection.updateOne(
            { title: originalMaterial.title },
            { $set: { fileName: originalMaterial.fileName } }
          );
          if (updateFileNameResult.modifiedCount > 0) {
            fileNameUpdates++;
          }
        }
      }
      
      console.log(`✅ Updated ${fileNameUpdates} materials with fileName property`);
      
      // Verify the update
      const verifyCount = await booksCollection.countDocuments({ source: 'StudyPES' });
      console.log(`🎯 Verification: ${verifyCount} materials now have source: "StudyPES"`);
      
      // Show sample of updated materials
      const sampleUpdated = await booksCollection.find({ source: 'StudyPES' }).limit(5).toArray();
      console.log('\n📋 Sample updated materials:');
      sampleUpdated.forEach((material, index) => {
        console.log(`${index + 1}. "${material.title}"`);
        console.log(`   Source: ${material.source}`);
        console.log(`   Subject: ${material.subject}`);
        console.log(`   Unit: ${material.unit}`);
        console.log(`   FileName: ${material.fileName}`);
        console.log(`   GridFSFileId: ${material.gridFSFileId || 'MISSING'}`);
        console.log('');
      });
      
      // Check file type distribution
      const materials = await booksCollection.find({ source: 'StudyPES' }).toArray();
      const fileTypes = {};
      let hasGridFSId = 0;
      let missingGridFSId = 0;
      
      materials.forEach(material => {
        const fileName = material.fileName || 'unknown';
        const extension = fileName.split('.').pop()?.toLowerCase() || 'no-extension';
        fileTypes[extension] = (fileTypes[extension] || 0) + 1;
        
        if (material.gridFSFileId) {
          hasGridFSId++;
        } else {
          missingGridFSId++;
        }
      });
      
      console.log('\n📈 FILE TYPE DISTRIBUTION:');
      Object.entries(fileTypes).forEach(([ext, count]) => {
        console.log(`${ext.toUpperCase().padEnd(10)}: ${count} files`);
      });
      
      console.log(`\n📊 GridFS Status:`);
      console.log(`✅ With GridFS ID: ${hasGridFSId}`);
      console.log(`❌ Missing GridFS ID: ${missingGridFSId}`);
      
      console.log(`\n🎯 SUCCESS: StudyPES materials are now properly identified!`);
      console.log(`Frontend should now be able to load ${verifyCount} StudyPES materials.`);
      
    } else {
      console.log('❌ No StudyPES materials found in database');
    }
    
  } catch (error) {
    console.error('❌ Error fixing StudyPES source:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
fixStudyPESSource().catch(console.error);
