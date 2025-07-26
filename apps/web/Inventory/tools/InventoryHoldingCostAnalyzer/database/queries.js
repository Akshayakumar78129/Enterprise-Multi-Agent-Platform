const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class InventoryHoldingCostQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Inventory/database/inventory.db"
    );
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
      annualHoldingCostPercentage = 0.25,
      opportunityCostRate = 0.08
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

    const query = `
      SELECT 
        i.Item_Key,
        i.Item_Number,
        i.Item_Name,
        i.Item_Category,
        i.Unit_Cost,
        w.Warehouse_Key,
        w.Warehouse_ID,
        w.Warehouse_Name,
        w.Storage_Cost_Per_Unit,
        w.Warehouse_Type,
        ist.Current_Stock,
        ist.Average_Stock_Level,
        ist.Snapshot_Date,
        i.Lead_Time_Days,
        i.Obsolescence_Risk,
        i.Storage_Requirements,
        -- Calculated fields
        (ist.Average_Stock_Level * i.Unit_Cost) as Average_Inventory_Value,
        (ist.Average_Stock_Level * i.Unit_Cost * ?) as Annual_Holding_Cost,
        (ist.Average_Stock_Level * i.Unit_Cost * ?) as Annual_Opportunity_Cost,
        (ist.Average_Stock_Level * w.Storage_Cost_Per_Unit * 365) as Annual_Storage_Cost,
        (ist.Average_Stock_Level * i.Unit_Cost * i.Obsolescence_Risk) as Annual_Risk_Cost
      FROM dbo_D_Item i
      JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
      JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
      ${whereClause}
      ORDER BY (ist.Average_Stock_Level * i.Unit_Cost) DESC
    `;

    params.unshift(annualHoldingCostPercentage, opportunityCostRate);
    return await this.executeQuery(query, params);
  }

  async getKPIData(filters = {}) {
    const mainData = await this.getMainData(filters);
    
    if (mainData.length === 0) {
      return {
        totalHoldingCost: 0,
        holdingCostPercentage: 0,
        excessiveCostItems: 0,
        potentialSavings: 0,
        topCostDriver: 'N/A'
      };
    }

    // Calculate enhanced holding cost metrics
    const calculations = mainData.map(item => {
      const totalHoldingCost = 
        item.Annual_Holding_Cost + 
        item.Annual_Opportunity_Cost + 
        item.Annual_Storage_Cost + 
        item.Annual_Risk_Cost;
      
      const holdingCostPercentage = item.Average_Inventory_Value > 0 
        ? totalHoldingCost / item.Average_Inventory_Value 
        : 0;
      
      const isExcessive = holdingCostPercentage > 0.3;
      const potentialSavings = isExcessive 
        ? totalHoldingCost - (item.Average_Inventory_Value * 0.3) 
        : 0;

      return {
        ...item,
        Total_Holding_Cost: totalHoldingCost,
        Holding_Cost_Percentage: holdingCostPercentage,
        Is_Excessive: isExcessive,
        Potential_Savings: potentialSavings
      };
    });

    const totalInventoryValue = calculations.reduce((sum, item) => sum + item.Average_Inventory_Value, 0);
    const totalHoldingCost = calculations.reduce((sum, item) => sum + item.Total_Holding_Cost, 0);
    const excessiveItems = calculations.filter(item => item.Is_Excessive);
    const potentialSavings = calculations.reduce((sum, item) => sum + item.Potential_Savings, 0);

    // Identify top cost driver
    const componentTotals = {
      'Capital Cost': calculations.reduce((sum, item) => sum + item.Annual_Holding_Cost, 0),
      'Opportunity Cost': calculations.reduce((sum, item) => sum + item.Annual_Opportunity_Cost, 0),
      'Storage Cost': calculations.reduce((sum, item) => sum + item.Annual_Storage_Cost, 0),
      'Risk Cost': calculations.reduce((sum, item) => sum + item.Annual_Risk_Cost, 0)
    };

    const topCostDriver = Object.entries(componentTotals)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      totalHoldingCost,
      holdingCostPercentage: totalInventoryValue > 0 ? totalHoldingCost / totalInventoryValue : 0,
      excessiveCostItems: excessiveItems.length,
      potentialSavings,
      topCostDriver,
      totalInventoryValue,
      componentTotals
    };
  }

  async getCostBreakdownData(filters = {}) {
    const mainData = await this.getMainData(filters);
    
    const breakdown = {
      byComponent: {},
      byCategory: {},
      byWarehouse: {},
      overall: {
        totalCapitalCost: 0,
        totalOpportunityCost: 0,
        totalStorageCost: 0,
        totalRiskCost: 0,
        totalValue: 0
      }
    };

    mainData.forEach(item => {
      const totalHoldingCost = 
        item.Annual_Holding_Cost + 
        item.Annual_Opportunity_Cost + 
        item.Annual_Storage_Cost + 
        item.Annual_Risk_Cost;

      // Component breakdown
      breakdown.byComponent['Capital Cost'] = (breakdown.byComponent['Capital Cost'] || 0) + item.Annual_Holding_Cost;
      breakdown.byComponent['Opportunity Cost'] = (breakdown.byComponent['Opportunity Cost'] || 0) + item.Annual_Opportunity_Cost;
      breakdown.byComponent['Storage Cost'] = (breakdown.byComponent['Storage Cost'] || 0) + item.Annual_Storage_Cost;
      breakdown.byComponent['Risk Cost'] = (breakdown.byComponent['Risk Cost'] || 0) + item.Annual_Risk_Cost;

      // Category breakdown
      if (!breakdown.byCategory[item.Item_Category]) {
        breakdown.byCategory[item.Item_Category] = {
          totalCost: 0,
          totalValue: 0,
          itemCount: 0,
          components: {
            capital: 0,
            opportunity: 0,
            storage: 0,
            risk: 0
          }
        };
      }
      breakdown.byCategory[item.Item_Category].totalCost += totalHoldingCost;
      breakdown.byCategory[item.Item_Category].totalValue += item.Average_Inventory_Value;
      breakdown.byCategory[item.Item_Category].itemCount += 1;
      breakdown.byCategory[item.Item_Category].components.capital += item.Annual_Holding_Cost;
      breakdown.byCategory[item.Item_Category].components.opportunity += item.Annual_Opportunity_Cost;
      breakdown.byCategory[item.Item_Category].components.storage += item.Annual_Storage_Cost;
      breakdown.byCategory[item.Item_Category].components.risk += item.Annual_Risk_Cost;

      // Warehouse breakdown
      if (!breakdown.byWarehouse[item.Warehouse_ID]) {
        breakdown.byWarehouse[item.Warehouse_ID] = {
          warehouseName: item.Warehouse_Name,
          warehouseType: item.Warehouse_Type,
          totalCost: 0,
          totalValue: 0,
          itemCount: 0,
          components: {
            capital: 0,
            opportunity: 0,
            storage: 0,
            risk: 0
          }
        };
      }
      breakdown.byWarehouse[item.Warehouse_ID].totalCost += totalHoldingCost;
      breakdown.byWarehouse[item.Warehouse_ID].totalValue += item.Average_Inventory_Value;
      breakdown.byWarehouse[item.Warehouse_ID].itemCount += 1;
      breakdown.byWarehouse[item.Warehouse_ID].components.capital += item.Annual_Holding_Cost;
      breakdown.byWarehouse[item.Warehouse_ID].components.opportunity += item.Annual_Opportunity_Cost;
      breakdown.byWarehouse[item.Warehouse_ID].components.storage += item.Annual_Storage_Cost;
      breakdown.byWarehouse[item.Warehouse_ID].components.risk += item.Annual_Risk_Cost;

      // Overall totals
      breakdown.overall.totalCapitalCost += item.Annual_Holding_Cost;
      breakdown.overall.totalOpportunityCost += item.Annual_Opportunity_Cost;
      breakdown.overall.totalStorageCost += item.Annual_Storage_Cost;
      breakdown.overall.totalRiskCost += item.Annual_Risk_Cost;
      breakdown.overall.totalValue += item.Average_Inventory_Value;
    });

    return breakdown;
  }

  async getExcessiveCostItems(filters = {}) {
    const mainData = await this.getMainData(filters);
    const threshold = filters.excessiveThreshold || 0.3;
    
    const excessiveItems = mainData.map(item => {
      const totalHoldingCost = 
        item.Annual_Holding_Cost + 
        item.Annual_Opportunity_Cost + 
        item.Annual_Storage_Cost + 
        item.Annual_Risk_Cost;
      
      const holdingCostPercentage = item.Average_Inventory_Value > 0 
        ? totalHoldingCost / item.Average_Inventory_Value 
        : 0;
      
      const isExcessive = holdingCostPercentage > threshold;
      const potentialSavings = isExcessive 
        ? totalHoldingCost - (item.Average_Inventory_Value * threshold) 
        : 0;

      return {
        ...item,
        Total_Holding_Cost: totalHoldingCost,
        Holding_Cost_Percentage: holdingCostPercentage,
        Is_Excessive: isExcessive,
        Potential_Savings: potentialSavings,
        Severity: holdingCostPercentage > 0.4 ? 'High' : 
                 holdingCostPercentage > 0.35 ? 'Medium' : 'Low'
      };
    }).filter(item => item.Is_Excessive)
      .sort((a, b) => b.Total_Holding_Cost - a.Total_Holding_Cost);

    return excessiveItems;
  }

  async getTrendData(filters = {}) {
    // For now, we'll simulate trend data since we don't have historical snapshots
    // In a real implementation, this would query multiple time periods
    const baseQuery = `
      SELECT 
        ist.Snapshot_Date,
        SUM(ist.Average_Stock_Level * i.Unit_Cost) as Total_Inventory_Value,
        COUNT(*) as Item_Count
      FROM dbo_D_Item i
      JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
      JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
      GROUP BY ist.Snapshot_Date
      ORDER BY ist.Snapshot_Date
    `;

    const trendData = await this.executeQuery(baseQuery);
    
    // Calculate holding costs for each period
    const enhancedTrendData = trendData.map(period => {
      const estimatedHoldingCost = period.Total_Inventory_Value * (filters.annualHoldingCostPercentage || 0.25);
      return {
        ...period,
        Estimated_Holding_Cost: estimatedHoldingCost,
        Holding_Cost_Percentage: period.Total_Inventory_Value > 0 
          ? estimatedHoldingCost / period.Total_Inventory_Value 
          : 0
      };
    });

    return enhancedTrendData;
  }

  async getCostSavingOpportunities(filters = {}) {
    const excessiveItems = await this.getExcessiveCostItems(filters);
    
    const opportunities = excessiveItems.map(item => {
      // Calculate implementation difficulty based on various factors
      let difficulty = 1; // Base difficulty
      
      // Increase difficulty for high-value items
      if (item.Average_Inventory_Value > 50000) difficulty += 1;
      
      // Increase difficulty for items with special storage requirements
      if (item.Storage_Requirements !== 'Standard') difficulty += 1;
      
      // Increase difficulty for items with long lead times
      if (item.Lead_Time_Days > 14) difficulty += 1;
      
      // Increase difficulty for high obsolescence risk items
      if (item.Obsolescence_Risk > 0.2) difficulty += 1;
      
      difficulty = Math.min(difficulty, 5); // Cap at 5

      return {
        itemNumber: item.Item_Number,
        itemName: item.Item_Name,
        category: item.Item_Category,
        warehouse: item.Warehouse_Name,
        inventoryValue: item.Average_Inventory_Value,
        currentHoldingCost: item.Total_Holding_Cost,
        holdingCostPercentage: item.Holding_Cost_Percentage,
        potentialSavings: item.Potential_Savings,
        implementationDifficulty: difficulty,
        severity: item.Severity,
        primaryCostDriver: this.identifyPrimaryCostDriver(item),
        recommendedActions: this.generateRecommendedActions(item, difficulty)
      };
    });

    return opportunities.sort((a, b) => {
      // Sort by impact/difficulty ratio
      const aRatio = a.potentialSavings / a.implementationDifficulty;
      const bRatio = b.potentialSavings / b.implementationDifficulty;
      return bRatio - aRatio;
    });
  }

  identifyPrimaryCostDriver(item) {
    const costs = {
      'Capital Cost': item.Annual_Holding_Cost,
      'Opportunity Cost': item.Annual_Opportunity_Cost,
      'Storage Cost': item.Annual_Storage_Cost,
      'Risk Cost': item.Annual_Risk_Cost
    };
    
    return Object.entries(costs)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  generateRecommendedActions(item, difficulty) {
    const actions = [];
    
    if (item.Annual_Holding_Cost > item.Annual_Storage_Cost) {
      actions.push("Reduce inventory levels through better demand forecasting");
    }
    
    if (item.Annual_Storage_Cost > 1000) {
      actions.push("Consider alternative storage solutions or warehouse optimization");
    }
    
    if (item.Obsolescence_Risk > 0.15) {
      actions.push("Implement markdown or liquidation strategy");
    }
    
    if (item.Lead_Time_Days > 21) {
      actions.push("Work with suppliers to reduce lead times");
    }
    
    if (difficulty <= 2) {
      actions.push("Quick implementation - prioritize for immediate action");
    }
    
    return actions;
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

module.exports = { InventoryHoldingCostQueries }; 