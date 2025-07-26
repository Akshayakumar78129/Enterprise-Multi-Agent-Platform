import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

const NavigationToggle = ({ onClick, className = '' }) => {
  // Enterprise IQ Design Tokens
  const colors = {
    midnightNavy: '#0a1224',
    electricCyan: '#00e0ff',
    graphite: '#232a36',
    graphiteLight: '#3a4459',
    cloudWhite: '#f7f9fb',
    overlay20: 'rgba(10, 18, 36, 0.2)',
  };

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        backgroundColor: colors.graphite,
        border: `1px solid ${colors.graphiteLight}`,
        borderRadius: '12px',
        boxShadow: `0 4px 12px ${colors.overlay20}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      className={className}
      aria-label="Open Dashboard Navigation"
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = colors.electricCyan;
        e.currentTarget.style.backgroundColor = colors.graphiteLight;
        e.currentTarget.style.boxShadow = `0 6px 20px ${colors.overlay20}, 0 0 0 1px ${colors.electricCyan}40`;
        e.currentTarget.style.transform = 'translateY(-1px)';
        const icon = e.currentTarget.querySelector('svg');
        if (icon) icon.style.color = colors.electricCyan;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = colors.graphiteLight;
        e.currentTarget.style.backgroundColor = colors.graphite;
        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.overlay20}`;
        e.currentTarget.style.transform = 'translateY(0)';
        const icon = e.currentTarget.querySelector('svg');
        if (icon) icon.style.color = colors.cloudWhite;
      }}
    >
      <Bars3Icon 
        style={{ 
          width: '20px', 
          height: '20px',
          color: colors.cloudWhite,
          opacity: 0.9,
          transition: 'color 0.2s ease'
        }} 
      />
    </button>
  );
};

export default NavigationToggle; 