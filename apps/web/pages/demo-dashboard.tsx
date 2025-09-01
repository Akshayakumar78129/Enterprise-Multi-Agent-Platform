import React, { useState, useRef } from 'react';
import { ThemeProvider, DashboardLayout, KPICard } from '../ui-common/theme';
import ChartCard from '../ui-common/theme/ChartCard';
import { UniversalChatbot, ChatbotButton } from '../ui-common/chatbot';
import { BusinessIntelligenceButton, BusinessIntelligencePanel } from '../ui-common/chatbot/BusinessIntelligence';
import AIInsightsPopup from '../ui-common/insights/AIInsightsPopup';
import { UniversalDashboardFilters, salesFilters, churnFilters, financeFilters, inventoryFilters } from '../ui-common/filters';

export default function DemoDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIOpen, setIsBIOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState('sales');
  const [showInsights, setShowInsights] = useState(null);
  const [selectedChartPoints, setSelectedChartPoints] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const chatRef = useRef(null);

  const dashboards = {
    sales: {
      title: 'Sales Intelligence Dashboard',
      icon: '💼',
      filters: salesFilters,
      kpis: [
        { value: '$2.5M', label: 'Total Revenue', icon: '💰', trend: { direction: 'up', value: '+12%', isPositive: true }, color: 'success' },
        { value: '1,234', label: 'New Customers', icon: '👥', trend: { direction: 'up', value: '+8%', isPositive: true }, color: 'info' },
        { value: '85%', label: 'Quota Attainment', icon: '🎯', trend: { direction: 'down', value: '-3%', isPositive: false }, color: 'warning' },
        { value: '$45K', label: 'Average Deal Size', icon: '📊', trend: { direction: 'neutral', value: '0%' }, color: 'default' }
      ]
    },
    customer: {
      title: 'Customer Intelligence Dashboard',
      icon: '👥',
      filters: churnFilters,
      kpis: [
        { value: '22%', label: 'Churn Risk', icon: '⚠️', trend: { direction: 'up', value: '+5%', isPositive: false }, color: 'error' },
        { value: '4.8', label: 'Customer Satisfaction', icon: '⭐', trend: { direction: 'up', value: '+0.3', isPositive: true }, color: 'success' },
        { value: '156', label: 'At-Risk Customers', icon: '🚨', trend: { direction: 'down', value: '-12', isPositive: true }, color: 'warning' },
        { value: '$12K', label: 'CLV Average', icon: '💎', trend: { direction: 'up', value: '+15%', isPositive: true }, color: 'info' }
      ]
    },
    finance: {
      title: 'Financial Intelligence Dashboard',
      icon: '💰',
      filters: financeFilters,
      kpis: [
        { value: '$8.2M', label: 'Annual Revenue', icon: '📈', trend: { direction: 'up', value: '+18%', isPositive: true }, color: 'success' },
        { value: '32%', label: 'Profit Margin', icon: '💹', trend: { direction: 'up', value: '+2%', isPositive: true }, color: 'success' },
        { value: '$1.2M', label: 'Operating Costs', icon: '💸', trend: { direction: 'down', value: '-5%', isPositive: true }, color: 'info' },
        { value: '45', label: 'Days Sales Outstanding', icon: '📅', trend: { direction: 'down', value: '-3', isPositive: true }, color: 'default' }
      ]
    },
    inventory: {
      title: 'Inventory Intelligence Dashboard',
      icon: '📦',
      filters: inventoryFilters,
      kpis: [
        { value: '8,542', label: 'Total SKUs', icon: '📋', trend: { direction: 'up', value: '+124', isPositive: true }, color: 'info' },
        { value: '92%', label: 'Stock Availability', icon: '✅', trend: { direction: 'neutral', value: '0%' }, color: 'success' },
        { value: '23', label: 'Low Stock Items', icon: '⚠️', trend: { direction: 'up', value: '+5', isPositive: false }, color: 'warning' },
        { value: '$450K', label: 'Inventory Value', icon: '💵', trend: { direction: 'up', value: '+8%', isPositive: true }, color: 'default' }
      ]
    }
  };

  const currentDashboard = dashboards[selectedDashboard as keyof typeof dashboards];

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
    console.log('Applied filters:', filters);
    // Here you would apply filters to your data fetching or filtering logic
    // For demo purposes, we'll show a notification
    if (Object.keys(filters).some(key => filters[key])) {
      console.log(`Filters applied for ${selectedDashboard} dashboard:`, filters);
    }
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    console.log('All filters reset');
  };

  const handleKPIClick = (kpi) => {
    setShowInsights({
      title: kpi.label,
      type: 'kpi',
      value: kpi.value,
      metric: kpi.label,
      insights: [
        `Current ${kpi.label}: ${kpi.value}`,
        `Trend: ${kpi.trend.direction} by ${kpi.trend.value}`,
        `This metric is ${kpi.trend.isPositive ? 'performing well' : 'needs attention'}`,
        'AI recommends focusing on improvement strategies'
      ],
      recommendations: [
        'Monitor daily for changes',
        'Set up alerts for significant variations',
        'Compare with industry benchmarks'
      ],
      trend: kpi.trend
    });
  };

  const handleChartClick = (point) => {
    setShowInsights({
      title: 'Chart Analysis',
      type: 'chart',
      value: `${point.y.toFixed(2)}`,
      metric: 'Data Point',
      insights: [
        'This data point shows significant variation',
        'Pattern detected: seasonal trend',
        'Correlation with other metrics detected',
        'Recommended action: Deep dive analysis'
      ],
      breakdown: [
        'Time period: Current quarter',
        'Comparison: Above average',
        'Impact: High significance'
      ]
    });
  };

  const handleShiftClick = (points) => {
    setSelectedChartPoints(points);
    // Send to chatbot
    if (chatRef.current) {
      // This would trigger sending context to chatbot
      console.log('Sending points to chatbot:', points);
    }
  };

  const handleSendToChat = (context) => {
    console.log('Sending to chat:', context);
    // This would send the context to the chatbot
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
  };

  const containerStyles = {
    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    dashboardSelector: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      padding: '1rem',
      background: 'rgba(30, 39, 56, 0.5)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    selectorButton: {
      padding: '0.75rem 1.5rem',
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      color: '#f7f9fb',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    selectorButtonActive: {
      background: '#00e0ff',
      color: '#0a1224',
      border: '1px solid #00e0ff'
    },
    contentSection: {
      background: 'rgba(30, 39, 56, 0.3)',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#00e0ff'
    },
    description: {
      color: 'rgba(247, 249, 251, 0.7)',
      lineHeight: '1.6'
    }
  };

  return (
    <ThemeProvider>
      <DashboardLayout
        title={currentDashboard.title}
        subtitle="AI-powered insights and analytics"
        icon={currentDashboard.icon}
      >
        <div style={containerStyles.dashboardSelector}>
          {Object.entries(dashboards).map(([key, dashboard]) => (
            <button
              key={key}
              style={{
                ...containerStyles.selectorButton,
                ...(selectedDashboard === key ? containerStyles.selectorButtonActive : {})
              }}
              onClick={() => setSelectedDashboard(key)}
            >
              <span>{dashboard.icon}</span>
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </button>
          ))}
        </div>

        {currentDashboard.filters && (
          <UniversalDashboardFilters
            filters={currentDashboard.filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            title={`${selectedDashboard.charAt(0).toUpperCase() + selectedDashboard.slice(1)} Dashboard Filters`}
            compact={false}
          />
        )}

        <div style={containerStyles.kpiGrid}>
          {currentDashboard.kpis.map((kpi, index) => (
            <KPICard
              key={index}
              value={kpi.value}
              label={kpi.label}
              icon={kpi.icon}
              trend={kpi.trend as any}
              color={kpi.color as any}
              onClick={() => handleKPIClick(kpi)}
            />
          ))}
        </div>

        <ChartCard
          title="Performance Trends"
          subtitle="Click for insights, Shift+Click to select points"
          icon="📈"
          onChartClick={handleChartClick}
          onShiftClick={handleShiftClick}
          onRequestInsights={() => handleChartClick({ x: Date.now(), y: Math.random() * 100 })}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(247, 249, 251, 0.5)',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {/* Placeholder for actual chart */}
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div>Chart visualization would go here</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Try clicking or shift+clicking on this area
              </div>
            </div>
          </div>
        </ChartCard>

        <div style={containerStyles.contentSection}>
          <h2 style={containerStyles.sectionTitle}>Multi-Agent Chat Integration</h2>
          <p style={containerStyles.description}>
            Click the chat button in the bottom right to interact with our AI agents. 
            The chatbot will automatically route to the appropriate agent based on the current dashboard context.
          </p>
          <p style={containerStyles.description}>
            Use @mentions to switch between agents:
            <br />• @sales - Sales Intelligence
            <br />• @customer - Customer Intelligence  
            <br />• @finance - Financial Intelligence
            <br />• @inventory - Inventory Intelligence
            <br />• @enterpriseiq - Multi-agent orchestration
          </p>
        </div>

        <div style={containerStyles.contentSection}>
          <h2 style={containerStyles.sectionTitle}>Common UI Components</h2>
          <p style={containerStyles.description}>
            This demo showcases the common UI components created for consistent theming across all dashboards:
            <br />• ThemeProvider - Centralized theme management
            <br />• DashboardLayout - Consistent dashboard structure
            <br />• KPICard - Reusable KPI tiles with trends
            <br />• UniversalChatbot - Multi-agent chat interface
            <br />• Dark gradient theme with cyan accents
          </p>
        </div>

        <BusinessIntelligenceButton
          onClick={() => setIsBIOpen(true)}
          count={selectedChartPoints.length}
        />
        
        <ChatbotButton 
          onClick={() => setIsChatOpen(!isChatOpen)}
          isOpen={isChatOpen}
        />
        
        {isChatOpen && (
          <UniversalChatbot
            defaultAgent={selectedDashboard}
            onClose={() => setIsChatOpen(false)}
            dashboardContext={{
              source_dashboard: selectedDashboard,
              metrics: currentDashboard.kpis,
              selectedPoints: selectedChartPoints
            }}
          />
        )}
        
        {isBIOpen && (
          <BusinessIntelligencePanel
            dashboardContext={{
              source_dashboard: selectedDashboard,
              metrics: currentDashboard.kpis
            }}
            selectedCustomers={selectedChartPoints.length}
            onClose={() => setIsBIOpen(false)}
          />
        )}
        
        {showInsights && (
          <AIInsightsPopup
            data={showInsights}
            position={{ x: window.innerWidth / 2 - 200, y: 100 }}
            onClose={() => setShowInsights(null)}
            onSendToChat={handleSendToChat}
          />
        )}
      </DashboardLayout>
    </ThemeProvider>
  );
}