import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const DemandForecastDashboard = dynamic(
  () => import('../../Sales/tools/DemandForecastEngine/ui/views/DemandForecastDashboard'),
  { ssr: false }
);

export default function DemandForecastPage() {
  return (
    <>
      <Head>
        <title>Enterprise IQ - Demand Forecast</title>
        <meta name="description" content="AI-powered demand forecasting and planning with Enterprise IQ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <DemandForecastDashboard />
    </>
  );
}