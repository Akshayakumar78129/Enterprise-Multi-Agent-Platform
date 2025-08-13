const sqlite3 = require('sqlite3').verbose();

async function all(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function testSalesAgent() {
  console.log('\n=== Testing Sales Agent Query Logic ===');
  const dbPath = '/Users/jeethkataria/xyz5/multiagent-agency/apps/adk/orchestration_agent/database/sales_agent.db';
  const db = new sqlite3.Database(dbPath);
  
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    console.log(`Tables: ${tables.map(t => t.name).slice(0, 5).join(', ')}...`);
    
    // Test each table for sales data
    for (const table of tables.map(t => t.name).filter(t => t.includes('Sales'))) {
      try {
        const cols = await all(db, `PRAGMA table_info("${table}")`);
        const names = cols.map(c => c.name);
        
        const amount = names.find(n => /(Net.*Sales.*Amount|Sales.*Amount|Amount)/i.test(n));
        const date = names.find(n => /(Txn.*Date|Posting.*Date|Order.*Date|Date)/i.test(n));
        
        console.log(`\nTable: ${table}`);
        console.log(`  Amount column: ${amount || 'NOT FOUND'}`);
        console.log(`  Date column: ${date || 'NOT FOUND'}`);
        
        if (amount && date) {
          const sample = await all(db, `SELECT "${date}", "${amount}" FROM "${table}" LIMIT 3`);
          console.log(`  ✅ Sample data: ${sample.length} rows`);
          if (sample.length > 0) {
            console.log(`     ${JSON.stringify(sample[0])}`);
          }
        }
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
      }
    }
  } finally {
    db.close();
  }
}

async function testInventoryAgent() {
  console.log('\n=== Testing Inventory Agent Query Logic ===');
  const dbPath = '/Users/jeethkataria/xyz5/multiagent-agency/apps/adk/orchestration_agent/database/inventory.db';
  const db = new sqlite3.Database(dbPath);
  
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    
    for (const table of tables.map(t => t.name).filter(t => /inventory|snapshot/i.test(t))) {
      try {
        const cols = await all(db, `PRAGMA table_info("${table}")`);
        const names = cols.map(c => c.name);
        
        const qtyCol = names.find(c => /qty|quantity|on.*hand/i.test(c));
        const skuCol = names.find(c => /item|sku|product/i.test(c));
        
        console.log(`\nTable: ${table}`);
        console.log(`  Quantity column: ${qtyCol || 'NOT FOUND'}`);
        console.log(`  SKU column: ${skuCol || 'NOT FOUND'}`);
        
        if (qtyCol && skuCol) {
          const sample = await all(db, `SELECT "${skuCol}", "${qtyCol}" FROM "${table}" LIMIT 3`);
          console.log(`  ✅ Sample data: ${sample.length} rows`);
          if (sample.length > 0) {
            console.log(`     ${JSON.stringify(sample[0])}`);
          }
        }
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
      }
    }
  } finally {
    db.close();
  }
}

async function testCustomerAgent() {
  console.log('\n=== Testing Customer Agent Query Logic ===');
  const dbPath = '/Users/jeethkataria/xyz5/multiagent-agency/apps/adk/orchestration_agent/database/customers.db';
  const db = new sqlite3.Database(dbPath);
  
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    
    for (const table of tables.map(t => t.name)) {
      try {
        const cols = await all(db, `PRAGMA table_info("${table}")`);
        const names = cols.map(c => c.name);
        
        const amount = names.find(n => /(Sales.*Amount|Net.*Sales.*Amount|Amount)/i.test(n));
        const date = names.find(n => /(Txn.*Date|Posting.*Date|Order.*Date|Date)/i.test(n));
        const cust = names.find(n => /(Customer.*Key|Customer.*ID|Customer)/i.test(n));
        
        console.log(`\nTable: ${table}`);
        console.log(`  Amount: ${amount || 'NOT FOUND'}`);
        console.log(`  Date: ${date || 'NOT FOUND'}`);
        console.log(`  Customer: ${cust || 'NOT FOUND'}`);
        
        if (amount && date && cust) {
          const sample = await all(db, `SELECT "${date}", "${amount}", "${cust}" FROM "${table}" LIMIT 3`);
          console.log(`  ✅ Sample data: ${sample.length} rows`);
          if (sample.length > 0) {
            console.log(`     ${JSON.stringify(sample[0])}`);
          }
        }
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
      }
    }
  } finally {
    db.close();
  }
}

async function runTests() {
  await testSalesAgent();
  await testInventoryAgent(); 
  await testCustomerAgent();
  console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
