# AI Context Collection System

## Overview

The AI Context Collection System allows users to collect contextual information from data visualizations and KPI tiles by using **Left Shift + Click** interactions. This context is automatically passed to the AI chat assistant, enabling more informed and relevant responses.

## Features

### ✨ Left Shift + Click Context Collection
- **KPI Tiles**: Collect metric values, trends, and performance indicators
- **Chart Data Points**: Collect specific data point information from visualizations
- **Table Rows**: Collect row-specific data and insights
- **Automatic Chat Opening**: AI chat opens automatically when first context is added

### 🎯 Context Management
- **Multiple Contexts**: Collect up to multiple context items simultaneously
- **Context Display**: Visual representation of collected context above chat input
- **Individual Removal**: Remove specific context items with ✕ button
- **Bulk Clear**: Clear all contexts with "Clear All" button
- **Auto-Integration**: Context automatically included in AI queries

### 🤖 AI Integration
- **Context-Aware Responses**: AI receives full context with every query
- **Structured Data**: Context formatted in markdown for AI consumption
- **Source Attribution**: Each context item includes source component information
- **Timestamp Tracking**: Context items include collection timestamp

## How to Use

### Basic Usage

1. **Collect Context**:
   - Hold **Left Shift** and **click** on any KPI tile
   - Hold **Left Shift** and **click** on chart segments or table rows
   - Watch the AI chat automatically open (on first context)

2. **View Context**:
   - Context appears in a panel above the chat input
   - Each context item shows title, source, and key metrics
   - Clear individual items with ✕ or clear all with "Clear All"

3. **Ask AI Questions**:
   - Type questions that reference the collected context
   - AI automatically receives all context information
   - Get more relevant and specific responses

### Advanced Usage

```typescript
// Programmatically add context
import { contextManager } from '../utils/contextManager';

contextManager.addContext({
  title: 'Custom Data Point',
  type: 'data-point',
  content: {
    title: 'Sales Metric',
    items: [
      { label: 'Revenue', value: '$125K', type: 'metric' },
      { label: 'Growth', value: '+15%', type: 'primary' }
    ],
    insight: 'Strong performance in Q4',
    status: 'good'
  },
  source: 'Custom Component'
});
```

## Implementation Details

### Context Manager (`contextManager.ts`)

The global context manager handles:
- Context storage and retrieval
- Event broadcasting to subscribers
- AI-formatted context generation
- Automatic chat opening on first context

### Enhanced Components

#### AgingAnalysisPanel.tsx
- Left Shift + Click detection on chart segments and table rows
- Tooltip data extraction and formatting
- Visual feedback on context collection

#### KPITile.tsx
- Left Shift + Click detection on KPI tiles
- KPI metric extraction and formatting
- Performance indicator context

#### FloatingAIChat.tsx
- Context subscription and display
- Context panel above input area
- Auto-opening on first context
- Context integration in AI queries

### Context Data Structure

```typescript
interface ContextItem {
  id: string;
  title: string;
  type: 'data-point' | 'kpi-tile' | 'insight';
  content: {
    title: string;
    items: Array<{
      label: string;
      value: string | number;
      color?: string;
      type?: 'primary' | 'secondary' | 'metric';
    }>;
    insight?: string;
    status?: 'critical' | 'warning' | 'good' | 'neutral';
  };
  timestamp: Date;
  source: string;
}
```

## Testing

### Demo Component
Use `ContextTestDemo.tsx` to test the system:

```bash
# Navigate to the demo component
/inventory/tools/SlowMovingInventoryAnalyzer/demo
```

### Test Scenarios

1. **Single Context Collection**:
   - Left Shift + Click on a KPI tile
   - Verify chat opens automatically
   - Verify context appears in chat panel

2. **Multiple Context Collection**:
   - Left Shift + Click on multiple elements
   - Verify all contexts accumulate
   - Verify context formatting in AI queries

3. **Context Management**:
   - Remove individual context items
   - Clear all contexts
   - Verify proper cleanup

## Best Practices

### For Users
- Use descriptive questions that reference the collected context
- Clear old context before starting new analysis sessions
- Collect related data points for comprehensive analysis

### For Developers
- Always include meaningful tooltips with structured data
- Implement Left Shift + Click detection consistently
- Provide visual feedback for context collection
- Test context data structure before adding to manager

## Troubleshooting

### Common Issues

1. **Context Not Collected**:
   - Ensure Left Shift key is held during click
   - Check browser console for error messages
   - Verify component implements context detection

2. **Chat Not Opening**:
   - Check if `contextManager.setOnChatOpenRequest()` is called
   - Verify FloatingAIChat subscription is active

3. **Context Not in AI Queries**:
   - Check `contextManager.getContextsForAI()` output
   - Verify context integration in sendMessage function

### Debug Commands

```javascript
// Browser console debugging
window.__contextManager.getContexts(); // View all contexts
window.__contextManager.clearAllContexts(); // Clear contexts
```

## Future Enhancements

- Context persistence across page reloads
- Context sharing between users
- Advanced context filtering and search
- Context-based AI agent selection
- Visual context highlighting on charts
