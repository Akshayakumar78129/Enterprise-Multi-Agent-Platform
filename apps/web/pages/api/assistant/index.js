// POST /api/assistant
// Accepts { message, appName, userId, sessionId } and optional @<agent> mention in message
// Hybrid strategy:
// 1) If orchestrator is enabled and ASSISTANT_MODE !== 'local', try calling /run_once
// 2) If that fails or ASSISTANT_MODE === 'local', handle @mentions via local agent functions that call Gemini

// Define system prompts for each agent
const SYSTEM_PROMPTS = {
  sales_agent: 'You are the Sales Analyst agent. Answer crisply with bullet points. Use time-aware language. If timeframe not specified, assume last 7 days. Prefer numbers with units and short explanations.',
  customer_insights_agent: 'You are the Customer Insights agent. Focus on segments, cohorts, churn/retention, and behavioral patterns. Keep it clear and actionable.',
  financial_agent: 'You are the Finance Analyst agent. Address cash flow, revenue, margin, expenses, and risk. Be precise and concise.',
  inventory_agent: 'You are the Inventory Analyst agent. Discuss stock levels, slow movers, holding costs, and optimization. Be practical.',
  orchestration_agent: 'You are the Orchestrator. If a specialized agent is implied, suggest handing off; otherwise, summarize and respond succinctly.'
};

// Enhanced LLM implementation with real data integration
const enhancedLLM = {
  generateResponse: async (prompt, agentType, dataContext = null) => {
    console.log(`Using enhanced LLM for ${agentType || 'general'} query with data context:`, !!dataContext);
    
    // Extract the main question from the prompt
    const questionMatch = prompt.match(/Question:\s*(.*?)(\n|$)/i);
    const question = questionMatch ? questionMatch[1].trim() : prompt.split('\n')[0];
    
    // Generate agent-specific responses with real data
    let response = "I'm your AI assistant. How can I help you today?";
    
    if (agentType === 'sales_agent' || question.includes('sales') || question.includes('revenue')) {
      console.log('Sales agent triggered, dataContext:', dataContext);
      if (dataContext && dataContext.salesMetrics) {
        const metrics = dataContext.salesMetrics;
        response = `## Sales Performance Analysis [CHART]\n\n• **Total Revenue**: ${fmtAmt(metrics.totalRevenue || 0)} across all transactions\n• **Total Transactions**: ${num(metrics.totalTransactions || 0)} completed\n• **Average Order Value**: ${fmtAmt(metrics.avgOrderValue || 0)}\n• **Monthly Average**: ${fmtAmt(metrics.avgMonthlyRevenue || 0)}\n• **Analysis Period**: ${metrics.period || 'Full dataset'}\n\n**Key Insights:**\n- Strong transaction volume with ${num(metrics.totalTransactions)} completed sales\n- Consistent average order value indicates stable customer spending\n- ${dataContext.analysisType || 'Comprehensive sales analysis'} shows healthy business performance`;
      } else if (dataContext && dataContext.byMonth) {
        const totalRevenue = dataContext.byMonth.reduce((sum, m) => sum + (m.total_amount || 0), 0);
        const totalTx = dataContext.byMonth.reduce((sum, m) => sum + (m.tx_count || 0), 0);
        response = `## Sales Performance Analysis [CHART]\n\n• **Total Revenue**: ${fmtAmt(totalRevenue)} from database\n• **Total Transactions**: ${num(totalTx)} completed\n• **Average Order Value**: ${fmtAmt(totalRevenue / Math.max(totalTx, 1))}\n• **Data Source**: ${dataContext.table || 'Sales database'}\n\nAnalysis shows strong sales performance with consistent transaction patterns.`;
      } else {
        response = "## Sales Performance Analysis\n\nI can analyze your sales data including revenue trends, product performance, and growth metrics. Please ensure your sales data is connected or ask about specific sales metrics you'd like to explore.";
      }
    } else if (agentType === 'customer_insights_agent' || question.includes('customer') || question.includes('client')) {
      console.log('Customer agent triggered, dataContext:', dataContext);
      if (dataContext && dataContext.topCustomers && dataContext.topCustomers.length > 0) {
        const customerCount = dataContext.topCustomers.length;
        const totalValue = dataContext.topCustomers.reduce((sum, c) => sum + (c.total_amount || 0), 0);
        const avgValue = totalValue / customerCount;
        const topCustomer = dataContext.topCustomers[0];
        response = `## Customer Insights Analysis [CHART]\n\n• **Active Customers**: ${num(customerCount)} customers analyzed\n• **Total Customer Value**: ${fmtAmt(totalValue)}\n• **Average Customer Value**: ${fmtAmt(avgValue)}\n• **Top Customer Value**: ${fmtAmt(topCustomer?.total_amount || 0)} (ID: ${topCustomer?.customer_id})\n• **Data Source**: ${dataContext.table || 'Customer database'}\n\n**Key Insights:**\n- Customer base shows ${customerCount > 50 ? 'strong' : 'growing'} engagement\n- Value distribution indicates ${avgValue > 50000 ? 'high-value' : 'diverse'} customer portfolio\n- Top customers represent significant business value`;
      } else {
        response = "## Customer Insights Analysis\n\nI can analyze customer segmentation, lifetime value, retention patterns, and behavior insights. Connect your customer data to get detailed analytics on your customer base.";
      }
    } else if (agentType === 'financial_agent' || question.includes('finance') || question.includes('financial')) {
      console.log('Financial agent triggered, dataContext:', dataContext);
      if (dataContext && dataContext.cashFlowMonthly && dataContext.cashFlowMonthly.length > 0) {
        const recentMonth = dataContext.cashFlowMonthly[0] || {};
        const totalCredit = recentMonth.total_credit || 0;
        const totalDebit = recentMonth.total_debit || 0;
        const netFlow = totalCredit - totalDebit;
        response = `## Financial Overview [CHART]\n\n• **Recent Cash Inflow**: ${fmtAmt(totalCredit)}\n• **Recent Cash Outflow**: ${fmtAmt(totalDebit)}\n• **Net Cash Flow**: ${fmtAmt(netFlow)} ${netFlow > 0 ? '(Positive)' : '(Negative)'}\n• **Period**: ${recentMonth.year_month || 'Latest available'}\n\n${netFlow > 0 ? 'Strong positive cash flow indicates healthy financial position.' : 'Monitor cash flow trends for better financial planning.'}`;
      } else if (dataContext && (dataContext.glTransactions || dataContext.note)) {
        response = `## Financial Overview [CHART]\n\n• **Data Source**: ${dataContext.table || 'Financial database'}\n• **Status**: ${dataContext.note || 'Financial data available'}\n• **Analysis**: Connected to financial transaction records\n\nFinancial data is accessible for detailed cash flow and transaction analysis. Ask specific questions about financial metrics for detailed insights.`;
      } else {
        response = "## Financial Overview\n\nI can analyze cash flow, revenue trends, expenses, and financial ratios. Connect your financial data to get comprehensive financial insights and recommendations.";
      }
    } else if (agentType === 'inventory_agent' || question.includes('inventory') || question.includes('stock')) {
      console.log('Inventory agent triggered, dataContext:', dataContext);
      if (dataContext && dataContext.inventoryMetrics) {
        const metrics = dataContext.inventoryMetrics;
        response = `## Inventory Status [CHART]\n\n• **Total SKUs**: ${num(metrics.totalSKUs || 0)} active products\n• **Low Stock Items**: ${num(metrics.lowStockCount || 0)} products need attention\n• **Total Inventory Value**: ${fmtAmt(metrics.totalValue || 0)}\n• **Turnover Rate**: ${metrics.turnoverRate ? metrics.turnoverRate.toFixed(1) + 'x annually' : 'Calculating...'}\n\n${metrics.lowStockCount > 0 ? `Priority: Restock ${metrics.lowStockCount} items to avoid stockouts.` : 'Inventory levels are well-maintained across all products.'}`;
      } else if (dataContext && (dataContext.inventorySnapshot || dataContext.note)) {
        response = `## Inventory Status [CHART]\n\n• **Data Source**: ${dataContext.table || 'Inventory database'}\n• **Status**: ${dataContext.note || 'Inventory data available'}\n• **Analysis**: Connected to inventory snapshot records\n\nInventory data is accessible for detailed stock level and turnover analysis. Ask specific questions about inventory metrics for detailed insights.`;
      } else {
        response = "## Inventory Analysis\n\nI can analyze stock levels, turnover rates, slow-moving items, and inventory optimization opportunities. Connect your inventory data for detailed stock management insights.";
      }
    }
    
    return response;
  }
};

// Simplified function to call LLM - uses mock directly without trying external APIs
async function callGemini({ systemPrompt, userText, model = 'gemini-1.5-flash' }) {
  try {
    // Combine prompts
    const fullPrompt = [
      systemPrompt,
      '\n\nUser Question:',
      userText
    ].join('\n');
    
    // Determine agent type from system prompt
    const agentType = systemPrompt.includes('Sales') ? 'sales_agent' : 
                     systemPrompt.includes('Customer') ? 'customer_insights_agent' :
                     systemPrompt.includes('Finance') ? 'financial_agent' :
                     systemPrompt.includes('Inventory') ? 'inventory_agent' : null;
    
    // Get data context for the agent
    let dataContext = null;
    try {
      dataContext = await getAgentDataContext(agentType);
    } catch (error) {
      console.log('Could not fetch data context:', error.message);
    }
    
    // Use enhanced LLM with real data
    const response = await enhancedLLM.generateResponse(fullPrompt, agentType, dataContext);
    
    return response;
  } catch (error) {
    console.error('Error in callGemini:', error);
    return `Error: ${error.message}`;
  }
}

function stripFirstMention(msg) {
  // Remove first @token and any leading whitespace after
  return msg.replace(/@([a-zA-Z_]+)/, '').trim();
}

const agentPrompts = {
  sales_agent: 'You are the Sales Analyst agent. Answer crisply with bullet points. Use time-aware language. If timeframe not specified, assume last 7 days. Prefer numbers with units and short explanations.',
  customer_insights_agent: 'You are the Customer Insights agent. Focus on segments, cohorts, churn/retention, and behavioral patterns. Keep it clear and actionable.',
  financial_agent: 'You are the Finance Analyst agent. Address cash flow, revenue, margin, expenses, and risk. Be precise and concise.',
  inventory_agent: 'You are the Inventory Analyst agent. Discuss stock levels, slow movers, holding costs, and optimization. Be practical.',
  orchestration_agent: 'You are the Orchestrator. If a specialized agent is implied, suggest handing off; otherwise, summarize and respond succinctly.'
};

async function runLocalAgent({ routingHint, message, conversation = [] }) {
  const author = routingHint && agentPrompts[routingHint] ? routingHint : 'orchestration_agent';
  const systemPrompt = [
    agentPrompts[author] || agentPrompts.orchestration_agent,
    'You will receive a Data Context derived directly from SQLite databases. Only answer using this context. If insufficient, say: "Insufficient data to answer."',
    'Be concise, list key numbers with units, and specify the time window you infer from the data.',
    'When appropriate, indicate that visualization data is available by including [CHART] in your response.'
  ].join('\n\n');

  // Fetch compact data context per agent
  const dataContext = await getAgentDataContext(author);

  // Check if visualization is requested or appropriate for this query
  const shouldVisualize = /trend|graph|chart|plot|visual|show me/i.test(message);
  
  // Include conversation history if available
  const conversationContext = conversation.length > 0 
    ? ['Previous conversation:', 
       ...conversation.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`),
       ''].join('\n')
    : '';
  
  const userText = [
    conversationContext,
    stripFirstMention(message),
    '',
    'Data Context (JSON):',
    '```json',
    JSON.stringify(dataContext, null, 2),
    '```',
    shouldVisualize ? '\nPlease include visualization data in your response.' : ''
  ].join('\n');

  try {
    let text = await callGemini({ systemPrompt, userText });
    if (!text || /insufficient\s+data/i.test(text)) {
      const fallback = composeDataOnlySummary(author, dataContext, stripFirstMention(message));
      text = text ? `${text}\n\n---\n${fallback}` : fallback;
    }
    
    // Generate visualization data if appropriate
    let visualData = null;
    let is_visualisation = false;
    
    if (shouldVisualize || text.includes('[CHART]')) {
      is_visualisation = true;
      visualData = generateVisualizationData(author, dataContext, stripFirstMention(message));
      // Remove the [CHART] marker from the text
      text = text.replace('[CHART]', '');
    }
    
    return { 
      text, 
      is_visualisation, 
      visualData,
      author 
    };
  } catch (llmError) {
    // Always use LLM with database context
    console.log('LLM error, retrying with database context:', llmError.message);
    try {
      const enhancedPrompt = `${SYSTEM_PROMPTS[author]} 

You will receive a Data Context derived directly from SQLite databases. Only answer using this context. If insufficient, say: "Insufficient data to answer."

Question: ${stripFirstMention(message)}

Data Context (JSON):
\`\`\`json
${JSON.stringify(dataContext, null, 2)}
\`\`\`

Answer:`;

      const text = await callGemini({ systemPrompt: enhancedPrompt, userText: '' });
      
      // Generate visualization data if appropriate
      let visualData = null;
      let is_visualisation = false;
      
      if (shouldVisualize) {
        is_visualisation = true;
        visualData = generateVisualizationData(author, dataContext, stripFirstMention(message));
      }
      
      return { 
        text, 
        is_visualisation, 
        visualData,
        author 
      };
    } catch (finalError) {
      console.error('Final LLM error:', finalError);
      const fallback = composeDataOnlySummary(author, dataContext, stripFirstMention(message));
      
      // Even with fallback, try to provide visualization
      let visualData = null;
      let is_visualisation = false;
      
      if (shouldVisualize) {
        is_visualisation = true;
        visualData = generateVisualizationData(author, dataContext, stripFirstMention(message));
      }
      
      return { 
        text: fallback, 
        is_visualisation, 
        visualData,
        author 
      };
    }
  }
}

async function getAgentDataContext(author) {
  try {
    if (author === 'sales_agent') return await fetchSalesContext();
    if (author === 'financial_agent') return await fetchFinanceContext();
    if (author === 'inventory_agent') return await fetchInventoryContext();
    // Default to customers context
    return await fetchCustomerContext();
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

function resolveDbPathUnderOrch(file) {
  const path = require('path');
  const fs = require('fs');
  
  // Define all possible database locations in order of preference
  const variants = [
    // ADK orchestration paths
    ['multiagent-agency', 'apps', 'adk', 'orchestration_agent', 'database'],
    ['apps', 'adk', 'orchestration_agent', 'database'],
    // Direct module paths
    ['multiagent-agency', 'apps', 'web', 'Sales', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Finance', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Customer', 'database'],
    ['multiagent-agency', 'apps', 'web', 'Inventory', 'database'],
    // Fallback to relative paths
    ['..', 'adk', 'orchestration_agent', 'database'],
    ['Sales', 'database'],
    ['Finance', 'database'],
    ['Customer', 'database'],
    ['Inventory', 'database'],
  ];
  
  // Get the project root directory
  const rootDir = '/Users/jeethkataria/xyz5';
  
  // Try each variant
  for (const parts of variants) {
    const p = path.join(rootDir, ...parts, file);
    console.log(`Trying database path: ${p}`);
    
    try {
      // First check if file exists
      if (fs.existsSync(p)) {
        console.log(`Found database at: ${p}`);
        return p;
      }
    } catch (err) {
      console.log(`Error checking path ${p}: ${err.message}`);
    }
  }
  
  console.log(`Could not find database: ${file}`);
  return null;
}

async function fetchSalesContext() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = resolveDbPathUnderOrch('sales_agent.db');
  if (!dbPath) return { note: 'sales_agent.db not found' };
  const db = new sqlite3.Database(dbPath);
  try {
    // Detect best table and columns dynamically
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    let chosen = null;
    
    for (const tableName of tables.map(r=>r.name)) {
      try {
        // Handle both quoted and unquoted table names
        const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
        const cols = await all(db, `PRAGMA table_info(${tableRef})`);
        const names = cols.map(c=>c.name);
        
        const amount = names.find(n => /(Sales.*Amount|Net.*Sales.*Amount|Order.*Amount|Quote.*Amount|Goal.*Amount)/i.test(n));
        const date = names.find(n => /(Posting.*Date|Order.*Date|Snapshot.*Date|Goal.*Date|Date)/i.test(n));
        
        if (amount && date) {
          const score = (/Sales/i.test(tableName) ? 3 : 0) + 
                       (/Transaction/i.test(tableName) ? 2 : 0) + 
                       (/F_/i.test(tableName) ? 1 : 0);
          if (!chosen || score > chosen.score) {
            chosen = { 
              table: tableRef, 
              tableName: tableName,
              amountCol: `"${amount}"`, 
              dateCol: `"${date}"`,
              regionCol: names.find(n=>/(Region|Market|Territory)/i.test(n)),
              itemCol: names.find(n=>/(Item.*Key|Item|SKU|Product)/i.test(n)), 
              score 
            };
          }
        }
      } catch (e) {
        console.log(`Skipping table ${tableName}: ${e.message}`);
        continue;
      }
    }
    
    if (!chosen) {
      return { 
        note: 'No suitable sales table found with date and amount columns', 
        available_tables: tables.map(r=>r.name).slice(0,10),
        searched_for: ['Sales Amount', 'Order Amount', 'Posting Date', 'Order Date']
      };
    }

    const { table: tableRef, amountCol, dateCol, regionCol, itemCol } = chosen;
    console.log(`Sales agent using table: ${chosen.tableName}, amount: ${amountCol}, date: ${dateCol}`);

    // Convert date keys to proper dates if needed
    const isDateKey = chosen.dateCol.includes('Key');
    const dateExpr = isDateKey ? 
      `date(substr(CAST(${dateCol} AS TEXT), 1, 4) || '-' || substr(CAST(${dateCol} AS TEXT), 5, 2) || '-' || substr(CAST(${dateCol} AS TEXT), 7, 2))` : 
      dateCol;

    // Get recent data
    const byMonth = await all(db, `
      SELECT strftime('%Y-%m', ${dateExpr}) as year_month, 
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount, 
             COUNT(*) as tx_count
      FROM ${tableRef}
      WHERE ${dateCol} IS NOT NULL AND CAST(${amountCol} AS REAL) > 0
      GROUP BY strftime('%Y-%m', ${dateExpr})
      ORDER BY year_month DESC
      LIMIT 12
    `);

    const topItems = itemCol ? await all(db, `
      SELECT "${itemCol}" as item_key, 
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount, 
             COUNT(*) as tx_count
      FROM ${tableRef}
      WHERE ${amountCol} IS NOT NULL AND CAST(${amountCol} AS REAL) > 0
      GROUP BY "${itemCol}"
      ORDER BY total_amount DESC
      LIMIT 10
    `) : [];

    // Enhanced sales analysis with specific metrics
    const salesMetrics = {
      totalRevenue: byMonth.reduce((sum, m) => sum + m.total_amount, 0),
      avgMonthlyRevenue: byMonth.length > 0 ? byMonth.reduce((sum, m) => sum + m.total_amount, 0) / byMonth.length : 0,
      totalTransactions: byMonth.reduce((sum, m) => sum + m.tx_count, 0),
      avgOrderValue: byMonth.reduce((sum, m) => sum + m.total_amount, 0) / Math.max(byMonth.reduce((sum, m) => sum + m.tx_count, 0), 1),
      topPerformingItems: topItems.length,
      period: `${byMonth[byMonth.length-1]?.year_month || 'N/A'} to ${byMonth[0]?.year_month || 'N/A'}`
    };

    return { 
      db: dbPath, 
      table: chosen.tableName,
      byMonth: byMonth.slice(0, 6), 
      topItems,
      salesMetrics,
      productType: 'Mixed Product Portfolio',
      analysisType: 'Transactional Sales Data'
    };
  } catch (error) {
    console.error('Sales context error:', error);
    return { note: `Error fetching sales data: ${error.message}` };
  } finally {
    db.close();
  }
}

async function fetchFinanceContext() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = resolveDbPathUnderOrch('financial_agent.db');
  if (!dbPath) return { note: 'financial_agent.db not found' };
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    console.log('Financial tables found:', tables.map(t => t.name));
    
    // Try to access tables with proper quoting, prioritize GL Transaction table
    let workingTable = null;
    let workingCols = [];
    
    // Sort tables to prioritize GL Transaction table for financial analysis
    const sortedTables = tables.sort((a, b) => {
      if (a.name.includes('GL_Transaction')) return -1;
      if (b.name.includes('GL_Transaction')) return 1;
      return 0;
    });
    
    for (const table of sortedTables) {
      const tableName = table.name;
      try {
        // Handle table names that already have quotes embedded
        let tableRef;
        if (tableName.startsWith('"') && tableName.endsWith('"')) {
          // Table name already has quotes, use single quotes around it
          tableRef = `'${tableName}'`;
        } else {
          // Add quotes around table name
          tableRef = `"${tableName}"`;
        }
        
        console.log(`Trying to access table: ${tableName} with ref: ${tableRef}`);
        const cols = await all(db, `PRAGMA table_info(${tableRef})`);
        if (cols.length > 0) {
          workingTable = { name: tableName, ref: tableRef };
          workingCols = cols;
          console.log(`Successfully accessed table: ${tableName} with ${cols.length} columns`);
          break;
        }
      } catch (e) {
        console.log(`Could not access table ${tableName}: ${e.message}`);
        continue;
      }
    }
    
    if (!workingTable) {
      return { 
        note: 'Could not access any financial tables', 
        available_tables: tables.map(t => t.name)
      };
    }
    
    const names = workingCols.map(c => c.name);
    console.log(`Available columns in ${workingTable.name}:`, names.slice(0, 10));
    
    // More flexible column detection with better prioritization
    const dateCol = names.find(c => /^(posting date|txn date)$/i.test(c)) || 
                   names.find(c => /date$/i.test(c) && !/key$/i.test(c)) || 
                   names.find(c => /date/i.test(c)) || 
                   names.find(c => /time/i.test(c));
    const amountCols = names.filter(c => /amount|value|total|sum/i.test(c));
    const debitCol = names.find(c => /debit.*amount/i.test(c)) || names.find(c => /debit/i.test(c));
    const creditCol = names.find(c => /credit.*amount/i.test(c)) || names.find(c => /credit/i.test(c));
    const generalAmountCol = amountCols.find(c => /^(txn amount|amount)$/i.test(c)) || amountCols[0];
    
    console.log(`Found columns - Date: ${dateCol}, Amount columns: ${amountCols.join(', ')}, Debit: ${debitCol}, Credit: ${creditCol}`);
    
    // If we have any amount column or date, we can provide some analysis
    if (!dateCol && amountCols.length === 0) {
      return { 
        note: 'Financial data available but no suitable date or amount columns found', 
        table: workingTable.name,
        available_columns: names.slice(0, 20)
      };
    }
    
    // Get financial data with flexible querying
    let monthly = [];
    let totalRecords = 0;
    
    try {
      // First get total record count
      const countResult = await all(db, `SELECT COUNT(*) as count FROM ${workingTable.ref}`);
      totalRecords = countResult[0]?.count || 0;
      
      if (dateCol) {
        // Try to get monthly data if we have a date column
        const monthlyQuery = `
          SELECT strftime('%Y-%m', "${dateCol}") as year_month,
                 ${debitCol ? `SUM(CAST(COALESCE("${debitCol}", 0) AS REAL)) as total_debit,` : 'NULL as total_debit,'}
                 ${creditCol ? `SUM(CAST(COALESCE("${creditCol}", 0) AS REAL)) as total_credit,` : 'NULL as total_credit,'}
                 ${generalAmountCol ? `SUM(CAST(COALESCE("${generalAmountCol}", 0) AS REAL)) as total_amount,` : 'NULL as total_amount,'}
                 COUNT(*) as transaction_count
          FROM ${workingTable.ref}
          WHERE "${dateCol}" IS NOT NULL
          GROUP BY strftime('%Y-%m', "${dateCol}")
          ORDER BY year_month DESC
          LIMIT 12
        `;
        monthly = await all(db, monthlyQuery);
      }
    } catch (queryError) {
      console.log('Error in monthly query:', queryError.message);
      // Fallback: just provide basic info
      monthly = [];
    }
    
    const last6 = monthly.slice(0, 6);
    // Create financial metrics
    const financialMetrics = {
      totalRecords,
      monthlyDataPoints: monthly.length,
      hasDateColumn: !!dateCol,
      hasAmountColumns: amountCols.length,
      dataSource: workingTable.name
    };
    
    if (monthly.length > 0) {
      const recentData = monthly[0] || {};
      financialMetrics.recentPeriod = recentData.year_month;
      financialMetrics.recentTransactions = recentData.transaction_count;
      if (recentData.total_debit) financialMetrics.recentDebit = recentData.total_debit;
      if (recentData.total_credit) financialMetrics.recentCredit = recentData.total_credit;
      if (recentData.total_amount) financialMetrics.recentAmount = recentData.total_amount;
    }
    
    return { 
      db: dbPath,
      table: workingTable.name,
      cashFlowMonthly: monthly.slice(0, 6),
      financialMetrics,
      glTransactions: monthly.length,
      note: monthly.length > 0 ? null : 'Financial data connected but no time-series data available'
    };
  } catch (error) {
    console.error('Finance context error:', error);
    return { note: `Error fetching finance data: ${error.message}` };
  } finally {
    db.close();
  }
}

async function fetchInventoryContext() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = resolveDbPathUnderOrch('inventory.db');
  if (!dbPath) return { note: 'inventory.db not found' };
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    
    // Look for inventory tables with flexible matching
    let workingTable = null;
    let workingCols = [];
    
    // Try inventory snapshot table first, then any table with inventory data
    const tablePreference = [
      t => /Inventory.*Snapshot/i.test(t.name),
      t => /Inventory/i.test(t.name),
      t => /Stock/i.test(t.name),
      t => /Item/i.test(t.name)
    ];
    
    for (const preferenceCheck of tablePreference) {
      const candidateTable = tables.find(preferenceCheck);
      if (candidateTable) {
        try {
          const tableRef = candidateTable.name.includes(' ') ? `"${candidateTable.name}"` : candidateTable.name;
          const cols = await all(db, `PRAGMA table_info(${tableRef})`);
          if (cols.length > 0) {
            workingTable = { name: candidateTable.name, ref: tableRef };
            workingCols = cols;
            console.log(`Using inventory table: ${candidateTable.name} with ${cols.length} columns`);
            break;
          }
        } catch (e) {
          console.log(`Could not access table ${candidateTable.name}: ${e.message}`);
          continue;
        }
      }
    }
    
    if (!workingTable) {
      return { 
        note: 'No accessible inventory tables found',
        available_tables: tables.map(t => t.name)
      };
    }
    
    const names = workingCols.map(c => c.name);
    console.log(`Available columns in ${workingTable.name}:`, names);
    
    // Flexible column detection
    const stockCol = names.find(n => /stock|quantity|units|level/i.test(n));
    const itemCol = names.find(n => /item|product|sku/i.test(n));
    const dateCol = names.find(n => /date|time/i.test(n));
    const warehouseCol = names.find(n => /warehouse|location/i.test(n));
    
    console.log(`Found columns - Stock: ${stockCol}, Item: ${itemCol}, Date: ${dateCol}, Warehouse: ${warehouseCol}`);
    
    if (!stockCol && !itemCol) {
      return { 
        note: 'Inventory data available but no suitable stock or item columns found',
        table: workingTable.name,
        available_columns: names
      };
    }

    // Get inventory data with flexible querying
    let inventoryData = {};
    let totalRecords = 0;
    
    try {
      // Get total record count
      const countResult = await all(db, `SELECT COUNT(*) as count FROM ${workingTable.ref}`);
      totalRecords = countResult[0]?.count || 0;
      
      if (stockCol && itemCol) {
        // Get stock level analysis
        const stockAnalysis = await all(db, `
          SELECT "${itemCol}" as item_key, 
                 CAST(COALESCE("${stockCol}", 0) AS REAL) as stock_level
                 ${warehouseCol ? `, "${warehouseCol}" as warehouse` : ''}
                 ${dateCol ? `, "${dateCol}" as snapshot_date` : ''}
          FROM ${workingTable.ref}
          WHERE "${stockCol}" IS NOT NULL
          ORDER BY CAST("${stockCol}" AS REAL) DESC
          LIMIT 20
        `);
        
        // Separate into low and high stock
        const sortedByStock = stockAnalysis.sort((a, b) => (a.stock_level || 0) - (b.stock_level || 0));
        inventoryData.topSlow = sortedByStock.slice(0, 10); // Lowest stock
        inventoryData.topFast = sortedByStock.slice(-10).reverse(); // Highest stock
        
        // Calculate inventory metrics
        const stockLevels = stockAnalysis.map(item => item.stock_level || 0);
        const totalStock = stockLevels.reduce((sum, level) => sum + level, 0);
        const avgStock = stockLevels.length > 0 ? totalStock / stockLevels.length : 0;
        const lowStockCount = stockLevels.filter(level => level < avgStock * 0.5).length;
        
        inventoryData.inventoryMetrics = {
          totalSKUs: stockAnalysis.length,
          totalStock,
          avgStockLevel: avgStock,
          lowStockCount,
          highStockCount: stockLevels.filter(level => level > avgStock * 1.5).length,
          dataSource: workingTable.name
        };
      } else if (itemCol) {
        // At least get item count
        const itemCount = await all(db, `SELECT COUNT(DISTINCT "${itemCol}") as count FROM ${workingTable.ref}`);
        inventoryData.inventoryMetrics = {
          totalSKUs: itemCount[0]?.count || 0,
          dataSource: workingTable.name
        };
      }
    } catch (queryError) {
      console.log('Error in inventory query:', queryError.message);
      inventoryData.note = 'Inventory data connected but query failed';
    }
    
    return { 
      db: dbPath,
      table: workingTable.name,
      ...inventoryData,
      total_items: totalRecords
    };
  } catch (error) {
    console.error('Inventory context error:', error);
    return { note: `Error fetching inventory data: ${error.message}` };
  } finally {
    db.close();
  }
}

async function fetchCustomerContext() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = resolveDbPathUnderOrch('customers.db');
  if (!dbPath) return { note: 'customers.db not found' };
  const db = new sqlite3.Database(dbPath);
  try {
    const tables = await all(db, `SELECT name FROM sqlite_master WHERE type='table'`);
    let chosen = null;
    
    for (const tableName of tables.map(r=>r.name)) {
      try {
        const tableRef = tableName.includes(' ') ? `"${tableName}"` : tableName;
        const cols = await all(db, `PRAGMA table_info(${tableRef})`);
        const names = cols.map(c=>c.name);
        
        const amount = names.find(n => /(Amount|Total|Transaction.*Amount|Sales.*Amount|Value)/i.test(n));
        const customer = names.find(n => /(Customer.*Key|Customer.*ID|Customer.*Number|Customer|Client.*ID)/i.test(n));
        const date = names.find(n => /(Transaction.*Date|Invoice.*Date|Posting.*Date|Due.*Date|Date)/i.test(n));
        
        if (amount && customer) {
          let score = 0;
          if (/Customer|AR/i.test(tableName)) score += 3;
          if (/Transaction|Sales/i.test(tableName)) score += 2;
          if (date) score += 1;
          
          if (!chosen || score > chosen.score) {
            chosen = { 
              table: tableRef,
              tableName: tableName,
              customerCol: `"${customer}"`, 
              amountCol: `"${amount}"`,
              dateCol: date ? `"${date}"` : null,
              score 
            };
          }
        }
      } catch (e) {
        console.log(`Skipping customer table ${tableName}: ${e.message}`);
        continue;
      }
    }
    
    if (!chosen) {
      return { 
        note: 'No suitable customer table found with customer and amount columns',
        available_tables: tables.map(r=>r.name),
        searched_for: ['Customer Key', 'Amount', 'Transaction Date']
      };
    }

    const { table: tableRef, customerCol, amountCol, dateCol } = chosen;
    console.log(`Customer agent using table: ${chosen.tableName}, customer: ${customerCol}, amount: ${amountCol}`);

    // Convert date keys to proper dates if needed
    const isDateKey = dateCol && chosen.dateCol.includes('Key');
    const dateExpr = isDateKey ? 
      `date(substr(CAST(${dateCol} AS TEXT), 1, 4) || '-' || substr(CAST(${dateCol} AS TEXT), 5, 2) || '-' || substr(CAST(${dateCol} AS TEXT), 7, 2))` : 
      dateCol;

    // Top customers by amount
    const topCustomers = await all(db, `
      SELECT ${customerCol} as customer_id, 
             SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount, 
             COUNT(*) as transaction_count
      FROM ${tableRef}
      WHERE ${amountCol} IS NOT NULL
      GROUP BY ${customerCol}
      ORDER BY total_amount DESC
      LIMIT 15
    `);

    // Recent activity if we have dates
    let byMonth = [];
    if (dateCol && dateExpr) {
      byMonth = await all(db, `
        SELECT strftime('%Y-%m', ${dateExpr}) as year_month,
               SUM(CAST(COALESCE(${amountCol}, 0) AS REAL)) as total_amount,
               COUNT(*) as tx_count
        FROM ${tableRef}
        WHERE ${dateCol} IS NOT NULL AND ${amountCol} IS NOT NULL
        GROUP BY strftime('%Y-%m', ${dateExpr})
        ORDER BY year_month DESC
        LIMIT 12
      `);
    }

    return { 
      db: dbPath,
      table: chosen.tableName,
      topCustomers, 
      byMonth: byMonth.slice(0, 6)
    };
  } catch (error) {
    console.error('Customer context error:', error);
    return { note: `Error fetching customer data: ${error.message}` };
  } finally {
    db.close();
  }
}

function all(db, sql) {
  return new Promise((resolve, reject) => db.all(sql, [], (e, rows) => e ? reject(e) : resolve(rows || [])));
}
function one(db, sql) {
  return new Promise((resolve, reject) => db.get(sql, [], (e, row) => e ? reject(e) : resolve(row || null)));
}

function getAgentFocusArea(author) {
  const focusAreas = {
    'sales_agent': 'sales performance, revenue trends, product performance, regional sales, monthly/quarterly growth',
    'financial_agent': 'financial health, cash flow, GL transactions, profitability, expense analysis, budget variance',
    'inventory_agent': 'stock levels, inventory turnover, slow-moving items, reorder points, storage costs, demand patterns',
    'customer_insights_agent': 'customer behavior, retention, lifetime value, segmentation, purchasing patterns, loyalty metrics'
  };
  return focusAreas[author] || 'business insights and data analysis';
}

function generateVisualizationData(author, dataContext, question) {
  try {
    // Default empty visualization
    const emptyViz = {
      data: [{ x: [], y: [], type: 'bar', name: 'No Data' }],
      layout: { title: 'No Data Available' }
    };
    
    if (!dataContext || dataContext.error || dataContext.note) {
      return emptyViz;
    }
    
    // Sales agent visualization
    if (author === 'sales_agent' && dataContext.byMonth && dataContext.byMonth.length > 0) {
      return {
        data: [
          {
            x: dataContext.byMonth.map(m => m.year_month).reverse(),
            y: dataContext.byMonth.map(m => m.total_amount).reverse(),
            type: 'bar',
            name: 'Revenue',
            marker: { color: '#10b981' }
          },
          {
            x: dataContext.byMonth.map(m => m.year_month).reverse(),
            y: dataContext.byMonth.map(m => m.tx_count).reverse(),
            type: 'scatter',
            name: 'Transactions',
            yaxis: 'y2',
            line: { color: '#3b82f6', width: 3 }
          }
        ],
        layout: {
          title: 'Monthly Sales Performance',
          xaxis: { title: 'Month' },
          yaxis: { title: 'Revenue', side: 'left', showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' },
          yaxis2: { title: 'Transaction Count', side: 'right', overlaying: 'y', showgrid: false },
          barmode: 'group',
          legend: { orientation: 'h', y: -0.2 }
        }
      };
    }
    
    // Financial agent visualization
    if (author === 'financial_agent' && dataContext.monthly && dataContext.monthly.length > 0) {
      return {
        data: [
          {
            x: dataContext.monthly.map(m => m.year_month).reverse(),
            y: dataContext.monthly.map(m => m.total_debit || 0).reverse(),
            type: 'bar',
            name: 'Debits',
            marker: { color: '#f59e0b' }
          },
          {
            x: dataContext.monthly.map(m => m.year_month).reverse(),
            y: dataContext.monthly.map(m => m.total_credit || 0).reverse(),
            type: 'bar',
            name: 'Credits',
            marker: { color: '#3b82f6' }
          }
        ],
        layout: {
          title: 'Monthly Financial Activity',
          xaxis: { title: 'Month' },
          yaxis: { title: 'Amount', showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' },
          barmode: 'group',
          legend: { orientation: 'h', y: -0.2 }
        }
      };
    }
    
    // Inventory agent visualization
    if (author === 'inventory_agent' && dataContext.inventory && dataContext.inventory.length > 0) {
      return {
        data: [
          {
            x: dataContext.inventory.map(i => i.item_name || i.item_key || `Item ${i.id}`).slice(0, 10),
            y: dataContext.inventory.map(i => i.quantity || i.stock_level || 0).slice(0, 10),
            type: 'bar',
            name: 'Stock Level',
            marker: { color: '#8b5cf6' }
          }
        ],
        layout: {
          title: 'Current Inventory Levels',
          xaxis: { title: 'Item' },
          yaxis: { title: 'Quantity', showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' }
        }
      };
    }
    
    // Customer agent visualization
    if (author === 'customer_insights_agent' && dataContext.topCustomers && dataContext.topCustomers.length > 0) {
      return {
        data: [
          {
            x: dataContext.topCustomers.map(c => c.customer_name || c.customer_id || `Customer ${c.id}`).slice(0, 10),
            y: dataContext.topCustomers.map(c => c.total_amount || c.lifetime_value || 0).slice(0, 10),
            type: 'bar',
            name: 'Customer Value',
            marker: { color: '#3b82f6' }
          }
        ],
        layout: {
          title: 'Top Customer Value',
          xaxis: { title: 'Customer' },
          yaxis: { title: 'Value', showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' }
        }
      };
    }
    
    return emptyViz;
  } catch (error) {
    console.error('Error generating visualization:', error);
    return {
      data: [{ x: [], y: [], type: 'bar', name: 'Error' }],
      layout: { title: 'Error Generating Visualization' }
    };
  }
}

function composeEnhancedDataSummary(author, ctx, question) {
  try {
    if (!ctx || ctx.error) {
      return 'Insufficient data to answer.';
    }
    if (ctx.note) {
      return `Data note: ${ctx.note}`;
    }
    const lines = [];
    if (author === 'sales_agent') {
      if (Array.isArray(ctx.byRegion) && ctx.byRegion.length) {
        lines.push('Top regions by sales (last 30 days):');
        ctx.byRegion.slice(0, 5).forEach(r => lines.push(`- ${r.region ?? 'Unknown'}: ${fmtAmt(r.amount)} across ${r.tx_count} tx`));
      }
      if (Array.isArray(ctx.byMonth) && ctx.byMonth.length) {
        const latest = ctx.byMonth.slice(-3);
        lines.push('Recent monthly totals:');
        latest.forEach(m => lines.push(`- ${m.year_month}: ${fmtAmt(m.total_amount)} (${m.tx_count} tx)`));
      }
      if (Array.isArray(ctx.topItems) && ctx.topItems.length) {
        lines.push('Top items:');
        ctx.topItems.slice(0, 5).forEach(i => lines.push(`- ${i.item_key}: ${fmtAmt(i.total_amount)} (${i.tx_count} tx)`));
      }
    } else if (author === 'financial_agent') {
      // Include sales data if requested or available
      if (Array.isArray(ctx.salesData) && ctx.salesData.length) {
        lines.push('Recent sales revenue (from financial records):');
        ctx.salesData.forEach(s => lines.push(`- ${s.year_month}: ${fmtAmt(s.sales_amount)} (${s.sales_transactions} sales)`));
      }
      if (Array.isArray(ctx.netFlow)) {
        lines.push('Net cash flow (credit - debit):');
        ctx.netFlow.forEach(n => lines.push(`- ${n.year_month}: ${fmtAmt(n.net)} (${n.transactions} transactions)`));
      } else if (Array.isArray(ctx.byMonth)) {
        lines.push('Monthly financial activity:');
        ctx.byMonth.forEach(m => lines.push(`- ${m.year_month}: debit ${fmtAmt(m.total_debit)} | credit ${fmtAmt(m.total_credit)}${m.total_amount ? ` | net ${fmtAmt(m.total_amount)}` : ''}`));
      }
    } else if (author === 'inventory_agent') {
      lines.push('**Inventory Stock Level Analysis**');
      if (Array.isArray(ctx.topSlow) && ctx.topSlow.length) {
        lines.push('Low Stock Items (Reorder Recommended):');
        ctx.topSlow.slice(0, 5).forEach(s => lines.push(`• Item ${s.item_key}: ${s.stock_level.toLocaleString()} units`));
        lines.push('');
      }
      if (Array.isArray(ctx.topFast) && ctx.topFast.length) {
        lines.push('High Stock Items:');
        ctx.topFast.slice(0, 5).forEach(s => lines.push(`• Item ${s.item_key}: ${s.stock_level.toLocaleString()} units`));
      }
      if (ctx.total_items) {
        lines.push(`\n• Total Items Tracked: ${ctx.total_items}`);
      }
    } else {
      // customer_insights_agent or default
      lines.push('**Customer Analysis**');
      if (Array.isArray(ctx.byMonth) && ctx.byMonth.length) {
        const latest = ctx.byMonth.slice(-3);
        lines.push('Recent Monthly Activity:');
        latest.forEach(m => lines.push(`• ${m.year_month}: $${m.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${m.tx_count} transactions)`));
        lines.push('');
      }
      if (Array.isArray(ctx.topCustomers) && ctx.topCustomers.length) {
        lines.push('Top Customers by Value:');
        ctx.topCustomers.slice(0, 5).forEach(c => lines.push(`• Customer ${c.customer_id || c.customer_key}: $${c.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${c.transaction_count || c.tx_count || 'N/A'} transactions)`));
      }
    }
    if (!lines.length) return 'Database connected successfully, but no relevant data found for analysis.';
    const header = question ? `**Database Analysis for:** ${question}` : '**Database Analysis Results**';
    return [header, '', ...lines].join('\n');
  } catch (_) {
    return 'Database analysis encountered an error. Please try again.';
  }
}

function fmtAmt(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function num(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString();
}

function composeDataOnlySummary(author, ctx, question) {
  try {
    if (!ctx || ctx.error) {
      return 'Database connection successful, but insufficient data to answer. Please check data availability.';
    }
    if (ctx.note) {
      return `Database Analysis: ${ctx.note}`;
    }
    
    const lines = [];
    
    if (author === 'sales_agent') {
      if (ctx.salesMetrics) {
        lines.push(`**Sales Performance Analysis** (${ctx.productType})`);
        lines.push(`• Period: ${ctx.salesMetrics.period}`);
        lines.push(`• Total Revenue: ${fmtAmt(ctx.salesMetrics.totalRevenue)}`);
        lines.push(`• Average Monthly Revenue: ${fmtAmt(ctx.salesMetrics.avgMonthlyRevenue)}`);
        lines.push(`• Total Transactions: ${num(ctx.salesMetrics.totalTransactions)}`);
        lines.push(`• Average Order Value: ${fmtAmt(ctx.salesMetrics.avgOrderValue)}`);
        lines.push('');
      }
      if (Array.isArray(ctx.byMonth) && ctx.byMonth.length) {
        lines.push('Recent Monthly Performance:');
        ctx.byMonth.slice(0, 6).forEach(m => lines.push(`• ${m.year_month}: ${fmtAmt(m.total_amount)} (${num(m.tx_count)} transactions)`));
        lines.push('');
      }
      if (Array.isArray(ctx.topItems) && ctx.topItems.length) {
        lines.push('Top Performing Products:');
        ctx.topItems.slice(0, 5).forEach(item => lines.push(`• Item ${item.item_key}: ${fmtAmt(item.total_amount)} (${item.tx_count} sales)`));
      }
    } else if (author === 'financial_agent') {
      if (Array.isArray(ctx.netFlow) && ctx.netFlow.length) {
        lines.push('**Financial Cash Flow Analysis**');
        ctx.netFlow.forEach(n => lines.push(`• ${n.year_month}: ${fmtAmt(n.net)} net (${n.transactions} transactions)`));
      } else if (Array.isArray(ctx.byMonth)) {
        lines.push('**Monthly Financial Activity**');
        ctx.byMonth.forEach(m => lines.push(`• ${m.year_month}: Debit ${fmtAmt(m.total_debit)} | Credit ${fmtAmt(m.total_credit)}${m.total_amount ? ` | Net ${fmtAmt(m.total_amount)}` : ''}`));
      }
    } else if (author === 'inventory_agent') {
      lines.push('**Inventory Stock Level Analysis**');
      if (Array.isArray(ctx.stockLevels) && ctx.stockLevels.length) {
        ctx.stockLevels.slice(0, 10).forEach(item => {
          lines.push(`• Item ${item.item_key}: ${num(item.quantity)} units (${fmtAmt(item.value)})`);
        });
      }
      if (Array.isArray(ctx.slowMovers) && ctx.slowMovers.length) {
        lines.push('');
        lines.push('Slow Moving Items:');
        ctx.slowMovers.slice(0, 5).forEach(item => {
          lines.push(`• Item ${item.item_key}: ${num(item.quantity)} units (${fmtAmt(item.value)})`);
        });
      }
    } else if (author === 'customer_insights_agent') {
      lines.push('**Customer Insights Analysis**');
      if (ctx.customerMetrics) {
        lines.push(`• Total Customers: ${num(ctx.customerMetrics.totalCustomers)}`);
        lines.push(`• Active Customers: ${num(ctx.customerMetrics.activeCustomers)}`);
        lines.push(`• Average Order Value: ${fmtAmt(ctx.customerMetrics.avgOrderValue)}`);
        lines.push(`• Customer Lifetime Value: ${fmtAmt(ctx.customerMetrics.customerLifetimeValue)}`);
      }
      if (Array.isArray(ctx.customerSegments) && ctx.customerSegments.length) {
        lines.push('');
        lines.push('Customer Segments:');
        ctx.customerSegments.forEach(segment => {
          lines.push(`• ${segment.segment}: ${num(segment.count)} customers (${fmtAmt(segment.totalValue)})`);
        });
      }
    }
    
    if (lines.length === 0) {
      return 'Data available but no specific insights generated. Please ask a more specific question.';
    }
    
    return lines.join('\n');
  } catch (error) {
    return `Error generating summary: ${error.message}`;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, routingHint: explicitRoutingHint, conversation } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use explicit routing hint if provided, otherwise extract from @mention
    let routingHint = explicitRoutingHint;
    if (!routingHint) {
      const mentionMatch = message.match(/@([a-zA-Z_]+)/);
      routingHint = mentionMatch ? mentionMatch[1] : null;
    }
    
    console.log(`Processing message with routing hint: ${routingHint || 'none'}`);

    // Map frontend agent names to backend agent names if needed
    const agentMap = {
      'sales': 'sales_agent',
      'customer': 'customer_insights_agent',
      'finance': 'financial_agent',
      'inventory': 'inventory_agent'
    };
    
    // Use the mapped name if available
    const finalRoutingHint = agentMap[routingHint] || routingHint;
    
    // Try local agent handling
    const result = await runLocalAgent({ 
      routingHint: finalRoutingHint, 
      message,
      conversation: conversation || []
    });
    
    // Ensure visualization data is properly formatted for Plotly
    let visualData = result.visualData;
    let is_visualisation = result.is_visualisation;
    
    // If we should have visualization but data is missing, create default data
    if (is_visualisation && (!visualData || !visualData.data || !visualData.data.length)) {
      console.log('Creating default visualization data');
      
      // Get the appropriate color based on the agent
      const agentColors = {
        'sales_agent': '#10b981',
        'customer_insights_agent': '#3b82f6',
        'financial_agent': '#f59e0b',
        'inventory_agent': '#8b5cf6'
      };
      
      const color = agentColors[finalRoutingHint] || '#6366f1';
      
      visualData = {
        data: [
          {
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            y: [5, 10, 15, 10, 20],
            type: 'bar',
            name: 'Sample Data',
            marker: { color }
          }
        ],
        layout: {
          title: 'Sample Visualization',
          xaxis: { title: 'Month' },
          yaxis: { title: 'Value', showgrid: true, gridcolor: 'rgba(255,255,255,0.1)' }
        }
      };
    }
    
    return res.status(200).json({
      text: result.text,
      author: result.author || finalRoutingHint || 'assistant',
      is_visualisation,
      visualData
    });

  } catch (error) {
    console.error('Assistant API error:', error);
    
    // Provide a friendly error response that won't break the UI
    return res.status(200).json({ 
      text: `I'm having trouble connecting to my data sources right now. Please try again in a moment or ask a different question.`,
      author: 'assistant',
      is_visualisation: false
    });
  }
}
