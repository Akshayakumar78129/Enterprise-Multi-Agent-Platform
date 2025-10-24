# Regional Sales Analyzer Domain

## Overview
This domain provides regional sales analysis capabilities, allowing analysis of sales performance across different geographic regions (countries and states).

## Files Created

### 1. `schema.py`
Defines the database schema using the base schema pattern:
- **TRANSACTION** table schema with sales transaction columns
- **CUSTOMER** table schema with geographic information (country, state)
- Uses bracket notation for SQLite column names: `[Txn Date]`, `[Customer Country]`, etc.

### 2. `models.py`
Pydantic models for data validation and API contracts:
- `RegionalFilters` - Filter parameters for API requests
- `RegionalKPI` - Key performance indicators
- `RegionPerformance` - Detailed regional performance data
- `CountryPerformance` - Country-level aggregated data
- `TimeSeries` - Time series data for trends
- `OpportunityRegion` - BCG matrix-based opportunity analysis
- `TopRegion` - Top performing regions
- `RegionalSalesResponse` - Complete API response model

### 3. `data_service.py`
Database access layer with SQL queries migrated from legacy `queries.js`:
- `get_regional_sales_data()` - Regional sales grouped by country and state
- `get_country_level_data()` - Country-level aggregated metrics
- `get_time_series_data()` - Time series with configurable aggregation (day/week/month/quarter)
- `get_regional_summary()` - Summary statistics and KPIs
- `get_top_regions()` - Top 5 performing regions
- `get_opportunity_analysis()` - BCG matrix analysis (Star Region, Growth Opportunity, Cash Cow, Focus Area)
- `get_available_regions()` - Available countries and states for filters

### 4. `processing_service.py`
Business logic layer that orchestrates data fetching and processing:
- `get_dashboard_data()` - Main method that aggregates all dashboard data
- `_get_kpis()` - Calculates KPIs with growth rate comparison
- `_get_regional_performance()` - Processes regional data
- `_get_country_performance()` - Processes country-level data
- `_get_time_series()` - Processes time series data
- `_get_opportunities()` - Processes opportunity analysis
- `_get_top_regions()` - Gets top performing regions
- `_generate_insights()` - Generates AI-like insights based on data patterns
- Includes dashboard caching for performance

### 5. `__init__.py`
Module initialization file

## API Router

### File: `api/routers/regional_sales_analyzer_router.py`
FastAPI router exposing HTTP endpoints:

#### Endpoints:
1. **POST `/api/regional-sales-analyzer/summary`**
   - Main dashboard endpoint
   - Accepts filters: `dateFrom`, `dateTo`, `countries`, `states`, `aggregation`
   - Returns complete dashboard data with KPIs, regional performance, time series, opportunities, and insights

2. **GET `/api/regional-sales-analyzer/filter-options`**
   - Returns available filter options (countries and states)
   - Used to populate filter dropdowns in the UI

## SQL Queries Migrated

All SQL queries from `apps/web/Sales/tools/RegionalSalesAnalyzer/database/queries.js` have been migrated:

✅ `getRegionalSalesData()` → `get_regional_sales_data()`
✅ `getCountryLevelData()` → `get_country_level_data()`
✅ `getTimeSeriesData()` → `get_time_series_data()`
✅ `getRegionalKPIs()` → `get_regional_summary()`
✅ `getOpportunityAnalysis()` → `get_opportunity_analysis()`
✅ `getRegionalComparison()` → Integrated into `get_regional_sales_data()`
✅ `getAvailableRegions()` → `get_available_regions()`

## Key Features

1. **Geographic Analysis**
   - Country-level aggregation
   - State/Province-level details
   - Multi-level geographic hierarchy

2. **Time Series Analysis**
   - Flexible aggregation (day, week, month, quarter)
   - Trend analysis over time
   - Period-over-period comparison

3. **Opportunity Analysis**
   - BCG Matrix categorization:
     - **Star Region**: High sales, high customers
     - **Growth Opportunity**: Low sales, high customers
     - **Cash Cow**: High sales, low customers
     - **Focus Area**: Low sales, low customers
   - Sales vs average benchmark
   - Customer count vs average benchmark

4. **KPI Metrics**
   - Total sales and net sales
   - Gross profit and profit margin
   - Customer count and transaction count
   - Average transaction value
   - Growth rate (period-over-period)
   - Geographic diversity (country and state counts)

5. **AI Insights**
   - Growth rate analysis (positive/warning)
   - Profit margin evaluation
   - Top performing region identification
   - Opportunity region identification
   - Geographic diversity insights

## Usage Example

```python
from domains.regional_sales_analyzer.processing_service import RegionalSalesAnalyzerProcessingService

service = RegionalSalesAnalyzerProcessingService()

# Get dashboard data with filters
result = await service.get_dashboard_data({
    'dateFrom': '2024-01-01',
    'dateTo': '2024-12-31',
    'countries': ['USA', 'Canada'],
    'aggregation': 'month'
})

print(result['kpiMetrics'])
print(result['mainData']['regionalPerformance'])
print(result['insights'])
```

## API Request Example

```bash
curl -X POST http://localhost:8000/api/regional-sales-analyzer/summary \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "countries": ["USA"],
    "states": [],
    "aggregation": "month"
  }'
```

## Response Structure

```json
{
  "kpiMetrics": {
    "totalSales": 1250000.0,
    "netSales": 1200000.0,
    "grossProfit": 450000.0,
    "profitMargin": 36.0,
    "countryCount": 5,
    "stateCount": 25,
    "customerCount": 340,
    "transactionCount": 1520,
    "avgTransactionValue": 735.29,
    "growthRate": 12.5
  },
  "mainData": {
    "regionalPerformance": [...],
    "countryPerformance": [...],
    "timeSeries": [...],
    "opportunities": [...],
    "topRegions": [...]
  },
  "insights": [
    {
      "type": "positive",
      "message": "Regional sales growing strongly at 12.5%"
    },
    {
      "type": "positive",
      "message": "Excellent profit margin of 36.0%"
    }
  ],
  "metadata": {
    "filtersApplied": {...},
    "timestamp": "2025-10-12T15:30:00"
  }
}
```

## Integration in main.py

The router is registered in `apps/adk/main.py`:

```python
from api.routers.regional_sales_analyzer_router import router as regional_sales_analyzer_router

app.include_router(regional_sales_analyzer_router)
```

## Caching

Dashboard data is cached using the `@cache_dashboard_endpoint` decorator with a 5-minute TTL to improve performance.

## Database

Uses the same SQLite database as sales performance:
- **Database**: `orchestration_agent/database/sales_agent.db`
- **Tables**: `dbo_F_Sales_Transaction`, `dbo_D_Customer`

## Next Steps

For frontend implementation:
1. Create `/apps/frontend/src/app/regional-sales-analyzer/` directory
2. Create API service client (similar to `salesPerformanceService.ts`)
3. Create dashboard components (KPIs, maps, charts)
4. Create context and hooks for state management
5. Register route in Next.js app router
