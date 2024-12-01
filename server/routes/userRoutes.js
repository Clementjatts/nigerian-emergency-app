const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const upload = require('../middleware/upload');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  res.json(req.user);
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'name', 'phone', 'emergencyContacts', 
    'medicalInfo', 'settings', 'notificationsEnabled'
  ];
  
  const isValidOperation = updates.every(update => 
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    req.user.avatar = req.file.path;
    await req.user.save();
    res.json({ avatar: req.user.avatar });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user location
router.post('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    req.user.location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    req.user.lastActive = new Date();
    await req.user.save();
    res.json({ location: req.user.location });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update push notification token
router.post('/push-token', auth, async (req, res) => {
  try {
    req.user.pushToken = req.body.token;
    await req.user.save();
    res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get nearby users
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      _id: { $ne: req.user._id }
    }).select('name location lastActive');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add emergency contact
router.post('/emergency-contacts', auth, async (req, res) => {
  try {
    req.user.emergencyContacts.push(req.body);
    await req.user.save();
    res.status(201).json(req.user.emergencyContacts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove emergency contact
router.delete('/emergency-contacts/:index', auth, async (req, res) => {
  try {
    const { index } = req.params;
    if (index >= req.user.emergencyContacts.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    req.user.emergencyContacts.splice(index, 1);
    await req.user.save();
    res.json(req.user.emergencyContacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medical info
router.patch('/medical-info', auth, async (req, res) => {
  try {
    Object.assign(req.user.medicalInfo, req.body);
    await req.user.save();
    res.json(req.user.medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user settings
router.patch('/settings', auth, async (req, res) => {
  try {
    Object.assign(req.user.settings, req.body);
    await req.user.save();
    res.json(req.user.settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isMatch = await req.user.checkPassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    req.user.password = newPassword;
    await req.user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
