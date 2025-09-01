import React from 'react';
import { theme } from './theme.constants';

interface KPICardProps {
  value: string | number;
  label: string;
  icon?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string | number;
    isPositive?: boolean;
  };
  color?: 'success' | 'warning' | 'error' | 'info' | 'default';
  onClick?: () => void;
  isLoading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  value,
  label,
  icon,
  trend,
  color = 'default',
  onClick,
  isLoading = false
}) => {
  const getColorScheme = () => {
    const schemes = {
      success: {
        accent: theme.colors.status.success,
        gradient: `linear-gradient(135deg, ${theme.colors.status.success}20 0%, transparent 100%)`,
        border: theme.colors.status.success,
      },
      warning: {
        accent: theme.colors.status.warning,
        gradient: `linear-gradient(135deg, ${theme.colors.status.warning}20 0%, transparent 100%)`,
        border: theme.colors.status.warning,
      },
      error: {
        accent: theme.colors.status.error,
        gradient: `linear-gradient(135deg, ${theme.colors.status.error}20 0%, transparent 100%)`,
        border: theme.colors.status.error,
      },
      info: {
        accent: theme.colors.status.info,
        gradient: `linear-gradient(135deg, ${theme.colors.status.info}20 0%, transparent 100%)`,
        border: theme.colors.status.info,
      },
      default: {
        accent: theme.colors.accent.primary,
        gradient: `linear-gradient(135deg, ${theme.colors.accent.primary}20 0%, transparent 100%)`,
        border: theme.colors.border.default,
      },
    };
    return schemes[color];
  };

  const colorScheme = getColorScheme();

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    if (!trend) return theme.colors.text.secondary;
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? theme.colors.status.success : theme.colors.status.error;
    }
    return trend.direction === 'up' 
      ? theme.colors.status.success 
      : trend.direction === 'down' 
        ? theme.colors.status.error 
        : theme.colors.text.secondary;
  };

  const styles = {
    card: {
      background: `${theme.colors.background.card}`,
      backgroundImage: colorScheme.gradient,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      position: 'relative' as const,
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: theme.transitions.normal,
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      ...(onClick && {
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows.glow,
          borderColor: colorScheme.border,
        }
      }),
    },
    trendBadge: {
      position: 'absolute' as const,
      top: theme.spacing.md,
      right: theme.spacing.md,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: theme.borderRadius.full,
      background: `${getTrendColor()}20`,
      color: getTrendColor(),
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    valueContainer: {
      display: 'flex',
      alignItems: 'baseline',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    value: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: colorScheme.accent,
      lineHeight: 1,
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
    },
    icon: {
      fontSize: theme.typography.fontSize.lg,
    },
    loadingOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: theme.colors.background.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.lg,
    },
    spinner: {
      width: '24px',
      height: '24px',
      border: `3px solid ${theme.colors.accent.glow}`,
      borderTop: `3px solid ${theme.colors.accent.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };

  return (
    <div 
      style={styles.card}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = theme.shadows.glow;
          e.currentTarget.style.borderColor = colorScheme.border;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = theme.colors.border.default;
        }
      }}
    >
      {trend && (
        <div style={styles.trendBadge}>
          <span>{getTrendIcon()}</span>
          <span>{trend.value}</span>
        </div>
      )}
      
      <div style={styles.valueContainer}>
        <span style={styles.value}>{value}</span>
      </div>
      
      <div style={styles.label}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <span>{label}</span>
      </div>

      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
        </div>
      )}
    </div>
  );
};

export default KPICard;