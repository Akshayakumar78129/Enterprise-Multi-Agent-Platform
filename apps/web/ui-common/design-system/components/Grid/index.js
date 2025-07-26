import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Grid Component
 * 
 * A responsive grid layout component based on CSS Grid.
 * Supports various configurations, responsive behaviors, and custom styling.
 */
export const Grid = ({
  children,
  columns = 12,
  spacing = 'md',
  rowSpacing = null,
  columnSpacing = null,
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  className = '',
  style = {},
}) => {
  const theme = useTheme();
  
  // Spacing configurations
  const spacingSizes = {
    xs: theme.spacing[2],
    sm: theme.spacing[3],
    md: theme.spacing[4],
    lg: theme.spacing[6],
    xl: theme.spacing[8],
  };
  
  // Calculate spacing values
  const rowGap = rowSpacing ? spacingSizes[rowSpacing] : spacingSizes[spacing];
  const columnGap = columnSpacing ? spacingSizes[columnSpacing] : spacingSizes[spacing];
  
  // Container styles
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    gap: `${rowGap} ${columnGap}`,
    justifyContent,
    alignItems,
    width: '100%',
    ...style,
  };
  
  return (
    <div 
      className={`enterprise-iq-grid ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

Grid.propTypes = {
  /** Grid children */
  children: PropTypes.node,
  /** Number of columns or custom template */
  columns: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Spacing between grid items */
  spacing: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  /** Spacing between rows */
  rowSpacing: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  /** Spacing between columns */
  columnSpacing: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  /** Horizontal alignment of grid items */
  justifyContent: PropTypes.oneOf([
    'flex-start', 
    'center', 
    'flex-end', 
    'space-between', 
    'space-around', 
    'space-evenly',
  ]),
  /** Vertical alignment of grid items */
  alignItems: PropTypes.oneOf([
    'flex-start', 
    'center', 
    'flex-end', 
    'stretch', 
    'baseline',
  ]),
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the grid container */
  style: PropTypes.object,
};

/**
 * GridItem Component
 * 
 * A child component for Grid that allows configuring how an item spans within the grid.
 */
export const GridItem = ({
  children,
  xs = 12,
  sm = null,
  md = null,
  lg = null,
  xl = null,
  rowSpan = 1,
  className = '',
  style = {},
}) => {
  // Calculate responsive column spans
  const getGridColumnValue = () => {
    return {
      gridColumn: `span ${xs}`,
      '@media screen and (minWidth: 600px)': {
        gridColumn: sm ? `span ${sm}` : undefined,
      },
      '@media screen and (minWidth: 900px)': {
        gridColumn: md ? `span ${md}` : undefined,
      },
      '@media screen and (minWidth: 1200px)': {
        gridColumn: lg ? `span ${lg}` : undefined,
      },
      '@media screen and (minWidth: 1536px)': {
        gridColumn: xl ? `span ${xl}` : undefined,
      },
    };
  };
  
  // Item styles
  const itemStyle = {
    ...getGridColumnValue(),
    gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
    ...style,
  };
  
  return (
    <div 
      className={`enterprise-iq-grid-item ${className}`}
      style={itemStyle}
    >
      {children}
    </div>
  );
};

GridItem.propTypes = {
  /** Grid item children */
  children: PropTypes.node,
  /** Number of columns to span on extra small screens */
  xs: PropTypes.number,
  /** Number of columns to span on small screens */
  sm: PropTypes.number,
  /** Number of columns to span on medium screens */
  md: PropTypes.number,
  /** Number of columns to span on large screens */
  lg: PropTypes.number,
  /** Number of columns to span on extra large screens */
  xl: PropTypes.number,
  /** Number of rows to span */
  rowSpan: PropTypes.number,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the grid item */
  style: PropTypes.object,
};

export default { Grid, GridItem }; 