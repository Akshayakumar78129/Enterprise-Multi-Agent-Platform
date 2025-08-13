import React, { useState } from 'react';

// Markdown-ish formatter with safe inline HTML for LLM output
const renderFormatted = (text) => {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let currentList = null; // { type: 'ul'|'ol', items: [htmlString] }
  let inCodeBlock = false;
  let codeBuffer = [];

  const escapeHtml = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const inline = (s) => {
    let html = escapeHtml(s);
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic _text_ or *text*
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/\*(?!\*)([^*]+)\*/g, '<em>$1</em>');
    return html;
  };

  const flushList = () => {
    if (currentList) {
      const ListTag = currentList.type === 'ol' ? 'ol' : 'ul';
      blocks.push(
        <ListTag style={{ margin: '6px 0 10px 18px' }} key={`list-${blocks.length}`}>
          {currentList.items.map((it, idx) => (
            <li key={idx} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: inline(it) }} />
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  const flushCode = () => {
    if (inCodeBlock) {
      blocks.push(
        <pre key={`code-${blocks.length}`} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:10, whiteSpace:'pre-wrap', overflowX:'auto' }}>
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

    // Fenced code blocks ```
    if (/^```/.test(line.trim())) {
      if (!inCodeBlock) { inCodeBlock = true; codeBuffer = []; }
      else { flushCode(); }
      return;
    }
    if (inCodeBlock) { codeBuffer.push(line); return; }

    // Headings: #, ##, ###
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushList();
      const level = h[1].length; const content = h[2];
      const style = { margin: '8px 0 4px', color: '#a5b4fc', fontWeight: 600, fontSize: level === 1 ? 18 : level === 2 ? 16 : 14 };
      const Tag = level === 1 ? 'h4' : level === 2 ? 'h5' : 'h6';
      blocks.push(<Tag style={style} key={`h-${i}`} dangerouslySetInnerHTML={{ __html: inline(content) }} />);
      return;
    }

    // Bullets: -, *, •
    if (/^([-*•])\s+/.test(line)) {
      const content = line.replace(/^([-*•])\s+/, '');
      if (!currentList || currentList.type !== 'ul') currentList = { type: 'ul', items: [] };
      currentList.items.push(content);
      return;
    }

    // Ordered list: 1) or 1.
    const ol = line.match(/^(\d+)[\)\.]\s+(.*)$/);
    if (ol) {
      const content = ol[2];
      if (!currentList || currentList.type !== 'ol') currentList = { type: 'ol', items: [] };
      currentList.items.push(content);
      return;
    }

    // Horizontal rule
    if (/^[-_]{3,}$/.test(line.trim())) {
      flushList();
      blocks.push(<hr key={`hr-${i}`} style={{ borderColor:'rgba(255,255,255,0.08)' }} />);
      return;
    }

    // Paragraph
    flushList();
    blocks.push(<p style={{ margin: '6px 0' }} key={`p-${i}`} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
  });

  flushList();
  flushCode();
  return <div>{blocks}</div>;
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    {title && <h4 style={{ margin: '0 0 8px 0', color: '#a5b4fc' }}>{title}</h4>}
    {children}
  </div>
);

const Metric = ({ label, value, hint }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 12,
    minWidth: 140
  }}>
    <div style={{ color: '#9fb3c8', fontSize: 12 }}>{label}</div>
    <div style={{ color: '#e6edf3', fontSize: 18, fontWeight: 600 }}>{value}</div>
    {hint && <div style={{ color: '#8aa2b6', fontSize: 11, marginTop: 4 }}>{hint}</div>}
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
  onAskAI,
  onDownloadCSV,
  onFilter,
  rawContext,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [mode, setMode] = useState('strategic');
  if (!isOpen) return null;

  return (
    <div 
      role="dialog" aria-modal="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={() => onClose && onClose()}
    >
      <div 
        onClick={(e)=>e.stopPropagation()}
        style={{ width: '92%', maxWidth: 800, maxHeight: '90vh', background: '#1f2632', border: '1px solid #2d3748', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: 20, borderBottom: '1px solid #2d3748', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto' }}>
          <div>
            <h3 style={{ margin: 0, color: '#e6edf3' }}>{title}</h3>
            {subtitle && <div style={{ marginTop: 4, color: '#9fb3c8', fontSize: 13 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 0, color: '#e6edf3', fontSize: 22, cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={{ padding: 20, flex: '1 1 auto', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {metrics.length > 0 && (
            <Section>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {metrics.map((m, idx) => <Metric key={idx} {...m} />)}
              </div>
            </Section>
          )}

          {bullets.length > 0 && (
            <Section title="Highlights">
              <ul style={{ margin: 0, paddingLeft: 18, color: '#d1d5db' }}>
                {bullets.map((b, idx) => <li key={idx} style={{ marginBottom: 6 }}>{b}</li>)}
              </ul>
            </Section>
          )}

          {staticPoints && staticPoints.length > 0 && (
            <Section title="Key Points">
              <ul style={{ margin: 0, paddingLeft: 18, color: '#d1d5db' }}>
                {staticPoints.map((p, idx) => <li key={idx} style={{ marginBottom: 6 }}>{p}</li>)}
              </ul>
            </Section>
          )}

          <Section title="AI insight">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ color: '#9fb3c8', fontSize: 12 }}>Mode:</span>
              {['quick','strategic','forecast'].map(m => (
                <button key={m} onClick={()=>setMode(m)} style={{
                  background: mode===m? '#00e0ff' : 'transparent',
                  color: mode===m? '#001018' : '#e6edf3',
                  border: '1px solid #2d3748',
                  borderRadius: 999,
                  padding: '4px 10px',
                  cursor: 'pointer'
                }}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, minHeight: 80, color: '#d1d5db', marginBottom: 8 }}>
              {aiLoading ? 'Generating...' : (aiText ? renderFormatted(aiText) : 'Use the prompt box below or click Explain for strategies, next steps, and forecasts.')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <input
                value={userPrompt}
                onChange={(e)=>setUserPrompt(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); onAskAI && onAskAI(userPrompt, mode); } }}
                placeholder="Ask a follow-up (e.g., Segment playbook? Cohort bets?)"
                style={{ flex: 1, background: 'transparent', color: '#e6edf3', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 10px' }}
              />
              <button 
                type="button"
                aria-label="Send follow-up"
                title="Send"
                onClick={()=>{ if(onAskAI){ onAskAI(userPrompt, mode, 'followup'); } setUserPrompt(''); }}
                disabled={!!aiLoading || !userPrompt.trim()}
                style={{ background: 'transparent', color: '#e6edf3', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 12px', cursor: (!!aiLoading || !userPrompt.trim()) ? 'not-allowed' : 'pointer' }}
              >Send</button>
              <button 
                onClick={()=>onAskAI && onAskAI('', mode, 'explain')}
                disabled={!!aiLoading}
                style={{ background: aiLoading? '#57f0ff66' : '#00e0ff', color: '#001018', border: 0, borderRadius: 8, padding: '8px 12px', cursor: aiLoading? 'not-allowed' : 'pointer' }}
              >{aiLoading ? 'Working…' : 'Explain with AI'}</button>
              {onDownloadCSV && <button onClick={onDownloadCSV} style={{ background: 'transparent', color: '#e6edf3', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Download CSV</button>}
              {onFilter && <button onClick={onFilter} style={{ background: 'transparent', color: '#e6edf3', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Filter to this</button>}
              {rawContext && <button onClick={() => navigator.clipboard.writeText(JSON.stringify(rawContext, null, 2))} style={{ background: 'transparent', color: '#e6edf3', border: '1px solid #2d3748', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Copy Context</button>}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;
