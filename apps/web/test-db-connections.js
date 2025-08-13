const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database connection test script
function resolveDbPathUnderOrch(file) {
  // Define all possible database locations in order of preference
  const variants = [
    // ADK orchestration paths
    ['multiagent-agency', 'apps', 'adk', 'orchestration_agent', 'database'],
    ['apps', 'adk', 'orchestration_agent', 'database'],
    // Direct module paths
    ['multiagent-agency', 'apps', 'web', 'Sales', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Finance', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Customer', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Inventory', 'database'],
    // Fallback to relative paths
    ['..', 'adk', 'orchestration_agent', 'database'],
    ['Sales', 'database'],
    ['Finance', 'database'],
    ['Customer', 'database'],
    ['Inventory', 'database'],
  ];
  
  // Get the project root directory
  const rootDir = '/Users/jeethkataria/xyz5';
  
  // Try each variant
  for (const parts of variants) {
    const p = path.join(rootDir, ...parts, file);
    console.log(`Trying database path: ${p}`);
    
    try {
      // First check if file exists
      if (fs.existsSync(p)) {
        console.log(`✅ Found database at: ${p}`);
        return p;
      }
    } catch (err) {
      console.log(`❌ Error checking path ${p}: ${err.message}`);
    }
  }
  
  console.log(`❌ Could not find database: ${file}`);
  return null;
}

async function testDatabaseConnection(dbFile, agentName) {
  console.log(`\n🔍 Testing ${agentName} connection to ${dbFile}...`);
  
  const dbPath = resolveDbPathUnderOrch(dbFile);
  if (!dbPath) {
    console.log(`❌ ${agentName}: Database file ${dbFile} not found`);
    return false;
  }

  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.log(`❌ ${agentName}: Failed to connect to ${dbFile} - ${err.message}`);
        resolve(false);
        return;
      }

      console.log(`✅ ${agentName}: Successfully connected to ${dbFile}`);
      
      // Test basic query to get table info
      db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
        if (err) {
          console.log(`❌ ${agentName}: Failed to query tables - ${err.message}`);
          db.close();
          resolve(false);
          return;
        }

        console.log(`📊 ${agentName}: Found ${tables.length} tables:`);
        tables.slice(0, 5).forEach(table => {
          console.log(`   - ${table.name}`);
        });
        if (tables.length > 5) {
          console.log(`   ... and ${tables.length - 5} more tables`);
        }

        // Test a sample query on the first table
        if (tables.length > 0) {
          const firstTable = tables[0].name;
          const tableRef = firstTable.includes(' ') ? `"${firstTable}"` : firstTable;
          
          db.all(`SELECT COUNT(*) as count FROM ${tableRef}`, (err, result) => {
            if (err) {
              console.log(`⚠️  ${agentName}: Could not count rows in ${firstTable} - ${err.message}`);
            } else {
              console.log(`📈 ${agentName}: Sample table ${firstTable} has ${result[0].count} rows`);
            }
            
            db.close();
            resolve(true);
          });
        } else {
          console.log(`⚠️  ${agentName}: No tables found in database`);
          db.close();
          resolve(true);
        }
      });
    });
  });
}

async function testAllConnections() {
  console.log('🚀 Testing Database Connections for All Agents\n');
  console.log('=' .repeat(60));

  const tests = [
    { dbFile: 'customers.db', agentName: 'Customer Agent' },
    { dbFile: 'financial_agent.db', agentName: 'Financial Agent' },
    { dbFile: 'sales_agent.db', agentName: 'Sales Agent' },
    { dbFile: 'inventory.db', agentName: 'Inventory Agent' }
  ];

  const results = [];
  
  for (const test of tests) {
    const success = await testDatabaseConnection(test.dbFile, test.agentName);
    results.push({ ...test, success });
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY OF DATABASE CONNECTIONS:');
  console.log('=' .repeat(60));

  results.forEach(result => {
    const status = result.success ? '✅ CONNECTED' : '❌ FAILED';
    console.log(`${result.agentName.padEnd(20)} | ${result.dbFile.padEnd(20)} | ${status}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Result: ${successCount}/${results.length} agents successfully connected to their databases`);
  
  if (successCount === results.length) {
    console.log('🎉 All database connections are working correctly!');
  } else {
    console.log('⚠️  Some database connections need attention.');
  }
}

// Run the test
testAllConnections().catch(console.error);
