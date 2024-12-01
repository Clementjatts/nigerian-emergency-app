const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SafetyZone = require('../models/SafetyZone');

// Create a new safety zone
router.post('/', auth, async (req, res) => {
  try {
    const safetyZone = new SafetyZone({
      ...req.body,
      creator: req.user._id
    });
    await safetyZone.save();
    res.status(201).json(safetyZone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all safety zones (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.status = req.query.status;
    
    // Handle geospatial query
    if (req.query.longitude && req.query.latitude) {
      const point = {
        type: 'Point',
        coordinates: [parseFloat(req.query.longitude), parseFloat(req.query.latitude)]
      };
      
      filters.geometry = {
        $geoIntersects: {
          $geometry: point
        }
      };
    }

    const safetyZones = await SafetyZone.find(filters)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    res.json(safetyZones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get safety zones within radius
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radiusInMeters = 1000 } = req.query;
    
    const safetyZones = await SafetyZone.find({
      geometry: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radiusInMeters)
        }
      }
    });
    
    res.json(safetyZones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific safety zone
router.get('/:id', async (req, res) => {
  try {
    const safetyZone = await SafetyZone.findById(req.params.id)
      .populate('creator', 'name email');
    if (!safetyZone) {
      return res.status(404).json({ error: 'Safety zone not found' });
    }
    res.json(safetyZone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a safety zone
router.patch('/:id', auth, async (req, res) => {
  try {
    const safetyZone = await SafetyZone.findOne({
      _id: req.params.id,
      creator: req.user._id
    });
    
    if (!safetyZone) {
      return res.status(404).json({ error: 'Safety zone not found or unauthorized' });
    }

    Object.assign(safetyZone, req.body);
    await safetyZone.save();
    res.json(safetyZone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a safety zone
router.delete('/:id', auth, async (req, res) => {
  try {
    const safetyZone = await SafetyZone.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });
    
    if (!safetyZone) {
      return res.status(404).json({ error: 'Safety zone not found or unauthorized' });
    }
    
    res.json({ message: 'Safety zone deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a point is within any safety zones
router.get('/check-point', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    const point = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    const safetyZones = await SafetyZone.find({
      geometry: {
        $geoIntersects: {
          $geometry: point
        }
      }
    });

    res.json({
      isInSafetyZone: safetyZones.length > 0,
      safetyZones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
