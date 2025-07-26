import React from 'react';
import LTVDashboard from '../ui/views/LTVDashboard';

const CustomerLifetimeValuePage = () => {
  return (
    <div style={{
      backgroundColor: '#0a1224',
      minHeight: '100vh',
      padding: '0'
    }}>
      <LTVDashboard 
        autoRefresh={true}
        refreshInterval={300000} // 5 minutes
      />
    </div>
  );
};

export default CustomerLifetimeValuePage; 