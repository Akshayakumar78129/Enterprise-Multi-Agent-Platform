// Debug inventory table column details
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), '../adk/orchestration_agent/database/inventory.db');
console.log('Connecting to:', dbPath);

const db = new sqlite3.Database(dbPath);

function all(db, sql) {
  return new Promise((resolve, reject) => db.all(sql, [], (e, rows) => e ? reject(e) : resolve(rows || [])));
}

async function debugInventory() {
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    console.log('All tables:', tables.map(t=>t.name));
    
    for (const tableName of tables.map(r=>r.name)) {
      console.log(`\n=== Table: ${tableName} ===`);
      
      const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
      const cols = await all(db, `PRAGMA table_info(${tableRef})`);
      console.log('All columns:', cols.map(c => c.name));
      
      // Sample a few rows
      try {
        const sample = await all(db, `SELECT * FROM ${tableRef} LIMIT 3`);
        console.log('Sample data:', sample.length, 'rows');
        if (sample.length > 0) {
          console.log('First row keys:', Object.keys(sample[0]));
          console.log('Sample row:', JSON.stringify(sample[0]));
        }
      } catch (e) {
        console.log('Sample error:', e.message);
      }
    }
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    db.close();
  }
}

debugInventory();
