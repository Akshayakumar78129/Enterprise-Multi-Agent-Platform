const path = require('path');
const { customerDatabaseConnector } = require(path.resolve(process.cwd(), 'Customer/database/connector'));

/**
 * Calculate anomaly score using isolation forest-like approach
 * This is a simplified version for demonstration
 */
function calculateAnomalyScore(customerMetrics, allMetrics) {
  const features = [
    'transactionCount',
    'totalAmount', 
    'avgAmount',
    'daysSinceLastTransaction',
    'uniqueProducts',
    'avgDaysBetweenTransactions'
  ];
  
  let anomalyScore = 0;
  const featureContributions = [];
  
  for (const feature of features) {
    if (customerMetrics[feature] !== undefined && allMetrics[feature]) {
      const { mean, std } = allMetrics[feature];
      const zScore = Math.abs((customerMetrics[feature] - mean) / std);
      const contribution = Math.min(zScore / 3, 1); // Normalize to 0-1
      
      anomalyScore += contribution;
      featureContributions.push({
        name: feature,
        value: customerMetrics[feature],
        normalRange: [mean - 2 * std, mean + 2 * std],
        severity: Math.min(Math.ceil(zScore), 5),
        zScore: zScore,
        contribution: contribution * 100
      });
    }
  }
  
  return {
    score: Math.min(anomalyScore / features.length, 1),
    features: featureContributions
  };
}

/**
 * Calculate statistical measures for all metrics
 */
function calculateStatistics(data, feature) {
  const values = data.map(d => d[feature]).filter(v => v !== null && v !== undefined);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  return { mean, std, min: Math.min(...values), max: Math.max(...values) };
}

class AnomalyDetectionAPI {
  /**
   * Get comprehensive anomaly detection data
   */
  async getAnomalyData(filters = {}) {
    try {
      const {
        dateRange = { start: null, end: null },
        severityLevels = [1, 2, 3, 4, 5],
        regions = [],
        segments = []
      } = filters;

      // Get customer transaction metrics
      const customerMetrics = await this.getCustomerMetrics(dateRange);
      
      // Calculate statistics for all metrics
      const statisticalBaseline = this.calculateBaseline(customerMetrics);
      
      // Calculate anomaly scores for each customer
      const anomalies = customerMetrics.map(customer => {
        const anomalyResult = calculateAnomalyScore(customer, statisticalBaseline);
        const severity = Math.min(Math.ceil(anomalyResult.score * 5), 5);
        
        return {
          customerId: customer.customerId,
          customerName: customer.customerName,
          anomalyScore: anomalyResult.score,
          severity: severity,
          region: customer.region || 'Unknown',
          state: customer.state || 'Unknown', 
          country: customer.country || 'Unknown',
          features: anomalyResult.features,
          detectionDate: new Date().toISOString(),
          transactionCount: customer.transactionCount,
          totalAmount: customer.totalAmount,
          avgAmount: customer.avgAmount,
          segment: customer.segment || 'Standard'
        };
      }).filter(anomaly => severityLevels.includes(anomaly.severity));

      // Apply additional filters
      let filteredAnomalies = anomalies;
      if (regions.length > 0) {
        filteredAnomalies = filteredAnomalies.filter(a => regions.includes(a.region));
      }
      if (segments.length > 0) {
        filteredAnomalies = filteredAnomalies.filter(a => segments.includes(a.segment));
      }

      // Generate dashboard data
      const dashboardData = {
        anomalies: filteredAnomalies.slice(0, 1000), // Limit for performance
        severityDistribution: this.calculateSeverityDistribution(filteredAnomalies),
        regionData: this.calculateRegionData(filteredAnomalies),
        featureContributions: this.calculateFeatureContributions(filteredAnomalies),
        kpis: this.calculateKPIs(filteredAnomalies, customerMetrics),
        temporalData: this.generateTemporalData()
      };

      return dashboardData;
    } catch (error) {
      console.error('Error fetching anomaly data:', error);
      throw error;
    }
  }

  /**
   * Get customer transaction metrics from database
   */
  async getCustomerMetrics(dateRange) {
    let dateFilter = '';
    let params = [];

    if (dateRange.start && dateRange.end) {
      dateFilter = `AND st."Txn Date" >= ? AND st."Txn Date" <= ?`;
      params = [dateRange.start, dateRange.end];
    }

    const query = `
      SELECT 
        c."Customer Key" as customerId,
        c."Customer Name" as customerName,
        c."Customer State/Prov" as state,
        c."Customer Country" as country,
        c."Market Desc" as region,
        c."Monetary Band" as segment,
        COUNT(st."Sales Txn Key") as transactionCount,
        COALESCE(SUM(st."Net Sales Amount"), 0) as totalAmount,
        COALESCE(AVG(st."Net Sales Amount"), 0) as avgAmount,
        COUNT(DISTINCT st."Item Key") as uniqueProducts,
        JULIANDAY('now') - MAX(JULIANDAY(st."Txn Date")) as daysSinceLastTransaction,
        CASE 
          WHEN COUNT(st."Sales Txn Key") > 1 
          THEN (JULIANDAY(MAX(st."Txn Date")) - JULIANDAY(MIN(st."Txn Date"))) / (COUNT(st."Sales Txn Key") - 1)
          ELSE 0 
        END as avgDaysBetweenTransactions
      FROM "dbo_D_Customer" c
      LEFT JOIN "dbo_F_Sales_Transaction" st ON c."Customer Key" = st."Customer Key"
      WHERE c."Sales Activity Flag" = 1 ${dateFilter}
      GROUP BY c."Customer Key", c."Customer Name", c."Customer State/Prov", 
               c."Customer Country", c."Market Desc", c."Monetary Band"
      HAVING COUNT(st."Sales Txn Key") > 0
      ORDER BY totalAmount DESC
      LIMIT 5000
    `;

    return await customerDatabaseConnector.query(query, params);
  }

  /**
   * Calculate statistical baseline for all metrics
   */
  calculateBaseline(customerMetrics) {
    const features = [
      'transactionCount',
      'totalAmount',
      'avgAmount', 
      'daysSinceLastTransaction',
      'uniqueProducts',
      'avgDaysBetweenTransactions'
    ];

    const baseline = {};
    for (const feature of features) {
      baseline[feature] = calculateStatistics(customerMetrics, feature);
    }

    return baseline;
  }

  /**
   * Calculate severity distribution
   */
  calculateSeverityDistribution(anomalies) {
    const severityColors = {
      1: '#00e0ff', // Electric Cyan
      2: '#5fd4d6', // Lighter Cyan  
      3: '#5891cb', // Blue
      4: '#aa45dd', // Muted Purple
      5: '#e930ff'  // Signal Magenta
    };

    const distribution = [1, 2, 3, 4, 5].map(level => {
      const count = anomalies.filter(a => a.severity === level).length;
      return {
        level,
        count,
        percentage: (count / anomalies.length) * 100,
        color: severityColors[level]
      };
    });

    return distribution;
  }

  /**
   * Calculate region-based anomaly data
   */
  calculateRegionData(anomalies) {
    const regionMap = new Map();

    anomalies.forEach(anomaly => {
      const key = `${anomaly.country}-${anomaly.state}`;
      if (!regionMap.has(key)) {
        regionMap.set(key, {
          region: anomaly.region,
          state: anomaly.state,
          country: anomaly.country,
          anomalyCount: 0,
          totalCustomers: 0,
          severitySum: 0,
          features: new Map()
        });
      }

      const regionData = regionMap.get(key);
      regionData.anomalyCount++;
      regionData.totalCustomers++;
      regionData.severitySum += anomaly.severity;

      // Track top features
      anomaly.features.forEach(feature => {
        const count = regionData.features.get(feature.name) || 0;
        regionData.features.set(feature.name, count + 1);
      });
    });

    return Array.from(regionMap.values()).map(region => ({
      region: region.region,
      state: region.state,
      country: region.country,
      anomalyCount: region.anomalyCount,
      totalCustomers: region.totalCustomers,
      percentage: (region.anomalyCount / region.totalCustomers) * 100,
      severity: region.severitySum / region.anomalyCount,
      topFeatures: Array.from(region.features.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name)
    }));
  }

  /**
   * Calculate feature contributions across all anomalies
   */
  calculateFeatureContributions(anomalies) {
    const featureMap = new Map();

    anomalies.forEach(anomaly => {
      anomaly.features.forEach(feature => {
        if (!featureMap.has(feature.name)) {
          featureMap.set(feature.name, {
            featureName: feature.name,
            contributions: [],
            normalValues: [],
            anomalousValues: []
          });
        }

        const featureData = featureMap.get(feature.name);
        featureData.contributions.push(feature.contribution);
        featureData.anomalousValues.push(feature.value);
      });
    });

    return Array.from(featureMap.values()).map(feature => {
      const avgContribution = feature.contributions.reduce((a, b) => a + b, 0) / feature.contributions.length;
      const anomalousStats = calculateStatistics(feature.anomalousValues.map((v, i) => ({ value: v })), 'value');
      
      return {
        featureName: feature.featureName,
        importance: avgContribution,
        normalMean: 0, // Would need baseline data
        anomalousMean: anomalousStats.mean,
        normalStd: 0,
        anomalousStd: anomalousStats.std,
        separationIndex: avgContribution / 100
      };
    }).sort((a, b) => b.importance - a.importance);
  }

  /**
   * Calculate KPIs
   */
  calculateKPIs(anomalies, allCustomers) {
    const totalCustomers = allCustomers.length;
    const anomalyRate = (anomalies.length / totalCustomers) * 100;
    const highSeverityCount = anomalies.filter(a => a.severity >= 4).length;
    const meanAnomalyScore = anomalies.reduce((sum, a) => sum + a.anomalyScore, 0) / anomalies.length;
    
    // Get top anomalous feature
    const featureContributions = this.calculateFeatureContributions(anomalies);
    const topFeature = featureContributions.length > 0 ? featureContributions[0].featureName : 'None';
    
    // Calculate new anomalies (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const newAnomalies = anomalies.filter(a => new Date(a.detectionDate) > oneDayAgo).length;

    return {
      anomalyRate: anomalyRate,
      anomalyRateTrend: 0, // Would need historical data
      highSeverityCount,
      topAnomalousFeature: topFeature,
      meanAnomalyScore: meanAnomalyScore,
      meanAnomalyScoreTrend: 0, // Would need historical data
      newAnomalies24h: newAnomalies
    };
  }

  /**
   * Generate temporal data (simplified)
   */
  generateTemporalData() {
    const days = 30;
    const data = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate temporal data
      const baseRate = 0.05;
      const noise = (Math.random() - 0.5) * 0.02;
      const anomalyRate = Math.max(0, baseRate + noise);
      
      data.push({
        date: date.toISOString().split('T')[0],
        anomalyCount: Math.floor(Math.random() * 20) + 5,
        anomalyRate: anomalyRate * 100,
        avgSeverity: Math.random() * 2 + 2.5,
        threshold: 3.0
      });
    }

    return data;
  }
}

const anomalyDetectionAPI = new AnomalyDetectionAPI();

module.exports = {
  anomalyDetectionAPI
}; 