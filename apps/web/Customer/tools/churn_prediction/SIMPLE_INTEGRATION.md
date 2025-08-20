# Simple Integration Guide - Robot with Lasers

## Quick Setup (2 Steps Only!)

### Step 1: Add to Your Dashboard (index.page.tsx)

Add this import at the top:
```tsx
import RobotWithLasers from '../ui/components/RobotWithLasers';
```

Add the component right before the closing fragment in your dashboard:
```tsx
export function ChurnPredictionDashboard() {
  // ... your existing code ...

  return (
    <>
      {/* ... all your existing dashboard content ... */}
      
      {/* Add this line just before the closing </> */}
      <RobotWithLasers enabled={true} />
    </>
  );
}
```

### Step 2: Update Your Charts to Support Clicking

In your **EnhancedRiskPyramid.tsx**, modify the `handleBarClick` function:

```tsx
const handleBarClick = (data: any) => {
  // Your existing code...
  const contextData = {
    chartType: 'risk-pyramid',
    chartName: 'Risk Distribution Pyramid',
    selectedData: data,
    clickedElement: data.name,
    timestamp: new Date()
  };

  dispatch(setChatContext(contextData));
  
  // ADD THESE LINES - This connects to the robot!
  if (typeof window !== 'undefined' && (window as any).addChartPoint) {
    // Get the click event coordinates
    const event = window.event as MouseEvent;
    if (event) {
      (window as any).addChartPoint({
        x: event.clientX,
        y: event.clientY,
        label: `${data.name} Risk`,
        value: data.count,
        chartType: 'risk-pyramid'
      });
    }
  }
  
  // Rest of your existing code...
};
```

### That's It! 🎉

## How to Use

1. **Click** any bar in the Risk Pyramid → Robot appears with laser
2. **Hold Shift + Click** more bars → Multiple lasers appear
3. **Click Quick/Strategic/Forecast** buttons → Different insights
4. **Press Escape** → Clear all selections

## For Other Charts (Optional)

To make your other charts work with the robot, add this to their click handlers:

### For Probability Histogram:
```tsx
// In EnhancedProbabilityHistogram.tsx
const handleBarClick = (data: any) => {
  // Your existing code...
  
  // Add robot integration
  if ((window as any).addChartPoint && window.event) {
    const event = window.event as MouseEvent;
    (window as any).addChartPoint({
      x: event.clientX,
      y: event.clientY,
      label: `${data.range}%`,
      value: data.count,
      chartType: 'histogram'
    });
  }
};
```

### For Temporal Pattern:
```tsx
// In EnhancedTemporalRiskPattern.tsx
const handlePointClick = (data: any) => {
  // Your existing code...
  
  // Add robot integration
  if ((window as any).addChartPoint && window.event) {
    const event = window.event as MouseEvent;
    (window as any).addChartPoint({
      x: event.clientX,
      y: event.clientY,
      label: data.date,
      value: data.value,
      chartType: 'temporal'
    });
  }
};
```

### For Feature Importance:
```tsx
// In EnhancedFeatureImportance.tsx
const handleBarClick = (data: any) => {
  // Your existing code...
  
  // Add robot integration
  if ((window as any).addChartPoint && window.event) {
    const event = window.event as MouseEvent;
    (window as any).addChartPoint({
      x: event.clientX,
      y: event.clientY,
      label: data.feature,
      value: data.importance,
      chartType: 'feature'
    });
  }
};
```

## Troubleshooting

### Robot not appearing?
1. Check browser console for errors
2. Make sure `RobotWithLasers` is imported and added to your dashboard
3. Verify `window.event` is available (might need to pass event parameter in some cases)

### Lasers not pointing correctly?
- Make sure you're passing `clientX` and `clientY` (screen coordinates)
- Not `pageX/pageY` or chart-relative coordinates

### Multi-select not working?
- Check if Shift key indicator appears at bottom of screen
- Try holding Shift before clicking

## Features

✅ **Visual Robot** - Animated with glowing visor
✅ **Laser Pointers** - Green beams to selected points  
✅ **Multi-Select** - Shift+Click for multiple points
✅ **AI Insights** - Quick, Strategic, and Forecast modes
✅ **Visual Feedback** - Selection indicators on points
✅ **Keyboard Support** - Escape to clear

## Customization

### Change Robot Position
In `RobotWithLasers.tsx`, modify the position calculation:
```tsx
setRobotPosition({
  x: Math.min(avgX + 100, window.innerWidth - 150), // Adjust offset
  y: window.innerHeight - avgY - 100 // Adjust height
});
```

### Change Laser Color
Find `.laser-beam` in the styles and change `#39ff14` to your color.

### Customize Insights
Modify the `generateInsight` function in `RobotWithLasers.tsx`.

## Working Example

The robot is self-contained and will work immediately after adding it to your dashboard. No Redux changes or complex state management needed!