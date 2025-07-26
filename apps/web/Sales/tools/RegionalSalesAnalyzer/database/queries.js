const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class RegionalSalesAnalyzerQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error("Database query error:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
      
      db.close();
    });
  }

  async getRegionalSalesData(filters = {}) {
    try {
      const { dateRange, country, state, region } = filters;
      
      let whereConditions = ["t.[Deleted Flag] = 0"];
      const params = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        whereConditions.push("t.[Txn Date] BETWEEN ? AND ?");
        params.push(dateRange.start, dateRange.end);
      }
      
      if (country) {
        whereConditions.push("c.[Customer Country] = ?");
        params.push(country);
      }
      
      if (state) {
        whereConditions.push("c.[Customer State/Prov] = ?");
        params.push(state);
      }

      const query = `
        SELECT 
          c.[Customer Country] as country,
          c.[Customer State/Prov] as state,
          ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
          ROUND(SUM(t.[Net Sales Amount]), 2) as netSales,
          ROUND(SUM(t.[Sales Quantity]), 2) as totalQuantity,
          ROUND(SUM(t.[Gross Profit Amount]), 2) as grossProfit,
          COUNT(DISTINCT t.[Customer Key]) as customerCount,
          COUNT(*) as transactionCount,
          ROUND(AVG(t.[Sales Amount]), 2) as avgSalesAmount,
          MIN(t.[Txn Date]) as firstSaleDate,
          MAX(t.[Txn Date]) as lastSaleDate
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY c.[Customer Country], c.[Customer State/Prov]
        ORDER BY totalSales DESC
      `;

      const results = await this.runQuery(query, params);
      return results;
    } catch (error) {
      console.error("Error fetching regional sales data:", error);
      throw error;
    }
  }

  async getCountryLevelData(filters = {}) {
    try {
      const { dateRange } = filters;
      
      let whereConditions = ["t.[Deleted Flag] = 0"];
      const params = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        whereConditions.push("t.[Txn Date] BETWEEN ? AND ?");
        params.push(dateRange.start, dateRange.end);
      }

      const query = `
        SELECT 
          c.[Customer Country] as country,
          ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
          ROUND(SUM(t.[Net Sales Amount]), 2) as netSales,
          ROUND(SUM(t.[Sales Quantity]), 2) as totalQuantity,
          ROUND(SUM(t.[Gross Profit Amount]), 2) as grossProfit,
          ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as profitMargin,
          COUNT(DISTINCT t.[Customer Key]) as customerCount,
          COUNT(*) as transactionCount,
          COUNT(DISTINCT c.[Customer State/Prov]) as stateCount
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY c.[Customer Country]
        ORDER BY totalSales DESC
      `;

      const results = await this.runQuery(query, params);
      return results;
    } catch (error) {
      console.error("Error fetching country level data:", error);
      throw error;
    }
  }

  async getTimeSeriesData(filters = {}) {
    try {
      const { dateRange, country, state, aggregation = 'month' } = filters;
      
      let dateFormat;
      let periodExpression;
      switch (aggregation) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          periodExpression = `strftime('${dateFormat}', t.[Txn Date])`;
          break;
        case 'week':
          dateFormat = '%Y-W%W';
          periodExpression = `strftime('${dateFormat}', t.[Txn Date])`;
          break;
        case 'quarter':
          periodExpression = `strftime('%Y', t.[Txn Date]) || '-Q' || (CASE WHEN CAST(strftime('%m', t.[Txn Date]) AS INTEGER) <= 3 THEN '1' WHEN CAST(strftime('%m', t.[Txn Date]) AS INTEGER) <= 6 THEN '2' WHEN CAST(strftime('%m', t.[Txn Date]) AS INTEGER) <= 9 THEN '3' ELSE '4' END)`;
          break;
        default: // month
          dateFormat = '%Y-%m';
          periodExpression = `strftime('${dateFormat}', t.[Txn Date])`;
      }
      
      let whereConditions = ["t.[Deleted Flag] = 0"];
      const params = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        whereConditions.push("t.[Txn Date] BETWEEN ? AND ?");
        params.push(dateRange.start, dateRange.end);
      }
      
      if (country) {
        whereConditions.push("c.[Customer Country] = ?");
        params.push(country);
      }
      
      if (state) {
        whereConditions.push("c.[Customer State/Prov] = ?");
        params.push(state);
      }

      const query = `
        SELECT 
          ${periodExpression} as period,
          c.[Customer Country] as country,
          c.[Customer State/Prov] as state,
          ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
          ROUND(SUM(t.[Net Sales Amount]), 2) as netSales,
          ROUND(SUM(t.[Sales Quantity]), 2) as totalQuantity,
          ROUND(SUM(t.[Gross Profit Amount]), 2) as grossProfit,
          COUNT(DISTINCT t.[Customer Key]) as customerCount,
          COUNT(*) as transactionCount
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY ${periodExpression}, c.[Customer Country], c.[Customer State/Prov]
        ORDER BY period ASC, totalSales DESC
      `;

      const results = await this.runQuery(query, params);
      return results;
    } catch (error) {
      console.error("Error fetching time series data:", error);
      throw error;
    }
  }

  async getRegionalKPIs(filters = {}) {
    try {
      const { dateRange } = filters;
      
      let whereConditions = ["t.[Deleted Flag] = 0"];
      const params = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        whereConditions.push("t.[Txn Date] BETWEEN ? AND ?");
        params.push(dateRange.start, dateRange.end);
      }

      // Calculate current period KPIs
      const currentQuery = `
        SELECT 
          ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
          COUNT(DISTINCT c.[Customer Country]) as countryCount,
          COUNT(DISTINCT c.[Customer State/Prov]) as stateCount,
          COUNT(DISTINCT t.[Customer Key]) as customerCount,
          ROUND(AVG(t.[Sales Amount]), 2) as avgTransactionValue,
          c.[Customer Country] as topCountry,
          c.[Customer State/Prov] as topState,
          MAX(countrySales.countrySalesAmount) as topCountrySales,
          MAX(stateSales.stateSalesAmount) as topStateSales
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        LEFT JOIN (
          SELECT 
            c2.[Customer Country],
            SUM(t2.[Sales Amount]) as countrySalesAmount
          FROM dbo_F_Sales_Transaction t2
          JOIN dbo_D_Customer c2 ON t2.[Customer Key] = c2.[Customer Key]
          WHERE ${whereConditions.join(" AND ").replace(/t\./g, 't2.')}
          GROUP BY c2.[Customer Country]
        ) countrySales ON c.[Customer Country] = countrySales.[Customer Country]
        LEFT JOIN (
          SELECT 
            c3.[Customer State/Prov],
            SUM(t3.[Sales Amount]) as stateSalesAmount
          FROM dbo_F_Sales_Transaction t3
          JOIN dbo_D_Customer c3 ON t3.[Customer Key] = c3.[Customer Key]
          WHERE ${whereConditions.join(" AND ").replace(/t\./g, 't3.')}
          GROUP BY c3.[Customer State/Prov]
        ) stateSales ON c.[Customer State/Prov] = stateSales.[Customer State/Prov]
        WHERE ${whereConditions.join(" AND ")}
      `;

      const kpiResults = await this.runQuery(currentQuery, params);
      
      // Get top performing regions
      const topRegionsQuery = `
        SELECT 
          c.[Customer Country] as country,
          c.[Customer State/Prov] as state,
          ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
          ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as profitMargin
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY c.[Customer Country], c.[Customer State/Prov]
        ORDER BY totalSales DESC
        LIMIT 5
      `;

      const topRegions = await this.runQuery(topRegionsQuery, params);

      // Calculate growth rate if date range allows
      let growthRate = null;
      if (dateRange && dateRange.start && dateRange.end) {
        // Calculate previous period for comparison
        const currentStart = new Date(dateRange.start);
        const currentEnd = new Date(dateRange.end);
        const periodLength = currentEnd - currentStart;
        const previousStart = new Date(currentStart.getTime() - periodLength);
        const previousEnd = new Date(currentStart.getTime() - 1);

        const previousQuery = `
          SELECT ROUND(SUM(t.[Sales Amount]), 2) as previousSales
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 
          AND t.[Txn Date] BETWEEN ? AND ?
        `;

        const previousResults = await this.runQuery(previousQuery, [
          previousStart.toISOString().split('T')[0],
          previousEnd.toISOString().split('T')[0]
        ]);

        if (previousResults.length > 0 && previousResults[0].previousSales > 0) {
          const currentSales = kpiResults[0]?.totalSales || 0;
          const previousSales = previousResults[0].previousSales;
          growthRate = ((currentSales - previousSales) / previousSales * 100).toFixed(2);
        }
      }

      return {
        totalSales: kpiResults[0]?.totalSales || 0,
        countryCount: kpiResults[0]?.countryCount || 0,
        stateCount: kpiResults[0]?.stateCount || 0,
        customerCount: kpiResults[0]?.customerCount || 0,
        avgTransactionValue: kpiResults[0]?.avgTransactionValue || 0,
        growthRate: growthRate,
        topRegions: topRegions
      };
    } catch (error) {
      console.error("Error fetching regional KPIs:", error);
      throw error;
    }
  }

  async getOpportunityAnalysis(filters = {}) {
    try {
      const { dateRange } = filters;
      
      let whereConditions = ["t.[Deleted Flag] = 0"];
      const params = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        whereConditions.push("t.[Txn Date] BETWEEN ? AND ?");
        params.push(dateRange.start, dateRange.end);
      }

      const query = `
        WITH RegionalMetrics AS (
          SELECT 
            c.[Customer Country] as country,
            c.[Customer State/Prov] as state,
            ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
            ROUND(SUM(t.[Gross Profit Amount]), 2) as grossProfit,
            COUNT(DISTINCT t.[Customer Key]) as customerCount,
            COUNT(*) as transactionCount,
            ROUND(AVG(t.[Sales Amount]), 2) as avgTransactionValue
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE ${whereConditions.join(" AND ")}
          GROUP BY c.[Customer Country], c.[Customer State/Prov]
        ),
        Statistics AS (
          SELECT 
            AVG(totalSales) as avgSales,
            AVG(customerCount) as avgCustomers,
            AVG(avgTransactionValue) as avgTxnValue
          FROM RegionalMetrics
        )
        SELECT 
          rm.*,
          CASE 
            WHEN rm.totalSales > s.avgSales AND rm.customerCount > s.avgCustomers THEN 'Star Region'
            WHEN rm.totalSales <= s.avgSales AND rm.customerCount > s.avgCustomers THEN 'Growth Opportunity'
            WHEN rm.totalSales > s.avgSales AND rm.customerCount <= s.avgCustomers THEN 'Cash Cow'
            ELSE 'Focus Area'
          END as opportunityCategory,
          ROUND((rm.totalSales / s.avgSales - 1) * 100, 2) as salesVsAvg,
          ROUND((rm.customerCount / s.avgCustomers - 1) * 100, 2) as customersVsAvg,
          ROUND(rm.grossProfit / NULLIF(rm.totalSales, 0) * 100, 2) as profitMargin
        FROM RegionalMetrics rm
        CROSS JOIN Statistics s
        ORDER BY rm.totalSales DESC
      `;

      const results = await this.runQuery(query, params);
      return results;
    } catch (error) {
      console.error("Error fetching opportunity analysis:", error);
      throw error;
    }
  }

  async getRegionalComparison(filters = {}) {
    try {
      const { dateRange, compareRegions = [] } = filters;
      
      let whereConditions = ["t.[Deleted Flag] = 0"];
      const params = [];
      
      if (dateRange && dateRange.start && dateRange.end) {
        whereConditions.push("t.[Txn Date] BETWEEN ? AND ?");
        params.push(dateRange.start, dateRange.end);
      }

      // If specific regions are requested for comparison
      if (compareRegions.length > 0) {
        const regionPlaceholders = compareRegions.map(() => '?').join(',');
        whereConditions.push(`(c.[Customer Country] IN (${regionPlaceholders}) OR c.[Customer State/Prov] IN (${regionPlaceholders}))`);
        params.push(...compareRegions, ...compareRegions);
      }

      const query = `
        SELECT 
          c.[Customer Country] as country,
          c.[Customer State/Prov] as state,
          ROUND(SUM(t.[Sales Amount]), 2) as totalSales,
          ROUND(SUM(t.[Net Sales Amount]), 2) as netSales,
          ROUND(SUM(t.[Sales Quantity]), 2) as totalQuantity,
          ROUND(SUM(t.[Gross Profit Amount]), 2) as grossProfit,
          ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as profitMargin,
          COUNT(DISTINCT t.[Customer Key]) as customerCount,
          COUNT(*) as transactionCount,
          ROUND(AVG(t.[Sales Amount]), 2) as avgTransactionValue
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY c.[Customer Country], c.[Customer State/Prov]
        ORDER BY totalSales DESC
      `;

      const results = await this.runQuery(query, params);
      return results;
    } catch (error) {
      console.error("Error fetching regional comparison:", error);
      throw error;
    }
  }

  async getAvailableRegions() {
    try {
      const query = `
        SELECT DISTINCT 
          c.[Customer Country] as country,
          c.[Customer State/Prov] as state
        FROM dbo_D_Customer c
        WHERE c.[Customer Country] IS NOT NULL 
        AND c.[Customer State/Prov] IS NOT NULL
        AND c.[Deleted Flag] = 0
        ORDER BY c.[Customer Country], c.[Customer State/Prov]
      `;

      const results = await this.runQuery(query);
      return results;
    } catch (error) {
      console.error("Error fetching available regions:", error);
      throw error;
    }
  }
}

module.exports = { RegionalSalesAnalyzerQueries }; 