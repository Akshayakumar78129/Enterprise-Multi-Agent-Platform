import React from 'react';
import { ChurnCustomer } from '../../../types';

interface ChurnRiskPyramidProps {
  customers: ChurnCustomer[];
  data: any[];
  width?: number;
  height?: number;
}

const riskLevels = [
  { key: 'Very High', color: '#e930ff' },
  { key: 'High', color: '#aa45dd' },
  { key: 'Medium', color: '#5fd4d6' },
  { key: 'Low', color: '#00e0ff' },
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
    <div style={{ width: '100%', height: '100%', minWidth: 320, minHeight: 380, background: '#232a36', borderRadius: 16, padding: 24, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: 0, marginBottom: 16, color: '#f7f9fb', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>Churn Risk Pyramid</h3>
      <svg viewBox={`0 0 ${props.width || 520} ${props.height || 360}`} style={{ flexGrow: 1, width: '100%', height: '100%' }}>
        {riskLevels.map((level, i) => {
          const y = i * (levelHeight + levelGap);
          // Use a reference width for proportional calculations, parent width for positioning
          const refWidth = props.width || 520;
          const baseWidth = refWidth * 0.9;
          const minRectWidth = refWidth * 0.25;
          const rectWidths = counts.map((c) => {
            if (total === 0) return minRectWidth;
            const w = minRectWidth + (baseWidth - minRectWidth) * (c / Math.max(...counts, 1));
            return Math.max(minRectWidth, w);
          });
          const w = rectWidths[i];
          const x = (refWidth - w) / 2; // Center based on refWidth
          return (
            <g key={level.key}>
              <rect
                x={x}
                y={y}
                width={w}
                height={levelHeight}
                rx={12}
                fill={level.color}
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
              />
              <text
                x={refWidth / 2} // Center text based on refWidth
                y={y + levelHeight / 2 - 8}
                textAnchor="middle"
                fill="#f7f9fb"
                fontSize={18}
                fontWeight={700}
              >
                {level.key}
              </text>
              <text
                x={refWidth / 2} // Center text based on refWidth
                y={y + levelHeight / 2 + 18}
                textAnchor="middle"
                fill="#f7f9fb"
                fontSize={14}
                fontWeight={500}
              >
                {counts[i]} ({percentages[i].toFixed(1)}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ChurnRiskPyramid; 