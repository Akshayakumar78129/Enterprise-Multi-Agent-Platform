import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDispatch } from 'react-redux';
import { ChurnCustomer } from '../../types';
import { setChatContext, toggleChat } from '../../state/churnPredictionSlice';
import InfoIcon from '../common/InfoIcon';

interface EnhancedProbabilityHistogramProps {
  customers: ChurnCustomer[];
  data?: ChurnCustomer[];
}

export default function EnhancedProbabilityHistogram({ customers, data }: EnhancedProbabilityHistogramProps) {
  const dispatch = useDispatch();
  const [animatedData, setAnimatedData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const customerData = customers?.length > 0 ? customers : data || [];

  // Generate histogram data
  const generateHistogramData = () => {
    if (customerData.length === 0) {
      // Mock data for demonstration
      return [
        { range: '0-10%', count: 45, color: '#22c55e', probability: 5 },
        { range: '10-20%', count: 35, color: '#84cc16', probability: 15 },
        { range: '20-30%', count: 25, color: '#eab308', probability: 25 },
        { range: '30-40%', count: 20, color: '#f59e0b', probability: 35 },
        { range: '40-50%', count: 15, color: '#f97316', probability: 45 },
        { range: '50-60%', count: 12, color: '#ea580c', probability: 55 },
        { range: '60-70%', count: 10, color: '#dc2626', probability: 65 },
        { range: '70-80%', count: 8, color: '#b91c1c', probability: 75 },
        { range: '80-90%', count: 5, color: '#991b1b', probability: 85 },
        { range: '90-100%', count: 3, color: '#7f1d1d', probability: 95 },
      ];
    }

    const bins = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0,
      probability: i * 10 + 5,
      color: getColorForProbability(i * 10 + 5)
    }));

    customerData.forEach(customer => {
      const prob = customer.churn_probability * 100;
      const binIndex = Math.min(Math.floor(prob / 10), 9);
      bins[binIndex].count++;
    });

    return bins;
  };

  const getColorForProbability = (prob: number) => {
    if (prob < 20) return '#22c55e';
    if (prob < 30) return '#84cc16';
    if (prob < 40) return '#eab308';
    if (prob < 50) return '#f59e0b';
    if (prob < 60) return '#f97316';
    if (prob < 70) return '#ea580c';
    if (prob < 80) return '#dc2626';
    if (prob < 90) return '#b91c1c';
    return '#7f1d1d';
  };

  const histogramData = generateHistogramData();

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 200);
    const timer2 = setTimeout(() => setAnimatedData(histogramData), 600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [customerData]);

  const handleBarClick = (data: any) => {
    const contextData = {
      chartType: 'probability-histogram',
      chartName: 'Churn Probability Distribution',
      selectedData: data,
      clickedElement: data.range,
      timestamp: new Date()
    };

    dispatch(setChatContext(contextData));
    
    // Trigger AI insight in chatbot
    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
      const total = histogramData.reduce((sum, item) => sum + item.count, 0);
      (window as any).addAIInsightToChat({
        label: data.range,
        value: ((data.count / total) * 100).toFixed(1),
        chartType: 'Probability Distribution',
        count: data.count,
        total: total
      });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = histogramData.reduce((sum, item) => sum + item.count, 0);
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0';
      
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
          color: '#1e293b'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 8,
            color: data.color,
            fontWeight: 700
          }}>
            📊 Churn Probability: {data.range}
          </div>
          <div style={{ marginBottom: 4 }}>
            Customers: <strong style={{ color: data.color }}>{data.count}</strong>
          </div>
          <div style={{ marginBottom: 4 }}>
            Percentage: <strong style={{ color: data.color }}>{percentage}%</strong>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
            Risk Level: {data.probability < 30 ? 'Low' : data.probability < 60 ? 'Medium' : 'High'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Click for AI insights
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload, x, y, width, height, index } = props;
    const isHovered = hoveredBar === index;
    
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
            rx="4"
            opacity="0.6"
            filter="blur(3px)"
          />
        )}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`histogram-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fill} stopOpacity="1" />
            <stop offset="50%" stopColor={fill} stopOpacity="0.8" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.6" />
          </linearGradient>
          <filter id={`glow-${index}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
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
          fill={`url(#histogram-gradient-${index})`}
          rx="4"
          style={{
            filter: isHovered ? `url(#glow-${index})` : 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHoveredBar(index)}
          onMouseLeave={() => setHoveredBar(null)}
          onClick={() => handleBarClick(payload)}
        />
        
        {/* Sparkle effect on hover */}
        {isHovered && (
          <>
            <circle cx={x + width * 0.2} cy={y + height * 0.3} r="2" fill="white" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={x + width * 0.7} cy={y + height * 0.6} r="1.5" fill="white" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={x + width * 0.5} cy={y + height * 0.2} r="1" fill="white" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>
    );
  };

  const maxCount = Math.max(...histogramData.map(d => d.count));

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
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
      boxSizing: 'border-box'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite'
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
            background: 'linear-gradient(135deg, #22c55e, #ef4444)',
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isVisible ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0.5)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
          }}>
            📈
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
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s'
          }}>
            Churn Probability Distribution
          </h3>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={animatedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="range"
              tick={{ fill: '#64748b', fontSize: 11 }}
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
            <Bar 
              dataKey="count" 
              shape={<CustomBar />}
              animationBegin={0}
              animationDuration={2500}
              animationEasing="ease-out"
            >
              {animatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics summary */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(59, 130, 246, 0.1)',
        zIndex: 1,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1s'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
          fontSize: 12,
          color: '#64748b'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: 8,
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            <div style={{ fontWeight: 600, color: '#22c55e', fontSize: 16 }}>
              {histogramData.filter(d => d.probability < 30).reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div>Low Risk</div>
          </div>
          <div style={{ 
            textAlign: 'center',
            padding: 8,
            background: 'rgba(234, 179, 8, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(234, 179, 8, 0.3)'
          }}>
            <div style={{ fontWeight: 600, color: '#eab308', fontSize: 16 }}>
              {histogramData.filter(d => d.probability >= 30 && d.probability < 60).reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div>Medium Risk</div>
          </div>
          <div style={{ 
            textAlign: 'center',
            padding: 8,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 16 }}>
              {histogramData.filter(d => d.probability >= 60).reduce((sum, d) => sum + d.count, 0)}
            </div>
            <div>High Risk</div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-3px) rotate(0.5deg); }
            66% { transform: translateY(2px) rotate(-0.5deg); }
          }
        `}
      </style>
    </div>
  );
}