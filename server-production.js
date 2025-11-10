require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { generateToken } = require('./utils/jwt');
const User = require('./models/User');
const Contact = require('./models/Contact');
const { protect, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow CDN resources
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Announcements endpoint
app.get('/api/announcements', async (_req, res) => {
  try {
    const response = await fetch(process.env.ECE_ANNOUNCEMENTS_URL || 'https://www.ece.ntua.gr/gr/announcements');
    const html = await response.text();
    const $ = cheerio.load(html);
    const announcements = [];
    
    $('#announcementsTable tbody tr').each((_, row) => {
      const cols = $(row).find('td');
      const date = $(cols[0]).text().trim();
      const title = $(cols[1]).text().trim();
      const category = $(cols[2]).text().trim();
      const link = $(cols[1]).find('a').attr('href');
      announcements.push({ date, title, category, link });
    });
    
    res.json(announcements);
  } catch (err) {
    logger.error('Failed to fetch announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// User registration
app.post('/api/users', async (req, res) => {
  try {
    const { univid, name, password, email, year, specialization } = req.body;

    // Validation
    if (!univid || !name || !password) {
      return res.status(400).json({ 
        error: 'Please provide University ID, name, and password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ univid });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'A user with this university ID already exists.' 
      });
    }

    // Create user
    const user = await User.create({
      univid,
      name,
      password,
      email,
      year,
      specialization
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${univid}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        univid: user.univid,
        name: user.name,
        email: user.email,
        year: user.year,
        specialization: user.specialization
      }
    });
  } catch (error) {
    logger.error('User registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { univid, password } = req.body;

    // Validation
    if (!univid || !password) {
      return res.status(400).json({ 
        error: 'Please provide University ID and password' 
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ univid }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${univid}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        univid: user.univid,
        name: user.name,
        email: user.email,
        year: user.year,
        specialization: user.specialization
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user (protected route)
app.get('/api/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      univid: req.user.univid,
      name: req.user.name,
      email: req.user.email,
      year: req.user.year,
      specialization: req.user.specialization,
      role: req.user.role
    }
  });
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.') || 
        email.indexOf('@') > email.lastIndexOf('.')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Save to database
    const contact = await Contact.create({
      name,
      email,
      message
    });

    logger.info(`Contact form submission from: ${email}`);

    res.status(200).json({ 
      success: true, 
      message: 'Thank you for contacting us! We will get back to you soon.',
      id: contact._id
    });
  } catch (error) {
    logger.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to submit contact form. Please try again.' 
    });
  }
});

// Get all contacts (admin only)
app.get('/api/contacts', protect, authorize('admin'), async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    logger.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});
