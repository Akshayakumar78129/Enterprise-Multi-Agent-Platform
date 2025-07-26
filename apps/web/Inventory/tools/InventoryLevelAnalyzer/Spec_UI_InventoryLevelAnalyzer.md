# Inventory Level Analyzer - UI/UX Specification

## 1. Tool Overview

The Inventory Level Analyzer is a comprehensive analytics tool that monitors, visualizes, and optimizes inventory levels across products and facilities. The system:

- Provides real-time inventory level visibility across warehouses and products
- Calculates days of supply and stock adequacy metrics
- Identifies low-stock items and stockout risks proactively
- Visualizes inventory distribution and critical thresholds
- Tracks historical inventory trends and seasonal patterns
- Quantifies financial impact of inventory levels and stockout risks
- Recommends restocking priorities and optimization strategies
- Creates action plans for immediate, short-term, and long-term inventory management
- Connects inventory levels to demand patterns and sales velocity

## 2. Data Analysis & Patterns

### Primary Data Elements
- Current stock levels by item, category, and warehouse
- Average daily sales and consumption patterns
- Days of supply calculations
- Stock level percentages relative to targets
- Low stock and stockout risk flags
- Inventory value and financial exposure
- Historical stock level trends
- Order and replenishment statuses
- Demand variability and seasonality patterns
- Safety stock requirements

### Key Analysis Methods
- Days of supply calculation (current stock ÷ average daily demand)
- Stock level percentage calculation (current stock ÷ target stock)
- Threshold-based low stock identification
- Risk-based stockout prediction
- Category and warehouse segmentation for level analysis
- Trend analysis of inventory adequacy over time
- Financial impact assessment of insufficient inventory
- Prioritization algorithms for restocking recommendations
- Comparative analysis across warehouses and categories

## 3. Current vs. Target Visualization State

### Current State
The tool currently provides:
- Basic matplotlib bar charts for stock levels by category
- Simple bar charts for stockout risks by warehouse
- Scatter plots for inventory value vs. days of supply
- Static images encoded as base64 strings
- Text-based reporting in markdown format
- No interactive elements or filters
- Limited segmentation capabilities
- Fixed visualization parameters
- No trend visualization or historical context
- Separate outputs without integration into a cohesive dashboard

### Target State
Transform into a comprehensive inventory level intelligence platform with:
- Interactive stock level dashboard with dynamic filtering and segmentation
- Multi-dimensional analysis of current stock, target levels, and risks
- Visual inventory distribution mapping across facilities
- Trend visualization to identify emerging stockout patterns
- Proactive alerts for inventory falling below critical thresholds
- Restocking prioritization based on risk and financial impact
- Order status integration and receiving forecast
- Executive summary with operational detail access
- Inventory health scoring across categories and locations
- AI-assisted inventory optimization and recommendation generation

## 4. UI Component Design

### Primary Visualization: Inventory Level Dashboard

#### 4.1 Inventory Health Matrix

**Stock Level Visualization**
- **Purpose**: Visualize inventory health across categories and warehouses
- **Dimensions**: 760px × 480px
- **Primary Elements**:
  - Inventory health heatmap grid:
    - X-axis: Warehouses or time periods
    - Y-axis: Product categories
    - Cell size: Variable based on grid density
    - Cell color: Stock level gradient
      - Critical (< 10%): Signal Magenta (#e930ff)
      - Low (10-30%): #d45d79 (muted magenta)
      - Moderate (30-60%): #ffc145 (amber)
      - Adequate (60-100%): #5fd4d6 (lighter cyan)
      - Excess (> 100%): Electric Cyan (#00e0ff)
    - Grid lines: 1px Midnight Navy (#0a1224)
    - Cell content: Stock level percentage and days of supply
  - Dimension selector:
    - Tabs for dimension selection:
      - Category × Warehouse (default)
      - Category × Time Period
      - Item × Warehouse
      - Custom Dimensions
    - Active tab: Underlined with Electric Cyan (#00e0ff) 2px line
  - View controls:
    - "Show Percentages" toggle: Display percentage values
    - "Show Days of Supply" toggle: Display days of supply
    - "Highlight Risks" toggle: Emphasize critical levels
    - Threshold slider: Adjust low stock threshold (5-30%)
  - Detail panel:
    - Position: Right side, 240px width
    - Background: Graphite (#232a36)
    - Border-radius: 16px
    - Title: "Selection Details" in 16px Inter SemiBold
    - Empty state: "Select a cell to see details"
    - Selected state:
      - Category/warehouse details
      - Stock level metrics breakdown
      - Item count and value summary
      - Trend over time mini-chart
      - Quick restock recommendations
  - Color scale legend:
    - Position: Bottom of matrix
    - Gradient bar: 400px × 20px showing color range
    - Markers: Stock level ranges at key thresholds
    - Labels: "Critical" to "Excess"
- **States**:
  - Default: Category × Warehouse view
  - Time-based: Category × Time view
  - Item-level: Expanded item detail view
  - Selected: Highlight selected cell with details
  - Filtered: Applied category/warehouse filters
  - Threshold: Adjusted low stock threshold
- **Interaction Details**:
  - Click cells to select and view detailed breakdown
  - Adjust threshold slider to redefine low stock items
  - Hover cells for quick metric tooltips
  - Double-click to drill down to item level
  - Export matrix data or visualization
  - Toggle dimension tabs for different perspectives

#### 4.2 Stockout Risk Radar

**Risk Detection Visualization**
- **Purpose**: Identify and visualize items at risk of stockout
- **Dimensions**: 720px × 460px
- **Primary Elements**:
  - Risk radar chart:
    - Circular layout divided into product categories
    - Concentric circles representing days of supply
      - Inner circle (0-7 days): Critical risk
      - Middle circle (8-14 days): Moderate risk
      - Outer circle (15+ days): Low risk
    - Dots representing individual items
      - Position: Based on days of supply and category
      - Size: Based on inventory value
      - Color: 
        - Critical: Signal Magenta (#e930ff)
        - Moderate: #ffc145 (amber)
        - Low: Electric Cyan (#00e0ff)
    - Threshold rings: Marking critical thresholds
    - Label density: Auto-adjusting based on item count
  - Risk metrics panel:
    - Position: Right side, 240px width
    - Background: Graphite (#232a36)
    - Border-radius: 16px
    - Content:
      - Items at risk count
      - Value at risk
      - Average days of supply
      - Most critical categories
      - Most affected warehouses
  - Risk filter controls:
    - Days of supply range slider (0-30+)
    - Category selector
    - Warehouse selector
    - Value threshold slider
    - Applied filters shown as removable chips
  - Detail view:
    - Appears on item selection
    - Shows item details and metrics
    - Displays historical stock pattern
    - Lists incoming orders and ETAs
    - Provides quick restock actions
  - Distribution toggle:
    - Switches between item dots and density distribution
    - Heatmap option for high-density visualizations
  - Focus controls:
    - "Focus on Critical" button
    - "Show All" button
    - Zoom controls for dense areas
- **States**:
  - Default: All items by risk level
  - Filtered: By category, warehouse, or threshold
  - Selected: Highlighting specific item
  - Focused: Centered on critical items
  - Distribution: Showing density pattern instead of items
  - Detail: Displaying specific item information
- **Interaction Details**:
  - Click items to select and view detailed information
  - Drag risk threshold rings to adjust criteria
  - Hover for detailed item metrics
  - Filter by category or warehouse
  - Export risk data for action planning
  - Toggle between individual items and density view

#### 4.3 Inventory Distribution Map

**Location-Based Inventory Visualization**
- **Purpose**: Visualize inventory distribution across warehouses
- **Dimensions**: 740px × 480px
- **Primary Elements**:
  - Warehouse map visualization:
    - Warehouse locations as nodes
      - Size: Based on total inventory value
      - Color: Based on overall stock health
        - Healthy: Electric Cyan (#00e0ff)
        - Mixed: #ffc145 (amber)
        - Critical: Signal Magenta (#e930ff)
      - Shape: Hexagons with 8px rounded corners
      - Pulse animation: Active on critical warehouses
    - Category indicators:
      - Concentric rings showing category distribution
      - Color segments matching category colors
      - Size proportional to category representation
    - Connection lines:
      - Linking warehouses with shared inventory
      - Line thickness based on transfer volume
      - Dashed lines for potential transfers
  - Location detail panel:
    - Position: Right side, 240px width
    - Background: Graphite (#232a36)
    - Border-radius: 16px
    - Title: "Warehouse Details" in 16px Inter SemiBold
    - Content:
      - Warehouse name and location
      - Total item count and value
      - Category breakdown
      - Critical items list
      - Stock health score
      - Transfer recommendations
  - View controls:
    - "By Value" / "By Item Count" toggle
    - "Show Transfers" toggle
    - "Show Categories" toggle
    - Zoom and pan controls
  - Filter controls:
    - Region selector
    - Warehouse type selector
    - Category focus selector
    - Health threshold slider
  - Optimization panel:
    - Transfer recommendations
    - Rebalancing suggestions
    - Distance and cost calculations
- **States**:
  - Default: All warehouses by value
  - Count-based: Sized by item count
  - Selected: Highlighting specific warehouse
  - Transfer: Showing potential transfers
  - Filtered: By region or health level
  - Category: Focusing on specific category
- **Interaction Details**:
  - Click warehouses to view detailed information
  - Drag between warehouses to simulate transfers
  - Hover for summary metrics
  - Filter by region or warehouse type
  - Zoom into specific areas for detailed view
  - Toggle between value and count perspectives

#### 4.4 Item-Level Analyzer

**Detailed Inventory Item Analysis**
- **Purpose**: Provide detailed analysis of inventory items
- **Dimensions**: 760px × 500px
- **Primary Elements**:
  - Item data grid:
    - Columns:
      - Item ID/SKU
      - Item Name
      - Category
      - Warehouse
      - Current Stock
      - Target Level
      - Stock %
      - Days of Supply
      - Daily Sales
      - Stock Status
    - Row highlight:
      - Critical: Light Signal Magenta (#e930ff) at 20% opacity
      - Low: Light #d45d79 (muted magenta) at 20% opacity
      - Adequate: Light #5fd4d6 (lighter cyan) at 20% opacity
      - Excess: Light Electric Cyan (#00e0ff) at 20% opacity
    - Sort indicators: Small arrows in column headers
    - Search field: For finding specific items
    - Pagination controls: For navigating large item lists
  - Filtering panel:
    - Position: Above grid
    - Background: Graphite (#232a36)
    - Border-radius: 12px
    - Controls:
      - Category multi-select
      - Warehouse multi-select
      - Status filter (All, Critical, Low, Adequate, Excess)
      - Days of supply range slider
      - "Apply Filters" button: Pill with Electric Cyan (#00e0ff) background
  - Item detail panel:
    - Position: Right side, appears on item selection
    - Background: Graphite (#232a36)
    - Border-radius: 16px
    - Content:
      - Item details and attributes
      - Stock level history graph
      - Reorder information
      - Related items
      - Supplier details
  - Batch action controls:
    - Select all / deselect all
    - Batch action dropdown:
      - Tag for reorder
      - Set target levels
      - Transfer between warehouses
      - Add to replenishment plan
    - Selection count indicator
    - "Apply Action" button
  - Export controls:
    - Export format selector (CSV, Excel, PDF)
    - Export selection or all items toggle
    - "Export" button with download icon
- **States**:
  - Default: All items sorted by risk
  - Filtered: Applied dimension filters
  - Searched: Results of item search
  - Selected: Single item detail view
  - Multi-select: Multiple items selected
  - Sorted: Custom sort order applied
- **Interaction Details**:
  - Click column headers to sort
  - Select items for batch actions
  - Double-click item to view detailed information
  - Apply filters to narrow item list
  - Export item data in various formats
  - Perform batch actions on selected items

#### 4.5 KPI Tiles Row

**Five Inventory Level KPI Tiles (120px × 120px each)**
1. **Overall Stock Health**
   - **Value**: Percentage in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Subtitle**: "Inventory Health"
   - **Visual**: Circular gauge showing health percentage
   - **Comparison**: vs. target with variance
   - **States**: Above Target (Electric Cyan), Below Target (Signal Magenta), At Target

2. **Items at Risk**
   - **Value**: Count in 32px Inter SemiBold
   - **Subtitle**: "Stockout Risk"
   - **Visual**: Small horizontal gauge showing percentage of total
   - **Comparison**: vs. previous period with trend arrow
   - **States**: Improving (Electric Cyan), Worsening (Signal Magenta), Stable

3. **Average Days Supply**
   - **Value**: Days in 32px Inter SemiBold
   - **Subtitle**: "Across All Items"
   - **Visual**: Small horizontal gauge with threshold markers
   - **Comparison**: vs. target with variance
   - **States**: Above Target (Electric Cyan), Below Target (Signal Magenta), At Target

4. **Value at Risk**
   - **Value**: Dollar amount in 32px Inter SemiBold
   - **Subtitle**: "Critical Items"
   - **Visual**: Small horizontal bar with risk distribution
   - **Comparison**: vs. previous period
   - **States**: Decreasing (Electric Cyan), Increasing (Signal Magenta), Stable

5. **Restock Priority**
   - **Value**: Category name in 28px Inter SemiBold
   - **Subtitle**: "Needs Attention"
   - **Visual**: Small circular indicator with urgency color
   - **Comparison**: Days until critical
   - **States**: Urgent (Signal Magenta), Soon (Amber), Planned (Electric Cyan)

### Secondary Visualizations

#### 4.6 Inventory Trend Analyzer

**Temporal Pattern Analysis**
- **Purpose**: Analyze evolution of inventory levels over time
- **Dimensions**: 680px × 400px
- **Implementation**: Multi-line trend chart with threshold markers
- **Visual Elements**:
  - Trend line chart:
    - X-axis: Time periods (days, weeks, months)
    - Y-axis (left): Average stock level percentage
    - Y-axis (right): At-risk item count
    - Stock level line: 3px solid Electric Cyan (#00e0ff)
    - Risk item line: 3px dashed Signal Magenta (#e930ff)
    - Threshold changes: Vertical markers with labels
    - Annotations: Key events affecting inventory
    - Grid lines: 1px #3a4459 (light graphite) at 20% opacity
  - Trend metrics panel:
    - Trend direction indicator
    - Growth/reduction rate
    - Seasonality detection
    - Correlation with sales patterns
  - Time range selector:
    - Horizontal brush area below main chart
    - Preset buttons: "7D", "30D", "90D", "1Y", "All"
    - Custom date range picker
  - Category filter:
    - Multi-select for category filtering
    - Top 5 categories quick select
    - "All Categories" toggle
  - View toggle:
    - "Level View" / "Risk View" / "Combined View"
    - Active view: Pill with Electric Cyan (#00e0ff) background
  - Trend analysis controls:
    - Moving average selector (none, 7-day, 30-day)
    - Trend line toggle
    - Seasonality detection toggle
    - Projection extension toggle
- **States**:
  - Default: 90-day view of stock levels
  - Risk: At-risk item trend view
  - Combined: Both metrics shown
  - Filtered: Category-specific trend
  - Smoothed: With moving average applied
  - Projected: With future trend projection

#### 4.7 Warehouse Stock Comparison

**Cross-Location Level Analysis**
- **Dimensions**: 680px × 420px
- **Implementation**: Multi-metric bar chart with stock level breakdown
- **Visual Elements**:
  - Warehouse comparison chart:
    - X-axis: Warehouses
    - Y-axis (left): Average stock level percentage
    - Y-axis (right): Item count
    - Primary bars: Stacked status bars for each warehouse
      - Critical: Signal Magenta (#e930ff)
      - Low: #d45d79 (muted magenta)
      - Adequate: #5fd4d6 (lighter cyan)
      - Excess: Electric Cyan (#00e0ff)
    - Overlay line: Item count marker with connecting line
    - Target line: Horizontal line showing target stock level
    - Bar width: 60px
    - Bar spacing: 20px
    - Labels: Warehouse names and summary values
  - Warehouse filter:
    - Region selector (All, North, South, East, West)
    - Multi-select for specific warehouses
    - "Top/Bottom 5" quick selection
    - "Show/Hide Names" toggle
  - Sort controls:
    - Sort options: 
      - By Health Score
      - By Critical Items
      - By Average Level
      - By Warehouse Name
    - Sort direction toggle
  - View controls:
    - "Absolute Values" / "Percentage" toggle
    - "Show Categories" / "Overall Only" toggle
    - "Show Item Count" toggle
  - Warehouse details panel:
    - Appears on warehouse selection
    - Shows detailed metrics for selected warehouse
    - Provides optimization recommendations
  - Export controls:
    - Format selector (PNG, SVG, CSV)
    - "Export" button with download icon
- **States**:
  - Default: All warehouses, absolute values
  - Percentage: Proportional view
  - Filtered: Selected warehouse regions
  - Selected: Highlighting specific warehouse
  - Sorted: Custom sort order applied
  - Category: Showing category breakdown

### Conversational Elements

#### 4.8 Inventory Level Assistant

**AI-Powered Inventory Analysis**
- **Purpose**: Provide AI-driven insights and recommendations for inventory optimization
- **Dimensions**: 360px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Inventory Insights" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px animated assistant icon with Electric Cyan (#00e0ff) glow
- **Interaction Components**:
  - Input field: "Ask about inventory..." placeholder
  - Command palette with slash-commands:
    - /analyze-category [category]
    - /forecast-stockouts [days]
    - /optimize-levels [category/warehouse]
    - /compare-warehouses [warehouse1,warehouse2]
    - /recommend-transfers [warehouse]
  - Recent queries list with quick-select
  - Voice input option
- **Insight Cards**:
  - 320px width, variable height
  - Background: #1e2738 (darker graphite)
  - Border-left: 4px with insight-type specific color
    - Recommendation: Electric Cyan (#00e0ff)
    - Warning: Signal Magenta (#e930ff)
    - Information: #5fd4d6 (lighter cyan)
    - Success: #00c389 (green)
  - Title: 16px Inter SemiBold, Cloud White (#f7f9fb)
  - Content: 14px Inter Regular, Cloud White (#f7f9fb) at 90% opacity
  - Mini-visualizations: Inline charts supporting insights
  - Action buttons: "Restock", "Transfer", "Share"
- **Thoughtlets**: 
  - Small insight bubbles that appear contextually
  - 140-character max insights with minimal visualization
  - Positioned near relevant chart elements
  - Dismiss or expand options
  - Action links to apply recommendations
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full width with content
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Response: Text appears with typing animation
  - Highlighting: Can highlight elements across dashboard
  - Applied: Shows success state after recommendation applied

#### 4.9 Replenishment Plan Generator

**Inventory Restocking Planning**
- **Dimensions**: 380px width, expandable to 520px
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Components**:
  - Replenishment timeline:
    - Three timeline sections:
      - Immediate (0-7 days)
      - Short-term (8-30 days)
      - Long-term (31+ days)
    - Visual timeline with restock cards
    - Time markers for delivery scheduling
    - Connection lines for dependent actions
  - Restock cards:
    - Card size: 340px width, variable height
    - Background: Midnight Navy (#0a1224)
    - Border-left: 4px with priority color
      - Critical: Signal Magenta (#e930ff)
      - High: #d45d79 (muted magenta)
      - Medium: #ffc145 (amber)
      - Low: Electric Cyan (#00e0ff)
    - Content:
      - Item or category name
      - Current vs. target levels
      - Quantity to order
      - Expected delivery date
      - Supplier information
      - Order cost estimate
      - Status toggle (Not Started, Ordered, Received)
  - Scheduling calculator:
    - Lead time estimates
    - Delivery date calendar
    - Quantity optimizer
    - Budget calculator
  - Plan generation controls:
    - Priority selector (All, Critical Only, Value-based)
    - Timeframe selector (7-day, 30-day, 90-day)
    - Budget constraint input
    - "Generate Plan" button with Electric Cyan (#00e0ff) background
  - Export and integration:
    - "Export to Procurement" button
    - "Share with Team" button
    - "Add to Calendar" function
    - Format selector (PDF, Excel, CSV)
- **States**:
  - Empty: No plan generated
  - Generated: Initial plan created
  - Customized: User-modified plan
  - In-Progress: Tracking order status
  - Complete: Showing received items
  - Shared: Collaborative view with team updates

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with subtle animations
   - KPI tiles appear first with counter animations
   - Inventory health matrix animates into view
   - Default view shows overall inventory status
   - Critical items pulse briefly to draw attention
   - Initial insights appear in right panel highlighting key risks
   - Default filter settings applied (all categories, all warehouses)

2. **Inventory Health Assessment**
   - Review KPI tiles for high-level inventory metrics
   - Examine inventory health matrix to identify problem areas
   - Adjust stock level threshold to match business requirements
   - Drill down into specific category-warehouse combinations
   - Export findings for further analysis or sharing

3. **Stockout Risk Identification**
   - Navigate to stockout risk radar
   - Identify items at immediate risk
   - Adjust days of supply threshold
   - Filter by category or warehouse to focus analysis
   - Select high-risk items for detailed examination
   - Add critical items to replenishment plan

4. **Inventory Distribution Analysis**
   - View inventory distribution map
   - Identify warehouses with critical levels
   - Compare distribution across locations
   - Assess potential transfer opportunities
   - Optimize inventory balance across network
   - Generate warehouse-specific recommendations

5. **Trend Analysis**
   - View inventory trend analyzer
   - Examine historical patterns in stock levels
   - Identify seasonal variations or concerning trends
   - Correlate inventory changes with sales patterns
   - Generate forecast for future inventory needs
   - Identify optimal reorder timing

6. **Replenishment Planning**
   - Launch replenishment plan generator
   - Set priority criteria and timeframes
   - Review automatically generated recommendations
   - Adjust quantities and delivery schedules
   - Calculate financial impact of plan
   - Export plan to procurement system

## 6. Integration with Other Tools

### Connected Data Flows
- **SlowMovingInventoryAnalyzer**: Incorporates slow-mover insights into stock level optimization
- **InventoryHoldingCostAnalyzer**: Supplies cost data for financial impact assessment
- **StockOptimizationRecommender**: Receives stock level data for reorder calculations
- **InventoryOptimizationAnalyzer**: Shares inventory health data for holistic optimization
- **DemandForecastEngine**: Provides demand predictions for stockout risk calculation

### Integration Touchpoints
- **Inventory Management System**: Receive real-time stock level data
- **Procurement System**: Send reorder recommendations
- **Warehouse Management System**: Share location-specific inventory insights
- **Sales Forecasting**: Incorporate demand predictions into stock requirements
- **Financial Planning**: Provide inventory value and risk exposure data

### Cross-Tool Navigation
- Unified inventory parameter definitions and calculations
- Consistent categorization and warehouse designations
- Shared threshold definitions for inventory statuses
- Synchronized data views and time period selections
- Common visualization styles and interaction patterns
- Integrated action planning and implementation tracking

## 7. Technical Implementation Notes

### Data Processing Requirements
- Real-time inventory level calculations for large item datasets
- Statistical analysis for stockout risk prediction
- Time-series processing for trend analysis and seasonality detection
- Geographical processing for distribution mapping
- Threshold optimization algorithms for different product categories
- Prioritization algorithms for restock recommendations
- Correlation analysis between inventory levels and sales patterns

### Accessibility Considerations
- Color blind friendly palette with pattern indicators for all visualizations
- Screen reader support for all metrics and recommendations
- Keyboard navigation for all dashboard elements
- Text alternatives for all visualizations
- High contrast mode for better visual distinction
- Scalable text without breaking dashboard layout

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: Two-column layout with stacked visualization panels
- **768-1023px**: Single column with compact visualizations
- **<768px**: Essential KPIs and summary recommendations with drill-down

### Performance Optimizations
- Progressive loading of visualization components
- On-demand calculation of complex risk metrics
- Lazy loading of secondary visualizations
- Client-side caching of inventory calculations
- Data sampling for very large inventory datasets
- Throttled updates for real-time data changes
- Incremental updates for time-series data 