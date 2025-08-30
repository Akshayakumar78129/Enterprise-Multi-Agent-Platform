import React from 'react';

const Insight = ({ title, children }) => (
  <div style={{ 
    backgroundColor: '#1A1F26', 
    padding: '20px', 
    borderRadius: '8px', 
    margin: '16px 0',
    border: 'none',
    transition: 'all 200ms ease-out'
  }}>
    <h4 style={{ 
      marginTop: 0, 
      marginBottom: '12px',
      color: '#F8FAFC',
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: '1.4',
      letterSpacing: '-0.01em'
    }}>{title}</h4>
    <p style={{ 
      margin: 0, 
      color: '#94A3B8',
      fontSize: '14px',
      lineHeight: '1.5',
      fontWeight: 400
    }}>{children}</p>
  </div>
);

export default Insight;
