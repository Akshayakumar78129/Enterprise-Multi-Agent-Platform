import React from 'react';
import { ChurnCustomer } from '../../../types';

interface ChurnRiskPyramidProps {
  customers: ChurnCustomer[];
  data: any[];
  width?: number;
  height?: number;
}

const riskLevels = [
  { key: 'Very High', color: '#FF4444', emoji: '🔴' },
  { key: 'High', color: '#FF8800', emoji: '🟠' },
  { key: 'Medium', color: '#FFB800', emoji: '🟡' },
  { key: 'Low', color: '#00E676', emoji: '🟢' },
];

const levelHeight = 80;
const levelGap = 4;

const ChurnRiskPyramid: React.FC<ChurnRiskPyramidProps> = (props) => {
  // Always use passed width/height or fallback
  const customers = props.customers || props.data || [];
  // console.log('ChurnRiskPyramid customers:', customers);

  // Count customers per risk level
  const counts = riskLevels.map(l => customers.filter(c => c.risk_level === l.key).length);
  const total = customers.length || 1;
  const percentages = counts.map(c => (c / total) * 100);

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
        background: 'radial-gradient(circle at 20% 80%, rgba(255, 68, 68, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 230, 118, 0.1) 0%, transparent 50%)',
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
          background: 'linear-gradient(135deg, #FF4444, #FFB800)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          📊
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
          Risk Distribution Pyramid
        </h3>
      </div>
      
      <svg viewBox={`0 0 ${props.width || 520} ${props.height || 360}`} style={{ flexGrow: 1, width: '100%', height: '100%', zIndex: 1 }}>
        <defs>
          {riskLevels.map((level, i) => (
            <linearGradient key={`gradient-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={level.color} stopOpacity="0.8" />
              <stop offset="50%" stopColor={level.color} stopOpacity="1" />
              <stop offset="100%" stopColor={level.color} stopOpacity="0.8" />
            </linearGradient>
          ))}
        </defs>
        
        {riskLevels.map((level, i) => {
          const y = i * (levelHeight + levelGap) + 20;
          const refWidth = props.width || 520;
          const baseWidth = refWidth * 0.85;
          const minRectWidth = refWidth * 0.3;
          const rectWidths = counts.map((c) => {
            if (total === 0) return minRectWidth;
            const w = minRectWidth + (baseWidth - minRectWidth) * (c / Math.max(...counts, 1));
            return Math.max(minRectWidth, w);
          });
          const w = rectWidths[i];
          const x = (refWidth - w) / 2;
          
          return (
            <g key={level.key}>
              {/* Glow effect */}
              <rect
                x={x - 2}
                y={y - 2}
                width={w + 4}
                height={levelHeight + 4}
                rx={16}
                fill={`${level.color}30`}
                style={{ filter: 'blur(4px)' }}
              />
              
              {/* Main rectangle */}
              <rect
                x={x}
                y={y}
                width={w}
                height={levelHeight}
                rx={14}
                fill={`url(#gradient-${i})`}
                style={{ 
                  filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  // Trigger AI insight when clicking a risk level
                  if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                    (window as any).addAIInsightToChat({
                      label: level.key,
                      value: percentages[i].toFixed(1),
                      chartType: 'Risk Pyramid',
                      count: counts[i],
                      total: total
                    });
                  }
                }}
              />
              
              {/* Highlight overlay */}
              <rect
                x={x}
                y={y}
                width={w}
                height={levelHeight / 3}
                rx={14}
                fill="rgba(255, 255, 255, 0.2)"
              />
              
              {/* Emoji icon */}
              <text
                x={x + 20}
                y={y + levelHeight / 2 + 8}
                fontSize={24}
                fill={level.color}
              >
                {level.emoji}
              </text>
              
              {/* Level name */}
              <text
                x={refWidth / 2}
                y={y + levelHeight / 2 - 4}
                textAnchor="middle"
                fill="#f7f9fb"
                fontSize={18}
                fontWeight={800}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              >
                {level.key}
              </text>
              
              {/* Count and percentage */}
              <text
                x={refWidth / 2}
                y={y + levelHeight / 2 + 20}
                textAnchor="middle"
                fill="rgba(247, 249, 251, 0.9)"
                fontSize={15}
                fontWeight={600}
              >
                {counts[i]} customers ({percentages[i].toFixed(1)}%)
              </text>
              
              {/* Side indicator */}
              <circle
                cx={x + w - 15}
                cy={y + levelHeight / 2}
                r={6}
                fill={level.color}
                style={{ filter: `drop-shadow(0 0 8px ${level.color})` }}
              />
            </g>
          );
        })}
        
        {/* Connecting lines */}
        {riskLevels.slice(0, -1).map((_, i) => {
          const y1 = (i * (levelHeight + levelGap)) + levelHeight + 20;
          const y2 = ((i + 1) * (levelHeight + levelGap)) + 20;
          const refWidth = props.width || 520;
          
          return (
            <line
              key={`line-${i}`}
              x1={refWidth / 2}
              y1={y1}
              x2={refWidth / 2}
              y2={y2}
              stroke="rgba(0, 224, 255, 0.3)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          );
        })}
      </svg>
      
      {/* Summary stats */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(15, 20, 25, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(0, 224, 255, 0.2)',
        zIndex: 1
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: 14,
          color: 'rgba(247, 249, 251, 0.8)'
        }}>
          <span>Total Customers: <strong style={{ color: '#00e0ff' }}>{total}</strong></span>
          <span>High Risk: <strong style={{ color: '#FF4444' }}>{((counts[0] + counts[1]) / total * 100).toFixed(1)}%</strong></span>
        </div>
      </div>
    </div>
  );
};

export default ChurnRiskPyramid; 