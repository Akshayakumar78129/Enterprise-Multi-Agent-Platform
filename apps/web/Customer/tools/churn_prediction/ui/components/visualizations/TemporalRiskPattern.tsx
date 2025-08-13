import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChurnCustomer } from '../../types';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface RiskTimeSeriesDatum {
  date: string;
  low: number;
  medium: number;
  high: number;
  very_high: number;
}

export interface TemporalRiskPatternProps {
  customers?: ChurnCustomer[];
  data?: ChurnCustomer[];
  riskTimeSeries?: RiskTimeSeriesDatum[];
}

const colors = ['#00E676', '#FFB800', '#FF8800', '#FF4444'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function TemporalRiskPattern({ 
  customers = [], 
  data = [], 
  riskTimeSeries 
}: TemporalRiskPatternProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Generate mock time series data if not provided
  const mockTimeSeries = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data: RiskTimeSeriesDatum[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic risk distribution with some trends
      const baseHigh = 15 + Math.sin(i * 0.1) * 5;
      const baseMedium = 25 + Math.cos(i * 0.15) * 8;
      const baseLow = 45 + Math.sin(i * 0.08) * 10;
      const baseVeryHigh = 8 + Math.random() * 4;
      
      data.push({
        date: date.toISOString().split('T')[0],
        low: Math.max(0, Math.round(baseLow + Math.random() * 10 - 5)),
        medium: Math.max(0, Math.round(baseMedium + Math.random() * 8 - 4)),
        high: Math.max(0, Math.round(baseHigh + Math.random() * 6 - 3)),
        very_high: Math.max(0, Math.round(baseVeryHigh + Math.random() * 4 - 2))
      });
    }
    
    return data;
  }, [timeRange]);

  const timeSeriesData = riskTimeSeries || mockTimeSeries;
  const dates = timeSeriesData.map(d => d.date);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous * 1.1) return '📈';
    if (current < previous * 0.9) return '📉';
    return '➡️';
  };

  const currentData = timeSeriesData[timeSeriesData.length - 1];
  const previousData = timeSeriesData[timeSeriesData.length - 2];

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minWidth: 400, 
      minHeight: 450, 
      background: 'rgba(30, 39, 56, 0.9)', 
      backdropFilter: 'blur(20px)',
      borderRadius: 20, 
      padding: 32, 
      position: 'relative', 
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1)', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid rgba(0, 224, 255, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 80% 80%, rgba(255, 136, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(0, 224, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 24, 
        zIndex: 1 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 24,
            background: 'linear-gradient(135deg, #FF8800, #00e0ff)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            📊
          </div>
          <h3 style={{ 
            margin: 0, 
            color: '#f7f9fb', 
            fontWeight: 800, 
            fontSize: 22,
            background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Risk Trends Over Time
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: timeRange === range 
                  ? 'linear-gradient(135deg, #00e0ff, #7c3aed)' 
                  : 'rgba(15, 20, 25, 0.8)',
                color: '#f7f9fb',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range) {
                  e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range) {
                  e.currentTarget.style.background = 'rgba(15, 20, 25, 0.8)';
                }
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Plot
          data={[
            {
              x: dates,
              y: timeSeriesData.map(d => d.low),
              stackgroup: 'one',
              name: 'Low Risk',
              fillcolor: `${colors[0]}80`,
              line: { color: colors[0], width: 2 },
              type: 'scatter',
              mode: 'none',
              hovertemplate: '<b>Low Risk</b><br>Date: %{x}<br>Count: %{y}<br><extra></extra>',
            },
            {
              x: dates,
              y: timeSeriesData.map(d => d.medium),
              stackgroup: 'one',
              name: 'Medium Risk',
              fillcolor: `${colors[1]}80`,
              line: { color: colors[1], width: 2 },
              type: 'scatter',
              mode: 'none',
              hovertemplate: '<b>Medium Risk</b><br>Date: %{x}<br>Count: %{y}<br><extra></extra>',
            },
            {
              x: dates,
              y: timeSeriesData.map(d => d.high),
              stackgroup: 'one',
              name: 'High Risk',
              fillcolor: `${colors[2]}80`,
              line: { color: colors[2], width: 2 },
              type: 'scatter',
              mode: 'none',
              hovertemplate: '<b>High Risk</b><br>Date: %{x}<br>Count: %{y}<br><extra></extra>',
            },
            {
              x: dates,
              y: timeSeriesData.map(d => d.very_high),
              stackgroup: 'one',
              name: 'Very High Risk',
              fillcolor: `${colors[3]}80`,
              line: { color: colors[3], width: 2 },
              type: 'scatter',
              mode: 'none',
              hovertemplate: '<b>Very High Risk</b><br>Date: %{x}<br>Count: %{y}<br><extra></extra>',
            },
          ]}
          layout={{
            margin: { l: 60, r: 20, t: 20, b: 60 },
            height: 280,
            xaxis: { 
              title: {
                text: 'Date',
                font: { color: '#f7f9fb', size: 14, family: 'Inter' }
              },
              showgrid: true,
              gridcolor: 'rgba(255, 255, 255, 0.1)',
              zeroline: false,
              tickfont: { color: '#f7f9fb', size: 11 }
            },
            yaxis: { 
              title: {
                text: 'Customer Count',
                font: { color: '#f7f9fb', size: 14, family: 'Inter' }
              },
              showgrid: true,
              gridcolor: 'rgba(255, 255, 255, 0.1)',
              zeroline: false,
              tickfont: { color: '#f7f9fb', size: 11 }
            },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            legend: { 
              orientation: 'h', 
              y: -0.2,
              x: 0.5,
              xanchor: 'center',
              font: { color: '#f7f9fb', size: 12 }
            },
            font: { family: 'Inter, sans-serif' },
            hovermode: 'x unified',
            hoverlabel: {
              bgcolor: 'rgba(30, 39, 56, 0.95)',
              bordercolor: '#00e0ff',
              font: { color: '#f7f9fb', size: 12 }
            }
          }}
          config={{ 
            displayModeBar: false,
            responsive: true
          }}
          style={{ width: '100%', height: '100%' }}
          onHover={(event: any) => {
            if (event.points && event.points[0]) {
              setHoveredDate(event.points[0].x);
            }
          }}
          onUnhover={() => setHoveredDate(null)}
        />
      </div>

      {/* Trend indicators */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(15, 20, 25, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(0, 224, 255, 0.2)',
        zIndex: 1
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          fontSize: 12,
          color: 'rgba(247, 249, 251, 0.8)'
        }}>
          {riskLabels.map((label, i) => {
            const currentValue = currentData ? Object.values(currentData)[i + 1] as number : 0;
            const previousValue = previousData ? Object.values(previousData)[i + 1] as number : 0;
            const trend = getTrendIcon(currentValue, previousValue);
            const change = previousValue ? ((currentValue - previousValue) / previousValue * 100) : 0;
            
            return (
              <div key={label} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: 8,
                background: `${colors[i]}10`,
                borderRadius: 8,
                border: `1px solid ${colors[i]}30`
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors[i],
                  boxShadow: `0 0 8px ${colors[i]}60`
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f7f9fb', fontSize: 11 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                    <span>{currentValue}</span>
                    <span>{trend}</span>
                    <span style={{ 
                      color: change > 0 ? '#FF4444' : change < 0 ? '#00E676' : '#FFB800' 
                    }}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 12,
        padding: 12,
        background: 'rgba(15, 20, 25, 0.6)',
        borderRadius: 8,
        fontSize: 12,
        color: 'rgba(247, 249, 251, 0.7)',
        textAlign: 'center',
        zIndex: 1
      }}>
        📈 Risk patterns analyzed over {timeRange} • Hover over chart for details
      </div>
    </div>
  );
} 