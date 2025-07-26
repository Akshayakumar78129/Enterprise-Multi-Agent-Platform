import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '../../ui-common/design-system/theme';
import productPerformanceReducer from '../../Sales/tools/ProductPerformanceAnalyzer/ui/state/productPerformanceSlice';

// Import dynamically with SSR disabled to prevent 'self is not defined' error
const ProductPerformanceView = dynamic(
  () => import('../../Sales/tools/ProductPerformanceAnalyzer/ui/views/ProductPerformanceView'),
  { ssr: false }
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
          <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#0a1224',
            padding: '24px'
          }}>
            <h1 style={{ 
              color: '#f7f9fb', 
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '32px',
              fontWeight: 700
            }}>
              Product Performance Analyzer
            </h1>
            
            <ProductPerformanceView />
          </div>
        </ThemeProvider>
      </Provider>
    </>
  );
} 