import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      throw new AppError('Please provide all required fields', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create session
    const sessionId = uuidv4();

    // Create user
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      security: {
        tfaEnabled: false,
        sessions: [{
          id: sessionId,
          ua: req.headers['user-agent'] || 'Unknown',
          ip: req.ip || req.connection.remoteAddress || 'Unknown',
          lastSeen: new Date(),
          current: true
        }]
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        sessionId,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences
      }
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Create new session
    const sessionId = uuidv4();
    
    // Mark other sessions as not current
    user.security.sessions.forEach(session => {
      session.current = false;
    });

    // Add new session
    user.security.sessions.push({
      id: sessionId,
      ua: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
      lastSeen: new Date(),
      current: true
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        sessionId,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
        currentRoadmapId: user.currentRoadmapId
      }
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: {
        id: req.user!._id,
        fullName: req.user!.fullName,
        email: req.user!.email,
        avatarUrl: req.user!.avatarUrl,
        preferences: req.user!.preferences,
        currentRoadmapId: req.user!.currentRoadmapId,
        createdAt: req.user!.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res, next) => {
  try {
    // Find and deactivate current session
    const user = req.user!;
    const currentSession = user.security.sessions.find(session => session.current);
    
    if (currentSession) {
      currentSession.current = false;
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    return next(error);
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', protect, async (req, res, next) => {
  try {
    const user = req.user!;
    const sessionId = uuidv4();

    // Update current session
    const currentSession = user.security.sessions.find(session => session.current);
    if (currentSession) {
      currentSession.id = sessionId;
      currentSession.lastSeen = new Date();
    }

    await user.save();

    // Generate new JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        sessionId,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      token
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
