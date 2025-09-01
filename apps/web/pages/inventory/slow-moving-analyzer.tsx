import React from "react";
import SlowMovingDashboard from "../../Inventory/tools/SlowMovingInventoryAnalyzer/ui/views/SlowMovingDashboard";
import Head from "next/head";

export default function SlowMovingInventoryDashboardPage() {
  return (
    <>
      <Head>
        <title>Slow Moving Inventory Dashboard - Enterprise IQ</title>
        <meta 
          name="description" 
          content="Analyze and optimize slow-moving inventory across your organization with comprehensive turnover analysis and actionable insights." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SlowMovingDashboard />
    </>
  );
}
