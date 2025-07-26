# Transaction Pattern Analyzer - UI/UX Specification

## 1. Tool Overview

The Transaction Pattern Analyzer is a sophisticated analytics tool that examines transaction data to identify patterns, associations between products, and anomalous transactions. It processes historical transaction data to deliver insights about:

- Temporal patterns (hourly and daily transaction distributions)
- Payment method preferences
- Product combination rules (market basket analysis)
- Anomalous transaction detection

## 2. Data Analysis & Patterns

### Primary Data Elements
- Transaction timestamps (datetime)
- Transaction values (numeric)
- Payment methods (categorical)
- Product categories (categorical, multi-value)
- Location codes (categorical)
- Promotion data (categorical)

### Key Analysis Methods
- Temporal pattern analysis (hourly/daily distributions)
- Association rule mining (product combinations)
- Anomaly detection using Isolation Forest algorithm

## 3. Current vs. Target Visualization State

### Current State
The tool currently outputs plain markdown text with:
- Basic statistics (transaction count, date range)
- Bulleted lists for temporal patterns
- Percentage-based distributions for payment methods
- Text descriptions of product association rules
- Simple anomaly rate reporting

### Target State
Transform this text-based output into an interactive, visually rich dashboard with:
- Interactive time series visualizations
- Heatmap calendars for temporal patterns
- Dynamic network graphs for product associations
- Anomaly highlighting with drill-down capabilities
- Conversational AI interface for deeper analysis

## 4. UI Component Design

### Primary Visualization: Transaction Pattern Dashboard

#### 4.1 Temporal Analysis Panel

**Heatmap Calendar**
- **Purpose**: Visualize transaction density across days/hours
- **Implementation**: Plotly heatmap with days on y-axis, hours on x-axis
- **Color Scale**: Midnight Navy (#0a1224) → Electric Cyan (#00e0ff) for intensity
- **Interactions**: Click to filter all visualizations by time period
- **Dimensions**: 400px × 280px

```python
import plotly.graph_objects as go

# Example code for heatmap calendar
fig = go.Figure(data=go.Heatmap(
    z=hourly_matrix,
    x=hours,
    y=days,
    colorscale=[[0, '#0a1224'], [1, '#00e0ff']],
    hoverongaps=False))

fig.update_layout(
    title='Transaction Density by Day and Hour',
    height=280,
    width=400,
    margin=dict(l=40, r=20, t=40, b=30),
    paper_bgcolor='#232a36',
    plot_bgcolor='#232a36',
    font=dict(color='#f7f9fb')
)
```

**Dual-Axis Time Series**
- **Purpose**: Show transaction volume and average value over time
- **Implementation**: Plotly line + bar chart with dual y-axes
- **Color Scheme**: Electric Cyan bars (#00e0ff) for count, Signal Magenta line (#e930ff) for value
- **Annotations**: Highlight peaks, promotions, and anomalous periods
- **Dimensions**: 640px × 280px

#### 4.2 Product Association Network

**Interactive Network Graph**
- **Purpose**: Visualize product associations and buying patterns
- **Implementation**: Plotly network graph with force-directed layout
- **Visual Elements**:
  - Nodes: Product categories (sized by frequency)
  - Edges: Association strength (thickness based on lift value)
  - Colors: Community detection for product clusters
- **Interactions**: 
  - Hover to highlight direct connections
  - Click to filter to specific product relationships
  - Slider to adjust association strength threshold
- **Dimensions**: 500px × 400px

```python
import plotly.graph_objects as go
import networkx as nx

# Network visualization example
G = nx.Graph()
for _, row in rules.iterrows():
    antecedents = ' + '.join(row['antecedents'])
    consequents = ' + '.join(row['consequents'])
    G.add_edge(antecedents, consequents, weight=row['lift'])

pos = nx.spring_layout(G)
edge_x, edge_y = [], []
for edge in G.edges():
    x0, y0 = pos[edge[0]]
    x1, y1 = pos[edge[1]]
    edge_x.extend([x0, x1, None])
    edge_y.extend([y0, y1, None])

# Continue with Plotly network visualization
```

#### 4.3 Anomaly Detection Panel

**Scatter Plot with Anomaly Highlighting**
- **Purpose**: Visualize normal vs. anomalous transactions
- **Implementation**: Plotly scatter plot with highlighting
- **Dimensions**: 400px × 350px
- **Visual Elements**:
  - X-axis: Time of day
  - Y-axis: Transaction value
  - Points: Transactions (size by product count)
  - Colors: Normal (Electric Cyan #00e0ff) vs Anomalous (Signal Magenta #e930ff)
- **Interactions**: 
  - Click anomalous points to see transaction details
  - Toggle between different feature spaces for anomaly visualization

#### 4.4 KPI Tiles Row

**Four KPI Tiles (120px × 120px each)**
1. **Total Transactions**
   - Large number display with trend indicator
   - Compare to previous period

2. **Anomaly Rate**
   - Percentage with circular progress indicator
   - Background shifts to Signal Magenta when above threshold  

3. **Peak Transaction Hour**
   - Hour display with small hour distribution sparkline
   - Visual indicator for "now" relative to peak

4. **Top Payment Method**
   - Icon + text for payment method
   - Percentage of total with mini pie chart

### Secondary Visualizations

#### 4.5 Payment Method Distribution
- **Implementation**: Plotly donut chart
- **Color Scheme**: Gradient of Electric Cyan shades
- **Interactions**: Click segments to filter transactions
- **Dimensions**: 280px × 280px

#### 4.6 Daily Volume Distribution
- **Implementation**: Plotly horizontal bar chart
- **Color Scheme**: Days colored by volume (Midnight Navy → Electric Cyan)
- **Annotations**: Weekend days visually distinguished
- **Dimensions**: 320px × 220px

### Conversational Elements

#### 4.7 Transaction Pattern Chatbot Interface
- **Implementation**: Right drawer interface (400px width)
- **Components**:
  - Query input field with slash commands
  - Conversation history with AI responses
  - "Thoughtlet" suggestion chips
- **Sample Queries**:
  - "/explain anomaly-pattern"
  - "/compare weekday-weekend"
  - "/find associated-with [product]"
  - "/predict next-hour trend"

#### 4.8 Insight Cards
- Three to five auto-generated insight cards (320px width)
- Algorithmically generated observations
- Each with "Tell me more" expansion option
- Color-coded by insight type (pattern, anomaly, recommendation)

## 5. User Interaction Flow

1. **Initial Load**
   - Dashboard loads with date range selector prominently displayed
   - Default view shows last 30 days of transaction data
   - Loading state uses skeleton layouts with Enterprise IQ-styled pulsing animation

2. **Time Range Selection**
   - User selects custom date range or preset period
   - All visualizations update with smooth transitions
   - Comparative metrics appear (vs. previous period)

3. **Pattern Exploration**
   - User can click on temporal heatmap to filter by specific time periods
   - Network visualization automatically adjusts to show relevant product associations
   - KPI tiles update to reflect filtered context

4. **Anomaly Investigation**
   - User clicks anomalous data points to reveal transaction details
   - System generates narratives explaining potential causes
   - Related transactions are highlighted across all visualizations

5. **Conversational Analysis**
   - User can ask natural language questions about patterns
   - AI provides insights and suggests further exploration paths
   - Conversation history maintained for context

## 6. Integration with Other Tools

### Direct Connections
- **Customer Segmentation**: Filter patterns by customer segments
- **Churn Prediction**: Highlight transaction patterns of at-risk customers
- **Financial Tool**: Connect transaction anomalies to financial impacts

### Data Flow
- Transaction patterns feed into predictive models for next purchases
- Anomaly detection shares signals with financial analysis tools
- Temporal patterns inform inventory optimization recommendations

## 7. Technical Implementation Notes

### Plotly Implementation
- Use Plotly.js for all interactive visualizations
- Ensure consistent theming with Enterprise IQ design system
- Implement custom hover templates for rich context display

### Responsive Considerations
- All visualizations must resize appropriately across breakpoints
- Mobile view prioritizes KPIs and anomaly detection
- Touch interactions optimized for tablet use

### Accessibility Requirements
- All charts include ARIA labels and keyboard navigation
- Color schemes validated for color blindness compatibility
- Chart data available in table format for screen readers

### Performance Optimization
- Initial load prioritizes KPI tiles and temporal heatmap
- Secondary visualizations load asynchronously
- Network graph uses WebGL rendering for large transaction sets 