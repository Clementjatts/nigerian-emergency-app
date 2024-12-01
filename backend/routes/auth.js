const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, getProfile } = require('../controllers/authController');

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get user profile
router.get('/profile', auth, getProfile);

module.exports = router;
