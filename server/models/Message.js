const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'location', 'file', 'emergency'],
    default: 'text'
  },
  metadata: {
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // for audio/video
    thumbnail: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent', 'emergency'],
    default: 'normal'
  },
  status: {
    sent: {
      type: Boolean,
      default: true
    },
    delivered: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    url: String,
    type: String,
    size: Number,
    name: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deletedFor: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ content: 'text' });

// Update timestamp before saving
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods for message status updates
messageSchema.methods.markAsDelivered = async function(userId) {
  if (!this.status.delivered) {
    this.status.delivered = true;
    await this.save();
  }
};

messageSchema.methods.markAsRead = async function(userId) {
  if (!this.status.readBy.some(read => read.user.equals(userId))) {
    this.status.read = true;
    this.status.readBy.push({
      user: userId,
      readAt: new Date()
    });
    await this.save();
  }
};

messageSchema.methods.addReaction = async function(userId, reaction) {
  const existingReaction = this.reactions.find(r => r.user.equals(userId));
  if (existingReaction) {
    existingReaction.reaction = reaction;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({
      user: userId,
      reaction,
      createdAt: new Date()
    });
  }
  await this.save();
};

messageSchema.methods.edit = async function(newContent) {
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  this.content = newContent;
  this.isEdited = true;
  await this.save();
};

messageSchema.methods.deleteForUser = async function(userId) {
  if (!this.deletedFor.some(del => del.user.equals(userId))) {
    this.deletedFor.push({
      user: userId,
      deletedAt: new Date()
    });
    await this.save();
  }
};

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
