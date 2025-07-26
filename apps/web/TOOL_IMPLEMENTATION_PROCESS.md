# Enterprise IQ Tool Implementation Process

## Overview

This document provides a comprehensive step-by-step guide for implementing complete dashboards and spawnable components for any tool in the Enterprise IQ system. Follow this process to ensure consistency, functionality, and integration across all tools.

## Prerequisites

- Tool specification exists in `<Domain>/tools/<tool_name>/Spec_UI_<tool_name>.md`
- Database schema is available and documented
- ui-common design system is accessible at `/ui-common/`

---

## Phase 1: Discovery & Planning

### Step 1.1: Analyze Tool Specification

```bash
# Location: <Domain>/tools/<tool_name>/Spec_UI_<tool_name>.md
```

**Action Items:**

- [ ] Read and understand the tool's purpose and requirements
- [ ] Identify required visualizations (charts, tables, KPIs)
- [ ] Note specific data sources and metrics
- [ ] Document user interactions and filtering requirements
- [ ] List any special features or calculations needed

**Questions to Answer:**

- What is the primary business value of this tool?
- What are the key metrics/KPIs to display?
- What visualizations are required (charts, tables, heatmaps, etc.)?
- What filtering and interaction capabilities are needed?
- What data aggregations or calculations are required?

### Step 1.2: Database Analysis & Schema Discovery

**Database Location:** `<Domain>/database/<domain>.db` (SQLite database)

**SQL Commands for Schema Discovery:**

```bash
# Connect to database
sqlite3 <Domain>/database/<domain>.db

# List all tables
.tables

# Get detailed schema for all tables
.schema

# Get specific table schema
.schema <table_name>

# Get column information for a table
PRAGMA table_info(<table_name>);

# Get foreign key relationships
PRAGMA foreign_key_list(<table_name>);

# Get table indexes
PRAGMA index_list(<table_name>);

# Exit SQLite
.quit
```

**Data Exploration Commands:**

```sql
-- Get row counts for each table
SELECT
    name as table_name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as exists
FROM sqlite_master m WHERE type='table';

-- Get actual row count for a specific table
SELECT COUNT(*) as row_count FROM <table_name>;

-- Sample data from key tables
SELECT * FROM <table_name> LIMIT 10;

-- Get column statistics for numeric data
SELECT
    MIN(<numeric_column>) as min_value,
    MAX(<numeric_column>) as max_value,
    AVG(<numeric_column>) as avg_value,
    COUNT(DISTINCT <numeric_column>) as unique_values,
    COUNT(<numeric_column>) as non_null_count
FROM <table_name>;

-- Get unique values for categorical columns
SELECT
    <categorical_column>,
    COUNT(*) as count
FROM <table_name>
GROUP BY <categorical_column>
ORDER BY count DESC
LIMIT 20;

-- Check for NULL values across columns
SELECT
    COUNT(*) as total_rows,
    COUNT(<column_name>) as non_null_rows,
    (COUNT(*) - COUNT(<column_name>)) as null_rows,
    ROUND((COUNT(*) - COUNT(<column_name>)) * 100.0 / COUNT(*), 2) as null_percentage
FROM <table_name>;

-- Get date ranges for temporal data
SELECT
    MIN(<date_column>) as earliest_date,
    MAX(<date_column>) as latest_date,
    COUNT(DISTINCT <date_column>) as unique_dates
FROM <table_name>
WHERE <date_column> IS NOT NULL;

-- Check data distribution by time periods
SELECT
    strftime('%Y', <date_column>) as year,
    COUNT(*) as record_count
FROM <table_name>
WHERE <date_column> IS NOT NULL
GROUP BY strftime('%Y', <date_column>)
ORDER BY year;
```

**Practical Database Discovery Process:**

```bash
# Step 1: Connect and explore
sqlite3 Customer/database/customers.db
.tables
.schema

# Step 2: Understand key tables (example for customer tools)
PRAGMA table_info(dbo_F_Sales_Transaction);
PRAGMA table_info(dbo_D_Customer);
SELECT * FROM dbo_F_Sales_Transaction LIMIT 5;
SELECT * FROM dbo_D_Customer LIMIT 5;

# Step 3: Check relationships
PRAGMA foreign_key_list(dbo_F_Sales_Transaction);

# Step 4: Get data overview
SELECT COUNT(*) FROM dbo_F_Sales_Transaction;
SELECT COUNT(*) FROM dbo_D_Customer;

# Step 5: Sample key metrics
SELECT
    MIN([Sales Amount]) as min_sales,
    MAX([Sales Amount]) as max_sales,
    AVG([Sales Amount]) as avg_sales
FROM dbo_F_Sales_Transaction;
```

**Action Items:**

- [ ] Connect to the relevant database file
- [ ] Run `.tables` to identify all available tables
- [ ] Use `.schema` to understand complete table structures
- [ ] Execute PRAGMA commands to get detailed column info
- [ ] Run sample queries to understand data quality and ranges
- [ ] Document key tables, relationships, and data patterns
- [ ] Identify primary keys, foreign keys, and indexes
- [ ] Note data types, constraints, and potential issues
- [ ] Map tool requirements to specific database fields
- [ ] Plan necessary SQL queries and aggregations
- [ ] Identify performance considerations for large datasets
- [ ] Save important discovery queries for later API development

---

## Phase 2: Directory Structure Setup

### Step 2.1: Create Tool Directory Structure

```bash
# Base path: <Domain>/tools/<tool_name>/

# Create the complete directory structure:
mkdir -p ui/components/{visualizations,controls,kpi}
mkdir -p ui/{views,state,types,utils}
mkdir -p ui/api
mkdir -p pages
mkdir -p api
mkdir -p database
mkdir -p tests
```

**Required Directory Structure:**

```
<Domain>/tools/<tool_name>/
├── ui/                           # UI components
│   ├── components/               # Individual components
│   │   ├── visualizations/       # Chart and visualization components
│   │   ├── controls/            # Control panels and filters
│   │   └── kpi/                 # KPI and metric displays
│   ├── views/                   # Full dashboard views
│   ├── state/                   # Redux state management
│   ├── types/                   # TypeScript interfaces
│   ├── utils/                   # Tool-specific utilities
│   └── api/                     # Function declarations for LLM control
│       └── functionCalls.ts     # LLM function declarations
├── pages/                       # Next.js pages
│   └── index.page.tsx           # Main dashboard page
├── api/                         # API endpoints
│   ├── data.api.js             # Data retrieval endpoints
│   └── analysis.api.js         # Analysis endpoints (if needed)
├── database/                    # Database interactions
│   └── queries.js              # SQL queries
└── tests/                       # Test files
```

---

## Phase 3: Data Layer Implementation

### Step 3.1: Create Database Queries

**File:** `<Domain>/tools/<tool_name>/database/queries.js`

```javascript
// Template structure:
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class ToolNameQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "<Domain>/database/<database_name>.db"
    );
  }

  async getMainData(filters = {}) {
    // Implement main data query
  }

  async getKPIData(filters = {}) {
    // Implement KPI calculations
  }

  async getVisualizationData(visualizationType, filters = {}) {
    // Implement visualization-specific queries
  }
}

module.exports = { ToolNameQueries };
```

**Testing Your Queries:**

```bash
# Test queries directly in SQLite before implementing in code
sqlite3 <Domain>/database/<database>.db

# Test your main data query
SELECT ... FROM ... WHERE ... LIMIT 10;

# Test KPI calculations
SELECT
    COUNT(*) as total_records,
    AVG(column) as avg_metric,
    SUM(column) as total_metric
FROM table_name;

# Test complex joins
SELECT
    t1.column,
    t2.column,
    COUNT(*) as count
FROM table1 t1
JOIN table2 t2 ON t1.id = t2.foreign_id
GROUP BY t1.column, t2.column;

# Export test results to verify
.mode csv
.output test_results.csv
SELECT ... FROM ...;
.output stdout
```

**Action Items:**

- [ ] Test all SQL queries in SQLite CLI first
- [ ] Verify query results match expected tool requirements
- [ ] Implement all data retrieval methods in queries.js
- [ ] Add proper error handling and logging
- [ ] Optimize queries for performance
- [ ] Add data validation and sanitization
- [ ] Test with various filter combinations

### Step 3.2: Create API Endpoint

**File:** `pages/api/<tool-name>/data.js`

```javascript
// Template structure:
import { ToolNameQueries } from "../../../<Domain>/tools/<tool_name>/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new ToolNameQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Fetch all required data
    const mainData = await queries.getMainData(filters);
    const kpis = await queries.getKPIData(filters);
    const visualizationData = await queries.getVisualizationData(
      "primary",
      filters
    );

    // Structure response
    const response = {
      success: true,
      data: {
        mainData,
        kpis,
        visualizationData,
        // Add other data structures as needed
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in <tool-name> API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
```

**Testing Your API:**

```bash
# Start development server
npm run dev

# Test API endpoint with curl
curl -X GET "http://localhost:3000/api/<tool-name>/data"

# Test with filters (if using POST)
curl -X POST "http://localhost:3000/api/<tool-name>/data" \
  -H "Content-Type: application/json" \
  -d '{"dateRange": {"start": "2023-01-01", "end": "2023-12-31"}}'

# Check API response structure with jq
curl -s "http://localhost:3000/api/<tool-name>/data" | jq '.'
curl -s "http://localhost:3000/api/<tool-name>/data" | jq '.data.kpis'
curl -s "http://localhost:3000/api/<tool-name>/data" | jq '.data | keys'

# Test error handling
curl -X PUT "http://localhost:3000/api/<tool-name>/data"
```

---

## Phase 4: TypeScript Interfaces

### Step 4.1: Define Data Types

**File:** `<Domain>/tools/<tool_name>/ui/types/index.ts`

```typescript
// Template structure based on your tool's data:

// Main data interface
export interface ToolMainData {
  id: string | number;
  name: string;
  // Add other fields based on your specification
}

// KPI interface
export interface ToolKPIs {
  primaryMetric: number;
  secondaryMetric: number;
  trendIndicator: number;
  // Add other KPIs from specification
}

// Visualization data interfaces
export interface VisualizationData {
  // Define based on chart requirements
}

// Filter and state interfaces
export interface FilterState {
  dateRange?: { start: string; end: string };
  category?: string[];
  // Add filters from specification
}

export interface DashboardState {
  data: ToolMainData[];
  kpis: ToolKPIs;
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
}
```

---

## Phase 5: Component Development

### Step 5.1: Create KPI Components

**File:** `<Domain>/tools/<tool_name>/ui/components/kpi/ToolKPITiles.js`

```javascript
import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const ToolKPITiles = ({ kpis, isLoading = false }) => {
  if (!kpis) return null;

  const tiles = [
    {
      label: "Primary Metric",
      value: kpis.primaryMetric || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "Description",
      variant: "default",
      icon: "📊",
    },
    // Add more tiles based on specification
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {tiles.map((tile, index) => (
        <KpiTile key={index} {...tile} isLoading={isLoading} />
      ))}
    </div>
  );
};

export default ToolKPITiles;
```

### Step 5.2: Create Visualization Components

**File:** `<Domain>/tools/<tool_name>/ui/components/visualizations/PrimaryVisualization.js`

```javascript
import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamic import for charts (if using Plotly, D3, etc.)
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const PrimaryVisualization = ({
  data = [],
  isLoading = false,
  onDataPointClick = null,
}) => {
  const [selectedData, setSelectedData] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card title="Primary Visualization" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "#5891cb",
          }}
        >
          No data available
        </div>
      </Card>
    );
  }

  // Implement visualization logic based on specification
  const prepareChartData = () => {
    // Transform data for your specific chart type
    return data;
  };

  const handleDataClick = (event) => {
    // Handle click interactions
    if (onDataPointClick) {
      onDataPointClick(event);
    }
  };

  return (
    <Card
      title="Primary Visualization"
      subtitle={`${data.length} items`}
      isLoading={isLoading}
    >
      {/* Implement your visualization here */}
      {/* Use Plot, custom SVG, Canvas, or other visualization library */}
    </Card>
  );
};

export default PrimaryVisualization;
```

### Step 5.3: Create Additional Components

**Repeat Step 5.2 for each visualization component listed in the specification.**

**Component Types to Consider:**

- Tables (`DataTable.js`)
- Charts (`BarChart.js`, `LineChart.js`, `ScatterPlot.js`)
- Specialized visualizations (`Heatmap.js`, `TreeMap.js`, `NetworkGraph.js`)
- Control components (`FilterPanel.js`, `DateRangePicker.js`)

---

## Phase 6: Dashboard Integration

### Step 6.1: Create Main Dashboard View

**File:** `<Domain>/tools/<tool_name>/ui/views/ToolDashboard.js`

```javascript
import React, { useState, useEffect } from "react";
import ToolKPITiles from "../components/kpi/ToolKPITiles";
import PrimaryVisualization from "../components/visualizations/PrimaryVisualization";
// Import other components

const ToolDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/<tool-name>/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ color: "#e930ff", padding: "20px" }}>Error: {error}</div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
      }}
    >
      <h1 style={{ marginBottom: "24px", color: "#00e0ff" }}>
        Tool Name Dashboard
      </h1>

      {/* KPI Section */}
      <ToolKPITiles kpis={data?.kpis} isLoading={isLoading} />

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
        }}
      >
        <PrimaryVisualization
          data={data?.visualizationData}
          isLoading={isLoading}
        />
        {/* Add other visualization components */}
      </div>
    </div>
  );
};

export default ToolDashboard;
```

### Step 6.2: Create Next.js Page

**File:** `pages/<domain>/<tool-name>.js`

```javascript
import React from "react";
import ToolDashboard from "../<Domain>/tools/<tool_name>/ui/views/ToolDashboard";

export default function ToolPage() {
  return <ToolDashboard />;
}
```

---

## Phase 7: LLM Function Calls Integration

### Step 7.1: Define Function Calls

**File:** `<Domain>/tools/<tool_name>/ui/api/functionCalls.ts`

```typescript
export const toolNameFunctions: FunctionDeclaration[] = [
  {
    name: "highlightDataPoint",
    description: "Highlight specific data points in the visualization",
    parameters: {
      type: "object",
      properties: {
        pointId: {
          type: "string",
          description: "ID of the data point to highlight",
        },
        explanation: {
          type: "string",
          description: "Explanation of why this point is highlighted",
        },
      },
      required: ["pointId"],
    },
  },
  {
    name: "filterByCategory",
    description: "Filter the data by specific categories",
    parameters: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: { type: "string" },
          description: "List of categories to filter by",
        },
      },
      required: ["categories"],
    },
  },
  // Add 8-10 more function declarations based on tool capabilities
];
```

**Required Function Categories:**

- [ ] Highlighting functions (2-3 functions)
- [ ] Filtering functions (2-3 functions)
- [ ] Comparative functions (2-3 functions)
- [ ] Explanatory functions (2-3 functions)
- [ ] Control functions (1-2 functions)

---

## Phase 8: Spawnable Component Integration

### Step 8.1: Add to Component Registry

**File:** `pages/index.js`

```javascript
// Add to componentRegistry object:
'<tool-name>': {
  dashboard: dynamic(() => import('../<Domain>/tools/<tool_name>/ui/views/ToolDashboard'), { ssr: false }),
  primaryVisualization: dynamic(() => import('../<Domain>/tools/<tool_name>/ui/components/visualizations/PrimaryVisualization'), { ssr: false }),
  kpiTiles: dynamic(() => import('../<Domain>/tools/<tool_name>/ui/components/kpi/ToolKPITiles'), { ssr: false }),
  // Add other spawnable components
},
```

### Step 8.2: Add Data Fetching Logic

**In the same file (`pages/index.js`), add to the `spawnComponent` function:**

```javascript
} else if (toolName === '<tool-name>') {
  const response = await fetch(`/api/<tool-name>/data`);
  if (!response.ok) throw new Error('Failed to fetch data');
  const data = await response.json();

  let componentSpecificData = {};
  let componentSize = { width: 500, height: 400 };

  if (componentName === 'dashboard') {
    componentSpecificData = data.data;
    componentSize = { width: 1200, height: 800 };
  } else {
    switch (componentName) {
      case 'primaryVisualization':
        componentSpecificData = { data: data.data.visualizationData || [] };
        componentSize = { width: 600, height: 500 };
        break;
      case 'kpiTiles':
        componentSpecificData = { kpis: data.data.kpis || {} };
        componentSize = { width: 600, height: 200 };
        break;
      // Add other component mappings
    }
  }

  const mergedProps = { ...componentSpecificData, ...props };
  setComponents(prev => [...prev, {
    id,
    type: componentType,
    position: componentPosition,
    size: componentSize,
    props: mergedProps,
    Component: componentRegistry[toolName][componentName]
  }]);
  setLoading(false);
  return id;
```

### Step 8.3: Add Query Parsing

**In the `handleQuerySubmit` function, add query parsing logic:**

```javascript
} else if (lowerQuery.includes('<tool-keyword>') && lowerQuery.includes('<specific-term>')) {
  componentToSpawn = '<tool-name>.primaryVisualization';
  robotMessage = 'Here is the <tool-name> visualization showing <description>.';
} else if (lowerQuery.includes('<tool-keyword>') && lowerQuery.includes('kpi')) {
  componentToSpawn = '<tool-name>.kpiTiles';
  robotMessage = 'Displaying key performance indicators for <tool-name>.';
} else if (lowerQuery.includes('<tool-keyword>')) {
  componentToSpawn = '<tool-name>.dashboard';
  robotMessage = 'Here is the complete <tool-name> dashboard.';
```

### Step 8.4: Update Help Message

**Add the new tool to the help message:**

```javascript
message: 'I understand you\'re asking about: ' + query + '. You can ask about purchase frequency, customer segments, sales performance, anomaly detection, <tool-name>, etc.',
```

---

## Phase 9: Testing & Validation

### Step 9.1: API Testing

```bash
# Test the API endpoint
curl -X GET http://localhost:3000/api/<tool-name>/data

# Test with filters (if POST method)
curl -X POST http://localhost:3000/api/<tool-name>/data \
  -H "Content-Type: application/json" \
  -d '{"category": "test"}'
```

### Step 9.2: Dashboard Testing

- [ ] Navigate to `/pages/<domain>/<tool-name>`
- [ ] Verify all components load with real data
- [ ] Test all interactive features
- [ ] Verify responsive behavior
- [ ] Check error handling (disconnect database, invalid data)

### Step 9.3: Spawning Testing

- [ ] Go to homepage (`/`)
- [ ] Type various queries to spawn components:
  - `"<tool-keyword>"`
  - `"<tool-keyword> <specific-term>"`
  - `"<tool-keyword> kpi"`
- [ ] Verify components spawn with correct data
- [ ] Test drag and resize functionality
- [ ] Verify component interactions work

### Step 9.4: Performance Testing

- [ ] Check API response times (should be < 2 seconds)
- [ ] Verify component rendering performance
- [ ] Test with large datasets
- [ ] Monitor memory usage

---

## Phase 10: Documentation

### Step 10.1: Update Tool Documentation

**Create/Update:** `<Domain>/tools/<tool_name>/README.md`

Include:

- Tool purpose and capabilities
- API endpoint documentation
- Component usage examples
- Spawning keywords and phrases
- Data sources and calculations

### Step 10.2: Update Main Documentation

**Update:** `tool_list.md`

Add the new tool with:

- Name and description
- Dashboard URL
- Spawning keywords
- Key features

---

## Common Patterns & Best Practices

### Data Handling

- Always provide loading states
- Handle empty data gracefully
- Implement proper error boundaries
- Use consistent data transformation patterns

### UI Components

- Use ui-common design system components
- Follow Enterprise IQ color scheme:
  - Primary: Midnight Navy (#0a1224)
  - Accent: Electric Cyan (#00e0ff)
  - Secondary: Signal Magenta (#e930ff)
- Ensure responsive design
- Add proper accessibility features

### Component Props

- Always provide default values
- Use destructuring with defaults
- Make components controllable and uncontrollable
- Support both callback and state management patterns

### API Design

- Use consistent error response format
- Include success/failure indicators
- Support both GET and POST methods
- Validate input parameters
- Log errors appropriately

### Performance

- Use dynamic imports for heavy components
- Implement data caching where appropriate
- Optimize database queries
- Use React.memo for expensive components

---

## Checklist for Completion

### Technical Implementation

- [ ] All database queries implemented and tested
- [ ] API endpoint working with real data
- [ ] All visualization components created
- [ ] KPI tiles implemented
- [ ] Main dashboard view completed
- [ ] Next.js page created and accessible

### Spawnable Integration

- [ ] Added to component registry
- [ ] Data fetching logic implemented
- [ ] Query parsing added
- [ ] Help message updated
- [ ] All spawning scenarios tested

### Documentation & Testing

- [ ] LLM function calls defined
- [ ] TypeScript interfaces complete
- [ ] Component documentation written
- [ ] All manual tests passed
- [ ] Performance benchmarks met

### Quality Assurance

- [ ] Code follows project conventions
- [ ] Error handling implemented
- [ ] Loading states working
- [ ] Responsive design verified
- [ ] Accessibility features included

---

## Troubleshooting Common Issues

### Components Not Spawning

1. Check component registry imports
2. Verify API endpoint returns 200 status
3. Check browser console for JavaScript errors
4. Ensure data mapping is correct

### Data Not Loading

1. Verify database connection
2. Check API endpoint manually with curl
3. Inspect network tab in browser dev tools
4. Validate SQL queries in database client

### Styling Issues

1. Ensure ui-common components are imported correctly
2. Check CSS specificity conflicts
3. Verify color scheme compliance
4. Test responsive breakpoints

### Performance Issues

1. Profile component rendering times
2. Check database query performance
3. Implement data pagination if needed
4. Add React.memo optimization

---

This process document provides a complete framework for implementing any tool in the Enterprise IQ system. Follow each phase systematically to ensure consistent, high-quality implementations across all tools.
