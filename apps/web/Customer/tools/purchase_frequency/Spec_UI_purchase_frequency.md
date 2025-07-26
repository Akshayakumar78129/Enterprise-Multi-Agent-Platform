# Purchase Frequency Analyzer - UI/UX Specification

## 1. Tool Overview

The Purchase Frequency Analyzer examines customer transaction history to provide insights into buying patterns, purchase intervals, and customer value segmentation. It enables businesses to understand:

- How often customers make purchases
- The time intervals between purchases
- Customer segments based on purchase frequency
- Transaction value patterns
- Recent purchase activity

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer IDs (categorical)
- Transaction dates (datetime)
- Transaction amounts (numeric)
- Derived metrics:
  - Purchase frequency (numeric)
  - Average interval between purchases (numeric)
  - Total purchases (numeric)
  - First and last purchase dates (datetime)
  - Total spent (numeric)
  - Average transaction value (numeric)

### Key Analysis Methods
- Time interval calculation between sequential purchases
- Frequency segmentation (high/low compared to average)
- Recency analysis (activity within past 90 days)
- Value segmentation (transaction value relative to average)

## 3. Current vs. Target Visualization State

### Current State
The tool currently generates plain text output with:
- Static analysis period information
- Simple customer count metrics
- Basic purchase frequency averages
- Text-based customer segments with percentage breakdowns
- Plain text recency and value patterns

### Target State
Transform into a comprehensive, interactive dashboard featuring:
- Segmented frequency distribution visualizations with precise color-coding
- Time-interval heat map showing purchase cadence patterns
- Customer segment quadrant visualization
- Cohort retention visualization showing repeat purchase behavior
- Interactive filtering by date range and customer segments
- AI-driven insights panel with actionable recommendations

## 4. UI Component Design

### Primary Visualization: Purchase Frequency Dashboard

#### 4.1 Purchase Frequency Distribution

**Frequency Histogram with Segment Overlay**
- **Purpose**: Visualize distribution of customers by purchase frequency
- **Dimensions**: 460px × 300px
- **Visual Elements**:
  - X-axis: Number of purchases (binned)
  - Y-axis: Number of customers
  - Bars: Gradient fill from Midnight Navy (#0a1224) to Electric Cyan (#00e0ff)
  - Segment Overlays: 
    - High Frequency Segment: Signal Magenta (#e930ff) vertical threshold line at 1.5× average
    - Low Frequency Segment: Muted grey (#8893a7) vertical threshold line at 0.5× average
  - Mean Line: Dashed Electric Cyan (#00e0ff) line at average purchase frequency
- **States**:
  - Default: Full distribution view with segment thresholds
  - Hover: Bar highlights with Electric Cyan glow (0 0 8px #00e0ff), customer count tooltip
  - Selected: Bar fills with Electric Cyan (#00e0ff), related metrics update
  - Filtered: Non-selected bars fade to 40% opacity
- **Interaction Details**:
  - Click bar to filter dashboard to that frequency segment
  - Double-click to reset filter
  - Drag to select multiple frequency bins
  - Right-click for segment drill-down options

#### 4.2 Purchase Interval Analysis

**Interval Calendar Heatmap**
- **Purpose**: Visualize patterns in days between purchases
- **Dimensions**: 500px × 320px
- **Visual Elements**:
  - X-axis: Day of week (Monday-Sunday)
  - Y-axis: Week number
  - Cell Color: Progressive scale from Midnight Navy (#0a1224) through Graphite (#3a4459) to Electric Cyan (#00e0ff) based on purchase density
  - Cell Size: 48px × 48px, 4px margin
  - Recency Indicator: Last 90 days highlighted with 2px Signal Magenta (#e930ff) outline
- **States**:
  - Default: Full calendar view with color intensity mapping
  - Hover: Cell expands to 52px × 52px with detailed tooltip
  - Selected: Cell glows with 2px Electric Cyan (#00e0ff) border
  - Loading: Cells display Graphite (#232a36) with subtle pulse animation (opacity 0.4-0.7)
- **Interaction Details**:
  - Click date to filter all visualizations to customers who purchased on that date
  - Hover to see average transaction value and customer count for that date
  - Pinch/zoom for date range adjustment

#### 4.3 Customer Segment Quadrant

**RFM Quadrant (Recency-Frequency-Monetary)**
- **Purpose**: Visualize customer segments based on multiple dimensions
- **Dimensions**: 480px × 480px
- **Visual Elements**:
  - X-axis: Frequency (purchases per year)
  - Y-axis: Average transaction value
  - Point Size: Based on recency (larger = more recent)
  - Point Color: 
    - Champions (High value, high frequency): Electric Cyan (#00e0ff)
    - Loyal (High frequency, lower value): #5fd4d6 (lighter cyan)
    - Big Spenders (High value, low frequency): #ae76fa (purple)
    - At Risk (Low frequency, low recency): Signal Magenta (#e930ff)
    - Others: Graphite (#3a4459)
  - Quadrant Lines: Cloud White (#f7f9fb) at 50% opacity
  - Quadrant Labels: Cloud White (#f7f9fb) text in 14px Inter SemiBold
- **States**:
  - Default: All customer segments displayed
  - Hover: Point expands by 4px, glows with respective color at 50% opacity
  - Selected: Point outlined with Cloud White (#f7f9fb), related customers highlighted across dashboard
  - Filtered: Non-selected points fade to 20% opacity
- **Interaction Details**:
  - Click to select customer segment
  - Drag to select multiple customers in an area
  - Toggle segment visibility via legend
  - Zoom controls in bottom-right (120% max zoom)

#### 4.4 KPI Tiles Row

**Five KPI Tiles (120px × 120px each)**
1. **Total Customers**
   - Value: Large number in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - Trend: +/-% in 14px, up arrow in Electric Cyan (#00e0ff), down arrow in Signal Magenta (#e930ff)
   - Background: Graphite (#232a36)
   - Border Radius: 20px
   - States: Default, Hover (shadow deepens to 0 8px 24px rgba(0,0,0,0.4))

2. **Average Purchase Frequency**
   - Value: Number with decimal in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - Label: "Purchases per customer" in 12px Inter Regular
   - Mini-vis: 60px sparkline showing 6-month trend
   - States: Default, Hover, Alert (background shifts to Signal Magenta when decreasing over 10%)

3. **Average Days Between**
   - Value: Number with decimal in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - Visual: Circular progress indicator (120° arc, Electric Cyan)
   - States: Default, Hover, Alert (arc turns Signal Magenta when interval increases)

4. **Active Customers (90d)**
   - Percentage display with decimal in 32px Inter SemiBold
   - Radial gauge from 0-100% filled with Electric Cyan (#00e0ff)
   - Background shifts to Signal Magenta (#e930ff) when below 25%
   - States: Default, Hover, Critical (below threshold)

5. **High Value Customers**
   - Percentage display with Electric Cyan fill
   - Mini bar showing composition vs. previous period
   - Animation: Count increments from 0 on load (320ms duration)
   - States: Default, Hover (reveals detailed segment breakdown)

### Secondary Visualizations

#### 4.5 Purchase Regularity Chart
- **Purpose**: Visualize how consistently customers purchase
- **Dimensions**: 380px × 260px 
- **Implementation**: Radar chart with 6 time dimensions (daily, weekly, biweekly, monthly, quarterly, yearly)
- **Visual Elements**:
  - Web lines: Cloud White (#f7f9fb) at 20% opacity
  - Area fill: Electric Cyan (#00e0ff) at 60% opacity with darker stroke
  - Axis labels: 13px Inter Regular, Cloud White (#f7f9fb)
- **States**:
  - Default: Full radar view
  - Hover: Axis highlights with tooltip showing exact percentage
  - Comparison: Can overlay previous period in Signal Magenta (#e930ff) at 40% opacity

#### 4.6 Value Segment Treemap
- **Dimensions**: 360px × 300px
- **Purpose**: Visualize customer segments by spending value
- **Visual Elements**:
  - Rect size: Based on segment population
  - Color scale: 
    - Premium ($$$): #ae76fa (purple)
    - Standard ($$): Electric Cyan (#00e0ff)
    - Budget ($): #5fd4d6 (lighter cyan)
    - Occasional: Graphite (#3a4459)
  - Text: Segment name in Cloud White (#f7f9fb), value in Cloud White (#f7f9fb)
  - Padding: 4px between segments
- **States**:
  - Default: All segments shown
  - Hover: Segment lifts 4px with enhanced shadow
  - Selected: 2px Electric Cyan border (#00e0ff)
  - Animated: Segments morph when filter applied (300ms spring animation)

### Conversational Elements

#### 4.7 Purchase Pattern Intelligence Panel
- **Implementation**: Right drawer interface (400px width)
- **Background**: Graphite (#232a36)
- **Visual Elements**:
  - Header: "Purchase Insights" in 24px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px animated robot icon in corner (subtle floating animation)
  - Response area: Cloud White (#f7f9fb) text on Graphite (#232a36) background
  - Input field: 12px rounded input with glow effect on focus
- **Query Types**:
  - "/analyze segment [high|low|recent]"
  - "/compare [date] to [date]"
  - "/predict future-frequency"
  - "/suggest incentives"
- **States**:
  - Collapsed: Only visible as tab on right edge
  - Expanded: Full 400px width with translucent background
  - Thinking: Pulsing Electric Cyan dots animation
  - Response: Text appears with typing animation (12ms per character)

#### 4.8 Recommendation Cards
- **Dimensions**: 320px width, variable height (min 120px)
- **Border Radius**: 20px
- **Background**: Gradient from #232a36 to #3a4459
- **Visual Elements**:
  - Icon: Context-specific (frequency, value, recency)
  - Title: 16px Inter SemiBold in Cloud White (#f7f9fb)
  - Description: 14px Inter Regular in Cloud White (#f7f9fb) at 80% opacity
  - Action button: Pill-shaped with Electric Cyan (#00e0ff) background
- **Card Types**:
  - Frequency Improvement (Electric Cyan themed)
  - Reactivation (Signal Magenta themed)
  - Value Increase (Purple gradient)
- **States**:
  - Default: Drop shadow 0 4px 16px rgba(0,0,0,.25)
  - Hover: Shadow deepens to 0 8px 24px rgba(0,0,0,.4)
  - Applied: Check mark overlay with 60% opacity dimming
  - Expanded: Height increases to show full content

## 5. User Interaction Flow

1. **Initial Load Experience**
   - Progressive loading sequence with branded animation
   - KPI tiles appear first with counting animation (0 to final value)
   - Visualizations fade in sequentially (120ms staggered)
   - Default view shows last 90 days of data
   - Initial "pulse" highlights key insights as attention guides

2. **Date Range Selection**
   - Date picker with preset ranges (30/60/90/180/365 days)
   - Custom range selector with dual sliders
   - Visual calendar with Electric Cyan (#00e0ff) selection range
   - Apply button triggers crossfade transition between data states
   - Loading indicators: Thin Electric Cyan progress bar at top of each visualization

3. **Segmentation Exploration**
   - Select segment from quadrant visualization
   - All charts filter with 300ms transition
   - Customer count updates in KPI tile
   - AI generates segment-specific insights in right panel
   - Breadcrumb navigation appears showing active filters
   - Reset button pulses subtly when filters active

4. **Frequency Pattern Analysis**
   - Click frequency bin to see customers in that range
   - Quadrant highlights matching customers
   - Supplementary table appears below with sortable metrics
   - Mini histogram appears in tooltip showing distribution within bin
   - Option to export segment via floating action button

5. **Conversational Insights**
   - Ask questions via input field or click suggested prompts
   - AI generates text response with relevant visualization suggestion
   - Response cards can be pinned to dashboard
   - Follow-up questions maintain context
   - Visualization changes highlighted with subtle pulse animation

## 6. Integration with Other Tools

### Connected Data Flows
- **Transaction Patterns**: Shares customer transaction data and anomaly signals
- **Customer Lifetime Value**: Receives frequency data to inform value calculations
- **Churn Prediction**: Sends interval patterns for risk assessment
- **Retention Planner**: Receives frequency segments for targeted interventions

### Integration Touchpoints
- **Segmentation Handoff**: Button to send segment to Customer Segmentation tool
- **Pattern Discovery**: Link to Transaction Patterns for detailed basket analysis
- **Retention Planning**: "Create retention plan" action button for selected segment

### Cross-Tool Navigation
- Persistent breadcrumb showing tool context
- Shared filters propagate across connected tools
- Customer ID linking for consistent tracking
- Visual design consistency with related tools

## 7. Technical Implementation Notes

### Visualization Rendering
- Plotly.js with custom theming to match Enterprise IQ design system
- SVG-based charts with WebGL acceleration for larger datasets
- Custom color scales defined in shared theme object
- Responsive breakpoints maintain visualization integrity

### Accessibility Considerations
- All chart colors tested for WCAG 2.2 AA compliance
- Focus states clearly visible with 2px Electric Cyan outline
- Screen reader annotations for all data visualizations
- Keyboard navigation fully supported with visible focus indicators
- Reduced motion option available

### Responsive Behavior
- **≥1440px**: Full multi-panel layout with side-by-side visualizations
- **1024-1439px**: 2-column layout with visualizations stacked vertically
- **768-1023px**: Single column with expanded KPI tiles
- **<768px**: KPI-focused view with collapsible chart sections

### Performance Optimizations
- Data aggregation before visualization rendering
- Progressive loading of visualization components
- Caching of customer segment calculations
- Delayed loading of secondary visualizations
- Background processing of advanced metrics 