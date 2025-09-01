const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Try to find the DB using same paths as queries.js
const possiblePaths = [
  path.resolve(process.cwd(), 'Inventory/database/inventory.db'),
  path.resolve(__dirname, '../database/inventory.db'),
  path.resolve(__dirname, '../../database/inventory.db'),
  path.resolve(__dirname, '../../../database/inventory.db'),
  path.resolve(process.cwd(), '../database/inventory.db')
];
const dbPath = possiblePaths.find(p => fs.existsSync(p));
if (!dbPath) {
  console.error('Database file not found in expected locations:', possiblePaths);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

(async () => {
  try {
    // 1) get latest snapshot date
    const row = await run("SELECT MAX(Snapshot_Date) AS max_date FROM dbo_F_Inventory_Snapshot");
    const endDate = row[0].max_date;
    if (!endDate) {
      console.error('No snapshot date found');
      process.exit(1);
    }
    const end = new Date(endDate);
    // start_date = end - 90 days
    const start = new Date(end);
    start.setDate(end.getDate() - 90);
    const startDate = start.toISOString().slice(0,10);
    const endDateStr = end.toISOString().slice(0,10);

    console.log('Using snapshot end date:', endDateStr, 'start date (90 days):', startDate);

    // 2) fetch inventory snapshot rows for the latest snapshot
    const inventoryQuery = `
      SELECT i.Item_Key, i.Item_Number, i.Item_Name, i.Item_Category, i.Unit_Cost,
             w.Warehouse_Key, w.Warehouse_ID, w.Warehouse_Name,
             ist.Current_Stock, ist.Snapshot_Date
      FROM dbo_D_Item i
      JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
      JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
      WHERE ist.Snapshot_Date = ?
    `;
    const inventory = await run(inventoryQuery, [endDateStr]);

    // 3) fetch sales aggregated by item_key and warehouse_key between start and end
    const salesQuery = `
      SELECT s.Item_Key, s.Warehouse_Key, SUM(s.Quantity) AS Quantity
      FROM dbo_F_Sales_Transaction s
      WHERE s.Transaction_Date BETWEEN ? AND ?
      GROUP BY s.Item_Key, s.Warehouse_Key
    `;
    const sales = await run(salesQuery, [startDate, endDateStr]);

    // Build a map for sales
    const salesMap = new Map();
    sales.forEach(r => {
      const key = `${r.Item_Key}::${r.Warehouse_Key}`;
      salesMap.set(key, r.Quantity || 0);
    });

    // Merge and compute metrics
    const merged = inventory.map(row => {
      const key = `${row.Item_Key}::${row.Warehouse_Key}`;
      const annualSales = salesMap.get(key) || 0;
      const currentStock = row.Current_Stock || 0;
      const unitCost = row.Unit_Cost || 0;
      const inventoryValue = currentStock * unitCost;
      const turnoverRatio = currentStock === 0 ? 0 : (annualSales / currentStock);
      const daysOfSupply = annualSales === 0 ? Infinity : (currentStock / annualSales) * 365;
      return {
        ...row,
        Annual_Sales: annualSales,
        Turnover_Ratio: turnoverRatio,
        Days_of_Supply: daysOfSupply,
        Inventory_Value: inventoryValue
      };
    });

    const totalItems = merged.length;
    const slowMovingRows = merged.filter(r => r.Turnover_Ratio < 1.0);
    const agedRows = merged.filter(r => r.Days_of_Supply > 180);
    const slowMovingValue = slowMovingRows.reduce((s, r) => s + (r.Inventory_Value || 0), 0);
    const agedValue = agedRows.reduce((s, r) => s + (r.Inventory_Value || 0), 0);
    const totalInventoryValue = merged.reduce((s, r) => s + (r.Inventory_Value || 0), 0);

    const result = {
      totalItems,
      slowMovingItems: slowMovingRows.length,
      agedItems: agedRows.length,
      totalInventoryValue,
      slowMovingValue,
      agedValue
    };

    console.log('Exact KPI result:', JSON.stringify(result, null, 2));

    db.close();
  } catch (err) {
    console.error('Error computing exact KPIs:', err);
    db.close();
    process.exit(1);
  }
})();
