# Engagement Classifier - UI/UX Specification

## 1. Tool Overview

The Engagement Classifier is an analytical tool that categorizes customers based on their engagement levels by analyzing interaction recency, transaction frequency, and purchase behaviors. The system:

- Segments customers into High, Medium, and Low engagement categories
- Analyzes customer loyalty metrics and RFM (Recency, Frequency, Monetary) scores
- Calculates key engagement metrics including transaction averages and purchase values
- Assesses activity patterns based on time-since-last-interaction
- Provides comparative analysis across engagement segments
- Enables temporal tracking of engagement shifts
- Supports targeted re-engagement campaigns based on segment insights

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer activity timestamps and recency metrics
- Transaction frequency counts and patterns
- Monetary value metrics (average purchase amount, total spend)
- RFM (Recency, Frequency, Monetary) score components
- Customer loyalty status classifications
- Days since last activity (key engagement determinator)
- Derived engagement levels (High, Medium, Low)

### Key Analysis Methods
- Time-based activity classification (30/90 day thresholds)
- Multi-dimensional engagement scoring
- Comparative segment metric analysis
- Temporal engagement pattern recognition
- Activity frequency distribution analysis
- Purchase value correlation with engagement
- Segmented behavioral profiling

## 3. Current vs. Target Visualization State

### Current State
The tool currently provides minimal visualization through:
- Simple text-based report with basic segmentation statistics
- Static engagement level counts without visualization
- Plain text representation of average metrics per segment
- No interactive filtering or temporal analysis
- Limited to three predefined engagement levels
- No visual representation of engagement distribution
- Lack of actionable insights beyond basic metrics

### Target State
Transform into a comprehensive engagement intelligence dashboard with:
- Interactive engagement distribution visualization with drill-down capabilities
- Temporal engagement flow tracking customer movement between segments
- Engagement health scoring with predictive indicators
- Comparative metric visualization across segments
- Activity timeline with engagement level transitions
- Actionable re-engagement opportunity identification
- Customizable engagement threshold management
- Integration with marketing activation tools

## 4. UI Component Design

### Primary Visualization: Engagement Intelligence Dashboard

#### 4.1 Engagement Distribution Pyramid

**Customer Engagement Hierarchy**
- **Purpose**: Visualize hierarchical distribution of customers across engagement levels
- **Dimensions**: 560px × 480px
- **Primary Elements**:
  - Pyramid structure with three tiers:
    - Top tier: High engagement (Electric Cyan #00e0ff)
    - Middle tier: Medium engagement (#5fd4d6 lighter cyan)
    - Bottom tier: Low engagement (Signal Magenta #e930ff)
  - Tier dimensions:
    - Height: Proportional (120px-160px) based on segment count 
    - Width: 480px (top), 520px (middle), 560px (bottom)
    - Corner radius: 8px
    - Border: 1px Midnight Navy (#0a1224)
  - Tier content:
    - Customer count: 28px Inter SemiBold, Cloud White (#f7f9fb)
    - Percentage: 16px Inter Regular, Cloud White (#f7f9fb)
    - Icon: Engagement-level specific (flame/pulse/battery)
    - Key metric: Mini-stat showing defining characteristic
  - Connector lines:
    - 2px vertical lines connecting tiers
    - Animated dots flowing up/down showing customer movement
    - Direction indicator showing net flow between segments
  - Threshold markers:
    - Small indicator showing 30-day threshold line
    - Small indicator showing 90-day threshold line
    - Drag handles for threshold adjustment
- **States**:
  - Default: Static pyramid showing current distribution
  - Time-comparison: Side-by-side pyramids showing different periods
  - Filtered: Applied customer segment filter with faded non-matching areas
  - Animated: Customer movement between tiers with transition effects
  - Interactive: Draggable threshold markers with real-time recalculation
- **Interaction Details**:
  - Click tier to select engagement level for detailed analysis
  - Drag threshold markers to adjust engagement level definitions
  - Hover for detailed segment metrics tooltip
  - Toggle between count and percentage views
  - Double-click for tier-specific detailed breakdown
  - Right-click for contextual export and action options

#### 4.2 Engagement Activity Timeline

**Temporal Engagement Flow**
- **Purpose**: Visualize customer engagement patterns over time
- **Dimensions**: 840px × 360px
- **Primary Elements**:
  - Main timeline chart:
    - X-axis: Time periods (daily, weekly, monthly options)
    - Y-axis: Customer count or percentage
    - Area bands for engagement levels:
      - High: Electric Cyan (#00e0ff) area with 70% opacity
      - Medium: #5fd4d6 (lighter cyan) area with 70% opacity
      - Low: Signal Magenta (#e930ff) area with 70% opacity
    - Stack mode: Showing total composition
    - Line mode: Showing trends per engagement level
    - Grid lines: 1px #3a4459 (light graphite) at 20% opacity
    - Period markers: 5px vertical lines for significant dates
  - Movement indicators:
    - Small arrows at each period showing direction of change
    - Arrow color based on positive/negative movement
    - Arrow size based on magnitude of change
  - Engagement event markers:
    - Small icons indicating marketing campaigns
    - Product launch indicators
    - Seasonal event markers
  - Time period selector:
    - Range slider with dual handles
    - Quick period buttons (30d, 90d, 1y, YTD)
    - Custom date range picker
    - Reset to default view button
- **States**:
  - Default: Stack view showing all engagement levels
  - Level focus: Highlight specific engagement level
  - Compare mode: Show two time periods side by side
  - Relative view: Display as percentages instead of counts
  - Event correlation: Highlight relationship between events and engagement shifts
- **Interaction Details**:
  - Click+drag to zoom specific time periods
  - Click engagement level in legend to isolate view
  - Hover for detailed metrics at specific time points
  - Double-click event marker to see event details
  - Toggle between absolute counts and percentages
  - Export timeline data for specific periods

#### 4.3 Engagement Metric Comparison

**Cross-Segment Analysis**
- **Purpose**: Compare key metrics across engagement segments
- **Dimensions**: 720px × 420px
- **Primary Elements**:
  - Radar comparison chart:
    - Six-axis radar with key metrics:
      - Transaction Frequency
      - Purchase Value
      - Recency
      - Loyalty Status
      - RFM Score
      - Account Age
    - Three overlaid areas for engagement levels:
      - High: Electric Cyan (#00e0ff) with 60% opacity
      - Medium: #5fd4d6 (lighter cyan) with 60% opacity
      - Low: Signal Magenta (#e930ff) with 60% opacity
    - Axis labels: 14px Inter Regular, Cloud White (#f7f9fb)
    - Concentric grid lines: 1px #3a4459 (light graphite) at 30% opacity
    - Scale markers: 5 levels per axis
  - Alternative bar comparison:
    - Grouped bar chart format
    - Same metrics as radar chart
    - Bar groups by metric
    - Bar colors match engagement levels
  - Metric selector:
    - Toggle buttons for each metric
    - Selected: Electric Cyan (#00e0ff) pill background
    - Unselected: Graphite (#232a36) pill background
    - Reset selection button
  - Visualization toggle:
    - Radar vs. Bar chart option
    - Selected view has animated transition
- **States**:
  - Default: All metrics for all engagement levels
  - Filtered: Selected metrics only
  - Single segment: Focus on one engagement level
  - Comparison: Benchmark current vs. previous period
  - Normalized: Scale adjusted for better comparison
- **Interaction Details**:
  - Click metric axis to focus on that metric
  - Hover areas for detailed segment values
  - Toggle between absolute values and indexed scores
  - Select specific segments to highlight in comparison
  - Switch between visualization modes
  - Export comparison data to CSV

#### 4.4 Re-engagement Opportunity Finder

**Actionable Insight Generator**
- **Purpose**: Identify opportunities for re-engaging customers
- **Dimensions**: 480px × 400px
- **Primary Elements**:
  - Opportunity matrix:
    - X-axis: Engagement potential (Low to High)
    - Y-axis: Customer value (Low to High)
    - Bubble plot with customer segments
    - Bubble size: Customer count in segment
    - Bubble color: Based on primary value driver
    - Quadrant divisions: 2px dashed Cloud White (#f7f9fb) at 30% opacity
    - Quadrant labels:
      - Top-right: "Priority Re-engage" (high value, high potential)
      - Top-left: "Nurture" (high value, low potential)
      - Bottom-right: "Bulk Activation" (low value, high potential)
      - Bottom-left: "Monitor" (low value, low potential)
  - Opportunity cards:
    - 320px × 160px insight cards
    - Background: Gradient from #232a36 to #2c3341
    - Border-left: 4px Electric Cyan (#00e0ff)
    - Title: 16px Inter SemiBold, Cloud White (#f7f9fb)
    - Description: 14px Inter Regular, Cloud White (#f7f9fb) at 90% opacity
    - Metrics: Key performance indicators for opportunity
    - Action button: "Create Campaign" with marketing platform integration
  - Targeting controls:
    - Value threshold slider
    - Engagement potential threshold slider
    - Minimum segment size input
    - "Find Opportunities" action button
  - Recommendation engine:
    - AI-driven suggestions based on behavioral patterns
    - Success probability scores
    - Estimated impact calculations
- **States**:
  - Default: Matrix view with major segments
  - Selected: Focus on specific opportunity with expanded card
  - Threshold: Visualization of how threshold changes affect opportunities
  - Action: Campaign creation mode with targeting options
  - Results: Post-campaign effectiveness view
- **Interaction Details**:
  - Click bubble to select customer segment
  - Drag thresholds to redefine opportunity criteria
  - Hover quadrants for strategy recommendations
  - Click opportunity card to expand full details
  - Export segment to marketing platforms
  - Save opportunity configurations for future use

#### 4.5 KPI Tiles Row

**Five Engagement KPI Tiles (120px × 120px each)**
1. **Total Customers**
   - **Value**: Count in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Segment Breakdown**: Mini pie chart showing engagement distribution
   - **Trend**: Small arrow with percentage change vs. previous period
   - **States**: Default, Hover (reveals exact counts per segment)

2. **Average Engagement Score**
   - **Value**: Score (0-100) in 32px Inter SemiBold
   - **Visual**: Circular gauge with score-based Electric Cyan (#00e0ff) fill
   - **Context**: Benchmark indicator showing vs. target
   - **States**: High (>70), Medium (40-70), Low (<40) with appropriate colors

3. **Days Since Activity**
   - **Value**: Average days in 32px Inter SemiBold
   - **Visual**: Horizontal gauge with segments at 30 and 90 days
   - **Indicator**: Marker showing current position
   - **States**: Recent (<30 days), Moderate (30-90 days), Inactive (>90 days)

4. **Engagement Trend**
   - **Value**: Direction in 16px Inter SemiBold
   - **Visual**: Sparkline showing 30-day trend with directional arrow
   - **Color Logic**: Electric Cyan (#00e0ff) for improving, Signal Magenta (#e930ff) for declining
   - **States**: Improving, Stable, Declining with appropriate visuals

5. **Re-engagement Opportunities**
   - **Value**: Count in 32px Inter SemiBold
   - **Visual**: Stacked cards icon showing opportunity count
   - **Priority**: Color-coded priority indicator
   - **States**: Default, Alert (pulses when high-value opportunities available)

### Secondary Visualizations

#### 4.6 RFM Component Analysis

**Engagement Factor Breakdown**
- **Purpose**: Analyze the contribution of RFM components to engagement
- **Dimensions**: 560px × 320px
- **Implementation**: Multi-part stacked bar chart
- **Visual Elements**:
  - Stacked horizontal bars for each engagement level:
    - Bar height: 80px with 24px spacing
    - Section colors:
      - Recency: Electric Cyan (#00e0ff)
      - Frequency: #5fd4d6 (lighter cyan)
      - Monetary: #43cad0 (teal)
    - Labels: Component name and percentage contribution
    - Bar width: 100% of container minus padding
  - Average RFM score overlay:
    - Small circular gauge for each component
    - Position aligned with respective bar section
    - Score displayed in 16px Inter SemiBold
  - Component toggle controls:
    - Toggle buttons for isolating components
    - Selected: Electric Cyan (#00e0ff) pill
    - Unselected: Graphite (#232a36) pill
  - Insight callouts:
    - Small annotation cards highlighting significant findings
    - Arrow pointing to relevant data point
    - Brief insight text in 12px Inter Regular
- **States**:
  - Default: All components for all segments
  - Component focus: Highlight specific RFM component
  - Segment focus: Focus on specific engagement level
  - Comparative: Two periods side by side
  - Normalized: Equal bar widths for better component comparison

#### 4.7 Engagement Activity Patterns

**Behavioral Pattern Analysis**
- **Dimensions**: 480px × 320px
- **Implementation**: Heatmap calendar
- **Visual Elements**:
  - Calendar grid:
    - Days of week (columns)
    - Time of day (rows)
    - Cell size: 28px × 28px
    - Cell color: Activity density gradient
      - Low activity: Midnight Navy (#0a1224)
      - Medium activity: #3e7b97 (blue-gray)
      - High activity: Electric Cyan (#00e0ff)
    - Grid lines: 1px #0a1224 (Midnight Navy)
  - Engagement level selector:
    - Tabs for High/Medium/Low segments
    - Active tab: Underlined with segment color
    - Inactive: Graphite (#232a36) background
  - Pattern highlights:
    - Peak activity times outlined with 2px dashed Cloud White (#f7f9fb)
    - Inactive periods with diagonal hash pattern
    - Notable patterns with annotation callouts
  - Time period controls:
    - Buttons for different aggregation levels (week, month, quarter)
    - Date range selector for custom periods
- **States**:
  - Default: Current period activity pattern
  - Segment-specific: Pattern for selected engagement level
  - Comparative: Overlay patterns from multiple segments
  - Difference: Highlight pattern changes between periods
  - Predictive: Show expected future activity patterns

### Conversational Elements

#### 4.8 Engagement Insight Assistant

**AI-Powered Engagement Analysis**
- **Purpose**: Provide AI-guided insights on engagement patterns
- **Dimensions**: 380px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Engagement Insights" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px animated assistant icon with Electric Cyan (#00e0ff) glow
- **Interaction Components**:
  - Input field: "Ask about engagement..." placeholder
  - Command palette with slash-commands:
    - /analyze-segment [engagement-level]
    - /compare-periods [period1] [period2]
    - /identify-opportunities
    - /explain-patterns
    - /recommend-actions
  - Response area with markdown support
  - Voice dictation option
- **Insight Cards**:
  - Automatically generated insights
  - Priority indicators
  - Expandable/collapsible sections
  - Interactive charts embedded in responses
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full width with content
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Response: Text appears with typing animation
  - Highlighting: Can highlight elements across dashboard

#### 4.9 Engagement Campaign Generator

**Marketing Action Builder**
- **Dimensions**: 360px width, expandable
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Components**:
  - Segment target selector:
    - Engagement level multi-select
    - Additional filtering criteria
    - Estimated audience size
    - Preview audience composition
  - Campaign template library:
    - Template cards with preview thumbnails
    - Template categories (winback, nurture, loyalty)
    - Sort by effectiveness rating
    - Filter by campaign type
  - Customization controls:
    - Message content editor
    - Incentive value selector
    - Channel selection (email, SMS, app notification)
    - Timing optimization tools
  - Performance projection:
    - Expected engagement lift
    - Estimated ROI calculator
    - Benchmark comparison
    - Confidence rating
- **States**:
  - Selection: Choosing target segments
  - Design: Creating campaign content
  - Review: Campaign summary before launch
  - Scheduled: Timing and deployment settings
  - Active: Showing live campaign performance
  - Complete: Results analysis view

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with central pulse animation
   - KPI tiles appear first with counter animation (0 to final values)
   - Engagement pyramid builds from bottom up (200ms per tier)
   - Timeline reveals with left-to-right animation
   - Default view shows current month vs. previous month
   - Welcome message offers quick filter options by engagement level

2. **Engagement Level Exploration**
   - Click engagement tier in pyramid
   - Dashboard filters to selected level with crossfade transition
   - Metrics update to show segment-specific values
   - Activity pattern heatmap updates to selected segment
   - RFM breakdown recalculates for selected segment
   - Right panel shows segment-specific insights and opportunities
   - Export segment button appears for marketing actions

3. **Temporal Analysis Flow**
   - Adjust time period using timeline controls
   - Dashboard updates with smooth transition animation
   - Comparative view shows current vs. selected historical period
   - Movement indicators highlight significant changes
   - Trend sparklines update in KPI tiles
   - AI assistant generates period-specific insights
   - Option to save view as custom report

4. **Opportunity Identification Workflow**
   - Navigate to opportunity finder
   - Adjust value and potential thresholds
   - Matrix updates with segment bubbles repositioning
   - Click promising segment to generate opportunity card
   - Review AI-suggested engagement tactics
   - Select opportunity to expand full recommendation
   - Create campaign button initiates marketing workflow

5. **Re-engagement Campaign Creation**
   - Select target engagement level(s)
   - Choose campaign template from library
   - Customize messaging and incentives
   - Set campaign parameters (timing, channels, budget)
   - Review projected performance metrics
   - Schedule or launch campaign
   - Set up performance tracking dashboard

## 6. Integration with Other Tools

### Connected Data Flows
- **Transaction Patterns**: Shares customer activity data and purchase patterns
- **Customer Segmentation**: Receives segment definitions and attributes
- **Churn Prediction**: Sends engagement metrics as prediction inputs
- **Retention Planner**: Receives engagement levels for retention planning
- **Customer Lifetime Value**: Incorporates engagement scores in value calculation

### Integration Touchpoints
- **Marketing Automation**: One-click segment export to campaign tools
- **Customer Journey Mapping**: View engagement level transitions in journey context
- **Sales Dashboard**: Filter sales metrics by engagement level
- **Product Recommendations**: Generate recommendations based on engagement level
- **Performance Analyzer**: Track KPI impacts on engagement metrics

### Cross-Tool Navigation
- Unified customer selection across all tools
- Consistent engagement level definitions and color coding
- Shared time period selection and filtering
- Coordinated data refreshes and calculations
- Linked analyses with seamless context switching

## 7. Technical Implementation Notes

### Data Processing Requirements
- Real-time RFM score calculation for large customer sets
- Efficient temporal data aggregation for trend analysis
- Period-over-period comparison calculation
- Engagement threshold application with custom parameters
- Segment transition tracking between time periods

### Accessibility Considerations
- Color blind friendly palette with distinctive patterns for segments
- High contrast mode with enhanced borders and text
- Screen reader support for all data visualizations
- Keyboard navigation with visible focus indicators
- Alternative text representations of graphical elements
- Text scaling without breaking layout

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: Two-column layout with stacked visualization panels
- **768-1023px**: Single column with prioritized visualizations
- **<768px**: Essential KPIs and simplified engagement pyramid

### Performance Optimizations
- Client-side caching of engagement calculations
- Deferred loading of secondary visualizations
- Data aggregation for long time periods
- Throttled updates during user interactions
- Progressive enhancement for complex visualizations
- Virtualized rendering for large customer segments 