import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'default' | 'interactive' | 'anomaly';
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: Record<string, string | number>;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  isLoading = false,
  variant = 'default',
  elevation = 'md',
  fullWidth = false,
  children,
  className,
  onClick,
  style
}) => {
  // Theme constants
  const colors = {
    default: {
      background: '#232a36',
      border: '#3a4459',
      text: '#f7f9fb',
      highlight: '#00e0ff'
    },
    interactive: {
      background: '#232a36',
      border: '#00e0ff',
      text: '#f7f9fb',
      highlight: '#00e0ff'
    },
    anomaly: {
      background: '#232a36',
      border: '#e930ff',
      text: '#f7f9fb',
      highlight: '#e930ff'
    }
  };

  const shadows = {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.25)'
  };

  // Card styles
  const selectedColors = colors[variant] || colors.default;
  const cardStyle: Record<string, string | number> = {
    backgroundColor: selectedColors.background,
    borderRadius: '8px',
    border: `1px solid ${selectedColors.border}`,
    boxShadow: shadows[elevation],
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease',
    transform: 'scale(1)',
    ...style
  };

  // Header styles
  const headerStyle: Record<string, string | number> = {
    padding: '16px',
    borderBottom: title || subtitle ? `1px solid ${selectedColors.border}` : 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  // Content styles
  const contentStyle: Record<string, string | number> = {
    flexGrow: 1
  };

  // Loading overlay styles
  const loadingOverlayStyle: Record<string, string | number> = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 18, 36, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={onClick}
      onMouseOver={onClick ? (e) => { e.currentTarget.style.transform = 'scale(1.02)'; } : undefined}
      onMouseOut={onClick ? (e) => { e.currentTarget.style.transform = 'scale(1)'; } : undefined}
    >
      {(title || subtitle || actions) && (
        <div style={headerStyle}>
          <div>
            {title && (
              <div style={{ fontSize: '16px', fontWeight: 600, color: selectedColors.text }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: '14px', color: selectedColors.text, opacity: 0.7, marginTop: '4px' }}>
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div>{actions}</div>
          )}
        </div>
      )}
      <div style={contentStyle}>
        <div style={{ position: 'relative' }}>
          {isLoading && (
            <div style={loadingOverlayStyle}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                border: `3px solid ${selectedColors.highlight}`,
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}; 