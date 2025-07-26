# Next Purchase Predictor - UI/UX Specification

## 1. Tool Overview

The Next Purchase Predictor is an advanced predictive analytics tool that analyzes customer purchase history to forecast future buying behaviors. The tool:

- Processes historical purchase data to identify patterns
- Employs machine learning to predict likely next purchases
- Provides customer-specific product recommendations
- Ranks prediction confidence for each recommendation
- Segments analysis by customer groups and time periods
- Enables targeted marketing and inventory planning

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer purchase history (temporal sequences)
- Product categories and relationships
- Purchase dates and intervals
- Customer segment information
- Feature vectors for predictive modeling
- Prediction confidence scores
- Model performance metrics

### Key Analysis Methods
- Sequential pattern mining
- Machine learning classification
- Feature extraction from purchase history
- Customer-product affinity scoring
- Cross-category purchase prediction
- Temporal purchase gap analysis

## 3. Current vs. Target Visualization State

### Current State
The tool currently only provides programmatic output with:
- Simple text-based reports saved to disk
- Dictionary-based prediction results
- Basic metrics returned as key-value pairs
- No interactive visualization components
- Limited filtering capabilities through function parameters
- Prediction results as static JSON records

### Target State
Transform into a comprehensive purchase prediction dashboard with:
- Interactive prediction explorer with confidence visualization
- Customer journey map showing past-to-future purchase paths
- Product affinity networks with recommendation pathways
- Segment-based prediction comparison interface
- Real-time prediction simulator with scenario testing
- Actionable marketing recommendation cards

## 4. UI Component Design

### Primary Visualization: Next Purchase Dashboard

#### 4.1 Prediction Confidence Matrix

**Product Recommendation Heatmap**
- **Purpose**: Visualize prediction confidence across products and segments
- **Dimensions**: 640px × 480px
- **Primary Elements**:
  - Interactive matrix-style heatmap:
    - X-axis: Product categories (scrollable)
    - Y-axis: Customer segments or individual high-value customers
    - Cell color: Prediction confidence gradient
      - Low confidence: Midnight Navy (#0a1224)
      - Medium confidence: #3e7b97 (blue-gray)
      - High confidence: Electric Cyan (#00e0ff)
      - Very high confidence: Signal Magenta (#e930ff)
    - Cell size: 40px × 40px with 4px gap
    - Cell border radius: 4px
  - Confidence scale legend:
    - Horizontal gradient bar: 300px × 16px
    - Labels: 12px Inter Regular in Cloud White (#f7f9fb)
    - Ticks: 1px Cloud White (#f7f9fb) at 25%, 50%, 75%, 100%
  - Prediction timeframe selector:
    - Pill buttons: "7 days", "30 days", "90 days"
    - Active state: Electric Cyan (#00e0ff) fill
    - Inactive state: Graphite (#3a4459)
- **States**:
  - Default: Full matrix view sorted by prediction confidence
  - Hover: Cell expands by 4px with detailed tooltip
  - Selected: Cell highlighted with 2px Electric Cyan (#00e0ff) border
  - Filtered: Non-relevant cells fade to 30% opacity
- **Interaction Details**:
  - Click cell to view detailed prediction information
  - Double-click product category to filter matrix to that product
  - Hover to see exact confidence score and contributing factors
  - Drag to multi-select cells for comparison view
  - Scroll horizontally for additional product categories

#### 4.2 Customer Purchase Journey

**Timeline Flow Visualization**
- **Purpose**: Show historical purchases and predicted future items
- **Dimensions**: 800px × 320px
- **Primary Elements**:
  - Central timeline with vertical purchase markers:
    - Timeline track: 4px height, Graphite (#232a36)
    - Past markers: 12px circles filled with #5fd4d6 (lighter cyan)
    - Current position: 16px circle in Electric Cyan (#00e0ff)
    - Future markers: 12px circles with dashed 2px Signal Magenta (#e930ff) border
  - Purchase nodes:
    - Past purchases: Solid rectangles with product icons
    - Background: Graphite (#232a36)
    - Border: 1px #3a4459 (light graphite)
    - Text: 14px Inter Regular in Cloud White (#f7f9fb)
    - Product icon: 24px category-specific icon
  - Prediction nodes:
    - Semi-transparent rectangles with product icons
    - Background: Gradient from #232a36 to #3a4459 at 70% opacity
    - Border: 1px dashed Signal Magenta (#e930ff)
    - Confidence indicator: Small circular gauge showing prediction strength
  - Connection lines:
    - Past: Solid 2px #5fd4d6 (lighter cyan) lines
    - Future: Dashed 2px Signal Magenta (#e930ff) lines
    - Thickness: Based on purchase likelihood
  - Timeline labels:
    - Date markers in 12px Inter Regular
    - Current date highlighted in Electric Cyan (#00e0ff)
- **States**:
  - Default: Complete journey view with past and predicted purchases
  - Focused: Highlight specific product sequence patterns
  - Expanded: Single purchase node expands to show detailed information
  - Predictive: Future timeline expands to show multiple possible paths
- **Interaction Details**:
  - Click timeline node to see purchase details
  - Hover connection to see relationship strength
  - Drag timeline to scroll through time periods
  - Toggle between individual customer and segment view
  - Click prediction node to see confidence breakdown

#### 4.3 Product Affinity Network

**Interactive Recommendation Graph**
- **Purpose**: Visualize product relationships and recommendation paths
- **Dimensions**: 560px × 560px
- **Primary Elements**:
  - Force-directed network graph:
    - Nodes: Product categories sized by purchase frequency
    - Small nodes: 40px diameter
    - Medium nodes: 56px diameter
    - Large nodes: 72px diameter
    - Node color: Product category-specific colors on Graphite (#232a36) background
    - Node border: 2px #3a4459 (light graphite)
    - Node icon: Category-specific product icon in 70% white
  - Relationship edges:
    - Line thickness: Based on co-purchase strength
    - Color: Gradient between connected node colors
    - Directionality: Arrow indicators for sequential purchases
    - Style: Solid for strong relationships, dashed for weak ones
  - Prediction paths:
    - Highlighted route through network to predicted purchases
    - Glow effect: 4px Electric Cyan (#00e0ff) for highest likelihood path
    - Secondary paths: 2px Signal Magenta (#e930ff) for alternatives
  - Legend:
    - Edge strength indicator
    - Node size reference
    - Category color key
- **States**:
  - Default: Complete network with balanced spacing
  - Focused: Selected product and its immediate relationships
  - Predictive: Highlighted paths to likely next purchases
  - Filtered: Only showing specified product categories
- **Interaction Details**:
  - Drag nodes to explore relationships
  - Click node to center view on that product
  - Double-click to isolate immediate relationships
  - Hover edge to see co-purchase statistics
  - Use mouse wheel to zoom network view
  - Right-click for contextual filtering options

#### 4.4 Time-to-Purchase Predictor

**Purchase Timing Visualization**
- **Purpose**: Show predicted timing for next purchases
- **Dimensions**: 480px × 380px
- **Primary Elements**:
  - Radial time gauge:
    - Concentric circles representing time intervals (7/30/90 days)
    - Center: Current date
    - Outer rings: Future time periods
    - Segment width: 24px per time ring
    - Background: Gradient from Midnight Navy (#0a1224) to Graphite (#232a36)
  - Product prediction markers:
    - Positioned based on predicted purchase timing
    - Shape: Product category icon within 36px circle
    - Border: 2px Electric Cyan (#00e0ff)
    - Confidence indicator: Opacity level (30%-100%)
  - Timing confidence bands:
    - Arcs showing confidence intervals for timing
    - Fill: Electric Cyan (#00e0ff) at 30% opacity
    - Width: Based on prediction confidence (wider = less certain)
  - Timeline labels:
    - Day/week/month markers in 12px Inter Regular
    - Current date indicator at center
    - Time scale toggles (days/weeks/months)
- **States**:
  - Default: All predicted products on radial timeline
  - Selected: Focus on specific product's timing prediction
  - Expanded: Show detailed purchase probability over time
  - Comparative: Multiple customer segments in different colors
- **Interaction Details**:
  - Click product marker to see detailed timing prediction
  - Drag time rings to adjust view scale
  - Hover marker to see purchase probability at that time
  - Toggle between absolute dates and relative time
  - Filter to specific product categories

#### 4.5 KPI Tiles Row

**Four KPI Tiles (120px × 120px each)**
1. **Prediction Accuracy**
   - **Value**: Percentage in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Visual**: 60px circular gauge with Electric Cyan (#00e0ff) fill
   - **Subtitle**: "Model Accuracy" in 12px Inter Regular
   - **States**: Good (>80%), Average (60-80%), Poor (<60%) with appropriate colors

2. **Top Recommendation**
   - **Value**: Product name in 16px Inter SemiBold
   - **Visual**: Product category icon, 32px
   - **Confidence**: Small horizontal bar showing confidence percentage
   - **States**: High (Electric Cyan), Medium (Blue), Low (Graphite)

3. **Purchase Window**
   - **Value**: Days in 32px Inter SemiBold
   - **Subtitle**: "Avg. Time to Purchase" in 12px
   - **Visual**: Small calendar icon with countdown indicator
   - **States**: Near (Signal Magenta), Medium (Electric Cyan), Far (Blue)

4. **Prediction Coverage**
   - **Value**: Percentage in 32px Inter SemiBold
   - **Visual**: Horizontal progress bar with product category icons
   - **Subtitle**: "Customers with predictions" in 12px
   - **States**: High (>90%), Medium (70-90%), Low (<70%)

### Secondary Visualizations

#### 4.6 Customer Segment Prediction Comparison

**Comparative Prediction Bars**
- **Purpose**: Compare prediction patterns across segments
- **Dimensions**: 540px × 360px
- **Visual Elements**:
  - Horizontal grouped bar chart:
    - Y-axis: Customer segments in 14px Inter Regular
    - X-axis: Prediction confidence (0-100%)
    - Bar height: 28px with 16px spacing
    - Bar color: Based on segment
      - High-value: Electric Cyan (#00e0ff)
      - Medium-value: #5fd4d6 (lighter cyan)
      - Low-value: #43cad0 (teal)
      - At-risk: Signal Magenta (#e930ff)
  - Confidence threshold markers:
    - Low: Vertical dashed line at 30%
    - Medium: Vertical dashed line at 60%
    - High: Vertical dashed line at 80%
    - Labels in 12px Inter Regular
  - Top product indicators:
    - Small product icons embedded in bars
    - Tooltip shows top 3 products per segment
  - Segment metrics:
    - Customer count per segment
    - Average prediction confidence
- **States**:
  - Default: All segments compared
  - Sorted: By confidence or customer count
  - Filtered: Show only selected segments
  - Focused: Detailed view of single segment

#### 4.7 Prediction Confidence Distribution

**Confidence Histogram**
- **Dimensions**: 400px × 280px
- **Implementation**: Histogram with density curve overlay
- **Visual Elements**:
  - X-axis: Confidence score (0-100%)
  - Y-axis: Number of predictions
  - Bars: Gradient fill based on confidence:
    - 0-30%: Graphite (#3a4459)
    - 30-60%: #3e7b97 (blue-gray)
    - 60-80%: #5fd4d6 (lighter cyan)
    - 80-100%: Electric Cyan (#00e0ff)
  - Density curve:
    - 2px Signal Magenta (#e930ff) line
    - No fill
  - Mean/median markers:
    - Vertical dashed lines
    - Mean: Electric Cyan (#00e0ff)
    - Median: #5fd4d6 (lighter cyan)
  - Threshold slider:
    - Interactive handle to set confidence cutoff
    - Label showing selected threshold value
- **States**:
  - Default: Full distribution view
  - Filtered: Based on selected products or segments
  - Threshold: Showing predictions above selected confidence
  - Comparative: Before/after model improvement

### Conversational Elements

#### 4.8 Prediction Insight Assistant

**AI Recommendation Advisor**
- **Purpose**: Provide AI-guided insights on predictions
- **Dimensions**: 400px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Prediction Insights" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px robot icon with Electric Cyan (#00e0ff) glow
- **Interaction Components**:
  - Input field: "Ask about predictions..." placeholder
  - Command palette with slash-commands:
    - /explain-prediction [product]
    - /compare-segments
    - /identify-opportunities
    - /optimize-recommendations
  - Response area with markdown support
- **Suggestion Chips**:
  - 4-6 contextual question suggestions
  - Background: #3a4459 (light graphite)
  - Border: 1px Electric Cyan (#00e0ff)
  - Text: 13px Inter Regular in Cloud White (#f7f9fb)
- **States**:
  - Collapsed: Tab visible on right edge of screen
  - Expanded: Full width with content
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Responding: Text appears with typing animation
  - Highlighting: Can highlight elements across dashboard

#### 4.9 Marketing Action Cards

**Actionable Recommendation Cards**
- **Dimensions**: 320px width, variable height
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Card Types**:
  - Product Promotion
  - Cross-sell Opportunity
  - Timing-based Campaign
  - Bundle Recommendation
- **Visual Elements**:
  - Header: Card type with appropriate icon
  - Title: Recommendation in 16px Inter SemiBold
  - Description: Details in 14px Inter Regular
  - Target metrics:
    - Expected conversion rate
    - Customer reach
    - Revenue potential
  - Product thumbnails:
    - Small 40px × 40px product images
    - Category icon if image unavailable
  - Confidence badge:
    - Small pill showing prediction confidence
    - Color coded by confidence level
- **States**:
  - Default: Collapsed summary view
  - Expanded: Full details with metrics
  - Applied: Checkmark overlay with success state
  - New: Subtle pulse animation on arrival
  - Dismissed: Slide-out animation

## 5. User Interaction Flow

1. **Initial Dashboard Loading**
   - Progressive revealing of components with staggered animation
   - KPI tiles appear first with counter animation (0-value to final)
   - Prediction confidence matrix loads with cell-by-cell reveal (100ms stagger)
   - Product affinity network nodes appear with spring animation
   - Default view shows predictions for next 30 days across all segments
   - Welcome message offers guided walkthrough option

2. **Customer Selection & Filtering**
   - Select customer segment from dropdown
   - Dashboard updates with 400ms crossfade transition
   - Affinity network reconfigures to show segment-specific patterns
   - Journey timeline updates to show representative customer path
   - KPI tiles update with segment-specific metrics
   - AI assistant generates segment-specific insights

3. **Product Exploration Flow**
   - Click product in affinity network
   - Network highlights connected products with pulsing animation
   - Matrix filters to show selected product and related recommendations
   - Journey timeline highlights occurrences of product
   - Side panel shows detailed product prediction metrics
   - Export button appears for product-specific report

4. **Prediction Confidence Analysis**
   - Adjust confidence threshold with slider
   - Matrix updates to highlight predictions above threshold
   - Filtered count updates in real-time
   - Below-threshold predictions fade to 30% opacity
   - Confidence distribution highlights selected range
   - Option to save threshold as preference

5. **Time Horizon Adjustment**
   - Select prediction timeframe (7/30/90 days)
   - Radial time gauge animates to new scale
   - Prediction markers redistribute based on timing
   - Purchase journey extends or contracts timeline
   - Confidence metrics update to reflect time horizon
   - New recommendation cards appear for selected timeframe

## 6. Integration with Other Tools

### Connected Data Flows
- **Transaction Patterns**: Supplies purchase sequence data
- **Customer Segmentation**: Provides segment definitions
- **Inventory Manager**: Receives prediction data for stock planning
- **Retention Planner**: Uses next purchase predictions for retention strategy

### Integration Touchpoints
- **Product Explorer**: Button to view detailed product information
- **Segment Navigator**: Link to customer segment analysis
- **Inventory Planner**: Button to forecast inventory needs based on predictions
- **Marketing Automation**: Action buttons to create targeted campaigns

### Cross-Tool Navigation
- Consistent customer segment selection across tools
- Shared product categorization and color coding
- Prediction results available throughout platform
- Direct links to related analyses in other tools

## 7. Technical Implementation Notes

### Visualization Rendering
- Plotly.js for matrix, histogram, and bar visualizations
- D3.js force-directed graph for product affinity network
- Canvas-based rendering for large product networks
- SVG for timeline and journey visualizations
- WebGL acceleration for complex network graphs

### Accessibility Considerations
- Color contrast ratio minimum 4.5:1 for all text elements
- Alternative text descriptions for all visualizations
- Keyboard navigation support for all interactive elements
- Screen reader optimized data tables as alternatives to visualizations
- Focus indicators for all interactive components

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: 2-column layout with stacked visualization sections
- **768-1023px**: Single column with prioritized visualizations
- **<768px**: Essential KPIs and simplified predictions list

### Performance Optimizations
- Lazy loading of secondary visualizations
- Prediction calculations performed server-side
- Caching of frequently accessed prediction results
- Throttled updates during filter interactions
- Incremental rendering for large product networks
- Data aggregation for segment-level visualizations 