import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const EngagementPyramid = ({ 
  distribution = [], 
  isLoading = false, 
  onLevelClick = null,
  selectedLevel = null,
  showPercentages = false 
}) => {
  const [hoveredLevel, setHoveredLevel] = useState(null);

  if (!distribution || distribution.length === 0) {
    return (
      <Card title="Engagement Distribution Pyramid" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "480px",
            color: "#5891cb",
          }}
        >
          No engagement data available
        </div>
      </Card>
    );
  }

  // Sort distribution by engagement level (High, Medium, Low)
  const sortedDistribution = [...distribution].sort((a, b) => {
    const order = { 'High': 1, 'Medium': 2, 'Low': 3 };
    return order[a.engagement_level] - order[b.engagement_level];
  });

  // Calculate total for percentages
  const totalCustomers = sortedDistribution.reduce((sum, item) => sum + item.customer_count, 0);

  // Define tier configurations
  const tierConfigs = {
    'High': {
      color: '#00e0ff',
      icon: '🔥',
      width: '480px',
      height: '120px',
      label: 'High Engagement'
    },
    'Medium': {
      color: '#5fd4d6',
      icon: '⚡',
      width: '520px',
      height: '140px',
      label: 'Medium Engagement'
    },
    'Low': {
      color: '#e930ff',
      icon: '🔋',
      width: '560px',
      height: '160px',
      label: 'Low Engagement'
    }
  };

  const handleTierClick = (level) => {
    if (onLevelClick) {
      onLevelClick(level);
    }
  };

  const handleTierHover = (level) => {
    setHoveredLevel(level);
  };

  const renderTier = (tierData) => {
    const config = tierConfigs[tierData.engagement_level];
    const percentage = totalCustomers > 0 ? ((tierData.customer_count / totalCustomers) * 100).toFixed(1) : 0;
    const isSelected = selectedLevel === tierData.engagement_level;
    const isHovered = hoveredLevel === tierData.engagement_level;

    return (
      <div
        key={tierData.engagement_level}
        style={{
          width: config.width,
          height: config.height,
          backgroundColor: isSelected || isHovered ? config.color : `${config.color}80`,
          border: `2px solid ${isSelected ? '#f7f9fb' : config.color}`,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '4px auto',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isSelected ? '0 4px 16px rgba(0, 224, 255, 0.3)' : 'none',
          position: 'relative'
        }}
        onClick={() => handleTierClick(tierData.engagement_level)}
        onMouseEnter={() => handleTierHover(tierData.engagement_level)}
        onMouseLeave={() => handleTierHover(null)}
      >
        {/* Tier Icon */}
        <div style={{
          fontSize: '24px',
          marginBottom: '8px'
        }}>
          {config.icon}
        </div>

        {/* Customer Count */}
        <div style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#f7f9fb',
          fontFamily: 'Inter, sans-serif'
        }}>
          {tierData.customer_count.toLocaleString()}
        </div>

        {/* Percentage */}
        <div style={{
          fontSize: '16px',
          color: '#f7f9fb',
          opacity: 0.9,
          fontFamily: 'Inter, sans-serif'
        }}>
          {percentage}%
        </div>

        {/* Level Label */}
        <div style={{
          fontSize: '14px',
          color: '#f7f9fb',
          marginTop: '4px',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }}>
          {config.label}
        </div>

        {/* Key Metric */}
        <div style={{
          fontSize: '12px',
          color: '#f7f9fb',
          opacity: 0.8,
          marginTop: '4px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Avg: {Math.round(tierData.avg_days_since_activity || 0)} days
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            backgroundColor: '#00e0ff',
            borderRadius: '50%',
            border: '2px solid #f7f9fb'
          }} />
        )}
      </div>
    );
  };

  const renderConnectorLine = (index) => {
    if (index === sortedDistribution.length - 1) return null;
    
    return (
      <div
        key={`connector-${index}`}
        style={{
          width: '2px',
          height: '24px',
          backgroundColor: '#3a4459',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* Animated dots showing customer movement */}
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          backgroundColor: '#00e0ff',
          borderRadius: '50%',
          left: '-2px',
          top: '4px',
          animation: 'float 2s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          backgroundColor: '#5fd4d6',
          borderRadius: '50%',
          left: '-1px',
          top: '14px',
          animation: 'float 2s ease-in-out infinite 0.5s'
        }} />
      </div>
    );
  };

  return (
    <Card 
      title="Engagement Distribution Pyramid" 
      subtitle={`${totalCustomers.toLocaleString()} total customers`}
      isLoading={isLoading}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        minHeight: '480px',
        position: 'relative'
      }}>
        {/* Threshold indicators */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '12px',
          color: '#5891cb'
        }}>
          <div>≤30 days: High</div>
          <div>31-90 days: Medium</div>
          <div>{'>'}90 days: Low</div>
        </div>

        {/* Pyramid structure */}
        {sortedDistribution.map((tierData, index) => (
          <React.Fragment key={tierData.engagement_level}>
            {renderTier(tierData)}
            {renderConnectorLine(index)}
          </React.Fragment>
        ))}

        {/* Summary stats */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          fontSize: '14px',
          color: '#5891cb'
        }}>
          {sortedDistribution.map(tier => {
            const percentage = totalCustomers > 0 ? ((tier.customer_count / totalCustomers) * 100).toFixed(1) : 0;
            return (
              <div key={tier.engagement_level} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', color: tierConfigs[tier.engagement_level].color }}>
                  {tier.engagement_level}
                </div>
                <div>Avg Purchase: ${Math.round(tier.avg_purchase_value || 0)}</div>
                <div>Avg Transactions: {Math.round(tier.avg_transactions || 0)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-8px); opacity: 0.7; }
        }
      `}</style>
    </Card>
  );
};

export default EngagementPyramid; 