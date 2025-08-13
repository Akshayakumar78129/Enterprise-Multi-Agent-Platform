# 🤖 @Mention System - Complete Implementation Guide

## 📋 Overview
The @mention system allows users to directly query specialized agents from within the churn dashboard chatbot without losing context. Users can type `@agent_name` followed by their question to get expert insights from sales, support, marketing, finance, product, and data specialists.

---

## 🎯 Core Features

### **1. Mention Detection & Parsing**
- **Regex Pattern**: `@(\w+)` detects agent mentions
- **Multiple Mentions**: Supports multiple agents in one message
- **Context Preservation**: Maintains dashboard context across agent queries
- **Validation**: Checks against registered agent list

### **2. Agent Registry System**
- **Centralized Configuration**: All agents defined in `agentRegistry.ts`
- **Easy Extension**: Add new agents without code changes
- **Rich Metadata**: Each agent has display name, avatar, capabilities, colors
- **Authentication**: Token-based security for agent endpoints

### **3. Context-Aware Queries**
- **Dashboard State**: Includes current filters, customer data, chart context
- **Conversation Memory**: Remembers last active customer and interactions
- **Optimized Payloads**: Context tailored for each agent type
- **Real-time Data**: Always uses current dashboard state

### **4. Intelligent UI/UX**
- **Autocomplete**: Shows agent suggestions as you type
- **Visual Feedback**: Agent-specific colors and avatars
- **Loading States**: Shows which agents are being consulted
- **Error Handling**: Graceful fallbacks for failed requests

---

## 🏗️ Architecture

```
User Input → Mention Parser → Agent Registry → Context Packer → API Call → Response Handler → UI Update
```

### **File Structure**
```
ui/
├── config/
│   └── agentRegistry.ts          # Agent definitions and configuration
├── utils/
│   ├── mentionParser.ts          # @mention parsing and validation
│   └── contextPacker.ts          # Dashboard context packaging
├── services/
│   └── agentCommunication.ts     # API communication with agents
└── components/chat/
    └── EnhancedContextAwareChatbot.tsx  # Main chatbot with @mention support

api/agents/
├── sales/query.api.js            # Sales agent endpoint
├── support/query.api.js          # Support agent endpoint
├── marketing/query.api.js        # Marketing agent endpoint
├── finance/query.api.js          # Finance agent endpoint
├── product/query.api.js          # Product agent endpoint
└── data/query.api.js             # Data agent endpoint
```

---

## 🔧 Implementation Details

### **Step 1: Mention Parsing**
```typescript
// mentionParser.ts
const MENTION_REGEX = /@(\w+)/g;

export const parseMentions = (text: string): ParsedMessage => {
  const mentions: ParsedMention[] = [];
  let match;
  
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({
      agentName: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      fullMatch: match[0]
    });
  }
  
  // Remove mentions from text to get clean query
  let textWithoutMentions = text;
  mentions.forEach(mention => {
    textWithoutMentions = textWithoutMentions.replace(mention.fullMatch, '').trim();
  });
  
  return {
    originalText: text,
    mentions,
    textWithoutMentions,
    hasMultipleMentions: mentions.length > 1
  };
};
```

### **Step 2: Agent Registry**
```typescript
// agentRegistry.ts
export const AGENT_REGISTRY: AgentRegistry = {
  sales_agent: {
    name: 'sales_agent',
    displayName: 'Sales Agent',
    endpoint: '/api/agents/sales/query',
    authToken: process.env.NEXT_PUBLIC_SALES_AGENT_TOKEN,
    description: 'Handles sales inquiries, lead qualification, and revenue optimization',
    capabilities: [
      'Lead scoring and qualification',
      'Sales pipeline analysis',
      'Revenue forecasting',
      'Customer acquisition strategies',
      'Upselling and cross-selling recommendations'
    ],
    avatar: '💼',
    color: '#10b981'
  },
  // ... other agents
};
```

### **Step 3: Context Packing**
```typescript
// contextPacker.ts
export const packDashboardContext = (
  state: ChurnPredictionState,
  additionalContext?: Partial<DashboardContext>
): DashboardContext => {
  const { customers, filters, chatContext, kpis } = state;
  
  // Calculate real-time statistics
  const totalCustomers = customers.length;
  const highRiskCustomers = customers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length;
  
  // Determine active customer from context
  let activeCustomer: ChurnCustomer | undefined;
  if (chatContext?.selectedData?.customer_id) {
    activeCustomer = customers.find(c => 
      c.customer_id === chatContext.selectedData.customer_id
    );
  }
  
  return {
    source_dashboard: 'churn_prediction',
    timestamp: new Date().toISOString(),
    customer_context: {
      active_customer: activeCustomer,
      total_customers: totalCustomers,
      high_risk_customers: highRiskCustomers,
      avg_churn_probability: avgChurnProb,
      customer_list: customers.slice(0, 100) // Limit for performance
    },
    chart_context: chatContext,
    filters: {
      risk_level: filters.riskLevel,
      search: filters.search,
      applied_filters: appliedFilters,
      filter_count: appliedFilters.length
    },
    kpis: kpiContext,
    ...additionalContext
  };
};
```

### **Step 4: Agent Communication**
```typescript
// agentCommunication.ts
export const queryAgent = async (
  agentName: string,
  payload: AgentQueryPayload,
  timeoutMs: number = 30000
): Promise<AgentResult> => {
  const agentConfig = getAgentConfig(agentName);
  
  const response = await fetch(agentConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentConfig.authToken}`,
      'X-Request-ID': payload.request_id,
      'X-Source-Dashboard': payload.context.source_dashboard
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  return {
    success: true,
    agent_name: agentName,
    agent_display_name: agentConfig.displayName,
    response_text: responseData.response,
    execution_time_ms: Date.now() - startTime,
    request_id: payload.request_id,
    timestamp: new Date().toISOString(),
    metadata: {
      confidence_score: responseData.confidence,
      data_sources: responseData.sources,
      recommendations: responseData.recommendations
    }
  };
};
```

### **Step 5: UI Integration**
```typescript
// EnhancedContextAwareChatbot.tsx
const handleAgentMentions = async (mentionedAgents: string[], query: string) => {
  // Validate agents
  const validAgents = mentionedAgents.filter(isValidAgent);
  
  // Pack context
  const context = packDashboardContext(dashboardState);
  
  // Query each agent
  for (const agentName of validAgents) {
    const payload = createAgentQueryPayload(context, query, agentName);
    const result = await queryAgent(agentName, payload);
    
    // Display response with agent branding
    const agentMessage: Message = {
      type: 'agent',
      content: result.response_text,
      agentName,
      agentDisplayName: getAgentConfig(agentName)?.displayName,
      agentAvatar: getAgentConfig(agentName)?.avatar,
      agentColor: getAgentConfig(agentName)?.color,
      metadata: result.metadata
    };
    
    setMessages(prev => [...prev, agentMessage]);
  }
};
```

---

## 🎨 User Experience Flow

### **1. User Types @mention**
```
User: "@sales_agent what's the revenue impact of these high-risk customers?"
```

### **2. System Processes**
- **Parse**: Detects `@sales_agent` mention
- **Validate**: Confirms agent exists in registry
- **Extract**: Gets query "what's the revenue impact of these high-risk customers?"
- **Context**: Packs current dashboard state (customers, filters, chart context)

### **3. Agent Query**
```json
{
  "context": {
    "source_dashboard": "churn_prediction",
    "customer_context": {
      "total_customers": 1247,
      "high_risk_customers": 89,
      "avg_churn_probability": 0.34,
      "active_customer": { "id": 12345, "name": "Acme Corp" }
    },
    "chart_context": {
      "chartType": "risk-pyramid",
      "clickedElement": "High Risk"
    }
  },
  "query": "what's the revenue impact of these high-risk customers?",
  "mentioned_agent": "sales_agent"
}
```

### **4. Agent Response**
```json
{
  "success": true,
  "agent_name": "sales_agent",
  "response": "💰 **Revenue Impact Analysis**\n\nBased on your 89 high-risk customers:\n• Revenue at Risk: $267,000 annually\n• Retention Opportunity: $213,600 recoverable\n• Immediate Action: Focus on top 20 highest-value accounts",
  "confidence": 0.89,
  "sources": ["CRM", "Revenue Analytics"],
  "recommendations": ["Prioritize high-value retention", "Create win-back campaigns"]
}
```

### **5. UI Display**
- **Agent Badge**: Shows sales agent avatar (💼) and name
- **Colored Response**: Uses agent's brand color (#10b981)
- **Metadata**: Shows confidence, sources, execution time
- **Recommendations**: Displays actionable insights

---

## 🚀 Available Agents

### **💼 Sales Agent** (`@sales_agent`)
- **Focus**: Revenue optimization, retention strategies, upselling
- **Capabilities**: Lead scoring, pipeline analysis, ROI calculations
- **Best For**: "What's the revenue impact?", "How can we retain these customers?"

### **🎧 Support Agent** (`@support_agent`)
- **Focus**: Customer health, ticket analysis, satisfaction
- **Capabilities**: CSAT analysis, escalation management, issue patterns
- **Best For**: "Why are customers unhappy?", "What support issues correlate with churn?"

### **📈 Marketing Agent** (`@marketing_agent`)
- **Focus**: Campaign optimization, engagement, segmentation
- **Capabilities**: Channel analysis, content performance, attribution
- **Best For**: "How can we re-engage at-risk customers?", "What campaigns work best?"

### **💰 Finance Agent** (`@finance_agent`)
- **Focus**: Financial impact, ROI analysis, budget optimization
- **Capabilities**: CLV calculations, cost analysis, investment ROI
- **Best For**: "What's the financial impact?", "How much should we invest in retention?"

### **🚀 Product Agent** (`@product_agent`)
- **Focus**: Usage patterns, feature adoption, product insights
- **Capabilities**: Feature analysis, user journey mapping, adoption tracking
- **Best For**: "What features do churning customers use?", "How can product changes help?"

### **📊 Data Agent** (`@data_agent`)
- **Focus**: Advanced analytics, statistical analysis, modeling
- **Capabilities**: Predictive modeling, trend analysis, data quality
- **Best For**: "What patterns predict churn?", "Can you run advanced analysis?"

---

## 💡 Usage Examples

### **Revenue Analysis**
```
User: "@sales_agent @finance_agent what's the total financial impact of our high-risk customers?"
```
**Result**: Both agents respond with complementary insights - sales focuses on retention strategies, finance on ROI calculations.

### **Customer-Specific Inquiry**
```
User: "I'm looking at Acme Corp in the high-risk segment. @support_agent what's their support history?"
```
**Result**: Support agent gets full context about Acme Corp and provides ticket analysis, satisfaction scores, and recommendations.

### **Multi-Agent Strategy**
```
User: "@sales_agent @marketing_agent @support_agent how can we create a comprehensive retention program?"
```
**Result**: All three agents provide their perspective - sales on revenue impact, marketing on engagement campaigns, support on satisfaction improvement.

### **Context-Aware Follow-up**
```
User: "Tell me about this customer" (after clicking on a customer in a chart)
Agent: "I can see you're looking at John Smith (ID: 12345) with 78% churn probability..."

User: "@sales_agent what should we do about this customer?"
```
**Result**: Sales agent gets full context about John Smith and provides personalized retention recommendations.

---

## 🔒 Security & Authentication

### **Token-Based Authentication**
```typescript
// Environment variables for agent tokens
NEXT_PUBLIC_SALES_AGENT_TOKEN=sales_token_xyz
NEXT_PUBLIC_SUPPORT_AGENT_TOKEN=support_token_abc
```

### **Request Headers**
```typescript
headers: {
  'Authorization': `Bearer ${agentConfig.authToken}`,
  'X-Request-ID': payload.request_id,
  'X-Source-Dashboard': 'churn_prediction',
  'X-Agent-Priority': payload.priority
}
```

### **Validation**
- **Agent Existence**: Validates against registry before API calls
- **Token Verification**: Each agent endpoint validates auth tokens
- **Request Validation**: Ensures required fields are present
- **Rate Limiting**: Prevents abuse with request throttling

---

## 🛠️ Configuration & Customization

### **Adding New Agents**
1. **Add to Registry**:
```typescript
// agentRegistry.ts
new_agent: {
  name: 'new_agent',
  displayName: 'New Agent',
  endpoint: '/api/agents/new/query',
  authToken: process.env.NEXT_PUBLIC_NEW_AGENT_TOKEN,
  description: 'Handles new agent functionality',
  capabilities: ['Capability 1', 'Capability 2'],
  avatar: '🆕',
  color: '#ff6b6b'
}
```

2. **Create API Endpoint**:
```javascript
// api/agents/new/query.api.js
export default async function handler(req, res) {
  // Handle agent-specific logic
  const insights = generateNewAgentInsights(context, query);
  res.json({ success: true, response: insights.response });
}
```

3. **No Code Changes Required**: The system automatically detects and supports the new agent!

### **Customizing Context**
```typescript
// Modify contextPacker.ts to include additional data
const customContext = packDashboardContext(state, {
  custom_metrics: calculateCustomMetrics(),
  integration_data: await fetchIntegrationData()
});
```

### **UI Customization**
```typescript
// Customize agent message appearance
const agentMessageStyle = {
  background: `linear-gradient(135deg, ${agentColor}20, ${agentColor}10)`,
  border: `1px solid ${agentColor}30`,
  // ... other styles
};
```

---

## 📊 Performance & Monitoring

### **Metrics Tracked**
- **Response Times**: Agent query execution times
- **Success Rates**: API call success/failure rates
- **Usage Patterns**: Most mentioned agents, common queries
- **Context Accuracy**: How well context matches user intent

### **Error Handling**
- **Timeout Protection**: 30-second timeout for agent queries
- **Graceful Degradation**: Shows error messages for failed agents
- **Retry Logic**: Automatic retries for network failures
- **Fallback Responses**: Mock responses for development/testing

### **Optimization**
- **Context Optimization**: Tailors context payload for each agent type
- **Parallel Queries**: Multiple agents queried simultaneously
- **Caching**: Response caching for repeated queries
- **Payload Compression**: Minimizes context data for performance

---

## 🎯 Benefits

### **For Users**
- **Seamless Experience**: No need to leave churn dashboard
- **Expert Insights**: Access to specialized knowledge
- **Context Preservation**: Agents understand current analysis
- **Multi-Perspective**: Get insights from multiple specialists

### **For Development**
- **Modular Architecture**: Easy to add/modify agents
- **Centralized Configuration**: Single source of truth for agents
- **Reusable Components**: Context packing works for all agents
- **Scalable Design**: Supports unlimited agent types

### **For Business**
- **Faster Decision Making**: Instant access to expert analysis
- **Comprehensive Analysis**: Multiple viewpoints on same data
- **Improved Retention**: Better insights lead to better strategies
- **Cost Effective**: Reduces need for manual expert consultation

---

## 🚀 Future Enhancements

### **Planned Features**
- **Agent Collaboration**: Agents can query each other
- **Conversation Threading**: Maintain separate threads per agent
- **Smart Routing**: AI determines best agent for query
- **Batch Queries**: Send same question to multiple agents
- **Agent Learning**: Agents improve based on user feedback

### **Advanced Capabilities**
- **Real-time Notifications**: Agents can push proactive insights
- **Scheduled Reports**: Agents provide regular updates
- **Integration Expansion**: Connect to more data sources
- **Custom Agents**: Users can create domain-specific agents
- **Voice Interface**: Voice-activated agent mentions

This @mention system transforms the churn dashboard into a comprehensive intelligence hub where users can instantly access specialized expertise while maintaining full context of their analysis! 🎯✨