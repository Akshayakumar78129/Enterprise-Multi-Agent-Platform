import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const CustomerLifecycleJourney = ({ 
  data, 
  selectedPoints = [], 
  onShiftClick = null,
  isLoading = false 
}) => {
  const [viewMode, setViewMode] = useState('journey'); // 'journey', 'cohort', 'retention'
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const plotRef = useRef(null);
  const [lifecycleInsights, setLifecycleInsights] = useState([]);

  // Process data for lifecycle journey visualization
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return null;

    // Define lifecycle stages based on purchase frequency and recency
    const stages = {
      'New': { min: 1, max: 1, recency: [0, 30], color: '#10B981', description: 'First-time buyers' },
      'Developing': { min: 2, max: 3, recency: [0, 60], color: '#3B82F6', description: 'Building relationship' },
      'Established': { min: 4, max: 10, recency: [0, 90], color: '#8B5CF6', description: 'Regular customers' },
      'Champion': { min: 11, max: 999, recency: [0, 60], color: '#F59E0B', description: 'Loyal advocates' },
      'At Risk': { min: 2, max: 999, recency: [91, 180], color: '#EF4444', description: 'Declining engagement' },
      'Lost': { min: 1, max: 999, recency: [181, 999], color: '#6B7280', description: 'Inactive customers' }
    };

    // Categorize customers into lifecycle stages
    const customersByStage = {};
    Object.keys(stages).forEach(stage => {
      customersByStage[stage] = [];
    });

    data.forEach(customer => {
      const frequency = customer.frequency || customer.total_purchases || 0;
      const recency = customer.recencyDays || customer.recency_days || 0;
      const monetaryValue = customer.monetaryValue || customer.total_spent || 0;

      let assignedStage = 'Lost'; // default

      // Determine stage based on frequency and recency
      for (const [stageName, criteria] of Object.entries(stages)) {
        if (frequency >= criteria.min && frequency <= criteria.max &&
            recency >= criteria.recency[0] && recency <= criteria.recency[1]) {
          assignedStage = stageName;
          break;
        }
      }

      customersByStage[assignedStage].push({
        ...customer,
        stage: assignedStage,
        frequency,
        recency,
        monetaryValue
      });
    });

    // Calculate stage metrics
    const stageMetrics = Object.entries(customersByStage).map(([stage, customers]) => {
      const count = customers.length;
      const totalValue = customers.reduce((sum, c) => sum + c.monetaryValue, 0);
      const avgValue = count > 0 ? totalValue / count : 0;
      const avgFrequency = count > 0 ? customers.reduce((sum, c) => sum + c.frequency, 0) / count : 0;
      const avgRecency = count > 0 ? customers.reduce((sum, c) => sum + c.recency, 0) / count : 0;

      return {
        stage,
        count,
        totalValue,
        avgValue,
        avgFrequency,
        avgRecency,
        percentage: data.length > 0 ? (count / data.length) * 100 : 0,
        customers,
        ...stages[stage]
      };
    });

    return {
      stageMetrics,
      customersByStage,
      totalCustomers: data.length
    };
  }, [data]);

  // Generate lifecycle insights
  useEffect(() => {
    if (!processedData) return;

    const { stageMetrics, totalCustomers } = processedData;
    const insights = [];

    // Find dominant stage
    const dominantStage = stageMetrics.reduce((max, stage) => 
      stage.count > max.count ? stage : max, { count: 0, stage: '' });

    // Calculate health metrics
    const healthyStages = ['New', 'Developing', 'Established', 'Champion'];
    const healthyCount = stageMetrics
      .filter(stage => healthyStages.includes(stage.stage))
      .reduce((sum, stage) => sum + stage.count, 0);
    const healthyPct = totalCustomers > 0 ? (healthyCount / totalCustomers) * 100 : 0;

    // At-risk analysis
    const atRiskCount = stageMetrics.find(s => s.stage === 'At Risk')?.count || 0;
    const lostCount = stageMetrics.find(s => s.stage === 'Lost')?.count || 0;
    const atRiskPct = totalCustomers > 0 ? (atRiskCount / totalCustomers) * 100 : 0;
    const lostPct = totalCustomers > 0 ? (lostCount / totalCustomers) * 100 : 0;

    // Champion analysis
    const championStage = stageMetrics.find(s => s.stage === 'Champion');
    const championCount = championStage?.count || 0;
    const championPct = totalCustomers > 0 ? (championCount / totalCustomers) * 100 : 0;

    // Value analysis
    const totalValue = stageMetrics.reduce((sum, stage) => sum + stage.totalValue, 0);
    const championValue = championStage?.totalValue || 0;
    const championValuePct = totalValue > 0 ? (championValue / totalValue) * 100 : 0;

    insights.push(`👥 Dominant stage: ${dominantStage.stage} (${((dominantStage.count / totalCustomers) * 100).toFixed(1)}% of customers)`);
    insights.push(`💚 Healthy customers: ${healthyPct.toFixed(1)}% in growth/active stages`);
    
    if (championCount > 0) {
      insights.push(`🏆 Champions: ${championCount} customers (${championPct.toFixed(1)}%) drive ${championValuePct.toFixed(1)}% of value`);
    }
    
    if (atRiskCount > 0) {
      insights.push(`⚠️ At Risk: ${atRiskCount} customers (${atRiskPct.toFixed(1)}%) need immediate attention`);
    }
    
    if (lostCount > 0) {
      insights.push(`😞 Lost customers: ${lostCount} (${lostPct.toFixed(1)}%) - potential win-back targets`);
    }

    // Lifecycle distribution insight
    const newCustomers = stageMetrics.find(s => s.stage === 'New')?.count || 0;
    const establishedCustomers = stageMetrics.find(s => s.stage === 'Established')?.count || 0;
    if (newCustomers > 0 && establishedCustomers > 0) {
      const ratio = establishedCustomers / newCustomers;
      insights.push(`📊 Maturity ratio: ${ratio.toFixed(1)}:1 (established to new customers)`);
    }

    setLifecycleInsights(insights);
  }, [processedData]);

  // Generate journey flow visualization
  const generateJourneyPlot = () => {
    if (!processedData) return null;

    const { stageMetrics } = processedData;

    if (viewMode === 'journey') {
      // Sankey-style flow diagram
      const nodes = stageMetrics.map((stage, index) => ({
        label: `${stage.stage}<br>${stage.count} customers<br>$${stage.avgValue.toFixed(0)} avg`,
        color: stage.color,
        x: index * 0.15 + 0.1,
        y: 0.5
      }));

      // Create flow connections (simplified for visualization)
      const links = [];
      for (let i = 0; i < stageMetrics.length - 1; i++) {
        const source = stageMetrics[i];
        const target = stageMetrics[i + 1];
        if (source.count > 0 && target.count > 0) {
          links.push({
            source: i,
            target: i + 1,
            value: Math.min(source.count, target.count) * 0.3, // Simulated flow
            color: `${source.color}40`
          });
        }
      }

      return {
        data: [{
          type: 'sankey',
          node: {
            pad: 15,
            thickness: 20,
            line: { color: 'rgba(255,255,255,0.1)', width: 0.5 },
            label: nodes.map(n => n.label),
            color: nodes.map((n, i) => {
              // Highlight node if selectedPoints includes the stage name
              const isSelected = Array.isArray(selectedPoints) && selectedPoints.some(sp => sp.chartId === 'lifecycle_journey' && (sp.label?.includes(stageMetrics[i]?.stage)));
              return isSelected ? '#10B981' : n.color;
            }),
            x: nodes.map(n => n.x),
            y: nodes.map(n => n.y)
          },
          link: {
            source: links.map(l => l.source),
            target: links.map(l => l.target),
            value: links.map(l => l.value),
            color: links.map(l => l.color)
          }
        }],
        layout: {
          title: {
            text: 'Customer Lifecycle Journey Flow',
            font: { color: '#F8FAFC', size: 16, family: 'Inter' },
            x: 0.5
          },
          font: { color: '#F8FAFC', family: 'Inter' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 20, r: 20, t: 60, b: 20 },
          height: 400
        }
      };
    } else if (viewMode === 'cohort') {
      // Cohort retention matrix
      const cohortData = generateCohortData();
      
      return {
        data: [{
          z: cohortData.matrix,
          x: cohortData.periods,
          y: cohortData.cohorts,
          type: 'heatmap',
          colorscale: [
            [0, '#1F2937'],
            [0.2, '#374151'],
            [0.4, '#4B5563'],
            [0.6, '#6B7280'],
            [0.8, '#9CA3AF'],
            [1, '#F3F4F6']
          ],
          showscale: true,
          colorbar: {
            title: 'Retention %',
            titlefont: { color: '#F8FAFC' },
            tickfont: { color: '#F8FAFC' }
          },
          hovertemplate: 
            '<b>📅 Cohort: %{y}</b><br>' +
            '⏱️ <b>Period:</b> %{x} months since first purchase<br>' +
            '📊 <b>Retention Rate:</b> %{z:.1f}%<br>' +
            '💡 <i>Percentage of customers still active after this period</i><br>' +
            '🎯 <i>Higher retention = better customer loyalty</i><br>' +
            '<extra></extra>'
        }],
        layout: {
          title: {
            text: 'Customer Cohort Retention Analysis',
            font: { color: '#F8FAFC', size: 16, family: 'Inter' },
            x: 0.5
          },
          xaxis: { 
            title: 'Periods Since First Purchase',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)'
          },
          yaxis: { 
            title: 'Cohort (First Purchase Month)',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)'
          },
          font: { color: '#F8FAFC', family: 'Inter' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 80, r: 20, t: 60, b: 60 },
          height: 400
        }
      };
    } else {
      // Retention curve
      const retentionData = generateRetentionCurve();
      
      return {
        data: [{
          x: retentionData.periods,
          y: retentionData.retention,
          type: 'scatter',
          mode: 'lines+markers',
          line: { color: '#3B82F6', width: 3 },
          marker: { color: '#3B82F6', size: 8 },
          name: 'Overall Retention'
        }, ...stageMetrics.map(stage => ({
          x: retentionData.periods,
          y: retentionData.stageRetention[stage.stage] || [],
          type: 'scatter',
          mode: 'lines',
          line: { color: (Array.isArray(selectedPoints) && selectedPoints.some(sp => sp.chartId === 'lifecycle_journey' && sp.label?.includes(stage.stage))) ? '#10B981' : stage.color, width: 2, dash: 'dot' },
          name: stage.stage,
          visible: 'legendonly'
        }))],
        layout: {
          title: {
            text: 'Customer Retention Curves by Lifecycle Stage',
            font: { color: '#F8FAFC', size: 16, family: 'Inter' },
            x: 0.5
          },
          xaxis: { 
            title: 'Months Since First Purchase',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)'
          },
          yaxis: { 
            title: 'Retention Rate (%)',
            color: '#F8FAFC',
            gridcolor: 'rgba(255,255,255,0.1)',
            range: [0, 100]
          },
          font: { color: '#F8FAFC', family: 'Inter' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 60, r: 20, t: 60, b: 60 },
          height: 400,
          legend: {
            font: { color: '#F8FAFC' },
            bgcolor: 'rgba(0,0,0,0.3)'
          }
        }
      };
    }
  };

  // Generate cohort data (simplified simulation)
  const generateCohortData = () => {
    const cohorts = ['2023-01', '2023-02', '2023-03', '2023-04', '2023-05', '2023-06'];
    const periods = Array.from({ length: 12 }, (_, i) => i);
    
    const matrix = cohorts.map((cohort, cohortIndex) => 
      periods.map(period => {
        // Simulate retention decay
        const baseRetention = 100;
        const decay = Math.exp(-period * 0.15);
        const noise = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, baseRetention * decay + noise));
      })
    );

    return { cohorts, periods, matrix };
  };

  // Generate retention curve data
  const generateRetentionCurve = () => {
    const periods = Array.from({ length: 24 }, (_, i) => i);
    const retention = periods.map(period => {
      const decay = Math.exp(-period * 0.08);
      return 100 * decay;
    });

    const stageRetention = {};
    if (processedData) {
      processedData.stageMetrics.forEach(stage => {
        stageRetention[stage.stage] = periods.map(period => {
          const stageFactor = stage.stage === 'Champion' ? 1.2 : 
                             stage.stage === 'Established' ? 1.1 :
                             stage.stage === 'At Risk' ? 0.7 : 1.0;
          const decay = Math.exp(-period * (0.08 / stageFactor));
          return Math.min(100, 100 * decay * stageFactor);
        });
      });
    }

    return { periods, retention, stageRetention };
  };

  const plotData = generateJourneyPlot();

  // Handle plot click events
  const handlePlotClick = (event) => {
    if (!event || !event.points || !event.points[0]) return;
    const point = event.points[0];
    const isShiftClick = !!(event.event && event.event.shiftKey);
    if (!isShiftClick) return; // Shift-only interactions

    if (typeof onShiftClick === 'function' && processedData) {
      let stage = null;
      let stageIndex = 0;

      // Robust detection for Sankey node click in 'journey' mode
      if (viewMode === 'journey' && point?.fullData?.type === 'sankey') {
        // Prefer label parsing to find exact stage by name
        let label = point?.label || point?.text;
        if (!label && typeof point?.pointNumber === 'number') {
          // Try to resolve label from fullData node labels
          try {
            label = point.fullData?.node?.label?.[point.pointNumber];
          } catch {}
        }
        if (label) {
          const stageName = String(label).split('<br>')[0];
          stage = processedData.stageMetrics.find(s => s.stage === stageName) || null;
          if (stage) stageIndex = processedData.stageMetrics.indexOf(stage);
        }
        // If still not resolved (likely a link click), ignore to avoid mis-mapping
      } else {
        // Other modes (if any) fallback to index heuristics
        stageIndex = point.pointIndex ?? point.pointNumber ?? 0;
        stage = processedData.stageMetrics[stageIndex] || null;
      }

      if (stage) {
        const pointData = {
          chartId: 'customer_lifecycle',
          index: stageIndex,
          label: `${stage.stage}: ${stage.count} customers`,
          value: stage.count,
          stage: stage.stage,
          avgValue: stage.avgValue,
          totalValue: stage.totalValue
        };
        try { onShiftClick(pointData, event.event); } catch {}
      }
    }
  };

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
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
          <div>Loading lifecycle journey...</div>
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
        No customer lifecycle data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* View Mode Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '16px',
        justifyContent: 'center'
      }}>
        {[
          { key: 'journey', label: '🛤️ Journey', desc: 'Lifecycle flow' },
          { key: 'cohort', label: '📊 Cohort', desc: 'Retention matrix' },
          { key: 'retention', label: '📈 Retention', desc: 'Retention curves' }
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
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Main Visualization */}
      <div style={{ height: 400, width: '100%' }}>
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
          />
        )}
      </div>

      {/* Stage Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '8px', 
        marginTop: '16px' 
      }}>
        {processedData.stageMetrics.map(stage => (
          <div
            key={stage.stage}
            style={{
              background: selectedSegment?.stage === stage.stage ? 
                `${stage.color}20` : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${stage.color}40`,
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setSelectedSegment(stage)}
          >
            <div style={{ 
              color: stage.color, 
              fontSize: '11px', 
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {stage.stage}
            </div>
            <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: '700' }}>
              {stage.count.toLocaleString()}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: '10px' }}>
              ${stage.avgValue.toFixed(0)} avg
            </div>
          </div>
        ))}
      </div>

      {/* Selected Stage Details */}
      {selectedSegment && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <div style={{ 
            color: selectedSegment.color, 
            fontSize: '14px', 
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {selectedSegment.stage} Stage Details
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '12px',
            fontSize: '12px'
          }}>
            <div>
              <div style={{ color: '#9CA3AF' }}>Customers</div>
              <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                {selectedSegment.count.toLocaleString()} ({selectedSegment.percentage.toFixed(1)}%)
              </div>
            </div>
            <div>
              <div style={{ color: '#9CA3AF' }}>Avg Value</div>
              <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                ${selectedSegment.avgValue.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: '#9CA3AF' }}>Avg Frequency</div>
              <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                {selectedSegment.avgFrequency.toFixed(1)}
              </div>
            </div>
            <div>
              <div style={{ color: '#9CA3AF' }}>Avg Recency</div>
              <div style={{ color: '#F8FAFC', fontWeight: '600' }}>
                {selectedSegment.avgRecency.toFixed(0)} days
              </div>
            </div>
          </div>
          <div style={{ 
            marginTop: '8px', 
            color: '#9CA3AF', 
            fontSize: '11px',
            fontStyle: 'italic'
          }}>
            {selectedSegment.description}
          </div>
        </div>
      )}

      {/* Lifecycle Insights Panel */}
      {lifecycleInsights && lifecycleInsights.length > 0 && (
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
            🛤️ Customer Lifecycle Insights
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '8px' 
          }}>
            {lifecycleInsights.map((insight, idx) => (
              <div 
                key={idx} 
                style={{ 
                  fontSize: 11, 
                  lineHeight: 1.4, 
                  color: '#d6e3f1',
                  padding: '6px 10px',
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

export default CustomerLifecycleJourney;