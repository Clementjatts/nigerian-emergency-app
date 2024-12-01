const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Community = require('../models/Community');
const socketService = require('../services/socketService');

// Create a new community
router.post('/', auth, async (req, res) => {
  try {
    const community = new Community({
      ...req.body,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });
    await community.save();
    res.status(201).json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all communities with filtering
router.get('/', async (req, res) => {
  try {
    const {
      type,
      privacy,
      status,
      verified,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (privacy) query['settings.privacy'] = privacy;
    if (status) query.status = status;
    if (verified) query['verificationStatus.isVerified'] = verified === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const communities = await Community.find(query)
      .populate('members.user', 'name email avatar')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Community.countDocuments(query);

    res.json({
      communities,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find nearby communities
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000 } = req.query;
    
    const communities = await Community.findNearby(
      [parseFloat(longitude), parseFloat(latitude)],
      parseInt(radius)
    ).populate('members.user', 'name email avatar');

    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find communities by coverage area
router.get('/by-area', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    
    const communities = await Community.findByArea([
      parseFloat(longitude),
      parseFloat(latitude)
    ]).populate('members.user', 'name email avatar');

    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get community by ID
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('verificationStatus.verifiedBy', 'name email');

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join community
router.post('/:id/join', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (community.settings.joinApproval) {
      // Notify admins about join request
      const admins = community.members.filter(m => m.role === 'admin');
      admins.forEach(admin => {
        socketService.emitToUser(admin.user, 'join_request', {
          communityId: community._id,
          userId: req.user._id
        });
      });
      
      res.json({ message: 'Join request sent' });
    } else {
      await community.addMember(req.user._id);
      res.json(community);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave community
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    await community.removeMember(req.user._id);
    res.json({ message: 'Left community successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update member role (admin only)
router.patch('/:id/members/:userId/role', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const adminMember = community.members.find(
      m => m.user.equals(req.user._id) && m.role === 'admin'
    );

    if (!adminMember) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    await community.updateMemberRole(req.params.userId, req.body.role);
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update member status (admin/moderator only)
router.patch('/:id/members/:userId/status', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const authorizedMember = community.members.find(
      m => m.user.equals(req.user._id) && ['admin', 'moderator'].includes(m.role)
    );

    if (!authorizedMember) {
      return res.status(403).json({ error: 'Unauthorized: Admin/Moderator access required' });
    }

    await community.updateMemberStatus(req.params.userId, req.body.status);
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Award badge to member (admin only)
router.post('/:id/members/:userId/badges', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const adminMember = community.members.find(
      m => m.user.equals(req.user._id) && m.role === 'admin'
    );

    if (!adminMember) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    await community.awardBadge(req.params.userId, req.body.badge);
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update community settings (admin only)
router.patch('/:id/settings', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const adminMember = community.members.find(
      m => m.user.equals(req.user._id) && m.role === 'admin'
    );

    if (!adminMember) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    Object.assign(community.settings, req.body);
    await community.save();
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add/update community resource
router.post('/:id/resources', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const authorizedMember = community.members.find(
      m => m.user.equals(req.user._id) && ['admin', 'moderator'].includes(m.role)
    );

    if (!authorizedMember) {
      return res.status(403).json({ error: 'Unauthorized: Admin/Moderator access required' });
    }

    await community.addResource(req.body);
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update resource status
router.patch('/:id/resources/:resourceId/status', auth, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const authorizedMember = community.members.find(
      m => m.user.equals(req.user._id) && ['admin', 'moderator'].includes(m.role)
    );

    if (!authorizedMember) {
      return res.status(403).json({ error: 'Unauthorized: Admin/Moderator access required' });
    }

    await community.updateResourceStatus(req.params.resourceId, req.body.status);
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify community (super admin only)
router.post('/:id/verify', auth, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Super Admin access required' });
    }

    const community = await Community.findById(req.params.id);
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    community.verificationStatus = {
      isVerified: true,
      verifiedBy: req.user._id,
      verificationDate: new Date(),
      documents: req.body.documents || []
    };

    await community.save();
    res.json(community);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
