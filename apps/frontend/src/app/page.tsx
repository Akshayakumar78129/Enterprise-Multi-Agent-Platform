"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { DashboardLayout } from 'components/index';
import ConversationalCanvas from './components/Canvas/ConversationalCanvas';
import ChatInterface from './components/AI/ChatInterface';
import { RobotCharacter } from './components/AI/RobotCharacter';
import { QueryInput } from './components/QueryInput';
import { AIResponseDashboard } from './components/AIResponseDashboard';
// Navigation is provided by DashboardLayout; avoid duplicating local navigation
import { createConversation } from '@/store/slices/conversationSlice';

interface RobotState {
  state: 'idle' | 'thinking' | 'speaking' | 'pointing' | 'error';
  message: string | null;
  audioData?: any;
  position?: { x: number; y: number };
  laserTarget?: { x: number; y: number } | null;
}

interface Session {
  session_id: string;
  user_id: string;
  app_name: string;
}

export default function HomePage() {
  const dispatch = useDispatch();
  const [sessionId] = useState(uuidv4());
  const [session] = useState<Session>({
    session_id: sessionId,
    user_id: 'frontend-user',
    app_name: 'conversational_canvas'
  });
  
  // Robot state management
  const [robotState, setRobotState] = useState<RobotState>({
    state: 'idle',
    message: 'Hello! I\'m your AI assistant. Ask me anything about your business data.',
    position: { x: 50, y: 100 },
    laserTarget: null
  });
  
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [userSelectedChartPoints, setUserSelectedChartPoints] = useState<any[]>([]);
  const [showQueryInput, setShowQueryInput] = useState(true);
  const [isRobotVisible, setIsRobotVisible] = useState(true);
  // Navigation handled by DashboardLayout; no local nav state

  useEffect(() => {
    // Create initial conversation
    dispatch(createConversation(sessionId));
  }, [dispatch, sessionId]);

  // Handle user queries
  const handleQuerySubmit = async (query: string) => {
    if (!query.trim()) return;

    setRobotState({
      ...robotState,
      state: 'thinking',
      message: `Processing: "${query}"`,
    });
    setLoading(true);
    setResponses([]); // Clear previous responses

    try {
      // Clear user selections when AI starts processing a new general query
      setUserSelectedChartPoints([]);
      
      const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8000';
      console.log('Using backend AI URL:', backendAiUrl);
      
      const response = await fetch(`${backendAiUrl}/run_sse`, {
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
      let responseText = '';
      let hasVisualizations = false;

      try {
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
                console.log('🟢 Received data:', jsonData);
                
                // Handle text responses
                if (jsonData.text) {
                  responseText += jsonData.text;
                  setRobotState(prev => ({
                    ...prev,
                    state: 'speaking',
                    message: responseText
                  }));
                }

                // Handle visualizations
                if (jsonData.visualisation || jsonData.visualization_output) {
                  hasVisualizations = true;
                  setResponses(prev => [...prev, jsonData]);
                  
                  // TODO: Spawn components based on visualization data
                  console.log('Visualization data:', jsonData.visualisation || jsonData.visualization_output);
                }

                // Handle audio
                if (jsonData.audio) {
                  console.log('Audio data received:', jsonData.audio);
                  // TODO: Play audio
                }
                
              } catch (e) {
                console.warn('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Final robot state
      if (responseText || hasVisualizations) {
        setRobotState({
          ...robotState,
          state: 'speaking',
          message: responseText || 'I\'ve processed your query and displayed the results.',
        });
      } else {
        setRobotState({
          ...robotState,
          state: 'speaking',
          message: 'I couldn\'t find specific information for your query. Try asking about sales performance, customer behavior, or inventory levels.',
        });
      }
      
    } catch (error) {
      console.error('Error in handleQuerySubmit:', error);
      
      let errorMessage = 'Sorry, there was an error processing your request.';
      
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          errorMessage = `Cannot connect to the AI backend service. Please ensure the service is running on port 8000.`;
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setRobotState({
        ...robotState,
        state: 'error',
        message: errorMessage,
      });
      
      setResponses([{
        text: errorMessage,
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRobotQuerySubmit = (query: string, selectedPoints: any[]) => {
    console.log('Query from Robot:', query);
    console.log('Context from Robot:', selectedPoints);
    setUserSelectedChartPoints([]);
    handleQuerySubmit(query);
  };

  return (
    <DashboardLayout
      title="AI-Powered Business Intelligence"
      description="Ask questions about your business data and get instant insights"
      currentPath="/"
      showNavigation={true}
    >
      <div className="relative w-full h-screen bg-background">
        {/* Main Canvas Area */}
        <div className="relative w-full h-full">
          {/* Robot Character */}
          <RobotCharacter
            isVisible={isRobotVisible}
            state={robotState.state}
            message={robotState.message}
            laserTarget={robotState.laserTarget}
            onQuerySubmit={handleRobotQuerySubmit}
            userSelectedPoints={userSelectedChartPoints}
          />

          {/* Conversational Canvas for spawned components */}
          <ConversationalCanvas sessionId={sessionId} />

          {/* Main Query Input */}
          {showQueryInput && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-8 z-50">
              <QueryInput
                onSubmit={handleQuerySubmit}
                placeholder="Ask about customer insights, sales trends, inventory levels, churn prediction..."
                disabled={loading}
              />
            </div>
          )}

          {/* AI Response Dashboard - Show when we have responses */}
          {responses.length > 0 && (
            <div className="absolute top-20 right-4 w-96 max-h-[calc(100vh-160px)] overflow-y-auto z-40">
              <AIResponseDashboard
                responses={responses}
                loading={loading}
                error={null}
                className="bg-surface/95 backdrop-blur-sm rounded-lg shadow-lg p-4"
              />
            </div>
          )}

          {/* Robot visibility toggle removed on landing */}
        </div>

        {/* Chat Interface removed on landing page */}
      </div>
    </DashboardLayout>
  );
}