const dotenv = require('dotenv');
// Load environment variables first
dotenv.config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('express-async-errors');

// Import database connection
const { connectDB } = require('./config/database');

// Import Firebase configuration
const firebaseAdmin = require('./config/firebase');

// Import Socket.IO service
const socketService = require('./services/socketService');

// Import routes
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5050;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://10.238.47.49:5173',
    'http://10.238.47.49:5174',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting - Increased limits for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // Allow 1000 requests per minute for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api', limiter);
} else {
  console.log('⚡ Rate limiting disabled in development mode');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for PDFs and documents
app.use('/docs', express.static(path.join(__dirname, '../../docs'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'inline');
    }
  }
}));

// Compression middleware
app.use(compression());

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Study-AI API',
    version: '1.0.0',
    message: 'Welcome to Study-AI Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize Firebase Admin
    firebaseAdmin.initialize();
    
    // Initialize Socket.IO
    socketService.initialize(server);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 Study-AI Backend API`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📖 API Root: http://localhost:${PORT}/api`);
      console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
      console.log(`💾 Database: MongoDB connected`);
      
      if (firebaseAdmin.isMockMode()) {
        console.log(`⚠️ Firebase Admin in MOCK mode - configure credentials for production`);
      } else {
        console.log(`🔥 Firebase Admin configured`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
