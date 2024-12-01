const mongoose = require('mongoose');

const safetyZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of coordinates [longitude, latitude]
      required: true
    }
  },
  radius: {
    type: Number,
    required: true,
    min: 100 // minimum radius in meters
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporary'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['emergency', 'medical', 'police', 'fire', 'other'],
    required: true
  },
  contacts: [{
    name: String,
    phone: String,
    role: String
  }],
  accessLevel: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  authorizedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// Create a 2dsphere index for geospatial queries
safetyZoneSchema.index({ geometry: '2dsphere' });

// Update the updatedAt timestamp before saving
safetyZoneSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if a point is within the safety zone
safetyZoneSchema.methods.containsPoint = function(longitude, latitude) {
  const point = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  
  return mongoose.model('SafetyZone').findOne({
    _id: this._id,
    geometry: {
      $geoIntersects: {
        $geometry: point
      }
    }
  }).exec();
};

const SafetyZone = mongoose.model('SafetyZone', safetyZoneSchema);
module.exports = SafetyZone;
