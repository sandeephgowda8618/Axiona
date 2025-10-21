// Quick test script to verify MongoDB Atlas connection
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const testConnection = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB Atlas...')
    console.log('URI:', process.env.MONGODB_URI?.replace(/:[^:]*@/, ':****@'))
    
    await mongoose.connect(process.env.MONGODB_URI || '')
    
    console.log('✅ Successfully connected to MongoDB Atlas!')
    console.log('📊 Database:', mongoose.connection.db.databaseName)
    console.log('🏠 Host:', mongoose.connection.host)
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('📚 Collections:', collections.map(c => c.name))
    
    await mongoose.connection.close()
    console.log('🔐 Connection closed')
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
  }
}

testConnection()
