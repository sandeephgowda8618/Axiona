// check_studypes_gridfs_integrity.js
// Checks that all gridfs_id values in studypes_materials exist in GridFS

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/axiona';
const DB_NAME = 'axiona';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const materials = await db.collection('studypes_materials').find({ gridfs_id: { $exists: true, $ne: null } }).toArray();
    const gridfsIds = materials.map(m => m.gridfs_id);
    const fsFiles = db.collection('fs.files');
    let missing = [];
    for (const mat of materials) {
      const file = await fsFiles.findOne({ _id: mat.gridfs_id });
      if (!file) {
        missing.push({
          material_id: mat._id,
          gridfs_id: mat.gridfs_id,
          title: mat.title,
          subject: mat.subject,
          fileName: mat.fileName
        });
      }
    }
    if (missing.length === 0) {
      console.log('✅ All gridfs_id files exist in GridFS.');
    } else {
      console.log(`❌ Missing files in GridFS for ${missing.length} materials:`);
      missing.forEach(m => {
        console.log(`Material: ${m.title} | Subject: ${m.subject} | fileName: ${m.fileName} | material_id: ${m.material_id} | gridfs_id: ${m.gridfs_id}`);
      });
    }
    // Group by subject (optional, for display)
    const subjectMap = new Map();
    for (const mat of materials) {
      if (!subjectMap.has(mat.subject)) {
        subjectMap.set(mat.subject, []);
      }
      subjectMap.get(mat.subject).push(mat);
    }

    // Display cards for each material, grouped by subject, no duplicates
    let total = 0;
    for (const [subject, mats] of subjectMap.entries()) {
      console.log(`\n=== Subject: ${subject} ===`);
      for (const mat of mats) {
        total++;
        console.log(`Card #${total}: ${mat.title} | fileName: ${mat.fileName} | material_id: ${mat._id} | gridfs_id: ${mat.gridfs_id}`);
      }
    }
    console.log(`\nTotal unique materials displayed: ${total}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
