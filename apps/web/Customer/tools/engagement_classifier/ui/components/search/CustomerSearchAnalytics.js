import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { plotlyDarkConfig, plotlyDarkLayout } from "../../utils/chartConfig";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Define CSS keyframes for the popup animation
const popupKeyframes = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { transform: translateY(-80%); }
  to { transform: translateY(-100%); }
}
`;

const CustomerSearchAnalytics = ({ onCustomerSelect = null }) => {
  const [searchTerm, setSearchTerm] = useState('Johnston Distributors');
  const [customerData, setCustomerData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('rcf'); // 'rcf' or 'timeline'
  
  // AI Assistant states
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantPosition, setAssistantPosition] = useState({ x: 0, y: 0 });
  const [assistantContent, setAssistantContent] = useState('');
  const [assistantTitle, setAssistantTitle] = useState('');
  
  // Context Menu states
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    type: '',
    contextPoints: [],
    position: { x: 0, y: 0 }
  });
  
  // Load Johnston Distributors by default when component mounts
  useEffect(() => {
    const loadDefaultCustomer = async () => {
      try {
        setIsLoading(true);
        
        // First search for Johnston Distributors
        const searchResponse = await fetch('/api/engagement-classifier/search-customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm: 'Johnston Distributors' })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.customers && searchData.customers.length > 0) {
            const johnstonDistributors = searchData.customers.find(c => 
              c["Customer Name"]?.includes('Johnston Distributors')) || searchData.customers[0];
            
            // Get detailed analytics for Johnston Distributors
            const analyticsResponse = await fetch('/api/engagement-classifier/customer-analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customerKey: johnstonDistributors["Customer Key"] })
            });
            
            if (analyticsResponse.ok) {
              const analyticsData = await analyticsResponse.json();
              setCustomerData({
                ...johnstonDistributors,
                analytics: analyticsData.analytics
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading default customer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDefaultCustomer();
  }, []);

  // Get suggestions as user types
  const getSuggestions = async (term) => {
    if (!term || term.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch('/api/engagement-classifier/search-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: term.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.customers || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestions([]);
    }
  };

  // Search and get customer data
  const searchCustomer = async (customerToSelect = null) => {
    const customer = customerToSelect || (suggestions.length > 0 ? suggestions[0] : null);
    
    if (!customer && (!searchTerm || searchTerm.trim().length < 2)) {
      setError('Please enter at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      let selectedCustomer = customer;
      
      // If no customer provided, search for the first match
      if (!selectedCustomer) {
        const searchResponse = await fetch('/api/engagement-classifier/search-customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm: searchTerm.trim() })
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.customers && searchData.customers.length > 0) {
            selectedCustomer = searchData.customers[0];
          } else {
            setError(`No customer found for "${searchTerm}"`);
            setIsLoading(false);
            return;
          }
        } else {
          setError('Search failed. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      // Get detailed analytics for the selected customer
      const analyticsResponse = await fetch('/api/engagement-classifier/customer-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerKey: selectedCustomer["Customer Key"] })
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setCustomerData({
          ...selectedCustomer,
          analytics: analyticsData.analytics
        });
        setSearchTerm(selectedCustomer["Customer Name"]);
      } else {
        setError('Failed to load customer analytics');
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    getSuggestions(value);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchCustomer();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (customer) => {
    searchCustomer(customer);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setCustomerData(null);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Generate context points for chatbot
  const generateContextPoints = (type, data) => {
    if (!customerData) return [];
    
    const contextPoints = [];

    switch(type) {
      case 'total-purchases':
        contextPoints.push(`Total purchases: ${formatCurrency(customerData.analytics.total_purchases)}`);
        contextPoints.push(`Customer value tier: ${customerData.analytics.total_purchases > 50000 ? 'High value' : customerData.analytics.total_purchases > 10000 ? 'Medium value' : 'Growth potential'}`);
        break;
      case 'total-transactions':
        contextPoints.push(`Total transactions: ${customerData.analytics.total_transactions}`);
        contextPoints.push(`Purchase frequency: ${customerData.analytics.total_transactions > 20 ? 'High frequency buyer' : customerData.analytics.total_transactions > 10 ? 'Regular buyer' : 'Occasional buyer'}`);
        break;
      case 'recency-score':
        contextPoints.push(`Recency score: ${customerData.analytics.recency_score}/10`);
        contextPoints.push(`Last activity: ${customerData.analytics.days_since_last_activity} days ago`);
        break;
      case 'frequency-score':
        contextPoints.push(`Frequency score: ${customerData.analytics.frequency_score}/10`);
        contextPoints.push(`Purchase pattern: ${customerData.analytics.frequency_score > 7 ? 'Regular buyer' : customerData.analytics.frequency_score > 4 ? 'Occasional buyer' : 'Infrequent buyer'}`);
        break;
      case 'monetary-score':
        contextPoints.push(`Monetary score: ${customerData.analytics.monetary_score}/10`);
        contextPoints.push(`Average order value: ${formatCurrency(customerData.analytics.avg_order_value)}`);
        break;
      case 'loyalty-status':
        contextPoints.push(`Loyalty status: ${customerData["Loyalty Status"]}`);
        contextPoints.push(`Customer segment: ${customerData["Loyalty Status"] === 'Active, Loyal' ? 'VIP customer' : customerData["Loyalty Status"] === 'Active' ? 'Regular customer' : 'At-risk customer'}`);
        break;
      case 'days-since-activity':
        const daysSince = customerData["Days Since Last Activity"];
        contextPoints.push(`Days since last activity: ${daysSince} days`);
        contextPoints.push(`Activity level: ${daysSince <= 30 ? 'Recently active' : daysSince <= 90 ? 'Moderately active' : 'Inactive'}`);
        break;
      case 'rfm-score':
        const rfmScore = customerData["RFM Score"];
        contextPoints.push(`RFM score: ${rfmScore}/10`);
        contextPoints.push(`Customer tier: ${rfmScore >= 8 ? 'Champion' : rfmScore >= 6 ? 'Loyal customer' : rfmScore >= 4 ? 'Potential loyalist' : 'At risk'}`);
        break;
      case 'customer-lifetime-value':
        const clv = customerData["Customer Lifetime Value"];
        contextPoints.push(`Customer lifetime value: ${formatCurrency(clv)}`);
        contextPoints.push(`Value tier: ${clv >= 10000 ? 'High value' : clv >= 5000 ? 'Medium value' : 'Growth potential'}`);
        break;
      case 'period-total':
      case 'timeline-total':
        const timelineTotal = customerData.analytics.timeline?.reduce((sum, t) => sum + (t.purchase_amount || 0), 0) || 0;
        contextPoints.push(`${type === 'period-total' ? 'Period' : 'Timeline'} total: ${formatCurrency(timelineTotal)}`);
        contextPoints.push(`Purchase volume: ${timelineTotal > 50000 ? 'High volume' : timelineTotal > 10000 ? 'Moderate volume' : 'Low volume'}`);
        break;
      case 'largest-transaction':
      case 'peak-purchase':
        const maxPurchase = customerData.analytics.timeline?.length > 0 ? Math.max(...customerData.analytics.timeline.map(t => t.purchase_amount || 0)) : 0;
        contextPoints.push(`${type === 'largest-transaction' ? 'Largest transaction' : 'Peak purchase'}: ${formatCurrency(maxPurchase)}`);
        contextPoints.push(`Spending capacity: ${maxPurchase > 10000 ? 'High spender' : maxPurchase > 2000 ? 'Medium spender' : 'Conservative spender'}`);
        break;
      case 'avg-transaction':
        const avgTransaction = customerData.analytics.timeline?.length > 0 ? 
          customerData.analytics.timeline.reduce((sum, t) => sum + (t.purchase_amount || 0), 0) / customerData.analytics.timeline.length : 0;
        contextPoints.push(`Average transaction: ${formatCurrency(avgTransaction)}`);
        contextPoints.push(`Spending pattern: ${avgTransaction > 5000 ? 'High average spend' : avgTransaction > 1000 ? 'Moderate average spend' : 'Low average spend'}`);
        break;
      default:
        contextPoints.push(`Metric: ${type.replace('-', ' ')}`);
        contextPoints.push(`Available in customer analytics`);
    }

    return contextPoints;
  };

  // Show context menu for chatbot
  const showContextMenu = (e, type, data) => {
    if (!customerData) return;
    
    let x = 100;
    let y = 100;
    
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 320;
      const menuHeight = 380;
      
      x = rect.left + (rect.width / 2) - (menuWidth / 2);
      y = rect.top - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = rect.bottom + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    } else if (e && e.clientX) {
      const menuWidth = 320;
      const menuHeight = 380;
      
      x = e.clientX - (menuWidth / 2);
      y = e.clientY - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    } else if (e && e.event && e.event.clientX) {
      const menuWidth = 320;
      const menuHeight = 380;
      
      x = e.event.clientX - (menuWidth / 2);
      y = e.event.clientY - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.event.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    }
    
    const contextPoints = generateContextPoints(type, data);
    
    setContextMenu({
      visible: true,
      type: type,
      contextPoints: contextPoints,
      position: { x, y }
    });
    
    console.log('Context points for chatbot:', contextPoints);
  };

  // Show AI Assistant
  const showAIAssistant = (e, type, data) => {
    if (!customerData) return;
    
    // Check if Shift key was pressed
    const isShiftClick = e && (e.shiftKey || (e.event && e.event.shiftKey));
    
    if (isShiftClick) {
      // Directly send context to chat (no popup)
      try {
        const contextPoints = generateContextPoints(type, data);
        if (window.attachContextTags) {
          contextPoints.forEach(point => window.attachContextTags(point));
          if (window.openChatPanel) window.openChatPanel();
        } else if (window.sendContextToChat) {
          window.sendContextToChat(contextPoints);
        }
      } catch (err) {
        console.error('Error sending search context to chat:', err);
      }
      return;
    }

    // Regular click - show AI assistant
    console.log('Regular click detected - showing AI assistant for:', type);
    
    // Calculate position for the popup
    let x = 100;
    let y = 100;
    
    // Handle different event types
    if (e && e.currentTarget) {
      // Regular DOM events (clicking on KPI tiles)
      const rect = e.currentTarget.getBoundingClientRect();
      x = rect.left;
      y = rect.top - 10; // Position slightly above the element
    } else if (e && e.clientX) {
      // Plotly events sometimes pass event with clientX/clientY
      x = e.clientX;
      y = e.clientY - 10;
    } else if (e && e.event && e.event.clientX) {
      // Plotly chart events
      x = e.event.clientX;
      y = e.event.clientY - 10;
    }
    
    setAssistantPosition({ x, y });
    
    // Generate content based on type
    let content = '';
    let title = '';
    
    switch(type) {
      case 'total-purchases':
        title = 'Total Purchases';
        content = `${formatCurrency(customerData.analytics.total_purchases)} in lifetime purchases. ${
          customerData.analytics.total_purchases > 50000 ? 'This is a high-value customer.' :
          customerData.analytics.total_purchases > 10000 ? 'This is a medium-value customer.' :
          'This customer has growth potential.'
        }`;
        break;
        
      case 'total-transactions':
        title = 'Total Transactions';
        content = `${customerData.analytics.total_transactions} lifetime transactions. ${
          customerData.analytics.total_transactions > 20 ? 'This customer purchases frequently.' :
          customerData.analytics.total_transactions > 10 ? 'This customer makes regular purchases.' :
          'This customer makes occasional purchases.'
        }`;
        break;
        
      case 'loyalty-status':
        title = 'Loyalty Status';
        content = `${customerData["Loyalty Status"] || 'Unknown'} - ${
          customerData["Loyalty Status"] === 'Active, Loyal' ? 'This is a highly loyal customer who should be prioritized.' :
          customerData["Loyalty Status"] === 'Active' ? 'This customer is active but could be more engaged.' :
          'This customer needs re-engagement strategies.'
        }`;
        break;
        
      case 'days-since-activity':
        title = 'Days Since Activity';
        content = `${customerData.analytics.days_since_last_activity || 0} days since last purchase. ${
          customerData.analytics.days_since_last_activity < 30 ? 'Recent activity indicates high engagement.' :
          customerData.analytics.days_since_last_activity < 90 ? 'Moderate recency - consider a check-in.' :
          'This customer has been inactive for a while and needs re-engagement.'
        }`;
        break;
        
      case 'active-periods':
        title = 'Active Periods';
        const activePeriods = customerData.analytics.timeline?.filter(t => t.purchase_amount > 0).length || 0;
        content = `${activePeriods} active periods in the timeline. ${
          activePeriods > 8 ? 'Shows consistent long-term engagement.' :
          activePeriods > 4 ? 'Shows moderate engagement over time.' :
          'Limited activity periods - may be a newer or occasional customer.'
        }`;
        break;
        
      case 'timeline-total':
        title = 'Timeline Total';
        const timelineTotal = customerData.analytics.timeline?.reduce((sum, t) => sum + (t.purchase_amount || 0), 0) || 0;
        content = `${formatCurrency(timelineTotal)} total purchases in the timeline. ${
          timelineTotal > 50000 ? 'Very high total value in the analyzed period.' :
          timelineTotal > 10000 ? 'Good total value in the analyzed period.' :
          'Moderate total value - potential for growth.'
        }`;
        break;
        
      case 'peak-purchase':
        title = 'Peak Purchase';
        const peakPurchase = Math.max(...(customerData.analytics.timeline?.map(t => t.purchase_amount || 0) || [0]));
        content = `${formatCurrency(peakPurchase)} highest purchase in a single period. ${
          peakPurchase > 10000 ? 'Significant peak purchase indicates high potential.' :
          peakPurchase > 5000 ? 'Good peak purchase value.' :
          'Moderate peak purchase - opportunity to increase order value.'
        }`;
        break;
        
      case 'transactions-count':
        title = 'Transactions';
        content = `${drillDownData.length} transactions in the selected period. ${
          drillDownData.length > 10 ? 'High transaction frequency indicates strong engagement.' :
          drillDownData.length > 5 ? 'Good transaction frequency.' :
          'Limited transactions in this period.'
        }`;
        break;
        
      case 'period-total':
        title = 'Period Total';
        const periodTotal = drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0);
        content = `${formatCurrency(periodTotal)} total for the selected period. ${
          periodTotal > 10000 ? 'Very high value for this period.' :
          periodTotal > 5000 ? 'Good value for this period.' :
          'Moderate value for this period.'
        }`;
        break;
        
      case 'largest-transaction':
        title = 'Largest Transaction';
        const largestTransaction = drillDownData.length > 0 ? Math.max(...drillDownData.map(t => t.amount || 0)) : 0;
        content = `${formatCurrency(largestTransaction)} largest single transaction. ${
          largestTransaction > 5000 ? 'Significant transaction value.' :
          largestTransaction > 1000 ? 'Good transaction value.' :
          'Moderate transaction value.'
        }`;
        break;
        
      case 'avg-transaction':
        title = 'Average Transaction';
        const avgTransaction = drillDownData.length > 0 ? 
          drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0) / drillDownData.length : 0;
        content = `${formatCurrency(avgTransaction)} average transaction value. ${
          avgTransaction > 1000 ? 'High average value per transaction.' :
          avgTransaction > 500 ? 'Good average value per transaction.' :
          'Opportunity to increase average transaction value.'
        }`;
        break;
        
      case 'recency-score':
        title = 'Recency Score';
        const recencyScore = Math.max(0, 10 - (customerData.analytics.days_since_last_activity || 0) / 10).toFixed(1);
        content = `${recencyScore}/10 - ${
          recencyScore > 7 ? 'Excellent! Recent purchase activity.' :
          recencyScore > 4 ? 'Good recency score.' :
          'Low recency score - customer needs re-engagement.'
        }`;
        break;
        
      case 'frequency-score':
        title = 'Frequency Score';
        const frequencyScore = Math.min(10, (customerData.analytics.total_transactions || 0) / 2).toFixed(1);
        content = `${frequencyScore}/10 - ${
          frequencyScore > 7 ? 'Excellent! Customer purchases frequently.' :
          frequencyScore > 4 ? 'Good purchase frequency.' :
          'Low frequency score - consider loyalty incentives.'
        }`;
        break;
        
      case 'monetary-score':
        title = 'Monetary Score';
        const monetaryScore = Math.min(10, (customerData.analytics.total_purchases || 0) / 50000).toFixed(1);
        content = `${monetaryScore}/10 - ${
          monetaryScore > 7 ? 'Excellent! High-value customer.' :
          monetaryScore > 4 ? 'Good monetary value.' :
          'Low monetary score - opportunity to increase spend.'
        }`;
        break;
        
      case 'rcf-point':
        // For clicking on points in the RCF chart
        const pointName = data?.pointName || '';
        if (pointName === 'Recency') {
          title = 'Recency Score';
          const recencyScore = Math.max(0, 10 - (customerData.analytics.days_since_last_activity || 0) / 10).toFixed(1);
          content = `${recencyScore}/10 - Based on ${customerData.analytics.days_since_last_activity || 0} days since last activity.`;
        } else if (pointName === 'Frequency') {
          title = 'Frequency Score';
          const frequencyScore = Math.min(10, (customerData.analytics.total_transactions || 0) / 2).toFixed(1);
          content = `${frequencyScore}/10 - Based on ${customerData.analytics.total_transactions || 0} total transactions.`;
        } else if (pointName === 'Monetary') {
          title = 'Monetary Score';
          const monetaryScore = Math.min(10, (customerData.analytics.total_purchases || 0) / 50000).toFixed(1);
          content = `${monetaryScore}/10 - Based on ${formatCurrency(customerData.analytics.total_purchases || 0)} total purchases.`;
        }
        break;
        
      case 'timeline-point':
        // For clicking on points in the timeline chart
        const period = data?.period || '';
        const amount = data?.amount || 0;
        title = `${period} Purchase`;
        content = `${formatCurrency(amount)} in purchases during ${period}. ${
          amount > 10000 ? 'This was a high-value period.' :
          amount > 5000 ? 'This was a good-value period.' :
          'This was a moderate-value period.'
        }`;
        break;
        
      default:
        title = 'Customer Insight';
        content = 'Click on different metrics to see specific insights.';
    }
    
    setAssistantTitle(title);
    setAssistantContent(content);
    setShowAssistant(true);
  };
  
  // Close AI Assistant
  const closeAssistant = () => {
    setShowAssistant(false);
  };

  // Render RCF (Recency, Frequency, Monetary) Chart
  const renderRCFChart = () => {
    if (!customerData?.analytics) return null;

    const analytics = customerData.analytics;
    
    // Calculate RCF scores (normalized to 0-10 scale)
    const recencyScore = Math.max(0, 10 - (analytics.days_since_last_activity || 0) / 10);
    const frequencyScore = Math.min(10, (analytics.total_transactions || 0) / 2);
    const monetaryScore = Math.min(10, (analytics.total_purchases || 0) / 50000);

    const trace = {
      type: 'scatterpolar',
      r: [recencyScore, frequencyScore, monetaryScore, recencyScore],
      theta: ['Recency', 'Frequency', 'Monetary', 'Recency'],
      fill: 'toself',
      fillcolor: 'rgba(0, 224, 255, 0.3)',
      line: {
        color: '#00e0ff',
        width: 3
      },
      marker: {
        size: 8,
        color: '#00e0ff'
      },
      name: 'RCF Score'
    };

    const layout = {
      height: 350,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { 
        family: 'Inter, sans-serif', 
        color: '#f7f9fb',
        size: 12 
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 10],
          tickfont: { size: 10, color: '#5891cb' },
          gridcolor: 'rgba(58, 68, 89, 0.3)'
        },
        angularaxis: {
          tickfont: { size: 14, color: '#f7f9fb' }
        },
        bgcolor: 'transparent'
      },
      showlegend: false,
      margin: { l: 40, r: 40, t: 20, b: 20 }
    };

    return (
      <div style={{ position: 'relative' }}>
        <Plot
          data={[trace]}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          onClick={(data) => {
            if (data.points && data.points.length > 0) {
              const point = data.points[0];
              const pointName = point.theta;
              showAIAssistant(data, 'rcf-point', { pointName });
            }
          }}
        />
        
        {/* RCF Score Blocks with AI Assistant */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div 
              onClick={(e) => showAIAssistant(e, 'recency-score')}
              style={{
                backgroundColor: 'rgba(0, 224, 255, 0.15)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#00e0ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 10px rgba(0, 224, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 224, 255, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 224, 255, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 224, 255, 0.1)';
              }}
            >
              R: {Math.max(0, 10 - (customerData.analytics.days_since_last_activity || 0) / 10).toFixed(1)}
            </div>
            
            <div 
              onClick={(e) => showAIAssistant(e, 'frequency-score')}
              style={{
                backgroundColor: 'rgba(95, 212, 214, 0.15)',
                border: '1px solid rgba(95, 212, 214, 0.3)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#5fd4d6',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 10px rgba(95, 212, 214, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(95, 212, 214, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(95, 212, 214, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(95, 212, 214, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(95, 212, 214, 0.1)';
              }}
            >
              F: {Math.min(10, (customerData.analytics.total_transactions || 0) / 2).toFixed(1)}
            </div>
            
            <div 
              onClick={(e) => showAIAssistant(e, 'monetary-score')}
              style={{
                backgroundColor: 'rgba(233, 48, 255, 0.15)',
                border: '1px solid rgba(233, 48, 255, 0.3)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#e930ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 10px rgba(233, 48, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(233, 48, 255, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(233, 48, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(233, 48, 255, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(233, 48, 255, 0.1)';
              }}
            >
              M: {Math.min(10, (customerData.analytics.total_purchases || 0) / 50000).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // State for drill-down functionality
  const [timelineView, setTimelineView] = useState('monthly'); // 'monthly' or 'detailed'
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [drillDownData, setDrillDownData] = useState([]);

  // Generate drill-down data for selected periods
  const generateDrillDownData = (periods) => {
    if (!customerData?.analytics?.timeline) return [];
    
    const timeline = customerData.analytics.timeline;
    const drillData = [];
    
    periods.forEach(period => {
      const monthData = timeline.find(t => t.period === period);
      if (monthData && monthData.individual_transactions) {
        monthData.individual_transactions.forEach(transaction => {
          drillData.push({
            date: transaction.date,
            amount: transaction.amount,
            type: transaction.type,
            transaction_id: transaction.transaction_id,
            period: period
          });
        });
      }
    });
    
    // Sort by date
    drillData.sort((a, b) => new Date(a.date) - new Date(b.date));
    return drillData;
  };

  // Handle zoom/selection events
  const handleTimelineSelection = (eventData) => {
    if (!eventData || !eventData.range) return;
    
    const timeline = customerData.analytics.timeline.filter(t => t.purchase_amount > 0);
    const selectedIndices = [];
    
    // Find periods within the selected range
    eventData.range.x.forEach(xValue => {
      const index = timeline.findIndex(t => t.period === xValue);
      if (index !== -1) selectedIndices.push(index);
    });
    
    if (selectedIndices.length > 0) {
      const periods = selectedIndices.map(i => timeline[i].period);
      setSelectedPeriods(periods);
      setDrillDownData(generateDrillDownData(periods));
      setTimelineView('detailed');
    }
  };

  // Reset to monthly view
  const resetToMonthlyView = () => {
    setTimelineView('monthly');
    setSelectedPeriods([]);
    setDrillDownData([]);
  };

  // Render Purchase Timeline Chart
  const renderPurchaseTimeline = () => {
    if (!customerData?.analytics?.timeline) {
      return (
        <div style={{
          textAlign: 'center',
          color: '#5891cb',
          padding: '60px 20px',
          fontSize: '16px'
        }}>
          📈 No timeline data available
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            Purchase timeline will show customer's buying pattern over time
          </div>
        </div>
      );
    }

    const timeline = customerData.analytics.timeline;
    
    // Filter out zero amounts for cleaner visualization
    const filteredTimeline = timeline.filter(t => t.purchase_amount > 0);
    
    if (filteredTimeline.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          color: '#5891cb',
          padding: '60px 20px',
          fontSize: '16px'
        }}>
          📈 No purchase activity in timeline
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            This customer has no recorded purchases in the selected period
          </div>
        </div>
      );
    }

    // Show detailed view if drill-down is active
    if (timelineView === 'detailed' && drillDownData.length > 0) {
      return renderDetailedTimeline();
    }
    
    const trace = {
      x: filteredTimeline.map(t => t.period),
      y: filteredTimeline.map(t => t.purchase_amount),
      type: 'scatter',
      mode: 'lines+markers',
      line: { 
        color: '#00e0ff', 
        width: 3,
        shape: 'spline',
        smoothing: 0.3
      },
      marker: { 
        size: 10, 
        color: '#00e0ff',
        line: { color: '#0a1224', width: 2 },
        symbol: 'circle'
      },
      fill: 'tozeroy',
      fillcolor: 'rgba(0, 224, 255, 0.15)',
      name: 'Purchase Amount',
      hovertemplate: '<b>%{x}</b><br>Purchase: $%{y:,.0f}<br><i>Click and drag to zoom for details</i><extra></extra>'
    };

    const layout = {
      height: 350,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { 
        family: 'Inter, sans-serif', 
        color: '#f7f9fb',
        size: 12 
      },
      margin: { l: 70, r: 40, t: 40, b: 80 },
      title: {
        text: 'Monthly Purchase Timeline (Click and drag to zoom for individual transactions)',
        font: { size: 14, color: '#5891cb' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: {
        title: {
          text: 'Timeline Period',
          font: { size: 14, color: '#f7f9fb' }
        },
        tickfont: { size: 10, color: '#f7f9fb' },
        gridcolor: 'rgba(58, 68, 89, 0.3)',
        showgrid: true,
        zeroline: false,
        tickangle: -45,
        tickmode: 'array',
        tickvals: filteredTimeline.map((_, i) => i % 3 === 0 ? filteredTimeline[i].period : null).filter(Boolean),
        automargin: true
      },
      yaxis: {
        title: {
          text: 'Purchase Amount ($)',
          font: { size: 14, color: '#f7f9fb' }
        },
        tickfont: { size: 11, color: '#f7f9fb' },
        gridcolor: 'rgba(58, 68, 89, 0.3)',
        showgrid: true,
        zeroline: false,
        tickformat: '$,.0f'
      },
      showlegend: false,
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#232a36',
        bordercolor: '#00e0ff',
        font: { color: '#f7f9fb', size: 12 }
      },
      dragmode: 'select',
      selectdirection: 'horizontal'
    };

    return (
      <div style={{ position: 'relative' }}>
        <Plot
          data={[trace]}
          layout={layout}
          config={{ 
            displayModeBar: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'autoScale2d', 'resetScale2d'],
            displaylogo: false,
            responsive: true
          }}
          style={{ width: '100%', height: '100%' }}
          onClick={(data) => {
            if (data.points && data.points.length > 0) {
              const point = data.points[0];
              showAIAssistant(data, 'timeline-point', { 
                period: point.x, 
                amount: point.y 
              });
            }
          }}
          onSelected={(eventData) => {
            if (eventData && eventData.points && eventData.points.length > 0) {
              const selectedPeriods = eventData.points.map(point => point.x);
              // Defer state changes to avoid unmounting Plot during Plotly's selection lifecycle
              setTimeout(() => {
                setSelectedPeriods(selectedPeriods);
                setDrillDownData(generateDrillDownData(selectedPeriods));
                setTimelineView('detailed');
              }, 0);
            }
          }}
        />
      </div>
    );
  };

  // Render detailed timeline with individual transactions
  const renderDetailedTimeline = () => {
    const trace = {
      x: drillDownData.map(t => t.date),
      y: drillDownData.map(t => t.amount),
      type: 'scatter',
      mode: 'markers+lines',
      line: { 
        color: '#5fd4d6', 
        width: 2
      },
      marker: { 
        size: 12, 
        color: drillDownData.map(t => {
          // Color code by transaction type
          const colors = {
            'Product Sale': '#00e0ff',
            'Service Fee': '#5fd4d6',
            'Bulk Order': '#e930ff',
            'Subscription': '#43cad0',
            'Consultation': '#7c3aed'
          };
          return colors[t.type] || '#00e0ff';
        }),
        line: { color: '#0a1224', width: 2 },
        symbol: 'circle'
      },
      name: 'Individual Transactions',
      hovertemplate: '<b>%{x}</b><br>Amount: $%{y:,.0f}<br>Type: %{customdata}<extra></extra>',
      customdata: drillDownData.map(t => t.type)
    };

    const layout = {
      height: 350,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { 
        family: 'Inter, sans-serif', 
        color: '#f7f9fb',
        size: 12 
      },
      margin: { l: 70, r: 40, t: 60, b: 80 },
      title: {
        text: `Individual Transactions: ${selectedPeriods.join(', ')}`,
        font: { size: 14, color: '#00e0ff' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: {
        title: {
          text: 'Transaction Date',
          font: { size: 14, color: '#f7f9fb' }
        },
        tickfont: { size: 10, color: '#f7f9fb' },
        gridcolor: 'rgba(58, 68, 89, 0.3)',
        showgrid: true,
        zeroline: false,
        tickangle: -45,
        automargin: true
      },
      yaxis: {
        title: {
          text: 'Transaction Amount ($)',
          font: { size: 14, color: '#f7f9fb' }
        },
        tickfont: { size: 11, color: '#f7f9fb' },
        gridcolor: 'rgba(58, 68, 89, 0.3)',
        showgrid: true,
        zeroline: false,
        tickformat: '$,.0f'
      },
      showlegend: false,
      hovermode: 'closest',
      hoverlabel: {
        bgcolor: '#232a36',
        bordercolor: '#5fd4d6',
        font: { color: '#f7f9fb', size: 12 }
      }
    };

    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={resetToMonthlyView}
              style={{
                backgroundColor: '#232a36',
                border: '1px solid #00e0ff',
                borderRadius: '6px',
                color: '#00e0ff',
                padding: '8px 16px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              ← Back to Monthly View
            </button>
          </div>
          <div style={{ color: '#5891cb', fontSize: '12px' }}>
            {drillDownData.length} individual transactions
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Plot
            data={[trace]}
            layout={layout}
            config={{ 
              displayModeBar: false,
              responsive: true
            }}
            style={{ width: '100%', height: '100%' }}
            onClick={(data) => {
              if (data.points && data.points.length > 0) {
                const point = data.points[0];
                showAIAssistant(data, 'timeline-point', { 
                  period: point.x, 
                  amount: point.y 
                });
              }
            }}
          />
        </div>
        
        {/* Transaction Metrics with AI Assistant */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '16px',
          gap: '8px'
        }}>
          <div 
            onClick={(e) => showAIAssistant(e, 'transactions-count')}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 224, 255, 0.1)',
              border: '1px solid rgba(0, 224, 255, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 224, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 224, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ color: '#00e0ff', fontSize: '14px', fontWeight: '600' }}>
              {drillDownData.length}
            </div>
            <div style={{ color: '#5891cb', fontSize: '11px' }}>
              Transactions
            </div>
          </div>
          
          <div 
            onClick={(e) => showAIAssistant(e, 'period-total')}
            style={{
              flex: 1,
              backgroundColor: 'rgba(95, 212, 214, 0.1)',
              border: '1px solid rgba(95, 212, 214, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(95, 212, 214, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(95, 212, 214, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ color: '#5fd4d6', fontSize: '14px', fontWeight: '600' }}>
              {formatCurrency(drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0))}
            </div>
            <div style={{ color: '#5891cb', fontSize: '11px' }}>
              Period Total
            </div>
          </div>
          
          <div 
            onClick={(e) => showAIAssistant(e, 'largest-transaction')}
            style={{
              flex: 1,
              backgroundColor: 'rgba(233, 48, 255, 0.1)',
              border: '1px solid rgba(233, 48, 255, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(233, 48, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(233, 48, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ color: '#e930ff', fontSize: '14px', fontWeight: '600' }}>
              {drillDownData.length > 0 ? formatCurrency(Math.max(...drillDownData.map(t => t.amount || 0))) : '$0'}
            </div>
            <div style={{ color: '#5891cb', fontSize: '11px' }}>
              Largest Transaction
            </div>
          </div>
          
          <div 
            onClick={(e) => showAIAssistant(e, 'avg-transaction')}
            style={{
              flex: 1,
              backgroundColor: 'rgba(67, 202, 208, 0.1)',
              border: '1px solid rgba(67, 202, 208, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(67, 202, 208, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(67, 202, 208, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ color: '#43cad0', fontSize: '14px', fontWeight: '600' }}>
              {drillDownData.length > 0 ? 
                formatCurrency(drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0) / drillDownData.length) : 
                '$0'}
            </div>
            <div style={{ color: '#5891cb', fontSize: '11px' }}>
              Avg Transaction
            </div>
          </div>
        </div>
      </div>
    );
  };

  // AI Assistant Popup
  const renderAIAssistant = () => {
    if (!showAssistant) return null;
    
    return (
      <>
        <style>{popupKeyframes}</style>
        <div style={{
          position: 'fixed',
          top: assistantPosition.y,
          left: assistantPosition.x,
          zIndex: 9999,
          maxWidth: '300px',
          backgroundColor: '#0a1224',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 224, 255, 0.3)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease, slideUp 0.3s ease',
          transform: 'translateY(-100%)'
        }}>
        {/* Header */}
        <div style={{
          padding: '10px 12px',
          backgroundColor: 'rgba(0, 224, 255, 0.1)',
          borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 224, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 224, 255, 0.5)'
            }}>
              <span style={{ fontSize: '12px' }}>💡</span>
            </div>
            <div style={{
              color: '#00e0ff',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {assistantTitle}
            </div>
          </div>
          <button
            onClick={closeAssistant}
            style={{
              background: 'none',
              border: 'none',
              color: '#5891cb',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '12px',
          color: '#f7f9fb',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          {assistantContent}
        </div>
      </div>
      </>
    );
  };

  // Context Menu Popup
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    
    return (
      <>
        <style>{popupKeyframes}</style>
        <div style={{
          position: 'fixed',
          top: contextMenu.position.y,
          left: contextMenu.position.x,
          zIndex: 9999,
          maxWidth: '320px',
          backgroundColor: '#0a1224',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(233, 48, 255, 0.3)',
          border: '1px solid rgba(233, 48, 255, 0.3)',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease, slideUp 0.3s ease',
          transform: 'translateY(-100%)'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(233, 48, 255, 0.1)',
            borderBottom: '1px solid rgba(233, 48, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(233, 48, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(233, 48, 255, 0.5)'
              }}>
                <span style={{ fontSize: '12px' }}>🎯</span>
              </div>
              <div style={{
                color: '#e930ff',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Context for Chat
              </div>
            </div>
            <button
              onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#5891cb',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(88, 145, 203, 0.1)';
                e.currentTarget.style.color = '#f7f9fb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#5891cb';
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Context Points */}
          <div style={{
            padding: '12px 16px',
            color: '#f7f9fb',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            {contextMenu.contextPoints.map((point, index) => (
              <div key={index} style={{
                marginBottom: '8px',
                padding: '6px 8px',
                backgroundColor: 'rgba(233, 48, 255, 0.05)',
                borderRadius: '6px',
                border: '1px solid rgba(233, 48, 255, 0.1)'
              }}>
                {point}
              </div>
            ))}
          </div>
          
          {/* Send to Chat Button */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(233, 48, 255, 0.2)',
            backgroundColor: 'rgba(233, 48, 255, 0.05)'
          }}>
            <button
              onClick={() => {
                console.log('Attaching context tags to chatbot:', contextMenu.contextPoints);
                // Instead of sending messages, attach as context tags
                if (window.attachContextTags) {
                  window.attachContextTags(contextMenu.contextPoints);
                } else if (window.sendContextToChat) {
                  // Fallback to old method if new one not available
                  window.sendContextToChat(contextMenu.contextPoints);
                }
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#e930ff',
                color: '#f7f9fb',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d020e6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e930ff';
              }}
            >
              🏷️ Add Context Tags
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '600px 1fr',
      gap: 'var(--spacing-xl)',
      marginBottom: 'var(--spacing-xl)'
    }}>
      {/* Search Section */}
      <div className="glass-chart-container">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">🔍 Customer Search</h3>
            <p className="chart-subtitle">Search for individual customers and view their analytics</p>
          </div>
        </div>
        
        <div style={{ padding: 'var(--spacing-lg)' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="Start typing customer name (e.g., 'Blair', 'John', 'Emily')..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#1a1f2e',
                  border: '2px solid #3a4459',
                  borderRadius: '8px',
                  color: '#f7f9fb',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                onBlur={(e) => {
                  e.target.style.borderColor = '#3a4459';
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              <button
                onClick={() => searchCustomer()}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#00e0ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {isLoading ? '⏳' : '🔍'}
              </button>
              {customerData && (
                <button
                  onClick={clearSearch}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#232a36',
                    color: '#5891cb',
                    border: '1px solid #3a4459',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: '120px', // Account for buttons
                backgroundColor: '#232a36',
                border: '1px solid #3a4459',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: '4px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                {suggestions.slice(0, 8).map((customer, index) => (
                  <div
                    key={customer["Customer Key"] || index}
                    onClick={() => handleSuggestionClick(customer)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: index < suggestions.length - 1 ? '1px solid #3a4459' : 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2c3341'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ 
                      color: '#f7f9fb', 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      {customer["Customer Name"]}
                    </div>
                    <div style={{ 
                      color: '#5891cb', 
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>#{customer["Customer Number"]}</span>
                      {customer["Salesperson Name"] && (
                        <>
                          <span>•</span>
                          <span>👤 {customer["Salesperson Name"]}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatCurrency(customer["LTD Sales Amount"])}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div style={{
              backgroundColor: '#2a1a1a',
              border: '1px solid #e930ff',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              color: '#e930ff',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Customer Info Tabs */}
          {customerData && (
            <div>
              {/* Customer Header */}
              <div style={{
                backgroundColor: '#232a36',
                borderRadius: '12px',
                border: '1px solid #3a4459',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  color: '#00e0ff',
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  {customerData["Customer Name"]}
                </h3>
                <div style={{ color: '#5891cb', fontSize: '14px', marginBottom: '12px' }}>
                  #{customerData["Customer Number"]} • {customerData["Salesperson Name"] && `Contact: ${customerData["Salesperson Name"]}`}
                </div>
                <div style={{
                  backgroundColor: customerData.engagement_level === 'High' ? '#00e0ff' :
                                 customerData.engagement_level === 'Medium' ? '#5fd4d6' : '#e930ff',
                  color: '#000',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-block'
                }}>
                  {customerData.engagement_level} Engagement
                </div>
              </div>

              {/* Metric Tabs */}
              {customerData.analytics && (
                <>
                <div style={{ position: 'relative', marginTop: '20px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#f7f9fb', fontSize: '14px' }}>Customer Metrics</h4>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  {/* Total Purchases Tab */}
                  <div 
                  className="standard-kpi-tile glass-kpi-tile" 
                  onClick={(e) => showAIAssistant(e, 'total-purchases')}
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(58, 68, 89, 0.5)',
                    animation: 'counterUp 0.6s ease both',
                    animationDelay: '0ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 224, 255, 0.15)';
                    e.currentTarget.style.borderColor = '#00e0ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                  }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: '#00e0ff',
                      marginBottom: '8px'
                    }}>
                      {formatCurrency(customerData.analytics.total_purchases)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#5891cb' }}>
                      💰 Total Purchases
                    </div>
                  </div>

                  {/* Total Transactions Tab */}
                  <div 
                  className="standard-kpi-tile glass-kpi-tile" 
                  onClick={(e) => showAIAssistant(e, 'total-transactions')}
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(58, 68, 89, 0.5)',
                    animation: 'counterUp 0.6s ease both',
                    animationDelay: '150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(95, 212, 214, 0.15)';
                    e.currentTarget.style.borderColor = '#5fd4d6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                  }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: '#5fd4d6',
                      marginBottom: '8px'
                    }}>
                      {customerData.analytics.total_transactions}
                    </div>
                    <div style={{ fontSize: '14px', color: '#5891cb' }}>
                      🛒 Total Transactions
                    </div>
                  </div>

                  {/* Engagement Status Tab */}
                  <div 
                  className="standard-kpi-tile glass-kpi-tile" 
                  onClick={(e) => showAIAssistant(e, 'loyalty-status')}
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(58, 68, 89, 0.5)',
                    animation: 'counterUp 0.6s ease both',
                    animationDelay: '300ms'
                  }}
                  onMouseEnter={(e) => {
                    const color = customerData["Loyalty Status"] === 'Active, Loyal' ? '#00e0ff' :
                                 customerData["Loyalty Status"] === 'Active' ? '#5fd4d6' : '#e930ff';
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px rgba(${color === '#00e0ff' ? '0, 224, 255' : 
                                                      color === '#5fd4d6' ? '95, 212, 214' : '233, 48, 255'}, 0.15)`;
                    e.currentTarget.style.borderColor = color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                  }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: customerData["Loyalty Status"] === 'Active, Loyal' ? '#00e0ff' :
                            customerData["Loyalty Status"] === 'Active' ? '#5fd4d6' : '#e930ff',
                      marginBottom: '8px'
                    }}>
                      {customerData["Loyalty Status"] === 'Active, Loyal' ? '🟢' :
                       customerData["Loyalty Status"] === 'Active' ? '🟡' : '🔴'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#5891cb' }}>
                      📊 {customerData["Loyalty Status"]}
                    </div>
                  </div>

                  {/* Days Since Activity Tab */}
                  <div 
                  className="standard-kpi-tile glass-kpi-tile" 
                  onClick={(e) => showAIAssistant(e, 'days-since-activity')}
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(58, 68, 89, 0.5)',
                    animation: 'counterUp 0.6s ease both',
                    animationDelay: '450ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(233, 48, 255, 0.15)';
                    e.currentTarget.style.borderColor = '#e930ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                  }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: '#e930ff',
                      marginBottom: '8px'
                    }}>
                      {customerData.analytics.days_since_last_activity || 0}
                    </div>
                    <div style={{ fontSize: '14px', color: '#5891cb' }}>
                      📅 Days Since Activity
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          )}

          {/* Empty State */}
          {!customerData && !error && (
            <div style={{
              textAlign: 'center',
              color: '#5891cb',
              padding: '40px',
              fontSize: '16px'
            }}>
              {isLoading ? (
                <div>⏳ Loading Johnston Distributors data...</div>
              ) : (
                <>
                  🔍 Enter a customer name and press Enter or click Search
                  <div style={{ fontSize: '14px', marginTop: '12px', opacity: 0.9 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Try searching for:</strong>
                    </div>
                    <div>
                      "Blair", "Alberto", "John", "Emily", "David"
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Charts Section */}
      <div className="glass-chart-container">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">📊 Customer Analysis</h3>
            <p className="chart-subtitle">RCF analysis and purchase timeline for selected customer</p>
          </div>
        </div>
        
        <div style={{ padding: 'var(--spacing-lg)' }}>
          {customerData && customerData.analytics ? (
            <div>
              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '1px solid #3a4459',
                paddingBottom: '12px'
              }}>
                <button
                  onClick={() => setActiveTab('rcf')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: activeTab === 'rcf' ? '#00e0ff' : 'transparent',
                    color: activeTab === 'rcf' ? '#000' : '#5891cb',
                    border: activeTab === 'rcf' ? 'none' : '1px solid #3a4459',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📊 RCF Analysis
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: activeTab === 'timeline' ? '#00e0ff' : 'transparent',
                    color: activeTab === 'timeline' ? '#000' : '#5891cb',
                    border: activeTab === 'timeline' ? 'none' : '1px solid #3a4459',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📈 Purchase Timeline
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'rcf' ? (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      color: '#f7f9fb',
                      margin: '0 0 16px 0',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      RCF Score Breakdown for {customerData["Customer Name"]}
                    </h4>
                    {renderRCFChart()}
                  </div>
                  
                  {/* RCF Score Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px'
                  }}>
                    <div 
                      className="standard-kpi-tile glass-kpi-tile" 
                      onClick={(e) => showAIAssistant(e, 'recency-score')}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(58, 68, 89, 0.5)',
                        animation: 'counterUp 0.6s ease both',
                        animationDelay: '0ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 224, 255, 0.15)';
                        e.currentTarget.style.borderColor = '#00e0ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                      }}>
                        <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                          {Math.max(0, 10 - (customerData.analytics.days_since_last_activity || 0) / 10).toFixed(1)}
                        </div>
                        <div style={{ color: '#5891cb', fontSize: '12px' }}>
                          Recency Score
                        </div>
                      </div>
                    <div 
                      className="standard-kpi-tile glass-kpi-tile" 
                      onClick={(e) => showAIAssistant(e, 'frequency-score')}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(58, 68, 89, 0.5)',
                        animation: 'counterUp 0.6s ease both',
                        animationDelay: '150ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(95, 212, 214, 0.15)';
                        e.currentTarget.style.borderColor = '#5fd4d6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                      }}>
                        <div style={{ color: '#5fd4d6', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                          {Math.min(10, (customerData.analytics.total_transactions || 0) / 2).toFixed(1)}
                        </div>
                        <div style={{ color: '#5891cb', fontSize: '12px' }}>
                          Frequency Score
                        </div>
                      </div>
                    <div 
                      className="standard-kpi-tile glass-kpi-tile" 
                      onClick={(e) => showAIAssistant(e, 'monetary-score')}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(58, 68, 89, 0.5)',
                        animation: 'counterUp 0.6s ease both',
                        animationDelay: '300ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(233, 48, 255, 0.15)';
                        e.currentTarget.style.borderColor = '#e930ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                      }}>
                        <div style={{ color: '#e930ff', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                          {Math.min(10, (customerData.analytics.total_purchases || 0) / 50000).toFixed(1)}
                        </div>
                        <div style={{ color: '#5891cb', fontSize: '12px' }}>
                          Monetary Score
                        </div>
                      </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 style={{
                    color: '#f7f9fb',
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    Purchase Timeline for {customerData["Customer Name"]}
                  </h4>
                  {renderPurchaseTimeline()}
                  
                  {/* Timeline Summary */}
                  <div style={{ position: 'relative', marginTop: '20px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: '#f7f9fb', fontSize: '14px' }}>Timeline Metrics</h4>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: timelineView === 'detailed' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
                    gap: '16px'
                  }}>
                    <div 
                      className="standard-kpi-tile glass-kpi-tile" 
                      onClick={(e) => showAIAssistant(e, timelineView === 'detailed' ? 'transactions-count' : 'active-periods')}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(58, 68, 89, 0.5)',
                        animation: 'counterUp 0.6s ease both',
                        animationDelay: '0ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 224, 255, 0.15)';
                        e.currentTarget.style.borderColor = '#00e0ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                      }}>
                        <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                          {timelineView === 'detailed' ? 
                            drillDownData.length : 
                            customerData.analytics.timeline?.filter(t => t.purchase_amount > 0).length || 0}
                        </div>
                        <div style={{ color: '#5891cb', fontSize: '11px' }}>
                          {timelineView === 'detailed' ? 'Transactions' : 'Active Periods'}
                        </div>
                      </div>
                    <div 
                      className="standard-kpi-tile glass-kpi-tile" 
                      onClick={(e) => showAIAssistant(e, timelineView === 'detailed' ? 'period-total' : 'timeline-total')}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(58, 68, 89, 0.5)',
                        animation: 'counterUp 0.6s ease both',
                        animationDelay: '150ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(95, 212, 214, 0.15)';
                        e.currentTarget.style.borderColor = '#5fd4d6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                      }}>
                        <div style={{ color: '#5fd4d6', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                          {timelineView === 'detailed' ? 
                            (drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0) ? 
                              formatCurrency(drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0)) : '$0') :
                            (customerData.analytics.timeline?.reduce((sum, t) => sum + (t.purchase_amount || 0), 0) ? 
                              formatCurrency(customerData.analytics.timeline.reduce((sum, t) => sum + (t.purchase_amount || 0), 0)) : '$0')}
                        </div>
                        <div style={{ color: '#5891cb', fontSize: '11px' }}>
                          {timelineView === 'detailed' ? 'Period Total' : 'Timeline Total'}
                        </div>
                      </div>
                    <div 
                      className="standard-kpi-tile glass-kpi-tile" 
                      onClick={(e) => showAIAssistant(e, timelineView === 'detailed' ? 'largest-transaction' : 'peak-purchase')}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(58, 68, 89, 0.5)',
                        animation: 'counterUp 0.6s ease both',
                        animationDelay: '300ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(233, 48, 255, 0.15)';
                        e.currentTarget.style.borderColor = '#e930ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                      }}>
                        <div style={{ color: '#e930ff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                          {timelineView === 'detailed' ? 
                            (drillDownData.length > 0 ? formatCurrency(Math.max(...drillDownData.map(t => t.amount || 0))) : '$0') :
                            (customerData.analytics.timeline?.length > 0 ? 
                              formatCurrency(Math.max(...customerData.analytics.timeline.map(t => t.purchase_amount || 0))) : '$0')}
                        </div>
                        <div style={{ color: '#5891cb', fontSize: '11px' }}>
                          {timelineView === 'detailed' ? 'Largest Transaction' : 'Peak Purchase'}
                        </div>
                      </div>
                    {timelineView === 'detailed' && (
                      <div 
                        className="standard-kpi-tile glass-kpi-tile" 
                        onClick={(e) => showAIAssistant(e, 'avg-transaction')}
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(58, 68, 89, 0.5)',
                          animation: 'counterUp 0.6s ease both',
                          animationDelay: '450ms'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(67, 202, 208, 0.15)';
                          e.currentTarget.style.borderColor = '#43cad0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
                        }}>
                          <div style={{ color: '#43cad0', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                            {drillDownData.length > 0 ? 
                              formatCurrency(drillDownData.reduce((sum, t) => sum + (t.amount || 0), 0) / drillDownData.length) : 
                              '$0'}
                          </div>
                          <div style={{ color: '#5891cb', fontSize: '11px' }}>
                            Avg Transaction
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#5891cb',
              padding: '60px 20px',
              fontSize: '16px'
            }}>
              {isLoading ? (
                <div>⏳ Loading analysis data...</div>
              ) : (
                <>
                  📊 Search for a customer to view their analysis
                  <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
                    RCF analysis and purchase timeline will appear here
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* AI Assistant Popup */}
      {renderAIAssistant()}
      
      {/* Context Menu Popup */}
      {renderContextMenu()}
    </div>
  );
};

export default CustomerSearchAnalytics;