const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resource = require('../models/Resource');
const socketService = require('../services/socketService');

// Create a new resource
router.post('/', auth, async (req, res) => {
  try {
    const resource = new Resource({
      ...req.body,
      ownership: {
        owner: req.user._id,
        ...req.body.ownership
      }
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all resources with filtering
router.get('/', async (req, res) => {
  try {
    const {
      type,
      category,
      status,
      condition,
      available,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query['status.current'] = status;
    if (condition) query['status.condition'] = condition;
    if (available === 'true') query['status.current'] = 'available';
    if (search) {
      query.$text = { $search: search };
    }

    const resources = await Resource.find(query)
      .populate('ownership.owner', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find nearby resources
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000, type, category } = req.query;
    
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

    if (type) query.type = type;
    if (category) query.category = category;

    const resources = await Resource.find(query)
      .populate('ownership.owner', 'name email');

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resources due for maintenance
router.get('/maintenance-due', auth, async (req, res) => {
  try {
    const resources = await Resource.findDueMaintenance()
      .populate('ownership.owner', 'name email');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('ownership.owner', 'name email')
      .populate('usage.logs.user', 'name email')
      .populate('maintenance.logs.performedBy', 'name email');

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start resource usage
router.post('/:id/usage/start', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.status.current !== 'available') {
      return res.status(400).json({ error: 'Resource is not available' });
    }

    const usage = await resource.startUsage(req.user._id, req.body.purpose);
    
    // Notify resource owner
    socketService.emitToUser(resource.ownership.owner, 'resource_usage_started', {
      resourceId: resource._id,
      usage
    });

    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// End resource usage
router.post('/:id/usage/:usageId/end', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.endUsage(req.params.usageId);
    
    // Notify resource owner
    socketService.emitToUser(resource.ownership.owner, 'resource_usage_ended', {
      resourceId: resource._id,
      usageId: req.params.usageId
    });

    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Log maintenance
router.post('/:id/maintenance', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.logMaintenance({
      ...req.body,
      performedBy: req.user._id
    });

    // Notify resource owner
    socketService.emitToUser(resource.ownership.owner, 'maintenance_logged', {
      resourceId: resource._id,
      maintenance: resource.maintenance.logs[resource.maintenance.logs.length - 1]
    });

    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Schedule inspection
router.post('/:id/schedule-inspection', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.scheduleInspection(new Date(req.body.date));
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update resource availability schedule
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.updateAvailability(req.body.schedule);
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update resource status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    resource.status.current = req.body.status;
    if (req.body.condition) {
      resource.status.condition = req.body.condition;
    }
    await resource.save();

    // Notify resource owner
    socketService.emitToUser(resource.ownership.owner, 'resource_status_changed', {
      resourceId: resource._id,
      status: resource.status
    });

    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add certification
router.post('/:id/certifications', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    resource.certifications.push(req.body);
    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update resource details
router.put('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      'ownership.owner': req.user._id
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or unauthorized' });
    }

    Object.assign(resource, req.body);
    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete resource
router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findOneAndDelete({
      _id: req.params.id,
      'ownership.owner': req.user._id
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or unauthorized' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
