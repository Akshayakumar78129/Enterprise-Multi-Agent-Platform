// --- KPI Tiles SQL Queries ---
// 1. Total Slow-Moving Items
//   Count of items with NO sales transactions in the date range.
//   Uses dbo_D_Item, dbo_F_Inventory_Snapshot, excludes items in dbo_F_Sales_Transaction between [start_date] and [end_date].
const SQL_TOTAL_SLOW_MOVING_ITEMS = `
  SELECT COUNT(DISTINCT i.Item_Key) AS total_slow_moving_items
  FROM dbo_D_Item i
  JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
  WHERE ist.Snapshot_Date = ?
    AND i.Item_Key NOT IN (
      SELECT DISTINCT st.Item_Key
      FROM dbo_F_Sales_Transaction st
      WHERE st.Transaction_Date >= ? AND st.Transaction_Date <= ?
    )
`;

// 2. Slow-Moving Value
//   Sum of (Unit_Cost * Current_Stock) for slow-moving items (as above).
const SQL_SLOW_MOVING_VALUE = `
  SELECT SUM(i.Unit_Cost * ist.Current_Stock) AS slow_moving_value
  FROM dbo_D_Item i
  JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
  WHERE ist.Snapshot_Date = ?
    AND i.Item_Key NOT IN (
      SELECT DISTINCT st.Item_Key
      FROM dbo_F_Sales_Transaction st
      WHERE st.Transaction_Date >= ? AND st.Transaction_Date <= ?
    )
`;

// 3. Average Turnover Ratio
//   (Total COGS in period) / (Average Inventory Value at start and end)
const SQL_TOTAL_COGS = `
  -- Use item unit cost from the item master to compute COGS
  SELECT SUM(st.Quantity * i.Unit_Cost) AS total_cogs
  FROM dbo_F_Sales_Transaction st
  JOIN dbo_D_Item i ON st.Item_Key = i.Item_Key
  WHERE st.Transaction_Date >= ? AND st.Transaction_Date <= ?
`;
const SQL_AVG_INVENTORY_VALUE = `
  SELECT (
    (SELECT SUM(i.Unit_Cost * ist.Current_Stock)
     FROM dbo_D_Item i
     JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
     WHERE ist.Snapshot_Date = ?)
    +
    (SELECT SUM(i.Unit_Cost * ist.Current_Stock)
     FROM dbo_D_Item i
     JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
     WHERE ist.Snapshot_Date = ?)
  ) / 2.0 AS avg_inventory_value
`;

// 4. Aged Inventory Percentage
//   (Slow-Moving Value / Total Inventory Value at [end_date]) * 100
const SQL_TOTAL_INVENTORY_VALUE = `
  SELECT SUM(i.Unit_Cost * ist.Current_Stock) AS total_inventory_value
  FROM dbo_D_Item i
  JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
  WHERE ist.Snapshot_Date = ?
`;
// (Use SQL_SLOW_MOVING_VALUE for numerator)

// 5. Carrying Cost Impact
//   Sum of (Current_Stock * Storage_Cost_Per_Unit) for slow-moving items
const SQL_CARRYING_COST_IMPACT = `
  SELECT SUM(ist.Current_Stock * w.Storage_Cost_Per_Unit) AS carrying_cost_impact
  FROM dbo_D_Item i
  JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
  JOIN dbo_D_Warehouse w ON ist.Warehouse_Key = w.Warehouse_Key
  WHERE ist.Snapshot_Date = ?
    AND i.Item_Key NOT IN (
      SELECT DISTINCT st.Item_Key
      FROM dbo_F_Sales_Transaction st
      WHERE st.Transaction_Date >= ? AND st.Transaction_Date <= ?
    )
`;
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class SlowMovingInventoryQueries {
  constructor() {
    // Try multiple possible paths to handle different execution contexts
    const possiblePaths = [
      path.resolve(process.cwd(), "Inventory/database/inventory.db"), // From apps/web when running pnpm dev
      path.resolve(__dirname, "../../../database/inventory.db"), // From tool folder
      path.resolve(__dirname, "../../../../database/inventory.db"), // Alternative path
      path.resolve(process.cwd(), "../database/inventory.db"), // From apps folder
      path.resolve(process.cwd(), "../../database/inventory.db") // From nested folder
    ];
    
    const fs = require("fs");
    this.dbPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (!this.dbPath) {
      console.error("❌ Database not found at any of these paths:");
      possiblePaths.forEach(p => console.error("   ", p));
      throw new Error("Database file not found");
    }
  }
  

  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  async getMainData(filters = {}) {
    const { 
      dateRange = null, 
      category = null, 
      warehouseId = null,
      turnoverThreshold = 4.0,
      daysThreshold = 90
    } = filters;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (dateRange && dateRange.start && dateRange.end) {
      whereClause += " AND ist.Snapshot_Date BETWEEN ? AND ?";
      params.push(dateRange.start, dateRange.end);
    }

    if (category) {
      whereClause += " AND i.Item_Category = ?";
      params.push(category);
    }

    if (warehouseId) {
      whereClause += " AND w.Warehouse_ID = ?";
      params.push(warehouseId);
    }

    // Start with a simpler query that matches the working holding cost analyzer
    const query = `
      SELECT 
        i.Item_Key,
        i.Item_Number,
        i.Item_Name,
        i.Item_Category,
        i.Unit_Cost,
        i.Lead_Time_Days,
        i.Obsolescence_Risk,
        i.Storage_Requirements,
        w.Warehouse_Key,
        w.Warehouse_ID,
        w.Warehouse_Name,
        w.Warehouse_Type,
        w.Storage_Cost_Per_Unit,
        ist.Current_Stock,
        ist.Average_Stock_Level,
        ist.Snapshot_Date,
        (ist.Current_Stock * i.Unit_Cost) as Current_Inventory_Value,
        (ist.Average_Stock_Level * i.Unit_Cost) as Average_Inventory_Value,
        (ist.Average_Stock_Level * i.Unit_Cost * 0.25) as Annual_Carrying_Cost
      FROM dbo_D_Item i
      JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
      JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
      ${whereClause}
      ORDER BY (ist.Current_Stock * i.Unit_Cost) DESC
    `;

    const rawData = await this.executeQuery(query, params);
    
    // Add calculated fields after fetching data
    return rawData.map(item => {
      // Calculate days since last movement (synthetic heuristic based on stock levels)
      const daysWithoutMovement = item.Current_Stock > item.Average_Stock_Level * 1.5 ? 120 :
                                 item.Current_Stock > item.Average_Stock_Level * 1.2 ? 90 :
                                 item.Current_Stock > item.Average_Stock_Level ? 60 : 30;

      // Estimate turnover ratio using lead time as a proxy for replenishment cycles per year.
      // Turnover ≈ 365 / Lead_Time_Days, capped to [0, 20] to avoid outliers.
      const leadDays = Math.max(1, parseFloat(item.Lead_Time_Days) || 30);
      let estimatedTurnover = 365 / leadDays;
      // Lightly adjust by how inflated current stock is vs average (more inventory => slower turns)
      const stockInflation = item.Average_Stock_Level > 0 ? (item.Current_Stock / item.Average_Stock_Level) : 1;
      if (Number.isFinite(stockInflation) && stockInflation > 0) {
        estimatedTurnover = estimatedTurnover / Math.min(Math.max(stockInflation, 0.5), 2.0);
      }
      estimatedTurnover = Math.max(0, Math.min(20, estimatedTurnover));

      return {
        ...item,
        Days_Since_Last_Movement: daysWithoutMovement,
        Estimated_Turnover_Ratio: estimatedTurnover
      };
    });
  }

  async getKPIData(filters = {}) {
    try {
      // Extract date range; default to all-time using inventory snapshot min/max if not provided
      let { dateRange = null } = filters;
      if (!dateRange || !dateRange.start || !dateRange.end) {
        // Fetch min/max snapshot dates to serve as an all-time range
        try {
          const row = await this.executeQuery("SELECT MIN(Snapshot_Date) as min_date, MAX(Snapshot_Date) as max_date FROM dbo_F_Inventory_Snapshot");
          const minDate = row[0]?.min_date || '2000-01-01';
          const maxDate = row[0]?.max_date || new Date().toISOString().slice(0,10);
          dateRange = { start: minDate, end: maxDate };
        } catch (err) {
          // Fallback to a wide range
          dateRange = { start: '2000-01-01', end: new Date().toISOString().slice(0,10) };
        }
      }
      const startDate = dateRange.start;
      const endDate = dateRange.end;

      // 1. Total Slow-Moving Items
      let totalSlowMovingItems = 0;
      try {
        // SQL_TOTAL_SLOW_MOVING_ITEMS expects: snapshot_date, start_date, end_date
        const rows = await this.executeQuery(SQL_TOTAL_SLOW_MOVING_ITEMS, [endDate, startDate, endDate]);
        totalSlowMovingItems = rows[0]?.total_slow_moving_items || 0;
      } catch (err) {
        console.error('❌ SQL_TOTAL_SLOW_MOVING_ITEMS error:', err);
      }

      // 2. Slow-Moving Value
      let slowMovingValue = 0;
      try {
        const rows = await this.executeQuery(SQL_SLOW_MOVING_VALUE, [endDate, startDate, endDate]);
        slowMovingValue = rows[0]?.slow_moving_value || 0;
      } catch (err) {
        console.error('❌ SQL_SLOW_MOVING_VALUE error:', err);
      }

      // 3. Average Turnover Ratio
      let totalCogs = 0, avgInventoryValue = 0, averageTurnoverRatio = 0;
      try {
        const cogsRows = await this.executeQuery(SQL_TOTAL_COGS, [startDate, endDate]);
        totalCogs = cogsRows[0]?.total_cogs || 0;
        const avgInvRows = await this.executeQuery(SQL_AVG_INVENTORY_VALUE, [startDate, endDate]);
        avgInventoryValue = avgInvRows[0]?.avg_inventory_value || 0;
        averageTurnoverRatio = avgInventoryValue > 0 ? totalCogs / avgInventoryValue : 0;
      } catch (err) {
        console.error('❌ SQL_TOTAL_COGS or SQL_AVG_INVENTORY_VALUE error:', err);
      }

      // 4. Aged Inventory Percentage
      let totalInventoryValue = 0, agedInventoryPercent = 0;
      try {
        const totalInvRows = await this.executeQuery(SQL_TOTAL_INVENTORY_VALUE, [endDate]);
        totalInventoryValue = totalInvRows[0]?.total_inventory_value || 0;
        agedInventoryPercent = totalInventoryValue > 0 ? (slowMovingValue / totalInventoryValue) * 100 : 0;
      } catch (err) {
        console.error('❌ SQL_TOTAL_INVENTORY_VALUE error:', err);
      }

      // 5. Carrying Cost Impact
      let carryingCostImpact = 0;
      try {
        const rows = await this.executeQuery(SQL_CARRYING_COST_IMPACT, [endDate, startDate, endDate]);
        carryingCostImpact = rows[0]?.carrying_cost_impact || 0;
      } catch (err) {
        console.error('❌ SQL_CARRYING_COST_IMPACT error:', err);
      }

      return {
        totalSlowMovingItems,
        slowMovingValue,
        averageTurnoverRatio,
        agedInventoryPercent,
        carryingCostImpact,
        totalInventoryValue
      };
    } catch (err) {
      console.error('❌ getKPIData unexpected error:', err);
      return {
        totalSlowMovingItems: 0,
        slowMovingValue: 0,
        averageTurnoverRatio: 0,
        agedInventoryPercent: 0,
        carryingCostImpact: 0,
        totalInventoryValue: 0,
        error: err.message || String(err)
      };
    }
  }

  async getTurnoverAnalysisData(filters = {}) {
    const mainData = await this.getMainData(filters);
    const turnoverThreshold = filters.turnoverThreshold || 4.0;
    
    // Group items by category and turnover performance
    const analysis = {
      byCategory: {},
      byCategoryWarehouse: {},
      warehouses: [],
      overall: {
        excellent: 0,     // > 6.0 turnover
        good: 0,          // 4.0 - 6.0 turnover
        poor: 0,          // 2.0 - 4.0 turnover
        critical: 0       // < 2.0 turnover
      }
    };

    // Collect warehouse metadata
    const warehousesMap = new Map(); // id -> name
    mainData.forEach(item => {
      if (item.Warehouse_ID && item.Warehouse_Name) {
        warehousesMap.set(item.Warehouse_ID, item.Warehouse_Name);
      }
    });
    analysis.warehouses = Array.from(warehousesMap, ([id, name]) => ({ id, name }));

    mainData.forEach(item => {
      const category = item.Item_Category;
      const turnover = item.Estimated_Turnover_Ratio;
      const warehouseId = item.Warehouse_ID;
      
      // Initialize category if not exists
    if (!analysis.byCategory[category]) {
        analysis.byCategory[category] = {
          categoryName: category,
          excellent: 0,
          good: 0,
          poor: 0,
          critical: 0,
      totalItems: 0,
      totalUnits: 0,
          totalValue: 0,
          averageTurnover: 0
        };
      }

      // Initialize category×warehouse bucket
      if (!analysis.byCategoryWarehouse[category]) {
        analysis.byCategoryWarehouse[category] = {};
      }
      if (warehouseId && !analysis.byCategoryWarehouse[category][warehouseId]) {
        analysis.byCategoryWarehouse[category][warehouseId] = {
          items: 0,
          value: 0,
          sumTurnover: 0,
          averageTurnover: 0,
          excellent: 0,
          good: 0,
          poor: 0,
          critical: 0
        };
      }

      // Categorize performance
      let performanceLevel;
      if (turnover > 6.0) {
        performanceLevel = 'excellent';
      } else if (turnover >= 4.0) {
        performanceLevel = 'good';
      } else if (turnover >= 2.0) {
        performanceLevel = 'poor';
      } else {
        performanceLevel = 'critical';
      }

  analysis.byCategory[category][performanceLevel]++;
  analysis.byCategory[category].totalItems++;
  analysis.byCategory[category].totalUnits += item.Current_Stock || 0;
  analysis.byCategory[category].totalValue += item.Current_Inventory_Value;
      analysis.overall[performanceLevel]++;

      // Update category×warehouse bucket
      if (warehouseId && analysis.byCategoryWarehouse[category][warehouseId]) {
        const bucket = analysis.byCategoryWarehouse[category][warehouseId];
        bucket.items++;
        bucket.value += item.Current_Inventory_Value;
        bucket.sumTurnover += turnover;
        bucket[performanceLevel]++;
      }
    });

    // Calculate average turnover by category
    Object.keys(analysis.byCategory).forEach(category => {
      const categoryItems = mainData.filter(item => item.Item_Category === category);
      analysis.byCategory[category].averageTurnover = categoryItems.length > 0
        ? categoryItems.reduce((sum, item) => sum + item.Estimated_Turnover_Ratio, 0) / categoryItems.length
        : 0;
    });

    // Calculate average turnover by category×warehouse
    Object.keys(analysis.byCategoryWarehouse).forEach(category => {
      const byWh = analysis.byCategoryWarehouse[category];
      Object.keys(byWh).forEach(whId => {
        const bucket = byWh[whId];
        bucket.averageTurnover = bucket.items > 0 ? bucket.sumTurnover / bucket.items : 0;
      });
    });

    return analysis;
  }

  async getAgingAnalysisData(filters = {}) {
    const mainData = await this.getMainData(filters);
    
    const agingBuckets = {
      '0-30 days': { count: 0, value: 0, items: [] },
      '31-60 days': { count: 0, value: 0, items: [] },
      '61-90 days': { count: 0, value: 0, items: [] },
      '91-180 days': { count: 0, value: 0, items: [] },
      '180+ days': { count: 0, value: 0, items: [] }
    };

    mainData.forEach(item => {
      const days = item.Days_Since_Last_Movement;
      let bucket;
      
      if (days <= 30) bucket = '0-30 days';
      else if (days <= 60) bucket = '31-60 days';
      else if (days <= 90) bucket = '61-90 days';
      else if (days <= 180) bucket = '91-180 days';
      else bucket = '180+ days';

      agingBuckets[bucket].count++;
      agingBuckets[bucket].value += item.Current_Inventory_Value;
      agingBuckets[bucket].items.push({
        itemNumber: item.Item_Number,
        itemName: item.Item_Name,
        category: item.Item_Category,
        daysSinceMovement: days,
        value: item.Current_Inventory_Value
      });
    });

    return {
      agingBuckets,
      totalItems: mainData.length,
      totalValue: mainData.reduce((sum, item) => sum + item.Current_Inventory_Value, 0)
    };
  }

  async getFinancialImpactData(filters = {}) {
    const mainData = await this.getMainData(filters);
    const slowMovingItems = mainData.filter(item => 
      item.Estimated_Turnover_Ratio < (filters.turnoverThreshold || 4.0) || 
      item.Days_Since_Last_Movement >= (filters.daysThreshold || 90)
    );

    // Calculate financial metrics
    const totalCarryingCost = slowMovingItems.reduce((sum, item) => sum + item.Annual_Carrying_Cost, 0);
    const totalValue = slowMovingItems.reduce((sum, item) => sum + item.Current_Inventory_Value, 0);
    
    // Simulate potential savings through different optimization strategies
    const optimizationScenarios = {
      'Liquidation (30% discount)': {
        potentialRecovery: totalValue * 0.7,
        costSavings: totalCarryingCost,
        netBenefit: (totalValue * 0.7) + totalCarryingCost - totalValue,
        implementationCost: totalValue * 0.05, // 5% liquidation costs
        timeframe: '3 months'
      },
      'Bundling Strategy': {
        potentialRecovery: totalValue * 0.85,
        costSavings: totalCarryingCost * 0.6,
        netBenefit: (totalValue * 0.85) + (totalCarryingCost * 0.6) - totalValue,
        implementationCost: totalValue * 0.02, // 2% marketing costs
        timeframe: '6 months'
      },
      'Supplier Negotiations': {
        potentialRecovery: totalValue * 0.95,
        costSavings: totalCarryingCost * 0.3,
        netBenefit: (totalCarryingCost * 0.3),
        implementationCost: 5000, // Fixed negotiation costs
        timeframe: '9 months'
      },
      'Demand Stimulation': {
        potentialRecovery: totalValue * 0.9,
        costSavings: totalCarryingCost * 0.8,
        netBenefit: (totalValue * 0.9) + (totalCarryingCost * 0.8) - totalValue,
        implementationCost: totalValue * 0.08, // 8% marketing costs
        timeframe: '12 months'
      }
    };

    return {
      slowMovingValue: totalValue,
      annualCarryingCost: totalCarryingCost,
      optimizationScenarios,
      riskFactors: this.calculateRiskFactors(slowMovingItems),
      recommendations: this.generateFinancialRecommendations(slowMovingItems, optimizationScenarios)
    };
  }

  calculateRiskFactors(items) {
    const obsolescenceRisk = items.reduce((sum, item) => sum + (item.Current_Inventory_Value * item.Obsolescence_Risk), 0);
    const seasonalItems = items.filter(item => 
      item.Item_Category === 'Clothing' || 
      item.Item_Category === 'Home & Garden'
    ).length;
    
    return {
      obsolescenceRisk,
      seasonalItemCount: seasonalItems,
      highValueItems: items.filter(item => item.Current_Inventory_Value > 10000).length,
      totalItemsAtRisk: items.length
    };
  }

  generateFinancialRecommendations(items, scenarios) {
    const recommendations = [];
    
    const highValueItems = items.filter(item => item.Current_Inventory_Value > 10000);
    const highObsolescenceItems = items.filter(item => item.Obsolescence_Risk > 0.3);
    
    if (highValueItems.length > 0) {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        description: `${highValueItems.length} high-value items require immediate attention`,
        action: 'Focus on liquidation or bundling strategies for items > $10K'
      });
    }
    
    if (highObsolescenceItems.length > 0) {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        description: `${highObsolescenceItems.length} items have high obsolescence risk`,
        action: 'Implement aggressive pricing strategy within 30 days'
      });
    }
    
    // Find best optimization scenario
    const bestScenario = Object.entries(scenarios)
      .sort(([,a], [,b]) => b.netBenefit - a.netBenefit)[0];
    
    recommendations.push({
      type: 'strategic',
      priority: 'medium',
      description: `${bestScenario[0]} shows highest potential return`,
      action: `Consider implementing ${bestScenario[0]} for ${bestScenario[1].timeframe}`
    });
    
    return recommendations;
  }

  async getItemLevelData(filters = {}) {
    const mainData = await this.getMainData(filters);
    const turnoverThreshold = filters.turnoverThreshold || 4.0;
    const daysThreshold = filters.daysThreshold || 90;
    
    // Return ALL items with calculated status and metrics
    const allItems = mainData.map(item => {
      const urgency = this.calculateUrgency(item);
      const recommendedActions = this.generateItemActions(item);

      // Compute days-of-supply from estimated turnover (fallbacks handled)
      const turnover = Number(item.Estimated_Turnover_Ratio) || 0;
      const daysOfSupply = turnover > 0 ? Math.round(365 / turnover) : 9999;

      // Calculate status using the same scale as turnover analysis buckets:
      // - Critical: turnover < 2.0 OR daysOfSupply >= 365
      // - Aged: daysOfSupply >= 180
      // - Slow: turnover < 4.0
      // - Good: otherwise
      let status = 'Good';
      if (turnover < 2.0 || daysOfSupply >= 365) {
        status = 'Critical';
      } else if (daysOfSupply >= 180) {
        status = 'Aged';
      } else if (turnover < 4.0) {
        status = 'Slow';
      }

      return {
        ...item,
        urgency,
        recommendedActions,
        potentialSavings: this.calculateItemSavings(item),
        riskScore: this.calculateRiskScore(item),
        status, // Add status field for display
        Days_Of_Supply: daysOfSupply
      };
    }).sort((a, b) => {
      // Sort by status priority (Critical > Slow > Aged > Good), then by value
      const statusOrder = { 'Critical': 3, 'Slow': 2, 'Aged': 1, 'Good': 0 };
      if (a.status !== b.status) {
        return statusOrder[b.status] - statusOrder[a.status];
      }
      return b.Current_Inventory_Value - a.Current_Inventory_Value;
    });

    return allItems;
  }

  calculateUrgency(item) {
    let score = 0;
    
    // High obsolescence risk
    if (item.Obsolescence_Risk > 0.3) score += 3;
    else if (item.Obsolescence_Risk > 0.2) score += 2;
    else if (item.Obsolescence_Risk > 0.1) score += 1;
    
    // Long time since movement
    if (item.Days_Since_Last_Movement > 180) score += 3;
    else if (item.Days_Since_Last_Movement > 120) score += 2;
    else if (item.Days_Since_Last_Movement > 90) score += 1;
    
    // Low turnover
    if (item.Estimated_Turnover_Ratio < 1.0) score += 3;
    else if (item.Estimated_Turnover_Ratio < 2.0) score += 2;
    else if (item.Estimated_Turnover_Ratio < 3.0) score += 1;
    
    // High value at risk
    if (item.Current_Inventory_Value > 20000) score += 2;
    else if (item.Current_Inventory_Value > 10000) score += 1;
    
    if (score >= 7) return 'Critical';
    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  }

  generateItemActions(item) {
    const actions = [];
    
    if (item.Obsolescence_Risk > 0.3) {
      actions.push('Immediate liquidation');
    }
    
    if (item.Days_Since_Last_Movement > 120) {
      actions.push('Markdown pricing');
    }
    
    if (item.Estimated_Turnover_Ratio < 2.0) {
      actions.push('Bundle with fast movers');
    }
    
    if (item.Current_Stock > item.Average_Stock_Level * 2) {
      actions.push('Adjust reorder points');
    }
    
    if (item.Lead_Time_Days > 21) {
      actions.push('Negotiate faster delivery');
    }
    
    if (actions.length === 0) {
      actions.push('Monitor closely');
    }
    
    return actions;
  }

  calculateItemSavings(item) {
    // Estimate potential savings from optimizing this item
    const carryingCostSavings = item.Annual_Carrying_Cost * 0.7; // 70% of carrying cost
    const liquidationRecovery = item.Current_Inventory_Value * 0.6; // 60% recovery
    return Math.max(carryingCostSavings, liquidationRecovery - item.Current_Inventory_Value);
  }

  calculateRiskScore(item) {
    let risk = 0;
    risk += item.Obsolescence_Risk * 40; // Max 40 points
    risk += Math.min(item.Days_Since_Last_Movement / 180, 1) * 30; // Max 30 points
    risk += Math.max(0, (4.0 - item.Estimated_Turnover_Ratio) / 4.0) * 30; // Max 30 points
    return Math.min(Math.round(risk), 100);
  }

  async getFilterOptions() {
    const categoriesQuery = "SELECT DISTINCT Item_Category FROM dbo_D_Item ORDER BY Item_Category";
    const warehousesQuery = "SELECT DISTINCT Warehouse_ID, Warehouse_Name FROM dbo_D_Warehouse ORDER BY Warehouse_Name";
    const dateRangeQuery = "SELECT MIN(Snapshot_Date) as min_date, MAX(Snapshot_Date) as max_date FROM dbo_F_Inventory_Snapshot";
    
    const [categories, warehouses, dateRange] = await Promise.all([
      this.executeQuery(categoriesQuery),
      this.executeQuery(warehousesQuery),
      this.executeQuery(dateRangeQuery)
    ]);

    return {
      categories: categories.map(c => c.Item_Category),
      warehouses: warehouses.map(w => ({ id: w.Warehouse_ID, name: w.Warehouse_Name })),
      dateRange: dateRange[0] || { min_date: null, max_date: null }
    };
  }
}

module.exports = { SlowMovingInventoryQueries };
