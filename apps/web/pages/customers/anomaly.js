import React from 'react';
import Head from 'next/head';
import AnomalyDashboard from '../../Customer/tools/anomaly_detection/ui/views/AnomalyDashboard';

export default function AnomalyDetectionPage() {
  return (
    <>
      <Head>
        <title>Anomaly Detection - Enterprise IQ</title>
        <meta name="description" content="Advanced customer behavior anomaly detection and analysis" />
      </Head>
      <AnomalyDashboard />
    </>
  );
} 