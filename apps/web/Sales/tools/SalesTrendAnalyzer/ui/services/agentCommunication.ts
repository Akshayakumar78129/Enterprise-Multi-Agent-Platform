// Agent Communication Service for Main Department Agents
import { getAgentByName, AgentInfo } from '../config/agentRegistry';
import { SalesContext, createContextSummary } from '../utils/contextPacker';
import { fetchCrossDashboardData, createCrossDashboardSummary } from './dataFetcher';

export interface AgentMessage {
  id: string;
  content: string;
  agentName: string;
  agentDisplayName: string;
  agentAvatar: string;
  agentColor: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface AgentResponse {
  success: boolean;
  content: string;
  agentInfo: AgentInfo;
  processingTime: number;
  error?: string;
}

/**
 * Sends a message to a specific agent
 */
export const sendMessageToAgent = async (
  agentName: string,
  userMessage: string,
  context: SalesContext
): Promise<AgentResponse> => {
  const startTime = Date.now();
  const agent = getAgentByName(agentName);
  
  if (!agent) {
    return {
      success: false,
      content: '',
      agentInfo: {
        agentName: 'unknown',
        displayName: 'Unknown Agent',
        avatar: '❓',
        description: '',
        color: '#6b7280',
        department: '',
        capabilities: []
      },
      processingTime: 0,
      error: `Agent '${agentName}' not found`
    };
  }

  // Instant detailed summary for core agents (no network). Uses full time-series context.
  if (['sales', 'customer', 'finance', 'inventory'].includes(agent.agentName)) {
    const lp = context.userInteractions?.lastClickedPoint;
    const period = lp?.period || lp?.date || context.filters?.endDate || 'current period';

    // Build dataset from context
    const series = Array.isArray(context.currentData?.mainData) ? context.currentData!.mainData : [];
    const values = series.map(d => Number(d.revenue ?? d.value ?? 0));

    // Basic stats
    const total = values.reduce((s, v) => s + v, 0);
    const count = values.length || 1;
    const avg = total / count;
    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const totalChangePct = first ? ((last - first) / first) * 100 : 0;

    // Month-over-month changes (or period-over-period)
    const deltas = values.slice(1).map((v, i) => ({
      idx: i + 1,
      abs: v - values[i],
      pct: values[i] ? ((v - values[i]) / values[i]) * 100 : 0
    }));

    // Identify peaks and troughs
    let peakIdx = -1, troughIdx = -1;
    let peakVal = -Infinity, troughVal = Infinity;
    values.forEach((v, i) => {
      if (v > peakVal) { peakVal = v; peakIdx = i; }
      if (v < troughVal) { troughVal = v; troughIdx = i; }
    });
    const peakLabel = series[peakIdx]?.period ?? series[peakIdx]?.date ?? 'N/A';
    const troughLabel = series[troughIdx]?.period ?? series[troughIdx]?.date ?? 'N/A';

    // Simple seasonality proxy: average by month if month exists
    const monthBuckets: Record<string, number[]> = {};
    series.forEach(d => {
      const m = (d.month || (d.period?.slice(5,7)) || (d.date?.slice(5,7)) || '').padStart(2,'0');
      if (!m || m === 'NaN') return;
      monthBuckets[m] = monthBuckets[m] || [];
      monthBuckets[m].push(Number(d.revenue ?? d.value ?? 0));
    });
    const monthAverages = Object.entries(monthBuckets).map(([m, arr]) => ({ m, avg: arr.reduce((s,v)=>s+v,0)/arr.length }));
    monthAverages.sort((a,b)=>b.avg-a.avg);
    const seasonalTop = monthAverages[0];
    const seasonalBottom = monthAverages[monthAverages.length-1];

    // Compose bullets by agent
    const bullets = (() => {
      switch (agent.agentName) {
        case 'sales':
          return [
            `• Overall trend: ${totalChangePct>=0?'+':''}${totalChangePct.toFixed(1)}% from start to latest`,
            `• Average period value: $${Math.round(avg).toLocaleString()} across ${count} periods`,
            `• Peak: ${peakLabel} at $${Math.round(peakVal).toLocaleString()} | Low: ${troughLabel} at $${Math.round(troughVal).toLocaleString()}`,
            deltas.length?`• Recent change: ${deltas.at(-1)!.pct>=0?'+':''}${deltas.at(-1)!.pct.toFixed(1)}% vs previous period`:`• Recent change: insufficient data`,
            seasonalTop&&seasonalBottom?`• Seasonality: strongest ${seasonalTop.m}, weakest ${seasonalBottom.m}`:`• Seasonality: not enough monthly coverage`,
            `• Recommendation: double-down on peak periods; lift weak months with targeted plays`
          ];
        case 'customer':
          return [
            `• Revenue stability proxy: avg $${Math.round(avg).toLocaleString()}, volatility ${coefOfVar(values).toFixed(2)}`,
            `• Cohort signal: recent change ${deltas.length? (deltas.at(-1)!.pct>=0?'+':'')+deltas.at(-1)!.pct.toFixed(1)+'%':'n/a'}`,
            seasonalTop&&seasonalBottom?`• Engagement seasonality: best ${seasonalTop.m}, weakest ${seasonalBottom.m}`:`• Engagement seasonality: limited evidence`,
            `• Churn risk proxy: trough ${troughLabel} may mark vulnerable cohorts`,
            `• CLV focus: protect top months; nurture low seasons`,
            `• Action: targeted offers, win-backs, and loyalty boosts in soft periods`
          ];
        case 'finance':
          return [
            `• Topline trend: ${totalChangePct>=0?'+':''}${totalChangePct.toFixed(1)}% across timeframe`,
            `• Run-rate: ~$${Math.round(avg).toLocaleString()} per period (avg)`,
            `• Peak vs low spread: $${Math.round(peakVal-troughVal).toLocaleString()} swing`,
            deltas.length?`• Latest delta: ${deltas.at(-1)!.pct>=0?'+':''}${deltas.at(-1)!.pct.toFixed(1)}% period-over-period`:`• Latest delta: insufficient data`,
            seasonalTop&&seasonalBottom?`• Seasonality impact: peak ${seasonalTop.m} vs ${seasonalBottom.m}`:`• Seasonality impact: limited`,
            `• Action: align spend with peaks; trim low-ROI costs in soft months`
          ];
        case 'inventory':
          return [
            `• Demand trend: ${totalChangePct>=0?'+':''}${totalChangePct.toFixed(1)}% over timeframe`,
            `• Average demand: $${Math.round(avg).toLocaleString()} per period`,
            `• Peak period: ${peakLabel}; trough period: ${troughLabel}`,
            seasonalTop&&seasonalBottom?`• Seasonality: stock up for ${seasonalTop.m}; reduce for ${seasonalBottom.m}`:`• Seasonality: limited visibility`,
            `• Risk: avoid outages in peaks; reduce overstock in lows`,
            `• Action: tune reorder points and lead times to seasonal profile`
          ];
        default:
          return [
            `• Trend: ${totalChangePct>=0?'+':''}${totalChangePct.toFixed(1)}% from start to latest`,
            `• Average: $${Math.round(avg).toLocaleString()} across ${count} periods`,
            `• Peak/Low: ${peakLabel}/${troughLabel}`,
            deltas.length?`• Latest change: ${deltas.at(-1)!.pct>=0?'+':''}${deltas.at(-1)!.pct.toFixed(1)}%`:`• Latest change: n/a`,
            seasonalTop&&seasonalBottom?`• Seasonality: top ${seasonalTop.m}, bottom ${seasonalBottom.m}`:`• Seasonality: n/a`,
            `• Next: focus resources to maximize peak windows`
          ];
      }
    })();

    // Helper for volatility
    function coefOfVar(arr: number[]): number {
      if (!arr.length) return 0;
      const mean = arr.reduce((s,v)=>s+v,0)/arr.length || 1;
      const variance = arr.reduce((s,v)=>s+(v-mean)*(v-mean),0)/arr.length;
      return Math.sqrt(variance)/mean;
    }

    return {
      success: true,
      content: `**${agent.displayName} — Detailed Summary (${period})**\n\n${bullets.join('\n')}`,
      agentInfo: agent,
      processingTime: Date.now() - startTime
    };
  }

  try {
    // Fetch relevant cross-dashboard data for this agent
    console.log(`🔍 Fetching cross-dashboard data for ${agentName}...`);
    const crossDashboardData = await fetchCrossDashboardData(agentName, userMessage);
    console.log(`✅ Cross-dashboard data fetched for ${agentName}:`, Object.keys(crossDashboardData));
    
    // Prepare the enhanced prompt with context and cross-dashboard data
    const enhancedPrompt = createAgentPrompt(agent, userMessage, context, crossDashboardData);

    const response = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        agentName: agent.agentName,
        context: {
          department: 'Sales',
          tool: 'SalesTrendAnalyzer',
          userQuery: userMessage,
          dataContext: context
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    // Format the response to ensure proper bullet point display
    let formattedContent = result.explanation || result.content || 'No response received from agent.';
    
    // Fix bullet point formatting - ensure each bullet point is on a new line
    formattedContent = formattedContent
      .replace(/•(?!\s)/g, '• ')  // Ensure space after bullet
      .replace(/\.\s*•/g, '.\n\n• ')  // Add line breaks between bullet points
      .replace(/•\s*\*\*/g, '\n• **')  // Handle bullet + bold formatting
      .replace(/([^.\n])\s*•/g, '$1\n\n• ')  // Ensure bullets start on new line
      .trim();

    return {
      success: true,
      content: formattedContent,
      agentInfo: agent,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Error communicating with agent ${agentName}:`, error);
    
    return {
      success: false,
      content: '',
      agentInfo: agent,
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Sends message to multiple agents (for complex queries)
 */
export const sendMessageToMultipleAgents = async (
  agentNames: string[],
  userMessage: string,
  context: SalesContext
): Promise<AgentResponse[]> => {
  const promises = agentNames.map(agentName => 
    sendMessageToAgent(agentName, userMessage, context)
  );

  return Promise.all(promises);
};

/**
 * Creates an enhanced prompt with agent-specific context
 */
const createAgentPrompt = (
  agent: AgentInfo,
  userMessage: string,
  context: SalesContext,
  crossDashboardData?: any
): string => {
  const contextSummary = createContextSummary(context);
  
  // Enhanced context with clicked data point information
  let clickedDataContext = '';
  if (context.userInteractions.lastClickedPoint) {
    const point = context.userInteractions.lastClickedPoint;
    clickedDataContext = `

🎯 **USER CLICKED DATA POINT CONTEXT:**
- Date/Period: ${point.date || point.period || 'Unknown'}
- Metric: ${point.metricName || context.filters.metric}
- Value: $${point.value?.toLocaleString() || 'Unknown'}
- Previous Value: $${point.previousValue?.toLocaleString() || 'Unknown'}
- Change: ${point.percentChange !== undefined ? `${point.percentChange >= 0 ? '+' : ''}${point.percentChange.toFixed(1)}%` : 'Unknown'}

**Use this specific data point information in your analysis. Reference these exact numbers and dates.**`;
  }

  // Get recent comparable data for context
  let comparativeData = '';
  if (context.currentData.mainData && context.currentData.mainData.length > 0) {
    const recentData = context.currentData.mainData.slice(-6);
    const dataPoints = recentData.map(d => `${d.period}: $${d.revenue?.toLocaleString() || d.value?.toLocaleString() || '0'}`).join(', ');
    comparativeData = `

📊 **RECENT PERFORMANCE DATA:**
${dataPoints}`;
  }

  // Add cross-dashboard data summary
  let crossDataSummary = '';
  if (crossDashboardData) {
    crossDataSummary = createCrossDashboardSummary(crossDashboardData);
    
    // Add specific data details for each agent type with contextual insights
    const clickedDate = context.userInteractions?.lastClickedPoint?.date;
    const clickedValue = context.userInteractions?.lastClickedPoint?.value;
    const clickedMetric = context.userInteractions?.lastClickedPoint?.metricName;

    if (agent.agentName === 'customer' && crossDashboardData.churnPrediction?.data) {
      const churnData = crossDashboardData.churnPrediction.data;
      if (churnData.length > 0) {
        const highRiskCustomers = churnData.filter((c: any) => c.churn_risk > 0.7).length;
        const criticalRiskCustomers = churnData.filter((c: any) => c.churn_risk > 0.8).length;
        const avgRisk = churnData.reduce((sum: number, c: any) => sum + (c.churn_risk || 0), 0) / churnData.length;
        const avgCLVAtRisk = churnData
          .filter((c: any) => c.churn_risk > 0.7)
          .reduce((sum: number, c: any) => sum + (c.clv || 0), 0) / (highRiskCustomers || 1);

        crossDataSummary += `

🚨 **CUSTOMER RETENTION ANALYSIS (${clickedDate}):**
- Critical Risk Customers: ${criticalRiskCustomers} (>80% churn probability)
- High Risk Customers: ${highRiskCustomers} (>70% churn risk)
- Average Churn Risk: ${(avgRisk * 100).toFixed(1)}%
- Revenue at Risk: $${avgCLVAtRisk.toFixed(0)} avg CLV per at-risk customer
- Retention Impact: High-risk customers could affect ${((highRiskCustomers/churnData.length)*100).toFixed(1)}% of customer base`;
      }
    }

    if (agent.agentName === 'customer' && crossDashboardData.customerLifetimeValue?.data) {
      const clvData = crossDashboardData.customerLifetimeValue.data;
      if (clvData.length > 0) {
        const avgCLV = clvData.reduce((sum: number, c: any) => sum + (c.lifetime_value || 0), 0) / clvData.length;
        const topTier = clvData.filter((c: any) => c.lifetime_value > avgCLV * 1.5).length;
        const premiumCustomers = clvData.filter((c: any) => c.lifetime_value > 50000).length;
        const longTermCustomers = clvData.filter((c: any) => c.months_active > 24).length;

        crossDataSummary += `

💰 **CUSTOMER VALUE ANALYSIS (Period: ${clickedDate}):**
- Average Customer LTV: $${avgCLV.toLocaleString()}
- Premium Customers (>$50k): ${premiumCustomers} customers
- High-Value Customers: ${topTier} customers (>150% of average)
- Long-term Customers: ${longTermCustomers} (>2 years active)
- Revenue Concentration: Top tier represents ${((topTier/clvData.length)*100).toFixed(1)}% of customer base`;
      }
    }

    if (agent.agentName === 'customer' && crossDashboardData.customerSegmentation?.data) {
      const segData = crossDashboardData.customerSegmentation.data;
      if (segData.length > 0) {
        const champions = segData.find((s: any) => s.segment === 'Champions');
        const atRisk = segData.find((s: any) => s.segment === 'At Risk');
        const totalValue = segData.reduce((sum: number, s: any) => sum + (s.value || 0), 0);
        
        crossDataSummary += `

👥 **CUSTOMER SEGMENTATION (${clickedDate}):**
- Champions: ${champions?.count || 0} customers (${champions?.percentage || 0}%) - $${(champions?.value || 0).toLocaleString()}
- At Risk Segment: ${atRisk?.count || 0} customers (${atRisk?.percentage || 0}%) - $${(atRisk?.value || 0).toLocaleString()}
- Total Customer Value: $${totalValue.toLocaleString()}
- Segment Health: ${((champions?.percentage || 0) > 15) ? 'Strong champion base' : 'Need to grow champions'}`;
      }
    }

    if (agent.agentName === 'customer' && crossDashboardData.purchaseFrequency?.data) {
      const freqData = crossDashboardData.purchaseFrequency.data;
      if (freqData.length > 0 && freqData[0].bins) {
        const binData = freqData[0].bins;
        const highFreq = binData.filter((b: any) => parseInt(b.range?.split('-')[0] || '0') > 10);
        const lowFreq = binData.filter((b: any) => parseInt(b.range?.split('-')[1] || b.range?.split('-')[0] || '0') <= 5);
        
        crossDataSummary += `

🛒 **PURCHASE BEHAVIOR (${clickedDate}):**
- High-Frequency Customers: ${highFreq.length} segments (11+ purchases)
- Low-Frequency Risk: ${lowFreq.reduce((sum: any, b: any) => sum + b.count, 0)} customers (≤5 purchases)
- Frequency Distribution: Most customers (${binData.find((b: any) => b.percentage === Math.max(...binData.map((x: any) => x.percentage)))?.range}) purchase range
- Engagement Opportunity: ${((lowFreq.reduce((sum: any, b: any) => sum + b.count, 0) / binData.reduce((sum: any, b: any) => sum + b.count, 0)) * 100).toFixed(1)}% could increase frequency`;
      }
    }

    // Sales Agent Cross-Dashboard Data
    if (agent.agentName === 'sales' && crossDashboardData.productPerformance?.data) {
      const prodData = crossDashboardData.productPerformance.data;
      if (prodData.length > 0) {
        const topPerformer = prodData.reduce((max: any, p: any) => p.revenue > max.revenue ? p : max);
        const avgMargin = prodData.reduce((sum: number, p: any) => sum + (p.profit_margin || 0), 0) / prodData.length;
        const totalRevenue = prodData.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
        
        crossDataSummary += `

📊 **PRODUCT PERFORMANCE ANALYSIS (${clickedDate}):**
- Top Revenue Product: ${topPerformer.product} - $${topPerformer.revenue.toLocaleString()}
- Average Profit Margin: ${(avgMargin * 100).toFixed(1)}%
- Total Product Revenue: $${totalRevenue.toLocaleString()}
- Product Mix Impact: ${prodData.length} active products contributing to ${clickedMetric} performance`;
      }
    }

    if (agent.agentName === 'sales' && crossDashboardData.regionalSales?.data) {
      const regionData = crossDashboardData.regionalSales.data;
      if (regionData.length > 0) {
        const topRegion = regionData.reduce((max: any, r: any) => r.revenue > max.revenue ? r : max);
        const fastestGrowth = regionData.reduce((max: any, r: any) => r.growth > max.growth ? r : max);
        const totalCustomers = regionData.reduce((sum: number, r: any) => sum + (r.customers || 0), 0);
        
        crossDataSummary += `

🌍 **REGIONAL SALES BREAKDOWN (${clickedDate}):**
- Top Revenue Region: ${topRegion.region} - $${topRegion.revenue.toLocaleString()}
- Fastest Growing: ${fastestGrowth.region} (+${(fastestGrowth.growth * 100).toFixed(1)}% growth)
- Total Customer Base: ${totalCustomers.toLocaleString()} customers across regions
- Regional Contribution: ${regionData.length} regions driving December performance`;
      }
    }

    // Inventory Agent Cross-Dashboard Data
    if (agent.agentName === 'inventory' && crossDashboardData.inventoryLevels?.data) {
      const invData = crossDashboardData.inventoryLevels.data;
      if (invData.length > 0) {
        const criticalItems = invData.filter((i: any) => i.status === 'Critical').length;
        const lowStockItems = invData.filter((i: any) => i.status === 'Low Stock').length;
        const overstockedItems = invData.filter((i: any) => i.status === 'Overstocked').length;
        
        crossDataSummary += `

📦 **INVENTORY STATUS (Impact on ${clickedDate} Sales):**
- Critical Stock Items: ${criticalItems} products (immediate reorder needed)
- Low Stock Warnings: ${lowStockItems} products (approaching reorder point)
- Overstocked Items: ${overstockedItems} products (capital tied up)
- Stock Health: ${((invData.length - criticalItems - lowStockItems) / invData.length * 100).toFixed(1)}% healthy stock levels`;
      }
    }

    if (agent.agentName === 'inventory' && crossDashboardData.inventoryHoldingCost?.data) {
      const costData = crossDashboardData.inventoryHoldingCost.data;
      if (costData.length > 0) {
        const totalHoldingCost = costData.reduce((sum: number, c: any) => sum + (c.holding_cost || 0), 0);
        const highestCostItem = costData.reduce((max: any, c: any) => c.holding_cost > max.holding_cost ? c : max);
        const avgCostPercentage = costData.reduce((sum: number, c: any) => sum + (c.cost_percentage || 0), 0) / costData.length;
        
        crossDataSummary += `

💰 **INVENTORY COST ANALYSIS (${clickedDate}):**
- Total Holding Costs: $${totalHoldingCost.toLocaleString()} annually
- Highest Cost Product: ${highestCostItem.product} ($${highestCostItem.holding_cost.toLocaleString()})
- Average Cost Impact: ${avgCostPercentage.toFixed(1)}% of revenue
- Cost Efficiency: Holding costs affecting overall profitability`;
      }
    }

    // Finance Agent Cross-Dashboard Data
    if (agent.agentName === 'finance' && crossDashboardData.customerLifetimeValue?.data) {
      const clvData = crossDashboardData.customerLifetimeValue.data;
      if (clvData.length > 0) {
        const totalCLV = clvData.reduce((sum: number, c: any) => sum + (c.lifetime_value || 0), 0);
        const avgCLV = totalCLV / clvData.length;
        const premiumCustomers = clvData.filter((c: any) => c.lifetime_value > 50000);
        
        crossDataSummary += `

💹 **FINANCIAL VALUE ANALYSIS (${clickedDate}):**
- Total Portfolio Value: $${totalCLV.toLocaleString()} in customer LTV
- Average Customer Value: $${avgCLV.toLocaleString()}
- Premium Customer Revenue: $${premiumCustomers.reduce((sum: number, c: any) => sum + c.lifetime_value, 0).toLocaleString()}
- Value Concentration: ${((premiumCustomers.length / clvData.length) * 100).toFixed(1)}% are high-value customers`;
      }
    }

    if (agent.agentName === 'finance' && crossDashboardData.productPerformance?.data) {
      const prodData = crossDashboardData.productPerformance.data;
      if (prodData.length > 0) {
        const totalRevenue = prodData.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
        const weightedMargin = prodData.reduce((sum: number, p: any) => sum + ((p.revenue || 0) * (p.profit_margin || 0)), 0) / totalRevenue;
        const highMarginProducts = prodData.filter((p: any) => p.profit_margin > 0.3);
        
        crossDataSummary += `

📈 **PROFITABILITY BREAKDOWN (${clickedDate}):**
- Total Product Revenue: $${totalRevenue.toLocaleString()}
- Weighted Average Margin: ${(weightedMargin * 100).toFixed(1)}%
- High-Margin Products: ${highMarginProducts.length} products (>30% margin)
- Margin Impact: High-margin products contribute $${highMarginProducts.reduce((sum: number, p: any) => sum + p.revenue, 0).toLocaleString()}`;
      }
    }
  }
  
  return `You are ${agent.displayName}, a specialized ${agent.description.toLowerCase()}.

Your Expertise:
${agent.capabilities.map(cap => `• ${cap}`).join('\n')}
${clickedDataContext}
${comparativeData}
${crossDataSummary}

Current Dashboard Context:
${contextSummary}

User's Question: "${userMessage}"

RESPONSE FORMATTING REQUIREMENTS:
• Use bullet points for key insights (• symbol)
• Each bullet point MUST be on a separate line
• Keep bullet points concise (max 15 words each)
• Start each bullet with a clear category or finding
• Use specific numbers from the data provided above
• Reference the clicked data point in your analysis
• Provide actionable insights based on cross-dashboard data
• Format numbers with proper commas (e.g., $1,234,567)

Example Format:
• **Key Finding**: [Specific insight with numbers]

• **Trend Analysis**: [Pattern or change observed]

• **Root Cause**: [Explanation based on cross-data]

• **Business Impact**: [What this means for the business]

• **Recommendation**: [Specific action to take]

• **Next Steps**: [Follow-up analysis needed]

STRICT RULES:
- Provide exactly 6 bullet points
- Each bullet point = ONE LINE only
- Maximum 15 words per bullet point
- No sub-bullets or explanations
- Use ACTUAL NUMBERS from the provided data context
- Be direct and actionable

Analyze the data thoroughly and provide expert insights with proper bullet formatting.`;
};

/**
 * Provides agent-specific guidance based on context
 */
const getAgentSpecificGuidance = (agentName: string, context: SalesContext): string => {
  switch (agentName) {
    case 'sales':
      return `- Analyze sales performance metrics and revenue trends
- Identify high/low performing periods and reasons
- Compare current vs historical sales performance
- Provide forecasting insights and sales optimization strategies`;

    case 'customer':
      return `- Analyze customer retention by examining revenue stability patterns
- Use sales volume changes to infer customer loyalty trends  
- Identify periods of customer churn through revenue drops
- Calculate implied retention rates from revenue consistency
- Recommend customer engagement strategies based on sales patterns
- Use seasonal sales data to understand customer behavior cycles`;

    case 'finance':
      return `- Analyze financial performance and profitability metrics
- Focus on cost optimization and ROI analysis
- Identify budget variance and financial efficiency opportunities
- Provide insights on financial planning and resource allocation`;

    case 'inventory':
      return `- Analyze inventory levels, turnover, and optimization opportunities
- Focus on stock management and demand planning insights
- Identify overstocking/understocking patterns
- Provide recommendations for inventory cost reduction`;

    default:
      return `- Provide insights relevant to your department expertise
- Reference the current dashboard data
- Focus on actionable recommendations`;
  }
};

/**
 * Creates a fallback response for when agents are unavailable
 */
export const createFallbackResponse = (
  agentName: string,
  userMessage: string,
  error: string
): AgentResponse => {
  const agent = getAgentByName(agentName);
  
  return {
    success: false,
    content: `I apologize, but I'm currently unable to process your request. There was an issue connecting to the ${agent?.displayName || agentName} service. Please try again in a moment, or rephrase your question.

Error details: ${error}`,
    agentInfo: agent || {
      agentName: 'fallback',
      displayName: 'AI Assistant',
      avatar: '🤖',
      description: 'General AI Assistant',
      color: '#6b7280',
      department: 'General',
      capabilities: ['general assistance']
    },
    processingTime: 0,
    error
  };
};

/**
 * Determines the best agent for a user query
 */
export const suggestBestAgent = (userMessage: string, context: SalesContext): string => {
  const message = userMessage.toLowerCase();
  
  // Customer-related queries
  if (message.includes('customer') || message.includes('segment') || message.includes('retention') || message.includes('behavior') || message.includes('churn')) {
    return 'customer';
  }
  
  // Finance-related queries
  if (message.includes('cost') || message.includes('profit') || message.includes('financial') || message.includes('budget') || message.includes('roi')) {
    return 'finance';
  }
  
  // Inventory-related queries
  if (message.includes('inventory') || message.includes('stock') || message.includes('demand') || message.includes('supply') || message.includes('warehouse')) {
    return 'inventory';
  }
  
  // Default to sales agent for revenue, sales, and general questions
  return 'sales';
};