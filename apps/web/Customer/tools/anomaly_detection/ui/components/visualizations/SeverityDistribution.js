import React, { useState } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const SeverityDistribution = ({ 
  severityData = [], 
  isLoading = false,
  onSeverityClick = null 
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [thresholdLevel, setThresholdLevel] = useState(3);

  if (!severityData || severityData.length === 0) {
    return (
      <Card title="Anomaly Severity Distribution" isLoading={isLoading}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '300px',
          color: '#5891cb'
        }}>
          No anomaly data available
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...severityData.map(d => d.count));
  const totalCount = severityData.reduce((sum, d) => sum + d.count, 0);

  const handleLevelClick = (level) => {
    setSelectedSeverity(level === selectedSeverity ? null : level);
    if (onSeverityClick) {
      onSeverityClick(level);
    }
  };

  const handleThresholdChange = (newThreshold) => {
    setThresholdLevel(newThreshold);
  };

  const pyramidStyle = {
    display: 'flex',
    flexDirection: 'column-reverse',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '24px'
  };

  const legendStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '16px',
    borderRadius: '8px',
    background: 'linear-gradient(to right, #00e0ff, #5fd4d6, #5891cb, #aa45dd, #e930ff)',
    margin: '16px 0',
    position: 'relative'
  };

  const controlsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#232a36',
    borderRadius: '8px'
  };

  return (
    <Card 
      title="Anomaly Severity Distribution" 
      subtitle={`${totalCount} total anomalies detected`}
      isLoading={isLoading}
      style={{ minHeight: '400px' }}
    >
      <div style={pyramidStyle}>
        {severityData
          .sort((a, b) => a.level - b.level)
          .map((severity) => {
            const widthPercentage = (severity.count / maxCount) * 100;
            const isSelected = selectedSeverity === severity.level;
            const isAboveThreshold = severity.level >= thresholdLevel;
            
            return (
              <div
                key={severity.level}
                onClick={() => handleLevelClick(severity.level)}
                style={{
                  width: `${Math.max(widthPercentage, 10)}%`,
                  height: '60px',
                  backgroundColor: severity.color,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #f7f9fb' : '1px solid transparent',
                  boxShadow: isAboveThreshold ? '0 0 8px rgba(233, 48, 255, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  opacity: selectedSeverity && !isSelected ? 0.4 : 1,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = `0 0 12px ${severity.color}40`;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = isAboveThreshold ? '0 0 8px rgba(233, 48, 255, 0.3)' : 'none';
                  }
                }}
              >
                <div style={{
                  textAlign: 'center',
                  color: '#f7f9fb',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '2px' }}>
                    {severity.count.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {severity.percentage.toFixed(1)}%
                  </div>
                </div>
                
                {/* Severity level indicator */}
                <div style={{
                  position: 'absolute',
                  left: '8px',
                  top: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#f7f9fb',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  L{severity.level}
                </div>
              </div>
            );
          })
        }
      </div>

      {/* Legend with scale */}
      <div style={legendStyle}>
        <span style={{
          position: 'absolute',
          left: '0',
          fontSize: '12px',
          color: '#f7f9fb',
          backgroundColor: '#232a36',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          1
        </span>
        <span style={{
          position: 'absolute',
          right: '0',
          fontSize: '12px',
          color: '#f7f9fb',
          backgroundColor: '#232a36',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          5
        </span>
        
        {/* Threshold marker */}
        <div style={{
          position: 'absolute',
          left: `${((thresholdLevel - 1) / 4) * 100}%`,
          top: '-24px',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          color: '#e930ff',
          fontWeight: 'bold'
        }}>
          Threshold
          <div style={{
            width: '2px',
            height: '20px',
            backgroundColor: '#e930ff',
            margin: '2px auto'
          }} />
        </div>
      </div>

      {/* Controls */}
      <div style={controlsStyle}>
        <div>
          <label style={{
            fontSize: '12px',
            color: '#f7f9fb',
            marginRight: '8px'
          }}>
            Significance Threshold:
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={thresholdLevel}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            style={{
              marginRight: '8px',
              accentColor: '#00e0ff'
            }}
          />
          <span style={{
            fontSize: '12px',
            color: '#00e0ff',
            fontWeight: 'bold'
          }}>
            Level {thresholdLevel}
          </span>
        </div>

        <div>
          <select
            onChange={(e) => {
              // Handle time window change
              console.log('Time window changed:', e.target.value);
            }}
            style={{
              backgroundColor: '#3a4459',
              border: '1px solid #5891cb',
              borderRadius: '4px',
              color: '#f7f9fb',
              padding: '4px 8px',
              fontSize: '12px'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#2c3341',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00e0ff' }}>
            {severityData.filter(s => s.level >= thresholdLevel).reduce((sum, s) => sum + s.count, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>
            Above Threshold
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e930ff' }}>
            {severityData.filter(s => s.level >= 4).reduce((sum, s) => sum + s.count, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>
            Critical (4-5)
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#5891cb' }}>
            {((severityData.reduce((sum, s) => sum + (s.level * s.count), 0) / totalCount) || 0).toFixed(1)}
          </div>
          <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>
            Avg Severity
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SeverityDistribution; 