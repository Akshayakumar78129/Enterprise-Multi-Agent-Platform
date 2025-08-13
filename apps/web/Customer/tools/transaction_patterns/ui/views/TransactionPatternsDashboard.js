import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import TransactionKPITiles from '../components/kpi/TransactionKPITiles';
import TemporalHeatmap from "../components/visualizations/TemporalHeatmap";
import DualAxisTimeSeries from "../components/visualizations/DualAxisTimeSeries";
import InsightModal from "../components/InsightModal";
import FloatingAIChat from '../../../../../ui-common/FloatingAIChat';
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
      setAiText(result.explanation || 'No explanation received.');
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

  const handleKPIClick = () => {
    if (!dashboardData || !dashboardData.kpis) return;
    const { kpis } = dashboardData;
    openModal(
      'Key Performance Indicators',
      'Summary of transaction activity',
      [
        { label: 'Total Transactions', value: kpis.totalTransactions.toLocaleString() },
        { label: 'Avg Transaction Value', value: `$${kpis.avgTransactionValue.toFixed(2)}` },
        { label: 'Unique Customers', value: kpis.uniqueCustomers.toLocaleString() },
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

    openModal(
      `Activity for ${day} at ${hour}:00`,
      'Transactional activity details',
      [{ label: 'Transactions', value: count }],
      [],
      { day, hour, count },
      staticPoints
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

    openModal(
      `Data for ${date}`,
      'Time series data point',
      metrics,
      [],
      context,
      staticPoints
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
    <div className={styles.dashboardContainer}>
      {isLoading && !dashboardData ? (
        <div className={styles.fullWidthCard}><p>Loading Dashboard...</p></div>
      ) : dashboardData && (
        <div className={styles.mainContent}>
          <TransactionKPITiles 
            kpis={dashboardData.kpis} 
            onTileClick={handleKPIClick} 
          />
          
          <div className={styles.chartsGrid}>
            <div className={styles.dashboardCard}>
              <h3 className={styles.chartTitle}>Transaction Volume & Average Value Over Time</h3>
              <DualAxisTimeSeries data={dashboardData.timeSeries} onDataPointClick={handleTimeSeriesClick} />
            </div>
            <div className={styles.dashboardCard}>
              <h3 className={styles.chartTitle}>Temporal Heatmap of Transactions</h3>
              <TemporalHeatmap data={dashboardData.temporalHeatmap} onCellClick={handleHeatmapCellClick} />
            </div>
            <div className={styles.dashboardCard}>
              <h3 className={styles.chartTitle}>Product Performance Matrix (Value vs. Quantity)</h3>
              <ProductMatrixScatterPlot data={dashboardData.productMatrix} onInsight={handleChartInsight} />
            </div>
            <div className={styles.dashboardCard}>
              <h3 className={styles.chartTitle}>Distribution of Transaction Amounts</h3>
              <AmountDistributionHistogram data={dashboardData.amountDistribution} onInsight={handleChartInsight} />
            </div>
          </div>
        </div>
      )}

      <FloatingAIChat insights={insights} onAskAI={askAI} />

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
    </div>
  );
};

export default TransactionPatternsDashboard;