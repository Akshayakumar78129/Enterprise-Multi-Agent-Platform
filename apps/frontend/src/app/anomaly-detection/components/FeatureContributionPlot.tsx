"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, Skeleton } from 'components/index';
import { useAnomalyContext } from '../context';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface FeatureContributionPlotProps {
  anomalies?: any[];
  featureContributions?: any[];
  loading?: boolean;
  onPointClick?: (point: any) => void;
  onFeatureSelect?: (features: { x: string; y: string }) => void;
}

export function FeatureContributionPlot({
  anomalies = [],
  featureContributions = [],
  loading = false,
  onPointClick,
  onFeatureSelect
}: FeatureContributionPlotProps) {
  const { selectionManager } = useAnomalyContext();
  const [selectedXFeature, setSelectedXFeature] = useState('anomaly_score');
  const [selectedYFeature, setSelectedYFeature] = useState('transaction_count');
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState(false);

  const availableFeatures = [
    { key: 'anomaly_score', label: 'Anomaly Score' },
    { key: 'transaction_count', label: 'Transaction Count' },
    { key: 'total_spend', label: 'Total Amount' },
    { key: 'avg_transaction_value', label: 'Average Amount' },
    { key: 'severity_level', label: 'Severity Level' },
    { key: 'days_since_last_txn', label: 'Days Since Last Transaction' }
  ];

  useEffect(() => {
    if (onFeatureSelect) {
      onFeatureSelect({ x: selectedXFeature, y: selectedYFeature });
    }
  }, [selectedXFeature, selectedYFeature, onFeatureSelect]);

  const getFeatureValue = (anomaly: any, featureKey: string) => {
    switch(featureKey) {
      case 'anomaly_score':
        return anomaly.anomaly_score || anomaly.anomalyScore || 0;
      case 'transaction_count':
        return anomaly.transaction_count || anomaly.transactionCount || 0;
      case 'total_spend':
        return anomaly.total_spend || anomaly.totalAmount || anomaly.totalSpend || 0;
      case 'avg_transaction_value':
        return anomaly.avg_transaction_value || anomaly.avgAmount || 0;
      case 'severity_level':
        return anomaly.severity_level || anomaly.severity || 1;
      case 'days_since_last_txn':
        return anomaly.days_since_last_txn || anomaly.daysSinceLastTxn || 0;
      default:
        return 0;
    }
  };

  const getFeatureLabel = (featureKey: string) => {
    const feature = availableFeatures.find(f => f.key === featureKey);
    return feature ? feature.label : featureKey;
  };

  const prepareScatterData = () => {
    if (!anomalies || anomalies.length === 0) {
      // Return empty data when there's no real data
      return [];
    }
    return prepareDataFromAnomalies(anomalies);
  };

  const prepareDataFromAnomalies = (anomalyData: any[]) => {
    const traces: any[] = [];

    // Group by severity for different colors
    const severityGroups: Record<number, any> = {
      1: { data: [], color: '#00e0ff', name: 'Severity 1 (Low)' },
      2: { data: [], color: '#5fd4d6', name: 'Severity 2' },
      3: { data: [], color: '#5891cb', name: 'Severity 3 (Medium)' },
      4: { data: [], color: '#aa45dd', name: 'Severity 4' },
      5: { data: [], color: '#e930ff', name: 'Severity 5 (Critical)' }
    };

    anomalyData.forEach((anomaly, index) => {
      const xValue = getFeatureValue(anomaly, selectedXFeature);
      const yValue = getFeatureValue(anomaly, selectedYFeature);
      const severity = anomaly.severity_level || anomaly.severity || 1;

      if (xValue !== null && yValue !== null && severityGroups[severity]) {
        severityGroups[severity].data.push({
          x: xValue,
          y: yValue,
          customdata: {
            customerId: anomaly.customer_id || anomaly.customerId,
            customerName: anomaly.customer_name || anomaly.customerName,
            anomalyScore: anomaly.anomaly_score || anomaly.anomalyScore,
            severity: severity,
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
          x: group.data.map((d: any) => d.x),
          y: group.data.map((d: any) => d.y),
          mode: 'markers',
          type: 'scatter',
          name: group.name,
          marker: {
            color: group.color,
            size: group.data.map((d: any) => Math.max(8, d.customdata.severity * 2 + 6)),
            opacity: 0.8,
            line: {
              width: 2,
              color: '#8b5cf6'
            }
          },
          customdata: group.data.map((d: any) => d.customdata),
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

  if (loading) {
    return (
      <Card title="Feature Contribution Analysis" description="Interactive scatter plot of anomaly features">
        <Skeleton className="h-96" />
      </Card>
    );
  }

  return (
    <Card
      title="Feature Contribution Analysis"
      description="Interactive scatter plot showing relationships between anomaly features"
    >
      {/* Feature Selectors */}
      <div className="flex gap-4 mb-4 p-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-primary block mb-2">X-Axis Feature</label>
          <select
            value={selectedXFeature}
            onChange={(e) => setSelectedXFeature(e.target.value)}
            className="w-full px-3 py-2 bg-background/50 border border-primary/20 rounded-lg text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 transition-colors"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
          >
            {availableFeatures.map(feature => (
              <option key={feature.key} value={feature.key}>
                {feature.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-primary block mb-2">Y-Axis Feature</label>
          <select
            value={selectedYFeature}
            onChange={(e) => setSelectedYFeature(e.target.value)}
            className="w-full px-3 py-2 bg-background/50 border border-primary/20 rounded-lg text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary/50 hover:border-primary/30 transition-colors"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
          >
            {availableFeatures.map(feature => (
              <option key={feature.key} value={feature.key}>
                {feature.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="h-96 p-4">
        {(!anomalies || anomalies.length === 0) ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">No anomaly data available</p>
              <p className="text-sm mt-2">Try adjusting your filters or check back later</p>
            </div>
          </div>
        ) : (
        <Plot
          data={prepareScatterData()}
          layout={{
            autosize: true,
            height: 350,
            margin: { t: 20, r: 150, b: 50, l: 60 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: {
              title: getFeatureLabel(selectedXFeature),
              gridcolor: 'rgba(232, 212, 230, 0.1)',
              zerolinecolor: 'rgba(232, 212, 230, 0.2)',
              tickcolor: '#8b5cf6',
              titlefont: { color: '#8b5cf6', size: 12 },
              tickfont: { color: '#8b5cf6', size: 11 }
            },
            yaxis: {
              title: getFeatureLabel(selectedYFeature),
              gridcolor: 'rgba(232, 212, 230, 0.1)',
              zerolinecolor: 'rgba(232, 212, 230, 0.2)',
              tickcolor: '#8b5cf6',
              titlefont: { color: '#8b5cf6', size: 12 },
              tickfont: { color: '#8b5cf6', size: 11 }
            },
            showlegend: true,
            legend: {
              x: 1.02,
              y: 1,
              xanchor: 'left',
              yanchor: 'top',
              font: { color: '#8b5cf6', size: 11 },
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              bordercolor: '#e8d4e6',
              borderwidth: 1
            },
            hovermode: 'closest'
          }}
          config={{
            displayModeBar: false,
            displaylogo: false,
            responsive: true
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
          onClick={(data: any) => {
            if (data.points && data.points.length > 0) {
              const point = data.points[0];
              if (point.customdata) {
                if (onPointClick) {
                  onPointClick(point.customdata);
                }
                selectionManager.addPoint({
                  label: point.customdata.customerName,
                  value: `Anomaly Score: ${point.customdata.anomalyScore?.toFixed(3)}`,
                  source: 'Feature Contribution Plot',
                  metadata: point.customdata
                }, data.event?.shiftKey || false);
              }
            }
          }}
        />
        )}
      </div>
    </Card>
  );
}