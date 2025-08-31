import React, { useState, useEffect } from 'react';

// Enhanced Markdown formatter with rich inline HTML for LLM output
const renderFormatted = (text) => {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let currentList = null;
  let inCodeBlock = false;
  let codeBuffer = [];

  const escapeHtml = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const inline = (s) => {
    let html = escapeHtml(s);
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #60a5fa; text-decoration: underline;">$1</a>');
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px; color: #60a5fa;">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #f8fafc;">$1</strong>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/\*(?!\*)([^*]+)\*/g, '<em>$1</em>');
    return html;
  };

  const flushList = () => {
    if (currentList) {
      const ListTag = currentList.type === 'ol' ? 'ol' : 'ul';
      blocks.push(
        <ListTag style={{ margin: '12px 0 16px 24px', color: '#e2e8f0' }} key={`list-${blocks.length}`}>
          {currentList.items.map((it, idx) => (
            <li key={idx} style={{ marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: inline(it) }} />
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  const flushCode = () => {
    if (inCodeBlock) {
      blocks.push(
        <pre key={`code-${blocks.length}`} style={{ 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 12,
          padding: 16,
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
          color: '#60a5fa',
          fontSize: 13,
          fontFamily: 'Monaco, monospace'
        }}>
          <code>{codeBuffer.join('\n')}</code>
        </pre>
      );
      inCodeBlock = false;
      codeBuffer = [];
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.replace(/\t/g, '    ');
    if (line.trim() === '') { flushList(); flushCode(); return; }

    if (/^```/.test(line.trim())) {
      if (!inCodeBlock) { inCodeBlock = true; codeBuffer = []; }
      else { flushCode(); }
      return;
    }
    if (inCodeBlock) { codeBuffer.push(line); return; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      const content = h[2];
      const style = { 
        margin: '16px 0 8px',
        color: '#fbbf24',
        fontWeight: 700,
        fontSize: level === 1 ? 20 : level === 2 ? 18 : 16,
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      };
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5';
      blocks.push(<Tag style={style} key={`h-${i}`} dangerouslySetInnerHTML={{ __html: inline(content) }} />);
      return;
    }

    if (/^([-*•])\s+/.test(line)) {
      const content = line.replace(/^([-*•])\s+/, '');
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(content);
      return;
    }

    const ol = line.match(/^(\d+)[\)\.]\s+(.*)$/);
    if (ol) {
      const content = ol[2];
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(content);
      return;
    }

    if (/^[-_]{3,}$/.test(line.trim())) {
      flushList();
      blocks.push(<hr key={`hr-${i}`} style={{ borderColor: 'rgba(251, 191, 36, 0.2)', margin: '20px 0' }} />);
      return;
    }

    flushList();
    blocks.push(<p style={{ margin: '12px 0', color: '#cbd5e1', lineHeight: 1.6 }} key={`p-${i}`} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
  });

  flushList();
  flushCode();
  return <div>{blocks}</div>;
};

const Section = ({ title, children, icon }) => (
  <div style={{ marginBottom: 24 }}>
    {title && (
      <h4 style={{ 
        margin: '0 0 12px 0',
        color: '#fbbf24',
        fontSize: 16,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        {title}
      </h4>
    )}
    {children}
  </div>
);

const Metric = ({ label, value, hint, trend, icon }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(51, 65, 85, 0.4))',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    borderRadius: 12,
    padding: 16,
    minWidth: 160,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 10px 30px rgba(251, 191, 36, 0.2)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{label}</div>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
    </div>
    <div style={{ color: '#f8fafc', fontSize: 24, fontWeight: 700 }}>{value}</div>
    {hint && <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>{hint}</div>}
    {trend && (
      <div style={{ 
        marginTop: 8,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 20,
        background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: trend > 0 ? '#10b981' : '#ef4444',
        fontSize: 11,
        fontWeight: 600
      }}>
        <span>{trend > 0 ? '↑' : '↓'}</span>
        <span>{Math.abs(trend)}%</span>
      </div>
    )}
  </div>
);

const InsightCard = ({ title, content, type = 'insight', action }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(51, 65, 85, 0.5))',
    borderLeft: `4px solid ${type === 'alert' ? '#ef4444' : type === 'opportunity' ? '#10b981' : '#fbbf24'}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  }}
  onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateX(4px)';
    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.transform = 'translateX(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}>
    <div style={{ fontWeight: 600, fontSize: 16, color: '#f8fafc', marginBottom: 8 }}>
      {type === 'alert' && '⚠️'} {type === 'opportunity' && '🎯'} {type === 'insight' && '💡'} {title}
    </div>
    <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>{content}</div>
    {action && (
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          Take Action
        </button>
        <button style={{
          background: 'transparent',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Learn More
        </button>
      </div>
    )}
  </div>
);

const InsightModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  metrics = [],
  bullets = [],
  staticPoints = [],
  aiText,
  aiLoading = false,
  aiAudit,
  onAskAI,
  onDownloadCSV,
  onFilter,
  rawContext,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [mode, setMode] = useState('strategic');
  const [insights, setInsights] = useState([]);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      // Generate dynamic insights based on context
      generateInsights();
    }
  }, [isOpen, rawContext]);

  const generateInsights = () => {
    const newInsights = [];
    
    if (metrics.length > 0) {
      // Analyze metrics for insights
      const totalTransactions = metrics.find(m => m.label?.includes('Transaction'))?.value;
      const anomalyRate = metrics.find(m => m.label?.includes('Anomaly'))?.value;
      
      if (anomalyRate && parseFloat(anomalyRate) > 10) {
        newInsights.push({
          type: 'alert',
          title: 'High Anomaly Rate Detected',
          content: `${anomalyRate} of transactions are showing unusual patterns. This could indicate fraud, system issues, or emerging customer behaviors that need investigation.`
        });
      }
      
      if (totalTransactions) {
        newInsights.push({
          type: 'opportunity',
          title: 'Transaction Volume Optimization',
          content: `With ${totalTransactions} transactions processed, there's potential to optimize payment processing fees by consolidating payment methods or negotiating better rates.`
        });
      }
    }
    
    // Add strategic insights
    newInsights.push({
      type: 'insight',
      title: 'Peak Hour Strategy',
      content: 'Analysis shows concentrated transaction activity during specific hours. Consider implementing dynamic pricing or promotional campaigns during off-peak hours to balance load.'
    });
    
    setInsights(newInsights);
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: showAnimation ? 'fadeIn 0.3s ease-out' : ''
      }}
      onClick={() => onClose && onClose()}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%',
          maxWidth: 900,
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          border: '2px solid rgba(251, 191, 36, 0.3)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 100px rgba(251, 191, 36, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: showAnimation ? 'slideUp 0.4s ease-out' : ''
        }}
      >
        {/* Enhanced Header */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
          borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: '0 0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <span style={{ fontSize: 28 }}>🤖</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>
                {title || 'AI Transaction Intelligence'}
              </h3>
              {subtitle && (
                <div style={{ marginTop: 4, color: '#cbd5e1', fontSize: 14 }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              color: '#f8fafc',
              fontSize: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Enhanced Content */}
        <div style={{
          padding: '28px',
          flex: '1 1 auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Key Metrics */}
          {metrics.length > 0 && (
            <Section title="Key Metrics" icon="📊">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {metrics.map((m, idx) => <Metric key={idx} {...m} />)}
              </div>
            </Section>
          )}

          {/* AI Insights Cards */}
          {insights.length > 0 && (
            <Section title="AI Insights & Recommendations" icon="🧠">
              {insights.map((insight, idx) => (
                <InsightCard key={idx} {...insight} action={true} />
              ))}
            </Section>
          )}

          {/* Highlights */}
          {bullets.length > 0 && (
            <Section title="Transaction Highlights" icon="✨">
              <div style={{
                background: 'rgba(251, 191, 36, 0.05)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: 12,
                padding: 16
              }}>
                <ul style={{ margin: 0, paddingLeft: 24, color: '#e2e8f0' }}>
                  {bullets.map((b, idx) => (
                    <li key={idx} style={{ marginBottom: 10, lineHeight: 1.6 }}>{b}</li>
                  ))}
                </ul>
              </div>
            </Section>
          )}

          {/* AI Analysis Section */}
          <Section title="AI Deep Analysis" icon="🔍">
            {aiAudit && (
              <div style={{
                fontSize: 12,
                color: '#94a3b8',
                marginBottom: 12,
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                🤖 Analysis by: <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                  {aiAudit.agentAuthor || 'Transaction Intelligence Agent'}
                </span>
                {aiAudit.mentionDetected && ' • Via @mention'}
                {' • '}<span title={aiAudit.traceId}>
                  {new Date(aiAudit.dispatchedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
            
            {/* Mode Selection */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Analysis Mode:</span>
              {['quick', 'strategic', 'forecast', 'comprehensive'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    background: mode === m 
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                      : 'rgba(251, 191, 36, 0.1)',
                    color: mode === m ? '#1e293b' : '#fbbf24',
                    border: `1px solid ${mode === m ? '#fbbf24' : 'rgba(251, 191, 36, 0.3)'}`,
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                  onMouseEnter={e => {
                    if (mode !== m) {
                      e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (mode !== m) {
                      e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* AI Response Area */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: 12,
              padding: 20,
              minHeight: 120,
              color: '#e2e8f0',
              marginBottom: 16,
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {aiLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
                  animation: 'shimmer 2s infinite'
                }}/>
              )}
              {aiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    border: '3px solid rgba(251, 191, 36, 0.2)',
                    borderTop: '3px solid #fbbf24',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}/>
                  <span>Analyzing transaction patterns and generating insights...</span>
                </div>
              ) : (
                aiText ? renderFormatted(aiText) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Click "Generate AI Analysis" to get detailed insights about transaction patterns, 
                    anomalies, optimization opportunities, and strategic recommendations.
                  </div>
                )
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <input
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (onAskAI && userPrompt.trim()) {
                      onAskAI(userPrompt, mode);
                      setUserPrompt('');
                    }
                  }
                }}
                placeholder="Ask about patterns, anomalies, forecasts, or optimization strategies..."
                style={{
                  flex: 1,
                  minWidth: 300,
                  background: 'rgba(30, 41, 59, 0.5)',
                  color: '#f8fafc',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 14,
                  transition: 'all 0.2s'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#fbbf24';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              
              <button
                onClick={() => {
                  if (onAskAI && userPrompt.trim()) {
                    onAskAI(userPrompt, mode, 'followup');
                    setUserPrompt('');
                  }
                }}
                disabled={!!aiLoading || !userPrompt.trim()}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: (!!aiLoading || !userPrompt.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!!aiLoading || !userPrompt.trim()) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (!aiLoading && userPrompt.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Send
              </button>
              
              <button
                onClick={() => onAskAI && onAskAI('', mode, 'explain')}
                disabled={!!aiLoading}
                style={{
                  background: aiLoading 
                    ? 'rgba(251, 191, 36, 0.3)'
                    : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: aiLoading ? '#94a3b8' : '#1e293b',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (!aiLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(251, 191, 36, 0.3)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {aiLoading ? 'Analyzing...' : '✨ Generate AI Analysis'}
              </button>
              
              {onDownloadCSV && (
                <button
                  onClick={onDownloadCSV}
                  style={{
                    background: 'transparent',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  📥 Export Data
                </button>
              )}
              
              {onFilter && (
                <button
                  onClick={onFilter}
                  style={{
                    background: 'transparent',
                    color: '#8b5cf6',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🔍 Apply Filter
                </button>
              )}
            </div>
          </Section>

          {/* Quick Actions */}
          <Section title="Quick Actions" icon="⚡">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12
            }}>
              {[
                { label: 'Schedule Report', icon: '📅', color: '#3b82f6' },
                { label: 'Share Insights', icon: '🔗', color: '#8b5cf6' },
                { label: 'Create Alert', icon: '🔔', color: '#ef4444' },
                { label: 'View History', icon: '📈', color: '#10b981' }
              ].map((action, idx) => (
                <button
                  key={idx}
                  style={{
                    background: `linear-gradient(135deg, ${action.color}20, ${action.color}10)`,
                    border: `1px solid ${action.color}40`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: action.color,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}30, ${action.color}20)`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${action.color}20, ${action.color}10)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: 18 }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default InsightModal;