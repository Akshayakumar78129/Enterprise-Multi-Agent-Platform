import React from 'react';
import { theme } from '../theme/theme.constants';

interface ChatbotButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  badge?: number;
}

export const ChatbotButton: React.FC<ChatbotButtonProps> = ({ 
  onClick, 
  isOpen = false,
  badge 
}) => {
  const styles = {
    button: {
      position: 'fixed' as const,
      bottom: '30px',
      right: '30px',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${theme.colors.accent.primary} 0%, ${theme.colors.accent.secondary} 100%)`,
      border: 'none',
      boxShadow: theme.shadows.xl,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      transition: theme.transitions.normal,
      zIndex: theme.zIndex.fixed,
      transform: isOpen ? 'scale(0.9)' : 'scale(1)',
    },
    badge: {
      position: 'absolute' as const,
      top: '-5px',
      right: '-5px',
      background: theme.colors.status.error,
      color: theme.colors.text.primary,
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.bold,
      border: `2px solid ${theme.colors.background.primary}`,
    },
    pulse: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: theme.colors.accent.primary,
      opacity: 0.4,
      animation: 'pulse 2s infinite',
    }
  };

  return (
    <button
      style={styles.button}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = theme.shadows.glow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
        e.currentTarget.style.boxShadow = theme.shadows.xl;
      }}
    >
      {!isOpen && <div style={styles.pulse} />}
      <span>{isOpen ? '✕' : '🤖'}</span>
      {badge && badge > 0 && !isOpen && (
        <div style={styles.badge}>{badge > 99 ? '99+' : badge}</div>
      )}
    </button>
  );
};

export default ChatbotButton;