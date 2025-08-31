// Force reload - Updated: 2024-01-30
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from 'react-markdown';
import TransactionKPITiles from '../components/kpi/TransactionKPITiles';
import TemporalHeatmap from "../components/visualizations/TemporalHeatmap";
import DualAxisTimeSeries from "../components/visualizations/DualAxisTimeSeries";
import InsightModal from "../components/InsightModal";
import TransactionChatbot from '../components/chat/TransactionChatbot';
import TransactionChatButton from '../components/chat/TransactionChatButton';
import ChartSelectionManager from '../components/selection/ChartSelectionManager';
import FilterSection from '../components/FilterSection';
import BusinessIntelligenceAgent, { BusinessIntelligenceTrigger } from '../components/BusinessIntelligenceAgent';
const AmountDistributionHistogram = dynamic(() => import('../components/visualizations/AmountDistributionHistogram'), { ssr: false });
const ProductMatrixScatterPlot = dynamic(() => import('../components/visualizations/ProductMatrixScatterPlot'), { ssr: false });
import styles from './TransactionPatternsDashboard.module.css';

// Client-only Plotly for custom charts
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const TransactionPatternsDashboard = ({ 
  initialFilters = null,
  onDataLoad = null,
  onError = null 
}) => {
  const [dashboardData, setDashboardData] = useState(null);
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChartPoints, setSelectedChartPoints] = useState([]);
  const [chatbotMessage, setChatbotMessage] = useState('');
  const [chatbotMessagePosition, setChatbotMessagePosition] = useState(null);
  const [showBusinessIntelligence, setShowBusinessIntelligence] = useState(false);
  const [filters, setFilters] = useState(initialFilters || {
    dateRange: {
      start: '2017-01-01',
      end: '2021-12-31'
    }
  });

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
  }, []);

  const fetchData = useCallback(async (currentFilters = filters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transaction-patterns/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentFilters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      const data = result.data;

      const required = ['kpis', 'temporalHeatmap', 'paymentMethods', 'timeSeries'];
      if (!required.every(key => data && typeof data === 'object' && key in data)) {
        console.error("Data validation failed. Missing keys.", { received: Object.keys(data) });
        throw new Error('API response missing required data keys.');
      }

      setDashboardData(data);
      generateInsights(data);
      
      if (onDataLoad) {
        onDataLoad(data);
      }
    } catch (err) {
      console.error('Error fetching transaction patterns data:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, onDataLoad, onError, generateInsights]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };

  const askAI = async (userPrompt = '', mode = 'strategic', action = 'explain') => {
    const finalPrompt = userPrompt || `Explain the significance of: ${modalTitle}`;
    setAiLoading(true);
    setAiText('');
    setAiAudit(null);

    const contextForAI = modalContext || dashboardData;

    try {
      const response = await fetch('/api/insights/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          context: contextForAI,
          mode,
          action,
          source: 'transaction_patterns' // Top-level identifier for routing
        }),
      });
      if (!response.ok) throw new Error('AI API request failed');
      const result = await response.json();
      setAiText(result.text || 'No explanation received.');
      setAiAudit(result.audit || null);
    } catch (err) {
      setAiText(`Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

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

  const handleKPIClick = (kpiId) => {
    if (!dashboardData || !dashboardData.kpis) return;
    const { kpis } = dashboardData;
    
    // Open the full modal when any KPI is clicked
    openModal(
      '💳 Transaction Intelligence Dashboard',
      'AI-Powered Analysis & Insights',
      [
        { label: 'Total Transactions', value: kpis.totalTransactions.toLocaleString(), icon: '💳', trend: 8.5 },
        { label: 'Avg Transaction Value', value: `$${kpis.avgTransactionValue.toFixed(2)}`, icon: '💰', trend: 5.8 },
        { label: 'Unique Customers', value: kpis.uniqueCustomers.toLocaleString(), icon: '👥', trend: 12.7 },
        { label: 'Anomaly Rate', value: `${(kpis.anomalyRate || 0).toFixed(1)}%`, icon: '⚠️', trend: -2.3 },
        { label: 'Peak Hour', value: `${kpis.peakHour || 12}:00`, icon: '⏰' },
        { label: 'Top Payment', value: kpis.topPaymentMethod || 'Standard', icon: '💼', hint: `${(kpis.topPaymentPercentage || 0).toFixed(1)}% of transactions` },
      ],
      [
        `YoY Growth: ${kpis.yoyGrowth}%`,
        `MoM Growth: ${kpis.momGrowth}%`,
      ],
      kpis,
      [
        `Data from ${filters.dateRange.start} to ${filters.dateRange.end}.`
      ]
    );
  };

  const handleHeatmapCellClick = (day, hour) => {
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

    const staticPoints = [];
    if (totalForDay > 0) {
      const percOfDay = ((count / totalForDay) * 100).toFixed(1);
      staticPoints.push(`This hour accounts for ${percOfDay}% of all transactions on ${day}s.`);
    }
    if (totalForHour > 0) {
      const percOfWeekHour = ((count / totalForHour) * 100).toFixed(1);
      staticPoints.push(`This hour accounts for ${percOfWeekHour}% of all transactions at ${hour}:00 across the week.`);
    }
    if (total > 0) {
      const percOfTotal = ((count / total) * 100).toFixed(2);
      staticPoints.push(`This hour accounts for ${percOfTotal}% of all transactions.`);
    }
    staticPoints.push(`Compared to a weekly average of ${Math.round(hourlyAverage)} transactions per hour.`);
    if (count < hourlyAverage * 0.5) {
      staticPoints.push('This is a low activity period, well below average.');
    }

    // Enhanced modal with more metrics and insights
    const avgAmount = point ? point.avgAmount || 0 : 0;
    const metrics = [
      { label: 'Transaction Count', value: count.toLocaleString(), icon: '📊', trend: count > hourlyAverage ? 15 : -10 },
      { label: 'Day Total', value: totalForDay.toLocaleString(), icon: '📅' },
      { label: 'Hour Total (Week)', value: totalForHour.toLocaleString(), icon: '🕐' },
      { label: 'Hourly Average', value: Math.round(hourlyAverage).toLocaleString(), icon: '📈' },
      { label: 'Avg Amount', value: avgAmount ? `$${avgAmount.toFixed(2)}` : 'N/A', icon: '💰' },
    ];
    
    openModal(
      `🔥 Temporal Analysis: ${day} at ${hour}:00`,
      'Deep dive into transaction patterns and insights',
      metrics,
      staticPoints,
      { day, hour, count, totalForDay, totalForHour, hourlyAverage },
      []
    );
  };

  const handleChartInsight = (insight) => {
    if (!insight) return;

    const { title, subtitle, metrics, bullets, context } = insight;
    const staticPoints = [];

    if (context && context.source === 'productMatrix') {
      const totalValue = dashboardData.productMatrix.reduce((sum, p) => sum + p.total_value, 0);
      const totalQuantity = dashboardData.productMatrix.reduce((sum, p) => sum + p.total_quantity, 0);
      const valuePerc = ((context.total_value / totalValue) * 100).toFixed(1);
      const quantityPerc = ((context.total_quantity / totalQuantity) * 100).toFixed(1);
      staticPoints.push(`Accounts for ${valuePerc}% of total sales value.`);
      staticPoints.push(`Accounts for ${quantityPerc}% of total quantity sold.`);

      const avgPrice = context.total_value / context.total_quantity;
      const overallAvgPrice = totalValue / totalQuantity;
      if (avgPrice > overallAvgPrice * 1.5) {
        staticPoints.push('This is a premium-priced item.');
      } else if (avgPrice < overallAvgPrice * 0.5) {
        staticPoints.push('This is a budget-friendly item.');
      }
    } else if (context && context.source === 'amountDistribution') {
        const totalTransactions = dashboardData.kpis.totalTransactions;
        const percOfTotal = ((context.count / totalTransactions) * 100).toFixed(1);
        staticPoints.push(`This range accounts for ${percOfTotal}% of all transactions.`);

        const avgBinCount = totalTransactions / dashboardData.amountDistribution.length;
        if (context.count > avgBinCount * 1.5) {
            staticPoints.push('This is a very common transaction amount.');
        } else if (context.count < avgBinCount * 0.5) {
            staticPoints.push('This is a less common transaction amount.');
        }
    }

    openModal(title, subtitle, metrics, bullets, context, staticPoints);
  };

  const handleTimeSeriesClick = (dataPoint) => {
    if (!dataPoint || !dashboardData) return;
    const { date, transaction_count, avg_amount } = dataPoint;

    const metrics = [
      { label: 'Transaction Count', value: transaction_count.toLocaleString() },
      { label: 'Average Value', value: `$${avg_amount.toFixed(2)}` },
    ];

    const context = { date, transactionCount: transaction_count, transactionValue: avg_amount };
    const staticPoints = [];
    const selectedDate = new Date(date + 'T00:00:00');
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // Monthly analysis using point-specific data
    const monthlyData = dashboardData.timeSeries.filter(d => {
      const dDate = new Date(d.date + 'T00:00:00');
      return dDate.getFullYear() === year && dDate.getMonth() === month;
    });
    const totalMonthlyTx = monthlyData.reduce((sum, d) => sum + d.transaction_count, 0);
    if (totalMonthlyTx > 0) {
      const percOfMonth = ((transaction_count / totalMonthlyTx) * 100).toFixed(1);
      staticPoints.push(`This day accounted for ${percOfMonth}% of this month's transactions.`);
    }

    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Day of week analysis using point-specific data
    const sameDayOfWeekData = dashboardData.timeSeries.filter(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek);
    const avgTxForDayOfWeek = sameDayOfWeekData.reduce((sum, d) => sum + d.transaction_count, 0) / sameDayOfWeekData.length;
    if (transaction_count > avgTxForDayOfWeek * 1.2) {
      staticPoints.push(`Transaction count was significantly above average for a ${dayOfWeek}.`);
    } else if (transaction_count < avgTxForDayOfWeek * 0.8) {
      staticPoints.push(`Transaction count was below average for a ${dayOfWeek}.`);
    }

    // Trend analysis (last 7 days) using point-specific data
    const pointIndex = dashboardData.timeSeries.findIndex(d => d.date === date);
    if (pointIndex >= 6) {
      const trendData = dashboardData.timeSeries.slice(pointIndex - 6, pointIndex + 1);
      const startValue = trendData[0].transaction_count;
      const endValue = trendData[6].transaction_count;
      if(startValue > 0) {
        const trend = ((endValue - startValue) / startValue) * 100;
        if (trend > 15) {
          staticPoints.push(`This day is part of a recent upward trend (+${Math.round(trend)}% over the last 7 days).`);
        } else if (trend < -15) {
          staticPoints.push(`This day is part of a recent downward trend (${Math.round(trend)}% over the last 7 days).`);
        }
      }
    }

    // Enhanced modal with more insights
    const enhancedMetrics = [
      { label: 'Transaction Count', value: transaction_count.toLocaleString(), icon: '📊', trend: transaction_count > avgTxForDayOfWeek ? 10 : -8 },
      { label: 'Average Value', value: `$${avg_amount.toFixed(2)}`, icon: '💵', trend: avg_amount > 2000 ? 12 : -5 },
      { label: 'Day of Week', value: dayOfWeek, icon: '📅' },
      { label: 'Avg for this Day', value: Math.round(avgTxForDayOfWeek).toLocaleString(), icon: '📈' },
    ];
    
    openModal(
      `📈 Time Series Analysis: ${date}`,
      'Detailed daily transaction insights and trends',
      enhancedMetrics,
      staticPoints,
      context,
      []
    );
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
    const newFilters = { ...filters };
    if (modalContext.date) {
      newFilters.dateRange = { start: modalContext.date, end: modalContext.date };
    } else if (modalContext.month) {
      const [y, m] = modalContext.month.split('-');
      const d = new Date(y, m, 0).getDate(); // days in month
      newFilters.dateRange = { start: `${modalContext.month}-01`, end: `${modalContext.month}-${d}` };
    }
    setFilters(newFilters);
    fetchData(newFilters);
    setModalOpen(false);
  };

  if (error) {
    return <div className={styles.errorContainer}>Error: {error}</div>;
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, -85%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -15%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    <ChartSelectionManager
      onSelectionChange={(points, isShiftSelection) => {
        setSelectedChartPoints(points);
        if (isShiftSelection && points.length > 0 && isChatOpen) {
          if (window.transactionChatbot && window.transactionChatbot.addContext) {
            points.forEach(point => {
              window.transactionChatbot.addContext({
                label: point.label,
                value: point.value,
                chartType: point.chartType,
                unit: point.unit || '',
                originalEvent: { shiftKey: true }
              });
            });
          }
        }
      }}
      onShowMessage={(message, position) => {
        console.log('Dashboard: onShowMessage called', { message, position });
        setChatbotMessage(message);
        setChatbotMessagePosition(position);
        console.log('Message state set:', { chatbotMessage: message, chatbotMessagePosition: position });
      }}
    >
    <div className={styles.dashboardContainer}>
      {/* Dashboard Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>💳 Transaction Patterns Intelligence</h1>
        <p className={styles.subtitle}>Analyze transaction patterns, discover insights, and optimize business performance</p>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Filter Section */}
      <FilterSection 
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          fetchData(newFilters);
        }}
        paymentMethods={dashboardData?.paymentMethods?.map(pm => pm.method) || []}
        isLoading={isLoading}
        />

        {isLoading && !dashboardData ? (
          <div className={styles.fullWidthCard}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading Transaction Patterns...</p>
          </div>
        ) : dashboardData && (
          <>
            <TransactionKPITiles 
            kpis={dashboardData.kpis} 
            onTileClick={handleKPIClick} 
            />
            
            <div className={styles.chartsGrid}>
              <div className={`${styles.dashboardCard} ${styles.glowEffect}`}>
                <h3 className={styles.chartTitle}>📊 Transaction Volume & Average Value Over Time</h3>
              <DualAxisTimeSeries data={dashboardData.timeSeries} onDataPointClick={handleTimeSeriesClick} />
              </div>
              <div className={`${styles.dashboardCard} ${styles.glowEffect}`}>
                <h3 className={styles.chartTitle}>🗓️ Temporal Heatmap of Transactions</h3>
              <TemporalHeatmap data={dashboardData.temporalHeatmap} onCellClick={handleHeatmapCellClick} />
              </div>
              <div className={`${styles.dashboardCard} ${styles.glowEffect}`}>
                <h3 className={styles.chartTitle}>📦 Product Performance Matrix</h3>
              <ProductMatrixScatterPlot data={dashboardData.productMatrix} onInsight={handleChartInsight} />
              </div>
              <div className={`${styles.dashboardCard} ${styles.glowEffect}`}>
                <h3 className={styles.chartTitle}>💰 Distribution of Transaction Amounts</h3>
              <AmountDistributionHistogram data={dashboardData.amountDistribution} onInsight={handleChartInsight} />
              </div>
            </div>
          </>
        )}
      </div>

      <TransactionChatbot 
        dashboardContext={{
          source_dashboard: 'transaction_patterns',
          transaction_context: {
            total_transactions: dashboardData?.kpis?.totalTransactions || 0,
            anomaly_rate: dashboardData?.kpis?.anomalyRate || 0,
            avg_transaction_amount: dashboardData?.kpis?.avgTransactionValue || 0,
            peak_hour: dashboardData?.temporalHeatmap?.[0]?.hour || '14',
            payment_methods: dashboardData?.paymentMethods || []
          },
          chart_context: {
            chartType: modalTitle || 'overview',
            activeChart: modalTitle || 'dashboard',
            clickedElement: modalContext,
            selectedPoints: modalStaticPoints
          },
          filters: filters,
          date_range: {
            start_date: filters.dateRange?.start || '2017-01-01',
            end_date: filters.dateRange?.end || '2021-12-31'
          }
        }}
        isVisible={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
      
      {/* Business Intelligence Agent */}
      {showBusinessIntelligence && (
        <BusinessIntelligenceAgent
          transactionData={{
            totalTransactions: dashboardData?.kpis?.totalTransactions,
            avgAmount: dashboardData?.kpis?.avgTransactionAmount,
            anomalyRate: dashboardData?.kpis?.anomalyRate || 3.2,
            peakHour: dashboardData?.kpis?.peakHour
          }}
          filters={filters}
          onClose={() => setShowBusinessIntelligence(false)}
        />
      )}
      
      {/* Business Intelligence Trigger Button */}
      <BusinessIntelligenceTrigger
        onClick={() => setShowBusinessIntelligence(!showBusinessIntelligence)}
        transactionData={{
          anomalyRate: dashboardData?.kpis?.anomalyRate || 3.2
        }}
      />
      
      <TransactionChatButton 
        onClick={() => setIsChatOpen(!isChatOpen)}
        isOpen={isChatOpen}
        hasNewMessage={insights && insights.length > 0}
      />

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
        onAskAI={(prompt, mode) => askAI(prompt, mode)}
        onDownloadCSV={onDownloadCSV}
        onFilterToThis={onFilterToThis}
      />
      
      {/* Enhanced Inline Insight Popup - Churn Dashboard Style */}
      {chatbotMessage && chatbotMessagePosition && (
        <div
          style={{
            position: 'fixed',
            left: chatbotMessagePosition.x,
            top: chatbotMessagePosition.isTopElement || chatbotMessagePosition.chartType === 'KPI Card'
              ? chatbotMessagePosition.y + 20
              : chatbotMessagePosition.y - 20,
            transform: chatbotMessagePosition.isTopElement || chatbotMessagePosition.chartType === 'KPI Card'
              ? 'translate(-50%, 0)'
              : 'translate(-50%, -100%)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '320px',
            minWidth: '280px',
            zIndex: 10000,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 60px rgba(59, 130, 246, 0.1)',
            animation: chatbotMessagePosition.isTopElement || chatbotMessagePosition.chartType === 'KPI Card'
              ? 'fadeInDown 0.3s ease-out'
              : 'fadeInUp 0.3s ease-out',
            pointerEvents: 'auto',
            overflow: 'hidden'
          }}
        >
          {/* Header with close button */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>💳</span>
              <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '14px' }}>
                Transaction Insight
              </span>
            </div>
            <button
              onClick={() => setChatbotMessage('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.6' }}>
              <ReactMarkdown
                components={{
                  strong: ({children}) => <span style={{color: '#60a5fa', fontWeight: 600}}>{children}</span>,
                  p: ({children}) => <div style={{marginBottom: '10px'}}>{children}</div>,
                  ul: ({children}) => <ul style={{margin: '6px 0', paddingLeft: '18px'}}>{children}</ul>,
                  li: ({children}) => <li style={{marginBottom: '4px', color: '#cbd5e1'}}>{children}</li>,
                  a: ({children, href}) => (
                    <button
                      onClick={() => console.log('Action:', href)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60a5fa',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: 'inherit'
                      }}
                    >
                      {children}
                    </button>
                  )
                }}
              >
                {chatbotMessage}
              </ReactMarkdown>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <button
                onClick={() => {
                  console.log('Show detailed analysis');
                  openModal(
                    '📊 Detailed Analysis',
                    'Comprehensive transaction insights',
                    [],
                    [],
                    { source: 'inline-popup' },
                    []
                  );
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Detailed analysis
              </button>
              
              <button
                onClick={() => console.log('Show trends')}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Show trends
              </button>
              
              <button
                onClick={() => console.log('Get insights')}
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#a78bfa',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Get insights
              </button>
              
              <button
                onClick={() => console.log('Export data')}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Export data
              </button>
            </div>

            {/* Footer hint */}
            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              fontSize: '11px',
              color: 'rgba(148, 163, 184, 0.7)',
              textAlign: 'center'
            }}>
              Press <strong style={{color: '#60a5fa'}}>Shift+Click</strong> to select multiple points
            </div>
          </div>
        </div>
      )}
    </div>
    </ChartSelectionManager>
    </>
  );
};

export default TransactionPatternsDashboard;