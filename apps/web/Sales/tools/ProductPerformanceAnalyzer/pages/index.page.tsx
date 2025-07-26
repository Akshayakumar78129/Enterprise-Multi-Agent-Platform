import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../../../../ui-common/design-system/theme';
import { ProductPerformanceView } from '../ui/views/ProductPerformanceView';

// Import reducers
import productPerformanceReducer from '../ui/state/productPerformanceSlice';

// Configure Redux store
const store = configureStore({
  reducer: {
    productPerformance: productPerformanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

/**
 * Product Performance Analyzer Page
 * 
 * A Next.js page that renders the Product Performance Analyzer tool
 */
export default function ProductPerformanceAnalyzerPage() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ProductPerformanceView />
      </ThemeProvider>
    </Provider>
  );
} 