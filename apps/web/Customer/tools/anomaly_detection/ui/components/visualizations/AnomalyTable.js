import React, { useState } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const AnomalyTable = ({ 
  anomalies = [], 
  isLoading = false,
  onCustomerClick = null,
  maxRows = 10 
}) => {
  const [sortField, setSortField] = useState('anomalyScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer.customerId);
    if (onCustomerClick) {
      onCustomerClick(customer);
    }
  };

  const sortedAnomalies = [...anomalies].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  }).slice(0, maxRows);

  const getSeverityColor = (severity) => {
    const colors = {
      1: '#00e0ff',
      2: '#5fd4d6',
      3: '#5891cb',
      4: '#aa45dd',
      5: '#e930ff'
    };
    return colors[severity] || '#5891cb';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };

  const headerStyle = {
    backgroundColor: '#232a36',
    color: '#f7f9fb',
    padding: '12px 8px',
    textAlign: 'left',
    borderBottom: '1px solid #3a4459',
    cursor: 'pointer',
    userSelect: 'none'
  };

  const cellStyle = {
    padding: '10px 8px',
    borderBottom: '1px solid #3a4459',
    color: '#f7f9fb'
  };

  const rowStyle = {
    transition: 'background-color 0.2s ease',
    cursor: 'pointer'
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (!anomalies || anomalies.length === 0) {
    return (
      <Card title="Top Anomalous Customers" isLoading={isLoading}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#5891cb'
        }}>
          No anomaly data available
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Top Anomalous Customers" 
      subtitle={`Showing ${Math.min(maxRows, anomalies.length)} of ${anomalies.length} anomalies`}
      isLoading={isLoading}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th 
                style={headerStyle} 
                onClick={() => handleSort('customerName')}
              >
                Customer {getSortIcon('customerName')}
              </th>
              <th 
                style={headerStyle} 
                onClick={() => handleSort('anomalyScore')}
              >
                Score {getSortIcon('anomalyScore')}
              </th>
              <th 
                style={headerStyle} 
                onClick={() => handleSort('severity')}
              >
                Severity {getSortIcon('severity')}
              </th>
              <th 
                style={headerStyle} 
                onClick={() => handleSort('totalAmount')}
              >
                Total Amount {getSortIcon('totalAmount')}
              </th>
              <th 
                style={headerStyle} 
                onClick={() => handleSort('transactionCount')}
              >
                Transactions {getSortIcon('transactionCount')}
              </th>
              <th 
                style={headerStyle} 
                onClick={() => handleSort('region')}
              >
                Region {getSortIcon('region')}
              </th>
              <th style={headerStyle}>
                Top Features
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAnomalies.map((anomaly, index) => (
              <tr
                key={anomaly.customerId}
                style={{
                  ...rowStyle,
                  backgroundColor: selectedCustomer === anomaly.customerId 
                    ? '#3a4459' 
                    : index % 2 === 0 ? '#2c3341' : 'transparent'
                }}
                onClick={() => handleCustomerClick(anomaly)}
                onMouseEnter={(e) => {
                  if (selectedCustomer !== anomaly.customerId) {
                    e.target.parentElement.style.backgroundColor = '#3a4459';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCustomer !== anomaly.customerId) {
                    e.target.parentElement.style.backgroundColor = 
                      index % 2 === 0 ? '#2c3341' : 'transparent';
                  }
                }}
              >
                <td style={cellStyle}>
                  <div style={{ fontWeight: 'bold' }}>
                    {anomaly.customerName}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    ID: {anomaly.customerId}
                  </div>
                </td>
                <td style={cellStyle}>
                  <div style={{ 
                    fontWeight: 'bold',
                    color: anomaly.anomalyScore > 0.5 ? '#e930ff' : '#00e0ff'
                  }}>
                    {anomaly.anomalyScore.toFixed(3)}
                  </div>
                </td>
                <td style={cellStyle}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: getSeverityColor(anomaly.severity),
                    color: '#0a1224',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    Level {anomaly.severity}
                  </div>
                </td>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 'bold' }}>
                    {formatCurrency(anomaly.totalAmount)}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Avg: {formatCurrency(anomaly.avgAmount)}
                  </div>
                </td>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 'bold' }}>
                    {anomaly.transactionCount.toLocaleString()}
                  </div>
                </td>
                <td style={cellStyle}>
                  <div>{anomaly.region}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    {anomaly.state}, {anomaly.country}
                  </div>
                </td>
                <td style={cellStyle}>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '4px' 
                  }}>
                    {anomaly.features
                      .sort((a, b) => b.contribution - a.contribution)
                      .slice(0, 3)
                      .map((feature, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            backgroundColor: '#232a36',
                            borderRadius: '8px',
                            color: '#00e0ff'
                          }}
                          title={`${feature.name}: ${feature.contribution.toFixed(1)}% contribution`}
                        >
                          {feature.name.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      ))
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#232a36',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        fontSize: '12px'
      }}>
        <div>
          <div style={{ color: '#5891cb' }}>Avg Score</div>
          <div style={{ fontWeight: 'bold', color: '#f7f9fb' }}>
            {(sortedAnomalies.reduce((sum, a) => sum + a.anomalyScore, 0) / sortedAnomalies.length).toFixed(3)}
          </div>
        </div>
        <div>
          <div style={{ color: '#5891cb' }}>High Severity</div>
          <div style={{ fontWeight: 'bold', color: '#e930ff' }}>
            {sortedAnomalies.filter(a => a.severity >= 4).length}
          </div>
        </div>
        <div>
          <div style={{ color: '#5891cb' }}>Total Value</div>
          <div style={{ fontWeight: 'bold', color: '#00e0ff' }}>
            {formatCurrency(sortedAnomalies.reduce((sum, a) => sum + a.totalAmount, 0))}
          </div>
        </div>
        <div>
          <div style={{ color: '#5891cb' }}>Avg Transactions</div>
          <div style={{ fontWeight: 'bold', color: '#f7f9fb' }}>
            {Math.round(sortedAnomalies.reduce((sum, a) => sum + a.transactionCount, 0) / sortedAnomalies.length)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AnomalyTable; 