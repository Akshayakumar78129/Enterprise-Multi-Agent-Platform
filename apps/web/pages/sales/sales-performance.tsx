import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import dynamically with SSR disabled if needed, similar to ProductPerformancePage
// However, SalesPerformanceAnalyzerPage already handles its own Redux provider and ThemeProvider
const SalesPerformanceAnalyzerPage = dynamic(
  () => import('../../Sales/tools/SalesPerformanceAnalyzer/pages/index.page'),
  { ssr: false } // Assuming SSR might cause issues, common with charting libraries or Redux on client
);

/**
 * Sales Performance Page
 * This page will host the Sales Performance Analyzer tool.
 */
export default function SalesPerformancePage() {
  return (
    <>
      <Head>
        <title>Enterprise IQ - Sales Performance</title>
        <meta name="description" content="Analyze sales performance with the Enterprise IQ platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* 
        The SalesPerformanceAnalyzerPage already includes Provider and ThemeProvider.
        So, we can render it directly here. 
        If global store/theme is needed at this level, structure might differ.
      */}
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a1224', // Consistent background with product page
        padding: '24px'
      }}>
        <h1 style={{ 
          color: '#f7f9fb', 
          marginBottom: '24px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '32px',
          fontWeight: 700
        }}>
          Sales Performance Analyzer
        </h1>
        
        <SalesPerformanceAnalyzerPage />
      </div>
    </>
  );
} 