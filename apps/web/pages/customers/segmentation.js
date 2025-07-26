import React from 'react';
import Head from 'next/head';
import SimpleCustomerSegmentationDashboard from '../../Customer/tools/customer_segmentation/ui/views/SimpleCustomerSegmentationDashboard';

export default function CustomerSegmentationPage() {
  return (
    <>
      <Head>
        <title>Customer Segmentation - Enterprise IQ</title>
        <meta name="description" content="RFM-based customer segmentation analysis and insights" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <SimpleCustomerSegmentationDashboard />
    </>
  );
} 