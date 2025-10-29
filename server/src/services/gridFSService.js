const mongoose = require('mongoose');
const multer = require('multer');
const GridFSBucket = require('mongodb').GridFSBucket;
const { GridFSBucketWriteStream } = require('mongodb');

class GridFSService {
  constructor() {
    this.bucket = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.initGridFS();
  }

  initGridFS() {
    this.initPromise = new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        // Already connected
        this.bucket = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'pdfs'
        });
        this.isInitialized = true;
        console.log('📁 GridFS initialized for PDF storage');
        resolve();
      } else {
        // Wait for connection
        mongoose.connection.once('open', () => {
          this.bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'pdfs'
          });
          this.isInitialized = true;
          console.log('📁 GridFS initialized for PDF storage');
          resolve();
        });

        mongoose.connection.once('error', (error) => {
          reject(error);
        });
      }
    });
  }

  async waitForInit() {
    if (this.isInitialized) return;
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // Get GridFS bucket
  getBucket() {
    return this.bucket;
  }

  // Upload PDF to GridFS
  async uploadPDF(buffer, filename, metadata = {}) {
    await this.waitForInit();
    
    return new Promise((resolve, reject) => {
      if (!this.bucket) {
        return reject(new Error('GridFS not initialized'));
      }

      const uploadStream = this.bucket.openUploadStream(filename, {
        metadata: {
          originalName: filename,
          uploadDate: new Date(),
          contentType: 'application/pdf',
          ...metadata
        }
      });

      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: filename,
          length: uploadStream.bytesWritten
        });
      });

      // Write buffer to GridFS
      uploadStream.end(buffer);
    });
  }

  // Upload PDF from file path
  async uploadFromPath(filePath, filename, metadata = {}) {
    await this.waitForInit();
    
    const fs = require('fs');
    
    return new Promise((resolve, reject) => {
      if (!this.bucket) {
        return reject(new Error('GridFS not initialized'));
      }

      // Read file
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      const uploadStream = this.bucket.openUploadStream(filename, {
        metadata: {
          originalName: filename,
          uploadDate: new Date(),
          contentType: 'application/pdf',
          ...metadata
        }
      });

      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: filename,
          length: uploadStream.bytesWritten
        });
      });

      // Create read stream and pipe to GridFS
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(uploadStream);
    });
  }

  // Download PDF stream
  async downloadPDF(fileId) {
    await this.waitForInit();
    
    if (!this.bucket) {
      throw new Error('GridFS not initialized');
    }

    return this.bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  }

  // Get PDF info
  async getPDFInfo(fileId) {
    await this.waitForInit();
    
    if (!this.bucket) {
      throw new Error('GridFS not initialized');
    }

    try {
      const files = await this.bucket.find({ 
        _id: new mongoose.Types.ObjectId(fileId) 
      }).toArray();
      
      return files.length > 0 ? files[0] : null;
    } catch (error) {
      throw new Error(`Failed to get PDF info: ${error.message}`);
    }
  }

  // Delete PDF
  async deletePDF(fileId) {
    await this.waitForInit();
    
    if (!this.bucket) {
      throw new Error('GridFS not initialized');
    }

    try {
      await this.bucket.delete(new mongoose.Types.ObjectId(fileId));
      return true;
    } catch (error) {
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  }

  // List all PDFs
  async listPDFs(filter = {}) {
    await this.waitForInit();
    
    if (!this.bucket) {
      throw new Error('GridFS not initialized');
    }

    try {
      const files = await this.bucket.find(filter).toArray();
      return files;
    } catch (error) {
      throw new Error(`Failed to list PDFs: ${error.message}`);
    }
  }

  // Check if file exists
  async fileExists(fileId) {
    await this.waitForInit();
    
    if (!this.bucket) {
      throw new Error('GridFS not initialized');
    }

    try {
      const files = await this.bucket.find({ 
        _id: new mongoose.Types.ObjectId(fileId) 
      }).toArray();
      
      return files.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Get file size
  async getFileSize(fileId) {
    await this.waitForInit();
    
    const fileInfo = await this.getPDFInfo(fileId);
    return fileInfo ? fileInfo.length : 0;
  }

  // Multer GridFS Storage
  getMulterStorage() {
    return multer.memoryStorage(); // Use memory storage and handle GridFS manually
  }
}

// Export singleton instance
const gridFSService = new GridFSService();
module.exports = gridFSService;
