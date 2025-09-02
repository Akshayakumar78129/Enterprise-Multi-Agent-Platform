import React from 'react';

// Exported helper to share mode config with chatbot and agent queries
export const getModeConfig = (mode = 'strategic') => {
  switch (mode) {
    case 'quick':
      return {
        key: 'quick',
        icon: '⚡',
        label: 'Quick',
        maxSentences: 3,
        focus: ['immediate_insights', 'actions'],
        delayMs: 500
      };
    case 'deep':
      return {
        key: 'deep',
        icon: '🔬',
        label: 'Deep Dive',
        maxSentences: 100,
        focus: ['comprehensive', 'historical_context', 'predictive_insights'],
        delayMs: 2000
      };
    default:
      return {
        key: 'strategic',
        icon: '🎯',
        label: 'Strategic',
        maxSentences: 12,
        focus: ['balanced', 'key_insights', 'recommendations'],
        delayMs: 1500
      };
  }
};

const ModeCard = ({ active, icon, title, subtitle, gradient, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '10px 12px',
      borderRadius: 12,
      border: active ? '1px solid rgba(148,163,184,.35)' : '1px solid rgba(148,163,184,.18)',
      background: active
        ? gradient
        : 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(17,24,39,0.9) 100%)',
      color: '#f8fafc',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
      boxShadow: active ? '0 8px 24px rgba(2,132,199,.25)' : '0 1px 2px rgba(0,0,0,.25)',
      transform: active ? 'translateY(-1px)' : 'none',
      transition: 'box-shadow .2s ease, transform .2s ease, border-color .2s ease',
      position: 'relative',
      overflow: 'hidden',
      outline: 'none',
    }}
    aria-pressed={active}
    title={title}
  >
    <span style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>{icon}</span>
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '.2px', lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 11, opacity: .9, lineHeight: 1.2, marginTop: 3 }}>{subtitle}</div>
    </div>
  </button>
);

export default function ChatbotModeSelector({ mode = 'strategic', onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'stretch',
      marginTop: 12,
      padding: 8,
      borderRadius: 12,
      border: '1px solid rgba(148,163,184,.15)',
      background: 'linear-gradient(180deg, rgba(30,41,59,.6), rgba(15,23,42,.6))',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)'
    }}>
      <ModeCard
        active={mode === 'quick'}
        icon="⚡"
        title="Quick"
        subtitle="2–3 sentences, immediate actions"
        gradient="linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)"
        onClick={() => onChange && onChange('quick')}
      />
      <ModeCard
        active={mode === 'strategic'}
        icon="🎯"
        title="Strategic"
        subtitle="Insights & recommen-dations"
        gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
        onClick={() => onChange && onChange('strategic')}
      />
      <ModeCard
        active={mode === 'deep'}
        icon="🔬"
        title="Deep Dive"
        subtitle="Detailed analysis & context"
        gradient="linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)"
        onClick={() => onChange && onChange('deep')}
      />
    </div>
  );
}