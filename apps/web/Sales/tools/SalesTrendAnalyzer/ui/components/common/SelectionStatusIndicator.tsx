import React from 'react';
import { THEME } from '../../types';

interface SelectionStatusIndicatorProps {
  selectionCount: number;
  isVisible: boolean;
  onClearSelections: () => void;
  onExplainSelections?: () => void; // New: open enhanced AI with context
}

const SelectionStatusIndicator: React.FC<SelectionStatusIndicatorProps> = ({
  selectionCount,
  isVisible,
  onClearSelections,
  onExplainSelections
}) => {
  if (!isVisible || selectionCount === 0) {
    return null;
  }

  const baseBtn: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: THEME.colors.text.white,
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  };

  const hoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.borderColor = THEME.colors.primary;
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
      e.currentTarget.style.boxShadow = `0 0 0 3px ${THEME.colors.primary20}`;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: THEME.colors.primaryGradient,
        color: THEME.colors.text.white,
        padding: '12px 20px',
        borderRadius: '12px',
        boxShadow: `0 8px 32px ${THEME.colors.primary20}`,
        backdropFilter: 'blur(10px)',
        border: THEME.glass.border,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: THEME.typography.fontFamily,
        animation: 'slideInFromRight 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>📊</span>
        <span>
          {selectionCount} point{selectionCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onExplainSelections && (
          <button
            onClick={onExplainSelections}
            style={{ ...baseBtn }}
            {...hoverHandlers}
          >
            Explain
          </button>
        )}

        <button
          onClick={onClearSelections}
          style={{ ...baseBtn }}
          {...hoverHandlers}
        >
          Clear (ESC)
        </button>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default SelectionStatusIndicator;