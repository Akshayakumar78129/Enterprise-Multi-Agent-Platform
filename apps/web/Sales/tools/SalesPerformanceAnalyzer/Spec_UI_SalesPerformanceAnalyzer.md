# Sales Performance Analyzer - UI/UX Specification

## 1. Tool Overview

The Sales Performance Analyzer is a comprehensive multi-dimensional analytics tool that provides deep insights into sales performance across various business perspectives. The system:

- Analyzes sales performance across multiple dimensions (product, category, channel, region, customer, time)
- Calculates key performance metrics (revenue, units, average order value, growth, margin)
- Supports time-period based analysis with flexible date ranges
- Enables comparative analysis between time periods and dimensions
- Visualizes performance data with interactive, multi-view representations
- Identifies key trends, outliers, and opportunities
- Supports drill-down exploration of performance drivers
- Provides data-driven insights for strategic decision-making

## 2. Data Analysis & Patterns

### Primary Data Elements
- Sales transaction amounts and revenue metrics
- Unit quantity and order volume data
- Customer purchase information
- Product and category classification data
- Regional and channel distribution metrics
- Temporal sales patterns and periodicity
- Growth rate and comparative metrics
- Margin and profitability calculations

### Key Analysis Methods
- Multi-dimensional performance aggregation
- Time-series trend analysis and visualization
- Comparative period-over-period analysis
- Performance metric calculation and benchmarking
- Anomaly and outlier detection
- Distribution and contribution analysis
- Performance driver identification
- Multi-view data presentation

## 3. Current vs. Target Visualization State

### Current State
The tool currently provides basic visualization through:
- Simple matplotlib bar and line charts
- Basic scatter plots for sales vs. quantity analysis
- Simple data histograms and distributions
- Static image files encoded as base64 strings
- Fixed 2×2 chart layout with limited customization
- Limited interactivity with static images
- Console-based output without user controls
- Fixed time periods without interactive selection
- Standard coloring without thematic styling

### Target State
Transform into a comprehensive sales intelligence platform with:
- Interactive multi-dimensional dashboard with dynamic filtering
- Flexible dimension-switching with preserved context
- Rich comparative analysis tools with benchmark capabilities
- Multi-view representation of performance metrics
- Time-series explorer with advanced trend visualization
- Anomaly and opportunity highlighting
- AI-assisted insight generation and recommendations
- Drill-down capability from summary to detailed views
- Customizable visualization and reporting tools
- Exportable insights and presentation-ready visuals

## 4. UI Component Design

### Primary Visualization: Sales Performance Dashboard

#### 4.1 Performance Overview

**Multi-Dimension Performance Summary**
- **Purpose**: Provide a high-level view of performance across the selected dimension
- **Dimensions**: 760px × 480px
- **Primary Elements**:
  - Main performance chart:
    - Chart type: Switchable between bar, line, and area
    - Default view: Horizontal bar chart
      - X-axis: Performance metric value
      - Y-axis: Dimension values (e.g., products, regions, time periods)
      - Bar width: Based on metric value
      - Bar color: Gradient based on performance
      - Low performance: #5fd4d6 (lighter cyan)
      - Medium performance: Electric Cyan (#00e0ff)
      - High performance: Signal Magenta (#e930ff)
    - Line/area view (for time dimension):
      - X-axis: Time periods
      - Y-axis: Metric value
      - Line: 3px solid Electric Cyan (#00e0ff)
      - Area fill: Electric Cyan (#00e0ff) at 30% opacity
      - Data points: 6px circles at key intervals
      - Trend indicators: Directional arrows at significant changes
  - Dimension selector:
    - Toggle pills for available dimensions:
      - Product
      - Category
      - Channel
      - Region
      - Customer
      - Time
    - Active dimension: Pill with Electric Cyan (#00e0ff) background
    - Inactive: Graphite (#232a36) with hover effect
  - Metric selector:
    - Toggle pills for available metrics:
      - Revenue
      - Units
      - AOV (Average Order Value)
      - Growth
      - Margin
    - Active metric: Pill with Electric Cyan (#00e0ff) background
    - Icon indicators showing metric type
  - Filter panel:
    - Expandable drawer from top
    - Filter chips showing applied filters
    - Quick filter presets for common views
    - Advanced filter builder with logic operators
  - Time period selector:
    - Preset buttons: "Last 7 Days", "Last 30 Days", "Last 90 Days", "Last Year"
    - Custom range picker with calendar interface
    - Currently selected: Pill with Electric Cyan (#00e0ff) background
  - Performance summary:
    - Total: Bold 32px Inter SemiBold value
    - Period comparison: vs. previous period with trend indicator
    - Contribution: Percentage of overall performance
    - Top performer: Highest value entity in current dimension
  - Secondary metrics row:
    - Small sparklines for each secondary metric
    - Metric value and percentage change
    - Color-coding based on performance direction
- **States**:
  - Default: Top performers in primary dimension
  - Filtered: Applied dimension-specific filters
  - Comparative: Period-over-period or year-over-year view
  - Trended: Time-series view with trend analysis
  - Highlighted: Focus on specific entities within dimension
  - Expanded: Showing additional detail for selected entity
- **Interaction Details**:
  - Click dimension pill to switch primary dimension
  - Click metric pill to change performance measure
  - Hover bars/lines for detailed metric tooltip
  - Click specific entity to drill down into details
  - Apply filters to refine the analysis scope
  - Change time period to update all visualizations
  - Toggle between chart types for different perspectives
  - Export data in various formats

#### 4.2 Time Series Explorer

**Temporal Performance Analysis**
- **Purpose**: Provide in-depth analysis of performance trends over time
- **Dimensions**: 720px × 460px
- **Primary Elements**:
  - Primary time series chart:
    - X-axis: Time periods with appropriate scale
    - Y-axis: Selected metric value
    - Primary line: 3px solid Electric Cyan (#00e0ff)
    - Secondary lines: Selected comparison entities, 2px lines with distinct colors
    - Benchmark/Average: Cloud White (#f7f9fb), 2px dashed line
    - Data points: 6px circles at regular intervals
    - Grid lines: 1px #3a4459 (light graphite) at 20% opacity
    - Annotation markers: Key events or anomalies
    - Forecast extension: Dotted projection based on trend
  - Time range selector:
    - Horizontal brush area below main chart (720px × 60px)
    - Preview mini-chart showing full time range
    - Drag handles for range selection
    - Quick-select buttons for standard periods
  - Entity selector:
    - Multi-select control with color-coded chips
    - Entity search for quick finding
    - "Top 5" and "Bottom 5" quick filter buttons
    - Pin/unpin entities for persistent tracking
  - Aggregation controls:
    - Toggle buttons for time granularity (daily, weekly, monthly, quarterly)
    - Moving average selector (none, 7-day, 30-day)
    - Cumulative performance toggle
  - Comparison controls:
    - Period-over-period selector
    - Year-over-year toggle
    - Absolute vs. percentage change
    - Indexed view (starting period = 100%)
  - Analysis tools:
    - Trend line toggle with projection
    - Seasonality detection with pattern highlighting
    - Anomaly detection with threshold controls
    - Performance driver identification
  - Entity details panel:
    - Appears on entity selection
    - Key metrics for selected time range
    - Comparison to overall performance
    - Contribution to total
    - Growth rate and momentum indicators
- **States**:
  - Default: Overall performance by time
  - Multi-entity: Comparing multiple selected entities
  - Range-focused: Zoomed to specific time period
  - Comparative: Showing period-over-period comparison
  - Trend: With trend line and projection
  - Anomaly: Highlighting unusual patterns
  - Annotated: Showing event markers and context
- **Interaction Details**:
  - Hover data points for detailed date and metric values
  - Click entity in legend to toggle visibility
  - Brush to select specific time range
  - Double-click to isolate particular entity
  - Drag Y-axis to adjust scale manually
  - Click annotation marker for event details
  - Export chart data in various formats

#### 4.3 Performance Distribution Analyzer

**Distribution and Contribution Analysis**
- **Purpose**: Visualize how performance is distributed across dimension values
- **Dimensions**: 680px × 440px
- **Primary Elements**:
  - Distribution chart:
    - Chart type: Switchable between bar, pie, and treemap
    - Default view: Horizontal bar chart (top 10)
      - X-axis: Performance metric value
      - Y-axis: Dimension values (sorted by performance)
      - Bar width: Based on metric value
      - Bar color: Gradient based on relative contribution
      - Contribution percentage: Inline text label
    - Pie/donut view:
      - Segments: Dimension values
      - Size: Based on metric value
      - Color: Custom palette using brand colors
      - Labels: Value name and percentage
      - Center: Summary metrics in 18px Inter SemiBold
    - Treemap view:
      - Rectangles: Dimension values
      - Size: Based on metric value
      - Color: Same gradient as bar chart
      - Nested rectangles for hierarchical dimensions
  - Distribution controls:
    - "Show all" vs. "Top/Bottom N" toggle
    - N selection slider (5-50)
    - Include/exclude "Other" category toggle
    - Sorting control (by value, alphabetical, etc.)
  - Contribution metrics:
    - Pareto analysis (80/20 rule)
    - Concentration metrics (Gini coefficient, etc.)
    - Diversity score
    - Key contributor highlights
  - Threshold markers:
    - Cumulative percentage line overlay
    - Target threshold indicator
    - Average value marker
    - Prior period comparison indicators
  - Distribution curve:
    - Small secondary chart (680px × 100px)
    - X-axis: Value bins
    - Y-axis: Count or frequency
    - Curve: 2px solid Cloud White (#f7f9fb)
    - Distribution type indicators (normal, skewed, etc.)
- **States**:
  - Default: Top 10 performers in dimension
  - Full view: All dimension values
  - Percentage: Showing percentage contribution
  - Value: Showing absolute values
  - Comparative: Current vs. prior period
  - Hierarchical: Nested hierarchy view (categories/subcategories)
  - Filtered: Specific segment analysis
- **Interaction Details**:
  - Click chart segment to isolate or highlight
  - Hover for detailed contribution metrics
  - Toggle between chart types for different perspectives
  - Adjust thresholds to redefine performance tiers
  - Sort values by different metrics
  - Filter to focus on specific segments
  - Drill down into hierarchical dimensions

#### 4.4 Comparative Performance Grid

**Multi-Metric Performance Comparison**
- **Purpose**: Compare performance across multiple metrics and entities
- **Dimensions**: 720px × 480px
- **Primary Elements**:
  - Performance grid:
    - Row headers: Entity names (products, regions, etc.)
    - Column headers: Performance metrics
      - Revenue
      - Units
      - AOV
      - Growth
      - Margin
    - Cell values: Formatted metric values
    - Cell background: Heatmap based on relative performance
    - Gradient: Midnight Navy (#0a1224) to Electric Cyan (#00e0ff) to Signal Magenta (#e930ff)
    - Cell dimensions: 110px × 48px
    - Mini-charts: Small sparkline in each cell showing trend
    - Change indicators: Up/down arrows with percentage
  - Grid controls:
    - Column visibility toggles
    - Row filtering and search
    - Sort controls for each column
    - Display density toggle (compact/comfortable)
    - Value format selector (absolute/relative/indexed)
  - Entity selection:
    - Checkbox selection for multiple entities
    - Quick-select for top/bottom performers
    - Entity search with auto-complete
    - Category/group selector for hierarchical data
  - Comparison options:
    - Previous period selector
    - Absolute vs. percentage comparison
    - Benchmark selection (average, target, etc.)
    - Variance highlighting intensity control
  - Summary statistics:
    - Average row at bottom
    - Totals where applicable
    - Performance distribution indicators
    - Z-score normalization option
  - Visualization toggle:
    - Switch between grid, heatmap, and scatter matrix
    - Color scale adjustment
    - Sort and highlight controls
    - Export options for current view
- **States**:
  - Default: All entities with all metrics
  - Sorted: By specific metric
  - Filtered: Showing entities matching criteria
  - Highlighted: Emphasizing high/low performers
  - Comparative: Showing period-over-period changes
  - Custom: User-defined layout and metrics
  - Compact: Condensed view for more entities
- **Interaction Details**:
  - Click column header to sort
  - Click cell to highlight row/column
  - Hover for detailed metric tooltip
  - Select multiple entities for comparison
  - Edit cell format (percentage, currency, etc.)
  - Export grid as spreadsheet or image
  - Toggle between different visualizations

#### 4.5 KPI Tiles Row

**Five Sales KPI Tiles (120px × 120px each)**
1. **Total Revenue**
   - **Value**: Dollar amount in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Trend**: Arrow showing change vs. previous period
   - **Visual**: Small spark line showing recent trend
   - **States**: Increasing (Electric Cyan), Decreasing (Signal Magenta), Stable

2. **Units Sold**
   - **Value**: Count in 32px Inter SemiBold
   - **Trend**: Percentage change with up/down indicator
   - **Visual**: Small bar chart showing recent periods
   - **States**: High growth, Moderate, Declining with appropriate colors

3. **Average Order Value**
   - **Value**: Dollar amount in 32px Inter SemiBold
   - **Trend**: Change vs. previous period
   - **Visual**: Small gauge showing relative to target
   - **States**: Above target, On target, Below target

4. **Profit Margin**
   - **Value**: Percentage in 32px Inter SemiBold
   - **Subtitle**: "Gross Margin" in 12px Inter Regular
   - **Visual**: Semicircular gauge with zones
   - **States**: High (>30%), Medium (15-30%), Low (<15%)

5. **Top Performer**
   - **Value**: Entity name in 16px Inter SemiBold
   - **Subtitle**: Percentage of total in 12px Inter Regular
   - **Visual**: Small horizontal bar showing relative contribution
   - **States**: Default, Hover (shows entity details tooltip)

### Secondary Visualizations

#### 4.6 Performance Correlation Matrix

**Relationship Analysis**
- **Purpose**: Identify relationships between different performance metrics
- **Dimensions**: 620px × 380px
- **Implementation**: Scatter matrix with correlation indicators
- **Visual Elements**:
  - Correlation scatter plot:
    - Multiple scatter panels in grid layout
    - X/Y axes: Different performance metrics
    - Data points: Entities (products, regions, etc.)
    - Point color: Based on entity category
    - Point size: Based on volume or importance
    - Trend lines: 2px dashed Cloud White (#f7f9fb)
    - R² value: Correlation strength indicator
  - Correlation heatmap:
    - Alternative view to scatter matrix
    - Grid cells showing correlation strength
    - Color intensity: Strength of correlation
    - Cell values: Correlation coefficients
  - Metric selector:
    - Toggle which metrics to include in matrix
    - Drag to reorder metrics
    - Custom metric creation option
  - Entity filter:
    - Show/hide specific entity groups
    - Highlight selected entities across all panels
    - Size encoding selector (volume, value, count)
  - Regression options:
    - Linear trend line toggle
    - Confidence interval display
    - Outlier identification threshold
  - View controls:
    - Switch between scatter matrix and heatmap
    - Expand panel to full view
    - Export correlation data
- **States**:
  - Default: All metrics in matrix view
  - Filtered: Specific entity selection
  - Expanded: Detailed view of single correlation pair
  - Highlighted: Focus on specific relationships
  - Outliers: Highlighting statistical outliers
  - Clustered: Showing entity groupings

#### 4.7 Performance Driver Analysis

**Factor Contribution Assessment**
- **Dimensions**: 680px × 400px
- **Implementation**: Waterfall chart and driver breakdown
- **Visual Elements**:
  - Performance waterfall:
    - Starting point: Previous period performance
    - Ending point: Current period performance
    - Intermediate bars: Performance drivers (positive/negative)
    - Positive drivers: Electric Cyan (#00e0ff) bars
    - Negative drivers: Signal Magenta (#e930ff) bars
    - Net change: Final connecting bar
    - Value labels: Absolute and percentage contribution
  - Driver breakdown table:
    - Rows: Individual performance drivers
    - Columns: Impact value, percentage, direction
    - Sorting: By impact magnitude
    - Highlighting: Color intensity based on impact
  - Impact visualization:
    - Alternative horizontal bar chart
    - Sorted by impact (positive to negative)
    - Stacked to show cumulative effect
    - Reference lines for total change
  - Time period selector:
    - Comparison period dropdown
    - Custom period selection with calendar
    - Period-over-period or year-over-year toggle
  - Driver grouping:
    - Group drivers by category
    - Expand/collapse groups
    - Contribution percentage by group
  - Export options:
    - Download driver analysis
    - Share insights
    - Generate explanation report
- **States**:
  - Default: All drivers in waterfall
  - Grouped: Drivers grouped by category
  - Filtered: Focus on specific driver types
  - Expanded: Detailed view of specific driver
  - Comparative: Multiple period comparison
  - Normalized: Percentage view rather than absolute

### Conversational Elements

#### 4.8 Performance Insight Assistant

**AI-Powered Performance Analysis**
- **Purpose**: Provide AI-guided insights on sales performance patterns
- **Dimensions**: 360px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Performance Insights" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px animated assistant icon with Electric Cyan (#00e0ff) glow
- **Interaction Components**:
  - Input field: "Ask about performance..." placeholder
  - Command palette with slash-commands:
    - /analyze-dimension [dimension-name]
    - /compare-periods [period1] [period2]
    - /find-drivers [metric]
    - /explain-trend [entity] [metric]
    - /forecast [entity] [timeframe]
  - Recent queries list with quick-select
  - Voice input option
- **Insight Cards**:
  - 320px width, variable height
  - Background: #1e2738 (darker graphite)
  - Border-left: 4px with insight-type specific color
  - Title: 16px Inter SemiBold, Cloud White (#f7f9fb)
  - Content: 14px Inter Regular, Cloud White (#f7f9fb) at 90% opacity
  - Mini-visualizations: Inline charts supporting insights
  - Action buttons: "Export", "Share", "Implement"
- **Thoughtlets**: 
  - Small insight bubbles that appear contextually
  - 140-character max insights with minimal visualization
  - Positioned near relevant chart elements
  - Dismiss or expand options
  - Action links to explore further
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full width with content
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Response: Text appears with typing animation
  - Highlighting: Can highlight elements across dashboard

#### 4.9 Performance Optimization Recommender

**Strategy Recommendation Engine**
- **Dimensions**: 380px width, expandable to 520px
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Components**:
  - Opportunity cards:
    - Card size: 340px width, variable height
    - Background: Midnight Navy (#0a1224)
    - Border-left: 4px with priority color
      - High priority: Signal Magenta (#e930ff)
      - Medium priority: Electric Cyan (#00e0ff)
      - Low priority: #5fd4d6 (lighter cyan)
    - Title: 16px Inter SemiBold in Cloud White (#f7f9fb)
    - Description: 14px Inter Regular in Cloud White (#f7f9fb)
    - Impact estimate: Expected performance improvement
    - Confidence: Rating with 5-star or percentage indicator
  - Recommendation categories:
    - Performance improvement
    - Risk mitigation
    - Growth opportunity
    - Efficiency enhancement
    - Anomaly investigation
  - Optimization simulator:
    - "What-if" scenario builder
    - Impact calculator with sensitivity analysis
    - Implementation difficulty assessment
    - ROI estimator with timeframe
  - Action planner:
    - Convert recommendation to action item
    - Assign ownership and deadline
    - Track implementation status
    - Measure actual vs. expected impact
  - Integration options:
    - Export to project management tools
    - Share with team members
    - Convert to presentation slides
    - Schedule review meeting
- **States**:
  - Default: All recommendations sorted by impact
  - Filtered: By category or priority
  - Selected: Detailed view of specific opportunity
  - Simulation: Testing scenario impacts
  - Implementation: Action planning mode
  - Tracking: Progress monitoring view

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with branded animation
   - KPI tiles appear first with counter animations
   - Performance overview builds with animated bars/lines
   - Time series chart draws from left to right
   - Default view shows current quarter, primary dimension
   - Initial insights appear in right panel highlighting key patterns
   - Performance anomalies pulse briefly to draw attention

2. **Dimension Exploration Flow**
   - Select dimension to analyze (product, category, region, etc.)
   - Dashboard updates with dimension-appropriate visualizations
   - Performance overview shows top performers in selected dimension
   - Distribution analyzer shows value distribution
   - Comparative grid updates with entities in the dimension
   - Performance insights refresh with dimension-specific analysis
   - Apply filters to refine analysis within dimension

3. **Time Period Analysis Workflow**
   - Select time period from preset options or custom range
   - Time series explorer updates with new date range
   - Compare current period to previous periods
   - Identify trends, seasonality, and anomalies
   - View performance driver analysis between periods
   - Apply moving averages or trend lines for pattern identification
   - Generate period-specific insights and recommendations

4. **Performance Comparison Journey**
   - Select multiple entities for comparison
   - View side-by-side metrics in comparative grid
   - Identify relative strengths and weaknesses
   - Plot performance correlation to find relationships
   - Compare against benchmarks or targets
   - Save comparison view for future reference
   - Export comparative analysis for presentation

5. **Insight Generation Process**
   - Review AI-generated insights in assistant panel
   - Ask specific questions about performance patterns
   - Receive data-backed recommendations for optimization
   - Simulate potential impact of recommendations
   - Create action items from valuable insights
   - Share insights with relevant stakeholders
   - Set up monitoring for implemented changes

## 6. Integration with Other Tools

### Connected Data Flows
- **Product Performance Analyzer**: Shares product-specific sales metrics
- **Regional Sales Analyzer**: Provides geographical sales breakdowns
- **Sales Trend Analyzer**: Shares trend analysis and forecasting
- **Demand Forecast Engine**: Receives sales patterns for forecasting
- **Customer Segmentation**: Shares customer dimension analysis

### Integration Touchpoints
- **Product Analysis**: Button to explore product dimension in depth
- **Regional Analysis**: Link to geographic performance breakdown
- **Trend Analysis**: Connection to advanced trend forecasting
- **Customer Analysis**: Link to customer-focused performance metrics
- **Financial Analysis**: Integration with financial performance data

### Cross-Tool Navigation
- Unified dimension definition and selection
- Consistent time period filtering
- Synchronized metric calculations
- Shared entity selection state
- Common visualization styles and interactions
- Integrated insight generation

## 7. Technical Implementation Notes

### Data Processing Requirements
- Efficient multi-dimensional aggregation
- Real-time metric calculation
- Background processing for complex analyses
- Incremental updates with new transaction data
- Caching of common aggregations and metrics

### Accessibility Considerations
- Color blind friendly palette with pattern indicators for charts
- Screen reader support for all metrics and insights
- Keyboard navigation for all dashboard elements
- Text alternatives for all visualizations
- High contrast mode for better clarity
- Scalable text without breaking dashboard layout

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: Two-column layout with stacked sections
- **768-1023px**: Single column with compact visualizations
- **<768px**: Essential KPIs and simplified charts with drill-down

### Performance Optimizations
- Progressive loading of visualization components
- Data sampling for large datasets in initial view
- Lazy loading of secondary visualizations
- Pre-aggregated metrics for common dimensions
- WebWorker-based data processing for complex calculations
- Virtualized rendering for large data grids
- Request throttling for real-time updates 