import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CohortRevenueRetentionProps {
  data?: any;
  onCohortClick?: (data: any, chartType: string) => void;
}

const CohortRevenueRetention: React.FC<CohortRevenueRetentionProps> = ({ data, onCohortClick }) => {
  // Use actual database data - NO MOCK DATA
  const chartData = data || [];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload.length > 0 && onCohortClick) {
              const payload = e.activePayload[0].payload;
              onCohortClick({
                ...payload,
                value: e.activePayload[0].value,
                dataKey: e.activePayload[0].dataKey,
                name: e.activePayload[0].name
              }, 'cohort_retention');
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 224, 255, 0.1)" />
          <XAxis dataKey="cohort_month" tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(10, 18, 36, 0.95)', 
              border: '1px solid rgba(0, 224, 255, 0.3)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="retention_rate" 
            name="Retention %" 
            stroke="#00e0ff" 
            strokeWidth={2} 
            dot={{ r: 4 }}
            activeDot={{ r: 6, onClick: (e, payload) => onCohortClick && onCohortClick(payload, 'cohort_retention') }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue_retention" 
            name="Revenue Retention %" 
            stroke="#5fd4d6" 
            strokeWidth={2} 
            dot={{ r: 4 }}
            activeDot={{ r: 6, onClick: (e, payload) => onCohortClick && onCohortClick(payload, 'cohort_retention') }}
          />
          <Line 
            type="monotone" 
            dataKey="expansion_rate" 
            name="Expansion %" 
            stroke="#43cad0" 
            strokeWidth={2} 
            dot={{ r: 4 }}
            activeDot={{ r: 6, onClick: (e, payload) => onCohortClick && onCohortClick(payload, 'cohort_retention') }}
          />
          <Line 
            type="monotone" 
            dataKey="churn_rate" 
            name="Churn %" 
            stroke="#e930ff" 
            strokeWidth={2} 
            dot={{ r: 4 }}
            activeDot={{ r: 6, onClick: (e, payload) => onCohortClick && onCohortClick(payload, 'cohort_retention') }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '12px', 
        marginTop: '20px' 
      }}>
        {chartData && chartData.length > 0 && chartData[chartData.length - 1] && (
          <>
            <div style={{ 
              background: 'rgba(0, 224, 255, 0.1)', 
              padding: '12px', 
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => onCohortClick && onCohortClick({ metric: 'nrr', value: chartData[chartData.length - 1].revenue_retention }, 'cohort_retention')}
            >
              <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
                Avg NRR
              </div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: 700 }}>
                {chartData[chartData.length - 1].revenue_retention?.toFixed(0) || 0}%
              </div>
            </div>
            <div style={{ 
              background: 'rgba(0, 224, 255, 0.1)', 
              padding: '12px', 
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => onCohortClick && onCohortClick({ metric: 'grr', value: chartData[chartData.length - 1].retention_rate }, 'cohort_retention')}
            >
              <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
                GRR
              </div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: 700 }}>
                {chartData[chartData.length - 1].retention_rate?.toFixed(0) || 0}%
              </div>
            </div>
            <div style={{ 
              background: 'rgba(0, 224, 255, 0.1)', 
              padding: '12px', 
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => onCohortClick && onCohortClick({ metric: 'expansion', value: chartData[chartData.length - 1].expansion_rate }, 'cohort_retention')}
            >
              <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
                Expansion
              </div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: 700 }}>
                {chartData[chartData.length - 1].expansion_rate?.toFixed(0) || 0}%
              </div>
            </div>
            <div style={{ 
              background: 'rgba(0, 224, 255, 0.1)', 
              padding: '12px', 
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => onCohortClick && onCohortClick({ metric: 'churn', value: chartData[chartData.length - 1].churn_rate }, 'cohort_retention')}
            >
              <div style={{ color: 'rgba(247, 249, 251, 0.6)', fontSize: '11px', marginBottom: '4px' }}>
                Logo Churn
              </div>
              <div style={{ color: '#e930ff', fontSize: '20px', fontWeight: 700 }}>
                {chartData[chartData.length - 1].churn_rate?.toFixed(0) || 0}%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CohortRevenueRetention;