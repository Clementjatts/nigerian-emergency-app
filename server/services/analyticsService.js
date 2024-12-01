const Analytics = require('../models/Analytics');
const Report = require('../models/Report');

class AnalyticsService {
  // Track metrics for any entity
  async trackMetrics(type, entityId, entityType, metrics, tags = []) {
    try {
      const analytics = new Analytics({
        type,
        entityId,
        entityType,
        metrics: metrics.map(m => ({
          name: m.name,
          value: m.value,
          timestamp: m.timestamp || new Date()
        })),
        period: {
          start: new Date(),
          end: new Date()
        },
        tags
      });
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Error tracking metrics:', error);
      throw error;
    }
  }

  // Generate performance report
  async generatePerformanceReport(scope, startDate, endDate) {
    try {
      const metrics = await Analytics.aggregate([
        {
          $match: {
            'period.start': { $gte: startDate },
            'period.end': { $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              entityType: '$entityType'
            },
            avgResponseTime: { $avg: '$metrics.value' },
            totalCount: { $sum: 1 }
          }
        }
      ]);

      const report = new Report({
        title: `Performance Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
        type: 'performance',
        scope,
        period: { start: startDate, end: endDate },
        data: metrics.map(m => ({
          category: `${m._id.type} - ${m._id.entityType}`,
          metrics: [
            {
              name: 'Average Response Time',
              value: m.avgResponseTime,
              trend: this._calculateTrend(m.avgResponseTime)
            },
            {
              name: 'Total Events',
              value: m.totalCount
            }
          ]
        }))
      });

      await report.save();
      return report;
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Generate usage report
  async generateUsageReport(scope, startDate, endDate) {
    try {
      const usageData = await Analytics.aggregate([
        {
          $match: {
            type: 'resource_usage',
            'period.start': { $gte: startDate },
            'period.end': { $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$entityId',
            totalUsage: { $sum: 1 },
            avgDuration: { $avg: '$metrics.value' }
          }
        }
      ]);

      const report = new Report({
        title: `Usage Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
        type: 'usage',
        scope,
        period: { start: startDate, end: endDate },
        data: [{
          category: 'Resource Usage',
          metrics: [
            {
              name: 'Total Usage Count',
              value: usageData.reduce((acc, curr) => acc + curr.totalUsage, 0)
            },
            {
              name: 'Average Usage Duration',
              value: usageData.reduce((acc, curr) => acc + curr.avgDuration, 0) / usageData.length
            }
          ]
        }]
      });

      await report.save();
      return report;
    } catch (error) {
      console.error('Error generating usage report:', error);
      throw error;
    }
  }

  // Calculate trend based on historical data
  _calculateTrend(currentValue, historicalValues = []) {
    if (historicalValues.length === 0) return 'stable';
    const avgHistorical = historicalValues.reduce((a, b) => a + b) / historicalValues.length;
    const change = ((currentValue - avgHistorical) / avgHistorical) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  // Get insights from analytics data
  async getInsights(type, startDate, endDate) {
    try {
      const data = await Analytics.find({
        type,
        'period.start': { $gte: startDate },
        'period.end': { $lte: endDate }
      }).sort('-createdAt');

      const insights = [];
      
      // Analyze response times
      if (type === 'emergency_response') {
        const avgResponseTime = data.reduce((acc, curr) => {
          const responseTime = curr.metrics.find(m => m.name === 'responseTime');
          return acc + (responseTime ? responseTime.value : 0);
        }, 0) / data.length;

        if (avgResponseTime > 10) { // 10 minutes threshold
          insights.push({
            severity: 'warning',
            message: `Average response time (${avgResponseTime.toFixed(2)} minutes) is above threshold`
          });
        }
      }

      // Analyze resource usage
      if (type === 'resource_usage') {
        const unusedResources = data.filter(d => {
          const usage = d.metrics.find(m => m.name === 'usageCount');
          return usage && usage.value === 0;
        });

        if (unusedResources.length > 0) {
          insights.push({
            severity: 'info',
            message: `${unusedResources.length} resources have not been used in the specified period`
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error getting insights:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
