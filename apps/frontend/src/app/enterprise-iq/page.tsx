"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { DashboardLayout } from 'components/index';
import { Volume2, VolumeX } from 'lucide-react';
import { RootState } from '@/store';
import { addComponent, replaceComponentByType } from '@/store/slices/canvasSlice';
import {
  ConversationalCanvas,
  RobotCharacter,
  QueryInput,
  // ChatHistoryPanel
} from './components';

// Import new configuration modules
import { getToolApiConfig } from './config/toolApiRegistry';
import { normalizeMetadata } from './config/normalizeMetadata';
import { summaryClient } from './services/summaryClient';
import { mapSummaryToProps } from './config/componentPropMappers';
import { formatErrorForDisplay } from './utils/errorMessages';

interface RobotState {
  state: 'idle' | 'thinking' | 'speaking' | 'pointing' | 'error';
  message: string | null;
  audioData?: { url: string; blob: Blob; mimeType: string } | null;
  position?: { x: number; y: number };
  laserTarget?: { x: number; y: number } | null;
}

// Z-Index hierarchy system
const Z_INDEX = {
  ROBOT: 50,
  SPEECH_BUBBLE: 100,
  AUDIO_CONTROLS: 200,
  CANVAS_BASE: 300,
  COMPONENTS_BASE: 1000,
  COMPONENTS_SELECTED: 2000,
  FULLSCREEN: 5000,
  FULLSCREEN_CONTROLS: 5001
};

// Component registry with available components - moved outside component to prevent re-creation
const componentRegistry: any = {
  'customer-segmentation': {
    // Use the histogram as fallback for missing components
    distributionMap: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
    profileCards: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
    metricComparison: dynamic(() => import('components').then(mod => mod.SegmentComparisonMatrix)),
    kpiTiles: dynamic(() => import('components').then(mod => mod.KPITiles)),
  },
  'churn-prediction': {
    riskPyramid: dynamic(() => import('components').then(mod => mod.RiskPyramid)),
    featureImportance: dynamic(() => import('components').then(mod => mod.AIFeatureImportance)),
    probabilityHistogram: dynamic(() => import('components').then(mod => mod.ProbabilityHistogram)),
    temporalRisk: dynamic(() => import('components').then(mod => mod.LineChart)), // Use LineChart for risk trends over time
    segmentMatrix: dynamic(() => import('components').then(mod => mod.SegmentComparisonMatrix)), // Map to SegmentComparisonMatrix
    kpiTiles: dynamic(() => import('components').then(mod => mod.KPITiles)),
  },
  'visualization': {
    barchart: dynamic(() => import('components').then(mod => mod.BarChart)),
    linechart: dynamic(() => import('components').then(mod => mod.LineChart)),
    histogram: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
    heatmap: dynamic(() => import('./components/Visualizations/IntervalHeatmap')),
  },
  'retention-planner': {
    kpis: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.RetentionKPIs)),
    overview: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.ChurnRiskGauge)),
    churnRiskGauge: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.ChurnRiskGauge)),
    valueRiskMatrix: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.ValueRiskMatrix)),
    interventionROI: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.InterventionROI)),
    lifecycleStages: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.LifecycleStages)),
    risk: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.ChurnRiskGauge)),
    matrix: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.ValueRiskMatrix)),
    roi: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.InterventionROI)),
    lifecycle: dynamic(() => import('../customer/retention-planner/components').then(mod => mod.LifecycleStages))
  },
  'sales-performance': {
    kpis: dynamic(() => import('../sales/sales-performance/components/SalesKPIs')),
    // Full names
    performanceOverview: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceOverview)),
    timeSeriesExplorer: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.TimeSeriesExplorer)),
    distributionAnalyzer: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceDistributionAnalyzer)),
    comparativeGrid: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.ComparativePerformanceGrid)),
    correlationMatrix: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceCorrelationMatrix)),
    driverAnalysis: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceDriverAnalysis)),
    // Short aliases for agent compatibility
    overview: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceOverview)),
    timeSeries: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.TimeSeriesExplorer)),
    distribution: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceDistributionAnalyzer)),
    comparative: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.ComparativePerformanceGrid)),
    correlation: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceCorrelationMatrix)),
    drivers: dynamic(() => import('../sales/sales-performance/components').then(mod => mod.PerformanceDriverAnalysis))
  },
  'customer-lifetime-value': {
    kpiTiles: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.LtvKPIs)),
    ltvDistribution: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.LtvDistribution)),
    customerExplorer: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.TopCustomers)),
    predictionAccuracy: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.PredictionAccuracy)),
    segmentAnalysis: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.SegmentAnalysis)),
    ltvTrends: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.LtvTrends)),
    valueContribution: dynamic(() => import('../customer/customer-lifetime-value/components').then(mod => mod.ValueContributionAnalysis))
  },
  'engagement-classifier': {
    // Full names
    kpiTiles: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementKPIs)),
    engagementPyramid: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementPyramid)),
    engagementTimeline: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementTimeline)),
    opportunityFinder: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.OpportunityFinder)),
    customerClassification: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.CustomerClassification)),
    engagementDistribution: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementDistribution)),
    engagementScore: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementScore)),
    actionableInsights: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.ActionableInsights)),
    engagementTrends: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementTrends)),
    customerSearchAnalytics: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.CustomerSearchAnalytics)),
    // Short aliases for agent compatibility
    kpis: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementKPIs)),
    pyramid: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementPyramid)),
    timeline: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementTimeline)),
    opportunities: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.OpportunityFinder)),
    classification: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.CustomerClassification)),
    distribution: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementDistribution)),
    score: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementScore)),
    insights: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.ActionableInsights)),
    trends: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.EngagementTrends)),
    search: dynamic(() => import('../customer/engagement-classifier/components').then(mod => mod.CustomerSearchAnalytics))
  },
  'next-purchase': {
    // Full names
    kpiTiles: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.PredictionKPIs)),
    predictions: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.NextPurchasePredictions)),
    probability: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.PurchaseProbability)),
    timing: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.TimingForecast)),
    products: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.RecommendedProducts)),
    affinity: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.ProductAffinityNetwork)),
    confidence: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.PredictionConfidenceMatrix)),
    // Short aliases for agent compatibility
    kpis: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.PredictionKPIs)),
    customerJourney: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.NextPurchasePredictions)),
    affinityNetwork: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.ProductAffinityNetwork)),
    confidenceMatrix: dynamic(() => import('../customer/next-purchase/components').then(mod => mod.PredictionConfidenceMatrix))
  },
  'product-performance': {
    kpis: dynamic(() => import('../sales/product-performance/components').then(mod => mod.ProductKPIs)),
    overview: dynamic(() => import('../sales/product-performance/components').then(mod => mod.ProductPerformanceOverview)),
    topProducts: dynamic(() => import('../sales/product-performance/components').then(mod => mod.TopProductsTable)),
    categoryAnalysis: dynamic(() => import('../sales/product-performance/components').then(mod => mod.CategoryPerformanceChart)),
    marginAnalysis: dynamic(() => import('../sales/product-performance/components').then(mod => mod.MarginAnalysisScatter)),
    priceBands: dynamic(() => import('../sales/product-performance/components').then(mod => mod.PriceBandDistribution))
  },
  'purchase-frequency': {
    // Full names
    kpis: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.PurchaseFrequencyKPIs)),
    overview: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.FrequencyDistribution)),
    distribution: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.FrequencyDistribution)),
    segmentation: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.CustomerSegmentChart)),
    intervals: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.PurchaseIntervalChart)),
    lifecycle: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.LifecycleStagesChart)),
    table: dynamic(() => import('../customer/purchase-frequency/components').then(mod => mod.FrequencyTable))
  },
  'sales-trends': {
    kpis: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.SalesTrendsKPIs)),
    kpiTiles: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.SalesTrendsKPIs)),
    overview: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.TimeSeriesExplorer)),
    timeSeries: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.TimeSeriesExplorer)),
    timeSeriesExplorer: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.TimeSeriesExplorer)),
    seasonality: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.SeasonalPatternAnalyzer)),
    seasonalPatternAnalyzer: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.SeasonalPatternAnalyzer)),
    growthRates: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.GrowthRateVisualizer)),
    growthRateVisualizer: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.GrowthRateVisualizer)),
    topPerformers: dynamic(() => import('../sales/sales-trends/components').then(mod => mod.TopPerformers))
  },
  'cash-flow': {
    kpis: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.CashFlowKPIs)),
    trends: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.CashFlowTrends)),
    operating: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.OperatingCashFlow)),
    investing: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.InvestmentCashFlow)),
    financing: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.FinancingCashFlow)),
    projection: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.CashFlowProjection)),
    table: dynamic(() => import('../finance/cash-flow/components').then(mod => mod.CashFlowTable)),
    'fcf-bridge': dynamic(() => import('../finance/cash-flow/components').then(mod => mod.FCFValueBridge)),
    'liquidity-timeline': dynamic(() => import('../finance/cash-flow/components').then(mod => mod.LiquidityTimeline)),
    'capital-allocation': dynamic(() => import('../finance/cash-flow/components').then(mod => mod.CapitalAllocationMatrix))
  },
  'ar-aging-analysis': {
    kpis: dynamic(() => import('../finance/ar-aging-analysis/components').then(mod => mod.ARAgingKPIs)),
    overview: dynamic(() => import('../finance/ar-aging-analysis/components').then(mod => mod.NPVPortfolioChart)),
    customerMatrix: dynamic(() => import('../finance/ar-aging-analysis/components').then(mod => mod.CustomerMatrix)),
    forecast: dynamic(() => import('../finance/ar-aging-analysis/components').then(mod => mod.CollectionForecast)),
    riskHeatmap: dynamic(() => import('../finance/ar-aging-analysis/components').then(mod => mod.RiskHeatmap)),
    agingBreakdown: dynamic(() => import('../finance/ar-aging-analysis/components').then(mod => mod.AgingTable))
  },
  'customer-behaviour': {
    kpis: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.BehaviorKPIs)),
    patterns: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.PurchasePatterns)),
    engagement: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.EngagementMetrics)),
    segments: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.CustomerSegments)),
    table: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.CustomerTable)),
    // Aliases
    overview: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.PurchasePatterns)),
    purchasePatterns: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.PurchasePatterns)),
    engagementMetrics: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.EngagementMetrics)),
    customerSegments: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.CustomerSegments))
  },
  'customer-behavior': {
    kpis: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.BehaviorKPIs)),
    patterns: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.PurchasePatterns)),
    engagement: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.EngagementMetrics)),
    segments: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.CustomerSegments)),
    table: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.CustomerTable)),
    // Aliases
    overview: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.PurchasePatterns)),
    purchasePatterns: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.PurchasePatterns)),
    engagementMetrics: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.EngagementMetrics)),
    customerSegments: dynamic(() => import('../customer/customer-behavior/components').then(mod => mod.CustomerSegments))
  }
};

export default function EnterpriseIQPage() {
  const dispatch = useDispatch();
  const { components, transform } = useSelector((state: RootState) => state.canvas);
  const { conversations, activeConversationId } = useSelector((state: RootState) => state.conversation);

  // Robot state management
  const [robotState, setRobotState] = useState<RobotState>({
    state: 'idle',
    message: "Hello! I'm your Enterprise IQ assistant. Ask me anything about your business data!",
    position: { x: 50, y: 100 },
    laserTarget: null,
    audioData: null
  });

  const [userSelectedChartPoints, setUserSelectedChartPoints] = useState<any[]>([]);
  const [showQueryInput, setShowQueryInput] = useState(true);
  // Robot visibility removed - using chat panel instead
  const [isMuted, setIsMuted] = useState(false);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{ url: string; blob: Blob; mimeType: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<{ url: string; blob: Blob; mimeType: string; hash: string; size: number }[]>([]);
  const isPlayingRef = useRef(false);
  const sseReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Helper function to create robust content hash
  const createContentHash = async (data: any, includeTimestamp: boolean = false): Promise<string> => {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    const timestamp = includeTimestamp ? Date.now().toString() : '';
    const content = str + timestamp;

    // Use crypto API for better hash distribution
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  // Fallback synchronous hash for when crypto API is not available
  const createFallbackHash = (data: any, includeTimestamp: boolean = false): string => {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    const timestamp = includeTimestamp ? Date.now().toString() : '';
    const content = str + timestamp;

    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 12);
  };

  const [spawnedComponents, setSpawnedComponents] = useState<Set<string>>(new Set());
  const activeVisualizationTypesRef = useRef<Set<string>>(new Set());
  const occupiedPositionsRef = useRef<Set<string>>(new Set());
  const currentQuerySessionRef = useRef<Set<string>>(new Set());


  // Session state for SSE communication
  const [session] = useState({
    session_id: uuidv4(),
    user_id: 'enterprise-user',
    app_name: 'enterprise_iq'
  });
  const [loading, setLoading] = useState(false);
  const [componentSpawning, setComponentSpawning] = useState(false);
  const [spawnProgress, setSpawnProgress] = useState({ current: 0, total: 0, currentComponent: '' });
  const [error, setError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to set error with auto-clear
  const setErrorWithAutoClear = useCallback((message: string | null, duration: number = 5000) => {
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    setError(message);

    // Auto-clear after duration if message is not null
    if (message && duration > 0) {
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
        errorTimeoutRef.current = null;
      }, duration);
    }
  }, []);

  // Audio queue processing function - with interrupt support
  const processAudioQueue = useCallback((forceInterrupt: boolean = false) => {
    console.log('🎵 processAudioQueue called:', {
      isPlaying: isPlayingRef.current,
      queueLength: audioQueueRef.current.length,
      forceInterrupt,
      queue: audioQueueRef.current.map(a => ({ hash: a.hash, size: a.size }))
    });

    // If forced interrupt and new audio available, stop current and play new
    if (forceInterrupt && audioQueueRef.current.length > 0 && isPlayingRef.current) {
      console.log('🛑 Force interrupting current audio to play new chunk immediately');
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        URL.revokeObjectURL(currentAudioRef.current.src);
        currentAudioRef.current = null;
      }
      isPlayingRef.current = false;
    }

    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      if (isPlayingRef.current) {
        console.log('⏸️ Already playing audio, skipping queue processing');
      }
      if (audioQueueRef.current.length === 0) {
        console.log('📭 Audio queue is empty');
      }
      return;
    }

    const audioData = audioQueueRef.current.shift();
    if (!audioData) return;

    // Log only essential info
    if (audioQueueRef.current.length > 0) {
      console.log(`🎵 Processing audio queue (${audioQueueRef.current.length + 1} items)`);
    }

    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      URL.revokeObjectURL(currentAudioRef.current.src);
    }

    // Validate blob before creating audio element
    if (audioData.blob.size === 0) {
      console.error('Audio blob is empty, skipping');
      URL.revokeObjectURL(audioData.url);
      setTimeout(processAudioQueue, 50); // Try next in queue
      return;
    }

    // Additional validation for audio content
    if (audioData.size < 1000) {
      console.warn(`Audio chunk too small (${audioData.size} bytes), skipping`);
      URL.revokeObjectURL(audioData.url);
      setTimeout(processAudioQueue, 50);
      return;
    }

    const audioElement = new Audio(audioData.url);
    audioElement.volume = isMuted ? 0 : 0.8;
    currentAudioRef.current = audioElement;
    isPlayingRef.current = true;
    setIsAudioPlaying(true); // Update state for UI

    // Set up event listeners (minimal logging)
    audioElement.addEventListener('ended', () => {
      isPlayingRef.current = false;
      URL.revokeObjectURL(audioData.url);
      currentAudioRef.current = null;

      // Update state - no audio playing if queue is empty
      if (audioQueueRef.current.length === 0) {
        setIsAudioPlaying(false);
      }

      // Process next audio in queue with a small delay
      setTimeout(() => {
        processAudioQueue();
      }, 200);
    });

    audioElement.addEventListener('error', (e) => {
      // Handle audio errors more gracefully
      const errorCode = audioElement.error?.code;
      const errorMessages: Record<number, string> = {
        1: 'Audio loading aborted',
        2: 'Network error loading audio',
        3: 'Audio decoding error',
        4: 'Audio format not supported'
      };

      const errorMessage = errorMessages[errorCode || 0] || 'Unknown audio error';

      // Only log a concise warning instead of multiple error lines
      console.warn(`Audio playback issue: ${errorMessage} (${audioData.hash})`);

      // Clean up
      isPlayingRef.current = false;
      URL.revokeObjectURL(audioData.url);
      currentAudioRef.current = null;

      // Update state - no audio playing if queue is empty
      if (audioQueueRef.current.length === 0) {
        setIsAudioPlaying(false);
      }

      // Process next audio in queue silently
      setTimeout(processAudioQueue, 100);
    });

    // Remove verbose timeupdate logging to reduce console noise

    audioElement.play().then(() => {
      // Successfully started playback - log minimal info
      console.log(`🎵 Audio started (${audioData.hash})`);
      setAudioPlaybackFailed(false);
      setPendingAudio(null);
    }).catch((error) => {
      // Handle playback errors gracefully
      isPlayingRef.current = false;

      // Some browsers require user interaction before playing audio
      if (error.name === 'NotAllowedError') {
        console.info('Audio autoplay blocked - user interaction required');
        setAudioPlaybackFailed(true);
        setPendingAudio({
          url: audioData.url,
          blob: audioData.blob,
          mimeType: audioData.mimeType
        });
      } else {
        // For other errors, silently skip and continue
        console.warn(`Audio skipped: ${error.name || 'playback error'}`);
        URL.revokeObjectURL(audioData.url);
        currentAudioRef.current = null;
        // Process next audio in queue
        setTimeout(processAudioQueue, 100);
      }
    });
  }, [isMuted]);

  // Simplified audio handling - similar to web folder
  useEffect(() => {
    if (robotState.audioData?.url && robotState.audioData?.blob) {
      // Simply add to queue without complex validation
      const audioItem = {
        url: robotState.audioData.url,
        blob: robotState.audioData.blob,
        mimeType: robotState.audioData.mimeType,
        hash: `audio-${Date.now()}`,
        size: robotState.audioData.blob.size
      };

      audioQueueRef.current.push(audioItem);

      // Process queue if not already playing
      if (!isPlayingRef.current) {
        processAudioQueue();
      }
    }
  }, [robotState.audioData]);

  // Manual audio play function
  const playPendingAudio = () => {
    if (pendingAudio) {
      // Clear queue and play pending audio immediately
      audioQueueRef.current = [pendingAudio];
      processAudioQueue();
    }
  };

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      // Stop current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        URL.revokeObjectURL(currentAudioRef.current.src);
      }

      // Clean up audio queue
      audioQueueRef.current.forEach(audio => {
        URL.revokeObjectURL(audio.url);
      });
      audioQueueRef.current = [];

      // Clean up pending audio
      if (pendingAudio) {
        URL.revokeObjectURL(pendingAudio.url);
      }

      isPlayingRef.current = false;

      // Cancel any ongoing SSE requests
      if (sseReaderRef.current) {
        try {
          sseReaderRef.current.cancel();
        } catch (e) {
          console.warn('Error canceling SSE on unmount:', e);
        }
      }
    };
  }, [pendingAudio]);

  // Cancel ongoing requests when starting new query
  const cancelOngoingRequests = useCallback(() => {
    if (sseReaderRef.current) {
      try {
        sseReaderRef.current.cancel();
      } catch (e) {
        console.warn('Error canceling SSE:', e);
      }
      sseReaderRef.current = null;
    }

    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      isPlayingRef.current = false;
    }

    // Clear audio queue
    audioQueueRef.current.forEach(audio => {
      URL.revokeObjectURL(audio.url);
    });
    audioQueueRef.current = [];
  }, []);

  // Helper function to check if component is visible (not minimized and exists)
  const isComponentVisible = (componentType: string): boolean => {
    const matchingComponents = Object.values(components).filter(
      comp => `${comp.toolId}.${comp.type}` === componentType && !comp.minimized
    );
    return matchingComponents.length > 0;
  };

  // Function to spawn component with STRICT SINGLETON enforcement
  const spawnComponent = async (componentType: string, props: any = {}) => {
    setComponentSpawning(true);
    setSpawnProgress(prev => ({ ...prev, currentComponent: componentType }));

    // DATA VALIDATION: Minimal validation - allow components to handle their own data
    console.log(`🔍 [spawnComponent] Component: ${componentType}`);
    console.log(`🔍 [spawnComponent] Props received:`, JSON.stringify(props, null, 2));

    // Allow null/undefined props - components may fetch their own data
    // This matches the web folder implementation which has minimal validation
    if (props === null) {
      console.log(`⚠️ Null props for ${componentType}, passing empty object`);
      props = {};
    }

    // Log data structure for debugging but don't block spawning
    if (props && typeof props === 'object') {
      if (props.data !== undefined) {
        console.log(`📊 Component ${componentType} has data property:`, {
          isArray: Array.isArray(props.data),
          length: Array.isArray(props.data) ? props.data.length : 'N/A',
          type: typeof props.data
        });
      }
      console.log(`✅ Proceeding with spawn for ${componentType}`);
    }

    // CHECK 1: Is this a duplicate within the SAME query session?
    if (currentQuerySessionRef.current.has(componentType)) {
      console.log(`🚫 Ignoring duplicate ${componentType} in same query session`);
      setComponentSpawning(false);
      return null; // Skip duplicates in the same query
    }

    // CHECK 2: Does this component exist from a PREVIOUS query?
    const existingOfType = Object.values(components).find(
      comp => `${comp.toolId}.${comp.type}` === componentType
    );

    // Mark this type as spawned in current session
    currentQuerySessionRef.current.add(componentType);
    console.log(`✅ Marked ${componentType} as spawned in current query session`);

    const id = `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [toolName, componentName] = componentType.split('.');

    // Verify component exists in registry with better error handling
    console.log(`🔍 Looking for component: toolName="${toolName}", componentName="${componentName}"`);
    console.log(`📦 Registry has tools:`, Object.keys(componentRegistry));
    if (componentRegistry[toolName]) {
      console.log(`📦 Tool "${toolName}" has components:`, Object.keys(componentRegistry[toolName]));
    }

    const ComponentLoader = componentRegistry[toolName]?.[componentName];
    if (!ComponentLoader) {
      const availableTools = Object.keys(componentRegistry);
      const availableComponents = toolName && componentRegistry[toolName]
        ? Object.keys(componentRegistry[toolName])
        : [];
      const errorMsg = `Component not found: ${componentType}. Available tools: ${availableTools.join(', ')}. Available components for ${toolName}: ${availableComponents.join(', ')}`;
      console.error(errorMsg);
      // Don't show persistent error for spawn failures - just log it
      setComponentSpawning(false);
      // Remove from active types since it failed
      activeVisualizationTypesRef.current.delete(componentType);
      currentQuerySessionRef.current.delete(componentType); // Also remove from current session
      return null;
    }

    // Dynamic imports from Next.js are already loaded, no need to preload
    // The component will be loaded when it's rendered

    // Grid-based positioning with slot tracking
    const findNonOverlappingPosition = (size: { width: number; height: number }, componentIndex: number) => {
      const padding = 30;
      const gridCols = 3;
      const gridRows = 3;
      const cellWidth = 450;
      const cellHeight = 350;

      // Define the text area bounds (robot message area)
      // Robot is at (20, 20), text starts at robot.x + 60 = 80
      // Text has maxWidth of 500px + padding 24px = 524px total
      // Assume height of 200px for safety
      const textAreaBounds = {
        x: 80,
        y: 20,
        width: 524,
        height: 200
      };

      console.log(`🎯 Finding position for component #${componentIndex}`);

      // Try each grid slot in order
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const slotKey = `${row}-${col}`;

          // Check if this slot is already occupied
          if (!occupiedPositionsRef.current.has(slotKey)) {
            const x = col * cellWidth + padding;
            const y = row * cellHeight + padding;

            // Check if this position would overlap with the text area
            const newRect = { x, y, width: size.width, height: size.height };
            const overlapsWithText = (
              newRect.x < textAreaBounds.x + textAreaBounds.width &&
              newRect.x + newRect.width > textAreaBounds.x &&
              newRect.y < textAreaBounds.y + textAreaBounds.height &&
              newRect.y + newRect.height > textAreaBounds.y
            );

            if (overlapsWithText) {
              console.log(`⚠️ Grid slot [${row},${col}] at (${x}, ${y}) overlaps with text area, skipping`);
              continue;
            }

            // Also check for actual overlaps with existing components
            const overlaps = Object.values(components).some(component => {
              if (component.minimized) return false;

              const compRect = {
                x: component.position.x,
                y: component.position.y,
                width: component.size.width,
                height: component.size.height
              };

              return (
                newRect.x < compRect.x + compRect.width &&
                newRect.x + newRect.width > compRect.x &&
                newRect.y < compRect.y + compRect.height &&
                newRect.y + newRect.height > compRect.y
              );
            });

            if (!overlaps) {
              occupiedPositionsRef.current.add(slotKey);
              console.log(`✅ Assigned grid slot [${row},${col}] at position (${x}, ${y})`);
              return { x, y, zIndex: Z_INDEX.COMPONENTS_BASE + componentIndex * 10 };
            }
          }
        }
      }

      // Fallback: cascade positioning with offset
      const cascadeOffset = occupiedPositionsRef.current.size;
      const x = padding + (cascadeOffset * 50) % 600;
      const y = padding + (cascadeOffset * 50) % 400;

      console.log(`⚠️ Using cascade fallback at (${x}, ${y})`);
      return { x, y, zIndex: Z_INDEX.COMPONENTS_BASE + componentIndex * 10 };
    };

    const componentSize = { width: 500, height: 400 };  // Increased default size for better visibility
    const componentIndex = Object.keys(components).length;
    const positionData = findNonOverlappingPosition(componentSize, componentIndex);

    // Track spawned component - but don't block respawning entirely
    setSpawnedComponents(prev => new Set([...prev, `${componentType}-${id}`]));

    // Only pass serializable data to Redux
    const componentData = {
      id,
      type: componentName,
      toolId: toolName,
      position: { x: positionData.x, y: positionData.y },
      size: componentSize,
      data: props,
      minimized: false,
      zIndex: positionData.zIndex
    };

    console.log(`📦 Dispatching component to Redux:`, componentData);
    console.log(`   Position: (${positionData.x}, ${positionData.y})`);
    console.log(`   Z-Index: ${positionData.zIndex}`);
    console.log(`   Size: ${componentSize.width}x${componentSize.height}`);
    console.log(`   Total components in canvas: ${Object.keys(components).length + (existingOfType ? 0 : 1)}`);

    // REPLACEMENT LOGIC: If component exists from previous query, replace it
    if (existingOfType) {
      console.log(`🔄 Replacing existing ${componentType} (id: ${existingOfType.id}) with new instance`);
      dispatch(replaceComponentByType({
        oldId: existingOfType.id,
        newComponent: componentData
      }));
    } else {
      console.log(`➕ Adding new component ${componentType}`);
      dispatch(addComponent(componentData));
    }

    // Mark this type as active
    activeVisualizationTypesRef.current.add(componentType);

    setComponentSpawning(false);
    setSpawnProgress(prev => ({ ...prev, current: prev.current + 1 }));

    console.log(`✅ Component ${componentType} ${existingOfType ? 'replaced' : 'spawned'} successfully with ID: ${id}`);
    console.log(`   Active singletons: ${Array.from(activeVisualizationTypesRef.current).join(', ')}`);
    console.log(`   Current query session components: ${Array.from(currentQuerySessionRef.current).join(', ')}`);
    return id;
  };

  // Queue visualization - simplified like web folder
  const queueVisualization = (visualization: any) => {
    // Simply process the visualization without complex deduplication
    // This matches the web folder's simpler approach
    console.log(`📦 Processing visualization:`, visualization);

    // Process immediately without queueing
    setVisualisation(visualization);
  };

  // Removed processVisualizationQueue - no longer needed with direct processing

  // Set visualization - NEW implementation using summary APIs
  const setVisualisation = async (visualisation: any) => {
    if (!visualisation) {
      console.warn('No visualization data received');
      return;
    }

    // Handle both array and single visualization
    if (!Array.isArray(visualisation)) {
      // Try to parse if it's a string
      if (typeof visualisation === 'string') {
        try {
          visualisation = JSON.parse(visualisation);
        } catch (e) {
          console.warn('Failed to parse visualization string:', e);
          return;
        }
      }
      // If still not array, make it an array
      if (!Array.isArray(visualisation)) {
        visualisation = [visualisation];
      }
    }

    console.log(`📊 Processing visualization metadata:`, visualisation);
    let spawnedComponents = [];

    for (const componentSpec of visualisation) {
      const { toolname, componentName, body } = componentSpec;

      if (!toolname || !componentName) {
        console.warn('Invalid component spec - missing toolname or componentName:', componentSpec);
        continue;
      }

      const componentType = `${toolname}.${componentName}`;
      console.log(`[setVisualisation] Processing component: ${componentType} with metadata:`, body);

      try {
        // NEW: Use the summary API flow
        // Step 1: Get API configuration for the tool
        const apiConfig = getToolApiConfig(toolname);

        if (!apiConfig) {
          console.warn(`No API configuration found for tool: ${toolname}`);
          // Fallback: spawn with metadata directly (legacy behavior)
          const componentId = await spawnComponent(componentType, body || {});
          if (componentId) {
            spawnedComponents.push(componentName);
          }
          continue;
        }

        // Step 2: Normalize the metadata
        const normalizedMetadata = normalizeMetadata(body || {});
        console.log(`📋 Normalized metadata for ${toolname}:`, normalizedMetadata);

        // Step 3: Fetch data from summary API
        console.log(`🔄 Fetching summary data from ${apiConfig.endpoint}`);
        const summaryResponse = await summaryClient(
          apiConfig.endpoint,
          normalizedMetadata,
          apiConfig.method
        );

        if (summaryResponse.error) {
          console.error(`Failed to fetch summary for ${toolname}:`, summaryResponse.error);
          // Show user-friendly error message
          setErrorWithAutoClear(summaryResponse.error, 8000);
          // Fallback: try spawning with metadata
          const componentId = await spawnComponent(componentType, body || {});
          if (componentId) {
            spawnedComponents.push(componentName);
          }
          continue;
        }

        // Step 4: Map summary data to component props
        const componentProps = mapSummaryToProps(
          toolname,
          componentName,
          summaryResponse.data
        );
        console.log(`🎨 Mapped props for ${componentType}:`, componentProps);

        // Step 5: Merge with any UI overrides from metadata (but not data)
        const finalProps = {
          ...componentProps,
          // Include any UI-specific overrides from metadata
          ...(body?.title && { title: body.title }),
          ...(body?.description && { description: body.description }),
          ...(body?.height && { height: body.height }),
          ...(body?.width && { width: body.width })
        };

        // Step 6: Spawn the component with the final props
        const componentId = await spawnComponent(componentType, finalProps);
        if (componentId) {
          spawnedComponents.push(componentName);
          console.log(`✅ Successfully spawned: ${componentType} with data from API`);
        }
      } catch (error) {
        console.error(`Failed to spawn component ${componentType}:`, error);
        const errorObj = error instanceof Error ? error : new Error('Component rendering failed');
        const friendlyError = formatErrorForDisplay(errorObj);
        setErrorWithAutoClear(`Unable to display ${componentName}: ${friendlyError}`, 6000);

        // Fallback: try spawning with original body
        try {
          const componentId = await spawnComponent(componentType, body || {});
          if (componentId) {
            spawnedComponents.push(componentName);
            console.log(`✅ Spawned ${componentType} using fallback`);
          }
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${componentType}:`, fallbackError);
        }
      }
    }

    if (spawnedComponents.length > 0) {
      console.log(`Successfully spawned ${spawnedComponents.length} component(s): ${spawnedComponents.join(', ')}`);
    }

    setComponentSpawning(false);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Update the volume of currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = newMutedState ? 0 : 0.8;
    }

    console.log(`🔊 Audio ${newMutedState ? 'muted' : 'unmuted'}`);
  };

  // Suggested queries for quick start with icons
  const suggestedQueries = [
    { text: "Show me customer churn risk analysis", icon: "📊" },
    { text: "What are my top performing products?", icon: "🏆" },
    { text: "Analyze sales trends for the last quarter", icon: "📈" },
    { text: "Show customer segmentation insights", icon: "👥" },
    { text: "What's driving revenue growth?", icon: "💹" },
    { text: "Identify at-risk customers", icon: "⚠️" },
    { text: "Compare regional sales performance", icon: "🗺️" },
    { text: "Show inventory optimization opportunities", icon: "📦" }
  ];

  const handleSuggestedQuery = (query: string) => {
    setShowWelcome(false);
    handleUserQuery(query);
  };

  const handleUserQuery = async (query: string, dataPoints?: any[]) => {
    if (!query.trim()) return;
    setShowWelcome(false);

    // Cancel any ongoing requests first
    cancelOngoingRequests();

    // Clear previous state for new query
    setUserSelectedChartPoints([]);
    setSpawnedComponents(new Set());
    occupiedPositionsRef.current.clear();
    activeVisualizationTypesRef.current.clear();
    currentQuerySessionRef.current.clear(); // Reset query session tracker

    const sessionId = `session-${Date.now()}`;
    console.log(`🎆 Starting new query session: ${sessionId}`);
    console.log(`🔄 Cleared currentQuerySessionRef for new query`);

    // Set robot to thinking state
    setRobotState(prev => ({
      ...prev,
      state: 'thinking',
      message: 'Let me analyze that for you...'
    }));

    setLoading(true);
    setErrorWithAutoClear(null);

    try {
      // Process SSE stream directly for real-time updates
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${backendUrl}/run_sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          user_query: query,
          session_id: session.session_id,
          user_id: session.user_id,
          app_name: session.app_name,
          is_canvas: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let currentTextResponse = '';
      let hasStartedSpeaking = false;
      sseReaderRef.current = reader;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]' || data === '') continue;

            try {
              const jsonData = JSON.parse(data);

              // Log SSE chunk
              console.log(`🎯 Processing SSE chunk:`, {
                hasText: !!jsonData.text,
                hasAudio: !!jsonData.audio,
                hasViz: !!(jsonData.visualisation || jsonData.visualization_output)
              });

              // Handle text updates
              if (jsonData.text) {
                currentTextResponse += jsonData.text;
                console.log(`📝 Text chunk received`);

                setRobotState(prev => ({
                  ...prev,
                  state: 'speaking',
                  message: jsonData.text
                }));
              }

              // Handle audio - simplified like web folder
              if (jsonData.audio) {
                try {
                  // Convert base64 to blob
                  const binaryString = window.atob(jsonData.audio.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }

                  const blob = new Blob([bytes], { type: jsonData.audio.mime_type });
                  const url = URL.createObjectURL(blob);

                  console.log(`🎵 Audio received: ${blob.size} bytes`);

                  // Update robot state with audio
                  setRobotState(prev => ({
                    ...prev,
                    state: 'speaking',
                    audioData: { url, blob, mimeType: jsonData.audio.mime_type }
                  }));
                } catch (error) {
                  console.error('Error processing audio:', error);
                }
              }

              // Handle visualization - simplified like web folder
              if (jsonData.visualisation || jsonData.visualization_output) {
                const vizData = jsonData.visualisation || jsonData.visualization_output;
                console.log('📊 Visualization data received:', vizData);

                // Process visualization immediately
                setVisualisation(vizData);
              }

            } catch (e) {
              console.warn('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Query error:', err);
      const errorObj = err instanceof Error ? err : new Error('Sorry, I encountered an error processing your request.');
      const friendlyErrorMsg = formatErrorForDisplay(errorObj);

      // Show user-friendly error message
      setErrorWithAutoClear(friendlyErrorMsg, 8000);

      setRobotState(prev => ({
        ...prev,
        state: 'error',
        message: friendlyErrorMsg
      }));
    } finally {
      // Clean up SSE reader
      if (sseReaderRef.current) {
        try {
          sseReaderRef.current.cancel();
        } catch (e) {
          console.warn('Error canceling SSE reader:', e);
        }
        sseReaderRef.current = null;
      }

      setLoading(false);
      setComponentSpawning(false);

      // Return to idle state after a delay
      setTimeout(() => {
        setRobotState(prev => ({
          ...prev,
          state: 'idle'
          // Keep showing the last chunk, don't dump all text
        }));
      }, 3000);
    }
  };

  const handleLaserMove = (position: { x: number; y: number } | null) => {
    if (position) {
      setRobotState(prev => ({
        ...prev,
        state: 'pointing',
        laserTarget: position
      }));
    } else {
      setRobotState(prev => ({
        ...prev,
        state: 'idle',
        laserTarget: null
      }));
    }
  };

  const handleChartInteraction = (data: any) => {
    setUserSelectedChartPoints(prev => [...prev, data]);
    console.log('Chart interaction:', data);
  };

  // Robot visibility toggle removed - using chat panel instead


  // Error display component
  const ErrorDisplay = () => (
    <>
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setErrorWithAutoClear(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Robot visibility removed - using chat panel instead

  return (
    <DashboardLayout
      title="Enterprise IQ"
      currentPath="/enterprise-iq"
    >
      {/* Remove default padding from DashboardLayout by using negative margins */}
      <div className="h-[calc(100vh-80px)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8 relative overflow-hidden bg-gradient-to-b from-white via-purple-50/10 to-violet-50/20">
              {/* Error Display */}
              {/* Error display removed - visualizations will render even if initial load fails */}

              {/* Welcome Screen */}
              {showWelcome && components.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50/50 to-violet-50/50 backdrop-blur-sm z-10">
                  <div className="max-w-4xl mx-auto p-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                      Welcome to Enterprise IQ
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                      Your AI-powered business intelligence assistant. Ask questions in natural language to explore your data.
                    </p>

                    {/* Quick Start Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {suggestedQueries.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuery(query.text)}
                          className="p-4 bg-white hover:bg-purple-50 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 hover:border-purple-300 group"
                        >
                          <div className="text-2xl mb-2">{query.icon}</div>
                          <div className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                            {query.text}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="text-sm text-gray-500">
                      Or type your own question below
                    </div>
                  </div>
                </div>
              )}

              {/* Conversational Canvas */}
              <ConversationalCanvas
                components={components}
                onChartInteraction={handleChartInteraction}
                onLaserMove={handleLaserMove}
                conversationHistory={conversations[activeConversationId || ''] || []}
              />

              {/* Robot Character - Top-left position */}
              <RobotCharacter
                isVisible={true}
                state={robotState.state}
                message={robotState.message}
                initialPosition={{ x: 20, y: 20 }}
                laserTarget={robotState.laserTarget}
              />

              {/* Query Input - Centered at bottom inside canvas */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4" style={{ zIndex: Z_INDEX.AUDIO_CONTROLS + 1 }}>
                <QueryInput
                  onSubmit={handleUserQuery}
                  disabled={loading}
                />
              </div>

              {/* Zoom Percentage - Bottom right corner */}
              <div className="absolute bottom-4 right-4 px-3 py-2 glass-card rounded-lg shadow-lg border border-accent/20" style={{ zIndex: Z_INDEX.AUDIO_CONTROLS }}>
                <span className="text-sm font-medium text-foreground">
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>

              {/* Audio Controls - Above zoom percentage */}
              <div className="absolute bottom-16 right-4 flex gap-2" style={{ zIndex: Z_INDEX.AUDIO_CONTROLS }}>
                {/* Play Pending Audio Button - Only show when needed */}
                {audioPlaybackFailed && pendingAudio && (
                  <button
                    onClick={playPendingAudio}
                    className="p-3 bg-white/90 hover:bg-gray-100 rounded-lg transition-all shadow-md border border-gray-200"
                    title="Click to play audio"
                  >
                    <Volume2 className="w-5 h-5 text-green-500" />
                  </button>
                )}

                {/* Mute/Unmute Button - Only show when audio is playing */}
                {isAudioPlaying && (
                  <button
                    onClick={toggleMute}
                    className="p-3 bg-white/90 hover:bg-gray-100 rounded-lg transition-all shadow-md border border-gray-200"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-red-500" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-purple-600" />
                    )}
                  </button>
                )}
              </div>
      </div>

      {/* Component spawning progress */}
      {componentSpawning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-blue-600/90 text-white rounded-lg backdrop-blur-sm flex items-center gap-3 z-50">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <div className="text-sm">
              {spawnProgress.total > 0 ? (
                <span>Loading visualizations ({spawnProgress.current}/{spawnProgress.total})</span>
              ) : (
                <span>Loading component...</span>
              )}
              {spawnProgress.currentComponent && (
                <div className="text-xs opacity-80 mt-1">{spawnProgress.currentComponent}</div>
              )}
            </div>
          </div>
        )}

      {/* Chat History Panel - Floating conversation history */}
      {/* <ChatHistoryPanel /> */}
    </DashboardLayout>
  );
}