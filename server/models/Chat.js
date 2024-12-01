const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'emergency', 'broadcast', 'support'],
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    notifications: {
      muted: {
        type: Boolean,
        default: false
      },
      muteExpiration: Date
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    encrypted: {
      type: Boolean,
      default: true
    },
    retention: {
      type: Number, // message retention period in days
      default: 365
    },
    maxParticipants: {
      type: Number,
      default: 100
    },
    allowedMessageTypes: [{
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'location', 'file']
    }]
  },
  metadata: {
    description: String,
    avatar: String,
    tags: [String],
    customData: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    type: String
  },
  messageCount: {
    type: Number,
    default: 0
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  emergencyInfo: {
    isEmergency: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number] // [longitude, latitude]
    },
    responders: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['assigned', 'en-route', 'on-scene', 'completed'],
        default: 'assigned'
      },
      assignedAt: Date,
      completedAt: Date
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ 'emergencyInfo.location': '2dsphere' });

// Update timestamps before saving
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
chatSchema.methods.addParticipant = async function(userId, role = 'member') {
  if (!this.participants.some(p => p.user.equals(userId))) {
    this.participants.push({
      user: userId,
      role,
      joinedAt: new Date()
    });
    await this.save();
  }
};

chatSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(p => !p.user.equals(userId));
  await this.save();
};

chatSchema.methods.updateParticipantRole = async function(userId, newRole) {
  const participant = this.participants.find(p => p.user.equals(userId));
  if (participant) {
    participant.role = newRole;
    await this.save();
  }
};

chatSchema.methods.updateLastMessage = async function(message) {
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    timestamp: message.createdAt,
    type: message.messageType
  };
  this.messageCount += 1;
  await this.save();
};

chatSchema.methods.pinMessage = async function(messageId) {
  if (!this.pinnedMessages.includes(messageId)) {
    this.pinnedMessages.push(messageId);
    await this.save();
  }
};

chatSchema.methods.unpinMessage = async function(messageId) {
  this.pinnedMessages = this.pinnedMessages.filter(id => !id.equals(messageId));
  await this.save();
};

chatSchema.methods.updateEmergencyStatus = async function(status) {
  this.emergencyInfo.isEmergency = status.isEmergency;
  if (status.priority) this.emergencyInfo.priority = status.priority;
  if (status.location) this.emergencyInfo.location = status.location;
  await this.save();
};

chatSchema.methods.assignResponder = async function(userId) {
  if (!this.emergencyInfo.responders.some(r => r.user.equals(userId))) {
    this.emergencyInfo.responders.push({
      user: userId,
      assignedAt: new Date()
    });
    await this.save();
  }
};

chatSchema.methods.updateResponderStatus = async function(userId, status) {
  const responder = this.emergencyInfo.responders.find(r => r.user.equals(userId));
  if (responder) {
    responder.status = status;
    if (status === 'completed') responder.completedAt = new Date();
    await this.save();
  }
};

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
