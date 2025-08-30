import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

// Visualization components
import { TemporalHeatmap } from '../visualizations/TemporalHeatmap';
import { DualAxisTimeSeries } from '../visualizations/DualAxisTimeSeries';
import { ProductAssociationNetwork } from '../visualizations/ProductAssociationNetwork';
import { AnomalyScatterPlot } from '../visualizations/AnomalyScatterPlot';
import { PaymentMethodDistribution } from '../visualizations/PaymentMethodDistribution';
import { DailyVolumeDistribution } from '../visualizations/DailyVolumeDistribution';

// KPI components
import { TransactionKpiTile } from '../kpi/TransactionKpiTile';
import { AnomalyRateTile } from '../kpi/AnomalyRateTile';
import { PeakHourTile } from '../kpi/PeakHourTile';
import { PaymentMethodTile } from '../kpi/PaymentMethodTile';

// Control components
import { DateRangeSelector } from '../controls/DateRangeSelector';
import { FilterControls } from '../controls/FilterControls';

// AI interaction components
import { TransactionRobot } from '../ai-interaction/TransactionRobot';
import { AnomalyExplainer } from '../ai-interaction/AnomalyExplainer';
import { PatternQueryInput } from '../ai-interaction/PatternQueryInput';

// State management
import { 
  selectDateRange, 
  selectLoading, 
  fetchTransactionData,
  setSelectedTimeFilter
} from '../../state/transactionSlice';
import { 
  selectAnomalyLoading, 
  fetchAnomalyData,
  setSelectedAnomaly,
  selectSelectedAnomaly
} from '../../state/anomalySlice';

export const TransactionDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const loading = useSelector(selectLoading);
  const anomalyLoading = useSelector(selectAnomalyLoading);
  const selectedAnomaly = useSelector(selectSelectedAnomaly);
  
  const robotRef = useRef<any>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);
  const anomalyChartRef = useRef<HTMLDivElement>(null);
  
  // Initial data fetch
  useEffect(() => {
    dispatch(fetchTransactionData(dateRange));
    dispatch(fetchAnomalyData(dateRange));
  }, []);
  
  const handleCellClick = (hour: number, day: string) => {
    // Filter by selected time
    dispatch(setSelectedTimeFilter({ hour, day }));
    
    // Update robot to explain the filter
    if (robotRef.current) {
      robotRef.current.speak(`Showing transaction data for ${day} at ${hour}:00. This filter has been applied to all visualizations.`);
    }
  };
  
  const handleAnomalyClick = (transactionId: string, isAnomaly: boolean) => {
    if (isAnomaly) {
      // Mocked anomaly data for demonstration
      const anomalyData = {
        transactionId,
        timestamp: new Date().toISOString(),
        value: 1245.67,
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        productsCount: 23,
        paymentMethod: 'Credit Card',
        location: 'Store #123',
        isAnomaly: true,
        anomalyScore: 0.87
      };
      
      dispatch(setSelectedAnomaly(anomalyData));
      
      // Update robot to point to the anomaly
      if (robotRef.current && anomalyChartRef.current) {
        robotRef.current.pointToElement(
          anomalyChartRef.current, 
          `I found an anomalous transaction ${transactionId}. It's unusual due to its high value and the number of products purchased.`
        );
      }
    }
  };
  
  const handleQuerySubmit = (query: string) => {
    // In a real implementation, this would process the query and use Gemini API
    // For demo purposes, just show thinking and then reply
    if (robotRef.current) {
      robotRef.current.showThinking(`Processing your query: "${query}"...`);
      
      // Simulate processing delay
      setTimeout(() => {
        if (query.includes('anomaly')) {
          robotRef.current.speak('Anomalies are transactions that deviate significantly from normal patterns. In this dataset, they represent about 10% of transactions and are mostly related to unusual purchase times or values.');
        } else if (query.includes('weekday')) {
          robotRef.current.speak('Weekday transactions account for 78% of total volume, with peak hours between 12-2 PM and 5-7 PM. Weekend transactions show different patterns, with more activity between 10 AM and 4 PM.');
        } else if (query.includes('associated-with')) {
          robotRef.current.speak('When customers buy Electronics products, they are 3.2x more likely to also purchase Warranties and 2.1x more likely to buy Accessories within the same transaction.');
        } else if (query.includes('predict')) {
          robotRef.current.speak('Based on historical patterns, transaction volume is predicted to increase by 15% in the next hour, with higher than average transaction values.');
        } else {
          robotRef.current.speak('I can help you analyze transaction patterns. Try asking about anomalies, comparing weekdays to weekends, finding product associations, or predicting trends.');
        }
      }, 2000);
    }
  };
  
  return (
    <div style={{ 
      backgroundColor: theme.colors.midnight,
      minHeight: '100vh',
      padding: theme.spacing[4]
    }}>
      <h1 style={{ 
        color: theme.colors.cloudWhite,
        marginTop: 0,
        marginBottom: theme.spacing[4],
        fontSize: '32px',
        fontFamily: theme.typography.fontFamily,
        fontWeight: 700
      }}>
        Transaction Pattern Analysis
      </h1>
      
      <Grid columns={12} gap={theme.spacing[4]}>
        {/* KPI Tiles Row */}
        <GridItem colSpan={3}>
          <TransactionKpiTile previousCount={5432} />
        </GridItem>
        <GridItem colSpan={3}>
          <AnomalyRateTile threshold={0.1} />
        </GridItem>
        <GridItem colSpan={3}>
          <PeakHourTile />
        </GridItem>
        <GridItem colSpan={3}>
          <PaymentMethodTile />
        </GridItem>
        
        {/* Main content area with visualizations */}
        <GridItem colSpan={9}>
          <Grid columns={12} gap={theme.spacing[4]}>
            {/* Temporal Analysis Section */}
            <GridItem colSpan={5} ref={heatmapRef}>
              <TemporalHeatmap 
                width={400}
                height={280}
                onCellClick={handleCellClick}
              />
            </GridItem>
            <GridItem colSpan={7}>
              <DualAxisTimeSeries 
                width={640}
                height={280}
              />
            </GridItem>
            
            {/* Product Association and Anomaly Section */}
            <GridItem colSpan={6}>
              <ProductAssociationNetwork 
                width={500}
                height={400}
              />
            </GridItem>
            <GridItem colSpan={6} ref={anomalyChartRef}>
              <AnomalyScatterPlot 
                width={500}
                height={350}
                onPointClick={handleAnomalyClick}
              />
            </GridItem>
            
            {/* Secondary Visualizations */}
            <GridItem colSpan={6}>
              <PaymentMethodDistribution 
                width={280}
                height={280}
              />
            </GridItem>
            <GridItem colSpan={6}>
              <DailyVolumeDistribution 
                width={320}
                height={220}
              />
            </GridItem>
          </Grid>
        </GridItem>
        
        {/* Right sidebar with controls and AI interaction */}
        <GridItem colSpan={3}>
          <Grid columns={1} gap={theme.spacing[4]}>
            <GridItem>
              <DateRangeSelector />
            </GridItem>
            <GridItem>
              <FilterControls />
            </GridItem>
            <GridItem>
              <PatternQueryInput 
                onSubmit={handleQuerySubmit}
                isLoading={false}
              />
            </GridItem>
            {selectedAnomaly && (
              <GridItem>
                <AnomalyExplainer 
                  onClose={() => dispatch(setSelectedAnomaly(null))}
                  onPointToChart={() => {
                    if (robotRef.current && anomalyChartRef.current) {
                      robotRef.current.pointToElement(
                        anomalyChartRef.current,
                        'This anomaly is highlighted in the scatter plot.'
                      );
                    }
                  }}
                />
              </GridItem>
            )}
          </Grid>
        </GridItem>
      </Grid>
      
      {/* AI Robot */}
      <TransactionRobot 
        ref={robotRef}
        initialPosition={{ x: 20, y: 20 }}
      />
    </div>
  );
}; 