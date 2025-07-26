import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Toggle Component
 * 
 * A toggle/switch component for boolean inputs.
 * Supports various sizes, states, and custom styling.
 */
export const Toggle = ({
  checked = false,
  onChange = () => {},
  size = 'md',
  disabled = false,
  label = null,
  labelPosition = 'right',
  className = '',
  style = {},
}) => {
  const theme = useTheme();
  
  // Size configurations
  const sizes = {
    sm: {
      width: '32px',
      height: '16px',
      knobSize: '12px',
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      width: '40px',
      height: '20px',
      knobSize: '16px',
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      width: '48px',
      height: '24px',
      knobSize: '20px',
      fontSize: theme.typography.fontSize.lg,
    },
  };
  
  // Container styles
  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  };
  
  // Toggle track styles
  const trackStyle = {
    position: 'relative',
    width: sizes[size].width,
    height: sizes[size].height,
    backgroundColor: checked ? theme.colors.electricCyan : theme.colors.graphiteLight,
    borderRadius: sizes[size].height,
    transition: theme.transitions.default,
    boxShadow: checked ? theme.shadows.glow.cyan : 'none',
  };
  
  // Toggle knob styles
  const knobStyle = {
    position: 'absolute',
    top: `calc((${sizes[size].height} - ${sizes[size].knobSize}) / 2)`,
    left: checked ? `calc(${sizes[size].width} - ${sizes[size].knobSize} - 2px)` : '2px',
    width: sizes[size].knobSize,
    height: sizes[size].knobSize,
    backgroundColor: theme.colors.cloudWhite,
    borderRadius: '50%',
    transition: theme.transitions.default,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  };
  
  // Label styles
  const labelStyle = {
    fontSize: sizes[size].fontSize,
    color: theme.colors.cloudWhite,
    marginLeft: labelPosition === 'right' ? theme.spacing[3] : 0,
    marginRight: labelPosition === 'left' ? theme.spacing[3] : 0,
    userSelect: 'none',
  };
  
  // Handle toggle change
  const handleToggleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };
  
  return (
    <div 
      className={`enterprise-iq-toggle ${className}`}
      style={containerStyle}
      onClick={handleToggleChange}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
    >
      <div style={trackStyle}>
        <div style={knobStyle} />
      </div>
      
      {label && (
        <div style={labelStyle}>
          {label}
        </div>
      )}
    </div>
  );
};

Toggle.propTypes = {
  /** Whether the toggle is checked */
  checked: PropTypes.bool,
  /** Change handler */
  onChange: PropTypes.func,
  /** Size of the toggle */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether the toggle is disabled */
  disabled: PropTypes.bool,
  /** Label for the toggle */
  label: PropTypes.node,
  /** Position of the label */
  labelPosition: PropTypes.oneOf(['left', 'right']),
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the toggle container */
  style: PropTypes.object,
};

export default Toggle; 