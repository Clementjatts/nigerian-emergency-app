const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const Report = require('../models/Report');
const analyticsService = require('../services/analyticsService');

// Generate performance report
router.post('/reports/performance', auth, async (req, res) => {
  try {
    const { scope, startDate, endDate } = req.body;
    const report = await analyticsService.generatePerformanceReport(
      scope,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate usage report
router.post('/reports/usage', auth, async (req, res) => {
  try {
    const { scope, startDate, endDate } = req.body;
    const report = await analyticsService.generateUsageReport(
      scope,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insights
router.get('/insights', auth, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const insights = await analyticsService.getInsights(
      type,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data
router.get('/', auth, async (req, res) => {
  try {
    const { type, entityType, startDate, endDate, tags } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (entityType) query.entityType = entityType;
    if (tags) query.tags = { $in: tags.split(',') };
    if (startDate && endDate) {
      query['period.start'] = { $gte: new Date(startDate) };
      query['period.end'] = { $lte: new Date(endDate) };
    }

    const analytics = await Analytics.find(query)
      .sort('-period.start')
      .limit(100);
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports
router.get('/reports', auth, async (req, res) => {
  try {
    const { type, scope, status, startDate, endDate } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (scope) query.scope = scope;
    if (status) query.status = status;
    if (startDate && endDate) {
      query['period.start'] = { $gte: new Date(startDate) };
      query['period.end'] = { $lte: new Date(endDate) };
    }

    const reports = await Report.find(query)
      .sort('-createdAt')
      .limit(50);
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track custom metrics
router.post('/track', auth, async (req, res) => {
  try {
    const { type, entityId, entityType, metrics, tags } = req.body;
    const analytics = await analyticsService.trackMetrics(
      type,
      entityId,
      entityType,
      metrics,
      tags
    );
    res.status(201).json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update report status
router.patch('/reports/:id/status', auth, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
