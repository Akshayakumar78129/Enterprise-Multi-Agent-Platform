import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../../../ui-common/design-system/theme';
import { SalesPerformanceView } from '../ui/views/SalesPerformanceView';
import salesPerformanceReducer from '../ui/state/salesPerformanceSlice';

// Configure Redux store for Sales Performance
const store = configureStore({
  reducer: {
    salesPerformance: salesPerformanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for this demo/tool
    }),
});

// This is needed for the SalesPerformanceView to correctly infer AppDispatch type
export type AppDispatch = typeof store.dispatch;

/**
 * Sales Performance Analyzer Page
 *
 * A Next.js page that renders the Sales Performance Analyzer tool
 */
export default function SalesPerformanceAnalyzerPage() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SalesPerformanceView />
      </ThemeProvider>
    </Provider>
  );
} 