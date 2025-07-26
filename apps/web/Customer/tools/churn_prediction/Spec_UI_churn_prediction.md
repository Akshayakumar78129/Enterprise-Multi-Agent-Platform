# Churn Prediction - UI/UX Specification

## 1. Tool Overview

The Churn Prediction tool is a sophisticated analytics engine that uses machine learning to identify customers at risk of abandoning the business. The system:

- Applies logistic regression to predict individual customer churn probability
- Categorizes customers into risk levels (Low, Medium, High, Very High)
- Identifies key contributing factors for each customer's churn risk
- Analyzes churn patterns across different customer segments
- Provides customizable time period analysis windows
- Integrates RFM scoring and transaction metrics for prediction
- Generates comprehensive visual reports for risk distribution
- Offers strategic recommendations for retention efforts

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer loyalty metrics (RFM scores, loyalty status)
- Transaction history (frequency, recency, value)
- Engagement patterns (days since last activity)
- Purchase behavior (transaction count, average value)
- Return metrics and product diversity
- Customer status and credit information
- Risk classification and probability scores
- Contributing factors for churn prediction

### Key Analysis Methods
- Logistic regression with L1 regularization
- Feature importance assessment
- Probability thresholding for risk categorization
- ROC curve and AUC evaluation
- Multi-dimensional feature comparison
- Standardized scaling of input features
- Time-windowed metric calculation
- Hierarchical risk stratification

## 3. Current vs. Target Visualization State

### Current State
The tool currently provides limited visualization through:
- Simple matplotlib bar charts for risk distribution
- Basic histogram for probability distribution
- Static image files saved as base64 encoded strings
- Simple text-based reports with markdown formatting
- No interactive filtering or exploration capabilities
- Limited visual identification of contributing factors
- No ability to compare customer segments
- Minimal visual context for risk classification

### Target State
Transform into a comprehensive churn intelligence system with:
- Interactive churn prediction dashboard with risk segmentation
- Multi-dimensional customer risk explorer
- Contributing factor analysis with feature importance visualization
- Temporal churn patterns with trend analysis
- Customer segment comparison with visualization
- Drill-down capability for individual customer risk profiles
- Interactive what-if scenario modeling
- Targeted retention strategy recommendation engine
- ML model performance monitoring and improvement metrics

## 4. UI Component Design

### Primary Visualization: Churn Intelligence Dashboard

#### 4.1 Risk Distribution Overview

**Churn Risk Pyramid**
- **Purpose**: Visualize the distribution of customers across risk levels
- **Dimensions**: 520px × 400px
- **Primary Elements**:
  - Risk pyramid:
    - Four-level pyramid structure showing risk distribution
    - "Very High" (top): Signal Magenta (#e930ff) 
    - "High": #aa45dd (muted purple)
    - "Medium": #5fd4d6 (lighter cyan)
    - "Low" (bottom): Electric Cyan (#00e0ff)
    - Width: Proportional to customer count at each risk level
    - Height: 80px per level with 4px separation
    - Value display: Count and percentage in 14px Inter SemiBold, Cloud White (#f7f9fb)
    - Tooltip: Additional metrics on hover
  - Risk transition indicators:
    - Small arrows showing movement between risk categories
    - Color: Direction-based (upward: Signal Magenta, downward: Electric Cyan)
    - Size: Based on number of transitioning customers
  - Time period selector:
    - Dropdown with preset options: "last_30_days", "last_90_days", "last_180_days", "last_year" 
    - Custom date range picker with calendar interface
    - Currently selected: Pill with Electric Cyan (#00e0ff) background
  - Model confidence indicator:
    - Small gauge showing model confidence level
    - Tooltip with ROC AUC score and explanation
    - Color: Confidence-based (high: Electric Cyan, low: Signal Magenta)
- **States**:
  - Default: All customers grouped by risk level
  - Filtered: Applied segment or timeframe filter
  - Comparative: Side-by-side risk levels from different time periods
  - Animation: Showing transitions between risk levels over time
  - Loading: Pulsing skeleton during calculation
  - Empty: Zero-state with suggestions
- **Interaction Details**:
  - Click risk level to filter dashboard to that level
  - Hover for detailed count and percentage at each level
  - Select time period to update entire dashboard
  - Right-click for export options
  - Toggle between count and percentage views
  - Click transition arrows to see detailed movement analysis

#### 4.2 Churn Probability Distribution

**Probability Density Visualization**
- **Purpose**: Visualize the distribution of churn probabilities across customers
- **Dimensions**: 640px × 320px
- **Primary Elements**:
  - Main distribution chart:
    - X-axis: Churn probability (0-1)
    - Y-axis: Count of customers
    - Histogram bars:
      - Width: Based on bin size (default 30 bins)
      - Color: Gradient based on probability
      - Low probability: Electric Cyan (#00e0ff)
      - Medium probability: Gradient mix
      - High probability: Signal Magenta (#e930ff)
    - Risk level thresholds:
      - Vertical lines at 0.3, 0.6, and 0.8
      - Labels showing risk level transitions
      - 1px dashed Cloud White (#f7f9fb) lines
    - Density curve overlay:
      - 2px solid Cloud White (#f7f9fb) line
      - Semi-transparent area fill beneath
  - Bin control:
    - Slider to adjust bin count (5-50)
    - Reset button to default (30 bins)
  - Segment comparison toggle:
    - Option to overlay multiple segment distributions
    - Segment selector with color-coded legend
    - Transparency control for overlapping distributions
  - Threshold adjustment:
    - Draggable threshold markers
    - Immediate update of risk level counts
    - Reset to default thresholds option
- **States**:
  - Default: All customers in single distribution
  - Segment overlay: Multiple segment distributions
  - Log scale: Alternative Y-axis for skewed distributions
  - Cumulative: Showing cumulative distribution function
  - Zoomed: Focus on specific probability range
- **Interaction Details**:
  - Hover bins for detailed customer count
  - Drag threshold markers to customize risk levels
  - Click segment in legend to toggle visibility
  - Drag to zoom into specific probability range
  - Toggle between count and density views
  - Export distribution data and visualization

#### 4.3 Contributing Factors Analysis

**Feature Importance Visualization**
- **Purpose**: Identify and visualize key factors contributing to churn risk
- **Dimensions**: 520px × 480px
- **Primary Elements**:
  - Factor importance bar chart:
    - Horizontal bars for each feature
    - Length: Based on importance score
    - Color: Gradient from Graphite (#232a36) to Signal Magenta (#e930ff)
    - Bar height: 32px with 12px spacing
    - Feature labels: 14px Inter Regular, Cloud White (#f7f9fb)
    - Value labels: Importance score in 12px Inter Regular
    - Sort controls: By importance, alphabetical, category
  - Factor correlation heatmap:
    - 300px × 300px grid showing feature relationships
    - Cell color: Correlation strength
      - Positive correlation: Electric Cyan (#00e0ff) gradient
      - Negative correlation: Signal Magenta (#e930ff) gradient
      - No correlation: Midnight Navy (#0a1224)
    - Cell size: Dynamic based on feature count
    - Hierarchical clustering of related features
    - Tooltip: Detailed correlation statistics
  - Factor distribution comparison:
    - Toggle to show distribution differences between risk levels
    - Mini histograms for each feature
    - Churned vs. retained distribution overlay
  - Factor detail panel:
    - Appears on feature selection
    - Shows detailed statistics and explanation
    - Time trend of feature importance
    - Related features and interactions
- **States**:
  - Default: Sorted by importance score
  - Filtered: Features relevant to selected risk level
  - Selected: Focus on specific feature with details
  - Comparative: Showing importance change over time
  - Categorical: Grouped by feature category
- **Interaction Details**:
  - Click feature bar to view detailed breakdown
  - Hover correlation cells to highlight relationships
  - Toggle between global and risk-level specific importance
  - Filter features by category or relevance
  - Compare feature importance across time periods
  - Search for specific features

#### 4.4 Customer Risk Explorer

**Individual Risk Analysis**
- **Purpose**: Explore individual customer risk profiles
- **Dimensions**: 840px × 580px
- **Primary Elements**:
  - Customer risk table:
    - Sortable columns: ID, Name, Risk Level, Probability, Key Factors
    - Row background: Subtle gradient based on risk level
    - Row height: 48px with 1px separator
    - Page size: 20 customers with pagination
    - Quick filters: Search, risk level, segment
    - Column customization menu
  - Customer risk card:
    - Expanded view for selected customer
    - Dimensions: 400px × 320px
    - Background: Gradient from #232a36 to #2c3341
    - Border: 2px with risk-level color
    - Border-radius: 16px
    - Header:
      - Customer ID and name in 16px Inter SemiBold
      - Risk level indicator: Pill with appropriate color
      - Probability score: Circular gauge with percentage
    - Contributing factors:
      - Top 3 factors with importance bars
      - Factor labels with values compared to average
      - Visual indicators for abnormal values
    - Historical risk:
      - Small 160px × 60px sparkline showing risk trend
      - Risk level transitions with date markers
    - Action buttons:
      - "Retention Plan" button: Pill with Electric Cyan (#00e0ff) background
      - "Customer Profile" button: Outline style
      - "Flag for Review" button: Text-only with hover effect
  - Advanced filter panel:
    - Multi-select criteria builder
    - Saved filter templates
    - Complex filter visualization
    - Quick filter actions
  - Bulk action controls:
    - Selection checkboxes for customers
    - Bulk action dropdown menu
    - Selection summary with statistics
    - Export selected customers option
- **States**:
  - Default: Paginated table of all customers
  - Details: Expanded view of selected customer
  - Filtered: Applied search or filter criteria
  - Selection: Multiple customers selected for bulk action
  - Sorted: Ordered by selected column
  - Comparison: Side-by-side view of multiple customers
- **Interaction Details**:
  - Click row to expand customer details
  - Sort by column header
  - Filter using search or filter controls
  - Select multiple customers with checkboxes
  - Export selection to CSV or retention planner
  - Navigate between pages with pagination controls
  - Right-click for contextual actions

#### 4.5 KPI Tiles Row

**Five Churn KPI Tiles (120px × 120px each)**
1. **Overall Churn Risk**
   - **Value**: Percentage in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Trend**: Arrow showing movement vs. previous period
   - **Visual**: Circular gauge showing overall risk level
   - **States**: Low (<10%), Medium (10-20%), High (>20%)

2. **High Risk Count**
   - **Value**: Count in 32px Inter SemiBold
   - **Subtitle**: "High + Very High" in 12px Inter Regular
   - **Visual**: Small horizontal bar showing high risk proportion
   - **States**: Stable, Increasing (pulses Signal Magenta), Decreasing (pulses Electric Cyan)

3. **Model Confidence**
   - **Value**: AUC score in 32px Inter SemiBold
   - **Subtitle**: "ROC AUC" in 12px Inter Regular
   - **Visual**: Small 5-star rating based on score
   - **States**: High (>0.8), Medium (0.7-0.8), Low (<0.7)

4. **Top Churn Factor**
   - **Value**: Factor name in 16px Inter SemiBold
   - **Visual**: Small icon representing factor category
   - **Subtitle**: Importance percentage in 12px Inter Regular
   - **States**: Stable, New (highlighted with animation)

5. **Risk Transition**
   - **Value**: Net change in 32px Inter SemiBold
   - **Subtitle**: "Risk Level Changes" in 12px Inter Regular
   - **Visual**: Small arrow chart showing movements between levels
   - **States**: Improving (green), Stable (neutral), Worsening (red)

### Secondary Visualizations

#### 4.6 Temporal Risk Pattern

**Time-based Risk Tracking**
- **Purpose**: Visualize churn risk evolution over time
- **Dimensions**: 680px × 320px
- **Implementation**: Stacked area chart with threshold lines
- **Visual Elements**:
  - Main timeline:
    - X-axis: Time periods (days, weeks, months)
    - Y-axis: Customer count or percentage
    - Stacked areas: 
      - Very High risk: Signal Magenta (#e930ff)
      - High risk: #aa45dd (muted purple)
      - Medium risk: #5fd4d6 (lighter cyan)
      - Low risk: Electric Cyan (#00e0ff)
    - Risk threshold lines: 1px dashed lines separating risk levels
    - Event markers: Small icons for system changes or campaigns
  - Time resolution controls:
    - Toggle buttons for day/week/month/quarter view
    - Custom time range selector
    - Comparison period option
  - Risk transition indicators:
    - Small arrows showing significant shifts
    - Tooltip with transition details
  - Business event overlay:
    - Toggle to show marketing campaigns, product launches
    - Vertical bands indicating event duration
    - Event icons with tooltips
- **States**:
  - Default: Stacked percentage view
  - Absolute: Showing customer counts instead of percentages
  - Comparative: Current vs. previous period overlay
  - Event: Highlighting relationship with business events
  - Individual: Showing single risk level isolated
  - Normalized: Adjusted for customer base changes

#### 4.7 Segment Comparison Matrix

**Cross-segment Risk Analysis**
- **Dimensions**: 560px × 420px
- **Implementation**: Heat map with drill-down capability
- **Visual Elements**:
  - Segment matrix:
    - Row headers: Customer segments
    - Column headers: Risk levels and metrics
    - Cell color: Heat map based on value
    - Cell size: 64px × 48px
    - Text: Value and change indicator
    - Border: 1px #0a1224 (Midnight Navy)
  - Metric selectors:
    - Pills showing available metrics
    - Active metric highlighted with Electric Cyan (#00e0ff) border
    - Quick views for common metric combinations
  - Segment grouping controls:
    - Hierarchy selector for segment grouping
    - Expand/collapse segment groups
    - Search and filter segments
  - Normalization toggle:
    - Switch between absolute values and normalized scores
    - Percentage vs. count view option
    - Z-score normalization option
  - Sort controls:
    - Sort by column value
    - Sort by row name
    - Sort by variance or trend
- **States**:
  - Default: Complete matrix of all segments
  - Filtered: Selected segments or metrics
  - Expanded: Detailed view of selected segment
  - Sorted: Ordered by selected criteria
  - Hierarchical: Segments grouped by hierarchy
  - Comparative: Showing change values instead of absolutes

### Conversational Elements

#### 4.8 Churn Insight Assistant

**AI-Powered Churn Analysis**
- **Purpose**: Provide AI-guided insights on churn patterns and recommendations
- **Dimensions**: 380px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Churn Insights" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px animated assistant icon with Electric Cyan (#00e0ff) glow
- **Interaction Components**:
  - Input field: "Ask about churn..." placeholder
  - Command palette with slash-commands:
    - /analyze-segment [segment-name]
    - /compare-periods [period1] [period2]
    - /explain-factor [factor-name]
    - /recommend-actions [risk-level]
    - /predict-trend
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
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full width with content
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Response: Text appears with typing animation
  - Highlighting: Can highlight elements across dashboard

#### 4.9 Retention Strategy Builder

**Action Recommendation System**
- **Dimensions**: 320px width, expandable to 480px
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Components**:
  - Strategy recommendations:
    - Card size: 300px width, variable height
    - Background: Midnight Navy (#0a1224)
    - Border-left: 4px with priority color
    - Title: 16px Inter SemiBold in Cloud White (#f7f9fb)
    - Description: 14px Inter Regular in Cloud White (#f7f9fb)
    - Impact estimate: Expected retention improvement
    - Effort indicator: Implementation difficulty scale
  - Target selector:
    - Risk level filter pills
    - Segment selector dropdown
    - Custom audience builder
    - Saved audience quick select
  - Action templates:
    - Pre-defined retention tactics
    - Customization options
    - Success metrics and KPIs
    - Resource requirements
  - Implementation controls:
    - Campaign scheduler
    - Resource allocation
    - Approval workflow
    - Results tracking setup
- **States**:
  - Default: Prioritized recommendations
  - Custom: User-defined strategy building
  - Simulation: Projected impact analysis
  - Implementation: Execution tracking
  - Results: Effectiveness measurement
  - Comparison: Multiple strategy evaluation

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with pulsing animation
   - KPI tiles appear first with counter animations
   - Risk pyramid builds with customer count animations
   - Probability distribution draws from left to right
   - Default view shows 90-day time window, all segments
   - Initial insights appear in right panel highlighting key patterns
   - High-risk customers pulse briefly to draw attention

2. **Risk Level Exploration**
   - Click risk level in pyramid visualization
   - Dashboard filters to show only selected risk level
   - Customer table updates to show filtered customers
   - Contributing factors recalculate for selected risk level
   - Time pattern chart highlights selected risk level
   - Segment matrix filters to show selected risk comparisons
   - Export option appears for filtered customer list

3. **Factor Analysis Workflow**
   - Select feature in contributing factors visualization
   - Detailed feature statistics panel expands
   - Distribution comparison appears for selected feature
   - Correlation highlights show related features
   - Customer table sorts by feature value
   - Insight assistant generates feature-specific insights
   - Action recommendations update based on feature

4. **Customer Profile Analysis**
   - Select specific customer from table view
   - Detailed customer card expands with risk profile
   - Historical risk trend appears with key events
   - Top contributing factors highlight with customer-specific values
   - Similar customers appear as recommendations
   - Custom retention actions generate based on profile
   - Option to add notes or flag for follow-up

5. **Retention Planning Process**
   - Filter to target customer segment
   - View recommended retention strategies
   - Customize strategy parameters
   - Simulate expected impact on churn metrics
   - Schedule implementation timeline
   - Assign team responsibilities
   - Set up monitoring and success metrics

## 6. Integration with Other Tools

### Connected Data Flows
- **Customer Segmentation**: Provides segment definitions for targeted analysis
- **Transaction Patterns**: Supplies behavior patterns for churn prediction
- **Retention Planner**: Receives high-risk customers for intervention
- **Financial Tool**: Feeds revenue impact of predicted churn
- **Customer Lifetime Value**: Shares value metrics for prioritization

### Integration Touchpoints
- **Customer Profile**: Button to view complete customer details
- **Retention Planning**: Export high-risk customers to retention tools
- **Segment Definition**: Button to create segment from similar customers
- **Value Assessment**: Link to revenue impact calculator
- **Performance Tracking**: Connection to retention campaign results

### Cross-Tool Navigation
- Unified risk assessment framework across all tools
- Consistent customer identification and selection
- Shared time period and segment filtering
- Synchronized model training and evaluation
- Integrated lifecycle stage tracking

## 7. Technical Implementation Notes

### Data Processing Requirements
- Efficient logistic regression for large customer sets
- Real-time feature importance calculation
- Background model training with progress indicator
- Incremental model updating with new data
- Threshold-based alert system for risk level transitions

### Accessibility Considerations
- Color blind friendly palette with shape indicators for risk levels
- Screen reader support for risk descriptions and recommendations
- Keyboard navigation for all dashboard elements
- Text alternatives for all visualizations
- Focus indicators for interactive elements
- Scalable text without breaking dashboard layout

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: Two-column layout with stacked visualization panels
- **768-1023px**: Single column with prioritized risk displays
- **<768px**: Essential KPIs and high-risk customers in simplified view

### Performance Optimizations
- Client-side caching of risk calculations
- Progressive loading of visualization components
- Feature importance calculation on demand
- Data sampling for large customer bases
- WebWorker-based risk scoring
- Virtualized rendering for customer tables
- Efficient matrix rendering with canvas-based heatmaps 