import React, { useState } from 'react';

interface ProfessionalContextDisplayProps {
  context: any;
  position?: { x: number; y: number };
  onClose?: () => void;
}

export const ProfessionalContextDisplay: React.FC<ProfessionalContextDisplayProps> = ({ 
  context, 
  position,
  onClose 
}) => {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  
  // Extract relevant metrics from context
  let spendValue = 0;
  let loyaltyValue = 0;
  let recencyValue = 0;
  let churnRisk = 0;
  
  // Try to extract metrics based on context type
  if (context.customerData) {
    spendValue = context.customerData.avg_order_value || context.customerData.total_spent || 0;
    loyaltyValue = context.customerData.loyalty_score || 0;
    recencyValue = context.customerData.days_since_last_purchase || context.customerData.recency || 0;
    churnRisk = context.customerData.churn_probability || 0;
  } else if (context.metrics) {
    spendValue = context.metrics.avgSpend || context.metrics.spend || 0;
    loyaltyValue = context.metrics.loyalty || 0;
    recencyValue = context.metrics.recency || 0;
    churnRisk = context.metrics.churnRisk || 0;
  } else if (context.label && context.value) {
    // Parse from label/value
    const label = context.label.toLowerCase();
    const value = parseFloat(context.value) || 0;
    
    if (label.includes('spend') || label.includes('revenue')) {
      spendValue = value;
    } else if (label.includes('loyalty') || label.includes('retention')) {
      loyaltyValue = value;
    } else if (label.includes('recency') || label.includes('days')) {
      recencyValue = value;
    } else if (label.includes('churn') || label.includes('risk')) {
      churnRisk = value;
    }
  }
  
  // Apply threshold-based mapping
  const spendTier = spendValue > 250 ? 'High Spend' : 
                   spendValue >= 150 ? 'Medium Spend' : 'Low Spend';
  
  const loyaltyTier = loyaltyValue >= 75 ? 'Loyal' : 'At Risk';
  
  const activityStatus = recencyValue <= 7 ? 'Active' :
                        recencyValue <= 20 ? 'Semi-Active' :
                        recencyValue <= 30 ? 'Inactive' : 'Dormant';
  const activityDays = recencyValue > 30 ? '30d+' : `${Math.round(recencyValue)}d`;
  
  // Color schemes for dark theme with high contrast
  const spendColor = spendValue > 250 ? '#4FC3F7' : spendValue >= 150 ? '#29B6F6' : '#0288D1';
  const loyaltyColor = loyaltyTier === 'Loyal' ? '#66BB6A' : '#FFA726';
  const activityColor = activityStatus === 'Active' ? '#66BB6A' : 
                       activityStatus === 'Semi-Active' ? '#FFD600' :
                       activityStatus === 'Inactive' ? '#FFA726' : '#EF5350';
  
  return (
    <div style={{
      position: 'fixed',
      left: position?.x || window.innerWidth / 2,
      top: position?.y || window.innerHeight / 2,
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #1e2738 0%, #2a3447 50%, #1e2738 100%)',
      border: '2px solid rgba(79, 195, 247, 0.3)',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 60px rgba(79, 195, 247, 0.1)',
      zIndex: 10000,
      minWidth: 320,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <span style={{ 
          color: '#4FC3F7', 
          fontSize: 14, 
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Customer Profile
        </span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 20,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Main content with tags */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Spend Tag */}
        <div
          onMouseEnter={() => setHoveredTag('spend')}
          onMouseLeave={() => setHoveredTag(null)}
          style={{
            position: 'relative',
            padding: '8px 14px',
            background: `linear-gradient(135deg, ${spendColor}15, ${spendColor}25)`,
            border: `1.5px solid ${spendColor}`,
            borderRadius: 8,
            cursor: 'help',
            transition: 'all 0.3s',
            transform: hoveredTag === 'spend' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <span style={{
            color: spendColor,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.5
          }}>
            {spendTier}
          </span>
          {hoveredTag === 'spend' && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.95)',
              border: `1px solid ${spendColor}`,
              borderRadius: 6,
              whiteSpace: 'nowrap',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              Avg Spend: ${spendValue.toFixed(2)}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${spendColor}`,
              }} />
            </div>
          )}
        </div>
        
        <span style={{ color: '#64748b', fontSize: 20, fontWeight: 300 }}>|</span>
        
        {/* Loyalty Tag */}
        <div
          onMouseEnter={() => setHoveredTag('loyalty')}
          onMouseLeave={() => setHoveredTag(null)}
          style={{
            position: 'relative',
            padding: '8px 14px',
            background: `linear-gradient(135deg, ${loyaltyColor}15, ${loyaltyColor}25)`,
            border: `1.5px solid ${loyaltyColor}`,
            borderRadius: 8,
            cursor: 'help',
            transition: 'all 0.3s',
            transform: hoveredTag === 'loyalty' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <span style={{
            color: loyaltyColor,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.5
          }}>
            {loyaltyTier}
          </span>
          {hoveredTag === 'loyalty' && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.95)',
              border: `1px solid ${loyaltyColor}`,
              borderRadius: 6,
              whiteSpace: 'nowrap',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              Loyalty Score: {loyaltyValue.toFixed(0)}%
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${loyaltyColor}`,
              }} />
            </div>
          )}
        </div>
        
        <span style={{ color: '#64748b', fontSize: 20, fontWeight: 300 }}>|</span>
        
        {/* Activity Tag */}
        <div
          onMouseEnter={() => setHoveredTag('activity')}
          onMouseLeave={() => setHoveredTag(null)}
          style={{
            position: 'relative',
            padding: '8px 14px',
            background: `linear-gradient(135deg, ${activityColor}15, ${activityColor}25)`,
            border: `1.5px solid ${activityColor}`,
            borderRadius: 8,
            cursor: 'help',
            transition: 'all 0.3s',
            transform: hoveredTag === 'activity' ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          <span style={{
            color: activityColor,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.5
          }}>
            {activityStatus} ({activityDays})
          </span>
          {hoveredTag === 'activity' && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.95)',
              border: `1px solid ${activityColor}`,
              borderRadius: 6,
              whiteSpace: 'nowrap',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}>
              Last Purchase: {Math.round(recencyValue)} days ago
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${activityColor}`,
              }} />
            </div>
          )}
        </div>
      </div>
      
      {/* Additional risk indicator if available */}
      {churnRisk > 0 && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Churn Risk:
            </span>
            <div style={{
              flex: 1,
              height: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${churnRisk}%`,
                height: '100%',
                background: `linear-gradient(90deg, 
                  ${churnRisk < 30 ? '#66BB6A' : churnRisk < 60 ? '#FFA726' : '#EF5350'} 0%, 
                  ${churnRisk < 30 ? '#4CAF50' : churnRisk < 60 ? '#FF9800' : '#F44336'} 100%)`,
                borderRadius: 3,
                transition: 'width 0.5s'
              }} />
            </div>
            <span style={{
              color: churnRisk < 30 ? '#66BB6A' : churnRisk < 60 ? '#FFA726' : '#EF5350',
              fontSize: 14,
              fontWeight: 700
            }}>
              {churnRisk.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalContextDisplay;