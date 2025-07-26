import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Button Component
 * 
 * A versatile button component used throughout the Enterprise IQ system.
 * Supports various visual variants, sizes, and states.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  onClick = () => {},
  type = 'button',
  className = '',
  style = {},
}) => {
  const theme = useTheme();
  const variants = theme.generateVariants('button');
  
  // Size configurations
  const sizes = {
    sm: {
      padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
      fontSize: theme.typography.fontSize.lg,
    },
  };
  
  // Combine styles
  const buttonStyle = {
    ...variants[variant],
    ...sizes[size],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    outline: 'none',
    transition: theme.transitions.default,
    width: fullWidth ? '100%' : 'auto',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    position: 'relative',
    ...style,
  };
  
  // Loading spinner styles
  const spinnerStyle = {
    width: size === 'sm' ? '14px' : size === 'md' ? '18px' : '22px',
    height: size === 'sm' ? '14px' : size === 'md' ? '18px' : '22px',
    border: `2px solid ${variant === 'primary' ? theme.colors.midnightNavy : theme.colors.cloudWhite}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'button-spin 1s linear infinite',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };
  
  // Icon styles
  const iconStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const leftIconStyle = {
    ...iconStyle,
    marginRight: theme.spacing[2],
  };
  
  const rightIconStyle = {
    ...iconStyle,
    marginLeft: theme.spacing[2],
  };
  
  return (
    <button
      type={type}
      className={`enterprise-iq-button enterprise-iq-button-${variant} enterprise-iq-button-${size} ${className}`}
      style={buttonStyle}
      onClick={isLoading || disabled ? null : onClick}
      disabled={disabled || isLoading}
    >
      {/* Left Icon */}
      {leftIcon && !isLoading && (
        <span style={leftIconStyle}>
          {leftIcon}
        </span>
      )}
      
      {/* Button Content */}
      <span style={{ 
        opacity: isLoading ? 0 : 1,
        visibility: isLoading ? 'hidden' : 'visible',
      }}>
        {children}
      </span>
      
      {/* Right Icon */}
      {rightIcon && !isLoading && (
        <span style={rightIconStyle}>
          {rightIcon}
        </span>
      )}
      
      {/* Loading Spinner */}
      {isLoading && (
        <span style={spinnerStyle} />
      )}
      
      {/* CSS for the loading spinner animation */}
      <style jsx global>{`
        @keyframes button-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  /** Visual variant of the button */
  variant: PropTypes.oneOf(['primary', 'secondary', 'alert']),
  /** Size of the button */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether the button is in a loading state */
  isLoading: PropTypes.bool,
  /** Whether the button is disabled */
  disabled: PropTypes.bool,
  /** Whether the button should take up the full width of its container */
  fullWidth: PropTypes.bool,
  /** Icon to display on the left side of the button */
  leftIcon: PropTypes.node,
  /** Icon to display on the right side of the button */
  rightIcon: PropTypes.node,
  /** Click handler for the button */
  onClick: PropTypes.func,
  /** HTML button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the button */
  style: PropTypes.object,
};

export default Button; 