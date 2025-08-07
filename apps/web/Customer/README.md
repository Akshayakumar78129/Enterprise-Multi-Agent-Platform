# Customer Domain - Analytics Tools

## Overview

The Customer domain contains 12 sophisticated analytical tools designed to provide deep insights into customer behavior, segmentation, lifetime value, and engagement patterns. These tools power the customer intelligence capabilities of the Enterprise IQ platform.

## Available Tools (12 Total)

### 1. **Anomaly Detection** (`anomaly_detection/`)
Detects unusual patterns and outliers in customer behavior using Isolation Forest algorithms.
- **Key Features**: Severity scoring, feature contribution analysis, real-time detection
- **Visualizations**: Severity distribution, anomaly tables, feature plots

### 2. **Churn Prediction** (`churn_prediction/`)
Predicts customer churn likelihood using machine learning models.
- **Key Features**: Risk scoring, feature importance, temporal patterns
- **Visualizations**: Risk pyramid, probability histogram, segment matrix

### 3. **Customer Behaviour** (`customer_behaviour/`)
Comprehensive analysis of customer behavior patterns across channels and categories.
- **Key Features**: Pattern detection, channel analysis, category preferences
- **Visualizations**: Pattern radar chart, category treemap, channel donut

### 4. **Customer Lifetime Value** (`customer_lifetime_value/`)
Calculates and predicts customer lifetime value using advanced predictive models.
- **Key Features**: LTV prediction, accuracy tracking, geographic analysis
- **Visualizations**: LTV distribution, prediction accuracy, geographic value map

### 5. **Customer Segmentation** (`customer_segmentation/`)
ML-based customer segmentation for targeted marketing and personalization.
- **Key Features**: Dynamic segmentation, profile analysis, metric comparison
- **Visualizations**: Segment distribution map, profile cards, metric comparison

### 6. **Engagement Classifier** (`engagement_classifier/`)
Classifies customer engagement levels for targeted interventions.
- **Key Features**: Engagement scoring, trend analysis, segment breakdown
- **Visualizations**: Engagement pyramid, trend charts, segment analysis

### 7. **Next Purchase** (`next_purchase/`)
Predicts timing and products for next customer purchase.
- **Key Features**: Time prediction, product recommendations, confidence scoring
- **Visualizations**: Timeline visualization, product probability, customer dashboard

### 8. **Next Purchase Predictor** (`next_purchase/`)
Advanced version with enhanced prediction capabilities.
- **Key Features**: Deep learning models, multi-product predictions, seasonality
- **Visualizations**: Advanced predictions dashboard

### 9. **Performance Deviation** (`performance_deviation/`)
Identifies unusual performance patterns and deviations from norms.
- **Key Features**: Deviation detection, root cause analysis, alerting
- **Visualizations**: Deviation charts, performance grids, alert dashboard

### 10. **Purchase Frequency** (`purchase_frequency/`)
Analyzes purchase patterns and frequency distributions.
- **Key Features**: Frequency analysis, regularity patterns, value correlation
- **Visualizations**: Frequency histogram, interval heatmap, segment quadrant

### 11. **Retention Planner** (`retention_planner/`)
Strategic retention planning and intervention recommendations.
- **Key Features**: Retention strategies, intervention timing, ROI estimation
- **Visualizations**: Strategy matrix, timeline planner, ROI calculator

### 12. **Transaction Patterns** (`transaction_patterns/`)
Deep analysis of transaction patterns and behaviors.
- **Key Features**: Pattern mining, temporal analysis, anomaly detection
- **Visualizations**: Temporal heatmap, dual-axis time series, pattern dashboard

## Directory Structure

```
Customer/
├── database/                    # Shared database and utilities
│   ├── customers.db            # SQLite customer database
│   ├── column_mapping.py       # Database column mappings
│   └── utils.js               # Database utilities
└── tools/                      # Individual analytical tools
    ├── anomaly_detection/
    ├── churn_prediction/
    ├── customer_behaviour/
    ├── customer_lifetime_value/
    ├── customer_segmentation/
    ├── engagement_classifier/
    ├── next_purchase/
    ├── performance_deviation/
    ├── purchase_frequency/
    ├── retention_planner/
    └── transaction_patterns/
```

## Database Schema

The `customers.db` SQLite database contains:
- **customers**: Customer profiles and demographics
- **transactions**: Purchase history and transaction details
- **engagement**: Engagement metrics and interactions
- **segments**: Customer segment assignments

## Tool Structure

Each tool follows a consistent pattern:
```
{tool_name}/
├── {tool_name}.py              # Python analytical logic
├── Spec_UI_{tool_name}.md      # UI specification document
├── tests/                      # Python unit tests
├── ui/                         # React/TypeScript frontend
│   ├── api/                    # API integration
│   ├── components/             # UI components
│   ├── types/                  # TypeScript definitions
│   └── views/                  # Main dashboard view
├── api/                        # Additional API files
└── database/                   # SQL queries
```

## API Endpoints

Each tool exposes an API endpoint:
- **Pattern**: `/api/{tool-name}/data`
- **Method**: POST
- **Request**: 
  ```json
  {
    "filters": {
      "startDate": "2023-01-01",
      "endDate": "2023-12-31",
      "segments": ["all"]
    }
  }
  ```

## Frontend Components

### Common Components
- **KPI Tiles**: Standardized metric display (280x120px)
- **Visualizations**: Plotly-based interactive charts
- **Filter Controls**: Date ranges, segments, metrics
- **Data Tables**: Sortable, filterable customer lists

### State Management
Tools using Redux:
- `churn_prediction` - churnPredictionSlice
- `customer_behaviour` - customerBehaviourSlice
- `customer_segmentation` - customerSegmentationSlice
- `purchase_frequency` - purchaseFrequencySlice

## Python Tool Pattern

```python
def analyze_customer_behavior(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    segment: Optional[str] = "all"
) -> Dict:
    """
    Analyzes customer behavior patterns.
    
    Returns:
        Dict containing:
        - status: 'success' or 'error'
        - data: Analysis results
        - summary: Text summary
        - insights: Key findings
        - visualization_output: Component specs
    """
```

## Integration with ADK

All tools are integrated with the ADK orchestration system:
1. Tools imported in `/apps/adk/orchestration_agent/tools/`
2. Registered with Customer Insights Agent
3. Available for AI-driven analysis

## Testing

### Python Tests
```bash
cd tools/{tool_name}
pytest tests/test_{tool_name}.py
```

### Frontend Tests
```bash
npm test -- --testPathPattern=Customer
```

## Development Guidelines

### Adding New Customer Tools
1. Create tool directory structure
2. Implement Python analytical logic
3. Write UI specification
4. Build React components
5. Create API endpoint
6. Register with ADK agent
7. Add to component registry

### Best Practices
- Use existing database schema
- Follow tool structure pattern
- Implement comprehensive error handling
- Include unit tests
- Document API contracts
- Use TypeScript for type safety

## Performance Optimization

- Database query optimization with indexes
- Caching for expensive calculations
- Pagination for large datasets
- Memoization in React components
- Lazy loading for visualizations

## Related Documentation

- [Web Application](../README.md)
- [Tool Implementation Process](../TOOL_IMPLEMENTATION_PROCESS.md)
- [ADK Integration](../../adk/orchestration_agent/README.md)
- [Main AI Documentation](../../../AI_DOCS.md)