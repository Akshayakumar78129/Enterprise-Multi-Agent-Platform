import React, { useState, useMemo } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const ValueContributionAnalysis = ({ 
  data = [], 
  isLoading = false,
  onSegmentSelect = null 
}) => {
  const [selectedSegments, setSelectedSegments] = useState(['All']);
  const [viewMode, setViewMode] = useState('absolute'); // 'absolute' or 'percentage'
  const [showComparison, setShowComparison] = useState(false);

  // Analyze segment contributions
  const segmentAnalysis = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const segments = {};
    let totalValue = 0;
    let totalCustomers = data.length;

    data.forEach(customer => {
      const segment = customer.customerType || 'Unknown';
      const value = customer.predictedLTV || 0;
      
      if (!segments[segment]) {
        segments[segment] = {
          customerCount: 0,
          totalValue: 0,
          avgValue: 0,
          customers: []
        };
      }
      
      segments[segment].customerCount++;
      segments[segment].totalValue += value;
      segments[segment].customers.push(customer);
      totalValue += value;
    });

    // Calculate averages and percentages
    Object.keys(segments).forEach(segment => {
      segments[segment].avgValue = segments[segment].totalValue / segments[segment].customerCount;
      segments[segment].valuePercentage = (segments[segment].totalValue / totalValue) * 100;
      segments[segment].customerPercentage = (segments[segment].customerCount / totalCustomers) * 100;
      segments[segment].valueToCustomerRatio = segments[segment].valuePercentage / segments[segment].customerPercentage;
    });

    return { segments, totalValue, totalCustomers };
  }, [data]);

  // Color palette for segments
  const segmentColors = [
    '#00e0ff', // Electric Cyan
    '#e930ff', // Signal Magenta
    '#5fd4d6', // Lighter Cyan
    '#5891cb', // Blue
    '#3e7b97', // Blue-gray
    '#9b59b6', // Purple
    '#f39c12', // Orange
    '#e74c3c'  // Red
  ];

  const getSegmentColor = (index) => segmentColors[index % segmentColors.length];

  // Prepare stacked bar chart data
  const stackedBarData = useMemo(() => {
    if (!segmentAnalysis.segments) return [];
    
    const segments = Object.keys(segmentAnalysis.segments);
    
    return segments.map((segment, index) => ({
      x: ['Total Value'],
      y: viewMode === 'percentage' 
        ? [segmentAnalysis.segments[segment].valuePercentage]
        : [segmentAnalysis.segments[segment].totalValue],
      name: segment,
      type: 'bar',
      marker: { color: getSegmentColor(index) },
      text: viewMode === 'percentage'
        ? [`${segmentAnalysis.segments[segment].valuePercentage.toFixed(1)}%`]
        : [`$${(segmentAnalysis.segments[segment].totalValue / 1000).toFixed(0)}K`],
      textposition: 'inside',
      textfont: { color: '#0a1224', size: 12, weight: 'bold' }
    }));
  }, [segmentAnalysis, viewMode]);

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    if (!segmentAnalysis.segments) return {};
    
    const segments = Object.keys(segmentAnalysis.segments);
    
    return {
      labels: segments,
      values: segments.map(segment => segmentAnalysis.segments[segment].customerCount),
      type: 'pie',
      marker: {
        colors: segments.map((_, index) => getSegmentColor(index))
      },
      textinfo: 'label+percent',
      textfont: { color: '#f7f9fb', size: 10 },
      hole: 0.4
    };
  }, [segmentAnalysis]);

  // Prepare scatter plot data for value-to-customer ratio
  const scatterData = useMemo(() => {
    if (!segmentAnalysis.segments) return {};
    
    const segments = Object.keys(segmentAnalysis.segments);
    
    return {
      x: segments.map(segment => segmentAnalysis.segments[segment].customerPercentage),
      y: segments.map(segment => segmentAnalysis.segments[segment].valuePercentage),
      mode: 'markers+text',
      type: 'scatter',
      marker: {
        size: segments.map(segment => Math.sqrt(segmentAnalysis.segments[segment].customerCount) * 2),
        color: segments.map((_, index) => getSegmentColor(index)),
        opacity: 0.8,
        line: { width: 2, color: '#f7f9fb' }
      },
      text: segments,
      textposition: 'top center',
      textfont: { color: '#f7f9fb', size: 10 }
    };
  }, [segmentAnalysis]);

  const handleSegmentToggle = (segment) => {
    if (selectedSegments.includes(segment)) {
      setSelectedSegments(prev => prev.filter(s => s !== segment));
    } else {
      setSelectedSegments(prev => [...prev, segment]);
    }
    
    if (onSegmentSelect) {
      onSegmentSelect(selectedSegments);
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Value Contribution Analysis" isLoading={isLoading}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '360px',
          color: '#5891cb'
        }}>
          No segment data available
        </div>
      </Card>
    );
  }

  const segments = Object.keys(segmentAnalysis.segments || {});

  return (
    <div style={{ 
      backgroundColor: '#232a36', 
      borderRadius: '16px', 
      padding: '20px',
      height: '360px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#f7f9fb'
        }}>
          Value Contribution by Segment
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'absolute' ? 'percentage' : 'absolute')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: viewMode === 'percentage' ? '#00e0ff' : 'transparent',
              color: viewMode === 'percentage' ? '#0a1224' : '#f7f9fb',
              cursor: 'pointer',
              fontSize: '12px',
              border: `1px solid ${viewMode === 'percentage' ? '#00e0ff' : '#3a4459'}`
            }}
          >
            {viewMode === 'percentage' ? 'Percentage' : 'Absolute'}
          </button>
          
          {/* Reset Button */}
          <button
            onClick={() => setSelectedSegments(['All'])}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: 'transparent',
              color: '#5891cb',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 240px 240px',
        gap: '16px',
        height: 'calc(100% - 100px)'
      }}>
        {/* Stacked Bar Chart */}
        <div style={{ minHeight: '200px' }}>
          <Plot
            data={stackedBarData}
            layout={{
              barmode: 'stack',
              title: {
                text: 'Value Contribution',
                font: { color: '#f7f9fb', size: 14 },
                x: 0.5
              },
              xaxis: {
                showgrid: false,
                zeroline: false,
                showline: false,
                showticklabels: false,
                color: '#f7f9fb'
              },
              yaxis: {
                title: viewMode === 'percentage' ? 'Percentage (%)' : 'Value ($)',
                titlefont: { color: '#f7f9fb', size: 12 },
                tickfont: { color: '#f7f9fb', size: 10 },
                gridcolor: '#3a4459',
                showgrid: true
              },
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              font: { color: '#f7f9fb' },
              margin: { t: 40, r: 10, b: 40, l: 60 },
              showlegend: false
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Customer Count Pie Chart */}
        <div style={{ minHeight: '200px' }}>
          <Plot
            data={[pieChartData]}
            layout={{
              title: {
                text: 'Customer Distribution',
                font: { color: '#f7f9fb', size: 14 },
                x: 0.5
              },
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              font: { color: '#f7f9fb' },
              margin: { t: 40, r: 10, b: 10, l: 10 },
              showlegend: false
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Value-to-Customer Ratio Scatter */}
        <div style={{ minHeight: '200px' }}>
          <Plot
            data={[
              scatterData,
              {
                x: [0, 100],
                y: [0, 100],
                mode: 'lines',
                type: 'scatter',
                line: { color: '#f7f9fb', dash: 'dash', width: 1 },
                showlegend: false,
                hoverinfo: 'skip'
              }
            ]}
            layout={{
              title: {
                text: 'Value vs Customer %',
                font: { color: '#f7f9fb', size: 14 },
                x: 0.5
              },
              xaxis: {
                title: 'Customer %',
                titlefont: { color: '#f7f9fb', size: 10 },
                tickfont: { color: '#f7f9fb', size: 8 },
                gridcolor: '#3a4459',
                showgrid: true,
                range: [0, Math.max(...segments.map(s => segmentAnalysis.segments[s].customerPercentage)) + 5]
              },
              yaxis: {
                title: 'Value %',
                titlefont: { color: '#f7f9fb', size: 10 },
                tickfont: { color: '#f7f9fb', size: 8 },
                gridcolor: '#3a4459',
                showgrid: true,
                range: [0, Math.max(...segments.map(s => segmentAnalysis.segments[s].valuePercentage)) + 5]
              },
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              font: { color: '#f7f9fb' },
              margin: { t: 40, r: 10, b: 40, l: 40 },
              showlegend: false
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Segment Selector Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
        flexWrap: 'wrap'
      }}>
        {segments.map((segment, index) => (
          <button
            key={segment}
            onClick={() => handleSegmentToggle(segment)}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              border: `2px solid ${getSegmentColor(index)}`,
              backgroundColor: selectedSegments.includes(segment) 
                ? getSegmentColor(index) 
                : 'transparent',
              color: selectedSegments.includes(segment) 
                ? '#0a1224' 
                : getSegmentColor(index),
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600'
            }}
          >
            {segment} ({segmentAnalysis.segments[segment].customerCount})
          </button>
        ))}
      </div>
    </div>
  );
};

export default ValueContributionAnalysis; 