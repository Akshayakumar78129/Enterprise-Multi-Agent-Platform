import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChurnCustomer } from '../../types';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface ProbabilityHistogramProps {
  customers: ChurnCustomer[];
  data: ChurnCustomer[];
  probabilities?: number[];
  thresholds?: number[];
  onThresholdChange?: (thresholds: number[]) => void;
  binCount?: number;
  onBinCountChange?: (binCount: number) => void;
  onBinClick?: (binStart: number, binEnd: number, customerCount: number, event: React.MouseEvent) => void;
}

const colors = ['#00E676', '#FFB800', '#FF8800', '#FF4444'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function ProbabilityHistogram({
  customers = [],
  data = [],
  probabilities,
  thresholds = [0.3, 0.6, 0.8],
  onThresholdChange,
  binCount = 25,
  onBinCountChange,
  onBinClick
}: ProbabilityHistogramProps) {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  
  // Use customers from props, fallback to data prop
  const customerData = customers.length > 0 ? customers : data;
  const customerProbabilities = probabilities || customerData.map(c => c.churn_probability);

  const bins = useMemo(() => {
    if (!customerProbabilities.length) return [];
    const min = 0, max = 1;
    const width = (max - min) / binCount;
    const counts = Array(binCount).fill(0);
    customerProbabilities.forEach(p => {
      const idx = Math.min(Math.floor((p - min) / width), binCount - 1);
      counts[idx]++;
    });
    return counts;
  }, [customerProbabilities, binCount]);

  const binEdges = Array.from({ length: binCount + 1 }, (_, i) => i / binCount);
  const maxCount = Math.max(...bins, 1);

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
        background: 'radial-gradient(circle at 80% 20%, rgba(255, 184, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255, 68, 68, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 24, 
        zIndex: 1 
      }}>
        <div style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #FFB800, #FF4444)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          📈
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
          Churn Probability Distribution
        </h3>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Plot
          data={[{
            x: binEdges.slice(0, -1).map((b, i) => (b + binEdges[i + 1]) / 2),
            y: bins,
            type: 'bar',
            marker: {
              color: binEdges.slice(0, -1).map((b, i) => {
                const baseColor = b < thresholds[0] ? colors[0] :
                                 b < thresholds[1] ? colors[1] :
                                 b < thresholds[2] ? colors[2] : colors[3];
                return hoveredBin === i ? `${baseColor}FF` : `${baseColor}CC`;
              }),
              line: {
                color: binEdges.slice(0, -1).map(b =>
                  b < thresholds[0] ? colors[0] :
                  b < thresholds[1] ? colors[1] :
                  b < thresholds[2] ? colors[2] : colors[3]
                ),
                width: 2
              }
            },
            hovertemplate: '<b>Probability Range:</b> %{x:.2f}<br><b>Customers:</b> %{y}<br><extra></extra>',
            hoverlabel: {
              bgcolor: 'rgba(30, 39, 56, 0.95)',
              bordercolor: '#00e0ff',
              font: { color: '#f7f9fb', size: 14 }
            }
          }]}
          layout={{
            margin: { l: 60, r: 20, t: 20, b: 60 },
            height: 300,
            xaxis: {
              title: {
                text: 'Churn Probability',
                font: { color: '#f7f9fb', size: 14, family: 'Inter' }
              },
              range: [0, 1],
              showgrid: true,
              gridcolor: 'rgba(255, 255, 255, 0.1)',
              zeroline: false,
              tickfont: { color: '#f7f9fb', size: 12 },
              tickformat: '.1%'
            },
            yaxis: {
              title: {
                text: 'Customer Count',
                font: { color: '#f7f9fb', size: 14, family: 'Inter' }
              },
              showgrid: true,
              gridcolor: 'rgba(255, 255, 255, 0.1)',
              zeroline: false,
              tickfont: { color: '#f7f9fb', size: 12 }
            },
            shapes: [
              ...thresholds.map((t, i) => ({
                type: 'line' as const,
                x0: t, x1: t, y0: 0, y1: maxCount,
                line: { 
                  color: colors[i + 1], 
                  width: 3, 
                  dash: 'dash' as const 
                }
              })),
              // Add gradient background zones
              ...thresholds.map((t, i) => ({
                type: 'rect' as const,
                x0: i === 0 ? 0 : thresholds[i - 1],
                x1: t,
                y0: 0,
                y1: maxCount,
                fillcolor: `${colors[i]}15`,
                line: { width: 0 }
              })),
              // Last zone
              {
                type: 'rect' as const,
                x0: thresholds[thresholds.length - 1],
                x1: 1,
                y0: 0,
                y1: maxCount,
                fillcolor: `${colors[colors.length - 1]}15`,
                line: { width: 0 }
              }
            ],
            showlegend: false,
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            font: { family: 'Inter, sans-serif' }
          }}
          config={{ 
            displayModeBar: false,
            responsive: true
          }}
          style={{ width: '100%', height: '100%' }}
          onHover={(event: any) => {
            if (event.points && event.points[0]) {
              setHoveredBin(event.points[0].pointIndex);
            }
          }}
          onUnhover={() => setHoveredBin(null)}
          onClick={(event: any) => {
            if (onBinClick && event.points && event.points[0]) {
              const point = event.points[0];
              const binIndex = point.pointIndex;
              const binStart = binEdges[binIndex];
              const binEnd = binEdges[binIndex + 1];
              const customerCount = bins[binIndex];
              
              const mockEvent = {
                clientX: event.event?.clientX || window.innerWidth / 2,
                clientY: event.event?.clientY || window.innerHeight / 2,
                preventDefault: () => {},
                stopPropagation: () => {}
              } as React.MouseEvent;
              
              onBinClick(binStart, binEnd, customerCount, mockEvent);
            }
          }}
        />
      </div>

      {/* Risk level legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        padding: 16,
        background: 'rgba(15, 20, 25, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(0, 224, 255, 0.2)',
        zIndex: 1
      }}>
        {riskLabels.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: colors[i],
              boxShadow: `0 0 8px ${colors[i]}60`
            }} />
            <span style={{ fontSize: 12, color: '#f7f9fb', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ 
        marginTop: 16, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16,
        padding: 12,
        background: 'rgba(15, 20, 25, 0.6)',
        borderRadius: 8,
        zIndex: 1
      }}>
        <span style={{ fontSize: 14, color: '#f7f9fb', fontWeight: 500 }}>Bins:</span>
        <input 
          type="range" 
          min={10} 
          max={50} 
          value={binCount} 
          onChange={e => onBinCountChange?.(parseInt(e.target.value))}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: 'rgba(0, 224, 255, 0.2)',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <span style={{ fontSize: 14, color: '#00e0ff', fontWeight: 600, minWidth: 30 }}>{binCount}</span>
        <button 
          style={{ 
            background: 'linear-gradient(135deg, #00e0ff, #7c3aed)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '6px 12px', 
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }} 
          onClick={() => onBinCountChange?.(25)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 224, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
} 