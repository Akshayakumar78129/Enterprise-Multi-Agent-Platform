import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../ui-common/design-system/theme';
import { QueryInput } from '../ui-common/QueryInput/QueryInput';
import { RobotCharacter } from '../ui-common/ai-interaction/RobotCharacter/RobotCharacter';
import DashboardNavigation from '../ui-common/design-system/components/Navigation/DashboardNavigation.jsx';
import NavigationToggle from '../ui-common/design-system/components/Navigation/NavigationToggle.jsx';

// Import reducers
import purchaseFrequencyReducer from '../Customer/tools/purchase_frequency/ui/state/purchaseFrequencySlice';
import customerSegmentationReducer from '../Customer/tools/customer_segmentation/ui/state/customerSegmentationSlice';
import customerBehaviourReducer from '../Customer/tools/customer_behaviour/ui/state/customerBehaviourSlice';
import churnPredictionReducer from '../Customer/tools/churn_prediction/ui/state/churnPredictionSlice';



const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';

// Configure Redux store
const store = configureStore({
  reducer: {
    purchaseFrequency: purchaseFrequencyReducer,
    customerSegmentation: customerSegmentationReducer,
    customerBehaviour: customerBehaviourReducer,
    churnPrediction: churnPredictionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable values for demo
    }),
});

// Define available tools with dynamic imports
const componentRegistry = {
  'purchase-frequency': {
    histogram: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/FrequencyHistogram')),
    heatmap: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/IntervalHeatmap')),
    quadrant: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/SegmentQuadrant.tsx')),
    regularity: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/RegularityChart')),
    treemap: dynamic(() => import('../Customer/tools/purchase_frequency/ui/components/visualizations/ValueTreemap')),
  },
  'product-performance': {
    salesExplorer: dynamic(() => import('../Sales/tools/ProductPerformanceAnalyzer/ui/components/visualizations/SalesPerformanceExplorer')),
    marginAnalysis: dynamic(() => import('../Sales/tools/ProductPerformanceAnalyzer/ui/components/visualizations/MarginAnalysisVisualizer')),
    priceBandDistribution: dynamic(() => import('../Sales/tools/ProductPerformanceAnalyzer/ui/components/visualizations/PriceBandDistribution')),
    growthMatrix: dynamic(() => import('../Sales/tools/ProductPerformanceAnalyzer/ui/components/visualizations/ProductGrowthMatrix')),
  },
  'sales-performance': {
    overview: dynamic(() => import('../Sales/tools/SalesPerformanceAnalyzer/ui/components/visualizations/PerformanceOverview').then(mod => mod.PerformanceOverview)),
    timeSeries: dynamic(() => import('../Sales/tools/SalesPerformanceAnalyzer/ui/components/visualizations/TimeSeriesExplorer').then(mod => mod.TimeSeriesExplorer)),
    distribution: dynamic(() => import('../Sales/tools/SalesPerformanceAnalyzer/ui/components/visualizations/PerformanceDistributionAnalyzer').then(mod => mod.PerformanceDistributionAnalyzer)),
    comparativeGrid: dynamic(() => import('../Sales/tools/SalesPerformanceAnalyzer/ui/components/visualizations/ComparativePerformanceGrid').then(mod => mod.ComparativePerformanceGrid)),
    correlationMatrix: dynamic(() => import('../Sales/tools/SalesPerformanceAnalyzer/ui/components/visualizations/PerformanceCorrelationMatrix').then(mod => mod.PerformanceCorrelationMatrix)),
    driverAnalysis: dynamic(() => import('../Sales/tools/SalesPerformanceAnalyzer/ui/components/visualizations/PerformanceDriverAnalysis').then(mod => mod.PerformanceDriverAnalysis)),
  },
  'customer-segmentation': {
    dashboard: dynamic(() => import('../Customer/tools/customer_segmentation/ui/views/CustomerSegmentationDashboard'), { ssr: false }),
    distributionMap: dynamic(() => import('../Customer/tools/customer_segmentation/ui/components/visualizations/SegmentDistributionMap'), { ssr: false }),
    profileCards: dynamic(() => import('../Customer/tools/customer_segmentation/ui/components/visualizations/SegmentProfileCards'), { ssr: false }),
    metricComparison: dynamic(() => import('../Customer/tools/customer_segmentation/ui/components/visualizations/SegmentMetricComparison'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/customer_segmentation/ui/components/kpi/SegmentKPITiles'), { ssr: false }),
  },
  'customer-behaviour': {
    dashboard: dynamic(() => import('../Customer/tools/customer_behaviour/pages/index.page')),
    radar: dynamic(() => import('../Customer/tools/customer_behaviour/ui/components/visualizations/PatternRadarChart'), { ssr: false }),
    histogram: dynamic(() => import('../Customer/tools/customer_behaviour/ui/components/visualizations/PatternIntervalHistogram'), { ssr: false }),
    treemap: dynamic(() => import('../Customer/tools/customer_behaviour/ui/components/visualizations/CategoryTreemap'), { ssr: false }),
    donut: dynamic(() => import('../Customer/tools/customer_behaviour/ui/components/visualizations/ChannelDonutChart'), { ssr: false }),
  },
  'churn-prediction': {
    dashboard: dynamic(() => import('../Customer/tools/churn_prediction/pages/index.page')),
    riskPyramid: dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/ChurnRiskPyramid'), { ssr: false }),
    featureImportance: dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/FeatureImportance'), { ssr: false }),
    probabilityHistogram: dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/ProbabilityHistogram'), { ssr: false }),
    temporalRisk: dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/TemporalRiskPattern'), { ssr: false }),
    segmentMatrix: dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/SegmentMatrix'), { ssr: false }),
  },
  'anomaly-detection': {
    dashboard: dynamic(() => import('../Customer/tools/anomaly_detection/ui/views/AnomalyDashboard'), { ssr: false }),
    severityDistribution: dynamic(() => import('../Customer/tools/anomaly_detection/ui/components/visualizations/SeverityDistribution'), { ssr: false }),
    featureContribution: dynamic(() => import('../Customer/tools/anomaly_detection/ui/components/visualizations/FeatureContributionPlot'), { ssr: false }),
    anomalyTable: dynamic(() => import('../Customer/tools/anomaly_detection/ui/components/visualizations/AnomalyTable'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/anomaly_detection/ui/components/kpi/AnomalyKPITiles'), { ssr: false }),
  },
  'transaction-patterns': {
    dashboard: dynamic(() => import('../Customer/tools/transaction_patterns/ui/views/TransactionPatternsDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/transaction_patterns/ui/components/kpi/TransactionKPITiles'), { ssr: false }),
    temporalHeatmap: dynamic(() => import('../Customer/tools/transaction_patterns/ui/components/visualizations/TemporalHeatmap'), { ssr: false }),
    timeSeriesChart: dynamic(() => import('../Customer/tools/transaction_patterns/ui/components/visualizations/DualAxisTimeSeries'), { ssr: false }),
  },
  'customer-lifetime-value': {
    dashboard: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/views/LTVDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/kpi/LTVKPITiles'), { ssr: false }),
    ltvDistribution: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/visualizations/LTVDistribution'), { ssr: false }),
    predictionAccuracy: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/visualizations/PredictionAccuracy'), { ssr: false }),
    geographicMap: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/visualizations/GeographicValueMap'), { ssr: false }),
    customerExplorer: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/visualizations/CustomerValueExplorer'), { ssr: false }),
    valueContribution: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/visualizations/ValueContributionAnalysis'), { ssr: false }),
    timeProjection: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/visualizations/LTVTimeProjection'), { ssr: false }),
    filterPanel: dynamic(() => import('../Customer/tools/customer_lifetime_value/ui/components/controls/FilterPanel'), { ssr: false }),
  },
  'engagement-classifier': {
    dashboard: dynamic(() => import('../Customer/tools/engagement_classifier/ui/views/EngagementDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/engagement_classifier/ui/components/kpi/EngagementKPITiles'), { ssr: false }),
    pyramid: dynamic(() => import('../Customer/tools/engagement_classifier/ui/components/visualizations/EngagementPyramid'), { ssr: false }),
    timeline: dynamic(() => import('../Customer/tools/engagement_classifier/ui/components/visualizations/EngagementTimeline'), { ssr: false }),
    opportunityFinder: dynamic(() => import('../Customer/tools/engagement_classifier/ui/components/visualizations/OpportunityFinder'), { ssr: false }),
  },
  'next-purchase': {
    dashboard: dynamic(() => import('../Customer/tools/next_purchase/ui/views/NextPurchaseDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/next_purchase/ui/components/kpi/NextPurchaseKPITiles'), { ssr: false }),
    confidenceMatrix: dynamic(() => import('../Customer/tools/next_purchase/ui/components/visualizations/PredictionConfidenceMatrix'), { ssr: false }),
    customerJourney: dynamic(() => import('../Customer/tools/next_purchase/ui/components/visualizations/CustomerPurchaseJourney'), { ssr: false }),
    affinityNetwork: dynamic(() => import('../Customer/tools/next_purchase/ui/components/visualizations/ProductAffinityNetwork'), { ssr: false }),
  },
  'sales-trends': {
    dashboard: dynamic(() => import('../Sales/tools/SalesTrendAnalyzer/ui/views/SalesTrendDashboard'), { ssr: false }),
    timeSeriesExplorer: dynamic(() => import('../Sales/tools/SalesTrendAnalyzer/ui/components/visualizations/TimeSeriesExplorer'), { ssr: false }),
    seasonalPatternAnalyzer: dynamic(() => import('../Sales/tools/SalesTrendAnalyzer/ui/components/visualizations/SeasonalPatternAnalyzer'), { ssr: false }),
    growthRateVisualizer: dynamic(() => import('../Sales/tools/SalesTrendAnalyzer/ui/components/visualizations/GrowthRateVisualizer'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Sales/tools/SalesTrendAnalyzer/ui/components/kpi/KPITiles'), { ssr: false })
  },
  'regional-sales': {
    dashboard: dynamic(() => import('../Sales/tools/RegionalSalesAnalyzer/ui/views/RegionalSalesAnalyzerDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Sales/tools/RegionalSalesAnalyzer/ui/components/kpi/RegionalKPITiles'), { ssr: false }),
    performanceMap: dynamic(() => import('../Sales/tools/RegionalSalesAnalyzer/ui/components/visualizations/RegionalPerformanceMap'), { ssr: false }),
    timeSeriesExplorer: dynamic(() => import('../Sales/tools/RegionalSalesAnalyzer/ui/components/visualizations/RegionalTimeSeriesExplorer'), { ssr: false }),
  },
  'performance-deviation': {
    dashboard: dynamic(() => import('../Customer/tools/performance_deviation/ui/views/PerformanceDeviationDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/performance_deviation/ui/components/kpi/PerformanceKPITiles'), { ssr: false }),
    performanceExplorer: dynamic(() => import('../Customer/tools/performance_deviation/ui/components/visualizations/PerformanceExplorer'), { ssr: false }),
    featureImportance: dynamic(() => import('../Customer/tools/performance_deviation/ui/components/visualizations/FeatureImportanceVisualizer'), { ssr: false }),
    varianceDecomposition: dynamic(() => import('../Customer/tools/performance_deviation/ui/components/visualizations/VarianceDecomposition'), { ssr: false }),
    deviationPatterns: dynamic(() => import('../Customer/tools/performance_deviation/ui/components/visualizations/DeviationPatternExplorer'), { ssr: false }),
  },
  'retention-planner': {
    dashboard: dynamic(() => import('../Customer/tools/retention_planner/ui/views/RetentionDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Customer/tools/retention_planner/ui/components/kpi/RetentionKPITiles'), { ssr: false }),
    churnRiskGauge: dynamic(() => import('../Customer/tools/retention_planner/ui/components/visualizations/ChurnRiskGauge'), { ssr: false }),
    valueRiskMatrix: dynamic(() => import('../Customer/tools/retention_planner/ui/components/visualizations/ValueRiskMatrix'), { ssr: false }),
    actionSankey: dynamic(() => import('../Customer/tools/retention_planner/ui/components/visualizations/ActionSankey'), { ssr: false }),
    roiWaterfall: dynamic(() => import('../Customer/tools/retention_planner/ui/components/visualizations/ROIWaterfall'), { ssr: false }),
  },
  'inventory-level-analyzer': {
    dashboard: dynamic(() => import('../Inventory/tools/InventoryLevelAnalyzer/ui/views/InventoryLevelDashboard'), { ssr: false }),
    healthMatrix: dynamic(() => import('../Inventory/tools/InventoryLevelAnalyzer/ui/components/visualizations/InventoryHealthMatrix.jsx'), { ssr: false }),
    itemAnalyzer: dynamic(() => import('../Inventory/tools/InventoryLevelAnalyzer/ui/components/visualizations/ItemLevelAnalyzer.jsx'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Inventory/tools/InventoryLevelAnalyzer/ui/components/kpi/InventoryKPITiles.jsx'), { ssr: false }),
  },
  'inventory-holding-cost-analyzer': {
    dashboard: dynamic(() => import('../Inventory/tools/InventoryHoldingCostAnalyzer/ui/views/HoldingCostDashboard'), { ssr: false }),
    kpiTiles: dynamic(() => import('../Inventory/tools/InventoryHoldingCostAnalyzer/ui/components/kpi/HoldingCostKPITiles.tsx'), { ssr: false }),
    costBreakdown: dynamic(() => import('../Inventory/tools/InventoryHoldingCostAnalyzer/ui/components/visualizations/CostBreakdownVisualization.tsx'), { ssr: false }),
    excessiveCostGrid: dynamic(() => import('../Inventory/tools/InventoryHoldingCostAnalyzer/ui/components/visualizations/ExcessiveCostGrid.tsx'), { ssr: false }),
    costTrend: dynamic(() => import('../Inventory/tools/InventoryHoldingCostAnalyzer/ui/components/visualizations/CostTrendAnalyzer.tsx'), { ssr: false }),
    warehouseComparison: dynamic(() => import('../Inventory/tools/InventoryHoldingCostAnalyzer/ui/components/visualizations/WarehouseCostComparison.jsx'), { ssr: false }),
  },
};

/**
 * Enterprise IQ - Conversational Canvas
 * 
 * AI-powered interface for interacting with data analytics components
 */
export default function ConversationalCanvas() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [robotState, setRobotState] = useState({
    position: { x: 100, y: 100 }, // Position within canvas boundaries
    state: 'idle',
    message: "null",
    laserTarget: null,
    isVisible: true
  });
  const [userSelectedChartPoints, setUserSelectedChartPoints] = useState([]);

  const [queue, setQueue] = useState([]);

  const [audio, setAudio] = useState(null);
  // State for navigation
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  // State for drag and resize
  const [activeComponent, setActiveComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  // State for infinite workspace
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Monitor userSelectedChartPoints changes and update robot state
  useEffect(() => {
    console.log('userSelectedChartPoints changed:', userSelectedChartPoints);
    if (userSelectedChartPoints.length > 0) {
      setRobotState(prev => ({
        ...prev,
        state: 'thinking'
      }));
    } else {
      setRobotState(prev => ({
        ...prev,
        state: 'idle',
        message: null
      }));
    }
  }, [userSelectedChartPoints]);

  // Auto-play audio when received
  // useEffect(() => {
  //   if (robotState.audioData?.url && robotState.audioData?.blob) {
  //     console.log('Attempting to play audio:', {
  //       url: robotState.audioData.url,
  //       mimeType: robotState.audioData.mimeType,
  //       blobSize: robotState.audioData.blob.size,
  //       blobType: robotState.audioData.blob.type
  //     });
      
  //     // Validate blob before creating audio element
  //     if (robotState.audioData.blob.size === 0) {
  //       console.error('Audio blob is empty, cannot play');
  //       return;
  //     }
      
  //     const audio = new Audio();
      
  //     audio.onloadstart = () => {
  //       console.log('Audio loading started');
  //     };
      
  //     audio.onloadedmetadata = () => {
  //       console.log('Audio metadata loaded - duration:', audio.duration);
  //     };
      
  //     audio.onloadeddata = () => {
  //       console.log('Audio data loaded, ready to play');
  //     };
      
  //     audio.oncanplay = () => {
  //       console.log('Audio can start playing');
  //     };
      
  //     audio.onended = () => {
  //       console.log('Audio playback finished');
  //       // Cleanup the URL after playback
  //       URL.revokeObjectURL(robotState.audioData.url);
  //     };
      
  //     audio.onerror = (error) => {
  //       console.error('Audio playback error:', error);
  //       console.error('Audio error details:', {
  //         error: audio.error,
  //         networkState: audio.networkState,
  //         readyState: audio.readyState,
  //         src: audio.src
  //       });
  //       URL.revokeObjectURL(robotState.audioData.url);
  //     };
      
  //     // Set the source and start playing
  //     audio.src = robotState.audioData.url;
  //     audio.load(); // Explicitly load the audio
      
  //     audio.play().catch(error => {
  //       console.error('Failed to play audio:', error);
  //       console.error('Play error details:', {
  //         name: error.name,
  //         message: error.message,
  //         code: error.code
  //       });
        
  //       // Some browsers require user interaction before playing audio
  //       if (error.name === 'NotAllowedError') {
  //         console.warn('Audio autoplay blocked by browser. User interaction required.');
  //       }
  //       URL.revokeObjectURL(robotState.audioData.url);
  //     });
  //   }
  // }, [robotState.audioData]);

  // Cleanup audio blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (robotState.audioData?.url) {
        URL.revokeObjectURL(robotState.audioData.url);
      }
    };
  }, [robotState.audioData]);
  
  // Ensure robot position is within canvas boundaries (independent of zoom/pan)
  useEffect(() => {
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setRobotState(prev => ({
        ...prev,
        position: {
          x: Math.max(20, Math.min(canvasRect.width - 60, prev.position.x)),
          y: Math.max(20, Math.min(canvasRect.height - 80, prev.position.y))
        }
      }));
    }
  }, []);

  // Function to handle fetch errors
  const handleFetchError = (error) => {
    console.error('Error fetching data:', error);
    setRobotState({
      ...robotState,
      state: 'error',
      message: 'There was an error fetching data from the database. Please try again.',
    });
    setLoading(false);
  };

  // Function to spawn a component on the canvas
  const spawnComponent = async (componentType, props = {}, position = null) => {
    setLoading(true);
    const id = `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Get canvas dimensions and current view state
    const canvasWidth = canvasRef.current?.offsetWidth || 800;
    const canvasHeight = canvasRef.current?.offsetHeight || 600;
    const minComponentWidth = 300;
    const minComponentHeight = 200;
    
    // Default component size - will be updated in tool-specific blocks
    let componentSize = { width: minComponentWidth, height: minComponentHeight };
    
    // Helper: Check if two rectangles overlap
    function isOverlapping(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    // Helper: Find a non-overlapping position
    function findNonOverlappingPosition(size, padding = 30) {
      // Calculate the current visible area in canvas coordinates
      const visibleLeft = -pan.x / zoom;
      const visibleTop = -pan.y / zoom;
      const visibleRight = visibleLeft + (canvasWidth / zoom);
      const visibleBottom = visibleTop + (canvasHeight / zoom);
      const step = 40; // Try every 40px
      const maxTries = 10000;
      let tries = 0;
      for (let y = visibleTop + padding; y <= visibleBottom - size.height - padding; y += step) {
        for (let x = visibleLeft + padding; x <= visibleRight - size.width - padding; x += step) {
          const newRect = { x, y, width: size.width, height: size.height };
          const overlap = components.some(comp =>
            isOverlapping(newRect, {
              x: comp.position.x,
              y: comp.position.y,
              width: comp.size.width,
              height: comp.size.height
            })
          );
          if (!overlap) {
            return { x, y };
          }
          tries++;
          if (tries > maxTries) break;
        }
        if (tries > maxTries) break;
      }
      return null; // No space found
    }

    // Helper: Zoom out and pan to fit more space
    async function autoZoomOutAndFindSpace(size) {
      // Calculate how much space we need
      const padding = 50;
      const neededWidth = size.width + padding * 2;
      const neededHeight = size.height + padding * 2;
      
      // Calculate current visible area
      const currentVisibleWidth = canvasWidth / zoom;
      const currentVisibleHeight = canvasHeight / zoom;
      
      // Calculate required zoom to fit the component
      const requiredZoomX = canvasWidth / (currentVisibleWidth + neededWidth);
      const requiredZoomY = canvasHeight / (currentVisibleHeight + neededHeight);
      const requiredZoom = Math.min(requiredZoomX, requiredZoomY, zoom * 0.8); // Don't zoom out more than 20%
      
      // Apply the zoom
      setZoom(requiredZoom);
      await new Promise(r => setTimeout(r, 100)); // Wait for re-render
      
      // Try to find a position in the expanded visible area
      const found = findNonOverlappingPosition(size);
      
      if (found) {
        return found;
      } else {
        // If still no space, place it at the bottom-right of the current view
        const visibleLeft = -pan.x / requiredZoom;
        const visibleTop = -pan.y / requiredZoom;
        const visibleRight = visibleLeft + (canvasWidth / requiredZoom);
        const visibleBottom = visibleTop + (canvasHeight / requiredZoom);
        
        // Calculate position for bottom-right placement
        let newX = visibleRight - size.width - padding;
        let newY = visibleBottom - size.height - padding;
        
        // Check if component would be cut off and adjust pan if needed
        const componentRight = newX + size.width;
        const componentBottom = newY + size.height;
        
        let newPanX = pan.x;
        let newPanY = pan.y;
        
        // If component extends beyond right edge, adjust pan
        if (componentRight > visibleRight) {
          const overflowX = componentRight - visibleRight;
          newPanX -= overflowX * requiredZoom;
          newX = visibleRight - size.width - padding;
        }
        
        // If component extends beyond bottom edge, adjust pan
        if (componentBottom > visibleBottom) {
          const overflowY = componentBottom - visibleBottom;
          newPanY -= overflowY * requiredZoom;
          newY = visibleBottom - size.height - padding;
        }
        
        // Apply the pan adjustment if needed
        if (newPanX !== pan.x || newPanY !== pan.y) {
          setPan({ x: newPanX, y: newPanY });
          await new Promise(r => setTimeout(r, 50)); // Wait for re-render
        }
        
        return { x: newX, y: newY };
      }
    }
    const [toolName, componentName] = componentType.split('.');
    if (!componentRegistry[toolName] || !componentRegistry[toolName][componentName]) {
      console.error(`Component not found in registry: ${componentType}`);
      setLoading(false);
      return null;
    }
    try {
      let componentData = {};
      
      // Fetch real data for the component based on its type
      if (toolName === 'product-performance') {
        const response = await fetch('/api/sales/product-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_date: '2020-01-01',
            end_date: '2020-12-31',
            metrics: ['sales', 'units', 'margin', 'price_bands'],
            category_level: 'product',
          })
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch product performance data for ${componentName}`);
        }
        const apiData = await response.json();
        // Map the component to its data
        switch (componentName) {
          case 'salesExplorer':
            // SalesPerformanceExplorer expects data in Product[] format.
            // Map apiData.results.daily_summary to this structure.
            const dailySummary = apiData.results?.daily_summary || [];
            const explorerData = dailySummary.map(summaryEntry => ({
              date: summaryEntry.date,
              sales_amount: summaryEntry.sales, // Map 'sales' to 'sales_amount'
              quantity: summaryEntry.quantity,
              product_name: `Aggregated - ${summaryEntry.date}`,
              category: 'All',
              // Other Product fields can be defaulted if not applicable to aggregated view
              margin_pct: 0, 
              avg_price: summaryEntry.quantity ? summaryEntry.sales / summaryEntry.quantity : 0,
            }));
            componentData = { data: explorerData };
            break;
          case 'marginAnalysis':
            componentData = { 
              data: apiData.results?.product_scatter_data || [],
              kpiAverageMargin: apiData.results?.kpi?.averageMargin?.value || 0
            };
            break;
          case 'priceBandDistribution':
            // PriceBandDistribution expects 'bands' and 'distribution' separately.
            componentData = { 
              bands: apiData.results?.price_bands?.bands || [],
              distribution: apiData.results?.price_bands?.distribution || {}
            };
            break;
          case 'growthMatrix':
            // ProductGrowthMatrix expects an array of products. 
            // product_scatter_data contains detailed product info.
            componentData = { data: apiData.results?.product_scatter_data || [] };
            break;
          default:
            componentData = {};
        }
      } else if (toolName === 'sales-performance') {
        
        // Defaults for the sales-performance API call
        const defaultRequestBody = {
          start_date: '2020-01-23',
          end_date: '2020-07-16',
          dimension: 'region',
          metric: 'revenue',
          time_granularity: 'daily'
        };

        // Override defaults with any props passed to spawnComponent
        const requestBody = {
          start_date: props.start_date || defaultRequestBody.start_date,
          end_date: props.end_date || defaultRequestBody.end_date,
          dimension: props.dimension || defaultRequestBody.dimension,
          metric: props.metric || defaultRequestBody.metric,
          time_granularity: props.time_granularity || defaultRequestBody.time_granularity,
        };

        // Make API call to get all data (now includes all raw metrics)
        const response = await fetch('/api/sales-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sales performance data for ${componentName}`);
        }
        
        const apiData = await response.json();

        if (apiData.status === 'success' && apiData.results) {
          componentData = {
            data: apiData.results.chartData || [],
            loading: false,
            selectedDimension: requestBody.dimension,
            selectedMetric: requestBody.metric,
            kpiData: apiData.results.kpiData,
            summaryData: {
                total: apiData.results.kpiData?.totalRevenue?.value || 0,
                periodComparison: '+0%', 
                contribution: '0%', 
                topPerformerName: apiData.results.kpiData?.topPerformingRegion?.value || 'N/A',
                topPerformerLabel: requestBody.dimension === 'region' ? 'Top Region' : `Top ${requestBody.dimension}`
            },
            chartType: props.chartType || (componentName === 'overview' ? 'bar' : undefined),
            ...(componentName === 'timeSeries' && {
                initialGranularity: requestBody.time_granularity
            }),
            ...props 
          };
        } else {
          componentData = { data: [], loading: false, error: 'Failed to fetch data' };
        }

      } else if (toolName === 'customer-segmentation') {
        const response = await fetch(`/api/customer-segmentation/data?start_date=2017-01-01&end_date=2021-12-31`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const apiData = await response.json();
        const data = apiData.data; // Extract the data object

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 }; // Default for individual components

        if (componentName === 'dashboard') {
          componentSpecificData = data; // Dashboard gets all data
          componentSize = { width: 1200, height: 800 };
        } else {
          // Individual components get specific data
          switch (componentName) {
            case 'distributionMap':
              componentSpecificData = { 
                data: data.segment_data || [],
                segmentColors: data.metadata?.segment_colors || {},
                isLoading: false
              };
              componentSize = { width: 800, height: 600 };
              break;
            case 'profileCards':
              componentSpecificData = { 
                segments: data.segment_distribution || [],
                isLoading: false
              };
              componentSize = { width: 1000, height: 500 };
              break;
            case 'metricComparison':
              componentSpecificData = { 
                data: data.segment_comparison || [],
                isLoading: false
              };
              componentSize = { width: 800, height: 500 };
              break;
            case 'kpiTiles':
              componentSpecificData = { 
                kpis: data.kpi_data || {},
                isLoading: false
              };
              componentSize = { width: 1000, height: 200 };
              break;
            default:
              console.warn(`Data mapping not defined for customer-segmentation component: ${componentName}. Using full data.`);
              componentSpecificData = data; // Fallback to full data if unknown component
              componentSize = { width: 400, height: 300 }; // Fallback size
          }
        }
        
        // Merge with any externally provided props
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'customer-behaviour') {
        const response = await fetch(`/api/customer-behaviour/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateRange: { start: '2017-01-01', end: '2021-12-31' }
          })
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json(); // Full dataset for customer behaviour



        let componentSpecificData = {};
        let componentSize = { width: 900, height: 700 }; // Default for dashboard view

        if (componentName === 'dashboard') {
          componentSpecificData = data; // Dashboard gets all data
        } else {
          // Individual components get specific data and a smaller, more appropriate default size
          componentSize = { width: 500, height: 400 }; 
          switch (componentName) {
            case 'radar':
              // API returns data.patterns, component expects props.patterns
              componentSpecificData = { patterns: data.patterns }; 
              break;
            case 'histogram':
              // API returns data.patterns, component expects props.patterns
              componentSpecificData = { patterns: data.patterns }; 
              break;
            case 'treemap':
              // API returns data.patterns, component expects props.categories
              componentSpecificData = { categories: data.patterns }; 
              break;
            case 'donut':
              // API returns data.patterns, component expects props.channels
              componentSpecificData = { channels: data.patterns }; 
              break;
            default:
              console.warn(`Data mapping not defined for customer-behaviour component: ${componentName}. Using full data.`);
              componentSpecificData = data; // Fallback to full data if unknown component
              componentSize = { width: 400, height: 300 }; // Fallback size
          }
        }
        
        // Merge with any externally provided props for the component (props is the argument to spawnComponent)
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'churn-prediction') {
        const requestBody = {
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          riskThreshold: props.riskThreshold || props.risk_threshold || 0.5,
          modelType: props.modelType || props.model_type || 'random_forest',
          customerSegment: props.customerSegment || props.customer_segment || null
        };
        
        const response = await fetch(`/api/churn-prediction/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json(); // Full dataset for churn prediction

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 }; // Default for individual components

        if (componentName === 'dashboard') {
          componentSpecificData = data; // Dashboard gets all data
          componentSize = { width: 900, height: 700 };
        } else {
          // Individual components get specific data and a smaller, more appropriate default size
          switch (componentName) {
            case 'riskPyramid':
              // API returns data.customers, component expects props.customers
              componentSpecificData = { customers: data.customers || [] };
              break;
            case 'featureImportance':
              // API returns data.feature_importance, component expects props.features
              componentSpecificData = { features: data.feature_importance || [] };
              break;
            case 'probabilityHistogram':
              // API returns data.probabilities, component expects props.probabilities
              componentSpecificData = { probabilities: data.probabilities || [] };
              break;
            case 'temporalRisk':
              // API returns data.risk_time_series, component expects props.riskTimeSeries
              componentSpecificData = { riskTimeSeries: data.risk_time_series || [] };
              break;
            case 'segmentMatrix':
              // API returns data.segment_matrix, component expects props.segmentMatrix
              componentSpecificData = { segmentMatrix: data.segment_matrix || [] };
              break;
            default:
              console.warn(`Data mapping not defined for churn-prediction component: ${componentName}. Using full data.`);
              componentSpecificData = data; // Fallback to full data if unknown component
              componentSize = { width: 400, height: 300 }; // Fallback size
          }
        }
        
        // Merge with any externally provided props
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'anomaly-detection') {
        const requestBody = {
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          anomalyThreshold: props.anomalyThreshold || props.anomaly_threshold || 0.1,
          detectionMethod: props.detectionMethod || props.detection_method || 'isolation_forest',
          customerSegment: props.customerSegment || props.customer_segment || null
        };
        
        const response = await fetch(`/api/anomaly-detection/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json(); // Full dataset for anomaly detection

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 }; // Default for individual components

        if (componentName === 'dashboard') {
          componentSpecificData = data.data; // Dashboard gets all data
          componentSize = { width: 1200, height: 800 };
        } else {
          // Individual components get specific data and a smaller, more appropriate default size
          switch (componentName) {
            case 'severityDistribution':
              // API returns data.data.severityDistribution, component expects props.severityData
              componentSpecificData = { severityData: data.data.severityDistribution || [] };
              break;
            case 'featureContribution':
              // API returns data.data.anomalies and featureContributions, component expects props.anomalies and featureContributions
              componentSpecificData = { 
                anomalies: data.data.anomalies || [], 
                featureContributions: data.data.featureContributions || [] 
              };
              componentSize = { width: 600, height: 500 };
              break;
            case 'anomalyTable':
              // API returns data.data.anomalies, component expects props.anomalies
              componentSpecificData = { anomalies: data.data.anomalies || [] };
              componentSize = { width: 800, height: 400 };
              break;
            case 'kpiTiles':
              // API returns data.data.kpis, component expects props.kpis
              componentSpecificData = { kpis: data.data.kpis || {} };
              componentSize = { width: 600, height: 200 };
              break;
            default:
              console.warn(`Data mapping not defined for anomaly-detection component: ${componentName}. Using full data.`);
              componentSpecificData = data.data; // Fallback to full data if unknown component
              componentSize = { width: 400, height: 300 }; // Fallback size
          }
        }
        
        // Merge with any externally provided props
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'transaction-patterns') {
        const requestBody = {
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          patternType: props.patternType || props.pattern_type || 'temporal',
          anomalyThreshold: props.anomalyThreshold || props.anomaly_threshold || 0.1,
          aggregationLevel: props.aggregationLevel || props.aggregation_level || 'daily'
        };
        
        const response = await fetch(`/api/transaction-patterns/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch transaction patterns data');
        const data = await response.json();

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data.data;
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { kpis: data.data.kpis || {} };
              componentSize = { width: 800, height: 200 };
              break;
            case 'temporalHeatmap':
              componentSpecificData = { data: data.data.temporalHeatmap || [] };
              componentSize = { width: 600, height: 400 };
              break;
            case 'timeSeriesChart':
              componentSpecificData = { data: data.data.timeSeriesData || [] };
              componentSize = { width: 800, height: 400 };
              break;
            default:
              console.warn(`Data mapping not defined for transaction-patterns component: ${componentName}. Using full data.`);
              componentSpecificData = data.data;
              componentSize = { width: 400, height: 300 };
          }
        }
        
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'customer-lifetime-value') {
        const requestBody = {
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          predictionPeriod: props.predictionPeriod || props.prediction_period || '12months',
          customerSegment: props.customerSegment || props.customer_segment || null,
          valueType: props.valueType || props.value_type || 'total_ltv',
          currency: props.currency || 'USD'
        };
        
        const response = await fetch(`/api/customer-lifetime-value/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch customer lifetime value data');
        const data = await response.json();

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data.data;
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { kpis: data.data.kpis || {} };
              componentSize = { width: 800, height: 200 };
              break;
            case 'ltvDistribution':
              componentSpecificData = { data: data.data.ltvDistribution || [] };
              componentSize = { width: 640, height: 380 };
              break;
            case 'predictionAccuracy':
              componentSpecificData = { data: data.data.predictionAccuracy || [] };
              componentSize = { width: 720, height: 420 };
              break;
            case 'geographicMap':
              componentSpecificData = { data: data.data.geographicValue || [] };
              componentSize = { width: 720, height: 520 };
              break;
            case 'customerExplorer':
              componentSpecificData = { data: data.data.customerExplorer || [] };
              componentSize = { width: 840, height: 580 };
              break;
            case 'valueContribution':
              componentSpecificData = { data: data.data.valueContribution || [] };
              componentSize = { width: 560, height: 360 };
              break;
            case 'timeProjection':
              componentSpecificData = { data: data.data.ltvOverTime || [] };
              componentSize = { width: 720, height: 340 };
              break;
            case 'filterPanel':
              componentSpecificData = { 
                filters: {
                  dateRange: data.data.metadata?.filtersApplied?.dateRange || null,
                  region: data.data.metadata?.filtersApplied?.region || [],
                  customerType: data.data.metadata?.filtersApplied?.customerType || [],
                  valueRange: data.data.metadata?.filtersApplied?.valueRange || null
                },
                onFilterChange: (newFilters) => console.log('Filter changed:', newFilters)
              };
              componentSize = { width: 300, height: 400 };
              break;
            default:
              console.warn(`Data mapping not defined for customer-lifetime-value component: ${componentName}. Using full data.`);
              componentSpecificData = data.data;
              componentSize = { width: 400, height: 300 };
          }
        }
        
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'engagement-classifier') {
        const requestBody = {
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          engagementMetrics: props.engagementMetrics || props.engagement_metrics || ['frequency', 'recency', 'monetary'],
          classificationThresholds: props.classificationThresholds || props.classification_thresholds || null,
          customerSegment: props.customerSegment || props.customer_segment || null,
          channel: props.channel || null
        };
        
        const response = await fetch(`/api/engagement-classifier/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch engagement classifier data');
        const data = await response.json();

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data.data;
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { kpis: data.data.kpis || {} };
              componentSize = { width: 800, height: 200 };
              break;
            case 'pyramid':
              componentSpecificData = { distribution: data.data.distribution || [] };
              componentSize = { width: 600, height: 480 };
              break;
            case 'timeline':
              componentSpecificData = { timeline: data.data.timeline || [] };
              componentSize = { width: 840, height: 360 };
              break;
            case 'opportunityFinder':
              componentSpecificData = { opportunities: data.data.opportunities || [] };
              componentSize = { width: 880, height: 400 };
              break;
            default:
              console.warn(`Data mapping not defined for engagement-classifier component: ${componentName}. Using full data.`);
              componentSpecificData = data.data;
              componentSize = { width: 400, height: 300 };
          }
        }
        
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'next-purchase') {
        const requestBody = {
          timeframe: props.timeframe || props.time_frame || '3months',
          confidenceThreshold: props.confidenceThreshold || props.confidence_threshold || 0.7,
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          customerSegment: props.customerSegment || props.customer_segment || null,
          productCategory: props.productCategory || props.product_category || null
        };
        
        const response = await fetch(`/api/next-purchase/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch next purchase data');
        const data = await response.json();

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data.data;
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { kpis: data.data.kpis || {} };
              componentSize = { width: 800, height: 200 };
              break;
            case 'confidenceMatrix':
              componentSpecificData = { 
                data: data.data.visualizationData?.confidenceMatrix || [],
                timeframe: '3months'
              };
              componentSize = { width: 640, height: 480 };
              break;
            case 'customerJourney':
              componentSpecificData = { 
                data: data.data.visualizationData?.customerTimeline || [],
                selectedCustomer: null
              };
              componentSize = { width: 900, height: 400 };
              break;
            case 'affinityNetwork':
              componentSpecificData = { 
                data: data.data.visualizationData?.affinityNetwork || [],
                minStrength: 0.3
              };
              componentSize = { width: 600, height: 600 };
              break;
            default:
              console.warn(`Data mapping not defined for next-purchase component: ${componentName}. Using full data.`);
              componentSpecificData = data.data;
              componentSize = { width: 400, height: 300 };
          }
        }
        
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;

      } else if (toolName === 'sales-trends') {
        // Allow passing filters via props, fallback to actual data range if not provided
        const filters = props.filters || {
          startDate: '2017-01-01',
          endDate: '2021-12-31',
          timePeriod: 'monthly',
          metric: 'revenue',
          dimension: null
        };
        const response = await fetch(`/api/sales-trends/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        });
        if (!response.ok) throw new Error('Failed to fetch sales trends data');

        const data = await response.json();

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {

          componentSpecificData = {
            ...data.data,
            initialFilters: filters
          };
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'timeSeriesExplorer':
              componentSpecificData = { 
                data: data.data.mainData || [],
                filters: {
                  startDate: filters.startDate,
                  endDate: filters.endDate,
                  timePeriod: filters.timePeriod,
                  metric: filters.metric,
                  dimension: filters.dimension
                },
                onFilterChange: () => {}, // Placeholder for spawned components
                isLoading: false
              };
              componentSize = { width: 800, height: 500 };
              break;
            case 'seasonalPatternAnalyzer':
              componentSpecificData = { 
                data: data.data.seasonality || [],
                timePeriod: filters.timePeriod,
                onTimePeriodChange: () => {}, // Placeholder for spawned components
                isLoading: false
              };
              componentSize = { width: 720, height: 460 };
              break;
            case 'growthRateVisualizer':
              componentSpecificData = { 
                data: data.data.growthRates || [],
                timePeriod: filters.timePeriod,
                onTimePeriodChange: () => {}, // Placeholder for spawned components
                isLoading: false
              };
              componentSize = { width: 680, height: 420 };
              break;
            case 'kpiTiles':
              componentSpecificData = { 
                data: data.data.kpis || {},
                isLoading: false
              };
              componentSize = { width: 600, height: 200 };
              break;
            default:
              console.warn(`Data mapping not defined for sales-trends component: ${componentName}. Using full data.`);

              componentSpecificData = data.data;
              componentSize = { width: 400, height: 300 };
          }
        }
        
        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;

      } else if (toolName === 'regional-sales') {
        console.log(`[Canvas DEBUG] Fetching regional sales data for ${componentName}`);
        
        // Build request body from user's query parameters and props
        // Map frontend parameters to backend format
        const requestBody = {
          dateRange: {
            start: props.startDate || props.start_date || '2017-01-01',
            end: props.endDate || props.end_date || '2021-12-31'
          },
          country: props.country || null,
          state: props.state || props.region || null, // map region to state
          aggregation: props.timePeriod || props.time_granularity || props.aggregation || 'month'
        };
        
        console.log(`[Canvas DEBUG] Regional sales request body:`, requestBody);
        
        const response = await fetch('/api/regional-sales-analyzer/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error('Failed to fetch regional sales data');
        const apiData = await response.json();
        console.log(`[Canvas DEBUG] Regional sales API response:`, apiData);
        const data = apiData.data;

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data;

          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { 
                kpis: data.kpis || {},

                isLoading: false
              };
              componentSize = { width: 1000, height: 200 };
              break;
            case 'performanceMap':
              componentSpecificData = { 
                data: data.regionalSalesData || [],
                countryData: data.countryLevelData || [],
                selectedMetric: 'totalSales',
                selectedRegions: [],
                filters: data.metadata?.appliedFilters || {},
                isLoading: false
              };
              componentSize = { width: 800, height: 600 };
              break;
            case 'timeSeriesExplorer':
              componentSpecificData = { 
                data: data.timeSeriesData || {},
                selectedRegions: ['overall'],
                dateRange: data.metadata?.dateRange || {},
                aggregation: 'month',
                isLoading: false
              };
              componentSize = { width: 900, height: 600 };
              break;
            default:
              componentSpecificData = data;
              componentSize = { width: 400, height: 300 };
          }
        }

        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'inventory-level-analyzer') {
        console.log(`[Canvas DEBUG] Fetching inventory level data for ${componentName}`);
        const response = await fetch('/api/inventory-level-analyzer/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time_period: props.time_period || 'last_quarter',
            category: props.category || '',
            warehouse_id: props.warehouse_id || '',
            min_stock_threshold: props.min_stock_threshold || 0.1
          })
        });
        if (!response.ok) throw new Error('Failed to fetch inventory level data');
        const apiData = await response.json();
        console.log(`[Canvas DEBUG] Inventory level API response:`, apiData);
        const data = apiData.data;

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data;
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { 
                kpis: data.kpis || {},
                isLoading: false
              };
              componentSize = { width: 1000, height: 200 };
              break;
            case 'healthMatrix':
              componentSpecificData = { 
                data: data.visualizations?.healthMatrix || {},
                isLoading: false,
                threshold: 0.1,
                onCellClick: (category, warehouse, cell) => console.log('Health matrix cell clicked:', { category, warehouse, cell }),
                onThresholdChange: (threshold) => console.log('Threshold changed:', threshold)
              };
              componentSize = { width: 800, height: 600 };
              break;
            case 'stockoutRisk':
              componentSpecificData = { 
                data: data.visualizations?.stockoutRisk || [],
                isLoading: false
              };
              componentSize = { width: 600, height: 400 };
              break;
            case 'distribution':
              componentSpecificData = { 
                data: data.visualizations?.distribution || [],
                isLoading: false
              };
              componentSize = { width: 700, height: 500 };
              break;
            case 'itemAnalyzer':
              componentSpecificData = { 
                data: data.visualizations?.itemAnalyzer || [],
                isLoading: false,
                onItemSelect: (selectedItems) => console.log('Items selected:', selectedItems),
                onSort: (column, direction) => console.log('Sort:', column, direction),
                onFilter: (filterState) => console.log('Filter:', filterState)
              };
              componentSize = { width: 900, height: 600 };
              break;
            case 'trends':
              componentSpecificData = { 
                data: data.visualizations?.trends || [],
                isLoading: false
              };
              componentSize = { width: 800, height: 400 };
              break;
            default:
              componentSpecificData = data;
              componentSize = { width: 400, height: 300 };
          }
        }

        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else if (toolName === 'inventory-holding-cost-analyzer') {
        console.log(`[Canvas DEBUG] Fetching inventory holding cost data for ${componentName}`);
        const response = await fetch('/api/inventory-holding-cost-analyzer/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: props.category || null,
            warehouseId: props.warehouseId || null,
            annualHoldingCostPercentage: props.annualHoldingCostPercentage || 0.25,
            opportunityCostRate: props.opportunityCostRate || 0.08
          })
        });
        if (!response.ok) throw new Error('Failed to fetch inventory holding cost data');
        const apiData = await response.json();
        console.log(`[Canvas DEBUG] Inventory holding cost API response:`, apiData);
        const data = apiData.data;

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 };

        if (componentName === 'dashboard') {
          componentSpecificData = data;
          componentSize = { width: 1200, height: 800 };
        } else {
          switch (componentName) {
            case 'kpiTiles':
              componentSpecificData = { 
                kpis: data.kpis || null,
                isLoading: false,
                error: null
              };
              componentSize = { width: 1000, height: 200 };
              break;
            case 'costBreakdown':
              componentSpecificData = { 
                data: data.costBreakdown || null,
                isLoading: false,
                viewType: 'component',
                onViewTypeChange: (viewType) => console.log('View type changed:', viewType),
                width: 600,
                height: 480
              };
              componentSize = { width: 600, height: 600 };
              break;
            case 'excessiveCostGrid':
              componentSpecificData = { 
                data: data.excessiveItems || [],
                isLoading: false,
                threshold: 0.30,
                onThresholdChange: (threshold) => console.log('Threshold changed:', threshold),
                sortBy: 'cost',
                onSortChange: (sortBy) => console.log('Sort changed:', sortBy),
                groupBy: 'category',
                onGroupByChange: (groupBy) => console.log('Group by changed:', groupBy),
                width: 600,
                height: 480
              };
              componentSize = { width: 900, height: 500 };
              break;
            case 'costTrend':
              componentSpecificData = { 
                data: data.trendData?.map(item => ({
                  date: item.Snapshot_Date,
                  total_cost: item.Estimated_Holding_Cost,
                  cost_percentage: item.Holding_Cost_Percentage,
                  capital_cost: item.Estimated_Holding_Cost * 0.4,
                  storage_cost: item.Estimated_Holding_Cost * 0.2,
                  risk_cost: item.Estimated_Holding_Cost * 0.2,
                  opportunity_cost: item.Estimated_Holding_Cost * 0.2
                })) || [],
                isLoading: false,
                width: 600,
                height: 400
              };
              componentSize = { width: 800, height: 400 };
              break;
            case 'warehouseComparison':
              componentSpecificData = { 
                data: data.costBreakdown ? 
                  Object.entries(data.costBreakdown.byWarehouse || {}).map(([warehouseId, warehouse]) => ({
                    warehouse_id: warehouseId,
                    warehouse_name: warehouse.warehouseName,
                    warehouse_type: warehouse.warehouseType,
                    total_cost: warehouse.totalCost,
                    cost_percentage: warehouse.totalCost / warehouse.totalValue,
                    capital_cost: warehouse.components.capital,
                    storage_cost: warehouse.components.storage,
                    risk_cost: warehouse.components.risk,
                    opportunity_cost: warehouse.components.opportunity,
                    item_count: warehouse.itemCount,
                    cost_per_item: warehouse.totalCost / warehouse.itemCount,
                    inventory_value: warehouse.totalValue
                  })) : [],
                isLoading: false,
                width: 600,
                height: 400,
                onWarehouseSelect: (warehouse) => console.log('Selected warehouse:', warehouse),
                onSortChange: (sortBy) => console.log('Sort changed:', sortBy)
              };
              componentSize = { width: 700, height: 500 };
              break;
            default:
              componentSpecificData = data;
              componentSize = { width: 400, height: 300 };
          }
        }

        const mergedProps = { ...componentSpecificData, ...props };

        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      } else {
        // Default: purchase-frequency tools with historical data range
        const response = await fetch(`/api/purchase-frequency/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateRange: { start: '2017-01-01', end: '2021-12-31' }
          })
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        // Map the component to its data
        switch (componentName) {
          case 'histogram':
            componentData = { 
              data: data.data.frequencyDistribution || [],
              meanFrequency: data.data.kpis?.avgPurchaseFrequency || 0,
              highThreshold: 5,
              lowThreshold: 2
            };
            break;
          case 'treemap':
            componentData = { 
              data: data.data.valueSegments || [],
              isLoading: false
            };
            break;
          case 'heatmap':
            componentData = { 
              data: data.data.intervalHeatmap || [],
              isLoading: false
            };
            break;
          case 'quadrant':
            // Transform data to match SegmentQuadrant.tsx expectations
            const transformedSegmentData = (data.data.customerSegments || []).map(item => ({
              id: item.customerId,
              frequency: item.frequency,
              monetary: item.monetaryValue, // Transform monetaryValue to monetary
              recency: item.recencyDays,     // Transform recencyDays to recency
              segment: item.segment,
              customerName: item.customerName,
              avgTransactionValue: item.avgTransactionValue
            }));
            componentData = { 
              data: transformedSegmentData,
              isLoading: false
            };
            break;
          case 'regularity':
            componentData = { 
              data: data.data.regularityChart || [],
              isLoading: false
            };
            break;
          default:
            componentData = {};
        }
        // Merge the fetched data with any provided props
        const mergedProps = { ...componentData, ...props };
        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }
        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: { width: 400, height: 300 }, // Default size that can be resized
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      }

      // Customer Segmentation tool
      if (toolName === 'customer-segmentation') {
        const response = await fetch('/api/customer-segmentation/data');
        if (!response.ok) {
          throw new Error(`Failed to fetch customer segmentation data for ${componentName}`);
        }
        const apiData = await response.json();
        
        // Map the component to its data
        switch (componentName) {
          case 'distributionMap':
            componentData = { 
              data: apiData.data?.segment_data || [],
              selectedSegments: [],
              width: 760,
              height: 560
            };
            break;
          case 'profileCards':
            componentData = { 
              segmentDistribution: apiData.data?.segment_distribution || [],
              segmentComparison: apiData.data?.segment_comparison || [],
              width: 320,
              height: 400
            };
            break;
          case 'metricComparison':
            componentData = { 
              segmentComparison: apiData.data?.segment_comparison || [],
              selectedMetric: 'avg_lifetime_value',
              width: 760,
              height: 440
            };
            break;
          case 'kpiTiles':
            componentData = { 
              kpiData: apiData.data?.kpi_data || null,
              segmentDistribution: apiData.data?.segment_distribution || []
            };
            break;
          case 'dashboard':
            componentData = { 
              initialFilters: {},
              width: 1200,
              height: 800
            };
            break;
          default:
            componentData = {};
        }
        
        // Merge the fetched data with any provided props
        const mergedProps = { ...componentData, ...props };
        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }
        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: { 
              width: componentData.width || 400, 
              height: componentData.height || 300 
            },
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      }
      
      // Retention Planner tool
      if (toolName === 'retention-planner') {
        const response = await fetch(`/api/retention-planner/data`);
        if (!response.ok) throw new Error('Failed to fetch retention planner data');
        const data = await response.json();

        let componentSpecificData = {};
        let componentSize = { width: 500, height: 400 }; // Default for individual components

        if (componentName === 'dashboard') {
          componentSpecificData = data.data; // Dashboard gets all data
          componentSize = { width: 1200, height: 800 };
        } else {
          // Individual components get specific data
          switch (componentName) {
            case 'churnRiskGauge':
              console.log('🔍 ChurnRiskGauge data:', {
                riskDistribution: data.data.visualizations?.churnRiskDistribution,
                avgChurnRisk: data.data.kpis?.avgChurnRisk,
                kpis: data.data.kpis
              });
              componentSpecificData = { 
                data: data.data.visualizations?.churnRiskDistribution || [],
                avgRisk: data.data.kpis?.avgChurnRisk || 0.5,
                threshold: 0.5,
                isLoading: false
              };
              componentSize = { width: 600, height: 500 };
              break;
            case 'valueRiskMatrix':
              componentSpecificData = { 
                data: data.data.visualizations?.valueRiskMatrix || [],
                isLoading: false
              };
              componentSize = { width: 800, height: 600 };
              break;
            case 'actionSankey':
              const actionData = data.data.visualizations?.actionAllocation || { nodes: [], links: [] };
              console.log('🔍 ActionSankey RAW API data:', data.data.visualizations?.actionAllocation);
              console.log('🔍 ActionSankey processed data:', actionData);
              console.log('🔍 ActionSankey final data for component:', {
                hasNodes: !!actionData.nodes,
                hasLinks: !!actionData.links,
                nodeCount: actionData.nodes?.length,
                linkCount: actionData.links?.length,
                firstLink: actionData.links?.[0]
              });
              componentSpecificData = { 
                data: actionData,
                isLoading: false
              };
              componentSize = { width: 800, height: 500 };
              break;
            case 'roiWaterfall':
              console.log('🔍 ROIWaterfall data:', {
                roiProjection: data.data.visualizations?.roiProjection,
                dataLength: data.data.visualizations?.roiProjection?.length,
                firstItem: data.data.visualizations?.roiProjection?.[0]
              });
              componentSpecificData = { 
                data: data.data.visualizations?.roiProjection || [],
                isLoading: false
              };
              componentSize = { width: 700, height: 500 };
              break;
            case 'kpiTiles':
              componentSpecificData = { 
                kpis: data.data.kpis || {},
                isLoading: false
              };
              componentSize = { width: 1000, height: 200 };
              break;
            default:
              console.warn(`Data mapping not defined for retention-planner component: ${componentName}. Using full data.`);
              componentSpecificData = data.data; // Fallback to full data if unknown component
              componentSize = { width: 400, height: 300 }; // Fallback size
          }
        }
        
        // Merge with any externally provided props
        const mergedProps = { ...componentSpecificData, ...props };

        setComponents(prev => [
          ...prev,
          {
            id,
            type: componentType,
            position: componentPosition,
            size: componentSize,
            props: mergedProps,
            Component: componentRegistry[toolName][componentName]
          }
        ]);
        setLoading(false);
        return id;
      }

      // For product-performance and sales-performance tools that don't return early
      if (toolName === 'product-performance' || toolName === 'sales-performance') {
        // Merge the fetched data with any provided props
        const mergedProps = { ...componentData, ...props };
        
        let componentPosition;
        if (position) {
          componentPosition = position;
        } else {
          // Try to find a non-overlapping position
          componentPosition = findNonOverlappingPosition(componentSize);
          if (!componentPosition) {
            // If no space, auto-zoom out and try again
            componentPosition = await autoZoomOutAndFindSpace(componentSize);
          }
        }
        
        const newComponent = {
          id,
          type: componentType,
          position: componentPosition,
          size: { width: 400, height: 300 }, // Default size that can be resized
          props: mergedProps,
          Component: componentRegistry[toolName][componentName]
        };

        setComponents(prev => [
          ...prev,
          newComponent
        ]);
        setLoading(false);
        return id;
      }
    } catch (error) {
      console.error(`Error in spawnComponent for ${componentType}:`, error);
      handleFetchError(error);
      return null;
    }
  };
  
  // Function to update an existing component
  const updateComponent = (componentId, newProps) => {
    setComponents(prev => 
      prev.map(component => 
        component.id === componentId 
          ? { ...component, props: { ...component.props, ...newProps } }
          : component
      )
    );
  };
  
  // Function to remove a component
  const removeComponent = (componentId) => {
    setComponents(prev => prev.filter(component => component.id !== componentId));
  };
  
  // Function to start dragging a component
  const handleDragStart = (e, component) => {
    e.stopPropagation(); // Prevent event bubbling
    setActiveComponent(component.id);
    setIsDragging(true);
    
    // Calculate offset from mouse to component position (accounting for zoom/pan)
    const transformedX = (e.clientX - pan.x) / zoom;
    const transformedY = (e.clientY - pan.y) / zoom;
    setDragOffset({
      x: transformedX - component.position.x,
      y: transformedY - component.position.y,
    });
    e.preventDefault();
  };
  
  // Function to start resizing a component
  const handleResizeStart = (e, component) => {
    e.stopPropagation(); // Prevent event bubbling
    setActiveComponent(component.id);
    setIsResizing(true);
    setInitialSize({
      width: component.size.width,
      height: component.size.height,
    });
    
    // Store resize start in transformed coordinates
    const transformedX = (e.clientX - pan.x) / zoom;
    const transformedY = (e.clientY - pan.y) / zoom;
    setResizeStart({
      x: transformedX,
      y: transformedY,
    });
    e.preventDefault();
  };
  
  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && activeComponent) {
        // Get canvas boundaries and account for zoom/pan
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;
        
        // Transform mouse coordinates to canvas space
        const transformedX = (e.clientX - pan.x) / zoom;
        const transformedY = (e.clientY - pan.y) / zoom;
        
        // Calculate new position with boundary constraints
        const newX = transformedX - dragOffset.x;
        const newY = transformedY - dragOffset.y;
        
        // No position restrictions - components can move anywhere in infinite space
        // Only apply minimal constraints to prevent extreme values
        const minX = -10000;
        const minY = -10000;
        const maxX = 10000;
        const maxY = 10000;
        
        const constrainedX = Math.max(minX, Math.min(maxX, newX));
        const constrainedY = Math.max(minY, Math.min(maxY, newY));
        
        // Update only the active component position while dragging
        setComponents(prev => 
          prev.map(comp => 
            comp.id === activeComponent
              ? { 
                  ...comp, 
                  position: { 
                    x: isFinite(constrainedX) ? constrainedX : comp.position.x,
                    y: isFinite(constrainedY) ? constrainedY : comp.position.y
                  } 
                }
              : comp
          )
        );
      } else if (isResizing && activeComponent) {
        // Get canvas boundaries and account for zoom
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;
        
        // Transform mouse coordinates to canvas space
        const transformedX = (e.clientX - pan.x) / zoom;
        const transformedY = (e.clientY - pan.y) / zoom;
        
        // Calculate new size with boundary constraints
        const deltaX = (transformedX - resizeStart.x) * zoom;
        const deltaY = (transformedY - resizeStart.y) * zoom;
        
        // Size constraints - only restrict minimum and maximum reasonable sizes
        const minWidth = 200;
        const minHeight = 150;
        const maxWidth = 2000; // Maximum reasonable width
        const maxHeight = 1500; // Maximum reasonable height
        
        const newWidth = Math.max(minWidth, Math.min(maxWidth, initialSize.width + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, initialSize.height + deltaY));
        
        // Update only the active component size while resizing
        setComponents(prev => 
          prev.map(comp => 
            comp.id === activeComponent
              ? { 
                  ...comp, 
                  size: { 
                    width: isFinite(newWidth) ? newWidth : comp.size.width,
                    height: isFinite(newHeight) ? newHeight : comp.size.height
                  } 
                }
              : comp
          )
        );
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setActiveComponent(null);
    };
    
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, activeComponent, dragOffset, initialSize, resizeStart]);

  // Handle pan events
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPanning && !isDragging && !isResizing) {
        handlePanMove(e);
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        handlePanEnd();
      }
    };

    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, isDragging, isResizing]);
  
  // Function to handle zoom
  const handleZoom = (delta, centerX = 0, centerY = 0) => {
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
    const zoomRatio = newZoom / zoom;
    
    // Calculate new pan to zoom towards center
    const newPanX = centerX - (centerX - pan.x) * zoomRatio;
    const newPanY = centerY - (centerY - pan.y) * zoomRatio;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Function to reset view to center on components
  const resetView = () => {
    if (components.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    // Calculate bounds of all components
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    components.forEach(component => {
      minX = Math.min(minX, component.position.x);
      minY = Math.min(minY, component.position.y);
      maxX = Math.max(maxX, component.position.x + component.size.width);
      maxY = Math.max(maxY, component.position.y + component.size.height);
    });

    // Handle edge cases where components might be at infinity
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    // Calculate center of components
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate canvas center
    const canvasWidth = canvasRef.current?.offsetWidth || 800;
    const canvasHeight = canvasRef.current?.offsetHeight || 600;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    // Calculate pan to center components
    const newPanX = canvasCenterX - centerX;
    const newPanY = canvasCenterY - centerY;

    // Ensure pan values are finite
    const finalPanX = isFinite(newPanX) ? newPanX : 0;
    const finalPanY = isFinite(newPanY) ? newPanY : 0;

    // Calculate optimal zoom to fit all components with padding
    const componentWidth = maxX - minX;
    const componentHeight = maxY - minY;
    const padding = 100; // Padding around components
    
    const zoomX = (canvasWidth - padding * 2) / componentWidth;
    const zoomY = (canvasHeight - padding * 2) / componentHeight;
    const optimalZoom = Math.min(1, Math.min(zoomX, zoomY)); // Don't zoom in beyond 100%

    setZoom(optimalZoom);
    setPan({ x: finalPanX, y: finalPanY });
  };

  // Function to handle pan start
  const handlePanStart = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    if (isDragging || isResizing) return; // Don't pan if dragging/resizing components
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.preventDefault();
  };

  // Function to handle pan move
  const handlePanMove = (e) => {
    if (!isPanning || isDragging || isResizing) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  // Function to handle pan end
  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Function to highlight a component
  const highlightComponent = (componentId, reason) => {
    // Find the component
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    // Calculate laser target in screen coordinates (accounting for zoom/pan)
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    // Calculate the actual screen position of the component
    const componentScreenX = (component.position.x * zoom) + pan.x;
    const componentScreenY = (component.position.y * zoom) + pan.y;
    
    // Calculate target relative to the robot's container
    const targetX = componentScreenX + (component.size.width * zoom) / 2;
    const targetY = componentScreenY + (component.size.height * zoom) / 2;
    
    // Update robot to point at the component
    setRobotState({
      ...robotState,
      state: 'pointing',
      laserTarget: {
        x: targetX,
        y: targetY,
      },
      message: reason,
    });
  };

  
  const setVisualisation = async (visualisation) => {
    if (visualisation && Array.isArray(visualisation)) {
      console.log('Visualization data received from API:', visualisation);
      let spawnedComponents = [];
      for (const componentSpec of visualisation) {
        const { toolname, componentName, body } = componentSpec;
        
        if (toolname && componentName) {
          const componentType = `${toolname}.${componentName}`;
          console.log(`[QueryResolver] Spawning component: ${componentType} with props:`, body);
          
          try {
            const componentId = await spawnComponent(componentType, body || {});
            if (componentId) {
              spawnedComponents.push(componentName);
            }
          } catch (error) {
            console.error(`Failed to spawn component ${componentType}:`, error);
          }
        }
      }
    }
  }


  const playAudio = (audioData) => {
    const audio = new Audio(audioData.url);
    audio.play();
  }

  const onAudioFinish = () => {
    setAudio(null);
    console.log("Audio finished")
  }

  useEffect(() => {
    if (queue.length > 0) {
      console.log("Queue length", queue.length)
      console.log("Queue", queue)
      console.log("First queue", queue[0])
      if (audio) {
        if(audio.ended) {
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: queue[0].text ? queue[0].text : " "
          })

          const tempAudio = new Audio(`data:${queue[0].audio.mime_type};base64,${queue[0].audio.data}`);
          setVisualisation(queue[0].visualisation);

          setAudio(tempAudio);

          tempAudio.play();
          tempAudio.onended = onAudioFinish;

          setQueue(prev => prev.slice(1));

        } else {
          return;
        }
      } else {
        const tempAudio = new Audio(`data:${queue[0].audio.mime_type};base64,${queue[0].audio.data}`);
        setRobotState({
          ...robotState,
          state: 'speaking',
          message: queue[0].text ? queue[0].text : " "
        })
        setVisualisation(queue[0].visualisation);
        setAudio(tempAudio);
        tempAudio.play();
        tempAudio.onended = onAudioFinish;
        setQueue(prev => prev.slice(1));
      }
    } else {
      setAudio(null);
    }
  }, [queue, audio])

  const handQuerySubmit2 = async (query) => {
    console.log('Query from Robot:', query);
    // console.log('Context from Robot:', selectedPoints);

    const response = await fetch(`${backendAiUrl}/get_audio_file`, {
      headers: { 'Content-Type': 'application/json' }
    });

    const resolveData = await response.json();

    let audioData = null;

    if (resolveData.response.audio) {
      console.log('Audio data received from API:', {
        hasData: !!resolveData.response.audio.data,
        mimeType: resolveData.response.audio.mime_type,
        size: resolveData.response.audio.size,
        error: resolveData.response.audio.error
      });

      if (resolveData.response.audio.data && !resolveData.response.audio.error) {
        try {
          // Decode base64 audio data and create blob URL
          console.log('Decoding base64 audio data, length:', resolveData.response.audio.data.length);
          
          // Try multiple approaches for decoding base64 audio
          const base64Data = resolveData.response.audio.data;
          let audioArray;
          
          try {
            // Method 1: Using atob and manual conversion
            const binaryString = atob(base64Data);
            audioArray = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
              audioArray[i] = binaryString.charCodeAt(i) & 0xff;
            }
          } catch (atobError) {
            console.warn('atob method failed, trying fetch method:', atobError);
            
            // Method 2: Using fetch with data URL
            try {
              const dataUrl = `data:${resolveData.response.audio.mime_type || 'audio/wav'};base64,${base64Data}`;
              const response = await fetch(dataUrl);
              const arrayBuffer = await response.arrayBuffer();
              audioArray = new Uint8Array(arrayBuffer);
            } catch (fetchError) {
              console.error('Fetch method also failed:', fetchError);
              throw fetchError;
            }
          }
          
          console.log('Decoded audio array length:', audioArray.length);
          console.log('MIME type:', resolveData.response.audio.mime_type);
          
          if (audioArray.length === 0) {
            throw new Error('Decoded audio array is empty');
          }
          
          const audioBlob = new Blob([audioArray], { 
            type: resolveData.response.audio.mime_type || 'audio/wav' 
          });
          
          console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
          
          if (audioBlob.size === 0) {
            throw new Error('Created audio blob is empty');
          }
          
          audioData = {
            url: URL.createObjectURL(audioBlob),
            mimeType: resolveData.response.audio.mime_type,
            size: resolveData.response.audio.size,
            blob: audioBlob // Keep reference for debugging
          };

          playAudio(audioData);
          console.log('Audio blob created successfully:', audioData);
        } catch (error) {
          console.error('Error processing audio data:', error);
          console.error('Base64 data sample:', resolveData.response.audio.data?.substring(0, 100));
          console.error('Audio processing failed, will skip audio playback');
        }
      } else if (resolveData.response.audio.error) {
        console.warn('Audio generation error:', resolveData.response.audio.error);
      }
    }

    // Here you can decide if you want to process this query differently,
    // or perhaps clear selections, etc.
    // For now, let's clear selections after a robot query is submitted via its own input
  }
  
  // Function to handle user queries
  const handleQuerySubmit = async (query, setQuery) => {
    setRobotState({
      ...robotState,
      state: 'thinking',
      message: `Processing: "${query}"`,
    });
    setLoading(true);

    try {
      // Clear user selections when AI starts processing a new general query
      setUserSelectedChartPoints([]);
      
      // Send query to the resolve endpoint  
      console.log('Environment variable NEXT_PUBLIC_BACKEND_AI_URL:', process.env.NEXT_PUBLIC_BACKEND_AI_URL);
      const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8001';
      
      if (!backendAiUrl) {
        throw new Error('Backend AI URL not configured. Please set NEXT_PUBLIC_BACKEND_AI_URL environment variable.');
      }
      
      console.log('Using backend AI URL:', backendAiUrl);
      
      const response = await fetch(`${backendAiUrl}/run_sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ user_query: query })
      });

      setQuery('');

      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Add new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Split into lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          // Process each COMPLETE line immediately
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '').trim();
              
              if (data === '[DONE]' || data === '') continue;
              
              try {
                const jsonData = JSON.parse(data);
                // IMMEDIATE ACTIONS - no waiting!
                console.log('🟢 Immediately processing:', jsonData);
                

                if (jsonData.audio) {
                  setQueue(prev => [...prev, jsonData]);
                  const tempAudio = new Audio(`data:${jsonData.audio.mime_type};base64,${jsonData.audio.data}`);
                  // console.log('Audio data received from API:', jsonData.audio);
                  // tempAudio.play();
                  // tempAudio.onended = onAudioFinish;
                  // setAudio(tempAudio);
                  // setRobotState({
                  //   ...robotState,
                  //   state: 'speaking',
                  //   message: jsonData.text
                  // });
                  console.log("Audio available", jsonData)
                }

                console.log(jsonData.visualisation)

                console.log(robotState)
                
              } catch (e) {
                console.warn('Error in handleQuerySubmit:', e);
              }
            }
          }
          
          // Continue loop immediately - don't wait for more data
        }
      } finally {
        reader.releaseLock();
      }
      

      let resolveData;
    

      if (resolveData?.type === 'text') {
        let spawnedComponents = [];
        let robotMessage = 'I\'ve processed your query.';

        // Extract robot text from adk_last_response
        if (resolveData.type === 'text') {
          const rawText = resolveData.text;
          console.log('Raw text from API:', rawText);
          console.log('Raw text type:', typeof rawText);
          console.log('Raw text length:', rawText?.length);
          
          // Check if text needs decoding or cleaning
          try {
            // Try to clean the text if it's corrupted
            robotMessage = rawText && typeof rawText === 'string' ? rawText : 'I\'ve processed your query and spawned the requested visualizations.';
          } catch (error) {
            console.error('Error processing robot text:', error);
            robotMessage = 'I\'ve processed your query and spawned the requested visualizations.';
          }
        }

        // Spawn components from visualization_output
        if (resolveData.response.visualization_output && Array.isArray(resolveData.response.visualization_output)) {
          for (const componentSpec of resolveData.response.visualization_output) {
            const { toolname, componentName, body } = componentSpec;
            
            if (toolname && componentName) {
              const componentType = `${toolname}.${componentName}`;
              console.log(`[QueryResolver] Spawning component: ${componentType} with props:`, body);
              
              try {
                const componentId = await spawnComponent(componentType, body || {});
                if (componentId) {
                  spawnedComponents.push(componentName);
                }
              } catch (error) {
                console.error(`Failed to spawn component ${componentType}:`, error);
              }
            }
          }
        }

        // Set robot state with the extracted text and audio
          setRobotState({
            ...robotState,
            state: 'speaking',
            message: "hello",
            // audioData: audioData
          });

        if (spawnedComponents.length > 0) {
          console.log(`Successfully spawned ${spawnedComponents.length} component(s): ${spawnedComponents.join(', ')}`);
        }
      } else {
        //     setRobotState({
        //       ...robotState,
        //       state: 'speaking',
        //   message: 'I received your query but couldn\'t find any information to display. Please try asking about specific analytics or data visualizations.',
        // });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in handleQuerySubmit:', error);
      
      let errorMessage = 'Sorry, there was an error processing your request.';
      
      if (error.message === 'Failed to fetch') {
        errorMessage = `Cannot connect to the AI backend service at ${backendAiUrl}. Please ensure the service is running and accessible.`;
      } else if (error.message.includes('Failed to resolve query')) {
        errorMessage = `AI backend returned an error: ${error.message}`;
          } else {
        errorMessage = `Error: ${error.message}`;
      }
      
             setRobotState({
              ...robotState,
              state: 'error',
        message: "errorMessage",
      });
        setLoading(false);
    }
  };

  const handleRobotQuerySubmit = (query, selectedPoints) => {
    console.log('Query from Robot:', query);
    console.log('Context from Robot:', selectedPoints);
    // Here you can decide if you want to process this query differently,
    // or perhaps clear selections, etc.
    // For now, let's clear selections after a robot query is submitted via its own input
    setUserSelectedChartPoints([]);
    // Optionally, you might want to re-trigger a general query processing if needed
    // handleQuerySubmit(query); // This might cause a loop if not careful
  };

  // Function to handle clicks coming from within chart components
  const handleChartElementClick = (clickData) => {
    console.log('Chart element click received:', clickData);
    
    // clickData should contain: { event, elements, chart, canvasElement, chartId, componentId, ...any other useful data }
    // For now, we expect pre-calculated targetCoords from the chart component itself.
    // A more robust way is for the chart to send raw click event and its own rect, and this function calculates targetCoords.

    if (!clickData || !clickData.pointData) {
      // If no specific point data, maybe it was a click outside, or a general chart click.
      // Optionally, clear selections if the click was on the chart background (needs more info from clickData)
      if (!clickData.event || !clickData.event.shiftKey) {
        console.log('Clearing user selections - background click');
        setUserSelectedChartPoints([]); 
      }
      return;
    }

    const { pointData, componentId, chartId, chartRect, elementRect } = clickData; 
    // pointData is expected to be an object like: 
    // { datasetIndex, index, label, value, x, y } (x, y relative to chart canvas)
    // chartRect: getBoundingClientRect of the chart canvas
    // elementRect: getBoundingClientRect of the chart container

    // Calculate page coordinates for the target point
    let targetCoords = pointData.targetCoords;
    if (!targetCoords && pointData.x !== undefined && pointData.y !== undefined && chartRect) {
      // Calculate page-relative coordinates from chart-relative coordinates
      targetCoords = {
        x: chartRect.left + pointData.x,
        y: chartRect.top + pointData.y
      };
      console.log('Calculated target coords:', targetCoords, 'from chart coords:', pointData.x, pointData.y);
    }

    if (!targetCoords) {
      console.warn('Could not determine target coordinates for chart element click');
      return;
    }

    // Create a unique ID for the selection if not provided
    const selectionId = pointData.id || `${componentId}-${chartId}-${pointData.datasetIndex}-${pointData.index}`;

    const newSelection = {
      id: selectionId,
      componentId: componentId,
      chartId: chartId,
      chartLabel: pointData.chartLabel || `Chart ${chartId}`,
      label: pointData.label,
      value: pointData.value,
      datasetIndex: pointData.datasetIndex,
      index: pointData.index,
      targetCoords: targetCoords, // Page-relative coordinates
    };

    // Handle multi-select with Shift key
    const isShiftPressed = clickData.event && clickData.event.shiftKey;
    
    if (isShiftPressed) {
      // Add/remove from current selections
      setUserSelectedChartPoints(prev => {
        const existingIndex = prev.findIndex(p => p.id === selectionId);
        if (existingIndex > -1) {
          // Remove if already selected
          console.log('Removing selection:', selectionId);
          const newSelections = prev.filter(p => p.id !== selectionId);
          console.log('New selections:', newSelections);
          return newSelections;
        } else {
          // Add to selection
          console.log('Adding to selection:', selectionId);
          const newSelections = [...prev, newSelection];
          console.log('New selections:', newSelections);
          return newSelections;
        }
      });
    } else {
      // Replace selections with single selection
      console.log('Setting single selection:', selectionId, newSelection);
      setUserSelectedChartPoints([newSelection]);
    }

    // Clear AI laser/message when user clicks a chart
    setRobotState(prev => ({
      ...prev,
      laserTarget: null,
      message: null,
      state: 'thinking' // Always set to thinking when user interacts with charts
    }));
  };

  return (
    <Provider store={store}>
      <ThemeProvider>
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0F172A',
            overflow: 'hidden'
          }}
        >
          {/* Navigation Toggle */}
          <NavigationToggle onClick={() => setIsNavigationOpen(true)} />
          
          {/* Dashboard Navigation */}
          <DashboardNavigation 
            isOpen={isNavigationOpen}
            onClose={() => setIsNavigationOpen(false)}
          />

          {/* Canvas Header */}
          <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '60px',
            padding: '12px 20px',
            backgroundColor: '#1E293B',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            borderBottom: '1px solid #334155'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Enterprise IQ</h1>
          </header>
          
          {/* Main Canvas */}
          <div 
            ref={canvasRef}
            style={{
              position: 'relative',
              width: 'calc(100% - 80px)', // 40px margin on each side
              height: 'calc(100vh - 280px)', // Account for header (60px), query input (100px), margins (40px), and spacing (80px)
              margin: '80px 40px 20px 40px', // Top: 80px (60px header + 20px gap), bottom: 20px, left/right: 40px
              border: '3px solid #334155', // Canvas border
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
            onMouseDown={handlePanStart}
            onWheel={(e) => {
              e.preventDefault();
              const rect = canvasRef.current.getBoundingClientRect();
              const centerX = e.clientX - rect.left;
              const centerY = e.clientY - rect.top;
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              handleZoom(delta, centerX, centerY);
            }}
          >
            {/* Zoom Controls */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 100
            }}>
              <button
                onClick={() => handleZoom(0.1)}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.9)';
                  e.currentTarget.style.borderColor = '#00e0ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                  e.currentTarget.style.borderColor = '#475569';
                }}
              >
                +
              </button>
              <button
                onClick={() => handleZoom(-0.1)}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.9)';
                  e.currentTarget.style.borderColor = '#00e0ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                  e.currentTarget.style.borderColor = '#475569';
                }}
              >
                −
              </button>
              <button
                onClick={resetView}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.9)';
                  e.currentTarget.style.borderColor = '#00e0ff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                  e.currentTarget.style.borderColor = '#475569';
                }}
                title="Reset View"
              >
                ⌂
              </button>

            </div>

            {/* Zoom Level Indicator */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#E2E8F0',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 100
            }}>
              {Math.round(zoom * 100)}%
            </div>

            {/* Loading indicator */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '15px 25px',
                borderRadius: '8px',
                color: '#E2E8F0',
                zIndex: 1000
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    borderTop: '3px solid #00e0ff',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ margin: 0 }}>Loading data...</p>
                </div>
              </div>
            )}
            
            {/* Transform Container for Zoom and Pan */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: 'transform 0.1s ease-out'
            }}>
              {/* Render components */}
              {components.map((component) => (
                <div 
                  key={component.id}
                  style={{
                    position: 'absolute',
                    left: `${component.position.x}px`,
                    top: `${component.position.y}px`,
                    width: `${component.size.width}px`,
                    height: `${component.size.height}px`,
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: isDragging && activeComponent === component.id ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={(e) => handleDragStart(e, component)}
                >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 15px',
                  borderBottom: '1px solid #2D3748',
                  backgroundColor: '#161E2E',
                }}>
                  <div style={{ color: '#E2E8F0', fontWeight: 500 }}>
                    {component.type.split('.')[1]}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComponent(component.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '0 5px'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ 
                  padding: '15px', 
                  flex: 1,
                  overflow: 'auto',
                  height: 'calc(100% - 40px)'
                }}>
                  <component.Component 
                    {...component.props} 
                    width={component.size.width - 30} // Account for padding
                    height={component.size.height - 80} // Account for header and padding
                    onChartElementClick={handleChartElementClick}
                    componentId={component.id}
                  />
                </div>
                {/* Resize handle */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '20px',
                    height: '20px',
                    cursor: 'nwse-resize',
                    background: 'transparent'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeStart(e, component);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', right: 5, bottom: 5 }}>
                    <path d="M10 2L2 10M6 2L2 6M10 6L6 10" stroke="#94A3B8" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            ))}
            </div>
            

          </div>
          
          {/* Robot Character - Completely Independent */}
          <div style={{
            position: 'fixed',
            top: '80px', // Account for header
            left: '40px', // Account for canvas margin
            width: 'calc(100% - 80px)', // Match canvas width
            height: 'calc(100vh - 280px)', // Match canvas height
            pointerEvents: 'none',
            zIndex: 300
          }}>
            <RobotCharacter
              initialPosition={robotState.position}
              state={robotState.state}
              message={robotState.message}
              laserTarget={robotState.laserTarget}
              isVisible={robotState.isVisible}
              userSelectedPoints={userSelectedChartPoints}
              onQuerySubmit={handleRobotQuerySubmit}
              audioData={robotState.audioData}
            />
          </div>
          
          {/* Visual Separator */}
          <div style={{
            position: 'fixed',
            bottom: '130px', // Position above the text box with adjusted spacing
            left: '60px',
            right: '60px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(51, 65, 85, 0.5) 50%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 50
          }} />
          
          {/* Query Input */}
          <div style={{
            position: 'fixed',
            bottom: '30px', // Reduced gap from canvas border for more canvas space
            left: '60px', // Slightly inset from canvas for better aesthetics
            right: '60px', // Slightly inset from canvas for better aesthetics
            padding: '16px 24px',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 20px rgba(0, 224, 255, 0.1)'
          }}>
            <QueryInput 
              onSubmit={handleQuerySubmit}
              placeholder="Ask about purchase frequency, customer segments, sales performance, churn prediction, or customer behavior..."
              disabled={loading}
            />
          </div>
          
          {/* CSS Animation for Loading */}
          <style jsx global>{`
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              overflow: hidden;
              margin: 0;
              padding: 0;
            }
            
            html {
              overflow: hidden;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ThemeProvider>
    </Provider>
  );
}