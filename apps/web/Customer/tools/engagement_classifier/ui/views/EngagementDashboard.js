import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchEngagementData, 
  setFilters as setReduxFilters, 
  setChatContext as setReduxChatContext,
  toggleChat as toggleReduxChat,
  setKPIs,
  setHighlights
} from '../state/engagementClassifierSlice';
import EngagementKPITiles from "../components/kpi/EngagementKPITiles";
import EngagementPyramid from "../components/visualizations/EngagementPyramid";
import EngagementTimeline from "../components/visualizations/EngagementTimeline";
import OpportunityFinder from "../components/visualizations/OpportunityFinder";
import EngagementFilters from "../components/filters/EngagementFilters";
import CustomerDetailModal from "../components/modals/CustomerDetailModal";
import CustomerSearchAnalytics from "../components/search/CustomerSearchAnalytics";
import EngagementChatbot from "../components/chat/EngagementChatbot";
import EngagementChatButton from "../components/chat/EngagementChatButton";
import CustomerBusinessAgent from "../components/CustomerBusinessAgent";

const EngagementDashboard = () => {
  const dispatch = useDispatch();
  const { customers, loading: isLoading, error, filters, kpis, highlights, chatContext, isChatOpen: isChatVisible } = useSelector((state) => state.engagementClassifier);
  
  // Local state for UI-specific items
  const [data, setData] = useState(null);
  const [selectedEngagementLevel, setSelectedEngagementLevel] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [modalCustomers, setModalCustomers] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [hasNewChatMessage, setHasNewChatMessage] = useState(false);
  const chatbotRef = useRef(null);
  
  // Debug chat state changes
  useEffect(() => {
    console.log('🎭 Chat state changed to:', isChatVisible);
  }, [isChatVisible]);
  
  // Toggle chat visibility
  const toggleChat = () => {
    dispatch(toggleReduxChat());
  };

  // Handle chat context updates
  const handleChatContextUpdate = (newContext) => {
    dispatch(setReduxChatContext({ ...chatContext, ...newContext }));
  };

  // Update chat context when dashboard state changes
  useEffect(() => {
    dispatch(setReduxChatContext({
      selectedEngagementLevel,
      selectedPeriod,
      filters,
      data: kpis ? {
        totalCustomers: kpis.totalCustomers || 0,
        avgEngagementScore: kpis.avgEngagementScore || 0,
        reengagementOpportunities: kpis.reengagement_opportunities || 0,
        daysSinceActivity: kpis.avg_days_since_activity || 0
      } : null,
      timestamp: new Date().toISOString()
    }));
  }, [selectedEngagementLevel, selectedPeriod, filters, kpis, dispatch]);

  // Global function to send context to chatbot (legacy support)
  const sendContextToChat = (contextPoints) => {
    console.log('🎯 sendContextToChat called with:', contextPoints);
    
    // Format context points into a readable message
    const contextMessage = "📊 **Dashboard Context:**\n\n" + contextPoints.join('\n');
    console.log('💬 Formatted message:', contextMessage);
    
    // Open chat and add context
    dispatch(toggleReduxChat(true));
    setHasNewChatMessage(true);
    
    // Add context to chat context
    dispatch(setReduxChatContext({
      ...chatContext,
      contextMessage,
      timestamp: new Date().toISOString()
    }));
  };
  
  // Make sendContextToChat globally available
  useEffect(() => {
    console.log('🌐 Setting up global sendContextToChat function');
    window.sendContextToChat = sendContextToChat;
    return () => {
      console.log('🧹 Cleaning up global sendContextToChat function');
      delete window.sendContextToChat;
    };
  }, [sendContextToChat]);

  useEffect(() => {
    dispatch(fetchEngagementData(filters));
  }, [filters, dispatch]);

  // Update local data state when Redux state changes
  useEffect(() => {
    if (customers && kpis) {
      setData({
        customers,
        kpis,
        highlights,
        data: highlights
      });
    }
  }, [customers, kpis, highlights]);

  const fetchData = async () => {
    dispatch(fetchEngagementData(filters));
  };

  const handleFiltersChange = (newFilters) => {
    dispatch(setReduxFilters(newFilters));
  };

  const oldFetchData = async () => {
    // Keep old fetch for backward compatibility if needed
    try {
      const response = await fetch("/api/engagement-classifier/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.error(`API Error ${response.status}:`, errText);
        throw new Error(`Failed to fetch engagement data (${response.status}) ${errText?.slice(0, 200)}`);
      }

      let result;
      try {
        // Get the response as text first, then parse as JSON
        const responseText = await response.text();
        
        if (!responseText.trim()) {
          console.warn('Empty response received, using fallback data');
          result = { data: null };
        } else {
          result = JSON.parse(responseText);
        }
      } catch (jsonError) {
        console.warn('JSON Parse Error (using fallback):', jsonError.message);
        // Use fallback data structure to prevent crashes
        result = {
          data: {
            customers: [],
            kpis: {
              total_customers: 0,
              avg_engagement_score: 0,
              avg_days_since_activity: 0,
              reengagement_opportunities: 0
            },
            distribution: [],
            timeline: { periods: [], high: [], medium: [], low: [] }
          }
        };
      }

      setData(result.data);
      console.log('Dashboard data loaded:', result.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      // Error is handled by Redux now
    } finally {
      // Loading state is handled by Redux now
    }
  };

  const handleEngagementLevelClick = (level) => {
    setSelectedEngagementLevel(level === selectedEngagementLevel ? null : level);
    // Update filters to show only selected engagement level
    const newFilters = { ...filters };
    if (level === selectedEngagementLevel) {
      delete newFilters.engagementLevels;
    } else {
      newFilters.engagementLevels = [level];
    }
    dispatch(setReduxFilters(newFilters));
    
    // Open customer detail modal for this engagement level
    if (data?.customers) {
      const levelCustomers = data.customers.filter(customer => customer.engagement_level === level);
      setModalCustomers(levelCustomers);
      setModalTitle(`${level} Engagement Customers`);
      setIsCustomerModalOpen(true);
    }
  };

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period === selectedPeriod ? null : period);
  };

  const handleKPITileClick = (metric) => {
    console.log('KPI tile clicked:', metric);
    
    // Open customer modal based on KPI metric clicked
    if (data?.customers) {
      let customers = [];
      let title = "";
      
      switch (metric) {
        case 'total_customers':
          customers = data.customers;
          title = "All Customers";
          break;
        case 'avg_engagement_score':
          customers = data.customers.filter(c => c["RFM Score"] >= 7);
          title = "High RFM Score Customers";
          break;
        case 'reengagement_opportunities':
          customers = data.customers.filter(c => 
            c.engagement_level === 'Low' && c["LTD Sales Amount"] > 1000
          );
          title = "Re-engagement Opportunities";
          break;
        default:
          customers = data.customers;
          title = "Customer Details";
      }
      
      setModalCustomers(customers);
      setModalTitle(title);
      setIsCustomerModalOpen(true);
    }
  };

  const handleOpportunitySelect = (opportunity) => {
    console.log('Opportunity selected:', opportunity);
    // Could implement campaign creation workflow
  };

  const handleThresholdChange = (type, value) => {
    console.log('Threshold changed:', type, value);
    // Could update opportunity filtering in real-time
  };

  if (error) {
    return (
      <div style={{ 
        color: "#e930ff", 
        padding: "20px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "18px"
      }}>
        Error loading engagement data: {error}
      </div>
    );
  }

  return (
    <div className="engagement-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Customer Engagement Intelligence
        </h1>
        <p className="dashboard-subtitle">
          Analyze customer engagement patterns, identify opportunities, and optimize re-engagement strategies
        </p>
      </div>

      {/* Advanced Filters */}
      <div className="glass-panel" style={{ 
        marginBottom: "var(--spacing-2xl)"
      }}>
        <h2 className="section-header">Filters & Controls</h2>
        <EngagementFilters 
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
      </div>

      {/* KPI Section */}
      <EngagementKPITiles 
        kpis={data?.kpis} 
        isLoading={isLoading}
        onTileClick={handleKPITileClick}
      />

      {/* Main Visualizations Grid */}
      <div className="chart-grid">
        {/* Engagement Pyramid */}
        <EngagementPyramid
          distribution={data?.distribution}
          isLoading={isLoading}
          onLevelClick={handleEngagementLevelClick}
          selectedLevel={selectedEngagementLevel}
        />

        {/* Engagement Timeline */}
        <EngagementTimeline
          timeline={data?.timeline}
          isLoading={isLoading}
          onPeriodClick={handlePeriodClick}
          selectedPeriod={selectedPeriod}
        />
      </div>

      {/* Customer Search & Analytics Section */}
      <div className="glass-panel" style={{ 
        marginBottom: "var(--spacing-2xl)"
      }}>
        <h2 className="section-header">Customer Analytics</h2>
        <CustomerSearchAnalytics
          onCustomerSelect={(customer) => {
            console.log('Customer selected for analysis:', customer);
            // Open chat with customer context
            dispatch(setReduxChatContext({
              currentView: 'customer_detail',
              customer: customer
            }));
            dispatch(toggleReduxChat(true));
          }}
        />
      </div>

      {/* Opportunity Finder Section */}
      <div className="glass-panel" style={{ 
        marginBottom: "var(--spacing-2xl)"
      }}>
        <h2 className="section-header">Re-engagement Opportunities</h2>
        <OpportunityFinder
          opportunities={data?.opportunities}
          isLoading={isLoading}
          onOpportunitySelect={handleOpportunitySelect}
          onThresholdChange={handleThresholdChange}
        />
      </div>

      {/* Additional Information Panel */}
      {(selectedEngagementLevel || data?.summary) && (
        <div
          style={{
            padding: "24px",
            backgroundColor: "#232a36",
            borderRadius: "12px",
            border: "1px solid #3a4459",
            marginTop: "24px"
          }}
        >
          <h3 style={{
            color: "#00e0ff",
            marginBottom: "16px",
            fontSize: "20px",
            fontWeight: "600"
          }}>
            {selectedEngagementLevel ? `${selectedEngagementLevel} Engagement Analysis` : 'Engagement Summary'}
          </h3>

          {selectedEngagementLevel ? (
            // Show selected engagement level details
            <div>
              {data?.distribution
                ?.filter(item => item.engagement_level === selectedEngagementLevel)
                ?.map(levelData => (
                  <div key={levelData.engagement_level}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "24px",
                      marginBottom: "16px"
                    }}>
                      <div>
                        <div style={{ fontSize: "14px", color: "#5891cb", marginBottom: "4px" }}>
                          Customer Count
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "600", color: "#f7f9fb" }}>
                          {levelData.customer_count.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "12px", color: "#5891cb" }}>
                          {levelData.percentage}% of total
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", color: "#5891cb", marginBottom: "4px" }}>
                          Avg Purchase Value
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "600", color: "#f7f9fb" }}>
                          ${Math.round(levelData.avg_purchase_value || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", color: "#5891cb", marginBottom: "4px" }}>
                          Avg Transactions
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "600", color: "#f7f9fb" }}>
                          {Math.round(levelData.avg_transactions || 0)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", color: "#5891cb", marginBottom: "4px" }}>
                          Avg Days Since Activity
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: "600", color: "#f7f9fb" }}>
                          {Math.round(levelData.avg_days_since_activity || 0)}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: "16px",
                      backgroundColor: "#1a1f2e",
                      borderRadius: "8px",
                      border: "1px solid #3a4459"
                    }}>
                      <h4 style={{ color: "#00e0ff", marginBottom: "8px" }}>
                        Recommendations for {selectedEngagementLevel} Engagement Customers
                      </h4>
                      <ul style={{ color: "#f7f9fb", margin: 0, paddingLeft: "20px" }}>
                        {selectedEngagementLevel === 'High' && (
                          <>
                            <li>Maintain engagement with loyalty rewards and exclusive offers</li>
                            <li>Leverage as brand advocates for referral programs</li>
                            <li>Provide premium customer support and early access to new products</li>
                          </>
                        )}
                        {selectedEngagementLevel === 'Medium' && (
                          <>
                            <li>Implement targeted nurturing campaigns to increase engagement</li>
                            <li>Provide personalized product recommendations</li>
                            <li>Use engagement surveys to understand barriers</li>
                          </>
                        )}
                        {selectedEngagementLevel === 'Low' && (
                          <>
                            <li>Launch re-engagement campaigns with special incentives</li>
                            <li>Analyze customer journey to identify drop-off points</li>
                            <li>Consider win-back offers for high-value dormant customers</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            // Show overall summary
            data?.summary && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "24px"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: "600", color: "#00e0ff" }}>
                    {data.summary.high_engagement.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "14px", color: "#f7f9fb", marginTop: "4px" }}>
                    High Engagement Customers
                  </div>
                  <div style={{ fontSize: "12px", color: "#5891cb", marginTop: "2px" }}>
                    ≤30 days since last activity
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: "600", color: "#5fd4d6" }}>
                    {data.summary.medium_engagement.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "14px", color: "#f7f9fb", marginTop: "4px" }}>
                    Medium Engagement Customers
                  </div>
                  <div style={{ fontSize: "12px", color: "#5891cb", marginTop: "2px" }}>
                    31-90 days since last activity
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: "600", color: "#e930ff" }}>
                    {data.summary.low_engagement.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "14px", color: "#f7f9fb", marginTop: "4px" }}>
                    Low Engagement Customers
                  </div>
                  <div style={{ fontSize: "12px", color: "#5891cb", marginTop: "2px" }}>
                    {'>'}90 days since last activity
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: "var(--spacing-2xl)",
        padding: "var(--spacing-lg)",
        textAlign: "center",
        color: "var(--cloud-white)",
        opacity: 0.7,
        fontSize: "12px",
        borderTop: "1px solid var(--graphite-light)"
      }}>
        Last updated: {data ? new Date().toLocaleString() : '--'}
        {filters && Object.keys(filters).length > 0 && (
          <span style={{ marginLeft: "var(--spacing-md)" }}>
            • Active filters: {Object.keys(filters).join(', ')}
          </span>
        )}
      </div>

      {/* Chatbot Components */}
      <EngagementChatButton 
        onClick={toggleChat}
        isActive={isChatVisible}
        hasNewMessage={hasNewChatMessage}
        messageCount={0}
      />
      
      <EngagementChatbot
        isVisible={isChatVisible}
        onToggle={toggleChat}
        dashboardContext={chatContext}
        onContextUpdate={handleChatContextUpdate}
      />
      
      {/* Customer Business Agent */}
      <CustomerBusinessAgent />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={modalCustomers}
        engagementLevel={selectedEngagementLevel}
        title={modalTitle}
      />
    </div>
  );
};

export default EngagementDashboard; 