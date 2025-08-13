# 🚀 @Mention System Setup Guide - Real Agent Integration

## 📋 Quick Setup Checklist

### ✅ **Step 1: Replace Chatbot Component**
Replace the existing chatbot with the enhanced version:

```typescript
// In your main dashboard component, replace:
import ContextAwareChatbot from './components/chat/ContextAwareChatbot';

// With:
import EnhancedContextAwareChatbot from './components/chat/EnhancedContextAwareChatbot';

// Then update the JSX:
<EnhancedContextAwareChatbot />
```

### ✅ **Step 2: Environment Variables**
Add API Gateway configuration to your `.env.local`:

```bash
# API Gateway Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3002
API_GATEWAY_URL=http://localhost:3002
API_GATEWAY_TOKEN=your_api_gateway_token
NEXT_PUBLIC_API_GATEWAY_TOKEN=your_api_gateway_token

# Optional: Use mock responses for development
NEXT_PUBLIC_USE_MOCK_AGENTS=false
```

### ✅ **Step 3: API Gateway Setup**
Ensure your API Gateway is running on port 3002 with the following endpoints:

```
API Gateway (localhost:3002)
├── /api/v1/sales/
│   ├── sales-performance
│   ├── sales-trends  
│   └── product-performance
├── /api/v1/customer/
│   ├── customer-insights
│   ├── customer-segmentation
│   └── customer-behavior
├── /api/v1/inventory/
│   ├── inventory-levels
│   ├── holding-cost-analysis
│   └── inventory-optimization
└── /api/v1/finance/
    ├── financial-performance
    └── financial-analysis
```

### ✅ **Step 4: Redux Store Integration**
Ensure your Redux store includes the churn prediction slice:

```typescript
// store/index.ts
import churnPredictionReducer from '../Customer/tools/churn_prediction/ui/state/churnPredictionSlice';

export const store = configureStore({
  reducer: {
    churnPrediction: churnPredictionReducer,
    // ... other reducers
  },
});

export type RootState = ReturnType<typeof store.getState>;
```

---

## 🎯 Testing the System

### **1. Basic @Mention Test**
```
User Input: "@sales_agent what's the revenue impact of high-risk customers?"
Expected: Sales agent queries API Gateway and responds with real sales data analysis
```

### **2. Multiple Agent Test**
```
User Input: "@customer_agent @finance_agent how can we improve retention?"
Expected: Both agents respond with their perspectives using real data
```

### **3. Context Awareness Test**
1. Click on a chart element (e.g., "High Risk" in pyramid)
2. Type: "@sales_agent what should we do about this segment?"
3. Expected: Agent references the specific segment and provides real sales insights

### **4. Real Data Integration Test**
```
User Input: "@inventory_agent what products should we focus on?"
Expected: Agent queries inventory API and provides real product recommendations
```

### **5. API Gateway Health Test**
Check that your API Gateway is running:
```bash
curl http://localhost:3002/health
```
Expected: Returns healthy status

---

## 🔧 Configuration Options

### **Enable/Disable Mock Responses**
In `EnhancedContextAwareChatbot.tsx`, line ~XXX:

```typescript
// Set to false for real API calls, true for demo/development
const USE_MOCK_RESPONSES = true;
```

### **Customize Agent Registry**
Edit `ui/config/agentRegistry.ts` to:
- Add new agents
- Modify existing agent descriptions
- Change colors and avatars
- Update API endpoints

### **Adjust Timeout Settings**
In `ui/services/agentCommunication.ts`:

```typescript
// Default 30 seconds, adjust as needed
const DEFAULT_TIMEOUT = 30000;
```

---

## 🎨 UI Customization

### **Agent Colors**
Each agent has a unique color scheme defined in the registry:
- Sales: `#10b981` (Green)
- Support: `#3b82f6` (Blue)  
- Marketing: `#8b5cf6` (Purple)
- Finance: `#f59e0b` (Amber)
- Product: `#ef4444` (Red)
- Data: `#06b6d4` (Cyan)

### **Message Styling**
Agent messages automatically use their brand colors for:
- Background gradients
- Border colors
- Avatar backgrounds
- Loading indicators

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. "Agent not found" Error**
- Check agent name spelling in registry
- Ensure agent is properly configured
- Verify registry import in chatbot component

#### **2. API Endpoint Errors**
- Verify API routes are created in correct directories
- Check authentication tokens in environment variables
- Ensure API endpoints return proper JSON structure

#### **3. Context Not Passed**
- Verify Redux store is properly configured
- Check that dashboard state is being updated
- Ensure context packer is receiving correct data

#### **4. Autocomplete Not Working**
- Check mention regex in `mentionParser.ts`
- Verify agent registry is properly imported
- Ensure input event handlers are correctly bound

### **Debug Mode**
Enable console logging by adding to chatbot component:

```typescript
// Add at top of component
const DEBUG_MODE = true;

// Add in handleAgentMentions function
if (DEBUG_MODE) {
  console.log('Parsed mentions:', parsedMessage);
  console.log('Dashboard context:', context);
  console.log('Agent payload:', payload);
}
```

---

## 📊 Monitoring & Analytics

### **Track Usage**
Add analytics to monitor @mention usage:

```typescript
// In handleAgentMentions function
analytics.track('agent_mentioned', {
  agent_name: agentName,
  query_length: query.length,
  context_type: chatContext?.chartType,
  user_id: userId
});
```

### **Performance Monitoring**
Track agent response times:

```typescript
// In queryAgent function
const startTime = performance.now();
// ... API call
const endTime = performance.now();
analytics.track('agent_response_time', {
  agent_name: agentName,
  response_time_ms: endTime - startTime,
  success: result.success
});
```

---

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] All agent API endpoints created and tested
- [ ] Environment variables configured
- [ ] Authentication tokens generated and secured
- [ ] Error handling tested for all failure scenarios
- [ ] Performance testing completed
- [ ] UI/UX testing across different screen sizes

### **Post-Deployment**
- [ ] Monitor agent response times
- [ ] Track usage patterns and popular agents
- [ ] Collect user feedback on agent responses
- [ ] Monitor error rates and API failures
- [ ] Analyze context accuracy and relevance

---

## 🎯 Success Metrics

### **User Engagement**
- Number of @mentions per session
- Most popular agents
- Query complexity and length
- User satisfaction with agent responses

### **Technical Performance**
- Average agent response time
- API success rate
- Context accuracy score
- Error rate by agent type

### **Business Impact**
- Improved decision-making speed
- Increased user engagement with dashboard
- Better retention strategy outcomes
- Reduced need for manual expert consultation

---

## 🆘 Support & Resources

### **Documentation**
- `MENTION_SYSTEM_GUIDE.md` - Complete system documentation
- `CHATBOT_DATA_FLOW.md` - Original chatbot data flow
- `UI_STYLE_GUIDE.md` - UI styling guidelines

### **Code Files**
- `EnhancedContextAwareChatbot.tsx` - Main chatbot component
- `agentRegistry.ts` - Agent configuration
- `mentionParser.ts` - @mention parsing utilities
- `contextPacker.ts` - Context packaging utilities
- `agentCommunication.ts` - API communication service

### **Getting Help**
1. Check the troubleshooting section above
2. Review console logs for error details
3. Test with mock responses first
4. Verify Redux state and context data
5. Check API endpoint responses manually

---

## 🎉 You're Ready!

The @mention system is now ready to transform your churn dashboard into an intelligent multi-agent platform! Users can now:

- **@sales_agent** for revenue insights
- **@support_agent** for customer health analysis  
- **@marketing_agent** for engagement strategies
- **@finance_agent** for financial impact
- **@product_agent** for usage patterns
- **@data_agent** for advanced analytics

**Example Usage:**
```
"@sales_agent what's the revenue impact of these 89 high-risk customers?"
"@support_agent @marketing_agent how can we improve satisfaction for at-risk customers?"
"Looking at this customer profile, @sales_agent should we prioritize retention or expansion?"
```

The system maintains full context awareness, so agents always understand what the user is analyzing and can provide relevant, actionable insights! 🚀✨