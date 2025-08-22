import React from 'react';

export type ChatbotMode = 'quick' | 'strategic' | 'deep-dive';

interface ChatbotModeSelectorProps {
  currentMode: ChatbotMode;
  onModeChange: (mode: ChatbotMode) => void;
  selectedPointsCount?: number;
}

const MODES = [
  {
    id: 'quick' as ChatbotMode,
    label: 'Quick',
    icon: '⚡',
    description: 'Fast insights & actions',
    color: '#3b82f6'
  },
  {
    id: 'strategic' as ChatbotMode,
    label: 'Strategic',
    icon: '🎯',
    description: 'Planning & optimization',
    color: '#8b5cf6'
  },
  {
    id: 'deep-dive' as ChatbotMode,
    label: 'Deep Dive',
    icon: '🔍',
    description: 'Detailed exploration',
    color: '#10b981'
  }
];

export default function ChatbotModeSelector({ currentMode, onModeChange, selectedPointsCount }: ChatbotModeSelectorProps) {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(30, 41, 59, 0.6)',
      borderRadius: 12,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: 16
    }}>
      {selectedPointsCount && selectedPointsCount > 0 && (
        <div style={{
          fontSize: 12,
          color: 'rgba(247, 249, 251, 0.7)',
          marginBottom: 10,
          textAlign: 'center'
        }}>
          📊 {selectedPointsCount} data point{selectedPointsCount > 1 ? 's' : ''} selected for analysis
        </div>
      )}
      
      <div style={{
        display: 'flex',
        gap: 8
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
    </div>
  );
}

export function getChatbotModeConfig(mode: ChatbotMode) {
  switch (mode) {
    case 'quick':
      return {
        responseStyle: 'concise',
        maxResponseLength: 150,
        focusAreas: ['key_metrics', 'immediate_actions', 'segment_alerts'],
        temperature: 0.3,
        systemPrompt: 'Provide quick, actionable segment insights in 2-3 sentences. Focus on immediate opportunities.'
      };
    
    case 'strategic':
      return {
        responseStyle: 'detailed',
        maxResponseLength: 500,
        focusAreas: ['segment_optimization', 'growth_strategies', 'retention_plans', 'market_positioning'],
        temperature: 0.7,
        systemPrompt: 'Provide comprehensive strategic analysis for customer segments with detailed recommendations and action plans.'
      };
    
    case 'deep-dive':
      return {
        responseStyle: 'exploratory',
        maxResponseLength: 400,
        focusAreas: ['behavioral_patterns', 'segment_transitions', 'correlation_analysis', 'hidden_insights'],
        temperature: 0.6,
        systemPrompt: 'Explore customer segments deeply, uncovering patterns, correlations, and non-obvious insights.'
      };
    
    default:
      return {
        responseStyle: 'balanced',
        maxResponseLength: 250,
        focusAreas: ['segment_overview', 'key_insights', 'recommendations'],
        temperature: 0.5,
        systemPrompt: 'Provide balanced segment analysis with key insights and actionable recommendations.'
      };
  }
}