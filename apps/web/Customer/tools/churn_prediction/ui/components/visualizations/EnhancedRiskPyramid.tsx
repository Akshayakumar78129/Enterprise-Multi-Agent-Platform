import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDispatch } from 'react-redux';
import { ChurnCustomer } from '../../types';
import { setChatContext, toggleChat } from '../../state/churnPredictionSlice';
import InfoIcon from '../common/InfoIcon';

interface EnhancedRiskPyramidProps {
  customers: ChurnCustomer[];
  data?: ChurnCustomer[];
}

const riskLevels = [
  { key: 'Very High', color: '#ef4444', emoji: '🔴' },
  { key: 'High', color: '#f97316', emoji: '🟠' },
  { key: 'Medium', color: '#eab308', emoji: '🟡' },
  { key: 'Low', color: '#22c55e', emoji: '🟢' },
];

export default function EnhancedRiskPyramid({ customers, data }: EnhancedRiskPyramidProps) {
  const dispatch = useDispatch();
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

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

  const handleBarClick = (data: any, event?: any) => {
    const contextData = {
      chartType: 'risk-pyramid',
      chartName: 'Risk Distribution Pyramid',
      selectedData: data,
      clickedElement: data.name,
      timestamp: new Date()
    };

    dispatch(setChatContext(contextData));
    
    // Trigger AI insight in chatbot with event for shift-click detection
    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
      (window as any).addAIInsightToChat({
        label: data.name,
        value: ((data.count / chartData.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1),
        chartType: 'Risk Pyramid',
        count: data.count,
        total: chartData.reduce((a, b) => a + b.count, 0),
        unit: '',
        originalEvent: event
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
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px ${data.color}30`,
          fontSize: 14,
          fontWeight: 600,
          color: '#1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{data.emoji}</span>
            <span style={{ color: data.color, fontWeight: 700 }}>{data.name} Risk</span>
          </div>
          <div>Customers: <strong style={{ color: data.color }}>{data.count}</strong></div>
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
            <stop offset="0%" stopColor={fill} stopOpacity="0.8" />
            <stop offset="50%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.8" />
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
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredBar(payload.name)}
          onMouseLeave={() => setHoveredBar(null)}
          onClick={(e) => handleBarClick(payload, e)}
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
        background: 'radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        animation: 'float 6s ease-in-out infinite'
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        zIndex: 1,
        position: 'relative'
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
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
          }}>
            📊
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
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
          }}>
            Risk Distribution Pyramid
          </h3>
        </div>

        <InfoIcon
          title="Risk Distribution Pyramid"
          description="Shows the distribution of customers across different churn risk levels"
          chartType="risk-pyramid"
          position="top-right"
        />
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={animatedData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              type="number" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickFormatter={(value) => Math.round(value).toString()}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fill: '#1e293b', fontSize: 14, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
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

      {/* Summary stats */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.1)',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.8s'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 12,
          fontSize: 12,
          color: '#64748b'
        }}>
          {animatedData.map((item, index) => (
            <div key={item.name} style={{ 
              textAlign: 'center',
              padding: 8,
              background: `${item.color}10`,
              borderRadius: 8,
              border: `1px solid ${item.color}30`
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{item.emoji}</div>
              <div style={{ fontWeight: 600, color: item.color }}>{item.count}</div>
              <div style={{ fontSize: 10 }}>{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-5px) rotate(1deg); }
            66% { transform: translateY(2px) rotate(-1deg); }
          }
        `}
      </style>
    </div>
  );
}