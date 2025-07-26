import React from "react";
import HoldingCostDashboard from "../../Inventory/tools/InventoryHoldingCostAnalyzer/ui/views/HoldingCostDashboard";
import Head from "next/head";

export default function InventoryHoldingCostAnalyzerPage() {
  return (
    <>
      <Head>
        <title>Inventory Holding Cost Analyzer - Enterprise IQ</title>
        <meta 
          name="description" 
          content="Analyze and optimize inventory carrying costs across your organization with comprehensive cost breakdown and savings opportunities identification." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HoldingCostDashboard />
    </>
  );
} 