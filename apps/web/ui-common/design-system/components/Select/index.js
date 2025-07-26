import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Select Component
 * 
 * A custom dropdown select component with Enterprise IQ styling.
 * Supports single selection, custom rendering, and various states.
 */
export const Select = ({
  options = [],
  value = null,
  placeholder = 'Select an option',
  onChange = () => {},
  isDisabled = false,
  isLoading = false,
  isSearchable = false,
  isClearable = false,
  fullWidth = false,
  size = 'md',
  renderOption = null,
  renderValue = null,
  className = '',
  style = {},
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const inputRef = useRef(null);
  
  // Size configurations
  const sizes = {
    sm: {
      height: '32px',
      fontSize: theme.typography.fontSize.sm,
      paddingX: theme.spacing[3],
    },
    md: {
      height: '40px',
      fontSize: theme.typography.fontSize.base,
      paddingX: theme.spacing[4],
    },
    lg: {
      height: '48px',
      fontSize: theme.typography.fontSize.lg,
      paddingX: theme.spacing[4],
    },
  };
  
  // Find selected option
  const selectedOption = options.find(option => 
    option.value === value || JSON.stringify(option.value) === JSON.stringify(value)
  );
  
  // Filter options based on search term
  const filteredOptions = searchTerm 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && isSearchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isSearchable]);
  
  // Handle option selection
  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  // Handle clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isDisabled && !isLoading) {
      setIsOpen(!isOpen);
      if (!isOpen && isSearchable) {
        setSearchTerm('');
      }
    }
  };
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Base styles
  const selectContainerStyle = {
    position: 'relative',
    width: fullWidth ? '100%' : '240px',
    ...style,
  };
  
  const selectTriggerStyle = {
    height: sizes[size].height,
    backgroundColor: theme.colors.midnightNavy,
    border: `1px solid ${isOpen ? theme.colors.electricCyan : theme.colors.graphiteLight}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.cloudWhite,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${sizes[size].paddingX}`,
    fontSize: sizes[size].fontSize,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    boxShadow: isOpen ? theme.shadows.glow.cyan : 'none',
    transition: theme.transitions.default,
  };
  
  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    width: '100%',
    backgroundColor: theme.colors.graphite,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.lg,
    zIndex: theme.zIndex[40],
    maxHeight: '300px',
    overflowY: 'auto',
    display: isOpen ? 'block' : 'none',
    border: `1px solid ${theme.colors.graphiteLight}`,
  };
  
  const optionStyle = {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    cursor: 'pointer',
    transition: theme.transitions.fast,
    fontSize: sizes[size].fontSize,
    color: theme.colors.cloudWhite,
  };
  
  const searchInputStyle = {
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    backgroundColor: theme.colors.midnightNavy,
    border: 'none',
    borderBottom: `1px solid ${theme.colors.graphiteLight}`,
    color: theme.colors.cloudWhite,
    fontSize: sizes[size].fontSize,
    outline: 'none',
  };
  
  const loadingSpinnerStyle = {
    width: '16px',
    height: '16px',
    border: `2px solid ${theme.colors.graphiteLight}`,
    borderTopColor: theme.colors.electricCyan,
    borderRadius: '50%',
    animation: 'select-spin 1s linear infinite',
    marginLeft: 'auto',
    marginRight: theme.spacing[1],
  };
  
  // Render selected value or placeholder
  const renderSelectedValue = () => {
    if (isLoading) {
      return <span>Loading...</span>;
    }
    
    if (selectedOption) {
      if (renderValue) {
        return renderValue(selectedOption);
      }
      return selectedOption.label;
    }
    
    return (
      <span style={{ opacity: 0.7 }}>
        {placeholder}
      </span>
    );
  };
  
  return (
    <div 
      ref={selectRef}
      className={`enterprise-iq-select ${className}`}
      style={selectContainerStyle}
    >
      {/* Select trigger */}
      <div 
        className="select-trigger"
        style={selectTriggerStyle}
        onClick={toggleDropdown}
      >
        <div className="selected-value">
          {renderSelectedValue()}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Clear button */}
          {isClearable && selectedOption && !isLoading && (
            <div 
              onClick={handleClear}
              style={{ 
                marginRight: theme.spacing[2],
                opacity: 0.7,
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '0 4px',
                '&:hover': { opacity: 1 }
              }}
            >
              ×
            </div>
          )}
          
          {/* Loading spinner */}
          {isLoading && (
            <div style={loadingSpinnerStyle} />
          )}
          
          {/* Dropdown arrow */}
          <div 
            style={{ 
              transition: theme.transitions.default,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              fontSize: '10px',
            }}
          >
            ▼
          </div>
        </div>
      </div>
      
      {/* Dropdown */}
      <div
        className="select-dropdown"
        style={dropdownStyle}
      >
        {/* Search input */}
        {isSearchable && (
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={searchInputStyle}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        
        {/* Options */}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => (
            <div
              key={option.value?.toString() || index}
              className="select-option"
              style={{
                ...optionStyle,
                backgroundColor: 
                  option.value === value || JSON.stringify(option.value) === JSON.stringify(value)
                    ? theme.colors.midnightNavy
                    : index % 2 === 0 ? theme.colors.graphite : theme.colors.graphiteLight,
                '&:hover': {
                  backgroundColor: theme.colors.midnightNavy,
                }
              }}
              onClick={() => handleSelect(option)}
            >
              {renderOption ? renderOption(option) : option.label}
            </div>
          ))
        ) : (
          <div
            style={{
              ...optionStyle,
              opacity: 0.7,
              cursor: 'default',
              textAlign: 'center',
            }}
          >
            No options found
          </div>
        )}
      </div>
      
      {/* CSS for the loading spinner animation */}
      <style jsx global>{`
        @keyframes select-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

Select.propTypes = {
  /** Array of options (each having a value and label) */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.node.isRequired,
    })
  ).isRequired,
  /** Selected option value */
  value: PropTypes.any,
  /** Placeholder text when no option is selected */
  placeholder: PropTypes.string,
  /** Callback when selection changes */
  onChange: PropTypes.func,
  /** Whether the select is disabled */
  isDisabled: PropTypes.bool,
  /** Whether the select is in a loading state */
  isLoading: PropTypes.bool,
  /** Whether the select allows searching */
  isSearchable: PropTypes.bool,
  /** Whether the select allows clearing the selection */
  isClearable: PropTypes.bool,
  /** Whether the select should take up the full width of its container */
  fullWidth: PropTypes.bool,
  /** Size of the select component */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Custom render function for options */
  renderOption: PropTypes.func,
  /** Custom render function for the selected value */
  renderValue: PropTypes.func,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the select container */
  style: PropTypes.object,
};

export default Select; 