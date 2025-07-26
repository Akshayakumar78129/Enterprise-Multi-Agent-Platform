import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the dashboard with SSR disabled
const SalesTrendDashboard = dynamic(
  () => import('../../Sales/tools/SalesTrendAnalyzer/ui/views/SalesTrendDashboard'),
  { ssr: false }
);

export default function SalesTrendsPage() {
  return (
    <SalesTrendDashboard 
      defaultDateRange={{
        start: '2017-01-01',
        end: '2021-12-31'
      }}
    />
  );
} 