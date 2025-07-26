# Retention Planner - UI/UX Specification

## 1. Tool Overview

The Retention Planner is a strategic customer management tool that analyzes customer data to identify at-risk customers and recommend targeted retention actions. The tool:

- Predicts customer churn risk using a decision tree model
- Segments customers based on value (High, Medium, Low)
- Prescribes specific retention actions based on segment and risk level
- Provides ROI analysis and effectiveness projections for each action
- Creates segment-specific playbooks for customer retention

## 2. Data Analysis & Patterns

### Primary Data Elements
- Customer loyalty metrics (RFM scores, recency, frequency, monetary)
- Activity timestamps and intervals
- Customer value segmentation (High, Medium, Low)
- Churn risk probability scores (0.0-1.0)
- Retention action types and their effectiveness estimates
- Cost-benefit projections

### Key Analysis Methods
- Decision tree classification for churn risk prediction
- Feature scaling for numerical variables
- Multi-factor segmentation (value × risk × recency)
- Effectiveness estimation with value and risk adjustments
- ROI calculation for retention actions

## 3. Current vs. Target Visualization State

### Current State
The tool currently outputs a text-based report with:
- Simple statistics (total customers, high-risk count, avg risk)
- Action distribution as text percentages
- Segment playbooks in hierarchical text format
- Basic cost-benefit calculations without visual comparison
- No interactive filtering capabilities
- Text-based recommendations without priority visualization

### Target State
Transform into a comprehensive, interactive retention management console:
- Strategic retention dashboard with risk distribution visualization
- Interactive segment manager with action assignment interface
- Cost-benefit simulator with ROI projection tools
- Retention playbook builder with effectiveness tracking
- Conversational AI for retention strategy optimization
- Visual customer risk mapping with actionable segments

## 4. UI Component Design

### Primary Visualization: Retention Strategy Dashboard

#### 4.1 Churn Risk Distribution

**Risk Gauge & Distribution Chart**
- **Purpose**: Visualize overall churn risk distribution across customer base
- **Dimensions**: 420px × 320px
- **Primary Elements**:
  - Central gauge showing average churn risk (0.0-1.0)
    - Gauge outline: 4px Cloud White (#f7f9fb) border
    - Needle: Signal Magenta (#e930ff) with 8px circular anchor
    - Risk zones on gauge:
      - 0.0-0.3: Gradient from Graphite (#232a36) to #3e7b97 (blue-gray)
      - 0.3-0.7: Gradient from #3e7b97 to #00c3e6 (medium cyan)
      - 0.7-1.0: Gradient from #00c3e6 to Electric Cyan (#00e0ff)
  - Histogram below gauge showing risk distribution
    - Bars: Gradient fill based on risk severity
    - Low risk: Graphite (#3a4459)
    - Medium risk: #3e7b97 (blue-gray)
    - High risk: Electric Cyan (#00e0ff)
    - Critical risk: Signal Magenta (#e930ff)
  - Threshold line: Dashed 2px Signal Magenta (#e930ff) line at threshold value
- **States**:
  - Default: Full distribution view with animated gauge load (needle sweeps from 0 to value)
  - Filtered: Distribution updates with selection, gauge updates with 400ms transition
  - Loading: Pulsing animation on gauge (opacity 0.7-1.0), histogram shows placeholder bars
  - Alert: Gauge flashes briefly when average risk above threshold
- **Interaction Details**:
  - Drag on threshold line to adjust risk threshold value
  - Click on risk zones to filter customer segments
  - Hover on histogram bars to see exact count and percentage

#### 4.2 Customer Value Quadrant

**Value-Risk Matrix**
- **Purpose**: Plot customers by value and risk for action prioritization
- **Dimensions**: 500px × 500px
- **Primary Elements**:
  - X-axis: Churn Risk (0.0-1.0)
  - Y-axis: Customer Value (Low, Medium, High)
  - Quadrant labels:
    - Top-left: "Nurture" (High value, Low risk) - Electric Cyan (#00e0ff)
    - Top-right: "Rescue" (High value, High risk) - Signal Magenta (#e930ff)
    - Bottom-left: "Monitor" (Low value, Low risk) - Graphite (#3a4459)
    - Bottom-right: "Evaluate" (Low value, High risk) - #aa45dd (muted purple)
  - Bubble plot:
    - Point size: Based on recency (larger = more recent)
    - Color coordination:
      - High value: Electric Cyan (#00e0ff)
      - Medium value: #5fd4d6 (lighter cyan)
      - Low value: Graphite (#3a4459)
    - Risk coloring: Points take on Signal Magenta tint as risk increases
  - Dividing lines: 2px Cloud White (#f7f9fb) at 30% opacity
  - Corner counts: Customer count per quadrant in 20px Inter SemiBold
- **States**:
  - Default: All quadrants populated with bubble animation on load (200ms stagger)
  - Selected: Quadrant highlights with 20% opacity overlay of quadrant color
  - Filtered: Non-selected quadrants fade to 15% opacity
  - Hover: Individual bubble expands 20%, tooltip shows detail
- **Interaction Details**:
  - Click quadrant to select all customers in that segment
  - Double-click bubble to view individual customer detail
  - Shift+click for multiple bubble selection
  - Hover quadrant label to see action summary

#### 4.3 Retention Action Allocation

**Action Sankey Flow**
- **Purpose**: Visualize how customers flow to recommended actions
- **Dimensions**: 620px × 400px
- **Primary Elements**:
  - Left nodes: Customer segments (High, Medium, Low value)
    - Node color based on value:
      - High: Electric Cyan (#00e0ff)
      - Medium: #5fd4d6 (lighter cyan)
      - Low: Graphite (#3a4459)
  - Right nodes: Retention actions
    - Premium package: #d442f5 (rich purple)
    - Loyalty upgrade: #aa45dd (muted purple)
    - Standard package: #5891cb (blue)
    - Targeted discount: #43cad0 (teal)
    - Basic offer: #68809f (slate)
    - Standard comm: Graphite (#3a4459)
    - No action: #232a36 (dark graphite)
  - Flow connections:
    - Thickness based on customer count
    - Color gradient interpolated between connecting nodes
    - Opacity: 85% with 92% on hover
  - Labels: Segment and action names in 14px Inter Regular, Cloud White (#f7f9fb)
  - Counts: Customer counts in 12px Inter SemiBold
- **States**:
  - Default: Fully rendered flow with 800ms animation on load
  - Hover: Connection thickens 10%, nodes highlight with glow effect
  - Selected: Connection and nodes maintain highlight state
  - Filtered: Non-selected paths fade to 20% opacity
- **Interaction Details**:
  - Click segment to filter dashboard to that customer value
  - Click action to see effectiveness metrics
  - Hover connection to see count details
  - Pan/zoom controls for larger datasets (120% max zoom)

#### 4.4 ROI Projection

**ROI Waterfall Chart**
- **Purpose**: Visualize cost, benefit, and ROI for retention strategy
- **Dimensions**: 480px × 360px
- **Primary Elements**:
  - Bars representing financial components:
    - Cost bars: Signal Magenta (#e930ff) dropping down
    - Benefit bars: Electric Cyan (#00e0ff) rising up
    - Net ROI bar: #92edf0 (pale cyan) final result
  - Bar width: 40px with 20px spacing
  - Value labels: Dollar amounts in 13px Inter SemiBold
  - X-axis labels: Action categories in 12px Inter Regular
  - Connecting lines: 2px dashed Cloud White (#f7f9fb) at 30% opacity
- **States**:
  - Default: Static view of current plan
  - Calculation: Animated transition when parameters change (bars rise/fall)
  - Profitable: Net ROI bar pulses briefly (0.8s) with success animation
  - Unprofitable: Net ROI bar flashes Signal Magenta briefly
- **Interaction Details**:
  - Hover bars to see detailed breakdown
  - Click bar to isolate that action for detailed view
  - Toggle cumulative/individual view
  - Download button for financial projection report

#### 4.5 KPI Tiles Row

**Six KPI Tiles (120px × 120px each)**
1. **Total Customers**
   - **Value**: Count in 32px Inter SemiBold, Cloud White (#f7f9fb)
   - **Background**: Graphite (#232a36)
   - **Border Radius**: 20px
   - **Elements**: Mini bar showing segment breakdown
   - **States**: Default, Hover (shadow deepens to 0 8px 24px rgba(0,0,0,0.4))

2. **High Risk Count**
   - **Value**: Count in 32px Inter SemiBold
   - **Subtitle**: Percentage of total in 14px
   - **Visual**: 60px circular progress with Signal Magenta (#e930ff) fill
   - **Animation**: Count increments from 0 on load
   - **States**: Default, Hover, Alert (border pulses when above 30%)

3. **Avg Churn Risk**
   - **Value**: Score (0.0-1.0) in 32px Inter SemiBold
   - **Visual**: Horizontal progress bar 0.0-1.0
   - **Color**: Gradient from Graphite (#232a36) to Signal Magenta (#e930ff)
   - **Directional Indicator**: Trend arrow (up/down) compared to previous
   - **States**: Default, Hover (reveals 30-day trend line)

4. **Action Count**
   - **Value**: Number of actions in 32px Inter SemiBold
   - **Subtitle**: "Recommended Actions"
   - **Visual**: 3 stacked horizontal pills showing top 3 actions
   - **Animation**: Pills slide in from left on load
   - **States**: Default, Hover (expands to show distribution)

5. **Expected Effectiveness**
   - **Value**: Percentage in 32px Inter SemiBold
   - **Visual**: Radial gauge from 0-100% with Electric Cyan (#00e0ff) fill
   - **Context**: Small "vs target" value in 12px
   - **States**: Default, Hover, Critical (below 50% effectiveness)

6. **Total ROI**
   - **Value**: Percentage in 32px Inter SemiBold
   - **Visual**: Up/down arrow in 24px
   - **Color Logic**: Electric Cyan (#00e0ff) for positive, Signal Magenta (#e930ff) for negative
   - **Subtitle**: Dollar amount in 14px
   - **States**: Default, Hover (reveals breakdown), Alert (pulses when negative)

### Secondary Visualizations

#### 4.6 Segment Playbook Cards

**Interactive Playbook Cards**
- **Purpose**: Display retention playbooks for each segment
- **Dimensions**: 350px width, variable height
- **Container**: 
  - Background: Gradient from #232a36 to #2c3341
  - Border radius: 20px
  - Shadow: 0 4px 16px rgba(0,0,0,0.25)
- **Header**:
  - Background: Segment-specific color (matches quadrant)
  - Title: Segment name in 18px Inter SemiBold, Cloud White (#f7f9fb)
  - Icon: Segment-specific icon (80% opacity)
  - Customer count: Pill badge with count in 14px
- **Content Sections**:
  - Cause type headers in 16px with left border in cause-specific color:
    - Inactive: Signal Magenta (#e930ff)
    - At Risk: #aa45dd (muted purple)
    - Engaged: Electric Cyan (#00e0ff)
  - Action rows:
    - Action name in 14px Inter Regular
    - Customer count pill in 12px
    - Effectiveness indicator: 60px mini-gauge
  - Expandable details section:
    - Specific tactics in bulleted list
    - Expected outcomes with metrics
    - Implementation guidance
- **States**:
  - Collapsed: Shows only segment header and summary
  - Expanded: Full playbook details visible
  - Hover: Card lifts 4px with enhanced shadow
  - Selected: 2px Electric Cyan (#00e0ff) border glow
  - Edited: Yellow dot indicator shows unsaved changes

#### 4.7 Action Effectiveness Matrix

**Heatmap Grid**
- **Purpose**: Compare effectiveness of actions across segments
- **Dimensions**: 480px × 360px
- **Cell Properties**:
  - Size: 60px × 60px
  - Color scale: Effectiveness percentage mapped to color gradient:
    - 0-25%: Midnight Navy (#0a1224)
    - 25-50%: #232a36 (dark graphite)
    - 50-75%: #3a4459 (light graphite)
    - 75-85%: #3e7b97 (blue-gray)
    - 85-100%: Electric Cyan (#00e0ff)
  - Text: Percentage in 16px Inter SemiBold, Cloud White (#f7f9fb)
  - Border: 1px grid lines in #0a1224 (Midnight Navy)
- **Axis Labels**:
  - X-axis: Customer segments in 14px Inter Regular
  - Y-axis: Action types in 14px Inter Regular
- **States**:
  - Default: Full matrix view
  - Hover: Cell expands 4px with tooltip showing detailed metrics
  - Selected: 2px Electric Cyan (#00e0ff) border
  - Optimal: Most effective cells have subtle pulsing animation

### Conversational Elements

#### 4.8 Retention Strategy Advisor

**AI Strategy Interface**
- **Purpose**: Provide AI-guided retention planning
- **Dimensions**: 400px width right drawer
- **Container**:
  - Background: Graphite (#232a36)
  - Header: "Retention Advisor" in 20px Inter SemiBold
  - AI avatar: 48px animated robot icon with Electric Cyan (#00e0ff) highlights
- **Interaction Components**:
  - Input field with placeholder "Ask about retention strategies..."
  - Command palette with slash-commands:
    - /simulate [action] [segment]
    - /optimize-budget [amount]
    - /compare-scenarios
    - /recommend-actions
  - Response area with markdown support
- **Suggestion Chips**:
  - 4-6 contextual suggestion chips
  - Background: #3a4459 (light graphite)
  - Border: 1px Electric Cyan (#00e0ff)
  - Text: 13px Inter Regular in Cloud White (#f7f9fb)
- **States**:
  - Collapsed: Tab on edge of screen
  - Expanded: Full 400px width
  - Thinking: Animated dots in Electric Cyan (#00e0ff)
  - Response: Text appears with typing effect
  - Error: Brief Signal Magenta (#e930ff) flash with error message

#### 4.9 Action Scenario Builder

**Interactive Scenario Cards**
- **Purpose**: Create and compare retention scenarios
- **Dimensions**: 320px width, variable height
- **Container**:
  - Background: #2c3341 (dark graphite)
  - Border radius: 20px
  - Border: 1px #3a4459 (light graphite)
- **Components**:
  - Scenario name (editable): 16px Inter SemiBold
  - Date created: 12px Inter Regular at 70% opacity
  - Action allocation diagram: Simplified horizontal bar
  - ROI projection: Mini-waterfall
  - Target metrics: 3 KPIs with icons
- **Footer**:
  - Apply button: Pill shape with Electric Cyan (#00e0ff) background
  - Delete button: Text-only with Signal Magenta (#e930ff) on hover
  - Clone button: Icon-only with tooltip
- **States**:
  - Default: Static card view
  - Hover: Subtle lift effect (4px)
  - Active: Electric Cyan (#00e0ff) left border
  - Editing: Form fields become editable
  - Comparing: Side-by-side view with comparison metrics

## 5. User Interaction Flow

1. **Dashboard Initialization**
   - Progressive loading sequence with branded animation
   - KPI tiles appear first (0-value to final with 500ms animation)
   - Value-Risk Matrix loads with bubble animation (800ms)
   - Sankey diagram flows into place (1200ms)
   - Default view shows all customers with risk threshold at 0.5
   - Welcome banner offers guided tour option

2. **Segment Analysis Workflow**
   - Click segment in Value-Risk Matrix
   - Dashboard filters to segment with crossfade transition
   - Playbook card for segment slides in from right
   - AI advisor generates segment-specific insights
   - Action allocation diagram updates to show segment breakdown
   - Export segment button becomes available

3. **Action Planning Flow**
   - Select action from Sankey diagram
   - Side panel opens with action details and edit options
   - Adjust parameters (incentive value, timing, channels)
   - ROI projection updates in real-time
   - Save action to create new scenario
   - Apply scenario to see dashboard update

4. **Budget Optimization**
   - Enter total retention budget in optimization panel
   - System recalculates optimal action allocation
   - Visualizations update with optimized state
   - Comparison view shows current vs. optimized
   - Apply optimization or save as new scenario
   - Export optimization report

5. **Playbook Implementation**
   - Select segment playbook card
   - Expand to see detailed action plan
   - Assign team members to actions
   - Set timeline and milestones
   - Generate implementation docs
   - Schedule effectiveness review

## 6. Integration with Other Tools

### Connected Data Flows
- **Churn Prediction**: Receives risk scores and contributing factors
- **Customer Segmentation**: Shares customer value segments
- **Customer Lifetime Value**: Receives retention impact on CLV projections
- **Transaction Patterns**: Incorporates purchase behavior in risk assessment

### Integration Touchpoints
- **Segmentation Navigator**: Button to explore selected segment in Customer Segmentation tool
- **Value Projection**: Link to view retained value in CLV calculator
- **Purchase Pattern Analysis**: Button to examine transaction history of selected segment

### Cross-Tool Navigation
- Unified segment definitions across all tools
- Consistent color-coding for risk and value
- Shared filters propagate across tools
- Customer profile accessible from any view

## 7. Technical Implementation Notes

### State Management
- Redux store for retention scenarios and filters
- Caching of heavy calculations (effectiveness by segment)
- Persistent storage for saved scenarios
- Real-time sync with AI recommendations

### Accessibility Considerations
- Color contrast ratio minimum 4.5:1 for all text
- Screen reader descriptions for all charts
- Keyboard navigation with visible focus indicators
- Alternative text-based views of all visualizations

### Responsive Behavior
- **≥1440px**: Full multi-panel layout with side-by-side visualizations
- **1024-1439px**: 2-column layout, reduced visualization sizes
- **768-1023px**: Single column layout, stacked sections
- **<768px**: Essential KPIs and simplified visualizations

### Performance Optimizations
- Lazy loading of secondary visualizations
- WebGL rendering for large customer datasets
- Aggregated metrics for initial view
- Background processing for scenario simulations 