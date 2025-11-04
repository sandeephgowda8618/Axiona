const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

async function testStudyPESMaterials() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('study-ai');
    const booksCollection = db.collection('books');
    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
    
    // Get all StudyPES materials
    console.log('\n🔍 Analyzing StudyPES materials...\n');
    
    const allMaterials = await booksCollection.find({
      source: 'StudyPES'
    }).toArray();
    
    console.log(`📊 Total StudyPES materials in database: ${allMaterials.length}`);
    
    // Group by file extension
    const fileTypeStats = {};
    const issues = {
      missingGridFSId: [],
      missingFileName: [],
      gridFSNotFound: [],
      successfulPDFs: [],
      nonPDFFiles: []
    };
    
    for (const material of allMaterials) {
      // Check file extension
      const fileName = material.fileName || material.title || 'unknown';
      const extension = fileName.split('.').pop()?.toLowerCase() || 'no-extension';
      
      fileTypeStats[extension] = (fileTypeStats[extension] || 0) + 1;
      
      // Check for issues
      if (!material.gridFSFileId) {
        issues.missingGridFSId.push({
          id: material._id,
          title: material.title,
          fileName: fileName,
          subject: material.subject,
          unit: material.unit
        });
        continue;
      }
      
      if (!material.fileName) {
        issues.missingFileName.push({
          id: material._id,
          title: material.title,
          gridFSFileId: material.gridFSFileId,
          subject: material.subject,
          unit: material.unit
        });
      }
      
      // Check if GridFS file exists
      try {
        const gridFSFile = await bucket.find({ _id: new ObjectId(material.gridFSFileId) }).next();
        if (!gridFSFile) {
          issues.gridFSNotFound.push({
            id: material._id,
            title: material.title,
            gridFSFileId: material.gridFSFileId,
            fileName: fileName,
            subject: material.subject,
            unit: material.unit
          });
        } else {
          // File exists in GridFS
          if (extension === 'pdf') {
            issues.successfulPDFs.push({
              id: material._id,
              title: material.title,
              gridFSFileId: material.gridFSFileId,
              fileName: fileName,
              subject: material.subject,
              unit: material.unit,
              gridFSFileName: gridFSFile.filename
            });
          } else {
            issues.nonPDFFiles.push({
              id: material._id,
              title: material.title,
              gridFSFileId: material.gridFSFileId,
              fileName: fileName,
              extension: extension,
              subject: material.subject,
              unit: material.unit,
              gridFSFileName: gridFSFile.filename
            });
          }
        }
      } catch (error) {
        issues.gridFSNotFound.push({
          id: material._id,
          title: material.title,
          gridFSFileId: material.gridFSFileId,
          fileName: fileName,
          subject: material.subject,
          unit: material.unit,
          error: error.message
        });
      }
    }
    
    // Print detailed analysis
    console.log('\n📈 FILE TYPE DISTRIBUTION:');
    console.log('============================');
    Object.entries(fileTypeStats).forEach(([ext, count]) => {
      console.log(`${ext.toUpperCase().padEnd(10)}: ${count} files`);
    });
    
    console.log('\n❌ ISSUES FOUND:');
    console.log('==================');
    
    console.log(`\n🚫 Missing GridFS ID (${issues.missingGridFSId.length} files):`);
    issues.missingGridFSId.slice(0, 10).forEach(item => {
      console.log(`   - ${item.subject}/${item.unit}: ${item.title} (${item.fileName})`);
    });
    if (issues.missingGridFSId.length > 10) {
      console.log(`   ... and ${issues.missingGridFSId.length - 10} more`);
    }
    
    console.log(`\n📂 Missing fileName property (${issues.missingFileName.length} files):`);
    issues.missingFileName.slice(0, 10).forEach(item => {
      console.log(`   - ${item.subject}/${item.unit}: ${item.title} (GridFS: ${item.gridFSFileId})`);
    });
    if (issues.missingFileName.length > 10) {
      console.log(`   ... and ${issues.missingFileName.length - 10} more`);
    }
    
    console.log(`\n🔍 GridFS file not found (${issues.gridFSNotFound.length} files):`);
    issues.gridFSNotFound.slice(0, 10).forEach(item => {
      console.log(`   - ${item.subject}/${item.unit}: ${item.title} (${item.fileName}) - GridFS ID: ${item.gridFSFileId}`);
    });
    if (issues.gridFSNotFound.length > 10) {
      console.log(`   ... and ${issues.gridFSNotFound.length - 10} more`);
    }
    
    console.log('\n✅ WORKING FILES:');
    console.log('==================');
    
    console.log(`\n📄 Working PDFs (${issues.successfulPDFs.length} files):`);
    issues.successfulPDFs.slice(0, 10).forEach(item => {
      console.log(`   ✓ ${item.subject}/${item.unit}: ${item.title} (${item.fileName})`);
    });
    if (issues.successfulPDFs.length > 10) {
      console.log(`   ... and ${issues.successfulPDFs.length - 10} more working PDFs`);
    }
    
    console.log(`\n📊 Non-PDF files with GridFS (${issues.nonPDFFiles.length} files):`);
    const nonPDFByType = {};
    issues.nonPDFFiles.forEach(item => {
      nonPDFByType[item.extension] = (nonPDFByType[item.extension] || []);
      nonPDFByType[item.extension].push(item);
    });
    
    Object.entries(nonPDFByType).forEach(([ext, files]) => {
      console.log(`   ${ext.toUpperCase()} (${files.length} files):`);
      files.slice(0, 5).forEach(item => {
        console.log(`     - ${item.subject}/${item.unit}: ${item.title}`);
      });
      if (files.length > 5) {
        console.log(`     ... and ${files.length - 5} more ${ext} files`);
      }
    });
    
    // Test a few API endpoints
    console.log('\n🌐 TESTING API ENDPOINTS:');
    console.log('==========================');
    
    const subjects = await booksCollection.distinct('subject', { source: 'StudyPES' });
    console.log(`📚 Available subjects: ${subjects.join(', ')}`);
    
    // Check if backend API structure matches what frontend expects
    console.log('\n🔧 FRONTEND COMPATIBILITY CHECK:');
    console.log('=================================');
    
    const sampleSubject = subjects[0];
    if (sampleSubject) {
      const subjectMaterials = await booksCollection.find({
        source: 'StudyPES',
        subject: sampleSubject
      }).toArray();
      
      const units = [...new Set(subjectMaterials.map(m => m.unit).filter(Boolean))];
      console.log(`📖 Subject "${sampleSubject}" has ${subjectMaterials.length} materials in units: ${units.join(', ')}`);
      
      // Count viewable vs non-viewable
      const viewablePDFs = subjectMaterials.filter(m => m.gridFSFileId && m.fileName?.toLowerCase().endsWith('.pdf')).length;
      const nonPDFsWithGridFS = subjectMaterials.filter(m => m.gridFSFileId && !m.fileName?.toLowerCase().endsWith('.pdf')).length;
      const missingFiles = subjectMaterials.filter(m => !m.gridFSFileId).length;
      
      console.log(`   ✅ Viewable PDFs: ${viewablePDFs}`);
      console.log(`   📊 Non-PDF files (downloadable): ${nonPDFsWithGridFS}`);
      console.log(`   ❌ Missing files: ${missingFiles}`);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('============');
    console.log(`📊 Total materials: ${allMaterials.length}`);
    console.log(`✅ Working PDFs: ${issues.successfulPDFs.length}`);
    console.log(`📄 Non-PDF files: ${issues.nonPDFFiles.length}`);
    console.log(`❌ Missing GridFS ID: ${issues.missingGridFSId.length}`);
    console.log(`🔍 GridFS not found: ${issues.gridFSNotFound.length}`);
    console.log(`📂 Missing fileName: ${issues.missingFileName.length}`);
    
    const workingFiles = issues.successfulPDFs.length + issues.nonPDFFiles.length;
    const successRate = ((workingFiles / allMaterials.length) * 100).toFixed(1);
    console.log(`\n🎯 Overall success rate: ${successRate}% (${workingFiles}/${allMaterials.length})`);
    
    if (issues.missingGridFSId.length > 0 || issues.gridFSNotFound.length > 0) {
      console.log('\n⚠️  RECOMMENDATIONS:');
      console.log('====================');
      
      if (issues.missingGridFSId.length > 0) {
        console.log('1. Re-import StudyPES materials to ensure all files have GridFS IDs');
      }
      
      if (issues.gridFSNotFound.length > 0) {
        console.log('2. Check GridFS collection for missing files and re-upload if needed');
      }
      
      if (issues.missingFileName.length > 0) {
        console.log('3. Update materials to include proper fileName properties');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testStudyPESMaterials().catch(console.error);
