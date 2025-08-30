import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { handleChartClick } from '../../utils/chartSelectionHelper';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const PurchaseIntervalHeatmap = ({ 
  data, 
  selectedPoints = [], 
  onShiftClick = null,
  isLoading = false 
}) => {
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap', 'volume', 'value', 'patterns'
  const [selectedCell, setSelectedCell] = useState(null);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'recent', 'seasonal'
  const [aggregation, setAggregation] = useState('count'); // 'count', 'value', 'avg_value'
  const plotRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null); // { x, y, z }
  const [keyInsights, setKeyInsights] = useState([]);

  // Process heatmap data
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return null;

    // Create day of week and week number matrix
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeks = Array.from({ length: 53 }, (_, i) => i + 1); // 53 weeks in a year

    // Initialize matrices for different metrics
    const matrices = {
      count: Array(7).fill().map(() => Array(53).fill(0)),
      value: Array(7).fill().map(() => Array(53).fill(0)),
      avg_value: Array(7).fill().map(() => Array(53).fill(0)),
      frequency: Array(7).fill().map(() => Array(53).fill(0))
    };

    const cellData = {};

    // Process each data point
    data.forEach(item => {
      const dayOfWeek = item.dayOfWeek || 0;
      const weekNumber = Math.min(52, Math.max(0, (item.weekNumber || 1) - 1)); // 0-indexed, capped at 52
      const transactionCount = item.transactionCount || 0;
      const totalSales = item.totalSales || 0;
      const avgTransactionValue = item.avgTransactionValue || 0;

      if (dayOfWeek >= 0 && dayOfWeek <= 6 && weekNumber >= 0 && weekNumber <= 52) {
        matrices.count[dayOfWeek][weekNumber] += transactionCount;
        matrices.value[dayOfWeek][weekNumber] += totalSales;
        matrices.frequency[dayOfWeek][weekNumber] += 1;

        // Store cell metadata
        const cellKey = `${dayOfWeek}-${weekNumber}`;
        if (!cellData[cellKey]) {
          cellData[cellKey] = {
            dayOfWeek,
            weekNumber,
            dayName: daysOfWeek[dayOfWeek],
            transactions: [],
            totalCount: 0,
            totalValue: 0,
            dates: []
          };
        }

        cellData[cellKey].totalCount += transactionCount;
        cellData[cellKey].totalValue += totalSales;
        if (item.date) cellData[cellKey].dates.push(item.date);
      }
    });

    // Calculate average values
    Object.keys(cellData).forEach(cellKey => {
      const cell = cellData[cellKey];
      const [day, week] = cellKey.split('-').map(Number);
      if (cell.totalCount > 0) {
        matrices.avg_value[day][week] = cell.totalValue / cell.totalCount;
      }
    });

    // Calculate statistics for color scaling
    const flattenMatrix = (matrix) => matrix.flat().filter(val => val > 0);
    const stats = {
      count: {
        min: Math.min(...flattenMatrix(matrices.count)),
        max: Math.max(...flattenMatrix(matrices.count)),
        avg: flattenMatrix(matrices.count).reduce((a, b) => a + b, 0) / flattenMatrix(matrices.count).length || 0
      },
      value: {
        min: Math.min(...flattenMatrix(matrices.value)),
        max: Math.max(...flattenMatrix(matrices.value)),
        avg: flattenMatrix(matrices.value).reduce((a, b) => a + b, 0) / flattenMatrix(matrices.value).length || 0
      },
      avg_value: {
        min: Math.min(...flattenMatrix(matrices.avg_value)),
        max: Math.max(...flattenMatrix(matrices.avg_value)),
        avg: flattenMatrix(matrices.avg_value).reduce((a, b) => a + b, 0) / flattenMatrix(matrices.avg_value).length || 0
      }
    };

    return {
      matrices,
      cellData,
      stats,
      daysOfWeek,
      weeks: weeks.slice(0, 53)
    };
  }, [data]);

  // Generate key insights
  useEffect(() => {
    if (!processedData) return;

    const { matrices, daysOfWeek, stats } = processedData;
    const insights = [];
    
    // Find peak day and week
    const dayTotals = daysOfWeek.map((day, dayIndex) => ({
      day,
      total: matrices.count[dayIndex].reduce((sum, val) => sum + val, 0)
    }));
    const peakDay = dayTotals.reduce((max, curr) => curr.total > max.total ? curr : max);
    
    // Find peak week
    const weekTotals = Array.from({ length: 53 }, (_, weekIndex) => ({
      week: weekIndex + 1,
      total: matrices.count.reduce((sum, dayArray) => sum + dayArray[weekIndex], 0)
    }));
    const peakWeek = weekTotals.reduce((max, curr) => curr.total > max.total ? curr : max);
    
    // Weekend vs weekday analysis
    const weekendDays = ['Saturday', 'Sunday'];
    const weekendTotal = dayTotals.filter(d => weekendDays.includes(d.day)).reduce((sum, d) => sum + d.total, 0);
    const weekdayTotal = dayTotals.filter(d => !weekendDays.includes(d.day)).reduce((sum, d) => sum + d.total, 0);
    const totalActivity = weekendTotal + weekdayTotal;
    const weekendShare = totalActivity > 0 ? (weekendTotal / totalActivity) * 100 : 0;
    
    // Seasonal patterns (quarters)
    const q1 = weekTotals.slice(0, 13).reduce((sum, w) => sum + w.total, 0);
    const q2 = weekTotals.slice(13, 26).reduce((sum, w) => sum + w.total, 0);
    const q3 = weekTotals.slice(26, 39).reduce((sum, w) => sum + w.total, 0);
    const q4 = weekTotals.slice(39, 52).reduce((sum, w) => sum + w.total, 0);
    const quarters = [
      { name: 'Q1', total: q1 },
      { name: 'Q2', total: q2 },
      { name: 'Q3', total: q3 },
      { name: 'Q4', total: q4 }
    ];
    const peakQuarter = quarters.reduce((max, curr) => curr.total > max.total ? curr : max);

    insights.push(`★ Peak day: ${peakDay.day} (${peakDay.total.toLocaleString()} transactions)`);
    insights.push(`📅 Peak week: Week ${peakWeek.week} (${peakWeek.total.toLocaleString()} transactions)`);
    insights.push(`🏖️ Weekend activity: ${weekendShare.toFixed(1)}% of total volume`);
    insights.push(`📊 Peak quarter: ${peakQuarter.name} (${peakQuarter.total.toLocaleString()} transactions)`);
    
    // Activity distribution insights
    const avgDayActivity = totalActivity / 7;
    const highActivityDays = dayTotals.filter(d => d.total > avgDayActivity * 1.2).length;
    if (highActivityDays > 0) {
      insights.push(`🎯 High-activity days: ${highActivityDays} days above 120% of average`);
    }

    setKeyInsights(insights);
  }, [processedData, aggregation]);

  // Generate heatmap visualization
  const generateHeatmapPlot = () => {
    if (!processedData) return null;

    const { matrices, daysOfWeek, weeks, stats } = processedData;

    if (viewMode === 'heatmap') {
      const currentMatrix = matrices[aggregation] || matrices.count;
      const currentStats = stats[aggregation] || stats.count;

      // Build selected mask from selectedPoints (format index: "dayIndex-week")
      const selectedSet = new Set(
        (selectedPoints || [])
          .filter(p => p.chartId === 'purchase_interval_heatmap' || p.chartId === 'interval_heatmap')
          .map(p => String(p.index))
      );

      // Create an overlay mask for highlighting selected cells
      const overlayZ = currentMatrix.map((row, dayIdx) =>
        row.map((_, weekIdx) => selectedSet.has(`${dayIdx}-${weekIdx+1}`) ? 1 : 0)
      );

      return {
        data: [
          {
            z: currentMatrix,
            x: weeks,
            y: daysOfWeek,
            type: 'heatmap',
            colorscale: aggregation === 'value' ? [
              [0, '#0F172A'],
              [0.2, '#1E293B'],
              [0.4, '#334155'],
              [0.6, '#475569'],
              [0.8, '#64748B'],
              [1, '#F1F5F9']
            ] : aggregation === 'avg_value' ? [
              [0, '#1E1B4B'],
              [0.2, '#3730A3'],
              [0.4, '#4338CA'],
              [0.6, '#5B21B6'],
              [0.8, '#7C3AED'],
              [1, '#A855F7']
            ] : [
              [0, '#0C4A6E'],
              [0.2, '#0369A1'],
              [0.4, '#0284C7'],
              [0.6, '#0EA5E9'],
              [0.8, '#38BDF8'],
              [1, '#7DD3FC']
            ],
            showscale: true,
            colorbar: {
              title: aggregation === 'count' ? 'Transactions' : 
                     aggregation === 'value' ? 'Total Value ($)' : 'Avg Value ($)',
              titlefont: { color: '#F8FAFC', size: 12 },
              tickfont: { color: '#F8FAFC', size: 10 },
              thickness: 15,
              len: 0.8
            },
            hovertemplate: 
              '<b>📅 %{y}, Week %{x}</b><br>' +
              (aggregation === 'count' ? '📊 <b>Transactions:</b> %{z}<br>' +
                                        '💡 <i>Purchase activity level for this time period</i><br>' +
                                        '📈 <i>Higher values = peak shopping periods</i><br>' +
                                        '🎯 <i>Use for inventory and staffing planning</i>' :
               aggregation === 'value' ? '💰 <b>Total Value:</b> $%{z:,.0f}<br>' +
                                        '💡 <i>Revenue generated during this period</i><br>' +
                                        '📊 <i>Higher values = high-value shopping periods</i><br>' +
                                        '🎯 <i>Focus marketing efforts on these times</i>' :
               '💵 <b>Avg Value:</b> $%{z:,.2f}<br>' +
               '💡 <i>Average transaction size for this period</i><br>' +
               '📈 <i>Higher values = premium shopping behavior</i><br>' +
               '🎯 <i>Target high-value promotions during these times</i>') +
              '<br>🔍 <i>Click to analyze this time period in detail</i>' +
              '<extra></extra>',
            zmin: 0,
            zmax: currentStats.max
          },
          // Overlay a semi-transparent mask for selected cells
          {
            z: overlayZ,
            x: weeks,
            y: daysOfWeek,
            type: 'heatmap',
            colorscale: [
              [0, 'rgba(0,0,0,0)'],
              [1, 'rgba(16,185,129,0.75)']
            ],
            showscale: false,
            hoverinfo: 'skip',
            zmin: 0,
            zmax: 1,
            opacity: 0.6
          }
        ],
        layout: {
          title: {
            text: `Purchase Patterns - ${
              aggregation === 'count' ? 'Transaction Volume' :
              aggregation === 'value' ? 'Total Sales Value' :
              'Average Transaction Value'
            }`,
            font: { color: '#F8FAFC', size: 16, family: 'Inter' },
            x: 0.5
          },
          xaxis: { 
            title: 'Week of Year',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { size: 10 }
          },
          yaxis: { 
            title: 'Day of Week',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { size: 10 }
          },
          font: { color: '#F8FAFC', family: 'Inter' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 80, r: 60, t: 60, b: 60 },
          height: 400
        }
      };
    } else if (viewMode === 'volume') {
      // 3D surface plot for volume analysis
      return {
        data: [{
          z: matrices.count,
          x: weeks,
          y: daysOfWeek,
          type: 'surface',
          colorscale: [
            [0, '#0F172A'],
            [0.3, '#1E40AF'],
            [0.6, '#3B82F6'],
            [1, '#60A5FA']
          ],
          showscale: true,
          colorbar: {
            title: 'Transaction Volume',
            titlefont: { color: '#F8FAFC' },
            tickfont: { color: '#F8FAFC' }
          }
        }],
        layout: {
          title: {
            text: '3D Transaction Volume Surface',
            font: { color: '#F8FAFC', size: 16, family: 'Inter' },
            x: 0.5
          },
          scene: {
            xaxis: { title: 'Week of Year', color: '#F8FAFC' },
            yaxis: { title: 'Day of Week', color: '#F8FAFC' },
            zaxis: { title: 'Transactions', color: '#F8FAFC' },
            bgcolor: 'transparent'
          },
          font: { color: '#F8FAFC', family: 'Inter' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 20, r: 20, t: 60, b: 20 },
          height: 500
        }
      };
    } else if (viewMode === 'patterns') {
      // Pattern analysis - day of week aggregation
      const dayTotals = daysOfWeek.map((day, dayIndex) => {
        const dayTotal = matrices.count[dayIndex].reduce((sum, val) => sum + val, 0);
        const dayAvg = dayTotal / weeks.length;
        return { day, total: dayTotal, avg: dayAvg, index: dayIndex };
      });

      const weekTotals = weeks.map((week, weekIndex) => {
        const weekTotal = matrices.count.reduce((sum, dayArray) => sum + dayArray[weekIndex], 0);
        return { week, total: weekTotal, index: weekIndex };
      });

      return {
        data: [
          {
            x: dayTotals.map(d => d.day),
            y: dayTotals.map(d => d.total),
            type: 'bar',
            name: 'Day of Week',
            marker: { 
              color: dayTotals.map(d => d.total),
              colorscale: 'Blues',
              showscale: false
            },
            yaxis: 'y',
            hovertemplate: '%{x}<br>Total: %{y}<extra></extra>'
          },
          {
            x: weekTotals.map(w => w.week),
            y: weekTotals.map(w => w.total),
            type: 'scatter',
            mode: 'lines',
            name: 'Weekly Trend',
            line: { color: '#F59E0B', width: 2 },
            yaxis: 'y2',
            hovertemplate: 'Week %{x}<br>Total: %{y}<extra></extra>'
          }
        ],
        layout: {
          title: {
            text: 'Purchase Pattern Analysis',
            font: { color: '#F8FAFC', size: 16, family: 'Inter' },
            x: 0.5
          },
          xaxis: { 
            title: 'Day of Week / Week Number',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)'
          },
          yaxis: { 
            title: 'Daily Totals',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)',
            side: 'left'
          },
          yaxis2: {
            title: 'Weekly Totals',
            color: '#F59E0B',
            overlaying: 'y',
            side: 'right'
          },
          font: { color: '#F8FAFC', family: 'Inter' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 60, r: 60, t: 60, b: 60 },
          height: 400,
          legend: {
            font: { color: '#F8FAFC' },
            bgcolor: 'rgba(0,0,0,0.3)'
          }
        }
      };
    }

    return null;
  };

  // Handle plot click events
  const handlePlotClick = (event) => {
    if (!event || !event.points || !event.points[0]) return;
    const point = event.points[0];
    const isShiftClick = !!(event.event && event.event.shiftKey);

    if (!isShiftClick) return; // Shift-only interactions

    if (processedData) {
      const x = point.x; // week
      const y = point.y; // day name
      const z = point.z; // value
      const dayIndex = processedData.daysOfWeek.indexOf(y);
      const cellKey = `${dayIndex}-${x-1}`;
      const cellInfo = processedData.cellData[cellKey];

      const pointData = {
        chartId: 'purchase_interval_heatmap',
        datasetIndex: 0,
        index: `${dayIndex}-${x}`,
        value: z || 0,
        label: `${y}, Week ${x}: ${aggregation === 'count' ? z + ' transactions' : aggregation === 'value' ? '$' + (z || 0).toLocaleString() : '$' + (z || 0).toFixed(2) + ' avg'}`,
        dayOfWeek: y,
        weekNumber: x,
        cellInfo
      };

      // Global selection & chat (shift-enforced within helper too)
      try {
        handleChartClick({
          chartId: 'interval_heatmap',
          chartType: 'Purchase Interval Heatmap',
          label: pointData.label,
          value: pointData.value,
          unit: '',
          index: pointData.index,
          metadata: { dayIndex, week: x, aggregation }
        }, event.event, true);
      } catch {}

      // Local callback for dashboard
      try { onShiftClick?.(pointData, event.event); } catch {}
    }
  };

  const plotData = generateHeatmapPlot();

  if (isLoading) {
    return (
      <div style={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#9CA3AF'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔥</div>
          <div>Loading purchase patterns...</div>
        </div>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div style={{ 
        height: 400, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#9CA3AF'
      }}>
        No purchase interval data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Control Panel */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* View Mode Selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'heatmap', label: '🔥', desc: 'Heatmap view' },
            { key: 'volume', label: '📊', desc: '3D volume' },
            { key: 'patterns', label: '📈', desc: 'Pattern analysis' }
          ].map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              title={mode.desc}
              style={{
                background: viewMode === mode.key ? '#3B82F6' : 'rgba(59, 130, 246, 0.1)',
                color: viewMode === mode.key ? '#FFFFFF' : '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Aggregation Selector (for heatmap mode) */}
        {viewMode === 'heatmap' && (
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#F8FAFC',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <option value="count">Transaction Count</option>
            <option value="value">Total Value</option>
            <option value="avg_value">Average Value</option>
          </select>
        )}

        {/* Quick Stats */}
        <div style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          gap: '12px',
          fontSize: '11px',
          color: '#9CA3AF'
        }}>
          <div>
            <span style={{ color: '#F8FAFC', fontWeight: '600' }}>
              {Object.values(processedData.cellData).reduce((sum, cell) => sum + cell.totalCount, 0).toLocaleString()}
            </span> total transactions
          </div>
          <div>
            <span style={{ color: '#F8FAFC', fontWeight: '600' }}>
              ${Object.values(processedData.cellData).reduce((sum, cell) => sum + cell.totalValue, 0).toLocaleString()}
            </span> total value
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div style={{ height: viewMode === 'volume' ? 500 : 400, width: '100%' }}>
        {plotData && (
          <Plot
            ref={plotRef}
            data={plotData.data}
            layout={plotData.layout}
            config={{
              displayModeBar: false,
              responsive: true,
              doubleClick: false
            }}
            style={{ width: '100%', height: '100%' }}
            onClick={handlePlotClick}
            onHover={(ev) => {
              try {
                const p = ev?.points?.[0];
                if (!p) return;
                setHoverInfo({ x: p.x, y: p.y, z: p.z });
              } catch {}
            }}
            onUnhover={() => setHoverInfo(null)}
          />
        )}
      </div>

      {/* Side legend for x/y/z meanings with live hover */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: 12,
        color: '#cdd6e5'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ color: '#94A3B8' }}><strong>x</strong>: Week of Year</div>
          <div style={{ color: '#F8FAFC' }}>{hoverInfo?.x ?? '—'}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ color: '#94A3B8' }}><strong>y</strong>: Day of Week</div>
          <div style={{ color: '#F8FAFC' }}>{hoverInfo?.y ?? '—'}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ color: '#94A3B8' }}><strong>z</strong>: {aggregation === 'count' ? 'Transactions' : aggregation === 'value' ? 'Total Value ($)' : 'Avg Value ($)'}</div>
          <div style={{ color: '#F8FAFC' }}>
            {hoverInfo?.z != null ? (
              aggregation === 'count' ? Number(hoverInfo.z).toLocaleString() :
              aggregation === 'value' ? `$${Number(hoverInfo.z).toLocaleString()}` : `$${Number(hoverInfo.z).toFixed(2)}`
            ) : '—'}
          </div>
        </div>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <div style={{ 
            color: '#3B82F6', 
            fontSize: '14px', 
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {selectedCell.day}, Week {selectedCell.week}
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '12px',
            fontSize: '12px'
          }}>
            <div>
              <div style={{ color: '#9CA3AF' }}>
                {selectedCell.aggregation === 'count' ? 'Transactions' :
                 selectedCell.aggregation === 'value' ? 'Total Value' : 'Avg Value'}
              </div>
              <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                {selectedCell.aggregation === 'count' ? selectedCell.value?.toLocaleString() :
                 selectedCell.aggregation === 'value' ? `$${selectedCell.value?.toLocaleString()}` :
                 `$${selectedCell.value?.toFixed(2)}`}
              </div>
            </div>
            {selectedCell.cellInfo && (
              <>
                <div>
                  <div style={{ color: '#9CA3AF' }}>Total Transactions</div>
                  <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                    {selectedCell.cellInfo.totalCount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#9CA3AF' }}>Total Value</div>
                  <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                    ${selectedCell.cellInfo.totalValue.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#9CA3AF' }}>Avg per Transaction</div>
                  <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                    ${selectedCell.cellInfo.totalCount > 0 ? 
                      (selectedCell.cellInfo.totalValue / selectedCell.cellInfo.totalCount).toFixed(2) : '0.00'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Key Insights Panel */}
      {keyInsights && keyInsights.length > 0 && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(35,42,54,0.95)',
          border: '1px solid rgba(0,224,255,0.2)',
          borderRadius: 8,
          padding: '12px 16px'
        }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: 8, 
            color: '#00e0ff', 
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            📊 Purchase Pattern Insights
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '8px' 
          }}>
            {keyInsights.map((insight, idx) => (
              <div 
                key={idx} 
                style={{ 
                  fontSize: 11, 
                  lineHeight: 1.4, 
                  color: '#d6e3f1',
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseIntervalHeatmap;