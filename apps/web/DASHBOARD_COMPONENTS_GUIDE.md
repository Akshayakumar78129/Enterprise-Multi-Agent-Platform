# Enterprise Dashboard Components Guide

## 🎨 Complete UI Component System for Multi-Agent Dashboards

This guide provides comprehensive documentation for implementing a consistent, modern dashboard UI with integrated multi-agent AI capabilities, following the design patterns from the Churn Intelligence Dashboard.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Design System](#design-system)
3. [Core Components](#core-components)
4. [Dashboard Filters](#dashboard-filters)
5. [AI Features](#ai-features)
6. [Implementation Guide](#implementation-guide)
7. [Quick Start](#quick-start)
8. [Demo Dashboard](#demo-dashboard)

## Overview

### Key Features
- **Dark gradient theme** with cyan accents matching churn dashboard
- **Multi-agent chatbot** with automatic routing based on context
- **AI insights popups** for all interactive elements
- **Shift-click chart selection** for sending data to chatbot
- **Business Intelligence Hub** for executive insights
- **Consistent component library** for rapid dashboard development

### Technology Stack
- React/Next.js
- TypeScript
- CSS-in-JS styling
- AIResponseDashboard integration
- UUID session management

## Design System

### Color Palette
```typescript
const theme = {
  colors: {
    background: {
      primary: '#0a1224',      // Deep navy
      secondary: '#0d1a2d',    // Darker navy
      card: '#1e2738',         // Card background
      gradient: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
    },
    accent: {
      primary: '#00e0ff',      // Cyan
      secondary: '#00b8d4',    // Darker cyan
      glow: 'rgba(0, 224, 255, 0.3)',
    },
    status: {
      success: '#00ff88',      // Green
      warning: '#ffd600',      // Yellow
      error: '#ff5252',        // Red
      info: '#00e0ff',         // Cyan
    }
  }
}
```

### Typography
- Font: Inter, system fonts fallback
- Sizes: xs (0.75rem) to 4xl (2.25rem)
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## Core Components

### 1. ThemeProvider
**Location:** `ui-common/theme/ThemeProvider.tsx`

Provides consistent theming across all components.

```jsx
import { ThemeProvider } from '../ui-common/theme';

<ThemeProvider>
  <YourApp />
</ThemeProvider>
```

### 2. DashboardLayout
**Location:** `ui-common/theme/DashboardLayout.tsx`

Main layout wrapper with gradient background and header.

```jsx
import { DashboardLayout } from '../ui-common/theme';

<DashboardLayout
  title="Sales Intelligence Dashboard"
  subtitle="AI-powered insights and analytics"
  icon="💼"
>
  {/* Dashboard content */}
</DashboardLayout>
```

### 3. KPICard
**Location:** `ui-common/theme/KPICard.tsx`

Interactive KPI tiles with trends and AI insights on click.

```jsx
import { KPICard } from '../ui-common/theme';

<KPICard
  value="$2.5M"
  label="Total Revenue"
  icon="💰"
  trend={{
    direction: 'up',
    value: '+12%',
    isPositive: true
  }}
  color="success"
  onClick={handleKPIClick}
/>
```

### 4. UniversalDashboardFilters
**Location:** `ui-common/filters/UniversalDashboardFilters.tsx`

Universal filter component with multiple filter types and presets for each dashboard.

```jsx
import { UniversalDashboardFilters, salesFilters } from '../ui-common/filters';

<UniversalDashboardFilters
  filters={salesFilters}
  onFilterChange={handleFilterChange}
  onReset={handleResetFilters}
  title="Sales Performance Filters"
  compact={false}
/>
```

### 5. ChartCard
**Location:** `ui-common/theme/ChartCard.tsx`

Chart wrapper with shift-click selection support.

```jsx
import ChartCard from '../ui-common/theme/ChartCard';

<ChartCard
  title="Performance Trends"
  subtitle="Click for insights, Shift+Click to select"
  icon="📈"
  onChartClick={handleChartClick}
  onShiftClick={handleShiftClick}
  onRequestInsights={handleInsightsRequest}
>
  {/* Your chart component */}
</ChartCard>
```

## Dashboard Filters

### UniversalDashboardFilters Component
**Location:** `ui-common/filters/UniversalDashboardFilters.tsx`

A comprehensive filter system that provides consistent filtering across all dashboards with multiple filter types.

#### Supported Filter Types:
- **date** - Date range selection with start and end dates
- **select** - Single selection dropdown
- **multiselect** - Multiple selection with checkboxes
- **search** - Text search input
- **range** - Numeric range with min/max values
- **toggle** - Boolean on/off switch

#### Available Filter Presets:

##### Sales Dashboard (`salesFilters`)
- Date Range (30 days default)
- Product Categories (multiselect)
- Region (select)
- Sales Channel (select)
- Revenue Range (numeric range)
- Top Performers Only (toggle)

##### Customer Churn Dashboard (`churnFilters`)
- Analysis Period (90 days default)
- Risk Level (High/Medium/Low)
- Customer Segments (multiselect)
- Customer Lifetime Value Range
- Days Since Last Purchase
- Show Actionable Insights Only (toggle)

##### Inventory Dashboard (`inventoryFilters`)
- Inventory Period (30 days default)
- Warehouses (multiselect)
- Stock Status (In Stock/Low/Out/Overstocked)
- Holding Cost Range
- Turnover Rate
- Show Slow-Moving Items Only (toggle)

##### Customer Behavior Dashboard (`behaviorFilters`)
- Behavior Analysis Period (60 days default)
- Behavior Types (Browse/Purchase/Abandon/Return/Review)
- Customer Cohort (quarterly)
- Customer Search
- Purchase Frequency Range
- Show Engaged Customers Only (toggle)

##### Finance Dashboard (`financeFilters`)
- Financial Period (90 days default)
- Reporting Period (Daily/Weekly/Monthly/Quarterly/Yearly)
- Account Categories (multiselect)
- Currency Selection
- Transaction Amount Range
- Show Anomalies Only (toggle)

##### Product Performance Dashboard (`productFilters`)
- Performance Period (30 days default)
- Product Search
- Product Categories (multiselect)
- Performance Metric (Revenue/Units/Margin/Rating/Returns)
- Price Range
- Show Trending Products Only (toggle)

#### Implementation Example:

```jsx
import { UniversalDashboardFilters, salesFilters } from '../ui-common/filters';

export default function SalesDashboard() {
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    // Apply filters to your data fetching or filtering logic
    if (filters.dateRange) {
      // Handle date range change
    }
    if (filters.categories) {
      // Handle category selection
    }
    // ... handle other filters
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    // Reset to default data view
  };

  return (
    <>
      <UniversalDashboardFilters
        filters={salesFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        title="Sales Performance Filters"
      />
      {/* Dashboard content */}
    </>
  );
}
```

#### Custom Filter Configuration:

```jsx
import { FilterConfig } from '../ui-common/filters';

const customFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Date Range',
    key: 'dateRange',
    defaultValue: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  },
  {
    type: 'multiselect',
    label: 'Categories',
    key: 'categories',
    options: [
      { value: 'cat1', label: 'Category 1' },
      { value: 'cat2', label: 'Category 2' }
    ]
  },
  {
    type: 'range',
    label: 'Price Range',
    key: 'priceRange',
    min: 0,
    max: 1000
  }
];

<UniversalDashboardFilters
  filters={customFilters}
  onFilterChange={handleFilterChange}
  compact={true}  // Collapsible filter panel
/>
```

#### Filter Styling:
The UniversalDashboardFilters component follows the Enterprise IQ design system with:
- Dark gradient backgrounds (#1e2738 to #1a2332)
- Cyan accent colors (#00e0ff) for active states
- Glass morphism effects for modern appearance
- Responsive grid layout that adapts to screen size
- Active filter count badge
- Smooth animations and transitions

## AI Features

### 1. UniversalChatbot
**Location:** `ui-common/chatbot/UniversalChatbot.tsx`

Multi-agent chatbot with context-aware routing.

```jsx
import { UniversalChatbot, ChatbotButton } from '../ui-common/chatbot';

const [isChatOpen, setIsChatOpen] = useState(false);

<>
  <ChatbotButton 
    onClick={() => setIsChatOpen(!isChatOpen)}
    isOpen={isChatOpen}
  />
  
  {isChatOpen && (
    <UniversalChatbot
      defaultAgent="sales"
      onClose={() => setIsChatOpen(false)}
      dashboardContext={{
        source_dashboard: 'sales',
        metrics: dashboardKPIs
      }}
    />
  )}
</>
```

### Agent Configuration
**Location:** `ui-common/chatbot/agentConfig.ts`

Available agents:
- `@sales` - Sales Intelligence
- `@customer` - Customer Intelligence  
- `@finance` - Financial Intelligence
- `@inventory` - Inventory Intelligence
- `@enterpriseiq` - Multi-agent orchestration

### 2. AI Insights Popup
**Location:** `ui-common/insights/AIInsightsPopup.tsx`

Context-aware insights popup for any clickable element.

```jsx
import AIInsightsPopup from '../ui-common/insights/AIInsightsPopup';

const [showInsights, setShowInsights] = useState(null);

const handleKPIClick = (kpi) => {
  setShowInsights({
    title: kpi.label,
    type: 'kpi',
    value: kpi.value,
    insights: [
      'Current performance analysis',
      'Trend prediction',
      'Recommended actions'
    ],
    recommendations: [
      'Monitor daily',
      'Set up alerts',
      'Compare benchmarks'
    ]
  });
};

{showInsights && (
  <AIInsightsPopup
    data={showInsights}
    position={{ x: window.innerWidth / 2 - 200, y: 100 }}
    onClose={() => setShowInsights(null)}
    onSendToChat={handleSendToChat}
  />
)}
```

### 3. Business Intelligence Hub
**Location:** `ui-common/chatbot/BusinessIntelligence.tsx`

Executive insights panel with strategic recommendations.

```jsx
import { BusinessIntelligenceButton, BusinessIntelligencePanel } from '../ui-common/chatbot/BusinessIntelligence';

const [isBIOpen, setIsBIOpen] = useState(false);

<>
  <BusinessIntelligenceButton
    onClick={() => setIsBIOpen(true)}
    count={selectedDataPoints.length}
  />
  
  {isBIOpen && (
    <BusinessIntelligencePanel
      dashboardContext={dashboardData}
      selectedCustomers={selectedDataPoints.length}
      onClose={() => setIsBIOpen(false)}
    />
  )}
</>
```

## Implementation Guide

### Step 1: Install Dependencies
```bash
npm install uuid
```

### Step 2: Set Environment Variables
```env
NEXT_PUBLIC_BACKEND_AI_URL=http://127.0.0.1:5000
```

### Step 3: Create Dashboard Structure
```jsx
import React, { useState } from 'react';
import { ThemeProvider, DashboardLayout, KPICard } from '../ui-common/theme';
import ChartCard from '../ui-common/theme/ChartCard';
import { UniversalChatbot, ChatbotButton } from '../ui-common/chatbot';
import { BusinessIntelligenceButton, BusinessIntelligencePanel } from '../ui-common/chatbot/BusinessIntelligence';
import AIInsightsPopup from '../ui-common/insights/AIInsightsPopup';

export default function MyDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIOpen, setIsBIOpen] = useState(false);
  const [showInsights, setShowInsights] = useState(null);
  
  return (
    <ThemeProvider>
      <DashboardLayout
        title="My Dashboard"
        subtitle="AI-powered analytics"
        icon="📊"
      >
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {kpis.map((kpi, index) => (
            <KPICard key={index} {...kpi} onClick={() => handleKPIClick(kpi)} />
          ))}
        </div>
        
        {/* Charts */}
        <ChartCard
          title="My Chart"
          onChartClick={handleChartClick}
          onShiftClick={handleShiftClick}
        >
          {/* Chart content */}
        </ChartCard>
        
        {/* AI Components */}
        <ChatbotButton onClick={() => setIsChatOpen(!isChatOpen)} isOpen={isChatOpen} />
        <BusinessIntelligenceButton onClick={() => setIsBIOpen(true)} />
        
        {/* Modals */}
        {isChatOpen && <UniversalChatbot onClose={() => setIsChatOpen(false)} />}
        {isBIOpen && <BusinessIntelligencePanel onClose={() => setIsBIOpen(false)} />}
        {showInsights && <AIInsightsPopup data={showInsights} onClose={() => setShowInsights(null)} />}
      </DashboardLayout>
    </ThemeProvider>
  );
}
```

## Quick Start

### Minimal Dashboard Example
```jsx
import React from 'react';
import { ThemeProvider, DashboardLayout, KPICard } from './ui-common/theme';

export default function QuickDashboard() {
  const kpis = [
    { value: '$1.2M', label: 'Revenue', icon: '💰', trend: { direction: 'up', value: '+8%' } },
    { value: '450', label: 'Customers', icon: '👥', trend: { direction: 'up', value: '+12' } },
    { value: '92%', label: 'Satisfaction', icon: '⭐', trend: { direction: 'up', value: '+3%' } },
    { value: '24h', label: 'Response Time', icon: '⏱️', trend: { direction: 'down', value: '-2h' } }
  ];
  
  return (
    <ThemeProvider>
      <DashboardLayout title="Quick Dashboard" subtitle="Getting started">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
        </div>
      </DashboardLayout>
    </ThemeProvider>
  );
}
```

## Features Checklist

### Core UI Components
- [x] ThemeProvider with dark gradient theme
- [x] DashboardLayout with consistent structure
- [x] KPICard with trends and interactions
- [x] ChartCard with shift-click selection
- [x] Responsive grid layouts
- [x] UniversalDashboardFilters with multiple filter types
- [x] Pre-configured filter presets for all dashboards

### AI Integration
- [x] UniversalChatbot with multi-agent support
- [x] Agent routing based on dashboard context
- [x] @mention support for agent switching
- [x] AIResponseDashboard streaming integration
- [x] Session management with UUID

### Interactive Features
- [x] AI Insights popup on element click
- [x] Shift-click chart selection
- [x] Send to chat functionality
- [x] Business Intelligence Hub
- [x] Executive insights panel

### Design Consistency
- [x] Dark gradient backgrounds (#0a1224 to #0d1a2d)
- [x] Cyan accent colors (#00e0ff)
- [x] Glass morphism effects
- [x] Smooth animations and transitions
- [x] Consistent spacing and typography

## Best Practices

1. **Always wrap your app in ThemeProvider** for consistent theming
2. **Use DashboardLayout** as the main container for all dashboards
3. **Implement onClick handlers** for KPICards to show AI insights
4. **Add shift-click support** to charts for data selection
5. **Initialize chatbot with correct agent** based on dashboard context
6. **Provide meaningful dashboardContext** to AI components
7. **Use consistent icon patterns** (emojis for visual consistency)
8. **Follow the color scheme** strictly for brand consistency

## Support & Extension

### Adding New Agents
Edit `ui-common/chatbot/agentConfig.ts`:
```typescript
export const agents = {
  newAgent: {
    name: 'newAgent',
    displayName: 'New Intelligence',
    appName: 'new_agent',
    icon: '🆕',
    color: '#yourColor',
    description: 'Your description',
    capabilities: ['Feature 1', 'Feature 2']
  }
}
```

### Customizing Theme
Override theme values in ThemeProvider:
```jsx
<ThemeProvider customTheme={{
  colors: {
    accent: {
      primary: '#yourColor'
    }
  }
}}>
```

### Creating Custom KPI Variations
Extend the KPICard component with new color schemes:
```jsx
<KPICard
  color="custom"
  // Add to KPICard component:
  // custom: { accent: '#yourColor', gradient: '...', border: '...' }
/>
```

## Troubleshooting

### Common Issues

1. **Chatbot not connecting**
   - Check NEXT_PUBLIC_BACKEND_AI_URL environment variable
   - Ensure backend AI service is running on port 5000

2. **Theme not applying**
   - Ensure ThemeProvider wraps your entire app
   - Check for conflicting global styles

3. **Shift-click not working**
   - Verify onShiftClick handler is properly passed to ChartCard
   - Check browser console for event handling errors

4. **AI Insights not showing**
   - Ensure showInsights state is properly managed
   - Check position calculations for popup placement

## Demo Dashboard

### Live Demo Page
A fully functional demo dashboard is available at `/demo-dashboard` that showcases all the UI components and features described in this guide.

#### Features Demonstrated:
- **Dashboard Switching**: Four different dashboard contexts (Sales, Customer, Finance, Inventory)
- **Dynamic Filters**: Each dashboard has its own filter preset that updates when switching
- **Interactive KPI Cards**: Click any KPI to see AI insights popup with recommendations
- **Chart Interactions**: 
  - Click on chart area for single-point insights
  - Shift+Click for multi-point selection (sends to chatbot)
- **Multi-Agent Chatbot**: Opens with context-aware agent based on current dashboard
- **Business Intelligence Hub**: Executive-level insights panel
- **Responsive Design**: Fully responsive layout that adapts to screen sizes

#### Running the Demo:
```bash
# Start the development server
npm run dev

# Navigate to
http://localhost:3002/demo-dashboard
```

#### Demo Dashboard Implementation:
The demo dashboard (`pages/demo-dashboard.tsx`) provides a complete reference implementation showing:

1. **State Management**:
   - Dashboard selection state
   - Filter state management
   - Chat and BI panel visibility
   - Selected data points for shift-click

2. **Component Integration**:
   - ThemeProvider wrapping
   - DashboardLayout structure
   - UniversalDashboardFilters with dynamic presets
   - KPICard grid layout
   - ChartCard with interaction handlers
   - UniversalChatbot with dashboard context
   - BusinessIntelligencePanel integration
   - AIInsightsPopup positioning

3. **Event Handlers**:
   - Filter change and reset handlers
   - KPI click for insights
   - Chart click and shift-click handlers
   - Send to chat functionality
   - Dashboard switching logic

#### Testing the Demo:
The demo page has been tested with Playwright MCP for:
- ✅ Dashboard selector functionality
- ✅ Filter component rendering and updates
- ✅ KPI card interactions
- ✅ AI insights popup display
- ✅ Chatbot opening and agent display
- ✅ Responsive layout behavior
- ✅ Theme consistency across components

#### Key Code Patterns from Demo:
```jsx
// Dashboard configuration with filters
const dashboards = {
  sales: {
    title: 'Sales Intelligence Dashboard',
    icon: '💼',
    filters: salesFilters,
    kpis: [/* KPI configurations */]
  },
  // ... other dashboards
};

// Filter integration
{currentDashboard.filters && (
  <UniversalDashboardFilters
    filters={currentDashboard.filters}
    onFilterChange={handleFilterChange}
    onReset={handleResetFilters}
    title={`${selectedDashboard} Dashboard Filters`}
  />
)}

// Context passing to chatbot
<UniversalChatbot
  defaultAgent={selectedDashboard}
  dashboardContext={{
    source_dashboard: selectedDashboard,
    metrics: currentDashboard.kpis,
    selectedPoints: selectedChartPoints
  }}
/>
```

## License & Attribution

Built with reference to the Churn Intelligence Dashboard design patterns.
Uses AIResponseDashboard for multi-agent AI integration.