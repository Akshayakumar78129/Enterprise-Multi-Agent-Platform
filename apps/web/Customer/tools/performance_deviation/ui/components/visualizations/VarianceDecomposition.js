import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const VarianceDecomposition = ({
  data = {},
  selectedKPI = null,
  onKPISelect = null,
  showComparison = false,
  isLoading = false
}) => {
  const [selectedVarianceKPI, setSelectedVarianceKPI] = useState(selectedKPI);

  // Get available KPIs
  const availableKPIs = Object.keys(data);
  const currentKPI = selectedVarianceKPI || availableKPIs[0];

  const handleKPIChange = (kpi) => {
    setSelectedVarianceKPI(kpi);
    if (onKPISelect) {
      onKPISelect(kpi);
    }
  };

  if (isLoading) {
    return (
      <Card title="Variance Decomposition" isLoading={true}>
        <div style={{ height: "400px" }} />
      </Card>
    );
  }

  if (availableKPIs.length === 0) {
    return (
      <Card title="Variance Decomposition">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No variance data available
        </div>
      </Card>
    );
  }

  const currentData = data[currentKPI];
  if (!currentData) {
    return (
      <Card title="Variance Decomposition">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No data available for selected KPI
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Variance Decomposition"
      subtitle={`Model explanation power for ${formatKPIName(currentKPI)}`}
    >
      {/* KPI Selector */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '16px'
      }}>
        <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
          KPI:
        </label>
        <select
          value={currentKPI}
          onChange={(e) => handleKPIChange(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #3a4459',
            backgroundColor: '#232a36',
            color: '#f7f9fb',
            fontSize: '14px'
          }}
        >
          {availableKPIs.map(kpi => (
            <option key={kpi} value={kpi}>
              {formatKPIName(kpi)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: showComparison ? '1fr 1fr' : '400px 1fr',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Donut Chart */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'relative'
        }}>
          <DonutChart 
            explainedVariance={currentData.explained_variance}
            unexplainedVariance={currentData.unexplained_variance}
            totalVariance={currentData.total_variance}
            explanationPower={currentData.explanation_power}
          />
        </div>

        {/* Metrics and Details */}
        <div style={{ padding: '20px' }}>
          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <MetricCard
              label="Explanation Power"
              value={`${currentData.explanation_power.toFixed(1)}%`}
              subtitle="Model Accuracy"
              variant={getExplanationVariant(currentData.explanation_power)}
              icon="🎯"
            />
            <MetricCard
              label="Model R²"
              value={`${currentData.model_accuracy.toFixed(1)}%`}
              subtitle="Prediction Quality"
              variant={getAccuracyVariant(currentData.model_accuracy)}
              icon="📊"
            />
            <MetricCard
              label="MAE"
              value={currentData.mean_absolute_error.toFixed(2)}
              subtitle="Avg Error"
              variant="default"
              icon="📏"
            />
            <MetricCard
              label="RMSE"
              value={currentData.rmse.toFixed(2)}
              subtitle="Root Mean Sq Error"
              variant="default"
              icon="📐"
            />
          </div>

          {/* Variance Breakdown */}
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(58, 68, 89, 0.2)',
            borderRadius: '8px'
          }}>
            <h4 style={{ 
              color: '#f7f9fb', 
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Variance Breakdown
            </h4>
            
            <VarianceBar
              label="Explained Variance"
              value={currentData.explained_variance}
              total={currentData.total_variance}
              color="#00e0ff"
            />
            
            <VarianceBar
              label="Unexplained Variance"
              value={currentData.unexplained_variance}
              total={currentData.total_variance}
              color="#e930ff"
            />
            
            <div style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: 'rgba(26, 32, 56, 0.6)',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#5891cb'
            }}>
              Total Variance: {currentData.total_variance.toFixed(2)}
            </div>
          </div>

          {/* Model Quality Indicator */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: getQualityBackgroundColor(currentData.explanation_power),
            borderRadius: '8px',
            border: `2px solid ${getQualityBorderColor(currentData.explanation_power)}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>
                {getQualityIcon(currentData.explanation_power)}
              </span>
              <div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  {getQualityLabel(currentData.explanation_power)}
                </div>
                <div style={{ color: '#5891cb', fontSize: '12px' }}>
                  {getQualityDescription(currentData.explanation_power)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Stability Indicator */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: 'rgba(58, 68, 89, 0.1)',
        borderRadius: '8px'
      }}>
        <h4 style={{ 
          color: '#f7f9fb', 
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          Model Stability Over Time
        </h4>
        <TimeStabilityChart explanationPower={currentData.explanation_power} />
      </div>
    </Card>
  );
};

// Donut Chart Component
const DonutChart = ({ explainedVariance, unexplainedVariance, totalVariance, explanationPower }) => {
  const size = 300;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const explainedPercentage = totalVariance > 0 ? (explainedVariance / totalVariance) : 0;
  const explainedStroke = circumference * explainedPercentage;
  const unexplainedStroke = circumference * (1 - explainedPercentage);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#232a36"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Explained variance arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00e0ff"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${explainedStroke} ${circumference - explainedStroke}`}
          strokeLinecap="round"
        />
        
        {/* Unexplained variance arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e930ff"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${unexplainedStroke} ${circumference - unexplainedStroke}`}
          strokeDashoffset={-explainedStroke}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{
          color: '#f7f9fb',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {explanationPower.toFixed(1)}%
        </div>
        <div style={{
          color: '#5891cb',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          Explained
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, subtitle, variant, icon }) => {
  return (
    <div style={{
      padding: '12px',
      backgroundColor: 'rgba(26, 32, 56, 0.6)',
      borderRadius: '8px',
      borderLeft: `4px solid ${getVariantColor(variant)}`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px'
      }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '600' }}>
          {label}
        </span>
      </div>
      <div style={{
        color: '#f7f9fb',
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '2px'
      }}>
        {value}
      </div>
      <div style={{
        color: '#5891cb',
        fontSize: '12px'
      }}>
        {subtitle}
      </div>
    </div>
  );
};

// Variance Bar Component
const VarianceBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{ color: '#f7f9fb', fontSize: '12px' }}>{label}</span>
        <span style={{ color: '#f7f9fb', fontSize: '12px', fontWeight: '600' }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div style={{
        height: '6px',
        backgroundColor: '#232a36',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

// Time Stability Chart Component (simplified)
const TimeStabilityChart = ({ explanationPower }) => {
  // Generate simulated time series data
  const dataPoints = [];
  const baseValue = explanationPower;
  
  for (let i = 0; i < 30; i++) {
    const variation = (Math.random() - 0.5) * 10; // ±5% variation
    dataPoints.push(Math.max(0, Math.min(100, baseValue + variation)));
  }

  const maxValue = Math.max(...dataPoints);
  const minValue = Math.min(...dataPoints);

  return (
    <div style={{ height: '60px', position: 'relative' }}>
      <svg width="100%" height="60" style={{ overflow: 'visible' }}>
        <polyline
          points={dataPoints.map((point, index) => 
            `${(index / (dataPoints.length - 1)) * 100},${60 - ((point - minValue) / (maxValue - minValue)) * 40}`
          ).join(' ')}
          fill="none"
          stroke="#00e0ff"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Average line */}
        <line
          x1="0"
          y1={60 - ((explanationPower - minValue) / (maxValue - minValue)) * 40}
          x2="100"
          y2={60 - ((explanationPower - minValue) / (maxValue - minValue)) * 40}
          stroke="#5fd4d6"
          strokeWidth="1"
          strokeDasharray="3,3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '0',
        transform: 'translateY(-50%)',
        color: '#5891cb',
        fontSize: '10px'
      }}>
        Avg: {explanationPower.toFixed(1)}%
      </div>
    </div>
  );
};

// Helper functions
function formatKPIName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function getVariantColor(variant) {
  switch (variant) {
    case 'success': return '#00e0ff';
    case 'warning': return '#ffa500';
    case 'danger': return '#e930ff';
    default: return '#3a4459';
  }
}

function getExplanationVariant(power) {
  if (power >= 80) return 'success';
  if (power >= 60) return 'warning';
  return 'danger';
}

function getAccuracyVariant(accuracy) {
  if (accuracy >= 80) return 'success';
  if (accuracy >= 70) return 'warning';
  return 'danger';
}

function getQualityLabel(power) {
  if (power >= 80) return 'Excellent Model';
  if (power >= 60) return 'Good Model';
  if (power >= 40) return 'Fair Model';
  return 'Poor Model';
}

function getQualityDescription(power) {
  if (power >= 80) return 'High confidence in predictions';
  if (power >= 60) return 'Moderate confidence in predictions';
  if (power >= 40) return 'Low confidence in predictions';
  return 'Very low confidence in predictions';
}

function getQualityIcon(power) {
  if (power >= 80) return '🌟';
  if (power >= 60) return '✅';
  if (power >= 40) return '⚠️';
  return '❌';
}

function getQualityBackgroundColor(power) {
  if (power >= 80) return 'rgba(0, 224, 255, 0.1)';
  if (power >= 60) return 'rgba(255, 165, 0, 0.1)';
  return 'rgba(233, 48, 255, 0.1)';
}

function getQualityBorderColor(power) {
  if (power >= 80) return '#00e0ff';
  if (power >= 60) return '#ffa500';
  return '#e930ff';
}

export default VarianceDecomposition; 