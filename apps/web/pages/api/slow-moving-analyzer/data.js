// import { db } from '../../../lib/db/connector';
// import { sql } from 'drizzle-orm';

const { Pool } = require('pg');

class SlowMovingStockQueries {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_DATABASE_URL,
    });
    // flag to avoid repeating connection attempts after an immediate failure
    this.dbAvailable = true;
  }

  async executeQuery(query, params = []) {
    try {
      if (!this.dbAvailable || !this.pool) return [];
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      // Log full error once; if it's a connection refusal mark DB as unavailable
      console.error("Query execution error:", error);
      const code = error && error.code;
      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'EHOSTUNREACH') {
        // mark DB as unavailable to avoid repeated failing attempts
        try { this.dbAvailable = false; } catch (e) {}
        // return empty array so caller can fall back or render gracefully
        return [];
      }
      // For other errors, rethrow so they can be handled upstream
      throw error;
    }
  }

  async getSlowMovingItems(filters = {}) {
    try {
      const { 
        daysThreshold = 90, // Items not sold in last X days
        category = null,
        warehouseId = null
      } = filters;

      let whereClause = "WHERE 1=1";
      const params = [daysThreshold];
      let paramIndex = 2;

      if (category) {
        whereClause += ` AND i."Item Category Desc" = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (warehouseId) {
        whereClause += ` AND w.warehouse_id = $${paramIndex}`;
        params.push(warehouseId);
        paramIndex++;
      }

      const query = `
        WITH sales_activity AS (
          SELECT 
            s."Item Key",
            s."Warehouse Key",
            MAX(s."Txn Date") as last_sale_date,
            SUM(s."Net Sales Quantity") as total_sales_qty,
            COUNT(*) as transaction_count
          FROM dbo_f_sales_transaction s
          GROUP BY s."Item Key", s."Warehouse Key"
        )
        SELECT 
          i."Item Key" as item_key,
          i."Item Number" as item_number,
          i."Item Desc" as item_name,
          COALESCE(i."Item Category Desc", 'Unknown') as item_category,
          COALESCE(i."Unit Cost", 0) as unit_cost,
          w.warehouse_key,
          w.warehouse_id,
          w.warehouse_name,
          ist.current_stock,
          ist.average_stock_level,
          ist.snapshot_date,
          sa.last_sale_date,
          COALESCE(sa.total_sales_qty, 0) as total_sales_qty,
          COALESCE(sa.transaction_count, 0) as transaction_count,
          CASE 
            WHEN sa.last_sale_date IS NULL THEN 999
            ELSE DATE_PART('day', CURRENT_DATE - sa.last_sale_date::date)
          END as days_since_last_sale,
          (ist.current_stock * COALESCE(i."Unit Cost", 0)) as inventory_value,
          CASE 
            WHEN sa.total_sales_qty > 0 THEN 
              ist.current_stock / (sa.total_sales_qty / GREATEST(1, DATE_PART('day', CURRENT_DATE - '2019-01-01'::date)))
            ELSE 999
          END as days_of_supply
        FROM dbo_f_inventory_snapshot ist
        JOIN dbo_d_item i ON i."Item Key" = ist.item_key
        JOIN dbo_d_warehouse w ON w.warehouse_key = ist.warehouse_key
        LEFT JOIN sales_activity sa ON sa."Item Key" = i."Item Key"
        ${whereClause}
        AND (sa.last_sale_date IS NULL OR DATE_PART('day', CURRENT_DATE - sa.last_sale_date::date) >= $1)
        ORDER BY days_since_last_sale DESC, inventory_value DESC
        LIMIT 100
      `;

      const rows = await this.executeQuery(query, params);
      
      return rows.map(row => ({
        Item_Key: parseInt(row.item_key) || 0,
        Item_Number: row.item_number,
        Item_Name: row.item_name,
        Item_Category: row.item_category,
        Unit_Cost: parseFloat(row.unit_cost) || 0,
        Warehouse_Key: parseInt(row.warehouse_key) || 0,
        Warehouse_ID: row.warehouse_id,
        Warehouse_Name: row.warehouse_name,
        Current_Stock: parseFloat(row.current_stock) || 0,
        Average_Stock_Level: parseFloat(row.average_stock_level) || 0,
        Last_Sale_Date: row.last_sale_date,
        Days_Since_Last_Sale: parseInt(row.days_since_last_sale) || 0,
        Total_Sales_Qty: parseFloat(row.total_sales_qty) || 0,
        Transaction_Count: parseInt(row.transaction_count) || 0,
        Inventory_Value: parseFloat(row.inventory_value) || 0,
        Days_Of_Supply: parseFloat(row.days_of_supply) || 999,
        Risk_Level: row.days_since_last_sale >= 180 ? 'Critical' : 
                   row.days_since_last_sale >= 90 ? 'High' : 'Medium'
      }));
    } catch (error) {
      console.error("Error fetching slow moving items:", error);
      return [];
    }
  }

  async getKPIData(filters = {}) {
    const slowMovingItems = await this.getSlowMovingItems(filters);
    
    if (slowMovingItems.length === 0) {
      return {
        totalSlowMovingItems: 0,
        totalInventoryValue: 0,
        avgDaysSinceLastSale: 0,
        criticalItems: 0,
        potentialWriteOff: 0
      };
    }

    const totalInventoryValue = slowMovingItems.reduce((sum, item) => sum + item.Inventory_Value, 0);
    const avgDaysSinceLastSale = slowMovingItems.reduce((sum, item) => sum + item.Days_Since_Last_Sale, 0) / slowMovingItems.length;
    const criticalItems = slowMovingItems.filter(item => item.Risk_Level === 'Critical').length;
    const potentialWriteOff = slowMovingItems
      .filter(item => item.Days_Since_Last_Sale >= 365)
      .reduce((sum, item) => sum + item.Inventory_Value, 0);

    return {
      totalSlowMovingItems: slowMovingItems.length,
      totalInventoryValue,
      avgDaysSinceLastSale: Math.round(avgDaysSinceLastSale),
      criticalItems,
      potentialWriteOff,
      percentageOfTotalInventory: 25 // Mock percentage
    };
  }

  async getAgingAnalysis(filters = {}) {
    const slowMovingItems = await this.getSlowMovingItems(filters);
    const agingBuckets = {
      '0-30 days': { count: 0, value: 0 },
      '31-60 days': { count: 0, value: 0 },
      '61-90 days': { count: 0, value: 0 },
      '91-180 days': { count: 0, value: 0 },
      '181-365 days': { count: 0, value: 0 },
      'Over 365 days': { count: 0, value: 0 }
    };

    slowMovingItems.forEach(item => {
      // Prefer Days_Of_Supply for aging buckets. If Days_Of_Supply is missing or not finite,
      // estimate days from turnover (365/turnover). Do NOT substitute Days_Since_Last_Sale
      // as a fallback — that was inflating the >180d bucket incorrectly.
      const rawDaysOfSupply = (item.Days_Of_Supply !== undefined && item.Days_Of_Supply !== null) ? item.Days_Of_Supply : (item.Days_of_Supply !== undefined && item.Days_of_Supply !== null ? item.Days_of_Supply : null);
      let days;
      if (rawDaysOfSupply !== null && isFinite(Number(rawDaysOfSupply))) {
        days = Number(rawDaysOfSupply);
      } else {
        const turnover = (typeof item.Estimated_Turnover_Ratio === 'number') ? item.Estimated_Turnover_Ratio : (item.Turnover_Ratio || 0);
        days = turnover > 0 ? Math.round(365 / turnover) : 9999;
      }
      let bucket;
      if (days <= 30) bucket = '0-30 days';
      else if (days <= 60) bucket = '31-60 days';
      else if (days <= 90) bucket = '61-90 days';
      else if (days <= 180) bucket = '91-180 days';
      else if (days <= 365) bucket = '181-365 days';
      else bucket = 'Over 365 days';
      agingBuckets[bucket].count++;
      agingBuckets[bucket].value += Number(item.Inventory_Value || 0);
    });

    return Object.entries(agingBuckets).map(([period, data]) => ({
      period,
      itemCount: data.count,
      inventoryValue: data.value,
      percentage: slowMovingItems.length > 0 ? (data.count / slowMovingItems.length) * 100 : 0
    }));
  }

  // Minimal recommendations provider to satisfy the API handler's call.
  // Returns an empty array for now; can be enriched later with business rules.
  async getRecommendations(filters = {}) {
    try {
      // Placeholder: no-op recommendations. Keep shape stable for clients.
      return [];
    } catch (error) {
      console.error('Error computing recommendations:', error && error.message);
      return [];
    }
  }

  async getFilterOptions() {
    try {
      const categoryQuery = `
        SELECT DISTINCT 
          COALESCE("Item Category Desc", 'Unknown') as category
        FROM dbo_d_item
        WHERE "Item Category Desc" IS NOT NULL
        ORDER BY category
      `;

      const warehouseQuery = `
        SELECT DISTINCT 
          warehouse_id,
          warehouse_name
        FROM dbo_d_warehouse
        ORDER BY warehouse_name
      `;

      const [categories, warehouses] = await Promise.all([
        this.executeQuery(categoryQuery),
        this.executeQuery(warehouseQuery)
      ]);

      return {
        categories: categories.map(c => c.category),
        warehouses: warehouses.map(w => ({
          id: w.warehouse_id,
          name: w.warehouse_name
        })),
        daysThresholds: [
          { label: '30 Days', value: 30 },
          { label: '60 Days', value: 60 },
          { label: '90 Days', value: 90 },
          { label: '180 Days', value: 180 },
          { label: '365 Days', value: 365 }
        ]
      };
    } catch (error) {
      console.error("Error getting filter options:", error);
      return {
        categories: [],
        warehouses: [],
        daysThresholds: []
      };
    }
  }

  async close() {
    try {
      if (this.pool && typeof this.pool.end === 'function') await this.pool.end();
    } catch (e) {
      console.warn('Pool close failed', e && e.message);
    }
  }
}

export default async function handler(req, res) {
  try {
    const { daysThreshold = 90, category, warehouseId } = req.body || req.query;

    const queries = new SlowMovingStockQueries();
    const filters = { daysThreshold: parseInt(daysThreshold) };
    if (category) filters.category = category;
    if (warehouseId) filters.warehouseId = warehouseId;

    // Try to fetch core data from the query helpers
    const [slowMovingItems, kpiData, agingAnalysisArray, recommendations, filterOptions] = await Promise.all([
      queries.getSlowMovingItems(filters),
      queries.getKPIData(filters),
      queries.getAgingAnalysis(filters),
      queries.getRecommendations(filters),
      queries.getFilterOptions()
    ]);

    // Normalize merged rows (try SQLite snapshot fallback when Postgres returns no rows)
    let normalizedMerged = [];
    let sqliteKPIs = null;
  let sqliteAgingAnalysis = null;

    const computeKPIsAvailable = (typeof module !== 'undefined' && module.exports && typeof module.exports.computeKPIs === 'function');
    console.log('slow-moving-analyzer: computeKPIsAvailable ->', computeKPIsAvailable);
    if ((!slowMovingItems || slowMovingItems.length === 0)) {
      // Try an inline SQLite snapshot fallback (mirrors run_kpis_exact.js) so the API can serve merged rows
      try {
        const sqlite3 = require('sqlite3').verbose();
        const path = require('path');
        const fs = require('fs');

        const possiblePaths = [
          path.resolve(process.cwd(), 'Inventory/database/inventory.db'),
          path.resolve(__dirname, '../../../../apps/web/Inventory/database/inventory.db'),
          path.resolve(__dirname, '../../../Inventory/database/inventory.db'),
          path.resolve(__dirname, '../../Inventory/database/inventory.db')
        ];
        const dbPath = possiblePaths.find(p => fs.existsSync(p));
        if (dbPath) {
          const db = new sqlite3.Database(dbPath);
          const run = (query, params = []) => new Promise((resolve, reject) => db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows)));

          const maxRow = await run('SELECT MAX(Snapshot_Date) AS max_date FROM dbo_F_Inventory_Snapshot');
          const snapshotEnd = maxRow[0]?.max_date;
          if (snapshotEnd) {
            const end = snapshotEnd;
            const start = new Date(new Date(end).setDate(new Date(end).getDate()-90)).toISOString().slice(0,10);
            const endStr = new Date(end).toISOString().slice(0,10);

            // Build inventory query and params; optionally filter by category when provided.
            let invQuery = `
              SELECT i.Item_Key, i.Item_Number, i.Item_Name, i.Item_Category, i.Unit_Cost,
                     w.Warehouse_Key, w.Warehouse_ID, w.Warehouse_Name, w.Storage_Cost_Per_Unit,
                     ist.Current_Stock, ist.Snapshot_Date
              FROM dbo_D_Item i
              JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
              JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
              WHERE ist.Snapshot_Date = ?
            `;
            const invParams = [endStr];
            if (filters && filters.category) {
              // use COALESCE in case column is null in the snapshot
              invQuery += ` AND COALESCE(i.Item_Category, '') = ?`;
              invParams.push(filters.category);
            }
            const inventory = await run(invQuery, invParams);

            const salesQuery = `
              SELECT s.Item_Key, s.Warehouse_Key, SUM(s.Quantity) AS Quantity
              FROM dbo_F_Sales_Transaction s
              WHERE s.Transaction_Date BETWEEN ? AND ?
              GROUP BY s.Item_Key, s.Warehouse_Key
            `;
            const sales = await run(salesQuery, [start, endStr]);

            const salesMap = new Map();
            sales.forEach(r => salesMap.set(`${r.Item_Key}::${r.Warehouse_Key}`, r.Quantity || 0));

            const merged = inventory.map(row => {
        const key = `${row.Item_Key}::${row.Warehouse_Key}`;
        const annualSales = salesMap.get(key) || 0;
        const currentStock = row.Current_Stock || 0;
        const unitCost = row.Unit_Cost || 0;
        const inventoryValue = currentStock * unitCost;
        const turnoverRatio = currentStock === 0 ? 0 : (annualSales / currentStock);
        const daysOfSupply = annualSales === 0 ? Infinity : (currentStock / annualSales) * 365;
        // compute per-row carrying cost when storage cost per unit is available
        const carryingCost = (row.Storage_Cost_Per_Unit || 0) * currentStock;
        return { ...row, Annual_Sales: annualSales, Turnover_Ratio: turnoverRatio, Days_of_Supply: daysOfSupply, Inventory_Value: inventoryValue, Carrying_Cost: carryingCost };
      });

            // Compute a sqlite-only aging analysis that annualizes the observed sales window
            try {
              const windowStart = new Date(start);
              const windowEnd = new Date(endStr);
              const windowMs = Math.max(1, windowEnd - windowStart);
              const windowDays = Math.max(1, Math.round(windowMs / (1000 * 60 * 60 * 24)));
              const annualizeFactor = 365 / windowDays;

              const agingBucketsLocal = {
                '0-30 days': { count: 0, value: 0 },
                '31-60 days': { count: 0, value: 0 },
                '61-90 days': { count: 0, value: 0 },
                '91-180 days': { count: 0, value: 0 },
                '180+ days': { count: 0, value: 0 }
              };
              let agingCount = 0;
              let agingValue = 0;

              merged.forEach(r => {
                const key = `${r.Item_Key}::${r.Warehouse_Key}`;
                const rawWindowSales = salesMap.get(key) || 0;
                const annualSales = rawWindowSales * annualizeFactor;
                const currentStock = Number(r.Current_Stock || 0);
                const daysOfSupplyAnnual = (annualSales === 0 ? 9999 : (currentStock / annualSales) * 365);
                const invValue = Number(r.Inventory_Value || 0) || (currentStock * (r.Unit_Cost || 0));

                agingCount += 1;
                agingValue += invValue;

                if (daysOfSupplyAnnual <= 30) {
                  agingBucketsLocal['0-30 days'].count++;
                  agingBucketsLocal['0-30 days'].value += invValue;
                } else if (daysOfSupplyAnnual <= 60) {
                  agingBucketsLocal['31-60 days'].count++;
                  agingBucketsLocal['31-60 days'].value += invValue;
                } else if (daysOfSupplyAnnual <= 90) {
                  agingBucketsLocal['61-90 days'].count++;
                  agingBucketsLocal['61-90 days'].value += invValue;
                } else if (daysOfSupplyAnnual <= 180) {
                  agingBucketsLocal['91-180 days'].count++;
                  agingBucketsLocal['91-180 days'].value += invValue;
                } else {
                  agingBucketsLocal['180+ days'].count++;
                  agingBucketsLocal['180+ days'].value += invValue;
                }
              });

              sqliteAgingAnalysis = { agingBuckets: agingBucketsLocal, totalItems: agingCount, totalValue: agingValue };
            } catch (e) {
              // swallow — non-critical
              sqliteAgingAnalysis = null;
            }

        if (merged && merged.length > 0) {
        normalizedMerged = merged.map(r => {
                const turnover = (typeof r.Turnover_Ratio === 'number') ? r.Turnover_Ratio : (r.Turnover_Ratio ? Number(r.Turnover_Ratio) : 0);
                const daysOfSupply = (r.Days_of_Supply === Infinity || r.Days_of_Supply === 'Infinity') ? 9999 : (Number(r.Days_of_Supply) || 9999);
                const daysSinceLast = null; // snapshot doesn't include last sale date here
                const isCritical = turnover < 2.0 || daysOfSupply >= 365;
                const isAged = daysOfSupply >= 180;
                const isSlow = turnover < 4.0;
                const isGood = !isCritical && !isAged && !isSlow;

                let status = 'Good';
                if (isCritical) status = 'Critical';
                else if (isAged) status = 'Aged';
                else if (isSlow) status = 'Slow';

                return {
                  ...r,
                  Item_Number: r.Item_Number || r.Item_Number,
                  Item_Name: r.Item_Name || r.Item_Name,
                  Item_Category: r.Item_Category || r.Item_Category || 'Unknown',
                  Unit_Cost: Number(r.Unit_Cost) || 0,
                  Warehouse_ID: r.Warehouse_ID || r.warehouse_id || r.Warehouse_Key || r.Warehouse_Key,
                  Warehouse_Name: r.Warehouse_Name || r.warehouse_name || r.WarehouseName || 'Unknown Warehouse',
                  Current_Stock: Number(r.Current_Stock) || 0,
          Current_Inventory_Value: Number(r.Inventory_Value) || 0,
          Carrying_Cost: Number(r.Carrying_Cost || ((r.Storage_Cost_Per_Unit || 0) * (r.Current_Stock || 0))) || 0,
                  Estimated_Turnover_Ratio: turnover,
                  Days_Since_Last_Movement: daysSinceLast,
                  Days_Of_Supply: daysOfSupply,
                  status,
                  isCritical,
                  isAged,
                  isSlow,
                  isGood
                };
              });

              // compute kpis/summary like computeKPIs would
              const slowRows = merged.filter(r => r.Turnover_Ratio < 1.0);
              const agedRows = merged.filter(r => r.Days_of_Supply > 180);
              const totalInventoryValue = merged.reduce((s,r) => s + (r.Inventory_Value || 0), 0);
              const slowMovingValue = slowRows.reduce((s,r) => s + (r.Inventory_Value || 0), 0);
              const agedValue = agedRows.reduce((s,r) => s + (r.Inventory_Value || 0), 0);

              sqliteKPIs = {
                kpis: {
                  totalSlowMovingItems: slowRows.length,
                  slowMovingValue,
                  averageTurnoverRatio: merged.length > 0 ? (merged.reduce((s,r)=>s+(r.Annual_Sales||0),0) / merged.reduce((s,r)=>s+(r.Current_Stock||0),0) || 0) : 0,
                  agedInventoryPercent: totalInventoryValue > 0 ? (agedValue / totalInventoryValue) * 100 : 0,
                  totalInventoryValue,
                  slowMovingPercent: totalInventoryValue > 0 ? (slowMovingValue / totalInventoryValue) * 100 : 0,
                  carryingCostImpact: slowRows.reduce((s,r) => s + ((r.Carrying_Cost || 0)), 0)
                },
                summary: {
                  totalItems: merged.length,
                  slowMovingItems: slowRows.length,
                  agedItems: agedRows.length,
                  totalInventoryValue,
                  slowMovingValue,
                  agedValue
                },
                merged
              };
            }

          }
          db.close();
        }
      } catch (e) {
        console.warn('slow-moving-analyzer: inline sqlite fallback failed:', e && e.message);
      }
    }

    // Decide source rows for server-side aging aggregation (prefer Postgres rows, fallback to normalized sqlite merged)
    const sourceRows = (slowMovingItems && slowMovingItems.length > 0) ? slowMovingItems : (normalizedMerged && normalizedMerged.length > 0 ? normalizedMerged : []);

    // Server-side aging aggregation (prefer Days_Of_Supply, estimate from turnover otherwise)
    const agingBuckets = {
      '0-30 days': { count: 0, value: 0 },
      '31-60 days': { count: 0, value: 0 },
      '61-90 days': { count: 0, value: 0 },
      '91-180 days': { count: 0, value: 0 },
      '180+ days': { count: 0, value: 0 }
    };
    let agingTotalItems = 0;
    let agingTotalValue = 0;

    const estimateTurnover = (item) => {
      const ds = item.Days_Of_Supply || item.Days_of_Supply;
      if (!ds || !isFinite(ds) || ds === 0) return 0;
      return 365 / Number(ds);
    };

    sourceRows.forEach(item => {
      const rawDaysOfSupply = (item.Days_Of_Supply !== undefined && item.Days_Of_Supply !== null) ? item.Days_Of_Supply : (item.Days_of_Supply !== undefined && item.Days_of_Supply !== null ? item.Days_of_Supply : null);
      const daysOfSupply = (rawDaysOfSupply !== null && isFinite(Number(rawDaysOfSupply))) ? Number(rawDaysOfSupply) : null;

      let days = null;
      if (daysOfSupply !== null) days = daysOfSupply;
      else {
        const turnover = (typeof item.Estimated_Turnover_Ratio === 'number') ? item.Estimated_Turnover_Ratio : (item.Turnover_Ratio || estimateTurnover(item) || 0);
        days = turnover > 0 ? Math.round(365 / turnover) : 9999;
      }

      const invValue = typeof item.Inventory_Value === 'number' ? item.Inventory_Value : parseFloat(item.Inventory_Value || item.Current_Inventory_Value || item.inventory_value || 0) || 0;

      agingTotalItems += 1;
      agingTotalValue += invValue;

      if (days <= 30) {
        agingBuckets['0-30 days'].count++;
        agingBuckets['0-30 days'].value += invValue;
      } else if (days <= 60) {
        agingBuckets['31-60 days'].count++;
        agingBuckets['31-60 days'].value += invValue;
      } else if (days <= 90) {
        agingBuckets['61-90 days'].count++;
        agingBuckets['61-90 days'].value += invValue;
      } else if (days <= 180) {
        agingBuckets['91-180 days'].count++;
        agingBuckets['91-180 days'].value += invValue;
      } else {
        agingBuckets['180+ days'].count++;
        agingBuckets['180+ days'].value += invValue;
      }
    });

  const agingAnalysisObj = { agingBuckets, totalItems: agingTotalItems, totalValue: agingTotalValue };

    const usedSource = (slowMovingItems && slowMovingItems.length > 0) ? 'postgres' : (normalizedMerged && normalizedMerged.length > 0) ? 'sqlite' : 'none';

    // Build a minimal summary compatible with previous responses
  const finalKPIs = sqliteKPIs && sqliteKPIs.kpis ? sqliteKPIs.kpis : (kpiData || {});
  const finalSummary = sqliteKPIs && sqliteKPIs.summary ? sqliteKPIs.summary : { totalItems: slowMovingItems.length || 0, totalValue: finalKPIs.totalInventoryValue || 0 };

      // Build category / warehouse aggregates expected by TurnoverAnalysisMatrix
      // Prefer normalizedMerged (sqlite fallback) when Postgres rows are absent
      const rowsForAgg = (usedSource === 'postgres') ? slowMovingItems : (normalizedMerged && normalizedMerged.length > 0 ? normalizedMerged : []);

      const byCategory = {};
      const byCategoryWarehouse = {};
      const warehousesList = {};

      const getTurnoverVal = (it) => {
        if (typeof it.Estimated_Turnover_Ratio === 'number') return it.Estimated_Turnover_Ratio;
        if (typeof it.Turnover_Ratio === 'number') return it.Turnover_Ratio;
        const ds = it.Days_Of_Supply || it.Days_of_Supply || null;
        if (ds && isFinite(Number(ds)) && Number(ds) > 0) return 365 / Number(ds);
        return 0;
      };

      rowsForAgg.forEach(r => {
        const cat = r.Item_Category || r.Item_Category || (r.Item_Category && String(r.Item_Category)) || 'Unknown';
        const whId = r.Warehouse_ID || r.Warehouse_Id || r.WarehouseKey || r.Warehouse_Key || r.WarehouseKey || r.Warehouse_Key || 'UNKNOWN';
        const whName = r.Warehouse_Name || r.warehouse_name || r.WarehouseName || String(whId);
        const turnover = Number(getTurnoverVal(r) || 0);
        const value = Number(r.Current_Inventory_Value || r.Inventory_Value || r.Current_Stock * (r.Unit_Cost || 0) || 0) || 0;

        // track warehouses
        warehousesList[String(whId)] = whName;

        // byCategoryWarehouse
        byCategoryWarehouse[cat] = byCategoryWarehouse[cat] || {};
        byCategoryWarehouse[cat][String(whId)] = byCategoryWarehouse[cat][String(whId)] || { averageTurnover: 0, totalItems: 0, totalValue: 0 };
        const cw = byCategoryWarehouse[cat][String(whId)];
        cw.averageTurnover = ((cw.averageTurnover * cw.totalItems) + turnover) / (cw.totalItems + 1);
        cw.totalItems += 1;
        cw.totalValue += value;

        // byCategory
        byCategory[cat] = byCategory[cat] || { averageTurnover: 0, totalItems: 0, totalValue: 0, poor: 0, critical: 0, excellent: 0, good: 0 };
        const bc = byCategory[cat];
        bc.averageTurnover = ((bc.averageTurnover * bc.totalItems) + turnover) / (bc.totalItems + 1);
        bc.totalItems += 1;
        bc.totalValue += value;

        // classify
        if (turnover > 6.0) bc.excellent += 1;
        else if (turnover >= 3.0) bc.good += 1;
        else if (turnover >= 1.0) {/* moderate - leave as neither poor nor good */}
        else if (turnover >= 0.5) bc.poor += 1;
        else bc.critical += 1;
      });

      // convert warehousesList to array
      const warehouses = Object.keys(warehousesList).map(id => ({ id, name: warehousesList[id] }));

      // If Postgres filterOptions were empty and we used the sqlite fallback, derive categories from normalizedMerged
      let finalFilterOptions = filterOptions || {};
      if (usedSource === 'sqlite' && (!finalFilterOptions.categories || finalFilterOptions.categories.length === 0)) {
        try {
          const cats = (normalizedMerged || []).map(r => (r.Item_Category || r.item_category || r.ItemCategory || 'Unknown'));
          finalFilterOptions.categories = Array.from(new Set(cats)).filter(Boolean);
          // preserve warehouses/day thresholds if missing
          finalFilterOptions.warehouses = finalFilterOptions.warehouses && finalFilterOptions.warehouses.length > 0 ? finalFilterOptions.warehouses : warehouses;
          finalFilterOptions.daysThresholds = finalFilterOptions.daysThresholds && finalFilterOptions.daysThresholds.length > 0 ? finalFilterOptions.daysThresholds : [
            { label: '30 Days', value: 30 },
            { label: '60 Days', value: 60 },
            { label: '90 Days', value: 90 },
            { label: '180 Days', value: 180 },
            { label: '365 Days', value: 365 }
          ];
        } catch (e) {
          // non-critical - leave finalFilterOptions as-is
        }
      }

    // close the pool
    try { if (queries && typeof queries.close === 'function') await queries.close(); } catch (e) {}

  // If we computed a sqlite-scoped aging analysis, prefer it only for the aging panel
  const agingToReturn = sqliteAgingAnalysis || agingAnalysisObj;

  // Ensure a consistent array-shaped agingAnalysisArray for chart/consumers.
  // If sqlite aging was computed, derive an array of { age_bracket, item_count, total_value }
  // keeping the same order as the buckets object.
  let finalAgingArray = agingAnalysisArray;
  if (sqliteAgingAnalysis && sqliteAgingAnalysis.agingBuckets) {
    finalAgingArray = Object.entries(sqliteAgingAnalysis.agingBuckets).map(([period, obj]) => ({
      age_bracket: period,
      item_count: Number((obj && obj.count) || 0),
      total_value: Number((obj && obj.value) || 0)
    }));
  }

  res.status(200).json({
      status: 'success',
      data: {
        kpis: finalKPIs,
        slowMovingItems,
        itemLevelData: slowMovingItems,
        merged: normalizedMerged,
        source: usedSource,
        agingAnalysis: agingToReturn,
        agingAnalysisArray: finalAgingArray,
        recommendations,
        filterOptions,
        summary: finalSummary,
        byCategory: byCategory,
        warehouses: warehouses,
        byCategoryWarehouse: byCategoryWarehouse,
        appliedFilters: filters
      }
    });
  } catch (error) {
    console.error('Error fetching slow moving stock data:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch slow moving stock data', error: error && error.message });
  }
}

// CommonJS compatibility: expose the query class so other internal modules
// can instantiate it programmatically (used by a forwarder to merge KPIs).
if (typeof module !== 'undefined' && module.exports) {
  try {
    module.exports.SlowMovingStockQueries = SlowMovingStockQueries;
  } catch (e) {
    // ignore
  }
}

// computeKPIs: keep the SQLite-based KPI computation here so KPIs remain
// identical to the analyzer output even though visualizations use Postgres.
try {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const fs = require('fs');

  const computeKPIs = async function computeKPIs(opts = {}) {
    const possiblePaths = [
      path.resolve(process.cwd(), 'Inventory/database/inventory.db'),
      path.resolve(__dirname, '../../../../apps/web/Inventory/database/inventory.db'),
      path.resolve(__dirname, '../../../Inventory/database/inventory.db'),
      path.resolve(__dirname, '../../Inventory/database/inventory.db')
    ];
    const dbPath = possiblePaths.find(p => fs.existsSync(p));
    if (!dbPath) throw new Error('Database file not found');

    const db = new sqlite3.Database(dbPath);
    const run = (query, params = []) => new Promise((resolve, reject) => db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows)));
    try {
      const maxRow = await run('SELECT MAX(Snapshot_Date) AS max_date FROM dbo_F_Inventory_Snapshot');
      const snapshotEnd = maxRow[0]?.max_date;
      if (!snapshotEnd) throw new Error('No inventory snapshot found');

      const end = opts.endDate || new Date(snapshotEnd).toISOString().slice(0,10);
      const start = opts.startDate || (new Date(new Date(end).setDate(new Date(end).getDate()-90))).toISOString().slice(0,10);

      const invQuery = `
        SELECT i.Item_Key, i.Item_Number, i.Item_Name, i.Item_Category, i.Unit_Cost,
               w.Warehouse_Key, w.Warehouse_ID, w.Warehouse_Name, w.Storage_Cost_Per_Unit,
               ist.Current_Stock, ist.Snapshot_Date
        FROM dbo_D_Item i
        JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
        JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
        WHERE ist.Snapshot_Date = ?
      `;
      const inventory = await run(invQuery, [snapshotEnd]);

      const salesQuery = `
        SELECT s.Item_Key, s.Warehouse_Key, SUM(s.Quantity) AS Quantity
        FROM dbo_F_Sales_Transaction s
        WHERE s.Transaction_Date BETWEEN ? AND ?
        GROUP BY s.Item_Key, s.Warehouse_Key
      `;
      const sales = await run(salesQuery, [start, end]);

      const salesMap = new Map();
      sales.forEach(r => salesMap.set(`${r.Item_Key}::${r.Warehouse_Key}`, r.Quantity || 0));

      const merged = inventory.map(row => {
        const key = `${row.Item_Key}::${row.Warehouse_Key}`;
        const annualSales = salesMap.get(key) || 0;
        const currentStock = row.Current_Stock || 0;
        const unitCost = row.Unit_Cost || 0;
        const inventoryValue = currentStock * unitCost;
        const turnoverRatio = currentStock === 0 ? 0 : (annualSales / currentStock);
        const daysOfSupply = annualSales === 0 ? Infinity : (currentStock / annualSales) * 365;
        const carryingCost = (row.Storage_Cost_Per_Unit || 0) * currentStock;
        return { ...row, Annual_Sales: annualSales, Turnover_Ratio: turnoverRatio, Days_of_Supply: daysOfSupply, Inventory_Value: inventoryValue, Carrying_Cost: carryingCost };
      });

      const slowRows = merged.filter(r => r.Turnover_Ratio < 1.0);
      const agedRows = merged.filter(r => r.Days_of_Supply > 180);
      const totalInventoryValue = merged.reduce((s,r) => s + (r.Inventory_Value || 0), 0);
      const slowMovingValue = slowRows.reduce((s,r) => s + (r.Inventory_Value || 0), 0);
      const agedValue = agedRows.reduce((s,r) => s + (r.Inventory_Value || 0), 0);
      const totalAnnualSales = merged.reduce((s,r) => s + (r.Annual_Sales || 0), 0);
      const totalCurrentStock = merged.reduce((s,r) => s + (r.Current_Stock || 0), 0);
      const averageTurnoverRatio = totalCurrentStock > 0 ? (totalAnnualSales / totalCurrentStock) : 0;
      const carryingCostImpact = slowRows.reduce((s,r) => s + (r.Carrying_Cost || 0), 0);

      const kpis = {
        totalSlowMovingItems: slowRows.length,
        slowMovingValue: slowMovingValue,
        averageTurnoverRatio: averageTurnoverRatio,
        agedInventoryPercent: totalInventoryValue > 0 ? (agedValue / totalInventoryValue) * 100 : 0,
        totalInventoryValue: totalInventoryValue,
        slowMovingPercent: totalInventoryValue > 0 ? (slowMovingValue / totalInventoryValue) * 100 : 0,
        carryingCostImpact: carryingCostImpact
      };

      const summary = {
        totalItems: merged.length,
        slowMovingItems: slowRows.length,
        agedItems: agedRows.length,
        totalInventoryValue,
        slowMovingValue,
        agedValue
      };

      return { kpis, summary, filter: { start, end } };
    } finally {
      db.close();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    try { module.exports.computeKPIs = computeKPIs; } catch (e) {}
  }
} catch (e) {
  // If sqlite3 isn't available in the environment, skip computeKPIs exposure.
  console.warn('computeKPIs not available:', e && e.message);
}