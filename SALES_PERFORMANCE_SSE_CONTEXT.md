# Sales Performance SSE ↔ Dashboard Data Consistency - Context Document

## Project Overview

**Goal**: Ensure Enterprise-IQ's `/run_sse` endpoint returns identical sales metrics to what users see on the Sales Performance Dashboard when the same filters are applied.

**Critical Requirement**:
```
User Query: "Show sales for 2021 in USA"
SSE Response: "Total Revenue: $11,134,978.65"
Dashboard Display: "$11,134,978.65" (when filtered to 2021 + USA)
✅ MUST BE IDENTICAL
```

---

## Architecture Overview

### **Data Flow - Dashboard Path**
```
User opens /sales-performance
           ↓
Frontend calls: POST /api/sales-performance/summary
           ↓
Backend: SalesPerformanceProcessingService.get_dashboard_data(filters)
           ↓
Returns: { kpiMetrics: {...}, mainData: {...} }
           ↓
Frontend displays: Charts + KPIs
```

### **Data Flow - SSE Path (Enterprise-IQ)**
```
User query: "Show sales for 2021 in USA"
           ↓
POST /run_sse → Orchestration Agent → Sales Agent
           ↓
Sales Agent should call: analyze_sales_performance_unified(time_period="2021", region="United States")
           ↓
Tool: SyncSalesPerformanceProcessingService.get_dashboard_data(filters)
           ↓
Returns: Text report + Visualization metadata
           ↓
SSE streams:
  data: {"text": "Total Revenue: $11,134,978.65..."}
  data: {"visualisation": [{"toolname": "sales-performance", "body": {filters}}]}
           ↓
Frontend:
  - Robot displays text
  - Canvas spawns component with same filters
  - Component calls /api/sales-performance/summary
  - Shows same numbers
```

**Key Point**: Both paths MUST use the same backend processing service to guarantee identical data.

---

## Current Implementation Status

### ✅ **Completed**
1. **Sales Performance Dashboard** (`/sales-performance`)
   - Backend: `/api/sales-performance/summary` endpoint
   - Returns: `{ kpiMetrics, mainData: { productPerformance, regionPerformance, salesTrends, ... } }`
   - Uses: `SalesPerformanceProcessingService.get_dashboard_data()`

2. **Enterprise-IQ Integration** (`/enterprise-iq`)
   - Frontend canvas system for spawning visualizations
   - toolApiRegistry: Maps `sales-performance` → `/api/sales-performance/summary`
   - componentPropMappers: Transforms API response → component props
   - ComponentRegistry: Maps component names → React components

3. **Component Mappings**
   - Full names: `kpis`, `performanceOverview`, `timeSeriesExplorer`, etc.
   - Short aliases: `overview`, `timeSeries`, `distribution` (for agent compatibility)

4. **Orchestration Agent Tool** (`apps/adk/orchestration_agent/tools/sales_performance.py`)
   - Function: `analyze_sales_performance()`
   - Uses: `SyncSalesPerformanceProcessingService` (sync wrapper)
   - Returns: Formatted text report
   - **RECENTLY ADDED**: Visualization metadata JSON

5. **Agent Prompt Updates** (`apps/adk/orchestration_agent/prompt.py`)
   - SALES_INSTR includes tool execution protocol
   - Data consistency requirements documented

### ⚠️ **Needs Verification**
- Does sales agent actually CALL the tool when prompted?
- Are metrics in SSE text accurate and matching dashboard?
- Does visualization metadata spawn components correctly?

---

## Known Data Points (2021)

### **Baseline Metrics from Summary API**

**Full Year 2021**:
```json
{
  "totalRevenue": 18287538.3261,
  "totalUnits": 24515,
  "uniqueCustomers": 1637
}
```

**2021 + USA Region Filter**:
```json
{
  "totalRevenue": 11134978.6518,
  "totalUnits": 14824,
  "uniqueCustomers": 986
}
```

**These are the GROUND TRUTH values** - SSE must return exactly these numbers when same filters applied.

---

## File Locations

### **Backend**
```
apps/adk/
├── api/routers/sales_performance_router.py          # /api/sales-performance/summary endpoint
├── domains/sales_performance/
│   ├── processing_service.py                        # Async service (dashboard uses this)
│   ├── sync_processing_service.py                   # Sync wrapper (agent tool uses this)
│   ├── data_service.py                              # Database queries
│   └── schema.py                                    # Column mappings
├── orchestration_agent/
│   ├── agent.py                                     # Agent definitions
│   ├── prompt.py                                    # SALES_INSTR, CUSTOMER_INSTR, etc.
│   └── tools/
│       └── sales_performance.py                     # analyze_sales_performance() tool
```

### **Frontend**
```
apps/frontend/src/app/
├── sales-performance/
│   ├── page.tsx                                     # Dashboard page
│   └── components/                                  # SalesKPIs, PerformanceOverview, etc.
└── enterprise-iq/
    ├── page.tsx                                     # Canvas page + component registry
    ├── config/
    │   ├── toolApiRegistry.ts                       # Maps toolname → API endpoint
    │   ├── componentPropMappers.ts                  # Maps API response → props
    │   ├── normalizeMetadata.ts                     # Normalizes filters
    │   └── ComponentRegistry.tsx                    # Component imports
    └── services/
        └── aiClient.ts                              # SSE communication
```

### **Server**
```
apps/server/main.py                                  # /run_sse proxy endpoint
```

---

## Critical Code Sections

### **1. Sales Performance Tool** (`sales_performance.py`)

**Key Function**:
```python
def analyze_sales_performance(
    time_period: str = "default",
    region: Optional[str] = None,
    category: Optional[str] = None,
    product: Optional[str] = None
) -> str:
```

**What it does**:
1. Parses `time_period` (e.g., "2021", "Q1 2021", "last_30_days")
2. Builds filters: `{"dateRange": {"startDate": "...", "endDate": "..."}, "region": [...]}`
3. Calls `SyncSalesPerformanceProcessingService.get_dashboard_data(filters)`
4. Formats results as markdown report
5. **MUST include**: Visualization metadata JSON

**Expected Output Structure**:
```markdown
# Sales Performance Analysis Report

## Key Performance Indicators
- **Total Revenue**: $18,287,538.33
- **Total Units Sold**: 24,515
...

## Visualization Data (Machine-Readable)
```json
{
  "toolname": "sales-performance",
  "componentName": "overview",
  "body": {
    "dateFrom": "2021-01-01",
    "dateTo": "2021-12-31"
  }
}
```
```

---

### **2. Sales Agent Prompt** (`prompt.py` - SALES_INSTR)

**Critical Instructions**:
```
**YOU MUST ALWAYS CALL THE APPROPRIATE TOOL** for every sales query:
1. For sales performance: Call analyze_sales_performance_unified() with extracted parameters
2. ALWAYS extract time period, region, category, product from user query
3. ALWAYS pass these as function arguments
4. ALWAYS include the FULL tool output in your response

**Data Consistency Requirement**:
- The tool uses the SAME backend processing service as the Sales Performance Dashboard
- Total Revenue, Units, Customers - ALL numbers must be identical
```

**Response Format**:
```
<output>
Here's your sales analysis for 2021:

**Key Metrics:**
- Total Revenue: $18,287,538.33
- Total Units: 24,515

[Full tool output with visualization metadata]
</output><is_visualisation>true</is_visualisation>
```

---

### **3. Prop Mapper** (`componentPropMappers.ts`)

**Maps backend response to component props**:
```typescript
'sales-performance.overview': (summary) => {
  const data = summary.mainData?.productPerformance || [];
  return {
    data: data,
    loading: false,
    selectedDimension: summary.dimension || 'product',
    selectedMetric: summary.metric || 'revenue'
  };
}
```

**Backend Structure**:
```json
{
  "kpiMetrics": { totalRevenue, totalUnits, ... },
  "mainData": {
    "productPerformance": [...],
    "salesTrends": [...],
    "regionPerformance": [...]
  }
}
```

---

## Common Issues & Solutions

### **Issue 1: Agent Doesn't Call Tool**
**Symptoms**: SSE returns "I will analyze..." but no actual metrics

**Root Cause**: Prompt not forcing tool execution

**Solution**: Strengthen SALES_INSTR prompt with explicit instructions

**Verification**: Check logs for "Calling tool: analyze_sales_performance_unified"

---

### **Issue 2: Metrics Don't Match**
**Symptoms**: SSE shows $X, dashboard shows $Y (different numbers)

**Root Cause**: Using different data sources or filters not applied correctly

**Solution**:
1. Verify both use same backend service
2. Check filter extraction in agent
3. Verify metadata includes correct filters

**Verification**: Compare summary API response to tool output with same filters

---

### **Issue 3: Components Don't Spawn**
**Symptoms**: Robot shows text but canvas remains empty

**Root Cause**: Visualization metadata missing or malformed

**Solution**:
1. Ensure tool outputs JSON in correct format
2. Verify componentName matches ComponentRegistry keys
3. Check browser console for errors

**Verification**: Check SSE stream for `visualisation` data

---

### **Issue 4: Filter Extraction Wrong**
**Symptoms**: User asks for "USA" but gets full dataset

**Root Cause**: Agent not extracting region from query

**Solution**: Add extraction examples to prompt

**Verification**: Check visualization metadata `body` contains `"regions": ["United States"]`

---

## Testing Checklist

### **Backend Tests**
- [ ] Tool executes directly: `python -c "from orchestration_agent.tools.sales_performance import analyze_sales_performance; print(analyze_sales_performance('2021'))"`
- [ ] Returns formatted report with metrics
- [ ] Includes visualization metadata JSON
- [ ] Metrics match summary API baseline

### **SSE Tests**
- [ ] Query "Show sales for 2021" returns metrics in text
- [ ] Text shows: "Total Revenue: $18,287,538.33"
- [ ] Includes visualization metadata
- [ ] `is_visualisation` set to true
- [ ] Filtered query (2021 + USA) returns $11,134,978.65

### **Frontend Tests**
- [ ] Robot displays text with metrics
- [ ] Component spawns on canvas
- [ ] Component shows same numbers as robot text
- [ ] No console errors

### **Data Consistency Audit**
- [ ] Create comparison table:
  | Scenario | Summary API | SSE Text | Dashboard |
  |----------|-------------|----------|-----------|
  | 2021 Full | $18,287,538 | ? | ? |
  | 2021+USA | $11,134,978 | ? | ? |

- [ ] All columns match

---

## Environment Info

**Ports**:
- Frontend: `http://localhost:3000`
- Backend (ADK): `http://localhost:8000`
- Server (Proxy): `http://localhost:8001`
- Agent Framework: `http://localhost:8002`

**Database**: SQLite at `apps/adk/orchestration_agent/database/customers.db`

**Model**: Configured via env vars (gemini-2.5-flash / groq / cerebras)

---

## Key Commands

### **Test Summary API**:
```bash
curl -X POST http://localhost:8000/api/sales-performance/summary \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2021-01-01", "dateTo": "2021-12-31"}'
```

### **Test SSE Endpoint**:
```bash
curl -X POST http://localhost:8000/run_sse \
  -H "Content-Type: application/json" \
  -d '{
    "user_query": "Show me sales performance for 2021",
    "session_id": "test-123",
    "user_id": "test-user",
    "app_name": "orchestration_agent",
    "is_canvas": true
  }'
```

### **Test Tool Directly**:
```bash
cd apps/adk
python -c "
from orchestration_agent.tools.sales_performance import analyze_sales_performance
result = analyze_sales_performance(time_period='2021', region='United States')
print(result)
"
```

### **Check Backend Logs**:
```bash
# In backend container/terminal
tail -f logs/backend.log | grep -E "sales|tool|agent"
```

---

## Success Criteria

**MUST HAVE**:
✅ Agent calls tool for every sales query
✅ Tool returns metrics in text (not just "I will analyze...")
✅ Tool includes visualization metadata JSON
✅ SSE metrics = Summary API metrics (identical numbers)
✅ Components spawn on Enterprise-IQ canvas
✅ Dashboard shows same numbers as SSE text
✅ Filters work: 2021+USA returns filtered data ($11M not $18M)

**VALIDATION**: Create side-by-side comparison showing SSE text and dashboard display with identical numbers.

---

## Next Steps for New Context

1. **Read this document thoroughly**
2. **Review current implementation** in files listed above
3. **Run baseline tests** (Summary API for 2021 full & filtered)
4. **Test SSE endpoint** with various queries
5. **Compare results** and document any discrepancies
6. **Implement fixes** based on testing findings
7. **Verify data consistency** across all scenarios

---

## Questions to Answer

- [ ] Does the agent actually call `analyze_sales_performance_unified()` when asked about sales?
- [ ] Does the tool output include metrics in text format?
- [ ] Does the tool output include visualization metadata JSON?
- [ ] Do the metrics in SSE text match the summary API exactly?
- [ ] Do components spawn when visualization metadata is present?
- [ ] Do components display the same metrics as shown in SSE text?
- [ ] Do filters work correctly (USA filter reduces totals)?

**Answer these by running the testing plan and documenting results.**

---

## Contact Points for Issues

- **Sales Performance Tool**: `apps/adk/orchestration_agent/tools/sales_performance.py`
- **Agent Prompt**: `apps/adk/orchestration_agent/prompt.py` (SALES_INSTR section)
- **Component Registry**: `apps/frontend/src/app/enterprise-iq/components/Canvas/ComponentRegistry.tsx`
- **Prop Mappers**: `apps/frontend/src/app/enterprise-iq/config/componentPropMappers.ts`
- **API Endpoint**: `apps/adk/api/routers/sales_performance_router.py`

**When in doubt**: Compare to how churn prediction works - it's a fully functional reference implementation.

---

## Data Integrity Promise

**"The AI assistant will NEVER give different numbers than what appears on dashboards."**

This is the fundamental guarantee we must uphold. Any variance breaks user trust.

**Implementation**: Both SSE and dashboards call the same `SalesPerformanceProcessingService.get_dashboard_data()` method with identical filters, ensuring mathematical impossibility of different results.
