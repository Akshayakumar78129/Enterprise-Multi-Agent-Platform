import React, { useState } from 'react';
import { theme } from '../theme/theme.constants';
import UniversalChatbot from './UniversalChatbot';

interface BusinessIntelligenceProps {
  dashboardContext?: any;
  selectedCustomers?: number;
  onClose?: () => void;
}

export const BusinessIntelligenceButton: React.FC<{ onClick: () => void; count?: number }> = ({ 
  onClick, 
  count = 0 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const styles = {
    button: {
      position: 'fixed' as const,
      bottom: '30px',
      right: '100px',
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, #e930ff 100%)`,
      border: 'none',
      borderRadius: theme.borderRadius.full,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      color: theme.colors.background.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      boxShadow: theme.shadows.lg,
      transition: theme.transitions.normal,
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      zIndex: theme.zIndex.fixed,
    },
    icon: {
      fontSize: '20px',
    },
    count: {
      background: theme.colors.background.primary,
      color: theme.colors.accent.primary,
      borderRadius: theme.borderRadius.full,
      padding: `2px 8px`,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
    },
    pulse: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.borderRadius.full,
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, #e930ff 100%)`,
      opacity: 0.4,
      animation: 'pulse 2s infinite',
      zIndex: -1,
    }
  };

  return (
    <button
      style={styles.button}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isHovered && <div style={styles.pulse} />}
      <span style={styles.icon}>🧠</span>
      {count > 0 && <span style={styles.count}>{count}</span>}
    </button>
  );
};

export const BusinessIntelligencePanel: React.FC<BusinessIntelligenceProps> = ({
  dashboardContext,
  selectedCustomers = 0,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'chat' | 'analysis'>('insights');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateExecutiveInsights = () => {
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: theme.zIndex.modal,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
    },
    panel: {
      width: '90%',
      maxWidth: '1200px',
      height: '85vh',
      background: theme.colors.background.card,
      borderRadius: theme.borderRadius.xl,
      border: `2px solid ${theme.colors.accent.primary}`,
      boxShadow: `${theme.shadows.xl}, 0 0 50px ${theme.colors.accent.glow}`,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    header: {
      padding: theme.spacing.lg,
      background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.card} 100%)`,
      borderBottom: `1px solid ${theme.colors.border.default}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    icon: {
      fontSize: '32px',
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, #e930ff 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    tabs: {
      display: 'flex',
      gap: theme.spacing.sm,
      padding: `0 ${theme.spacing.lg}`,
      borderBottom: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.background.secondary,
    },
    tab: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      cursor: 'pointer',
      transition: theme.transitions.fast,
    },
    activeTab: {
      color: theme.colors.accent.primary,
      borderBottomColor: theme.colors.accent.primary,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      overflowY: 'auto' as const,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: theme.spacing.lg,
    },
    insightCard: {
      background: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      border: `1px solid ${theme.colors.border.default}`,
      transition: theme.transitions.normal,
    },
    insightHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    insightTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    insightValue: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.accent.primary,
      marginBottom: theme.spacing.sm,
    },
    insightDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.relaxed,
    },
    actionBar: {
      padding: theme.spacing.md,
      borderTop: `1px solid ${theme.colors.border.default}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: theme.colors.background.secondary,
    },
    statusText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    actionButtons: {
      display: 'flex',
      gap: theme.spacing.sm,
    },
    button: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      cursor: 'pointer',
      transition: theme.transitions.fast,
      border: 'none',
    },
    primaryButton: {
      background: theme.colors.accent.primary,
      color: theme.colors.background.primary,
    },
    secondaryButton: {
      background: theme.colors.background.card,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.default}`,
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: theme.colors.text.secondary,
      fontSize: '24px',
      cursor: 'pointer',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      transition: theme.transitions.fast,
    },
    loadingSpinner: {
      width: '24px',
      height: '24px',
      border: `3px solid ${theme.colors.accent.glow}`,
      borderTop: `3px solid ${theme.colors.accent.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto',
    }
  };

  const mockInsights = [
    {
      icon: '📈',
      title: 'Revenue Opportunity',
      value: '$2.3M',
      description: 'Potential revenue at risk from high-churn customers. Immediate intervention recommended for top 10 accounts.'
    },
    {
      icon: '🎯',
      title: 'Success Rate',
      value: '78%',
      description: 'Historical success rate for targeted retention campaigns. AI predicts 15% improvement with personalization.'
    },
    {
      icon: '⚡',
      title: 'Action Priority',
      value: '23 Critical',
      description: 'Customers requiring immediate attention based on churn probability and lifetime value.'
    },
    {
      icon: '🔮',
      title: 'Forecast Accuracy',
      value: '94.5%',
      description: 'Model confidence in current predictions. Above industry benchmark by 12%.'
    },
    {
      icon: '💡',
      title: 'Key Insight',
      value: 'Product Usage',
      description: 'Low feature adoption is the primary churn indicator. Customers using <3 features have 4x higher churn.'
    },
    {
      icon: '🚀',
      title: 'Growth Potential',
      value: '+34%',
      description: 'Projected retention improvement with recommended interventions implemented within 30 days.'
    }
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.icon}>🧠</span>
            <div style={styles.titleSection}>
              <h2 style={styles.title}>Business Intelligence Hub</h2>
              <p style={styles.subtitle}>
                {selectedCustomers > 0 
                  ? `Analyzing ${selectedCustomers} selected customers`
                  : 'Executive insights and strategic recommendations'}
              </p>
            </div>
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

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'insights' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('insights')}
          >
            Strategic Insights
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'chat' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('chat')}
          >
            AI Assistant
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'analysis' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('analysis')}
          >
            Deep Analysis
          </button>
        </div>

        <div style={styles.content}>
          {activeTab === 'insights' && (
            <div style={styles.grid}>
              {mockInsights.map((insight, index) => (
                <div
                  key={index}
                  style={styles.insightCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                    e.currentTarget.style.borderColor = theme.colors.accent.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = theme.colors.border.default;
                  }}
                >
                  <div style={styles.insightHeader}>
                    <span style={{ fontSize: '24px' }}>{insight.icon}</span>
                    <span style={styles.insightTitle}>{insight.title}</span>
                  </div>
                  <div style={styles.insightValue}>{insight.value}</div>
                  <div style={styles.insightDescription}>{insight.description}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div style={{ height: '100%', position: 'relative' }}>
              <UniversalChatbot
                defaultAgent="enterpriseiq"
                dashboardContext={{
                  ...dashboardContext,
                  selectedCustomers,
                  mode: 'business-intelligence'
                }}
              />
            </div>
          )}

          {activeTab === 'analysis' && (
            <div style={{ textAlign: 'center', paddingTop: theme.spacing['3xl'] }}>
              {isGenerating ? (
                <>
                  <div style={styles.loadingSpinner} />
                  <p style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.lg }}>
                    Generating deep analysis...
                  </p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '48px' }}>📊</span>
                  <h3 style={{ color: theme.colors.text.primary, marginTop: theme.spacing.lg }}>
                    Deep Analysis Mode
                  </h3>
                  <p style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.sm }}>
                    Generate comprehensive reports with cross-functional insights
                  </p>
                  <button
                    style={{ ...styles.button, ...styles.primaryButton, marginTop: theme.spacing.lg }}
                    onClick={generateExecutiveInsights}
                  >
                    Generate Executive Report
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={styles.actionBar}>
          <div style={styles.statusText}>
            {selectedCustomers > 0 
              ? `${selectedCustomers} customers selected for analysis`
              : 'Real-time data synchronized'}
          </div>
          <div style={styles.actionButtons}>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => navigator.clipboard.writeText('Business Intelligence Report')}
            >
              Export Report
            </button>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={generateExecutiveInsights}
            >
              Refresh Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligencePanel;