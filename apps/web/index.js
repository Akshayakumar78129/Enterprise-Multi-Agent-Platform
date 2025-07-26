import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from './ui-common/design-system/theme';
import { TransactionPatternsView } from './Customer/tools/transaction_patterns/ui/views/TransactionPatternsView';

// Import reducers
import transactionReducer from './Customer/tools/transaction_patterns/ui/state/transactionSlice';
import anomalyReducer from './Customer/tools/transaction_patterns/ui/state/anomalySlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    anomalies: anomalyReducer,
  },
  // Use middleware to handle API calls
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

// Create demo data for display
const mockTransactionStats = {
  totalTransactions: 12345,
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  anomalyRate: 0.08,
  peakHours: [
    { hour: 12, count: 1245, percentage: 0.18 },
    { hour: 17, count: 1100, percentage: 0.16 }
  ],
  dailyDistribution: [
    { day: 'Monday', count: 1800, percentage: 0.15 },
    { day: 'Tuesday', count: 1900, percentage: 0.16 },
    { day: 'Wednesday', count: 2100, percentage: 0.17 },
    { day: 'Thursday', count: 2200, percentage: 0.18 },
    { day: 'Friday', count: 2000, percentage: 0.16 },
    { day: 'Saturday', count: 1200, percentage: 0.09 },
    { day: 'Sunday', count: 1100, percentage: 0.09 }
  ],
  paymentDistribution: [
    { method: 'Credit Card', count: 6500, percentage: 0.53 },
    { method: 'Digital Wallet', count: 3200, percentage: 0.26 },
    { method: 'Bank Transfer', count: 1845, percentage: 0.15 },
    { method: 'Cash', count: 800, percentage: 0.06 }
  ]
};

// Simple mock for database data loading
store.dispatch({ 
  type: 'transactions/fetchTransactionData/fulfilled',
  payload: {
    transactions: [],
    stats: mockTransactionStats,
    temporalHeatmap: {
      hourlyMatrix: Array(7).fill(Array(24).fill(0)).map(() => 
        Array(24).fill(0).map(() => Math.floor(Math.random() * 100))
      ),
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: Array.from({ length: 24 }, (_, i) => i)
    },
    productAssociations: Array(20).fill(0).map((_, i) => ({
      sourceProduct: `Product ${i}`,
      targetProduct: `Product ${Math.floor(Math.random() * 20)}`,
      strength: Math.random() * 0.8 + 0.2,
      count: Math.floor(Math.random() * 500)
    }))
  }
});

// Similar mock data for anomalies
store.dispatch({
  type: 'anomalies/fetchAnomalyData/fulfilled',
  payload: {
    anomalies: Array(10).fill(0).map((_, i) => ({
      transactionId: `TX-${1000 + i}`,
      timestamp: new Date().toISOString(),
      value: Math.random() * 2000,
      hour: Math.floor(Math.random() * 24),
      dayOfWeek: Math.floor(Math.random() * 7) + 1,
      productsCount: Math.floor(Math.random() * 10) + 1,
      paymentMethod: ['Credit Card', 'Digital Wallet', 'Bank Transfer', 'Cash'][Math.floor(Math.random() * 4)],
      location: `Store #${100 + Math.floor(Math.random() * 10)}`,
      isAnomaly: true,
      anomalyScore: Math.random() * 0.5 + 0.5
    })),
    stats: {
      anomalyRate: 0.08,
      anomalyCount: 985,
      totalTransactions: 12345,
      anomalyDistribution: {
        byHour: {},
        byDay: {},
        byPaymentMethod: {},
        byValue: { low: 210, medium: 575, high: 200 }
      }
    }
  }
});

// Render the demo app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <Provider store={store}>
      <ThemeProvider>
        <TransactionPatternsView />
      </ThemeProvider>
    </Provider>
  );
} 