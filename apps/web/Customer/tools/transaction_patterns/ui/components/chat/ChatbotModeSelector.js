import React from 'react';

const ChatbotModeSelector = ({ currentMode, onModeChange }) => {
  const modes = [
    {
      id: 'quick',
      name: 'Quick',
      icon: '⚡',
      description: 'Fast insights',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      borderColor: 'rgba(251, 191, 36, 0.5)'
    },
    {
      id: 'strategic',
      name: 'Strategic',
      icon: '🎯',
      description: 'Balanced analysis',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      borderColor: 'rgba(59, 130, 246, 0.5)'
    },
    {
      id: 'deep',
      name: 'Deep Dive',
      icon: '🔬',
      description: 'Comprehensive insights',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      borderColor: 'rgba(139, 92, 246, 0.5)'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px',
      background: 'rgba(30, 41, 59, 0.5)',
      borderRadius: '12px',
      marginBottom: '16px'
    }}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          style={{
            flex: 1,
            padding: '8px',
            background: currentMode === mode.id ? mode.gradient : 'rgba(51, 65, 85, 0.3)',
            border: `1px solid ${currentMode === mode.id ? mode.borderColor : 'rgba(148, 163, 184, 0.2)'}`,
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            opacity: currentMode === mode.id ? 1 : 0.7,
            transform: currentMode === mode.id ? 'scale(1.05)' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (currentMode !== mode.id) {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== mode.id) {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <div style={{ fontSize: '18px' }}>{mode.icon}</div>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>{mode.name}</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>{mode.description}</div>
        </button>
      ))}
    </div>
  );
};

// Mode configuration function
export const getModeConfig = (mode) => {
  switch (mode) {
    case 'quick':
      return {
        responseTime: 500,
        responseStyle: 'concise',
        maxLength: 150,
        focusAreas: ['key_metrics', 'immediate_actions'],
        analysisDepth: 'surface',
        includeCharts: false,
        bulletPoints: true,
        systemPrompt: 'Provide quick, actionable insights in 2-3 sentences. Focus on the most important metric and immediate action needed.'
      };
    
    case 'strategic':
      return {
        responseTime: 1500,
        responseStyle: 'balanced',
        maxLength: 300,
        focusAreas: ['trends', 'patterns', 'recommendations'],
        analysisDepth: 'moderate',
        includeCharts: true,
        bulletPoints: true,
        systemPrompt: 'Provide strategic insights with key trends and 3-5 actionable recommendations. Balance detail with clarity.'
      };
    
    case 'deep':
      return {
        responseTime: 2000,
        responseStyle: 'comprehensive',
        maxLength: 500,
        focusAreas: ['historical_analysis', 'predictive_insights', 'cross_segment_patterns', 'detailed_recommendations'],
        analysisDepth: 'thorough',
        includeCharts: true,
        bulletPoints: true,
        additionalAnalysis: true,
        systemPrompt: 'Provide comprehensive analysis including historical context, predictive insights, and detailed strategic recommendations with supporting data.'
      };
    
    default:
      return getModeConfig('strategic'); // Default to strategic mode
  }
};

export default ChatbotModeSelector;