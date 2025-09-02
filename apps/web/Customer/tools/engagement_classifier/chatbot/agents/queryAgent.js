// Advanced Agent Query Dispatcher for Sales & Inventory
// Inspired by context-aware patterns (like EnhancedContextAwareChatbot)

import { getAgent } from '../config/agentRegistry.js';
import { AIResponseDashboardNode } from '../utils/adkStream.js';

export async function queryAgent(agentName, payload) {
  console.log('🎯 queryAgent called with:', { agentName, payload });
  const agent = getAgent(agentName);
  if (!agent) {
    return {
      text: `❌ Unknown agent: @${agentName}`,
      metadata: { agentName },
      success: false
    };
  }

  const { db, mode = 'detailed', context = {}, query = '', sessionId } = payload || {};
  const start = Date.now();

  // 1) Try ADK streaming via AIResponseDashboard first
  const session = {
    session_id: sessionId || 'default-session',
    user_id: 'embedded-chatbot',
    app_name: 'orchestration_agent'
  };

  // Force a mention so the router delegates reliably
  const mention =
    agent.name === 'sales_agent' ? '@sales' :
    agent.name === 'inventory_agent' ? '@inventory' :
    agent.name === 'financial_agent' ? '@financial' :
    '@customer';

  const effectiveQuery = `${mention} ${query}`.trim();

  try {
    const stream = AIResponseDashboardNode(effectiveQuery, session);
    const chunks = [];
    let streamedAgent = agent.name;

    for await (const piece of stream) {
      if (typeof piece === 'object' && (piece?.text || piece?.agent)) {
        if (piece.text) chunks.push(piece.text);
        if (piece.agent) streamedAgent = piece.agent;
      } else if (typeof piece === 'object' && piece !== null && piece?.visualisation) {
        // ignore visualisation-only chunks for now
      } else if (piece === '[ERROR]') {
        throw new Error('ADK stream failed');
      } else if (piece === '[DONE]') {
        break;
      } else if (typeof piece === 'string') {
        // If backend sent plain text, capture it
        chunks.push(piece);
      }
    }

    const text = chunks.join(' ').trim();
    if (text.length > 0) {
      return {
        text,
        metadata: baseMeta(agent, start, { mode, source: 'adk', streamedAgent }),
        success: true
      };
    }
    // If stream yielded nothing, fall back
  } catch (e) {
    // Log locally; will fall back
    console.warn(`[ADK-FALLBACK] ${agent.name}:`, e?.message || e);
  }

  // 2) Do NOT fallback to local DB to avoid unintended queries
  // Return a graceful message so the caller can handle UI-side
  return {
    text: `${agent.displayName} is temporarily unavailable. Please try again shortly.`,
    metadata: baseMeta(agent, start, { mode, source: 'adk', note: 'no_stream_or_error' }),
    success: false
  };
}

/* ---------------- Sales Agent ---------------- */
async function handleSalesAgent(db, mode, context, agent, query, start) {
  const lowerQuery = query.toLowerCase();
  
  // Handle specific queries
  if (lowerQuery.includes('top') && (lowerQuery.includes('customer') || lowerQuery.includes('client'))) {
    // Extract number if specified (e.g., "top 5 customers", "top 10 customers")
    const numberMatch = lowerQuery.match(/top\s+(\d+)/);
    const count = numberMatch ? parseInt(numberMatch[1]) : 5;
    
    const top = await db.getTopCustomers(count);
    const topStr = top.map((r, i) => `${i + 1}. ${r.customer_name} (score ${r.engagement_score})`).join('\n');
    
    const talk = `🏆 Top ${count} customers: ${top.slice(0, 3).map(c => c.customer_name).join(', ')}${count > 3 ? '...' : ''}`;
    
    const insights = [
      `Top ${count} customers by engagement score:`,
      topStr,
      `Tip: Focus retention efforts on these high-value customers`
    ].map(s => `• ${s}`).join('\n');

    const detailed = [
      `# 🏆 Top ${count} Customers by Engagement Score`,
      ``,
      topStr,
      ``,
      `## 💡 Insights`,
      `- These customers represent your highest engagement scores`,
      `- Consider them for VIP programs and exclusive offers`,
      `- Monitor their activity closely to prevent churn`,
      `- Use them as case studies for customer success strategies`
    ].join('\n');

    return formatByMode({ talk, insights, detailed }, mode, agent, start, {
      confidence: 0.95,
      sources: ['Customer Database'],
      followUp: [
        "Show customer details for top performer",
        "Compare top customers vs average",
        "Analyze top customer behavior patterns"
      ]
    });
  }
  
  // Handle customer count queries
  if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('total')) {
    const total = await db.getTotalCustomers();
    const dist = await db.getCustomerCountByEngagement();
    const distStr = dist.map(d => `${d.engagement_level}: ${d.customer_count}`).join(', ');
    
    const talk = `📊 ${total} total customers. Breakdown: ${distStr}`;
    
    const insights = [
      `Total customers: ${total}`,
      `Engagement distribution:`,
      ...dist.map(d => `  - ${d.engagement_level}: ${d.customer_count} customers`),
      `Tip: Focus on converting Medium to High engagement`
    ].map(s => `• ${s}`).join('\n');

    const detailed = [
      `# 📊 Customer Count Analysis`,
      `**Total Customers:** ${total}`,
      ``,
      `## Engagement Level Distribution`,
      ...dist.map(d => `- **${d.engagement_level}:** ${d.customer_count} customers (${((d.customer_count/total)*100).toFixed(1)}%)`),
      ``,
      `## 🎯 Strategic Focus Areas`,
      `1. **Medium Engagement (${dist.find(d => d.engagement_level === 'Medium')?.customer_count || 0} customers)**: Prime candidates for uplift campaigns`,
      `2. **Low Engagement (${dist.find(d => d.engagement_level === 'Low')?.customer_count || 0} customers)**: Require reactivation strategies`,
      `3. **High Engagement (${dist.find(d => d.engagement_level === 'High')?.customer_count || 0} customers)**: Focus on retention and expansion`
    ].join('\n');

    return formatByMode({ talk, insights, detailed }, mode, agent, start, {
      confidence: 0.9,
      sources: ['Customer Database'],
      followUp: [
        "Show customers by engagement level",
        "Analyze engagement trends over time",
        "Compare with industry benchmarks"
      ]
    });
  }

  // Default comprehensive overview for general queries
  const total = await db.getTotalCustomers();
  const dist = await db.getCustomerCountByEngagement();
  const top = await db.getTopCustomers(5);
  const churn = await db.getChurnRate?.(); // optional if db supports

  const distStr = dist.map(d => `${d.engagement_level}: ${d.customer_count}`).join(', ');
  const topStr = top.map((r, i) => `${i + 1}. ${r.customer_name} (score ${r.engagement_score})`).join('\n');

  const talk = `📊 ${total} customers. Mix: ${distStr}. Top performer: ${top[0]?.customer_name || 'N/A'}.`;
  
  const insights = [
    `Customer segments → ${distStr}`,
    `Top 5 customers:\n${topStr}`,
    churn ? `Churn rate: ${(churn * 100).toFixed(1)}%` : null,
    `Tip: Move Medium → High engagement with targeted offers`
  ].filter(Boolean).map(s => `• ${s}`).join('\n');

  const detailed = [
    `# 📈 Sales Performance Overview`,
    `**Total Customers:** ${total}`,
    `**Segment Distribution:** ${distStr}`,
    churn ? `**Churn Rate:** ${(churn * 100).toFixed(1)}%` : ``,
    ``,
    `## 🔝 Top Customers`,
    topStr,
    ``,
    `## 🛠️ Recommendations`,
    `1. Focus uplift campaigns on Medium engagement`,
    `2. Personalize reactivation for Low engagement`,
    `3. Cross-sell & upsell to top customers`,
    `4. Monitor churn trends by cohort`
  ].join('\n');

  return formatByMode({ talk, insights, detailed }, mode, agent, start, {
    confidence: 0.9,
    sources: ['CRM DB', 'Engagement logs'],
    followUp: [
      "Show regional sales performance",
      "Compare current vs last quarter",
      "Breakdown churn by customer segment"
    ]
  });
}

/* ---------------- Inventory Agent ---------------- */
async function handleInventoryAgent(db, mode, context, agent, query, start) {
  const lowerQuery = query.toLowerCase();
  
  // Handle specific inventory queries
  if (lowerQuery.includes('stockout') || lowerQuery.includes('out of stock')) {
    const stockouts = await db.getRecentStockouts?.() || [];
    
    const talk = `⚠️ ${stockouts.length} recent stockouts detected. ${stockouts.length > 0 ? `Critical: ${stockouts[0]?.sku}` : 'All good!'}`;
    
    const insights = [
      `Recent stockouts: ${stockouts.length}`,
      stockouts.length > 0 ? `Critical items:\n${stockouts.slice(0, 5).map(s => `${s.sku} (${s.daysOut} days out)`).join('\n')}` : 'No recent stockouts',
      `Tip: Set up automated reorder alerts for these SKUs`
    ].filter(Boolean).map(s => `• ${s}`).join('\n');

    const detailed = [
      `# ⚠️ Stockout Analysis`,
      `**Total Recent Stockouts:** ${stockouts.length}`,
      ``,
      stockouts.length > 0 ? `## Critical Items Out of Stock` : `## ✅ No Recent Stockouts`,
      stockouts.length > 0 ? stockouts.map(s => `- **${s.sku}**: Out for ${s.daysOut} days`).join('\n') : `All inventory levels are healthy.`,
      ``,
      `## 🚨 Action Items`,
      stockouts.length > 0 ? `1. **Immediate**: Contact suppliers for expedited delivery` : `1. **Maintain**: Continue current inventory practices`,
      stockouts.length > 0 ? `2. **Short-term**: Increase safety stock for repeat offenders` : `2. **Monitor**: Watch for early warning signs`,
      stockouts.length > 0 ? `3. **Long-term**: Review demand forecasting accuracy` : `3. **Optimize**: Look for cost reduction opportunities`
    ].join('\n');

    return formatByMode({ talk, insights, detailed }, mode, agent, start, {
      confidence: 0.95,
      sources: ['Inventory Database'],
      followUp: [
        "Show supplier contact information",
        "Analyze stockout patterns",
        "Set up reorder alerts"
      ]
    });
  }
  
  if (lowerQuery.includes('top') && (lowerQuery.includes('sku') || lowerQuery.includes('product') || lowerQuery.includes('item'))) {
    const numberMatch = lowerQuery.match(/top\s+(\d+)/);
    const count = numberMatch ? parseInt(numberMatch[1]) : 5;
    
    const topSkus = await db.getTopSkus?.(count) || [];
    
    const talk = `🔥 Top ${count} SKUs: ${topSkus.slice(0, 3).map(s => s.sku).join(', ')}${count > 3 ? '...' : ''}`;
    
    const insights = [
      `Top ${count} performing SKUs:`,
      topSkus.map(s => `${s.sku} (demand: ${s.demand})`).join('\n'),
      `Tip: Ensure adequate stock levels for these high-performers`
    ].map(s => `• ${s}`).join('\n');

    const detailed = [
      `# 🔥 Top ${count} Performing SKUs`,
      ``,
      topSkus.map((s, i) => `${i + 1}. **${s.sku}** - Demand: ${s.demand}`).join('\n'),
      ``,
      `## 📊 Performance Insights`,
      `- These SKUs represent your highest demand products`,
      `- Ensure sufficient safety stock to prevent stockouts`,
      `- Consider bulk purchasing for better supplier terms`,
      `- Monitor competitor pricing for these key items`
    ].join('\n');

    return formatByMode({ talk, insights, detailed }, mode, agent, start, {
      confidence: 0.95,
      sources: ['Inventory Database', 'Sales Data'],
      followUp: [
        "Show inventory levels for top SKUs",
        "Analyze demand trends",
        "Compare with supplier lead times"
      ]
    });
  }

  // Default comprehensive inventory overview
  const topSkus = await db.getTopSkus?.(5) || [];
  const stockouts = await db.getRecentStockouts?.() || [];
  const slowMovers = await db.getSlowMovingSkus?.(5) || [];

  const talk = `📦 Inventory live. Top SKUs: ${topSkus.map(s => s.sku).join(', ')}. Stockouts: ${stockouts.length}.`;

  const insights = [
    `Top SKUs:\n${topSkus.map(s => `${s.sku} (${s.demand})`).join(', ')}`,
    `Recent stockouts: ${stockouts.length}`,
    slowMovers.length ? `Slow-moving SKUs: ${slowMovers.map(s => s.sku).join(', ')}` : null,
    `Tip: Use sales velocity to set reorder points`
  ].filter(Boolean).map(s => `• ${s}`).join('\n');

  const detailed = [
    `# 🏭 Inventory Overview`,
    `**Top SKUs:**\n${topSkus.map(s => `${s.sku} (Demand: ${s.demand})`).join('\n')}`,
    ``,
    `**Recent Stockouts:** ${stockouts.length}`,
    stockouts.length ? stockouts.map(s => `- ${s.sku} (days out: ${s.daysOut})`).join('\n') : ``,
    ``,
    slowMovers.length ? `**Slow-Moving SKUs:**\n${slowMovers.map(s => `- ${s.sku} (Velocity: ${s.velocity})`).join('\n')}` : ``,
    ``,
    `## 🛠️ Recommendations`,
    `1. Prioritize replenishment for fast-movers`,
    `2. Increase safety stock for repeat stockouts`,
    `3. Reduce holding costs by addressing slow-movers`,
    `4. Align supplier lead times with demand cycles`
  ].join('\n');

  return formatByMode({ talk, insights, detailed }, mode, agent, start, {
    confidence: 0.87,
    sources: ['Inventory DB', 'Demand forecasts'],
    followUp: [
      "List SKUs at risk of stockout",
      "Show supplier lead time impact",
      "Forecast next 30 days demand"
    ]
  });
}

/* ---------------- Helpers ---------------- */
function formatByMode(variants, mode, agent, start, extraMeta = {}) {
  const { talk, insights, detailed } = variants;
  let text = detailed;
  if (mode === 'talk') text = talk;
  else if (mode === 'insights') text = insights;

  return {
    text,
    metadata: {
      ...baseMeta(agent, start, extraMeta)
    },
    success: true
  };
}

function baseMeta(agent, start, extra = {}) {
  return {
    agentName: agent.name,
    displayName: agent.displayName,
    avatar: agent.avatar,
    color: agent.color,
    category: agent.category,
    executionTime: Date.now() - start,
    ...extra
  };
}
