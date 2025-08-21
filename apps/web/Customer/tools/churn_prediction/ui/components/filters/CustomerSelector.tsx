import React, { useState, useEffect } from 'react';
import { ChurnCustomer } from '../../types';

interface CustomerSelectorProps {
  customers: ChurnCustomer[];
  onCustomerSelect: (customerIds: number[]) => void;
  selectedSegments: string[];
}

export default function CustomerSelector({ 
  customers, 
  onCustomerSelect,
  selectedSegments 
}: CustomerSelectorProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'probability'>('risk');

  // Clear selection when segments change
  useEffect(() => {
    setSelectedCustomers([]);
    onCustomerSelect([]);
  }, [selectedSegments.join(',')]);

  // Don't render if no segments are selected
  if (!selectedSegments || selectedSegments.length === 0) {
    return null;
  }

  // Filter customers by selected segments and search term
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.customer_id.toString().includes(searchTerm);
    
    // Map customer to segment based on characteristics
    const customerSegment = getCustomerSegment(customer);
    const matchesSegment = selectedSegments.includes(customerSegment);
    
    return matchesSearch && matchesSegment;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'risk':
        const riskOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return (riskOrder[b.risk_level] || 0) - (riskOrder[a.risk_level] || 0);
      case 'probability':
        return b.churn_probability - a.churn_probability;
      default:
        return 0;
    }
  });

  const handleCustomerToggle = (customerId: number) => {
    const newSelection = selectedCustomers.includes(customerId)
      ? selectedCustomers.filter(id => id !== customerId)
      : [...selectedCustomers, customerId];
    
    setSelectedCustomers(newSelection);
    onCustomerSelect(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = sortedCustomers.map(c => c.customer_id);
    setSelectedCustomers(allIds);
    onCustomerSelect(allIds);
  };

  const handleClearSelection = () => {
    setSelectedCustomers([]);
    onCustomerSelect([]);
  };

  // Get customer segment helper
  function getCustomerSegment(customer: ChurnCustomer): string {
    const clv = customer.customer_lifetime_value || 0;
    const totalSpent = customer.total_spent || 0;
    const frequency = customer.frequency || 0;
    
    if (clv > 50000 || totalSpent > 30000) return 'Enterprise';
    if (clv > 20000 || totalSpent > 10000) return 'Mid-Market';
    if (clv < 10000 && frequency > 20) return 'Startup';
    if (customer.name?.toLowerCase().includes('gov') || 
        customer.name?.toLowerCase().includes('department')) return 'Government';
    if (customer.name?.toLowerCase().includes('foundation') || 
        customer.name?.toLowerCase().includes('charity')) return 'Non-Profit';
    
    return 'Small Business';
  }

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
      background: 'rgba(30, 39, 56, 0.8)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? 16 : 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#f7f9fb'
          }}>
            👤 Select Individual Customers from {selectedSegments.join(', ')}
          </h3>
          {selectedCustomers.length > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #7c3aed, #00e0ff)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600
            }}>
              {selectedCustomers.length} selected
            </span>
          )}
          {selectedSegments.map(segment => (
            <span 
              key={segment}
              style={{
                background: 'rgba(124, 58, 237, 0.2)',
                color: '#7c3aed',
                padding: '2px 8px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                border: '1px solid rgba(124, 58, 237, 0.3)'
              }}
            >
              {segment}
            </span>
          ))}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#00e0ff',
            fontSize: 20,
            cursor: 'pointer',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.3s'
          }}
        >
          ▼
        </button>
      </div>

      {isExpanded && (
        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
          {/* Search and Controls */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16
          }}>
            <input
              type="text"
              placeholder={`Search within ${filteredCustomers.length} customers from ${selectedSegments.join(', ')} segment(s)...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(15, 20, 25, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#f7f9fb',
                fontSize: 14,
                outline: 'none'
              }}
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                background: 'rgba(15, 20, 25, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#f7f9fb',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              <option value="risk">Sort by Risk</option>
              <option value="probability">Sort by Probability</option>
              <option value="name">Sort by Name</option>
            </select>

            <button
              onClick={handleSelectAll}
              style={{
                padding: '8px 16px',
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: 8,
                color: '#00e0ff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              Select All
            </button>

            {selectedCustomers.length > 0 && (
              <button
                onClick={handleClearSelection}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: 'rgba(247, 249, 251, 0.7)',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.color = '#f7f9fb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = 'rgba(247, 249, 251, 0.7)';
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer List */}
          <div style={{
            maxHeight: 400,
            overflowY: 'auto',
            background: 'rgba(15, 20, 25, 0.4)',
            borderRadius: 8,
            padding: 8
          }}>
            {sortedCustomers.length === 0 ? (
              <div style={{
                padding: 24,
                textAlign: 'center',
                color: 'rgba(247, 249, 251, 0.5)',
                fontSize: 14
              }}>
                No customers found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sortedCustomers.slice(0, 100).map(customer => (
                  <div
                    key={customer.customer_id}
                    onClick={() => handleCustomerToggle(customer.customer_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: selectedCustomers.includes(customer.customer_id)
                        ? 'rgba(124, 58, 237, 0.15)'
                        : 'transparent',
                      border: '1px solid',
                      borderColor: selectedCustomers.includes(customer.customer_id)
                        ? 'rgba(124, 58, 237, 0.4)'
                        : 'transparent',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedCustomers.includes(customer.customer_id)) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedCustomers.includes(customer.customer_id)) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.customer_id)}
                      readOnly
                      style={{
                        marginRight: 12,
                        cursor: 'pointer',
                        pointerEvents: 'none'
                      }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        color: '#f7f9fb',
                        fontWeight: 500,
                        marginBottom: 2
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
                      gap: 8
                    }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: `${getRiskColor(customer.risk_level)}20`,
                        color: getRiskColor(customer.risk_level),
                        fontSize: 11,
                        fontWeight: 600,
                        border: `1px solid ${getRiskColor(customer.risk_level)}40`
                      }}>
                        {customer.risk_level}
                      </span>
                      
                      <div style={{
                        fontSize: 12,
                        color: 'rgba(247, 249, 251, 0.7)',
                        minWidth: 45,
                        textAlign: 'right'
                      }}>
                        {(customer.churn_probability * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {sortedCustomers.length > 100 && (
                  <div style={{
                    padding: 12,
                    textAlign: 'center',
                    color: 'rgba(247, 249, 251, 0.5)',
                    fontSize: 12,
                    fontStyle: 'italic'
                  }}>
                    Showing first 100 of {sortedCustomers.length} customers
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedCustomers.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: 8,
              fontSize: 13,
              color: 'rgba(247, 249, 251, 0.9)'
            }}>
              <strong>Selection Summary:</strong>
              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                <span>
                  Total CLV: ${customers
                    .filter(c => selectedCustomers.includes(c.customer_id))
                    .reduce((sum, c) => sum + (c.customer_lifetime_value || 0), 0)
                    .toLocaleString()}
                </span>
                <span>
                  Avg Risk: {(customers
                    .filter(c => selectedCustomers.includes(c.customer_id))
                    .reduce((sum, c) => sum + c.churn_probability, 0) / selectedCustomers.length * 100
                  ).toFixed(1)}%
                </span>
                <span>
                  High Risk: {customers
                    .filter(c => selectedCustomers.includes(c.customer_id))
                    .filter(c => c.risk_level === 'High' || c.risk_level === 'Very High')
                    .length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
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