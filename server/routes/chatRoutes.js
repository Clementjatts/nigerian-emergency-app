const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const socketService = require('../services/socketService');

// Create a new chat
router.post('/', auth, async (req, res) => {
  try {
    const chat = new Chat({
      ...req.body,
      participants: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id,
      status: { $ne: 'deleted' }
    })
    .populate('participants.user', 'name email avatar')
    .populate('lastMessage.sender', 'name')
    .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    })
    .populate('participants.user', 'name email avatar')
    .populate('pinnedMessages');
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const query = {
      chatId: req.params.id,
      'deletedFor.user': { $ne: req.user._id }
    };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = new Message({
      chatId: chat._id,
      sender: req.user._id,
      ...req.body
    });

    await message.save();
    await chat.updateLastMessage(message);

    // Notify other participants
    chat.participants
      .filter(p => !p.user.equals(req.user._id))
      .forEach(participant => {
        socketService.emitToUser(participant.user, 'new_message', {
          chatId: chat._id,
          message
        });
      });

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update message status (read/delivered)
router.patch('/:chatId/messages/:messageId/status', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      chatId: req.params.chatId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (req.body.status === 'delivered') {
      await message.markAsDelivered(req.user._id);
    } else if (req.body.status === 'read') {
      await message.markAsRead(req.user._id);
    }

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add reaction to message
router.post('/:chatId/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      chatId: req.params.chatId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.addReaction(req.user._id, req.body.reaction);
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edit message
router.patch('/:chatId/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      chatId: req.params.chatId,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.edit(req.body.content);
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete message for user
router.delete('/:chatId/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      chatId: req.params.chatId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.deleteForUser(req.user._id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update chat settings
router.patch('/:id/settings', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    Object.assign(chat.settings, req.body);
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pin/unpin message
router.post('/:id/pin-message', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (req.body.pin) {
      await chat.pinMessage(req.body.messageId);
    } else {
      await chat.unpinMessage(req.body.messageId);
    }

    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update emergency status
router.patch('/:id/emergency', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await chat.updateEmergencyStatus(req.body);
    
    // Notify all participants about emergency status change
    chat.participants.forEach(participant => {
      socketService.emitToUser(participant.user, 'emergency_status_changed', {
        chatId: chat._id,
        emergencyInfo: chat.emergencyInfo
      });
    });

    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign emergency responder
router.post('/:id/assign-responder', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await chat.assignResponder(req.body.userId);
    
    // Notify the assigned responder
    socketService.emitToUser(req.body.userId, 'emergency_assignment', {
      chatId: chat._id,
      emergencyInfo: chat.emergencyInfo
    });

    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update responder status
router.patch('/:id/responder-status', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'emergencyInfo.responders.user': req.user._id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await chat.updateResponderStatus(req.user._id, req.body.status);
    
    // Notify all participants about responder status change
    chat.participants.forEach(participant => {
      socketService.emitToUser(participant.user, 'responder_status_changed', {
        chatId: chat._id,
        responderId: req.user._id,
        status: req.body.status
      });
    });

    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
