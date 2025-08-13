import React from "react";
import Head from 'next/head';
import PurchaseFrequencyDashboard from "../../Customer/tools/purchase_frequency/ui/views/PurchaseFrequencyDashboard";

export default function PurchaseFrequencyPage() {
  return (
    <>
      <Head>
        <title>Purchase Frequency - Enterprise IQ</title>
        <meta name="description" content="Analyze customer purchase frequency, segments, and value dynamics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PurchaseFrequencyDashboard />
    </>
  );
}