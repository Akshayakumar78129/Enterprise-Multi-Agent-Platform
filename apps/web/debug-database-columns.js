const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function resolveDbPathUnderOrch(file) {
  const variants = [
    ['multiagent-agency', 'apps', 'adk', 'orchestration_agent', 'database'],
    ['apps', 'adk', 'orchestration_agent', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Sales', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Finance', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Customer', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Inventory', 'database'],
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

async function debugDatabaseColumns() {
  console.log('🔍 DEBUGGING DATABASE COLUMNS FOR ALL AGENTS\n');
  console.log('=' .repeat(80));

  const databases = [
    { file: 'sales_agent.db', agent: 'Sales Agent' },
    { file: 'financial_agent.db', agent: 'Financial Agent' },
    { file: 'customers.db', agent: 'Customer Agent' },
    { file: 'inventory.db', agent: 'Inventory Agent' }
  ];

  for (const dbInfo of databases) {
    console.log(`\n📊 ${dbInfo.agent.toUpperCase()} - ${dbInfo.file}`);
    console.log('-' .repeat(60));
    
    const dbPath = resolveDbPathUnderOrch(dbInfo.file);
    if (!dbPath) {
      console.log(`❌ Database file not found: ${dbInfo.file}`);
      continue;
    }

    const db = new sqlite3.Database(dbPath);
    
    try {
      // Get all tables
      const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
      console.log(`📋 Tables found: ${tables.length}`);
      
      for (const table of tables.slice(0, 5)) { // Limit to first 5 tables
        const tableName = table.name;
        console.log(`\n  🔍 Table: ${tableName}`);
        
        try {
          const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
          const cols = await all(db, `PRAGMA table_info(${tableRef})`);
          
          console.log(`    📝 Columns (${cols.length}):`);
          cols.forEach((col, idx) => {
            if (idx < 10) { // Show first 10 columns
              console.log(`      ${idx + 1}. ${col.name} (${col.type})`);
            }
          });
          if (cols.length > 10) {
            console.log(`      ... and ${cols.length - 10} more columns`);
          }
          
          // Test a sample query
          const sampleData = await all(db, `SELECT * FROM ${tableRef} LIMIT 3`);
          console.log(`    📈 Sample rows: ${sampleData.length}`);
          
        } catch (tableError) {
          console.log(`    ❌ Error accessing table: ${tableError.message}`);
        }
      }
      
      if (tables.length > 5) {
        console.log(`\n  ... and ${tables.length - 5} more tables`);
      }
      
    } catch (error) {
      console.log(`❌ Error accessing database: ${error.message}`);
    } finally {
      db.close();
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('🎯 COLUMN DETECTION STRATEGY RECOMMENDATIONS:');
  console.log('=' .repeat(80));
  console.log('1. Use more flexible column name matching patterns');
  console.log('2. Implement fallback logic for different column naming conventions');
  console.log('3. Add better error handling for missing columns');
  console.log('4. Consider using multiple tables when primary table lacks required columns');
}

debugDatabaseColumns().catch(console.error);
