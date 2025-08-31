const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Test that the APIs are returning real database data
async function testDataConsistency() {
  console.log('📊 Testing Data Consistency Between Database and APIs\n');
  console.log('='*60);
  
  // 1. Connect to database and get actual counts
  const dbPath = path.join(__dirname, 'Customer/database/customers.db');
  const db = new sqlite3.Database(dbPath);
  
  const getDbStats = () => new Promise((resolve, reject) => {
    const stats = {};
    
    // Get customer count
    db.get('SELECT COUNT(*) as count FROM dbo_D_Customer WHERE "Customer Key" > 0', (err, row) => {
      if (err) reject(err);
      stats.customerCount = row.count;
      
      // Get transaction count
      db.get('SELECT COUNT(*) as count FROM dbo_F_Sales_Transaction', (err, row) => {
        if (err) reject(err);
        stats.transactionCount = row.count;
        
        // Get sample customers with transaction data
        const query = `
          SELECT 
            c."Customer Key" as customer_id,
            c."Customer Name" as name,
            COUNT(t."Sales Txn Key") as transactions,
            MAX(DATE(t."Txn Date")) as last_purchase
          FROM dbo_D_Customer c
          LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
          WHERE c."Customer Key" > 0
          GROUP BY c."Customer Key"
          LIMIT 5
        `;
        
        db.all(query, [], (err, rows) => {
          if (err) reject(err);
          stats.sampleCustomers = rows;
          resolve(stats);
        });
      });
    });
  });
  
  try {
    const dbStats = await getDbStats();
    console.log('\n🗄️  DATABASE STATS:');
    console.log(`   Total Customers: ${dbStats.customerCount}`);
    console.log(`   Total Transactions: ${dbStats.transactionCount}`);
    console.log('\n   Sample Customers:');
    dbStats.sampleCustomers.forEach(c => {
      console.log(`   - ${c.name}: ${c.transactions} transactions, last purchase: ${c.last_purchase || 'Never'}`);
    });
    
    // 2. Test Churn Prediction API
    console.log('\n\n📈 TESTING CHURN PREDICTION API:');
    console.log('-'*40);
    
    const testChurnAPI = () => new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/churn-prediction/data?count=10',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.status === 'success' && result.data) {
              console.log(`   ✅ API Response Status: ${result.status}`);
              console.log(`   Source: ${result.source || 'unknown'}`);
              console.log(`   Customers Returned: ${result.data.customers?.length || 0}`);
              console.log(`   Database Path: ${result.database?.path || 'not specified'}`);
              
              if (result.data.customers && result.data.customers.length > 0) {
                console.log('\n   Sample Data (first 3 customers):');
                result.data.customers.slice(0, 3).forEach(c => {
                  console.log(`   - ID: ${c.customer_id}, Name: ${c.name}, Risk: ${c.risk_level}, Churn Prob: ${c.churn_probability}`);
                });
              }
              
              // Check if using real data
              if (result.source === 'real-database') {
                console.log('   ✅ Using REAL database data');
              } else {
                console.log('   ⚠️  WARNING: Not using real database data!');
              }
            } else {
              console.log('   ❌ API returned error or no data');
            }
            resolve(result);
          } catch (e) {
            console.log('   ❌ Failed to parse API response:', e.message);
            reject(e);
          }
        });
      });
      
      req.on('error', (e) => {
        console.log('   ❌ API Request failed:', e.message);
        reject(e);
      });
      
      req.end();
    });
    
    await testChurnAPI().catch(e => console.error(e));
    
    // 3. Test Customer Segmentation API
    console.log('\n\n🎯 TESTING CUSTOMER SEGMENTATION API:');
    console.log('-'*40);
    
    const testSegmentationAPI = () => new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/customer-segmentation/data?limit=10',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.success && result.data) {
              console.log(`   ✅ API Response Success: ${result.success}`);
              console.log(`   Source: ${result.source || 'unknown'}`);
              console.log(`   Segment Data Records: ${result.data.segment_data?.length || 0}`);
              console.log(`   Total Customers: ${result.data.kpi_data?.total_customers || 0}`);
              console.log(`   Database Path: ${result.database?.path || 'not specified'}`);
              
              if (result.data.segment_distribution) {
                console.log('\n   Segment Distribution:');
                result.data.segment_distribution.slice(0, 3).forEach(s => {
                  console.log(`   - ${s.segment_name}: ${s.customer_count} customers (${s.percentage.toFixed(1)}%)`);
                });
              }
              
              // Check if using real data
              if (result.source === 'real-database') {
                console.log('   ✅ Using REAL database data');
              } else {
                console.log('   ⚠️  WARNING: Not using real database data!');
              }
            } else {
              console.log('   ❌ API returned error or no data');
            }
            resolve(result);
          } catch (e) {
            console.log('   ❌ Failed to parse API response:', e.message);
            reject(e);
          }
        });
      });
      
      req.on('error', (e) => {
        console.log('   ❌ API Request failed:', e.message);
        reject(e);
      });
      
      req.end();
    });
    
    await testSegmentationAPI().catch(e => console.error(e));
    
    // 4. Summary
    console.log('\n\n📋 SUMMARY:');
    console.log('='*60);
    console.log('Database contains:');
    console.log(`  - ${dbStats.customerCount} customers`);
    console.log(`  - ${dbStats.transactionCount} transactions`);
    console.log('\nAPIs should be returning data based on these real records.');
    console.log('Both dashboards should show consistent data from the same source.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    db.close();
  }
}

// Run the test
testDataConsistency();