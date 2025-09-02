import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TAMMarketShareProps {
  data?: any;
  onSegmentClick?: (data: any, chartType: string) => void;
}

const TAMMarketShare: React.FC<TAMMarketShareProps> = ({ data, onSegmentClick }) => {
  // Use only database data - NO MOCK DATA
  const marketData = data?.competitorData || [];
  const tamData = data?.tamBreakdown || [];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: '20px', height: '300px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '14px', margin: '0 0 12px' }}>
            Market Share Distribution
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart onClick={(e) => onSegmentClick && onSegmentClick(e, 'market_share')}>
              <Pie
                data={marketData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="marketShare"
                label={({ name, marketShare }) => `${name}: ${marketShare}%`}
              >
                {marketData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#00e0ff'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'rgba(247, 249, 251, 0.8)', fontSize: '14px', margin: '0 0 12px' }}>
            TAM Expansion Opportunity
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart onClick={(e) => onSegmentClick && onSegmentClick(e, 'tam_breakdown')}>
              <Pie
                data={tamData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {tamData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#00e0ff'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value}M`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '12px', 
        marginTop: '20px' 
      }}>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}
        onClick={() => onSegmentClick && onSegmentClick({ metric: 'tam', value: data?.tam_size }, 'tam_metric')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            TAM
          </div>
          <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: 700 }}>
            ${(data?.tam_size / 1000000000)?.toFixed(1) || 0}B
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.5)', fontSize: '10px', marginTop: '4px' }}>
            Total Market
          </div>
        </div>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}
        onClick={() => onSegmentClick && onSegmentClick({ metric: 'sam', value: data?.sam_size }, 'sam_metric')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            SAM
          </div>
          <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: 700 }}>
            ${(data?.sam_size / 1000000000)?.toFixed(1) || 0}B
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.5)', fontSize: '10px', marginTop: '4px' }}>
            Serviceable
          </div>
        </div>
        <div style={{ 
          background: 'rgba(0, 224, 255, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}
        onClick={() => onSegmentClick && onSegmentClick({ metric: 'growth_vs_market', value: data?.growth_vs_market }, 'growth_metric')}
        >
          <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
            Growth vs Market
          </div>
          <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: 700 }}>
            {data?.growth_vs_market > 0 ? '+' : ''}{data?.growth_vs_market?.toFixed(0) || 0}pp
          </div>
          <div style={{ color: 'rgba(247, 249, 251, 0.5)', fontSize: '10px', marginTop: '4px' }}>
            {data?.growth_vs_market > 0 ? 'Outperforming' : 'Underperforming'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TAMMarketShare;