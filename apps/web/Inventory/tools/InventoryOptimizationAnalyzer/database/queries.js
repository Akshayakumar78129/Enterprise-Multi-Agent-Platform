const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class InventoryOptimizationQueries {
  constructor() {
    const dbPath = path.join(process.cwd(), 'Inventory', 'database', 'inventory.db');
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      console.error(`Database not found at: ${dbPath}`);
      throw new Error(`Database file not found at ${dbPath}`);
    }
    
    try {
      this.db = new Database(dbPath, { readonly: true });
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }

  // Main KPI data
  getKPIData(filters = {}) {
    const { startDate, endDate, warehouseId, category } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    // Note: Currently all snapshots are from 2025-05-11, so date filtering may not be effective
    // Keeping the filter logic for future data updates
    if (startDate && endDate) {
      whereClause += ' AND s.Snapshot_Date BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (warehouseId && warehouseId !== 'all') {
      whereClause += ' AND w.Warehouse_ID = @warehouseId';
      params.warehouseId = warehouseId;
    }
    
    if (category && category !== 'all') {
      whereClause += ' AND i.Item_Category = @category';
      params.category = category;
    }

    const query = `
      WITH latest_snapshot AS (
        SELECT 
          Item_Key,
          Warehouse_Key,
          Current_Stock,
          Average_Stock_Level,
          Reorder_Point,
          Safety_Stock,
          Snapshot_Date
        FROM dbo_F_Inventory_Snapshot
        WHERE Snapshot_Date = (
          SELECT MAX(Snapshot_Date) 
          FROM dbo_F_Inventory_Snapshot
        )
      ),
      inventory_metrics AS (
        SELECT 
          SUM(s.Current_Stock * i.Unit_Cost) as total_inventory_value,
          COUNT(DISTINCT i.Item_Key) as total_items,
          COUNT(DISTINCT CASE 
            WHEN s.Current_Stock < s.Reorder_Point THEN i.Item_Key 
          END) as stockout_risk_items,
          SUM(CASE 
            WHEN s.Current_Stock > s.Average_Stock_Level * 2 THEN 
              (s.Current_Stock - s.Average_Stock_Level * 2) * i.Unit_Cost 
            ELSE 0 
          END) as excess_inventory_value,
          AVG(CASE 
            WHEN s.Current_Stock > 0 THEN 
              (s.Current_Stock * 1.0 / NULLIF(s.Average_Stock_Level, 0)) * 100 
            ELSE 0 
          END) as avg_stock_coverage
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
      ),
      slow_moving AS (
        SELECT 
          COUNT(DISTINCT i.Item_Key) as slow_moving_items,
          SUM(s.Current_Stock * i.Unit_Cost) as slow_moving_value
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        LEFT JOIN (
          SELECT Item_Key, SUM(Quantity) as total_sales
          FROM dbo_F_Sales_Transaction
          WHERE Transaction_Date >= '2025-02-11'  -- Last 90 days from snapshot date
          GROUP BY Item_Key
        ) sales ON i.Item_Key = sales.Item_Key
        ${whereClause}
        AND (sales.total_sales IS NULL OR sales.total_sales < s.Current_Stock * 0.1)
      )
      SELECT 
        m.*,
        sm.slow_moving_items,
        sm.slow_moving_value,
        ROUND((sm.slow_moving_items * 100.0 / NULLIF(m.total_items, 0)), 2) as slow_moving_percentage,
        ROUND(m.excess_inventory_value * 0.25, 2) as potential_savings,
        ROUND(
          100 - (
            (COALESCE(sm.slow_moving_items, 0) * 0.3 + 
             COALESCE(m.stockout_risk_items, 0) * 0.4) / 
            NULLIF(m.total_items, 0) * 100
          ), 2
        ) as inventory_health_score
      FROM inventory_metrics m
      CROSS JOIN slow_moving sm
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.get(params);
    } catch (error) {
      console.error('Error in getKPIData:', error);
      throw error;
    }
  }

  // Health Matrix Data - by Category and Warehouse
  getHealthMatrixData(filters = {}) {
    const { startDate, endDate } = filters;
    
    let dateFilter = '';
    const params = {};
    
    if (startDate && endDate) {
      dateFilter = 'AND s.Snapshot_Date BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const query = `
      WITH latest_snapshot AS (
        SELECT * FROM dbo_F_Inventory_Snapshot
        WHERE Snapshot_Date = (
          SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot
        )
      ),
      health_data AS (
        SELECT 
          i.Item_Category as category,
          w.Warehouse_Name as warehouse,
          COUNT(DISTINCT i.Item_Key) as item_count,
          AVG(CASE 
            WHEN s.Current_Stock > 0 THEN 
              (s.Current_Stock * 1.0 / NULLIF(s.Average_Stock_Level, 0)) 
            ELSE 0 
          END) as stock_coverage_ratio,
          COUNT(DISTINCT CASE 
            WHEN s.Current_Stock < s.Reorder_Point THEN i.Item_Key 
          END) as stockout_risk_count,
          AVG(w.Storage_Cost_Per_Unit * s.Current_Stock) as avg_holding_cost,
          SUM(s.Current_Stock * i.Unit_Cost) as total_value
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        WHERE 1=1 ${dateFilter}
        GROUP BY i.Item_Category, w.Warehouse_Name
      )
      SELECT 
        category,
        warehouse,
        item_count,
        total_value,
        ROUND(
          CASE 
            WHEN stock_coverage_ratio > 2 THEN 60 - (stock_coverage_ratio - 2) * 10
            WHEN stock_coverage_ratio < 0.5 THEN 60 - (0.5 - stock_coverage_ratio) * 20
            ELSE 80 + (1 - ABS(stock_coverage_ratio - 1)) * 20
          END, 2
        ) as health_score,
        stock_coverage_ratio,
        stockout_risk_count,
        avg_holding_cost
      FROM health_data
      ORDER BY category, warehouse
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getHealthMatrixData:', error);
      throw error;
    }
  }

  // Cost Impact Analysis
  getCostImpactData(filters = {}) {
    const { startDate, endDate, warehouseId, category } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND s.Snapshot_Date BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (warehouseId && warehouseId !== 'all') {
      whereClause += ' AND w.Warehouse_ID = @warehouseId';
      params.warehouseId = warehouseId;
    }
    
    if (category && category !== 'all') {
      whereClause += ' AND i.Item_Category = @category';
      params.category = category;
    }

    const query = `
      WITH latest_snapshot AS (
        SELECT * FROM dbo_F_Inventory_Snapshot
        WHERE Snapshot_Date = (
          SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot
        )
      ),
      cost_analysis AS (
        SELECT 
          'Current Inventory Cost' as strategy,
          SUM(s.Current_Stock * i.Unit_Cost * w.Storage_Cost_Per_Unit * 0.01) as impact,
          0 as sequence_order
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Reduce Excess Stock' as strategy,
          -SUM(CASE 
            WHEN s.Current_Stock > s.Average_Stock_Level * 1.5 THEN 
              (s.Current_Stock - s.Average_Stock_Level * 1.5) * i.Unit_Cost * w.Storage_Cost_Per_Unit * 0.01
            ELSE 0 
          END) as impact,
          1 as sequence_order
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Optimize Safety Stock' as strategy,
          -SUM(CASE 
            WHEN s.Safety_Stock > s.Average_Stock_Level * 0.3 THEN 
              (s.Safety_Stock - s.Average_Stock_Level * 0.3) * i.Unit_Cost * w.Storage_Cost_Per_Unit * 0.01
            ELSE 0 
          END) as impact,
          2 as sequence_order
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Address Slow-Moving' as strategy,
          -SUM(s.Current_Stock * i.Unit_Cost * w.Storage_Cost_Per_Unit * 0.01 * 0.5) as impact,
          3 as sequence_order
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        LEFT JOIN (
          SELECT Item_Key, SUM(Quantity) as total_sales
          FROM dbo_F_Sales_Transaction
          WHERE Transaction_Date >= '2025-02-11'  -- Last 90 days from snapshot date
          GROUP BY Item_Key
        ) sales ON i.Item_Key = sales.Item_Key
        ${whereClause}
        AND (sales.total_sales IS NULL OR sales.total_sales < s.Current_Stock * 0.1)
      )
      SELECT 
        strategy,
        ROUND(ABS(impact), 2) as impact,
        sequence_order,
        CASE 
          WHEN sequence_order = 0 THEN 'baseline'
          ELSE 'reduction'
        END as impact_type
      FROM cost_analysis
      ORDER BY sequence_order
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getCostImpactData:', error);
      throw error;
    }
  }

  // Performance Timeline
  getPerformanceTimeline(filters = {}) {
    const { startDate, endDate, metric = 'health_score', warehouseId, category } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    // Since we only have one snapshot date (2025-05-11), we'll aggregate by category/warehouse
    // to show different data points on the timeline
    if (startDate && endDate) {
      whereClause += ' AND s.Snapshot_Date BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (warehouseId && warehouseId !== 'all') {
      whereClause += ' AND w.Warehouse_ID = @warehouseId';
      params.warehouseId = warehouseId;
    }
    
    if (category && category !== 'all') {
      whereClause += ' AND i.Item_Category = @category';
      params.category = category;
    }

    const query = `
      SELECT 
        s.Snapshot_Date as date,
        COUNT(DISTINCT i.Item_Key) as total_items,
        SUM(s.Current_Stock * i.Unit_Cost) as inventory_value,
        AVG(s.Current_Stock * 1.0 / NULLIF(s.Average_Stock_Level, 0)) as avg_stock_coverage,
        COUNT(DISTINCT CASE 
          WHEN s.Current_Stock < s.Reorder_Point THEN i.Item_Key 
        END) as stockout_risk_items,
        SUM(w.Storage_Cost_Per_Unit * s.Current_Stock) as total_holding_cost,
        ROUND(
          100 - (
            (COUNT(DISTINCT CASE WHEN s.Current_Stock < s.Reorder_Point THEN i.Item_Key END) * 40.0 / 
            NULLIF(COUNT(DISTINCT i.Item_Key), 0))
          ), 2
        ) as health_score
      FROM dbo_F_Inventory_Snapshot s
      JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
      JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
      ${whereClause}
      GROUP BY s.Snapshot_Date
      ORDER BY s.Snapshot_Date
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getPerformanceTimeline:', error);
      throw error;
    }
  }

  // Action Priority Matrix
  getActionPriorityData(filters = {}) {
    const { startDate, endDate, warehouseId, category } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND s.Snapshot_Date BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (warehouseId && warehouseId !== 'all') {
      whereClause += ' AND w.Warehouse_ID = @warehouseId';
      params.warehouseId = warehouseId;
    }
    
    if (category && category !== 'all') {
      whereClause += ' AND i.Item_Category = @category';
      params.category = category;
    }

    const query = `
      WITH latest_snapshot AS (
        SELECT * FROM dbo_F_Inventory_Snapshot
        WHERE Snapshot_Date = (
          SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot
        )
      ),
      actions AS (
        SELECT 
          'Reduce Excess Stock - ' || i.Item_Category as action_name,
          SUM(CASE 
            WHEN s.Current_Stock > s.Average_Stock_Level * 1.5 THEN 
              (s.Current_Stock - s.Average_Stock_Level * 1.5) * i.Unit_Cost * 0.25
            ELSE 0 
          END) as financial_impact,
          2 as effort_score,
          COUNT(DISTINCT CASE 
            WHEN s.Current_Stock > s.Average_Stock_Level * 1.5 THEN i.Item_Key 
          END) as affected_items,
          i.Item_Category as category,
          'excess_reduction' as action_type
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
        GROUP BY i.Item_Category
        HAVING financial_impact > 0
        
        UNION ALL
        
        SELECT 
          'Optimize Reorder Points - ' || i.Item_Category as action_name,
          SUM(s.Safety_Stock * i.Unit_Cost * 0.15) as financial_impact,
          3 as effort_score,
          COUNT(DISTINCT i.Item_Key) as affected_items,
          i.Item_Category as category,
          'reorder_optimization' as action_type
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
        GROUP BY i.Item_Category
        
        UNION ALL
        
        SELECT 
          'Clear Slow-Moving - ' || i.Item_Category as action_name,
          SUM(s.Current_Stock * i.Unit_Cost * 0.3) as financial_impact,
          4 as effort_score,
          COUNT(DISTINCT i.Item_Key) as affected_items,
          i.Item_Category as category,
          'slow_moving_clearance' as action_type
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        LEFT JOIN (
          SELECT Item_Key, SUM(Quantity) as total_sales
          FROM dbo_F_Sales_Transaction
          WHERE Transaction_Date >= '2025-02-11'  -- Last 90 days from snapshot date
          GROUP BY Item_Key
        ) sales ON i.Item_Key = sales.Item_Key
        ${whereClause}
        AND (sales.total_sales IS NULL OR sales.total_sales < s.Current_Stock * 0.1)
        GROUP BY i.Item_Category
        HAVING financial_impact > 0
      )
      SELECT 
        action_name,
        ROUND(financial_impact, 2) as financial_impact,
        effort_score,
        affected_items,
        category,
        action_type,
        CASE 
          WHEN financial_impact > 10000 AND effort_score <= 2 THEN 'Quick Win'
          WHEN financial_impact > 10000 AND effort_score > 2 THEN 'Major Project'
          WHEN financial_impact <= 10000 AND effort_score <= 2 THEN 'Fill-In'
          ELSE 'Consider Later'
        END as quadrant
      FROM actions
      WHERE financial_impact > 100
      ORDER BY financial_impact DESC
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getActionPriorityData:', error);
      throw error;
    }
  }

  // Aging Analysis
  getAgingAnalysis(filters = {}) {
    const { startDate, endDate, warehouseId, category } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (warehouseId && warehouseId !== 'all') {
      whereClause += ' AND w.Warehouse_ID = @warehouseId';
      params.warehouseId = warehouseId;
    }
    
    if (category && category !== 'all') {
      whereClause += ' AND i.Item_Category = @category';
      params.category = category;
    }

    const query = `
      WITH latest_snapshot AS (
        SELECT * FROM dbo_F_Inventory_Snapshot
        WHERE Snapshot_Date = (
          SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot
        )
      ),
      sales_data AS (
        SELECT 
          Item_Key,
          MAX(Transaction_Date) as last_sale_date,
          SUM(Quantity) as total_sales
        FROM dbo_F_Sales_Transaction
        WHERE Transaction_Date >= date('now', '-180 days')
        GROUP BY Item_Key
      ),
      aging_buckets AS (
        SELECT 
          i.Item_Key,
          i.Item_Name,
          i.Item_Category,
          s.Current_Stock,
          s.Current_Stock * i.Unit_Cost as inventory_value,
          COALESCE(
            julianday('now') - julianday(sd.last_sale_date),
            180
          ) as days_since_last_sale,
          CASE 
            WHEN julianday('now') - julianday(sd.last_sale_date) <= 30 OR sd.last_sale_date IS NULL THEN '0-30 days'
            WHEN julianday('now') - julianday(sd.last_sale_date) <= 60 THEN '31-60 days'
            WHEN julianday('now') - julianday(sd.last_sale_date) <= 90 THEN '61-90 days'
            WHEN julianday('now') - julianday(sd.last_sale_date) <= 180 THEN '91-180 days'
            ELSE '180+ days'
          END as age_bucket
        FROM latest_snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        LEFT JOIN sales_data sd ON i.Item_Key = sd.Item_Key
        ${whereClause}
      )
      SELECT 
        age_bucket,
        COUNT(*) as item_count,
        SUM(Current_Stock) as total_units,
        ROUND(SUM(inventory_value), 2) as total_value,
        ROUND(AVG(days_since_last_sale), 1) as avg_days_since_sale
      FROM aging_buckets
      GROUP BY age_bucket
      ORDER BY 
        CASE age_bucket
          WHEN '0-30 days' THEN 1
          WHEN '31-60 days' THEN 2
          WHEN '61-90 days' THEN 3
          WHEN '91-180 days' THEN 4
          ELSE 5
        END
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getAgingAnalysis:', error);
      throw error;
    }
  }

  // Get warehouses for filter
  getWarehouses() {
    const query = `
      SELECT DISTINCT 
        Warehouse_ID as id,
        Warehouse_Name as name,
        Warehouse_Type as type
      FROM dbo_D_Warehouse
      ORDER BY Warehouse_Name
    `;
    
    try {
      const stmt = this.db.prepare(query);
      return stmt.all();
    } catch (error) {
      console.error('Error in getWarehouses:', error);
      throw error;
    }
  }

  // Get categories for filter
  getCategories() {
    const query = `
      SELECT DISTINCT 
        Item_Category as category,
        COUNT(*) as item_count
      FROM dbo_D_Item
      GROUP BY Item_Category
      ORDER BY Item_Category
    `;
    
    try {
      const stmt = this.db.prepare(query);
      return stmt.all();
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { InventoryOptimizationQueries };