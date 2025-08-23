const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Copy the exact functions from the assistant API to debug
function resolveDbPathUnderOrch(file) {
  const variants = [
    ['multiagent-agency', 'apps', 'adk', 'orchestration_agent', 'database'],
    ['apps', 'adk', 'orchestration_agent', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Sales', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Finance', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Customer', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Inventory', 'database'],
    ['..', 'adk', 'orchestration_agent', 'database'],
    ['Sales', 'database'],
    ['Finance', 'database'],
    ['Customer', 'database'],
    ['Inventory', 'database'],
  ];
  
  const rootDir = '/Users/jeethkataria/xyz5';
  
  for (const parts of variants) {
    const p = path.join(rootDir, ...parts, file);
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch (err) {
      continue;
    }
  }
  
  return null;
}

async function all(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function fetchSalesContext() {
  const dbPath = resolveDbPathUnderOrch('sales_agent.db');
  if (!dbPath) return { note: 'sales_agent.db not found' };
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    let chosen = null;
    
    for (const tableName of tables.map(r=>r.name)) {
      try {
        const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
        const cols = await all(db, `PRAGMA table_info(${tableRef})`);
        const names = cols.map(c=>c.name);
        
        const amount = names.find(n => /(Sales.*Amount|Net.*Sales.*Amount|Order.*Amount|Quote.*Amount|Goal.*Amount)/i.test(n));
        const date = names.find(n => /(Posting.*Date|Order.*Date|Snapshot.*Date|Goal.*Date|Date)/i.test(n));
        
        if (amount && date) {
          const score = (/Sales/i.test(tableName) ? 3 : 0) + 
                       (/Transaction/i.test(tableName) ? 2 : 0) + 
                       (/F_/i.test(tableName) ? 1 : 0);
          if (!chosen || score > chosen.score) {
            chosen = { 
              table: tableRef, 
              tableName: tableName,
              amountCol: `"${amount}"`, 
              dateCol: `"${date}"`,
              score 
            };
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!chosen) {
      return { 
        note: 'No suitable sales table found with amount and date columns',
        available_tables: tables.map(r=>r.name)
      };
    }

    const { table: tableRef, amountCol, dateCol } = chosen;
    console.log(`Sales agent using table: ${chosen.tableName}, amount: ${amountCol}, date: ${dateCol}`);

    // Get monthly data
    const byMonth = await all(db, `
      SELECT strftime('%Y-%m', ${dateCol}) as year_month,
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount,
             COUNT(*) as tx_count
      FROM ${tableRef}
      WHERE ${dateCol} IS NOT NULL AND ${amountCol} IS NOT NULL
      GROUP BY strftime('%Y-%m', ${dateCol})
      ORDER BY year_month DESC
      LIMIT 12
    `);

    // Enhanced sales analysis with specific metrics
    const salesMetrics = {
      totalRevenue: byMonth.reduce((sum, m) => sum + m.total_amount, 0),
      avgMonthlyRevenue: byMonth.length > 0 ? byMonth.reduce((sum, m) => sum + m.total_amount, 0) / byMonth.length : 0,
      totalTransactions: byMonth.reduce((sum, m) => sum + m.tx_count, 0),
      avgOrderValue: byMonth.reduce((sum, m) => sum + m.total_amount, 0) / Math.max(byMonth.reduce((sum, m) => sum + m.tx_count, 0), 1),
      period: `${byMonth[byMonth.length-1]?.year_month || 'N/A'} to ${byMonth[0]?.year_month || 'N/A'}`
    };

    return { 
      db: dbPath, 
      table: chosen.tableName,
      byMonth: byMonth.slice(0, 6), 
      salesMetrics,
      productType: 'Mixed Product Portfolio',
      analysisType: 'Transactional Sales Data'
    };
  } catch (error) {
    console.error('Sales context error:', error);
    return { note: `Error fetching sales data: ${error.message}` };
  } finally {
    db.close();
  }
}

async function fetchCustomerContext() {
  const dbPath = resolveDbPathUnderOrch('customers.db');
  if (!dbPath) return { note: 'customers.db not found' };
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    let chosen = null;
    
    for (const tableName of tables.map(r=>r.name)) {
      try {
        const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
        const cols = await all(db, `PRAGMA table_info(${tableRef})`);
        const names = cols.map(c=>c.name);
        
        const amount = names.find(n => /(Amount|Total|Transaction.*Amount|Sales.*Amount|Value)/i.test(n));
        const customer = names.find(n => /(Customer.*Key|Customer.*ID|Customer.*Number|Customer|Client.*ID)/i.test(n));
        const date = names.find(n => /(Transaction.*Date|Invoice.*Date|Posting.*Date|Due.*Date|Date)/i.test(n));
        
        if (amount && customer) {
          let score = 0;
          if (/Customer|AR/i.test(tableName)) score += 3;
          if (/Transaction|Sales/i.test(tableName)) score += 2;
          if (date) score += 1;
          
          if (!chosen || score > chosen.score) {
            chosen = { 
              table: tableRef,
              tableName: tableName,
              customerCol: `"${customer}"`, 
              amountCol: `"${amount}"`,
              dateCol: date ? `"${date}"` : null,
              score 
            };
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!chosen) {
      return { 
        note: 'No suitable customer table found with customer and amount columns',
        available_tables: tables.map(r=>r.name)
      };
    }

    const { table: tableRef, customerCol, amountCol } = chosen;
    console.log(`Customer agent using table: ${chosen.tableName}, customer: ${customerCol}, amount: ${amountCol}`);

    // Top customers by amount
    const topCustomers = await all(db, `
      SELECT ${customerCol} as customer_id, 
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount, 
             COUNT(*) as transaction_count
      FROM ${tableRef}
      WHERE ${amountCol} IS NOT NULL
      GROUP BY ${customerCol}
      ORDER BY total_amount DESC
      LIMIT 15
    `);

    return { 
      db: dbPath,
      table: chosen.tableName,
      topCustomers
    };
  } catch (error) {
    console.error('Customer context error:', error);
    return { note: `Error fetching customer data: ${error.message}` };
  } finally {
    db.close();
  }
}

async function debugAgentResponses() {
  console.log('🔍 DEBUGGING AGENT RESPONSES\n');
  console.log('=' .repeat(60));

  // Test Sales Agent
  console.log('\n📈 SALES AGENT DATA CONTEXT:');
  console.log('-' .repeat(40));
  const salesContext = await fetchSalesContext();
  console.log('Sales Context Structure:');
  console.log(JSON.stringify(salesContext, null, 2));
  
  // Test Customer Agent
  console.log('\n👥 CUSTOMER AGENT DATA CONTEXT:');
  console.log('-' .repeat(40));
  const customerContext = await fetchCustomerContext();
  console.log('Customer Context Structure:');
  console.log(JSON.stringify(customerContext, null, 2));

  // Test what the enhanced LLM would see
  console.log('\n🤖 ENHANCED LLM LOGIC TEST:');
  console.log('-' .repeat(40));
  
  // Sales Agent Test
  console.log('\nSales Agent Test:');
  console.log('- Has salesMetrics?', !!salesContext.salesMetrics);
  console.log('- salesMetrics content:', salesContext.salesMetrics);
  
  // Customer Agent Test
  console.log('\nCustomer Agent Test:');
  console.log('- Has topCustomers?', !!customerContext.topCustomers);
  console.log('- topCustomers length:', customerContext.topCustomers?.length || 0);
  console.log('- First customer:', customerContext.topCustomers?.[0]);

  console.log('\n🎯 DIAGNOSIS:');
  console.log('=' .repeat(60));
  
  if (salesContext.salesMetrics) {
    console.log('✅ Sales agent should return detailed data');
  } else {
    console.log('❌ Sales agent will return generic message - salesMetrics missing');
  }
  
  if (customerContext.topCustomers && customerContext.topCustomers.length > 0) {
    console.log('✅ Customer agent should return detailed data');
  } else {
    console.log('❌ Customer agent will return generic message - topCustomers missing or empty');
  }
}

debugAgentResponses().catch(console.error);
