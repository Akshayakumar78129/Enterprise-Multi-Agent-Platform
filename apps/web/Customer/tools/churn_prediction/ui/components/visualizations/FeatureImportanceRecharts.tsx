import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChurnCustomer } from '../../types';

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

export default function FeatureImportanceRecharts({ 
  customers = [], 
  data = [], 
  features, 
  sortBy = 'importance', 
  onSortChange, 
  onFeatureClick 
}: FeatureImportanceProps) {
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
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

  const chartData = useMemo(() => {
    const sorted = sortBy === 'alphabetical' 
      ? [...featureData].sort((a, b) => a.feature.localeCompare(b.feature))
      : [...featureData].sort((a, b) => b.importance - a.importance);

    return sorted.map((feature, index) => ({
      ...feature,
      rank: index + 1,
      color: getFeatureColor(feature.importance),
      icon: getFeatureIcon(feature.feature)
    }));
  }, [featureData, sortBy]);

  const getFeatureColor = (importance: number) => {
    if (importance > 0.25) return '#ef4444'; // High importance - red
    if (importance > 0.15) return '#f97316'; // Medium-high - orange
    if (importance > 0.10) return '#eab308'; // Medium - yellow
    return '#22c55e'; // Low - green
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

  useEffect(() => {
    setIsVisible(true);
    // Animate data entry with staggered timing
    const timer = setTimeout(() => {
      setAnimatedData(chartData);
    }, 500);

    return () => clearTimeout(timer);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${data.color}`,
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          fontSize: 14,
          fontWeight: 500,
          maxWidth: 250
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{data.icon}</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>{data.feature}</span>
          </div>
          <div style={{ color: '#64748b', marginBottom: 4 }}>
            <div>Importance: <strong style={{ color: data.color }}>{(data.importance * 100).toFixed(1)}%</strong></div>
            <div>Rank: <strong>#{data.rank}</strong></div>
          </div>
          {data.description && (
            <div style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>
              {data.description}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload, x, y, width, height } = props;
    const isHovered = hoveredFeature === payload.feature;
    
    return (
      <g>
        {/* Glow effect when hovered */}
        {isHovered && (
          <rect
            x={x - 2}
            y={y - 2}
            width={width + 4}
            height={height + 4}
            fill={`${payload.color}40`}
            rx={4}
            style={{ filter: 'blur(6px)' }}
          />
        )}
        {/* Main bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={payload.color}
          rx={4}
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
            transition: 'all 0.2s ease',
            opacity: isHovered ? 1 : 0.9
          }}
        />
        {/* Highlight */}
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(height * 0.2, 2)}
          fill="rgba(255, 255, 255, 0.3)"
          rx={4}
        />
        {/* Icon */}
        <text
          x={x + 8}
          y={y + height / 2 + 6}
          fill="#fff"
          fontSize={14}
          fontWeight="bold"
        >
          {payload.icon}
        </text>
      </g>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minWidth: 400, 
      minHeight: 500, 
      background: 'rgba(255, 255, 255, 0.9)', 
      backdropFilter: 'blur(20px)',
      borderRadius: 20, 
      padding: 32, 
      position: 'relative', 
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 40px rgba(59, 130, 246, 0.05)', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      overflow: 'hidden',
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
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
            background: 'linear-gradient(135deg, #22c55e, #8b5cf6)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isVisible ? 'rotate(0deg)' : 'rotate(-180deg)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
          }}>
            🧠
          </div>
          <h3 style={{ 
            margin: 0, 
            color: '#1e293b', 
            fontWeight: 800, 
            fontSize: 22,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
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
            background: 'rgba(248, 250, 252, 0.8)', 
            color: '#1e293b', 
            border: '1px solid rgba(59, 130, 246, 0.2)', 
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={animatedData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
            onMouseMove={(e: any) => {
              if (e && e.activePayload && e.activePayload[0]) {
                setHoveredFeature(e.activePayload[0].payload.feature);
              }
            }}
            onMouseLeave={() => setHoveredFeature(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              type="number"
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              label={{ value: 'Feature Importance', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 } }}
            />
            <YAxis 
              type="category" 
              dataKey="feature"
              tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="importance" 
              shape={<CustomBar />}
              animationBegin={0}
              animationDuration={1800}
              animationEasing="ease-out"
            >
              {animatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature details */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.1)',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          fontSize: 12,
          color: '#64748b'
        }}>
          {chartData.slice(0, 3).map((feature, i) => (
            <div key={feature.feature} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              padding: 8,
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: 8,
              border: `1px solid ${feature.color}40`
            }}>
              <span style={{ fontSize: 16 }}>{feature.icon}</span>
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{feature.feature}</div>
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
        background: 'rgba(248, 250, 252, 0.6)',
        borderRadius: 8,
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.7s'
      }}>
        🤖 Features ranked by Random Forest model importance • Updated in real-time
      </div>
    </div>
  );
}