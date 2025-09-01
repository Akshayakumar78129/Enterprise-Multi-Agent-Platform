import React, { useEffect, useState } from 'react';
import { theme } from '../theme/theme.constants';

interface InsightData {
  title: string;
  type: 'kpi' | 'chart' | 'segment';
  value?: string | number;
  metric?: string;
  breakdown?: string[];
  insights: string[];
  recommendations?: string[];
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    analysis: string;
  };
}

interface AIInsightsPopupProps {
  data: InsightData;
  position: { x: number; y: number };
  onClose: () => void;
  onSendToChat?: (context: any) => void;
}

export const AIInsightsPopup: React.FC<AIInsightsPopupProps> = ({
  data,
  position,
  onClose,
  onSendToChat
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    // Auto-expand after a short delay for smooth animation
    const timer = setTimeout(() => setIsExpanded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getInsightIcon = () => {
    switch (data.type) {
      case 'kpi':
        return '📊';
      case 'chart':
        return '📈';
      case 'segment':
        return '🎯';
      default:
        return '💡';
    }
  };

  const getTrendIcon = () => {
    if (!data.trend) return null;
    switch (data.trend.direction) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: theme.zIndex.modal,
      animation: 'fadeIn 0.2s ease',
    },
    popup: {
      position: 'absolute' as const,
      left: Math.min(position.x, window.innerWidth - 420),
      top: Math.min(position.y, window.innerHeight - 500),
      width: '400px',
      maxHeight: '500px',
      background: theme.colors.background.card,
      border: `2px solid ${theme.colors.accent.primary}`,
      borderRadius: theme.borderRadius.xl,
      boxShadow: `${theme.shadows.xl}, 0 0 30px ${theme.colors.accent.glow}`,
      overflow: 'hidden',
      transform: isExpanded ? 'scale(1)' : 'scale(0.95)',
      opacity: isExpanded ? 1 : 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    header: {
      padding: theme.spacing.md,
      background: `linear-gradient(135deg, ${theme.colors.accent.primary}20 0%, transparent 100%)`,
      borderBottom: `1px solid ${theme.colors.border.default}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    icon: {
      fontSize: '24px',
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: theme.colors.text.secondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      transition: theme.transitions.fast,
    },
    content: {
      padding: theme.spacing.md,
      maxHeight: '350px',
      overflowY: 'auto' as const,
    },
    valueSection: {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      background: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    value: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.accent.primary,
    },
    metric: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    trendBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      background: `${theme.colors.accent.primary}20`,
      borderRadius: theme.borderRadius.full,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.accent.primary,
    },
    section: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.accent.primary,
      marginBottom: theme.spacing.sm,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    listItem: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
      paddingLeft: theme.spacing.md,
      position: 'relative' as const,
    },
    bullet: {
      position: 'absolute' as const,
      left: 0,
      color: theme.colors.accent.primary,
    },
    actions: {
      padding: theme.spacing.md,
      borderTop: `1px solid ${theme.colors.border.default}`,
      display: 'flex',
      gap: theme.spacing.sm,
      flexWrap: 'wrap' as const,
    },
    actionButton: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.borderRadius.md,
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.sm,
      cursor: 'pointer',
      transition: theme.transitions.fast,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    primaryButton: {
      background: theme.colors.accent.primary,
      color: theme.colors.background.primary,
      border: `1px solid ${theme.colors.accent.primary}`,
    },
    glowAnimation: {
      animation: 'glow 2s ease-in-out infinite',
    }
  };

  const handleSendToChat = () => {
    if (onSendToChat) {
      onSendToChat({
        type: data.type,
        title: data.title,
        value: data.value,
        metric: data.metric,
        insights: data.insights,
        timestamp: new Date().toISOString()
      });
    }
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.icon}>{getInsightIcon()}</span>
            <h3 style={styles.title}>{data.title}</h3>
          </div>
          <button 
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {data.value && (
            <div style={styles.valueSection}>
              <div>
                <div style={styles.value}>{data.value}</div>
                {data.metric && <div style={styles.metric}>{data.metric}</div>}
              </div>
              {data.trend && (
                <div style={styles.trendBadge}>
                  <span>{getTrendIcon()}</span>
                  <span>{data.trend.value}</span>
                </div>
              )}
            </div>
          )}

          {data.breakdown && data.breakdown.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <span>🔍</span>
                <span>Key Breakdown</span>
              </div>
              <ul style={styles.list}>
                {data.breakdown.map((item, index) => (
                  <li key={index} style={styles.listItem}>
                    <span style={styles.bullet}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              <span>💡</span>
              <span>AI Insights</span>
            </div>
            <ul style={styles.list}>
              {data.insights.map((insight, index) => (
                <li key={index} style={styles.listItem}>
                  <span style={styles.bullet}>•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {data.recommendations && data.recommendations.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>
                <span>🎯</span>
                <span>Recommendations</span>
              </div>
              <ul style={styles.list}>
                {data.recommendations.map((rec, index) => (
                  <li key={index} style={styles.listItem}>
                    <span style={styles.bullet}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.actionButton, ...styles.primaryButton }}
            onClick={handleSendToChat}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = theme.shadows.glow;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>💬</span>
            <span>Send to Chat</span>
          </button>
          <button
            style={styles.actionButton}
            onClick={() => setShowActions(!showActions)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.background.primary;
              e.currentTarget.style.borderColor = theme.colors.accent.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.background.secondary;
              e.currentTarget.style.borderColor = theme.colors.border.default;
            }}
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          <button
            style={styles.actionButton}
            onClick={() => navigator.clipboard.writeText(data.insights.join('\n'))}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.background.primary;
              e.currentTarget.style.borderColor = theme.colors.accent.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.background.secondary;
              e.currentTarget.style.borderColor = theme.colors.border.default;
            }}
          >
            <span>📋</span>
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPopup;