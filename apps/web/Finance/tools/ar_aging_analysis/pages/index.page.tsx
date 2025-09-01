import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the dashboard to avoid SSR issues
const ARAgingDashboard = dynamic(
  () => import('../ui/views/ARAgingDashboard'),
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
        Loading AR Aging Analysis...
      </div>
    )
  }
);

export default function ARAgingAnalysisPage() {
  return <ARAgingDashboard />;
}