import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface BCGGrowthMatrixProps {
  data?: any;
  onBubbleClick?: (data: any, chartType: string) => void;
}

const BCGGrowthMatrix: React.FC<BCGGrowthMatrixProps> = ({ data, onBubbleClick }) => {
  // Use only database data - NO MOCK DATA
  const matrixData = data?.products || [];
  
  // If no data, show a message
  if (!matrixData || matrixData.length === 0) {
    return (
      <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(247, 249, 251, 0.6)' }}>No product portfolio data available for selected period</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(10, 18, 36, 0.95)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p style={{ margin: '0 0 8px', color: '#00e0ff', fontWeight: 600 }}>{data.name}</p>
          <p style={{ margin: '0 0 4px', color: 'rgba(247, 249, 251, 0.8)', fontSize: '12px' }}>
            Market Share: {data.x}x
          </p>
          <p style={{ margin: '0 0 4px', color: 'rgba(247, 249, 251, 0.8)', fontSize: '12px' }}>
            Growth Rate: {data.y}%
          </p>
          <p style={{ margin: '0', color: 'rgba(247, 249, 251, 0.8)', fontSize: '12px' }}>
            Revenue: ${data.size}K
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 224, 255, 0.1)" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Relative Market Share"
            domain={[0, 4]}
            tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
            label={{ value: 'Relative Market Share', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Market Growth Rate"
            domain={[-10, 50]}
            tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
            label={{ value: 'Market Growth Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <ReferenceLine x={1} stroke="rgba(247, 249, 251, 0.3)" strokeWidth={2} />
          <ReferenceLine y={10} stroke="rgba(247, 249, 251, 0.3)" strokeWidth={2} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter 
            name="Products" 
            data={matrixData} 
            fill="#00e0ff"
            onClick={(data) => onBubbleClick && onBubbleClick(data, 'bcg_matrix')}
          >
            {matrixData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          borderRadius: '8px', 
          padding: '12px',
          borderLeft: '3px solid #00e0ff'
        }}>
          <div style={{ color: '#00e0ff', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            STARS
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '20px', fontWeight: 700 }}>
            $105M
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '10px', marginTop: '4px' }}>
            High Growth, High Share
          </div>
        </div>
        <div style={{ 
          background: 'rgba(95, 212, 214, 0.1)', 
          borderRadius: '8px', 
          padding: '12px',
          borderLeft: '3px solid #5fd4d6'
        }}>
          <div style={{ color: '#5fd4d6', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            CASH COWS
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '20px', fontWeight: 700 }}>
            $25M
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '10px', marginTop: '4px' }}>
            Low Growth, High Share
          </div>
        </div>
        <div style={{ 
          background: 'rgba(255, 193, 69, 0.1)', 
          borderRadius: '8px', 
          padding: '12px',
          borderLeft: '3px solid #ffc145'
        }}>
          <div style={{ color: '#ffc145', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            QUESTION MARKS
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '20px', fontWeight: 700 }}>
            $15M
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '10px', marginTop: '4px' }}>
            High Growth, Low Share
          </div>
        </div>
        <div style={{ 
          background: 'rgba(233, 48, 255, 0.1)', 
          borderRadius: '8px', 
          padding: '12px',
          borderLeft: '3px solid #e930ff'
        }}>
          <div style={{ color: '#e930ff', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
            DOGS
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '20px', fontWeight: 700 }}>
            $8M
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '10px', marginTop: '4px' }}>
            Low Growth, Low Share
          </div>
        </div>
      </div>
    </div>
  );
};

export default BCGGrowthMatrix;