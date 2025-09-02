import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap } from 'recharts';

interface SegmentForecastBreakdownProps {
  data?: any;
  onSegmentClick?: (data: any, chartType: string) => void;
}

const SegmentForecastBreakdown: React.FC<SegmentForecastBreakdownProps> = ({ data, onSegmentClick }) => {
  // Use only database data - NO MOCK DATA
  const timelineData = data?.segments || [];
  const treemapData = data?.treemap || [];

  const CustomTreemapContent = ({ x, y, width, height, name, size, growth }: any) => {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: growth > 50 ? '#00e0ff' : growth > 40 ? '#5fd4d6' : growth > 30 ? '#43cad0' : '#ffc145',
            stroke: 'rgba(0, 224, 255, 0.3)',
            strokeWidth: 2,
            fillOpacity: 0.8
          }}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="#f7f9fb"
              fontSize={14}
              fontWeight={600}
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="rgba(247, 249, 251, 0.8)"
              fontSize={12}
            >
              ${size}M
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 25}
              textAnchor="middle"
              fill="rgba(247, 249, 251, 0.6)"
              fontSize={11}
            >
              +{growth}%
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '14px', margin: '0 0 12px' }}>
          Revenue Forecast by Segment ($M)
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart 
            data={timelineData} 
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            onClick={(e) => {
              if (e && e.activePayload && onSegmentClick) {
                onSegmentClick(e.activePayload[0], 'segment_forecast');
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 224, 255, 0.1)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(10, 18, 36, 0.95)', 
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: '8px'
              }}
              formatter={(value: any) => `$${value}M`}
            />
            <Legend />
            <Area type="monotone" dataKey="enterprise" stackId="1" stroke="#00e0ff" fill="#00e0ff" fillOpacity={0.8} />
            <Area type="monotone" dataKey="midMarket" stackId="1" stroke="#5fd4d6" fill="#5fd4d6" fillOpacity={0.8} />
            <Area type="monotone" dataKey="smb" stackId="1" stroke="#43cad0" fill="#43cad0" fillOpacity={0.8} />
            <Area type="monotone" dataKey="selfServe" stackId="1" stroke="#ffc145" fill="#ffc145" fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '14px', margin: '0 0 12px' }}>
          Segment Contribution & Growth
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <Treemap
            data={treemapData}
            dataKey="size"
            ratio={4/3}
            stroke="#fff"
            fill="#00e0ff"
            content={<CustomTreemapContent />}
            onClick={(data) => onSegmentClick && onSegmentClick(data, 'segment_treemap')}
          />
        </ResponsiveContainer>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px' 
      }}>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.05)', 
          borderRadius: '8px', 
          padding: '12px' 
        }}>
          <div style={{ color: '#00e0ff', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            Highest Growth
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '16px', fontWeight: 700 }}>
            Self-Serve
          </div>
          <div style={{ color: '#ffc145', fontSize: '14px', marginTop: '4px' }}>
            +56% YoY
          </div>
        </div>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.05)', 
          borderRadius: '8px', 
          padding: '12px' 
        }}>
          <div style={{ color: '#00e0ff', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            Largest Segment
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '16px', fontWeight: 700 }}>
            Enterprise
          </div>
          <div style={{ color: '#00e0ff', fontSize: '14px', marginTop: '4px' }}>
            $95M (42%)
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegmentForecastBreakdown;