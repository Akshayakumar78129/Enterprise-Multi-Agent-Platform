// Final comprehensive test for all 4 agents with fixes applied
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function all(db, sql) {
  return new Promise((resolve, reject) => db.all(sql, [], (e, rows) => e ? reject(e) : resolve(rows || [])));
}

function resolveDbPathUnderOrch(filename) {
  const dbPath = path.join(process.cwd(), '../adk/orchestration_agent/database', filename);
  try {
    require('fs').accessSync(dbPath);
    return dbPath;
  } catch {
    return null;
  }
}

async function testSalesAgent() {
  console.log('=== Testing Sales Agent (Fixed) ===');
  const dbPath = resolveDbPathUnderOrch('sales_agent.db');
  if (!dbPath) {
    console.log('❌ sales_agent.db not found');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    let chosen = null;
    
    for (const tableName of tables.map(r=>r.name)) {
      try {
        // Handle both quoted and unquoted table names
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
        console.log(`Skipping table ${tableName}: ${e.message}`);
        continue;
      }
    }
    
    if (!chosen) {
      console.log('❌ No suitable sales table found');
      return;
    }

    console.log(`✅ Using table: ${chosen.tableName}`);
    console.log(`   Amount: ${chosen.amountCol}, Date: ${chosen.dateCol}`);

    // Test the actual query
    const { table: tableRef, amountCol, dateCol } = chosen;
    const dateExpr = dateCol.includes('Key') ? 
      `date(substr(CAST(${dateCol} AS TEXT), 1, 4) || '-' || substr(CAST(${dateCol} AS TEXT), 5, 2) || '-' || substr(CAST(${dateCol} AS TEXT), 7, 2))` : 
      dateCol;

    const byMonth = await all(db, `
      SELECT strftime('%Y-%m', ${dateExpr}) as year_month, 
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount, 
             COUNT(*) as tx_count
      FROM ${tableRef}
      WHERE ${dateCol} IS NOT NULL AND CAST(${amountCol} AS REAL) > 0
      GROUP BY strftime('%Y-%m', ${dateExpr})
      ORDER BY year_month DESC
      LIMIT 6
    `);

    console.log(`✅ Sales query successful: ${byMonth.length} months of data`);
    if (byMonth.length > 0) {
      console.log(`   Latest: ${byMonth[0].year_month} = $${byMonth[0].total_amount.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Sales test error:', error.message);
  } finally {
    db.close();
  }
}

async function testInventoryAgent() {
  console.log('\n=== Testing Inventory Agent (Fixed) ===');
  const dbPath = resolveDbPathUnderOrch('inventory.db');
  if (!dbPath) {
    console.log('❌ inventory.db not found');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    let chosen = null;
    
    for (const tableName of tables.map(r=>r.name)) {
      try {
        const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
        const cols = await all(db, `PRAGMA table_info(${tableRef})`);
        const names = cols.map(c=>c.name);
        
        // Look for quantity columns (including Current_Stock!)
        const quantity = names.find(n => /(Current.*Stock|Qty.*Available|Inventory.*Qty|Stock.*Level|Units.*Stock|Ending.*Balance|Balance|Quantity|Stock|Qty|Level|Count)/i.test(n));
        const item = names.find(n => /(Item.*Key|Item|SKU|Product.*Key|Product)/i.test(n));
        
        if (item && (quantity || names.some(n => /Balance|Level|Count|Qty|Value|Amount/i.test(n)))) {
          const stockCol = quantity || names.find(n => /Balance|Level|Count|Value|Amount/i.test(n));
          let score = 0;
          if (/Inventory|Stock/i.test(tableName)) score += 3;
          if (/Snapshot/i.test(tableName)) score += 2;
          if (quantity) score += 2;
          
          if (stockCol && (!chosen || score > chosen.score)) {
            chosen = { 
              table: tableRef,
              tableName: tableName,
              itemCol: `"${item}"`, 
              stockCol: `"${stockCol}"`,
              score 
            };
          }
        }
      } catch (e) {
        console.log(`Skipping inventory table ${tableName}: ${e.message}`);
        continue;
      }
    }
    
    if (!chosen) {
      console.log('❌ No suitable inventory table found');
      return;
    }

    console.log(`✅ Using table: ${chosen.tableName}`);
    console.log(`   Item: ${chosen.itemCol}, Stock: ${chosen.stockCol}`);

    // Test the actual query
    const { table: tableRef, itemCol, stockCol } = chosen;
    const topStock = await all(db, `
      SELECT ${itemCol} as item_key, 
             SUM(CAST(COALESCE(${stockCol}, 0) AS REAL)) as stock_level,
             COUNT(*) as record_count
      FROM ${tableRef}
      WHERE ${stockCol} IS NOT NULL
      GROUP BY ${itemCol}
      ORDER BY stock_level DESC
      LIMIT 5
    `);

    console.log(`✅ Inventory query successful: ${topStock.length} items found`);
    if (topStock.length > 0) {
      console.log(`   Top item: ${topStock[0].item_key} = ${topStock[0].stock_level} units`);
    }

  } catch (error) {
    console.error('❌ Inventory test error:', error.message);
  } finally {
    db.close();
  }
}

async function testCustomerAgent() {
  console.log('\n=== Testing Customer Agent (Fixed) ===');
  const dbPath = resolveDbPathUnderOrch('customers.db');
  if (!dbPath) {
    console.log('❌ customers.db not found');
    return;
  }
  
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
        
        if (amount && customer) {
          let score = 0;
          if (/Customer|AR/i.test(tableName)) score += 3;
          if (/Transaction|Sales/i.test(tableName)) score += 2;
          
          if (!chosen || score > chosen.score) {
            chosen = { 
              table: tableRef,
              tableName: tableName,
              customerCol: `"${customer}"`, 
              amountCol: `"${amount}"`,
              score 
            };
          }
        }
      } catch (e) {
        console.log(`Skipping customer table ${tableName}: ${e.message}`);
        continue;
      }
    }
    
    if (!chosen) {
      console.log('❌ No suitable customer table found');
      return;
    }

    console.log(`✅ Using table: ${chosen.tableName}`);
    console.log(`   Customer: ${chosen.customerCol}, Amount: ${chosen.amountCol}`);

    // Test the actual query
    const { table: tableRef, customerCol, amountCol } = chosen;
    const topCustomers = await all(db, `
      SELECT ${customerCol} as customer_id, 
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount, 
             COUNT(*) as transaction_count
      FROM ${tableRef}
      WHERE ${amountCol} IS NOT NULL
      GROUP BY ${customerCol}
      ORDER BY total_amount DESC
      LIMIT 5
    `);

    console.log(`✅ Customer query successful: ${topCustomers.length} customers found`);
    if (topCustomers.length > 0) {
      console.log(`   Top customer: ${topCustomers[0].customer_id} = $${topCustomers[0].total_amount.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Customer test error:', error.message);
  } finally {
    db.close();
  }
}

async function testFinanceAgent() {
  console.log('\n=== Testing Finance Agent (Already Fixed) ===');
  const dbPath = resolveDbPathUnderOrch('financial_agent.db');
  if (!dbPath) {
    console.log('❌ financial_agent.db not found');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  try {
    // Test a simple query
    const glCount = await all(db, `SELECT COUNT(*) as count FROM General_Ledger`);
    console.log(`✅ Finance agent working: ${glCount[0].count} GL records`);
  } catch (error) {
    console.error('❌ Finance test error:', error.message);
  } finally {
    db.close();
  }
}

// Run all tests
async function runAllTests() {
  await testSalesAgent();
  await testInventoryAgent();  
  await testCustomerAgent();
  await testFinanceAgent();
  console.log('\n=== All Agent Tests Complete ===');
}

runAllTests();
