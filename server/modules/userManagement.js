const express = require('express');
const router = express.Router();

// In-memory storage (in production, use a database)
let users = [];
let userSessions = {};
let userProfiles = {};

// Helper function to generate user ID
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Helper function to generate session token
const generateSessionToken = () => {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
};

// Register new user
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Check if user already exists
  const existingUser = users.find(user => user.email === email || user.username === username);
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  // Create new user
  const userId = generateUserId();
  const newUser = {
    id: userId,
    username,
    email,
    password, // In production, hash this!
    createdAt: new Date(),
    lastLogin: null
  };
  
  users.push(newUser);
  
  // Initialize user profile
  userProfiles[userId] = {
    favoriteGenres: [],
    readingPreferences: {
      complexityLevel: 'medium',
      preferredLength: 'medium',
      preferredLanguages: ['en']
    },
    readingHistory: [],
    favoriteBooks: [],
    readingLists: [
      {
        id: 'want-to-read',
        name: 'Want to Read',
        description: 'Books you plan to read in the future',
        type: 'default',
        books: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'currently-reading',
        name: 'Currently Reading',
        description: 'Books you are actively reading now',
        type: 'default',
        books: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'read',
        name: 'Read',
        description: 'Books you have finished reading',
        type: 'default',
        books: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    recommendations: {
      useML: false,
      lastUpdated: null
    }
  };
  
  res.status(201).json({
    message: 'User created successfully',
    user: {
      id: userId,
      username,
      email
    }
  });
});

// Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate session token
  const sessionToken = generateSessionToken();
  userSessions[sessionToken] = {
    userId: user.id,
    createdAt: new Date(),
    lastAccessed: new Date()
  };
  
  // Update last login
  user.lastLogin = new Date();
  
  res.json({
    message: 'Login successful',
    token: sessionToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

// Logout user
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && userSessions[token]) {
    delete userSessions[token];
  }
  
  res.json({ message: 'Logout successful' });
});

// Get user profile
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !userSessions[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const session = userSessions[token];
  const user = users.find(u => u.id === session.userId);
  const profile = userProfiles[session.userId];
  
  if (!user || !profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Update last accessed
  session.lastAccessed = new Date();
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    },
    profile
  });
});

// Update user preferences
router.patch('/preferences', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !userSessions[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const session = userSessions[token];
  const profile = userProfiles[session.userId];
  
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const { favoriteGenres, readingPreferences, useML } = req.body;
  
  if (favoriteGenres) {
    profile.favoriteGenres = favoriteGenres;
  }
  
  if (readingPreferences) {
    profile.readingPreferences = { ...profile.readingPreferences, ...readingPreferences };
  }
  
  if (typeof useML !== 'undefined') {
    profile.recommendations.useML = useML;
  }
  
  res.json({ message: 'Preferences updated', profile });
});

// Middleware to authenticate requests
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !userSessions[token]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const session = userSessions[token];
  session.lastAccessed = new Date();
  req.user = { id: session.userId };
  
  next();
};

module.exports = { router, authenticateUser, userProfiles, users };
