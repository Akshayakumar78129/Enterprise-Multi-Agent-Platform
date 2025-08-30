import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { handleChartClick } from '../../utils/chartSelectionHelper';
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const AmountDistributionHistogram = ({ data, onInsight, selectedPoints = [] }) => {
  const [keyPoints, setKeyPoints] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null); // { binName, count, pct, meaning, x, y }
  const containerRef = useRef(null);

  const explainAmountBin = (binName) => {
    if (!binName) return 'Transactions in this amount bucket';
    const range = binName.match(/\$(\d+)-\$(\d+)/);
    const plus = binName.match(/\$(\d+)\+/);
    if (range) {
      const a = parseInt(range[1], 10);
      const b = parseInt(range[2], 10);
      return `$${a.toLocaleString()} to $${b.toLocaleString()} transactions`;
    }
    if (plus) {
      const a = parseInt(plus[1], 10);
      return `$${a.toLocaleString()} or more transactions`;
    }
    return 'Transactions in this amount bucket';
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Calculate insights
    const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
    const sortedByCount = [...data].sort((a, b) => b.count - a.count);
    const mostCommonBin = sortedByCount[0];
    
    // Calculate cumulative percentages
    const cumulativeData = data.map((d, i) => {
      const cumulative = data.slice(0, i + 1).reduce((sum, item) => sum + item.count, 0);
      return { ...d, cumulative, percentage: (cumulative / totalTransactions) * 100 };
    });
    
    // Find where 80% of transactions fall (Pareto analysis)
    const pareto80 = cumulativeData.find(d => d.percentage >= 80);
    const pareto50 = cumulativeData.find(d => d.percentage >= 50);
    
    // Calculate average transaction amount (weighted by frequency)
    const weightedSum = data.reduce((sum, d) => {
      // Extract numeric value from bin name (e.g., "$50-$100" -> 75)
      const binMatch = d.binName.match(/\$(\d+)-\$(\d+)/);
      const avgBinValue = binMatch ? (parseInt(binMatch[1]) + parseInt(binMatch[2])) / 2 : 0;
      return sum + (avgBinValue * d.count);
    }, 0);
    const avgTransactionAmount = totalTransactions > 0 ? weightedSum / totalTransactions : 0;
    
    // Find high-value transactions (typically last few bins)
    const highValueBins = data.slice(-2); // Last 2 bins
    const highValueCount = highValueBins.reduce((sum, d) => sum + d.count, 0);
    const highValuePercentage = totalTransactions > 0 ? (highValueCount / totalTransactions) * 100 : 0;

    setKeyPoints([
      `★ Most common: ${mostCommonBin.binName} (${mostCommonBin.count.toLocaleString()} transactions, ${((mostCommonBin.count / totalTransactions) * 100).toFixed(1)}%)`,
      `📊 50% of transactions: ${pareto50?.binName || 'N/A'} and below`,
      `🎯 80% of transactions: ${pareto80?.binName || 'N/A'} and below (Pareto principle)`,
      `💎 High-value transactions (${data.slice(-2).map(d => d.binName).join(', ')}): ${highValuePercentage.toFixed(1)}% of total`,
      `📈 Estimated avg transaction: $${avgTransactionAmount.toFixed(2)}`
    ]);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card title="Transaction Amount Distribution" isLoading={false}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "#5891cb",
          }}
        >
          No transaction amount data available
        </div>
      </Card>
    );
  }

  const selectedBins = new Set((selectedPoints||[]).filter(p => p.chartId === 'histogram').map(p => p.label));
  const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
  
  const plotData = [{
    x: data.map(d => d.binName),
    y: data.map(d => d.count),
    type: 'bar',
    marker: {
      color: data.map(d => selectedBins.has(d.binName) ? 'rgba(57,255,20,0.85)' : 'rgba(251, 191, 36, 0.6)'),
      line: {
        color: data.map(d => selectedBins.has(d.binName) ? '#39ff14' : 'rgba(251, 191, 36, 1)'),
        width: data.map(d => selectedBins.has(d.binName) ? 2 : 1)
      },
    },
    hoverinfo: 'skip',
    customdata: data.map(d => [
      totalTransactions > 0 ? (d.count / totalTransactions) * 100 : 0,
      explainAmountBin(d.binName)
    ])
  }];

  const layout = {
    title: {
      text: 'Transaction Amount Distribution',
      font: { color: '#f7f9fb', size: 16 },
      x: 0.05
    },
    width: 800,
    height: 500,
    margin: { l: 80, r: 60, t: 60, b: 100 },
    paper_bgcolor: '#232a36',
    plot_bgcolor: '#232a36',
    font: { color: '#f7f9fb' },
    xaxis: {
      title: 'Transaction Amount Ranges',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false,
      tickangle: -45
    },
    yaxis: {
      title: 'Number of Transactions',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false
    },
    hovermode: 'closest',
  };

  const avgTransactionAmount = data.reduce((sum, d) => {
    const binMatch = d.binName.match(/\$(\d+)-\$(\d+)/);
    const avgBinValue = binMatch ? (parseInt(binMatch[1]) + parseInt(binMatch[2])) / 2 : 0;
    return sum + (avgBinValue * d.count);
  }, 0) / totalTransactions;

  return (
    <Card
      title="Transaction Amount Distribution"
      subtitle={`${totalTransactions.toLocaleString()} total transactions • ${data.length} amount ranges • Avg: $${avgTransactionAmount.toFixed(2)}`}
      isLoading={false}
      tooltip={
        'Histogram showing how transaction amounts are distributed across different price ranges.\n' +
        'What do these mean? Each bar groups transactions by amount range. For example: ' +
        '$0-$50 = transactions between $0 and $50, $500+ = transactions $500 or more.'
      }
    >
      <div 
        ref={containerRef}
        data-type="chart" 
        data-title="Transaction Amount Distribution" 
        data-value={`${data.length} amount ranges analyzed`}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        <div style={{ marginBottom: 8, fontSize: 12, color: '#9fb3c8' }}>
          What do these mean? Each bar groups transactions by amount range. Examples: 
          <span style={{ marginLeft: 6, color:'#e5e7eb' }}><strong>$0-$50</strong> = exactly between $0 and $50</span>,
          <span style={{ marginLeft: 6, color:'#e5e7eb' }}><strong>$100-$200</strong> = between $100 and $200</span>,
          <span style={{ marginLeft: 6, color:'#e5e7eb' }}><strong>$500+</strong> = $500 or more.</span>
        </div>
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          config={{ 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            responsive: true 
          }}
          onHover={(event) => {
            try {
              if (!event.points || event.points.length === 0) return;
              const point = event.points[0];
              const binName = point.x;
              const count = point.y;
              const pct = totalTransactions > 0 ? (count / totalTransactions) * 100 : 0;
              const meaning = explainAmountBin(binName);
              const containerRect = containerRef.current?.getBoundingClientRect();
              const x = (point.event?.clientX || 0) - (containerRect?.left || 0) + 8;
              const y = (point.event?.clientY || 0) - (containerRect?.top || 0) + 8;
              setHoverInfo({ binName, count, pct, meaning, x, y });
            } catch {}
          }}
          onUnhover={() => setHoverInfo(null)}
          onClick={(event) => {
            if (!event.points || event.points.length === 0) return;
            const point = event.points[0];
            const { x: binName, y: count } = point;
            const percentage = totalTransactions > 0 ? (count / totalTransactions) * 100 : 0;
            // Extract bin range for additional insights
            const binMatch = binName.match(/\$(\d+)-\$(\d+)/);
            const avgBinValue = binMatch ? (parseInt(binMatch[1]) + parseInt(binMatch[2])) / 2 : 0;
            const totalRevenue = count * avgBinValue;
            const isShiftClick = !!(event?.event?.shiftKey);
            if (isShiftClick) {
              // Multi-select via helper (no regular click behavior)
              handleChartClick({
                chartId: 'histogram',
                chartType: 'bar',
                label: binName,
                value: count,
                unit: ' transactions',
                index: point.pointIndex,
                metadata: { percentage, avgBinValue, totalRevenue }
              }, event.event);
              return;
            }
            // Regular click behavior
            if (onInsight) {
              const insight = {
                title: `Distribution Insights: ${binName}`,
                subtitle: 'Analysis for this transaction amount range',
                metrics: [
                  { label: 'Number of Transactions', value: count.toLocaleString() },
                  { label: 'Percentage of Total', value: `${percentage.toFixed(1)}%` },
                  { label: 'Estimated Revenue', value: `$${totalRevenue.toLocaleString()}` },
                  { label: 'Average Amount in Range', value: `$${avgBinValue.toFixed(2)}` }
                ],
                context: { binName, count, percentage, avgBinValue, totalRevenue, source: 'amountDistribution' },
              };
              onInsight(insight, event.event || event);
            }
          }}
        />
        {hoverInfo && (
          <div
            style={{
              position: 'absolute',
              top: hoverInfo.y,
              left: hoverInfo.x,
              backgroundColor: 'rgba(35, 42, 54, 0.9)',
              color: '#f7f9fb',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '14px',
              pointerEvents: 'none',
              border: '1px solid #3a4459',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            <strong>Amount: {hoverInfo.binName}</strong>
            <div>Transactions: {hoverInfo.count.toLocaleString()}</div>
            <div>Share: {hoverInfo.pct.toFixed(1)}%</div>
            <div style={{ fontSize: '12px', opacity: 0.85, color: '#a5b4fc' }}>Meaning: {hoverInfo.meaning}</div>
          </div>
        )}
      </div>
      {keyPoints && keyPoints.length > 0 && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#d6e3f1',
          fontSize: 12
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>Key Points</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {keyPoints.map((kp, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{kp}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default AmountDistributionHistogram;
