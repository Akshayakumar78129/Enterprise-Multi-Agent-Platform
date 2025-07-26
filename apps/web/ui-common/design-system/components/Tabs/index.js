import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Tabs Component
 * 
 * A tabbed navigation component for organizing content into separate views.
 * Supports various styles, orientations, and custom tab rendering.
 */
export const Tabs = ({
  tabs = [],
  activeTab = null,
  onChange = () => {},
  variant = 'default',
  orientation = 'horizontal',
  size = 'md',
  fullWidth = false,
  className = '',
  style = {},
  renderTabContent = null,
}) => {
  const theme = useTheme();
  const [activeTabId, setActiveTabId] = useState(activeTab || (tabs.length > 0 ? tabs[0].id : null));
  
  // Update active tab when prop changes
  useEffect(() => {
    if (activeTab !== null && activeTab !== activeTabId) {
      setActiveTabId(activeTab);
    }
  }, [activeTab]);
  
  // Size configurations
  const sizes = {
    sm: {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
      fontSize: theme.typography.fontSize.lg,
    },
  };
  
  // Variant styles
  const variants = {
    default: {
      tabBgColor: 'transparent',
      tabBgColorActive: theme.colors.graphite,
      tabBorderColor: 'transparent',
      tabBorderColorActive: theme.colors.electricCyan,
      indicatorColor: theme.colors.electricCyan,
    },
    outline: {
      tabBgColor: 'transparent',
      tabBgColorActive: theme.colors.midnightNavy,
      tabBorderColor: theme.colors.graphiteLight,
      tabBorderColorActive: theme.colors.electricCyan,
      indicatorColor: 'transparent',
    },
    minimal: {
      tabBgColor: 'transparent',
      tabBgColorActive: 'transparent',
      tabBorderColor: 'transparent',
      tabBorderColorActive: 'transparent',
      indicatorColor: theme.colors.electricCyan,
    },
  };
  
  // Container styles
  const containerStyle = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'row' : 'column',
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };
  
  // Tab list styles
  const tabListStyle = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    borderBottom: orientation === 'horizontal' ? `1px solid ${theme.colors.graphiteLight}` : 'none',
    borderRight: orientation === 'vertical' ? `1px solid ${theme.colors.graphiteLight}` : 'none',
    width: orientation === 'vertical' ? 'auto' : '100%',
  };
  
  // Tab styles
  const getTabStyle = (tab) => {
    const isActive = tab.id === activeTabId;
    
    return {
      padding: sizes[size].padding,
      fontSize: sizes[size].fontSize,
      fontWeight: isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
      color: isActive ? theme.colors.cloudWhite : `${theme.colors.cloudWhite}80`,
      backgroundColor: isActive ? variants[variant].tabBgColorActive : variants[variant].tabBgColor,
      borderBottom: orientation === 'horizontal' ? 
        `2px solid ${isActive ? variants[variant].indicatorColor : 'transparent'}` : 'none',
      borderRight: orientation === 'vertical' ?
        `2px solid ${isActive ? variants[variant].indicatorColor : 'transparent'}` : 'none',
      cursor: 'pointer',
      userSelect: 'none',
      transition: theme.transitions.default,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minWidth: orientation === 'horizontal' && fullWidth ? `${100 / tabs.length}%` : 'auto',
      whiteSpace: 'nowrap',
      opacity: tab.disabled ? 0.5 : 1,
      pointerEvents: tab.disabled ? 'none' : 'auto',
      '&:hover': {
        color: !isActive && !tab.disabled ? theme.colors.cloudWhite : undefined,
      },
    };
  };
  
  // Content styles
  const contentStyle = {
    padding: theme.spacing[4],
    flex: 1,
  };
  
  // Handle tab click
  const handleTabClick = (tab) => {
    if (!tab.disabled) {
      setActiveTabId(tab.id);
      onChange(tab.id);
    }
  };
  
  // Find active tab
  const activeTabObj = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  
  return (
    <div 
      className={`enterprise-iq-tabs ${className}`}
      style={containerStyle}
    >
      <div style={tabListStyle}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={getTabStyle(tab)}
            onClick={() => handleTabClick(tab)}
            role="tab"
            aria-selected={tab.id === activeTabId}
          >
            {tab.icon && (
              <span style={{ marginRight: tab.label ? theme.spacing[2] : 0 }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </div>
        ))}
      </div>
      
      <div style={contentStyle}>
        {renderTabContent ? 
          renderTabContent(activeTabId, activeTabObj) : 
          activeTabObj?.content}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  /** Array of tab definitions */
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node,
      icon: PropTypes.node,
      content: PropTypes.node,
      disabled: PropTypes.bool,
    })
  ),
  /** Currently active tab ID */
  activeTab: PropTypes.string,
  /** Tab change handler */
  onChange: PropTypes.func,
  /** Visual variant */
  variant: PropTypes.oneOf(['default', 'outline', 'minimal']),
  /** Orientation of the tabs */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /** Size of the tabs */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether tabs should take up the full width */
  fullWidth: PropTypes.bool,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the tabs container */
  style: PropTypes.object,
  /** Custom renderer for tab content */
  renderTabContent: PropTypes.func,
};

export default Tabs; 