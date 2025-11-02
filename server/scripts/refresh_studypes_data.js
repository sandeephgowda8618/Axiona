#!/usr/bin/env node
/**
 * Refresh StudyPES Data Script
 * 1. Delete all existing documents in the studymaterials collection
 * 2. Insert all 330 StudyPES materials with proper metadata mapping
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the StudyMaterial model
const { StudyMaterial } = require('../src/models/StudyMaterial');
const { connectDB } = require('../src/config/database');

class StudyPESDataRefresher {
    constructor() {
        this.jsonFilePath = '../../StudyPES_material_retrival/StudyPES_data.json';
        this.materialsBasePath = '../../StudyPES_material_retrival/materials/';
        this.processedCount = 0;
        this.errorCount = 0;
        this.errors = [];
    }

    async loadStudyPESData() {
        try {
            const fullPath = path.resolve(__dirname, this.jsonFilePath);
            console.log(`📂 Loading StudyPES data from: ${fullPath}`);
            
            const rawData = fs.readFileSync(fullPath, 'utf8');
            const data = JSON.parse(rawData);
            
            console.log(`✅ Loaded ${data.length} StudyPES materials`);
            return data;
        } catch (error) {
            console.error('❌ Error loading StudyPES data:', error.message);
            throw error;
        }
    }

    getFileSize(fileName) {
        try {
            const filePath = path.resolve(__dirname, this.materialsBasePath, fileName);
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            console.warn(`⚠️ Could not get file size for ${fileName}: ${error.message}`);
            return 1024 * 1024; // Default 1MB
        }
    }

    mapStudyPESToSchema(studypesItem) {
        // Extract file extension
        const fileExtension = path.extname(studypesItem.fileName).toLowerCase().replace('.', '');
        
        // Map file paths
        const file_url = `/uploads/studypes/${studypesItem.fileName}`;
        const downloadUrl = `/api/materials/download/${studypesItem.fileName}`;
        
        // Get file size
        const file_size = this.getFileSize(studypesItem.fileName);
        
        // Map semester to academic year
        const academicYearMapping = {
            1: '1st Year', 2: '1st Year',
            3: '2nd Year', 4: '2nd Year', 
            5: '3rd Year', 6: '3rd Year',
            7: '4th Year', 8: '4th Year'
        };

        return {
            // Core StudyPES fields
            title: studypesItem.title || studypesItem.fileName,
            author: studypesItem.author || "StudyPES Materials",
            subject: studypesItem.subject || "General Studies",
            subject_key: studypesItem.subject_key || "GEN",
            semester: studypesItem.semester || 1,
            unit: studypesItem.unit || "1",
            topic: studypesItem.topic || "",
            category: studypesItem.category || "StudyPES",
            level: studypesItem.level || "Beginner",
            
            // File information
            fileName: studypesItem.fileName,
            pages: studypesItem.pages || 1,
            language: studypesItem.language || "English",
            publisher: studypesItem.publisher || "StudyPES",
            publication_year: studypesItem.publication_year || 2024,
            isbn: studypesItem.isbn || "",
            
            // URLs and paths
            file_url: file_url,
            downloadUrl: downloadUrl,
            thumbnail: studypesItem.thumbnail || "/images/default-thumbnail.png",
            
            // Content fields
            description: studypesItem.description || `${studypesItem.subject || 'Study material'} - ${studypesItem.topic || studypesItem.fileName}`,
            tags: studypesItem.tags || [],
            
            // File metadata
            file_type: fileExtension.toUpperCase(),
            file_size: file_size,
            fileType: fileExtension,
            
            // System fields
            uploadDate: new Date(),
            downloadCount: 0,
            approved: true,
            uploadedBy: "studypes_system",
            isActive: true,
            
            // Legacy compatibility fields
            class: academicYearMapping[studypesItem.semester] || `Semester ${studypesItem.semester}`,
            year: String(studypesItem.publication_year || 2024),
            fileSize: this.formatFileSize(file_size)
        };
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async clearExistingData() {
        try {
            console.log('🗑️  Clearing existing studymaterials collection...');
            const deleteResult = await StudyMaterial.deleteMany({});
            console.log(`✅ Deleted ${deleteResult.deletedCount} existing documents`);
            return deleteResult.deletedCount;
        } catch (error) {
            console.error('❌ Error clearing existing data:', error.message);
            throw error;
        }
    }

    async insertStudyPESMaterials(studypesData) {
        console.log(`📥 Starting bulk insert of ${studypesData.length} materials...`);
        
        // Process in batches to avoid memory issues
        const batchSize = 50;
        let totalInserted = 0;
        
        for (let i = 0; i < studypesData.length; i += batchSize) {
            const batch = studypesData.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(studypesData.length / batchSize);
            
            console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)...`);
            
            try {
                // Map batch to schema format
                const mappedBatch = batch.map(item => this.mapStudyPESToSchema(item));
                
                // Insert batch
                const insertResult = await StudyMaterial.insertMany(mappedBatch, { ordered: false });
                totalInserted += insertResult.length;
                this.processedCount += insertResult.length;
                
                console.log(`✅ Batch ${batchNumber} inserted: ${insertResult.length} documents`);
                
            } catch (error) {
                console.error(`❌ Error in batch ${batchNumber}:`, error.message);
                this.errorCount += batch.length;
                this.errors.push(`Batch ${batchNumber}: ${error.message}`);
                
                // Try individual inserts for failed batch
                console.log(`🔄 Attempting individual inserts for batch ${batchNumber}...`);
                await this.insertIndividually(batch);
            }
        }
        
        console.log(`✅ Bulk insert completed: ${totalInserted} documents inserted`);
        return totalInserted;
    }

    async insertIndividually(batch) {
        for (const item of batch) {
            try {
                const mappedItem = this.mapStudyPESToSchema(item);
                await StudyMaterial.create(mappedItem);
                this.processedCount++;
                console.log(`✅ Individual insert: ${item.fileName}`);
            } catch (error) {
                this.errorCount++;
                this.errors.push(`${item.fileName}: ${error.message}`);
                console.error(`❌ Failed individual insert: ${item.fileName} - ${error.message}`);
            }
        }
    }

    async verifyInsertedData() {
        try {
            const totalCount = await StudyMaterial.countDocuments();
            console.log(`📊 Verification: ${totalCount} documents in collection`);
            
            // Get sample data
            const sampleDocs = await StudyMaterial.find().limit(3).select('title fileName subject semester level');
            console.log('📋 Sample documents:');
            sampleDocs.forEach((doc, index) => {
                console.log(`  ${index + 1}. ${doc.title} (${doc.fileName}) - ${doc.subject} - Sem ${doc.semester} - ${doc.level}`);
            });
            
            // Get subject distribution
            const subjectStats = await StudyMaterial.aggregate([
                { $group: { _id: '$subject', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);
            
            console.log('📈 Top subjects:');
            subjectStats.forEach(stat => {
                console.log(`  ${stat._id}: ${stat.count} materials`);
            });
            
            return totalCount;
        } catch (error) {
            console.error('❌ Error during verification:', error.message);
            return 0;
        }
    }

    async run() {
        try {
            console.log('🚀 Starting StudyPES Data Refresh...');
            console.log('=' * 60);
            
            // Connect to database
            console.log('🔌 Connecting to MongoDB...');
            await connectDB();
            
            // Load StudyPES data
            const studypesData = await this.loadStudyPESData();
            
            // Clear existing data
            const deletedCount = await this.clearExistingData();
            
            // Insert new data
            const insertedCount = await this.insertStudyPESMaterials(studypesData);
            
            // Verify results
            const finalCount = await this.verifyInsertedData();
            
            // Final summary
            console.log('=' * 60);
            console.log('🎉 StudyPES Data Refresh Complete!');
            console.log(`📊 Summary:`);
            console.log(`  Deleted: ${deletedCount} old documents`);
            console.log(`  Processed: ${this.processedCount} documents`);
            console.log(`  Errors: ${this.errorCount} documents`);
            console.log(`  Final count: ${finalCount} documents in database`);
            
            if (this.errors.length > 0) {
                console.log(`❌ Errors encountered:`);
                this.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
                if (this.errors.length > 10) {
                    console.log(`  ... and ${this.errors.length - 10} more errors`);
                }
            }
            
        } catch (error) {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        } finally {
            // Close database connection
            await mongoose.connection.close();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
if (require.main === module) {
    const refresher = new StudyPESDataRefresher();
    refresher.run().catch(console.error);
}

module.exports = StudyPESDataRefresher;
