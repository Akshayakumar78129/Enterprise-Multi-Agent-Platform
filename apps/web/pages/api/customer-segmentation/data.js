// DIRECT DATABASE ACCESS - Customer Segmentation
// This endpoint directly accesses the SQLite database for real customer segmentation data

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🚀 Using REAL DATABASE for customer segmentation data');

    // Parse query parameters
    const segmentType = req.query.segmentType || 'rfm';
    const limit = parseInt(req.query.limit) || 500;
    const includeMetrics = req.query.includeMetrics !== 'false';

    console.log('📊 Connecting to real database:', path.join(process.cwd(), 'Customer/database/customers.db'));
    
    // Connect to SQLite database
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    const db = new sqlite3.Database(dbPath);

    console.log('📊 Executing real database query for customer segmentation...');

    // Get customer data with transaction aggregations for RFM analysis
    const query = `
      SELECT 
        c."Customer Key" as customer_id,
        c."Customer Name" as customer_name,
        COUNT(t."Sales Txn Key") as frequency,
        MAX(DATE(t."Txn Date")) as last_purchase_date,
        ROUND(AVG(CAST(t."Sales Amount" AS REAL)), 2) as avg_order_value,
        ROUND(SUM(CAST(t."Sales Amount" AS REAL)), 2) as lifetime_value,
        ROUND(SUM(CAST(t."Sales Quantity" AS REAL)), 0) as total_quantity,
        COUNT(DISTINCT DATE(t."Txn Date")) as purchase_days,
        julianday('2021-12-31') - julianday(MAX(DATE(t."Txn Date"))) as recency_days
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
      WHERE c."Customer Key" > 0 AND c."Customer Name" IS NOT NULL
      GROUP BY c."Customer Key", c."Customer Name"
      HAVING COUNT(t."Sales Txn Key") > 0
      ORDER BY lifetime_value DESC
      LIMIT ?
    `;

    const customers = await new Promise((resolve, reject) => {
      db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    db.close();

    console.log(`✅ Retrieved ${customers.length} real customers from database`);
    
    // Implement RFM segmentation
    const segmentedCustomers = performRFMSegmentation(customers);
    
    // Calculate segment distribution
    const segmentDistribution = calculateSegmentDistribution(segmentedCustomers);
    
    // Calculate segment comparison metrics
    const segmentComparison = calculateSegmentComparison(segmentedCustomers);
    
    // Generate segment attributes matrix
    const segmentAttributes = generateSegmentAttributes(segmentedCustomers);
    
    // Calculate KPIs
    const kpis = calculateSegmentationKPIs(segmentedCustomers);

    const response = {
      success: true,
      data: {
        segment_data: segmentedCustomers.slice(0, 100), // Limit for frontend display
        kpi_data: kpis,
        segment_distribution: segmentDistribution,
        segment_comparison: segmentComparison,
        segment_attributes: segmentAttributes,
        metadata: {
          total_records: segmentedCustomers.length,
          segments_count: segmentDistribution.length,
          last_updated: new Date().toISOString(),
          segmentation_method: 'RFM Analysis',
          data_quality: {
            completeness: 100.0,
            segments_identified: segmentDistribution.length > 0
          }
        }
      },
      source: 'real-database',
      database: {
        path: dbPath,
        query_time: new Date().toISOString(),
        records_processed: customers.length
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error in customer segmentation API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer segmentation data',
      details: error.message
    });
  }
}

// RFM Segmentation Functions
function performRFMSegmentation(customers) {
  // Calculate RFM quintiles
  const recencyValues = customers.map(c => c.recency_days).sort((a, b) => a - b);
  const frequencyValues = customers.map(c => c.frequency).sort((a, b) => b - a);
  const monetaryValues = customers.map(c => c.lifetime_value).sort((a, b) => b - a);

  const getQuintile = (value, sortedArray) => {
    const quintileSize = Math.floor(sortedArray.length / 5);
    for (let i = 1; i <= 5; i++) {
      if (value <= sortedArray[i * quintileSize - 1] || i === 5) {
        return i;
      }
    }
    return 5;
  };

  return customers.map(customer => {
    const recencyScore = 6 - getQuintile(customer.recency_days, recencyValues); // Reverse for recency
    const frequencyScore = getQuintile(customer.frequency, frequencyValues);
    const monetaryScore = getQuintile(customer.lifetime_value, monetaryValues);
    
    const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
    const segment = determineSegment(recencyScore, frequencyScore, monetaryScore);
    
    return {
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      recency_days: customer.recency_days,
      frequency: customer.frequency,
      lifetime_value: customer.lifetime_value,
      avg_order_value: customer.avg_order_value,
      total_quantity: customer.total_quantity,
      purchase_days: customer.purchase_days,
      last_purchase_date: customer.last_purchase_date,
      recency_score: recencyScore,
      frequency_score: frequencyScore,
      monetary_score: monetaryScore,
      rfm_score: rfmScore,
      segment: segment,
      segment_color: getSegmentColor(segment)
    };
  });
}

function determineSegment(recency, frequency, monetary) {
  const avgScore = (recency + frequency + monetary) / 3;
  
  if (recency >= 4 && frequency >= 4 && monetary >= 4) return 'Champions';
  if (recency >= 3 && frequency >= 3 && monetary >= 4) return 'Loyal Customers';
  if (recency >= 4 && frequency < 3 && monetary >= 3) return 'Potential Loyalists';
  if (recency >= 4 && frequency >= 3 && monetary < 3) return 'New Customers';
  if (recency >= 3 && frequency < 3 && monetary < 3) return 'Promising';
  if (recency < 3 && frequency >= 3 && monetary >= 3) return 'Customers Needing Attention';
  if (recency < 3 && frequency < 3 && monetary >= 3) return 'About to Sleep';
  if (recency < 3 && frequency >= 3 && monetary < 3) return 'At Risk';
  if (recency >= 3 && frequency >= 3 && monetary >= 3) return 'Cannot Lose Them';
  return 'Lost Customers';
}

function getSegmentColor(segment) {
  const colorMap = {
    'Champions': '#00e0ff',           // Electric Cyan
    'Loyal Customers': '#e930ff',    // Signal Magenta  
    'Potential Loyalists': '#5fd4d6', // Lighter Cyan
    'New Customers': '#43cad0',      // Teal
    'Promising': '#aa45dd',          // Muted Purple
    'Customers Needing Attention': '#ff9500', // Orange
    'About to Sleep': '#ffb84d',     // Light Orange
    'At Risk': '#ff6b6b',           // Light Red
    'Cannot Lose Them': '#ff4757',   // Red
    'Lost Customers': '#636e72'      // Gray
  };
  return colorMap[segment] || '#666666';
}

function calculateSegmentDistribution(customers) {
  const segmentCounts = {};
  const totalCustomers = customers.length;
  
  customers.forEach(customer => {
    if (!segmentCounts[customer.segment]) {
      segmentCounts[customer.segment] = {
        segment_name: customer.segment,
        customer_count: 0,
        total_value: 0,
        segment_color: customer.segment_color
      };
    }
    segmentCounts[customer.segment].customer_count++;
    segmentCounts[customer.segment].total_value += customer.lifetime_value;
  });

  return Object.values(segmentCounts).map(segment => ({
    ...segment,
    percentage: (segment.customer_count / totalCustomers) * 100,
    avg_value: segment.customer_count > 0 ? segment.total_value / segment.customer_count : 0
  })).sort((a, b) => b.customer_count - a.customer_count);
}

function calculateSegmentComparison(customers) {
  const segmentMetrics = {};
  
  customers.forEach(customer => {
    if (!segmentMetrics[customer.segment]) {
      segmentMetrics[customer.segment] = {
        segment_name: customer.segment,
        customers: [],
        segment_color: customer.segment_color
      };
    }
    segmentMetrics[customer.segment].customers.push(customer);
  });

  return Object.values(segmentMetrics).map(segment => {
    const customers = segment.customers;
    const avgRecency = customers.reduce((sum, c) => sum + c.recency_days, 0) / customers.length;
    const avgFrequency = customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length;
    const avgMonetary = customers.reduce((sum, c) => sum + c.lifetime_value, 0) / customers.length;
    
    return {
      segment_name: segment.segment_name,
      customer_count: customers.length,
      avg_recency: Math.round(avgRecency),
      avg_frequency: Math.round(avgFrequency * 10) / 10,
      avg_monetary: Math.round(avgMonetary),
      segment_color: segment.segment_color,
      retention_potential: avgRecency < 90 ? 'High' : avgRecency < 180 ? 'Medium' : 'Low'
    };
  });
}

function calculateSegmentationKPIs(customers) {
  const totalCustomers = customers.length;
  const totalValue = customers.reduce((sum, c) => sum + c.lifetime_value, 0);
  const avgCustomerValue = totalValue / totalCustomers;
  
  const highValueCustomers = customers.filter(c => c.lifetime_value > avgCustomerValue * 2).length;
  const activeCustomers = customers.filter(c => c.recency_days < 90).length;
  const atRiskCustomers = customers.filter(c => c.segment.includes('Risk') || c.segment === 'Lost Customers').length;
  
  const uniqueSegments = [...new Set(customers.map(c => c.segment))].length;
  
  return {
    total_customers: totalCustomers,
    segments_with_data: uniqueSegments,
    avg_customer_value: Math.round(avgCustomerValue),
    high_value_customers: highValueCustomers,
    active_customers: activeCustomers,
    at_risk_customers: atRiskCustomers,
    retention_rate: Math.round((activeCustomers / totalCustomers) * 100 * 10) / 10,
    segment_performance: atRiskCustomers < (totalCustomers * 0.3) ? 'positive' : 'needs_attention'
  };
}

function generateSegmentAttributes(customers) {
  const segments = [...new Set(customers.map(c => c.segment))];
  const attributes = ['Recency Score', 'Frequency Score', 'Monetary Score', 'Avg Order Value'];
  
  return attributes.map(attribute => {
    const result = { attribute };
    
    segments.forEach(segment => {
      const segmentCustomers = customers.filter(c => c.segment === segment);
      let value;
      
      switch (attribute) {
        case 'Recency Score':
          value = segmentCustomers.reduce((sum, c) => sum + c.recency_score, 0) / segmentCustomers.length;
          break;
        case 'Frequency Score':
          value = segmentCustomers.reduce((sum, c) => sum + c.frequency_score, 0) / segmentCustomers.length;
          break;
        case 'Monetary Score':
          value = segmentCustomers.reduce((sum, c) => sum + c.monetary_score, 0) / segmentCustomers.length;
          break;
        case 'Avg Order Value':
          value = segmentCustomers.reduce((sum, c) => sum + c.avg_order_value, 0) / segmentCustomers.length;
          break;
      }
      
      result[segment.toLowerCase().replace(/\s+/g, '_')] = Math.round(value * 10) / 10;
    });
    
    return result;
  });
}