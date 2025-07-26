import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ChurnKpiTiles from '../ui/components/kpi/ChurnKpiTiles';
import { RootState } from 'store';
import { fetchChurnCustomers, setFilters } from '../ui/state/churnPredictionSlice';
import { ChurnCustomer, ChurnKPI } from '../ui/types';

const computeKPIs = (customers: ChurnCustomer[]): ChurnKPI => {
  if (!customers.length) return {
    overallRisk: 0, highRiskCount: 0, modelConfidence: 0.85, topFactor: 'Recency', riskTransition: 0
  };
  const overallRisk = Math.round(100 * customers.filter(c => c.risk_level !== 'Low').length / customers.length);
  const highRiskCount = customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High').length;
  // Dummy values for now
  return {
    overallRisk,
    highRiskCount,
    modelConfidence: 0.85,
    topFactor: 'Recency',
    riskTransition: 0
  };
};

export function ChurnPredictionDashboard() {
  const dispatch = useDispatch();
  const { customers, loading, error, filters } = useSelector((state: RootState) => state.churnPrediction);

  useEffect(() => {
    dispatch(fetchChurnCustomers());
  }, [dispatch]);

  const kpis = computeKPIs(customers);

  // Simple filter UI
  const handleRiskLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setFilters({ riskLevel: e.target.value }));
  };
  const filtered = filters.riskLevel ? customers.filter(c => c.risk_level === filters.riskLevel) : customers;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Churn Prediction</h1>
      <div style={{ color: '#888', marginBottom: 24 }}>Identify and analyze customers at risk of churn. Use filters to focus on specific risk levels.</div>
      <ChurnKpiTiles kpis={kpis} />
      <div style={{ marginBottom: 24 }}>
        <label style={{ marginRight: 12 }}>Risk Level:</label>
        <select value={filters.riskLevel || ''} onChange={handleRiskLevelChange}>
          <option value=''>All</option>
          <option value='Low'>Low</option>
          <option value='Medium'>Medium</option>
          <option value='High'>High</option>
          <option value='Very High'>Very High</option>
        </select>
      </div>
      <div style={{ background: '#1e2738', borderRadius: 12, padding: 16 }}>
        <table style={{ width: '100%', color: '#f7f9fb', fontFamily: 'Inter, sans-serif', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2c3341' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>RFM</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Last Purchase</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Frequency</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Avg Value</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Churn Prob</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.customer_id} style={{ borderBottom: '1px solid #232a36' }}>
                <td style={{ padding: 8 }}>{c.customer_id}</td>
                <td style={{ padding: 8 }}>{c.name}</td>
                <td style={{ padding: 8 }}>{c.rfm}</td>
                <td style={{ padding: 8 }}>{c.last_purchase_date}</td>
                <td style={{ padding: 8 }}>{c.frequency}</td>
                <td style={{ padding: 8 }}>{c.avg_order_value}</td>
                <td style={{ padding: 8 }}>{(c.churn_probability * 100).toFixed(1)}%</td>
                <td style={{ padding: 8 }}>{c.risk_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ color: '#00e0ff', marginTop: 16 }}>Loading...</div>}
        {error && <div style={{ color: '#e930ff', marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}

export default ChurnPredictionDashboard; 