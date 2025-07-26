import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../../../../../ui-common/design-system/theme';
import { TransactionDashboard } from '../components/dashboard/TransactionDashboard';
import transactionReducer from '../state/transactionSlice';
import anomalyReducer from '../state/anomalySlice';

// Mock the react-plotly.js component to avoid test issues
jest.mock('react-plotly.js', () => ({
  __esModule: true,
  default: () => <div data-testid="plotly-chart">Mocked Plotly Chart</div>,
}));

// Create test store
const createTestStore = () => configureStore({
  reducer: {
    transactions: transactionReducer,
    anomalies: anomalyReducer,
  },
  preloadedState: {
    transactions: {
      transactions: [],
      stats: {
        totalTransactions: 1234,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        anomalyRate: 0.08,
        peakHours: [{ hour: 14, count: 234, percentage: 0.18 }],
        dailyDistribution: [{ day: 'Monday', count: 345, percentage: 0.15 }],
        paymentDistribution: [{ method: 'Credit Card', percentage: 0.45 }]
      },
      temporalHeatmap: {
        hourlyMatrix: Array(7).fill(Array(24).fill(0)),
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        hours: Array.from({ length: 24 }, (_, i) => i)
      },
      productAssociations: [],
      dateRange: {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      },
      selectedTimeFilter: null,
      loading: false,
      error: null
    },
    anomalies: {
      anomalies: [],
      stats: {
        anomalyRate: 0.08,
        anomalyCount: 123,
        totalTransactions: 1234,
        anomalyDistribution: {
          byHour: {},
          byDay: {},
          byPaymentMethod: {},
          byValue: { low: 10, medium: 34, high: 79 }
        }
      },
      selectedAnomaly: null,
      loading: false,
      error: null
    }
  }
});

describe('TransactionDashboard Component', () => {
  test('renders all KPI tiles', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <ThemeProvider>
          <TransactionDashboard />
        </ThemeProvider>
      </Provider>
    );
    
    // Check for titles of KPI components
    expect(screen.getByText('Transaction Pattern Analysis')).toBeInTheDocument();
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('Anomaly Rate')).toBeInTheDocument();
    expect(screen.getByText('Peak Transaction Hour')).toBeInTheDocument();
    expect(screen.getByText('Top Payment Method')).toBeInTheDocument();
  });
  
  test('renders control components', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <ThemeProvider>
          <TransactionDashboard />
        </ThemeProvider>
      </Provider>
    );
    
    // Check for control component titles
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Filter Transactions')).toBeInTheDocument();
    expect(screen.getByText('Ask about transaction patterns')).toBeInTheDocument();
  });
  
  test('renders visualization components', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <ThemeProvider>
          <TransactionDashboard />
        </ThemeProvider>
      </Provider>
    );
    
    // Check for visualization titles
    expect(screen.getByText('Transaction Density by Day and Hour')).toBeInTheDocument();
    expect(screen.getByText('Transaction Volume and Average Value Over Time')).toBeInTheDocument();
    expect(screen.getByText('Product Association Network')).toBeInTheDocument();
    expect(screen.getByText('Transaction Anomalies')).toBeInTheDocument();
    expect(screen.getByText('Payment Method Distribution')).toBeInTheDocument();
    expect(screen.getByText('Daily Volume Distribution')).toBeInTheDocument();
    
    // Check for Plotly charts (mocked)
    const chartElements = screen.getAllByTestId('plotly-chart');
    expect(chartElements.length).toBeGreaterThan(0);
  });
}); 