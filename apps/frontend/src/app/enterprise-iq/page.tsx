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

export default function EnterpriseIQPage() {
  const dispatch = useDispatch();
  const { components } = useSelector((state: RootState) => state.canvas);
  const { conversations, activeConversationId } = useSelector((state: RootState) => state.conversation);

  // Robot state management
  const [robotState, setRobotState] = useState<RobotState>({
    state: 'idle',
    message: null,
    position: { x: 50, y: 100 },
    laserTarget: null,
    audioData: null
  });

  const [userSelectedChartPoints, setUserSelectedChartPoints] = useState<any[]>([]);
  const [showQueryInput, setShowQueryInput] = useState(true);
  const [isRobotVisible, setIsRobotVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<{ url: string; blob: Blob; mimeType: string } | null>(null);
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

  // Spawned components tracking to prevent duplicates
  const [spawnedComponents, setSpawnedComponents] = useState<Set<string>>(new Set());
  const processedVisualizationsRef = useRef<Set<string>>(new Set());
  const currentSessionRef = useRef<string>('');


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

  // Component registry with available components
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
    },
    'visualization': {
      barchart: dynamic(() => import('components').then(mod => mod.BarChart)),
      linechart: dynamic(() => import('components').then(mod => mod.LineChart)),
      histogram: dynamic(() => import('./components/Visualizations/FrequencyHistogram')),
      heatmap: dynamic(() => import('./components/Visualizations/IntervalHeatmap')),
    }
  };

  // Audio queue processing function
  const processAudioQueue = useCallback(() => {
    console.log('🎵 processAudioQueue called:', {
      isPlaying: isPlayingRef.current,
      queueLength: audioQueueRef.current.length,
      queue: audioQueueRef.current.map(a => ({ hash: a.hash, size: a.size }))
    });

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

  // Function to spawn component with smart duplicate prevention
  const spawnComponent = async (componentType: string, props: any = {}) => {
    setComponentSpawning(true);
    setSpawnProgress(prev => ({ ...prev, currentComponent: componentType }));

    // Smart duplicate prevention: only prevent if component exists AND is visible
    const existingComponents = Object.values(components).filter(
      comp => `${comp.toolId}.${comp.type}` === componentType
    );

    const visibleComponents = existingComponents.filter(comp => !comp.minimized);
    const minimizedComponents = existingComponents.filter(comp => comp.minimized);

    console.log(`🔍 Component analysis for ${componentType}:`);
    console.log(`   Total existing: ${existingComponents.length}`);
    console.log(`   Visible: ${visibleComponents.length}`);
    console.log(`   Minimized: ${minimizedComponents.length}`);

    // If there's already a visible component, don't spawn
    if (visibleComponents.length > 0) {
      console.log(`🚫 Component ${componentType} already visible, skipping spawn`);
      setComponentSpawning(false);
      return null;
    }

    // If there are only minimized components, we can spawn (user closed them)
    if (minimizedComponents.length > 0) {
      console.log(`✅ Component ${componentType} exists but is minimized, allowing respawn`);
    }

    // Prevent too many total instances (including minimized)
    if (existingComponents.length >= 5) {
      console.log(`⚠️ Too many total instances of ${componentType} (${existingComponents.length}), skipping`);
      setErrorWithAutoClear(`Too many ${componentType} components. Please remove some first.`);
      setComponentSpawning(false);
      return null;
    }

    const id = `component-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const [toolName, componentName] = componentType.split('.');

    // Verify component exists in registry with better error handling
    const Component = componentRegistry[toolName]?.[componentName];
    if (!Component) {
      const errorMsg = `Component not found: ${componentType}. Available components: ${Object.keys(componentRegistry).join(', ')}`;
      console.warn(errorMsg);
      // Don't show persistent error for spawn failures - just log it
      setComponentSpawning(false);
      return null;
    }

    // Test dynamic import to catch errors early
    try {
      await Component.preload?.();
    } catch (importError) {
      const errorMsg = `Failed to load component ${componentType}: ${importError}`;
      console.error(errorMsg);
      // Don't show persistent error for component load failures - just log it
      setComponentSpawning(false);
      return null;
    }

    // Intelligent positioning with bounds checking - avoid overlaps and ensure within canvas
    const findNonOverlappingPosition = (size: { width: number; height: number }) => {
      const padding = 30;
      const step = 50;
      // Get actual canvas dimensions (conservative estimate)
      const canvasWidth = Math.min(window.innerWidth - 100, 1200);
      const canvasHeight = Math.min(window.innerHeight - 250, 600);

      console.log(`🎯 Finding position for component (${size.width}x${size.height}) in canvas (${canvasWidth}x${canvasHeight})`);

      for (let y = padding; y <= canvasHeight - size.height - padding; y += step) {
        for (let x = padding; x <= canvasWidth - size.width - padding; x += step) {
          const newRect = { x, y, width: size.width, height: size.height };

          // Check if this position overlaps with existing components
          const overlaps = Object.values(components).some(component => {
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
            console.log(`✅ Found non-overlapping position at (${x}, ${y})`);
            return { x, y };
          }
        }
      }

      // If no non-overlapping position found, use constrained random position
      const safeX = Math.max(padding, Math.min(canvasWidth - size.width - padding, 100 + Math.random() * 200));
      const safeY = Math.max(padding, Math.min(canvasHeight - size.height - padding, 100 + Math.random() * 150));

      console.log(`⚠️ Using fallback position at (${safeX}, ${safeY})`);
      return {
        x: safeX,
        y: safeY
      };
    };

    const componentSize = { width: 400, height: 300 };
    const position = findNonOverlappingPosition(componentSize);

    // Track spawned component - but don't block respawning entirely
    setSpawnedComponents(prev => new Set([...prev, `${componentType}-${id}`]));

    // Only pass serializable data to Redux
    const componentData = {
      id,
      type: componentName,
      toolId: toolName,
      position,
      size: componentSize,
      data: props,
      minimized: false
    };

    console.log(`📦 Dispatching component to Redux:`, componentData);
    console.log(`   Position: (${position.x}, ${position.y})`);
    console.log(`   Size: ${componentSize.width}x${componentSize.height}`);
    console.log(`   Total components in canvas: ${Object.keys(components).length + 1}`);

    dispatch(addComponent(componentData));

    setComponentSpawning(false);
    setSpawnProgress(prev => ({ ...prev, current: prev.current + 1 }));

    console.log(`✅ Component ${componentType} spawned successfully with ID: ${id}`);
    return id;
  };

  // Set visualization with deduplication and session management
  const setVisualisation = async (visualisation: any) => {
    if (!visualisation) {
      console.warn('No visualization data received');
      return;
    }

    if (!Array.isArray(visualisation)) {
      console.warn('Visualization data is not an array:', visualisation);
      return;
    }

    // Create content hash for deduplication
    const visualizationHash = JSON.stringify(visualisation.map(v => ({
      toolname: v.toolname,
      componentName: v.componentName,
      bodyKeys: Object.keys(v.body || {}).sort()
    })));

    // Check if this visualization was already processed in current session
    const sessionKey = `${currentSessionRef.current}-${visualizationHash}`;
    if (processedVisualizationsRef.current.has(sessionKey)) {
      console.log(`🚫 Skipping duplicate visualization in session ${currentSessionRef.current}`);
      return;
    }

    // Mark as processed
    processedVisualizationsRef.current.add(sessionKey);

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

      const componentType = `${toolname}.${componentName}`;
      console.log(`🔄 Queuing component: ${componentType}`, body);

      const spawnPromise = spawnComponent(componentType, body || {})
        .then(result => {
          if (result) {
            console.log(`✅ Successfully spawned: ${componentType}`);
          } else {
            console.warn(`❌ Failed to spawn: ${componentType}`);
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
        setErrorWithAutoClear(`Failed to load any visualizations. Check console for details.`);
      }
    } catch (error) {
      console.error('Error during visualization spawning:', error);
      setErrorWithAutoClear('Error occurred while loading visualizations');
    } finally {
      setComponentSpawning(false);
      setSpawnProgress({ current: 0, total: 0, currentComponent: '' });
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    console.log(`🔊 Audio ${newMutedState ? 'muted' : 'unmuted'}`);
  };

  const handleUserQuery = async (query: string, dataPoints?: any[]) => {
    if (!query.trim()) return;

    // Cancel any ongoing requests first
    cancelOngoingRequests();

    // Clear previous selections and spawned components for new query
    setUserSelectedChartPoints([]);
    setSpawnedComponents(new Set());

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

                    // Update robot state with audio data - this will trigger the queue
                    setRobotState(prev => ({
                      ...prev,
                      state: 'speaking',
                      audioData: { url, blob, mimeType: jsonData.audio.mime_type }
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

              // Normalize visualization key and handle immediately
              if (jsonData.visualization_output && !jsonData.visualisation) {
                jsonData.visualisation = jsonData.visualization_output;
              }

              if (jsonData.visualisation) {
                console.log('📊 Spawning visualization:', jsonData.visualisation);
                setVisualisation(jsonData.visualisation);
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

      setErrorWithAutoClear(errorMsg);

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

  const toggleRobotVisibility = () => {
    setIsRobotVisible(!isRobotVisible);
  };

  return (
    <DashboardLayout
      title="Enterprise IQ"
      currentPath="/enterprise-iq"
    >
      <div className="h-[calc(100vh-160px)] overflow-hidden flex flex-col">
        {/* Main content area with soft pastel border */}
        <div className="flex-1 min-h-0 relative overflow-hidden border-2 border-accent-tertiary rounded-lg mx-2 mt-2 bg-white">
          {/* Conversational Canvas */}
          <ConversationalCanvas
            components={components}
            onChartInteraction={handleChartInteraction}
            onLaserMove={handleLaserMove}
            conversationHistory={conversations[activeConversationId || ''] || []}
          />

          {/* Robot Character - Fixed position */}
          {isRobotVisible && (
            <RobotCharacter
              isVisible={isRobotVisible}
              state={robotState.state}
              message={robotState.message}
              initialPosition={{ x: 50, y: 50 }}
              laserTarget={robotState.laserTarget}
            />
          )}

          {/* Audio Controls - Bottom left corner */}
          <div className="absolute bottom-4 left-4 flex gap-2 z-30">
            {/* Play Pending Audio Button */}
            {audioPlaybackFailed && pendingAudio && (
              <button
                onClick={playPendingAudio}
                className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-all"
                title="Click to play audio"
              >
                <Volume2 className="w-5 h-5 text-green-500" />
              </button>
            )}

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className="p-3 bg-accent/20 hover:bg-accent/30 rounded-lg transition-all"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-error" />
              ) : (
                <Volume2 className="w-5 h-5 text-accent" />
              )}
            </button>
          </div>

        </div>

        {/* Query Input - Fixed height bottom area, same width as canvas */}
        {showQueryInput && (
          <div className="h-20 px-2 py-2 flex items-center">
            <div className="w-full">
              <QueryInput
                onSubmit={handleUserQuery}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Show robot button if hidden */}
        {!isRobotVisible && (
          <button
            onClick={toggleRobotVisibility}
            className="fixed bottom-4 left-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white transition-all"
          >
            Show Assistant
          </button>
        )}

        {/* Show query input button if hidden */}
        {!showQueryInput && (
          <button
            onClick={() => setShowQueryInput(true)}
            className="fixed bottom-4 right-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white transition-all"
          >
            Ask Question
          </button>
        )}

        {/* Component spawning progress */}
        {componentSpawning && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-blue-600/90 text-white rounded-lg backdrop-blur-sm flex items-center gap-3">
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

        {/* Error display - Soft Pastel Theme */}
        {error && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 glass-card border-2 border-accent/30 bg-accent/10 backdrop-blur-md rounded-2xl shadow-lg z-[9999] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-foreground font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}