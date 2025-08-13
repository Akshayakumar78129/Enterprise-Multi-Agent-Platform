const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function all(db, query, params = {}) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function testAgent(agentName, dbPath, testQueries) {
  console.log(`\n=== Testing ${agentName} ===`);
  console.log(`Database: ${dbPath}`);
  
  try {
    const db = new sqlite3.Database(dbPath);
    
    // Test connection and list tables
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    console.log(`✅ Tables found: ${tables.map(t => t.name).join(', ')}`);
    
    // Test each query
    for (const [name, query] of testQueries) {
      try {
        const result = await all(db, query);
        console.log(`✅ ${name}: ${result.length} rows`);
        if (result.length > 0) {
          console.log(`   Sample: ${JSON.stringify(result[0])}`);
        }
      } catch (err) {
        console.log(`❌ ${name}: ${err.message}`);
      }
    }
    
    db.close();
    console.log(`✅ ${agentName} database connection successful`);
    
  } catch (err) {
    console.log(`❌ ${agentName} failed: ${err.message}`);
  }
}

async function testAllAgents() {
  const orchPath = '/Users/jeethkataria/xyz5/multiagent-agency/apps/adk/orchestration_agent/database';
  
  // Test Sales Agent
  await testAgent('Sales Agent', `${orchPath}/sales_agent.db`, [
    ['Tables Info', `SELECT name FROM sqlite_master WHERE type='table' LIMIT 1`],
    ['Sample Data', `SELECT * FROM (SELECT name FROM sqlite_master WHERE type='table' LIMIT 1) t1, (SELECT 'SELECT * FROM ' || name || ' LIMIT 3' as query FROM sqlite_master WHERE type='table' LIMIT 1) t2`]
  ]);
  
  // Test Finance Agent  
  await testAgent('Finance Agent', `${orchPath}/financial_agent.db`, [
    ['GL Table Check', `SELECT COUNT(*) as count FROM """dbo_F_GL_Transaction""" LIMIT 1`],
    ['GL Columns', `SELECT "Posting Date", "Debit Amount", "Credit Amount" FROM """dbo_F_GL_Transaction""" LIMIT 1`]
  ]);
  
  // Test Inventory Agent
  await testAgent('Inventory Agent', `${orchPath}/inventory.db`, [
    ['Tables', `SELECT name FROM sqlite_master WHERE type='table'`]
  ]);
  
  // Test Customer Agent
  await testAgent('Customer Agent', `${orchPath}/customers.db`, [
    ['Tables', `SELECT name FROM sqlite_master WHERE type='table'`]
  ]);
}

testAllAgents().catch(console.error);
