import React from 'react';

export type ChatbotMode = 'quick' | 'strategic' | 'forecast';

interface ChatbotModeSelectorProps {
  currentMode: ChatbotMode;
  onModeChange: (mode: ChatbotMode) => void;
}

const MODES = [
  {
    id: 'quick' as ChatbotMode,
    label: 'Quick',
    icon: '⚡',
    description: 'Fast insights & immediate actions',
    color: '#00e0ff'
  },
  {
    id: 'strategic' as ChatbotMode,
    label: 'Strategic',
    icon: '🎯',
    description: 'Deep analysis & long-term planning',
    color: '#7c3aed'
  },
  {
    id: 'forecast' as ChatbotMode,
    label: 'Forecast',
    icon: '📈',
    description: 'Predictive insights & trend analysis',
    color: '#00e676'
  }
];

export default function ChatbotModeSelector({ currentMode, onModeChange }: ChatbotModeSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '12px 16px',
      background: 'rgba(15, 20, 25, 0.8)',
      borderRadius: 12,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: 16
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
            transition: 'all 0.3s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (currentMode !== mode.id) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentMode !== mode.id) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.background = 'transparent';
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
              marginBottom: 2
            }}>
              {mode.icon}
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: currentMode === mode.id ? 600 : 400,
              color: currentMode === mode.id ? mode.color : 'rgba(247, 249, 251, 0.9)'
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
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: mode.color,
              boxShadow: `0 0 10px ${mode.color}`
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

export function getChatbotModeConfig(mode: ChatbotMode) {
  switch (mode) {
    case 'quick':
      return {
        responseStyle: 'concise',
        maxResponseLength: 150,
        focusAreas: ['immediate_actions', 'key_metrics', 'alerts'],
        temperature: 0.3,
        systemPrompt: 'Provide quick, actionable insights in 2-3 sentences. Focus on what needs immediate attention.'
      };
    
    case 'strategic':
      return {
        responseStyle: 'detailed',
        maxResponseLength: 500,
        focusAreas: ['root_cause', 'long_term_trends', 'recommendations', 'competitive_analysis'],
        temperature: 0.7,
        systemPrompt: 'Provide comprehensive strategic analysis with context, implications, and detailed recommendations.'
      };
    
    case 'forecast':
      return {
        responseStyle: 'predictive',
        maxResponseLength: 300,
        focusAreas: ['predictions', 'trend_analysis', 'risk_assessment', 'scenarios'],
        temperature: 0.5,
        systemPrompt: 'Focus on predictive insights, future trends, and scenario planning based on historical patterns.'
      };
    
    default:
      return {
        responseStyle: 'balanced',
        maxResponseLength: 250,
        focusAreas: ['all'],
        temperature: 0.5,
        systemPrompt: 'Provide balanced insights with both immediate actions and strategic context.'
      };
  }
}