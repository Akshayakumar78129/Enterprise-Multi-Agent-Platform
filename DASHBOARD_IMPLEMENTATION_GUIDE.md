# Dashboard Migration & Implementation Guide

**Version**: 1.0
**Last Updated**: 2025-10-07
**Purpose**: Complete guide for implementing or migrating any dashboard following the standardized architecture used in Sales Performance, Customer Segmentation, Customer LTV, and Product Performance dashboards.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Phases](#implementation-phases)
3. [Phase 1: Backend ADK Tool](#phase-1-backend-adk-tool)
4. [Phase 2: Frontend Visualization Components](#phase-2-frontend-visualization-components)
5. [Phase 3: Enterprise-IQ Integration](#phase-3-enterprise-iq-integration)
6. [Phase 4: Context & State Management](#phase-4-context--state-management)
7. [Phase 5: Testing & Validation](#phase-5-testing--validation)
8. [Common Issues & Fixes](#common-issues--fixes)
9. [Success Criteria Checklist](#success-criteria-checklist)
10. [Reference Implementations](#reference-implementations)

---

## Architecture Overview

### Technology Stack
- **Backend**: Python 3.11+, FastAPI, SQLite
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js, Recharts
- **State**: Redux Toolkit + React Context API
- **AI Agent**: Google Gemini 2.5 Flash

### Key Patterns

#### 1. Metadata-Only Visualization Pattern
**Problem**: Agent tools returning large datasets cause token bloat and slow responses.

**Solution**: Tools output only filter metadata, not data arrays. Frontend fetches actual data from summary APIs.

```python
# ❌ OLD: Tool outputs full data
{
  "topProducts": [{"name": "Laptop", "revenue": 50000}, ...],  # 100+ items
  "categoryData": [...]  # Large arrays
}

# ✅ NEW: Tool outputs only metadata
{
  "toolname": "product-performance",
  "componentName": "topProducts",
  "body": {
    "dateFrom": "2017-01-01",
    "dateTo": "2021-12-31",
    "categories": ["Technology"],
    "topN": 20
    // Only filter parameters, NO data
  }
}
```

#### 2. Component Registry System
Maps `toolname.componentName` to React components dynamically.

```typescript
// apps/frontend/src/app/enterprise-iq/page.tsx
const componentRegistry = {
  'product-performance': {
    kpis: dynamic(() => import('../product-performance/components').then(mod => mod.ProductKPIs)),
    overview: dynamic(() => import('../product-performance/components').then(mod => mod.ProductPerformanceOverview)),
    topProducts: dynamic(() => import('../product-performance/components').then(mod => mod.TopProductsTable))
  }
};
```

#### 3. Prop Mappers
Transform API response structure to component props format.

```typescript
// apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts
'product-performance.topProducts': (summary) => {
  return {
    data: summary.mainData?.topProducts || [],
    loading: false
  };
}
```

#### 4. Sync Processing Service
Wrapper pattern for async database operations in agent tools.

```python
class ProductPerformanceProcessingService:
    def _run_async(self, func, *args, **kwargs):
        """Wrapper to run async functions synchronously"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(func(*args, **kwargs))

    def get_product_performance_data(self, filters: dict):
        """Sync wrapper for agent tool"""
        return self._run_async(self._get_product_performance_data, filters)
```

---

## Implementation Phases

### Phase 1: Backend ADK Tool (2-3 hours)

#### Step 1.1: Update Tool Output Format

**File**: `apps/adk/orchestration_agent/tools/{dashboard_name}.py`

```python
def analyze_product_performance(
    time_period: str = "default",
    categories: list = [],
    products: list = [],
    min_margin: float = None,
    max_margin: float = None,
    top_n: int = 20
) -> str:
    """Analyze product performance with metadata-only output"""

    # Initialize filters with 2017-2021 default
    filters = {}
    if time_period == "default" or not time_period:
        filters['dateFrom'] = '2017-01-01'
        filters['dateTo'] = '2021-12-31'
    else:
        # Parse time_period (e.g., "2021", "Q1 2021", "Jan 2021")
        filters.update(parse_time_period(time_period))

    # Add other filters
    if categories:
        filters['categories'] = categories
    if products:
        filters['products'] = products
    if min_margin is not None:
        filters['minMargin'] = min_margin
    if max_margin is not None:
        filters['maxMargin'] = max_margin
    filters['topN'] = top_n

    # Get data from processing service
    service = ProductPerformanceProcessingService()
    data = service.get_product_performance_data(filters)

    # Generate text report for AI
    report = generate_text_report(data)

    # Add metadata-only visualization section
    viz_metadata = {
        "toolname": "product-performance",
        "componentName": "overview",  # or "topProducts", "categoryAnalysis", etc.
        "body": {
            "dateFrom": filters.get('dateFrom'),
            "dateTo": filters.get('dateTo'),
            "categories": filters.get('categories', []),
            "products": filters.get('products', []),
            "minMargin": filters.get('minMargin'),
            "maxMargin": filters.get('maxMargin'),
            "topN": filters.get('topN', 20)
        }
    }

    output = f"""{report}

## Visualization Data (Machine-Readable)
```json
{json.dumps(viz_metadata, indent=2)}
```

<output>
{json.dumps(viz_metadata)}
</output>
<is_visualisation>true</is_visualisation>
"""

    return output
```

**Key Points**:
- ✅ Default time period: 2017-2021
- ✅ Metadata-only in visualization section
- ✅ Include `<output>` and `<is_visualisation>true</is_visualisation>` tags
- ✅ Text report for AI + JSON for graph spawning

#### Step 1.2: Update COMPONENT_SCHEMA

**File**: `apps/adk/lib/utils.py`

```python
COMPONENT_SCHEMA = {
    "product-performance": {
        "components": [
            "kpis",              # KPI tiles
            "overview",          # Main overview chart
            "topProducts",       # Top products table
            "categoryAnalysis",  # Category comparison
            "marginAnalysis",    # Margin scatter plot
            "priceBands"         # Price band distribution
        ],
        "parameters": {
            "start_date": "date",
            "end_date": "date",
            "categories": "array",
            "products": "array",
            "priceBands": "array",
            "minMargin": "number|null",
            "maxMargin": "number|null",
            "topN": "number"
        }
    }
}
```

**Key Points**:
- ✅ List all component names that AI can suggest
- ✅ Define all parameter types
- ✅ Match frontend component names exactly

---

### Phase 2: Frontend Visualization Components (4-6 hours)

#### Step 2.1: Create Visualization Components

**Directory**: `apps/frontend/src/app/{dashboard-name}/components/visualizations/`

Create 4-6 visualization components based on dashboard needs. Common types:

##### 2.1.1 KPI Component (AnimatedKPITile)

```typescript
// components/index.tsx
import { AnimatedKPITile } from 'components/index';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

export function DashboardKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const kpis = [
    {
      title: 'Total Revenue',
      value: metrics?.totalRevenue ? `$${(metrics.totalRevenue / 1000000).toFixed(1)}M` : '$0',
      subtitle: 'All time',
      icon: DollarSign,
      trend: metrics?.revenueGrowth || 0,
      color: '#8b5cf6' as const
    },
    {
      title: 'Total Units',
      value: metrics?.totalUnits?.toLocaleString() || '0',
      subtitle: 'Units sold',
      icon: Package,
      color: '#10b981' as const
    }
    // ... more KPIs
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => (
        <AnimatedKPITile key={index} {...kpi} loading={loading} />
      ))}
    </div>
  );
}
```

##### 2.1.2 Table Component

```typescript
// visualizations/DataTable.tsx
import React, { useState } from 'react';
import { DashboardSection } from 'components/index';
import { ArrowUpDown, Search } from 'lucide-react';

interface DataTableProps {
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
}

export function DataTable({ data = [], loading = false, onRowClick }: DataTableProps) {
  const [sortField, setSortField] = useState('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aVal > bVal ? modifier : -modifier;
  });

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return (
    <DashboardSection title="Data Table">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th onClick={() => handleSort('name')} className="cursor-pointer p-3 text-left">
                Name <ArrowUpDown className="inline h-4 w-4" />
              </th>
              <th onClick={() => handleSort('revenue')} className="cursor-pointer p-3 text-right">
                Revenue <ArrowUpDown className="inline h-4 w-4" />
              </th>
              {/* More columns */}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className="border-b border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <td className="p-3">{row.name}</td>
                <td className="p-3 text-right">${row.revenue.toLocaleString()}</td>
                {/* More cells */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardSection>
  );
}
```

##### 2.1.3 Chart Component (Chart.js)

```typescript
// visualizations/PerformanceChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { DashboardSection } from 'components/index';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface PerformanceChartProps {
  data: {
    revenue?: number[];
    units?: number[];
    labels?: string[];
  };
  loading?: boolean;
}

export function PerformanceChart({ data = {}, loading = false }: PerformanceChartProps) {
  const { revenue = [], units = [], labels = [] } = data;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenue,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4
      },
      {
        label: 'Units',
        data: units,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      },
      tooltip: {
        backgroundColor: 'rgb(31, 41, 55)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)',
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Units',
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  if (!labels.length || !revenue.length) {
    return (
      <DashboardSection title="Performance Chart">
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection title="Performance Chart">
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </DashboardSection>
  );
}
```

#### Step 2.2: Export All Components

```typescript
// visualizations/index.tsx
export { PerformanceChart } from './PerformanceChart';
export { DataTable } from './DataTable';
export { CategoryChart } from './CategoryChart';
export { ScatterChart } from './ScatterChart';
// ... all visualizations
```

```typescript
// components/index.tsx
export { DashboardKPIs } from './DashboardKPIs';

export {
  PerformanceChart,
  DataTable,
  CategoryChart,
  ScatterChart
} from './visualizations';
```

---

### Phase 3: Enterprise-IQ Integration (1-2 hours)

#### Step 3.1: Update Component Registry

**File**: `apps/frontend/src/app/enterprise-iq/page.tsx`

```typescript
const componentRegistry = {
  // ... existing dashboards

  'product-performance': {
    kpis: dynamic(() => import('../product-performance/components').then(mod => mod.ProductKPIs)),
    overview: dynamic(() => import('../product-performance/components').then(mod => mod.ProductPerformanceOverview)),
    topProducts: dynamic(() => import('../product-performance/components').then(mod => mod.TopProductsTable)),
    categoryAnalysis: dynamic(() => import('../product-performance/components').then(mod => mod.CategoryPerformanceChart)),
    marginAnalysis: dynamic(() => import('../product-performance/components').then(mod => mod.MarginAnalysisScatter)),
    priceBands: dynamic(() => import('../product-performance/components').then(mod => mod.PriceBandDistribution))
  }
};
```

**Key Points**:
- ✅ Use `dynamic()` for code splitting
- ✅ Match component names from COMPONENT_SCHEMA
- ✅ Use correct import paths

#### Step 3.2: Add Prop Mappers

**File**: `apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts`

```typescript
export const componentPropMappers: Record<string, (summary: any) => any> = {
  // ... existing mappers

  // Product Performance KPIs
  'product-performance.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  // Product Performance Overview
  'product-performance.overview': (summary) => {
    return {
      data: {
        revenue: summary.mainData?.topProducts?.map(p => p.revenue) || [],
        units: summary.mainData?.topProducts?.map(p => p.unitsSold) || [],
        margin: summary.mainData?.topProducts?.map(p => p.marginPercent) || [],
        labels: summary.mainData?.topProducts?.map(p => p.productName) || []
      },
      loading: false
    };
  },

  // Top Products Table
  'product-performance.topProducts': (summary) => {
    return {
      data: summary.mainData?.topProducts || [],
      loading: false
    };
  },

  // Category Analysis Chart
  'product-performance.categoryAnalysis': (summary) => {
    return {
      data: summary.mainData?.categoryPerformance || [],
      loading: false
    };
  },

  // Margin Analysis Scatter
  'product-performance.marginAnalysis': (summary) => {
    return {
      data: summary.mainData?.marginAnalysis || [],
      loading: false
    };
  },

  // Price Band Distribution
  'product-performance.priceBands': (summary) => {
    return {
      data: summary.mainData?.priceBandDistribution || [],
      loading: false
    };
  }
};
```

**Key Points**:
- ✅ Map `toolname.componentName` to transformation function
- ✅ Transform API structure (`mainData`, `kpiMetrics`) to component props
- ✅ Handle missing data with fallbacks (`|| []`, `|| {}`)
- ✅ Always set `loading: false` (chat context already handled loading)

---

### Phase 4: Context & State Management (1-2 hours)

#### Step 4.1: Create Context with Filters

**File**: `apps/frontend/src/app/{dashboard-name}/context.tsx`

```typescript
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager, getSelectionManager } from '../sales-performance/services/SelectionManager';

export interface DashboardFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories: string[];
  products: string[];
  // ... other filters
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  selectedDimension: string;
  setSelectedDimension: React.Dispatch<React.SetStateAction<string>>;
  selectedMetric: string;
  setSelectedMetric: React.Dispatch<React.SetStateAction<string>>;
  selectionManager: SelectionManager;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardData: any;
  setDashboardData: React.Dispatch<React.SetStateAction<any>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectionManager] = useState(() => getSelectionManager());

  // Panel states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);

  // Data sharing
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Dimension and metric selection
  const [selectedDimension, setSelectedDimension] = useState<string>('category');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  // Always start with default filters (2017-2021)
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    categories: [],
    products: []
  });

  // Load filters from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboardFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch {}
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboardFilters', JSON.stringify(filters));
    } catch {}
  }, [filters]);

  // Load dimension/metric from localStorage
  useEffect(() => {
    const savedDimension = localStorage.getItem('dashboardDimension');
    const savedMetric = localStorage.getItem('dashboardMetric');
    if (savedDimension) setSelectedDimension(savedDimension);
    if (savedMetric) setSelectedMetric(savedMetric);
  }, []);

  // Save dimension/metric to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboardDimension', selectedDimension);
    } catch {}
  }, [selectedDimension]);

  useEffect(() => {
    try {
      localStorage.setItem('dashboardMetric', selectedMetric);
    } catch {}
  }, [selectedMetric]);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      selectedDimension,
      setSelectedDimension,
      selectedMetric,
      setSelectedMetric,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      dashboardData,
      setDashboardData,
    }),
    [
      filters,
      selectedDimension,
      selectedMetric,
      selectionManager,
      isChatOpen,
      isBIModalOpen,
      dashboardData
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
```

**Key Points**:
- ✅ Default date range: 2017-2021
- ✅ localStorage persistence for all filters
- ✅ SelectionManager for chart interactions
- ✅ Panel states (isChatOpen, isBIModalOpen)
- ✅ Proper React.useMemo to prevent re-renders
- ✅ selectedDimension and selectedMetric for drill-downs

#### Step 4.2: Update Page Layout

**File**: `apps/frontend/src/app/{dashboard-name}/page.tsx`

```typescript
"use client";

import React from 'react';
import { DashboardSection, PageLoader } from 'components/index';
import {
  DashboardKPIs,
  PerformanceChart,
  DataTable,
  CategoryChart
} from './components';
import { useDashboardContext } from './context';
import { useDashboardData } from './hooks/useDashboardData';

export default function DashboardPage() {
  const { filters, setDashboardData } = useDashboardContext();

  const {
    loading,
    error,
    kpiMetrics,
    mainData,
    hasNoData
  } = useDashboardData(filters);

  React.useEffect(() => {
    if (mainData) {
      setDashboardData(mainData);
    }
  }, [mainData, setDashboardData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Dashboard",
      }}
    >
      <div className="space-y-6">
        {/* KPIs Section */}
        <DashboardSection title="Key Metrics">
          <DashboardKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* Data Table - Full Width */}
        <DashboardSection title="Details">
          <DataTable data={mainData?.items || []} loading={loading} />
        </DashboardSection>

        {/* Charts - 2 Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart data={mainData?.chartData} loading={loading} />
          <CategoryChart data={mainData?.categoryData} loading={loading} />
        </div>
      </div>
    </PageLoader>
  );
}
```

---

### Phase 5: Testing & Validation (2-3 hours)

#### Step 5.1: Test Backend Tool

```bash
cd apps/adk
python -c "
from orchestration_agent.tools.product_performance import analyze_product_performance
result = analyze_product_performance('2021')
print(result[:2000])
print('...')
print('Has visualization tag:', '<is_visualisation>true</is_visualisation>' in result)
"
```

**Verify**:
- ✅ Tool returns text report
- ✅ Contains `## Visualization Data (Machine-Readable)` section
- ✅ Has `<output>` and `<is_visualisation>true</is_visualisation>` tags
- ✅ Metadata includes filters only, no data arrays

#### Step 5.2: Test API Endpoint

```bash
curl -X POST http://localhost:8000/api/product-performance/summary \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "2017-01-01",
    "dateTo": "2021-12-31"
  }'
```

**Verify**:
- ✅ Returns `{kpiMetrics, mainData, insights, metadata}`
- ✅ kpiMetrics has all expected fields
- ✅ mainData has all expected arrays (topProducts, categoryPerformance, etc.)
- ✅ No errors in response

#### Step 5.3: Test Dashboard

1. Navigate to `/product-performance` in browser
2. Open DevTools console
3. Check for:
   - ✅ All visualizations load with data
   - ✅ KPIs display correctly
   - ✅ Charts render without errors
   - ✅ Table sorting and searching works
   - ✅ No console errors
   - ✅ Loading states work correctly

#### Step 5.4: Test Enterprise-IQ Chat

1. Open chat interface
2. Test queries:
   ```
   "Show me product performance for 2021"
   "Filter by Technology category"
   "Show products with margin over 30%"
   "Compare revenue across categories"
   ```
3. Verify:
   - ✅ Graphs spawn in canvas
   - ✅ Components load with correct data
   - ✅ Filters apply correctly
   - ✅ Follow-up queries work
   - ✅ Component names match registry

#### Step 5.5: Validate Data Consistency

1. **Dashboard**: Note KPI values (Total Revenue, Total Units, etc.)
2. **Chat**: Ask "Show me product performance for 2021"
3. **Compare**: Verify numbers match EXACTLY between dashboard and chat

**Example**:
```
Dashboard KPIs:
- Total Revenue: $142.5M
- Total Units: 45,832
- Avg Margin: 28.3%

Chat Response:
- Total Revenue: $142.5M ✅
- Total Units: 45,832 ✅
- Avg Margin: 28.3% ✅
```

If numbers don't match:
- ❌ Check if both use same date range (2017-2021)
- ❌ Check if filters are applied consistently
- ❌ Check if both call same processing service

---

## Common Issues & Fixes

### Issue 1: "ModuleNotFoundError: No module named 'orchestration_agent.services'"

**Cause**: Incorrect import path in tool file.

**Fix**:
```python
# ❌ Wrong
from orchestration_agent.services.processing.product_performance_processing import ProductPerformanceProcessingService

# ✅ Correct
from domains.product_performance.processing_service import ProductPerformanceProcessingService
```

### Issue 2: Charts not rendering / blank canvas

**Cause**: Chart.js not registered correctly.

**Fix**:
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler  // Add if using filled areas
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler  // Add if using filled areas
);
```

### Issue 3: "Hydration mismatch" errors

**Cause**: localStorage accessed during SSR.

**Fix**:
```typescript
// ❌ Wrong: Accessing localStorage immediately
const [filters, setFilters] = useState<Filters>(() => {
  const saved = localStorage.getItem('filters');
  return saved ? JSON.parse(saved) : defaultFilters;
});

// ✅ Correct: Load in useEffect
const [filters, setFilters] = useState<Filters>(defaultFilters);

useEffect(() => {
  try {
    const saved = localStorage.getItem('filters');
    if (saved) {
      setFilters(JSON.parse(saved));
    }
  } catch {}
}, []);
```

### Issue 4: Component not spawning in chat

**Cause**: Missing registry entry or wrong component name.

**Fix**:
1. Check COMPONENT_SCHEMA matches registry:
```python
# utils.py
"components": ["overview", "topProducts", "kpis"]
```

```typescript
// page.tsx
'product-performance': {
  overview: dynamic(...),
  topProducts: dynamic(...),
  kpis: dynamic(...)
}
```

2. Check tool output has correct componentName:
```python
viz_metadata = {
    "toolname": "product-performance",
    "componentName": "overview",  # Must match registry key
    "body": {...}
}
```

### Issue 5: Data not loading / empty charts

**Cause**: Prop mapper not transforming data correctly.

**Fix**:
```typescript
// ❌ Wrong: Direct mapping without fallback
'product-performance.overview': (summary) => {
  return {
    data: {
      revenue: summary.mainData.topProducts.map(p => p.revenue),  // Will crash if undefined
      // ...
    }
  };
}

// ✅ Correct: Safe mapping with fallbacks
'product-performance.overview': (summary) => {
  return {
    data: {
      revenue: summary.mainData?.topProducts?.map(p => p.revenue) || [],
      units: summary.mainData?.topProducts?.map(p => p.unitsSold) || [],
      margin: summary.mainData?.topProducts?.map(p => p.marginPercent) || [],
      labels: summary.mainData?.topProducts?.map(p => p.productName) || []
    },
    loading: false
  };
}
```

### Issue 6: Date range inconsistency

**Cause**: Different default dates in different places.

**Fix**: Use 2017-2021 EVERYWHERE:
```python
# Backend tool
filters['dateFrom'] = '2017-01-01'
filters['dateTo'] = '2021-12-31'
```

```typescript
// Frontend context
const [filters, setFilters] = useState({
  dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
  // ...
});
```

```typescript
// Frontend hook
const defaultFilters = {
  dateFrom: '2017-01-01',
  dateTo: '2021-12-31'
};
```

---

## Success Criteria Checklist

### Backend
- [ ] Tool outputs metadata-only format
- [ ] Tool has `<is_visualisation>true</is_visualisation>` tag
- [ ] COMPONENT_SCHEMA updated with all components
- [ ] Default time period: 2017-2021
- [ ] Processing service handles all filters correctly

### Frontend Components
- [ ] All visualization components created (4-6 components)
- [ ] KPIs use AnimatedKPITile
- [ ] Charts use dark theme colors
- [ ] Tables have sorting and searching
- [ ] All components have loading states
- [ ] All components have empty states

### Enterprise-IQ Integration
- [ ] All components added to componentRegistry
- [ ] All components have prop mappers
- [ ] Prop mappers handle missing data (|| [], || {})
- [ ] Component names match COMPONENT_SCHEMA

### Context & State
- [ ] Context has all required fields
- [ ] Filters interface matches backend
- [ ] Default date range: 2017-2021
- [ ] localStorage persistence works
- [ ] SelectionManager integrated
- [ ] Panel states (isChatOpen, isBIModalOpen)

### Testing
- [ ] Backend tool test passes
- [ ] API endpoint returns correct structure
- [ ] Dashboard loads without errors
- [ ] All visualizations display data
- [ ] Charts render correctly
- [ ] Table sorting/searching works
- [ ] Chat spawns graphs correctly
- [ ] Data consistency verified (dashboard = chat)

---

## Reference Implementations

### Complete Examples

1. **Sales Performance** - `apps/frontend/src/app/sales-performance/`
   - Full implementation with 6 visualization components
   - Complex filtering (regions, categories, products, channels)
   - Time series analysis
   - Reference for multi-axis charts

2. **Customer Segmentation** - `apps/frontend/src/app/customer-segmentation/`
   - RFM analysis visualization
   - Scatter plots and heatmaps
   - Customer cohort tables
   - Reference for segment analysis

3. **Customer LTV** - `apps/frontend/src/app/customer-ltv/`
   - Lifetime value calculations
   - Cohort retention analysis
   - Predictive modeling visualizations
   - Reference for time-based metrics

4. **Product Performance** - `apps/frontend/src/app/product-performance/`
   - Product analysis and comparison
   - Category performance charts
   - Margin analysis scatter plots
   - Reference for product-centric dashboards

### Key Files to Reference

**Backend**:
- `apps/adk/orchestration_agent/tools/sales_performance.py` - Tool structure
- `apps/adk/domains/sales_performance/processing_service.py` - Processing service pattern
- `apps/adk/lib/utils.py` - COMPONENT_SCHEMA format

**Frontend**:
- `apps/frontend/src/app/sales-performance/page.tsx` - Page layout
- `apps/frontend/src/app/sales-performance/context.tsx` - Context pattern
- `apps/frontend/src/app/sales-performance/components/visualizations/` - Chart examples
- `apps/frontend/src/app/enterprise-iq/page.tsx` - Component registry
- `apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts` - Prop mapper examples

---

## Time Estimates

- **Phase 1 (Backend ADK Tool)**: 2-3 hours
- **Phase 2 (Frontend Components)**: 4-6 hours
- **Phase 3 (Enterprise-IQ Integration)**: 1-2 hours
- **Phase 4 (Context & State)**: 1-2 hours
- **Phase 5 (Testing & Validation)**: 2-3 hours

**Total**: 10-16 hours for complete implementation

---

## Notes

- Always use 2017-2021 as default date range for consistency
- Always include loading and empty states in components
- Always use dark theme colors (`text-muted-foreground`, `bg-muted`, etc.)
- Always add fallbacks in prop mappers (`|| []`, `|| {}`)
- Always test data consistency between dashboard and chat
- Always use `React.useMemo` in context to prevent re-renders
- Always use `dynamic()` imports in component registry for code splitting

---

**For questions or issues**: Reference existing implementations in Sales Performance, Customer Segmentation, Customer LTV, and Product Performance dashboards.
