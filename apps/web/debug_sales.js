// Debug sales database SQL construction
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), '../adk/orchestration_agent/database/sales_agent.db');
console.log('Connecting to:', dbPath);

const db = new sqlite3.Database(dbPath);

function all(db, sql) {
  return new Promise((resolve, reject) => db.all(sql, [], (e, rows) => e ? reject(e) : resolve(rows || [])));
}

async function debugSales() {
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    console.log('Tables with potential issues:');
    
    for (const tableName of tables.map(r=>r.name)) {
      if (tableName.includes('Sales')) {
        console.log(`\n=== Testing table: ${tableName} ===`);
        
        // Try different quoting approaches
        const variations = [
          tableName,                    // No quotes
          `"${tableName}"`,            // Double quotes
          `[${tableName}]`,            // Square brackets  
          `\`${tableName}\``           // Backticks
        ];
        
        for (const tableRef of variations) {
          try {
            const result = await all(db, `SELECT * FROM ${tableRef} LIMIT 1`);
            console.log(`✅ ${tableRef} works: ${result.length} rows`);
            break;
          } catch (e) {
            console.log(`❌ ${tableRef} fails: ${e.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    db.close();
  }
}

debugSales();
