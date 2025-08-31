// apps/web/Customer/tools/performance_deviation/ui/components/chat/EnhancedContextAwareChatbot.jsx
'use client';

import React, { useEffect, useRef, useState } from "react";
import { ensureAISession, buildSimplePrompt, emitAskAI } from "../../../../../../ui-common/insights/InsightUtils";
import { AIResponseDashboardWithViz } from "../../../../../../ui-common/ai-interaction/aiResponse";

const AGENT_LIST = [
  { name: "orchestrator", displayName: "Orchestrator", avatar: "🧭" },
  { name: "sales",        displayName: "Sales Analyst", avatar: "📈" },
  { name: "customer",     displayName: "Customer Analyst", avatar: "👥" },
  { name: "finance",      displayName: "Finance Analyst", avatar: "💰" },
  { name: "inventory",    displayName: "Inventory Analyst", avatar: "📦" },
];

const MODE_LIST = [
  { key: "concise",   title: "Quick",     subtitle: "Fast insights & immediate actions" },
  { key: "strategic", title: "Strategic", subtitle: "Deep analysis & long-term planning" },
  { key: "forecast",  title: "Forecast",  subtitle: "Predictive insights & trend analysis" },
];

function parseAgentFromText(text) {
  const m = text.match(/@([a-zA-Z_]+)/);
  if (!m) return { agent: "orchestrator", cleaned: text.trim() };
  const name = m[1].toLowerCase();
  const exists = AGENT_LIST.some(a => a.name === name);
  const agent = exists ? name : "orchestrator";
  const cleaned = text.replace(`@${m[1]}`, "").replace(/\s{2,}/g, " ").trim();
  return { agent, cleaned };
}
function labelForAgent(name) {
  const a = AGENT_LIST.find(x => x.name === name);
  return a ? `${a.avatar} @${a.name}` : `@${name || "unknown"}`;
}
function toUSD(n){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0)); }catch{ return String(n) } }
function toPct(n){ const v = Number(n); if (!Number.isFinite(v)) return '—'; return `${(v*100).toFixed(1)}%`; }

export default function EnhancedContextAwareChatbot({ snapshotGetter = null }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("concise"); // concise | strategic | forecast
  const listRef = useRef(null);
  const [execSummary, setExecSummary] = useState({ loading:false, error:null, data:null });
  const [contextChips, setContextChips] = useState([]); // { id, text, raw }
  const [chipsCollapsed, setChipsCollapsed] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedChipId, setSelectedChipId] = useState(null);

  // simple placeholder to avoid previous crash
  const exec = { portfolioSize: null, atRisk: null, exposure: null, yoy: null, qoq: null, vsIndustry: null, topPriorityCount: null, riskShare: null, recommended: null };

  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: "bot",
        content: "Welcome to Performance Insights.\n\nUse <b>@orchestrator</b> to coordinate agents, or <b>Shift+Click</b> a point to send context."
      }]);
    }
  }, [isChatOpen, messages.length]);

  useEffect(() => { listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }); }, [messages, isLoading]);

  // pull live performance deviation data for executive summary
  useEffect(() => {
    let cancelled = false;
    async function loadExec() {
      try {
        setExecSummary(s=>({ ...s, loading:true, error:null }));
        const snapshot = snapshotGetter?.() || window.__pd_snapshot || null;
        const filters = snapshot?.filters || { startDate: '2018-01-01', endDate: '2020-12-31' };
        const selection = snapshot?.selection || { customerIds: [], productGroups: [] };
        const r = await fetch('/api/performance-deviation/data', {
          method: 'POST', headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
          body: JSON.stringify({ ...filters, ...selection })
        });
        const j = await r.json();
        if (!j?.success) throw new Error(j?.error || 'Exec data fetch failed');
        if (cancelled) return;
        setExecSummary({ loading:false, error:null, data: j.data });
      } catch (e) {
        if (cancelled) return;
        setExecSummary({ loading:false, error:String(e?.message||e), data:null });
      }
    }
    loadExec();
    return () => { cancelled = true; };
  }, [snapshotGetter]);

  function formatContext(detail){
    try {
      if (!detail || typeof detail !== 'object') return '';
      const fmt = (n, isMoney=false) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return String(n);
        return isMoney ? new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v)
                       : new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v);
      };
      // Performance deviation time point
      if (detail.tool === 'performance_deviation' && (detail.intent === 'timepoint' || detail.intent === 'point_context')){
        const kpi = detail.kpi || 'KPI';
        const date = detail.date ? new Date(detail.date).toLocaleDateString() : 'Unknown date';
        const isCurrency = /revenue|amount|value|aov/i.test(kpi);
        const actual = fmt(detail.actual, isCurrency);
        const predicted = fmt(detail.predicted, isCurrency);
        const deviation = fmt(detail.deviation, isCurrency);
        return `Selected ${kpi} on ${date}: actual ${actual}, predicted ${predicted}, deviation ${deviation}.`;
      }
      // Feature importance factor
      if (detail.tool === 'performance_deviation' && detail.intent === 'factor_context'){
        const kpi = detail.kpi || 'All KPIs';
        const pct = (Number(detail.importance||0)*100).toFixed(1);
        return `Selected driver ${detail.feature} for ${kpi}: importance ~${pct}%.`;
      }
      // Variance component
      if (detail.tool === 'performance_deviation' && detail.intent === 'variance_component'){
        const sharePct = (Number(detail.share||0)*100).toFixed(1);
        return `Selected variance component ${detail.component} (~${sharePct}% of variance) for ${detail.kpi || 'current KPI'}.`;
      }
      // Correlation
      if (detail.tool === 'performance_deviation' && detail.intent === 'kpi_factor_correlation'){
        const r = Number(detail.correlation||0).toFixed(2);
        return `Selected correlation: ${detail.factor} vs ${detail.kpi || 'KPI'} (r=${r}).`;
      }
      // Business function comparison (radar)
      if (detail.tool === 'performance_deviation' && detail.intent === 'function_radar_point'){
        const v = Number(detail.value||0).toFixed(2);
        return `Selected ${detail.function} — ${detail.axis}: ${v}.`;
      }
      // Deviation calendar heatmap
      if (detail.tool === 'performance_deviation' && detail.intent === 'calendar_deviation'){
        const d = detail.date ? new Date(detail.date).toLocaleDateString() : 'Unknown date';
        const mag = Number(detail.magnitude||0).toFixed(2);
        return `Selected deviation on ${d}: magnitude ${mag}.`;
      }
      // Recommendation context
      if (detail.tool === 'performance_deviation' && detail.intent === 'recommendation_context'){
        return `Selected strategy: ${detail.strategy?.name || 'Strategy'} for ${detail.kpi || 'KPI'}.`;
      }
      // Simulate context
if (detail.tool === 'performance_deviation' && detail.intent === 'simulate_acceptance') {
  const strat = detail.strategy?.name || 'Strategy';
  const kpi = detail.kpi || 'KPI';
  const simRes = detail.result?.summary || ''; // or any key you want from your simulation result
  return `Simulated execution plan for ${strat} on ${kpi}${simRes ? `: ${simRes}` : ''}.`;
}

      return '';
    } catch { return ''; }
  }

  // Listen for Shift+Click context from any visualization and capture as chips only
  useEffect(() => {
    function onInsightRequest(ev) {
      // Do not add chips here to avoid duplicates; just open chat if needed
      setIsChatOpen(true);
    }
    function onContextAdd(ev) {
      const detail = ev?.detail || {};
      const line = formatContext(detail);
      if (!line) return;
      const id = `${Date.now()}-${Math.random()}`;
      setIsChatOpen(true);
      setContextChips((chips)=>{
        // de-duplicate identical raw payloads by JSON string
        const key = JSON.stringify(detail);
        if (chips.some(c => JSON.stringify(c.raw) === key)) return chips;
        return [...chips, { id, text: line, raw: detail }];
      });
    }
    window.addEventListener('ai:insight-request', onInsightRequest);
    window.addEventListener('ai:context-add', onContextAdd);
    return () => { window.removeEventListener('ai:insight-request', onInsightRequest); window.removeEventListener('ai:context-add', onContextAdd); };
  }, []);

  // Global ESC handler to clear all chips
  useEffect(()=>{
    function onKey(e){ if (e.key === 'Escape') setContextChips([]); }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[]);

  async function sendMessage() {
    const textRaw = inputValue.trim();
    if (!textRaw) return;

    setMessages(m => [...m, { id: Date.now(), type: "user", content: textRaw.replace(/\n/g,'<br/>') }]);
    setInputValue("");
    setIsLoading(true);

    const focus = window.__pd_focus || null;
    const snapshot = snapshotGetter?.() || window.__pd_snapshot || null;
    const extras = { snapshot, focus, contextPoints: contextChips.map(c=>c.raw) };

    try {
      const { agent, cleaned } = parseAgentFromText(textRaw);
      const session = ensureAISession({ app_name: agent }); // routes to /run_sse or /run_sse_agent automatically
      // Prepend a short instruction to compare multiple points if chips exist
      const compareHint = contextChips.length > 1
        ? `Compare the selected points: summarize relationships/similarities/differences and give 2-3 actionable next steps.`
        : '';
      const prompt = buildSimplePrompt({ text: `${compareHint}\n${cleaned}`.trim(), agent, mode, extras });

      const parts = [];
      for await (const chunk of AIResponseDashboardWithViz(prompt, session)) {
        if (chunk === '[DONE]') break;
        if (chunk === '[ERROR]') {
          parts.push({ agent: 'system', text: 'AIResponseDashboard error' });
          break;
        }
        if (typeof chunk === 'object') {
          const a = chunk.agent || agent;
          const t = (chunk.text || '').trim();
          if (t) parts.push({ agent: a, text: t });
        } else if (typeof chunk === 'string' && chunk.trim()) {
          parts.push({ agent, text: chunk.trim() });
        }
      }

      const sanitize = (s) => (s || "").replace(/\*{3,}/g, "").trim();
      if (!parts.length) {
        setMessages(prev => [...prev, { id: Date.now(), type: "bot", content: "(no answer)" }]);
      } else {
        // Merge multiple streamed parts into a single bubble and handle XML responses
        const merged = parts.map(p => p.text).join("\n\n");
        let clean = sanitize(merged);
        
        // Handle XML response format from orchestrator agent
        const xmlMatch = clean.match(/<response>\s*<detailed_response>(.*?)<\/detailed_response>\s*<speak>(.*?)<\/speak>\s*<\/response>/s);
        if (xmlMatch) {
          clean = xmlMatch[1].trim(); // Use detailed_response content
        } else {
          // Remove any remaining XML tags and ** markers
          clean = clean.replace(/<\/?[^>]+(>|$)/g, '').replace(/\*\*/g, '').trim();
        }
        
        const author = parts[0].agent;
        setMessages(prev => [...prev, { id: Date.now(), type: "bot", content: `${labelForAgent(author)}<br/><br/>${clean.replace(/\n/g,'<br/>')}` }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), type: "bot", content: `⚠️ ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e){
    const v = e.target.value;
    setInputValue(v);
    const m = v.match(/@([\w-]*)$/);
    if (m) {
      setMentionOpen(true);
      setMentionQuery(m[1] || '');
    } else {
      setMentionOpen(false);
      setMentionQuery('');
    }
  }

  // Mode controls UI
  const ModeSwitcher = (
    <div style={{ display:'flex', gap:6, marginBottom:8 }}>
      {[
        ['concise','Quick'],
        ['strategic','Strategic'],
        ['forecast','Forecast'],
      ].map(([id,label]) => (
        <button key={id} onClick={()=>setMode(id)}
          style={{ padding:'6px 10px', borderRadius:999, border: mode===id?'1px solid var(--electricCyan)':'1px solid #2b3446', background: mode===id?'rgba(0,224,255,.15)':'rgba(30,41,59,.5)', color:'#e5eefb', fontSize:12, cursor:'pointer' }}
          title={`${label} mode`}>
          {label}
        </button>
      ))}
    </div>
  );
  function handleKeyPress(e){ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  function renderAgentMessage(html) { return html; }

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: "fixed", bottom: "20px", right: "20px", width: "60px", height: "60px",
            borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            border: "none", color: "white", fontSize: "24px", cursor: "pointer",
            boxShadow: "0 8px 32px rgba(59,130,246,0.4)", zIndex: 1001,
          }}
          title="Open AI Assistant"
        >🤖</button>
      )}

      {isChatOpen && (
        <div
          style={{
            position: "fixed", top: 0, right: 0, width: "360px", height: "100vh",
            background: "linear-gradient(135deg, rgba(26,31,46,0.98), rgba(42,47,62,0.98))",
            borderLeft: "1px solid rgba(59,130,246,0.3)", zIndex: 1002,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* header */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(58,68,89,0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Enhanced AI Assistant</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Ready with @mentions</div>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          {/* mode selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 12px 8px 12px" }}>
            {MODE_LIST.map((m) => {
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  style={{
                    textAlign: "left", borderRadius: 12, padding: "10px 12px",
                    background: active ? "rgba(39,46,63,0.95)" : "rgba(32,38,52,0.85)",
                    border: active ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)" }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: "14px" }}>{m.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* mentions selector */}
          <div style={{ padding: "8px 12px 0 12px", display:'flex', gap:6, flexWrap:'wrap' }}>
            {[
              { key:'orchestrator', label:'@orchestrator', color:'#60a5fa' },
              { key:'customer',     label:'@customer',     color:'#22d3ee' },
              { key:'sales',        label:'@sales',        color:'#34d399' },
              { key:'inventory',    label:'@inventory',    color:'#a78bfa' },
              { key:'finance',      label:'@finance',      color:'#fbbf24' },
            ].map((m)=> (
              <button key={m.key} onClick={()=> setInputValue(v => (v? v+` ${m.label} ` : `${m.label} `))}
                style={{ padding:'6px 10px', borderRadius:999, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(32,38,52,0.85)', color:m.color, fontSize:12, cursor:'pointer' }}
                title={`Insert ${m.label}`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* executive dashboard (live PD data) */}
          <div style={{ padding: "0 12px 6px 12px" }}>
            <div style={{ borderRadius: 10, background: "rgba(27,31,41,0.92)", border: "1px solid rgba(255,255,255,0.08)", padding: 10 }}>
              <div style={{ color: "#7dd3fc", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>◆ Executive Dashboard Update</div>
              {execSummary.loading && (
                <div style={{ fontSize:12, color:"var(--text-muted)" }}>Loading latest metrics…</div>
              )}
              {execSummary.error && (
                <div style={{ fontSize:12, color:"#fca5a5" }}>⚠ {execSummary.error}</div>
              )}
              {execSummary.data && (()=>{
                const k = execSummary.data.kpis || {};
                const viz = execSummary.data.visualizationData || {};
                const snapshot = snapshotGetter?.() || window.__pd_snapshot || null;
                const selKPI = snapshot?.selectedKPI || Object.keys(viz.performanceExplorer||{})[0] || null;
                const series = selKPI && viz.performanceExplorer ? (viz.performanceExplorer[selKPI]||[]) : [];
                const last = series[series.length-1] || {};
                const fmt = (n,is$=false)=>{
                  const v = Number(n); if(!Number.isFinite(v)) return '—';
                  return is$ ? new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v)
                              : new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(v);
                };
                const isCurrency = /revenue|amount|value|aov/i.test(selKPI||'');
                return (
                  <div style={{ display:'grid', gap:4 }}>
                    <div style={{ fontSize:12 }}><span style={{ color:"var(--text-muted)" }}>Focus KPI:</span> <b>{selKPI || '—'}</b></div>
                    <div style={{ fontSize:12 }}><span style={{ color:"var(--text-muted)" }}>Latest:</span> {fmt(last.actual, isCurrency)} (<span style={{ color: (last.deviation||0)>=0? '#10b981':'#ef4444' }}>{(last.deviation||0)>=0? '+':''}{fmt(last.deviation, isCurrency)}</span> vs predicted)</div>
                    <div style={{ fontSize:12 }}><span style={{ color:"var(--text-muted)" }}>Avg Deviation:</span> {(Number(k.averageDeviation||0)*100).toFixed(1)}%</div>
                    <div style={{ fontSize:12 }}><span style={{ color:"var(--text-muted)" }}>Anomalies:</span> {k.anomalyCount ?? 0}</div>
                    <div style={{ fontSize:12 }}><span style={{ color:"var(--text-muted)" }}>Top Factor:</span> {String(k.topFactor||'—').replace(/_/g,' ')}</div>
                    <div style={{ fontSize:12 }}><span style={{ color:"var(--text-muted)" }}>Recommendation:</span> { (last.deviation||0) < 0 ? 'Investigate drivers; consider targeted promos and inventory balancing.' : 'Amplify performing segments; sustain marketing cadence.' }</div>
              </div>
                );
              })()}
            </div>
          </div>

          

          {selectedChipId && (()=>{
            const chip = contextChips.find(c=>c.id===selectedChipId);
            if (!chip) return null;
            return (
              <div style={{ padding:'0 12px 6px 12px' }}>
                <div style={{ border:'1px solid rgba(58,68,89,0.5)', background:'rgba(23,29,43,0.9)', borderRadius:10, padding:10, color:'#e5eefb' }}>
                  <div style={{ fontSize:12, color:'#9fb3c8', marginBottom:4 }}>Selected context</div>
                  <div style={{ fontSize:13, marginBottom:6 }}>{chip.text}</div>
                  <pre style={{ margin:0, padding:8, background:'rgba(0,0,0,0.25)', borderRadius:8, fontSize:11, maxHeight:120, overflow:'auto' }}>{JSON.stringify(chip.raw, null, 2)}</pre>
                </div>
              </div>
            );
          })()}

          {/* messages */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.type === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "85%", padding: "12px 14px",
                    borderRadius: m.type === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                    background: m.type === "user"
                      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                      : "linear-gradient(135deg, rgba(30,39,56,0.8), rgba(44,51,65,0.8))",
                    color: "var(--text-strong)",
                    border: m.type === "user" ? "none" : "1px solid rgba(58,68,89,0.3)",
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: renderAgentMessage(m.content) }} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "12px 14px", borderRadius: "20px 20px 20px 6px", background: "linear-gradient(135deg, rgba(30,39,56,0.8), rgba(44,51,65,0.8))", border: "1px solid rgba(58,68,89,0.3)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s` }} />
                    ))}
                    <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 12 }}>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* chips just above input (collapsible) */}
          {contextChips.length > 0 && (
            <div style={{ padding: '10px 12px', background: 'rgba(0,224,255,0.03)', borderTop: '1px solid rgba(0,224,255,0.1)', borderBottom: '1px solid rgba(0,224,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'rgba(247,249,251,0.6)', marginBottom: chipsCollapsed ? 0 : 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={()=> setChipsCollapsed(v=>!v)} title={chipsCollapsed? 'Expand' : 'Collapse'}
                          style={{ background:'transparent', border:'none', color:'#00e0ff', cursor:'pointer', fontSize:14, lineHeight:1 }}>
                    {chipsCollapsed ? '▸' : '▾'}
                  </button>
                  <span style={{ color: '#00e0ff', fontSize: 8 }}>●</span>
                  <span>Selected Points ({contextChips.length})</span>
                  {contextChips.length > 1 && (<span style={{ fontSize: 10, opacity: .5 }}>Shift+click to add more</span>)}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={()=>{ setContextChips([]); setSelectedChipId(null); }} title="Clear all selections"
                    style={{ background:'transparent', border:'none', color:'rgba(247,249,251,0.4)', cursor:'pointer', padding:'2px 6px', fontSize:16, lineHeight:1 }}>×</button>
                </div>
              </div>
              {!chipsCollapsed && (
                <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight: contextChips.length>2 ? 96 : 'auto', overflowY: contextChips.length>2 ? 'auto' : 'visible' }}>
                  {contextChips.map((chip, index) => (
                    <div key={chip.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#f8fafc', padding:'4px 8px', background:'rgba(0,224,255,0.05)', borderRadius:6, border:'1px solid rgba(0,224,255,0.1)', position:'relative', paddingRight:32 }}>
                      <span style={{ fontSize:11, opacity:.5, minWidth:16 }}>{index+1}.</span>
                      <span style={{ fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:240 }}>{chip.text}</span>
                      <span style={{ fontSize:10, padding:'2px 6px', background:'rgba(0,224,255,0.1)', borderRadius:4, color:'#00e0ff', marginLeft:'auto', marginRight:24 }}>Context</span>
                      <button onClick={()=>{ setContextChips(chips => chips.filter(c=>c.id!==chip.id)); if (selectedChipId===chip.id) setSelectedChipId(null); }}
                        title="Remove this point" style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'rgba(247,249,251,0.3)', cursor:'pointer', padding:'2px 4px', fontSize:14, lineHeight:1 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* input */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(58,68,89,0.3)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", position: "relative" }}>
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about performance… or use @ to call an agent"
                style={{
                  width: "100%", minHeight: 44, maxHeight: 120, padding: "12px 16px",
                  borderRadius: 12, border: "1px solid rgba(58,68,89,0.5)",
                  background: "rgba(30,39,56,0.6)", color: "var(--text-strong)",
                  fontSize: 14, outline: "none", resize: "none",
                }}
              />
              {/* mention typeahead */}
              {mentionOpen && (
                <div style={{ position:'absolute', left:14, bottom:54, background:'rgba(23,29,43,0.98)', border:'1px solid rgba(58,68,89,0.6)', borderRadius:8, padding:6, zIndex:5, minWidth:180 }}>
                  {AGENT_LIST.filter(a=> a.name.includes(mentionQuery.toLowerCase())).map(a => (
                    <div key={a.name}
                      onMouseDown={(e)=>{ e.preventDefault(); }}
                      onClick={()=>{
                        // insert @mention at end
                        setInputValue(v => `${v.replace(/@[^\s]*$/, '').trim()} @${a.name} `);
                        setMentionOpen(false); setMentionQuery('');
                      }}
                      style={{ padding:'6px 8px', borderRadius:6, color:'#e5eefb', cursor:'pointer' }}>
                      {a.avatar} @{a.name}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  padding: "12px 18px", borderRadius: 12, border: "none",
                  background: inputValue.trim() && !isLoading ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "rgba(58,68,89,0.5)",
                  color: inputValue.trim() && !isLoading ? "#ffffff" : "var(--text-muted)",
                  cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
                  fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, minWidth: 80, justifyContent: "center",
                }}
              >
                <span>Send</span>
                <span>🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: .5 }
          50% { transform: scale(1.1); opacity: 1 }
          100% { transform: scale(1); opacity: .5 }
        }
      `}</style>
    </>
  );
}
