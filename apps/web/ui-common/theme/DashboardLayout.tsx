import React, { ReactNode } from 'react';
import { theme } from './theme.constants';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  icon = '⚡',
  children,
  actions
}) => {
  const styles = {
    container: {
      minHeight: '100vh',
      background: theme.colors.background.gradient,
      padding: theme.spacing['2xl'],
      fontFamily: theme.typography.fontFamily,
    },
    header: {
      marginBottom: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      borderBottom: `1px solid ${theme.colors.border.subtle}`,
    },
    titleWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, #e930ff 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text.secondary,
      margin: 0,
      paddingLeft: `calc(${theme.spacing.md} + 2rem)`,
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: theme.spacing.xl,
    },
    actionsContainer: {
      display: 'flex',
      gap: theme.spacing.md,
      alignItems: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <div style={styles.titleContainer}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <h1 style={styles.title}>{title}</h1>
          </div>
          {actions && (
            <div style={styles.actionsContainer}>
              {actions}
            </div>
          )}
        </div>
        {subtitle && (
          <p style={styles.subtitle}>{subtitle}</p>
        )}
      </header>
      <main style={styles.content}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;