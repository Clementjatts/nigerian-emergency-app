const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resource = require('../models/Resource');
const upload = require('../middleware/upload');

// Create a new resource
router.post('/', auth, async (req, res) => {
  try {
    const resource = new Resource({
      ...req.body,
      createdBy: req.user._id
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get resources by category
router.get('/', auth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const query = category ? { category } : {};
    
    const resources = await Resource.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');
    
    const total = await Resource.countDocuments(query);
    
    res.json({
      resources,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's resources
router.get('/user', auth, async (req, res) => {
  try {
    const resources = await Resource.find({
      createdBy: req.user._id
    })
    .sort('-createdAt');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload resource attachment
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

// Like resource
router.post('/:resourceId/like', auth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.resourceId,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unlike resource
router.post('/:resourceId/unlike', auth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.resourceId,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Increment share count
router.post('/:resourceId/share', auth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.resourceId,
      { $inc: { shares: 1 } },
      { new: true }
    );
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search resources
router.get('/search', auth, async (req, res) => {
  try {
    const { query, tags } = req.query;
    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ];
    }

    if (tags) {
      searchQuery.tags = { $in: tags.split(',') };
    }

    const resources = await Resource.find(searchQuery)
      .sort('-createdAt')
      .populate('createdBy', 'name');
    
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update resource
router.patch('/:resourceId', auth, async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      createdBy: req.user._id
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
router.delete('/:resourceId', auth, async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      createdBy: req.user._id
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or unauthorized' });
    }

    await resource.remove();
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
