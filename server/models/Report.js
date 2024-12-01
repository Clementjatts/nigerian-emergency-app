const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['performance', 'usage', 'incident', 'audit', 'summary'],
    required: true
  },
  scope: {
    type: String,
    enum: ['system', 'facility', 'resource', 'community', 'user'],
    required: true
  },
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
  data: [{
    category: String,
    metrics: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      trend: {
        type: String,
        enum: ['up', 'down', 'stable']
      },
      changePercentage: Number
    }]
  }],
  insights: [{
    type: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical']
    },
    message: String
  }],
  metadata: {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    format: {
      type: String,
      enum: ['pdf', 'csv', 'json'],
      default: 'json'
    },
    tags: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
reportSchema.index({ type: 1, scope: 1 });
reportSchema.index({ 'period.start': 1, 'period.end': 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ 'metadata.tags': 1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
