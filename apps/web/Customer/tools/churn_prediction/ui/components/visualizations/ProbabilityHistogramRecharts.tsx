import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ChurnCustomer } from '../../types';

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

const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function ProbabilityHistogramRecharts({
  customers = [],
  data = [],
  probabilities,
  thresholds = [0.3, 0.6, 0.8],
  onThresholdChange,
  binCount = 25,
  onBinCountChange,
  onBinClick
}: ProbabilityHistogramProps) {
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  
  // Use customers from props, fallback to data prop
  const customerData = customers.length > 0 ? customers : data;
  const customerProbabilities = probabilities || customerData.map(c => c.churn_probability);

  const chartData = useMemo(() => {
    if (!customerProbabilities.length) return [];
    
    const min = 0, max = 1;
    const width = (max - min) / binCount;
    const bins = Array(binCount).fill(0);
    
    customerProbabilities.forEach(p => {
      const idx = Math.min(Math.floor((p - min) / width), binCount - 1);
      bins[idx]++;
    });

    return bins.map((count, i) => {
      const binStart = i * width;
      const binEnd = (i + 1) * width;
      const binCenter = (binStart + binEnd) / 2;
      
      // Determine risk level based on thresholds
      let riskLevel = 0;
      if (binCenter >= thresholds[2]) riskLevel = 3;
      else if (binCenter >= thresholds[1]) riskLevel = 2;
      else if (binCenter >= thresholds[0]) riskLevel = 1;
      
      return {
        binIndex: i,
        binStart,
        binEnd,
        binCenter,
        count,
        riskLevel,
        color: colors[riskLevel],
        riskLabel: riskLabels[riskLevel]
      };
    });
  }, [customerProbabilities, binCount, thresholds]);

  useEffect(() => {
    setIsVisible(true);
    // Animate data entry with staggered timing
    const timer = setTimeout(() => {
      setAnimatedData(chartData);
    }, 400);

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
          fontWeight: 500
        }}>
          <div style={{ color: '#1e293b', fontWeight: 600, marginBottom: 4 }}>
            {data.riskLabel} Risk Zone
          </div>
          <div style={{ color: '#64748b' }}>
            <div>Probability: <strong>{(data.binStart * 100).toFixed(0)}% - {(data.binEnd * 100).toFixed(0)}%</strong></div>
            <div>Customers: <strong style={{ color: data.color }}>{data.count}</strong></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload, x, y, width, height, index } = props;
    const isHovered = hoveredBin === payload.binIndex;
    
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
          rx={3}
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))',
            transition: 'all 0.2s ease',
            opacity: isHovered ? 1 : 0.9,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)'
          }}
        />
        {/* Highlight */}
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(height * 0.2, 2)}
          fill="rgba(255, 255, 255, 0.3)"
          rx={3}
        />
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
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 80% 20%, rgba(234, 179, 8, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%)',
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
          background: 'linear-gradient(135deg, #eab308, #ef4444)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isVisible ? 'rotate(0deg)' : 'rotate(-180deg)',
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
        }}>
          📈
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
          Churn Probability Distribution
        </h3>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={animatedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            onMouseMove={(e: any) => {
              if (e && e.activePayload && e.activePayload[0]) {
                setHoveredBin(e.activePayload[0].payload.binIndex);
              }
            }}
            onMouseLeave={() => setHoveredBin(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="binCenter"
              type="number"
              scale="linear"
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              label={{ value: 'Churn Probability', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 } }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              label={{ value: 'Customer Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Threshold lines */}
            {thresholds.map((threshold, i) => (
              <ReferenceLine 
                key={i}
                x={threshold} 
                stroke={colors[i + 1]} 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: `${riskLabels[i + 1]} Threshold`, position: 'topRight', fill: colors[i + 1], fontSize: 12 }}
              />
            ))}
            
            <Bar 
              dataKey="count" 
              shape={<CustomBar />}
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {animatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk level legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        padding: 16,
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.1)',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
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
            <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>{label}</span>
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
        background: 'rgba(248, 250, 252, 0.6)',
        borderRadius: 8,
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s'
      }}>
        <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>Bins:</span>
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
            background: 'rgba(59, 130, 246, 0.2)',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <span style={{ fontSize: 14, color: '#3b82f6', fontWeight: 600, minWidth: 30 }}>{binCount}</span>
        <button 
          style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
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
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)';
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