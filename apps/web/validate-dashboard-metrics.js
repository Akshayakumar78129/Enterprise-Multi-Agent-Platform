const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Comprehensive validation of all dashboard metrics against database
async function validateDashboardMetrics() {
  console.log('🔍 VALIDATING DASHBOARD METRICS AGAINST DATABASE\n');
  console.log('='*70);
  
  const dbPath = path.join(__dirname, 'Customer/database/customers.db');
  const db = new sqlite3.Database(dbPath);
  
  // 1. Validate Customer Counts and Basic Statistics
  console.log('\n📊 1. CUSTOMER & TRANSACTION STATISTICS:');
  console.log('-'*50);
  
  const getBasicStats = () => new Promise((resolve, reject) => {
    const stats = {};
    
    const queries = [
      {
        name: 'totalCustomers',
        sql: 'SELECT COUNT(DISTINCT "Customer Key") as count FROM dbo_D_Customer WHERE "Customer Key" > 0'
      },
      {
        name: 'totalTransactions', 
        sql: 'SELECT COUNT(*) as count FROM dbo_F_Sales_Transaction'
      },
      {
        name: 'customersWithTransactions',
        sql: `SELECT COUNT(DISTINCT c."Customer Key") as count 
              FROM dbo_D_Customer c
              INNER JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"`
      },
      {
        name: 'avgTransactionsPerCustomer',
        sql: `SELECT AVG(tx_count) as avg FROM (
                SELECT COUNT(*) as tx_count 
                FROM dbo_F_Sales_Transaction 
                GROUP BY "Customer Key"
              )`
      },
      {
        name: 'totalRevenue',
        sql: 'SELECT SUM(CAST("Sales Amount" AS REAL)) as total FROM dbo_F_Sales_Transaction'
      }
    ];
    
    let completed = 0;
    queries.forEach(query => {
      db.get(query.sql, (err, row) => {
        if (err) {
          console.error(`Error in ${query.name}:`, err);
          stats[query.name] = 'ERROR';
        } else {
          stats[query.name] = row.count || row.avg || row.total || 0;
        }
        completed++;
        if (completed === queries.length) {
          resolve(stats);
        }
      });
    });
  });
  
  const basicStats = await getBasicStats();
  console.log('   Total Customers in DB:', basicStats.totalCustomers);
  console.log('   Total Transactions:', basicStats.totalTransactions);
  console.log('   Customers with Transactions:', basicStats.customersWithTransactions);
  console.log('   Avg Transactions per Customer:', basicStats.avgTransactionsPerCustomer?.toFixed(2));
  console.log('   Total Revenue: $', basicStats.totalRevenue?.toFixed(2));
  
  // 2. Validate Churn Risk Distribution
  console.log('\n\n📈 2. CHURN RISK DISTRIBUTION VALIDATION:');
  console.log('-'*50);
  
  const getRiskDistribution = () => new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c."Customer Key" as customer_id,
        c."Customer Name" as name,
        MAX(DATE(t."Txn Date")) as last_purchase,
        julianday('2021-12-31') - julianday(MAX(DATE(t."Txn Date"))) as days_since_purchase,
        COUNT(t."Sales Txn Key") as frequency,
        AVG(CAST(t."Sales Amount" AS REAL)) as avg_amount
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
      WHERE c."Customer Key" > 0
      GROUP BY c."Customer Key", c."Customer Name"
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) reject(err);
      else {
        const riskCounts = {
          'Very High': 0,
          'High': 0,
          'Medium': 0,
          'Low': 0,
          'No Transactions': 0
        };
        
        rows.forEach(row => {
          if (!row.last_purchase) {
            riskCounts['No Transactions']++;
          } else if (row.days_since_purchase > 180) {
            riskCounts['Very High']++;
          } else if (row.days_since_purchase > 90) {
            riskCounts['High']++;
          } else if (row.days_since_purchase > 30) {
            riskCounts['Medium']++;
          } else {
            riskCounts['Low']++;
          }
        });
        
        resolve({ total: rows.length, distribution: riskCounts });
      }
    });
  });
  
  const riskData = await getRiskDistribution();
  console.log('   Database Risk Distribution:');
  Object.entries(riskData.distribution).forEach(([level, count]) => {
    const percentage = ((count / riskData.total) * 100).toFixed(1);
    console.log(`   - ${level}: ${count} customers (${percentage}%)`);
  });
  
  // 3. Test Churn Prediction API and Compare
  console.log('\n\n🔄 3. API vs DATABASE COMPARISON:');
  console.log('-'*50);
  
  const testChurnAPI = () => new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/churn-prediction/data?count=100',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
  
  try {
    const apiResponse = await testChurnAPI();
    
    if (apiResponse.status === 'success' && apiResponse.data) {
      console.log('\n   📡 API Response Analysis:');
      console.log('   - Total Customers Returned:', apiResponse.data.customers?.length || 0);
      console.log('   - Source:', apiResponse.source);
      
      if (apiResponse.data.summary) {
        console.log('\n   Risk Level Counts from API:');
        console.log('   - Low Risk:', apiResponse.data.summary.low_risk_count);
        console.log('   - Medium Risk:', apiResponse.data.summary.medium_risk_count);
        console.log('   - High Risk:', apiResponse.data.summary.high_risk_count);
        console.log('   - Very High Risk:', apiResponse.data.summary.very_high_risk_count);
        console.log('   - Avg Churn Probability:', apiResponse.data.summary.avg_churn_probability?.toFixed(3));
      }
      
      // Validate risk distribution
      if (apiResponse.data.risk_distribution) {
        console.log('\n   Risk Distribution from API:');
        apiResponse.data.risk_distribution.forEach(item => {
          console.log(`   - ${item.risk_level}: ${item.count} (${item.percentage.toFixed(1)}%)`);
        });
      }
      
      // Validate time series data
      if (apiResponse.data.risk_time_series) {
        console.log('\n   Time Series Data Points:', apiResponse.data.risk_time_series.length);
        apiResponse.data.risk_time_series.forEach(point => {
          const total = (point.low || 0) + (point.medium || 0) + (point.high || 0) + (point.very_high || 0);
          console.log(`   - ${point.date}: Total ${total} (L:${point.low}, M:${point.medium}, H:${point.high}, VH:${point.very_high})`);
        });
      }
      
      // Validate segment matrix
      if (apiResponse.data.segment_matrix) {
        console.log('\n   Segment Matrix:');
        apiResponse.data.segment_matrix.forEach(segment => {
          const total = (segment.low || 0) + (segment.medium || 0) + (segment.high || 0) + (segment.very_high || 0);
          console.log(`   - ${segment.segment}: Total ${total} (L:${segment.low}, M:${segment.medium}, H:${segment.high}, VH:${segment.very_high})`);
        });
      }
    }
  } catch (error) {
    console.error('   ❌ Error calling API:', error.message);
  }
  
  // 4. Validate RFM Segmentation
  console.log('\n\n🎯 4. RFM SEGMENTATION VALIDATION:');
  console.log('-'*50);
  
  const getRFMSegments = () => new Promise((resolve, reject) => {
    const query = `
      WITH RFMData AS (
        SELECT 
          c."Customer Key" as customer_id,
          julianday('2021-12-31') - julianday(MAX(DATE(t."Txn Date"))) as recency,
          COUNT(t."Sales Txn Key") as frequency,
          SUM(CAST(t."Sales Amount" AS REAL)) as monetary
        FROM dbo_D_Customer c
        LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
        WHERE c."Customer Key" > 0
        GROUP BY c."Customer Key"
        HAVING COUNT(t."Sales Txn Key") > 0
      )
      SELECT 
        CASE 
          WHEN recency <= 30 AND frequency >= 10 AND monetary >= 5000 THEN 'Champions'
          WHEN recency <= 60 AND frequency >= 5 AND monetary >= 3000 THEN 'Loyal Customers'
          WHEN recency <= 30 AND frequency < 5 THEN 'New Customers'
          WHEN recency > 90 AND frequency >= 5 THEN 'At Risk'
          WHEN recency > 180 THEN 'Lost Customers'
          ELSE 'Other'
        END as segment,
        COUNT(*) as count
      FROM RFMData
      GROUP BY segment
      ORDER BY count DESC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  const rfmSegments = await getRFMSegments();
  console.log('   RFM Segments from Database:');
  rfmSegments.forEach(segment => {
    console.log(`   - ${segment.segment}: ${segment.count} customers`);
  });
  
  // 5. Test Customer Segmentation API
  console.log('\n\n🔄 5. CUSTOMER SEGMENTATION API VALIDATION:');
  console.log('-'*50);
  
  const testSegmentationAPI = () => new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/customer-segmentation/data?limit=100',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
  
  try {
    const segmentResponse = await testSegmentationAPI();
    
    if (segmentResponse.success && segmentResponse.data) {
      console.log('\n   📡 Segmentation API Response:');
      console.log('   - Total Customers:', segmentResponse.data.kpi_data?.total_customers || 0);
      console.log('   - Segments Identified:', segmentResponse.data.kpi_data?.segments_with_data || 0);
      console.log('   - Avg Customer Value: $', segmentResponse.data.kpi_data?.avg_customer_value || 0);
      
      if (segmentResponse.data.segment_distribution) {
        console.log('\n   Segment Distribution:');
        segmentResponse.data.segment_distribution.forEach(segment => {
          console.log(`   - ${segment.segment_name}: ${segment.customer_count} (${segment.percentage.toFixed(1)}%)`);
        });
      }
    }
  } catch (error) {
    console.error('   ❌ Error calling Segmentation API:', error.message);
  }
  
  // 6. Summary and Validation Results
  console.log('\n\n✅ VALIDATION SUMMARY:');
  console.log('='*70);
  console.log('Database Statistics:');
  console.log(`  - Total Customers: ${basicStats.totalCustomers}`);
  console.log(`  - Total Transactions: ${basicStats.totalTransactions}`);
  console.log(`  - Customers with Purchase History: ${basicStats.customersWithTransactions}`);
  console.log('\nRisk Distribution (Based on Recency):');
  Object.entries(riskData.distribution).forEach(([level, count]) => {
    console.log(`  - ${level}: ${count} customers`);
  });
  console.log('\n✨ All metrics should be derived from these real database values.');
  console.log('   No dummy or mock data should be displayed in the dashboards.');
  
  db.close();
}

// Run validation
validateDashboardMetrics().catch(console.error);