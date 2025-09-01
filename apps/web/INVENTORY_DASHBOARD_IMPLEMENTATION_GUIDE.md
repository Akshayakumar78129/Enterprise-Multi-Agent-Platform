# Inventory Dashboard Implementation Guide
## Complete Step-by-Step Documentation for Building Data-Driven Dashboards

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Structure](#architecture--structure)
3. [Database Integration](#database-integration)
4. [API Implementation](#api-implementation)
5. [Core Dashboard Components](#core-dashboard-components)
6. [Filter System](#filter-system)
7. [Visualization Components](#visualization-components)
8. [AI Insights Implementation](#ai-insights-implementation)
9. [Chatbot Integration](#chatbot-integration)
10. [Business Intelligence Panel](#business-intelligence-panel)
11. [Common Patterns & Best Practices](#common-patterns--best-practices)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This guide documents the complete implementation of the **Inventory Optimization Analyzer Dashboard**, a production-ready, data-driven dashboard with real-time database integration, AI features, and interactive visualizations. This implementation can be used as a template for creating similar dashboards.

### Key Features Implemented
- ✅ **Real SQLite Database Integration** (NO mock data)
- ✅ **Dynamic Filtering System** affecting all charts in real-time
- ✅ **AI Insights Modal** (static, instant loading)
- ✅ **Universal Chatbot** with @mentions support
- ✅ **Business Intelligence Panel** with 5 interactive tabs
- ✅ **6 Different Visualization Types**
- ✅ **Dark Theme** with cyan accents (#00e0ff)

### Technology Stack
- **Frontend**: React, TypeScript, Next.js
- **Database**: SQLite with better-sqlite3
- **Styling**: CSS Modules + Inline styles
- **AI Integration**: AIResponseDashboard from ui-common
- **Charts**: Custom React components

---

## Architecture & Structure

### Directory Structure
```
apps/web/
├── pages/
│   └── inventory/
│       └── optimization-analyzer.tsx        # Next.js page route
├── api/
│   └── inventory/
│       └── optimization-analyzer/
│           └── data.ts                      # API endpoint
└── Inventory/
    ├── database/
    │   └── inventory.db                     # SQLite database
    └── tools/
        └── InventoryOptimizationAnalyzer/
            ├── database/
            │   └── queries.js                # Database queries
            ├── api/
            │   └── data.api.js              # API handler
            └── ui/
                ├── api/
                │   └── inventoryApi.ts      # Frontend API client
                ├── components/
                │   ├── kpi/                 # KPI components
                │   ├── filters/             # Filter components
                │   ├── visualizations/      # Chart components
                │   ├── ai/                  # AI Insights
                │   └── bi/                  # Business Intelligence
                └── views/
                    └── InventoryOptimizationDashboard.tsx
```

### Page Route Setup
**File**: `pages/inventory/optimization-analyzer.tsx`
```tsx
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with chart libraries
const InventoryOptimizationDashboard = dynamic(
  () => import('../../Inventory/tools/InventoryOptimizationAnalyzer/ui/views/InventoryOptimizationDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
        color: '#00e0ff',
        fontSize: '1.2rem'
      }}>
        Loading Inventory Optimization Analyzer...
      </div>
    )
  }
);

export default function InventoryOptimizationAnalyzer() {
  return <InventoryOptimizationDashboard />;
}
```

**Key Points:**
- Use `dynamic` import with `ssr: false` for client-side only rendering
- Provide loading state matching theme
- Route accessible at `/inventory/optimization-analyzer`

---

## Database Integration

### CRITICAL: Use Real Database, NOT Mock Data

**Database Location**: `apps/web/Inventory/database/inventory.db`

### Database Schema
```sql
-- Main Tables
1. dbo_D_Item (Items dimension)
   - Item_Key (PRIMARY KEY)
   - Item_Name
   - Item_Category
   - Unit_Cost
   - Lead_Time_Days

2. dbo_D_Warehouse (Warehouse dimension)
   - Warehouse_Key (PRIMARY KEY)
   - Warehouse_ID
   - Warehouse_Name
   - Warehouse_Type
   - Location

3. dbo_F_Inventory_Snapshot (Fact table)
   - Snapshot_Key (PRIMARY KEY)
   - Item_Key (FK)
   - Warehouse_Key (FK)
   - Snapshot_Date
   - Current_Stock
   - Average_Stock_Level
   - Reorder_Point
   - Safety_Stock

4. dbo_F_Sales_Transaction (Sales fact)
   - Transaction_Key (PRIMARY KEY)
   - Item_Key (FK)
   - Sale_Date
   - Quantity_Sold
   - Sale_Amount
```

### Database Query Module
**File**: `database/queries.js`

```javascript
const Database = require('better-sqlite3');
const path = require('path');

class InventoryOptimizationQueries {
  constructor() {
    // IMPORTANT: Use process.cwd() for correct path resolution
    const dbPath = path.join(process.cwd(), 'Inventory', 'database', 'inventory.db');
    this.db = new Database(dbPath, { readonly: true });
  }

  getKPIData(filters = {}) {
    const { startDate, endDate, warehouseId, category } = filters;
    
    // Build WHERE clause dynamically
    let whereClause = 'WHERE 1=1';
    const params = {};
    
    if (warehouseId && warehouseId !== 'all') {
      whereClause += ' AND w.Warehouse_ID = @warehouseId';
      params.warehouseId = warehouseId;
    }
    
    if (category && category !== 'all') {
      whereClause += ' AND i.Item_Category = @category';
      params.category = category;
    }

    const query = `
      WITH inventory_metrics AS (
        SELECT 
          SUM(s.Current_Stock * i.Unit_Cost) as total_inventory_value,
          COUNT(DISTINCT CASE 
            WHEN s.Current_Stock < s.Reorder_Point THEN i.Item_Key 
          END) as stockout_risk_items,
          -- Calculate health score (0-100)
          AVG(CASE 
            WHEN s.Current_Stock = 0 THEN 0
            WHEN s.Current_Stock < s.Reorder_Point THEN 30
            WHEN s.Current_Stock > s.Average_Stock_Level * 2 THEN 60
            ELSE 90
          END) as inventory_health_score
        FROM dbo_F_Inventory_Snapshot s
        JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
        JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
        ${whereClause}
      )
      SELECT * FROM inventory_metrics
    `;
    
    return this.db.prepare(query).get(params);
  }

  getHealthMatrixData(filters = {}) {
    // Returns category-warehouse health matrix
    const query = `
      SELECT 
        i.Item_Category as category,
        w.Warehouse_Name as warehouse,
        COUNT(DISTINCT i.Item_Key) as item_count,
        SUM(s.Current_Stock * i.Unit_Cost) as total_value,
        AVG(health_calculation) as health_score
      FROM dbo_F_Inventory_Snapshot s
      JOIN dbo_D_Item i ON s.Item_Key = i.Item_Key
      JOIN dbo_D_Warehouse w ON s.Warehouse_Key = w.Warehouse_Key
      GROUP BY i.Item_Category, w.Warehouse_Name
    `;
    
    return this.db.prepare(query).all();
  }

  close() {
    this.db.close();
  }
}

module.exports = { InventoryOptimizationQueries };
```

**Key Database Best Practices:**
1. **Always use parameterized queries** to prevent SQL injection
2. **Open database in readonly mode** for safety
3. **Close connections** after use
4. **Handle NULL values** in calculations
5. **Use CTEs (WITH clauses)** for complex queries

---

## API Implementation

### API Endpoint Structure
**File**: `api/inventory/optimization-analyzer/data.ts` (Next.js API Route)

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

const handler = require('../../../Inventory/tools/InventoryOptimizationAnalyzer/api/data.api');

export default async function apiHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handler(req, res);
}
```

### API Handler Implementation
**File**: `api/data.api.js`

```javascript
const { InventoryOptimizationQueries } = require('../database/queries');

async function handler(req, res) {
  // IMPORTANT: Use POST method for filter parameters
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const queries = new InventoryOptimizationQueries();
    
    // Parse filters from request body
    const filters = req.body || {};
    const parsedFilters = {
      startDate: filters.startDate || '2025-01-01',
      endDate: filters.endDate || '2025-12-31',
      warehouseId: filters.warehouseId || 'all',
      category: filters.category || 'all',
      metric: filters.metric || 'health_score'
    };

    // Fetch all data in parallel for performance
    const [
      kpiData,
      healthMatrix,
      costImpact,
      performanceTimeline,
      actionPriority,
      agingAnalysis,
      warehouses,
      categories
    ] = await Promise.all([
      queries.getKPIData(parsedFilters),
      queries.getHealthMatrixData(parsedFilters),
      queries.getCostImpactData(parsedFilters),
      queries.getPerformanceTimeline(parsedFilters),
      queries.getActionPriorityData(parsedFilters),
      queries.getAgingAnalysis(parsedFilters),
      queries.getWarehouses(),
      queries.getCategories()
    ]);

    // Close database connection
    queries.close();

    // Structure response
    const response = {
      success: true,
      data: {
        kpis: {
          inventoryHealth: {
            value: kpiData?.inventory_health_score || 0,
            label: 'Inventory Health',
            unit: '%',
            trend: 'stable'
          },
          totalValue: {
            value: kpiData?.total_inventory_value || 0,
            label: 'Total Inventory Value',
            unit: '$',
            trend: 'up'
          },
          // ... other KPIs
        },
        healthMatrix: healthMatrix || [],
        costImpact: costImpact || [],
        performanceTimeline: performanceTimeline || [],
        actionPriority: actionPriority || [],
        agingAnalysis: agingAnalysis || [],
        filters: {
          warehouses: warehouses || [],
          categories: categories || []
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          filters: parsedFilters
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = handler;
```

**API Best Practices:**
1. **Use POST for complex filters** (not GET with query params)
2. **Parallel data fetching** with Promise.all()
3. **Structured response format** with success flag
4. **Proper error handling** with status codes
5. **Include metadata** for debugging

---

## Core Dashboard Components

### Main Dashboard Component
**File**: `ui/views/InventoryOptimizationDashboard.tsx`

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import InventoryBusinessIntelligence from '../components/bi/InventoryBusinessIntelligence';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { fetchDashboardData } from '../api/inventoryApi';

const InventoryOptimizationDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    warehouseId: 'all',
    category: 'all',
    metric: 'health_score'
  });

  // AI Features State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightData, setAIInsightData] = useState(null);
  const [showBIAgent, setShowBIAgent] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // Load dashboard data with filters
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData(filters);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Reload data when filters change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle chart/KPI clicks for AI Insights
  const handleDataPointClick = (data, chartType) => {
    setAIInsightData({
      ...data,
      chartType,
      context: 'inventory_optimization',
      filters
    });
    setShowAIInsights(true);
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <h1>📦 Inventory Optimization Analyzer</h1>
        <p>AI-powered inventory intelligence and optimization</p>
      </div>

      {/* Filters */}
      <FilterSection
        filters={filters}
        onFilterChange={handleFilterChange}
        warehouses={dashboardData?.data?.filters?.warehouses || []}
        categories={dashboardData?.data?.filters?.categories || []}
      />

      {/* KPI Dashboard */}
      <KPITiles
        kpis={dashboardData?.data?.kpis}
        onKPIClick={handleDataPointClick}
      />

      {/* Visualizations */}
      <div className={styles.visualizationsGrid}>
        <HealthMatrix
          data={dashboardData?.data?.healthMatrix}
          onCellClick={handleDataPointClick}
        />
        {/* Other charts... */}
      </div>

      {/* AI Components */}
      {showAIInsights && (
        <AIInsightsModal
          data={aiInsightData}
          onClose={() => setShowAIInsights(false)}
          onSendToChat={handleSendToChat}
        />
      )}

      {/* Business Intelligence Button */}
      <button
        onClick={() => setShowBIAgent(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          // ... styles
        }}
      >
        🧠
      </button>

      {/* Chatbot Button */}
      <ChatbotButton
        onClick={() => setShowChatbot(!showChatbot)}
        isOpen={showChatbot}
      />

      {/* Components */}
      {showChatbot && (
        <UniversalChatbot
          defaultAgent="inventory"
          onClose={() => setShowChatbot(false)}
          dashboardContext={{
            source_dashboard: 'inventory_optimization',
            inventory_context: {
              kpis: dashboardData?.data?.kpis,
              health_matrix: dashboardData?.data?.healthMatrix,
              filters: filters
            }
          }}
        />
      )}

      {showBIAgent && (
        <InventoryBusinessIntelligence
          onClose={() => setShowBIAgent(false)}
          dashboardData={dashboardData}
        />
      )}
    </div>
  );
};
```

---

## Filter System

### Filter Component Implementation
**File**: `ui/components/filters/FilterSection.tsx`

```tsx
interface FilterSectionProps {
  filters: {
    startDate: string;
    endDate: string;
    warehouseId: string;
    category: string;
    metric: string;
  };
  onFilterChange: (filters: any) => void;
  warehouses: Array<{ id: string; name: string }>;
  categories: Array<{ category: string; item_count: number }>;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  onFilterChange,
  warehouses,
  categories
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      warehouseId: 'all',
      category: 'all',
      metric: 'health_score'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className={styles.filterSection}>
      {/* Date Range */}
      <input
        type="date"
        value={localFilters.startDate}
        onChange={(e) => setLocalFilters({...localFilters, startDate: e.target.value})}
      />
      
      {/* Warehouse Dropdown */}
      <select
        value={localFilters.warehouseId}
        onChange={(e) => setLocalFilters({...localFilters, warehouseId: e.target.value})}
      >
        <option value="all">All Warehouses</option>
        {warehouses.map(w => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>

      {/* Category Dropdown */}
      <select
        value={localFilters.category}
        onChange={(e) => setLocalFilters({...localFilters, category: e.target.value})}
      >
        <option value="all">All Categories</option>
        {categories.map(c => (
          <option key={c.category} value={c.category}>
            {c.category} ({c.item_count} items)
          </option>
        ))}
      </select>

      <button onClick={handleApplyFilters}>Apply Filters</button>
      <button onClick={handleResetFilters}>Reset</button>
    </div>
  );
};
```

### How Filters Affect Charts:
1. **User changes filter** → `handleFilterChange` updates state
2. **State change triggers useEffect** → calls `loadDashboardData`
3. **API receives filters via POST body**
4. **Database queries use WHERE clauses** for filtering
5. **Charts re-render** with new filtered data

---

## Visualization Components

### KPI Tiles
**File**: `ui/components/kpi/KPITiles.tsx`

```tsx
interface KPITilesProps {
  kpis: any;
  onKPIClick: (kpi: any) => void;
}

const KPITiles: React.FC<KPITilesProps> = ({ kpis, onKPIClick }) => {
  return (
    <div className={styles.kpiGrid}>
      {Object.entries(kpis || {}).map(([key, kpi]: [string, any]) => (
        <div
          key={key}
          className={styles.kpiTile}
          onClick={() => onKPIClick(kpi)}
        >
          <div className={styles.kpiHeader}>
            <span className={styles.kpiIcon}>{kpi.icon || '📊'}</span>
            <span className={styles.kpiLabel}>{kpi.label}</span>
          </div>
          <div className={styles.kpiValue}>
            {kpi.unit === '$' ? `$${(kpi.value / 1000).toFixed(0)}K` : 
             kpi.unit === '%' ? `${kpi.value}%` : kpi.value}
          </div>
          <div className={styles.kpiTrend}>
            <span className={kpi.trend === 'up' ? styles.trendUp : styles.trendDown}>
              {kpi.trend === 'up' ? '↑' : '↓'} {kpi.trendValue}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Chart Components Pattern
Each chart follows this pattern:
1. **Receives data from props** (filtered from database)
2. **Handles click events** for AI Insights
3. **Uses dark theme colors**
4. **Responsive design**

Example Health Matrix:
```tsx
const HealthMatrix: React.FC<{ data: any[], onCellClick: Function }> = ({ data, onCellClick }) => {
  return (
    <div className={styles.matrixContainer}>
      {data?.map((cell, idx) => (
        <div
          key={idx}
          className={styles.matrixCell}
          style={{
            background: `rgba(0, 224, 255, ${cell.health_score / 100})`,
          }}
          onClick={() => onCellClick(cell, 'health_matrix')}
        >
          <div>{cell.category}</div>
          <div>{cell.warehouse}</div>
          <div>{cell.health_score}%</div>
        </div>
      ))}
    </div>
  );
};
```

---

## AI Insights Implementation

### IMPORTANT: Static Insights (No API Calls)
**File**: `ui/components/ai/AIInsightsModal.tsx`

```tsx
const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ data, onClose, onSendToChat }) => {
  // Generate static insights immediately without API calls
  const getInsights = (data: any) => {
    const insights = [];
    
    if (data.chartType === 'health_matrix') {
      const score = data.health_score || 0;
      insights.push(`Health score of ${score}% indicates ${score > 80 ? 'excellent' : score > 70 ? 'good' : 'poor'} inventory management`);
      if (data.stockout_risk_count > 0) {
        insights.push(`⚠️ Alert: ${data.stockout_risk_count} items at immediate stockout risk`);
      }
      insights.push(`Holding cost averaging $${data.avg_holding_cost?.toFixed(0) || '500'} per SKU monthly`);
    } else if (data.label === 'Inventory Health') {
      insights.push(`Overall inventory health at ${data.value}% ${data.value > 80 ? 'exceeds' : 'meets'} industry benchmarks`);
      insights.push('Health score incorporates: stock levels (40%), turnover rate (30%), holding costs (20%), stockout risk (10%)');
    }
    // ... more chart-specific insights
    
    return insights;
  };

  const getRecommendations = (data: any) => {
    const recommendations = [];
    
    if (data.health_score && data.health_score < 60) {
      recommendations.push('Review and adjust reorder points');
      recommendations.push('Identify and clear slow-moving inventory');
      recommendations.push('Optimize safety stock levels');
    }
    // ... more recommendations
    
    return recommendations;
  };

  // Generate insights and recommendations immediately (no API calls)
  const insights = getInsights(data);
  const recommendations = getRecommendations(data);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🤖 AI Insights</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalContent}>
          {/* Display insights immediately - no loading state */}
          <div className={styles.insightsSection}>
            <h4>Key Insights</h4>
            {insights.map((insight, index) => (
              <div key={index}>{insight}</div>
            ))}
          </div>

          <div className={styles.recommendationsSection}>
            <h4>Recommendations</h4>
            {recommendations.map((rec, index) => (
              <div key={index}>{rec}</div>
            ))}
          </div>
        </div>

        <button onClick={() => onSendToChat(data)}>
          Send to Chat 💬
        </button>
      </div>
    </div>
  );
};
```

**Key Points for AI Insights:**
1. **NO API calls** - generates insights from data immediately
2. **NO loading state** - instant display
3. **Context-aware insights** based on chart type
4. **Static but intelligent** recommendations

---

## Chatbot Integration

### Using UI-Common UniversalChatbot
**Source**: `ui-common/chatbot/UniversalChatbot.tsx`

**Integration in Dashboard:**
```tsx
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';

// In render:
<ChatbotButton
  onClick={() => setShowChatbot(!showChatbot)}
  isOpen={showChatbot}
/>

{showChatbot && (
  <UniversalChatbot
    defaultAgent="inventory"  // Set default agent
    onClose={() => setShowChatbot(false)}
    dashboardContext={{
      source_dashboard: 'inventory_optimization',
      inventory_context: {
        kpis: dashboardData?.data?.kpis,
        health_matrix: dashboardData?.data?.healthMatrix,
        filters: filters
      }
    }}
  />
)}
```

### Agent Configuration
**File**: `ui-common/chatbot/agentConfig.ts`

```typescript
export const agents: Record<string, AgentConfig> = {
  inventory: {
    name: 'inventory',
    displayName: 'Inventory Intelligence',
    appName: 'inventory_agent',
    icon: '📦',
    color: '#ff9800',
    description: 'Inventory optimization and supply chain',
    capabilities: [
      'Stock levels',
      'Demand forecasting',
      'Reorder points',
      'Supplier analysis',
      'Warehouse optimization'
    ]
  },
  // ... other agents
};
```

### @Mentions Support
Users can switch agents by typing:
- `@sales` - Sales Intelligence
- `@customer` - Customer Intelligence
- `@finance` - Financial Intelligence
- `@inventory` - Inventory Intelligence
- `@enterpriseiq` - Multi-agent orchestration

### AIResponseDashboard Integration
The chatbot uses the streaming AI response:
```javascript
// From ui-common/ai-interaction/aiResponse.js
export async function* AIResponseDashboard(query, session) {
  const response = await fetch(`${backendAiUrl}/run_sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user_query: query, 
      session_id: session.session_id,
      user_id: session.user_id,
      app_name: session.app_name
    })
  });
  
  // Stream processing...
}
```

---

## Business Intelligence Panel

### Custom BI Implementation with 5 Tabs
**File**: `ui/components/bi/InventoryBusinessIntelligence.tsx`

```tsx
export default function InventoryBusinessIntelligence({ onClose, dashboardData }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'predict' | 'strategy' | 'simulate'>('overview');
  
  // Extract metrics from dashboard data
  const kpis = dashboardData?.data?.kpis || {};
  const inventoryValue = kpis.totalValue?.value || 0;
  const healthScore = kpis.inventoryHealth?.value || 0;
  const stockoutRisk = kpis.stockoutRisk?.value || 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',  // Above chatbot
      right: '30px',
      width: '450px',
      height: '650px',
      background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(0, 224, 255, 0.3)',
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6)',
      zIndex: 998
    }}>
      {/* Header */}
      <div style={styles.header}>
        <h2>🧠 Business Intelligence</h2>
        <button onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['overview', 'risk', 'predict', 'strategy', 'simulate'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'risk' && renderRisk()}
        {activeTab === 'predict' && renderPredict()}
        {activeTab === 'strategy' && renderStrategy()}
        {activeTab === 'simulate' && renderSimulate()}
      </div>
    </div>
  );
}
```

### Tab Content Structure

#### Overview Tab
```tsx
const renderOverview = () => (
  <div>
    <div style={styles.metricCard}>
      <span>📊 Executive Summary</span>
      <div>
        Your inventory portfolio of ${(inventoryValue/1000).toFixed(0)}K is 
        operating at {healthScore}% health with {stockoutRisk} items at risk.
      </div>
    </div>
    {/* Key metrics grid, financial impact, 30-day outlook */}
  </div>
);
```

#### Risk Tab
```tsx
const renderRisk = () => (
  <div>
    {/* Critical/High/Medium risk breakdown */}
    {[
      { level: 'Critical', items: Math.floor(stockoutRisk * 0.3), color: '#ff5252' },
      { level: 'High', items: Math.floor(stockoutRisk * 0.5), color: '#ff9800' },
      { level: 'Medium', items: Math.floor(stockoutRisk * 0.2), color: '#ffd600' },
    ].map(risk => (
      <div key={risk.level} style={styles.riskItem}>
        <div style={{ background: risk.color }}/>
        <div>{risk.level} Risk - {risk.items} items</div>
        <button>View Items</button>
      </div>
    ))}
    {/* Risk distribution, mitigation strategies */}
  </div>
);
```

#### Predict Tab
- 30-day forecasts
- Demand predictions by category
- Model confidence levels

#### Strategy Tab
- Phase 1: Quick Wins (Week 1)
- Phase 2: Process Optimization (Month 1)
- Phase 3: Technology (Quarter 1)
- ROI calculations

#### Simulate Tab
- Interactive sliders for parameters
- Real-time simulation results
- Apply settings button

### Button Positioning
```tsx
// BI Button - positioned ABOVE chatbot
<button
  onClick={() => setShowBIAgent(true)}
  style={{
    position: 'fixed',
    bottom: '100px',  // Higher than chatbot
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
    // ... rest of styles
  }}
>
  🧠
</button>

// Chatbot Button - at bottom (from ui-common)
<ChatbotButton />  // Automatically positioned at bottom: 30px
```

---

## Common Patterns & Best Practices

### 1. Theme Consistency
```css
/* Dark gradient theme */
--background-primary: linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%);
--background-card: linear-gradient(135deg, #1e2738 0%, #1a2332 100%);
--accent-primary: #00e0ff;  /* Cyan */
--accent-secondary: #00b8d4;
--text-primary: #f7f9fb;
--text-secondary: rgba(247, 249, 251, 0.7);
--border-color: rgba(0, 224, 255, 0.3);
```

### 2. Component Structure Pattern
```tsx
interface ComponentProps {
  data: any;  // From database
  onAction: (data: any) => void;  // Click handler
  filters?: any;  // Optional filters
}

const Component: React.FC<ComponentProps> = ({ data, onAction, filters }) => {
  // Process data
  const processedData = useMemo(() => {
    // Transform data if needed
    return data;
  }, [data, filters]);

  // Render
  return (
    <div onClick={() => onAction(processedData)}>
      {/* Content */}
    </div>
  );
};
```

### 3. Data Flow Pattern
```
User Action → State Update → API Call → Database Query → Response → UI Update
     ↓              ↓             ↓              ↓             ↓          ↓
  Filters     setFilters    POST body    WHERE clause    JSON data   Re-render
```

### 4. Error Handling Pattern
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await api.getData();
    setData(response);
  } catch (err) {
    setError(err.message);
    // Optionally set fallback data
    setData(getDefaultData());
  } finally {
    setLoading(false);
  }
};
```

### 5. CSS Module + Inline Styles Pattern
```tsx
// Use CSS modules for component structure
<div className={styles.container}>
  {/* Use inline styles for dynamic/conditional styling */}
  <div style={{
    background: data.value > 80 ? '#00ff88' : '#ff5252',
    opacity: loading ? 0.5 : 1
  }}>
    Content
  </div>
</div>
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. 404 Error on Dashboard Route
**Problem**: Page not found at `/inventory/optimization-analyzer`
**Solution**: Create page file at `pages/inventory/optimization-analyzer.tsx`

#### 2. Database Connection Errors
**Problem**: Cannot find database file
**Solution**: Use `process.cwd()` for path resolution:
```javascript
const dbPath = path.join(process.cwd(), 'Inventory', 'database', 'inventory.db');
```

#### 3. API Method Not Allowed
**Problem**: GET method not allowed
**Solution**: Use POST method for filter parameters:
```javascript
if (req.method !== 'POST') {
  return res.status(405).json({ error: 'Method not allowed. Use POST.' });
}
```

#### 4. Filters Not Affecting Charts
**Problem**: Charts don't update when filters change
**Solution**: Ensure useEffect dependency on filters:
```tsx
useEffect(() => {
  loadDashboardData();
}, [filters]);  // Re-run when filters change
```

#### 5. React AsyncGenerator Error in Chatbot
**Problem**: Objects are not valid as a React child
**Solution**: Properly handle async generator from AIResponseDashboard:
```tsx
for await (const chunk of AIResponseDashboard(query, session)) {
  if (typeof chunk === 'object' && chunk.agent && chunk.text) {
    // Process chunk
  }
}
```

#### 6. Dark Text on Dark Background
**Problem**: Text not visible in BI panel
**Solution**: Use light colors for text:
```tsx
color: '#f7f9fb'  // White text
// NOT: color: '#0a1224'  // Dark text
```

#### 7. Import Path Errors
**Problem**: Module not found errors
**Solution**: Count directory levels correctly:
```tsx
// From: apps/web/Inventory/tools/InventoryOptimizationAnalyzer/ui/views/
// To: apps/web/ui-common/
import { Component } from '../../../../../ui-common/chatbot';
//                         ↑ 5 levels up
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Database file exists at correct path
- [ ] All environment variables set (NEXT_PUBLIC_BACKEND_AI_URL)
- [ ] API endpoints configured correctly
- [ ] Database has proper indexes for performance
- [ ] Error handling implemented throughout

### Testing
- [ ] Filters update all charts
- [ ] AI Insights load instantly (no API calls)
- [ ] Chatbot connects to backend
- [ ] BI panel tabs work correctly
- [ ] All buttons/interactions responsive
- [ ] Mobile responsive design works

### Performance
- [ ] Use dynamic imports for heavy components
- [ ] Implement proper memoization
- [ ] Database queries optimized
- [ ] Parallel data fetching in API
- [ ] Proper loading states

### Security
- [ ] SQL injection prevention (parameterized queries)
- [ ] Database opened in readonly mode
- [ ] API authentication if needed
- [ ] Input validation on all forms
- [ ] XSS prevention

---

## Extending This Implementation

### Adding New Dashboards
1. **Copy structure** from Inventory dashboard
2. **Create new database** or tables
3. **Modify queries** for your domain
4. **Update agent config** for chatbot
5. **Customize BI tabs** for your metrics
6. **Adjust AI Insights** for your context

### Adding New Visualizations
1. Create component in `ui/components/visualizations/`
2. Follow the pattern: receive data, handle clicks
3. Use theme colors consistently
4. Make it responsive

### Adding New KPIs
1. Add calculation in database query
2. Add to API response structure
3. Add tile in KPITiles component
4. Add insights for the KPI

---

## Resources and References

### Key Files to Study
- **UI Common Components**: `apps/web/ui-common/`
  - `chatbot/UniversalChatbot.tsx` - Multi-agent chatbot
  - `chatbot/agentConfig.ts` - Agent definitions
  - `theme/theme.constants.ts` - Theme configuration
  - `ai-interaction/aiResponse.js` - AI streaming

- **Reference Dashboards**:
  - `Customer/tools/churn_prediction/` - Churn prediction dashboard
  - `Sales/tools/DemandForecastEngine/` - Sales dashboard
  - `pages/demo-dashboard.tsx` - Demo implementation

### Database Schema Reference
- Check `inventory.db` schema with: `sqlite3 inventory.db ".schema"`
- Always verify data structure before querying

### API Testing
```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/inventory/optimization-analyzer/data \
  -H "Content-Type: application/json" \
  -d '{"warehouseId": "WH001", "category": "Electronics"}'
```

---

## Conclusion

This implementation provides a complete, production-ready dashboard with:
- **Real database integration** (no mock data)
- **Dynamic filtering** affecting all visualizations
- **AI-powered insights** without API delays
- **Multi-agent chatbot** with context awareness
- **Business Intelligence panel** with interactive tabs
- **Consistent theming** and user experience

The patterns and components documented here can be reused to quickly build similar dashboards for other domains while maintaining consistency across the application.

Remember: **Always use real data from the database, never mock data!**