import React, { useState, useRef } from 'react';
import { theme } from './theme.constants';

interface ChartPoint {
  x: string | number;
  y: number;
  label?: string;
  category?: string;
  metadata?: any;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  onChartClick?: (point: ChartPoint) => void;
  onShiftClick?: (points: ChartPoint[]) => void;
  onRequestInsights?: () => void;
  showTip?: boolean;
  height?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  icon = '📊',
  children,
  onChartClick,
  onShiftClick,
  onRequestInsights,
  showTip = true,
  height = '400px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);


  const styles = {
    container: {
      background: theme.colors.background.card,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.borderRadius.lg,
      overflow: 'visible',
      minHeight: height,
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const,
      transition: theme.transitions.normal,
    },
    header: {
      padding: theme.spacing.md,
      borderBottom: `1px solid ${theme.colors.border.subtle}`,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: theme.spacing.xs,
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    icon: {
      fontSize: '20px',
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      margin: 0,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      margin: 0,
    },
    actions: {
      display: 'flex',
      gap: theme.spacing.xs,
    },
    actionButton: {
      background: 'transparent',
      border: 'none',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      transition: theme.transitions.fast,
      fontSize: '16px',
    },
    tip: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      background: `${theme.colors.accent.primary}10`,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.xs,
    },
    chartContainer: {
      flex: 1,
      padding: theme.spacing.md,
      position: 'relative' as const,
      overflow: 'visible',
    },
  };

  return (
    <div 
      ref={containerRef}
      style={styles.container}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border.active;
        e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border.default;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.titleLeft}>
              <span style={styles.icon}>{icon}</span>
              <h3 style={styles.title}>{title}</h3>
            </div>
            <div style={styles.actions}>
              {onRequestInsights && (
                <button
                  style={styles.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestInsights();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.accent.primary;
                    e.currentTarget.style.background = `${theme.colors.accent.primary}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.text.secondary;
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="Get AI Insights"
                >
                  💡
                </button>
              )}
            </div>
          </div>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
          {showTip && (onChartClick || onShiftClick) && (
            <div style={styles.tip}>
              <span>💡</span>
              <strong>Tip:</strong>
              <span>Click chart points for AI insights</span>
              {onShiftClick && <span> | Shift+Click to send to chatbot</span>}
            </div>
          )}
      </div>
      
      <div style={styles.chartContainer}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;