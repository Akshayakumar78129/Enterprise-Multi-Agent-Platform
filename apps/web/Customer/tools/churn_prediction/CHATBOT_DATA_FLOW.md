# 🤖 Chatbot Data Extraction & Context System

## 📋 Overview
The chatbot in the churn prediction dashboard uses a sophisticated **context-aware system** that extracts real-time data from the dashboard components and provides intelligent responses based on user interactions.

---

## 🔄 Data Flow Architecture

```
Dashboard Components → Redux State → Chart Interactions → Context Setting → AI Processing → Intelligent Response
```

---

## 🗃️ Data Sources

### 1. **Redux Global State**
The chatbot accesses data through Redux state management:

```typescript
// Main data sources from Redux store
const { isChatOpen, chatContext, customers } = useSelector((state: RootState) => state.churnPrediction);

// Available data includes:
- customers: ChurnCustomer[]     // All customer data with risk levels
- chatContext: ChartContext      // Current chart interaction context
- filters: FilterState           // Applied dashboard filters
- loading: boolean               // Data loading state
- error: string                  // Error messages
```

### 2. **Customer Data Structure**
```typescript
interface ChurnCustomer {
  customer_id: number;
  name: string;
  rfm: number;                   // RFM score (1-10)
  last_purchase_date: string;
  frequency: number;             // Purchase frequency
  avg_order_value: number;       // Average order value
  churn_probability: number;     // Probability (0-1)
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
}
```

---

## 🎯 Context-Aware System

### 1. **Chart Interaction Capture**
When users click on chart elements, the system captures detailed context:

```typescript
// Example: Risk Pyramid Bar Click
const handleBarClick = (data: any) => {
  const contextData = {
    chartType: 'risk-pyramid',           // Type of chart
    chartName: 'Risk Distribution Pyramid', // Human-readable name
    selectedData: data,                  // Complete data object
    clickedElement: data.name,           // Specific element clicked
    timestamp: new Date()                // When interaction occurred
  };

  dispatch(setChatContext(contextData)); // Store in Redux
};
```

### 2. **Context Data Structure**
```typescript
interface ChartContext {
  chartType: string;        // 'risk-pyramid', 'probability-histogram', etc.
  chartName: string;        // Display name for the chart
  selectedData: any;        // Raw data from the clicked element
  clickedElement: string;   // Specific element identifier
  timestamp: Date;          // Interaction timestamp
}
```

---

## 📊 Real-Time Data Processing

### 1. **Statistical Analysis**
The chatbot calculates real-time statistics from the customer data:

```typescript
const customerStats = {
  total: customers.length,
  highRisk: customers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length,
  avgChurnProb: customers.length > 0 ? 
    (customers.reduce((sum, c) => sum + c.churn_probability, 0) / customers.length * 100).toFixed(1) : 0
};
```

### 2. **Dynamic Context Generation**
Based on the chart interaction, the system generates specific insights:

```typescript
const generateContextMessage = (context: any) => {
  const { chartType, chartName, selectedData, clickedElement } = context;
  
  switch (chartType) {
    case 'risk-pyramid':
      const riskLevel = clickedElement;
      const count = selectedData?.count || 0;
      const percentage = customers.length > 0 ? 
        ((count / customers.length) * 100).toFixed(1) : '0';
      
      return `📊 **${chartName} - ${riskLevel} Risk Analysis**

You clicked on the **${riskLevel}** risk level which contains **${count} customers** (${percentage}% of total).

**Key Insights:**
• This represents ${getRiskDescription(riskLevel)}
• ${getRiskRecommendation(riskLevel, count)}

What would you like to know about these ${riskLevel.toLowerCase()} risk customers?`;
  }
};
```

---

## 🧠 AI Response Generation

### 1. **Context-Aware Prompts**
The system builds intelligent prompts that include:

```typescript
const prompt = `You are an advanced AI assistant for a churn prediction dashboard. 
The user asked: "${textToSend}".

Current Customer Data:
- Total customers: ${customerStats.total}
- High/Very High risk: ${customerStats.highRisk}
- Average churn probability: ${customerStats.avgChurnProb}%

${contextInfo} // Includes chart interaction details

Provide helpful, professional insights about churn prediction...`;
```

### 2. **Contextual Information Injection**
```typescript
let contextInfo = '';
if (chatContext) {
  contextInfo = `
Current Context: User is analyzing ${chatContext.chartName} 
and clicked on ${chatContext.clickedElement}. 
Chart data: ${JSON.stringify(chatContext.selectedData)}`;
}
```

---

## 🎨 Chart-Specific Data Extraction

### 1. **Risk Pyramid Data**
```typescript
// Extracts risk distribution data
const chartData = riskLevels.map(level => {
  const count = customerData.filter(c => c.risk_level === level.key).length;
  return {
    name: level.key,
    count: count,
    color: level.color,
    emoji: level.emoji
  };
});
```

### 2. **Probability Histogram Data**
```typescript
// Creates probability distribution bins
const bins = Array.from({ length: 10 }, (_, i) => ({
  range: `${i * 10}-${(i + 1) * 10}%`,
  count: 0,
  probability: i * 10 + 5,
  color: getColorForProbability(i * 10 + 5)
}));

customerData.forEach(customer => {
  const prob = customer.churn_probability * 100;
  const binIndex = Math.min(Math.floor(prob / 10), 9);
  bins[binIndex].count++;
});
```

### 3. **Feature Importance Data**
```typescript
// Analyzes which factors most influence churn
const featureImportance = [
  { feature: 'recency', importance: 0.35, description: 'Days since last purchase' },
  { feature: 'frequency', importance: 0.28, description: 'Purchase frequency' },
  { feature: 'monetary', importance: 0.22, description: 'Total spend amount' },
  { feature: 'rfm_score', importance: 0.15, description: 'Combined RFM score' }
];
```

---

## 🔄 Interactive Workflow

### Step 1: User Clicks Chart Element
```typescript
// User clicks on "High Risk" bar in pyramid chart
onClick={() => handleBarClick({
  name: 'High Risk',
  count: 25,
  color: '#f97316',
  emoji: '🟠'
})}
```

### Step 2: Context is Stored
```typescript
// Redux action dispatched
dispatch(setChatContext({
  chartType: 'risk-pyramid',
  chartName: 'Risk Distribution Pyramid',
  selectedData: { name: 'High Risk', count: 25, color: '#f97316' },
  clickedElement: 'High Risk',
  timestamp: new Date()
}));
```

### Step 3: Chat Opens with Context
```typescript
// Chatbot automatically generates contextual message
useEffect(() => {
  if (chatContext) {
    dispatch(toggleChat(true)); // Open chat
    
    const contextMessage = {
      type: 'bot',
      content: generateContextMessage(chatContext),
      contextData: chatContext
    };
    setMessages(prev => [...prev, contextMessage]);
  }
}, [chatContext]);
```

### Step 4: AI Processes User Questions
```typescript
// When user asks follow-up questions, AI has full context
const aiResponse = generateAIResponse(userMessage, chatContext, customerStats);
```

---

## 📈 Data Analysis Capabilities

### 1. **Real-Time Statistics**
- Total customer count
- Risk level distribution
- Average churn probability
- Trend analysis over time
- Feature importance rankings

### 2. **Contextual Insights**
- Specific risk level analysis
- Probability range explanations
- Feature impact descriptions
- Temporal pattern identification
- Comparative analysis

### 3. **Actionable Recommendations**
- Risk-specific retention strategies
- Probability-based interventions
- Feature optimization suggestions
- Timeline-based action plans

---

## 🛠️ Implementation Details

### 1. **Redux State Management**
```typescript
// State slice for churn prediction
const churnPredictionSlice = createSlice({
  name: 'churnPrediction',
  initialState: {
    customers: [],
    chatContext: null,
    isChatOpen: false,
    // ... other state
  },
  reducers: {
    setChatContext(state, action) {
      state.chatContext = action.payload;
    },
    toggleChat(state, action) {
      state.isChatOpen = action.payload;
    },
    clearChatContext(state) {
      state.chatContext = null;
    }
  }
});
```

### 2. **Data Fetching**
```typescript
// Async thunk for fetching customer data
export const fetchChurnCustomers = createAsyncThunk(
  'churnPrediction/fetchChurnCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/churn-prediction/data');
      const data = await res.json();
      return data.customers;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);
```

### 3. **Context Processing**
```typescript
// Smart context analysis
const getRiskDescription = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Very High': 
      return 'customers with >80% churn probability who need immediate intervention';
    case 'High': 
      return 'customers with 60-80% churn probability requiring urgent attention';
    case 'Medium': 
      return 'customers with 30-60% churn probability who could benefit from proactive engagement';
    case 'Low': 
      return 'customers with <30% churn probability who are relatively stable';
  }
};
```

---

## 🎯 Key Benefits

### 1. **Context Awareness**
- Understands what user is looking at
- Provides relevant insights for specific data points
- Maintains conversation context across interactions

### 2. **Real-Time Analysis**
- Processes live dashboard data
- Calculates statistics on-demand
- Adapts responses to current data state

### 3. **Interactive Intelligence**
- Responds to chart clicks with specific insights
- Provides actionable recommendations
- Maintains conversation flow with follow-up questions

### 4. **Data Integration**
- Seamlessly accesses all dashboard data
- Correlates information across different charts
- Provides comprehensive analysis combining multiple data sources

---

## 🚀 Future Enhancements

### 1. **Advanced Analytics**
- Machine learning model explanations
- Predictive trend analysis
- Anomaly detection alerts
- Custom metric calculations

### 2. **Enhanced Context**
- Multi-chart correlation analysis
- Historical comparison insights
- Drill-down capabilities
- Export functionality

### 3. **Personalization**
- User preference learning
- Custom insight generation
- Saved analysis templates
- Personalized recommendations

This system creates a truly intelligent chatbot that doesn't just answer questions, but understands the user's current focus and provides contextually relevant insights! 🎯