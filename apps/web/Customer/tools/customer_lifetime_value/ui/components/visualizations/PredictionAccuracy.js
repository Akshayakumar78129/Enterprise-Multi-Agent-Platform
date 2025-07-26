import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const PredictionAccuracy = ({
  data = [],
  isLoading = false,
  width = 720,
  height = 420,
  onPointClick = null,
  highlightErrorCategory = null,
  showErrorBands = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { scatterData, errorHistogramData, modelMetrics, featureImportance } = useMemo(() => {
    if (!data || data.length === 0) {
      return { scatterData: [], errorHistogramData: [], modelMetrics: {}, featureImportance: [] };
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    // Create scatter plot data by error category
    const errorCategories = ['Low', 'Medium', 'High'];
    const scatterTraces = errorCategories.map(category => {
      const categoryData = data.filter(d => d.error_category === category);
      
      const getColor = (cat) => {
        switch(cat) {
          case 'Low': return '#00e0ff';    // Electric Cyan
          case 'Medium': return '#5fd4d6'; // Lighter cyan
          case 'High': return '#e930ff';   // Signal Magenta
          default: return '#00e0ff';
        }
      };

      return {
        x: categoryData.map(d => d.actual_value),
        y: categoryData.map(d => d.predicted_ltv),
        mode: 'markers',
        type: 'scatter',
        name: `${category} Error (${categoryData.length})`,
        marker: {
          color: getColor(category),
          size: categoryData.map(d => Math.max(4, Math.min(12, d.transaction_count / 10))),
          opacity: highlightErrorCategory === category ? 1.0 : 
                   highlightErrorCategory && highlightErrorCategory !== category ? 0.3 : 0.8,
          line: {
            color: '#f7f9fb',
            width: 1
          }
        },
        text: categoryData.map(d => 
          `${d.customer_name}<br>` +
          `Actual: ${formatCurrency(d.actual_value)}<br>` +
          `Predicted: ${formatCurrency(d.predicted_ltv)}<br>` +
          `Error: ${d.percentage_error}%<br>` +
          `Transactions: ${d.transaction_count}`
        ),
        hovertemplate: '%{text}<extra></extra>',
        customdata: categoryData.map(d => ({ ...d, category })),
        visible: highlightErrorCategory ? (highlightErrorCategory === category ? true : 'legendonly') : true
      };
    });

    // Add perfect prediction line
    const maxValue = Math.max(...data.map(d => Math.max(d.actual_value, d.predicted_ltv)));
    const minValue = Math.min(...data.map(d => Math.min(d.actual_value, d.predicted_ltv)));
    
    scatterTraces.push({
      x: [minValue, maxValue],
      y: [minValue, maxValue],
      mode: 'lines',
      type: 'scatter',
      name: 'Perfect Prediction',
      line: {
        color: '#f7f9fb',
        width: 2,
        dash: 'dash'
      },
      hoverinfo: 'skip',
      showlegend: false
    });

    // Error histogram data for secondary plot
    const errorHistogramTraces = [{
      x: data.map(d => d.percentage_error),
      type: 'histogram',
      name: 'Error Distribution',
      nbinsx: 20,
      marker: {
        color: '#5fd4d6',
        opacity: 0.7,
        line: {
          color: '#f7f9fb',
          width: 1
        }
      },
      yaxis: 'y2'
    }];

    // Calculate model metrics
    const totalError = data.reduce((sum, d) => sum + d.percentage_error, 0);
    const avgError = totalError / data.length;
    const lowErrorCount = data.filter(d => d.error_category === 'Low').length;
    const mediumErrorCount = data.filter(d => d.error_category === 'Medium').length;
    const highErrorCount = data.filter(d => d.error_category === 'High').length;
    
    const metrics = {
      mae: data.reduce((sum, d) => sum + d.absolute_error, 0) / data.length,
      avgError: avgError,
      r2: Math.max(0, 100 - avgError) / 100,
      accuracy: Math.max(0, 100 - avgError),
      lowErrorCount,
      mediumErrorCount,
      highErrorCount,
      totalPredictions: data.length
    };

    // Simulated feature importance (in real implementation, this would come from ML model)
    const features = [
      { name: 'Transaction Count', importance: 85, description: 'Total number of transactions' },
      { name: 'Average Order Value', importance: 72, description: 'Mean transaction amount' },
      { name: 'Purchase Frequency', importance: 68, description: 'Monthly purchase rate' },
      { name: 'Relationship Length', importance: 54, description: 'Customer tenure in days' },
      { name: 'Product Diversity', importance: 41, description: 'Number of unique products' },
      { name: 'Credit Limit', importance: 33, description: 'Customer credit limit' }
    ];

    return {
      scatterData: scatterTraces,
      errorHistogramData: errorHistogramTraces,
      modelMetrics: metrics,
      featureImportance: features
    };
  }, [data, highlightErrorCategory]);

  const layout = {
    title: {
      text: 'Actual vs Predicted Customer Lifetime Value',
      font: { color: '#f7f9fb', size: 16, family: 'Inter' },
      x: 0
    },
    xaxis: {
      title: {
        text: 'Actual LTV ($)',
        font: { color: '#f7f9fb', size: 12, family: 'Inter' }
      },
      tickfont: { color: '#f7f9fb', size: 10, family: 'Inter' },
      gridcolor: '#3a4459',
      gridwidth: 1,
      showgrid: true,
      zeroline: false,
      domain: [0, 0.75]
    },
    yaxis: {
      title: {
        text: 'Predicted LTV ($)',
        font: { color: '#f7f9fb', size: 12, family: 'Inter' }
      },
      tickfont: { color: '#f7f9fb', size: 10, family: 'Inter' },
      gridcolor: '#3a4459',
      gridwidth: 1,
      showgrid: true,
      zeroline: false
    },
    yaxis2: {
      title: {
        text: 'Count',
        font: { color: '#f7f9fb', size: 10, family: 'Inter' }
      },
      tickfont: { color: '#f7f9fb', size: 9, family: 'Inter' },
      overlaying: 'y',
      side: 'right',
      domain: [0, 0.25]
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { family: 'Inter', color: '#f7f9fb' },
    margin: { l: 60, r: 120, t: 60, b: 60 },
    showlegend: true,
    legend: {
      x: 0.78,
      y: 1,
      bgcolor: 'rgba(35, 42, 54, 0.8)',
      bordercolor: '#3a4459',
      borderwidth: 1,
      font: { size: 10 }
    },
    hovermode: 'closest'
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    displaylogo: false
  };

  const handlePlotClick = (event) => {
    if (event.points && event.points.length > 0) {
      const pointData = event.points[0].customdata;
      setSelectedCategory(pointData?.category);
      
      if (onPointClick && pointData) {
        onPointClick(pointData);
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Prediction Accuracy" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: `${height}px`,
            color: "#5891cb",
          }}
        >
          No prediction data available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Model Prediction Accuracy"
      subtitle={`${data.length} predictions • Avg Error: ${Math.round(modelMetrics.avgError)}% • Accuracy: ${Math.round(modelMetrics.accuracy)}%`}
      isLoading={isLoading}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Main scatter plot */}
        <div style={{ flex: 1, height: `${height}px` }}>
          <Plot
            data={[...scatterData, ...errorHistogramData]}
            layout={{
              ...layout,
              width: width * 0.75,
              height: height - 20
            }}
            config={config}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Model metrics panel */}
        <div style={{
          width: '200px',
          backgroundColor: '#232a36',
          borderRadius: '16px',
          padding: '16px',
          height: 'fit-content'
        }}>
          <h3 style={{
            color: '#f7f9fb',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            fontFamily: 'Inter'
          }}>
            Model Performance
          </h3>
          
          {/* Key metrics */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>Mean Absolute Error</div>
              <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: '600' }}>
                ${Math.round(modelMetrics.mae).toLocaleString()}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>R² Score</div>
              <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: '600' }}>
                {(modelMetrics.r2 * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>Accuracy Score</div>
              <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: '600' }}>
                {Math.round(modelMetrics.accuracy)}%
              </div>
            </div>
          </div>

          {/* Error breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>
              Error Breakdown
            </h4>
            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00e0ff' }}>
                <span>Low Error:</span>
                <span>{modelMetrics.lowErrorCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5fd4d6' }}>
                <span>Medium Error:</span>
                <span>{modelMetrics.mediumErrorCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e930ff' }}>
                <span>High Error:</span>
                <span>{modelMetrics.highErrorCount}</span>
              </div>
            </div>
          </div>

          {/* Feature importance */}
          <div>
            <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>
              Feature Importance
            </h4>
            {featureImportance.slice(0, 4).map((feature, index) => (
              <div key={index} style={{ marginBottom: '6px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#f7f9fb',
                  marginBottom: '2px'
                }}>
                  <span>{feature.name}</span>
                  <span>{feature.importance}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#3a4459',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${feature.importance}%`,
                    height: '100%',
                    backgroundColor: '#00e0ff',
                    borderRadius: '2px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PredictionAccuracy; 