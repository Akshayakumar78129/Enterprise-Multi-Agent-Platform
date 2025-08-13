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

export interface TemporalRiskPatternProps {
  customers?: ChurnCustomer[];
  data?: ChurnCustomer[];
  riskTimeSeries?: RiskTimeSeriesDatum[];
}

const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function TemporalRiskPatternRecharts({ 
  customers = [], 
  data = [], 
  riskTimeSeries 
}: TemporalRiskPatternProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
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

  useEffect(() => {
    setIsVisible(true);
    // Animate data entry with staggered timing
    const timer = setTimeout(() => {
      setAnimatedData(timeSeriesData.map((item, index) => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        total: item.low + item.medium + item.high + item.very_high
      })));
    }, 600);

    return () => clearTimeout(timer);
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
      
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          fontSize: 14,
          fontWeight: 500
        }}>
          <div style={{ color: '#1e293b', fontWeight: 600, marginBottom: 8 }}>
            {label}
          </div>
          {payload.reverse().map((entry: any, index: number) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: entry.color
                }} />
                <span style={{ color: '#64748b' }}>{entry.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: entry.color }}>{entry.value}</strong>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
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
            fontWeight: 600
          }}>
            <span>Total:</span>
            <span>{total}</span>
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
        gap: 24, 
        marginTop: 16,
        flexWrap: 'wrap'
      }}>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '4px 8px',
            borderRadius: 6,
            background: `${entry.color}10`,
            border: `1px solid ${entry.color}30`
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: entry.color,
              boxShadow: `0 0 8px ${entry.color}60`
            }} />
            <span style={{ 
              color: '#1e293b', 
              fontSize: 12, 
              fontWeight: 500 
            }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
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
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)',
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
            background: 'linear-gradient(135deg, #f97316, #22c55e)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isVisible ? 'rotate(0deg)' : 'rotate(-180deg)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
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
            Risk Trends Over Time
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {(['7d', '30d', '90d'] as const).map(range => (
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
                transition: 'all 0.2s ease',
                boxShadow: timeRange === range ? '0 4px 20px rgba(59, 130, 246, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range) {
                  e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
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
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            onMouseMove={(e: any) => {
              if (e && e.activeLabel) {
                setHoveredDate(e.activeLabel);
              }
            }}
            onMouseLeave={() => setHoveredDate(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="formattedDate"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              angle={-45}
              textAnchor="end"
              height={60}
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
            
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.7}
              strokeWidth={2}
              name="Low Risk"
              animationBegin={0}
              animationDuration={2000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke={colors[1]}
              fill={colors[1]}
              fillOpacity={0.7}
              strokeWidth={2}
              name="Medium Risk"
              animationBegin={200}
              animationDuration={2000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke={colors[2]}
              fill={colors[2]}
              fillOpacity={0.7}
              strokeWidth={2}
              name="High Risk"
              animationBegin={400}
              animationDuration={2000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="very_high"
              stackId="1"
              stroke={colors[3]}
              fill={colors[3]}
              fillOpacity={0.7}
              strokeWidth={2}
              name="Very High Risk"
              animationBegin={600}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trend indicators */}
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
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 11 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                    <span>{currentValue}</span>
                    <span>{trend}</span>
                    <span style={{ 
                      color: change > 0 ? '#ef4444' : change < 0 ? '#22c55e' : '#eab308' 
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
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.9s'
      }}>
        📈 Risk patterns analyzed over {timeRange} • Hover over chart for details
      </div>
    </div>
  );
}