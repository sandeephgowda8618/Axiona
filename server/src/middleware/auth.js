const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { AppError } = require('./errorHandler');

// JWT token verification middleware
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!user) {
      throw new AppError('Not authorized, user not found', 401);
    }

    // Check if user session is still valid
    const activeSession = user.security.sessions.find(session => 
      session.current && session.id === decoded.sessionId
    );

    if (!activeSession) {
      throw new AppError('Session expired, please login again', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Not authorized, invalid token', 401));
    } else {
      next(error);
    }
  }
};

// Admin role verification middleware
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized, user not found', 401));
  }

  // In a real app, you might have a role field in the user model
  // For now, we'll check if the user is an admin based on email or a specific field
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  
  if (!adminEmails.includes(req.user.email)) {
    return next(new AppError('Access denied, admin privileges required', 403));
  }

  next();
};

// Optional authentication middleware (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

module.exports = { protect, adminOnly, optionalAuth };
