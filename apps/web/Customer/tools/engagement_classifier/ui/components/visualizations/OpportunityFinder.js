import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const OpportunityFinder = ({ 
  opportunities = [], 
  isLoading = false, 
  onOpportunitySelect = null,
  valueThreshold = 5000,
  potentialThreshold = 60,
  onThresholdChange = null
}) => {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [thresholds, setThresholds] = useState({
    value: valueThreshold,
    potential: potentialThreshold
  });

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card title="Re-engagement Opportunity Finder" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No re-engagement opportunities available
        </div>
      </Card>
    );
  }

  // Define opportunity matrix quadrants
  const getQuadrant = (opportunity) => {
    const valueScore = opportunity.avg_customer_value > thresholds.value ? 'High' : 'Low';
    const potentialScore = opportunity.avg_days_inactive < thresholds.potential ? 'High' : 'Low';
    
    if (valueScore === 'High' && potentialScore === 'High') {
      return { name: 'Priority Re-engage', color: '#00e0ff', priority: 1 };
    } else if (valueScore === 'High' && potentialScore === 'Low') {
      return { name: 'Nurture', color: '#5fd4d6', priority: 2 };
    } else if (valueScore === 'Low' && potentialScore === 'High') {
      return { name: 'Bulk Activation', color: '#ffa726', priority: 3 };
    } else {
      return { name: 'Monitor', color: '#666', priority: 4 };
    }
  };

  // Create matrix visualization data
  const createMatrix = () => {
    return opportunities.map(opp => {
      const quadrant = getQuadrant(opp);
      const x = opp.avg_days_inactive > thresholds.potential ? 25 : 75; // Potential axis (inverted - lower days = higher potential)
      const y = opp.avg_customer_value > thresholds.value ? 75 : 25; // Value axis
      
      return {
        ...opp,
        x,
        y,
        quadrant,
        size: Math.min(Math.max(opp.customer_count / 10, 15), 60) // Bubble size based on customer count
      };
    });
  };

  const matrixData = createMatrix();

  const handleThresholdChange = (type, value) => {
    const newThresholds = { ...thresholds, [type]: value };
    setThresholds(newThresholds);
    if (onThresholdChange) {
      onThresholdChange(type, value);
    }
  };

  const handleOpportunityClick = (opportunity) => {
    setSelectedOpportunity(opportunity);
    if (onOpportunitySelect) {
      onOpportunitySelect(opportunity);
    }
  };

  const renderMatrix = () => {
    return (
      <div style={{
        width: '480px',
        height: '320px',
        position: 'relative',
        border: '1px solid #3a4459',
        borderRadius: '8px',
        backgroundColor: '#1a1f2e',
        margin: '0 auto 24px'
      }}>
        {/* Quadrant labels */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          fontSize: '12px',
          color: '#5891cb',
          fontWeight: '500'
        }}>
          Nurture
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '12px',
          color: '#00e0ff',
          fontWeight: '500'
        }}>
          Priority Re-engage
        </div>
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          fontSize: '12px',
          color: '#666',
          fontWeight: '500'
        }}>
          Monitor
        </div>
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          fontSize: '12px',
          color: '#ffa726',
          fontWeight: '500'
        }}>
          Bulk Activation
        </div>

        {/* Quadrant dividers */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          right: '0',
          height: '1px',
          backgroundColor: '#f7f9fb',
          opacity: 0.3,
          borderStyle: 'dashed'
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '0',
          bottom: '0',
          width: '1px',
          backgroundColor: '#f7f9fb',
          opacity: 0.3,
          borderStyle: 'dashed'
        }} />

        {/* Axis labels */}
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#f7f9fb',
          fontWeight: '500'
        }}>
          Engagement Potential (Days Inactive) →
        </div>
        <div style={{
          position: 'absolute',
          left: '-80px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          fontSize: '12px',
          color: '#f7f9fb',
          fontWeight: '500'
        }}>
          Customer Value →
        </div>

        {/* Data points (bubbles) */}
        {matrixData.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${100 - item.y}%`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              backgroundColor: item.quadrant.color,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              opacity: selectedOpportunity === item ? 1 : 0.8,
              border: selectedOpportunity === item ? '3px solid #f7f9fb' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#f7f9fb',
              fontWeight: '600'
            }}
            onClick={() => handleOpportunityClick(item)}
            title={`${item.opportunity_type}\nCustomers: ${item.customer_count}\nAvg Value: $${Math.round(item.avg_customer_value)}\nDays Inactive: ${Math.round(item.avg_days_inactive)}`}
          >
            {item.customer_count}
          </div>
        ))}
      </div>
    );
  };

  const renderOpportunityCards = () => {
    // Sort opportunities by priority and customer count
    const sortedOpportunities = [...opportunities].sort((a, b) => {
      const aQuadrant = getQuadrant(a);
      const bQuadrant = getQuadrant(b);
      if (aQuadrant.priority !== bQuadrant.priority) {
        return aQuadrant.priority - bQuadrant.priority;
      }
      return b.customer_count - a.customer_count;
    });

    return sortedOpportunities.slice(0, 3).map((opp, index) => {
      const quadrant = getQuadrant(opp);
      const isSelected = selectedOpportunity === opp;
      
      return (
        <div
          key={index}
          style={{
            width: '320px',
            minHeight: '160px',
            background: `linear-gradient(135deg, #232a36 0%, #2c3341 100%)`,
            borderLeft: `4px solid ${quadrant.color}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            cursor: 'pointer',
            border: isSelected ? `1px solid ${quadrant.color}` : '1px solid #3a4459',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={() => handleOpportunityClick(opp)}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#f7f9fb',
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              {opp.opportunity_type}
            </h4>
            <span style={{
              fontSize: '12px',
              color: quadrant.color,
              fontWeight: '500',
              padding: '4px 8px',
              backgroundColor: `${quadrant.color}20`,
              borderRadius: '4px'
            }}>
              {quadrant.name}
            </span>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '14px',
            color: '#f7f9fb',
            opacity: 0.9,
            margin: '0 0 12px 0',
            lineHeight: 1.4,
            fontFamily: 'Inter, sans-serif'
          }}>
            {opp.customer_count.toLocaleString()} customers with{' '}
            <span style={{ color: quadrant.color, fontWeight: '500' }}>
              {opp.value_tier.toLowerCase()} value potential
            </span>
          </p>

          {/* Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#5891cb', marginBottom: '2px' }}>
                Avg Customer Value
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f7f9fb' }}>
                ${Math.round(opp.avg_customer_value).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#5891cb', marginBottom: '2px' }}>
                Days Inactive
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f7f9fb' }}>
                {Math.round(opp.avg_days_inactive)}
              </div>
            </div>
          </div>

          {/* Action button */}
          <button style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#00e0ff',
            color: '#0a1224',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            Create Campaign
          </button>
        </div>
      );
    });
  };

  return (
    <Card 
      title="Re-engagement Opportunity Finder" 
      subtitle="Identify high-value re-engagement targets"
      isLoading={isLoading}
    >
      <div style={{ padding: '16px' }}>
        {/* Threshold Controls */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#232a36',
          borderRadius: '8px',
          border: '1px solid #3a4459'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#f7f9fb',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Value Threshold: ${thresholds.value.toLocaleString()}
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={thresholds.value}
              onChange={(e) => handleThresholdChange('value', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#3a4459',
                borderRadius: '3px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#f7f9fb',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Potential Threshold: {thresholds.potential} days
            </label>
            <input
              type="range"
              min="30"
              max="180"
              step="10"
              value={thresholds.potential}
              onChange={(e) => handleThresholdChange('potential', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#3a4459',
                borderRadius: '3px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Matrix Visualization */}
          <div>
            {renderMatrix()}
          </div>

          {/* Opportunity Cards */}
          <div>
            {renderOpportunityCards()}
          </div>
        </div>

        {/* Summary Statistics */}
        {selectedOpportunity && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#232a36',
            borderRadius: '8px',
            border: `1px solid ${getQuadrant(selectedOpportunity).color}`
          }}>
            <h4 style={{
              fontSize: '16px',
              color: '#f7f9fb',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Selected Opportunity: {selectedOpportunity.opportunity_type}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Customer Count</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  {selectedOpportunity.customer_count.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Avg Customer Value</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  ${Math.round(selectedOpportunity.avg_customer_value).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Days Inactive</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  {Math.round(selectedOpportunity.avg_days_inactive)}
                </div>
              </div>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Total Opportunity</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  ${Math.round(selectedOpportunity.avg_customer_value * selectedOpportunity.customer_count).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OpportunityFinder; 