const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  open: {
    type: String,
    required: true
  },
  close: {
    type: String,
    required: true
  },
  is24Hours: {
    type: Boolean,
    default: false
  }
});

const specialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  availability: {
    type: Boolean,
    default: true
  },
  waitTime: {
    type: Number, // in minutes
    default: 0
  }
});

const emergencyFacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  facilityType: {
    type: String,
    enum: ['hospital', 'police_station', 'fire_station', 'ambulance_service', 'trauma_center', 'pharmacy'],
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
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Nigeria'
    }
  },
  contact: {
    phone: [String],
    emergency: [String],
    email: String,
    website: String
  },
  operatingHours: [operatingHoursSchema],
  specialties: [specialtySchema],
  capacity: {
    total: Number,
    available: Number,
    lastUpdated: Date
  },
  services: [{
    name: String,
    description: String,
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  emergencyResponse: {
    ambulanceCount: {
      total: Number,
      available: Number
    },
    averageResponseTime: Number, // in minutes
    serviceArea: {
      type: Number, // radius in kilometers
      default: 10
    }
  },
  status: {
    isOperational: {
      type: Boolean,
      default: true
    },
    currentLoad: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date
  },
  metadata: {
    images: [String],
    certifications: [String],
    establishedYear: Number,
    lastInspectionDate: Date
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

// Create a 2dsphere index for geospatial queries
emergencyFacilitySchema.index({ location: '2dsphere' });

// Update timestamps before saving
emergencyFacilitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to update facility status
emergencyFacilitySchema.methods.updateStatus = async function(newStatus) {
  this.status.currentLoad = newStatus;
  this.status.lastUpdated = new Date();
  await this.save();
};

// Method to update capacity
emergencyFacilitySchema.methods.updateCapacity = async function(available) {
  this.capacity.available = available;
  this.capacity.lastUpdated = new Date();
  await this.save();
};

// Static method to find nearby facilities
emergencyFacilitySchema.statics.findNearby = function(coordinates, maxDistance = 5000) {
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

const EmergencyFacility = mongoose.model('EmergencyFacility', emergencyFacilitySchema);
module.exports = EmergencyFacility;
