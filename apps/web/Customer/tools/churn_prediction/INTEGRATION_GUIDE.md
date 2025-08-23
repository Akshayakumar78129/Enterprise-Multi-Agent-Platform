# Integration Guide: Multi-Point Selection with Robot Assistant

## Overview
This guide explains how to integrate the multi-point selection feature with robot assistant into your churn prediction dashboard.

## Files Created

1. **RobotAssistant.tsx** - The visual robot with laser pointers and AI insights
2. **ChartSelectionManager.tsx** - Manages multi-point selection across charts
3. **SelectableEnhancedRiskPyramid.tsx** - Enhanced chart component with selection support

## Integration Steps

### Step 1: Update Your Main Dashboard (index.page.tsx)

Add these imports at the top of your dashboard file:

```tsx
import ChartSelectionManager from '../ui/components/selection/ChartSelectionManager';
import SelectableEnhancedRiskPyramid from '../ui/components/visualizations/SelectableEnhancedRiskPyramid';
```

### Step 2: Wrap Your Dashboard Content

Replace your current dashboard JSX structure with this:

```tsx
export function ChurnPredictionDashboard() {
  const dispatch = useDispatch();
  const { customers, loading, error, filters } = useSelector((state: RootState) => state.churnPrediction);
  // ... other existing state

  // Add selection handler
  const handleSelectionChange = (points: any[]) => {
    console.log('Selected points:', points);
    // You can dispatch actions or update state here
  };

  const handleInsightGenerated = (insight: string) => {
    console.log('AI Insight:', insight);
    // Send insight to your chatbot or display it
  };

  return (
    <ChartSelectionManager 
      onSelectionChange={handleSelectionChange}
      onInsightGenerated={handleInsightGenerated}
    >
      {/* Your existing dashboard content goes here */}
      <div style={{ /* existing styles */ }}>
        {/* ... existing header and KPI sections ... */}

        {/* Replace your existing Risk Pyramid with the selectable version */}
        <div className="dashboard-grid" style={{ /* existing grid styles */ }}>
          <div className="chart-container">
            <SelectableEnhancedRiskPyramid customers={customers} data={customers} />
          </div>
          
          {/* Keep your other charts as they are for now */}
          <div className="chart-container">
            <EnhancedProbabilityHistogram customers={customers} data={customers} />
          </div>
          {/* ... other charts ... */}
        </div>

        {/* ... rest of your dashboard ... */}
      </div>
    </ChartSelectionManager>
  );
}
```

### Step 3: Make Other Charts Selectable

To make your other charts selectable, follow this pattern for each chart component:

```tsx
// In any chart component (e.g., EnhancedProbabilityHistogram.tsx)

const handleDataClick = (data: any, index: number, event: any) => {
  const selectionAPI = (window as any).chartSelectionAPI;
  
  if (selectionAPI) {
    const pointData = {
      chartId: 'probability-histogram',
      chartType: 'histogram',
      dataIndex: index,
      label: data.label,
      value: data.value,
      unit: '%',
      coordinates: {
        x: event.clientX,
        y: event.clientY
      },
      color: data.color
    };
    
    selectionAPI.addPoint(pointData);
  }
  
  // Your existing click handler code...
};
```

### Step 4: For Recharts Components

Add click handlers to your Recharts bars/lines:

```tsx
// For Bar charts
<Bar 
  dataKey="value"
  onClick={(data, index, event) => handleDataClick(data, index, event)}
/>

// For Line charts
<Line 
  dataKey="value"
  dot={{ onClick: (e, payload) => handleDataClick(payload, payload.index, e) }}
/>
```

### Step 5: For Chart.js Components

If you have any Chart.js charts, add this to options:

```javascript
options: {
  onClick: (event, elements, chart) => {
    if (elements.length > 0 && window.chartSelectionAPI) {
      const element = elements[0];
      const dataPoint = chart.data.datasets[element.datasetIndex].data[element.index];
      
      window.chartSelectionAPI.addPoint({
        chartId: 'chart-id',
        chartType: 'line',
        dataIndex: element.index,
        label: chart.data.labels[element.index],
        value: dataPoint,
        coordinates: {
          x: event.x,
          y: event.y
        }
      });
    }
  }
}
```

## How It Works

### User Interactions

1. **Single Click**: Selects one point, robot appears with single green laser
2. **Shift + Click**: Adds/removes points from selection, multiple green lasers
3. **Click Empty Space**: Clears all selections
4. **Escape Key**: Clears all selections

### Robot Behavior

- Appears when first point is selected
- Moves to optimal position based on selected points
- Shows context bubble with point summary
- Offers three insight modes: Quick, Strategic, Forecast

### Visual Feedback

- Selected points show green pulsing indicators
- Charts get green border when containing selections
- Shift mode shows indicator at bottom of screen
- Laser pointers connect robot to selected points

## Customization

### Customize Robot Position

```tsx
// In ChartSelectionManager.tsx
const calculateRobotPosition = (points) => {
  // Your custom positioning logic
  return { x: 100, y: 200 };
};
```

### Customize AI Insights

Edit the insight generation functions in `RobotAssistant.tsx`:

```tsx
const generateQuickInsight = (points) => {
  // Your custom insight logic
  return `Custom insight for ${points.length} points`;
};
```

### Customize Visual Styles

All styles are included as inline styles in the components. You can modify:
- Robot colors in `RobotAssistant.tsx`
- Laser colors (change `#39ff14` for selection, `#ff1f4f` for anomalies)
- Bubble styles in the `.context-bubble` class

## API Reference

### Window.chartSelectionAPI

The selection manager exposes these methods globally:

```typescript
interface ChartSelectionAPI {
  addPoint(point: SelectedPoint): void;
  clearSelection(): void;
  isMultiSelectMode(): boolean;
  getSelection(): SelectedPoint[];
}
```

### SelectedPoint Interface

```typescript
interface SelectedPoint {
  chartId: string;        // Unique chart identifier
  chartType: string;      // 'risk-pyramid' | 'histogram' | 'temporal' | 'feature'
  dataIndex: number;      // Index in dataset
  label: string;          // Display label
  value: number;          // Numeric value
  unit?: string;          // Optional unit (%, $, etc.)
  coordinates: {          // Screen coordinates
    x: number;
    y: number;
  };
  color?: string;         // Point color
  isAnomaly?: boolean;    // Mark as anomaly
  metadata?: any;         // Additional data
}
```

## Troubleshooting

### Robot Not Appearing
- Check if `ChartSelectionManager` is wrapping your content
- Verify `window.chartSelectionAPI` is available in console
- Ensure click handlers are calling `selectionAPI.addPoint()`

### Lasers Not Pointing Correctly
- Make sure coordinates are in screen space (clientX/clientY)
- Check if chart container has proper positioning
- Verify robot position calculations

### Multi-Select Not Working
- Check if Shift key detection is working
- Look for "Multi-select mode active" indicator
- Verify browser allows keyboard event detection

## Testing

1. Open your dashboard
2. Click any bar in the Risk Pyramid - robot should appear
3. Hold Shift and click another bar - second laser should appear
4. Click Quick/Strategic/Forecast buttons - insights should change
5. Press Escape - all selections should clear

## Next Steps

1. **Add to all charts**: Make remaining charts selectable
2. **Connect to chatbot**: Send insights to your AI chatbot
3. **Add persistence**: Save selections to Redux state
4. **Add animations**: Enhance robot movements and transitions
5. **Add voice**: Use speech synthesis for insights

## Example Integration

See `SelectableEnhancedRiskPyramid.tsx` for a complete example of how to make a Recharts component fully selectable with visual feedback.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all components are imported correctly
3. Ensure React version compatibility (requires React 16.8+)
4. Check that Redux is properly configured