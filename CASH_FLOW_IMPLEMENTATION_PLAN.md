# 🎯 Cash Flow Analysis Dashboard - Complete Implementation Plan

## 📊 Current State Analysis

### ✅ What Exists:
- **Frontend skeleton** at `apps/frontend/src/app/cash-flow/` with:
  - Basic page.tsx structure
  - Context with filters
  - Mock hook returning hardcoded data
  - Component exports (no actual components)
  - SelectionManager service

### ❌ What's Missing:
- **Backend** - No domain, API router, or agent tool
- **Frontend components** - Only exports, no actual implementations
- **Enterprise-IQ integration** - Not registered
- **Real data flow** - Currently using setTimeout mock data

---

## 🏗️ Implementation Plan (Following Dashboard Implementation Guide)

### **PHASE 1: Backend Domain & API** (3-4 hours)

#### **1.1 Create Domain Structure** (`apps/adk/domains/cash_flow/`)

**Files to create:**

**`schema.py`** - Database table mappings
```python
# Map to transactions table with financial fields
# Derive cash flow from: net_amount, transaction_type, date, category
```

**`data_service.py`** - SQL queries for cash flow analysis
```python
class CashFlowDataService:
    async def get_cash_flow_summary(filters)
    async def get_operating_cash_flow(filters)
    async def get_investment_cash_flow(filters)
    async def get_financing_cash_flow(filters)
    async def get_cash_flow_trends(filters)
    async def get_cash_flow_projection(filters)
```

**`processing_service.py`** - Async business logic
```python
class CashFlowProcessingService:
    async def get_dashboard_data(filters) -> dict
    # Returns: {kpiMetrics, mainData: {trends, operating, investing, financing, projection}, insights}
```

**`sync_processing_service.py`** - Sync wrapper for agent tool
```python
class SyncCashFlowProcessingService:
    def get_dashboard_data(filters) -> dict
    # Sync wrapper using _run_async pattern
```

**`models.py`** - Pydantic response models
```python
class CashFlowKPI(BaseModel)
class CashFlowTrend(BaseModel)
class OperatingCashFlow(BaseModel)
# ... etc
```

#### **1.2 Create API Router** (`apps/adk/api/routers/cash_flow_router.py`)

```python
@router.post("/summary")
async def get_cash_flow_summary(request: FilterRequest):
    service = CashFlowProcessingService()
    return await service.get_dashboard_data(request.dict())
```

**Register in main.py:**
```python
from api.routers import cash_flow_router
app.include_router(cash_flow_router.router, prefix="/api/cash-flow", tags=["cash-flow"])
```

#### **1.3 Create Agent Tool** (`apps/adk/orchestration_agent/tools/cash_flow.py`)

```python
@tool
def analyze_cash_flow(
    time_period: str = "default",
    cash_flow_type: str = "all",  # operating, investing, financing, all
    department: str = None,
    min_amount: float = None
) -> str:
    """Analyze cash flow with metadata-only visualization output"""

    # 1. Parse time_period → filters
    # 2. Call SyncCashFlowProcessingService.get_dashboard_data()
    # 3. Generate text report
    # 4. Add visualization metadata JSON
    # 5. Return with <output> and <is_visualisation>true</is_visualisation> tags
```

#### **1.4 Update COMPONENT_SCHEMA** (`apps/adk/lib/utils.py`)

```python
COMPONENT_SCHEMA = {
    # ... existing
    "cash-flow": {
        "components": [
            "kpis",
            "trends",
            "operating",
            "investing",
            "financing",
            "projection",
            "table"
        ],
        "parameters": {
            "dateFrom": "date",
            "dateTo": "date",
            "cashFlowType": "string",
            "departments": "array",
            "minAmount": "number|null"
        }
    }
}
```

---

### **PHASE 2: Frontend Visualization Components** (4-5 hours)

#### **2.1 Create Component Files** (`apps/frontend/src/app/cash-flow/components/`)

**Create 8 components:**

1. **`CashFlowFilters.tsx`** - Filter controls
   - Date range picker
   - Cash flow type selector (Operating/Investing/Financing/All)
   - Department multi-select
   - Min amount filter

2. **`CashFlowKPIs.tsx`** - KPI tiles using AnimatedKPITile
   - Net Cash Flow
   - Operating CF
   - Investment CF
   - Financing CF
   - Cash Ratio

3. **`CashFlowTrends.tsx`** - Line chart (Chart.js)
   - Monthly trends for all 3 cash flow types
   - Multi-axis chart showing operating, investing, financing

4. **`OperatingCashFlow.tsx`** - Bar chart
   - Revenue collections vs expense payments
   - Breakdown by category

5. **`InvestmentCashFlow.tsx`** - Bar chart
   - Equipment purchases, asset sales, investments
   - Breakdown visualization

6. **`FinancingCashFlow.tsx`** - Bar chart
   - Loan proceeds/payments, dividends
   - Breakdown visualization

7. **`CashFlowProjection.tsx`** - Line chart with forecast
   - Historical + projected cash flow
   - Scenario analysis (optimistic/realistic/pessimistic)

8. **`CashFlowTable.tsx`** - Data table
   - Sortable, searchable transaction list
   - Shows all cash flow items with categories

**Design Pattern:**
```typescript
// Each component follows this structure:
export function ComponentName({ data, loading }: Props) {
  // Loading state
  if (loading) return <Skeleton />;

  // Empty state
  if (!data || data.length === 0) return <EmptyState />;

  // Render visualization
  return (
    <DashboardSection title="...">
      <Chart/Table data={data} options={chartOptions} />
    </DashboardSection>
  );
}
```

#### **2.2 Update Hook to Use Real API** (`hooks/useCashFlowData.ts`)

**Replace mock with:**
```typescript
const response = await fetch('/api/cash-flow/summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(filters)
});
const data = await response.json();
```

---

### **PHASE 3: Layout Integration** (2-3 hours)

#### **3.1 Update Layout** (`layout.tsx`)

**Add AppLayout + Panels:**
```typescript
import { AppLayout, ChatPanel, BusinessIntelligencePanel } from 'components/index';
import { useCashFlowData } from './hooks/useCashFlowData';

function CashFlowLayoutContent() {
  const { insights, kpiMetrics } = useCashFlowData(filters);

  return (
    <AppLayout
      title="Cash Flow Analysis"
      mainContent={<CashFlowFilters + children />}
      chatPanel={isChatOpen ? <ChatPanel .../> : undefined}
      biPanel={isBIOpen ? <BusinessIntelligencePanel insights={insights} kpiMetrics={kpiMetrics} .../> : undefined}
      // ... panel toggle handlers
    />
  );
}
```

#### **3.2 Update Context** (`context.tsx`)

**Add missing state:**
```typescript
interface CashFlowContextType {
  filters: CashFlowFilters;
  setFilters: ...;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: ...;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: ...;
  selectionManager: SelectionManager;
  selectedPoints: SelectedPoint[];
  cashFlowData: any;
  setCashFlowData: ...;
}

// Default filters (2017-2021)
const [filters, setFilters] = useState({
  dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
  cashFlowType: 'all',
  departments: [],
  minAmount: null
});
```

---

### **PHASE 4: Enterprise-IQ Integration** (2 hours)

#### **4.1 Component Registry** (`enterprise-iq/page.tsx`)

```typescript
const componentRegistry = {
  // ... existing
  'cash-flow': {
    kpis: dynamic(() => import('../cash-flow/components').then(mod => mod.CashFlowKPIs)),
    trends: dynamic(() => import('../cash-flow/components').then(mod => mod.CashFlowTrends)),
    operating: dynamic(() => import('../cash-flow/components').then(mod => mod.OperatingCashFlow)),
    investing: dynamic(() => import('../cash-flow/components').then(mod => mod.InvestmentCashFlow)),
    financing: dynamic(() => import('../cash-flow/components').then(mod => mod.FinancingCashFlow)),
    projection: dynamic(() => import('../cash-flow/components').then(mod => mod.CashFlowProjection)),
    table: dynamic(() => import('../cash-flow/components').then(mod => mod.CashFlowTable))
  }
};
```

#### **4.2 Tool API Registry** (`config/toolApiRegistry.ts`)

```typescript
export const toolApiRegistry = {
  // ... existing
  'cash-flow': '/api/cash-flow/summary'
};
```

#### **4.3 Prop Mappers** (`config/componentPropMappers.ts`)

```typescript
export const componentPropMappers = {
  // ... existing
  'cash-flow.kpis': (summary) => ({
    metrics: summary.kpiMetrics || {},
    loading: false
  }),
  'cash-flow.trends': (summary) => ({
    data: summary.mainData?.trends || {},
    loading: false
  }),
  'cash-flow.operating': (summary) => ({
    data: summary.mainData?.operating || {},
    loading: false
  }),
  // ... more mappers for investing, financing, projection, table
};
```

---

### **PHASE 5: Testing & Validation** (2-3 hours)

#### **5.1 Backend Tests**

```bash
# Test tool directly
cd apps/adk
python -c "
from orchestration_agent.tools.cash_flow import analyze_cash_flow
result = analyze_cash_flow('2021')
print(result)
"

# Test API endpoint
curl -X POST http://localhost:8000/api/cash-flow/summary \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2021-01-01", "dateTo": "2021-12-31"}'
```

**Verify:**
- ✅ Returns {kpiMetrics, mainData, insights}
- ✅ All data fields populated
- ✅ No SQL errors

#### **5.2 Frontend Tests**

1. Navigate to `/cash-flow`
2. Verify:
   - ✅ All components render
   - ✅ Charts display data
   - ✅ Table sorting/filtering works
   - ✅ KPIs show correct values
   - ✅ No console errors
   - ✅ Loading states work

#### **5.3 Enterprise-IQ Chat Tests**

Test queries:
```
"Show cash flow for 2021"
"Analyze operating cash flow"
"Show investment activities"
"Project cash flow for next quarter"
```

**Verify:**
- ✅ Robot displays cash flow metrics
- ✅ Components spawn on canvas
- ✅ Numbers match between text and visualizations
- ✅ Filters apply correctly

#### **5.4 BI Panel Test**

1. Open dashboard
2. Click BI Panel icon
3. Verify:
   - ✅ Insights display from API
   - ✅ KPI metrics show
   - ✅ Title is "Decision Intelligence"
   - ✅ Insights categorized correctly

---

## 📋 Implementation Checklist

### Backend ✅
- [ ] Create `apps/adk/domains/cash_flow/` directory
- [ ] Implement `schema.py` with table mappings
- [ ] Implement `data_service.py` with SQL queries
- [ ] Implement `processing_service.py` with business logic
- [ ] Implement `sync_processing_service.py` wrapper
- [ ] Implement `models.py` with Pydantic models
- [ ] Create `apps/adk/api/routers/cash_flow_router.py`
- [ ] Register router in main.py
- [ ] Create `apps/adk/orchestration_agent/tools/cash_flow.py`
- [ ] Update COMPONENT_SCHEMA in `lib/utils.py`

### Frontend Components ✅
- [ ] Create `CashFlowFilters.tsx`
- [ ] Create `CashFlowKPIs.tsx`
- [ ] Create `CashFlowTrends.tsx`
- [ ] Create `OperatingCashFlow.tsx`
- [ ] Create `InvestmentCashFlow.tsx`
- [ ] Create `FinancingCashFlow.tsx`
- [ ] Create `CashFlowProjection.tsx`
- [ ] Create `CashFlowTable.tsx`
- [ ] Update `hooks/useCashFlowData.ts` to call real API

### Layout & Context ✅
- [ ] Update `layout.tsx` with AppLayout + panels
- [ ] Update `context.tsx` with panel states
- [ ] Add filter persistence (localStorage)
- [ ] Integrate BI Panel
- [ ] Integrate Chat Panel

### Enterprise-IQ ✅
- [ ] Add components to `componentRegistry`
- [ ] Add to `toolApiRegistry`
- [ ] Create prop mappers in `componentPropMappers.ts`

### Testing ✅
- [ ] Backend tool test passes
- [ ] API endpoint returns correct data
- [ ] Dashboard renders without errors
- [ ] All visualizations display
- [ ] Chat spawns components
- [ ] Data consistency verified (API = Chat = Dashboard)
- [ ] BI Panel shows insights

---

## 🎨 Key Design Decisions

**Date Range:** Default 2017-2021 (consistent with other dashboards)

**Cash Flow Categories:**
- Operating: Revenue collections, expense payments, taxes
- Investing: Equipment, asset sales, investments
- Financing: Loans, dividends, equity

**Data Source:** Derive from `transactions` table:
- Operating CF: Filter by transaction_type = 'revenue' or 'expense'
- Investing CF: Filter by category = 'equipment', 'assets', 'investments'
- Financing CF: Filter by category = 'loans', 'dividends', 'equity'

**Chart Types:**
- Trends: Multi-line chart (Chart.js)
- Breakdowns: Bar charts (Chart.js)
- Projection: Line chart with forecast bands
- Table: Sortable data table

**Dark Theme:** All charts use muted colors, dark backgrounds

---

## ⏱️ Time Estimates

- **Phase 1 (Backend):** 3-4 hours
- **Phase 2 (Frontend Components):** 4-5 hours
- **Phase 3 (Layout Integration):** 2-3 hours
- **Phase 4 (Enterprise-IQ):** 2 hours
- **Phase 5 (Testing):** 2-3 hours

**Total:** ~13-17 hours

---

## 🔑 Success Criteria

✅ Backend API returns cash flow data from database
✅ All 8 frontend components render correctly
✅ Dashboard loads without errors
✅ Chat agent can spawn cash flow visualizations
✅ BI Panel displays insights
✅ Data consistency: API = Dashboard = Chat (identical numbers)
✅ Filters work correctly
✅ All visualizations use dark theme
✅ Loading and empty states work

---

## 📚 Reference Files

**Backend Pattern:** `apps/adk/domains/sales_performance/`
**Frontend Pattern:** `apps/frontend/src/app/sales-performance/`
**Tool Pattern:** `apps/adk/orchestration_agent/tools/sales_performance.py`
**Registry Pattern:** `apps/frontend/src/app/enterprise-iq/page.tsx`

**Follow these exactly for consistency!**
