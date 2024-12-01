const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['emergency_response', 'resource_usage', 'facility_performance', 'user_activity', 'system_health'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType',
    required: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Resource', 'EmergencyFacility', 'User', 'Community', 'Alert']
  },
  metrics: [metricSchema],
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  tags: [{
    type: String
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ type: 1, 'period.start': 1, 'period.end': 1 });
analyticsSchema.index({ entityId: 1, type: 1 });
analyticsSchema.index({ 'metrics.name': 1 });
analyticsSchema.index({ tags: 1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;
