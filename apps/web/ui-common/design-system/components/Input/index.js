import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Input Component
 * 
 * A versatile input component used throughout the Enterprise IQ system.
 * Supports various states, sizes, and configurations.
 */
export const Input = ({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  label = null,
  helperText = null,
  error = null,
  size = 'md',
  disabled = false,
  readOnly = false,
  fullWidth = false,
  maxLength = null,
  name = '',
  id = '',
  icon = null,
  rightIcon = null,
  autoFocus = false,
  className = '',
  style = {},
  onFocus = () => {},
  onBlur = () => {},
  onKeyPress = () => {},
  onKeyDown = () => {},
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  // Size configurations
  const sizes = {
    sm: {
      height: '32px',
      fontSize: theme.typography.fontSize.sm,
      padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    },
    md: {
      height: '40px',
      fontSize: theme.typography.fontSize.base,
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    },
    lg: {
      height: '48px',
      fontSize: theme.typography.fontSize.lg,
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    },
  };
  
  // Handle focus event
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus(e);
  };
  
  // Handle blur event
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur(e);
  };
  
  // Container styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : '240px',
    ...style,
  };
  
  // Label styles
  const labelStyle = {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[1],
    color: theme.colors.cloudWhite,
    fontWeight: theme.typography.fontWeight.medium,
  };
  
  // Input wrapper styles
  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  };
  
  // Input styles
  const inputStyle = {
    width: '100%',
    height: sizes[size].height,
    backgroundColor: theme.colors.midnightNavy,
    color: theme.colors.cloudWhite,
    border: `1px solid ${error ? theme.colors.error : isFocused ? theme.colors.electricCyan : theme.colors.graphiteLight}`,
    borderRadius: theme.borderRadius.md,
    padding: icon ? `0 ${sizes[size].padding} 0 ${theme.spacing[8]}` : 
              rightIcon ? `0 ${theme.spacing[8]} 0 ${sizes[size].padding}` : 
              sizes[size].padding,
    fontSize: sizes[size].fontSize,
    outline: 'none',
    transition: theme.transitions.default,
    opacity: disabled ? 0.6 : 1,
    boxShadow: isFocused ? (error ? theme.shadows.glow.magenta : theme.shadows.glow.cyan) : 'none',
    '&::placeholder': {
      color: `${theme.colors.cloudWhite}80`,
    },
  };
  
  // Icon styles
  const leftIconStyle = {
    position: 'absolute',
    left: theme.spacing[3],
    color: theme.colors.cloudWhite,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
  
  const rightIconStyle = {
    position: 'absolute',
    right: theme.spacing[3],
    color: theme.colors.cloudWhite,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // Helper text and error styles
  const helperTextStyle = {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing[1],
    color: error ? theme.colors.error : theme.colors.cloudWhite,
    opacity: error ? 1 : 0.7,
  };
  
  return (
    <div 
      className={`enterprise-iq-input ${className}`}
      style={containerStyle}
    >
      {/* Label */}
      {label && (
        <label style={labelStyle}>
          {label}
        </label>
      )}
      
      {/* Input wrapper */}
      <div style={inputWrapperStyle}>
        {/* Left icon */}
        {icon && (
          <div style={leftIconStyle}>
            {icon}
          </div>
        )}
        
        {/* Input element */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          name={name}
          id={id || name}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={onKeyPress}
          onKeyDown={onKeyDown}
          style={inputStyle}
        />
        
        {/* Right icon */}
        {rightIcon && (
          <div style={rightIconStyle}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Helper text or error message */}
      {(helperText || error) && (
        <div style={helperTextStyle}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};

Input.propTypes = {
  /** Input value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Change handler */
  onChange: PropTypes.func,
  /** Input type (text, password, number, etc.) */
  type: PropTypes.string,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Label for the input */
  label: PropTypes.node,
  /** Helper text displayed below the input */
  helperText: PropTypes.node,
  /** Error message displayed below the input */
  error: PropTypes.node,
  /** Size of the input component */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether the input is disabled */
  disabled: PropTypes.bool,
  /** Whether the input is read-only */
  readOnly: PropTypes.bool,
  /** Whether the input should take up the full width of its container */
  fullWidth: PropTypes.bool,
  /** Maximum input length */
  maxLength: PropTypes.number,
  /** Name attribute for the input */
  name: PropTypes.string,
  /** ID attribute for the input */
  id: PropTypes.string,
  /** Icon displayed on the left side of the input */
  icon: PropTypes.node,
  /** Icon displayed on the right side of the input */
  rightIcon: PropTypes.node,
  /** Whether the input should auto-focus */
  autoFocus: PropTypes.bool,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the input container */
  style: PropTypes.object,
  /** Focus event handler */
  onFocus: PropTypes.func,
  /** Blur event handler */
  onBlur: PropTypes.func,
  /** Key press event handler */
  onKeyPress: PropTypes.func,
  /** Key down event handler */
  onKeyDown: PropTypes.func,
};

export default Input; 