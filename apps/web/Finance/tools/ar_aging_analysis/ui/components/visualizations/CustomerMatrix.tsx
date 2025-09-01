import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import styles from './CustomerMatrix.module.css';

interface CustomerRisk {
  customerId: string;
  customerName: string;
  outstandingAmount: number;
  daysPastDue: number;
  riskScore: number;
  clv: number;
  paymentRiskScore: number;
  profitability: number;
  collectionProbability: number;
  segment: 'Strategic Partners' | 'Growth Opportunities' | 'Efficiency Targets' | 'Value Destroyers';
}

interface CustomerMatrixProps {
  data: CustomerRisk[];
  onChartClick: (data: any, type: string) => void;
}

const CustomerMatrix: React.FC<CustomerMatrixProps> = ({ data, onChartClick }) => {
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Customer Portfolio Value Matrix</h3>
        <div className={styles.noData}>No customer data available</div>
      </div>
    );
  }

  const chartData = data.slice(0, 50).map((customer) => ({
    x: customer.clv,
    y: customer.paymentRiskScore,
    z: customer.outstandingAmount,
    name: customer.customerName,
    id: customer.customerId,
    segment: customer.segment,
    daysPastDue: customer.daysPastDue,
    profitability: customer.profitability
  }));

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Strategic Partners': return '#00e0ff';
      case 'Growth Opportunities': return '#ffc145';
      case 'Efficiency Targets': return '#5fd4d6';
      case 'Value Destroyers': return '#e930ff';
      default: return '#8892a8';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{data.name}</div>
          <div className={styles.tooltipContent}>
            <div>CLV: ${(data.x / 1000).toFixed(0)}K</div>
            <div>Risk Score: {data.y.toFixed(1)}</div>
            <div>Outstanding: ${(data.z / 1000).toFixed(0)}K</div>
            <div>Days Past Due: {data.daysPastDue}</div>
            <div style={{ color: getSegmentColor(data.segment) }}>
              Segment: {data.segment}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Customer Portfolio Value Matrix</h3>
      
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a36" />
            <XAxis 
              type="number"
              dataKey="x"
              name="Customer Lifetime Value"
              tick={{ fill: '#8892a8', fontSize: 11 }}
              label={{ value: 'Customer Lifetime Value (CLV)', position: 'insideBottom', offset: -10, fill: '#8892a8', fontSize: 12 }}
              domain={[0, 'dataMax']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              type="number"
              dataKey="y"
              name="Payment Risk Score"
              tick={{ fill: '#8892a8', fontSize: 11 }}
              label={{ value: 'Payment Risk Score', angle: -90, position: 'insideLeft', fill: '#8892a8', fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Scatter
              name="Customers"
              data={chartData}
              onMouseEnter={(data: any) => setHoveredCustomer(data.id)}
              onMouseLeave={() => setHoveredCustomer(null)}
              onClick={(data: any) => onChartClick(data, 'customer_matrix')}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getSegmentColor(entry.segment)}
                  fillOpacity={hoveredCustomer === null || hoveredCustomer === entry.id ? 0.8 : 0.3}
                  stroke={hoveredCustomer === entry.id ? '#fff' : 'none'}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant Labels */}
        <div className={styles.quadrantLabel} style={{ top: '25%', left: '70%', color: '#00e0ff' }}>
          Strategic Partners
        </div>
        <div className={styles.quadrantLabel} style={{ top: '75%', left: '70%', color: '#ffc145' }}>
          Growth Opportunities
        </div>
        <div className={styles.quadrantLabel} style={{ top: '25%', left: '20%', color: '#5fd4d6' }}>
          Efficiency Targets
        </div>
        <div className={styles.quadrantLabel} style={{ top: '75%', left: '20%', color: '#e930ff' }}>
          Value Destroyers
        </div>
      </div>

      <div className={styles.strategyGrid}>
        <div className={styles.strategyCard} style={{ borderColor: '#00e0ff40' }}>
          <div className={styles.strategyTitle} style={{ color: '#00e0ff' }}>Strategic Partners</div>
          <div className={styles.strategyText}>Expand credit, premium service</div>
        </div>
        
        <div className={styles.strategyCard} style={{ borderColor: '#ffc14540' }}>
          <div className={styles.strategyTitle} style={{ color: '#ffc145' }}>Growth Opportunities</div>
          <div className={styles.strategyText}>Credit insurance, intensive management</div>
        </div>
        
        <div className={styles.strategyCard} style={{ borderColor: '#5fd4d640' }}>
          <div className={styles.strategyTitle} style={{ color: '#5fd4d6' }}>Efficiency Targets</div>
          <div className={styles.strategyText}>Automate, standardize terms</div>
        </div>
        
        <div className={styles.strategyCard} style={{ borderColor: '#e930ff40' }}>
          <div className={styles.strategyTitle} style={{ color: '#e930ff' }}>Value Destroyers</div>
          <div className={styles.strategyText}>Exit strategy, COD conversion</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMatrix;