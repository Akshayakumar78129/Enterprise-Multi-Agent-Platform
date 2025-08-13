import React from 'react';

const Insight = ({ title, children }) => (
  <div style={{ 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    padding: '15px', 
    borderRadius: '8px', 
    margin: '10px 0',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }}>
    <h4 style={{ marginTop: 0, color: '#a5b4fc' }}>{title}</h4>
    <p style={{ margin: 0, color: '#d1d5db' }}>{children}</p>
  </div>
);

export default Insight;
