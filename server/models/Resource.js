const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['inspection', 'repair', 'replacement', 'calibration'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: String,
  cost: Number,
  nextMaintenanceDate: Date,
  attachments: [{
    url: String,
    type: String,
    name: String
  }]
});

const usageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  purpose: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: [Number] // [longitude, latitude]
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'cancelled'],
    default: 'ongoing'
  }
});

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'vehicle',
      'medical_equipment',
      'communication_device',
      'rescue_equipment',
      'facility',
      'supply',
      'personnel'
    ],
    required: true
  },
  category: {
    type: String,
    enum: [
      'emergency',
      'medical',
      'fire',
      'police',
      'rescue',
      'transport',
      'communication',
      'shelter'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  specifications: {
    model: String,
    manufacturer: String,
    serialNumber: String,
    yearManufactured: Number,
    capacity: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'm', 'ft'],
        default: 'm'
      }
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      }
    },
    powerRequirements: String,
    operatingConditions: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: [Number], // [longitude, latitude]
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyFacility'
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
    }
  },
  status: {
    current: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'reserved', 'out_of_service'],
      default: 'available'
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    lastInspection: Date,
    nextInspectionDue: Date
  },
  ownership: {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: String,
    purchaseDate: Date,
    warrantyExpiry: Date,
    cost: Number,
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      expiryDate: Date
    }
  },
  availability: {
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      available: Boolean,
      startTime: String,
      endTime: String
    }],
    restrictions: [String],
    reservable: {
      type: Boolean,
      default: true
    }
  },
  maintenance: {
    logs: [maintenanceLogSchema],
    schedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
      },
      lastMaintenance: Date,
      nextMaintenance: Date
    },
    instructions: String
  },
  usage: {
    logs: [usageLogSchema],
    totalHours: {
      type: Number,
      default: 0
    },
    mileage: Number,
    fuelLevel: Number
  },
  certifications: [{
    type: String,
    issuer: String,
    expiryDate: Date,
    attachments: [{
      url: String,
      type: String,
      name: String
    }]
  }],
  contacts: [{
    name: String,
    role: String,
    phone: String,
    email: String,
    isPrimary: Boolean
  }],
  attachments: [{
    url: String,
    type: String,
    name: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed
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
resourceSchema.index({ location: '2dsphere' });
resourceSchema.index({ name: 'text', description: 'text' });
resourceSchema.index({ type: 1, category: 1 });
resourceSchema.index({ 'status.current': 1 });

// Update timestamps before saving
resourceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
resourceSchema.methods.startUsage = async function(userId, purpose) {
  const usage = {
    user: userId,
    startTime: new Date(),
    purpose,
    status: 'ongoing'
  };
  
  this.usage.logs.push(usage);
  this.status.current = 'in_use';
  await this.save();
  return usage;
};

resourceSchema.methods.endUsage = async function(usageId) {
  const usage = this.usage.logs.id(usageId);
  if (usage && usage.status === 'ongoing') {
    usage.endTime = new Date();
    usage.status = 'completed';
    
    // Update total hours
    const hours = (usage.endTime - usage.startTime) / (1000 * 60 * 60);
    this.usage.totalHours += hours;
    
    this.status.current = 'available';
    await this.save();
  }
};

resourceSchema.methods.scheduleInspection = async function(date) {
  this.status.nextInspectionDue = date;
  await this.save();
};

resourceSchema.methods.logMaintenance = async function(maintenanceData) {
  this.maintenance.logs.push(maintenanceData);
  this.maintenance.schedule.lastMaintenance = new Date();
  
  // Calculate next maintenance date based on frequency
  const frequencies = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    yearly: 365
  };
  
  if (this.maintenance.schedule.frequency) {
    const days = frequencies[this.maintenance.schedule.frequency];
    this.maintenance.schedule.nextMaintenance = new Date();
    this.maintenance.schedule.nextMaintenance.setDate(
      this.maintenance.schedule.nextMaintenance.getDate() + days
    );
  }
  
  await this.save();
};

resourceSchema.methods.updateAvailability = async function(scheduleData) {
  this.availability.schedule = scheduleData;
  await this.save();
};

// Static methods
resourceSchema.statics.findAvailable = function(type, category) {
  return this.find({
    type,
    category,
    'status.current': 'available'
  });
};

resourceSchema.statics.findNearby = function(coordinates, maxDistance = 5000) {
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

resourceSchema.statics.findDueMaintenance = function() {
  return this.find({
    'maintenance.schedule.nextMaintenance': { $lte: new Date() }
  });
};

const Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;
