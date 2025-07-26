import React from 'react';
import Head from 'next/head';
import LTVDashboard from '../../Customer/tools/customer_lifetime_value/ui/views/LTVDashboard';

export default function CustomerLifetimeValuePage() {
  return (
    <>
      <Head>
        <title>Customer Lifetime Value Analytics | Enterprise IQ</title>
        <meta 
          name="description" 
          content="Advanced customer lifetime value analytics with predictive modeling, value distribution analysis, and actionable insights for customer value optimization." 
        />
        <meta name="keywords" content="customer lifetime value, LTV, predictive analytics, customer value, CLV, customer analytics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://enterprise-iq.com/customers/customer-lifetime-value" />
        <meta property="og:title" content="Customer Lifetime Value Analytics | Enterprise IQ" />
        <meta property="og:description" content="Advanced customer lifetime value analytics with predictive modeling and actionable insights." />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://enterprise-iq.com/customers/customer-lifetime-value" />
        <meta property="twitter:title" content="Customer Lifetime Value Analytics | Enterprise IQ" />
        <meta property="twitter:description" content="Advanced customer lifetime value analytics with predictive modeling and actionable insights." />
        
        {/* Accessibility */}
        <meta name="theme-color" content="#0a1224" />
        <meta name="color-scheme" content="dark" />
      </Head>
      
      <main 
        role="main"
        aria-label="Customer Lifetime Value Analytics Dashboard"
        style={{
          backgroundColor: '#0a1224',
          minHeight: '100vh',
          color: '#f7f9fb'
        }}
      >
        <LTVDashboard 
          initialFilters={{
            dateRange: {
              start: '2017-01-01',
              end: '2021-12-31'
            }
          }}
          autoRefresh={false}
        />
      </main>
    </>
  );
} 