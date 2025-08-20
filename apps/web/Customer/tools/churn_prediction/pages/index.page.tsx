import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ChurnKpiTilesNew from '../ui/components/kpi/ChurnKpiTilesNew';
import EnhancedRiskPyramid from '../ui/components/visualizations/EnhancedRiskPyramid';
import EnhancedProbabilityHistogram from '../ui/components/visualizations/EnhancedProbabilityHistogram';
import EnhancedFeatureImportance from '../ui/components/visualizations/EnhancedFeatureImportance';
import EnhancedTemporalRiskPattern from '../ui/components/visualizations/EnhancedTemporalRiskPattern';
import EnhancedContextAwareChatbot from '../ui/components/chat/EnhancedContextAwareChatbot';
import SimpleInteractiveBI from '../ui/components/SimpleInteractiveBI';

import { RootState } from 'store';
import { fetchChurnCustomers, setFilters } from '../ui/state/churnPredictionSlice';
import { ChurnCustomer, ChurnKPI } from '../ui/types';

const computeKPIs = (customers: ChurnCustomer[]): ChurnKPI => {
  if (!customers.length) return {
    overallRisk: 0, highRiskCount: 0, modelConfidence: 0.85, topFactor: 'Recency', riskTransition: 0
  };
  const overallRisk = Math.round(100 * customers.filter(c => c.risk_level !== 'Low').length / customers.length);
  const highRiskCount = customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High').length;
  return {
    overallRisk,
    highRiskCount,
    modelConfidence: 0.92,
    topFactor: 'Recency',
    riskTransition: Math.floor(Math.random() * 15) + 5
  };
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Very High': return '#FF4444';
    case 'High': return '#FF8800';
    case 'Medium': return '#FFB800';
    case 'Low': return '#00E676';
    default: return '#888';
  }
};

const getRiskBadge = (riskLevel: string, probability: number) => {
  const color = getRiskColor(riskLevel);
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 20,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      fontSize: 12,
      fontWeight: 600,
      color: color
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}60`
      }} />
      {riskLevel} ({(probability * 100).toFixed(1)}%)
    </div>
  );
};

export function ChurnPredictionDashboard() {
  const dispatch = useDispatch();
  const { customers, loading, error, filters } = useSelector((state: RootState) => state.churnPrediction);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ChurnCustomer>('churn_probability');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<ChurnCustomer | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showBIAgent, setShowBIAgent] = useState(false);

  useEffect(() => {
    dispatch(fetchChurnCustomers());
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const kpis = computeKPIs(customers);

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;
    
    // Apply risk level filter
    if (filters.riskLevel) {
      filtered = filtered.filter(c => c.risk_level === filters.riskLevel);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_id.toString().includes(searchTerm)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      return String(aVal).localeCompare(String(bVal)) * multiplier;
    });
  }, [customers, filters.riskLevel, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof ChurnCustomer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: keyof ChurnCustomer) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↗️' : '↘️';
  };

  return (
    <>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(1deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .chart-container {
            position: relative;
            overflow: visible;
            box-sizing: border-box;
            padding: 8px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            contain: layout;
          }
          
          .chart-container:hover {
            transform: translateY(-4px);
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12), 0 0 60px rgba(59, 130, 246, 0.08);
          }
          
          .chart-container > * {
            max-width: 100%;
            max-height: 100%;
            box-sizing: border-box;
          }
          
          .dashboard-grid {
            box-sizing: border-box;
            max-width: 1600px;
            margin: 0 auto;
          }
          
          @media (max-width: 1400px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
              max-width: 900px;
            }
          }
          
          @media (max-width: 768px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
              padding: 10px 0 !important;
            }
            
            .chart-container {
              min-height: 450px !important;
              padding: 4px;
            }
          }
        `}
      </style>
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)',
        padding: windowWidth > 1400 ? '40px 60px' : windowWidth > 768 ? '32px 40px' : '24px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* Subtle animated background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite'
      }} />

      <div style={{ 
        maxWidth: windowWidth > 1400 ? 1800 : 1200, 
        margin: '0 auto', 
        position: 'relative', 
        zIndex: 10,
        padding: '0 20px'
      }}>
        {/* Modern Header Section */}
        <div style={{ 
          marginBottom: 48,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '40px 32px',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05), 0 0 20px rgba(59, 130, 246, 0.05)'
        }}>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 800, 
            marginBottom: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>
            🎯 AI-Powered Churn Prediction
          </h1>
          <div style={{ 
            color: '#64748b', 
            fontSize: 16,
            fontWeight: 500,
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Advanced machine learning analytics to identify at-risk customers and optimize retention strategies
          </div>
        </div>

        {/* KPI Section */}
        <div style={{ marginBottom: 60 }}>
          <ChurnKpiTilesNew kpis={kpis} />
        </div>

        {/* Visualizations Grid - Spacious Layout */}
        <div 
          className="dashboard-grid"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: windowWidth > 1400 ? 'repeat(2, 1fr)' : '1fr', 
            gap: windowWidth > 1400 ? 48 : windowWidth > 768 ? 32 : 24, 
            marginBottom: 60,
            gridAutoRows: 'minmax(420px, auto)',
            padding: '20px 0'
          }}>
          <div 
            className="chart-container"
            style={{ 
              width: '100%',
              height: 'auto',
              minHeight: 'clamp(420px, 50vh, 650px)'
            }}>
            <EnhancedRiskPyramid customers={customers} data={customers} />
          </div>
          <div 
            className="chart-container"
            style={{ 
              width: '100%',
              height: 'auto',
              minHeight: 'clamp(420px, 50vh, 650px)'
            }}>
            <EnhancedProbabilityHistogram customers={customers} data={customers} />
          </div>
          <div 
            className="chart-container"
            style={{ 
              width: '100%',
              height: 'auto',
              minHeight: 'clamp(420px, 50vh, 650px)'
            }}>
            <EnhancedFeatureImportance customers={customers} data={customers} />
          </div>
          <div 
            className="chart-container"
            style={{ 
              width: '100%',
              height: 'auto',
              minHeight: 'clamp(420px, 50vh, 650px)'
            }}>
            <EnhancedTemporalRiskPattern customers={customers} data={customers} />
          </div>
        </div>

        {/* Advanced Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: 24,
          marginBottom: 24,
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <input
                type="text"
                placeholder="🔍 Search customers by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#1e293b',
                  fontSize: 16,
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
                }}
              />
            </div>
            <select 
              value={filters.riskLevel || ''} 
              onChange={(e) => dispatch(setFilters({ riskLevel: e.target.value }))}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid rgba(59, 130, 246, 0.2)',
                background: 'rgba(255, 255, 255, 0.8)',
                color: '#1e293b',
                fontSize: 16,
                outline: 'none',
                cursor: 'pointer',
                minWidth: 150
              }}
            >
              <option value=''>All Risk Levels</option>
              <option value='Low'>🟢 Low Risk</option>
              <option value='Medium'>🟡 Medium Risk</option>
              <option value='High'>🟠 High Risk</option>
              <option value='Very High'>🔴 Very High Risk</option>
            </select>
          </div>
        </div>

        {/* Enhanced Customer Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ 
            padding: '24px 32px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: '#1e293b', 
              fontSize: 24, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              👥 Customer Risk Analysis
              <span style={{ 
                fontSize: 14, 
                fontWeight: 500, 
                color: '#3b82f6',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '4px 12px',
                borderRadius: 20
              }}>
                {filteredAndSortedCustomers.length} customers
              </span>
            </h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              color: '#f7f9fb', 
              fontFamily: 'Inter, sans-serif', 
              borderCollapse: 'collapse' 
            }}>
              <thead>
                <tr style={{ background: 'rgba(15, 20, 25, 0.8)' }}>
                  {[
                    { key: 'customer_id', label: 'ID' },
                    { key: 'name', label: 'Customer Name' },
                    { key: 'rfm', label: 'RFM Score' },
                    { key: 'last_purchase_date', label: 'Last Purchase' },
                    { key: 'frequency', label: 'Frequency' },
                    { key: 'avg_order_value', label: 'Avg Order Value' },
                    { key: 'churn_probability', label: 'Churn Risk' },
                    { key: 'risk_level', label: 'Risk Level' }
                  ].map(col => (
                    <th 
                      key={col.key}
                      onClick={() => handleSort(col.key as keyof ChurnCustomer)}
                      style={{ 
                        textAlign: 'left', 
                        padding: '16px 20px',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                        userSelect: 'none',
                        color: '#1e293b'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {col.label}
                        <span style={{ opacity: 0.6 }}>{getSortIcon(col.key as keyof ChurnCustomer)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 12,
                        color: '#3b82f6',
                        fontSize: 18,
                        fontWeight: 600
                      }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          border: '2px solid rgba(59, 130, 246, 0.3)',
                          borderTop: '2px solid #3b82f6',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Loading customer data...
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedCustomers.map((customer, index) => (
                  <tr 
                    key={customer.customer_id} 
                    style={{ 
                      borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#00e0ff' }}>
                      #{customer.customer_id}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 500 }}>
                      {customer.name}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: customer.rfm >= 8 ? 'rgba(0, 230, 118, 0.2)' : 
                                   customer.rfm >= 5 ? 'rgba(255, 184, 0, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                        color: customer.rfm >= 8 ? '#00E676' : 
                               customer.rfm >= 5 ? '#FFB800' : '#FF4444',
                        fontWeight: 600,
                        fontSize: 12
                      }}>
                        {customer.rfm}/10
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, opacity: 0.9 }}>
                      {new Date(customer.last_purchase_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 40,
                          height: 6,
                          background: 'rgba(0, 224, 255, 0.2)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(customer.frequency / 20 * 100, 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #00e0ff, #7c3aed)',
                            borderRadius: 3
                          }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{customer.frequency}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#00E676' }}>
                      ${customer.avg_order_value?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 60,
                          height: 8,
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${customer.churn_probability * 100}%`,
                            height: '100%',
                            background: customer.churn_probability > 0.7 ? 
                              'linear-gradient(90deg, #FF4444, #FF8800)' :
                              customer.churn_probability > 0.4 ?
                              'linear-gradient(90deg, #FFB800, #FF8800)' :
                              'linear-gradient(90deg, #00E676, #00e0ff)',
                            borderRadius: 4,
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        <span style={{ 
                          fontSize: 14, 
                          fontWeight: 600,
                          color: customer.churn_probability > 0.7 ? '#FF4444' : 
                                 customer.churn_probability > 0.4 ? '#FFB800' : '#00E676'
                        }}>
                          {(customer.churn_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getRiskBadge(customer.risk_level, customer.churn_probability)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {error && (
            <div style={{ 
              padding: 24, 
              textAlign: 'center',
              color: '#FF4444',
              fontSize: 16,
              fontWeight: 600,
              background: 'rgba(255, 68, 68, 0.1)',
              borderTop: '1px solid rgba(255, 68, 68, 0.2)'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* AI Chat Toggle Button - Handled by EnhancedContextAwareChatbot component */}

      {/* Enhanced Context-Aware Chatbot with @mention support */}
      <EnhancedContextAwareChatbot 
        dashboardContext={{
          source_dashboard: 'churn_prediction',
          customer_context: {
            total_customers: customers.length,
            high_risk_customers: customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High').length,
            avg_churn_probability: customers.length > 0 ? customers.reduce((sum, c) => sum + c.churn_probability, 0) / customers.length : 0,
            active_customer: selectedCustomer ? {
              customer_id: selectedCustomer.customer_id,
              name: selectedCustomer.name,
              risk_level: selectedCustomer.risk_level,
              churn_probability: selectedCustomer.churn_probability,
              avg_order_value: selectedCustomer.avg_order_value,
              frequency: selectedCustomer.frequency
            } : null,
            segments: customers.map(c => ({
              segment_name: c.risk_level,
              customer_count: customers.filter(customer => customer.risk_level === c.risk_level).length,
              avg_churn_probability: customers.filter(customer => customer.risk_level === c.risk_level)
                .reduce((sum, customer) => sum + customer.churn_probability, 0) / 
                customers.filter(customer => customer.risk_level === c.risk_level).length || 0
            })).filter((segment, index, self) => 
              index === self.findIndex(s => s.segment_name === segment.segment_name)
            )
          },
          chart_context: {
            chartType: 'risk-pyramid',
            activeChart: 'churn_analysis',
            clickedElement: selectedCustomer?.risk_level || null
          },
          filters: {
            risk_level: filters.riskLevel,
            search_term: searchTerm,
            sort_field: sortField,
            sort_direction: sortDirection
          },
          date_range: {
            start_date: '2024-01-01',
            end_date: '2024-12-31'
          }
        }}
      />
      
      {/* Interactive Business Intelligence Agent */}
      <button
        onClick={() => setShowBIAgent(!showBIAgent)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '200px',
          height: '60px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '30px',
          cursor: 'pointer',
          zIndex: 9900,
          boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 15px 50px rgba(59, 130, 246, 0.7)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(59, 130, 246, 0.5)';
        }}
      >
        🧠 AI Business Q&A
      </button>
      
      {/* Show the Interactive BI panel when clicked */}
      {showBIAgent && <SimpleInteractiveBI onClose={() => setShowBIAgent(false)} />}
    </>
  );
}

export default ChurnPredictionDashboard; 