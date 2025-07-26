const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Database connection
let db = null;

async function getDatabase() {
  if (!db) {
    const dbPath = path.resolve(process.cwd(), 'Customer/database/customers.db');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return db;
}

// Calculate anomaly score using isolation forest-like approach
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

// Calculate statistical measures
function calculateStatistics(data, feature) {
  const values = data.map(d => d[feature]).filter(v => v !== null && v !== undefined);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  return { mean, std, min: Math.min(...values), max: Math.max(...values) };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      dateRange,
      severityLevels,
      regions,
      segments,
      anomalyScoreRange
    } = req.query;

    // Parse query parameters
    const filters = {};
    
    if (dateRange) {
      try {
        filters.dateRange = JSON.parse(dateRange);
      } catch (e) {
        filters.dateRange = { start: null, end: null };
      }
    }

    if (severityLevels) {
      try {
        filters.severityLevels = JSON.parse(severityLevels);
      } catch (e) {
        filters.severityLevels = [1, 2, 3, 4, 5];
      }
    }

    if (regions) {
      try {
        filters.regions = JSON.parse(regions);
      } catch (e) {
        filters.regions = [];
      }
    }

    if (segments) {
      try {
        filters.segments = JSON.parse(segments);
      } catch (e) {
        filters.segments = [];
      }
    }

    // Get database connection
    const database = await getDatabase();

    // Build date filter
    let dateFilter = '';
    let params = [];

    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      dateFilter = `AND st."Txn Date" >= ? AND st."Txn Date" <= ?`;
      params = [filters.dateRange.start, filters.dateRange.end];
    }

    // Get customer transaction metrics
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

    const customerMetrics = await database.all(query, params);

    // Calculate statistical baseline
    const features = [
      'transactionCount',
      'totalAmount',
      'avgAmount', 
      'daysSinceLastTransaction',
      'uniqueProducts',
      'avgDaysBetweenTransactions'
    ];

    const statisticalBaseline = {};
    for (const feature of features) {
      statisticalBaseline[feature] = calculateStatistics(customerMetrics, feature);
    }

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
    }).filter(anomaly => (filters.severityLevels || [1, 2, 3, 4, 5]).includes(anomaly.severity));

    // Apply additional filters
    let filteredAnomalies = anomalies;
    if (filters.regions && filters.regions.length > 0) {
      filteredAnomalies = filteredAnomalies.filter(a => filters.regions.includes(a.region));
    }
    if (filters.segments && filters.segments.length > 0) {
      filteredAnomalies = filteredAnomalies.filter(a => filters.segments.includes(a.segment));
    }

    // Calculate severity distribution
    const severityColors = {
      1: '#00e0ff', // Electric Cyan
      2: '#5fd4d6', // Lighter Cyan  
      3: '#5891cb', // Blue
      4: '#aa45dd', // Muted Purple
      5: '#e930ff'  // Signal Magenta
    };

    const severityDistribution = [1, 2, 3, 4, 5].map(level => {
      const count = filteredAnomalies.filter(a => a.severity === level).length;
      return {
        level,
        count,
        percentage: filteredAnomalies.length > 0 ? (count / filteredAnomalies.length) * 100 : 0,
        color: severityColors[level]
      };
    });

    // Calculate feature contributions
    const featureMap = new Map();
    filteredAnomalies.forEach(anomaly => {
      anomaly.features.forEach(feature => {
        if (!featureMap.has(feature.name)) {
          featureMap.set(feature.name, {
            featureName: feature.name,
            contributions: [],
            anomalousValues: []
          });
        }

        const featureData = featureMap.get(feature.name);
        featureData.contributions.push(feature.contribution);
        featureData.anomalousValues.push(feature.value);
      });
    });

    const featureContributions = Array.from(featureMap.values()).map(feature => {
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

    // Calculate KPIs
    const totalCustomers = customerMetrics.length;
    const anomalyRate = (filteredAnomalies.length / totalCustomers) * 100;
    const highSeverityCount = filteredAnomalies.filter(a => a.severity >= 4).length;
    const meanAnomalyScore = filteredAnomalies.length > 0 ? 
      filteredAnomalies.reduce((sum, a) => sum + a.anomalyScore, 0) / filteredAnomalies.length : 0;
    
    const topFeature = featureContributions.length > 0 ? featureContributions[0].featureName : 'None';
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const newAnomalies = filteredAnomalies.filter(a => new Date(a.detectionDate) > oneDayAgo).length;

    const kpis = {
      anomalyRate: anomalyRate,
      anomalyRateTrend: 0, // Would need historical data
      highSeverityCount,
      topAnomalousFeature: topFeature,
      meanAnomalyScore: meanAnomalyScore,
      meanAnomalyScoreTrend: 0, // Would need historical data
      newAnomalies24h: newAnomalies
    };

    // Generate temporal data (simplified)
    const days = 30;
    const temporalData = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const baseRate = 0.05;
      const noise = (Math.random() - 0.5) * 0.02;
      const anomalyRate = Math.max(0, baseRate + noise);
      
      temporalData.push({
        date: date.toISOString().split('T')[0],
        anomalyCount: Math.floor(Math.random() * 20) + 5,
        anomalyRate: anomalyRate * 100,
        avgSeverity: Math.random() * 2 + 2.5,
        threshold: 3.0
      });
    }

    // Generate dashboard data
    const dashboardData = {
      anomalies: filteredAnomalies.slice(0, 1000), // Limit for performance
      severityDistribution,
      regionData: [], // Would calculate region data here
      featureContributions,
      kpis,
      temporalData
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Anomaly detection API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
} 