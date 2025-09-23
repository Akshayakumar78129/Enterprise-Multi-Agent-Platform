"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';
import { DashboardLayout } from 'components/index';
import { Volume2, VolumeX } from 'lucide-react';
import { RootState } from '@/store';
import { addComponent } from '@/store/slices/canvasSlice';
import {
  ConversationalCanvas,
  RobotCharacter,
  QueryInput
} from './components';

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
  'purchase-frequency': {
    histogram: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
    heatmap: dynamic(() => import('./components/Visualizations/IntervalHeatmap')),
  },
  'customer-segmentation': {
    // Use the histogram as fallback for missing components
    distributionMap: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
    profileCards: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
    metricComparison: dynamic(() => import('components').then(mod => mod.SegmentComparisonMatrix)),
  },
  'churn-prediction': {
    riskPyramid: dynamic(() => import('components').then(mod => mod.RiskPyramid)),
    featureImportance: dynamic(() => import('components').then(mod => mod.AIFeatureImportance)),
    probabilityHistogram: dynamic(() => import('components').then(mod => mod.ProbabilityHistogram)),
    temporalRisk: dynamic(() => import('components').then(mod => mod.RiskPyramid)), // Map to RiskPyramid as fallback
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
    kpiTiles: dynamic(() => import('components').then(mod => mod.KPITiles)),
    dashboard: dynamic(() => import('./components/Visualizations/FrequencyHistogram')), // Using histogram as placeholder
    churnRiskGauge: dynamic(() => import('./components/Visualizations/IntervalHeatmap')), // Using heatmap as placeholder
    valueRiskMatrix: dynamic(() => import('./components/Visualizations/IntervalHeatmap')), // Using heatmap as placeholder
    actionSankey: dynamic(() => import('./components/Visualizations/FrequencyHistogram')), // Using histogram as placeholder
    roiWaterfall: dynamic(() => import('./components/Visualizations/FrequencyHistogram')) // Using histogram as placeholder
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
  const audioSequenceRef = useRef<number>(0);
  const isDevelopmentMode = process.env.NODE_ENV === 'development';
  const audioProcessingGuardRef = useRef<boolean>(false);
  const lastProcessedAudioRef = useRef<string>('');
  // Removed audio buffering - now using direct queue processing
  const sseStatsRef = useRef({ totalChunks: 0, audioChunks: 0, textChunks: 0, duplicates: 0 });
  const textAudioCorrelationRef = useRef<Map<string, { text: string; audioHashes: string[] }>>(new Map());
  const sseReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const processedChunksRef = useRef<Set<string>>(new Set());
  const processedAudioHashesRef = useRef<Set<string>>(new Set());

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

  // Global visualization registry to prevent duplicates across sessions
  const globalVisualizationRegistryRef = useRef<Map<string, { id: string; timestamp: number }>>(new Map());
  const [spawnedComponents, setSpawnedComponents] = useState<Set<string>>(new Set());
  const processedVisualizationsRef = useRef<Set<string>>(new Set());
  const currentSessionRef = useRef<string>('');

  // STRICT SINGLETON: Only ONE instance of each visualization TYPE allowed
  const activeVisualizationTypesRef = useRef<Set<string>>(new Set());

  // Visualization queue to prevent duplicate spawning
  const visualizationQueueRef = useRef<Map<string, any>>(new Map());
  const processingVisualizationRef = useRef(false);
  const occupiedPositionsRef = useRef<Set<string>>(new Set());
  const visualizationProcessingLock = useRef<Set<string>>(new Set()); // Synchronous lock


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

    console.log('🎵 Processing audio from queue:');
    console.log(`   Hash: ${audioData.hash}`);
    console.log(`   Size: ${audioData.size} bytes`);
    console.log(`   Type: ${audioData.mimeType}`);
    console.log(`   Remaining in queue: ${audioQueueRef.current.length}`);

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

    // Set up event listeners with detailed logging
    audioElement.addEventListener('loadstart', () => {
      console.log(`🎵 Audio loading started (hash: ${audioData.hash})`);
    });

    audioElement.addEventListener('loadeddata', () => {
      console.log(`🎵 Audio data loaded - Duration: ${audioElement.duration}s`);
    });

    audioElement.addEventListener('canplay', () => {
      console.log(`🎵 Audio can start playing`);
    });

    audioElement.addEventListener('ended', () => {
      console.log(`🎵 Audio finished playing (hash: ${audioData.hash}, duration: ${audioElement.duration}s)`);
      console.log(`📊 Queue status after playback: ${audioQueueRef.current.length} items remaining`);
      isPlayingRef.current = false;
      URL.revokeObjectURL(audioData.url);
      currentAudioRef.current = null;

      // Update state - no audio playing if queue is empty
      if (audioQueueRef.current.length === 0) {
        setIsAudioPlaying(false);
      }

      // Process next audio in queue with a small delay
      console.log(`🔄 Will process next audio in queue after 200ms delay`);
      setTimeout(() => {
        console.log('⏰ Delay complete, calling processAudioQueue');
        processAudioQueue();
      }, 200);
    });

    audioElement.addEventListener('error', (e) => {
      console.error(`❌ Audio playback error (hash: ${audioData.hash}):`, e);
      console.error(`   Error code: ${audioElement.error?.code}`);
      console.error(`   Error message: ${audioElement.error?.message}`);
      isPlayingRef.current = false;
      URL.revokeObjectURL(audioData.url);
      currentAudioRef.current = null;

      // Update state - no audio playing if queue is empty
      if (audioQueueRef.current.length === 0) {
        setIsAudioPlaying(false);
      }

      // Process next audio in queue
      setTimeout(processAudioQueue, 100);
    });

    audioElement.addEventListener('timeupdate', () => {
      // Log progress occasionally (every 2 seconds)
      if (audioElement.currentTime > 0 && Math.floor(audioElement.currentTime) % 2 === 0) {
        console.log(`🔊 Audio progress: ${audioElement.currentTime.toFixed(1)}s / ${audioElement.duration.toFixed(1)}s`);
      }
    });

    audioElement.play().then(() => {
      console.log(`✅ Audio playback started successfully (hash: ${audioData.hash})`);
      console.log(`   Duration: ${audioElement.duration}s`);
      console.log(`   Volume: ${audioElement.volume}`);
      console.log(`   Queue remaining: ${audioQueueRef.current.length}`);
      setAudioPlaybackFailed(false);
      setPendingAudio(null);
    }).catch((error) => {
      console.error(`❌ Audio playback failed (hash: ${audioData.hash}):`, error);
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error message: ${error.message}`);
      isPlayingRef.current = false;

      // Some browsers require user interaction before playing audio
      if (error.name === 'NotAllowedError') {
        console.warn('Audio autoplay blocked by browser. User interaction required.');
        setAudioPlaybackFailed(true);
        setPendingAudio({
          url: audioData.url,
          blob: audioData.blob,
          mimeType: audioData.mimeType
        });
      } else {
        // For other errors, clean up the URL
        console.error('Cleaning up failed audio and trying next in queue');
        URL.revokeObjectURL(audioData.url);
        currentAudioRef.current = null;
        // Process next audio in queue
        setTimeout(processAudioQueue, 100);
      }
    });
  }, [isMuted]);

  // Note: Removed processBufferedAudio - now using direct queue processing

  // Audio handling with smart queue system and development mode guards
  useEffect(() => {
    if (robotState.audioData?.url && robotState.audioData?.blob) {
      // Development mode guard to prevent double execution
      if (isDevelopmentMode && audioProcessingGuardRef.current) {
        console.log('🛡️ Development mode: Preventing duplicate audio processing');
        return;
      }

      audioProcessingGuardRef.current = true;

      // Reset guard after a short delay to allow next chunk
      setTimeout(() => {
        audioProcessingGuardRef.current = false;
      }, 50);

      // Use fallback hash for immediate processing, crypto hash for detailed logging
      const audioHash = createFallbackHash(robotState.audioData.blob);
      const audioSize = robotState.audioData.blob.size;

      // Additional guard: check if this is the same audio as last processed
      if (lastProcessedAudioRef.current === audioHash) {
        console.log(`🛡️ Same audio hash as last processed (${audioHash}), skipping`);
        audioProcessingGuardRef.current = false;
        return;
      }

      lastProcessedAudioRef.current = audioHash;

      // Check if this audio is already in queue (additional safety)
      const isDuplicateInQueue = audioQueueRef.current.some(item => item.hash === audioHash);
      if (isDuplicateInQueue) {
        console.log(`🚫 Audio already in queue (hash: ${audioHash}), skipping`);
        URL.revokeObjectURL(robotState.audioData.url); // Clean up unused URL
        return;
      }

      // Validate audio size (skip empty or too small audio)
      if (audioSize < 1000) { // Less than 1KB is likely invalid
        console.log(`🚫 Skipping tiny audio chunk (${audioSize} bytes)`);
        URL.revokeObjectURL(robotState.audioData.url);
        return;
      }

      // Add to queue with metadata
      const audioItem = {
        url: robotState.audioData.url,
        blob: robotState.audioData.blob,
        mimeType: robotState.audioData.mimeType,
        hash: audioHash,
        size: audioSize
      };

      audioQueueRef.current.push(audioItem);
      audioSequenceRef.current++;

      console.log(`🎵 Audio added to queue:`);
      console.log(`   Sequence: ${audioSequenceRef.current}`);
      console.log(`   Hash: ${audioHash}`);
      console.log(`   Size: ${audioSize} bytes`);
      console.log(`   Current queue: ${audioQueueRef.current.map(a => a.hash).join(', ')}`);
      console.log(`   Is currently playing: ${isPlayingRef.current}`);

      // Process queue - only if not already playing
      if (!isPlayingRef.current) {
        console.log('🚀 Starting queue processing (not currently playing)');
        processAudioQueue();
      } else {
        console.log('⏸️ Audio already playing, will process after current finishes');
      }

      // Guard is already reset above after 50ms
    }
  }, [robotState.audioData]); // Removed processAudioQueue from deps to prevent re-renders

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
          console.warn('Error canceling SSE reader on unmount:', e);
        }
      }

      // Clear processed chunks and visualizations
      processedChunksRef.current.clear();
      processedVisualizationsRef.current.clear();
      processedAudioHashesRef.current.clear();
      audioSequenceRef.current = 0;
      textAudioCorrelationRef.current.clear();
      sseStatsRef.current = { totalChunks: 0, audioChunks: 0, textChunks: 0, duplicates: 0 };
      console.log('🧹 Cleared all processed data on component unmount');
    };
  }, [pendingAudio]);

  // Cancel ongoing requests when starting new query
  const cancelOngoingRequests = useCallback(() => {
    if (sseReaderRef.current) {
      try {
        console.log('🚫 Canceling ongoing SSE request');
        sseReaderRef.current.cancel();
      } catch (e) {
        console.warn('Error canceling ongoing SSE request:', e);
      }
      sseReaderRef.current = null;
    }

    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }

    // Clear audio queue
    audioQueueRef.current.forEach(audio => {
      URL.revokeObjectURL(audio.url);
    });
    audioQueueRef.current = [];

    // Clear processed data for new query
    processedChunksRef.current.clear();
    processedAudioHashesRef.current.clear();
    audioSequenceRef.current = 0;
    textAudioCorrelationRef.current.clear();
    sseStatsRef.current = { totalChunks: 0, audioChunks: 0, textChunks: 0, duplicates: 0 };
    console.log('🧹 Cleared all processed data for new query');
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

    // DATA VALIDATION: Check if props has valid data for visualization
    console.log(`🔍 [spawnComponent] Component: ${componentType}`);
    console.log(`🔍 [spawnComponent] Props received:`, JSON.stringify(props, null, 2));

    if (!props || Object.keys(props).length === 0) {
      console.warn(`⚠️ No data provided for ${componentType}, skipping spawn`);
      setComponentSpawning(false);
      return null;
    }

    // Check for common data fields that indicate actual content
    const hasValidData =
      props.data ||
      props.chart_data ||
      props.values ||
      props.series ||
      props.datasets ||
      props.labels ||
      props.categories ||
      props.metrics ||
      (Array.isArray(props) && props.length > 0);

    if (!hasValidData) {
      console.warn(`⚠️ No valid visualization data found in props for ${componentType}:`, props);
      setComponentSpawning(false);
      return null;
    }

    // STRICT SINGLETON CHECK: Only ONE of each type allowed globally
    if (activeVisualizationTypesRef.current.has(componentType)) {
      console.log(`🔒 SINGLETON: ${componentType} already active, blocking duplicate`);
      setComponentSpawning(false);
      return null;
    }

    // Check if this type already exists in current components
    const existingOfType = Object.values(components).find(
      comp => `${comp.toolId}.${comp.type}` === componentType
    );

    if (existingOfType) {
      console.log(`🚫 Component ${componentType} already exists (id: ${existingOfType.id}), blocking duplicate`);
      setComponentSpawning(false);
      return null;
    }

    // Mark this type as active IMMEDIATELY
    activeVisualizationTypesRef.current.add(componentType);
    console.log(`✅ Marked ${componentType} as active singleton`);

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
    console.log(`   Total components in canvas: ${Object.keys(components).length + 1}`);

    dispatch(addComponent(componentData));

    setComponentSpawning(false);
    setSpawnProgress(prev => ({ ...prev, current: prev.current + 1 }));

    console.log(`✅ Component ${componentType} spawned successfully with ID: ${id}`);
    console.log(`   Active singletons: ${Array.from(activeVisualizationTypesRef.current).join(', ')}`);
    return id;
  };

  // Queue visualization to prevent duplicates
  const queueVisualization = (visualization: any) => {
    // Extract only the content for hashing, ignore metadata/timestamps
    const contentForHash = Array.isArray(visualization)
      ? visualization.map(v => ({
          toolname: v.toolname,
          componentName: v.componentName,
          body: v.body
        }))
      : visualization;

    const key = JSON.stringify(contentForHash);
    const keyHash = createFallbackHash(key);

    // SYNCHRONOUS LOCK: Check if this exact visualization is already being processed
    if (visualizationProcessingLock.current.has(keyHash)) {
      console.log(`🔒 LOCKED: Visualization already being processed (hash: ${keyHash})`);
      return;
    }

    // Lock it immediately
    visualizationProcessingLock.current.add(keyHash);

    // Check if already processed in global registry
    if (Array.isArray(visualization)) {
      for (const vis of visualization) {
        const componentType = `${vis.toolname}.${vis.componentName}`;
        const vizKey = `${componentType}-${JSON.stringify(vis.body || {})}`;
        const vizHash = createFallbackHash(vizKey);

        if (globalVisualizationRegistryRef.current.has(vizHash)) {
          console.log(`🚫 Visualization ${componentType} already processed globally, skipping entire batch`);
          visualizationProcessingLock.current.delete(keyHash); // Unlock
          return;
        }
      }
    }

    if (!visualizationQueueRef.current.has(keyHash)) {
      console.log(`📦 Adding visualization to queue (hash: ${keyHash})`);
      visualizationQueueRef.current.set(keyHash, visualization);
      processVisualizationQueue();
    } else {
      console.log(`🚫 Visualization already in queue (hash: ${keyHash}), skipping`);
      visualizationProcessingLock.current.delete(keyHash); // Unlock if not queued
    }
  };

  // Process visualization queue one at a time
  const processVisualizationQueue = async () => {
    if (processingVisualizationRef.current || visualizationQueueRef.current.size === 0) {
      return;
    }

    processingVisualizationRef.current = true;

    // Get first item from queue
    const [keyHash, visualization] = visualizationQueueRef.current.entries().next().value;
    visualizationQueueRef.current.delete(keyHash);

    console.log(`🎭 Processing visualization from queue (hash: ${keyHash})`);
    await setVisualisation(visualization);

    // Unlock after processing
    visualizationProcessingLock.current.delete(keyHash);
    processingVisualizationRef.current = false;

    // Process next item if any
    if (visualizationQueueRef.current.size > 0) {
      setTimeout(() => processVisualizationQueue(), 100);
    }
  };

  // Set visualization with global deduplication
  const setVisualisation = async (visualisation: any) => {
    if (!visualisation) {
      console.warn('No visualization data received');
      return;
    }

    if (!Array.isArray(visualisation)) {
      console.warn('Visualization data is not an array:', visualisation);
      return;
    }

    console.log(`📊 Processing NEW visualization data (session: ${currentSessionRef.current}):`, visualisation);

    // Clear any previous errors before spawning new components
    setErrorWithAutoClear(null);
    setComponentSpawning(true);
    setSpawnProgress({ current: 0, total: visualisation.length, currentComponent: '' });

    const spawnPromises = [];

    for (const componentSpec of visualisation) {
      const { toolname, componentName, body } = componentSpec;

      if (!toolname || !componentName) {
        console.warn('Invalid component spec - missing toolname or componentName:', componentSpec);
        continue;
      }

      // Validate that body has actual data
      if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
        console.warn(`⚠️ Empty or missing body data for ${toolname}.${componentName}, skipping`);
        continue;
      }

      const componentType = `${toolname}.${componentName}`;

      // Validate and transform body data for visualization components
      let processedBody = body;

      // Special handling for churn-prediction components that expect data array
      if (toolname === 'churn-prediction' && ['riskPyramid', 'featureImportance', 'segmentMatrix', 'probabilityHistogram'].includes(componentName)) {
        // If body is a direct array, wrap it in { data: [...] }
        if (Array.isArray(body)) {
          processedBody = { data: body };
          console.log(`📦 Wrapped ${componentType} array in data property`);
        }
        // If body is an object without 'data' property and looks like array data
        else if (body && typeof body === 'object' && !('data' in body)) {
          // Check if it's parameter data (has start_date, etc.) or actual visualization data
          const paramKeys = ['start_date', 'end_date', 'riskThreshold', 'modelType', 'customerSegment', 'count'];
          const hasParamKeys = paramKeys.some(key => key in body);

          if (!hasParamKeys) {
            console.warn(`⚠️ ${componentType} body missing 'data' property and doesn't look like parameters:`, body);
            // If it has array-like values, try to extract them
            const values = Object.values(body);
            if (values.length > 0 && values.every(v => typeof v === 'object')) {
              processedBody = { data: values };
              console.log(`📦 Extracted array values from ${componentType} body`);
            }
          }
        }
        // Body already has correct structure
        else if (body && body.data) {
          console.log(`✅ ${componentType} already has correct data structure`);
        }
      }

      // Create unique hash for this specific visualization
      const visualizationKey = `${componentType}-${JSON.stringify(processedBody || {})}`;
      const vizHash = createFallbackHash(visualizationKey);

      // Check global registry to prevent duplicates
      if (globalVisualizationRegistryRef.current.has(vizHash)) {
        const existing = globalVisualizationRegistryRef.current.get(vizHash);
        console.log(`🚫 Skipping duplicate visualization ${componentType} (already spawned as ${existing?.id})`);
        continue;
      }

      // IMMEDIATELY register to prevent duplicates (with pending status)
      globalVisualizationRegistryRef.current.set(vizHash, {
        id: 'pending',
        timestamp: Date.now()
      });

      console.log(`🔄 Queuing new component: ${componentType}`, processedBody);

      // Pass the processed body - the components should handle the data structure
      // The processedBody has been validated and transformed as needed
      console.log(`📊 Component props (processed):`, processedBody);
      console.log(`📊 Body structure for ${componentType}:`, {
        isObject: typeof processedBody === 'object' && processedBody !== null,
        hasDataProperty: processedBody && typeof processedBody === 'object' && 'data' in processedBody,
        dataValue: processedBody && processedBody.data ? processedBody.data : 'N/A',
        dataIsArray: processedBody && processedBody.data && Array.isArray(processedBody.data),
        dataLength: processedBody && processedBody.data && Array.isArray(processedBody.data) ? processedBody.data.length : 'N/A'
      });

      const spawnPromise = spawnComponent(componentType, processedBody || {})
        .then(result => {
          if (result) {
            console.log(`✅ Successfully spawned: ${componentType}`);
            // Update registry with actual ID
            globalVisualizationRegistryRef.current.set(vizHash, {
              id: result,
              timestamp: Date.now()
            });
          } else {
            console.warn(`❌ Failed to spawn: ${componentType}`);
            // Remove from registry if failed
            globalVisualizationRegistryRef.current.delete(vizHash);
          }
          return result;
        })
        .catch(error => {
          console.error(`💥 Error spawning ${componentType}:`, error);
          return null;
        });

      spawnPromises.push(spawnPromise);
    }

    // Wait for all components to attempt spawning
    try {
      const results = await Promise.allSettled(spawnPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      console.log(`📈 Visualization spawning complete: ${successful} successful, ${failed} failed`);

      if (failed > 0 && successful === 0) {
        // Don't show error to user - visualizations may still load
        console.log(`Failed to load visualizations initially, but they may still render.`);
      }
    } catch (error) {
      console.error('Error during visualization spawning:', error);
      // Don't show error to user - visualizations may still load
    } finally {
      setComponentSpawning(false);
      setSpawnProgress({ current: 0, total: 0, currentComponent: '' });
    }
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

    // Clear previous selections and spawned components for new query
    setUserSelectedChartPoints([]);
    setSpawnedComponents(new Set());
    occupiedPositionsRef.current.clear(); // Clear grid positions
    visualizationQueueRef.current.clear(); // Clear any pending visualizations
    visualizationProcessingLock.current.clear(); // Clear processing locks
    activeVisualizationTypesRef.current.clear(); // Clear active singletons

    // Create new session ID and clear processed visualizations
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    currentSessionRef.current = sessionId;
    processedVisualizationsRef.current.clear();
    console.log(`🎆 Starting new query session: ${sessionId}`);

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

              // Update SSE statistics
              sseStatsRef.current.totalChunks++;
              if (jsonData.text) sseStatsRef.current.textChunks++;
              if (jsonData.audio) sseStatsRef.current.audioChunks++;

              // Create content-based chunk identifier for deduplication
              const textHash = jsonData.text ? createFallbackHash(jsonData.text) : '';
              const audioHash = jsonData.audio ? createFallbackHash(jsonData.audio.data) : '';
              const vizHash = (jsonData.visualisation || jsonData.visualization_output) ?
                createFallbackHash(jsonData.visualisation || jsonData.visualization_output) : '';

              const chunkId = `${sessionId}-text:${textHash}-audio:${audioHash}-viz:${vizHash}`;

              // Skip if chunk was already processed
              if (processedChunksRef.current.has(chunkId)) {
                sseStatsRef.current.duplicates++;
                console.log(`🚫 Skipping duplicate SSE chunk (${chunkId.substring(0, 50)}...)`);
                console.log(`   SSE Stats: Total=${sseStatsRef.current.totalChunks} Audio=${sseStatsRef.current.audioChunks} Text=${sseStatsRef.current.textChunks} Duplicates=${sseStatsRef.current.duplicates}`);
                continue;
              }

              processedChunksRef.current.add(chunkId);
              console.log(`🎯 Processing NEW chunk #${sseStatsRef.current.totalChunks} (${currentSessionRef.current})`);
              console.log(`   Content: Text:${!!jsonData.text} Audio:${!!jsonData.audio} Viz:${!!(jsonData.visualisation || jsonData.visualization_output)}`);
              console.log(`   Hashes: Text:${textHash} Audio:${audioHash}`);
              console.log(`   SSE Stats: Total=${sseStatsRef.current.totalChunks} Audio=${sseStatsRef.current.audioChunks} Text=${sseStatsRef.current.textChunks} Duplicates=${sseStatsRef.current.duplicates}`);

              // Handle text updates with correlation tracking
              if (jsonData.text) {
                currentTextResponse += jsonData.text;

                // Track text-audio correlation
                if (!textAudioCorrelationRef.current.has(textHash)) {
                  textAudioCorrelationRef.current.set(textHash, {
                    text: jsonData.text,
                    audioHashes: []
                  });
                }

                console.log(`📝 Text chunk: "${jsonData.text.substring(0, 100)}${jsonData.text.length > 100 ? '...' : ''}"`);

                setRobotState(prev => ({
                  ...prev,
                  state: 'speaking',
                  message: jsonData.text // Show current chunk, not accumulated
                }));
              }

              // Handle audio directly without buffering - use existing queue
              if (jsonData.audio) {
                const audioDataHash = createFallbackHash(jsonData.audio.data);
                const audioSize = jsonData.audio.data.length;

                // Check if this exact audio was already processed
                if (processedAudioHashesRef.current.has(audioDataHash)) {
                  console.log(`🚫 Skipping duplicate audio (hash: ${audioDataHash})`);
                } else {
                  console.log(`🎵 Processing NEW audio chunk (hash: ${audioDataHash}, size: ${audioSize})`);
                  processedAudioHashesRef.current.add(audioDataHash);

                  try {
                    // Convert base64 to blob immediately
                    const binaryString = window.atob(jsonData.audio.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }

                    const blob = new Blob([bytes], { type: jsonData.audio.mime_type });
                    const url = URL.createObjectURL(blob);

                    console.log(`🎵 Audio blob created: ${blob.size} bytes, type: ${blob.type}`);

                    // Add directly to audio queue instead of replacing via state
                    audioQueueRef.current.push({
                      url,
                      blob,
                      mimeType: jsonData.audio.mime_type,
                      hash: audioDataHash,
                      size: jsonData.audio.data.length
                    });

                    // Process the queue with interrupt to play immediately
                    processAudioQueue(true);

                    // Update robot state without audio data
                    setRobotState(prev => ({
                      ...prev,
                      state: 'speaking'
                    }));

                    // Track audio-text correlation
                    if (textHash) {
                      const correlation = textAudioCorrelationRef.current.get(textHash);
                      if (correlation) {
                        correlation.audioHashes.push(audioDataHash);
                        console.log(`🔗 Linked audio ${audioDataHash} to text ${textHash}`);
                      }
                    }
                  } catch (error) {
                    console.error('Error processing audio:', error);
                  }
                }
              }

              // Normalize visualization key and queue for processing
              if (jsonData.visualization_output && !jsonData.visualisation) {
                jsonData.visualisation = jsonData.visualization_output;
              }

              if (jsonData.visualisation) {
                console.log('📊 Raw visualization data:', jsonData.visualisation);
                console.log('📊 Visualization data type:', typeof jsonData.visualisation);

                // Parse if it's a JSON string
                let vizData = jsonData.visualisation;
                if (typeof vizData === 'string') {
                  try {
                    vizData = JSON.parse(vizData);
                    console.log('📊 Parsed visualization data:', vizData);
                  } catch (parseError) {
                    console.error('Failed to parse visualization JSON:', parseError);
                    console.error('Raw string:', vizData);
                    return;
                  }
                }

                console.log('📊 Queueing visualization:', vizData);
                console.log('📊 Visualization structure:', {
                  isArray: Array.isArray(vizData),
                  length: Array.isArray(vizData) ? vizData.length : 'N/A',
                  firstItem: Array.isArray(vizData) && vizData.length > 0 ? vizData[0] : 'N/A',
                  firstItemBody: Array.isArray(vizData) && vizData.length > 0 && vizData[0].body ? vizData[0].body : 'N/A'
                });
                queueVisualization(vizData);
              }

            } catch (e) {
              console.warn('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Query error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Sorry, I encountered an error processing your request.';

      // Only show network/critical errors, not visualization loading issues
      if (errorMsg.includes('network') || errorMsg.includes('Network') || errorMsg.includes('fetch') || errorMsg.includes('500') || errorMsg.includes('404')) {
        setErrorWithAutoClear(errorMsg);
      } else {
        console.error('Request error:', errorMsg);
      }

      setRobotState(prev => ({
        ...prev,
        state: 'error',
        message: errorMsg
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
    </DashboardLayout>
  );
}