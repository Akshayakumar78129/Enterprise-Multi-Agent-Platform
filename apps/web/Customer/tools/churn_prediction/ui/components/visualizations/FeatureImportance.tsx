import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChurnCustomer } from '../../types';
import { handleChartClick } from '../../utils/chartSelectionHelper';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface FeatureImportanceDatum {
  feature: string;
  importance: number;
  description?: string;
}

export interface FeatureImportanceProps {
  customers?: ChurnCustomer[];
  data?: ChurnCustomer[];
  features?: FeatureImportanceDatum[];
  sortBy?: 'importance' | 'alphabetical';
  onSortChange?: (sortBy: 'importance' | 'alphabetical') => void;
  onFeatureClick?: (feature: string, importance: number, rank: number, event: React.MouseEvent) => void;
}

export default function FeatureImportance({ 
  customers = [], 
  data = [], 
  features, 
  sortBy = 'importance', 
  onSortChange, 
  onFeatureClick 
}: FeatureImportanceProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Generate mock feature importance data if not provided
  const mockFeatures: FeatureImportanceDatum[] = [
    { feature: 'Recency Score', importance: 0.28, description: 'Days since last purchase' },
    { feature: 'Frequency Score', importance: 0.24, description: 'Purchase frequency' },
    { feature: 'Monetary Value', importance: 0.22, description: 'Average order value' },
    { feature: 'RFM Score', importance: 0.15, description: 'Combined RFM metric' },
    { feature: 'Customer Tenure', importance: 0.08, description: 'Time as customer' },
    { feature: 'Support Tickets', importance: 0.03, description: 'Number of complaints' }
  ];

  const featureData = features || mockFeatures;

  const sorted = useMemo(() => {
    if (sortBy === 'alphabetical') {
      return [...featureData].sort((a, b) => a.feature.localeCompare(b.feature));
    }
    return [...featureData].sort((a, b) => b.importance - a.importance);
  }, [featureData, sortBy]);

  const getFeatureColor = (importance: number, index: number) => {
    if (importance > 0.25) return '#FF4444'; // High importance - red
    if (importance > 0.15) return '#FF8800'; // Medium-high - orange
    if (importance > 0.10) return '#FFB800'; // Medium - yellow
    return '#00E676'; // Low - green
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('recency')) return '⏰';
    if (feature.toLowerCase().includes('frequency')) return '🔄';
    if (feature.toLowerCase().includes('monetary') || feature.toLowerCase().includes('value')) return '💰';
    if (feature.toLowerCase().includes('rfm')) return '📊';
    if (feature.toLowerCase().includes('tenure')) return '📅';
    if (feature.toLowerCase().includes('support') || feature.toLowerCase().includes('ticket')) return '🎫';
    return '📈';
  };

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
        background: 'radial-gradient(circle at 20% 20%, rgba(0, 230, 118, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
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
            background: 'linear-gradient(135deg, #00E676, #7c3aed)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🧠
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
            AI Feature Importance
          </h3>
        </div>
        
        <select 
          value={sortBy} 
          onChange={e => onSortChange?.(e.target.value as any)} 
          style={{ 
            background: 'rgba(15, 20, 25, 0.8)', 
            color: '#f7f9fb', 
            border: '1px solid rgba(0, 224, 255, 0.3)', 
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="importance">By Importance</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <Plot
          data={[{
            type: 'bar',
            orientation: 'h',
            y: sorted.map(f => f.feature),
            x: sorted.map(f => f.importance),
            marker: {
              color: sorted.map((f, i) => {
                const baseColor = getFeatureColor(f.importance, i);
                return hoveredFeature === f.feature ? `${baseColor}FF` : `${baseColor}DD`;
              }),
              line: { 
                color: sorted.map(f => getFeatureColor(f.importance, 0)), 
                width: 2 
              }
            },
            hovertemplate: '<b>%{y}</b><br>Importance: %{x:.1%}<br><extra></extra>',
            hoverlabel: {
              bgcolor: 'rgba(30, 39, 56, 0.95)',
              bordercolor: '#00e0ff',
              font: { color: '#f7f9fb', size: 14 }
            }
          }]}
          layout={{
            margin: { l: 140, r: 20, t: 20, b: 60 },
            height: 300,
            xaxis: {
              title: {
                text: 'Feature Importance',
                font: { color: '#f7f9fb', size: 14, family: 'Inter' }
              },
              showgrid: true,
              gridcolor: 'rgba(255, 255, 255, 0.1)',
              zeroline: false,
              tickfont: { color: '#f7f9fb', size: 12 },
              tickformat: '.1%'
            },
            yaxis: {
              automargin: true,
              showgrid: false,
              zeroline: false,
              tickfont: { color: '#f7f9fb', size: 12 }
            },
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
              const pointIndex = event.points[0].pointIndex;
              setHoveredFeature(sorted[pointIndex].feature);
            }
          }}
          onUnhover={() => setHoveredFeature(null)}
          onClick={(event: any) => {
            if (event.points && event.points[0]) {
              const point = event.points[0];
              const featureIndex = point.pointIndex;
              const feature = sorted[featureIndex];
              const rank = sortBy === 'importance' ? featureIndex + 1 : featureData.findIndex(f => f.feature === feature.feature) + 1;
              
              const isShiftClick = event.event?.shiftKey;
              
              if (isShiftClick) {
                // Shift+click: Use ChartSelectionManager for multi-selection
                handleChartClick({
                  chartId: 'feature-importance',
                  chartType: 'bar-horizontal',
                  label: feature.feature,
                  value: feature.importance,
                  unit: '%',
                  index: featureIndex,
                  color: feature.importance > 0.15 ? '#ff4444' : feature.importance > 0.10 ? '#ff9800' : feature.importance > 0.05 ? '#ffeb3b' : '#4caf50',
                  metadata: {
                    rank,
                    category: feature.category || 'General'
                  }
                }, event.event);
              } else {
                // Regular click: Call the original callback for AI insights
                if (onFeatureClick) {
                  const mockEvent = {
                    clientX: event.event?.clientX || window.innerWidth / 2,
                    clientY: event.event?.clientY || window.innerHeight / 2,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    shiftKey: false
                  } as React.MouseEvent;
                  
                  onFeatureClick(feature.feature, feature.importance, rank, mockEvent);
                }
              }
            }
          }}
        />
      </div>

      {/* Feature details */}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          fontSize: 12,
          color: 'rgba(247, 249, 251, 0.8)'
        }}>
          {sorted.slice(0, 3).map((feature, i) => (
            <div key={feature.feature} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: 8,
              background: 'rgba(0, 224, 255, 0.05)',
              borderRadius: 8,
              border: `1px solid ${getFeatureColor(feature.importance, i)}40`
            }}>
              <span style={{ fontSize: 16 }}>{getFeatureIcon(feature.feature)}</span>
              <div>
                <div style={{ fontWeight: 600, color: '#f7f9fb' }}>{feature.feature}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{(feature.importance * 100).toFixed(1)}% impact</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model info */}
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
        🤖 Features ranked by Random Forest model importance • Updated in real-time
      </div>
    </div>
  );
} 