const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'emergency_responder', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  permissions: {
    canPost: {
      type: Boolean,
      default: true
    },
    canComment: {
      type: Boolean,
      default: true
    },
    canModerate: {
      type: Boolean,
      default: false
    }
  },
  badges: [{
    name: String,
    description: String,
    awardedAt: Date
  }]
});

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['neighborhood', 'emergency_response', 'public_safety', 'health', 'general'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  coverageArea: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of coordinates
      required: true
    }
  },
  members: [memberSchema],
  settings: {
    privacy: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'public'
    },
    joinApproval: {
      type: Boolean,
      default: false
    },
    postApproval: {
      type: Boolean,
      default: false
    },
    allowedPostTypes: [{
      type: String,
      enum: ['alert', 'discussion', 'event', 'resource', 'emergency']
    }],
    guidelines: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  stats: {
    memberCount: {
      type: Number,
      default: 0
    },
    postCount: {
      type: Number,
      default: 0
    },
    alertCount: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number, // Average response time in minutes
      default: 0
    }
  },
  emergencyContacts: [{
    name: String,
    role: String,
    phone: String,
    email: String,
    availability: {
      type: String,
      enum: ['24/7', 'business_hours', 'on_call'],
      default: 'business_hours'
    }
  }],
  resources: [{
    type: {
      type: String,
      enum: ['equipment', 'facility', 'vehicle', 'personnel'],
      required: true
    },
    name: String,
    description: String,
    quantity: Number,
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'unavailable'],
      default: 'available'
    }
  }],
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    documents: [{
      type: String,
      url: String,
      verifiedAt: Date
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  metadata: {
    website: String,
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String
    },
    tags: [String],
    establishedDate: Date
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
communitySchema.index({ location: '2dsphere' });
communitySchema.index({ coverageArea: '2dsphere' });
communitySchema.index({ 'members.user': 1 });
communitySchema.index({ name: 'text', description: 'text' });

// Update timestamps before saving
communitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update stats when members are modified
communitySchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.stats.memberCount = this.members.filter(m => m.status === 'active').length;
  }
  next();
});

// Methods
communitySchema.methods.addMember = async function(userId, role = 'member') {
  if (!this.members.some(m => m.user.equals(userId))) {
    this.members.push({
      user: userId,
      role,
      joinedAt: new Date()
    });
    await this.save();
  }
};

communitySchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(m => !m.user.equals(userId));
  await this.save();
};

communitySchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(m => m.user.equals(userId));
  if (member) {
    member.role = newRole;
    await this.save();
  }
};

communitySchema.methods.updateMemberStatus = async function(userId, newStatus) {
  const member = this.members.find(m => m.user.equals(userId));
  if (member) {
    member.status = newStatus;
    await this.save();
  }
};

communitySchema.methods.awardBadge = async function(userId, badge) {
  const member = this.members.find(m => m.user.equals(userId));
  if (member) {
    member.badges.push({
      ...badge,
      awardedAt: new Date()
    });
    await this.save();
  }
};

communitySchema.methods.addResource = async function(resource) {
  this.resources.push(resource);
  await this.save();
};

communitySchema.methods.updateResourceStatus = async function(resourceId, status) {
  const resource = this.resources.id(resourceId);
  if (resource) {
    resource.status = status;
    await this.save();
  }
};

// Static methods
communitySchema.statics.findNearby = function(coordinates, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

communitySchema.statics.findByArea = function(coordinates) {
  return this.find({
    coverageArea: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        }
      }
    }
  });
};

const Community = mongoose.model('Community', communitySchema);
module.exports = Community;
