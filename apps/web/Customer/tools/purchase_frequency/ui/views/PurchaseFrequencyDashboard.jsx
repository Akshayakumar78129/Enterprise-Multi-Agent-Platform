import React, { useState, useEffect, useCallback } from "react";
import PurchaseFrequencyKPIs from "../components/kpi/PurchaseFrequencyKPIs";
import FrequencyDistribution from "../components/visualizations/FrequencyDistribution";
import CustomerSegmentQuadrant from "../components/visualizations/CustomerSegmentQuadrant";
import ValueSegmentTreemap from "../components/visualizations/ValueSegmentTreemap";
import Insight from "../components/Insight";
import InsightModal from "../components/InsightModal";
import FloatingAIChat from "../../../../../ui-common/FloatingAIChat";
import styles from './PurchaseFrequencyDashboard.module.css';

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
    }
  });
  const [topAskLoading, setTopAskLoading] = useState(false);
  const [topAskText, setTopAskText] = useState('');
  const [topAskAudit, setTopAskAudit] = useState(null);
  
  // Dashboard state
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedValueSegment, setSelectedValueSegment] = useState(null);

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
        const json = await resp.json();
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
        const json = await resp.json();
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
        const json = await resp.json();
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
        const json = await resp.json();
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

  const handleBinSelect = (bin) => {
    setSelectedBin(bin);
    const binData = data.frequencyDistribution.find(b => b.bin === bin);
    // Build basic, static key points for this bin
    const staticPts = [];
    if (binData) {
      staticPts.push(`Covers ${binData.count} customers (${binData.percentage}% of base).`);
      // Compute cumulative share up to this bin and top-3 coverage
      const dist = data.frequencyDistribution || [];
      const total = dist.reduce((s,b)=>s+(b.count||0),0);
      const sorted = dist.slice().sort((a,b)=>b.count-a.count);
      const top3 = sorted.slice(0,3).reduce((s,b)=>s+b.count,0);
      const top3Share = total>0 ? (top3/total)*100 : null;
      const cumulative = dist.reduce((acc,b)=>{
        acc.sum += b.count||0;
        if (b.bin === bin) acc.stop = acc.sum;
        return acc;
      }, { sum:0, stop:0 });
      const cumShare = total>0 ? (cumulative.stop/total)*100 : null;
      if (bin === '20+') staticPts.push('Very frequent purchasers: 20 or more purchases.');
      else if (bin.includes('-')) {
        const [lo, hi] = bin.split('-');
        staticPts.push(`Typical purchase count between ${lo} and ${hi}.`);
      } else if (!isNaN(parseInt(bin))) {
        staticPts.push(`Exact purchase count of ${parseInt(bin)} in period.`);
      }
      if (cumShare!=null) staticPts.push(`Cumulative coverage up to this bin: ${cumShare.toFixed(1)}% of customers.`);
      if (top3Share!=null) staticPts.push(`Top 3 bins together cover ${top3Share.toFixed(1)}% of customers.`);
    }
    openModal(
      `Frequency Bin: ${bin}`,
      'Distribution highlight',
      [
        { label: 'Customers', value: binData.count },
        { label: 'Share', value: `${binData.percentage}%` }
      ],
      [],
      binData,
      staticPts
    );
  };

  const handleSegmentSelect = (segment) => {
    setSelectedSegment(segment);
    const segmentData = data.customerSegments.filter(c => c.segment === segment);
    const avgValue = segmentData.reduce((acc, c) => acc + c.monetaryValue, 0) / segmentData.length;
    const totalCustomers = data.customerSegments.length || 1;
    const sharePct = ((segmentData.length / totalCustomers) * 100).toFixed(1);
    // Additional context: rank by size and value vs overall avg
    const sizeRank = (()=>{
      const counts = Object.entries(data.customerSegments.reduce((acc,c)=>{ acc[c.segment]=(acc[c.segment]||0)+1; return acc; }, {}))
        .sort((a,b)=>b[1]-a[1])
        .map(([seg])=>seg);
      const idx = counts.indexOf(segment);
      return idx>=0 ? idx+1 : null;
    })();
    const overallAvg = data.customerSegments.length ? data.customerSegments.reduce((s,c)=>s + c.monetaryValue,0) / data.customerSegments.length : null;
    const delta = overallAvg!=null ? avgValue - overallAvg : null;
    const staticPts = [
      `Segment size: ${segmentData.length} customers (${sharePct}% of customers).`,
      `Average customer value: $${avgValue.toFixed(2)}.`,
      sizeRank!=null ? `Size rank: #${sizeRank} segment by population.` : null,
      delta!=null ? `${delta>=0? 'Above' : 'Below'} overall average value by $${Math.abs(delta).toFixed(2)}.` : null,
    ].filter(Boolean);
    openModal(
      `Segment: ${segment}`,
      'Segment snapshot',
      [
        { label: 'Customers', value: segmentData.length },
        { label: 'Avg Value', value: `$${avgValue.toFixed(2)}` },
      ],
      [],
      { segment, segmentData, source: 'customerSegment' },
      staticPts
    );
  };

  const handleValueSegmentSelect = (segmentName) => {
    if (!data || !data.valueSegments || !Array.isArray(data.valueSegments)) return;
    const seg = data.valueSegments.find(s => s.segment === segmentName);
    if (!seg) return;

    setSelectedValueSegment(segmentName);

    const totalCustomers = data.valueSegments.reduce((sum, s) => sum + (s.customerCount || 0), 0);
    const totalValue = data.valueSegments.reduce((sum, s) => sum + (s.totalValue || 0), 0);

    // Rank by total value contribution
    const valueRank = data.valueSegments
      .slice()
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .map(s => s.segment)
      .indexOf(segmentName) + 1;

    const overallAvgValue = totalCustomers > 0 ? (totalValue / totalCustomers) : null;

    const staticPoints = [];
    if (totalCustomers > 0) {
      const customerShare = ((seg.customerCount || 0) / totalCustomers) * 100;
      staticPoints.push(`Represents ${customerShare.toFixed(1)}% of customers.`);
    }
    if (totalValue > 0) {
      const valueShare = ((seg.totalValue || 0) / totalValue) * 100;
      staticPoints.push(`Accounts for ${valueShare.toFixed(1)}% of total revenue.`);
    }
    if (valueRank > 0) {
      staticPoints.push(`Revenue contribution rank: #${valueRank}.`);
    }
    if (overallAvgValue != null && seg.avgValue != null) {
      const delta = seg.avgValue - overallAvgValue;
      staticPoints.push(`${delta >= 0 ? 'Above' : 'Below'} overall average value by $${Math.abs(delta).toFixed(2)} per customer.`);
    }

    const metrics = [
      { label: 'Customers', value: (seg.customerCount || 0).toLocaleString() },
      { label: 'Avg Value', value: `$${Number(seg.avgValue || 0).toLocaleString()}` },
      { label: 'Total Value', value: `$${Number(seg.totalValue || 0).toLocaleString()}` },
      { label: 'Share', value: `${seg.percentage || ((seg.totalValue && totalValue) ? ((seg.totalValue / totalValue) * 100).toFixed(1) : '0.0')}%` },
    ];

    const rawContext = {
      source: 'valueSegment',
      segment: seg.segment,
      customerCount: seg.customerCount,
      avgValue: seg.avgValue,
      totalValue: seg.totalValue,
      percentage: seg.percentage,
      totals: { totalCustomers, totalValue }
    };

    openModal(
      `Value Segment: ${seg.segment}`,
      'Value segment snapshot',
      metrics,
      [],
      rawContext,
      staticPoints
    );
  };

  // Data fetch on filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/purchase-frequency/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || "API returned error");
        }
        
        console.log('✅ Purchase frequency data received:', result.data);
        console.log('📊 Frequency Distribution:', result.data.frequencyDistribution);
        console.log('👥 Customer Segments:', result.data.customerSegments?.length);
        console.log('💰 Value Segments:', result.data.valueSegments?.length);

        // Normalize valueSegments numbers (strip commas/spaces)
        if (Array.isArray(result.data?.valueSegments)) {
          result.data.valueSegments = result.data.valueSegments.map(seg => ({
            ...seg,
            avgValue: typeof seg.avgValue === 'string' ? Number(seg.avgValue.replace(/[^0-9.\-]/g, '')) : seg.avgValue,
            totalValue: typeof seg.totalValue === 'string' ? Number(seg.totalValue.replace(/[^0-9.\-]/g, '')) : seg.totalValue,
            customerCount: typeof seg.customerCount === 'string' ? Number(seg.customerCount.replace(/[^0-9.\-]/g, '')) : seg.customerCount,
            percentage: typeof seg.percentage === 'string' ? Number(String(seg.percentage).replace(/[^0-9.\-]/g, '')) : seg.percentage,
          }));
        }
        
        // Force re-render by adding a timestamp to data
        const dataWithTimestamp = {
          ...result.data,
          _timestamp: Date.now()
        };
        
        setData(dataWithTimestamp);
        generateInsights(dataWithTimestamp);
        setIsLoading(false); // Force loading to false
      } catch (err) {
        console.error("Error fetching purchase frequency data:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

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

  // Filter data based on selections
  const getFilteredData = useCallback(() => {
    if (!data) return data;

    let filteredCustomerSegments = [...data.customerSegments];
    let filteredMainData = [...data.mainData];

    // Apply frequency bin filter
    if (selectedBin) {
      const binRange = selectedBin === '20+' ? [20, Infinity] :
                      selectedBin.includes('-') ? 
                        selectedBin.split('-').map(Number) :
                        [parseInt(selectedBin), parseInt(selectedBin)];
      
      filteredMainData = filteredMainData.filter(customer => 
        customer.total_purchases >= binRange[0] && 
        customer.total_purchases <= binRange[1]
      );
      
      const filteredCustomerIds = filteredMainData.map(c => c['Customer Key']);
      filteredCustomerSegments = filteredCustomerSegments.filter(c => 
        filteredCustomerIds.includes(c.customerId)
      );
    }

    // Apply segment filter
    if (selectedSegment) {
      filteredCustomerSegments = filteredCustomerSegments.filter(c => 
        c.segment === selectedSegment
      );
      
      const filteredCustomerIds = filteredCustomerSegments.map(c => c.customerId);
      filteredMainData = filteredMainData.filter(c => 
        filteredCustomerIds.includes(c['Customer Key'])
      );
    }
    
    return { ...data, customerSegments: filteredCustomerSegments, mainData: filteredMainData };
  }, [data, selectedBin, selectedSegment]);

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

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>Error Loading Dashboard</div>
          <div className={styles.errorMessage}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Purchase Frequency Insights</h2>
      </div>

      <div className={styles.mainContent}>
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

        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.loadingTitle}>Loading Dashboard</div>
            <div className={styles.loadingSubtitle}>Fetching purchase frequency data…</div>
          </div>
        )}

        {filteredData && !isLoading && !error && (
          <div className={styles.mainContentInner}>
            <div style={{ marginBottom: 16 }}>
              <PurchaseFrequencyKPIs kpis={filteredData.kpis} />
            </div>

            {insights && (
              <div style={{ marginTop: 12 }}>
                <h3 className={styles.chartTitle}>Key Insights</h3>
                <Insight title="High-Value Customers">{insights.highValue}</Insight>
                <Insight title="Loyal Customers">{insights.loyal}</Insight>
                <Insight title="Average Purchase Frequency">{insights.avgFrequency}</Insight>
              </div>
            )}

            <div className={styles.chartsGrid}>
              <div className={styles.dashboardCard}>
                <h3 className={styles.chartTitle}>Purchase Frequency Distribution</h3>
                <FrequencyDistribution 
                  data={filteredData.frequencyDistribution}
                  onBinClick={handleBinSelect}
                  selectedBin={selectedBin}
                />
              </div>

              <div className={styles.dashboardCard}>
                <h3 className={styles.chartTitle}>Customer Segments</h3>
                <CustomerSegmentQuadrant 
                  data={filteredData.customerSegments}
                  onSegmentSelect={handleSegmentSelect}
                  selectedSegment={selectedSegment}
                />
              </div>

              <div className={styles.dashboardCard}>
                <h3 className={styles.chartTitle}>Value Segment Treemap</h3>
                <ValueSegmentTreemap 
                  data={filteredData.valueSegments}
                  onSegmentClick={handleValueSegmentSelect}
                  selectedSegment={selectedValueSegment}
                  isLoading={false}
                />
              </div>
            </div>
          </div>
        )}

        <InsightModal
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
        />
      </div>

      <FloatingAIChat insights={insights ? [
        { id: 'high-value', title: 'High-Value Customers', content: insights.highValue, priority: 2 },
        { id: 'loyal', title: 'Loyal Customers', content: insights.loyal, priority: 3 },
        { id: 'avg-freq', title: 'Average Purchase Frequency', content: insights.avgFrequency, priority: 1 },
      ] : null} onAskAI={askAI} />
    </div>
  );
};

export default PurchaseFrequencyDashboard;