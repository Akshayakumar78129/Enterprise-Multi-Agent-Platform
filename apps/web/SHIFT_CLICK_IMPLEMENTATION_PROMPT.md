# 🎯 Complete Prompt to Implement Shift-Click Multi-Selection with Clean Display

## Overview
I need to implement a shift-click multi-selection feature for my dashboard charts that shows selected data points in a clean, minimal list above the chatbot input area (NOT as chat messages).

## Requirements

### User Experience
1. **Single Click**: Normal chart interaction (unchanged)
2. **Shift + Click**: Add/remove from multi-selection
3. **Visual Feedback**: Show "✅ Context sent to chatbot!" tooltip on selection
4. **Clean Display**: Show selected points as a numbered list above chatbot input
5. **Individual Removal**: × button next to each point to remove just that one
6. **Clear All**: Main × button or ESC key to clear all selections
7. **NO CHAT MESSAGES**: Selected points should NOT appear as text in the chat

### Display Format
```
● Selected Points (3)  Shift+click to add more              ×
1. Medium Risk: 584 [Risk Pyramid]                          ×
2. High Risk: 312 [Risk Pyramid]                            ×
3. 20-30%: 145 customers [Histogram]                        ×
```

## Implementation Steps

### Step 1: Create Chart Selection Helper (chartSelectionHelper.ts)
```typescript
// Chart Selection Helper - Integrates charts with ChartSelectionManager
export interface ChartClickData {
  chartId: string;
  chartType: string;
  label: string;
  value: number | string;
  unit?: string;
  index?: number;
  color?: string;
  metadata?: any;
}

export const handleChartClick = (
  data: ChartClickData,
  event?: React.MouseEvent | MouseEvent | any,
  isShiftKey?: boolean
) => {
  // Check if ChartSelectionManager API is available
  const selectionAPI = (window as any).chartSelectionAPI;
  if (selectionAPI) {
    const isMultiSelect = isShiftKey ?? event?.shiftKey ?? selectionAPI.isMultiSelectMode();
    
    const coordinates = event ? {
      x: event.clientX ?? event.pageX ?? 0,
      y: event.clientY ?? event.pageY ?? 0
    } : { x: 0, y: 0 };

    const point = {
      chartId: data.chartId,
      chartType: data.chartType,
      dataIndex: data.index ?? 0,
      label: data.label,
      value: data.value,
      unit: data.unit,
      coordinates,
      color: data.color,
      metadata: data.metadata,
      timestamp: new Date().toISOString()
    };

    selectionAPI.addPoint(point);
  }
  
  // ALSO send to chatbot for display in minimal format
  if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
    (window as any).addAIInsightToChat({
      label: data.label,
      value: data.value,
      chartType: data.chartType,
      count: data.value,
      unit: data.unit || '',
      originalEvent: event
    });
  }
  
  return true;
};
```

### Step 2: Update Chatbot Component to Handle Selections

Add this to your chatbot component state:
```typescript
const [conversationMemory, setConversationMemory] = useState<{
  lastActiveCustomer?: any;
  lastChartContext?: any;
  selectedPoints?: any[];
  mentionHistory: string[];
  conversationContext: {
    // ... your existing context
  };
  conversationTurn: number;
}>({
  selectedPoints: [],
  mentionHistory: [],
  conversationContext: {},
  conversationTurn: 0
});
```

Add this handler function:
```typescript
const handleChartClickContext = useCallback((clickData: any) => {
  const { label, value, chartType, count, originalEvent } = clickData;
  const isShiftKey = originalEvent?.shiftKey || false;
  
  // NO CHAT MESSAGE - just update the selected points display
  console.log('📊 Chart click received, updating selection:', { 
    label, 
    value: count || value,
    chartType,
    isShiftKey 
  });
  
  // Store chart context - handle multi-selection with shift key
  setConversationMemory(prev => {
    const newPoint = {
      label,
      value: count || value,
      chartType,
      unit: clickData.unit || ''
    };
    
    if (isShiftKey && prev.selectedPoints) {
      // Add to existing selection
      return {
        ...prev,
        lastChartContext: clickData,
        selectedPoints: [...prev.selectedPoints, newPoint]
      };
    } else {
      // Replace selection
      return {
        ...prev,
        lastChartContext: clickData,
        selectedPoints: [newPoint]
      };
    }
  });
}, []);

// Expose the function globally for chart integration
useEffect(() => {
  if (typeof window !== 'undefined') {
    (window as any).addAIInsightToChat = handleChartClickContext;
    console.log('✅ AI Insight handler registered globally');
  }
  
  return () => {
    if (typeof window !== 'undefined') {
      delete (window as any).addAIInsightToChat;
    }
  };
}, [handleChartClickContext]);
```

### Step 3: Add the Clean Display Component Above Input

Add this JSX above your chatbot input area:
```jsx
{/* Selected Points Display - Clean hover style above input */}
{conversationMemory?.selectedPoints && conversationMemory.selectedPoints.length > 0 && (
  <div style={{
    padding: '10px 20px',
    background: 'rgba(0, 224, 255, 0.03)',
    borderTop: '1px solid rgba(0, 224, 255, 0.1)',
    borderBottom: '1px solid rgba(0, 224, 255, 0.1)',
    maxHeight: conversationMemory.selectedPoints.length > 2 ? '80px' : 'auto',
    overflowY: conversationMemory.selectedPoints.length > 2 ? 'auto' : 'visible',
    transition: 'all 0.3s ease'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'rgba(247, 249, 251, 0.6)',
        marginBottom: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: '#00e0ff', 
            fontSize: '8px',
            animation: 'pulse 2s infinite'
          }}>●</span>
          <span>Selected Points ({conversationMemory.selectedPoints.length})</span>
          {conversationMemory.selectedPoints.length > 1 && (
            <span style={{ fontSize: '10px', opacity: 0.5 }}>
              Shift+click to add more
            </span>
          )}
        </div>
        <button
          onClick={() => setConversationMemory(prev => ({ 
            ...prev, 
            lastChartContext: undefined,
            selectedPoints: []
          }))}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(247, 249, 251, 0.4)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.8)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.4)'}
          title="Clear all selections"
        >
          ×
        </button>
      </div>
      
      {/* Selected points list */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {conversationMemory.selectedPoints.map((point, index) => (
          <div 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#f8fafc',
              padding: '4px 8px',
              background: 'rgba(0, 224, 255, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(0, 224, 255, 0.1)',
              position: 'relative',
              paddingRight: '32px'
            }}
          >
            <span style={{ 
              fontSize: '11px', 
              opacity: 0.5,
              minWidth: '16px'
            }}>
              {index + 1}.
            </span>
            <span style={{ fontWeight: 500 }}>
              {point.label}: {point.value}{point.unit}
            </span>
            {point.chartType && (
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                background: 'rgba(0, 224, 255, 0.1)',
                borderRadius: '4px',
                color: '#00e0ff',
                marginLeft: 'auto',
                marginRight: '24px'
              }}>
                {point.chartType}
              </span>
            )}
            {/* Individual remove button */}
            <button
              onClick={() => {
                setConversationMemory(prev => ({
                  ...prev,
                  selectedPoints: prev.selectedPoints?.filter((_, i) => i !== index) || []
                }));
              }}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'rgba(247, 249, 251, 0.3)',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '14px',
                lineHeight: 1,
                transition: 'all 0.2s',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff4444';
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(247, 249, 251, 0.3)';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Remove this point"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{/* Your existing chatbot input goes here */}
```

### Step 4: Update Chart Components to Use Shift-Click

For Recharts components:
```jsx
<Bar 
  onClick={(data, index, e) => {
    handleChartClick({
      chartId: 'my-bar-chart',
      chartType: 'bar',
      label: data.name,
      value: data.value,
      unit: ' units'
    }, e);
  }}
/>
```

For Plotly components:
```jsx
<Plot
  onClick={(event) => {
    if (event.points && event.points[0]) {
      const point = event.points[0];
      const isShiftClick = event.event?.shiftKey;
      
      if (isShiftClick) {
        handleChartClick({
          chartId: 'my-plotly-chart',
          chartType: 'scatter',
          label: point.x,
          value: point.y,
          unit: ' customers'
        }, event.event);
      } else {
        // Regular click behavior
      }
    }
  }}
/>
```

For custom components:
```jsx
<div 
  onClick={(e) => {
    if (e.shiftKey) {
      // Use the global handler directly
      if (window.addAIInsightToChat) {
        window.addAIInsightToChat({
          label: 'Medium Risk',
          value: 584,
          chartType: 'Risk Pyramid',
          count: 584,
          unit: '',
          originalEvent: e.nativeEvent
        });
      }
    } else {
      // Regular click behavior
    }
  }}
>
  {/* Your chart content */}
</div>
```

### Step 5: Add ESC Key Handler to Clear Selections

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setConversationMemory(prev => ({
        ...prev,
        selectedPoints: [],
        lastChartContext: undefined
      }));
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## Key Points to Remember

1. **NO CHAT MESSAGES**: Don't add selected points as messages in the chat
2. **MINIMAL DATA**: Only send label, value, unit, and chartType
3. **SHIFT KEY DETECTION**: Always check `event.shiftKey` or `originalEvent?.shiftKey`
4. **GLOBAL HANDLER**: Register `window.addAIInsightToChat` in useEffect
5. **CLEAN DISPLAY**: Show selections above input, not in chat
6. **INDIVIDUAL REMOVAL**: Each point needs its own × button
7. **SCROLLABLE**: Use maxHeight and overflowY for >2 selections

## Testing Checklist

- [ ] Single click works normally (unchanged behavior)
- [ ] Shift+click adds to selection
- [ ] Selected points show above input (not in chat)
- [ ] Individual × buttons remove single points
- [ ] Main × button clears all
- [ ] ESC key clears all
- [ ] Display scrolls when >2 points selected
- [ ] "Context sent to chatbot" tooltip appears
- [ ] No duplicate messages in chat

## File Structure
```
/your-app
  /components
    /chat
      - EnhancedChatbot.tsx (main chatbot with selection display)
    /visualizations
      - YourChart.tsx (implements shift-click)
  /utils
    - chartSelectionHelper.ts (helper functions)
```

This implementation provides a clean, professional multi-selection experience without cluttering the chat with messages.