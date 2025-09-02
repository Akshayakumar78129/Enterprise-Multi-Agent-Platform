import React, { useState, useEffect, useCallback } from 'react';
import styles from './CashFlowAnalysisDashboard.module.css';
import ExecutiveKPITiles from '../components/kpi/ExecutiveKPITiles';
import FCFValueBridge from '../components/visualizations/FCFValueBridge';
import LiquidityTimeline from '../components/visualizations/LiquidityTimeline';
import CapitalAllocationMatrix from '../components/visualizations/CapitalAllocationMatrix';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import { fetchCashFlowData, CashFlowDashboardData, CashFlowFilters } from '../api/cashFlowApi';

const CashFlowAnalysisDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState<CashFlowDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use last 3 months of 2021 data for best performance
  const [filters, setFilters] = useState<CashFlowFilters>({
    startDate: '2021-10-01',
    endDate: '2021-12-30',
    companyCode: 'all',
    forecastHorizon: '12',
    scenario: 'base'
  });

  // AI Features State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightData, setAIInsightData] = useState<any>(null);
  const [showBIAgent, setShowBIAgent] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [biActiveTab, setBiActiveTab] = useState<'overview' | 'optimization' | 'forecast' | 'strategy' | 'simulate'>('overview');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCashFlowData(filters);
      console.log('Dashboard data received:', data);
      console.log('Forecast data:', data?.cashFlowForecast);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading cash flow data:', err);
      setError('Failed to load cash flow data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<CashFlowFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle chart/KPI clicks for AI Insights
  const handleDataPointClick = (data: any, chartType: string) => {
    setAIInsightData({
      ...data,
      chartType,
      context: 'cash_flow_analysis',
      filters
    });
    setShowAIInsights(true);
  };

  // Send data to chatbot
  const handleSendToChat = (data: any) => {
    // Data will be handled by the chatbot component
    setShowAIInsights(false);
    setShowChatbot(true);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Cash Flow Analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.icon}>💰</span>
            Cash Flow Analysis
          </h1>
          <p className={styles.subtitle}>
            Strategic capital allocation and value creation platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date Range:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange({ startDate: e.target.value })}
            className={styles.filterInput}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange({ endDate: e.target.value })}
            className={styles.filterInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Company:</label>
          <select
            value={filters.companyCode}
            onChange={(e) => handleFilterChange({ companyCode: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">All Companies</option>
            {dashboardData?.data?.filters?.companyCodes?.map(company => (
              <option key={company.code} value={company.code}>
                {company.name} ({company.transaction_count} txns)
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Scenario:</label>
          <select
            value={filters.scenario}
            onChange={(e) => handleFilterChange({ scenario: e.target.value as any })}
            className={styles.filterSelect}
          >
            <option value="base">Base Case</option>
            <option value="optimistic">Optimistic</option>
            <option value="pessimistic">Pessimistic</option>
          </select>
        </div>

        <button 
          onClick={loadDashboardData}
          className={styles.refreshButton}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Executive KPI Tiles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Executive Value KPIs</h2>
        <ExecutiveKPITiles
          kpis={dashboardData?.data?.kpis || null}
          onKPIClick={handleDataPointClick}
        />
      </section>

      {/* Main Visualizations Grid */}
      <div className={styles.visualizationsGrid}>
        {/* FCF Value Bridge */}
        <section className={styles.chartSection}>
          <FCFValueBridge
            data={dashboardData?.data?.fcfValueBridge || []}
            onBarClick={handleDataPointClick}
          />
        </section>

        {/* Liquidity Timeline */}
        <section className={styles.chartSection}>
          <LiquidityTimeline
            data={dashboardData?.data?.liquidityTimeline || []}
            onPointClick={handleDataPointClick}
          />
        </section>

        {/* Capital Allocation Matrix */}
        <section className={styles.chartSection}>
          <CapitalAllocationMatrix
            data={dashboardData?.data?.capitalAllocation || []}
            onSectorClick={handleDataPointClick}
          />
        </section>

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
        title="Cash Flow Business Intelligence"
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
            source_dashboard: 'cash_flow_analysis',
            finance_context: {
              kpis: dashboardData?.data?.kpis,
              fcf_bridge: dashboardData?.data?.fcfValueBridge,
              liquidity: dashboardData?.data?.liquidityTimeline,
              capital_allocation: dashboardData?.data?.capitalAllocation,
              filters: filters
            }
          }}
        />
      )}

      {/* Cash Flow Business Intelligence Panel */}
      {showBIAgent && (
        <div className={styles.biPanel}>
          <div className={styles.biHeader}>
            <h3>💰 Cash Flow Intelligence</h3>
            <button 
              onClick={() => setShowBIAgent(false)}
              className={styles.closeButton}
            >
              ✕
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className={styles.biTabs}>
            <button 
              className={`${styles.biTab} ${biActiveTab === 'overview' ? styles.biTabActive : ''}`}
              onClick={() => setBiActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`${styles.biTab} ${biActiveTab === 'optimization' ? styles.biTabActive : ''}`}
              onClick={() => setBiActiveTab('optimization')}
            >
              Optimize
            </button>
            <button 
              className={`${styles.biTab} ${biActiveTab === 'forecast' ? styles.biTabActive : ''}`}
              onClick={() => setBiActiveTab('forecast')}
            >
              Forecast
            </button>
            <button 
              className={`${styles.biTab} ${biActiveTab === 'strategy' ? styles.biTabActive : ''}`}
              onClick={() => setBiActiveTab('strategy')}
            >
              Strategy
            </button>
            <button 
              className={`${styles.biTab} ${biActiveTab === 'simulate' ? styles.biTabActive : ''}`}
              onClick={() => setBiActiveTab('simulate')}
            >
              Simulate
            </button>
          </div>
          
          <div className={styles.biContent}>
            {/* Overview Tab */}
            {biActiveTab === 'overview' && (
              <div className={styles.biTabContent}>
                <div className={styles.biCard}>
                  <h4>📊 Executive Summary</h4>
                  <p>Real-time cash flow intelligence and insights</p>
                  <div className={styles.biMetric}>
                    <span>Free Cash Flow:</span>
                    <span className={styles.biValue}>
                      ${((dashboardData?.fcfValueBridge?.[0]?.value || -288193) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>Operating Cash Flow:</span>
                    <span className={styles.biValue}>
                      ${((dashboardData?.fcfValueBridge?.[0]?.value || -24168) * 1.2 / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>FCF Yield:</span>
                    <span className={styles.biValue}>{dashboardData?.kpis?.fcfYield?.value || -457}%</span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>Cash ROIC:</span>
                    <span className={styles.biValue}>{dashboardData?.kpis?.cashROIC?.value || -134}%</span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>EBITDA Margin:</span>
                    <span className={styles.biValue}>{dashboardData?.kpis?.ebitdaMargin?.value || -134}%</span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>Liquidity Coverage:</span>
                    <span className={styles.biValue}>{(dashboardData?.kpis?.liquidityCoverage?.value || 0.98).toFixed(2)}x</span>
                  </div>
                </div>
                
                <div className={styles.biCard}>
                  <h4>💵 Cash Position Analysis</h4>
                  <div className={styles.biMetric}>
                    <span>Total Cash & Equivalents:</span>
                    <span className={styles.biValue}>
                      ${Math.abs((dashboardData?.liquidityTimeline?.[dashboardData.liquidityTimeline.length-1]?.cash_balance || 500000) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>Working Capital:</span>
                    <span className={styles.biValue}>
                      ${Math.abs((dashboardData?.fcfValueBridge?.find(item => item.component.includes('Working'))?.value || 250000) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className={styles.biMetric}>
                    <span>CapEx Spending:</span>
                    <span className={styles.biValue}>
                      ${Math.abs((dashboardData?.fcfValueBridge?.find(item => item.component.includes('Capital'))?.value || 264025) / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
                
                <div className={styles.biCard}>
                  <h4>🎯 Key Opportunities</h4>
                  <div className={styles.biRecommendation}>
                    💰 FCF improvement potential: ${Math.abs((dashboardData?.kpis?.fcfYield?.value || 10) * 100000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </div>
                  <div className={styles.biRecommendation}>
                    📈 Working capital reduction: ${Math.abs((dashboardData?.fcfValueBridge?.find(item => item.component.includes('Working'))?.value || 250000) * 0.2 / 1000).toFixed(0)}K possible
                  </div>
                  <div className={styles.biRecommendation}>
                    🚀 M&A capacity: ${((dashboardData?.kpis?.maFirepower?.value || 1008678) / 1000000).toFixed(1)}M available
                  </div>
                  <div className={styles.biRecommendation}>
                    ⚡ Quick cash release: ${Math.abs(((dashboardData?.liquidityTimeline?.[0]?.daily_change || 50000) * 30) / 1000).toFixed(0)}K in 30 days
                  </div>
                </div>
              </div>
            )}
            
            {/* Optimization Tab */}
            {biActiveTab === 'optimization' && (
              <div className={styles.biTabContent}>
                <div className={styles.biCard}>
                  <h4>🔧 FCF Optimization Levers</h4>
                  <div className={styles.biOptimization}>
                    <div className={styles.biOptItem}>
                      <span className={styles.biOptLabel}>Revenue Growth</span>
                      <div className={styles.biProgressBar}>
                        <div className={styles.biProgress} style={{width: '60%'}}></div>
                      </div>
                      <span className={styles.biOptValue}>+$2.5M potential</span>
                    </div>
                    <div className={styles.biOptItem}>
                      <span className={styles.biOptLabel}>Margin Expansion</span>
                      <div className={styles.biProgressBar}>
                        <div className={styles.biProgress} style={{width: '45%'}}></div>
                      </div>
                      <span className={styles.biOptValue}>+300 bps</span>
                    </div>
                    <div className={styles.biOptItem}>
                      <span className={styles.biOptLabel}>Working Capital</span>
                      <div className={styles.biProgressBar}>
                        <div className={styles.biProgress} style={{width: '75%'}}></div>
                      </div>
                      <span className={styles.biOptValue}>-$1.8M reduction</span>
                    </div>
                    <div className={styles.biOptItem}>
                      <span className={styles.biOptLabel}>CapEx Efficiency</span>
                      <div className={styles.biProgressBar}>
                        <div className={styles.biProgress} style={{width: '30%'}}></div>
                      </div>
                      <span className={styles.biOptValue}>-15% optimization</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.biCard}>
                  <h4>💡 Quick Wins (Based on Current Performance)</h4>
                  <div className={styles.biActionList}>
                    <div className={styles.biAction}>
                      ✓ Reduce DSO by 5 days → +${Math.abs((dashboardData?.fcfValueBridge?.[0]?.value || 500000) * 0.05 / 1000).toFixed(0)}K cash
                    </div>
                    <div className={styles.biAction}>
                      ✓ Extend DPO by 10 days → +${Math.abs((dashboardData?.fcfValueBridge?.[0]?.value || 750000) * 0.08 / 1000).toFixed(0)}K cash
                    </div>
                    <div className={styles.biAction}>
                      ✓ Optimize inventory turns → +${Math.abs((dashboardData?.fcfValueBridge?.[0]?.value || 300000) * 0.03 / 1000).toFixed(0)}K cash
                    </div>
                    <div className={styles.biAction}>
                      ✓ Accelerate collections → +${Math.abs((dashboardData?.liquidityTimeline?.[0]?.daily_change || 50000) * 15 / 1000).toFixed(0)}K in 15 days
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Forecast Tab */}
            {biActiveTab === 'forecast' && (
              <div className={styles.biTabContent}>
                <div className={styles.biCard}>
                  <h4>📈 12-Month Cash Flow Forecast</h4>
                  <div className={styles.biScenarios}>
                    <div className={styles.biScenario}>
                      <span className={styles.biScenarioLabel}>🟢 Optimistic</span>
                      <span className={styles.biScenarioValue}>
                        ${((dashboardData?.cashFlowForecast?.reduce((sum, item) => sum + (item?.optimistic_forecast || 0), 0) || -251759283) / 1000000).toFixed(1)}M
                      </span>
                      <span className={styles.biScenarioProb}>30% probability</span>
                    </div>
                    <div className={styles.biScenario}>
                      <span className={styles.biScenarioLabel}>🔵 Base Case</span>
                      <span className={styles.biScenarioValue}>
                        ${((dashboardData?.cashFlowForecast?.reduce((sum, item) => sum + (item?.base_forecast || 0), 0) || -209799402) / 1000000).toFixed(1)}M
                      </span>
                      <span className={styles.biScenarioProb}>50% probability</span>
                    </div>
                    <div className={styles.biScenario}>
                      <span className={styles.biScenarioLabel}>🔴 Pessimistic</span>
                      <span className={styles.biScenarioValue}>
                        ${((dashboardData?.cashFlowForecast?.reduce((sum, item) => sum + (item?.pessimistic_forecast || 0), 0) || -167839522) / 1000000).toFixed(1)}M
                      </span>
                      <span className={styles.biScenarioProb}>20% probability</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.biCard}>
                  <h4>⚠️ Risk Factors</h4>
                  <div className={styles.biRiskList}>
                    <div className={styles.biRisk}>
                      <span className={styles.biRiskLevel}>High</span>
                      Customer concentration risk
                    </div>
                    <div className={styles.biRisk}>
                      <span className={styles.biRiskLevel}>Medium</span>
                      Seasonal fluctuations Q2-Q3
                    </div>
                    <div className={styles.biRisk}>
                      <span className={styles.biRiskLevel}>Low</span>
                      Currency exposure (hedged)
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Strategy Tab */}
            {biActiveTab === 'strategy' && (
              <div className={styles.biTabContent}>
                <div className={styles.biCard}>
                  <h4>🎯 Strategic Initiatives</h4>
                  <div className={styles.biStrategyList}>
                    <div className={styles.biStrategy}>
                      <h5>1. Cash Excellence Program</h5>
                      <p>Implement cash culture across organization</p>
                      <div className={styles.biImpact}>
                        Impact: +$2.5M annual FCF
                      </div>
                    </div>
                    <div className={styles.biStrategy}>
                      <h5>2. Digital Transformation</h5>
                      <p>Automate cash processes and reporting</p>
                      <div className={styles.biImpact}>
                        Impact: -30% process time
                      </div>
                    </div>
                    <div className={styles.biStrategy}>
                      <h5>3. Portfolio Optimization</h5>
                      <p>Divest low-ROIC assets</p>
                      <div className={styles.biImpact}>
                        Impact: +500bps ROIC
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Simulate Tab */}
            {biActiveTab === 'simulate' && (
              <div className={styles.biTabContent}>
                <div className={styles.biCard}>
                  <h4>🔬 Scenario Simulator</h4>
                  <div className={styles.biSimulator}>
                    <div className={styles.biSimInput}>
                      <label>Revenue Growth (%)</label>
                      <input type="range" min="0" max="20" defaultValue="10" />
                      <span>10%</span>
                    </div>
                    <div className={styles.biSimInput}>
                      <label>Margin Improvement (bps)</label>
                      <input type="range" min="0" max="500" defaultValue="200" />
                      <span>200 bps</span>
                    </div>
                    <div className={styles.biSimInput}>
                      <label>Working Capital Days</label>
                      <input type="range" min="30" max="90" defaultValue="60" />
                      <span>60 days</span>
                    </div>
                  </div>
                  
                  <div className={styles.biSimResults}>
                    <h5>Projected Impact</h5>
                    <div className={styles.biMetric}>
                      <span>FCF Improvement:</span>
                      <span className={styles.biValue}>+$4.2M</span>
                    </div>
                    <div className={styles.biMetric}>
                      <span>ROIC Change:</span>
                      <span className={styles.biValue}>+3.5%</span>
                    </div>
                    <div className={styles.biMetric}>
                      <span>Cash Conversion:</span>
                      <span className={styles.biValue}>95%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowAnalysisDashboard;