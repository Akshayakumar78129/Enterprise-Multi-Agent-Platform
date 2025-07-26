import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Checkbox Component
 * 
 * A checkbox component for boolean or multiple selection inputs.
 * Supports various sizes, states, and custom styling.
 */
export const Checkbox = ({
  checked = false,
  indeterminate = false,
  onChange = () => {},
  size = 'md',
  disabled = false,
  label = null,
  className = '',
  style = {},
}) => {
  const theme = useTheme();
  
  // Size configurations
  const sizes = {
    sm: {
      size: '16px',
      borderRadius: theme.borderRadius.sm,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      size: '20px',
      borderRadius: theme.borderRadius.sm,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      size: '24px',
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.lg,
    },
  };
  
  // Container styles
  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  };
  
  // Checkbox styles
  const checkboxStyle = {
    position: 'relative',
    width: sizes[size].size,
    height: sizes[size].size,
    backgroundColor: checked || indeterminate ? theme.colors.electricCyan : 'transparent',
    borderRadius: sizes[size].borderRadius,
    border: `2px solid ${checked || indeterminate ? theme.colors.electricCyan : theme.colors.graphiteLight}`,
    transition: theme.transitions.default,
    boxShadow: checked || indeterminate ? theme.shadows.glow.cyan : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  
  // Checkmark styles
  const checkmarkStyle = {
    display: checked && !indeterminate ? 'block' : 'none',
    color: theme.colors.midnightNavy,
  };
  
  // Indeterminate mark styles
  const indeterminateStyle = {
    display: indeterminate ? 'block' : 'none',
    width: '70%',
    height: '2px',
    backgroundColor: theme.colors.midnightNavy,
    borderRadius: '1px',
  };
  
  // Label styles
  const labelStyle = {
    fontSize: sizes[size].fontSize,
    marginLeft: theme.spacing[3],
    color: theme.colors.cloudWhite,
    userSelect: 'none',
  };
  
  // Handle checkbox change
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };
  
  // Custom checkmark icon using CSS border trick
  const renderCheckmark = () => (
    <div
      style={{
        ...checkmarkStyle,
        width: '40%',
        height: '70%',
        borderRight: `2px solid ${theme.colors.midnightNavy}`,
        borderBottom: `2px solid ${theme.colors.midnightNavy}`,
        transform: 'rotate(45deg)',
        marginTop: '-20%',
      }}
    />
  );
  
  return (
    <div 
      className={`enterprise-iq-checkbox ${className}`}
      style={containerStyle}
      onClick={handleChange}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
    >
      <div style={checkboxStyle}>
        {renderCheckmark()}
        <div style={indeterminateStyle} />
      </div>
      
      {label && (
        <div style={labelStyle}>
          {label}
        </div>
      )}
    </div>
  );
};

Checkbox.propTypes = {
  /** Whether the checkbox is checked */
  checked: PropTypes.bool,
  /** Whether the checkbox is in an indeterminate state */
  indeterminate: PropTypes.bool,
  /** Change handler */
  onChange: PropTypes.func,
  /** Size of the checkbox */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether the checkbox is disabled */
  disabled: PropTypes.bool,
  /** Label for the checkbox */
  label: PropTypes.node,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the checkbox container */
  style: PropTypes.object,
};

export default Checkbox; 