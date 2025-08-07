# UI Common - Shared Components Library

## Overview

This directory contains all shared UI components, design system elements, and utilities used across the Enterprise IQ Data Analytics Platform. It provides a consistent visual language and reusable components for all domain tools.

## Directory Structure

```
ui-common/
├── ai-interaction/              # AI-specific UI components
│   ├── LaserPointer/           # Visual attention guidance
│   ├── RobotCharacter/         # AI assistant avatar
│   └── SpeechBubble/           # AI response display
├── QueryInput/                 # Natural language input
├── design-system/              # Core design system
│   ├── components/             # Base UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Checkbox/
│   │   ├── Grid/
│   │   ├── Input/
│   │   ├── KpiTile/
│   │   ├── Navigation/
│   │   ├── Select/
│   │   ├── Table/
│   │   ├── Tabs/
│   │   └── Toggle/
│   ├── ComponentDemo.jsx       # Component showcase
│   ├── theme.js                # Theme configuration
│   └── tokens.js               # Design tokens
├── components/                 # Additional shared components
│   └── ErrorBoundary.js       # Error handling wrapper
├── hooks/                      # Custom React hooks
│   └── useApiClient.js        # API client hook
├── utils/                      # Shared utilities
│   ├── api/                    # API utilities
│   │   ├── ApiClient.js       # Base API client
│   │   ├── functionCalls.js   # Function call helpers
│   │   └── geminiClient.js    # Gemini AI integration
│   └── charts/                 # Chart utilities
│       └── plotlyTheme.js     # Plotly theme config
└── markdown.tsx                # Markdown renderer
```

## Core Components

### Design System Components

#### **Card** (`Card.tsx`)
Container component for content blocks
```jsx
<Card title="Analytics" icon="chart" collapsible>
  {/* Content */}
</Card>
```

#### **KpiTile** (`KpiTile.tsx`)
Key performance indicator display
```jsx
<KpiTile 
  value={1254} 
  label="Total Customers"
  trend={+12.5}
  format="number"
/>
```

#### **Button** (`Button/`)
Action buttons with multiple variants
```jsx
<Button variant="primary" size="large" onClick={handleClick}>
  Analyze Data
</Button>
```

#### **Grid** (`Grid.tsx`)
Responsive layout grid system
```jsx
<Grid columns={3} gap="medium">
  <GridItem>{/* Content */}</GridItem>
</Grid>
```

#### **Table** (`Table/`)
Data table with sorting and filtering
```jsx
<Table 
  data={customers}
  columns={columns}
  sortable
  paginated
/>
```

### AI Interaction Components

#### **RobotCharacter** (`ai-interaction/RobotCharacter/`)
Interactive AI assistant avatar
- Draggable positioning
- State animations (idle, thinking, speaking, pointing)
- Voice interface integration
- Position persistence

```jsx
<RobotCharacter 
  state="speaking"
  position={{ x: 100, y: 100 }}
  onPositionChange={handlePosition}
/>
```

#### **LaserPointer** (`ai-interaction/LaserPointer/`)
Visual attention guidance system
- AI laser (red) for AI-guided attention
- User laser (green) for user selections
- Dynamic tracking of components
- Pulsing animations

```jsx
<LaserPointer 
  from={{ x: robotX, y: robotY }}
  to={{ x: targetX, y: targetY }}
  type="ai"
  active
/>
```

#### **SpeechBubble** (`ai-interaction/SpeechBubble/`)
AI response display component
```jsx
<SpeechBubble 
  text="I've identified 3 key insights..."
  position="right"
  typing
/>
```

#### **QueryInput** (`QueryInput/`)
Natural language query interface
- Voice input support
- Slash commands
- Query history
- Auto-suggestions

```jsx
<QueryInput 
  onSubmit={handleQuery}
  suggestions={suggestions}
  enableVoice
  placeholder="Ask me anything..."
/>
```

## Design System

### Color Palette

```javascript
const colors = {
  // Primary Colors
  electricCyan: '#00e0ff',      // Interactive elements, AI highlights
  signalMagenta: '#e930ff',     // Alerts, anomalies, important actions
  midnightNavy: '#0a1224',      // Primary background
  cloudWhite: '#f7f9fb',        // Text, high-contrast surfaces
  
  // Secondary Colors
  graphite: '#232a36',          // Card backgrounds
  slate: '#3a4459',             // Secondary backgrounds
  steel: '#566379',             // Borders, dividers
  
  // Semantic Colors
  success: '#10b981',           // Positive trends
  warning: '#f59e0b',           // Warnings
  error: '#ef4444',             // Errors, negative trends
  info: '#3b82f6'               // Information
}
```

### Typography

```javascript
const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem'  // 36px
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
}
```

### Spacing

```javascript
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem'    // 64px
}
```

## Utilities

### API Client (`utils/api/ApiClient.js`)
Base API client with authentication and error handling
```javascript
import { ApiClient } from 'ui-common/utils/api';

const client = new ApiClient({
  baseURL: '/api',
  timeout: 30000
});

const data = await client.get('/customer/segmentation');
```

### Gemini Client (`utils/api/geminiClient.js`)
AI integration with function calling
```javascript
import { GeminiClient } from 'ui-common/utils/api';

const gemini = new GeminiClient();

// Register UI functions for AI control
gemini.registerFunction({
  name: 'spawnVisualization',
  description: 'Creates a new visualization',
  parameters: { /* schema */ },
  handler: async (args) => { /* implementation */ }
});

const response = await gemini.query("Show me sales trends");
```

### Plotly Theme (`utils/charts/plotlyTheme.js`)
Consistent chart styling
```javascript
import { plotlyTheme } from 'ui-common/utils/charts';

const chart = {
  data: [/* ... */],
  layout: {
    ...plotlyTheme.layout,
    title: 'Sales Performance'
  }
};
```

## Custom Hooks

### useApiClient
Hook for API interactions with loading and error states
```jsx
import { useApiClient } from 'ui-common/hooks';

const MyComponent = () => {
  const { data, loading, error, fetch } = useApiClient('/api/endpoint');
  
  useEffect(() => {
    fetch();
  }, []);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <DataDisplay data={data} />;
};
```

## Usage Examples

### Creating a Dashboard with KPI Tiles
```jsx
import { Grid, KpiTile, Card } from 'ui-common';

const Dashboard = ({ metrics }) => (
  <Card title="Performance Metrics">
    <Grid columns={4} gap="md">
      <KpiTile 
        value={metrics.revenue} 
        label="Revenue"
        format="currency"
        trend={metrics.revenueTrend}
      />
      <KpiTile 
        value={metrics.customers} 
        label="Customers"
        format="number"
        trend={metrics.customerTrend}
      />
      {/* More tiles */}
    </Grid>
  </Card>
);
```

### Implementing AI Interaction
```jsx
import { RobotCharacter, LaserPointer, QueryInput } from 'ui-common';

const AICanvas = () => {
  const [robotState, setRobotState] = useState('idle');
  const [laserTarget, setLaserTarget] = useState(null);
  
  const handleQuery = async (query) => {
    setRobotState('thinking');
    const response = await processQuery(query);
    setRobotState('speaking');
    
    if (response.targetElement) {
      setLaserTarget(response.targetElement);
    }
  };
  
  return (
    <>
      <RobotCharacter state={robotState} />
      {laserTarget && <LaserPointer to={laserTarget} />}
      <QueryInput onSubmit={handleQuery} />
    </>
  );
};
```

## Best Practices

### Component Usage
1. Always use design system components for consistency
2. Leverage theme tokens instead of hardcoded values
3. Use semantic color names for better maintainability
4. Implement proper error boundaries around components

### Performance
1. Use React.memo for expensive components
2. Implement lazy loading for heavy components
3. Optimize re-renders with useMemo and useCallback
4. Use virtual scrolling for large lists

### Accessibility
1. Ensure proper ARIA labels
2. Maintain keyboard navigation support
3. Provide sufficient color contrast
4. Include screen reader descriptions

## Testing

Components include unit tests using Jest and React Testing Library:
```bash
# Run component tests
npm test -- ui-common

# Test specific component
npm test -- KpiTile
```

## Contributing

When adding new components:
1. Follow the existing component structure
2. Include PropTypes or TypeScript types
3. Add JSDoc documentation
4. Create unit tests
5. Update ComponentDemo.jsx
6. Add usage examples to this README

## Related Documentation

- [Web Application](../README.md)
- [Design System Tokens](./design-system/tokens.js)
- [Component Demo](./design-system/ComponentDemo.jsx)
- [Main AI Documentation](../../../AI_DOCS.md)