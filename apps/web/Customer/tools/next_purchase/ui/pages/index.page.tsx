import React from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy visualization dashboard
const NextPurchaseDashboard = dynamic(() => import('../views/NextPurchaseDashboard'), { ssr: false });

const NextPurchaseToolPage: React.FC = () => {
  return <NextPurchaseDashboard />;
};

export default NextPurchaseToolPage;
