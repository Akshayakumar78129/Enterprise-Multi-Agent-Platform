import React from 'react';
import Head from 'next/head';
import CustomerSegmentationDashboard from '../../Customer/tools/customer_segmentation/pages/index.page';

export default function CustomerSegmentationPage() {
  return (
    <>
      <Head>
        <title>Customer Segmentation - Enterprise IQ</title>
        <meta name="description" content="AI-powered customer segmentation with intelligent insights" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <CustomerSegmentationDashboard />
    </>
  );
} 