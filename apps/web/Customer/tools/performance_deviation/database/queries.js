const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class PerformanceDeviationQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async getKPIData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Build date filter
      let dateFilter = "";
      if (filters.startDate && filters.endDate) {
        dateFilter = `WHERE date BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
      }
      
      const query = `
        WITH sales_kpis AS (
          SELECT 
            st."Txn Date" as date,
            'sales' as function,
            'daily_revenue' as kpi_name,
            SUM(CASE WHEN st."Sales Amount" IS NOT NULL THEN st."Sales Amount" ELSE 0 END) as value,
            COUNT(DISTINCT st."Sales Txn Document") as transaction_count,
            AVG(CASE WHEN st."Sales Amount" IS NOT NULL THEN st."Sales Amount" ELSE 0 END) as avg_value
          FROM dbo_F_Sales_Transaction st
          WHERE st."Sales Amount" IS NOT NULL AND st."Txn Date" IS NOT NULL
          GROUP BY st."Txn Date"
          
          UNION ALL
          
          SELECT 
            st."Txn Date" as date,
            'sales' as function,
            'transaction_volume' as kpi_name,
            COUNT(DISTINCT st."Sales Txn Document") as value,
            COUNT(DISTINCT st."Sales Txn Document") as transaction_count,
            COUNT(DISTINCT st."Sales Txn Document") as avg_value
          FROM dbo_F_Sales_Transaction st
          WHERE st."Txn Date" IS NOT NULL
          GROUP BY st."Txn Date"
          
          UNION ALL
          
          SELECT 
            st."Txn Date" as date,
            'sales' as function,
            'avg_order_value' as kpi_name,
            AVG(CASE WHEN st."Sales Amount" IS NOT NULL THEN st."Sales Amount" ELSE 0 END) as value,
            COUNT(DISTINCT st."Sales Txn Document") as transaction_count,
            AVG(CASE WHEN st."Sales Amount" IS NOT NULL THEN st."Sales Amount" ELSE 0 END) as avg_value
          FROM dbo_F_Sales_Transaction st
          WHERE st."Sales Amount" IS NOT NULL AND st."Txn Date" IS NOT NULL
          GROUP BY st."Txn Date"
        ),
        customer_kpis AS (
          SELECT 
            cl."Last Activity Date" as date,
            'customer' as function,
            'active_customers' as kpi_name,
            SUM(CASE WHEN cl."Active Customer Count" IS NOT NULL THEN cl."Active Customer Count" ELSE 0 END) as value,
            COUNT(DISTINCT cl."Entity Key") as transaction_count,
            AVG(CASE WHEN cl."Active Customer Count" IS NOT NULL THEN cl."Active Customer Count" ELSE 0 END) as avg_value
          FROM dbo_F_Customer_Loyalty cl
          WHERE cl."Last Activity Date" IS NOT NULL
          GROUP BY cl."Last Activity Date"
          
          UNION ALL
          
          SELECT 
            cl."Last Activity Date" as date,
            'customer' as function,
            'loyal_customers' as kpi_name,
            SUM(CASE WHEN cl."Loyal Customer Count" IS NOT NULL THEN cl."Loyal Customer Count" ELSE 0 END) as value,
            COUNT(DISTINCT cl."Entity Key") as transaction_count,
            AVG(CASE WHEN cl."Loyal Customer Count" IS NOT NULL THEN cl."Loyal Customer Count" ELSE 0 END) as avg_value
          FROM dbo_F_Customer_Loyalty cl
          WHERE cl."Last Activity Date" IS NOT NULL
          GROUP BY cl."Last Activity Date"
          
          UNION ALL
          
          SELECT 
            cl."Last Activity Date" as date,
            'customer' as function,
            'avg_rfm_score' as kpi_name,
            AVG(CASE WHEN cl."RFM Score" IS NOT NULL THEN cl."RFM Score" ELSE 0 END) as value,
            COUNT(DISTINCT cl."Entity Key") as transaction_count,
            AVG(CASE WHEN cl."RFM Score" IS NOT NULL THEN cl."RFM Score" ELSE 0 END) as avg_value
          FROM dbo_F_Customer_Loyalty cl
          WHERE cl."Last Activity Date" IS NOT NULL AND cl."RFM Score" IS NOT NULL
          GROUP BY cl."Last Activity Date"
        ),
        finance_kpis AS (
          SELECT 
            ar."Txn Date" as date,
            'finance' as function,
            'ar_volume' as kpi_name,
            COUNT(DISTINCT ar."AR Detail Id") as value,
            COUNT(DISTINCT ar."AR Detail Id") as transaction_count,
            COUNT(DISTINCT ar."AR Detail Id") as avg_value
          FROM dbo_F_AR_Detail ar
          WHERE ar."Txn Date" IS NOT NULL
          GROUP BY ar."Txn Date"
          
          UNION ALL
          
          SELECT 
            ar."Txn Date" as date,
            'finance' as function,
            'total_ar_amount' as kpi_name,
            SUM(CASE WHEN ar."Txn Amount" IS NOT NULL THEN ar."Txn Amount" ELSE 0 END) as value,
            COUNT(DISTINCT ar."AR Detail Id") as transaction_count,
            AVG(CASE WHEN ar."Txn Amount" IS NOT NULL THEN ar."Txn Amount" ELSE 0 END) as avg_value
          FROM dbo_F_AR_Detail ar
          WHERE ar."Txn Date" IS NOT NULL
          GROUP BY ar."Txn Date"
          
          UNION ALL
          
          SELECT 
            ar."Txn Date" as date,
            'finance' as function,
            'avg_age_days' as kpi_name,
            AVG(CASE WHEN ar."Age Band Days" IS NOT NULL THEN ar."Age Band Days" ELSE 0 END) as value,
            COUNT(DISTINCT ar."AR Detail Id") as transaction_count,
            AVG(CASE WHEN ar."Age Band Days" IS NOT NULL THEN ar."Age Band Days" ELSE 0 END) as avg_value
          FROM dbo_F_AR_Detail ar
          WHERE ar."Txn Date" IS NOT NULL AND ar."Age Band Days" IS NOT NULL
          GROUP BY ar."Txn Date"
        )
        SELECT * FROM sales_kpis
        UNION ALL
        SELECT * FROM customer_kpis  
        UNION ALL
        SELECT * FROM finance_kpis
        ${dateFilter}
        ORDER BY date DESC, function, kpi_name
      `;

      db.all(query, [], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getExternalFactors(filters = {}) {
    return new Promise((resolve, reject) => {
      // Simulate external factors data since this isn't in the database
      const startDate = new Date(filters.startDate || '2018-01-01');
      const endDate = new Date(filters.endDate || '2020-12-31');
      const factors = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        const month = d.getMonth() + 1;
        
        // Generate simulated but realistic external factors
        factors.push({
          date: dateStr,
          is_weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
          is_holiday: Math.random() < 0.05 ? 1 : 0, // ~5% of days are holidays
          season: month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall',
          market_condition: ['stable', 'growing', 'declining'][Math.floor(Math.random() * 3)],
          competitor_activity_level: Math.max(1, Math.min(10, Math.round(Math.random() * 5 + 5))), // 1-10 scale
          economic_index: Math.round((Math.random() * 20 + 90) * 100) / 100, // 90-110 range
          promotional_activity: Math.random() < 0.15 ? 1 : 0, // ~15% promotion days
        });
      }
      
      resolve(factors);
    });
  }

  async getKPIAnalysis(filters = {}) {
    try {
      const kpiData = await this.getKPIData(filters);
      const externalFactors = await this.getExternalFactors(filters);
      
      // Simulate ML analysis results
      const analysisResults = this.simulateMLAnalysis(kpiData, externalFactors);
      
      return {
        kpiData,
        externalFactors,
        analysisResults
      };
    } catch (error) {
      throw error;
    }
  }

  simulateMLAnalysis(kpiData, externalFactors) {
    // Group KPI data by kpi_name
    const kpiGroups = {};
    kpiData.forEach(row => {
      if (!kpiGroups[row.kpi_name]) {
        kpiGroups[row.kpi_name] = [];
      }
      kpiGroups[row.kpi_name].push(row);
    });

    const results = {};
    
    Object.keys(kpiGroups).forEach(kpiName => {
      const data = kpiGroups[kpiName];
      const values = data.map(d => d.value).filter(v => v != null);
      
      if (values.length === 0) return;
      
      // Simulate predictions with some noise
      const predictions = values.map(v => v * (0.9 + Math.random() * 0.2)); // ±10% variation
      const deviations = values.map((v, i) => v - predictions[i]);
      
      // Calculate variance components
      const actualVariance = this.calculateVariance(values);
      const predictionVariance = this.calculateVariance(predictions);
      const deviationVariance = this.calculateVariance(deviations);
      
      // Simulate feature importance
      const featureImportance = [
        { feature: 'is_weekend', importance: Math.random() * 0.3 + 0.1 },
        { feature: 'season_summer', importance: Math.random() * 0.25 + 0.05 },
        { feature: 'market_condition_growing', importance: Math.random() * 0.2 + 0.05 },
        { feature: 'competitor_activity_level', importance: Math.random() * 0.15 + 0.05 },
        { feature: 'is_holiday', importance: Math.random() * 0.1 + 0.02 },
        { feature: 'promotional_activity', importance: Math.random() * 0.12 + 0.03 },
        { feature: 'economic_index', importance: Math.random() * 0.08 + 0.02 }
      ].sort((a, b) => b.importance - a.importance);
      
      // Normalize importance to sum to 1
      const totalImportance = featureImportance.reduce((sum, f) => sum + f.importance, 0);
      featureImportance.forEach(f => f.importance = f.importance / totalImportance);
      
      results[kpiName] = {
        actual_values: values,
        predictions: predictions,
        deviations: deviations,
        feature_importance: featureImportance,
        variance_decomposition: {
          total: actualVariance,
          explained: predictionVariance,
          unexplained: deviationVariance
        },
        model_metrics: {
          r_squared: Math.max(0.6, Math.random() * 0.35 + 0.65), // 0.6-1.0
          mean_absolute_error: Math.abs(deviations.reduce((sum, d) => sum + Math.abs(d), 0) / deviations.length),
          root_mean_squared_error: Math.sqrt(deviations.reduce((sum, d) => sum + d * d, 0) / deviations.length)
        }
      };
    });
    
    return results;
  }

  calculateVariance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return variance;
  }

  async getKPISummaryMetrics(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        WITH daily_metrics AS (
          SELECT 
            st."Txn Date" as date,
            SUM(CASE WHEN st."Sales Amount" IS NOT NULL THEN st."Sales Amount" ELSE 0 END) as daily_revenue,
            COUNT(DISTINCT st."Sales Txn Document") as daily_transactions,
            AVG(CASE WHEN st."Sales Amount" IS NOT NULL THEN st."Sales Amount" ELSE 0 END) as avg_order_value
          FROM dbo_F_Sales_Transaction st
          WHERE st."Txn Date" IS NOT NULL
          GROUP BY st."Txn Date"
        )
        SELECT 
          COUNT(*) as total_days,
          AVG(daily_revenue) as avg_daily_revenue,
          AVG(daily_transactions) as avg_daily_transactions,
          AVG(avg_order_value) as overall_avg_order_value,
          MAX(daily_revenue) as max_daily_revenue,
          MIN(daily_revenue) as min_daily_revenue,
          (AVG(daily_revenue * daily_revenue) - AVG(daily_revenue) * AVG(daily_revenue)) as revenue_variance
        FROM daily_metrics
      `;

      db.get(query, [], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getDeviationPatterns(filters = {}) {
    try {
      const analysisResults = await this.getKPIAnalysis(filters);
      
      // Generate deviation pattern calendar data
      const patterns = [];
      const startDate = new Date(filters.startDate || '2018-01-01');
      const endDate = new Date(filters.endDate || '2020-12-31');
      
      // Simulate daily deviation patterns
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Generate simulated deviation magnitude
        const magnitude = (Math.random() - 0.5) * 2; // -1 to 1
        const significance = Math.abs(magnitude) > 0.5;
        
        patterns.push({
          date: dateStr,
          deviation_magnitude: magnitude,
          is_significant: significance,
          pattern_type: significance ? (magnitude > 0 ? 'positive_anomaly' : 'negative_anomaly') : 'normal',
          day_of_week: d.getDay(),
          month: d.getMonth() + 1,
          year: d.getFullYear()
        });
      }
      
      return patterns;
    } catch (error) {
      throw error;
    }
  }

  async getFactorCorrelations(filters = {}) {
    return new Promise((resolve) => {
      // Simulate correlation matrix between factors and KPIs
      const factors = [
        'is_weekend', 'is_holiday', 'season', 'market_condition', 
        'competitor_activity_level', 'economic_index', 'promotional_activity'
      ];
      
      const kpis = [
        'daily_revenue', 'transaction_volume', 'avg_order_value',
        'active_customers', 'loyal_customers', 'avg_rfm_score',
        'ar_volume', 'total_ar_amount', 'avg_age_days'
      ];
      
      const correlations = [];
      
      factors.forEach(factor => {
        kpis.forEach(kpi => {
          const correlation = (Math.random() - 0.5) * 2; // -1 to 1
          const significance = Math.abs(correlation) > 0.3;
          
          correlations.push({
            factor,
            kpi,
            correlation,
            is_significant: significance,
            p_value: significance ? Math.random() * 0.05 : Math.random() * 0.5 + 0.05
          });
        });
      });
      
      resolve(correlations);
    });
  }
}

module.exports = { PerformanceDeviationQueries }; 