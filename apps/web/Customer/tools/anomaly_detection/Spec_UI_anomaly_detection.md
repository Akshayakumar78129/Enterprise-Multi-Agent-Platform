# Anomaly Detection - UI/UX Specification

## 1. Tool Overview

The Anomaly Detection tool is an advanced analytical system that identifies unusual patterns and outliers in customer behavior and transaction data. The system:

- Detects statistical anomalies across multiple customer behavior dimensions
- Applies machine learning (Isolation Forest) to identify outlier patterns
- Scores and categorizes anomalies by severity level (1-5 scale)
- Segments anomalies by customer type, region, and behavior patterns
- Highlights specific abnormal features that contribute to anomaly detection
- Provides detailed analysis of top anomalies with contextual information
- Enables time-window based analysis for temporal pattern recognition
- Supports filtering by customer segments for targeted investigation

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer transaction metrics (count, value, range)
- Engagement patterns (sessions, duration, page views)
- Technical interaction data (errors, unique errors)
- Customer segmentation attributes
- Geographic/regional dimensions
- Anomaly scores from isolation forest model
- Feature-specific severity ratings
- Overall severity classification

### Key Analysis Methods
- Isolation Forest for unsupervised anomaly detection
- StandardScaler for feature normalization
- Z-score calculation for feature-specific severity
- Multi-dimensional feature comparison
- Severity thresholding for anomaly classification
- Segment-based anomaly distribution analysis
- Regional anomaly pattern identification
- Temporal comparison across time windows

## 3. Current vs. Target Visualization State

### Current State
The tool currently provides minimal visualization through:
- Simple text-based reports with markdown formatting
- No visual representation of anomalies or patterns
- Basic statistics presented as text percentages
- Limited interactivity with static output
- No ability to drill down into specific anomalies
- Fixed time window without dynamic adjustment
- No comparative analysis capability
- Lack of visual context for severity scores

### Target State
Transform into a comprehensive anomaly intelligence system with:
- Interactive anomaly detection dashboard with multi-dimensional visualization
- Real-time anomaly scoring with visual severity indicators
- Customer anomaly maps showing distribution patterns
- Feature contribution analysis with explainable insights
- Temporal anomaly pattern explorer with trend visualization
- Comparative analysis across segments and regions
- Drill-down capability for individual anomaly investigation
- Alert configuration and tracking system
- AI-assisted anomaly explanation and recommendation engine

## 4. UI Component Design

### Primary Visualization: Anomaly Intelligence Dashboard

#### 4.1 Anomaly Distribution Overview

**Anomaly Severity Visualization**
- **Purpose**: Visualize the distribution of anomalies by severity level across the customer base
- **Dimensions**: 520px × 380px
- **Primary Elements**:
  - Severity pyramid:
    - Five-level pyramid structure showing severity distribution
    - Level 5 (top): Signal Magenta (#e930ff) for highest severity
    - Level 4: #aa45dd (muted purple)
    - Level 3: #5891cb (blue)
    - Level 2: #5fd4d6 (lighter cyan)
    - Level 1 (bottom): Electric Cyan (#00e0ff) for lowest severity
    - Width: Proportional to customer count in each severity level
    - Height: Fixed 60px per level with 4px separation
    - Value display: Count and percentage in 14px Inter SemiBold, Cloud White (#f7f9fb)
  - Severity score legend:
    - Horizontal gradient bar: 480px × 16px
    - Scale: 1-5 with interval markers
    - Labels: Brief severity descriptions
    - Color: Matching pyramid level colors
  - Threshold marker:
    - Vertical line indicator showing significant anomaly threshold
    - Label: "Significant anomaly threshold" at level 3
    - Adjustable control: Small drag handle for threshold customization
  - Time window selector:
    - Dropdown with preset options: "7d", "30d", "90d"
    - Custom option to set specific date range
    - Currently selected: Pill with Electric Cyan (#00e0ff) background
- **States**:
  - Default: All anomalies grouped by severity
  - Filtered: Applied segment or regional filter
  - Threshold: Showing adjusted anomaly threshold
  - Comparative: Side-by-side view of different time periods
  - Loading: Pulsing animation during calculation
  - Empty: Zero-state with suggestion to adjust parameters
- **Interaction Details**:
  - Click severity level to filter dashboard to that level
  - Drag threshold marker to adjust significance level
  - Hover for detailed count and percentage at each level
  - Select time window to update entire dashboard
  - Right-click for export options and additional analysis

#### 4.2 Feature Contribution Analysis

**Anomalous Feature Explorer**
- **Purpose**: Visualize feature contributions to anomaly detection
- **Dimensions**: 640px × 480px
- **Primary Elements**:
  - Primary scatter plot:
    - X-axis: Anomaly score (0-1)
    - Y-axis: Selected feature value
    - Data points: Customer entities (8px circles)
    - Normal points: Electric Cyan (#00e0ff) with 40% opacity
    - Anomalous points: Signal Magenta (#e930ff) with 60% opacity
    - Point size: Based on overall severity (8-16px diameter)
    - Hover tooltip: Customer ID and detailed metrics
    - Selection highlight: 2px Cloud White (#f7f9fb) border with glow effect
  - Feature selector controls:
    - X-axis feature dropdown
    - Y-axis feature dropdown
    - Selected feature highlight pill
    - Quick selection for common feature pairs
  - Feature correlation matrix:
    - Small 200px × 200px heatmap showing feature relationships
    - Cell color: Correlation strength from Midnight Navy (#0a1224) to Electric Cyan (#00e0ff)
    - Highlighted cells for highly correlated anomalous features
  - Model explanation panel:
    - 280px × 320px side panel
    - Feature importance bars with percentage contribution
    - Normal vs. anomalous value comparison
    - Z-score visualization for abnormal features
    - Model parameters summary
- **States**:
  - Default: Scatter plot showing anomaly scores vs. primary feature
  - Selected: Focus on specific customer or customer group
  - Highlighted: Emphasis on specific feature correlation
  - Zoomed: Focus on specific value range
  - Brushing: Multiple point selection mode
- **Interaction Details**:
  - Select features for X and Y axes
  - Click data point to view detailed customer anomaly profile
  - Brush to select multiple customers for group analysis
  - Hover correlation matrix cells to highlight related points
  - Drag to zoom into specific regions of the scatter plot
  - Toggle between linear and logarithmic scales
  - Export selection as customer segment

#### 4.3 Anomaly Detection Map

**Geo-spatial Anomaly Visualization**
- **Purpose**: Visualize geographic distribution of anomalies
- **Dimensions**: 760px × 520px
- **Primary Elements**:
  - Geographic heat map:
    - Region outlines: 1px #3a4459 (light graphite)
    - Region fill: Color based on anomaly concentration
      - Low: Midnight Navy (#0a1224)
      - Medium: #3e7b97 (blue-gray)
      - High: #5fd4d6 (lighter cyan)
      - Critical: Signal Magenta (#e930ff)
    - Value labels: Anomaly count and percentage by region
    - Legend: Color scale with value ranges
  - Region details panel:
    - Appears on region selection
    - Width: 280px
    - Background: Graphite (#232a36)
    - Border-radius: 16px
    - Header: Region name in 18px Inter SemiBold
    - Metrics: Key anomaly statistics
    - Feature breakdown: Top anomalous features in region
  - Segment filter:
    - Multi-select dropdown for customer segments
    - Quick filters for high severity, recent detection
    - Apply button with animated transition
  - Normalized toggle:
    - Switch between absolute count and percentage view
    - Toggle pill design with Electric Cyan (#00e0ff) active state
    - Icon indicators for active mode
- **States**:
  - Default: Full map with all regions colored by anomaly density
  - Selected: Focus on specific region with detailed panel
  - Filtered: Showing only selected customer segments
  - Normalized: Percentage view instead of absolute counts
  - Zoomed: Focus on specific geographic area
- **Interaction Details**:
  - Click region to view detailed anomaly breakdown
  - Hover for quick region statistics
  - Select segment filters to update map
  - Toggle between count and percentage views
  - Zoom and pan map for detailed exploration
  - Export region-specific anomaly report

#### 4.4 Top Anomalies Analyzer

**Detailed Anomaly Investigation**
- **Purpose**: Provide detailed analysis of highest severity anomalies
- **Dimensions**: 840px × 620px
- **Primary Elements**:
  - Anomaly cards container:
    - Layout: Grid of 2×5 cards (10 total)
    - Scrollable container for additional cards
    - Sort controls: By severity, detection date, customer value
  - Individual anomaly card:
    - Dimensions: 400px × 280px
    - Background: Gradient from #232a36 to #2c3341
    - Border: 2px with severity-based color
    - Border-radius: 16px
    - Header:
      - Customer ID and name in 16px Inter SemiBold
      - Severity level with visual indicator (1-5 dots)
      - Detection date in 12px Inter Regular
    - Anomaly metrics:
      - Feature-specific severity scores
      - Visual comparison to normal range
      - Percentage deviation from expected values
      - Historical trend mini-chart (120px × 60px)
    - Detail expansion:
      - "View Details" button with Electric Cyan (#00e0ff) text
      - Expand/collapse icon
    - Action buttons:
      - "Investigate" button: Pill with Electric Cyan (#00e0ff) background
      - "Flag" button: Outline style with Signal Magenta (#e930ff) border
      - "Dismiss" text button with hover underline
  - Detail view:
    - Expanded card: 840px × 520px
    - Multi-tab interface:
      - Overview: Key metrics and severity explanation
      - Features: Detailed feature deviation analysis
      - History: Timeline of customer behavior
      - Actions: Recommended investigation steps
    - Feature detail charts:
      - Time series for abnormal features
      - Comparison to peer group
      - Contribution to overall anomaly score
- **States**:
  - Default: Grid of anomaly summary cards
  - Expanded: Detailed view of selected anomaly
  - Filtered: Showing specific anomaly types or severities
  - Sorted: Ordered by selected criteria
  - Tagged: Showing investigation status indicators
  - Historical: Showing previously detected anomalies
- **Interaction Details**:
  - Click card to expand detailed view
  - Apply filters to narrow anomaly display
  - Sort by different criteria
  - Tag anomalies with investigation status
  - Add investigation notes
  - Generate detailed report for specific anomaly
  - Set follow-up actions and reminders

#### 4.5 KPI Tiles Row

**Five Anomaly KPI Tiles (120px × 120px each)**
1. **Anomaly Rate**
   - **Value**: Percentage in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Trend**: Arrow indicating change vs previous period
   - **Visual**: Mini gauge showing relative rate
   - **States**: Normal (<5%), Warning (5-10%), Alert (>10%)

2. **High Severity Count**
   - **Value**: Count in 32px Inter SemiBold
   - **Subtitle**: "Severity 4-5" in 12px Inter Regular
   - **Visual**: Small horizontal bar showing severity distribution
   - **States**: Default, Alert (pulses when count exceeds threshold)

3. **Top Anomalous Feature**
   - **Value**: Feature name in 16px Inter SemiBold
   - **Subtitle**: "Most frequent deviation" in 12px Inter Regular
   - **Visual**: Small icon representing feature type
   - **States**: Default, Hover (shows feature statistics tooltip)

4. **Mean Anomaly Score**
   - **Value**: Score (0.0-1.0) in 32px Inter SemiBold
   - **Visual**: Circular gauge with percentage fill
   - **Direction**: Arrow showing trend vs previous period
   - **States**: Low, Medium, High with appropriate colors

5. **New Anomalies**
   - **Value**: Count in 32px Inter SemiBold
   - **Subtitle**: "Last 24h" in 12px Inter Regular
   - **Visual**: Small sparkline showing detection rate
   - **States**: None, Few, Many with color indicators

### Secondary Visualizations

#### 4.6 Temporal Anomaly Pattern

**Time-based Anomaly Tracking**
- **Purpose**: Visualize anomaly patterns over time
- **Dimensions**: 720px × 320px
- **Implementation**: Time series with anomaly highlighting
- **Visual Elements**:
  - Main timeline:
    - X-axis: Time periods (days, weeks, months)
    - Y-axis: Anomaly count or anomaly percentage
    - Line: 2px Electric Cyan (#00e0ff) for anomaly trend
    - Baseline: 1px dashed #3a4459 (light graphite) for normal threshold
    - Anomaly spikes: Signal Magenta (#e930ff) fill above threshold
    - Grid lines: 1px #232a36 (Graphite) at 20% opacity
    - Event markers: Small icons for system changes or campaigns
  - Rolling window controls:
    - Window size selector: 7d, 14d, 30d, 90d
    - Window averaging method: Simple, weighted, exponential
  - Breakdown selector:
    - Toggle buttons for different grouping dimensions
    - Segment breakdown option
    - Feature breakdown option
    - Severity breakdown option
  - Pattern detection panel:
    - Recurring pattern indicators
    - Seasonality markers
    - Correlation with business events
    - Pattern confidence score
- **States**:
  - Default: Overall anomaly trend
  - Breakdown: Stacked view by selected dimension
  - Comparative: Current vs previous period
  - Forecast: Prediction of future anomaly patterns
  - Event correlation: Highlighting relationship with events

#### 4.7 Feature Distribution Comparison

**Normal vs. Anomalous Distribution**
- **Dimensions**: 560px × 380px
- **Implementation**: Multi-histogram overlay
- **Visual Elements**:
  - Feature histograms:
    - X-axis: Feature value range
    - Y-axis: Frequency (count or percentage)
    - Normal distribution: Electric Cyan (#00e0ff) filled bars at 40% opacity
    - Anomalous distribution: Signal Magenta (#e930ff) outlined bars
    - Mean lines: Vertical dashed lines showing average values
    - Threshold zones: Light shading for outlier areas
  - Feature selector:
    - Dropdown with all available features
    - Quick navigation for key features
    - Feature description and statistics
  - Distribution statistics:
    - Normal mean & standard deviation
    - Anomalous mean & standard deviation
    - Statistical significance indicators
    - Separation index showing distribution overlap
  - Normality test results:
    - Test name and p-value
    - Visual indicator of distribution type
    - Skewness and kurtosis metrics
- **States**:
  - Single feature: Focused on one feature distribution
  - Multi-feature: Grid of mini-histograms
  - Comparative: Before/after detection threshold change
  - Normalized: Percentage view instead of absolute counts
  - Logarithmic: Alternative scale for highly skewed distributions

### Conversational Elements

#### 4.8 Anomaly Insight Assistant

**AI-Powered Anomaly Analysis**
- **Purpose**: Provide AI-guided insights about detected anomalies
- **Dimensions**: 360px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Anomaly Insights" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px animated assistant icon with Electric Cyan (#00e0ff) glow
- **Interaction Components**:
  - Input field: "Ask about anomalies..." placeholder
  - Command palette with slash-commands:
    - /analyze-anomaly [customer-id]
    - /compare-features [feature1] [feature2]
    - /explain-threshold
    - /recommend-actions
    - /identify-patterns
  - Recent queries list with quick-select
  - Voice input option
- **Insight Cards**:
  - Automated insight generation
  - Pattern detection summaries
  - Unusual correlation highlights
  - Potential risk assessments
  - Investigation recommendations
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full width with content
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Response: Text appears with typing animation
  - Highlighting: Can highlight elements across dashboard

#### 4.9 Anomaly Investigation Workflow

**Structured Analysis Process**
- **Dimensions**: 320px width, expandable to 480px
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Components**:
  - Investigation stages:
    - Step cards with numbered stages
    - Current stage highlighted with Electric Cyan (#00e0ff) left border
    - Completed stages with checkmark icons
    - Upcoming stages with dimmed opacity
  - Anomaly context panel:
    - Summary of selected anomaly
    - Key metrics and severity
    - Quick links to related data
  - Investigation actions:
    - Action buttons specific to current stage
    - Checklist of recommended steps
    - Completion tracking with progress indicator
  - Collaboration tools:
    - Assignee field with avatar
    - Comment thread with timestamp
    - Attachment capability for evidence
    - Status update dropdown
  - Resolution options:
    - "Confirm Anomaly" button with Signal Magenta (#e930ff) background
    - "False Positive" button with Graphite (#3a4459) background
    - "Needs Review" button with #5891cb (blue) background
    - Resolution notes field
- **States**:
  - New: Initial investigation stage
  - Active: In-progress investigation
  - Pending: Waiting for additional data
  - Resolved: Completed investigation with outcome
  - Comparative: Historical investigation reference
  - Template: Creating reusable investigation process

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with pulsing animation
   - KPI tiles appear first with counter animations
   - Anomaly distribution pyramid builds from bottom up (200ms per tier)
   - Feature contribution plot points fade in with 60% opacity
   - Default view shows 7-day window with all segments
   - Initial insights appear in right panel highlighting key patterns
   - Critical anomalies pulse briefly to draw attention

2. **Anomaly Severity Exploration**
   - Click specific severity level in pyramid
   - Dashboard filters to show only selected severity
   - Top anomalies panel updates to show relevant cases
   - Feature contribution recalculates to show severity-specific patterns
   - Map updates to highlight regions with selected severity concentration
   - AI assistant generates severity-specific insights
   - Export option appears for filtered view

3. **Feature Analysis Workflow**
   - Select features for X/Y axis in contribution plot
   - Visualization updates to show relationship between features
   - Hover data points to see customer-specific metrics
   - Click point to select specific customer anomaly
   - Detailed feature contribution panel expands
   - Normal vs. anomalous distribution comparison appears
   - Feature-specific insights and recommendations generated

4. **Geographic Pattern Analysis**
   - Interact with anomaly map to explore regional patterns
   - Click region to view detailed breakdown
   - Filter by customer segment to see targeted distribution
   - Toggle between absolute and normalized views
   - Identify regional hotspots of anomalous activity
   - Compare regional patterns to detect systematic issues
   - Generate region-specific anomaly reports

5. **Anomaly Investigation Process**
   - Select specific anomaly from top anomalies panel
   - Detailed investigation view expands
   - Step through structured investigation workflow
   - Record findings and evidence at each stage
   - Collaborate with team members via comments
   - Apply resolution status and document outcome
   - Create alert or monitoring rule for similar patterns

## 6. Integration with Other Tools

### Connected Data Flows
- **Transaction Patterns**: Provides baseline behavior patterns for anomaly detection
- **Customer Segmentation**: Supplies segment definitions for contextual analysis
- **Performance Deviation**: Shares anomaly detection algorithms and thresholds
- **Financial Tool**: Receives financial anomaly signals
- **Churn Prediction**: Uses anomaly scores as prediction features

### Integration Touchpoints
- **Customer Profile**: Button to view customer details for context
- **Transaction History**: Link to examine related transactions
- **Segment Explorer**: Button to analyze segment-level patterns
- **Alert Configuration**: Create monitoring rules from anomaly patterns
- **Investigation Case**: Generate formal investigation case for security team

### Cross-Tool Navigation
- Unified anomaly detection framework across all tools
- Consistent customer identification and selection
- Shared time period and segment filtering
- Synchronized threshold configuration
- Integrated investigation workflow

## 7. Technical Implementation Notes

### Data Processing Requirements
- Efficient calculation of anomaly scores for large customer sets
- Real-time feature importance analysis
- Background processing for model training
- Incremental anomaly detection for new data
- Alert trigger system based on severity thresholds

### Accessibility Considerations
- Color blind friendly palette with shape indicators for severity
- Screen reader support for anomaly descriptions and metrics
- Keyboard navigation for all investigation workflows
- Text alternatives for all visualizations
- High contrast mode for anomaly highlighting
- Scalable text without breaking dashboard layout

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: Two-column layout with stacked visualization panels
- **768-1023px**: Single column with prioritized anomaly displays
- **<768px**: Essential KPIs and top anomalies in simplified view

### Performance Optimizations
- Client-side caching of anomaly calculations
- Progressive loading of visualization components
- Feature calculation on demand
- Data sampling for large customer sets
- WebWorker-based anomaly scoring
- Virtualized rendering for anomaly card lists
- Efficient geographic data rendering with simplified maps 