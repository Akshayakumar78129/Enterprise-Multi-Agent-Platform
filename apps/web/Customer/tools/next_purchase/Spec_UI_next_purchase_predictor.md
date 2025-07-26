# Next Purchase Predictor - UI/UX Specification

## 1. Tool Overview

The Next Purchase Predictor is a machine learning-powered analytical tool that implements a gradient boosting model to predict customer purchasing behavior. The system:

- Extracts purchase sequence data from transaction history
- Analyzes purchase intervals and patterns 
- Calculates purchase probabilities based on historical behavior
- Predicts days until next purchase for specific products
- Prioritizes product recommendations by probability
- Generates customer-specific action plans for marketing

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer purchase sequences (temporal data)
- Product categories and associations
- Purchase intervals (days between purchases)
- Purchase amounts and frequency patterns
- Feature vectors (amounts, intervals, counts, recency)
- Prediction probabilities (0.0-1.0)
- Estimated days to next purchase

### Key Analysis Methods
- Gradient Boosting Regression modeling
- Feature standardization with StandardScaler
- Purchase probability calculation
- Temporal sequence analysis
- Purchase frequency pattern identification
- Customer-product pairing analysis

## 3. Current vs. Target Visualization State

### Current State
The tool operates as a programmatic class with basic output:
- Text-based markdown reports
- Simple tabular prediction results
- No visualization of model performance
- Basic summary metrics in plain text
- Static prediction tables without interactivity
- No visualization of temporal patterns or probability distributions

### Target State
Transform into a comprehensive predictive analytics dashboard with:
- Interactive model training and evaluation interface
- Visual feature importance and prediction explanations
- Customer purchase timeline visualizations
- Probability-based recommendation prioritization system
- Confidence interval visualizations for temporal predictions
- Scenario testing and simulation capabilities
- Integrated marketing action generation

## 4. UI Component Design

### Primary Visualization: Prediction Analysis Dashboard

#### 4.1 Model Performance Monitor

**Prediction Accuracy Visualization**
- **Purpose**: Visualize model performance and accuracy metrics
- **Dimensions**: 520px × 360px
- **Primary Elements**:
  - Dual gauge display:
    - Training score gauge (left):
      - 160px diameter circular gauge
      - Scale: 0-1.0
      - Track: 12px width, Midnight Navy (#0a1224)
      - Fill: Electric Cyan (#00e0ff) gradient to #5fd4d6
      - Central value: Score in 28px Inter SemiBold, Cloud White (#f7f9fb)
      - Label: "Training Score" in 14px Inter Regular
    - Test score gauge (right):
      - 160px diameter circular gauge
      - Scale: 0-1.0
      - Track: 12px width, Midnight Navy (#0a1224)
      - Fill: Signal Magenta (#e930ff) gradient to #aa45dd
      - Central value: Score in 28px Inter SemiBold, Cloud White (#f7f9fb)
      - Label: "Test Score" in 14px Inter Regular
  - Score difference indicator:
    - Arrow connecting gauges
    - Color: #f5b83d (amber) if difference > 0.1 (potential overfitting)
    - Width: 3px with animated pulse if warning condition
    - Label: Difference value with "Δ" symbol
  - Time series performance chart:
    - Line chart showing performance over iterations
    - Line colors: Electric Cyan (#00e0ff) for training, Signal Magenta (#e930ff) for test
    - Grid: 1px #3a4459 (light graphite) lines at 0.2 intervals
    - Timeline: Last 5 model iterations
    - Y-axis: Score (0.0-1.0)
  - Training controls:
    - "Retrain Model" button: Electric Cyan (#00e0ff) pill button
    - Model parameters quick-edit panel
    - Training progress bar
- **States**:
  - Default: Current performance view
  - Training: Animated progress state with completion percentage
  - Warning: Amber highlights when overfitting detected
  - Optimal: Green highlights when optimal performance achieved
  - Historical: Showing performance across multiple training runs
- **Interaction Details**:
  - Click gauges for detailed metric breakdowns
  - Hover on time series for exact values at points
  - Adjust parameters and trigger retraining
  - Toggle between absolute and relative performance view
  - Export model metrics to reports

#### 4.2 Feature Importance Explorer

**Model Feature Analysis**
- **Purpose**: Visualize feature contributions to predictions
- **Dimensions**: 480px × 400px
- **Primary Elements**:
  - Horizontal bar chart:
    - Y-axis: Feature names in 14px Inter Regular, Cloud White (#f7f9fb)
    - X-axis: Importance score (0-100%)
    - Bar fill: Gradient from #3a4459 (base) to Electric Cyan (#00e0ff) (tip)
    - Bar height: 32px with 16px spacing
    - Bar corner radius: 4px
    - Grid lines: 1px dashed #3a4459 at 20% intervals
  - Feature detail cards:
    - 280px × 120px rounded cards
    - Background: Graphite (#232a36)
    - Border: 1px #3a4459 (light graphite)
    - Feature name: 16px Inter SemiBold
    - Description: 14px Inter Regular
    - Distribution miniature: 120px × 40px histogram
  - Correlation matrix miniature:
    - 160px × 160px heatmap
    - Cell colors: Midnight Navy (#0a1224) to Electric Cyan (#00e0ff) gradient
    - Labels: 11px Inter Regular
  - Feature toggle controls:
    - Toggle switches for including/excluding features
    - Active: Electric Cyan (#00e0ff) with sliding animation
    - Inactive: #3a4459 (light graphite)
- **States**:
  - Default: All features shown by importance
  - Selected: Feature expands to show detailed statistics
  - Excluded: Feature dimmed to 30% opacity with strikethrough
  - Simulation: Shows predicted impact of feature modifications
- **Interaction Details**:
  - Click bar to select feature for detailed view
  - Toggle features on/off to see model impact
  - Drag to reorder features by custom priority
  - Hover for detailed feature description and stats
  - Double-click to drill down into feature distribution

#### 4.3 Purchase Probability Map

**Customer-Product Probability Visualization**
- **Purpose**: Map customers to products with prediction probabilities
- **Dimensions**: 680px × 560px
- **Primary Elements**:
  - Scatterplot with bubble clusters:
    - X-axis: Days to next purchase (0-60 days)
    - Y-axis: Purchase probability (0.0-1.0)
    - Data points: Circular bubbles representing customer-product pairs
    - Bubble size: Based on historical purchase frequency (20px to 40px diameter)
    - Bubble color: Based on customer segment
      - High-value: Electric Cyan (#00e0ff)
      - Medium-value: #5fd4d6 (lighter cyan)
      - Low-value: #43cad0 (teal)
      - New: #aa45dd (muted purple)
    - Bubble border: 2px white at 40% opacity
    - Bubble label: Product category icon in center, 16px
  - Probability zones:
    - High probability zone (>0.7): Light Electric Cyan (#00e0ff) background at 15% opacity
    - Medium probability zone (0.3-0.7): Light #aa45dd background at 10% opacity
    - Low probability zone (<0.3): No highlight
    - Zone labels in 14px Inter Regular
  - Time threshold markers:
    - 7-day marker: Vertical dashed Electric Cyan (#00e0ff) line
    - 30-day marker: Vertical dashed #5fd4d6
    - Labels in 12px Inter Regular
  - Recommendation threshold:
    - Horizontal dashed Signal Magenta (#e930ff) line at configurable probability
    - Drag handle for adjusting threshold
- **States**:
  - Default: All customer-product pairs displayed
  - Filtered: Showing only selected customer segments or product categories
  - Selected: Bubble expands with enhanced detail and connected recommendations
  - Hover: Bubble glows with data preview tooltip
  - Animated: Bubbles flow left as time progresses (optional simulation)
- **Interaction Details**:
  - Click bubble to select customer-product pair
  - Drag threshold line to adjust recommendation cutoff
  - Hover for detailed prediction information
  - Lasso select to group multiple predictions
  - Filter controls for segment/product selection
  - Zoom and pan for exploring dense data regions

#### 4.4 Customer Purchase Timeline

**Temporal Purchase Sequence Visualization**
- **Purpose**: Visualize historical and predicted purchase timing
- **Dimensions**: 800px × 280px
- **Primary Elements**:
  - Horizontal timeline:
    - Track: 6px height, Graphite (#232a36)
    - Time scale: Last 12 months to next 3 months
    - Month dividers: 1px #3a4459 (light graphite) lines
    - Current date marker: 2px vertical Electric Cyan (#00e0ff) line
  - Historical purchase markers:
    - Triangular markers pointing upward
    - Size: 12px height
    - Color: Varies by product category
    - Tooltip: Purchase details on hover
  - Predicted purchase markers:
    - Triangular markers pointing downward
    - Size: 12px height, scaling with probability
    - Border: 1px dashed Signal Magenta (#e930ff)
    - Fill: Signal Magenta (#e930ff) at opacity matching probability (30%-100%)
  - Confidence intervals:
    - Horizontal bars below prediction markers
    - Height: 4px
    - Color: Signal Magenta (#e930ff) at 30% opacity
    - Width: Based on prediction certainty (narrower = more certain)
  - Customer selector:
    - Dropdown with top customers
    - Search field with typeahead
    - "Top 10" quick selection button
- **States**:
  - Default: Shows selected customer's purchase history and predictions
  - Multi-customer: Stacked timelines for comparison (up to 5)
  - Zoomed: Focused on specific time period
  - Filtered: Showing only specific product categories
- **Interaction Details**:
  - Drag to pan timeline horizontally
  - Click markers for purchase details
  - Hover confidence interval for probability distribution
  - Select multiple customers for comparison
  - Toggle between absolute dates and days-between view
  - Double-click to zoom to specific time period

#### 4.5 KPI Tiles Row

**Five KPI Tiles (120px × 120px each)**
1. **Prediction Count**
   - **Value**: Total prediction count in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Subtitle**: "Active Predictions" in 12px Inter Regular
   - **Visual**: Stacked horizontal prediction dots (high/medium/low)
   - **States**: Default, Hover (expands to show category breakdown)

2. **Average Probability**
   - **Value**: Probability (0.0-1.0) in 32px Inter SemiBold
   - **Visual**: Circular gauge with Electric Cyan (#00e0ff) fill
   - **Comparative indicator**: Small arrow showing trend vs previous period
   - **States**: High (>0.7), Medium (0.3-0.7), Low (<0.3) with color changes

3. **Days to Purchase**
   - **Value**: Average days in 32px Inter SemiBold
   - **Subtitle**: "Avg. Days to Next" in 12px Inter Regular
   - **Visual**: Small horizontal time scale with marker
   - **States**: Near-term (<7 days), Mid-term (7-30 days), Long-term (>30 days)

4. **Model Quality**
   - **Value**: Quality score (0-100%) in 32px Inter SemiBold
   - **Visual**: Radial gauge from red to green
   - **Subtitle**: Based on test score and overfitting assessment
   - **States**: Good (>80%), Average (60-80%), Poor (<60%)

5. **Actionable Now**
   - **Value**: Count in 32px Inter SemiBold
   - **Subtitle**: "Ready for Marketing" in 12px Inter Regular
   - **Visual**: Stacked action cards with progress bar
   - **States**: Default, Hover (preview actions), Active (pulsing when high-value)

### Secondary Visualizations

#### 4.6 Purchase Sequence Patterns

**Product Transition Flow**
- **Purpose**: Visualize common purchase sequences
- **Dimensions**: 540px × 380px
- **Implementation**: Sankey diagram
- **Visual Elements**:
  - Flow nodes:
    - Product category blocks
    - Height: Based on purchase volume
    - Color: Category-specific colors
    - Border: 1px #3a4459 (light graphite)
    - Labels: Product category in 14px Inter Regular
  - Flow connections:
    - Connection width: Based on transition frequency
    - Color: Gradient between connected category colors
    - Opacity: 80% with 90% on hover
  - Sequence position indicators:
    - First purchase: Left side
    - Second purchase: Middle
    - Next predicted: Right side
  - Probability indicators:
    - Small percentage labels on connections
    - Color coded by probability
- **States**:
  - Default: All category flows
  - Selected: Focus on selected product category and its connections
  - Filtered: Only show high-probability transitions
  - Expanded: Show additional sequence depth (up to 5 steps)

#### 4.7 Feature Distribution Explorer

**Multi-histogram Analysis**
- **Dimensions**: 480px × 320px
- **Implementation**: Multiple overlaid histograms
- **Visual Elements**:
  - Primary histogram:
    - Bars: 24px width, 4px spacing
    - Color: Electric Cyan (#00e0ff) at 70% opacity
    - X-axis: Feature value range
    - Y-axis: Frequency
  - Comparison histogram:
    - Outline bars overlaid on primary
    - Color: Signal Magenta (#e930ff) outline, 2px width
    - Fill: None or 20% opacity
  - Distribution statistics:
    - Mean/median markers:
      - Vertical dashed lines
      - Labels with values
    - Standard deviation:
      - Shaded region around mean
      - Opacity: 20%
  - Feature selector:
    - Dropdown for all features
    - Quick navigation arrows
- **States**:
  - Single feature: One histogram with statistics
  - Comparison: Two features overlaid
  - Filtered: Showing subset based on selections elsewhere
  - Zoomed: Focus on specific value range

### Conversational Elements

#### 4.8 Prediction Strategy Advisor

**AI Recommendation Engine**
- **Purpose**: Provide AI-guided predictive strategy recommendations
- **Dimensions**: 400px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Prediction Advisor" in 20px Inter SemiBold, Cloud White (#f7f9fb)
  - AI avatar: 48px robot icon with Electric Cyan (#00e0ff) glow effect
- **Interaction Components**:
  - Input field: "Ask about predictions..." placeholder
  - Command palette:
    - /explain-prediction [customer] [product]
    - /optimize-model
    - /suggest-marketing
    - /analyze-pattern [product]
  - Response area:
    - Background: #1e2738 (darker graphite)
    - Text: Cloud White (#f7f9fb) in 14px Inter Regular
    - Code/technical: JetBrains Mono 13px
- **Suggestion Chips**:
  - 4-6 contextual question chips
  - Background: #3a4459 (light graphite)
  - Border: 1px Electric Cyan (#00e0ff)
  - Text: 13px Inter Regular in Cloud White (#f7f9fb)
  - Icon: Topic-specific icon on left
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full width drawer
  - Thinking: Animated Electric Cyan (#00e0ff) dots
  - Response: Text appears with 12ms per character typing effect
  - Highlighting: Can highlight elements on main dashboard

#### 4.9 Model Training Control Panel

**Interactive Model Designer**
- **Dimensions**: 360px width, expandable
- **Container**:
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 16px
  - Border: 1px #3a4459 (light graphite)
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Components**:
  - Parameter controls:
    - Slider for learning rate:
      - Track: 6px height, Midnight Navy (#0a1224)
      - Handle: 16px Electric Cyan (#00e0ff) circle
      - Value display: Current setting with technical hint
    - Dropdown for estimators:
      - Background: #1e2738 (darker graphite)
      - Border: 1px #3a4459 (light graphite)
      - Text: Cloud White (#f7f9fb)
      - Expand icon: 8px chevron in Electric Cyan (#00e0ff)
    - Feature selection checkboxes:
      - Checked: Electric Cyan (#00e0ff) check in box
      - Unchecked: Empty #3a4459 (light graphite) box
      - Label: Feature name with importance indicator
  - Training actions:
    - "Train Model" button:
      - Background: Electric Cyan (#00e0ff)
      - Text: Midnight Navy (#0a1224) in 14px Inter SemiBold
      - Hover state: 10% lighter with slight expansion
    - "Reset Parameters" text button:
      - Color: Signal Magenta (#e930ff)
      - Hover: Underline
    - "Save Configuration" button:
      - Background: #3a4459 (light graphite)
      - Text: Cloud White (#f7f9fb)
  - Status indicators:
    - Training status:
      - Progress bar: Electric Cyan (#00e0ff) fill
      - Percentage text: 14px Inter Regular
    - Model quality assessment:
      - Icon: Check/warning/error
      - Short quality assessment text
- **States**:
  - Default: Parameter configuration view
  - Training: Progress indicators and cancel button
  - Complete: Success state with metrics improvement
  - Error: Signal Magenta (#e930ff) highlight with error details
  - Comparison: Side-by-side with previous configuration
  - Advanced: Expanded view with additional parameters

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with branded animation
   - Model performance gauges fill first with 800ms animation
   - KPI tiles count up from zero with staggered timing
   - Feature importance bars grow from left with 120ms stagger
   - Probability map bubbles fade in with 200ms delay and 500ms duration
   - Welcome message offers model quality assessment

2. **Model Evaluation and Training**
   - Review current model performance metrics
   - Examine feature importance and contributions
   - Adjust model parameters in control panel
   - Initiate training with visual progress indicators
   - Compare new model performance to previous
   - Accept or reject model update
   - View automated performance improvement suggestions

3. **Customer Selection and Analysis**
   - Select specific customer from dropdown
   - Timeline updates to show purchase history
   - Probability map highlights selected customer's predictions
   - Purchase sequence patterns reconfigure to show relevant flows
   - AI assistant generates customer-specific insights
   - Export option becomes available for selected customer report

4. **Product Category Exploration**
   - Filter dashboard to specific product category
   - Feature distributions update to show category-specific patterns
   - Timeline highlights category purchases across customers
   - Probability map recenters on category-specific predictions
   - Side panel updates with product category statistics
   - Generate category-specific marketing recommendations

5. **Prediction Threshold Adjustment**
   - Drag probability threshold line
   - Dashboard updates to highlight predictions above threshold
   - Count of actionable predictions updates in KPI tile
   - Recommendation panel generates prioritized action list
   - Export marketing action plan for selected threshold
   - Save threshold preference for future sessions

## 6. Integration with Other Tools

### Connected Data Flows
- **Next Purchase**: Provides front-end to this prediction engine
- **Transaction Patterns**: Supplies sequence data for feature extraction
- **Customer Segmentation**: Receives prediction-based segmentation insights
- **Retention Planner**: Uses purchase timing predictions for retention strategy

### Integration Touchpoints
- **Model Registry**: Button to save model to central repository
- **Feature Store**: Link to explore and manage features
- **Marketing Automation**: Generate campaign based on predictions
- **Inventory Planning**: Button to forecast inventory needs

### Cross-Tool Navigation
- Shared customer selection across prediction tools
- Consistent product category definitions and visualization
- Unified model performance metrics
- Coordinated prediction thresholds
- Synchronized data filtering

## 7. Technical Implementation Notes

### Model Management
- Serialized model storage and versioning
- A/B testing capabilities for model comparison
- Feature registry for tracking feature importance
- Automated retraining scheduling
- Model drift monitoring

### Accessibility Considerations
- Color contrast ratio minimum 4.5:1 for all text
- Alternative text descriptions for all visualizations
- Keyboard navigation with visible focus indicators
- Screen reader compatible data tables as alternatives
- Reduced motion option for animations

### Responsive Behavior
- **≥1440px**: Full dashboard with side-by-side visualizations
- **1024-1439px**: 2-column layout with stacked visualization panels
- **768-1023px**: Single column with prioritized visualizations
- **<768px**: Essential KPIs and model controls only

### Performance Optimizations
- Client-side data caching for interactive filtering
- Incremental model updates rather than full retraining
- Progressive loading of visualization components
- WebWorker-based background processing
- Data aggregation for large customer sets
- Virtualized rendering for probability map with many data points 