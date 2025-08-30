import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ClientSidePlot } from './ClientSidePlot';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectAnomalies, selectAnomalyLoading } from '../../state/anomalySlice';
import { useChartConfigs } from '../../utils/chartHelpers';
import { formatHour } from '../../utils/formatters';

export interface AnomalyScatterPlotProps {
  height?: number;
  width?: number;
  onPointClick?: (transactionId: string, isAnomaly: boolean) => void;
}

export const AnomalyScatterPlot: React.FC<AnomalyScatterPlotProps> = ({
  height = 350,
  width = 400,
  onPointClick
}) => {
  const theme = useTheme();
  const { anomalyScatterLayout } = useChartConfigs();
  const anomalies = useSelector(selectAnomalies);
  const loading = useSelector(selectAnomalyLoading);
  
  const chartData = useMemo(() => {
    if (!anomalies || anomalies.length === 0) return [];
    
    // Separate normal and anomalous transactions
    const normalTransactions = anomalies.filter(t => !t.isAnomaly);
    const anomalousTransactions = anomalies.filter(t => t.isAnomaly);
    
    // Extract data for normal transactions
    const normalHours = normalTransactions.map(t => {
      const date = new Date(t.timestamp);
      return date.getHours();
    });
    const normalValues = normalTransactions.map(t => t.value);
    const normalSizes = normalTransactions.map(t => 
      Math.min(10 + t.productsCount * 3, 30)
    );
    const normalTexts = normalTransactions.map(t => `Transaction ${t.transactionId}`);
    const normalCustomdata = normalTransactions.map(t => ({
      id: t.transactionId,
      isAnomaly: false
    }));
    
    // Extract data for anomalous transactions
    const anomalyHours = anomalousTransactions.map(t => {
      const date = new Date(t.timestamp);
      return date.getHours();
    });
    const anomalyValues = anomalousTransactions.map(t => t.value);
    const anomalySizes = anomalousTransactions.map(t => 
      Math.min(15 + t.productsCount * 3, 40)
    );
    const anomalyTexts = anomalousTransactions.map(t => `Anomaly ${t.transactionId}`);
    const anomalyCustomdata = anomalousTransactions.map(t => ({
      id: t.transactionId,
      isAnomaly: true
    }));
    
    return [
      {
        type: 'scatter',
        mode: 'markers',
        x: normalHours,
        y: normalValues,
        marker: {
          color: theme.colors.electricCyan,
          size: normalSizes,
          opacity: 0.7
        },
        text: normalTexts,
        name: 'Normal Transactions',
        customdata: normalCustomdata,
        hovertemplate: '<b>%{text}</b><br>Hour: %{x}<br>Value: $%{y:.2f}<br><extra></extra>'
      },
      {
        type: 'scatter',
        mode: 'markers',
        x: anomalyHours,
        y: anomalyValues,
        marker: {
          color: theme.colors.signalMagenta,
          size: anomalySizes,
          opacity: 0.7,
          line: {
            color: theme.colors.cloudWhite,
            width: 1
          }
        },
        text: anomalyTexts,
        name: 'Anomalies',
        customdata: anomalyCustomdata,
        hovertemplate: '<b>%{text}</b><br>Hour: %{x}<br>Value: $%{y:.2f}<br><extra></extra>'
      }
    ];
  }, [anomalies, theme]);
  
  const handleClick = (event: any) => {
    if (onPointClick && event.points && event.points[0]) {
      const point = event.points[0];
      const customdata = point.customdata;
      onPointClick(customdata.id, customdata.isAnomaly);
    }
  };
  
  return (
    <Card 
      title="Transaction Anomalies"
      variant={anomalies.some(a => a.isAnomaly) ? 'anomaly' : 'default'}
      isLoading={loading}
      elevation="md"
    >
      {anomalies && anomalies.length > 0 && (
        <ClientSidePlot
          data={chartData}
          layout={{
            ...anomalyScatterLayout,
            height,
            width
          }}
          onClick={handleClick}
        />
      )}
    </Card>
  );
}; 