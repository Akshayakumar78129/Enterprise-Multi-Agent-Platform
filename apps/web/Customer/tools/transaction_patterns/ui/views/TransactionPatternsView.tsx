import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../../../../ui-common/design-system/theme';
import { TransactionDashboard } from '../components/dashboard/TransactionDashboard';

// Import reducers
import transactionReducer from '../state/transactionSlice';
import anomalyReducer from '../state/anomalySlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    transactions: transactionReducer,
    anomalies: anomalyReducer,
  },
});

export const TransactionPatternsView: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <TransactionDashboard />
      </ThemeProvider>
    </Provider>
  );
}; 