/**
 * Database Manager for Regional Sales Chatbot
 * Handles database connections and queries for regional sales analysis
 */

import Database from 'better-sqlite3';
import path from 'path';

class RegionalSalesDatabaseManager {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), '../../../Customer/database/customers.db');
    this.db = null;
  }

  /**
   * Connect to the database
   */
  async connect() {
    try {
      console.log(`🔌 Connecting to regional sales database: ${this.dbPath}`);
      this.db = new Database(this.dbPath, { readonly: true });
      console.log('✅ Connected to regional sales database');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Get top performing regions
   */
  async getTopRegions(limit = 5) {
    try {
      const query = `
        SELECT 
          c.[Customer State/Prov] as state,
          c.[Customer Country] as country,
          ROUND(SUM(t.[Sales Amount]), 2) as total_sales,
          COUNT(DISTINCT t.[Customer Key]) as customer_count,
          COUNT(*) as transaction_count,
          ROUND(AVG(t.[Sales Amount]), 2) as avg_order_value,
          ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as avg_profit_margin
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
        GROUP BY c.[Customer State/Prov], c.[Customer Country]
        ORDER BY total_sales DESC
        LIMIT ?
      `;
      
      const results = this.db.prepare(query).all(limit);
      return results;
    } catch (error) {
      console.error('❌ Error getting top regions:', error);
      return [];
    }
  }

  /**
   * Get regional KPIs
   */
  async getRegionalKPIs() {
    try {
      const query = `
        SELECT 
          ROUND(SUM(t.[Sales Amount]), 2) as total_revenue,
          COUNT(DISTINCT t.[Customer Key]) as total_customers,
          COUNT(*) as total_transactions,
          COUNT(DISTINCT c.[Customer Country]) as unique_countries,
          COUNT(DISTINCT c.[Customer State/Prov]) as unique_states,
          ROUND(AVG(t.[Sales Amount]), 2) as avg_order_value,
          ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as avg_profit_margin
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
      `;
      
      const result = this.db.prepare(query).get();
      
      // Calculate concentration ratio (top 5 regions)
      const concentrationQuery = `
        WITH regional_sales AS (
          SELECT 
            c.[Customer State/Prov] as state,
            c.[Customer Country] as country,
            SUM(t.[Sales Amount]) as region_sales
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer State/Prov], c.[Customer Country]
          ORDER BY region_sales DESC
          LIMIT 5
        )
        SELECT 
          SUM(region_sales) as top5_sales,
          (SELECT SUM(t.[Sales Amount]) FROM dbo_F_Sales_Transaction t WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0) as total_sales
        FROM regional_sales
      `;
      
      const concentrationResult = this.db.prepare(concentrationQuery).get();
      const concentrationRatio = concentrationResult.total_sales > 0 
        ? Math.round((concentrationResult.top5_sales / concentrationResult.total_sales) * 100)
        : 0;
      
      return {
        ...result,
        concentrationRatio,
        growthOpportunities: await this.countGrowthOpportunities()
      };
    } catch (error) {
      console.error('❌ Error getting regional KPIs:', error);
      return {};
    }
  }

  /**
   * Get growth opportunities
   */
  async getGrowthOpportunities() {
    try {
      const query = `
        WITH regional_performance AS (
          SELECT 
            c.[Customer State/Prov] as state,
            c.[Customer Country] as country,
            ROUND(SUM(t.[Sales Amount]), 2) as total_sales,
            COUNT(DISTINCT t.[Customer Key]) as customer_count,
            ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as avg_profit_margin,
            COUNT(*) as transaction_count
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer State/Prov], c.[Customer Country]
        ),
        performance_stats AS (
          SELECT 
            AVG(total_sales) as avg_sales,
            AVG(customer_count) as avg_customers
          FROM regional_performance
        )
        SELECT 
          rp.*,
          CASE 
            WHEN rp.total_sales < ps.avg_sales AND rp.avg_profit_margin > 10 
            THEN 'Growth Opportunity'
            WHEN rp.customer_count < ps.avg_customers 
            THEN 'Customer Acquisition'
            ELSE 'Stable Market'
          END as opportunity_category
        FROM regional_performance rp
        CROSS JOIN performance_stats ps
        WHERE rp.total_sales < ps.avg_sales * 1.5
        ORDER BY rp.avg_profit_margin DESC, rp.total_sales ASC
        LIMIT 10
      `;
      
      const results = this.db.prepare(query).all();
      return results;
    } catch (error) {
      console.error('❌ Error getting growth opportunities:', error);
      return [];
    }
  }

  /**
   * Count growth opportunities
   */
  async countGrowthOpportunities() {
    try {
      const query = `
        WITH regional_performance AS (
          SELECT 
            c.[Customer State/Prov] as state,
            c.[Customer Country] as country,
            SUM(t.[Sales Amount]) as total_sales,
            ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) as avg_profit_margin
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer State/Prov], c.[Customer Country]
        ),
        performance_stats AS (
          SELECT AVG(total_sales) as avg_sales FROM regional_performance
        )
        SELECT COUNT(*) as opportunity_count
        FROM regional_performance rp
        CROSS JOIN performance_stats ps
        WHERE rp.total_sales < ps.avg_sales AND rp.avg_profit_margin > 10
      `;
      
      const result = this.db.prepare(query).get();
      return result.opportunity_count || 0;
    } catch (error) {
      console.error('❌ Error counting growth opportunities:', error);
      return 0;
    }
  }

  /**
   * Get market concentration analysis
   */
  async getMarketConcentration() {
    try {
      const query = `
        WITH regional_sales AS (
          SELECT 
            state,
            country,
            SUM(sales_amount) as region_sales,
            RANK() OVER (ORDER BY SUM(sales_amount) DESC) as sales_rank
          FROM sales_data 
          WHERE sales_amount > 0
          GROUP BY state, country
        ),
        total_sales AS (
          SELECT SUM(sales_amount) as total FROM sales_data WHERE sales_amount > 0
        )
        SELECT 
          rs.state,
          rs.country,
          rs.region_sales,
          rs.sales_rank,
          ROUND((rs.region_sales * 100.0 / ts.total), 2) as market_share
        FROM regional_sales rs
        CROSS JOIN total_sales ts
        ORDER BY rs.sales_rank
        LIMIT 10
      `;
      
      const results = this.db.prepare(query).all();
      return results;
    } catch (error) {
      console.error('❌ Error getting market concentration:', error);
      return [];
    }
  }

  /**
   * Get regional trends (simplified time series)
   */
  async getRegionalTrends() {
    try {
      const query = `
        SELECT 
          state,
          country,
          strftime('%Y-%m', order_date) as month,
          SUM(sales_amount) as monthly_sales,
          COUNT(*) as monthly_transactions
        FROM sales_data 
        WHERE sales_amount > 0 AND order_date IS NOT NULL
        GROUP BY state, country, strftime('%Y-%m', order_date)
        ORDER BY state, country, month
        LIMIT 100
      `;
      
      const results = this.db.prepare(query).all();
      return results;
    } catch (error) {
      console.error('❌ Error getting regional trends:', error);
      return [];
    }
  }

  /**
   * Get geographic coverage
   */
  async getGeographicCoverage() {
    try {
      const query = `
        SELECT 
          c.[Customer Country] as country,
          COUNT(DISTINCT c.[Customer State/Prov]) as state_count,
          ROUND(SUM(t.[Sales Amount]), 2) as country_sales,
          COUNT(DISTINCT t.[Customer Key]) as country_customers
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
        GROUP BY c.[Customer Country]
        ORDER BY country_sales DESC
      `;
      
      const results = this.db.prepare(query).all();
      return results;
    } catch (error) {
      console.error('❌ Error getting geographic coverage:', error);
      return [];
    }
  }

  /**
   * Get regional comparison data
   */
  async getRegionalComparison() {
    try {
      const query = `
        WITH regional_metrics AS (
          SELECT 
            state,
            country,
            SUM(sales_amount) as total_sales,
            COUNT(DISTINCT customer_id) as customer_count,
            AVG(sales_amount) as avg_order_value,
            AVG(profit_margin) as avg_profit_margin,
            COUNT(*) as transaction_count
          FROM sales_data 
          WHERE sales_amount > 0
          GROUP BY state, country
        ),
        benchmarks AS (
          SELECT 
            AVG(total_sales) as avg_sales,
            AVG(customer_count) as avg_customers,
            AVG(avg_order_value) as avg_order,
            AVG(avg_profit_margin) as avg_margin
          FROM regional_metrics
        )
        SELECT 
          rm.*,
          CASE 
            WHEN rm.total_sales > b.avg_sales THEN 'Above Average'
            WHEN rm.total_sales > b.avg_sales * 0.8 THEN 'Average'
            ELSE 'Below Average'
          END as sales_performance,
          CASE 
            WHEN rm.avg_profit_margin > b.avg_margin THEN 'High Margin'
            WHEN rm.avg_profit_margin > b.avg_margin * 0.8 THEN 'Average Margin'
            ELSE 'Low Margin'
          END as margin_performance
        FROM regional_metrics rm
        CROSS JOIN benchmarks b
        ORDER BY rm.total_sales DESC
        LIMIT 20
      `;
      
      const results = this.db.prepare(query).all();
      return results;
    } catch (error) {
      console.error('❌ Error getting regional comparison:', error);
      return [];
    }
  }

  /**
   * Get regional overview
   */
  async getRegionalOverview() {
    try {
      const kpis = await this.getRegionalKPIs();
      const topRegions = await this.getTopRegions(3);
      const opportunities = await this.getGrowthOpportunities();
      
      return {
        kpis,
        topRegions: topRegions.slice(0, 3),
        opportunities: opportunities.slice(0, 3)
      };
    } catch (error) {
      console.error('❌ Error getting regional overview:', error);
      return {};
    }
  }

  /**
   * Get key highlights
   */
  async getKeyHighlights() {
    try {
      const topRegion = await this.getTopRegions(1);
      const kpis = await this.getRegionalKPIs();
      
      return {
        topRegion: topRegion[0] || null,
        totalRevenue: kpis.total_revenue || 0,
        regionCount: (kpis.unique_countries || 0) + (kpis.unique_states || 0),
        concentrationRatio: kpis.concentrationRatio || 0
      };
    } catch (error) {
      console.error('❌ Error getting key highlights:', error);
      return {};
    }
  }

  /**
   * Get regional rankings (full list with rank)
   */
  async getRegionalRankings() {
    try {
      const query = `
        WITH regional_sales AS (
          SELECT 
            c.[Customer State/Prov] AS state,
            c.[Customer Country] AS country,
            ROUND(SUM(t.[Sales Amount]), 2) AS total_sales,
            COUNT(DISTINCT t.[Customer Key]) AS customer_count,
            COUNT(*) AS transaction_count,
            ROUND(AVG(t.[Sales Amount]), 2) AS avg_order_value,
            ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) AS avg_profit_margin
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer State/Prov], c.[Customer Country]
        )
        SELECT 
          state,
          country,
          total_sales,
          customer_count,
          transaction_count,
          avg_order_value,
          avg_profit_margin,
          ROW_NUMBER() OVER (ORDER BY total_sales DESC) AS sales_rank
        FROM regional_sales
        ORDER BY total_sales DESC
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('❌ Error getting regional rankings:', error);
      return [];
    }
  }

  /**
   * Get underperforming regions (low sales and/or low margin)
   */
  async getUnderperformingRegions() {
    try {
      const query = `
        WITH regional_performance AS (
          SELECT 
            c.[Customer State/Prov] AS state,
            c.[Customer Country] AS country,
            ROUND(SUM(t.[Sales Amount]), 2) AS total_sales,
            COUNT(DISTINCT t.[Customer Key]) AS customer_count,
            ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) AS avg_profit_margin
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer State/Prov], c.[Customer Country]
        ),
        stats AS (
          SELECT 
            AVG(total_sales) AS avg_sales,
            AVG(customer_count) AS avg_customers
          FROM regional_performance
        )
        SELECT 
          rp.*,
          CASE 
            WHEN rp.total_sales < s.avg_sales AND rp.avg_profit_margin <= 10 THEN 'Low Sales & Margin'
            WHEN rp.total_sales < s.avg_sales THEN 'Low Sales'
            WHEN rp.avg_profit_margin <= 10 THEN 'Low Margin'
            ELSE 'Stable'
          END AS issue
        FROM regional_performance rp
        CROSS JOIN stats s
        WHERE rp.total_sales < s.avg_sales OR rp.avg_profit_margin <= 10
        ORDER BY rp.total_sales ASC, rp.avg_profit_margin ASC
        LIMIT 20
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('❌ Error getting underperforming regions:', error);
      return [];
    }
  }

  /**
   * Regional KPI summary helper (aggregated KPIs + top region)
   */
  async getRegionalSummary() {
    try {
      const kpis = await this.getRegionalKPIs();
      const top = await this.getTopRegions(1);
      const topRegion = top[0] || null;
      return {
        total_revenue: kpis.total_revenue || 0,
        total_customers: kpis.total_customers || 0,
        total_transactions: kpis.total_transactions || 0,
        unique_countries: kpis.unique_countries || 0,
        unique_states: kpis.unique_states || 0,
        avg_order_value: kpis.avg_order_value || 0,
        avg_profit_margin: kpis.avg_profit_margin || 0,
        concentration_ratio: kpis.concentrationRatio || 0,
        top_region: topRegion ? `${topRegion.state}, ${topRegion.country}` : null,
        top_region_sales: topRegion ? topRegion.total_sales : 0
      };
    } catch (error) {
      console.error('❌ Error getting regional summary:', error);
      return {};
    }
  }

  /**
   * Regional distribution of sales (share by region)
   */
  async getRegionalDistribution() {
    try {
      const query = `
        WITH totals AS (
          SELECT SUM([Sales Amount]) AS total_sales
          FROM dbo_F_Sales_Transaction 
          WHERE [Deleted Flag] = 0 AND [Sales Amount] > 0
        )
        SELECT 
          c.[Customer Country] AS country,
          c.[Customer State/Prov] AS state,
          ROUND(SUM(t.[Sales Amount]), 2) AS region_sales,
          ROUND(100.0 * SUM(t.[Sales Amount]) / NULLIF((SELECT total_sales FROM totals), 0), 2) AS market_share
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
        GROUP BY c.[Customer Country], c.[Customer State/Prov]
        ORDER BY region_sales DESC
        LIMIT 50
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('❌ Error getting regional distribution:', error);
      return [];
    }
  }

  /**
   * Seasonal patterns by month (best-effort; returns [] if date column not present)
   */
  async getSeasonalPatterns() {
    try {
      const query = `
        SELECT 
          c.[Customer Country] AS country,
          c.[Customer State/Prov] AS state,
          strftime('%Y-%m', t.[Order Date]) AS month,
          SUM(t.[Sales Amount]) AS monthly_sales,
          COUNT(*) AS monthly_transactions
        FROM dbo_F_Sales_Transaction t
        JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0 AND t.[Order Date] IS NOT NULL
        GROUP BY c.[Customer Country], c.[Customer State/Prov], strftime('%Y-%m', t.[Order Date])
        ORDER BY country, state, month
        LIMIT 200
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      // If date column not found, return safely
      console.warn('⚠️ Seasonal patterns unavailable (date column missing):', error.message);
      return [];
    }
  }

  /**
   * Country-level expansion opportunities (low coverage, reasonable performance)
   */
  async getExpansionOpportunities() {
    try {
      const query = `
        WITH country_perf AS (
          SELECT 
            c.[Customer Country] AS country,
            COUNT(DISTINCT c.[Customer State/Prov]) AS state_count,
            ROUND(SUM(t.[Sales Amount]), 2) AS country_sales,
            ROUND(SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100, 2) AS avg_profit_margin
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer Country]
        ), stats AS (
          SELECT AVG(state_count) AS avg_states, AVG(country_sales) AS avg_sales FROM country_perf
        )
        SELECT 
          cp.*,
          CASE 
            WHEN cp.state_count < s.avg_states AND cp.avg_profit_margin > 10 THEN 'Add States'
            WHEN cp.state_count < s.avg_states THEN 'Explore Coverage'
            ELSE 'Review'
          END AS recommendation
        FROM country_perf cp
        CROSS JOIN stats s
        WHERE cp.state_count < s.avg_states
        ORDER BY cp.avg_profit_margin DESC, cp.country_sales DESC
        LIMIT 15
      `;
      return this.db.prepare(query).all();
    } catch (error) {
      console.error('❌ Error getting expansion opportunities:', error);
      return [];
    }
  }

  /**
   * Performance benchmarks across regions
   */
  async getPerformanceBenchmarks() {
    try {
      const query = `
        WITH regional_metrics AS (
          SELECT 
            c.[Customer State/Prov] AS state,
            c.[Customer Country] AS country,
            SUM(t.[Sales Amount]) AS total_sales,
            COUNT(DISTINCT t.[Customer Key]) AS customer_count,
            AVG(t.[Sales Amount]) AS avg_order_value,
            (SUM(t.[Gross Profit Amount]) / NULLIF(SUM(t.[Sales Amount]), 0) * 100) AS avg_profit_margin,
            COUNT(*) AS transaction_count
          FROM dbo_F_Sales_Transaction t
          JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
          WHERE t.[Deleted Flag] = 0 AND t.[Sales Amount] > 0
          GROUP BY c.[Customer State/Prov], c.[Customer Country]
        )
        SELECT 
          ROUND(AVG(total_sales), 2) AS avg_sales,
          ROUND(AVG(customer_count), 2) AS avg_customers,
          ROUND(AVG(avg_order_value), 2) AS avg_order,
          ROUND(AVG(avg_profit_margin), 2) AS avg_margin,
          ROUND(AVG(transaction_count), 2) AS avg_transactions
        FROM regional_metrics
      `;
      return this.db.prepare(query).get();
    } catch (error) {
      console.error('❌ Error getting performance benchmarks:', error);
      return {};
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      this.db.close();
      console.log('🔌 Closed database connection');
    }
  }
}

export default RegionalSalesDatabaseManager;