import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import TransactionKPITiles from '../components/kpi/TransactionKPITiles';
import TemporalHeatmap from "../components/visualizations/TemporalHeatmap";
import DualAxisTimeSeries from "../components/visualizations/DualAxisTimeSeries";
import InsightModal from "../components/InsightModal";
import { callDashboardAPI, getErrorMessage } from '../../../../../ui-common/utils/apiUtils.js';

import FloatingAIChat from '../../../../../ui-common/FloatingAIChat';
const AmountDistributionHistogram = dynamic(() => import('../components/visualizations/AmountDistributionHistogram'), { ssr: false });
const ProductMatrixScatterPlot = dynamic(() => import('../components/visualizations/ProductMatrixScatterPlot'), { ssr: false });
import styles from './TransactionPatternsDashboard.module.css';
import NeonPopup from '../components/NeonPopup';
import { BusinessIntelligenceAlert } from '../../../../../ui-common/design-system/components/BusinessIntelligenceAlert';
import { TransactionDateRangeFilter } from '../components/filters/TransactionDateRangeFilter';
import { SegmentsCategoriesFilter } from '../components/filters/SegmentsCategoriesFilter';

// Client-only Plotly for custom charts
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const TransactionPatternsDashboard = ({ 
  onDataLoad = null,
  onError = null 
}) => {
  // Handler for Segments & Categories filter changes
  const handleSegmentsCategoriesChange = (segments, categories) => {
    console.log('🔄 Filter Change Detected:', {
      previousSegments: selectedSegments,
      newSegments: segments,
      previousCategories: selectedCategories,
      newCategories: categories
    });
    
    setSelectedSegments(segments);
    setSelectedCategories(categories);
    // trigger refresh when filters change
    try {
      if (typeof window !== 'undefined') {
        // small debounce via microtask to batch rapid changes
  // Promise.resolve().then(() => fetchData());
      }
    } catch {}
  };
  const [dashboardData, setDashboardData] = useState(null);
  const [visibleData, setVisibleData] = useState(null); // client-filtered view for responsive charts
  const [isLoading, setIsLoading] = useState(false);
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
  const [biAlerts, setBiAlerts] = useState([]);
  // Local AI insight injection (remount-based) for click-based chat
  const [chatInsights, setChatInsights] = useState([]);
  const [chatSeed, setChatSeed] = useState(1); // changing key forces FloatingAIChat remount so it re-reads insights prop

  // Customer Segmentation & Product Category Filter state
  const [selectedSegments, setSelectedSegments] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  // Business Intelligence Analysis state
  const [biAnalysisLoading, setBiAnalysisLoading] = useState(false);
  const [biAnalysisResult, setBiAnalysisResult] = useState(null);
  const [biPanelOpen, setBiPanelOpen] = useState(false);
  const [biActiveTab, setBiActiveTab] = useState('overview');

  // Global selection state fallback (if no ChartSelectionManager present)
  const [selectedPointsGlobal, setSelectedPointsGlobal] = useState([]); // [{chartId,label,value,index,metadata}]
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wrap/augment any existing ChartSelection API so TP always updates local selection state
    const prevAPI = (window).chartSelectionAPI || null;
    const addOrToggle = (prev, point, multi) => {
      const key = `${point.chartId}-${point.label}-${point.dataIndex}`;
      const exists = prev.some(p => `${p.chartId}-${p.label}-${p.dataIndex}` === key);
      if (multi) {
        return exists ? prev.filter(p => `${p.chartId}-${p.label}-${p.dataIndex}` !== key) : [...prev, point];
      }
      return [point];
    };
    (window).chartSelectionAPI = {
      ...(prevAPI || {}),
      addPoint: (point, opts = {}) => {
        setSelectedPointsGlobal(prev => addOrToggle(prev, point, !!opts.multi));
        try { prevAPI?.addPoint?.(point, opts); } catch {}
      },
      isMultiSelectMode: () => false,
      clear: () => {
        setSelectedPointsGlobal([]);
        try { prevAPI?.clear?.(); } catch {}
      }
    };

    // Provide a resilient chat sink so Shift+Click never drops
    if (!(window).addAIInsightToChat) {
      const buffer = [];
      (window).addAIInsightToChat = (payload) => {
        try {
          // If FloatingAIChat replaced this later, forward immediately
          const fn = (window).addAIInsightToChat;
          if (fn && fn !== (window).addAIInsightToChatFallback) {
            return fn(payload);
          }
        } catch {}
        buffer.push(payload);
      };
      // Tag fallback for detection
      (window).addAIInsightToChatFallback = (window).addAIInsightToChat;

      // When the real chat registers, flush buffered items
      const observer = new MutationObserver(() => {
        try {
          const fn = (window).addAIInsightToChat;
          if (fn && fn !== (window).addAIInsightToChatFallback && buffer.length) {
            while (buffer.length) fn(buffer.shift());
            observer.disconnect();
          }
        } catch {}
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    const onKey = (e) => { if (e.key === 'Escape') setSelectedPointsGlobal([]); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      // Restore previous API on unmount to avoid affecting other pages
      if (prevAPI) (window).chartSelectionAPI = prevAPI;
    };
  }, []);

  // Date Range State - Dynamically initialized from data
  const [dateRange, setDateRange] = useState({
    start: '2000-01-01', // wide placeholder; will be adjusted on first data load
    end: '2100-12-31'
  });
  const [actualDateRange, setActualDateRange] = useState(null); // {minDate,maxDate}
  const [hasInitializedDateRange, setHasInitializedDateRange] = useState(false);
  const [filterError, setFilterError] = useState(null);

  // Single neon popup state (normal clicks)
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupItems, setPopupItems] = useState([]);
  const [popupSections, setPopupSections] = useState([]);

  // Utility: recompute chart datasets from base transactions list
  const recomputeFromTransactions = useCallback((transactions) => {
    if (!Array.isArray(transactions)) return { temporalHeatmap: [], timeSeries: [], amountDistribution: [], productMatrix: [], kpis: {} };
    // Time series by month (match API grouping)
    const monthMap = new Map();
    for (const t of transactions) {
      const dt = t.transaction_date || t.full_date || t.date || '';
      const ym = (t.year_month) || (dt ? new Date(dt).toISOString().slice(0,7) : null);
      if (!ym) continue;
      const key = `${ym}-01`;
      const rec = monthMap.get(key) || { date: key, count: 0, value: 0 };
      rec.count += 1;
      rec.value += Number(t.sales_amount || t.total_amount || 0);
      monthMap.set(key, rec);
    }
    const timeSeries = Array.from(monthMap.values()).sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({
      date: r.date,
      transaction_count: r.count,
      avg_amount: r.count ? r.value / r.count : 0
    }));
    // Heatmap day/hour
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const heatMap = new Map();
    for (const t of transactions) {
      const dt = new Date(t.transaction_date || t.full_date || t.date);
      if (isNaN(dt)) continue;
      const day = days[dt.getDay()];
      const hour = Number(t.hour ?? dt.getHours());
      const k = `${day}-${hour}`;
      const rec = heatMap.get(k) || { day, hour, transactionCount: 0, totalValue: 0 };
      rec.transactionCount += 1;
      rec.totalValue += Number(t.sales_amount || 0);
      heatMap.set(k, rec);
    }
    const temporalHeatmap = days.flatMap(d=>Array.from({length:24},(_,h)=>{
      const rec = heatMap.get(`${d}-${h}`) || { day: d, hour: h, transactionCount: 0, totalValue: 0 };
      return { ...rec, avgAmount: rec.transactionCount ? rec.totalValue/rec.transactionCount : 0 };
    }));
    // Amount distribution
    const amountBins = [0,50,100,200,500,1000,5000];
    const amountDistribution = amountBins.map((v,i)=>({ binName: i<amountBins.length-1?`$${amountBins[i]}-$${amountBins[i+1]}`:`$${amountBins[i]}+`, count: 0 }));
    for (const t of transactions) {
      const a = Number(t.sales_amount || 0);
      for (let i=amountBins.length-1;i>=0;i--) { if (a>=amountBins[i]) { amountDistribution[i].count++; break; } }
    }
    // Product matrix (value vs quantity)
    const pm = new Map();
    for (const t of transactions) {
      const key = t.product_key || t.item_key || t.product || t.product_id;
      if (!key) continue;
      const rec = pm.get(key) || { name: `Product ${key}`, total_value: 0, total_quantity: 0 };
      rec.total_value += Number(t.sales_amount || 0);
      rec.total_quantity += Number(t.sales_quantity || 0);
      pm.set(key, rec);
    }
    const productMatrix = Array.from(pm.values());
    // KPIs
    const kpis = {
      totalTransactions: transactions.length,
      avgAmount: transactions.length ? (transactions.reduce((s,t)=>s+Number(t.sales_amount||0),0)/transactions.length) : 0,
      uniqueCustomers: new Set(transactions.map(t=>t.customer_id)).size
    };
    return { temporalHeatmap, timeSeries, amountDistribution, productMatrix, kpis };
  }, []);

  // Utility: filter the server response (dashboardData) by current selections
  const applyClientFilters = useCallback((base, segments, categories, selection, currentDateRange) => {
    if (!base) return null;

    // Start from base transactions, if available
    const baseTx = base.transactions;
    if (!Array.isArray(baseTx) || baseTx.length === 0) {
      // No raw transactions; return base unchanged to avoid empty charts
      return base;
    }

    // 1) Date range filter (always apply to respect current dateRange)
    const inDateRange = (tx) => {
      const d = tx.transaction_date || tx.full_date || tx.date;
      if (!d) return true;
      return d >= currentDateRange.start && d <= currentDateRange.end;
    };

    let tx = baseTx.filter(inDateRange);

    // 2) Selection-based filtering
    // - Within a chart: OR across selected labels
    // - Across charts: AND between chart groups
    if (selection && selection.length) {
      const byChart = selection.reduce((acc, p) => {
        (acc[p.chartId] ||= []).push(p);
        return acc;
      }, {});

      const predicates = [];

      // Time series selection: match by month (charts are monthly points)
      if (byChart.time_series?.length) {
        const toYM = (val) => {
          if (!val) return '';
          if (val instanceof Date) return val.toISOString().slice(0,7);
          const s = String(val);
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0,7);
          if (/^\d{4}-\d{2}$/.test(s)) return s;
          const d = new Date(s);
          return isNaN(d) ? s.slice(0,7) : d.toISOString().slice(0,7);
        };
        const months = new Set(byChart.time_series.map(p => toYM(p.label))); // YYYY-MM
        const monthStarts = new Set(Array.from(months).map(m => `${m}-01`));
        predicates.push((t) => {
          const d = t.year_month || t.transaction_date || t.full_date || t.date;
          if (!d) return false;
          const ym = toYM(d);
          if (ym && months.has(ym)) return true;
          const ds = String(d).slice(0,10);
          return monthStarts.has(ds) || months.has(ds.slice(0,7));
        });
      }

      // Heatmap selection: match by day-of-week and hour (fallback to day-only if hour granularity missing)
      if (byChart.heatmap?.length) {
        const pairs = new Set(byChart.heatmap.map(p => `${p?.metadata?.day}|${p?.metadata?.hour}`));
        const daysOnly = new Set(Array.from(pairs).map(s => s.split('|')[0]));
        predicates.push((t) => {
          const raw = t.transaction_date || t.full_date || t.date;
          const dt = new Date(raw);
          if (isNaN(dt)) return false;
          const day = dt.toLocaleDateString('en-US', { weekday: 'long' });
          const hasHourField = (t.hour != null) && Number.isFinite(Number(t.hour));
          if (hasHourField) {
            const hour = Number(t.hour);
            return pairs.has(`${day}|${hour}`) || pairs.has(`${day}|${hour.toString()}`);
          }
          // No hour info in base data: match by day only to avoid empty results
          return daysOnly.has(day);
        });
      }

      // Scatter selection: match by product/item key
      if (byChart.scatter?.length) {
        const keys = new Set(byChart.scatter.map(p => p?.metadata?.product_key || p?.metadata?.item_key));
        if (keys.size) {
          predicates.push((t) => keys.has(t.product_key || t.item_key || t.product_id));
        }
      }

      // Histogram selection: match by amount bin
      if (byChart.histogram?.length) {
        const bins = byChart.histogram.map(p => p?.metadata?.bin).filter(Boolean);
        if (bins.length) {
          predicates.push((t) => {
            const a = Number(t.sales_amount || t.total_amount || 0);
            return bins.some(b => {
              if (b.min != null && b.max != null) return a >= b.min && a < b.max;
              if (b.min != null && b.max == null) return a >= b.min;
              return false;
            });
          });
        }
      }

      // AND across chart predicates
      if (predicates.length) {
        const filtered = tx.filter(row => predicates.every(fn => fn(row)));
        // Safety: if filtering wipes out all rows, keep original tx to avoid blanking charts
        if (filtered.length > 0) {
          tx = filtered;
        }
      }
    }

    // 3) Segment filters (only if fields exist)
    const hasSegSel = segments && Object.values(segments).some(arr => Array.isArray(arr) && arr.length>0);
    const hasCatSel = Array.isArray(categories) && categories.length>0;
    const norm = (s) => (s||'').toString().toLowerCase();
    const canFilterSegments = tx.some(t => t.market || t.monetary_band || t.loyalty_status || t.country || t.customer_country);

    if (hasSegSel) {
      if (canFilterSegments) {
        // Direct filtering when fields exist on transactions
        tx = tx.filter(t => {
          const mkt = norm(t.market || t.market_desc);
          const mon = norm(t.monetary_band || t.monetary);
          const loy = norm(t.loyalty_status || t.loyalty);
          const ctry = norm(t.country || t.customer_country);
          return ['market','monetary','loyalty','country'].every(key => {
            const sel = (segments?.[key]||[]).map(norm);
            if (!sel.length) return true;
            const val = key==='market'?mkt:key==='monetary'?mon:key==='loyalty'?loy:ctry;
            return sel.includes(val);
          });
        });
      } else {
        // Fallback: use client-cached customer segment mapping loaded from /api/transaction-patterns/mappings
        const custMap = (typeof window !== 'undefined' && (window).transactionPatternsCustomerMap) ? (window).transactionPatternsCustomerMap : null;
        if (custMap) {
          tx = tx.filter(t => {
            const m = t.customer_id != null ? custMap[t.customer_id] : null;
            if (!m) return false; // precise filtering when selection exists
            const mkt = norm(m.market_desc);
            const mon = norm(m.monetary_band);
            const loy = norm(m.loyalty_status);
            const ctry = norm(m.customer_country);
            return ['market','monetary','loyalty','country'].every(key => {
              const sel = (segments?.[key]||[]).map(norm);
              if (!sel.length) return true;
              const val = key==='market'?mkt:key==='monetary'?mon:key==='loyalty'?loy:ctry;
              return sel.includes(val);
            });
          });
        }
      }
    }

    // 4) Category filters (now active if 'category' or 'product_key' is present)
    if (hasCatSel) {
      // If transactions include 'category' (from server) use it; otherwise try to map from cached product category map on window
      const toSet = new Set((categories || []).map(norm));
      const catMap = (typeof window !== 'undefined' && (window).transactionPatternsCategoryMap) ? (window).transactionPatternsCategoryMap : null;
      tx = tx.filter(t => {
        const direct = t.category || t.item_category;
        if (direct) return toSet.has(norm(direct));
        if (catMap && (t.product_key != null)) {
          const c = catMap[t.product_key];
          if (c) return toSet.has(norm(c));
        }
        return true; // if unknown, retain row to avoid over-filtering
      });
    }

    const recomputed = recomputeFromTransactions(tx);
    const safeProductMatrix = (recomputed.productMatrix && recomputed.productMatrix.length)
      ? recomputed.productMatrix
      : (base.productMatrix || []);
    return {
      ...base,
      temporalHeatmap: recomputed.temporalHeatmap,
      timeSeries: recomputed.timeSeries,
      amountDistribution: recomputed.amountDistribution,
      productMatrix: safeProductMatrix,
      kpis: { ...(base.kpis||{}), totalTransactions: recomputed.kpis.totalTransactions, avgAmount: recomputed.kpis.avgAmount, uniqueCustomers: recomputed.kpis.uniqueCustomers }
    };
  }, [recomputeFromTransactions]);

  // Recompute visibleData whenever filters or base data change
  useEffect(() => {
    try {
      const view = applyClientFilters(
        dashboardData,
        selectedSegments,
        selectedCategories,
        selectedPointsGlobal,
        { start: dateRange.start, end: dateRange.end }
      );
      setVisibleData(view);
    } catch (e) {
      console.warn('Client-side filtering failed, falling back to base data:', e?.message);
      setVisibleData(dashboardData);
    }
  }, [dashboardData, selectedSegments, selectedCategories, selectedPointsGlobal, dateRange, applyClientFilters]);

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
      if (kpis && typeof kpis.totalTransactions === 'number' && (chartId === 'time_series' || chartId === 'heatmap' || chartId === 'histogram')) {
        share = kpis.totalTransactions ? ((sum / kpis.totalTransactions) * 100) : null;
      }

      items.push({
        label: `${chartId} (${count} pts)`,
        status: 'neutral',
        metrics: {
          'Total': (sum || 0).toLocaleString(),
          ...(share!=null ? { 'Share of Total Tx': `${share.toFixed(1)}%` } : {}),
          ...(maxP ? { 'Peak': `${maxP.label || maxP.index}: ${Number(maxP.value||0).toLocaleString()}` } : {}),
          ...(minP ? { 'Low': `${minP.label || minP.index}: ${Number(minP.value||0).toLocaleString()}` } : {})
        }
      });

      const sectionParts = [];
      if (share!=null) sectionParts.push(`Represents ${share.toFixed(1)}% of total transactions.`);
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

  // --- Helper: derive static insights for a context ---
  const deriveStaticInsights = useCallback((ctx) => {
    try {
      if (!ctx) return [];
      const list = [];
      if (ctx.kind === 'kpi' && ctx.data?.kpis) {
        const kpis = ctx.data.kpis;
        if (kpis.uniqueCustomers) list.push(`Unique customers: ${kpis.uniqueCustomers.toLocaleString()}`);
        if (kpis.yoyGrowth !== undefined) list.push(`YoY growth: ${kpis.yoyGrowth}%`);
        if (kpis.momGrowth !== undefined) list.push(`MoM growth: ${kpis.momGrowth}%`);
      } else if (ctx.kind === 'time_series' && ctx.data?.samplePoint) {
        const p = ctx.data.samplePoint;
        list.push(`Date: ${p.date}`);
        list.push(`Transactions: ${p.transaction_count.toLocaleString()}`);
        list.push(`Avg value: $${p.avg_amount.toFixed(2)}`);
        if (ctx.data?.monthlyShare) list.push(`Day share of month: ${ctx.data.monthlyShare}%`);
        if (ctx.data?.dowDeviation) list.push(ctx.data.dowDeviation);
      } else if (ctx.kind === 'heatmap' && ctx.data?.cell) {
        const c = ctx.data.cell;
        list.push(`${c.day} ${c.hour}:00 transactions: ${c.transactionCount}`);
        if (c.percOfDay) list.push(`Share of that day: ${c.percOfDay}%`);
        if (c.percOfTotal) list.push(`Share of total: ${c.percOfTotal}%`);
      } else if (ctx.kind === 'scatter' && ctx.data?.point) {
        const pt = ctx.data.point;
        list.push(`Product: ${pt.product || pt.product_id || 'Item'}`);
        list.push(`Total value: $${(pt.total_value||0).toLocaleString()}`);
        list.push(`Total quantity: ${(pt.total_quantity||0).toLocaleString()}`);
        if (pt.total_value && pt.total_quantity) {
          const ap = pt.total_value / pt.total_quantity;
          list.push(`Avg unit price: $${ap.toFixed(2)}`);
        }
      } else if (ctx.kind === 'histogram' && ctx.data?.bin) {
        const b = ctx.data.bin;
        list.push(`Range: ${b.range || `${b.min}-${b.max}`}`);
        list.push(`Transactions in range: ${b.count}`);
        if (b.share) list.push(`Share of total: ${b.share}%`);
      }
      return list;
    } catch (e) {
      return [];
    }
  }, []);



  // --- Helper: parse up to three AI insights from text ---
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
        if (k.totalTransactions && k.avgTransactionValue) {
          items.push(`Transaction mix indicates an average value of $${k.avgTransactionValue.toFixed(2)}, suggesting ${(k.avgTransactionValue>50)?'higher':'moderate'} ticket size economics.`);
        }
        if (k.yoyGrowth !== undefined) {
          items.push(`Year-over-Year growth at ${k.yoyGrowth}% ${k.yoyGrowth>0?'supports expansion initiatives':'signals a need to address retention / acquisition.'}`);
        }
        if (k.momGrowth !== undefined) {
          items.push(`Recent MoM change of ${k.momGrowth}% ${Math.abs(k.momGrowth)>5?'shows short-term volatility':'is relatively stable.'}`);
        }
      } else if (contextType === 'time_series' && richCtx?.data?.samplePoint) {
        const p = richCtx.data.samplePoint;
        if (p.transaction_count) items.push(`Volume on ${p.date} was ${p.transaction_count.toLocaleString()} transactions.`);
        if (richCtx.data.monthlyShare) items.push(`Represents ${richCtx.data.monthlyShare}% of its month's total activity.`);
        if (richCtx.data.dowDeviation) items.push(richCtx.data.dowDeviation);
      } else if (contextType === 'heatmap' && richCtx?.data?.cell) {
        const c = richCtx.data.cell;
        items.push(`Peak interval: ${c.day} ${c.hour}:00 with ${c.transactionCount} transactions.`);
        if (c.percOfDay) items.push(`Accounts for ${c.percOfDay}% of that day's volume.`);
        if (c.percOfTotal) items.push(`Contributes ${c.percOfTotal}% of total volume.`);
      } else if (contextType === 'scatter' && richCtx?.data?.point) {
        const pt = richCtx.data.point;
        items.push(`Top product by value: ${(pt.product||pt.product_id)||'Item'} at $${(pt.total_value||0).toLocaleString()}.`);
        if (pt.total_quantity) items.push(`Quantity sold: ${(pt.total_quantity||0).toLocaleString()} units.`);
        if (pt.total_value && pt.total_quantity) {
          const ap = pt.total_value/pt.total_quantity; items.push(`Avg unit price ~$${ap.toFixed(2)} supporting ${(ap>50)?'premium':'value'} positioning.`);
        }
      } else if (contextType === 'histogram' && richCtx?.data?.bin) {
        const b = richCtx.data.bin;
        if (b.range || (b.min!==undefined && b.max!==undefined)) items.push(`High-frequency amount band ${(b.range)||`${b.min}-${b.max}`} detected.`);
        if (b.count) items.push(`Transactions in band: ${b.count.toLocaleString()}.`);
        if (b.share) items.push(`Represents ${b.share}% of total volume.`);
      }
    } catch {/* ignore */}
    if (!items.length) items.push('Context captured; ask a comparative or trend question for deeper analysis.');
    return items.slice(0,3).map((t,i)=>({ id:`heuristic-ai-${Date.now()}-${i}`, title:`AI Insight ${i+1}`, content:t, priority:2 }));
  };
  

  
  // Handle date range changes with validation and auto-refresh
  const handleDateRangeChange = useCallback((newDateRange) => {
    console.log('🗓️ Date range changed:', newDateRange);
    
    // Validate date range using actual database bounds if available
    const start = new Date(newDateRange.start);
    const end = new Date(newDateRange.end);
    const minAllowed = actualDateRange ? new Date(actualDateRange.minDate) : new Date('2017-01-01');
    const maxAllowed = actualDateRange ? new Date(actualDateRange.maxDate) : new Date('2021-12-31');
    
    if (start < minAllowed || end > maxAllowed) {
      setFilterError(`Date range must be within available data period (${minAllowed.toISOString().split('T')[0]} to ${maxAllowed.toISOString().split('T')[0]})`);
      return;
    }
    
    if (start > end) {
      setFilterError('Start date must be before end date');
      return;
    }
    
    // Check for reasonable range (not too small for meaningful analysis)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (days < 1) {
      setFilterError('Date range must be at least 1 day');
      return;
    }
    
    setDateRange(newDateRange);
    setError(null);
    setFilterError(null);
    // Data will auto-refresh via useEffect dependency on dateRange
  }, [actualDateRange]);

  // Calculate smart insights for the selected date range
  const getDateRangeInsights = useCallback(() => {
    if (!dashboardData) return null;
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const years = days / 365;
    
    // Smart categorization
    let category = '';
    let insight = '';
    
    if (days <= 7) {
      category = 'Micro-Analysis';
      insight = 'Perfect for detecting daily patterns and outliers';
    } else if (days <= 31) {
      category = 'Sprint Analysis';
      insight = 'Ideal for monthly trends and seasonal variations';
    } else if (days <= 92) {
      category = 'Quarterly View';
      insight = 'Great for business cycle analysis and strategy';
    } else if (days <= 366) {
      category = 'Annual Overview';
      insight = 'Comprehensive yearly patterns and growth trends';
    } else {
      category = 'Historical Deep-Dive';
      insight = 'Multi-year analysis for strategic planning';
    }
    
    // Calculate transaction density
    const transactionDensity = dashboardData.kpis?.totalTransactions 
      ? Math.round(dashboardData.kpis.totalTransactions / days)
      : 0;
    
    return {
      category,
      insight,
      days,
      years: Math.round(years * 10) / 10,
      transactionDensity,
      dataQuality: days > 30 ? 'High Statistical Significance' : 'Limited Sample Size'
    };
  }, [dateRange, dashboardData]);

  const baseChartLayout = {
    autosize: true,
    font: { color: 'var(--text-primary)' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    legend: { 
      font: { color: 'var(--text-secondary)' },
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1
    },
    xaxis: {
      gridcolor: 'rgba(255, 255, 255, 0.1)',
      linecolor: 'rgba(255, 255, 255, 0.2)',
      zerolinecolor: 'rgba(255, 255, 255, 0.2)',
      tickfont: { color: 'var(--text-secondary)' }
    },
    yaxis: {
      gridcolor: 'rgba(255, 255, 255, 0.1)',
      linecolor: 'rgba(255, 255, 255, 0.2)',
      zerolinecolor: 'rgba(255, 255, 255, 0.2)',
      tickfont: { color: 'var(--text-secondary)' }
    }
  };

  const generateInsights = useCallback((data) => {
    if (!data || !data.kpis || !data.temporalHeatmap) {
      setInsights(null);
      return;
    }

    const { kpis, temporalHeatmap } = data;
    const peakHour = (temporalHeatmap || []).reduce((max, curr) => {
      if (!max) return curr;
      return (curr.transactionCount || 0) > (max.transactionCount || 0) ? curr : max;
    }, null) || { day: 'Monday', hour: 12 };
    const totalTransactions = kpis.totalTransactions || 0;

    const newInsights = [
      {
        id: 'peak-hour',
        title: 'Peak Activity',
        content: `Peak transaction time is around ${peakHour.hour}:00 on ${peakHour.day}s.`,
        priority: 1,
      },
      {
        id: 'total-volume',
        title: 'Transaction Volume',
        content: `A total of ${totalTransactions.toLocaleString()} transactions were analyzed.`,
        priority: 2,
      },
    ];
    setInsights(newInsights);

    // Derive BI alerts (lightweight heuristics)
    try {
      const alerts = [];
      if (kpis.anomalyRate > 8) {
        alerts.push({
          id: 'high_anomaly',
          severity: kpis.anomalyRate > 12 ? 'critical' : 'warning',
          title: 'Elevated Anomaly Rate',
          message: `Current anomaly rate at ${kpis.anomalyRate.toFixed(1)}%. Investigate potential fraud or data integrity issues.`,
          impact: kpis.anomalyRate > 12 ? 'Potential loss exposure' : 'Risk trending upward',
          suggestedAction: 'Drill into anomaly logs',
          scope: 'global'
        });
      }
      if (kpis.yoyGrowth && kpis.yoyGrowth < 0) {
        alerts.push({
          id: 'negative_growth',
          severity: 'warning',
          title: 'Year-over-Year Decline',
          message: `YoY growth is negative (${kpis.yoyGrowth}%). Revenue momentum weakening.`,
          impact: 'Growth headwind',
          suggestedAction: 'Assess churn & pricing',
          scope: 'revenue'
        });
      }
      if (kpis.totalTransactions > 20000 && kpis.avgTransactionValue < 25) {
        alerts.push({
          id: 'high_volume_low_value',
          severity: 'info',
          title: 'High Volume / Low Value Mix',
          message: 'Large transaction volume with relatively low average value suggests margin leverage via bundling.',
          impact: 'Upsell opportunity',
          suggestedAction: 'Design bundle offers',
          scope: 'pricing'
        });
      }
      setBiAlerts(alerts);
    } catch (e) { /* ignore BI alert derivation errors */ }
  }, []);

  // Build curated API payload using dynamic date range and filters
  const buildRequestPayload = useCallback(() => {
    const customerSegments = Object.entries(selectedSegments).flatMap(([type, arr]) => arr.map(label => ({ category: type, label })));
    const payload = {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      businessFunctions: ['sales', 'customer', 'finance'],
      significanceThreshold: 0.05,
      customerSegments,
      productCategories: selectedCategories,
    };
    
    // Enhanced logging for filter verification
    console.log('🎯 Dashboard Filter Status:', {
      dateRange: payload.dateRange,
      customerSegments: customerSegments.length > 0 ? customerSegments : 'None selected',
      productCategories: selectedCategories.length > 0 ? selectedCategories : 'None selected',
      totalFilters: customerSegments.length + selectedCategories.length
    });
    
    return payload;
  }, [dateRange, selectedSegments, selectedCategories]);

  // Data fetching: connect to real API for transaction patterns
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = buildRequestPayload();

      // Use shared API util with robust JSON handling to avoid HTML parse errors
      const responseData = await callDashboardAPI('transaction-patterns', {
        dateRange: payload.dateRange,
        // Pass filters in a backwards-compatible way without server changes
        customerSegments: payload.customerSegments,
        productCategories: payload.productCategories
      });

      // responseData may already be the nested data depending on server shape
      const data = responseData?.data ? responseData.data : responseData;
      // Normalize transactions: prefer server-provided minimal list for client filters
      const normalized = data ? {
        ...data,
        transactions: Array.isArray(data.transactions_mini) && data.transactions_mini.length
          ? data.transactions_mini
          : (Array.isArray(data.transactions) ? data.transactions : [])
      } : null;

      setDashboardData(normalized);
      // Initialize visible data with server data; client filtering will derive from this
      setVisibleData(normalized);

      // Initialize date range to full data span on first load
      if (!hasInitializedDateRange && normalized?.timeSeries?.length) {
        const dates = normalized.timeSeries.map(d => d.date).filter(Boolean).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length-1];
        setActualDateRange({ minDate, maxDate });
        setDateRange({ start: minDate, end: maxDate });
        setHasInitializedDateRange(true);
      }

      generateInsights(normalized);

      // Update DB total records if provided
      if (responseData?.database?.transactions_count != null) {
        setActualDateRange(prev => ({ ...(prev || {}), totalRecords: responseData.database.transactions_count }));
      }
    } catch (e) {
      console.error('Failed to fetch transaction patterns data:', e);
      setError(getErrorMessage(e));
      setDashboardData(null);
      setInsights(null);
      setBiAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildRequestPayload, generateInsights]);

  // Auto-fetch when date range or filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bootstrap client-side mappings for segment & category filtering without changing server API
  useEffect(() => {
    let cancelled = false;
    async function loadMappings() {
      try {
        const resp = await fetch('/api/transaction-patterns/mappings');
        if (!resp.ok) return;
        const j = await resp.json();
        const data = j?.data || j;
        if (!cancelled && data) {
          if (data.productCategories) (window).transactionPatternsCategoryMap = data.productCategories;
          if (data.customerSegments) (window).transactionPatternsCustomerMap = data.customerSegments;
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      loadMappings();
    }
    return () => { cancelled = true; };
  }, []);

  const openModal = (title, subtitle, metrics, bullets, rawContext, staticPoints=[]) => {
    setModalTitle(title);
    setModalSubtitle(subtitle);
    setModalMetrics(metrics);
    setModalBullets(bullets);
    setModalContext(rawContext);
    setModalStaticPoints(staticPoints);
    setModalOpen(true);
    setAiText('');
    setAiAudit(null);
  };

  // Neon popup helper (disabled on Shift+click flow). Keep for normal click handlers if needed.
  const openNeonPopup = (title, items = [], sections = []) => {
    // Intentionally no-op for Shift+Click flows which now route to chat.
    // Normal clicks can still use popup if those handlers call this.
    setPopupTitle(title || 'Details');
    setPopupItems(items || []);
    setPopupSections(sections || []);
    // Do not open popup on Shift+Click path; popupOpen is only used by normal clicks
    setPopupOpen(true);
  };



  // Business Intelligence Agent — Transaction Patterns (UI-only, no API calls)
  const performBusinessIntelligenceAnalysis = async () => { setBiPanelOpen(true);
    setBiAnalysisLoading(true);
    setBiAnalysisResult(null);
    try {
      const kpis = (visibleData?.kpis || dashboardData?.kpis) || {};
      const totalTx = Number(kpis.totalTransactions || 0);
      const avgValue = Number(kpis.avgTransactionValue || 0);
      const estRevenue = totalTx && avgValue ? totalTx * avgValue : null;

      // Peak window from temporal heatmap
      const heatmap = (visibleData?.temporalHeatmap || dashboardData?.temporalHeatmap || []);
      let peakCell = null;
      if (Array.isArray(heatmap) && heatmap.length) {
        peakCell = heatmap.reduce((best, cur) => (cur.transactionCount > (best?.transactionCount || 0) ? cur : best), null);
      }

      // Top product by total_value
      const products = (visibleData?.productMatrix || dashboardData?.productMatrix || []);
      let topProduct = null;
      if (Array.isArray(products) && products.length) {
        topProduct = products.reduce((best, cur) => (Number(cur.total_value || 0) > Number(best?.total_value || 0) ? cur : best), null);
      }

      // Top amount bin
      const amountDist = (visibleData?.amountDistribution || dashboardData?.amountDistribution || []);
      let topBin = null;
      const totalAmtTx = amountDist.reduce((s, d) => s + (d.count || 0), 0);
      if (Array.isArray(amountDist) && amountDist.length) {
        topBin = amountDist.reduce((best, cur) => (Number(cur.count || 0) > Number(best?.count || 0) ? cur : best), null);
      }

      const fmt = (n) => (typeof n === 'number' && !Number.isNaN(n) ? n.toLocaleString() : '-');
      const money = (n) => (typeof n === 'number' && !Number.isNaN(n) ? `$${Math.round(n).toLocaleString()}` : '$-');

      // Build BI content per requested structure (transaction-patterns specific)
      const lines = [];

      // Response Format: start with critical metrics headline
      const headlineParts = [];
      if (estRevenue) headlineParts.push(`${money(estRevenue)} revenue analyzed`);
      if (totalTx) headlineParts.push(`${fmt(totalTx)} transactions`);
      if (peakCell) headlineParts.push(`peak: ${peakCell.day} ${peakCell.hour}:00 (${fmt(peakCell.transactionCount)})`);
      if (topProduct) headlineParts.push(`top product: ${topProduct?.name || topProduct?.product || 'N/A'}`);
      if (topBin) headlineParts.push(`top amount bin: ${topBin.binName} (${fmt(topBin.count)})`);
      lines.push(`**${headlineParts.join(' • ')}**`);

      // 1) Risk Assessment & Analysis
      lines.push('**1) Risk Assessment & Analysis**');
      lines.push(`* **Pattern Volatility:** ${peakCell ? `High concentration detected around ${peakCell.day} ${peakCell.hour}:00 (${fmt(peakCell.transactionCount)} tx).` : 'Stable hourly distribution; no extreme clusters detected.'}`);
      lines.push(`* **Revenue Concentration:** ${topProduct ? `${topProduct?.name || topProduct?.product || 'Top product'} drives ${money(Number(topProduct.total_value || 0))} across ${fmt(Number(topProduct.total_quantity || 0))} units.` : 'No strong revenue concentration by product.'}`);
      lines.push(`* **Tolerance Check:** ${topBin ? `Amount distribution skews toward ${topBin.binName} (${((topBin.count/Math.max(totalAmtTx,1))*100).toFixed(1)}% of transactions).` : 'Balanced amount distribution observed.'}`);

      // 2) Predictive Insights
      lines.push('**2) Predictive Insights**');
      lines.push(`* **Scenario — No Action:** Expect recurring peaks to strain capacity; potential missed revenue in peak windows.`);
      lines.push(`* **Scenario — Targeted Optimization:** Align staffing/promotions to peak windows; improve throughput by 8–15%.`);
      lines.push(`* **Scenario — Full Implementation:** Dynamic pricing & prefetch checkout in peaks; reduce drop-offs by 15–25%.`);

      // 3) Strategic Recommendations
      lines.push('**3) Strategic Recommendations**');
      lines.push(`* **Peak Window Strategy:** ${peakCell ? `Boost inventory and UX optimizations on ${peakCell.day} ${peakCell.hour}:00 window.` : 'Identify and target top activity windows once sufficient data accumulates.'}`);
      lines.push(`* **Product Portfolio:** ${topProduct ? `Scale ${topProduct?.name || topProduct?.product || 'Top product'} with A/B price tests; nudge low-velocity SKUs.` : 'Run A/B price tests to surface winning items; de-emphasize underperformers.'}`);
      lines.push(`* **Checkout Flow:** Streamline high-friction steps; enable 1-click for frequent ranges like ${topBin ? topBin.binName : '$X-$Y'}.`);
      lines.push(`* **ROI & Prioritization:** Prioritize changes with 2–4 week payback; measure conversion lift and cart completion rates.`);

      // 4) Simulation & Impact Analysis (simple UI-only estimates)
      const estLift = estRevenue ? estRevenue * 0.1 : null; // assume 10% lift for illustration
      lines.push('**4) Simulation & Impact Analysis**');
      lines.push(`* **Throughput Lift (10%):** ~${money(estLift || 0)} incremental weekly revenue if applied to peak windows.`);
      lines.push(`* **Preserved Value:** Reducing drop-offs by 15% in peaks preserves significant revenue exposure.`);
      lines.push(`* **Cost-Benefit:** Focus on low-cost UX and ops improvements before major campaigns.`);

      // 5) Contextual Responses (for quick Q&A prompts)
      lines.push('**5) Contextual Responses**');
      lines.push(`* **Current Peaks:** ${peakCell ? `${peakCell.day} ${peakCell.hour}:00 (${fmt(peakCell.transactionCount)} tx)` : 'No dominant peak detected.'}`);
      lines.push(`* **Volume & Value:** ${fmt(totalTx)} tx • Avg $${avgValue ? avgValue.toFixed(2) : '-'} ${estRevenue ? `• Est. revenue ${money(estRevenue)}` : ''}`);
      lines.push(`* **Top Product:** ${topProduct ? `${topProduct?.name || topProduct?.product || 'N/A'} (${money(Number(topProduct.total_value || 0))})` : 'N/A'}`);
      lines.push(`* **Top Amount Range:** ${topBin ? `${topBin.binName} (${fmt(topBin.count)} tx, ${((topBin.count/Math.max(totalAmtTx,1))*100).toFixed(1)}%)` : 'N/A'}`);
      lines.push(`* **Immediate Actions:** Optimize peak-hour ops; A/B pricing; streamline checkout; micro-promotions on top ranges.`);

      // Footer guidance
      lines.push('* Ask: "What are our top peak windows and how should we staff?"');
      lines.push('* Ask: "Which products deserve price experiments this week?"');

      setBiAnalysisResult({
        type: 'intelligence',
        content: lines.join('\n'),
        dataPoints: totalTx || 0,
        timestamp: new Date().toLocaleTimeString()
      });
      setBiActiveTab('overview');
    } finally {
      setBiAnalysisLoading(false);
    }
  };



  const handleKPIClick = (event) => {
  if (!dashboardData || !dashboardData.kpis) return;
  const { kpis } = dashboardData;
  const title = 'Key Performance Indicators';
  // Compose concise bullets for small insight panel
  const bullets = [];
  bullets.push(`Total transactions: ${kpis.totalTransactions?.toLocaleString()}`);
  bullets.push(`Avg value: $${kpis.avgTransactionValue?.toFixed(2)}`);
  bullets.push(`Unique customers: ${kpis.uniqueCustomers?.toLocaleString()}`);
  showSmallInsight(title, bullets);
  // ...existing code for NeonPopup (if needed)...
  };

  const handleHeatmapCellClick = (day, hour, event) => {
    if (!day || hour === undefined || !dashboardData) return;
    const point = dashboardData.temporalHeatmap.find(d => d.day === day && d.hour === hour);
    const count = point ? point.transactionCount : 0;
    const totalForDay = dashboardData.temporalHeatmap
      .filter(d => d.day === day)
      .reduce((sum, d) => sum + d.transactionCount, 0);
    const totalForHour = dashboardData.temporalHeatmap
      .filter(d => d.hour == hour)
      .reduce((sum, d) => sum + d.transactionCount, 0);
    const total = dashboardData.kpis.totalTransactions;
    const hourlyAverage = total / 168;
    const title = `Activity for ${day} at ${hour}:00`;
    // Compose concise bullets for small insight panel
    const bulletsHeatmap = [];
    bulletsHeatmap.push(`Transactions: ${count.toLocaleString()}`);
    if (totalForDay) bulletsHeatmap.push(`Share of day: ${((count/totalForDay)*100).toFixed(1)}%`);
    if (totalForHour) bulletsHeatmap.push(`Share of week hour: ${((count/totalForHour)*100).toFixed(1)}%`);
    showSmallInsight(title, bulletsHeatmap);
    // ...existing code for NeonPopup (if needed)...

    // Simple statistical analysis → sections
    const selectedDate = new Date(`${day}T${hour}:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const monthlyData = dashboardData.timeSeries.filter(d => {
        const dDate = new Date(d.date + 'T00:00:00');
      return dDate.getFullYear() === year && dDate.getMonth() === month;
    });
      const totalMonthlyTx = monthlyData.reduce((sum, d) => sum + d.transaction_count, 0);
    if (totalMonthlyTx > 0) {
      const percOfMonth = ((count / totalMonthlyTx) * 100).toFixed(1);
      sections.push({ title: 'Monthly Share', content: `This hour accounted for ${percOfMonth}% of this month's transactions.` });
    }

    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const sameDayOfWeekData = dashboardData.timeSeries.filter(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek);
    const avgTxForDayOfWeek = sameDayOfWeekData.length ? (sameDayOfWeekData.reduce((sum, d) => sum + d.transaction_count, 0) / sameDayOfWeekData.length) : 0;
    if (avgTxForDayOfWeek) {
      if (count > avgTxForDayOfWeek * 1.2) {
        sections.push({ title: 'Day-of-Week Comparison', content: `Transaction count was significantly above average for a ${dayOfWeek}.` });
      } else if (count < avgTxForDayOfWeek * 0.8) {
        sections.push({ title: 'Day-of-Week Comparison', content: `Transaction count was below average for a ${dayOfWeek}.` });
      }
    }

    const pointIndex = dashboardData.timeSeries.findIndex(d => d.date === `${day}T${hour}:00:00`);
    if (pointIndex >= 6) {
      const trendData = dashboardData.timeSeries.slice(pointIndex - 6, pointIndex + 1);
      const startValue = trendData[0].transaction_count;
      const endValue = trendData[6].transaction_count;
      if(startValue > 0) {
        const trend = ((endValue - startValue) / startValue) * 100;
        if (trend > 15) {
          sections.push({ title: 'Trend', content: `This hour is part of a recent upward trend (+${Math.round(trend)}% over the last 7 days).` });
        } else if (trend < -15) {
          sections.push({ title: 'Trend', content: `This hour is part of a recent downward trend (${Math.round(trend)}% over the last 7 days).` });
        }
      }
    }

    // Show small side insight (2-3 bullets)
    const bullets = [];
    bullets.push(`Transactions: ${count.toLocaleString()}`);
    if (items[0]?.metrics?.['Share of Day']) bullets.push(`Share of day: ${items[0].metrics['Share of Day']}`);
    if (items[0]?.metrics?.['Share of Week Hour']) bullets.push(`Share of that hour-of-week: ${items[0].metrics['Share of Week Hour']}`);
    if (sections.find(s => s.title === 'Trend')) bullets.push('Trend: see recent change');
    showSmallInsight(title, bullets);
  };

  const handleChartInsight = (insight, event) => {
    if (!insight) return;

    const { title, subtitle, metrics, bullets: insightBullets, context } = insight;
    
    // Build NeonPopup content
    const items = [];
    const sections = [];

    if (context && context.source === 'productMatrix') {
      const totalValue = dashboardData.productMatrix.reduce((sum, p) => sum + p.total_value, 0);
      const totalQuantity = dashboardData.productMatrix.reduce((sum, p) => sum + p.total_quantity, 0);
      const valuePerc = ((context.total_value / totalValue) * 100).toFixed(1);
      const quantityPerc = ((context.total_quantity / totalQuantity) * 100).toFixed(1);

      items.push({
        label: context.name || 'Product',
        status: 'neutral',
        metrics: {
          'Total Value ($)': (context.total_value||0).toLocaleString(),
          'Total Quantity (units)': (context.total_quantity||0).toLocaleString(),
          'Avg Unit Price ($)': context.total_quantity ? (context.total_value/context.total_quantity).toFixed(2) : '—'
        }
      });

      sections.push({ title: 'Comparative Share', content: `Value: ${valuePerc}% • Quantity: ${quantityPerc}% of totals.` });
      const avgPrice = context.total_quantity ? (context.total_value / context.total_quantity) : null;
      const overallAvgPrice = totalQuantity ? (totalValue / totalQuantity) : null;
      if (avgPrice && overallAvgPrice) {
        if (avgPrice > overallAvgPrice * 1.5) sections.push({ title: 'Price Category', content: 'This is a premium-priced item.' });
        else if (avgPrice < overallAvgPrice * 0.5) sections.push({ title: 'Price Category', content: 'This is a budget-friendly item.' });
      }
      sections.push({ title: 'Recommended Actions', content: 'Evaluate pricing strategy, ensure inventory alignment, and consider targeted promotions.' });
    } else if (context && context.source === 'amountDistribution') {
      const totalTransactions = dashboardData.kpis.totalTransactions;
      const percOfTotal = ((context.count / totalTransactions) * 100).toFixed(1);

      items.push({
        label: context.binName || 'Amount Range',
        status: 'neutral',
        metrics: {
          'Transactions': (context.count||0).toLocaleString(),
          'Share of Total (%)': percOfTotal
        }
      });

      const avgBinCount = dashboardData.amountDistribution.length ? (totalTransactions / dashboardData.amountDistribution.length) : 0;
      if (avgBinCount) {
        if (context.count > avgBinCount * 1.5) sections.push({ title: 'Frequency', content: 'This is a very common transaction amount.' });
        else if (context.count < avgBinCount * 0.5) sections.push({ title: 'Frequency', content: 'This is a less common transaction amount.' });
      }
      sections.push({ title: 'Recommended Actions', content: 'Align promotions with common ranges and watch for outlier clusters.' });
    }

    // Build a concise side insight (2-3 bullets)
    const bullets2 = [];
    if (context && context.source === 'productMatrix') {
      bullets2.push(`Total value: $${(context.total_value||0).toLocaleString()}`);
      bullets2.push(`Total quantity: ${(context.total_quantity||0).toLocaleString()} units`);
      const avgUnit = context.total_quantity ? (context.total_value/context.total_quantity).toFixed(2) : null;
      if (avgUnit) bullets2.push(`Avg unit price: $${avgUnit}`);
    } else if (context && context.source === 'amountDistribution') {
      bullets2.push(`Transactions: ${(context.count||0).toLocaleString()}`);
      bullets2.push(`Share of total: ${(((context.count||0)/(dashboardData?.kpis?.totalTransactions||1))*100).toFixed(1)}%`);
    } else if (insightBullets && insightBullets.length) {
      for (const b of insightBullets) {
        if (bullets2.length >= 3) break;
        bullets2.push(String(b));
      }
    } else if (metrics && metrics.length) {
      for (const m of metrics) {
        if (bullets2.length >= 3) break;
        bullets2.push(`${m.label}: ${m.value}`);
      }
    }

    showSmallInsight(title || 'Insight', bullets2);
  };

  // Small side insight panel state
  const [smallInsight, setSmallInsight] = useState(null); // { title, bullets: string[] }
  const showSmallInsight = (title, bullets=[]) => {
    const top3 = (bullets || []).filter(Boolean).slice(0,3);
    setSmallInsight({ title, bullets: top3 });
  };

  const handleTimeSeriesClick = (dataPoint, event) => {
    if (!dataPoint || !dashboardData) return;

    const title = `Activity on ${dataPoint.date}`;
    const bullets = [];
    bullets.push(`Transactions: ${(dataPoint.transaction_count||0).toLocaleString()}`);
    bullets.push(`Avg value: $${(dataPoint.avg_amount||0).toFixed(2)}`);

    const idx = dashboardData.timeSeries.findIndex(d => d.date === dataPoint.date);
    if (idx >= 6) {
      const slice = dashboardData.timeSeries.slice(idx - 6, idx + 1);
      const start = slice[0].transaction_count;
      const end = slice[6].transaction_count;
      if (start > 0) {
        const pct = ((end - start) / start) * 100;
        if (pct > 15) bullets.push(`Trend: up ${Math.round(pct)}% (7d)`);
        else if (pct < -15) bullets.push(`Trend: down ${Math.round(Math.abs(pct))}% (7d)`);
      }
    }

    showSmallInsight(title, bullets);
  };

  const downloadCSV = (filename, rows) => {
    const header = Object.keys(rows[0]).join(',');
    const csv = [header, ...rows.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const contextToCSV = (ctx) => {
    if (!ctx) return;
    if (Array.isArray(ctx)) {
      downloadCSV('data.csv', ctx);
    } else if (typeof ctx === 'object') {
      downloadCSV('data.csv', [ctx]);
    }
  };

  const onDownloadCSV = () => {
    contextToCSV(modalContext);
  };

  const onFilterToThis = () => {
    if (!modalContext || !modalContext.date && !modalContext.month) return;
    // Modal context handling removed - no dynamic date filtering
    setModalOpen(false);
  };

  if (error) {
    return <div className={styles.errorContainer}>Error: {error}</div>;
  }

  const aggregatedSections = React.useMemo(() => {
    return [];
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {isLoading ? (
        <div className={styles.fullWidthCard}><p>Loading Dashboard...</p></div>
      ) : (
        <div className={styles.mainContent}>
          {biAlerts && biAlerts.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <BusinessIntelligenceAlert alerts={biAlerts} />
            </div>
          )}

          {smallInsight && (
            <div className={styles.smallInsightPanel} role="note">
              <button className={styles.smallInsightClose} aria-label="Close" onClick={()=>setSmallInsight(null)}>×</button>
              <div className={styles.smallInsightTitle}>{smallInsight.title}</div>
              <ul className={styles.smallInsightList}>
                {smallInsight.bullets.map((b, i)=>(<li key={i}>{b}</li>))}
              </ul>
            </div>
          )}

          {/* Industrial Grade Date Range Filter */}
          <div className={styles.filterSection}>
            <div className={styles.dateRangeContainer}>
              <div className={styles.filterHeader}>
                <h3 className={styles.filterTitle}>
                  📊 Transaction Analysis Period
                  {getDateRangeInsights() && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 400, 
                      color: '#64748b',
                      marginLeft: '12px' 
                    }}>
                      {getDateRangeInsights().category}
                    </span>
                  )}
                </h3>
                <div className={styles.filterStats}>
                  {dashboardData && getDateRangeInsights() && actualDateRange && (
                    <>
                      <span>📈 {dashboardData.kpis?.totalTransactions?.toLocaleString() || 0} transactions</span>
                      <span>💰 ${(dashboardData.kpis?.totalAmount || 0).toLocaleString()}</span>
                      <span>👥 {dashboardData.kpis?.uniqueCustomers?.toLocaleString() || 0} customers</span>
                      <span>⚡ {getDateRangeInsights().transactionDensity}/day avg</span>
                      <span style={{ color: '#00e0ff' }}>
                        {typeof actualDateRange?.totalRecords === 'number'
                          ? `📊 DB: ${actualDateRange.totalRecords.toLocaleString()} total records`
                          : `📊 DB Range: ${(actualDateRange?.minDate || '2017-01-01')} to ${(actualDateRange?.maxDate || '2021-12-31')}`}
                      </span>
                    </>
                  )}
                  {!actualDateRange && (
                    <span style={{ color: '#64748b' }}>
                      Loading database info...
                    </span>
                  )}
                </div>
              </div>
              
              {getDateRangeInsights() && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#94a3b8', 
                  marginBottom: '16px',
                  fontStyle: 'italic' 
                }}>
                  💡 {getDateRangeInsights().insight} • {getDateRangeInsights().dataQuality}
                </div>
              )}
              
              <TransactionDateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                isLoading={isLoading}
                minDate={actualDateRange?.minDate || "2017-01-01"}
                maxDate={actualDateRange?.maxDate || "2021-12-31"}
                compact={false}
              />
              
              {/* Error Display */}
              {filterError && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 82, 82, 0.1)',
                  border: '1px solid rgba(255, 82, 82, 0.3)',
                  borderRadius: '8px',
                  color: '#ff5252',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚠️ {filterError}
                </div>
              )}
              
              {isLoading && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Clear/Reset for stable filtering UX */}
          <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
            <button
              onClick={() => {
                // Clear only selections (keep date/segments)
                setSelectedPointsGlobal([]);
              }}
              title="Clear chart selections (Esc)"
              style={{ padding: '8px 12px', borderRadius: 6, background: '#2f3a4f', color: '#e3eeff', border: '1px solid #4a5a72', cursor: 'pointer' }}
            >
              Clear Selections
            </button>
            <button
              onClick={() => {
                // Reset all filters to full-range baseline
                setSelectedSegments({});
                setSelectedCategories([]);
                setSelectedPointsGlobal([]);
                setFilterError(null);
                if (actualDateRange?.minDate && actualDateRange?.maxDate) {
                  setDateRange({ start: actualDateRange.minDate, end: actualDateRange.maxDate });
                }
              }}
              title="Reset date range, segments, and selections to full data"
              style={{ padding: '8px 12px', borderRadius: 6, background: '#334155', color: '#e3eeff', border: '1px solid #4b5563', cursor: 'pointer' }}
            >
              Reset Filters
            </button>
          </div>

          {/* Customer Segmentation & Product Category Filter */}
          <SegmentsCategoriesFilter
            selectedSegments={selectedSegments}
            selectedCategories={selectedCategories}
            onChange={handleSegmentsCategoriesChange}
            isLoading={isLoading}
          />

          {/* Business Intelligence Analysis Popup (PF-style floating) */}
          {biPanelOpen && biAnalysisResult && (
            <div
              style={{
                position: 'fixed',
                bottom: '90px',
                right: '20px',
                width: 420,
                height: 520,
                background: 'linear-gradient(135deg, rgba(26,31,46,0.98), rgba(42,47,62,0.98))',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: 12,
                color: '#f7f9fb',
                padding: 12,
                boxShadow: '0 10px 30px rgba(0, 224, 255, 0.2)',
                backdropFilter: 'blur(20px)',
                zIndex: 1005
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #22d3ee, #3b82f6)', display:'flex', alignItems:'center', justifyContent:'center' }}>🧠</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Transaction Patterns Intelligence Agent</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{biAnalysisResult?.timestamp ? `Updated ${biAnalysisResult.timestamp}` : 'Ready'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setBiPanelOpen(false)} style={{ background:'transparent', border:'1px solid rgba(0,224,255,0.2)', color:'#94a3b8', fontSize: 20, cursor:'pointer', borderRadius: 8, width: 32, height: 32, lineHeight: '28px' }}>×</button>
                </div>
              </div>

              {/* Tab bar parsed from content headings */}
              {(() => {
                const lines = String(biAnalysisResult?.content||'').split('\n').map(l=>l.trim()).filter(Boolean);
                const tabs = [];
                let current = { id:'overview', title:'Overview', items:[] };
                const pushCurrent = () => { if (current && current.items.length) tabs.push(current); };
                const isHeading = (s) => /^\*\*[0-9]\)\s+/.test(s) || /^\*\*[A-Za-z]/.test(s);
                lines.forEach((ln)=>{
                  if (isHeading(ln)){
                    const title = ln.replace(/\*\*/g,'').trim();
                    if (/^\d+\)/.test(title)){
                      const id = title.split(')')[1]?.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-')||'section';
                      pushCurrent();
                      current = { id, title, items:[] };
                    } else {
                      // First bold line becomes overview header
                      if (!tabs.length && current.items.length===0){
                        current.title = title;
                      } else {
                        current.items.push(ln);
                      }
                    }
                  } else {
                    current.items.push(ln);
                  }
                });
                pushCurrent();
                const active = tabs.find(t=>t.id===biActiveTab) || tabs[0] || { id:'overview', title:'Overview', items:[] };

                return (
                  <>
                    <div style={{ display:'flex', flexWrap:'wrap', gap: 8, borderBottom: '1px solid #3a4459', paddingBottom: 8, width:'100%', overflowX:'hidden' }}>
                      {tabs.map(t => (
                        <button key={t.id}
                          title={t.title}
                          onClick={()=>setBiActiveTab(t.id)}
                          style={{
                            background:'transparent',
                            border:'none',
                            color: biActiveTab===t.id ? '#00e0ff' : '#f7f9fb',
                            borderBottom: biActiveTab===t.id ? '2px solid #00e0ff' : 'none',
                            padding:'6px 10px',
                            cursor:'pointer',
                            fontWeight: biActiveTab===t.id ? 700 : 500,
                            maxWidth: 180,
                            whiteSpace:'nowrap',
                            textOverflow:'ellipsis',
                            overflow:'hidden',
                            flex: '0 1 auto'
                          }}>{t.title}</button>
                      ))}
                    </div>

                    <div role="region" aria-label="Business Intelligence Analysis" style={{ marginTop: 10, height: 420, overflowY: 'auto' }}>
                      {active.items.map((line, index) => {
                        let cleanLine = String(line).trim();
                        if (!cleanLine) return null;
                        cleanLine = cleanLine.replace(/^["']|["']$/g, '');
                        cleanLine = cleanLine.replace(/\\n/g, '\n');
                        if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
                          return (
                            <div key={index} style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'10px 0 8px 0' }}>
                              {cleanLine.replace(/\*\*/g, '')}
                            </div>
                          );
                        } else if (cleanLine.match(/^\*\s+\*\*.*?\*\*/)) {
                          const match = cleanLine.match(/^\*\s+\*\*(.*?)\*\*:?:?\s*(.*)/);
                          if (match) {
                            return (
                              <div key={index} style={{ display:'flex', gap:10, alignItems:'flex-start', background:'rgba(30,39,56,0.6)', border:'1px solid rgba(58,68,89,0.3)', borderRadius:10, padding:'10px 12px', margin:'8px 0', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' }}>
                                <span style={{ color:'#10b981', fontWeight:900 }}>•</span>
                                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                  <span style={{ fontWeight:700, color:'#e2e8f0', fontSize:13 }}>{match[1]}:</span>
                                  <span style={{ color:'#cbd5e1', fontSize:13 }}> {match[2]}</span>
                                </div>
                              </div>
                            );
                          }
                        } else if (cleanLine.startsWith('*') || cleanLine.startsWith('•') || cleanLine.startsWith('-')) {
                          return (
                            <div key={index} style={{ display:'flex', gap:10, alignItems:'flex-start', background:'rgba(30,39,56,0.6)', border:'1px solid rgba(58,68,89,0.3)', borderRadius:10, padding:'10px 12px', margin:'8px 0', boxShadow:'0 4px 12px rgba(0,0,0,0.12)' }}>
                              <span style={{ color:'#10b981', fontWeight:900 }}>•</span>
                              <span style={{ color:'#cbd5e1', fontSize:13 }}>
                                {cleanLine.replace(/^[*•-]\s*/, '')}
                              </span>
                            </div>
                          );
                        } else if (cleanLine.length > 0) {
                          return (
                            <div key={index} style={{ color:'#e2e8f0', fontSize:13, lineHeight:1.5, margin:'6px 0' }}>
                              {cleanLine}
                            </div>
                          );
                        }
                        return null;
                      })}
                      {biAnalysisResult.dataPoints ? (
                        <div style={{ padding:'10px 0', borderTop:'1px solid rgba(58,68,89,0.5)', fontSize:12, color:'#94a3b8', marginTop:10 }}>
                          {biAnalysisResult.dataPoints} data points analyzed
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <TransactionKPITiles 
            kpis={visibleData?.kpis || dashboardData?.kpis || {}}
            isLoading={false}
            onTileClick={handleKPIClick}
          />
          
          {/* Filter Status */}
          {filterError && (
            <div className={styles.filterError}>
              <span className={styles.filterErrorIcon}>⚠️</span>
              {filterError}
            </div>
          )}
          
          <div className={styles.chartsGrid}>
            <div className={styles.dashboardCard} data-type="chart" data-title="Transaction Volume & Average Value Over Time" data-chart-type="time_series">
              <h3 
                className={`${styles.chartTitle} ${styles.tooltipElement}`}
                title="Shows transaction volume and average amounts over time.&#10;Blue line represents transaction count, orange line shows average values. Click for details, Shift+click to multi-select."
              >
                Transaction Volume & Average Value Over Time
              </h3>
              <DualAxisTimeSeries data={visibleData?.timeSeries || dashboardData?.timeSeries || []} onDataPointClick={handleTimeSeriesClick} selectedPoints={selectedPointsGlobal} />
            </div>
            <div className={styles.dashboardCard} data-type="chart" data-title="Temporal Heatmap of Transactions" data-chart-type="heatmap">
              <h3 
                className={`${styles.chartTitle} ${styles.tooltipElement}`}
                title="Visual representation of transaction patterns by day and hour.&#10;Darker colors indicate higher transaction volumes. Click for details, Shift+click to multi-select."
              >
                Temporal Heatmap of Transactions
              </h3>
              <TemporalHeatmap 
                data={visibleData?.temporalHeatmap || dashboardData?.temporalHeatmap || []} 
                onCellClick={handleHeatmapCellClick}
                highlightCells={selectedPointsGlobal.filter(p=>p.chartId==='heatmap').map(p=>({day:p.metadata?.day, hour:p.metadata?.hour}))}
              />
            </div>
            <div className={styles.dashboardCard} data-type="chart" data-title="Product Performance Matrix (Value vs. Quantity)" data-chart-type="scatter">
              <h3 
                className={`${styles.chartTitle} ${styles.tooltipElement}`}
                title="Scatter plot showing product performance by sales value vs quantity sold.&#10;Products in the top-right are high performers. Click for details, Shift+click to multi-select."
              >
                Product Performance Matrix (Value vs. Quantity)
              </h3>
              <ProductMatrixScatterPlot data={visibleData?.productMatrix || dashboardData?.productMatrix || []} onInsight={handleChartInsight} selectedPoints={selectedPointsGlobal} />
            </div>
            <div className={styles.dashboardCard} data-type="chart" data-title="Distribution of Transaction Amounts" data-chart-type="histogram">
              <h3 
                className={`${styles.chartTitle} ${styles.tooltipElement}`}
                title="Histogram showing how transaction amounts are distributed.&#10;Helps identify common transaction sizes and outliers. Click for details, Shift+click to multi-select."
              >
                Distribution of Transaction Amounts
              </h3>
              <AmountDistributionHistogram data={visibleData?.amountDistribution || dashboardData?.amountDistribution || []} onInsight={handleChartInsight} selectedPoints={selectedPointsGlobal} />
            </div>
          </div>
        </div>
      )}



      <div 
        className={styles.tooltipElement}
        title="AI-powered chat assistant for transaction analysis.&#10;Ask questions about your data and get intelligent insights."
      >
        {/* Business Intelligence Brain Icon - positioned on top of FloatingAI */}
        <div className={styles.brainIconContainer}>
          <button 
            className={styles.brainIconButton}
            onClick={() => {
              performBusinessIntelligenceAnalysis();
            }}
            disabled={biAnalysisLoading}
            title={'Generate Business Intelligence Analysis'}
          >
            <span role="img" aria-label="AI Brain">🧠</span>
          </button>
        </div>

        {/* FloatingAIChat + Above-brain popup button (matching PF UI) */}
        <FloatingAIChat 
          key={chatSeed} 
          insights={chatInsights.length ? chatInsights : insights} 
          dashboardData={dashboardData}
        />
      </div>

      <InsightModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        subtitle={modalSubtitle}
        metrics={modalMetrics}
        bullets={modalBullets}
        staticPoints={modalStaticPoints}
        enableAI={false}
        onDownloadCSV={onDownloadCSV}
        onFilterToThis={onFilterToThis}
      />

      <NeonPopup
        open={popupOpen}
        title={popupTitle}
        items={popupItems}
        sections={popupSections}
        onClose={() => setPopupOpen(false)}
      />





  {/* Removed duplicate FloatingAIChat to prevent multiple listeners and confusion */}
    </div>
  );
};

export default TransactionPatternsDashboard;