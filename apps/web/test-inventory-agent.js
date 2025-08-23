const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Helper function to resolve database paths
function resolveDbPathUnderOrch(dbName) {
  const basePaths = [
    path.join(__dirname, '..', 'adk', 'orchestration_agent', 'database', dbName),
    path.join(__dirname, 'Customer', 'database', dbName),
    path.join(__dirname, '..', 'server', 'database', dbName),
    path.join(__dirname, 'database', dbName)
  ];
  
  for (const dbPath of basePaths) {
    if (fs.existsSync(dbPath)) {
      console.log(`✅ Found ${dbName} at: ${dbPath}`);
      return dbPath;
    }
  }
  
  console.log(`❌ ${dbName} not found in any of these paths:`);
  basePaths.forEach(p => console.log(`   - ${p}`));
  return null;
}

// Helper function to promisify database queries
function all(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function testInventoryAgent() {
  console.log('🏭 TESTING INVENTORY AGENT');
  console.log('========================================');
  
  const dbPath = resolveDbPathUnderOrch('inventory.db');
  if (!dbPath) {
    console.log('❌ inventory.db not found');
    return;
  }
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    console.log('📋 Available tables:', tables.map(t => t.name));
    
    // Look for inventory tables with flexible matching
    let workingTable = null;
    let workingCols = [];
    
    const tablePreference = [
      t => /Inventory.*Snapshot/i.test(t.name),
      t => /Inventory/i.test(t.name),
      t => /Stock/i.test(t.name),
      t => /Item/i.test(t.name)
    ];
    
    for (const preferenceCheck of tablePreference) {
      const candidateTable = tables.find(preferenceCheck);
      if (candidateTable) {
        try {
          const tableRef = candidateTable.name.includes(' ') ? `"${candidateTable.name}"` : candidateTable.name;
          const cols = await all(db, `PRAGMA table_info(${tableRef})`);
          if (cols.length > 0) {
            workingTable = { name: candidateTable.name, ref: tableRef };
            workingCols = cols;
            console.log(`✅ Using inventory table: ${candidateTable.name} with ${cols.length} columns`);
            break;
          }
        } catch (e) {
          console.log(`❌ Could not access table ${candidateTable.name}: ${e.message}`);
          continue;
        }
      }
    }
    
    if (!workingTable) {
      console.log('❌ No accessible inventory tables found');
      return;
    }
    
    const names = workingCols.map(c => c.name);
    console.log('📊 Available columns:', names);
    
    // Flexible column detection
    const stockCol = names.find(n => /stock|quantity|units|level/i.test(n));
    const itemCol = names.find(n => /item|product|sku/i.test(n));
    const dateCol = names.find(n => /date|time/i.test(n));
    const warehouseCol = names.find(n => /warehouse|location/i.test(n));
    
    console.log(`🔍 Found columns - Stock: ${stockCol}, Item: ${itemCol}, Date: ${dateCol}, Warehouse: ${warehouseCol}`);
    
    if (!stockCol && !itemCol) {
      console.log('❌ No suitable stock or item columns found');
      return;
    }
    
    // Test query
    if (stockCol && itemCol) {
      const testQuery = `
        SELECT "${itemCol}" as item_key, 
               CAST(COALESCE("${stockCol}", 0) AS REAL) as stock_level
               ${warehouseCol ? `, "${warehouseCol}" as warehouse` : ''}
               ${dateCol ? `, "${dateCol}" as snapshot_date` : ''}
        FROM ${workingTable.ref}
        WHERE "${stockCol}" IS NOT NULL
        ORDER BY CAST("${stockCol}" AS REAL) DESC
        LIMIT 5
      `;
      
      console.log('🔍 Testing query:', testQuery);
      const results = await all(db, testQuery);
      console.log('✅ Query results:', results);
    }
    
    console.log('✅ Inventory agent test completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

testInventoryAgent().catch(console.error);
