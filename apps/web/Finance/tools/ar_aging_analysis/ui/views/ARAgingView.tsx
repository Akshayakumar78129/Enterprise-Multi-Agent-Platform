import React, { useState, useEffect, useCallback } from 'react';
import { FilterControls } from '../components/controls/FilterControls';
import { ARIntelligenceAssistant } from '../components/ai-interaction/ARIntelligenceAssistant';
import { BIAgent } from '../components/ai-interaction/BIAgent';
import { ChatbotIntegration } from '../components/ai-interaction/ChatbotIntegration';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import { fetchDashboardData } from '../api/arAgingApi';

const ARAgingView: React.FC = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '2017-01-01',
    endDate: '2021-12-31',
    region: 'all',
    customerType: 'all',
    segment: 'all'
  });

  // AI Features State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightData, setAIInsightData] = useState(null);
  const [showBIAgent, setShowBIAgent] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    console.log('🔍 Loading dashboard data with current filters:', filters);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData(filters);
      console.log('✅ Dashboard data loaded successfully, Total AR:', data?.kpis?.totalAR?.value);
      setDashboardData(data);
    } catch (err) {
      console.error('❌ Error loading AR aging data:', err);
      setError('Failed to load AR aging data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]); // Include filters dependency so it reloads when filters change

  // Load initial data
  useEffect(() => {
    console.log('🔄 useEffect triggered - loading data');
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    console.log('🎛️ Filter change received:', newFilters);
    const updated = { ...filters, ...newFilters };
    console.log('📝 Setting new filters (immediate):', updated);
    setFilters(updated);
    // The useEffect will automatically trigger loadDashboardData when filters change
  };

  // Handle chart/KPI clicks for AI Insights
  const handleDataPointClick = (data: any, chartType: string) => {
    setAIInsightData({
      ...data,
      chartType,
      context: 'ar_aging_analysis',
      filters
    });
    setShowAIInsights(true);
  };

  // Send data to chatbot
  const handleSendToChat = (data: any) => {
    // Data will be handled by the chatbot component
    setShowAIInsights(false);
  };

  // Helper to safely access nested dashboard data
  const getData = (path: string) => {
    const data = dashboardData?.data ? dashboardData.data : dashboardData;
    return data?.[path];
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#0a1224',
        color: '#f7f9fb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #00e0ff',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '18px' }}>Loading AR Aging Analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#0a1224',
        color: '#f7f9fb',
        textAlign: 'center',
        gap: '16px'
      }}>
        <div style={{ fontSize: '48px', color: '#e930ff' }}>⚠️</div>
        <h3 style={{ color: '#f7f9fb', margin: 0 }}>Error Loading Dashboard</h3>
        <p style={{ color: '#8892a8', margin: 0 }}>{error}</p>
        <button
          onClick={loadDashboardData}
          style={{
            padding: '12px 24px',
            backgroundColor: '#00e0ff',
            color: '#0a1224',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div style={{ 
      backgroundColor: '#0a1224',
      minHeight: '100vh',
      color: '#f7f9fb',
      padding: '20px',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '32px 0 24px 0',
        borderBottom: '2px solid #1e2738',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.05) 0%, rgba(233, 48, 255, 0.05) 100%)',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <div>
            <h1 style={{
              color: '#f7f9fb',
              fontSize: '32px',
              fontWeight: '800',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #00e0ff 0%, #5fd4d6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📊 AR Aging Analysis Dashboard
            </h1>
            <p style={{
              color: '#8892a8',
              fontSize: '16px',
              margin: 0,
              fontWeight: '500'
            }}>
              Strategic Working Capital Optimization • Real-time Financial Intelligence
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={() => setShowAIInsights(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#00e0ff',
                color: '#0a1224',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🧠 AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Filter Controls */}
        <div style={{ marginBottom: '24px' }}>
          <FilterControls onFilterChange={handleFilterChange} currentFilters={filters} />
        </div>

        {/* Executive KPI Tiles */}
        <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {[
            {
              title: 'Total A/R',
              value: `$${((getData('kpis')?.totalAR?.value || 0)/1000000).toFixed(1)}M`,
              change: '+1.2%',
              trend: 'up',
              color: '#00e0ff',
              subtitle: getData('kpis')?.totalAR?.description || 'Total accounts receivable'
            },
            {
              title: 'Days Sales Outstanding',
              value: `${getData('kpis')?.daysOutstanding?.value || 0} days`,
              change: '+$340K',
              trend: 'down',
              color: '#e930ff',
              subtitle: getData('kpis')?.daysOutstanding?.description || 'Average collection period'
            },
            {
              title: 'Overdue Amount',
              value: `$${((getData('kpis')?.overdueAmount?.value || 0)/1000000).toFixed(1)}M`,
              change: '-2%',
              trend: 'down',
              color: '#ffc145',
              subtitle: getData('kpis')?.overdueAmount?.description || 'Total overdue receivables'
            },
            {
              title: 'Collection Efficiency',
              value: `${(getData('kpis')?.collectionEfficiency?.value || 0).toFixed(1)}%`,
              change: '+3%',
              trend: 'down',
              color: '#e930ff',
              subtitle: getData('kpis')?.collectionEfficiency?.description || 'Collection success rate'
            },
            {
              title: 'High Risk Exposure',
              value: `$${((getData('kpis')?.riskExposure?.value || 0)/1000000).toFixed(1)}M`,
              change: '+0.3',
              trend: 'up',
              color: '#5fd4d6',
              subtitle: getData('kpis')?.riskExposure?.description || 'At-risk receivables'
            }
          ].map((kpi, index) => (
            <div
              key={index}
              onClick={() => handleDataPointClick(kpi, 'kpi')}
              style={{
                background: 'linear-gradient(135deg, #232a36 0%, #1a2332 100%)',
                border: '1px solid #1e2738',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = kpi.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 25px ${kpi.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e2738';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  color: '#8892a8',
                  fontSize: '13px',
                  fontWeight: '500',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {kpi.title}
                </h3>
                <span style={{
                  color: kpi.trend === 'up' ? '#5fd4d6' : '#e930ff',
                  fontSize: '20px'
                }}>
                  {kpi.trend === 'up' ? '↗' : '↘'}
                </span>
              </div>
              <div style={{
                color: '#f7f9fb',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                {kpi.value}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  color: kpi.trend === 'up' ? '#5fd4d6' : '#e930ff',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {kpi.change}
                </span>
                <span style={{
                  color: '#8892a8',
                  fontSize: '11px'
                }}>
                  {kpi.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Main Dashboard Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '28px',
          marginBottom: '40px'
        }}>
        {/* NPV-Adjusted AR Portfolio Analysis */}
        <div style={{
          backgroundColor: '#232a36',
          border: '1px solid #1e2738',
          borderRadius: '12px',
          padding: '24px',
          overflow: 'hidden',
          minHeight: '480px',
          // overflow: 'hidden'
        }}>
          <h3 style={{
            color: '#f7f9fb',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📊 NPV-Adjusted AR Portfolio Analysis
          </h3>
          
          {/* Economic Value Waterfall */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'end',
            height: '300px',
            padding: '20px 0',
            gap: '8px'
          }}>
            {(getData('agingBreakdown') || []).map((bucket, index) => (
              <div
                key={index}
                onClick={() => handleDataPointClick(bucket, 'aging_bucket')}
                style={{
                  flex: '1',
                  maxWidth: '120px',
                  height: `${Math.max(30, ((bucket.percentage || 0) / 100) * 250)}px`,
                  backgroundColor: bucket.color,
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  fontSize: '11px',
                  color: bucket.bucket?.includes('90+') ? '#f7f9fb' : '#0a1224',
                  fontWeight: '600'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${bucket.color}40`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  ${((bucket.amount || 0)/1000000).toFixed(1)}M
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px' }}>
                  {(bucket.percentage || 0).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          
          {/* X-axis labels */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: '10px',
            gap: '8px'
          }}>
            {(getData('agingBreakdown') || []).map((bucket, index) => (
              <div
                key={`label-${index}`}
                style={{
                  flex: '1',
                  maxWidth: '120px',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#8892a8',
                  fontWeight: '500'
                }}
              >
                {bucket.bucket || bucket.aging_bucket}
              </div>
            ))}
          </div>

          {/* NPV Impact Summary */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#1e2738',
            borderRadius: '8px',
            border: '1px solid #232a36'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
              fontSize: '12px'
            }}>
              <div>
                <div style={{ color: '#8892a8', marginBottom: '4px' }}>Gross AR Value</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  ${((getData('kpis')?.totalAR?.value || 0)/1000000).toFixed(1)}M
                </div>
              </div>
              <div>
                <div style={{ color: '#8892a8', marginBottom: '4px' }}>NPV Adjustment</div>
                <div style={{ color: '#e930ff', fontWeight: '600' }}>
                  -${((getData('kpis')?.overdueAmount?.value || 0)/1000000).toFixed(1)}M
                </div>
              </div>
              <div>
                <div style={{ color: '#8892a8', marginBottom: '4px' }}>Carrying Costs</div>
                <div style={{ color: '#ffc145', fontWeight: '600' }}>
                  -${((getData('kpis')?.riskExposure?.value || 0)/1000000*0.1).toFixed(1)}M
                </div>
              </div>
              <div>
                <div style={{ color: '#8892a8', marginBottom: '4px' }}>Net Realizable</div>
                <div style={{ color: '#5fd4d6', fontWeight: '600' }}>
                  ${(((getData('kpis')?.totalAR?.value || 0) - (getData('kpis')?.overdueAmount?.value || 0))/1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Portfolio Value Matrix */}
        <div style={{
          backgroundColor: '#232a36',
          border: '1px solid #1e2738',
          borderRadius: '12px',
          padding: '24px',
          overflow: 'hidden',
          minHeight: '480px'
        }}>
          <h3 style={{
            color: '#f7f9fb',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🎯 Customer Portfolio Value Matrix
          </h3>
          
          {/* BCG-Style Matrix */}
          <div style={{ 
            position: 'relative', 
            height: '320px',
            border: '1px solid #1e2738',
            borderRadius: '8px',
            backgroundColor: '#1a2332'
          }}>
            {/* Quadrant Labels */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '11px',
              color: '#8892a8',
              fontWeight: '600'
            }}>
              Growth Opportunities
            </div>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '11px',
              color: '#8892a8',
              fontWeight: '600'
            }}>
              Strategic Partners
            </div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              fontSize: '11px',
              color: '#8892a8',
              fontWeight: '600'
            }}>
              Value Destroyers
            </div>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              fontSize: '11px',
              color: '#8892a8',
              fontWeight: '600'
            }}>
              Efficiency Targets
            </div>
            
            {/* Center Lines */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '1px',
              backgroundColor: '#1e2738'
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              bottom: '0',
              width: '1px',
              backgroundColor: '#1e2738'
            }} />
            
            {/* Customer Bubbles */}
            {(getData('customerInsights') || []).slice(0, 12).map((customer, index) => {
              const clv = customer.clv || (customer.total_outstanding * 2.5);
              const riskScore = customer.riskScore || Math.min(100, customer.avg_days_overdue / 30);
              const arAmount = customer.arAmount || customer.total_outstanding || 0;
              
              const x = Math.max(5, Math.min(90, (clv / 1000000) * 15 + 10)); // CLV positioning
              const y = Math.max(5, Math.min(90, 85 - (riskScore / 100) * 75)); // Risk positioning (inverted)
              const size = Math.max(8, Math.min(25, Math.sqrt(arAmount / 100000) * 3 + 8));
              
              return (
                <div
                  key={customer.id}
                  onClick={() => handleDataPointClick({...customer, chartType: 'customer_matrix'}, 'customer_matrix')}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    backgroundColor: riskScore > 75 ? '#e930ff' :
                                   riskScore > 50 ? '#ffc145' :
                                   riskScore > 25 ? '#5fd4d6' : '#00e0ff',
                    border: '2px solid rgba(255,255,255,0.3)',
                    opacity: 0.9,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${Math.max(8, size/3)}px`,
                    fontWeight: '700',
                    color: '#fff',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    e.currentTarget.style.zIndex = '10';
                    setSelectedCustomer(customer.id);
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    e.currentTarget.style.zIndex = '1';
                    setSelectedCustomer(null);
                  }}
                  title={`Customer ${customer['Customer Key'] || customer.id} - Amount: $${((arAmount||0)/1000).toFixed(0)}K, Risk Score: ${riskScore.toFixed(0)}`}
                >
                  {customer['Customer Key'] || (index + 1)}
                </div>
              );
            })}
            
            {/* Axis Labels */}
            <div style={{
              position: 'absolute',
              bottom: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#8892a8',
              fontWeight: '500'
            }}>
              Customer Lifetime Value →
            </div>
            <div style={{
              position: 'absolute',
              left: '-80px',
              top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)',
              fontSize: '11px',
              color: '#8892a8',
              fontWeight: '500'
            }}>
              Payment Risk Score →
            </div>
          </div>
          
          {/* Selected Customer Details */}
          {selectedCustomer && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#1e2738',
              borderRadius: '6px',
              fontSize: '12px'
            }}>
              {(() => {
                const customer = (getData('customerInsights') || []).find(c => c.id === selectedCustomer);
                if (!customer) return null;
                return (
                  <div>
                    <div style={{ color: '#f7f9fb', fontWeight: '600', marginBottom: '4px' }}>
                      {customer.name}
                    </div>
                    <div style={{ color: '#8892a8' }}>
                      CLV: ${(customer.clv/1000000).toFixed(1)}M | Risk: {customer.riskScore} | AR: ${(customer.arAmount/1000).toFixed(0)}K | {customer.daysPastDue} days past due
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Cash Collection Forecast - COMPLETELY REBUILT */}
        <div style={{
          backgroundColor: '#232a36',
          border: '1px solid #1e2738',
          borderRadius: '12px',
          padding: '24px',
          minHeight: '440px'
        }}>
          <h3 style={{
            color: '#f7f9fb',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📈 Cash Collection Forecast
          </h3>

          {/* NEW TABLE-STYLE DATA DISPLAY */}
          <div style={{
            marginBottom: '32px',
            border: '2px solid #00e0ff',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Header Row */}
            <div style={{
              display: 'flex',
              backgroundColor: '#00e0ff',
              color: '#0a1224',
              fontWeight: '700',
              fontSize: '12px',
              padding: '12px 0'
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>PERIOD</div>
              <div style={{ flex: 1, textAlign: 'center' }}>AMOUNT</div>
              <div style={{ flex: 1, textAlign: 'center' }}>CONFIDENCE</div>
            </div>
            
            {/* Data Rows */}
            {(getData('collectionPerformance') || []).slice(0, 8).map((forecast, index) => {
              const amount = forecast.amount || (forecast.total_invoices * 50000);
              const confidence = forecast.confidence || Math.min(95, Math.max(60, forecast.collection_rate || 75));
              
              return (
                <div
                  key={`forecast-row-${index}`}
                  style={{
                    display: 'flex',
                    backgroundColor: index % 2 === 0 ? '#1e2738' : '#232a36',
                    color: '#f7f9fb',
                    fontSize: '14px',
                    padding: '16px 0',
                    borderTop: index === 0 ? 'none' : '1px solid #1e2738'
                  }}
                >
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    color: '#8892a8',
                    fontWeight: '500'
                  }}>
                    {forecast.period || `Week ${index + 1}`}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    color: '#00e0ff',
                    fontWeight: '700',
                    fontSize: '16px'
                  }}>
                    ${(amount/1000000).toFixed(1)}M
                  </div>
                  <div style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    color: confidence > 80 ? '#5fd4d6' : confidence > 60 ? '#ffc145' : '#e930ff',
                    fontWeight: '600'
                  }}>
                    {confidence.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* LINE CHART WITH DATA POINTS */}
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#1a2332',
            borderRadius: '12px',
            border: '1px solid #1e2738'
          }}>
            <h4 style={{
              color: '#f7f9fb',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Collection Forecast Trend
            </h4>
            
            {/* Line Chart Container */}
            <div style={{
              position: 'relative',
              height: '140px',
              padding: '20px',
              backgroundColor: '#0f1419',
              borderRadius: '8px',
              border: '1px solid #232a36'
            }}>
              {/* Y-axis Labels */}
              <div style={{
                position: 'absolute',
                left: '0px',
                top: '10px',
                height: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#8892a8',
                fontSize: '10px'
              }}>
                <div>$25M</div>
                <div>$20M</div>
                <div>$15M</div>
                <div>$10M</div>
                <div>$5M</div>
              </div>

              {/* Chart Area */}
              <div style={{
                marginLeft: '40px',
                height: '100px',
                position: 'relative',
                display: 'flex',
                alignItems: 'end'
              }}>
                {/* SVG Line Chart */}
                <svg 
                  width="100%" 
                  height="100" 
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'visible'
                  }}
                >
                  {/* Background Grid Lines */}
                  {[0, 25, 50, 75, 100].map((y, i) => (
                    <line
                      key={`grid-${i}`}
                      x1="0"
                      y1={y}
                      x2="100%"
                      y2={y}
                      stroke="#1e2738"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))}
                  
                  {/* Generate Path for Line */}
                  <path
                    d={(() => {
                      const collectionData = getData('collectionPerformance') || [];
                      const points = collectionData.slice(0, 8).map((forecast, index) => {
                        const amount = forecast.amount || (forecast.total_invoices * 50000);
                        const x = (index / 7) * 100; // Percentage across width
                        const y = 100 - Math.max(5, (amount / 25000000) * 95); // Inverted Y, max $25M
                        return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
                      }).join(' ');
                      return points;
                    })()}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00e0ff" />
                      <stop offset="50%" stopColor="#5fd4d6" />
                      <stop offset="100%" stopColor="#ffc145" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Data Points with AI Insights */}
                {(getData('collectionPerformance') || []).slice(0, 8).map((forecast, index) => {
                  const amount = forecast.amount || (forecast.total_invoices * 50000);
                  const confidence = forecast.confidence || Math.min(95, Math.max(60, forecast.collection_rate || 75));
                  const x = (index / 7) * 100; // Percentage across width
                  const y = 100 - Math.max(5, (amount / 25000000) * 95); // Match SVG coordinate system
                  
                  return (
                    <div
                      key={`point-${index}`}
                      onClick={() => handleDataPointClick({
                        ...forecast,
                        amount,
                        confidence,
                        period: forecast.period || `Week ${index + 1}`,
                        index,
                        forecastType: 'collection_timeline'
                      }, 'collection_forecast_point')}
                      style={{
                        position: 'absolute',
                        left: `calc(${x}% - 8px)`,
                        top: `calc(${y}% - 8px)`, // Use top instead of bottom to match SVG
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: confidence > 80 ? '#00e0ff' : 
                                       confidence > 60 ? '#5fd4d6' : '#ffc145',
                        border: '2px solid #0f1419',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 224, 255, 0.3)',
                        zIndex: 10
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.3)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 224, 255, 0.6)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 224, 255, 0.3)';
                      }}
                      title={`Click for AI Insights: ${forecast.period || `Week ${index + 1}`}: $${(amount/1000000).toFixed(1)}M (${confidence.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>

              {/* X-axis Labels */}
              <div style={{
                marginLeft: '40px',
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#8892a8',
                fontSize: '10px'
              }}>
                {(getData('collectionPerformance') || []).slice(0, 8).map((forecast, index) => (
                  <div key={`x-label-${index}`} style={{ textAlign: 'center' }}>
                    {forecast.period || `W${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Forecast Summary - Using Dynamic Data */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            fontSize: '12px'
          }}>
            {(() => {
              const collectionData = getData('collectionPerformance') || [];
              const thirtyDay = collectionData[3]?.amount || 24600000;
              const ninetyDay = collectionData[6]?.amount || 46300000; 
              const riskAdjusted = thirtyDay * 0.85; // 15% risk adjustment
              
              return (
                <>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#1e2738',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#8892a8', marginBottom: '4px' }}>30-Day Forecast</div>
                    <div style={{ color: '#00e0ff', fontWeight: '600', fontSize: '16px' }}>
                      ${(thirtyDay/1000000).toFixed(1)}M
                    </div>
                    <div style={{ color: '#5fd4d6', fontSize: '10px' }}>
                      {(collectionData[3]?.confidence || 84).toFixed(0)}% confidence
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#1e2738',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#8892a8', marginBottom: '4px' }}>90-Day Forecast</div>
                    <div style={{ color: '#ffc145', fontWeight: '600', fontSize: '16px' }}>
                      ${(ninetyDay/1000000).toFixed(1)}M
                    </div>
                    <div style={{ color: '#5fd4d6', fontSize: '10px' }}>
                      {(collectionData[6]?.confidence || 72).toFixed(0)}% confidence
                    </div>
                  </div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#1e2738',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#8892a8', marginBottom: '4px' }}>Risk-Adjusted</div>
                    <div style={{ color: '#e930ff', fontWeight: '600', fontSize: '16px' }}>
                      ${(riskAdjusted/1000000).toFixed(1)}M
                    </div>
                    <div style={{ color: '#5fd4d6', fontSize: '10px' }}>Conservative</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Cash Conversion Probability Engine */}
        <div style={{
          backgroundColor: '#232a36',
          border: '1px solid #1e2738',
          borderRadius: '12px',
          padding: '24px',
          overflow: 'hidden',
          minHeight: '440px'
        }}>
          <h3 style={{
            color: '#f7f9fb',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            💰 Cash Conversion Probability Engine
          </h3>
          
          {/* Risk Heat Map */}
          <div style={{ marginBottom: '16px' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px repeat(4, 1fr)',
              gap: '2px',
              marginBottom: '8px'
            }}>
              <div style={{ padding: '8px', fontSize: '10px', color: '#8892a8' }}>Customer</div>
              {['0-30', '31-45', '46-60', '60+'].map(bucket => (
                <div
                  key={bucket}
                  style={{
                    padding: '8px 4px',
                    backgroundColor: '#1a2332',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#8892a8',
                    fontWeight: '600',
                    borderRadius: '4px'
                  }}
                >
                  {bucket} days
                </div>
              ))}
            </div>
            
            {/* Heat Map Rows */}
            {Array.from({length: 6}, (_, rowIndex) => (
              <div key={`row-${rowIndex}`} style={{
                display: 'grid',
                gridTemplateColumns: '80px repeat(4, 1fr)',
                gap: '2px',
                marginBottom: '2px'
              }}>
                <div style={{
                  padding: '8px 4px',
                  backgroundColor: '#1a2332',
                  fontSize: '9px',
                  color: '#8892a8',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}>
                  Cust {rowIndex + 1}
                </div>
                {Array.from({length: 4}, (_, colIndex) => {
                  const cellIndex = rowIndex * 4 + colIndex;
                  const riskMetrics = getData('riskMetrics') || [];
                  const cell = riskMetrics[cellIndex] || { amount: 0, riskScore: 0 };
                  const intensity = Math.min(100, (cell.riskScore || 0));
                  const color = intensity > 75 ? '#e930ff' :
                               intensity > 50 ? '#ffc145' :
                               intensity > 25 ? '#5fd4d6' : '#00e0ff';
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleDataPointClick(cell, 'risk_heatmap')}
                      style={{
                        padding: '8px 4px',
                        backgroundColor: color,
                        textAlign: 'center',
                        fontSize: '9px',
                        color: intensity > 60 ? '#fff' : '#0a1224',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '4px',
                        opacity: 0.3 + (intensity / 100) * 0.7,
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.zIndex = '5';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                      title={`Risk Score: ${intensity.toFixed(0)}, Amount: $${((cell.amount || 0)/1000).toFixed(0)}K`}
                    >
                      ${((cell.amount || 0)/1000).toFixed(0)}K
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Priority Collection List */}
          <div>
            <h4 style={{
              color: '#f7f9fb',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Priority Collection Targets
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(getData('customerInsights') || []).slice(0, 6).map((customer, index) => (
                <div
                  key={customer.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#1e2738',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                    {customer.name}
                  </div>
                  <div style={{ color: '#8892a8' }}>
                    ${(customer.arAmount/1000).toFixed(0)}K
                  </div>
                  <button
                    style={{
                      padding: '4px 8px',
                      backgroundColor: customer.riskScore > 50 ? '#e930ff' : '#00e0ff',
                      color: customer.riskScore > 50 ? '#f7f9fb' : '#0a1224',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Contact
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Components */}
      {showAIInsights && aiInsightData && (
        <AIInsightsModal
          data={aiInsightData}
          onClose={() => setShowAIInsights(false)}
          onSendToChat={handleSendToChat}
        />
      )}

      {/* Business Intelligence Button - positioned above chatbot */}
      <button
        onClick={() => setShowBIAgent(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
          border: 'none',
          boxShadow: '0 10px 40px rgba(0, 224, 255, 0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          transition: 'all 0.3s ease',
          zIndex: 999
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 224, 255, 0.7)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 224, 255, 0.5)';
        }}
        title="Business Intelligence Q&A"
      >
        🧠
      </button>

      {/* Chatbot Button - positioned at bottom */}
      <ChatbotButton
        onClick={() => setShowChatbot(!showChatbot)}
        isOpen={showChatbot}
      />

      {/* Universal Chatbot with @mentions support */}
      {showChatbot && (
        <UniversalChatbot
          defaultAgent="finance"
          onClose={() => setShowChatbot(false)}
          dashboardContext={{
            source_dashboard: 'ar_aging_analysis',
            ar_context: {
              kpis: dashboardData?.kpis,
              aging_buckets: dashboardData?.agingBuckets,
              customers: dashboardData?.customers,
              filters: filters
            }
          }}
        />
      )}

      {/* AR Business Intelligence Panel */}
      {showBIAgent && (
        <div style={{ 
          position: 'fixed', 
          bottom: '120px', 
          right: '20px', 
          zIndex: 1000, 
          width: '400px',
          height: '500px'
        }}>
          <BIAgent onClose={() => setShowBIAgent(false)} />
        </div>
      )}
      
      </div> {/* End Main Dashboard Container */}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ARAgingView;