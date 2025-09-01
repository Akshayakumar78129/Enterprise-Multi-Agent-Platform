/**
 * Agent Registry Configuration
 * Defines the inventory agent for the enhanced chatbot system
 */

export interface AgentConfig {
  agentName: string;
  avatar: string;
  displayName: string;
  description: string;
  agentColor: string;
  responseTemplates: Record<string, string>;
}

export const inventoryAgentRegistry: Record<string, AgentConfig> = {
  inventory: {
    agentName: 'inventory',
    avatar: '📦',
    displayName: 'Inventory Intelligence',
    description: 'Slow-moving inventory analysis and optimization recommendations',
    agentColor: '#8b5cf6',
    
    responseTemplates: {
      overview: `
📦 **Inventory Performance Overview**

📊 **Current Slow-Moving Status:**
• **Total Slow-Moving Items**: \${totalSlowMovingItems} SKUs
• **Value Tied Up**: $\${slowMovingValue} 
• **Average Turnover**: \${averageTurnoverRatio}x annually
• **Aged Inventory**: \${agedInventoryPercent}% (90+ days)

💰 **Financial Impact:**
• **Monthly Carrying Cost**: $\${carryingCostImpact}
• **Opportunity Cost**: $\${opportunityCost} (annual)
• **Storage Overhead**: $\${storageOverhead}

🎯 **Top Action Items:**
• Markdown strategy for 180+ day aged items
• Transfer slow movers to low-cost warehouses  
• Bundle with fast-moving products
• Liquidation evaluation for obsolete stock

📈 **Category Performance:**
\${categoryBreakdown}
      `,

      categoryAnalysis: `
📂 **Category Deep Dive: \${categoryName}**

📊 **Category Metrics:**
• **Slow-Moving Items**: \${categorySlowItems} items
• **Category Value**: $\${categoryValue}
• **Turnover Ratio**: \${categoryTurnover}x
• **Days of Supply**: \${daysOfSupply} days

⚠️ **Risk Assessment:**
• **Obsolescence Risk**: \${obsolescenceRisk}
• **Seasonality Impact**: \${seasonalityImpact}
• **Demand Volatility**: \${demandVolatility}

💡 **Optimization Strategies:**
• Price optimization opportunities
• Supplier negotiation leverage
• Cross-selling bundle potential
• Liquidation channel options
      `,

      recommendations: `
🎯 **Inventory Optimization Recommendations**

🚀 **Immediate Actions (0-30 days):**
• Implement 20% markdown on 180+ day items
• Bundle slow movers with bestsellers
• Transfer high-value items to central warehouse

📅 **Short-term Strategy (30-90 days):**
• Negotiate supplier buy-back agreements
• Develop liquidation partnerships
• Optimize reorder points and quantities

🔮 **Long-term Optimization (90+ days):**
• Implement demand forecasting AI
• Vendor-managed inventory programs
• Dynamic pricing algorithms

💰 **Expected Impact:**
• **Cash Flow Improvement**: $\${cashFlowImprovement}
• **Carrying Cost Reduction**: \${carryingCostReduction}%
• **Warehouse Space Recovery**: \${spaceRecovery}%
      `,

      financial: `
💰 **Financial Impact Analysis**

📊 **Current Financial Burden:**
• **Total Slow-Moving Value**: $\${slowMovingValue}
• **Monthly Carrying Cost**: $\${monthlyCarryingCost}
• **Annual Opportunity Cost**: $\${opportunityCost}
• **Storage Allocation Cost**: $\${storageAllocation}

🎯 **Optimization Scenarios:**

**Scenario 1: Aggressive Liquidation**
• **20% markdown on 180+ day items**
• **Cash recovery**: $\${liquidationRecovery}
• **Cost savings**: $\${liquidationSavings}/month

**Scenario 2: Strategic Transfers**
• **Move to low-cost facilities**
• **Storage cost reduction**: $\${transferSavings}/month
• **Implementation cost**: $\${transferCost}

**Scenario 3: Bundle Strategies**
• **Cross-sell with fast movers**
• **Revenue uplift**: $\${bundleUplift}
• **Inventory reduction**: \${bundleReduction}%
      `
    }
  }
};

// Available mention commands for @inventory agent
export const INVENTORY_COMMANDS = [
  { command: '@inventory overview', description: 'Get comprehensive inventory performance overview' },
  { command: '@inventory category [name]', description: 'Analyze specific category performance' },
  { command: '@inventory financial', description: 'Detailed financial impact analysis' },
  { command: '@inventory recommendations', description: 'Get optimization recommendations' },
  { command: '@inventory trends', description: 'Show historical trends and patterns' },
  { command: '@inventory alerts', description: 'Current alerts and urgent items' }
];

// Context keywords that trigger inventory responses
export const INVENTORY_KEYWORDS = [
  'slow moving', 'inventory', 'turnover', 'aging', 'obsolete', 'carrying cost',
  'liquidation', 'markdown', 'warehouse', 'category', 'stock', 'days of supply'
];
