import React, { useState } from 'react';
import { ChurnCustomer } from '../types';

interface SelectedCustomersDisplayProps {
  selectedCustomers: ChurnCustomer[];
  onClearSelection?: () => void;
  onGenerateStrategies?: () => void;
}

export default function SelectedCustomersDisplay({ 
  selectedCustomers, 
  onClearSelection,
  onGenerateStrategies 
}: SelectedCustomersDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!selectedCustomers || selectedCustomers.length === 0) {
    return null;
  }

  // Calculate aggregate metrics
  const totalCLV = selectedCustomers.reduce((sum, c) => sum + (c.customer_lifetime_value || 0), 0);
  const avgChurnRisk = selectedCustomers.reduce((sum, c) => sum + c.churn_probability, 0) / selectedCustomers.length;
  const highRiskCount = selectedCustomers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High': return '#FF4444';
      case 'High': return '#FF8800';
      case 'Medium': return '#FFB800';
      case 'Low': return '#00E676';
      default: return '#666';
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(0, 224, 255, 0.1))',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      border: '1px solid rgba(124, 58, 237, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background animation */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(0, 224, 255, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 3s infinite'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
        zIndex: 1
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #00e0ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎯 Selected Customers Analysis
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 14,
            color: 'rgba(247, 249, 251, 0.7)'
          }}>
            {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected for targeted retention
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              color: '#f7f9fb',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            {showDetails ? '📊 Hide Details' : '📊 Show Details'}
          </button>

          {onGenerateStrategies && (
            <button
              onClick={onGenerateStrategies}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #7c3aed, #00e0ff)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
              }}
            >
              🚀 Generate Strategies
            </button>
          )}

          {onClearSelection && (
            <button
              onClick={onClearSelection}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                borderRadius: 8,
                color: '#FF4444',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 20,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'rgba(15, 20, 25, 0.6)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: 12,
            color: 'rgba(247, 249, 251, 0.6)',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Total Revenue at Risk
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#00e0ff'
          }}>
            ${totalCLV.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 20, 25, 0.6)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: 12,
            color: 'rgba(247, 249, 251, 0.6)',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Average Churn Risk
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: avgChurnRisk > 0.5 ? '#FF4444' : '#FFB800'
          }}>
            {(avgChurnRisk * 100).toFixed(1)}%
          </div>
        </div>

        <div style={{
          background: 'rgba(15, 20, 25, 0.6)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: 12,
            color: 'rgba(247, 249, 251, 0.6)',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            High Risk Customers
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#FF8800'
          }}>
            {highRiskCount} / {selectedCustomers.length}
          </div>
        </div>
      </div>

      {/* Customer Details */}
      {showDetails && (
        <div style={{
          maxHeight: 300,
          overflowY: 'auto',
          background: 'rgba(15, 20, 25, 0.4)',
          borderRadius: 12,
          padding: 16,
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{
            display: 'grid',
            gap: 12
          }}>
            {selectedCustomers.map(customer => (
              <div
                key={customer.customer_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: 'rgba(30, 39, 56, 0.6)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 39, 56, 0.8)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 39, 56, 0.6)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#f7f9fb',
                    marginBottom: 4
                  }}>
                    {customer.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(247, 249, 251, 0.6)'
                  }}>
                    ID: {customer.customer_id} | CLV: ${customer.customer_lifetime_value?.toLocaleString()}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: 11,
                      color: 'rgba(247, 249, 251, 0.5)',
                      marginBottom: 2
                    }}>
                      Last Purchase
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'rgba(247, 249, 251, 0.7)'
                    }}>
                      {customer.recency} days ago
                    </div>
                  </div>

                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    background: `${getRiskColor(customer.risk_level)}20`,
                    color: getRiskColor(customer.risk_level),
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${getRiskColor(customer.risk_level)}40`,
                    minWidth: 80,
                    textAlign: 'center'
                  }}>
                    {customer.risk_level}
                  </div>

                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: getRiskColor(customer.risk_level),
                    minWidth: 50,
                    textAlign: 'right'
                  }}>
                    {(customer.churn_probability * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Summary */}
      <div style={{
        marginTop: 20,
        padding: 16,
        background: 'rgba(124, 58, 237, 0.1)',
        borderRadius: 12,
        border: '1px solid rgba(124, 58, 237, 0.3)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: 14,
          color: 'rgba(247, 249, 251, 0.9)',
          lineHeight: 1.6
        }}>
          <strong style={{ color: '#7c3aed' }}>📌 What you can do with selected customers:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 24 }}>
            <li>Generate personalized retention strategies based on their risk profiles</li>
            <li>Export customer list for targeted email campaigns</li>
            <li>Create custom dashboards focused on these specific accounts</li>
            <li>Schedule automated alerts for changes in their behavior</li>
            <li>Assign to customer success team for immediate outreach</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}