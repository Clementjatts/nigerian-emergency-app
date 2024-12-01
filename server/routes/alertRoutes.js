const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Alert = require('../models/Alert');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { sendPushNotification } = require('../services/notificationService');

// Create a new alert
router.post('/', auth, async (req, res) => {
  try {
    const alert = new Alert({
      ...req.body,
      createdBy: req.user._id
    });
    await alert.save();

    // If location is provided, notify nearby users
    if (req.body.location) {
      const { coordinates } = req.body.location;
      const nearbyUsers = await User.find({
        'location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: alert.radius || 5000 // 5km default radius
          }
        },
        notificationsEnabled: true
      });

      // Send push notifications to nearby users
      const notifications = nearbyUsers.map(user => {
        return sendPushNotification(user.pushToken, {
          title: alert.title,
          body: alert.description,
          data: { alertId: alert._id.toString() }
        });
      });

      await Promise.all(notifications);
    }

    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get alerts within radius
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    const alerts = await Alert.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status: 'active',
      expiresAt: { $gt: new Date() }
    })
    .populate('createdBy', 'name')
    .sort('-createdAt');
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's alerts
router.get('/user', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({
      createdBy: req.user._id
    })
    .sort('-createdAt');
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload alert image
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }
    res.json({
      url: req.file.path,
      filename: req.file.filename,
      type: req.file.mimetype
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify alert
router.post('/:alertId/verify', auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      { $addToSet: { verifiedBy: req.user._id } },
      { new: true }
    );
    res.json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Report alert
router.post('/:alertId/report', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.reports.push({
      userId: req.user._id,
      reason: req.body.reason
    });

    // Auto-deactivate if report threshold reached
    if (alert.reports.length >= 5) {
      alert.status = 'deactivated';
      alert.deactivatedReason = 'Multiple reports received';
    }

    await alert.save();
    res.json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update alert status
router.patch('/:alertId/status', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.alertId,
      createdBy: req.user._id
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or unauthorized' });
    }

    alert.status = req.body.status;
    if (req.body.reason) {
      alert.statusReason = req.body.reason;
    }

    await alert.save();
    res.json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
