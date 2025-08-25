# Sales Trend Analyzer

A comprehensive time-series analytics tool that provides deep insights into sales patterns and trends over different time periods.

## Features

- Time Series Explorer with interactive trend visualization
- Seasonal Pattern Analysis with decomposition view
- Growth Rate Analysis with comparative metrics
- KPI tracking and monitoring
- Multiple time granularities (daily, weekly, monthly, quarterly, annual)
- Dimension breakdowns (product, category, channel, region, customer)
- Advanced trend analytics including peak detection and anomaly identification

## Components

### 1. Time Series Explorer (760px Ã— 480px)
- Main trend visualization with interactive analysis
- Multiple metric support (revenue, units, AOV, margin)
- Moving average overlay
- Time granularity selection
- Metric selection
- Time range filtering

### 2. Seasonal Pattern Analyzer (720px Ã— 460px)
- Seasonal decomposition view
- Pattern detection and visualization
- Year-over-year comparison
- Seasonal heatmap
- Pattern strength indicators

### 3. Growth Rate Visualizer (680px Ã— 420px)
- Growth rate bar chart
- Average growth line
- Growth distribution
- Key growth metrics:
  - Overall Growth
  - CAGR
  - Highest Growth
  - Growth Stability

### 4. KPI Tiles
- Total Revenue
- Total Units
- Average Order Value
- Margin Percentage

## API Endpoints

### GET/POST /api/sales/trends/data
Fetches trend analysis data with optional filters:

```json
{
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "timePeriod": "monthly",
  "metric": "revenue",
  "dimension": null,
  "topN": 5
}
```

Response format:
```json
{
  "success": true,
  "data": {
    "mainData": [...],
    "kpis": {...},
    "seasonality": [...],
    "growthRates": [...]
  }
}
```

## Usage in AI Canvas

The tool can be spawned in the AI canvas using the following keywords:

1. "sales trend" or "sales analysis" - Spawns full dashboard
2. "sales over time" - Spawns Time Series Explorer
3. "seasonal sales" - Spawns Seasonal Pattern Analyzer
4. "sales growth" - Spawns Growth Rate Visualizer
5. "sales kpi" - Spawns KPI Tiles

## LLM Functions

The tool provides several functions for AI control:

1. `highlightTimePeriod` - Highlight specific time periods
2. `filterByMetric` - Change the analyzed metric
3. `filterByTimePeriod` - Change time granularity
4. `filterByDimension` - Break down by dimension
5. `explainTrend` - Generate trend explanations
6. `identifySeasonality` - Analyze seasonal patterns
7. `compareGrowthRates` - Compare period growth rates
8. `detectAnomalies` - Find and explain anomalies

## Database Schema

The tool uses the following tables:

- `dbo_F_Sales_Transaction`
  - `Txn Date`
  - `Net Sales Amount`
  - `Net Sales Quantity`
  - `Sales Txn Number`
  - `Net Cost Amount`
  - Various dimension keys (Item, Category, Channel, Region, Customer)

## Development

### Prerequisites
- Node.js 14+
- SQLite3
- Next.js
- React
- Plotly.js

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up database connection
4. Start development server: `npm run dev`

### Testing
Run tests with: `npm test`

## Best Practices

1. <strong>Data Loading</strong>
   - Use appropriate time granularity for the date range
   - Implement data caching for frequently accessed periods
   - Handle loading states gracefully

2. <strong>Visualization</strong>
   - Follow Enterprise IQ color scheme
   - Ensure responsive behavior
   - Provide clear loading and error states
   - Add proper tooltips and legends

3. <strong>Performance</strong>
   - Optimize database queries
   - Use appropriate indexes
   - Implement data pagination
   - Cache calculation results

4. <strong>Accessibility</strong>
   - Provide keyboard navigation
   - Add proper ARIA labels
   - Ensure sufficient color contrast
   - Support screen readers

## Troubleshooting

Common issues and solutions:

1. <strong>No Data Displayed</strong>
   - Check date range filters
   - Verify database connection
   - Check for deleted/excluded flags

2. <strong>Performance Issues</strong>
   - Reduce time range
   - Use appropriate granularity
   - Check database query performance
   - Monitor client-side rendering

3. <strong>Visualization Errors</strong>
   - Verify data format
   - Check for null values
   - Ensure proper data transformation
   - Monitor browser console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## License

Copyright Â© 2024 Enterprise IQ. All rights reserved. 
