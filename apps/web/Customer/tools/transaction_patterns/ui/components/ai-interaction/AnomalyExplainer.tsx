import React, { useState, useEffect } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
// Fix for missing react-redux
// import { useSelector } from 'react-redux';
// import { selectSelectedAnomaly } from '../../../state/anomalySlice';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

interface AnomalyExplainerProps {
  onClose?: () => void;
  onPointToChart?: () => void;
  className?: string;
}

export const AnomalyExplainer: React.FC<AnomalyExplainerProps> = ({
  onClose,
  onPointToChart,
  className
}) => {
  const theme = useTheme();
  // Using sample data instead of Redux
  const selectedAnomaly = {
    transactionId: 'TX-1001',
    timestamp: new Date().toISOString(),
    value: 1500,
    hour: 3,
    dayOfWeek: 2,
    productsCount: 20,
    paymentMethod: 'Credit Card',
    location: 'Store #105',
    isAnomaly: true,
    anomalyScore: 0.92
  };
  const [explanations, setExplanations] = useState<string[]>([]);
  
  useEffect(() => {
    if (selectedAnomaly) {
      // In a real implementation, this would come from an AI analysis
      // For now, we'll generate some example explanations based on the anomaly data
      generateExplanations(selectedAnomaly);
    } else {
      setExplanations([]);
    }
  }, [selectedAnomaly]);
  
  const generateExplanations = (anomaly: any) => {
    const reasons = [];
    
    // Check for unusual time
    if (anomaly.hour < 6 || anomaly.hour > 22) {
      reasons.push(`This transaction occurred at an unusual time (${formatTime(anomaly.timestamp)}), outside of normal business hours.`);
    }
    
    // Check for unusual value
    if (anomaly.value > 1000) {
      reasons.push(`The transaction value (${formatCurrency(anomaly.value)}) is significantly higher than the average transaction value.`);
    } else if (anomaly.value < 5) {
      reasons.push(`The transaction value (${formatCurrency(anomaly.value)}) is unusually low.`);
    }
    
    // Check for unusual product count
    if (anomaly.productsCount > 15) {
      reasons.push(`This transaction includes an unusually high number of products (${anomaly.productsCount}).`);
    }
    
    // Add a generic reason if no specific ones are found
    if (reasons.length === 0) {
      reasons.push('This transaction shows unusual patterns across multiple dimensions when compared to historical data.');
      reasons.push('The combination of time, value, and product mix is statistically significant.');
    }
    
    // Add a recommendation
    reasons.push('Recommended action: Review transaction details and verify with customer if necessary.');
    
    setExplanations(reasons);
  };
  
  if (!selectedAnomaly) {
    return null;
  }
  
  return (
    <Card 
      title="Anomaly Explanation" 
      variant="anomaly"
      elevation="md"
      className={className}
      actions={
        <div style={{ display: 'flex', gap: theme.spacing[2] }}>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onPointToChart}
          >
            Show in Chart
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      }
    >
      <div style={{ padding: theme.spacing[3] }}>
        <div style={{ 
          marginBottom: theme.spacing[3],
          padding: theme.spacing[2],
          backgroundColor: theme.colors.graphiteDark,
          borderRadius: '4px'
        }}>
          <h3 style={{ 
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.cloudWhite,
            marginTop: 0,
            marginBottom: theme.spacing[2]
          }}>
            Transaction Details
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr',
            gap: `${theme.spacing[1]}px ${theme.spacing[3]}px`,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.cloudWhite
          }}>
            <div>ID:</div>
            <div>{selectedAnomaly.transactionId}</div>
            <div>Date:</div>
            <div>{formatDate(selectedAnomaly.timestamp)}</div>
            <div>Time:</div>
            <div>{formatTime(selectedAnomaly.timestamp)}</div>
            <div>Value:</div>
            <div>{formatCurrency(selectedAnomaly.value)}</div>
            <div>Products:</div>
            <div>{selectedAnomaly.productsCount} items</div>
            <div>Payment:</div>
            <div>{selectedAnomaly.paymentMethod}</div>
          </div>
        </div>
        
        <div>
          <h3 style={{ 
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.signalMagenta,
            marginTop: 0,
            marginBottom: theme.spacing[2]
          }}>
            Why is this an anomaly?
          </h3>
          <ul style={{ 
            paddingLeft: theme.spacing[4],
            margin: 0,
            color: theme.colors.cloudWhite,
            fontSize: theme.typography.fontSize.sm
          }}>
            {explanations.map((explanation, index) => (
              <li key={index} style={{ marginBottom: theme.spacing[2] }}>
                {explanation}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}; 