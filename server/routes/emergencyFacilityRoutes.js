const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmergencyFacility = require('../models/EmergencyFacility');

// Get all emergency facilities with filtering
router.get('/', async (req, res) => {
  try {
    const {
      facilityType,
      service,
      isOperational,
      currentLoad,
      specialty,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    if (facilityType) query.facilityType = facilityType;
    if (isOperational) query['status.isOperational'] = isOperational === 'true';
    if (currentLoad) query['status.currentLoad'] = currentLoad;
    if (service) query['services.name'] = service;
    if (specialty) query['specialties.name'] = specialty;

    const facilities = await EmergencyFacility.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ 'status.lastUpdated': -1 });

    const total = await EmergencyFacility.countDocuments(query);

    res.json({
      facilities,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find nearby facilities
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000, facilityType } = req.query;
    
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    };

    if (facilityType) query.facilityType = facilityType;

    const facilities = await EmergencyFacility.find(query)
      .select('name facilityType location status contact services emergencyResponse');

    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get facility by ID
router.get('/:id', async (req, res) => {
  try {
    const facility = await EmergencyFacility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new facility (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Verify admin status here
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const facility = new EmergencyFacility(req.body);
    await facility.save();
    res.status(201).json(facility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update facility status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { currentLoad, isOperational } = req.body;
    const facility = await EmergencyFacility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    if (currentLoad) facility.status.currentLoad = currentLoad;
    if (isOperational !== undefined) facility.status.isOperational = isOperational;
    facility.status.lastUpdated = new Date();

    await facility.save();
    res.json(facility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update facility capacity
router.patch('/:id/capacity', auth, async (req, res) => {
  try {
    const { available } = req.body;
    const facility = await EmergencyFacility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    await facility.updateCapacity(available);
    res.json(facility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update facility details (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const facility = await EmergencyFacility.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(facility);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete facility (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const facility = await EmergencyFacility.findByIdAndDelete(req.params.id);
    
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search facilities by services or specialties
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'services' } = req.query;
    
    const searchQuery = type === 'services' 
      ? { 'services.name': new RegExp(query, 'i') }
      : { 'specialties.name': new RegExp(query, 'i') };

    const facilities = await EmergencyFacility.find(searchQuery)
      .select('name facilityType location status contact services specialties');

    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
