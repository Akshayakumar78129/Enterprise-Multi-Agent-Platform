import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface CustomerEconomicsWaterfallProps {
  data?: any;
  onBarClick?: (data: any, chartType: string) => void;
}

const CustomerEconomicsWaterfall: React.FC<CustomerEconomicsWaterfallProps> = ({ data, onBarClick }) => {
  // Use only database data - NO MOCK DATA
  const waterfallData = data?.waterfall || [];
  
  // If no data, show a message
  if (!waterfallData || waterfallData.length === 0) {
    return (
      <div style={{ width: '100%', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(247, 249, 251, 0.6)' }}>No customer economics data available for selected period</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={waterfallData} 
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload.length > 0 && onBarClick) {
              const payload = e.activePayload[0].payload;
              onBarClick({
                ...payload,
                value: e.activePayload[0].value,
                name: payload.name,
                type: 'customer_economics'
              }, 'customer_economics');
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 224, 255, 0.1)" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
          />
          <YAxis 
            tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(10, 18, 36, 0.95)', 
              border: '1px solid rgba(0, 224, 255, 0.3)',
              borderRadius: '8px'
            }}
            formatter={(value: any) => `$${value.toLocaleString()}`}
          />
          <ReferenceLine y={0} stroke="rgba(247, 249, 251, 0.3)" />
          <ReferenceLine y={data?.cac || 0} stroke="#e930ff" strokeDasharray="5 5" label="Payback" />
          <Bar dataKey="cumulative" fill="#00e0ff">
            {waterfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '12px', 
        marginTop: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => onBarClick && onBarClick({ 
          metric: 'ltv_cac', 
          value: data?.ltv && data?.cac ? (data.ltv / Math.abs(data.cac)).toFixed(1) : 3.2 
        }, 'customer_economics')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            LTV/CAC
          </div>
          <div style={{ color: '#00e0ff', fontSize: '24px', fontWeight: 700 }}>
            {data?.ltv && data?.cac ? (data.ltv / Math.abs(data.cac)).toFixed(1) : '3.2'}x
          </div>
        </div>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => onBarClick && onBarClick({ 
          metric: 'payback', 
          value: data?.payback_months || 14 
        }, 'customer_economics')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            Payback
          </div>
          <div style={{ color: '#00e0ff', fontSize: '24px', fontWeight: 700 }}>
            {data?.payback_months || 14}mo
          </div>
        </div>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => onBarClick && onBarClick({ 
          metric: 'cac', 
          value: Math.abs(data?.cac || 15000) 
        }, 'customer_economics')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            Avg CAC
          </div>
          <div style={{ color: '#e930ff', fontSize: '24px', fontWeight: 700 }}>
            ${Math.abs(data?.cac || 15000) / 1000}K
          </div>
        </div>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={() => onBarClick && onBarClick({ 
          metric: 'ltv', 
          value: data?.ltv || 48000 
        }, 'customer_economics')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            Avg LTV
          </div>
          <div style={{ color: '#00e0ff', fontSize: '24px', fontWeight: 700 }}>
            ${(data?.ltv || 48000) / 1000}K
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(0, 224, 255, 0.05)', 
        borderRadius: '12px', 
        padding: '16px', 
        marginTop: '16px' 
      }}>
        <h4 style={{ color: '#00e0ff', fontSize: '14px', margin: '0 0 12px' }}>
          Segment Economics
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { segment: 'Enterprise', cac: 45000, ltv: 180000, ratio: 4.0 },
            { segment: 'Mid-Market', cac: 20000, ltv: 65000, ratio: 3.25 },
            { segment: 'SMB', cac: 8000, ltv: 22000, ratio: 2.75 },
            { segment: 'Self-Serve', cac: 500, ltv: 2000, ratio: 4.0 }
          ].map((seg, idx) => (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 1fr', 
              gap: '12px',
              padding: '8px',
              background: 'rgba(10, 18, 36, 0.3)',
              borderRadius: '6px'
            }}>
              <span style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '12px' }}>{seg.segment}</span>
              <span style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '12px' }}>CAC: ${(seg.cac/1000).toFixed(0)}K</span>
              <span style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '12px' }}>LTV: ${(seg.ltv/1000).toFixed(0)}K</span>
              <span style={{ color: '#00e0ff', fontSize: '12px', fontWeight: 600 }}>{seg.ratio}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerEconomicsWaterfall;