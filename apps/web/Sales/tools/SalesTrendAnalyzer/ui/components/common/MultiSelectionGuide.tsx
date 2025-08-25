import React, { useState } from 'react';
import { THEME } from '../../types';

interface MultiSelectionGuideProps {
  isVisible?: boolean;
}

const MultiSelectionGuide: React.FC<MultiSelectionGuideProps> = ({
  isVisible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9998,
        background: THEME.glass.backgroundDark,
        color: THEME.colors.text.primary,
        padding: '16px',
        borderRadius: '12px',
        boxShadow: THEME.glass.boxShadow,
        backdropFilter: THEME.glass.backdropFilter,
        border: THEME.glass.border,
        maxWidth: '320px',
        fontSize: '13px',
        fontFamily: THEME.typography.fontFamily,
        animation: 'slideInFromLeft 0.4s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>✨</span>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>Multi-Selection</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.colors.cloudWhite,
              cursor: 'pointer',
              fontSize: '12px',
              opacity: 0.7,
              padding: '2px'
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.colors.cloudWhite,
              cursor: 'pointer',
              fontSize: '12px',
              opacity: 0.7,
              padding: '2px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ 
        lineHeight: '1.4',
        opacity: 0.9
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Shift+Click</strong> any chart point to start comparing multiple data points across all charts.
        </div>
        
        {isExpanded && (
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.8,
            borderTop: THEME.glass.border,
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            <div style={{ marginBottom: '6px' }}>
              • <strong>Regular Click:</strong> Shows individual insights
            </div>
            <div style={{ marginBottom: '6px' }}>
              • <strong>Shift+Click:</strong> Adds to comparison selection
            </div>
            <div style={{ marginBottom: '6px' }}>
              • <strong>ESC Key:</strong> Clears all selections
            </div>
            <div>
              • <strong>AI Analysis:</strong> Automatically appears for 2+ selections
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MultiSelectionGuide;