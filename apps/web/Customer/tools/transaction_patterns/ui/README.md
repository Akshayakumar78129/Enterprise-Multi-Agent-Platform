# Transaction Patterns Tool - UI Implementation

## Overview

The Transaction Patterns Tool UI provides a comprehensive visual analytics dashboard for analyzing transaction data. It helps identify temporal patterns, product associations, and anomalous transactions through interactive visualizations.

## Key Features

- Temporal analysis through heatmap calendar visualization
- Transaction volume and value trends over time
- Product association network visualization
- Anomaly detection and visualization
- KPI tiles for key metrics

## Component Structure

### Visualizations

- **TemporalHeatmap**: Displays transaction density by day and hour
- **DualAxisTimeSeries**: Shows transaction count and average value over time
- **ProductAssociationNetwork**: Visualizes relationships between products
- **AnomalyScatterPlot**: Highlights normal vs. anomalous transactions

### State Management

- **transactionSlice**: Manages transaction data, temporal patterns, and product associations
- **anomalySlice**: Manages anomaly detection data and selected anomalies

### API Integration

- **transactionPatternApi**: Service for fetching transaction pattern data
- **functionCalls**: AI function call declarations for conversational interaction

### Utilities

- **formatters**: Utilities for formatting dates, numbers, and other data
- **chartHelpers**: Configuration helpers for Plotly charts

## Usage

The main Transaction Patterns dashboard can be integrated into a larger application using:

```jsx
import { TransactionPatternsView } from '/Customer/tools/transaction_patterns/ui/views/TransactionPatternsView';

// Then in your component:
<TransactionPatternsView />
```

## AI Integration

The visualization components are designed to work with the Enterprise IQ AI interaction system, supporting:

- Direct pointing to anomalies
- Highlighting temporal patterns
- Explaining product associations
- Filtering by time periods
- Comparing different time periods

## Dependencies

- React + Redux Toolkit for state management
- Plotly.js for visualizations
- Enterprise IQ design system components

## Future Improvements

- Implement real-time data streaming
- Add export functionality for insights
- Enhance AI explanations of patterns
- Add custom date range presets 