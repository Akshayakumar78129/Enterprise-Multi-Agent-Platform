import React from "react";
import { KpiTile } from "../../../../../../ui-common/design-system/components/KpiTile";

const PurchaseFrequencyKPIs = ({ kpis, isLoading = false, onKPIClick = null, onHoverInsight = null }) => {
  if (!kpis) return null;

  const tiles = [
    {
      id: "total-customers",
      label: "Total Customers",
      value: kpis.totalCustomers || 0,
      formatter: (val) => val.toLocaleString(),
      subtitle: "Active customer base",
      variant: "default",
      icon: "👥",
      trend: null, // Can be enhanced with historical data
      onClick: (event) => onKPIClick && onKPIClick("total-customers", event),
      onMouseEnter: () => {
        try { 
          if (typeof onHoverInsight === 'function') {
            const count = kpis.totalCustomers || 0;
            onHoverInsight({ 
              title: '👥 Total Active Customers', 
              lines: [
                `Customer Base: ${count.toLocaleString()}`,
                '📊 Represents your entire active customer portfolio',
                '💡 Higher numbers indicate broader market reach',
                '🎯 Focus on retention to maintain this base',
                '📈 Track growth trends month-over-month'
              ] 
            }); 
          } 
        } catch {}
      },
      onMouseLeave: () => { try { if (typeof onHoverInsight === 'function') onHoverInsight(null); } catch {} }
    },
    {
      id: "avg-frequency",
      label: "Avg Purchase Frequency",
      value: kpis.avgPurchaseFrequency || 0,
      formatter: (val) => `${val.toFixed(2)}x`,
      subtitle: "Purchases per customer",
      variant: "frequency",
      icon: "🔄",
      miniVis: "sparkline", // Can be implemented with 6-month trend data
      alert: kpis.avgPurchaseFrequency && kpis.avgPurchaseFrequency < 2 ? "warning" : null,
      onClick: (event) => onKPIClick && onKPIClick("frequency", event),
      onMouseEnter: () => {
        try { 
          if (typeof onHoverInsight === 'function') {
            const freq = kpis.avgPurchaseFrequency || 0;
            const insight = freq < 2 ? '⚠️ Low frequency - consider engagement campaigns' :
                           freq < 5 ? '📈 Moderate frequency - upselling opportunities' :
                           freq < 10 ? '⭐ Good frequency - focus on retention' :
                           '🏆 Excellent frequency - leverage for referrals';
            onHoverInsight({ 
              title: '🔄 Average Purchase Frequency', 
              lines: [
                `Frequency: ${freq.toFixed(2)}x purchases per customer`,
                '📊 Measures customer engagement and loyalty',
                insight,
                '💡 Industry benchmark: 3-5 purchases/year is typical',
                '🎯 Higher frequency = stronger customer relationships'
              ] 
            }); 
          } 
        } catch {}
      },
      onMouseLeave: () => { try { if (typeof onHoverInsight === 'function') onHoverInsight(null); } catch {} }
    },
    {
      id: "avg-days-between",
      label: "Avg Days Between",
      value: kpis.avgDaysBetween || 0,
      formatter: (val) => `${val.toFixed(1)} days`,
      subtitle: "Purchase intervals",
      variant: "interval",
      icon: "📅",
      progress: kpis.avgDaysBetween ? Math.min((365 - kpis.avgDaysBetween) / 365 * 100, 100) : 0,
      alert: kpis.avgDaysBetween && kpis.avgDaysBetween > 180 ? "warning" : null,
      onClick: (event) => onKPIClick && onKPIClick("intervals", event),
      onMouseEnter: () => {
        try { 
          if (typeof onHoverInsight === 'function') {
            const days = kpis.avgDaysBetween || 0;
            const insight = days > 180 ? '⚠️ Long intervals - risk of customer churn' :
                           days > 90 ? '📈 Moderate intervals - re-engagement opportunities' :
                           days > 30 ? '⭐ Good intervals - healthy purchase rhythm' :
                           '🏆 Frequent purchases - highly engaged customers';
            onHoverInsight({ 
              title: '📅 Average Days Between Purchases', 
              lines: [
                `Interval: ${days.toFixed(1)} days between purchases`,
                '📊 Measures purchase rhythm and engagement',
                insight,
                '💡 Shorter intervals = higher customer engagement',
                '🎯 Use for timing marketing campaigns and reminders'
              ] 
            }); 
          } 
        } catch {}
      },
      onMouseLeave: () => { try { if (typeof onHoverInsight === 'function') onHoverInsight(null); } catch {} }
    },
    {
      id: "active-customers",
      label: "Active Customers (90d)",
      value: kpis.activeCustomerPercentage || 0,
      formatter: (val) => val.toFixed(1) + "%",
      subtitle: "Recent activity",
      variant: "percentage",
      icon: "⚡",
      gauge: {
        value: kpis.activeCustomerPercentage || 0,
        max: 100,
        color: kpis.activeCustomerPercentage && kpis.activeCustomerPercentage < 25 ? "#e930ff" : "#00e0ff"
      },
      alert: kpis.activeCustomerPercentage && kpis.activeCustomerPercentage < 25 ? "critical" : null,
      onClick: (event) => onKPIClick && onKPIClick("active", event),
      onMouseEnter: () => {
        try { 
          if (typeof onHoverInsight === 'function') {
            const pct = kpis.activeCustomerPercentage || 0;
            const insight = pct > 60 ? '🏆 Excellent customer activity - strong engagement' :
                           pct > 40 ? '⭐ Good activity levels - healthy customer base' :
                           pct > 25 ? '📈 Moderate activity - re-engagement opportunities' :
                           '⚠️ Low activity - urgent retention campaigns needed';
            onHoverInsight({ 
              title: '⚡ Active Customers (Last 90 Days)', 
              lines: [
                `Active Rate: ${pct.toFixed(1)}% of customer base`,
                '📊 Customers who made purchases in the last 90 days',
                insight,
                '💡 Active customers are more likely to make repeat purchases',
                '🎯 Target: 50%+ activity rate indicates healthy engagement'
              ] 
            }); 
          } 
        } catch {}
      },
      onMouseLeave: () => { try { if (typeof onHoverInsight === 'function') onHoverInsight(null); } catch {} }
    },
    {
      id: "high-value",
      label: "High Value Customers",
      value: kpis.highValuePercentage || 0,
      formatter: (val) => val.toFixed(1) + "%",
      subtitle: "Premium segment",
      variant: "value",
      icon: "💎",
      animation: "count-up",
      miniBar: {
        current: kpis.highValuePercentage || 0,
        previous: 0 // Can be enhanced with comparison data
      },
      onClick: (event) => onKPIClick && onKPIClick("high-value", event),
      onMouseEnter: () => {
        try { 
          if (typeof onHoverInsight === 'function') {
            const pct = kpis.highValuePercentage || 0;
            const insight = pct > 20 ? '🏆 Strong premium customer base' :
                           pct > 10 ? '⭐ Good high-value segment' :
                           pct > 5 ? '📈 Growing premium segment' :
                           '⚠️ Opportunity to develop high-value customers';
            onHoverInsight({ 
              title: '💎 High Value Customers ($1000+ spent)', 
              lines: [
                `Premium Segment: ${pct.toFixed(1)}% of customer base`,
                '📊 Customers who have spent $1,000 or more',
                insight,
                '💡 Focus on retention and VIP programs for this segment',
                '🎯 Target: 15-25% is considered healthy for most businesses'
              ] 
            }); 
          } 
        } catch {}
      },
      onMouseLeave: () => { try { if (typeof onHoverInsight === 'function') onHoverInsight(null); } catch {} }
    },
    {
      id: "avg-customer-value",
      label: "Avg Customer Value",
      value: kpis.avgCustomerValue || 0,
      formatter: (val) => `$${val.toFixed(2)}`,
      subtitle: "Total spent per customer",
      variant: "currency",
      icon: "💰",
      progress: kpis.avgCustomerValue ? Math.min((kpis.avgCustomerValue / 2000) * 100, 100) : 0,
      alert: kpis.avgCustomerValue && kpis.avgCustomerValue < 100 ? "warning" : null,
      onClick: (event) => onKPIClick && onKPIClick("customer-value", event),
      onMouseEnter: () => {
        try { 
          if (typeof onHoverInsight === 'function') {
            const value = kpis.avgCustomerValue || 0;
            const insight = value > 1000 ? '🏆 Excellent customer value - premium market' :
                           value > 500 ? '⭐ Good customer value - strong engagement' :
                           value > 200 ? '📈 Moderate customer value - growth opportunities' :
                           '⚠️ Low customer value - focus on upselling strategies';
            onHoverInsight({ 
              title: '💰 Average Customer Lifetime Value', 
              lines: [
                `Average Value: $${value.toFixed(2)} per customer`,
                '📊 Total amount spent across all purchases',
                insight,
                '💡 Higher values indicate stronger customer relationships',
                '🎯 Focus on increasing purchase frequency and order size'
              ] 
            }); 
          } 
        } catch {}
      },
      onMouseLeave: () => { try { if (typeof onHoverInsight === 'function') onHoverInsight(null); } catch {} }
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "32px",
        padding: "0"
      }}
    >
      {tiles.map((tile) => (
        <KpiTile 
          key={tile.id} 
          {...tile} 
          value={tile.formatter ? tile.formatter(tile.value) : tile.value}
          isLoading={isLoading}
          style={{
            cursor: onKPIClick ? "pointer" : "default",
            transition: "all 0.2s ease",
            ...(onKPIClick && {
              ":hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
              }
            })
          }}
        />
      ))}
    </div>
  );
};

export default PurchaseFrequencyKPIs; 