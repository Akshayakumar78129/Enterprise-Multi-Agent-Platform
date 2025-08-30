import React, { useState } from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";
import styles from './TransactionKPITiles.module.css';

const TransactionKPITiles = ({ kpis, isLoading = false, onTileClick = null, selectedPoints = [] }) => {
  const [hoveredTile, setHoveredTile] = useState(null);
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });
  if (!kpis) return null;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Generate dynamic insights based on KPI values
  const generateInsights = (kpis) => {
    const insights = {};
    
    // Total Transactions Insights
    const totalTx = kpis.totalTransactions || 0;
    if (totalTx > 10000) {
      insights.totalTransactions = "🚀 High Volume: Your business is processing significant transaction volumes, indicating strong market presence and customer engagement.";
    } else if (totalTx > 5000) {
      insights.totalTransactions = "📈 Growing Business: Solid transaction volume suggests healthy business growth with room for expansion.";
    } else if (totalTx > 1000) {
      insights.totalTransactions = "🌱 Emerging Business: Building momentum with steady transaction flow. Focus on customer acquisition strategies.";
    } else {
      insights.totalTransactions = "🎯 Early Stage: Low transaction volume presents opportunities for growth through marketing and customer outreach.";
    }

    // Anomaly Rate Insights
    const anomalyRate = kpis.anomalyRate || 0;
    if (anomalyRate > 10) {
      insights.anomalyRate = "🚨 High Risk: Elevated anomaly rate requires immediate attention. Review fraud detection systems and data quality.";
    } else if (anomalyRate > 5) {
      insights.anomalyRate = "⚠️ Monitor Closely: Above-normal anomaly rate. Investigate patterns and strengthen security measures.";
    } else if (anomalyRate > 2) {
      insights.anomalyRate = "✅ Normal Range: Healthy anomaly rate indicates good system integrity with standard security protocols working.";
    } else {
      insights.anomalyRate = "🛡️ Excellent Security: Very low anomaly rate suggests robust fraud prevention and high data quality.";
    }

    // Peak Hour Insights
    const peakHour = kpis.peakHour || 12;
    if (peakHour >= 9 && peakHour <= 17) {
      insights.peakHour = "💼 Business Hours Peak: Peak activity during standard business hours. Optimize staff scheduling and system capacity.";
    } else if (peakHour >= 18 && peakHour <= 22) {
      insights.peakHour = "🌆 Evening Rush: Peak activity in evening hours. Consider extended support hours and targeted marketing.";
    } else if (peakHour >= 6 && peakHour <= 8) {
      insights.peakHour = "🌅 Early Bird Activity: Morning peak suggests professional or commuter customer base. Optimize for mobile experience.";
    } else {
      insights.peakHour = "🌙 Off-Hours Peak: Unusual peak timing may indicate global customers or specific use cases. Analyze geographic patterns.";
    }

    // Payment Method Insights
    const topPaymentPerc = kpis.topPaymentPercentage || 0;
    if (topPaymentPerc > 80) {
      insights.topPaymentMethod = "⚠️ High Concentration: Over-dependence on single payment method creates risk. Diversify payment options.";
    } else if (topPaymentPerc > 60) {
      insights.topPaymentMethod = "📊 Dominant Method: Strong preference for one payment type. Monitor for changes and offer alternatives.";
    } else if (topPaymentPerc > 40) {
      insights.topPaymentMethod = "⚖️ Balanced Mix: Good payment method distribution reduces risk and improves customer satisfaction.";
    } else {
      insights.topPaymentMethod = "🎯 Highly Diversified: Excellent payment method diversity provides flexibility and reduces dependency risk.";
    }

    // Average Transaction Insights
    const avgAmount = kpis.avgAmount || 0;
    if (avgAmount > 500) {
      insights.avgTransaction = "💎 Premium Market: High average transaction value indicates premium positioning and affluent customer base.";
    } else if (avgAmount > 100) {
      insights.avgTransaction = "💰 Strong Value: Healthy average transaction size suggests effective pricing and customer spending power.";
    } else if (avgAmount > 25) {
      insights.avgTransaction = "📈 Growth Opportunity: Moderate transaction values present upselling and cross-selling opportunities.";
    } else {
      insights.avgTransaction = "🎯 Volume Focus: Low average values suggest volume-based business model. Consider bundling strategies.";
    }

    // Product Diversity Insights
    const uniqueItems = kpis.uniqueItems || 0;
    if (uniqueItems > 1000) {
      insights.productDiversity = "🏪 Extensive Catalog: Large product portfolio provides multiple revenue streams and market resilience.";
    } else if (uniqueItems > 100) {
      insights.productDiversity = "📦 Diverse Offering: Good product variety reduces risk and appeals to broader customer segments.";
    } else if (uniqueItems > 20) {
      insights.productDiversity = "🎯 Focused Range: Moderate product diversity allows for specialization while maintaining some variety.";
    } else {
      insights.productDiversity = "🔍 Niche Focus: Limited product range suggests specialized business model. Consider expansion opportunities.";
    }

    return insights;
  };

  const insights = generateInsights(kpis);

  const handleTileClick = (tileIndex, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setInsightPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setHoveredTile(prev => (prev === tileIndex ? null : tileIndex));
  };

  const tiles = [
    {
      label: "Total Transactions",
      displayValue: formatNumber(kpis.totalTransactions || 0),
      subtitle: `${formatCurrency(kpis.totalAmount || 0)} total value`,
      variant: "default",
      icon: "💳",
      trend: 8.5,
      trendDirection: "up",
      onClick: (event) => { onTileClick && onTileClick(event); },
      tooltip: "Total number of completed transactions processed in your system.\nThis metric indicates overall business activity and customer engagement levels.\nHigher volumes suggest strong market demand and operational efficiency.\nClick to analyze transaction volume patterns, seasonal trends, and growth opportunities.",
      insight: insights.totalTransactions
    },
    {
      label: "Anomaly Rate",
      displayValue: `${(kpis.anomalyRate || 0).toFixed(2)}%`,
      subtitle: "Unusual transactions detected",
      variant: kpis.anomalyRate > 10 ? "warning" : "default",
      icon: "⚠️",
      trend: -2.3,
      trendDirection: "down",
      onClick: (event) => { onTileClick && onTileClick(event); },
      tooltip: "Percentage of transactions flagged as unusual, suspicious, or outside normal patterns.\nNormal rates are typically 1-5%. Higher rates may indicate fraud, system errors, or data quality issues.\nMonitor this closely as it directly impacts customer trust and financial security.\nClick to investigate specific anomalies and implement preventive measures.",
      insight: insights.anomalyRate
    },
    {
      label: "Peak Hour",
      displayValue: formatHour(kpis.peakHour || 12),
      subtitle: "Highest transaction volume",
      variant: "default",
      icon: "⏰",
      trend: 0,
      trendDirection: "neutral",
      onClick: (event) => { onTileClick && onTileClick(event); },
      tooltip: "The hour of the day when your business experiences the highest transaction volume.\nThis critical insight helps optimize staff scheduling, system capacity, and marketing campaigns.\nUnderstanding peak hours enables better resource allocation and improved customer experience.\nClick to analyze hourly patterns, identify opportunities for load balancing, and plan operational strategies.",
      insight: insights.peakHour
    },
    {
      label: "Top Payment Method",
      displayValue: kpis.topPaymentMethod || 'Standard',
      subtitle: `${(kpis.topPaymentPercentage || 0).toFixed(1)}% of all transactions`,
      variant: "default",
      icon: "💼",
      trend: 12.7,
      trendDirection: "up",
      onClick: (event) => { onTileClick && onTileClick(event); },
      tooltip: "The payment method most frequently chosen by your customers.\nThis reveals customer preferences and potential business risks from over-dependence on single channels.\nDiversified payment options improve customer satisfaction and reduce transaction failures.\nClick to analyze payment method trends, identify gaps in your offering, and optimize checkout experiences.",
      insight: insights.topPaymentMethod
    },
    {
      label: "Avg Transaction",
      displayValue: formatCurrency(kpis.avgAmount || 0),
      subtitle: `Across ${formatNumber(kpis.uniqueCustomers || 0)} customers`,
      variant: "default",
      icon: "📊",
      trend: 5.8,
      trendDirection: "up",
      onClick: (event) => { onTileClick && onTileClick(event); },
      tooltip: "Average monetary value per transaction across all customers and products.\nThis key profitability metric reflects customer spending power, pricing strategy effectiveness, and market positioning.\nIncreasing averages suggest successful upselling or premium positioning, while decreases may indicate competitive pressure.\nClick to analyze spending patterns, identify high-value customer segments, and develop revenue optimization strategies.",
      insight: insights.avgTransaction
    },
    {
      label: "Product Diversity",
      displayValue: formatNumber(kpis.uniqueItems || 0),
      subtitle: "Unique items sold",
      variant: "default",
      icon: "📦",
      trend: 15.2,
      trendDirection: "up",
      onClick: (event) => { onTileClick && onTileClick(event); },
      tooltip: "Total number of unique products or services sold across all transactions.\nHigher diversity indicates broader market appeal, reduced dependency risk, and stronger competitive positioning.\nDiverse offerings provide multiple revenue streams and better resilience against market fluctuations.\nClick to analyze product performance, identify bestsellers and underperformers, and optimize your product portfolio strategy.",
      insight: insights.productDiversity
    }
  ];

  return (
    <div className={styles['kpi-grid']} style={{ position: 'relative' }}>
      {tiles.map((tile, index) => (
        <div
          key={index}
          onClick={(e) => handleTileClick(index, e)}
          style={{ position: 'relative' }}
        >
          <KpiTile 
            label={tile.label}
            value={tile.displayValue}
            subValue={tile.subtitle}
            icon={tile.icon}
            isLoading={isLoading}
            className={styles['kpi-tile-custom']}
            title={tile.tooltip}
            onClick={tile.onClick}
            style={selectedPoints.some(p => p.chartId==='kpi' && p.index===0 && tile.label==='Total Transactions') ? { outline: '2px solid #39ff14', boxShadow: '0 0 18px rgba(57,255,20,0.4)', borderRadius: 12 } : undefined}
          />
        </div>
      ))}
      
      {/* Insight Overlay */}
      {hoveredTile !== null && (
        <div 
          className={styles['insight-overlay']}
          style={{
            position: 'fixed',
            left: insightPosition.x,
            top: insightPosition.y,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
          onClick={(e) => { e.stopPropagation(); setHoveredTile(null); }}
        >
          <div className={styles['insight-content']}>
            {tiles[hoveredTile]?.insight}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionKPITiles; 