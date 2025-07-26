import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const FeatureContributionPlot = ({ 
  anomalies = [], 
  featureContributions = [],
  isLoading = false,
  onPointClick = null,
  onFeatureSelect = null 
}) => {
  const [selectedXFeature, setSelectedXFeature] = useState('anomalyScore');
  const [selectedYFeature, setSelectedYFeature] = useState('transactionCount');
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState(false);

  const availableFeatures = [
    { key: 'anomalyScore', label: 'Anomaly Score' },
    { key: 'transactionCount', label: 'Transaction Count' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'avgAmount', label: 'Average Amount' },
    { key: 'severity', label: 'Severity Level' }
  ];

  useEffect(() => {
    if (onFeatureSelect) {
      onFeatureSelect({ x: selectedXFeature, y: selectedYFeature });
    }
  }, [selectedXFeature, selectedYFeature, onFeatureSelect]);

  const prepareScatterData = () => {
    if (!anomalies || anomalies.length === 0) return [];

    const traces = [];
    
    // Group by severity for different colors
    const severityGroups = {
      1: { data: [], color: '#00e0ff', name: 'Severity 1' },
      2: { data: [], color: '#5fd4d6', name: 'Severity 2' },
      3: { data: [], color: '#5891cb', name: 'Severity 3' },
      4: { data: [], color: '#aa45dd', name: 'Severity 4' },
      5: { data: [], color: '#e930ff', name: 'Severity 5' }
    };

    anomalies.forEach((anomaly, index) => {
      const xValue = getFeatureValue(anomaly, selectedXFeature);
      const yValue = getFeatureValue(anomaly, selectedYFeature);
      
      if (xValue !== null && yValue !== null) {
        severityGroups[anomaly.severity].data.push({
          x: xValue,
          y: yValue,
          customdata: {
            customerId: anomaly.customerId,
            customerName: anomaly.customerName,
            anomalyScore: anomaly.anomalyScore,
            severity: anomaly.severity,
            region: anomaly.region,
            index: index
          }
        });
      }
    });

    // Create traces for each severity level
    Object.entries(severityGroups).forEach(([severity, group]) => {
      if (group.data.length > 0) {
        traces.push({
          x: group.data.map(d => d.x),
          y: group.data.map(d => d.y),
          mode: 'markers',
          type: 'scatter',
          name: group.name,
          marker: {
            color: group.color,
            size: group.data.map(d => Math.max(8, d.customdata.severity * 2 + 6)),
            opacity: 0.7,
            line: {
              width: 1,
              color: '#f7f9fb'
            }
          },
          customdata: group.data.map(d => d.customdata),
          hovertemplate: `
            <b>%{customdata.customerName}</b><br>
            ${getFeatureLabel(selectedXFeature)}: %{x}<br>
            ${getFeatureLabel(selectedYFeature)}: %{y}<br>
            Anomaly Score: %{customdata.anomalyScore:.3f}<br>
            Severity: %{customdata.severity}<br>
            Region: %{customdata.region}
            <extra></extra>
          `
        });
      }
    });

    return traces;
  };

  const getFeatureValue = (anomaly, featureKey) => {
    switch (featureKey) {
      case 'anomalyScore':
        return anomaly.anomalyScore;
      case 'transactionCount':
        return anomaly.transactionCount;
      case 'totalAmount':
        return anomaly.totalAmount;
      case 'avgAmount':
        return anomaly.avgAmount;
      case 'severity':
        return anomaly.severity;
      default:
        // Try to find in features array
        const feature = anomaly.features?.find(f => f.name === featureKey);
        return feature ? feature.value : null;
    }
  };

  const getFeatureLabel = (featureKey) => {
    const feature = availableFeatures.find(f => f.key === featureKey);
    return feature ? feature.label : featureKey;
  };

  const calculateCorrelationMatrix = () => {
    if (!anomalies || anomalies.length === 0) return [];

    const features = ['anomalyScore', 'transactionCount', 'totalAmount', 'avgAmount', 'severity'];
    const matrix = [];

    features.forEach((feature1, i) => {
      const row = [];
      features.forEach((feature2, j) => {
        const values1 = anomalies.map(a => getFeatureValue(a, feature1)).filter(v => v !== null);
        const values2 = anomalies.map(a => getFeatureValue(a, feature2)).filter(v => v !== null);
        
        const correlation = calculatePearsonCorrelation(values1, values2);
        row.push({
          x: j,
          y: i,
          z: correlation,
          feature1: getFeatureLabel(feature1),
          feature2: getFeatureLabel(feature2)
        });
      });
      matrix.push(...row);
    });

    return matrix;
  };

  const calculatePearsonCorrelation = (x, y) => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const handlePlotClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const customerData = point.customdata;
      
      setSelectedPoints([point.pointIndex]);
      
      if (onPointClick) {
        onPointClick(customerData);
      }
    }
  };

  const plotLayout = {
    title: {
      text: `${getFeatureLabel(selectedYFeature)} vs ${getFeatureLabel(selectedXFeature)}`,
      font: { color: '#f7f9fb', size: 16 }
    },
    xaxis: {
      title: getFeatureLabel(selectedXFeature),
      color: '#f7f9fb',
      gridcolor: '#3a4459',
      zeroline: false
    },
    yaxis: {
      title: getFeatureLabel(selectedYFeature),
      color: '#f7f9fb',
      gridcolor: '#3a4459',
      zeroline: false
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#f7f9fb' },
    legend: {
      x: 1,
      y: 1,
      bgcolor: 'rgba(35, 42, 54, 0.8)',
      bordercolor: '#5891cb',
      borderwidth: 1
    },
    margin: { l: 60, r: 60, t: 60, b: 60 }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'anomaly_feature_analysis',
      height: 500,
      width: 700,
      scale: 1
    }
  };

  const correlationMatrix = calculateCorrelationMatrix();

  return (
    <Card 
      title="Feature Contribution Analysis"
      subtitle={`Analyzing ${anomalies.length} anomalous customers`}
      isLoading={isLoading}
      style={{ minHeight: '500px' }}
    >
      {/* Feature selection controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#232a36',
        borderRadius: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            color: '#f7f9fb', 
            marginBottom: '4px' 
          }}>
            X-Axis Feature:
          </label>
          <select
            value={selectedXFeature}
            onChange={(e) => setSelectedXFeature(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#3a4459',
              border: '1px solid #5891cb',
              borderRadius: '4px',
              color: '#f7f9fb',
              padding: '6px 8px',
              fontSize: '12px'
            }}
          >
            {availableFeatures.map(feature => (
              <option key={feature.key} value={feature.key}>
                {feature.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            color: '#f7f9fb', 
            marginBottom: '4px' 
          }}>
            Y-Axis Feature:
          </label>
          <select
            value={selectedYFeature}
            onChange={(e) => setSelectedYFeature(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#3a4459',
              border: '1px solid #5891cb',
              borderRadius: '4px',
              color: '#f7f9fb',
              padding: '6px 8px',
              fontSize: '12px'
            }}
          >
            {availableFeatures.map(feature => (
              <option key={feature.key} value={feature.key}>
                {feature.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button
            onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
            style={{
              backgroundColor: showCorrelationMatrix ? '#00e0ff' : '#3a4459',
              color: showCorrelationMatrix ? '#0a1224' : '#f7f9fb',
              border: '1px solid #5891cb',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Correlation Matrix
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Main scatter plot */}
        <div style={{ flex: showCorrelationMatrix ? 2 : 1 }}>
          <Plot
            data={prepareScatterData()}
            layout={plotLayout}
            config={config}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '400px' }}
          />
        </div>

        {/* Correlation matrix */}
        {showCorrelationMatrix && (
          <div style={{ 
            width: '200px', 
            backgroundColor: '#232a36', 
            borderRadius: '8px', 
            padding: '12px' 
          }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              color: '#f7f9fb', 
              fontSize: '14px' 
            }}>
              Feature Correlations
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '2px',
              fontSize: '10px'
            }}>
              {correlationMatrix.map((cell, index) => (
                <div
                  key={index}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: `rgba(0, 224, 255, ${Math.abs(cell.z) * 0.8})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: Math.abs(cell.z) > 0.5 ? '#0a1224' : '#f7f9fb',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                  title={`${cell.feature1} vs ${cell.feature2}: ${cell.z.toFixed(2)}`}
                  onClick={() => {
                    // Set features based on correlation matrix click
                    const features = ['anomalyScore', 'transactionCount', 'totalAmount', 'avgAmount', 'severity'];
                    setSelectedXFeature(features[cell.x]);
                    setSelectedYFeature(features[cell.y]);
                  }}
                >
                  {cell.z.toFixed(1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feature importance panel */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#2c3341',
        borderRadius: '8px'
      }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          color: '#f7f9fb', 
          fontSize: '14px' 
        }}>
          Top Anomalous Features
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '8px'
        }}>
          {featureContributions.slice(0, 6).map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '8px',
                backgroundColor: '#232a36',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSelectedYFeature(feature.featureName);
              }}
            >
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#00e0ff',
                marginBottom: '2px'
              }}>
                {feature.featureName}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#f7f9fb',
                opacity: 0.7
              }}>
                {feature.importance.toFixed(1)}% contribution
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default FeatureContributionPlot; 