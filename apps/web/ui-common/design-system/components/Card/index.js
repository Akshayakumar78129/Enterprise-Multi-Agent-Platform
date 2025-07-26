import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Card Component
 * 
 * A versatile card component that serves as a container for content.
 * Used throughout the Enterprise IQ system for dashboards, KPIs, and content sections.
 */
export const Card = ({
  children,
  title,
  subtitle,
  variant = 'default',
  className = '',
  style = {},
  headerStyle = {},
  bodyStyle = {},
  onClick = null,
  actions = null,
  isLoading = false,
  elevation = 'md',
  fullWidth = false,
  fullHeight = false,
  minHeight = null,
}) => {
  const theme = useTheme();
  
  // Define variant styles directly
  const variantStyles = {
    default: {
      backgroundColor: theme.colors.graphite,
      borderRadius: theme.borderRadius.xl,
      padding: 0,
    },
    interactive: {
      backgroundColor: theme.colors.graphite,
      borderRadius: theme.borderRadius.xl,
      padding: 0,
      cursor: 'pointer',
      transition: theme.transitions.default,
      '&:hover': {
        boxShadow: theme.shadows.lg,
        transform: 'translateY(-2px)',
      }
    },
    anomaly: {
      backgroundColor: theme.colors.graphite,
      borderRadius: theme.borderRadius.xl,
      padding: 0,
      borderLeft: `4px solid ${theme.colors.signalMagenta}`,
    },
  };

  // Combine base styles with variant styles
  const cardStyle = {
    ...variantStyles[variant],
    width: fullWidth ? '100%' : 'auto',
    height: fullHeight ? '100%' : 'auto',
    minHeight: minHeight,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: theme.shadows[elevation],
    ...style,
  };

  // Apply cursor pointer if onClick is provided
  if (onClick) {
    cardStyle.cursor = 'pointer';
  }

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  // Loading overlay styles
  const loadingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${theme.colors.midnightNavy}80`, // 50% opacity
    display: isLoading ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: variantStyles[variant].borderRadius,
    zIndex: 1,
  };

  // Default header styles
  const defaultHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    borderBottom: title ? `1px solid ${theme.colors.graphiteLight}` : 'none',
    ...headerStyle,
  };

  // Default body styles
  const defaultBodyStyle = {
    padding: theme.spacing[4],
    flex: 1,
    ...bodyStyle,
  };

  return (
    <div
      className={`enterprise-iq-card ${className}`}
      style={cardStyle}
      onClick={handleClick}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div style={loadingOverlayStyle}>
          <div className="card-loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.colors.graphiteLight}`,
            borderTop: `3px solid ${theme.colors.electricCyan}`,
            borderRadius: '50%',
            animation: 'card-spin 1s linear infinite',
          }} />
        </div>
      )}

      {/* Card header */}
      {(title || actions) && (
        <div className="card-header" style={defaultHeaderStyle}>
          <div className="card-header-content">
            {title && (
              <h3 style={{
                margin: 0,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semiBold,
                color: theme.colors.cloudWhite,
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.cloudWhite,
                marginTop: theme.spacing[1],
                opacity: 0.7,
              }}>
                {subtitle}
              </div>
            )}
          </div>
          {actions && (
            <div className="card-actions">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card body */}
      <div className="card-body" style={defaultBodyStyle}>
        {children}
      </div>

      {/* CSS for the loading spinner animation */}
      <style jsx global>{`
        @keyframes card-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

Card.propTypes = {
  /** Card content */
  children: PropTypes.node,
  /** Card title displayed in the header */
  title: PropTypes.node,
  /** Card subtitle displayed below the title */
  subtitle: PropTypes.node,
  /** Visual variant of the card */
  variant: PropTypes.oneOf(['default', 'interactive', 'anomaly']),
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the card container */
  style: PropTypes.object,
  /** Custom styles for the card header */
  headerStyle: PropTypes.object,
  /** Custom styles for the card body */
  bodyStyle: PropTypes.object,
  /** Click handler for the card */
  onClick: PropTypes.func,
  /** Action components to display in the top-right corner */
  actions: PropTypes.node,
  /** Whether the card is in a loading state */
  isLoading: PropTypes.bool,
  /** Shadow elevation for the card */
  elevation: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  /** Whether the card should take up the full width of its container */
  fullWidth: PropTypes.bool,
  /** Whether the card should take up the full height of its container */
  fullHeight: PropTypes.bool,
  /** Minimum height for the card */
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Card; 