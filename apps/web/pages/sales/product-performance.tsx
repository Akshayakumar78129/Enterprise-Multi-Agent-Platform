import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '../../ui-common/design-system/theme';
import productPerformanceReducer from '../../Sales/tools/ProductPerformanceAnalyzer/ui/state/productPerformanceSlice';

// Import dynamically with SSR disabled to prevent 'self is not defined' error
const ProductPerformanceDashboard = dynamic(
  () => import('../../Sales/tools/ProductPerformanceAnalyzer/ui/views/ProductPerformanceDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
        color: '#00e0ff',
        fontSize: '1.2rem'
      }}>
        Loading Product Performance Analyzer...
      </div>
    )
  }
);

// Configure Redux store with product performance reducer
const store = configureStore({
  reducer: {
    productPerformance: productPerformanceReducer,
  },
});

/**
 * Product Performance Page
 */
export default function ProductPerformancePage() {
  return (
    <>
      <Head>
        <title>Enterprise IQ - Product Performance</title>
        <meta name="description" content="Analyze product performance with the Enterprise IQ platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Provider store={store}>
        <ThemeProvider>
          <ProductPerformanceDashboard />
        </ThemeProvider>
      </Provider>
    </>
  );
} 