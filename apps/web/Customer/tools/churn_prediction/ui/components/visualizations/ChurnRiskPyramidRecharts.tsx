import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChurnCustomer } from '../../types';

interface ChurnRiskPyramidProps {
  customers: ChurnCustomer[];
  data?: ChurnCustomer[];
  width?: number;
  height?: number;
}

const riskLevels = [
  { key: 'Very High', color: '#ef4444', emoji: '🔴', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { key: 'High', color: '#f97316', emoji: '🟠', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  { key: 'Medium', color: '#eab308', emoji: '🟡', gradient: 'linear-gradient(135deg, #eab308, #ca8a04)' },
  { key: 'Low', color: '#22c55e', emoji: '🟢', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
];

export default function ChurnRiskPyramidRecharts({ customers, data }: ChurnRiskPyramidProps) {
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const customerData = customers.length > 0 ? customers : data || [];
  
  const chartData = riskLevels.map(level => {
    const count = customerData.filter(c => c.risk_level === level.key).length;
    const percentage = customerData.length > 0 ? (count / customerData.length) * 100 : 0;
    
    return {
      name: level.key,
      count: count,
      percentage: percentage,
      color: level.color,
      emoji: level.emoji,
      gradient: level.gradient
    };
  }).reverse(); // Reverse to show Very High at top

  useEffect(() => {
    setIsVisible(true);
    // Animate data entry
    const timer = setTimeout(() => {
      setAnimatedData(chartData);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerData]);

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
          fontWeight: 500
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{data.emoji}</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>{data.name} Risk</span>
          </div>
          <div style={{ color: '#64748b' }}>
            <div>Count: <strong style={{ color: data.color }}>{data.count}</strong></div>
            <div>Percentage: <strong style={{ color: data.color }}>{data.percentage.toFixed(1)}%</strong></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload, x, y, width, height } = props;
    
    return (
      <g>
        {/* Glow effect */}
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 4}
          fill={`${payload.color}30`}
          rx={8}
          style={{ filter: 'blur(4px)' }}
        />
        {/* Main bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={payload.color}
          rx={6}
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            transition: 'all 0.3s ease'
          }}
        />
        {/* Highlight */}
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(height * 0.3, 8)}
          fill="rgba(255, 255, 255, 0.2)"
          rx={6}
        />
        {/* Emoji */}
        <text
          x={x + 12}
          y={y + height / 2 + 6}
          fill={payload.color}
          fontSize={18}
          fontWeight="bold"
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
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)',
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
          background: 'linear-gradient(135deg, #ef4444, #eab308)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isVisible ? 'rotate(0deg)' : 'rotate(-180deg)',
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          📊
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
          Risk Distribution Pyramid
        </h3>
      </div>
      
      <div style={{ flex: 1, zIndex: 1 }}>
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
            />
            <YAxis 
              type="category" 
              dataKey="name"
              tick={{ fill: '#1e293b', fontSize: 13, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              shape={<CustomBar />}
              animationBegin={0}
              animationDuration={1200}
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
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: 14,
          color: '#64748b'
        }}>
          <span>Total Customers: <strong style={{ color: '#3b82f6' }}>{customerData.length}</strong></span>
          <span>High Risk: <strong style={{ color: '#ef4444' }}>
            {customerData.length > 0 ? 
              (((chartData.find(d => d.name === 'Very High')?.count || 0) + 
                (chartData.find(d => d.name === 'High')?.count || 0)) / customerData.length * 100).toFixed(1) 
              : 0}%
          </strong></span>
        </div>
      </div>
    </div>
  );
}