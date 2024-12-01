const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
    createEmergency, 
    getUserEmergencies, 
    updateEmergencyStatus 
} = require('../controllers/emergencyController');

// Create new emergency
router.post('/', auth, createEmergency);

// Get user's emergencies
router.get('/', auth, getUserEmergencies);

// Update emergency status
router.patch('/:id/status', auth, updateEmergencyStatus);

module.exports = router;
