# Inventory Domain - Management & Optimization Tools

## Overview

The Inventory domain contains 5 specialized tools designed to optimize inventory operations, minimize costs, and ensure adequate stock levels. These tools provide comprehensive inventory analytics and optimization recommendations for the Enterprise IQ platform.

## Available Tools (5 Total)

### 1. **Inventory Holding Cost Analyzer** (`InventoryHoldingCostAnalyzer/`)
Analyzes the total cost of holding inventory including opportunity costs.
- **Key Features**: Cost breakdown, opportunity cost analysis, category filtering
- **Default Parameters**: 25% annual holding cost, 8% opportunity cost rate
- **Visualizations**: Cost distribution, category breakdown, trend analysis

### 2. **Inventory Level Analyzer** (`InventoryLevelAnalyzer/`)
Monitors and analyzes current inventory levels across products and warehouses.
- **Key Features**: Stock level monitoring, stockout risk assessment, reorder alerts
- **Default Parameters**: 10% minimum stock threshold
- **Visualizations**: Stock level dashboard, risk heatmap, warehouse distribution

### 3. **Inventory Optimization Analyzer** (`InventoryOptimizationAnalyzer/`)
Provides comprehensive inventory optimization recommendations.
- **Key Features**: EOQ calculations, safety stock optimization, ABC analysis
- **Integration**: Combines insights from all other inventory tools
- **Visualizations**: Optimization matrix, savings potential, recommendation dashboard

### 4. **Slow Moving Inventory Analyzer** (`SlowMovingInventoryAnalyzer/`)
Identifies slow-moving and obsolete inventory items.
- **Key Features**: Turnover analysis, aging analysis, disposal recommendations
- **Default Parameters**: 180 days aging threshold, 1.0 turnover threshold
- **Visualizations**: Aging distribution, turnover scatter plot, disposal priority list

### 5. **Stock Optimization Recommender** (`StockOptimizationRecommender/`)
Generates specific stock level recommendations using advanced algorithms.
- **Key Features**: EOQ calculations, reorder point optimization, safety stock levels
- **Default Parameters**: 95% service level
- **Visualizations**: Optimization curves, reorder timeline, cost-service tradeoff

## Directory Structure

```
Inventory/
├── database/                         # Inventory database
│   └── readme.md                    # Database documentation
├── tools/                           # Individual analytical tools
│   ├── InventoryHoldingCostAnalyzer/
│   ├── InventoryLevelAnalyzer/
│   ├── InventoryOptimizationAnalyzer/
│   ├── SlowMovingInventoryAnalyzer/
│   └── StockOptimizationRecommender/
└── README.md                        # This file
```

## Tool Structure

Each tool follows the standard pattern:
```
{ToolName}/
├── {ToolName}.py                    # Python analytical logic
├── Spec_UI_{ToolName}.md           # UI specification document
├── tests/                          # Python unit tests
│   └── test_{ToolName}.py
├── ui/                             # React/TypeScript frontend
│   ├── api/                        # API integration
│   │   └── functionCalls.ts
│   ├── components/                 # UI components
│   │   ├── visualizations/        # Chart components
│   │   └── kpi/                   # KPI tiles
│   ├── types/                      # TypeScript definitions
│   │   └── index.ts
│   └── views/                      # Main dashboard view
├── api/                            # Additional API files
│   └── data.api.js
└── database/                       # SQL queries
    └── queries.js
```

## Database Schema

The inventory system uses `inventory.db` SQLite database containing:
- **products**: Product master data with SKUs
- **inventory_levels**: Current stock levels by warehouse
- **inventory_movements**: Stock movements and transactions
- **warehouses**: Warehouse locations and capacities
- **costs**: Holding costs, ordering costs, and other financial data

## Default Parameters

All inventory tools use industry-standard defaults:
```python
DEFAULT_PARAMS = {
    'service_level': 0.95,        # 95% service level
    'holding_cost_rate': 0.25,    # 25% annual holding cost
    'opportunity_cost_rate': 0.08, # 8% opportunity cost
    'aging_threshold': 180,        # 180 days for slow-moving
    'turnover_threshold': 1.0,     # Minimum 1x annual turnover
    'min_stock_threshold': 0.1     # 10% minimum stock level
}
```

## API Endpoints

### Standard Pattern
- **Endpoint**: `/api/inventory-{tool-name}/data`
- **Method**: POST
- **Request Format**:
  ```json
  {
    "filters": {
      "start_date": "2023-01-01",
      "end_date": "2023-12-31",
      "warehouse": "all",
      "category": "all",
      "service_level": 0.95
    }
  }
  ```

### Available Endpoints
- `/api/inventory-holding-cost-analyzer/data`
- `/api/inventory-level-analyzer/data`

## Python Tool Pattern

```python
def analyze_inventory_levels(
    warehouse: Optional[str] = None,
    category: Optional[str] = None,
    min_stock_threshold: float = 0.1
) -> Dict:
    """
    Analyzes current inventory levels and identifies risks.
    
    Args:
        warehouse: Specific warehouse or 'all'
        category: Product category or 'all'
        min_stock_threshold: Minimum stock level (default 10%)
    
    Returns:
        Dict containing:
        - status: 'success' or 'error'
        - data: Analysis results
        - summary: Text summary
        - insights: Key findings
        - recommendations: Action items
    """
```

## Integration with ADK

All tools are integrated with the Inventory Manager Agent:
1. Tools imported in `/apps/adk/orchestration_agent/tools/inventory_manager/`
2. Registered with Inventory Manager Agent
3. Support automatic parameter defaults
4. Available for AI-driven optimization

## Key Algorithms

### Economic Order Quantity (EOQ)
```python
EOQ = sqrt((2 * annual_demand * ordering_cost) / holding_cost)
```

### Safety Stock Calculation
```python
safety_stock = z_score * sqrt(lead_time) * demand_std_dev
```

### Reorder Point
```python
reorder_point = (average_daily_demand * lead_time) + safety_stock
```

## Frontend Components

### Common Visualizations
- **Holding Cost Dashboard**: Cost breakdown and trends
- **Inventory Level Dashboard**: Stock status overview
- **Optimization Matrix**: Multi-criteria optimization view
- **Aging Analysis**: Slow-moving inventory identification
- **Reorder Timeline**: Visual reorder scheduling

### KPI Tiles
Standard metrics displayed:
- Total inventory value
- Holding cost percentage
- Stockout risk score
- Inventory turnover ratio
- Service level achievement

## Testing

### Python Tests
```bash
cd tools/{ToolName}
pytest tests/test_{ToolName}.py
```

### Frontend Tests
```bash
npm test -- --testPathPattern=Inventory
```

## Development Guidelines

### Adding New Inventory Tools
1. Create tool directory following the structure
2. Implement Python logic with optimization algorithms
3. Use default parameters from configuration
4. Create comprehensive UI specification
5. Build React components with TypeScript
6. Create API endpoint
7. Register with Inventory Manager Agent
8. Add to component registry

### Best Practices
- Always use industry-standard default parameters
- Implement comprehensive error handling
- Include sensitivity analysis in optimizations
- Provide actionable recommendations
- Use consistent cost calculation methods
- Document assumptions clearly

## Performance Optimization

- Query optimization for large inventory databases
- Caching for complex calculations (EOQ, safety stock)
- Batch processing for bulk recommendations
- Incremental updates for real-time monitoring
- Parallel processing for multi-warehouse analysis

## Cost Calculations

### Holding Cost Components
1. Storage costs (warehouse space)
2. Capital costs (tied-up capital)
3. Service costs (insurance, taxes)
4. Risk costs (obsolescence, damage)

### Total Cost Optimization
```
Total Cost = Ordering Cost + Holding Cost + Stockout Cost
```

## Integration Points

### With Sales Domain
- Demand data for forecasting
- Sales velocity for turnover calculations

### With Finance Domain
- Cost of capital for opportunity cost
- Budget constraints for optimization

### With Customer Domain
- Service level requirements
- Customer priority for allocation

## Related Documentation

- [Web Application](../README.md)
- [Inventory Database](./database/readme.md)
- [ADK Inventory Manager](../../adk/orchestration_agent/tools/inventory_manager/)
- [Main AI Documentation](../../../AI_DOCS.md)