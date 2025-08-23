import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDispatch } from 'react-redux';
import { ChurnCustomer } from '../../types';
import { setChatContext, toggleChat } from '../../state/churnPredictionSlice';
import InfoIcon from '../common/InfoIcon';

interface EnhancedRiskPyramidWithRobotProps {
  customers: ChurnCustomer[];
  data?: ChurnCustomer[];
}

const riskLevels = [
  { key: 'Very High', color: '#ef4444', emoji: '🔴' },
  { key: 'High', color: '#f97316', emoji: '🟠' },
  { key: 'Medium', color: '#eab308', emoji: '🟡' },
  { key: 'Low', color: '#22c55e', emoji: '🟢' },
];

export default function EnhancedRiskPyramidWithRobot({ customers, data }: EnhancedRiskPyramidWithRobotProps) {
  const dispatch = useDispatch();
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [clickedBars, setClickedBars] = useState<Set<string>>(new Set());

  const customerData = customers?.length > 0 ? customers : data || [];
  
  // Generate mock data if no real data
  const mockData = [
    { name: 'Low', count: 45, color: '#22c55e', emoji: '🟢' },
    { name: 'Medium', count: 25, color: '#eab308', emoji: '🟡' },
    { name: 'High', count: 20, color: '#f97316', emoji: '🟠' },
    { name: 'Very High', count: 10, color: '#ef4444', emoji: '🔴' },
  ];

  const chartData = customerData.length > 0 
    ? riskLevels.map(level => {
        const count = customerData.filter(c => c.risk_level === level.key).length;
        return {
          name: level.key,
          count: count,
          color: level.color,
          emoji: level.emoji
        };
      }).reverse()
    : mockData.reverse();

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setAnimatedData(chartData), 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [customerData]);

  const handleBarClick = (data: any, element: any) => {
    // Original chatbot functionality
    const contextData = {
      chartType: 'risk-pyramid',
      chartName: 'Risk Distribution Pyramid',
      selectedData: data,
      clickedElement: data.name,
      timestamp: new Date()
    };

    dispatch(setChatContext(contextData));
    
    // Trigger AI insight in chatbot
    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
      (window as any).addAIInsightToChat({
        label: data.name,
        value: ((data.count / chartData.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1),
        chartType: 'Risk Pyramid',
        count: data.count,
        total: chartData.reduce((a, b) => a + b.count, 0)
      });
    }

    // NEW: Robot integration with proper coordinates
    if (typeof window !== 'undefined' && (window as any).robotAddPoint) {
      // Calculate actual position from the chart container and element
      setTimeout(() => {
        if (chartRef.current && element) {
          const chartRect = chartRef.current.getBoundingClientRect();
          
          // Get the position from the element's properties
          const x = chartRect.left + (element.x || chartRect.width / 2) + (element.width || 0) / 2;
          const y = chartRect.top + (element.y || chartRect.height / 2) + (element.height || 0) / 2;
          
          (window as any).robotAddPoint({
            element: { x, y },
            label: `${data.name} Risk`,
            value: data.count,
            chartType: 'risk-pyramid'
          });

          // Update visual state
          const barId = `${data.name}`;
          const newClicked = new Set(clickedBars);
          if (newClicked.has(barId)) {
            newClicked.delete(barId);
          } else {
            // If not shift pressed, clear others
            if (!(window as any).isShiftPressed) {
              newClicked.clear();
            }
            newClicked.add(barId);
          }
          setClickedBars(newClicked);
        }
      }, 10);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isClicked = clickedBars.has(data.name);
      
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${isClicked ? '#39ff14' : data.color}`,
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px ${isClicked ? '#39ff14' : data.color}30`,
          fontSize: 14,
          fontWeight: 600,
          color: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{data.emoji}</span>
            <span style={{ color: data.color, fontWeight: 700 }}>{data.name} Risk</span>
            {isClicked && <span style={{ color: '#39ff14', fontSize: 16 }}>✓</span>}
          </div>
          <div>Customers: <strong style={{ color: data.color }}>{data.count}</strong></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {isClicked ? '✓ Selected for analysis' : 'Click to analyze • Shift+Click for multi-select'}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload, x, y, width, height } = props;
    const isHovered = hoveredBar === payload.name;
    const isClicked = clickedBars.has(payload.name);
    
    return (
      <g>
        {/* Selection glow */}
        {isClicked && (
          <>
            <rect
              x={x - 4}
              y={y - 4}
              width={width + 8}
              height={height + 8}
              fill="none"
              stroke="#39ff14"
              strokeWidth="3"
              rx="8"
              opacity="0.8"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;10"
                dur="1s"
                repeatCount="indefinite"
              />
            </rect>
          </>
        )}
        
        {/* Hover glow */}
        {isHovered && !isClicked && (
          <rect
            x={x - 2}
            y={y - 2}
            width={width + 4}
            height={height + 4}
            fill="none"
            stroke={fill}
            strokeWidth="3"
            rx="8"
            opacity="0.6"
            filter="blur(2px)"
          />
        )}
        
        {/* Main bar with gradient */}
        <defs>
          <linearGradient id={`gradient-${payload.name}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={fill} stopOpacity={isClicked ? "1" : "0.8"} />
            <stop offset="50%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity={isClicked ? "1" : "0.8"} />
          </linearGradient>
        </defs>
        
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#gradient-${payload.name})`}
          rx="6"
          style={{
            filter: isClicked ? 'brightness(1.2)' : (isHovered ? 'brightness(1.1)' : 'brightness(1)'),
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredBar(payload.name)}
          onMouseLeave={() => setHoveredBar(null)}
          onClick={() => handleBarClick(payload, { x, y, width, height })}
        />
        
        {/* Emoji overlay */}
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          style={{ pointerEvents: 'none' }}
        >
          {payload.emoji}
        </text>

        {/* Selection indicator */}
        {isClicked && (
          <text
            x={x + width - 10}
            y={y + 15}
            fontSize="16"
            fill="#39ff14"
            style={{ pointerEvents: 'none' }}
          >
            ✓
          </text>
        )}
      </g>
    );
  };

  // Clear selections on Escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setClickedBars(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div 
      ref={chartRef}
      data-chart-type="risk-pyramid"
      style={{ 
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
        border: clickedBars.size > 0 ? '2px solid #39ff14' : '1px solid rgba(59, 130, 246, 0.1)',
        overflow: 'hidden',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
      }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.02) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 20,
        position: 'relative',
        zIndex: 1
      }}>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 700, 
          color: '#1e293b', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 24 }}>🎯</span> Risk Distribution
          {clickedBars.size > 0 && (
            <span style={{
              fontSize: 12,
              padding: '2px 8px',
              background: '#39ff14',
              color: '#1a1a2e',
              borderRadius: 12,
              marginLeft: 8
            }}>
              {clickedBars.size} selected
            </span>
          )}
        </h3>
        <InfoIcon 
          content="Click bars to analyze with robot • Shift+Click for multi-select • Esc to clear"
          color="#3b82f6"
        />
      </div>

      {/* Chart Container */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={animatedData}
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
          <Bar 
            dataKey="count" 
            shape={CustomBar}
            animationDuration={1000}
            animationBegin={0}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 24,
        fontSize: 11,
        color: '#94a3b8',
        display: 'flex',
        gap: 16
      }}>
        <span>🤖 Click for robot analysis</span>
        <span>⇧ Shift+Click multi-select</span>
        <span>ESC Clear</span>
      </div>
    </div>
  );
}