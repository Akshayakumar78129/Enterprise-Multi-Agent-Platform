import React from 'react';

const MODES = [
  {
    id: 'quick',
    label: 'Quick',
    icon: '⚡',
    description: 'Fast regional insights',
    color: '#00e0ff'
  },
  {
    id: 'strategic',
    label: 'Strategic',
    icon: '🎯',
    description: 'Deep regional analysis',
    color: '#fbbf24'
  },
  {
    id: 'deep',
    label: 'Deep Dive',
    icon: '🔬',
    description: 'Comprehensive exploration',
    color: '#e930ff'
  }
];

const ChatbotModeSelector = ({ currentMode, onModeChange }) => {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '12px 16px',
      background: 'rgba(30, 41, 59, 0.8)',
      borderRadius: 12,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: 16,
      backdropFilter: 'blur(10px)'
    }}>
      {MODES.map(mode => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: currentMode === mode.id 
              ? `linear-gradient(135deg, ${mode.color}22, ${mode.color}11)`
              : 'transparent',
            border: `1px solid ${currentMode === mode.id ? mode.color : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            transform: currentMode === mode.id ? 'scale(1.02)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (currentMode !== mode.id) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== mode.id) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4
          }}>
            <div style={{
              fontSize: 20,
              marginBottom: 2,
              filter: currentMode === mode.id ? 'none' : 'grayscale(0.3)',
              transition: 'filter 0.3s ease'
            }}>
              {mode.icon}
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: currentMode === mode.id ? 600 : 400,
              color: currentMode === mode.id ? mode.color : 'rgba(247, 249, 251, 0.9)',
              textShadow: currentMode === mode.id ? `0 0 10px ${mode.color}50` : 'none'
            }}>
              {mode.label}
            </div>
            <div style={{
              fontSize: 10,
              color: 'rgba(247, 249, 251, 0.6)',
              textAlign: 'center',
              lineHeight: 1.3,
              marginTop: 2
            }}>
              {mode.description}
            </div>
          </div>
          
          {currentMode === mode.id && (
            <>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: mode.color,
                boxShadow: `0 0 10px ${mode.color}`,
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, transparent 30%, ${mode.color}10 50%, transparent 70%)`,
                animation: 'shimmer 2s infinite'
              }} />
            </>
          )}
        </button>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export const getChatbotModeConfig = (mode) => {
  switch (mode) {
    case 'quick':
      return {
        responseStyle: 'concise',
        maxResponseLength: 150,
        focusAreas: ['immediate_insights', 'key_metrics', 'top_regions'],
        temperature: 0.3,
        systemPrompt: 'Provide quick regional insights in 2-3 sentences. Focus on top performers and immediate opportunities.'
      };
    
    case 'strategic':
      return {
        responseStyle: 'detailed',
        maxResponseLength: 500,
        focusAreas: ['regional_analysis', 'market_trends', 'growth_strategies', 'competitive_positioning'],
        temperature: 0.7,
        systemPrompt: 'Provide comprehensive regional analysis with strategic recommendations and market context.'
      };
    
    case 'deep':
      return {
        responseStyle: 'comprehensive',
        maxResponseLength: 800,
        focusAreas: ['detailed_analysis', 'historical_patterns', 'predictive_insights', 'cross_regional_comparison'],
        temperature: 0.6,
        systemPrompt: 'Provide exhaustive regional analysis with historical context, predictions, and detailed comparisons across all dimensions.'
      };
    
    default:
      return {
        responseStyle: 'balanced',
        maxResponseLength: 250,
        focusAreas: ['all'],
        temperature: 0.5,
        systemPrompt: 'Provide balanced regional insights with both immediate actions and strategic context.'
      };
  }
};

export default ChatbotModeSelector;