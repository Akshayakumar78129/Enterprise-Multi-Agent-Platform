import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the dashboard to avoid SSR issues
const InventoryOptimizationDashboard = dynamic(
  () => import('../ui/views/InventoryOptimizationDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
        color: '#00e0ff',
        fontSize: '1.2rem'
      }}>
        Loading Inventory Optimization Analyzer...
      </div>
    )
  }
);

export default function InventoryOptimizationAnalyzerPage() {
  return <InventoryOptimizationDashboard />;
}