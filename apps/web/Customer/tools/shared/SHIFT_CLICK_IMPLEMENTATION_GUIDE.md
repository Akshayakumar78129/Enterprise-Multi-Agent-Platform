# Universal Shift-Click Implementation Guide

## Overview
All visualization components now support consistent shift-click functionality for multi-selection.

## Quick Implementation

### 1. Import the Universal Helper
```typescript
import { handleUniversalChartClick } from '../shared/utils/universalChartHelper';
```

### 2. Call on Click Events
```typescript
const handleClick = (data, event) => {
  handleUniversalChartClick({
    chartId: 'your-chart-id',
    chartType: 'bar-chart',
    label: data.name,
    value: data.value,
    unit: ' customers', // optional
    metadata: data // optional
  }, event);
};
```

### 3. For React Components
```jsx
<Bar onClick={(e) => handleClick(data, e)} />
```

### 4. For Plotly Components
```jsx
<Plot onClick={(event) => {
  if (event.points && event.points[0]) {
    handleUniversalChartClick({
      chartId: 'plotly-chart',
      chartType: 'scatter',
      label: event.points[0].x,
      value: event.points[0].y
    }, event.event);
  }
}} />
```

## Features
- **Single Click**: Replaces current selection
- **Shift+Click**: Adds to current selection
- **Clean Display**: Shows selected points above chatbot input
- **Minimal Data**: Only sends essential info (no large arrays)

## Components Already Updated
### Churn Prediction
- ✅ ChurnRiskPyramidWithSelection
- ✅ EnhancedFeatureImportance
- ✅ EnhancedRiskPyramid
- ✅ EnhancedProbabilityHistogram
- ✅ SegmentMatrix
- ✅ TemporalRiskPattern
- ✅ ProbabilityHistogram
- ✅ FeatureImportance

### Customer Segmentation
- ✅ EnhancedSegmentProfileCards
- ✅ EnhancedSegmentDistributionMap
- ✅ SegmentMetricComparison

### Transaction Patterns
- ✅ DualAxisTimeSeries
- ⏳ TemporalHeatmap
- ⏳ ProductMatrixScatterPlot
- ⏳ AmountDistributionHistogram

### Other Tools
- ⏳ Purchase Frequency visualizations
- ⏳ Performance Deviation visualizations
- ⏳ Next Purchase visualizations

## Testing
1. Click any chart element - should show single selection
2. Shift+click another - should add to selection
3. Check chatbot input area - should show clean list
4. Clear button should remove all selections

## Notes
- Always pass the event object to detect shift key
- Use minimal data format (label + value only)
- Don't send large arrays or complex objects
- Integrate with existing click handlers, don't replace them