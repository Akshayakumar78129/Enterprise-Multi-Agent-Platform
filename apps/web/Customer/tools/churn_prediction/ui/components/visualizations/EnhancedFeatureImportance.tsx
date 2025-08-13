import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDispatch } from 'react-redux';
import { ChurnCustomer } from '../../types';
import { setChatContext } from '../../state/churnPredictionSlice';
import InfoIcon from '../common/InfoIcon';

interface EnhancedFeatureImportanceProps {
  customers: ChurnCustomer[];
  data?: ChurnCustomer[];
}

const featureData = [
  { name: 'Recency', importance: 0.85, icon: '📅', description: 'Days since last purchase' },
  { name: 'Frequency', importance: 0.72, icon: '🔄', description: 'Purchase frequency' },
  { name: 'Monetary', importance: 0.68, icon: '💰', description: 'Total spend amount' },
  { name: 'Tenure', importance: 0.61, icon: '⏰', description: 'Customer lifetime' },
  { name: 'Support Tickets', importance: 0.54, icon: '🎫', description: 'Number of support requests' },
  { name: 'Product Usage', importance: 0.48, icon: '📱', description: 'Feature usage patterns' },
  { name: 'Engagement', importance: 0.42, icon: '👆', description: 'Platform engagement score' },
  { name: 'Demographics', importance: 0.35, icon: '👤', description: 'Age, location, etc.' },
];

export default function EnhancedFeatureImportance({ customers, data }: EnhancedFeatureImportanceProps) {
  const dispatch = useDispatch();
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'importance' | 'alphabetical'>('importance');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const getColorForImportance = (importance: number) => {
    if (importance > 0.7) return '#ef4444'; // High importance - red
    if (importance > 0.5) return '#f97316'; // Medium importance - orange
    if (importance > 0.3) return '#eab308'; // Low importance - yellow
    return '#22c55e'; // Very low importance - green
  };

  const sortedData = [...featureData].sort((a, b) => {
    if (sortBy === 'importance') {
      return b.importance - a.importance;
    }
    return a.name.localeCompare(b.name);
  });

  const chartData = sortedData.map(feature => ({
    ...feature,
    color: getColorForImportance(feature.importance),
    percentage: Math.round(feature.importance * 100)
  }));

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 300);
    const timer2 = setTimeout(() => setAnimatedData(chartData), 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [sortBy]);

  const handleBarClick = (data: any) => {
    const contextData = {
      chartType: 'feature-importance',
      chartName: 'Feature Importance Analysis',
      selectedData: data,
      clickedElement: data.name,
      timestamp: new Date()
    };

    dispatch(setChatContext(contextData));
    
    // Trigger AI insight in chatbot
    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
      (window as any).addAIInsightToChat({
        label: data.name,
        value: data.percentage.toString(),
        chartType: 'Feature Importance',
        count: data.percentage,
        total: 100
      });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${data.color}`,
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px ${data.color}40`,
          fontSize: 14,
          fontWeight: 600,
          color: '#1e293b',
          maxWidth: 250
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 8,
            color: data.color,
            fontWeight: 700
          }}>
            <span style={{ fontSize: 20 }}>{data.icon}</span>
            {data.name}
          </div>
          <div style={{ marginBottom: 4 }}>
            Importance: <strong style={{ color: data.color }}>{data.percentage}%</strong>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
            {data.description}
          </div>
          <div style={{ 
            marginTop: 8, 
            padding: '4px 8px', 
            background: `${data.color}15`, 
            borderRadius: 6,
            fontSize: 11,
            color: data.color,
            fontWeight: 600
          }}>
            {data.importance > 0.7 ? '🔥 Critical Factor' : 
             data.importance > 0.5 ? '⚡ Important Factor' : 
             data.importance > 0.3 ? '📊 Moderate Factor' : '📈 Minor Factor'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Click for AI insights
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload, x, y, width, height } = props;
    const isHovered = hoveredBar === payload.name;
    
    return (
      <g>
        {/* Glow effect */}
        {isHovered && (
          <rect
            x={x - 3}
            y={y - 3}
            width={width + 6}
            height={height + 6}
            fill="none"
            stroke={fill}
            strokeWidth="4"
            rx="6"
            opacity="0.4"
            filter="blur(4px)"
          />
        )}
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`feature-gradient-${payload.name}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fill} stopOpacity="0.7" />
            <stop offset="50%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.8" />
          </linearGradient>
          <filter id={`feature-glow-${payload.name}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#feature-gradient-${payload.name})`}
          rx="4"
          style={{
            filter: isHovered ? `url(#feature-glow-${payload.name})` : 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredBar(payload.name)}
          onMouseLeave={() => setHoveredBar(null)}
          onClick={() => handleBarClick(payload)}
        />
        
        {/* Icon overlay */}
        <text
          x={x + 12}
          y={y + height / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="16"
          style={{ pointerEvents: 'none' }}
        >
          {payload.icon}
        </text>
        
        {/* Percentage text */}
        <text
          x={x + width - 8}
          y={y + height / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="600"
          fill="white"
          style={{ pointerEvents: 'none' }}
        >
          {payload.percentage}%
        </text>
        
        {/* Sparkle effects on high importance */}
        {payload.importance > 0.7 && isHovered && (
          <>
            <circle cx={x + width * 0.3} cy={y + height * 0.3} r="2" fill="white" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={x + width * 0.7} cy={y + height * 0.7} r="1.5" fill="white" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.3s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      maxWidth: '100%',
      maxHeight: '100%',
      background: 'rgba(255, 255, 255, 0.95)', 
      backdropFilter: 'blur(20px)',
      borderRadius: 20, 
      padding: 24, 
      position: 'relative', 
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 40px rgba(59, 130, 246, 0.05)', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      overflow: 'hidden',
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
      boxSizing: 'border-box'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 70% 30%, rgba(239, 68, 68, 0.05) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        animation: 'float 10s ease-in-out infinite'
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
            fontSize: 28,
            background: 'linear-gradient(135deg, #ef4444, #22c55e)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isVisible ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0.5)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
          }}>
            🧠
          </div>
          <h3 style={{ 
            margin: 0, 
            color: '#1e293b', 
            fontWeight: 800, 
            fontSize: 24,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.7s'
          }}>
            Feature Importance
          </h3>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'importance' | 'alphabetical')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#1e293b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
            opacity: isVisible ? 1 : 0
          }}
        >
          <option value="importance">📊 By Importance</option>
          <option value="alphabetical">🔤 Alphabetical</option>
        </select>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={animatedData}
            layout="horizontal"
            margin={{ top: 20, right: 60, left: 120, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              type="number" 
              domain={[0, 1]}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
            />
            <YAxis 
              type="category" 
              dataKey="name"
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
              animationDuration={2000}
              animationEasing="ease-out"
            >
              {animatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.1)',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.2s'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          fontSize: 11,
          color: '#64748b'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: 6,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2 }} />
            <span>🔥 Critical (70%+)</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: 6,
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ width: 12, height: 12, background: '#f97316', borderRadius: 2 }} />
            <span>⚡ Important (50%+)</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: 6,
            background: 'rgba(234, 179, 8, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(234, 179, 8, 0.3)'
          }}>
            <div style={{ width: 12, height: 12, background: '#eab308', borderRadius: 2 }} />
            <span>📊 Moderate (30%+)</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            padding: 6,
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 2 }} />
            <span>📈 Minor (&lt;30%)</span>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-2px) rotate(0.3deg); }
            66% { transform: translateY(1px) rotate(-0.3deg); }
          }
        `}
      </style>
    </div>
  );
}