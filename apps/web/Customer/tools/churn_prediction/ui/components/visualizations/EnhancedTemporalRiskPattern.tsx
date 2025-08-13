import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChurnCustomer } from '../../types';

export interface RiskTimeSeriesDatum {
  date: string;
  low: number;
  medium: number;
  high: number;
  very_high: number;
}

export interface EnhancedTemporalRiskPatternProps {
  customers?: ChurnCustomer[];
  data?: ChurnCustomer[];
  riskTimeSeries?: RiskTimeSeriesDatum[];
}

const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function EnhancedTemporalRiskPattern({ 
  customers = [], 
  data = [], 
  riskTimeSeries 
}: EnhancedTemporalRiskPatternProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [activeAreas, setActiveAreas] = useState<string[]>(['low', 'medium', 'high', 'very_high']);

  // Generate enhanced mock time series data
  const mockTimeSeries = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data: RiskTimeSeriesDatum[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic risk distribution with trends and seasonality
      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
      
      const baseHigh = 15 + Math.sin(i * 0.1) * 5 + (Math.random() - 0.5) * 3;
      const baseMedium = 25 + Math.cos(i * 0.15) * 8 + (Math.random() - 0.5) * 4;
      const baseLow = 45 + Math.sin(i * 0.08) * 10 + (Math.random() - 0.5) * 6;
      const baseVeryHigh = 8 + Math.sin(i * 0.2) * 3 + (Math.random() - 0.5) * 2;
      
      data.push({
        date: date.toISOString().split('T')[0],
        low: Math.max(0, Math.round((baseLow * weekendFactor) + Math.random() * 8 - 4)),
        medium: Math.max(0, Math.round((baseMedium * weekendFactor) + Math.random() * 6 - 3)),
        high: Math.max(0, Math.round((baseHigh * weekendFactor) + Math.random() * 4 - 2)),
        very_high: Math.max(0, Math.round((baseVeryHigh * weekendFactor) + Math.random() * 3 - 1.5))
      });
    }
    
    return data;
  }, [timeRange]);

  const timeSeriesData = riskTimeSeries || mockTimeSeries;

  // Calculate smart tick interval based on data length and screen size
  const getTickInterval = () => {
    const dataLength = timeSeriesData.length;
    if (timeRange === '7d') return 0; // Show all for 7 days
    if (timeRange === '30d') return Math.ceil(dataLength / 8); // Show ~8 ticks
    if (timeRange === '90d') return Math.ceil(dataLength / 6); // Show ~6 ticks
    return 0;
  };

  // Custom tick component for better control
  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    const maxLength = timeRange === '7d' ? 3 : timeRange === '30d' ? 5 : 4;
    const text = payload.value.length > maxLength ? 
      payload.value.substring(0, maxLength) + '...' : 
      payload.value;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor={timeRange === '90d' ? "end" : "middle"} 
          fill="#64748b" 
          fontSize="11"
          transform={timeRange === '90d' ? "rotate(-45)" : ""}
        >
          {text}
        </text>
      </g>
    );
  };

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 400);
    const timer2 = setTimeout(() => {
      setAnimatedData(timeSeriesData.map((item, index) => {
        const date = new Date(item.date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Create shorter labels based on time range
        let formattedDate;
        if (timeRange === '7d') {
          // For 7 days, show day abbreviation
          formattedDate = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeRange === '30d') {
          // For 30 days, show month/day
          formattedDate = date.toLocaleDateString('en-US', { 
            month: 'numeric', 
            day: 'numeric' 
          });
        } else {
          // For 90 days, show even shorter format
          formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        }
        
        return {
          ...item,
          formattedDate,
          shortDate: formattedDate,
          fullDate: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          }),
          total: item.low + item.medium + item.high + item.very_high,
          dayOfWeek: date.getDay(),
          isWeekend
        };
      }));
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [timeSeriesData]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous * 1.1) return '📈';
    if (current < previous * 0.9) return '📉';
    return '➡️';
  };

  const currentData = timeSeriesData[timeSeriesData.length - 1];
  const previousData = timeSeriesData[timeSeriesData.length - 2];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
      
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px rgba(59, 130, 246, 0.1)',
          fontSize: 14,
          fontWeight: 600,
          minWidth: 200
        }}>
          <div style={{ 
            color: '#1e293b', 
            fontWeight: 700, 
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📅 {payload[0]?.payload?.fullDate || label}
            <span style={{ 
              fontSize: 12, 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '2px 6px', 
              borderRadius: 4,
              color: '#3b82f6'
            }}>
              {payload[0]?.payload?.isWeekend ? '🏖️ Weekend' : '💼 Weekday'}
            </span>
          </div>
          
          {sortedPayload.map((entry: any, index: number) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 6,
              padding: '4px 8px',
              background: `${entry.color}10`,
              borderRadius: 6,
              border: `1px solid ${entry.color}30`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: entry.color,
                  boxShadow: `0 0 8px ${entry.color}60`
                }} />
                <span style={{ color: '#64748b', fontSize: 13 }}>{entry.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: entry.color }}>{entry.value}</strong>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>
                  ({((entry.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
          
          <div style={{ 
            borderTop: '1px solid rgba(148, 163, 184, 0.3)', 
            paddingTop: 8, 
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            color: '#1e293b',
            fontWeight: 700
          }}>
            <span>Total Customers:</span>
            <span style={{ color: '#3b82f6' }}>{total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 16, 
        marginTop: 20,
        flexWrap: 'wrap'
      }}>
        {payload.map((entry: any, index: number) => {
          const isActive = activeAreas.includes(entry.dataKey);
          return (
            <div 
              key={index} 
              onClick={() => {
                if (isActive) {
                  setActiveAreas(prev => prev.filter(area => area !== entry.dataKey));
                } else {
                  setActiveAreas(prev => [...prev, entry.dataKey]);
                }
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '6px 12px',
                borderRadius: 8,
                background: isActive ? `${entry.color}15` : 'rgba(148, 163, 184, 0.1)',
                border: `1px solid ${isActive ? entry.color + '40' : 'rgba(148, 163, 184, 0.3)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? 'scale(1)' : 'scale(0.95)'
              }}
            >
              <div style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: entry.color,
                boxShadow: isActive ? `0 0 12px ${entry.color}60` : 'none',
                transition: 'all 0.3s ease'
              }} />
              <span style={{ 
                color: isActive ? '#1e293b' : '#64748b', 
                fontSize: 13, 
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.3s ease'
              }}>
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
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
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
      boxSizing: 'border-box'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        animation: 'float 12s ease-in-out infinite'
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
            background: 'linear-gradient(135deg, #f97316, #22c55e)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isVisible ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0.5)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s'
          }}>
            ⏰
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
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.9s'
          }}>
            Risk Trends Over Time
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {(['7d', '30d', '90d'] as const).map((range, index) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: timeRange === range 
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                  : 'rgba(248, 250, 252, 0.8)',
                color: timeRange === range ? '#fff' : '#1e293b',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: timeRange === range ? '0 4px 20px rgba(59, 130, 246, 0.3)' : 'none',
                transform: isVisible ? 'translateX(0) scale(1)' : `translateX(${(index + 1) * 10}px) scale(0.9)`,
                opacity: isVisible ? 1 : 0,
                transitionDelay: `${1 + index * 0.1}s`
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range) {
                  e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={animatedData}
            margin={{ 
              top: 20, 
              right: 30, 
              left: 20, 
              bottom: timeRange === '90d' ? 90 : 60 
            }}
            onMouseMove={(e: any) => {
              if (e && e.activeLabel) {
                setHoveredDate(e.activeLabel);
              }
            }}
            onMouseLeave={() => setHoveredDate(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="shortDate"
              tick={<CustomTick />}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              height={timeRange === '90d' ? 70 : 50}
              interval={getTickInterval()}
              minTickGap={8}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              label={{ 
                value: 'Customer Count', 
                angle: -90, 
                position: 'insideLeft', 
                style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 } 
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {activeAreas.includes('low') && (
              <Area
                type="monotone"
                dataKey="low"
                stackId="1"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.8}
                strokeWidth={2}
                name="Low Risk"
                animationBegin={0}
                animationDuration={2500}
                animationEasing="ease-out"
              />
            )}
            {activeAreas.includes('medium') && (
              <Area
                type="monotone"
                dataKey="medium"
                stackId="1"
                stroke={colors[1]}
                fill={colors[1]}
                fillOpacity={0.8}
                strokeWidth={2}
                name="Medium Risk"
                animationBegin={300}
                animationDuration={2500}
                animationEasing="ease-out"
              />
            )}
            {activeAreas.includes('high') && (
              <Area
                type="monotone"
                dataKey="high"
                stackId="1"
                stroke={colors[2]}
                fill={colors[2]}
                fillOpacity={0.8}
                strokeWidth={2}
                name="High Risk"
                animationBegin={600}
                animationDuration={2500}
                animationEasing="ease-out"
              />
            )}
            {activeAreas.includes('very_high') && (
              <Area
                type="monotone"
                dataKey="very_high"
                stackId="1"
                stroke={colors[3]}
                fill={colors[3]}
                fillOpacity={0.8}
                strokeWidth={2}
                name="Very High Risk"
                animationBegin={900}
                animationDuration={2500}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced trend indicators */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.1)',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.4s'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          fontSize: 12,
          color: '#64748b'
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
                padding: 10,
                background: `${colors[i]}10`,
                borderRadius: 8,
                border: `1px solid ${colors[i]}30`,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 8px 25px ${colors[i]}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: colors[i],
                  boxShadow: `0 0 12px ${colors[i]}60`,
                  animation: 'pulse 2s infinite'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 11 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                    <span style={{ fontWeight: 700, color: colors[i] }}>{currentValue}</span>
                    <span>{trend}</span>
                    <span style={{ 
                      color: change > 0 ? '#ef4444' : change < 0 ? '#22c55e' : '#eab308',
                      fontWeight: 600
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
        background: 'rgba(248, 250, 252, 0.6)',
        borderRadius: 8,
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.6s'
      }}>
        📈 Risk patterns analyzed over {timeRange} • Click legend items to toggle • Hover for details
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-2px) rotate(0.2deg); }
            66% { transform: translateY(1px) rotate(-0.2deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
}