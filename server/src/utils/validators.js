// Validation utilities for the Study AI application

const mongoose = require('mongoose');

// Common validation functions
const validators = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation
  isValidPassword: (password) => {
    // At least 8 characters, contains letter and number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // MongoDB ObjectId validation
  isValidObjectId: (id) => {
    return mongoose.Types.ObjectId.isValid(id);
  },

  // YouTube ID validation
  isValidYouTubeId: (id) => {
    const youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
    return youtubeRegex.test(id);
  },

  // URL validation
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // File size validation (in bytes)
  isValidFileSize: (size, maxSize = 10 * 1024 * 1024) => { // Default 10MB
    return size > 0 && size <= maxSize;
  },

  // File extension validation
  isValidFileExtension: (filename, allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']) => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  },

  // Text length validation
  isValidLength: (text, minLength = 1, maxLength = 1000) => {
    return text && text.length >= minLength && text.length <= maxLength;
  },

  // Number range validation
  isValidRange: (number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    return typeof number === 'number' && number >= min && number <= max;
  },

  // Array validation
  isValidArray: (arr, minLength = 0, maxLength = 100) => {
    return Array.isArray(arr) && arr.length >= minLength && arr.length <= maxLength;
  },

  // Date validation
  isValidDate: (date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  // Future date validation
  isFutureDate: (date) => {
    const d = new Date(date);
    return validators.isValidDate(date) && d > new Date();
  },

  // Past date validation
  isPastDate: (date) => {
    const d = new Date(date);
    return validators.isValidDate(date) && d < new Date();
  }
};

// Request validation middleware
const validateRequest = {
  // User registration validation
  userRegistration: (req, res, next) => {
    const { fullName, email, password } = req.body;
    const errors = [];

    if (!validators.isValidLength(fullName, 2, 50)) {
      errors.push('Full name must be between 2 and 50 characters');
    }

    if (!validators.isValidEmail(email)) {
      errors.push('Please provide a valid email address');
    }

    if (!validators.isValidPassword(password)) {
      errors.push('Password must be at least 8 characters with letters and numbers');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  },

  // User login validation
  userLogin: (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!validators.isValidEmail(email)) {
      errors.push('Please provide a valid email address');
    }

    if (!password || password.length < 1) {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  },

  // Video validation
  video: (req, res, next) => {
    const { title, description, videoUrl, youtubeId } = req.body;
    const errors = [];

    if (!validators.isValidLength(title, 3, 200)) {
      errors.push('Title must be between 3 and 200 characters');
    }

    if (description && !validators.isValidLength(description, 0, 2000)) {
      errors.push('Description must be less than 2000 characters');
    }

    if (videoUrl && !validators.isValidUrl(videoUrl)) {
      errors.push('Please provide a valid video URL');
    }

    if (youtubeId && !validators.isValidYouTubeId(youtubeId)) {
      errors.push('Please provide a valid YouTube ID');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  },

  // PDF validation
  pdf: (req, res, next) => {
    const { topic, fileName, author, description } = req.body;
    const errors = [];

    if (!validators.isValidLength(topic, 2, 100)) {
      errors.push('Topic must be between 2 and 100 characters');
    }

    if (!validators.isValidLength(fileName, 3, 255)) {
      errors.push('File name must be between 3 and 255 characters');
    }

    if (!validators.isValidFileExtension(fileName, ['.pdf'])) {
      errors.push('Only PDF files are allowed');
    }

    if (author && !validators.isValidLength(author, 2, 100)) {
      errors.push('Author name must be between 2 and 100 characters');
    }

    if (description && !validators.isValidLength(description, 0, 1000)) {
      errors.push('Description must be less than 1000 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  },

  // ObjectId parameter validation
  objectId: (paramName = 'id') => {
    return (req, res, next) => {
      const id = req.params[paramName];
      
      if (!validators.isValidObjectId(id)) {
        return res.status(400).json({ error: `Invalid ${paramName}` });
      }

      next();
    };
  },

  // Pagination validation
  pagination: (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!validators.isValidRange(page, 1, 1000)) {
      return res.status(400).json({ error: 'Page must be between 1 and 1000' });
    }

    if (!validators.isValidRange(limit, 1, 100)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    req.pagination = { page, limit };
    next();
  }
};

// Error formatting
const formatValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return { message: 'Validation failed', errors };
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return { message: `${field} already exists` };
  }

  return { message: error.message || 'Validation failed' };
};

module.exports = {
  validators,
  validateRequest,
  formatValidationError
};
