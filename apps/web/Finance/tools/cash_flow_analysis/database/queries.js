const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class CashFlowAnalysisQueries {
  constructor() {
    const dbPath = path.join(process.cwd(), 'Finance', 'database', 'financial_agent.db');
    
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

  // Main KPI data for FCF analysis
  getKPIData(filters = {}) {
    const { startDate, endDate, companyCode } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND "Txn Date" BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (companyCode && companyCode !== 'all') {
      whereClause += ' AND "Company Code" = @companyCode';
      params.companyCode = companyCode;
    }

    const query = `
      WITH cash_metrics AS (
        SELECT 
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) IN ('41', '42') THEN ABS("Txn Amount") ELSE 0 END), 0) as revenue_amount,
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) = '51' THEN ABS("Txn Amount") ELSE 0 END), 0) as cogs_amount,
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) IN ('61', '62', '63', '64', '65', '66') THEN ABS("Txn Amount") ELSE 0 END), 0) as operating_expense,
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) IN ('41', '42') THEN ABS("Txn Amount") ELSE 0 END), 0) as operating_cash_inflow,
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) IN ('51', '61', '62', '63', '64', '65') THEN ABS("Txn Amount") ELSE 0 END), 0) as operating_cash_outflow,
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) = '13' THEN ABS("Txn Amount") ELSE 0 END), 0) as capex_amount,
          COALESCE(SUM(CASE WHEN substr("GL Account Number", 1, 2) IN ('21', '22') THEN "Txn Amount" ELSE 0 END), 0) as financing_amount,
          COUNT(DISTINCT "Txn Date") as transaction_days
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
      )
      SELECT 
        *,
        (revenue_amount - cogs_amount - operating_expense) as ebitda,
        (revenue_amount - cogs_amount - operating_expense) as operating_cash_flow,
        ((revenue_amount - cogs_amount - operating_expense) - capex_amount) as free_cash_flow,
        ROUND(
          CASE 
            WHEN revenue_amount > 0 THEN 
              ((operating_cash_inflow - operating_cash_outflow) / revenue_amount) * 100
            ELSE 0
          END, 2
        ) as cash_conversion_ratio,
        ROUND(
          CASE 
            WHEN revenue_amount > 0 THEN 
              (((operating_cash_inflow - operating_cash_outflow) - capex_amount) / revenue_amount) * 100
            ELSE 0
          END, 2
        ) as fcf_margin
      FROM cash_metrics
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.get(params);
    } catch (error) {
      console.error('Error in getKPIData:', error);
      throw error;
    }
  }

  // FCF Value Bridge Data
  getFCFValueBridgeData(filters = {}) {
    const { startDate, endDate, companyCode } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND "Txn Date" BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (companyCode && companyCode !== 'all') {
      whereClause += ' AND "Company Code" = @companyCode';
      params.companyCode = companyCode;
    }

    const query = `
      WITH fcf_components AS (
        SELECT 
          'EBITDA (Starting Point)' as component,
          SUM(CASE 
            WHEN substr("GL Account Number", 1, 2) IN ('41', '42') THEN ABS("Txn Amount")
            WHEN substr("GL Account Number", 1, 2) = '51' THEN -ABS("Txn Amount")
            WHEN substr("GL Account Number", 1, 2) IN ('61', '62', '63', '64', '65') THEN -ABS("Txn Amount")
            ELSE 0
          END) as value,
          1 as sequence_order,
          'baseline' as impact_type
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Working Capital Change' as component,
          -SUM(CASE 
            WHEN substr("GL Account Number", 1, 2) IN ('11', '12') THEN "Txn Amount"
            WHEN substr("GL Account Number", 1, 2) IN ('21', '22') THEN -"Txn Amount"
            ELSE 0
          END) as value,
          2 as sequence_order,
          'reduction' as impact_type
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Capital Expenditure' as component,
          -SUM(ABS("Txn Amount")) as value,
          3 as sequence_order,
          'reduction' as impact_type
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        AND substr("GL Account Number", 1, 2) = '13'
        
        UNION ALL
        
        SELECT 
          'Tax Payments' as component,
          -SUM(CASE 
            WHEN substr("GL Account Number", 1, 2) IN ('23', '24') THEN ABS("Txn Amount")
            ELSE 0
          END) as value,
          4 as sequence_order,
          'reduction' as impact_type
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        
        UNION ALL
        
        SELECT 
          'Interest Payments' as component,
          -SUM(CASE 
            WHEN substr("GL Account Number", 1, 2) = '66' THEN ABS("Txn Amount")
            ELSE 0
          END) as value,
          5 as sequence_order,
          'reduction' as impact_type
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
      )
      SELECT 
        component,
        ROUND(value, 2) as value,
        sequence_order,
        impact_type
      FROM fcf_components
      WHERE ABS(value) > 100 -- Filter out negligible amounts
      ORDER BY sequence_order
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getFCFValueBridgeData:', error);
      throw error;
    }
  }

  // Liquidity Timeline Data
  getLiquidityTimelineData(filters = {}) {
    const { startDate, endDate, companyCode } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND "Txn Date" BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (companyCode && companyCode !== 'all') {
      whereClause += ' AND "Company Code" = @companyCode';
      params.companyCode = companyCode;
    }

    const query = `
      WITH daily_cash_flow AS (
        SELECT 
          DATE("Txn Date", 'weekday 0', '-6 days') as date,
          SUM(CASE 
            WHEN substr("GL Account Number", 1, 2) = '11' THEN "Txn Amount" -- Cash accounts
            WHEN substr("GL Account Number", 1, 2) IN ('41', '42') THEN "Txn Amount" -- Revenue inflow
            WHEN substr("GL Account Number", 1, 2) IN ('51', '61', '62', '63', '64', '65') THEN -ABS("Txn Amount") -- Expenses outflow
            ELSE 0
          END) as daily_cash_change,
          COUNT(*) as transaction_count
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        GROUP BY DATE("Txn Date", 'weekday 0', '-6 days')
      ),
      running_balance AS (
        SELECT 
          date,
          daily_cash_change,
          transaction_count,
          SUM(daily_cash_change) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as cumulative_cash
        FROM daily_cash_flow
      ),
      balance_with_lag AS (
        SELECT 
          date,
          daily_cash_change,
          transaction_count,
          cumulative_cash,
          LAG(cumulative_cash, 7) OVER (ORDER BY date) as cash_7_days_ago
        FROM running_balance
      )
      SELECT 
        date,
        ROUND(daily_cash_change, 2) as daily_change,
        ROUND(cumulative_cash, 2) as cash_balance,
        transaction_count,
        ROUND(
          CASE 
            WHEN cash_7_days_ago IS NOT NULL AND cash_7_days_ago != 0 THEN
              ((cumulative_cash - cash_7_days_ago) / ABS(cash_7_days_ago)) * 100
            ELSE 0
          END, 2
        ) as volatility_7d,
        CASE 
          WHEN cumulative_cash < 50000 THEN 'critical'
          WHEN cumulative_cash < 100000 THEN 'warning'
          ELSE 'healthy'
        END as liquidity_status
      FROM balance_with_lag
      ORDER BY date
      LIMIT 52
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getLiquidityTimelineData:', error);
      throw error;
    }
  }

  // Capital Allocation Data
  getCapitalAllocationData(filters = {}) {
    const { startDate, endDate, companyCode } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND "Txn Date" BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (companyCode && companyCode !== 'all') {
      whereClause += ' AND "Company Code" = @companyCode';
      params.companyCode = companyCode;
    }

    const query = `
      WITH allocation_data AS (
        SELECT 
          CASE 
            WHEN "GL Account Number" LIKE '13%' THEN 'Growth Investment (CapEx)'
            WHEN "GL Account Number" LIKE '51%' THEN 'Operations (COGS)'
            WHEN "GL Account Number" LIKE '61%' OR "GL Account Number" LIKE '62%' OR "GL Account Number" LIKE '63%' 
              OR "GL Account Number" LIKE '64%' OR "GL Account Number" LIKE '65%' THEN 'Operations (OpEx)'
            WHEN "GL Account Number" LIKE '21%' OR "GL Account Number" LIKE '22%' THEN 'Debt Service'
            WHEN "GL Account Number" LIKE '30%' THEN 'Shareholder Returns'
            WHEN "GL Account Number" LIKE '41%' OR "GL Account Number" LIKE '42%' THEN 'Revenue Generation'
            WHEN "GL Account Number" LIKE '11%' OR "GL Account Number" LIKE '12%' THEN 'Working Capital'
            ELSE 'Other'
          END as allocation_category,
          ABS("Txn Amount") as amount,
          "Txn Date" as transaction_date
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        AND ABS("Txn Amount") > 0
      ),
      category_totals AS (
        SELECT 
          allocation_category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_transaction_size,
          COUNT(DISTINCT transaction_date) as active_days
        FROM allocation_data
        WHERE allocation_category != 'Other'
        GROUP BY allocation_category
      ),
      total_allocation AS (
        SELECT SUM(total_amount) as grand_total
        FROM category_totals
      )
      SELECT 
        ct.allocation_category as category,
        ROUND(ct.total_amount, 2) as amount,
        ROUND((ct.total_amount / ta.grand_total) * 100, 2) as percentage,
        ct.transaction_count,
        ROUND(ct.avg_transaction_size, 2) as avg_size,
        ct.active_days,
        CASE 
          WHEN ct.allocation_category LIKE '%Growth%' THEN 'growth'
          WHEN ct.allocation_category LIKE '%Operations%' THEN 'operations'  
          WHEN ct.allocation_category LIKE '%Returns%' THEN 'returns'
          ELSE 'other'
        END as allocation_type
      FROM category_totals ct
      CROSS JOIN total_allocation ta
      ORDER BY ct.total_amount DESC
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getCapitalAllocationData:', error);
      throw error;
    }
  }

  // Cash Flow Forecast Data (simplified scenario modeling)
  getCashFlowForecastData(filters = {}) {
    const { startDate, endDate, companyCode } = filters;
    
    // For forecast, always use full year 2021 data to get proper monthly patterns
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    // Always use full 2021 data for forecast patterns
    whereClause += ' AND "Txn Date" BETWEEN @startDate AND @endDate';
    params.startDate = '2021-01-01';
    params.endDate = '2021-12-30';
    
    if (companyCode && companyCode !== 'all') {
      whereClause += ' AND "Company Code" = @companyCode';
      params.companyCode = companyCode;
    }

    const query = `
      WITH historical_patterns AS (
        SELECT 
          strftime('%m', "Txn Date") as month,
          SUM(CASE WHEN "GL Account Number" LIKE '41%' OR "GL Account Number" LIKE '42%' THEN ABS("Txn Amount") ELSE 0 END) as total_inflow,
          SUM(CASE WHEN "GL Account Number" LIKE '51%' OR "GL Account Number" LIKE '61%' OR "GL Account Number" LIKE '62%' 
            OR "GL Account Number" LIKE '63%' OR "GL Account Number" LIKE '64%' OR "GL Account Number" LIKE '65%' THEN ABS("Txn Amount") ELSE 0 END) as total_outflow,
          COUNT(*) as transaction_volume
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        GROUP BY strftime('%m', "Txn Date")
      ),
      forecast_base AS (
        SELECT 
          month,
          ROUND(total_inflow, 2) as monthly_inflow,
          ROUND(total_outflow, 2) as monthly_outflow,
          ROUND(total_inflow - total_outflow, 2) as net_monthly_flow,
          transaction_volume
        FROM historical_patterns
      )
      SELECT 
        month,
        monthly_inflow,
        monthly_outflow,
        net_monthly_flow,
        transaction_volume,
        -- Base case (historical average)
        net_monthly_flow as base_forecast,
        -- Optimistic case (+20%)
        ROUND(net_monthly_flow * 1.2, 2) as optimistic_forecast,
        -- Pessimistic case (-20%)
        ROUND(net_monthly_flow * 0.8, 2) as pessimistic_forecast,
        -- Confidence based on transaction volume
        CASE 
          WHEN transaction_volume > 100 THEN 'high'
          WHEN transaction_volume > 50 THEN 'medium'
          ELSE 'low'
        END as confidence_level
      FROM forecast_base
      WHERE month IS NOT NULL
      ORDER BY month
      LIMIT 12
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getCashFlowForecastData:', error);
      throw error;
    }
  }

  // Cash Flow Variance Analysis
  getCashFlowVarianceData(filters = {}) {
    const { startDate, endDate, companyCode } = filters;
    
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (startDate && endDate) {
      whereClause += ' AND "Txn Date" BETWEEN @startDate AND @endDate';
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    if (companyCode && companyCode !== 'all') {
      whereClause += ' AND "Company Code" = @companyCode';
      params.companyCode = companyCode;
    }

    const query = `
      WITH monthly_actuals AS (
        SELECT 
          strftime('%Y-%m', "Txn Date") as month,
          SUM("Txn Amount") as actual_cash_flow,
          COUNT(*) as transaction_count
        FROM """dbo_F_GL_Transaction"""
        ${whereClause}
        AND "GL Account Number" LIKE '1100%' -- Cash accounts
        GROUP BY strftime('%Y-%m', "Txn Date")
      ),
      monthly_forecast AS (
        SELECT 
          month,
          actual_cash_flow,
          -- Simple forecast as prior month + 5% growth
          LAG(actual_cash_flow, 1) OVER (ORDER BY month) * 1.05 as forecast_cash_flow,
          transaction_count
        FROM monthly_actuals
      )
      SELECT 
        month,
        ROUND(actual_cash_flow, 2) as actual,
        ROUND(forecast_cash_flow, 2) as forecast,
        ROUND(actual_cash_flow - forecast_cash_flow, 2) as variance,
        ROUND(
          CASE 
            WHEN forecast_cash_flow != 0 THEN 
              ABS((actual_cash_flow - forecast_cash_flow) / forecast_cash_flow) * 100
            ELSE 0
          END, 2
        ) as variance_percentage,
        CASE 
          WHEN actual_cash_flow > forecast_cash_flow THEN 'favorable'
          WHEN actual_cash_flow < forecast_cash_flow THEN 'unfavorable'
          ELSE 'on_target'
        END as variance_type,
        transaction_count
      FROM monthly_forecast
      WHERE forecast_cash_flow IS NOT NULL
      ORDER BY month DESC
      LIMIT 12
    `;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('Error in getCashFlowVarianceData:', error);
      throw error;
    }
  }

  // Get company codes for filter
  getCompanyCodes() {
    const query = `
      SELECT DISTINCT 
        "Company Code" as code,
        "Company Code" as name,
        COUNT(*) as transaction_count
      FROM """dbo_F_GL_Transaction"""
      GROUP BY "Company Code"
      ORDER BY "Company Code"
    `;
    
    try {
      const stmt = this.db.prepare(query);
      return stmt.all();
    } catch (error) {
      console.error('Error in getCompanyCodes:', error);
      throw error;
    }
  }

  // Get GL account categories for analysis
  getGLCategories() {
    const query = `
      SELECT DISTINCT 
        SUBSTR("GL Account Number", 1, 2) as category_code,
        CASE 
          WHEN "GL Account Number" LIKE '11%' THEN 'Cash & Equivalents'
          WHEN "GL Account Number" LIKE '12%' THEN 'Accounts Receivable'
          WHEN "GL Account Number" LIKE '13%' THEN 'Fixed Assets'
          WHEN "GL Account Number" LIKE '14%' THEN 'Inventory'
          WHEN "GL Account Number" LIKE '15%' THEN 'Other Current Assets'
          WHEN "GL Account Number" LIKE '21%' THEN 'Current Liabilities'
          WHEN "GL Account Number" LIKE '22%' THEN 'Long-term Liabilities'
          WHEN "GL Account Number" LIKE '23%' THEN 'Tax Liabilities'
          WHEN "GL Account Number" LIKE '30%' THEN 'Equity'
          WHEN "GL Account Number" LIKE '41%' THEN 'Sales Revenue'
          WHEN "GL Account Number" LIKE '42%' THEN 'Service Revenue'
          WHEN "GL Account Number" LIKE '51%' THEN 'Cost of Goods Sold'
          WHEN "GL Account Number" LIKE '61%' THEN 'Admin Expenses'
          WHEN "GL Account Number" LIKE '62%' THEN 'Marketing Expenses'
          WHEN "GL Account Number" LIKE '63%' THEN 'Payroll Expenses'
          WHEN "GL Account Number" LIKE '64%' THEN 'Facilities Expenses'
          WHEN "GL Account Number" LIKE '65%' THEN 'Other OpEx'
          WHEN "GL Account Number" LIKE '66%' THEN 'Interest Expense'
          WHEN "GL Account Number" LIKE '69%' THEN 'Depreciation'
          WHEN "GL Account Number" LIKE '91%' THEN 'Non-Operating Items'
          WHEN "GL Account Number" LIKE '93%' THEN 'Extraordinary Items'
          ELSE 'Other'
        END as category_name,
        COUNT(*) as account_count
      FROM """dbo_F_GL_Transaction"""
      GROUP BY SUBSTR("GL Account Number", 1, 2)
      ORDER BY category_code
    `;
    
    try {
      const stmt = this.db.prepare(query);
      return stmt.all();
    } catch (error) {
      console.error('Error in getGLCategories:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { CashFlowAnalysisQueries };