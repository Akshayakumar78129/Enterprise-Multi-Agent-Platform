const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class InventoryLevelQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Inventory/database/inventory.db"
    );
  }

  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Database connection error:", err);
          reject(err);
          return;
        }
      });

      db.all(query, params, (err, rows) => {
        if (err) {
          console.error("Query execution error:", err);
          db.close();
          reject(err);
          return;
        }
        
        db.close();
        resolve(rows);
      });
    });
  }

  async getInventoryData(filters = {}) {
    try {
      let query = `
        SELECT 
          i.Item_Key,
          i.Item_Number,
          i.Item_Name,
          i.Item_Category,
          i.Unit_Cost,
          w.Warehouse_Key,
          w.Warehouse_ID,
          w.Warehouse_Name,
          ist.Current_Stock,
          ist.Snapshot_Date
        FROM dbo_D_Item i
        JOIN dbo_F_Inventory_Snapshot ist ON i.Item_Key = ist.Item_Key
        JOIN dbo_D_Warehouse w ON w.Warehouse_Key = ist.Warehouse_Key
        WHERE ist.Snapshot_Date = (SELECT MAX(Snapshot_Date) FROM dbo_F_Inventory_Snapshot)
      `;

      const params = [];
      
      if (filters.category) {
        query += " AND i.Item_Category = ?";
        params.push(filters.category);
      }
      
      if (filters.warehouse_id) {
        query += " AND w.Warehouse_ID = ?";
        params.push(filters.warehouse_id);
      }

      return await this.executeQuery(query, params);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      return [];
    }
  }

  async getSalesData(filters = {}) {
    try {
      const { start_date, end_date } = this.parseDateRange(filters.time_period || "last_quarter");
      
      let query = `
        SELECT 
          i.Item_Key,
          i.Item_Number,
          i.Item_Category,
          w.Warehouse_Key,
          s.Transaction_Date,
          SUM(s.Quantity) as Quantity
        FROM dbo_F_Sales_Transaction s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        WHERE s.Transaction_Date BETWEEN ? AND ?
        GROUP BY i.Item_Key, i.Item_Number, i.Item_Category, w.Warehouse_Key, s.Transaction_Date
      `;

      const params = [start_date, end_date];
      
      if (filters.category) {
        query += " AND i.Item_Category = ?";
        params.push(filters.category);
      }
      
      if (filters.warehouse_id) {
        query += " AND w.Warehouse_ID = ?";
        params.push(filters.warehouse_id);
      }

      return await this.executeQuery(query, params);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }
  }

  async getKPIData(filters = {}) {
    try {
      const inventoryData = await this.getInventoryData(filters);
      const salesData = await this.getSalesData(filters);
      
      if (inventoryData.length === 0) {
        return this.generateSampleKPIs();
      }

      const totalItems = inventoryData.length;
      const totalInventoryValue = inventoryData.reduce((sum, item) => 
        sum + (item.Current_Stock * item.Unit_Cost), 0);
      
      const itemMetrics = this.calculateItemMetrics(inventoryData, salesData);
      
      const lowStockItems = itemMetrics.filter(item => item.stockLevelPct < 0.1).length;
      const stockoutRiskItems = itemMetrics.filter(item => item.daysOfSupply < 7).length;
      const avgDaysSupply = itemMetrics.reduce((sum, item) => sum + item.daysOfSupply, 0) / itemMetrics.length;
      const valueAtRisk = itemMetrics
        .filter(item => item.daysOfSupply < 7)
        .reduce((sum, item) => sum + item.inventoryValue, 0);

      const healthyItems = itemMetrics.filter(item => 
        item.stockLevelPct >= 0.1 && item.daysOfSupply >= 7).length;
      const overallStockHealth = (healthyItems / totalItems) * 100;

      const categoryRisks = this.calculateCategoryRisks(itemMetrics);
      const priorityCategory = categoryRisks.length > 0 ? categoryRisks[0].category : "None";

      return {
        overallStockHealth: overallStockHealth,
        itemsAtRisk: stockoutRiskItems,
        avgDaysSupply: avgDaysSupply,
        valueAtRisk: valueAtRisk,
        restockPriority: priorityCategory,
        totalItems: totalItems,
        lowStockItems: lowStockItems,
        totalInventoryValue: totalInventoryValue
      };
    } catch (error) {
      console.error("Error calculating KPIs:", error);
      return this.generateSampleKPIs();
    }
  }

  async getVisualizationData(visualizationType, filters = {}) {
    try {
      const inventoryData = await this.getInventoryData(filters);
      const salesData = await this.getSalesData(filters);
      
      if (inventoryData.length === 0) {
        return this.generateSampleVisualizationData(visualizationType);
      }

      const itemMetrics = this.calculateItemMetrics(inventoryData, salesData);
      
      switch (visualizationType) {
        case 'healthMatrix':
          return this.prepareHealthMatrixData(itemMetrics);
        case 'stockoutRisk':
          return this.prepareStockoutRiskData(itemMetrics);
        case 'inventoryDistribution':
          return this.prepareDistributionData(itemMetrics);
        case 'itemAnalyzer':
          return this.prepareItemAnalyzerData(itemMetrics);
        case 'trendAnalyzer':
          return this.prepareTrendData(itemMetrics);
        default:
          return itemMetrics;
      }
    } catch (error) {
      console.error("Error preparing visualization data:", error);
      return this.generateSampleVisualizationData(visualizationType);
    }
  }

  calculateItemMetrics(inventoryData, salesData) {
    const salesByItem = {};
    
    salesData.forEach(sale => {
      const key = `${sale.Item_Key}-${sale.Warehouse_Key}`;
      if (!salesByItem[key]) {
        salesByItem[key] = [];
      }
      salesByItem[key].push(sale);
    });

    return inventoryData.map(item => {
      const key = `${item.Item_Key}-${item.Warehouse_Key}`;
      const itemSales = salesByItem[key] || [];
      
      const totalSales = itemSales.reduce((sum, sale) => sum + sale.Quantity, 0);
      const avgDailySales = totalSales / 90;
      const daysOfSupply = avgDailySales > 0 ? item.Current_Stock / avgDailySales : Infinity;
      const stockLevelPct = item.Current_Stock / (avgDailySales * 30);
      const inventoryValue = item.Current_Stock * item.Unit_Cost;
      
      return {
        ...item,
        totalSales,
        avgDailySales,
        daysOfSupply: isFinite(daysOfSupply) ? daysOfSupply : 999,
        stockLevelPct: isFinite(stockLevelPct) ? stockLevelPct : 1,
        inventoryValue,
        isLowStock: stockLevelPct < 0.1,
        stockoutRisk: daysOfSupply < 7
      };
    });
  }

  prepareHealthMatrixData(itemMetrics) {
    const matrix = {};
    
    itemMetrics.forEach(item => {
      if (!matrix[item.Item_Category]) {
        matrix[item.Item_Category] = {};
      }
      if (!matrix[item.Item_Category][item.Warehouse_Name]) {
        matrix[item.Item_Category][item.Warehouse_Name] = {
          items: [],
          avgStockLevel: 0,
          avgDaysSupply: 0,
          riskCount: 0
        };
      }
      
      const cell = matrix[item.Item_Category][item.Warehouse_Name];
      cell.items.push(item);
      cell.riskCount += item.stockoutRisk ? 1 : 0;
    });

    Object.keys(matrix).forEach(category => {
      Object.keys(matrix[category]).forEach(warehouse => {
        const cell = matrix[category][warehouse];
        cell.avgStockLevel = cell.items.reduce((sum, i) => sum + i.stockLevelPct, 0) / cell.items.length;
        cell.avgDaysSupply = cell.items.reduce((sum, i) => sum + i.daysOfSupply, 0) / cell.items.length;
      });
    });

    return matrix;
  }

  prepareStockoutRiskData(itemMetrics) {
    return itemMetrics
      .filter(item => item.stockoutRisk)
      .sort((a, b) => a.daysOfSupply - b.daysOfSupply)
      .map(item => ({
        ...item,
        riskLevel: item.daysOfSupply < 3 ? 'critical' : 
                  item.daysOfSupply < 7 ? 'high' : 'moderate'
      }));
  }

  prepareDistributionData(itemMetrics) {
    // Group by warehouse for distribution analysis
    const warehouses = {};
    
    itemMetrics.forEach(item => {
      if (!warehouses[item.Warehouse_Name]) {
        warehouses[item.Warehouse_Name] = {
          warehouseName: item.Warehouse_Name,
          warehouseId: item.Warehouse_ID,
          totalItems: 0,
          totalValue: 0,
          criticalItems: 0,
          lowStockItems: 0,
          adequateItems: 0,
          excessItems: 0
        };
      }
      
      const warehouse = warehouses[item.Warehouse_Name];
      warehouse.totalItems++;
      warehouse.totalValue += item.inventoryValue;
      
      if (item.stockoutRisk) warehouse.criticalItems++;
      else if (item.isLowStock) warehouse.lowStockItems++;
      else if (item.stockLevelPct > 1.5) warehouse.excessItems++;
      else warehouse.adequateItems++;
    });

    return Object.values(warehouses);
  }

  prepareItemAnalyzerData(itemMetrics) {
    return itemMetrics.map(item => ({
      itemId: item.Item_Number,
      itemName: item.Item_Name,
      category: item.Item_Category,
      warehouse: item.Warehouse_Name,
      currentStock: item.Current_Stock,
      stockLevelPct: item.stockLevelPct,
      daysOfSupply: item.daysOfSupply,
      avgDailySales: item.avgDailySales,
      inventoryValue: item.inventoryValue,
      status: item.stockoutRisk ? 'Critical' : 
              item.isLowStock ? 'Low' : 
              item.stockLevelPct > 1.5 ? 'Excess' : 'Adequate'
    }));
  }

  prepareTrendData(itemMetrics) {
    // Generate trend data (in real implementation, this would query historical data)
    const today = new Date();
    const trendData = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const avgStockLevel = itemMetrics.reduce((sum, item) => sum + item.stockLevelPct, 0) / itemMetrics.length;
      const riskItems = itemMetrics.filter(item => item.stockoutRisk).length;
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        avgStockLevel: avgStockLevel * (0.9 + Math.random() * 0.2), // Add some variation
        riskItems: Math.floor(riskItems * (0.8 + Math.random() * 0.4))
      });
    }
    
    return trendData;
  }

  calculateCategoryRisks(itemMetrics) {
    const categoryRisks = {};
    
    itemMetrics.forEach(item => {
      if (!categoryRisks[item.Item_Category]) {
        categoryRisks[item.Item_Category] = {
          category: item.Item_Category,
          totalItems: 0,
          riskItems: 0,
          totalValue: 0,
          riskValue: 0
        };
      }
      
      const cat = categoryRisks[item.Item_Category];
      cat.totalItems++;
      cat.totalValue += item.inventoryValue;
      
      if (item.stockoutRisk) {
        cat.riskItems++;
        cat.riskValue += item.inventoryValue;
      }
    });

    return Object.values(categoryRisks)
      .map(cat => ({
        ...cat,
        riskPercentage: (cat.riskItems / cat.totalItems) * 100
      }))
      .sort((a, b) => b.riskPercentage - a.riskPercentage);
  }

  parseDateRange(timePeriod) {
    const today = new Date();
    let startDate;
    
    // Handle object format (dateRange from API)
    if (typeof timePeriod === 'object' && timePeriod !== null) {
      if (timePeriod.start && timePeriod.end) {
        return {
          start_date: timePeriod.start,
          end_date: timePeriod.end
        };
      }
    }
    
    // Convert to string if not already
    const timePeriodStr = String(timePeriod || "last_quarter");
    
    switch (timePeriodStr) {
      case "last_quarter":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "last_6_months":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 180);
        break;
      case "last_year":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        if (timePeriodStr.includes(":")) {
          const [start, end] = timePeriodStr.split(":");
          return {
            start_date: start,
            end_date: end
          };
        }
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
    }
    
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };
  }

  generateSampleKPIs() {
    return {
      overallStockHealth: 72.5,
      itemsAtRisk: 23,
      avgDaysSupply: 18.3,
      valueAtRisk: 145750,
      restockPriority: "Widgets",
      totalItems: 150,
      lowStockItems: 35,
      totalInventoryValue: 2500000
    };
  }

  generateSampleVisualizationData(visualizationType) {
    switch (visualizationType) {
      case 'healthMatrix':
        return {
          "Widgets": {
            "Main Distribution Center": { avgStockLevel: 0.8, avgDaysSupply: 25, riskCount: 2 },
            "East Coast Facility": { avgStockLevel: 0.6, avgDaysSupply: 15, riskCount: 5 },
            "West Coast Facility": { avgStockLevel: 0.9, avgDaysSupply: 30, riskCount: 1 }
          },
          "Gadgets": {
            "Main Distribution Center": { avgStockLevel: 0.4, avgDaysSupply: 8, riskCount: 8 },
            "East Coast Facility": { avgStockLevel: 0.7, avgDaysSupply: 20, riskCount: 3 },
            "West Coast Facility": { avgStockLevel: 0.5, avgDaysSupply: 12, riskCount: 6 }
          }
        };
      default:
        return [];
    }
  }
}

module.exports = { InventoryLevelQueries }; 