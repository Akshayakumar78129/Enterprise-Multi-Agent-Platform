import { DateRange } from '../types/transaction';

// Sample data for development - in production this would come from the SQLite database
const sampleData = {
  // Sample transaction data
  transactions: Array(100).fill(0).map((_, i) => ({
    id: `TX-${1000 + i}`,
    customerId: `CUST-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    value: Math.floor(Math.random() * 200) + 50,
    products: ['Electronics', 'Accessories', 'Services'].filter(() => Math.random() > 0.5),
    paymentMethod: ['Credit Card', 'Digital Wallet', 'Bank Transfer', 'Cash'][Math.floor(Math.random() * 4)],
    location: `Store #${100 + Math.floor(Math.random() * 50)}`
  })),

  // Sample statistics
  stats: {
    totalTransactions: 12345,
    startDate: '2023-01-01',
    endDate: '2023-01-31',
    anomalyRate: 0.08,
    peakHours: [
      { hour: 12, count: 1245, percentage: 0.18 },
      { hour: 17, count: 1100, percentage: 0.16 }
    ],
    dailyDistribution: [
      { day: 'Monday', count: 1800, percentage: 0.15 },
      { day: 'Tuesday', count: 1900, percentage: 0.16 },
      { day: 'Wednesday', count: 2100, percentage: 0.17 },
      { day: 'Thursday', count: 2200, percentage: 0.18 },
      { day: 'Friday', count: 2000, percentage: 0.16 },
      { day: 'Saturday', count: 1200, percentage: 0.09 },
      { day: 'Sunday', count: 1100, percentage: 0.09 }
    ],
    paymentDistribution: [
      { method: 'Credit Card', count: 6500, percentage: 0.53 },
      { method: 'Digital Wallet', count: 3200, percentage: 0.26 },
      { method: 'Bank Transfer', count: 1845, percentage: 0.15 },
      { method: 'Cash', count: 800, percentage: 0.06 }
    ]
  },

  // Sample heatmap data
  temporalHeatmap: {
    hourlyMatrix: Array(7).fill(0).map(() => 
      Array(24).fill(0).map(() => Math.floor(Math.random() * 100))
    ),
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    hours: Array.from({ length: 24 }, (_, i) => i)
  },

  // Sample product associations
  productAssociations: Array(20).fill(0).map((_, i) => ({
    sourceProduct: `Product ${i}`,
    targetProduct: `Product ${Math.floor(Math.random() * 20)}`,
    strength: Math.random() * 0.8 + 0.2,
    count: Math.floor(Math.random() * 500)
  }))
};

/**
 * Fetch transaction data
 * 
 * Note: Using sample data for now. In a real implementation, this would connect to the SQLite database
 * via an API endpoint or a more browser-compatible approach.
 */
export const fetchTransactions = async (dateRange: DateRange) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      transactions: sampleData.transactions,
      stats: {
        ...sampleData.stats,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      temporalHeatmap: sampleData.temporalHeatmap,
      productAssociations: sampleData.productAssociations
    };
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw new Error('Failed to fetch transaction data');
  }
};

/**
 * Fetch anomaly data
 * 
 * Note: Using sample data for now. In a real implementation, this would connect to the SQLite database
 * via an API endpoint or a more browser-compatible approach.
 */
export const fetchAnomalies = async (dateRange: DateRange) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate sample anomaly data
    const anomalies = Array(10).fill(0).map((_, i) => ({
      transactionId: `TX-${1000 + i}`,
      timestamp: new Date().toISOString(),
      value: Math.random() * 2000,
      hour: Math.floor(Math.random() * 24),
      dayOfWeek: Math.floor(Math.random() * 7) + 1,
      productsCount: Math.floor(Math.random() * 10) + 1,
      paymentMethod: ['Credit Card', 'Digital Wallet', 'Bank Transfer', 'Cash'][Math.floor(Math.random() * 4)],
      location: `Store #${100 + Math.floor(Math.random() * 10)}`,
      isAnomaly: true,
      anomalyScore: Math.random() * 0.5 + 0.5
    }));
    
    const stats = {
      anomalyRate: 0.08,
      anomalyCount: 985,
      totalTransactions: 12345,
      anomalyDistribution: {
        byHour: {},
        byDay: {},
        byPaymentMethod: {},
        byValue: { low: 210, medium: 575, high: 200 }
      }
    };
    
    return {
      anomalies,
      stats
    };
  } catch (error) {
    console.error('Error fetching anomaly data:', error);
    throw new Error('Failed to fetch anomaly data');
  }
};

// Helper functions to calculate stats and generate visualizations
async function calculateTransactionStats(connection, dateRange) {
  // Total transactions
  const countQuery = `
    SELECT COUNT(*) as count
    FROM transactions
    WHERE DATE(timestamp) BETWEEN ? AND ?
  `;
  const countResult = await connection.query(countQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  const totalTransactions = countResult[0].count;
  
  // Anomaly rate
  const anomalyCountQuery = `
    SELECT COUNT(*) as count
    FROM transactions t
    JOIN anomaly_detection a ON t.transaction_id = a.transaction_id
    WHERE DATE(t.timestamp) BETWEEN ? AND ?
    AND a.is_anomaly = true
  `;
  const anomalyResult = await connection.query(anomalyCountQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  const anomalyCount = anomalyResult[0].count;
  const anomalyRate = totalTransactions > 0 ? anomalyCount / totalTransactions : 0;
  
  // Peak hours
  const hourlyQuery = `
    SELECT 
      HOUR(timestamp) as hour,
      COUNT(*) as count
    FROM transactions
    WHERE DATE(timestamp) BETWEEN ? AND ?
    GROUP BY HOUR(timestamp)
    ORDER BY count DESC
  `;
  const hourlyResults = await connection.query(hourlyQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  const peakHours = hourlyResults.map(h => ({
    hour: h.hour,
    count: h.count,
    percentage: totalTransactions > 0 ? h.count / totalTransactions : 0
  }));
  
  // Daily distribution
  const dailyQuery = `
    SELECT 
      DAYNAME(timestamp) as day,
      COUNT(*) as count
    FROM transactions
    WHERE DATE(timestamp) BETWEEN ? AND ?
    GROUP BY DAYNAME(timestamp)
    ORDER BY DAYOFWEEK(timestamp)
  `;
  const dailyResults = await connection.query(dailyQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  const dailyDistribution = dailyResults.map(d => ({
    day: d.day,
    count: d.count,
    percentage: totalTransactions > 0 ? d.count / totalTransactions : 0
  }));
  
  // Payment method distribution
  const paymentQuery = `
    SELECT 
      payment_method as method,
      COUNT(*) as count
    FROM transactions
    WHERE DATE(timestamp) BETWEEN ? AND ?
    GROUP BY payment_method
    ORDER BY count DESC
  `;
  const paymentResults = await connection.query(paymentQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  const paymentDistribution = paymentResults.map(p => ({
    method: p.method,
    count: p.count,
    percentage: totalTransactions > 0 ? p.count / totalTransactions : 0
  }));
  
  return {
    totalTransactions,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    anomalyRate,
    peakHours,
    dailyDistribution,
    paymentDistribution
  };
}

async function generateTemporalHeatmap(connection, dateRange) {
  // Get hourly distribution by day
  const query = `
    SELECT 
      DAYNAME(timestamp) as day,
      HOUR(timestamp) as hour,
      COUNT(*) as count
    FROM transactions
    WHERE DATE(timestamp) BETWEEN ? AND ?
    GROUP BY DAYNAME(timestamp), HOUR(timestamp)
    ORDER BY DAYOFWEEK(timestamp), HOUR(timestamp)
  `;
  
  const results = await connection.query(query, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  
  // Transform into matrix format
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Initialize matrix with zeros
  const hourlyMatrix = days.map(() => hours.map(() => 0));
  
  // Fill matrix with data
  results.forEach(result => {
    const dayIndex = days.indexOf(result.day);
    if (dayIndex !== -1 && result.hour >= 0 && result.hour < 24) {
      hourlyMatrix[dayIndex][result.hour] = result.count;
    }
  });
  
  return {
    hourlyMatrix,
    days,
    hours
  };
}

async function getProductAssociations(connection, dateRange) {
  // Get product associations from transaction data
  const query = `
    SELECT 
      source_product as sourceProduct,
      target_product as targetProduct,
      association_strength as strength,
      occurrence_count as count
    FROM product_associations
    WHERE date_range_start <= ? AND date_range_end >= ?
    ORDER BY association_strength DESC
    LIMIT 100
  `;
  
  const results = await connection.query(query, [
    dateRange.endDate,
    dateRange.startDate
  ]);
  
  return results;
}

async function calculateAnomalyStats(connection, dateRange) {
  // Get basic stats
  const statsQuery = `
    SELECT 
      COUNT(*) as anomaly_count,
      (SELECT COUNT(*) FROM transactions WHERE DATE(timestamp) BETWEEN ? AND ?) as total_count
    FROM transactions t
    JOIN anomaly_detection a ON t.transaction_id = a.transaction_id
    WHERE DATE(t.timestamp) BETWEEN ? AND ?
    AND a.is_anomaly = true
  `;
  
  const statsResult = await connection.query(statsQuery, [
    dateRange.startDate,
    dateRange.endDate,
    dateRange.startDate,
    dateRange.endDate
  ]);
  
  const anomalyCount = statsResult[0].anomaly_count;
  const totalTransactions = statsResult[0].total_count;
  const anomalyRate = totalTransactions > 0 ? anomalyCount / totalTransactions : 0;
  
  // Get distribution by hour
  const hourlyQuery = `
    SELECT 
      HOUR(t.timestamp) as hour,
      COUNT(*) as count
    FROM transactions t
    JOIN anomaly_detection a ON t.transaction_id = a.transaction_id
    WHERE DATE(t.timestamp) BETWEEN ? AND ?
    AND a.is_anomaly = true
    GROUP BY HOUR(t.timestamp)
  `;
  
  const hourlyResults = await connection.query(hourlyQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  
  const byHour = {};
  hourlyResults.forEach(result => {
    byHour[result.hour] = result.count;
  });
  
  // Get distribution by day
  const dailyQuery = `
    SELECT 
      DAYNAME(t.timestamp) as day,
      COUNT(*) as count
    FROM transactions t
    JOIN anomaly_detection a ON t.transaction_id = a.transaction_id
    WHERE DATE(t.timestamp) BETWEEN ? AND ?
    AND a.is_anomaly = true
    GROUP BY DAYNAME(t.timestamp)
  `;
  
  const dailyResults = await connection.query(dailyQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  
  const byDay = {};
  dailyResults.forEach(result => {
    byDay[result.day] = result.count;
  });
  
  // Get distribution by payment method
  const paymentQuery = `
    SELECT 
      t.payment_method as method,
      COUNT(*) as count
    FROM transactions t
    JOIN anomaly_detection a ON t.transaction_id = a.transaction_id
    WHERE DATE(t.timestamp) BETWEEN ? AND ?
    AND a.is_anomaly = true
    GROUP BY t.payment_method
  `;
  
  const paymentResults = await connection.query(paymentQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  
  const byPaymentMethod = {};
  paymentResults.forEach(result => {
    byPaymentMethod[result.method] = result.count;
  });
  
  // Get distribution by value range
  const valueQuery = `
    SELECT 
      CASE
        WHEN t.total_value < 100 THEN 'low'
        WHEN t.total_value < 1000 THEN 'medium'
        ELSE 'high'
      END as value_range,
      COUNT(*) as count
    FROM transactions t
    JOIN anomaly_detection a ON t.transaction_id = a.transaction_id
    WHERE DATE(t.timestamp) BETWEEN ? AND ?
    AND a.is_anomaly = true
    GROUP BY value_range
  `;
  
  const valueResults = await connection.query(valueQuery, [
    dateRange.startDate,
    dateRange.endDate
  ]);
  
  const byValue = {
    low: 0,
    medium: 0,
    high: 0
  };
  
  valueResults.forEach(result => {
    byValue[result.value_range] = result.count;
  });
  
  return {
    anomalyRate,
    anomalyCount,
    totalTransactions,
    anomalyDistribution: {
      byHour,
      byDay,
      byPaymentMethod,
      byValue
    }
  };
} 