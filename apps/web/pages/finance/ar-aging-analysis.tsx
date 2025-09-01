import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ThemeProvider } from '../../ui-common/design-system/theme';
import arAgingReducer from '../../Finance/tools/ar_aging_analysis/ui/state/arAgingSlice';

// Import dynamically with SSR disabled to prevent 'self is not defined' error
const ARAgingView = dynamic(
  () => import('../../Finance/tools/ar_aging_analysis/ui/views/ARAgingView'),
  { ssr: false }
);

// Configure Redux store with AR aging reducer
const store = configureStore({
  reducer: {
    arAging: arAgingReducer,
  },
});

/**
 * AR Aging Analysis Page
 */
export default function ARAgingAnalysisPage() {
  return (
    <>
      <Head>
        <title>Enterprise IQ - AR Aging Analysis</title>
        <meta name="description" content="Strategic working capital optimization through AR aging analysis" />
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
              Accounts Receivable Aging Analysis
            </h1>
            <ARAgingView />
          </div>
        </ThemeProvider>
      </Provider>
    </>
  );
}