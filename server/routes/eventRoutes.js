const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const upload = require('../middleware/upload');
const { sendPushNotification } = require('../services/notificationService');

// Create a new event
router.post('/', auth, async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      organizer: req.user._id,
      attendees: [req.user._id]
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get upcoming events
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const events = await Event.find({
      date: { $gte: new Date() },
      status: 'upcoming'
    })
    .sort('date')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('organizer', 'name')
    .populate('attendees', 'name avatar');

    const total = await Event.countDocuments({
      date: { $gte: new Date() },
      status: 'upcoming'
    });

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's events
router.get('/user', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { organizer: req.user._id },
        { attendees: req.user._id }
      ]
    })
    .sort('-date')
    .populate('organizer', 'name')
    .populate('attendees', 'name avatar');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload event attachment
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

// Join event
router.post('/:eventId/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already joined this event' });
    }

    event.attendees.push(req.user._id);
    await event.save();

    // Notify event organizer
    const organizer = await User.findById(event.organizer);
    if (organizer.pushToken) {
      await sendPushNotification(organizer.pushToken, {
        title: 'New Event Attendee',
        body: `${req.user.name} has joined your event: ${event.title}`,
        data: { eventId: event._id.toString() }
      });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave event
router.post('/:eventId/leave', auth, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.eventId,
      { $pull: { attendees: req.user._id } },
      { new: true }
    )
    .populate('organizer', 'name')
    .populate('attendees', 'name avatar');

    // Notify event organizer
    const organizer = await User.findById(event.organizer);
    if (organizer.pushToken) {
      await sendPushNotification(organizer.pushToken, {
        title: 'Event Attendee Left',
        body: `${req.user.name} has left your event: ${event.title}`,
        data: { eventId: event._id.toString() }
      });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event
router.patch('/:eventId', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    Object.assign(event, req.body);
    await event.save();

    // Notify attendees of changes
    const notifyAttendees = event.attendees.map(async (attendeeId) => {
      const attendee = await User.findById(attendeeId);
      if (attendee.pushToken) {
        return sendPushNotification(attendee.pushToken, {
          title: 'Event Updated',
          body: `The event "${event.title}" has been updated`,
          data: { eventId: event._id.toString() }
        });
      }
    });

    await Promise.all(notifyAttendees);

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel event
router.post('/:eventId/cancel', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizer: req.user._id
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    event.status = 'cancelled';
    event.cancelReason = req.body.reason;
    await event.save();

    // Notify attendees of cancellation
    const notifyAttendees = event.attendees.map(async (attendeeId) => {
      const attendee = await User.findById(attendeeId);
      if (attendee.pushToken) {
        return sendPushNotification(attendee.pushToken, {
          title: 'Event Cancelled',
          body: `The event "${event.title}" has been cancelled: ${req.body.reason}`,
          data: { eventId: event._id.toString() }
        });
      }
    });

    await Promise.all(notifyAttendees);

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search events
router.get('/search', auth, async (req, res) => {
  try {
    const { query, type, startDate, endDate, tags } = req.query;
    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (type) {
      searchQuery.type = type;
    }

    if (startDate || endDate) {
      searchQuery.date = {};
      if (startDate) searchQuery.date.$gte = new Date(startDate);
      if (endDate) searchQuery.date.$lte = new Date(endDate);
    }

    if (tags) {
      searchQuery.tags = { $in: tags.split(',') };
    }

    const events = await Event.find(searchQuery)
      .sort('date')
      .populate('organizer', 'name')
      .populate('attendees', 'name avatar');
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
