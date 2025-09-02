import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PricingElasticityProps {
  data?: any;
  onScenarioClick?: (data: any, chartType: string) => void;
}

const PricingElasticity: React.FC<PricingElasticityProps> = ({ data, onScenarioClick }) => {
  // Use only database data - NO MOCK DATA
  const elasticityData = data?.scenarios || [];
  
  // If no data, show a message
  if (!elasticityData || elasticityData.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(247, 249, 251, 0.6)' }}>No pricing elasticity data available for selected period</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart 
          data={elasticityData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onClick={(e) => {
            if (e && e.activePayload && onScenarioClick) {
              onScenarioClick(e.activePayload[0], 'pricing_elasticity');
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 224, 255, 0.1)" />
          <XAxis 
            dataKey="priceChange" 
            tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
            label={{ value: 'Price Change (%)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
            label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(10, 18, 36, 0.95)', 
              border: '1px solid rgba(0, 224, 255, 0.3)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <ReferenceLine x={0} stroke="rgba(247, 249, 251, 0.3)" />
          <ReferenceLine y={0} stroke="rgba(247, 249, 251, 0.3)" />
          <ReferenceLine x={data?.optimal_price_point || 0} stroke="#00e0ff" strokeDasharray="5 5" label="Optimal" />
          <Line type="monotone" dataKey="volumeChange" stroke="#e930ff" strokeWidth={2} name="Volume Impact" />
          <Line type="monotone" dataKey="revenueChange" stroke="#00e0ff" strokeWidth={3} name="Revenue Impact" />
          <Line type="monotone" dataKey="marginImpact" stroke="#5fd4d6" strokeWidth={2} name="Margin Impact" />
        </LineChart>
      </ResponsiveContainer>
      
      <div style={{ 
        background: 'rgba(0, 224, 255, 0.05)', 
        borderRadius: '12px', 
        padding: '16px', 
        marginTop: '20px' 
      }}>
        <h4 style={{ color: '#00e0ff', fontSize: '14px', margin: '0 0 12px' }}>
          Pricing Strategy Recommendation
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div 
            style={{ cursor: 'pointer' }}
            onClick={() => onScenarioClick && onScenarioClick({ metric: 'optimal_price', value: data?.optimal_price_point }, 'pricing_recommendation')}
          >
            <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
              Optimal Price Increase
            </div>
            <div style={{ color: '#00e0ff', fontSize: '24px', fontWeight: 700 }}>
              {data?.optimal_price_point > 0 ? '+' : ''}{data?.optimal_price_point?.toFixed(0) || 0}%
            </div>
          </div>
          <div 
            style={{ cursor: 'pointer' }}
            onClick={() => onScenarioClick && onScenarioClick({ metric: 'revenue_impact', value: data?.optimal_revenue_impact }, 'pricing_recommendation')}
          >
            <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
              Revenue Impact
            </div>
            <div style={{ color: '#5fd4d6', fontSize: '24px', fontWeight: 700 }}>
              ${(data?.optimal_revenue_impact / 1000000)?.toFixed(1) || 0}M
            </div>
          </div>
          <div 
            style={{ cursor: 'pointer' }}
            onClick={() => onScenarioClick && onScenarioClick({ metric: 'price_elasticity', value: data?.price_elasticity }, 'pricing_recommendation')}
          >
            <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
              Price Elasticity
            </div>
            <div style={{ color: '#ffc145', fontSize: '24px', fontWeight: 700 }}>
              {data?.price_elasticity?.toFixed(1) || 0}
            </div>
          </div>
          <div 
            style={{ cursor: 'pointer' }}
            onClick={() => onScenarioClick && onScenarioClick({ metric: 'volume_risk', value: data?.volume_risk }, 'pricing_recommendation')}
          >
            <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
              Volume Risk
            </div>
            <div style={{ color: '#e930ff', fontSize: '24px', fontWeight: 700 }}>
              {data?.volume_risk?.toFixed(1) || 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingElasticity;