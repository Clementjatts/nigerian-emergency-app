const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const upload = require('../middleware/upload');

// Create a new chat room
router.post('/', auth, async (req, res) => {
  try {
    const chat = new Chat({
      ...req.body,
      createdBy: req.user._id,
      members: [...(req.body.members || []), req.user._id]
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's chat rooms
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      members: req.user._id
    })
    .sort({ lastMessageTime: -1 })
    .populate('members', 'name avatar')
    .populate('createdBy', 'name');
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat messages
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const messages = await Message.find({
      chatId: req.params.chatId
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('sender', 'name avatar');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const message = new Message({
      ...req.body,
      chatId: req.params.chatId,
      sender: req.user._id,
      readBy: [req.user._id]
    });
    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: req.body.content,
      lastMessageTime: new Date()
    });

    // Emit message through Socket.IO
    req.app.io.to(req.params.chatId).emit('new_message', {
      ...message.toJSON(),
      sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload attachment
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

// Mark message as read
router.put('/messages/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete message
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user._id
    });
    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }
    await message.remove();
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave chat room
router.post('/:chatId/leave', auth, async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { $pull: { members: req.user._id } },
      { new: true }
    );
    res.json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
