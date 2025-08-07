# Sales Domain - Performance Analytics Tools

## Overview

The Sales domain contains 5 core analytical tools plus utility functions designed to provide comprehensive sales performance insights, demand forecasting, and regional analysis capabilities. These tools power the sales intelligence features of the Enterprise IQ platform.

## Available Tools (5 Tools + Utilities)

### 1. **Demand Forecast Engine** (`DemandForecastEngine/`)
Advanced ML-based demand forecasting using ensemble methods.
- **Key Features**: Multi-model forecasting (Random Forest, XGBoost), seasonality detection, pattern analysis
- **Forecasting Periods**: Monthly, quarterly, yearly
- **Visualizations**: Forecast trends, confidence intervals, pattern breakdown

### 2. **Product Performance Analyzer** (`ProductPerformanceAnalyzer/`)
Comprehensive product performance metrics and analysis.
- **Key Features**: Sales metrics, margin analysis, price band distribution, growth tracking
- **Metrics**: Revenue, units sold, average order value, margin percentage
- **Visualizations**: Sales explorer, margin analysis, price distribution, growth matrix

### 3. **Regional Sales Analyzer** (`RegionalSalesAnalyzer/`)
Multi-dimensional regional sales analysis and comparison.
- **Key Features**: Regional performance, comparative analysis, geographic insights
- **Dimensions**: Region, state, city level analysis
- **Visualizations**: Regional maps, performance grids, comparison charts

### 4. **Sales Performance Analyzer** (`SalesPerformanceAnalyzer/`)
Overall sales performance analysis across multiple dimensions.
- **Key Features**: Multi-dimensional analysis, period comparisons, correlation analysis
- **Dimensions**: Product, category, channel, region, customer, time
- **Visualizations**: Performance overview, time series, distribution analyzer, correlation matrix

### 5. **Sales Trend Analyzer** (`SalesTrendAnalyzer/`)
Identifies and analyzes sales trends with forecasting capabilities.
- **Key Features**: Trend detection, seasonal patterns, growth analysis
- **Time Periods**: Daily, weekly, monthly, quarterly, annual
- **Visualizations**: Trend charts, seasonal decomposition, top performers

### 6. **Performance Utils** (`performance_utils/`)
Shared utility functions for performance calculations.
- **Features**: Common metrics, calculation helpers, data transformations
- **Usage**: Imported by other sales tools for consistent calculations

## Directory Structure

```
Sales/
├── database/                    # Sales database and utilities
│   ├── sales_agent.db         # SQLite sales database
│   ├── column_mapping.py      # Database column mappings
│   ├── connection.py          # Database connection manager
│   ├── query_templates.py     # SQL query templates
│   └── config.py             # Database configuration
├── tools/                      # Individual analytical tools
│   ├── DemandForecastEngine/
│   ├── ProductPerformanceAnalyzer/
│   ├── RegionalSalesAnalyzer/
│   ├── SalesPerformanceAnalyzer/
│   ├── SalesTrendAnalyzer/
│   └── performance_utils/
└── __init__.py
```

## Database Schema

The `sales_agent.db` SQLite database contains:
- **sales_transactions**: Transaction details and line items
- **products**: Product catalog with categories and subcategories
- **regions**: Geographic hierarchy (region, state, city)
- **channels**: Sales channel definitions
- **customers**: Customer information linked to sales

## Tool Structure

Each tool follows the standard pattern:
```
{ToolName}/
├── {ToolName}.py                # Python analytical logic
├── Spec_UI_{ToolName}.md        # UI specification document
├── tests/                       # Python unit tests
│   └── test_{ToolName}.py
├── ui/                          # React/TypeScript frontend
│   ├── api/                     # API integration
│   ├── components/              # UI components
│   │   ├── visualizations/     # Chart components
│   │   └── kpi/                # KPI tiles
│   ├── state/                   # Redux slices (if used)
│   ├── types/                   # TypeScript definitions
│   └── views/                   # Main dashboard view
├── api/                         # Additional API files
└── database/                    # SQL queries
```

## API Endpoints

### Standard Pattern
- **Endpoint**: `/api/sales/{tool-name}`
- **Method**: POST
- **Request Format**:
  ```json
  {
    "filters": {
      "start_date": "2023-01-01",
      "end_date": "2023-12-31",
      "dimension": "product",
      "metric": "revenue",
      "categories": ["all"]
    }
  }
  ```

### Tool-Specific Endpoints
- `/api/sales/product-performance` - Product performance data
- `/api/sales/categories` - Category list
- `/api/sales/subcategories` - Subcategory list

## Python Tool Pattern

```python
def analyze_sales_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    dimension: str = "product",
    metric: str = "revenue",
    top_n: int = 10
) -> Dict:
    """
    Analyzes sales performance across dimensions.
    
    Args:
        start_date: Analysis start date
        end_date: Analysis end date
        dimension: Analysis dimension
        metric: Performance metric
        top_n: Number of top items
    
    Returns:
        Dict containing:
        - status: 'success' or 'error'
        - data: Analysis results
        - summary: Text summary
        - insights: Key findings
        - visualization: Plotly figure JSON
    """
```

## Frontend Components

### Common Visualizations
- **Sales Performance Explorer**: Interactive multi-metric explorer
- **Margin Analysis Visualizer**: Profit margin analysis
- **Price Band Distribution**: Price segmentation analysis
- **Product Growth Matrix**: Growth vs performance quadrant
- **Performance Overview**: Comprehensive KPI dashboard
- **Time Series Explorer**: Temporal analysis tools

### State Management
Tools with Redux integration:
- `ProductPerformanceAnalyzer` - productPerformanceSlice
- `SalesPerformanceAnalyzer` - salesPerformanceSlice

## Tool Registration System

The Sales Analyst Agent uses priority-based tool registration:
```python
# Highest priority
- Product performance analysis
# Medium priority  
- Sales performance and trends
# Lowest priority
- Demand forecasting
```

## Integration with ADK

All tools are integrated with the ADK Sales Analyst Agent:
1. Tools imported in `/apps/adk/orchestration_agent/tools/sales_analyst/`
2. Registered with priority system
3. Available for AI-driven analysis
4. Support voice interface optimization

## Testing

### Python Tests
```bash
cd tools/{ToolName}
pytest tests/test_{ToolName}.py
```

### Integration Tests
```bash
cd tools/sales_analyst/tests
pytest test_sales_analysis.py
```

## Development Guidelines

### Adding New Sales Tools
1. Follow the standard tool structure
2. Implement Python analytical logic with proper error handling
3. Create comprehensive UI specification
4. Build React components with TypeScript
5. Create API endpoint following the pattern
6. Register with Sales Analyst Agent
7. Add to component registry in main app

### Best Practices
- Use `performance_utils` for common calculations
- Leverage database query templates
- Implement caching for expensive operations
- Include comprehensive unit tests
- Use TypeScript for frontend type safety
- Follow existing visualization patterns

## Performance Optimization

- Query optimization with proper indexes
- Result caching for frequently accessed data
- Pagination for large result sets
- Lazy loading for visualizations
- Memoization in React components

## Utility Functions

### performance_utils
Common functions available:
- `calculate_growth_rate()`
- `calculate_moving_average()`
- `calculate_seasonality_index()`
- `aggregate_by_dimension()`
- `normalize_metrics()`

## Visualization Utils

### visualization_utils.py
Helper functions for creating consistent visualizations:
- `create_time_series_plot()`
- `create_distribution_plot()`
- `create_correlation_matrix()`
- `apply_theme()` - Consistent theming

## Related Documentation

- [Web Application](../README.md)
- [Sales Performance README](./tools/SalesPerformanceAnalyzer/README_DATABASE_INTEGRATION.md)
- [Sales Trend README](./tools/SalesTrendAnalyzer/README.md)
- [ADK Sales Agent](../../adk/orchestration_agent/tools/sales_analyst/README.md)
- [Main AI Documentation](../../../AI_DOCS.md)