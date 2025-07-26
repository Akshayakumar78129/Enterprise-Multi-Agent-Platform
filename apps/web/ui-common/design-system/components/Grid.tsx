import React, { forwardRef } from 'react';

// Grid component props
export interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number | string;
  rowGap?: number | string;
  columnGap?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

// GridItem component props
export interface GridItemProps {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  colStart?: number;
  rowStart?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Grid component
export const Grid: React.FC<GridProps> = ({
  children,
  columns = 12,
  gap = 16,
  rowGap,
  columnGap,
  className,
  style
}) => {
  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    ...(rowGap && { rowGap: typeof rowGap === 'number' ? `${rowGap}px` : rowGap }),
    ...(columnGap && { columnGap: typeof columnGap === 'number' ? `${columnGap}px` : columnGap }),
    ...style
  };

  return (
    <div className={className} style={gridStyles}>
      {children}
    </div>
  );
};

// GridItem component
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(({
  children,
  colSpan = 1,
  rowSpan = 1,
  colStart,
  rowStart,
  className,
  style
}, ref) => {
  const gridItemStyles: React.CSSProperties = {
    gridColumn: colStart ? `${colStart} / span ${colSpan}` : `span ${colSpan}`,
    gridRow: rowStart ? `${rowStart} / span ${rowSpan}` : `span ${rowSpan}`,
    ...style
  };

  return (
    <div ref={ref} className={className} style={gridItemStyles}>
      {children}
    </div>
  );
}); 