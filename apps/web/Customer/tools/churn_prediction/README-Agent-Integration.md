# Churn Dashboard Agent Integration

This document describes the enhanced agent integration system for the churn prediction dashboard, which now supports real-time communication with multiple specialized agents.

## 🚀 Overview

The churn dashboard chatbot has been upgraded to:
- **Dynamically fetch real data** from corresponding agents instead of returning mock responses
- **Support multiple agent types** across Sales, Customer, Inventory, and Finance domains
- **Provide an agent dropdown** showing all available agents to users
- **Handle real-time API calls** with proper error handling and timeouts

## 🤖 Available Agents

### Sales Agents
- **@sales_agent** - Sales Performance Agent: Analyzes sales performance, trends, and revenue optimization
- **@product_performance_agent** - Product Performance Agent: Tracks product performance and sales metrics
- **@regional_sales_agent** - Regional Sales Agent: Provides regional sales analysis and geographic insights
- **@sales_trends_agent** - Sales Trends Agent: Analyzes sales trends and forecasting

### Customer Agents
- **@customer_agent** - Customer Insights Agent: Provides customer insights, behavior analysis, and segmentation
- **@customer_segmentation_agent** - Customer Segmentation Agent: Specializes in advanced customer segmentation
- **@customer_lifetime_value_agent** - Customer Lifetime Value Agent: Analyzes customer lifetime value and revenue optimization
- **@engagement_classifier_agent** - Engagement Classifier Agent: Classifies customer engagement levels

### Inventory Agents
- **@inventory_agent** - Inventory Management Agent: Manages inventory optimization and cost analysis
- **@inventory_holding_cost_agent** - Inventory Holding Cost Agent: Analyzes inventory holding costs
- **@inventory_level_agent** - Inventory Level Agent: Monitors and optimizes inventory levels

### Finance Agents
- **@finance_agent** - Financial Analysis Agent: Provides financial analysis and business intelligence

## 🔧 Configuration

### Environment Variables

Create or update `.env.local` in the churn prediction directory:

```env
# Agent Configuration
NEXT_PUBLIC_USE_MOCK_AGENTS=false          # Set to 'true' for mock responses
NEXT_PUBLIC_FORCE_REAL_AGENTS=true         # Force real API calls in development
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3002
NEXT_PUBLIC_API_GATEWAY_TOKEN=your_api_gateway_token

# Development Settings
NODE_ENV=development
```

### API Gateway Configuration

Ensure your API Gateway is running on `http://localhost:3002` with the following endpoints:
- `/api/v1/sales/*` - Sales agent endpoints
- `/api/v1/customer/*` - Customer agent endpoints  
- `/api/v1/inventory/*` - Inventory agent endpoints
- `/api/v1/finance/*` - Finance agent endpoints

## 📡 How It Works

### 1. Agent Detection
The system detects agent mentions using regex patterns:
```javascript
const mentionRegex = /@(\w+)/g;
```

### 2. Context Gathering
When an agent is mentioned, the system automatically gathers:
- Current customer data and filters
- Dashboard state and KPIs
- Selected time ranges
- Active customer information

### 3. API Call Routing
Each agent mention is routed to the appropriate API Gateway endpoint:
```javascript
const agentRouting = {
  'sales_agent': {
    baseUrl: `${API_GATEWAY_BASE}/api/v1/sales`,
    endpoints: {
      performance: '/sales-performance',
      trends: '/sales-trends',
      // ...
    }
  }
  // ...
};
```

### 4. Response Processing
API responses are processed and formatted for the chat interface with:
- Agent branding (avatar, colors)
- Execution time tracking
- Confidence scores
- Follow-up questions
- Recommendations

## 💬 Usage Examples

### Basic Agent Queries
```
@sales_agent What's the revenue impact of high-risk customers?
@customer_agent Show me segmentation analysis for churning customers
@inventory_agent How does churn affect our inventory levels?
@finance_agent What's the financial impact of customer retention?
```

### Context-Aware Queries
The system automatically includes dashboard context:
```
User: "@sales_agent analyze performance"
System sends: {
  query: "analyze performance",
  context: {
    customer_context: { total_customers: 1250, high_risk_customers: 89 },
    filters: { risk_level: "High" },
    // ... full dashboard state
  }
}
```

### Agent Dropdown
Users can click the "Available Agents" dropdown to:
- Browse all available agents by category
- See agent descriptions and capabilities
- Click to automatically mention an agent

## 🧪 Testing

### Run the Test Suite
```bash
cd /path/to/churn_prediction
node test-agent-integration.js
```

The test suite will:
1. Check API Gateway connectivity
2. Test agent availability
3. Run sample queries against each agent
4. Provide a comprehensive report

### Manual Testing
1. Start the API Gateway: `npm start` (in api-gateway directory)
2. Start the Next.js app: `npm run dev` (in Customer directory)
3. Open the churn dashboard
4. Try mentioning different agents in the chat

## 🔍 Debugging

### Enable Debug Logging
The system includes comprehensive logging. Check browser console for:
- `🚀 queryAgent called:` - Agent query initiation
- `🌐 Making API call:` - HTTP request details
- `📡 API Response received:` - Response status and timing
- `✅ Successful API Response:` - Success details
- `❌ Agent query error:` - Error details

### Common Issues

**Agent Not Found**
```
❌ Agent 'unknown_agent' not found in registry
```
- Check agent name spelling
- Verify agent is in `agentRegistry.ts`
- Ensure agent `isActive: true`

**Network Errors**
```
❌ Network error - agent endpoint unreachable
```
- Verify API Gateway is running
- Check `NEXT_PUBLIC_API_GATEWAY_URL`
- Confirm network connectivity

**Authentication Errors**
```
❌ HTTP 401: Unauthorized
```
- Verify `NEXT_PUBLIC_API_GATEWAY_TOKEN`
- Check API Gateway authentication middleware

**Timeout Errors**
```
❌ Agent did not respond within 10000ms
```
- Check agent endpoint performance
- Increase timeout in `queryAgent()` call
- Verify agent is not overloaded

## 🔒 Security Considerations

### Authentication
- All API calls use Bearer token authentication
- Tokens are configured via environment variables
- No sensitive data exposed in client-side code

### Data Privacy
- Customer data is only sent to authorized agents
- Context is optimized per agent type
- Sensitive fields can be filtered out

### Rate Limiting
- API Gateway implements rate limiting
- Client-side timeout prevents hanging requests
- Graceful degradation on failures

## 🚀 Deployment

### Production Configuration
```env
NEXT_PUBLIC_USE_MOCK_AGENTS=false
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-gateway.com
NEXT_PUBLIC_API_GATEWAY_TOKEN=your_production_token
NODE_ENV=production
```

### Health Monitoring
Monitor these endpoints:
- `/health` - API Gateway health
- `/health/connectors` - Agent connectivity
- `/health/detailed` - Comprehensive health check

## 📈 Performance Optimization

### Caching
- API Gateway implements response caching
- Context is optimized per agent type
- Redundant data is filtered out

### Timeouts
- Default timeout: 10 seconds
- Configurable per agent type
- Graceful fallback to mock responses

### Error Recovery
- Automatic retry on network errors
- Fallback to cached responses
- User-friendly error messages

## 🔄 Future Enhancements

### Planned Features
- **WebSocket Support** - Real-time agent communication
- **Agent Orchestration** - Multi-agent workflows
- **Response Caching** - Improved performance
- **Agent Analytics** - Usage tracking and optimization

### Adding New Agents
1. Add agent to `agentRegistry.ts`
2. Update routing in `query.api.js`
3. Implement agent endpoints in API Gateway
4. Add tests to test suite
5. Update documentation

## 📞 Support

For issues or questions:
1. Check the test suite output
2. Review browser console logs
3. Verify API Gateway health
4. Check agent endpoint implementations
5. Review this documentation

---

**Last Updated:** December 2024  
**Version:** 2.0.0  
**Compatibility:** Next.js 13+, Node.js 18+