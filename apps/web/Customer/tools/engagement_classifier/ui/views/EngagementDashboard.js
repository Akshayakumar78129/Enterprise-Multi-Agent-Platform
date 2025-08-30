import React, { useState, useEffect } from "react";
import EngagementKPITiles from "../components/kpi/EngagementKPITiles";
import EngagementPyramid from "../components/visualizations/EngagementPyramid";
import EngagementTimeline from "../components/visualizations/EngagementTimeline";
import OpportunityFinder from "../components/visualizations/OpportunityFinder";

const EngagementDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [selectedEngagementLevel, setSelectedEngagementLevel] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/engagement-classifier/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch engagement data");

      const result = await response.json();
      setData(result.data);
      console.log('Dashboard data loaded:', result.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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
    setFilters(newFilters);
  };

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period === selectedPeriod ? null : period);
  };

  const handleKPITileClick = (metric) => {
    console.log('KPI tile clicked:', metric);
    // Could implement specific actions for each KPI metric
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
    <div
      style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
        fontFamily: "Inter, sans-serif"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          marginBottom: "8px", 
          color: "#00e0ff",
          fontSize: "32px",
          fontWeight: "700"
        }}>
          Customer Engagement Intelligence
        </h1>
        <p style={{
          color: "#5891cb",
          fontSize: "16px",
          margin: 0,
          opacity: 0.9
        }}>
          Analyze customer engagement patterns, identify opportunities, and optimize re-engagement strategies
        </p>
      </div>

      {/* KPI Section */}
      <EngagementKPITiles 
        kpis={data?.kpis} 
        isLoading={isLoading}
        onTileClick={handleKPITileClick}
      />

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "600px 1fr",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
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

      {/* Opportunity Finder Section */}
      <div style={{ marginBottom: "24px" }}>
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
        marginTop: "32px",
        padding: "16px",
        textAlign: "center",
        color: "#5891cb",
        fontSize: "12px",
        borderTop: "1px solid #3a4459"
      }}>
        Last updated: {data ? new Date().toLocaleString() : '--'}
        {filters && Object.keys(filters).length > 0 && (
          <span style={{ marginLeft: "16px" }}>
            • Active filters: {Object.keys(filters).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default EngagementDashboard; 