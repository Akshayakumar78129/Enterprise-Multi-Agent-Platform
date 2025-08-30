import React, { useState, useEffect, useCallback, useRef } from "react";
import PurchaseFrequencyKPIs from "../components/kpi/PurchaseFrequencyKPIs";
// import FrequencyDistribution from "../components/visualizations/FrequencyDistribution";
import FrequencyParetoChart from "../components/visualizations/FrequencyParetoChart";
import CustomerSegmentQuadrant from "../components/visualizations/CustomerSegmentQuadrant";
// import ValueSegmentTreemap from "../components/visualizations/ValueSegmentTreemap";
import CustomerLifecycleJourney from "../components/visualizations/CustomerLifecycleJourney";
import PurchaseIntervalHeatmap from "../components/visualizations/PurchaseIntervalHeatmap";
import Insight from "../components/Insight";
import InsightModal from "../components/InsightModal";
import FloatingAIChat from "../../../../../ui-common/FloatingAIChat";
import { callDashboardAPI, getErrorMessage } from '../../../../../ui-common/utils/apiUtils.js';
import styles from './PurchaseFrequencyDashboard.module.css';
import { SegmentsCategoriesFilter } from "../../../transaction_patterns/ui/components/filters/SegmentsCategoriesFilter";
import { PurchaseFrequencyDateRangeFilter } from "../components/filters/PurchaseFrequencyDateRangeFilter";
import { FloatingPFAgent } from "../components/bi-agent/FloatingPFAgent";

// Lightweight Markdown-ish renderer for top AI output
const renderLLM = (text) => {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let currentList = null; // { type: 'ul'|'ol', items: [] }
  const escapeHtml = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline = (s) => {
    let html = escapeHtml(s);
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/\*(?!\*)([^*]+)\*/g, '<em>$1</em>');
    return html;
  };
  const flushList = () => {
    if (currentList) {
      const Tag = currentList.type === 'ol' ? 'ol' : 'ul';
      blocks.push(
        <Tag style={{ margin: '6px 0 10px 18px' }} key={`list-${blocks.length}`}>
          {currentList.items.map((it, idx)=>(<li key={idx} style={{ marginBottom:4 }} dangerouslySetInnerHTML={{ __html: inline(it) }} />))}
        </Tag>
      );
      currentList = null;
    }
  };
  lines.forEach((raw,i)=>{
    const line = raw.trim();
    if (!line){ flushList(); return; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h){
      flushList();
      const level = h[1].length; const content = h[2];
      const style = { margin:'8px 0 4px', color:'#a5b4fc', fontWeight:600, fontSize: level===1?18: level===2?16:14 };
      const Tag = level===1? 'h4' : level===2? 'h5' : 'h6';
      blocks.push(<Tag style={style} key={`h-${i}`} dangerouslySetInnerHTML={{ __html: inline(content) }} />);
      return;
    }
    if (/^([-*•])\s+/.test(line)){
      const content = line.replace(/^([-*•])\s+/, '');
      if (!currentList || currentList.type!=='ul') currentList = { type:'ul', items:[] };
      currentList.items.push(content); return;
    }
    const ol = line.match(/^(\d+)[\)\.]\s+(.*)$/);
    if (ol){
      const content = ol[2];
      if (!currentList || currentList.type!=='ol') currentList = { type:'ol', items:[] };
      currentList.items.push(content); return;
    }
    flushList();
    blocks.push(<p style={{ margin:'6px 0' }} key={`p-${i}`} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
  });
  flushList();
  return <div>{blocks}</div>;
};

const PurchaseFrequencyDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubtitle, setModalSubtitle] = useState('');
  const [modalMetrics, setModalMetrics] = useState([]);
  const [modalBullets, setModalBullets] = useState([]);
  const [modalContext, setModalContext] = useState(null);
  const [modalStaticPoints, setModalStaticPoints] = useState([]);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAudit, setAiAudit] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: {
      start: '2017-01-01', // Use historical data range
      end: '2021-12-31'    // End of available data
    },
    customerSegments: [], // [{ category, label }]
    productCategories: [] // [label]
  });

  // Mirror state for UI control
  const [selectedSegments, setSelectedSegments] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Handler from SegmentsCategoriesFilter
  const handleSegmentsCategoriesChange = (segmentsObj, categoriesArr) => {
    setSelectedSegments(segmentsObj || {});
    setSelectedCategories(categoriesArr || []);
    const flattened = Object.entries(segmentsObj || {}).flatMap(([type, arr]) =>
      (arr || []).map(label => ({ category: type, label }))
    );
    setFilters(prev => ({
      ...prev,
      customerSegments: flattened,
      productCategories: categoriesArr || []
    }));
  };

  // Handler for date range changes
  const handleDateRangeChange = (dateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange
    }));
  };
  const [topAskLoading, setTopAskLoading] = useState(false);
  const [topAskText, setTopAskText] = useState('');
  const [topAskAudit, setTopAskAudit] = useState(null);
  
  // Dashboard state
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedValueSegment, setSelectedValueSegment] = useState(null);

  // Connect BI-agent segment selection to dashboard filter
  useEffect(() => {
    const onPfSelect = (e) => {
      try {
        const seg = e?.detail?.segment;
        if (!seg) return;
        setSelectedSegment(seg);
        // Optionally scroll to segment quadrant
        const el = document.querySelector('[data-chart="segment-quadrant"]');
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
    };
    if (typeof window !== 'undefined') window.addEventListener('pf-select-segment', onPfSelect);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('pf-select-segment', onPfSelect); };
  }, []);

  // Shift+click multi-selection state (similar to transaction patterns)
  const [selectedPoints, setSelectedPoints] = useState([]);

  // Removed BI auto-insights and remount logic
  const [chatInsights, setChatInsights] = useState([]);
  const [chatSeed, setChatSeed] = useState(1); // retained but no longer used for BI prompts
  
  // Shift+Click toast
  const [showShiftClickToast, setShowShiftClickToast] = useState(false);

  // Business Intelligence Analysis state
  const [biAnalysisLoading, setBiAnalysisLoading] = useState(false);
  const [biAnalysisResult, setBiAnalysisResult] = useState(null);

  // Selection panel state for dragging
  const [selPanelPos, setSelPanelPos] = useState({ x: 0, y: 0 });
  const [isDraggingSel, setIsDraggingSel] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [selEverPositioned, setSelEverPositioned] = useState(false);
  const selPanelRef = useRef(null);

  useEffect(() => {
    if (selectedPoints.length > 0 && !selEverPositioned) {
      const chartEl = document.querySelector(`[data-chart-id="${selectedPoints[0].chartId}"]`);
      if (chartEl && selPanelRef.current) {
        const chartRect = chartEl.getBoundingClientRect();
        const panelRect = selPanelRef.current.getBoundingClientRect();
        setSelPanelPos({
          x: chartRect.right - panelRect.width - 10,
          y: chartRect.top + 10
        });
        setSelEverPositioned(true);
      }
    } else if (selectedPoints.length === 0) {
      setSelEverPositioned(false);
    }
  }, [selectedPoints, selEverPositioned]);

  // Selection helpers
  const handleChartClick = (point, isShiftClick) => {
    if (!point) {
      setSelectedPoints([]);
      return;
    }
    const key = `${point.chartId}-${point.label}-${point.index}`;
    setSelectedPoints(prev => {
      const exists = prev.some(p => `${p.chartId}-${p.label}-${p.index}` === key);
      if (isShiftClick) {
        if (exists) return prev.filter(p => `${p.chartId}-${p.label}-${p.index}` !== key);
        setShowShiftClickToast(true);
        setTimeout(()=>setShowShiftClickToast(false), 2500);
        return [...prev, { ...point, key }];
      }
      return exists && prev.length === 1 ? [] : [{ ...point, key }];
    });
  };

  // Build derived analytics from selected points for BI and LLM context
  const buildSelectionDerivedInsights = useCallback((points, data) => {
    const items = [];
    const sections = [];
    if (!points || !points.length) return { items, sections, summaryText: 'No selection.' };

    // Group by chartId
    const byChart = points.reduce((acc, p) => {
      if (!acc[p.chartId]) acc[p.chartId] = [];
      acc[p.chartId].push(p);
      return acc;
    }, {});

    const lines = [];
    Object.entries(byChart).forEach(([chartId, arr]) => {
      const count = arr.length;
      const sum = arr.reduce((s, p) => s + (Number(p.value)||0), 0);
      const maxP = arr.reduce((m, p) => (m==null || p.value > m.value) ? p : m, null);
      const minP = arr.reduce((m, p) => (m==null || p.value < m.value) ? p : m, null);

      // KPI context if available
      const kpis = data?.kpis || null;
      let share = null;
      if (kpis && typeof kpis.totalCustomers === 'number' && (chartId === 'frequency_distribution' || chartId === 'customer_segments' || chartId === 'value_segments')) {
        share = kpis.totalCustomers ? ((sum / kpis.totalCustomers) * 100) : null;
      }

      items.push({
        label: `${chartId} (${count} pts)`,
        status: 'neutral',
        metrics: {
          'Total': (sum || 0).toLocaleString(),
          ...(share!=null ? { 'Share of Total Customers': `${share.toFixed(1)}%` } : {}),
          ...(maxP ? { 'Peak': `${maxP.label || maxP.index}: ${Number(maxP.value||0).toLocaleString()}` } : {}),
          ...(minP ? { 'Low': `${minP.label || minP.index}: ${Number(minP.value||0).toLocaleString()}` } : {})
        }
      });

      const sectionParts = [];
      if (share!=null) sectionParts.push(`Represents ${share.toFixed(1)}% of total customers.`);
      if (maxP && minP && Number(minP.value||0) > 0) {
        const lift = ((Number(maxP.value)-Number(minP.value))/Number(minP.value))*100;
        if (isFinite(lift)) sectionParts.push(`Peak vs low variance approx ${lift.toFixed(1)}%.`);
      }
      if (sectionParts.length) sections.push({ title: `${chartId} Insights`, content: sectionParts.join(' ') });

      lines.push(`- ${chartId}: total=${(sum||0).toLocaleString()}${share!=null?`, share=${share.toFixed(1)}%`:''}${maxP?`, peak=${maxP.label||maxP.index}`:''}`);
    });

    const summaryText = ['Selection Analytics:', ...lines].join('\n');
    return { items, sections, summaryText };
  }, []);

  // Business Intelligence Analysis function
  const performBusinessIntelligenceAnalysis = async () => {
    // BI analysis disabled
    setBiAnalysisLoading(false);
    setBiAnalysisResult({
      type: 'error',
      content: 'Business Intelligence analysis is disabled.'
    });
  };

  const openModal = (title, subtitle, metrics, bullets, rawContext, staticPoints=[]) => {
    setModalTitle(title);
    setModalSubtitle(subtitle || '');
    setModalMetrics(metrics || []);
    setModalBullets(bullets || []);
    setModalContext(rawContext || null);
    setModalStaticPoints(staticPoints || []);
    setAiText('');
    setModalOpen(true);
  };

  // AI assistant for top bar
  const askAITop = async (prompt, mode='quick') => {
    if (!prompt) return;
    try {
      setTopAskLoading(true);
      setTopAskText('');
      setTopAskAudit(null);
      const hasMention = /@[a-zA-Z_]+/.test(prompt);
      if (hasMention) {
        const resp = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, appName: 'web', userId: 'demo-user', sessionId: 'pf-dashboard' })
        });
        const raw = await resp.text();
        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          throw new Error(`Assistant returned non-JSON: ${raw.slice(0,120)}`);
        }
        if (!resp.ok) throw new Error(json?.error || 'Assistant error');
        setTopAskText(json.text || '');
        setTopAskAudit(json.audit || null);
      } else {
        const resp = await fetch('/api/insights/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            context: {
              filters,
              kpis: data?.kpis,
              frequencyDistribution: data?.frequencyDistribution,
              customerSegments: data?.customerSegments,
              valueSegments: data?.valueSegments,
            },
            mode,
            action: 'explain'
          })
        });
        const raw = await resp.text();
        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          throw new Error(`Explain returned non-JSON: ${raw.slice(0,120)}`);
        }
        setTopAskText((json.text || json.explanation || '').trim() || 'No AI response. Try rephrasing or add @agent mention.');
      }
    } catch (e) {
      setTopAskText(`AI error: ${e.message}`);
    } finally {
      setTopAskLoading(false);
    }
  };

  const askAI = async (userPrompt='', mode='strategic', action='explain') => {
    try {
      setAiLoading(true);
      setAiText('');
      setAiAudit(null);
      const isFollowup = action === 'followup';
      const prompt = isFollowup && userPrompt?.trim()
        ? userPrompt.trim()
        : `Explain: ${modalTitle} - ${modalSubtitle}`;
      const hasMention = /@[a-zA-Z_]+/.test(prompt);
      if (hasMention) {
        const resp = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, appName: 'web', userId: 'demo-user', sessionId: 'pf-modal' })
        });
        const raw = await resp.text();
        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          throw new Error(`Assistant returned non-JSON: ${raw.slice(0,120)}`);
        }
        if (!resp.ok) throw new Error(json?.error || 'Assistant error');
        setAiText(json.text || '');
        setAiAudit(json.audit || null);
      } else {
        const resp = await fetch('/api/insights/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            context: modalContext || data,
            mode,
            action
          })
        });
        const raw = await resp.text();
        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          throw new Error(`Explain returned non-JSON: ${raw.slice(0,120)}`);
        }
        if (!resp.ok) {
          const detail = json?.error || json?.message || resp.statusText;
          setAiText(`AI error: ${detail}`);
        } else {
          setAiText((json.text || json.explanation || '').trim() || 'No AI response received. Please try again in a moment.');
        }
      }
    } catch (e) {
      setAiText(`AI error: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };



  // Helper: derive static insights for a context
  const deriveStaticInsights = useCallback((ctx) => {
    try {
      if (!ctx) return [];
      const list = [];
      if (ctx.kind === 'kpi' && ctx.data?.kpis) {
        const kpis = ctx.data.kpis;
        if (kpis.totalCustomers) list.push(`Total customers analyzed: ${kpis.totalCustomers.toLocaleString()}`);
        if (kpis.avgPurchaseFrequency) list.push(`Average purchase frequency: ${kpis.avgPurchaseFrequency.toFixed(2)} purchases per customer`);
        if (kpis.avgDaysBetween) list.push(`Average days between purchases: ${kpis.avgDaysBetween.toFixed(1)} days`);
        if (kpis.activeCustomerPercentage) list.push(`Active customers (90d): ${kpis.activeCustomerPercentage.toFixed(1)}%`);
        if (kpis.highValuePercentage) list.push(`High value customers: ${kpis.highValuePercentage.toFixed(1)}%`);
      } else if (ctx.kind === 'frequency_bin' && ctx.data?.bin) {
        const b = ctx.data.bin;
        list.push(`Frequency bin: ${b.bin}`);
        list.push(`Customer count: ${b.count}`);
        if (b.percentage) list.push(`Share of total: ${b.percentage}%`);
      } else if (ctx.kind === 'customer_segment' && ctx.data?.segment) {
        const s = ctx.data.segment;
        list.push(`Segment: ${s.segment}`);
        list.push(`Customer count: ${s.customerCount || 'N/A'}`);
        if (s.avgValue) list.push(`Average value: $${s.avgValue.toFixed(2)}`);
      } else if (ctx.kind === 'value_segment' && ctx.data?.segment) {
        const s = ctx.data.segment;
        list.push(`Value segment: ${s.segment}`);
        list.push(`Customer count: ${s.customerCount || 'N/A'}`);
        if (s.totalValue) list.push(`Total value: $${s.totalValue.toLocaleString()}`);
      }
      return list.slice(0,6);
    } catch { return []; }
  }, []);

  // Helper: parse up to three AI insights from text
  const extractTopThreeAIInsights = (text) => {
    if (!text) return [];
    const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
    // Prefer bullet / numbered lines
    let bullets = lines.filter(l => /^[-•*\d]/.test(l));
    if (bullets.length === 0) bullets = lines;
    return bullets.slice(0,3).map((content, idx) => ({
      id: `auto-ai-${Date.now()}-${idx}`,
      title: `AI Insight ${idx+1}`,
      content: content.replace(/^[-•*\d.\s]+/, ''),
      priority: 2
    }));
  };

  // Heuristic fallback AI insights if model returns empty/irrelevant
  const heuristicAIInsights = (contextType, richCtx) => {
    const items = [];
    try {
      if (contextType === 'kpi' && richCtx?.data?.kpis) {
        const k = richCtx.data.kpis;
        if (k.totalCustomers && k.avgPurchaseFrequency) {
          items.push(`Customer base of ${k.totalCustomers.toLocaleString()} with average frequency of ${k.avgPurchaseFrequency.toFixed(2)} suggests ${(k.avgPurchaseFrequency>3)?'strong':'moderate'} customer loyalty.`);
        }
        if (k.avgDaysBetween !== undefined) {
          items.push(`Purchase interval of ${k.avgDaysBetween.toFixed(1)} days ${k.avgDaysBetween>90?'indicates opportunity for retention campaigns':'shows healthy engagement frequency.'}`);
        }
        if (k.activeCustomerPercentage !== undefined) {
          items.push(`Active customer rate of ${k.activeCustomerPercentage.toFixed(1)}% ${k.activeCustomerPercentage<30?'signals need for reactivation efforts':'demonstrates good customer engagement.'}`);
        }
      } else if (contextType === 'frequency_bin' && richCtx?.data?.bin) {
        const b = richCtx.data.bin;
        items.push(`Frequency bin "${b.bin}" contains ${b.count} customers (${b.percentage}% of base).`);
        if (b.bin === '1') items.push('Single-purchase customers may benefit from onboarding and retention campaigns.');
        else if (b.bin.includes('20+')) items.push('High-frequency customers represent your most loyal segment - focus on premium offerings.');
      } else if (contextType === 'customer_segment' && richCtx?.data?.segment) {
        const s = richCtx.data.segment;
        items.push(`Segment "${s.segment}" analysis shows customer behavior patterns.`);
        if (s.avgValue) items.push(`Average value of $${s.avgValue.toFixed(2)} indicates ${s.avgValue>100?'premium':'standard'} customer tier.`);
      }
    } catch {}
    return items.slice(0,3).map((content, idx) => ({
      id: `heuristic-${Date.now()}-${idx}`,
      title: `Business Insight ${idx+1}`,
      content,
      priority: 2
    }));
  };

  const handleBinSelect = (bin, event) => {
  // Removed: shift+click bin selection logic
  return;
  };

  const handleSegmentSelect = (segment, event) => {
  // Removed: shift+click segment selection logic
  return;
  };

  const handleValueSegmentSelect = (segmentName, event) => {
  // Removed: shift+click value segment selection logic
  return;
  };

  // KPI click handler for shift+click functionality
  // Removed: shift+click KPI selection logic

  // Data fetch on filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await callDashboardAPI('purchase-frequency', filters);
        
        console.log('✅ Purchase frequency data received:', result);
        console.log('📊 Frequency Distribution:', result.frequencyDistribution);
        console.log('👥 Customer Segments:', result.customerSegments?.length);
        console.log('💰 Value Segments:', result.valueSegments?.length);

        // Normalize valueSegments numbers (strip commas/spaces)
        if (Array.isArray(result?.valueSegments)) {
          result.valueSegments = result.valueSegments.map(seg => ({
            ...seg,
            avgValue: typeof seg.avgValue === 'string' ? Number(seg.avgValue.replace(/[^0-9.\-]/g, '')) : seg.avgValue,
            totalValue: typeof seg.totalValue === 'string' ? Number(seg.totalValue.replace(/[^0-9.\-]/g, '')) : seg.totalValue,
            customerCount: typeof seg.customerCount === 'string' ? Number(seg.customerCount.replace(/[^0-9.\-]/g, '')) : seg.customerCount,
            percentage: typeof seg.percentage === 'string' ? Number(String(seg.percentage).replace(/[^0-9.\-]/g, '')) : seg.percentage,
          }));
        }
        
        // Force re-render by adding a timestamp to data
        const dataWithTimestamp = {
          ...result,
          _timestamp: Date.now()
        };
        
        setData(dataWithTimestamp);
        generateInsights(dataWithTimestamp);
      } catch (err) {
        console.error("Error fetching purchase frequency data:", err);
        const userFriendlyMessage = getErrorMessage(err);
        setError(userFriendlyMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Load client-side mappings for segment & category filtering (no server API changes)
  useEffect(() => {
    let cancelled = false;
    async function loadMappings() {
      try {
        const resp = await fetch('/api/transaction-patterns/mappings');
        if (!resp.ok) return;
        const j = await resp.json();
        const data = j?.data || j;
        if (!cancelled && data) {
          if (data.productCategories) window.transactionPatternsCategoryMap = data.productCategories;
          if (data.customerSegments) window.transactionPatternsCustomerMap = data.customerSegments;
        }
      } catch {}
    }
    if (typeof window !== 'undefined') loadMappings();
    return () => { cancelled = true; };
  }, []);



  const generateInsights = (data) => {
    if (!data) {
      setInsights(null);
      return;
    }

    const { kpis, customerSegments } = data;
    const segments = Array.isArray(customerSegments) ? customerSegments : [];
    const totalCustomers = segments.length || 1; // avoid divide-by-zero
    const highValueCustomers = segments.filter(c => c.segment === 'High Value').length;
    const loyalCustomers = segments.filter(c => c.segment === 'Loyal').length;

    // kpis shape can be an object (preferred) or an array of {id, value}
    let avgDaysBetween = null;
    if (kpis && typeof kpis === 'object' && !Array.isArray(kpis)) {
      // object shape
      if (typeof kpis.avgDaysBetween === 'number') avgDaysBetween = kpis.avgDaysBetween;
      else if (typeof kpis.avgPurchaseFrequency === 'number' && kpis.avgPurchaseFrequency > 0) {
        avgDaysBetween = 365 / kpis.avgPurchaseFrequency;
      }
    } else if (Array.isArray(kpis)) {
      const daysBetweenEntry = kpis.find(k => k.id === 'avg_days_between');
      const freqEntry = kpis.find(k => k.id === 'avg_purchase_frequency');
      if (daysBetweenEntry && typeof daysBetweenEntry.value === 'number') avgDaysBetween = daysBetweenEntry.value;
      else if (freqEntry && typeof freqEntry.value === 'number' && freqEntry.value > 0) avgDaysBetween = 365 / freqEntry.value;
    }

    const avgDaysText = typeof avgDaysBetween === 'number' ? avgDaysBetween.toFixed(1) : 'N/A';

    const generated = {
      highValue: `High-value customers make up ${((highValueCustomers / totalCustomers) * 100).toFixed(1)}% of the customer base.`,
      loyal: `Loyal customers, who purchase frequently, represent ${((loyalCustomers / totalCustomers) * 100).toFixed(1)}% of all customers.`,
      avgFrequency: `On average, a customer makes a purchase every ${avgDaysText} days.`
    };
    setInsights(generated);
  };

  // Filter data based on selections (merged logic: original + segments/categories)
  const getFilteredData = useCallback(() => {
    if (!data) return data;

    let filteredCustomerSegments = Array.isArray(data.customerSegments) ? [...data.customerSegments] : [];
    let filteredMainData = Array.isArray(data.mainData) ? [...data.mainData] : [];

    // Apply frequency bin filter (existing behavior)
    if (selectedBin) {
      const binRange = selectedBin === '20+' ? [20, Infinity] :
                      selectedBin.includes('-') ? 
                        selectedBin.split('-').map(Number) :
                        [parseInt(selectedBin), parseInt(selectedBin)];
      filteredMainData = filteredMainData.filter(customer => 
        customer.total_purchases >= binRange[0] && 
        customer.total_purchases <= binRange[1]
      );
      const filteredCustomerIds = new Set(filteredMainData.map(c => c['Customer Key']));
      filteredCustomerSegments = filteredCustomerSegments.filter(c => filteredCustomerIds.has(c.customerId));
    }

    // Apply direct single-segment selection (existing behavior)
    if (selectedSegment) {
      filteredCustomerSegments = filteredCustomerSegments.filter(c => c.segment === selectedSegment);
      const filteredCustomerIds = new Set(filteredCustomerSegments.map(c => c.customerId));
      filteredMainData = filteredMainData.filter(c => filteredCustomerIds.has(c['Customer Key']));
    }

    // Apply SegmentsCategoriesFilter selections using client-side mappings (additive)
    const hasSegSelections = selectedSegments && Object.values(selectedSegments).some(arr => Array.isArray(arr) && arr.length>0);
    const hasCatSelections = Array.isArray(selectedCategories) && selectedCategories.length>0;
    const norm = (s) => (s||'').toString().toLowerCase();

    if (hasSegSelections) {
      const custMap = (typeof window !== 'undefined' && window.transactionPatternsCustomerMap) ? window.transactionPatternsCustomerMap : null;
      if (custMap && Array.isArray(filteredCustomerSegments)) {
        const segSet = Object.fromEntries(Object.entries(selectedSegments).map(([k, v]) => [k, new Set((v||[]).map(norm))]));
        filteredCustomerSegments = filteredCustomerSegments.filter(c => {
          const cid = c.customerId || c.customer_id || c.id;
          const m = cid != null ? custMap[cid] : null;
          if (!m) return true; // retain if unknown mapping
          const mkt = norm(m.market_desc); const mon = norm(m.monetary_band); const loy = norm(m.loyalty_status); const ctry = norm(m.customer_country);
          return ['market','monetary','loyalty','country'].every(key => {
            const sel = segSet[key];
            if (!sel || sel.size===0) return true;
            const val = key==='market'?mkt:key==='monetary'?mon:key==='loyalty'?loy:ctry;
            return sel.has(val);
          });
        });
      }
    }

    if (hasCatSelections) {
      const catMap = (typeof window !== 'undefined' && window.transactionPatternsCategoryMap) ? window.transactionPatternsCategoryMap : null;
      if (catMap && Array.isArray(filteredCustomerSegments)) {
        const toSet = new Set(selectedCategories.map(norm));
        filteredCustomerSegments = filteredCustomerSegments.filter(c => {
          const direct = c.category || c.item_category;
          if (direct) return toSet.has(norm(direct));
          const pkey = c.productKey || c.product_key || c.itemKey || c.item_key;
          if (pkey != null && catMap[pkey]) return toSet.has(norm(catMap[pkey]));
          return true; // retain if unknown
        });
      }
    }

    return { ...data, customerSegments: filteredCustomerSegments, mainData: filteredMainData };
  }, [data, selectedBin, selectedSegment, selectedSegments, selectedCategories]);

  const filteredData = getFilteredData();

  const downloadCSV = (filename, rows) => {
    const csv = rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const contextToCSV = (ctx) => {
    if (!ctx || typeof ctx !== 'object') return [['key','value'],['value', String(ctx)]];
    if (ctx.bin) return [['bin','count','percentage'], [ctx.bin, ctx.count, ctx.percentage]];
    if (ctx.segment) return [['segment','customers','avgValue'], [ctx.segment, ctx.segmentData?.length || '', (ctx.segmentData && (ctx.segmentData.reduce((a,c)=>a+c.monetaryValue,0)/(ctx.segmentData.length||1)).toFixed(2)) || '']];
    const rows = Object.entries(ctx).map(([k,v])=>[k, typeof v==='object'? JSON.stringify(v): v]);
    return [['key','value'], ...rows];
  };

  const onDownloadCSV = () => {
    const rows = contextToCSV(modalContext || {});
    downloadCSV('pf-insight.csv', rows);
  };

  const onFilterToThis = () => {
    // Apply context to current selection filters if present
    const ctx = modalContext || {};
    if (ctx.bin) setSelectedBin(ctx.bin);
    if (ctx.segment) setSelectedSegment(ctx.segment);
    setModalOpen(false);
  };

  // Error display must be at top-level of component, not inside nested function or block

  // Global shift+click handler removed per requirement
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Purchase <span className={styles.titleAccent}>Frequency</span> Insights
        </h1>
        <div style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{ 
        gridColumn: '1 / -1',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '16px'
      }}>
        <PurchaseFrequencyDateRangeFilter
          dateRange={filters.dateRange}
          onDateRangeChange={handleDateRangeChange}
          isLoading={isLoading}
          minDate="2017-01-01"
          maxDate="2021-12-31"
          compact={false}
        />
      </div>

        <div className={styles.filtersContainer}>
          {filters?.dateRange && (
            <span className={styles.filterChip}>
              Date: {filters.dateRange.start} → {filters.dateRange.end}
            </span>
          )}
          {selectedBin && (
            <span className={styles.filterChip}>
              Bin: {selectedBin}
            </span>
          )}
          {selectedSegment && (
            <span className={styles.filterChip}>
              Segment: {selectedSegment}
            </span>
          )}
          {(selectedBin || selectedSegment) && (
            <button onClick={()=>{ setSelectedBin(null); setSelectedSegment(null); }} className={styles.filterClearButton}>Clear filters</button>
          )}
        </div>

        {/* Segments + Categories Filter (shared with Transaction Patterns) */}
        <div style={{ 
          gridColumn: '1 / -1',
          marginBottom: '24px'
        }}>
          <SegmentsCategoriesFilter
            selectedSegments={selectedSegments}
            selectedCategories={selectedCategories}
            onChange={handleSegmentsCategoriesChange}
            isLoading={isLoading}
          />
        </div>

        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingTitle}>Loading Dashboard</div>
            <div className={styles.loadingSubtitle}>Fetching purchase frequency data…</div>
          </div>
        )}

        {filteredData && !isLoading && !error && (
          <>
            <div className={styles.kpiSection}>
              <PurchaseFrequencyKPIs 
                kpis={filteredData.kpis} 
                onHoverInsight={(info) => {
                  try {
                    if (info && window && window.dispatchEvent) {
                      // If you have a central panel, wire here. For now, log.
                      console.debug('KPI hover insight:', info);
                    }
                  } catch {}
                }}
              />
            </div>

            {insights && (
              <div className={styles.insightsSection}>
                <h3 className={styles.insightsTitle}>Key Insights</h3>
                <Insight title="High-Value Customers">{insights.highValue}</Insight>
                <Insight title="Loyal Customers">{insights.loyal}</Insight>
                <Insight title="Average Purchase Frequency">{insights.avgFrequency}</Insight>
              </div>
            )}

            <div className={styles.chartsGrid}>
              <div 
                className={styles.dashboardCard}
                data-type="chart"
                data-title="Purchase Frequency Distribution"
                data-chart-type="frequency_distribution"
              >
                <h3 className={styles.chartTitle}>Purchase Interval Heatmap</h3>
                <PurchaseIntervalHeatmap 
                  data={filteredData.intervalHeatmap}
                  isLoading={isLoading}
                  onShiftClick={(pointData, event) => {
                    if (event?.shiftKey && typeof window !== 'undefined' && window.addAIInsightToChat) {
                      window.addAIInsightToChat({
                        ...pointData,
                        chartType: 'Purchase Interval Heatmap',
                        originalEvent: event
                      });
                    }
                  }}
                />
              </div>

              <div 
                className={styles.dashboardCard}
                data-type="chart"
                data-title="Customer Segments"
                data-chart-type="customer_segments"
              >
                <h3 className={styles.chartTitle}>Customer Segments</h3>
                <CustomerSegmentQuadrant 
                  data={filteredData.customerSegments}
                  onSegmentSelect={handleSegmentSelect}
                  selectedSegment={selectedSegment}
                  onChartClick={handleChartClick}
                  selectedPoints={selectedPoints}
                  onShiftClick={(pointData, event) => {
                    if (event?.shiftKey && typeof window !== 'undefined' && window.addAIInsightToChat) {
                      window.addAIInsightToChat({
                        ...pointData,
                        chartType: 'Customer Segment Quadrant',
                        originalEvent: event
                      });
                    }
                  }}
                />
              </div>

              {/* Value Segment Treemap removed per request */}

              <div 
                className={styles.dashboardCard}
                data-type="chart"
                data-title="Customer Lifecycle Journey"
                data-chart-type="lifecycle_journey"
              >
                <h3 className={styles.chartTitle}>Customer Lifecycle Journey</h3>
                   <CustomerLifecycleJourney 
                     data={filteredData.customerSegments}
                     onChartClick={handleChartClick}
                     selectedPoints={selectedPoints}
                     onShiftClick={(pointData, event) => {
                       if (event?.shiftKey && typeof window !== 'undefined' && window.addAIInsightToChat) {
                         window.addAIInsightToChat({
                           ...pointData,
                           chartType: 'Customer Lifecycle Journey',
                           originalEvent: event
                         });
                       }
                     }}
                     isLoading={isLoading}
                   />
              </div>

              <div 
                className={styles.dashboardCard}
                data-type="chart"
                data-title="Frequency Pareto (80/20) Analysis"
                data-chart-type="frequency_pareto"
              >
                <h3 className={styles.chartTitle}>Frequency Pareto (80/20) Analysis</h3>
                   <FrequencyParetoChart
                     data={filteredData.frequencyDistribution}
                     width={560}
                     height={380}
                     onHoverInsight={(info) => {
                       try {
                         if (info && typeof window !== 'undefined') {
                           console.debug('Pareto hover insight:', info);
                         }
                       } catch {}
                     }}
                     onThresholdChange={(bin, pct) => {
                       try {
                         setInsights(prev => ({
                           ...(prev || {}),
                           pareto: `Top bins through ${bin} cover ${pct.toFixed(1)}% of customers`
                         }));
                       } catch {}
                     }}
                     onChartElementClick={(clickData) => {
                       if (!clickData?.shiftKey) return;
                       if (typeof window !== 'undefined' && (window).addAIInsightToChat) {
                         (window).addAIInsightToChat({
                           label: clickData?.label,
                           value: clickData?.value,
                           unit: '',
                           chartType: 'Frequency Pareto',
                           originalEvent: { shiftKey: true, clientX: clickData?.clientX, clientY: clickData?.clientY }
                         });
                       }
                     }}
                   />
              </div>
            </div>
          </>
        )}

        {/* Insight modal disabled to prevent interfering popups; use Shift+Click selection instead */}
        {/* <InsightModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          subtitle={modalSubtitle}
          metrics={modalMetrics}
          bullets={modalBullets}
          staticPoints={modalStaticPoints}
          aiText={aiText}
          aiLoading={aiLoading}
          aiAudit={aiAudit}
          onAskAI={(prompt, mode, action)=>askAI(prompt, mode, action)}
          onDownloadCSV={onDownloadCSV}
          onFilter={onFilterToThis}
          rawContext={modalContext}
        /> */}

  {/* Selection Panel removed: selectedPoints no longer used */}

        {/* Business Intelligence Analysis Results */}
        {biAnalysisResult && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            right: '20px',
            zIndex: 1800,
            background: biAnalysisResult.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${biAnalysisResult.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🧠</span>
                <h4 style={{ margin: 0, color: '#F8FAFC', fontSize: '18px', fontWeight: '600' }}>
                  Business Intelligence Analysis
                </h4>
                {biAnalysisResult.type === 'success' && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#94A3B8',
                    background: 'rgba(148, 163, 184, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {biAnalysisResult.dataPoints} points • {biAnalysisResult.timestamp}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setBiAnalysisResult(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Close analysis"
              >
                ×
              </button>
            </div>
            <div style={{ 
              color: biAnalysisResult.type === 'success' ? '#F8FAFC' : '#FCA5A5',
              lineHeight: '1.6',
              fontSize: '14px'
            }}>
              {biAnalysisResult.content.split('\n').filter(line => line.trim()).map((line, index) => {
                let cleanLine = line.trim();
                if (!cleanLine) return null;
                
                // Remove any JSON artifacts
                cleanLine = cleanLine.replace(/^["']|["']$/g, '');
                cleanLine = cleanLine.replace(/\\n/g, '\n');
                
                if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
                  return (
                    <div key={index} style={{ fontWeight: '600', marginBottom: '8px', color: '#2563EB' }}>
                      {cleanLine.replace(/\*\*/g, '')}
                    </div>
                  );
                } else if (cleanLine.match(/^\*\s+\*\*.*?\*\*/)) {
                  const match = cleanLine.match(/^\*\s+\*\*(.*?)\*\*:?\s*(.*)/);
                  if (match) {
                    return (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#2563EB' }}>{match[1]}:</span>
                        <span style={{ marginLeft: '8px' }}>{match[2]}</span>
                      </div>
                    );
                  }
                } else if (cleanLine.startsWith('•') || cleanLine.startsWith('*') || cleanLine.match(/^\d+\./)) {
                  return (
                    <div key={index} style={{ marginBottom: '6px', paddingLeft: '16px' }}>
                      {cleanLine}
                    </div>
                  );
                }
                
                return (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    {cleanLine}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Elite Shift+Click Toast */}
        {/* Shift+Click toast disabled for BI agent */}
        {/* {showShiftToast && (
          <div>⇧🖱️ Context captured for AI analysis</div>
        )} */}

        {/* BI Brain Icon removed */}

        <FloatingAIChat 
          key={chatSeed}
          insights={chatInsights.length > 0 ? chatInsights : (insights ? [
            { id: 'high-value', title: 'High-Value Customers', content: insights.highValue, priority: 2 },
            { id: 'loyal', title: 'Loyal Customers', content: insights.loyal, priority: 3 },
            { id: 'avg-freq', title: 'Average Purchase Frequency', content: insights.avgFrequency, priority: 1 },
          ] : null)} 
          dashboardData={filteredData}
          onAskAI={askAI} 
          onOpenChange={() => {}}
        />

        {/* Frontend-only Purchase Frequency Agent (no API/server/ADK changes) */}
        <FloatingPFAgent data={filteredData} isLoading={isLoading} />
      </div>
  );
};

export default PurchaseFrequencyDashboard;