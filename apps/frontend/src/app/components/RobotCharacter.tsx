"use client";

import React, { useEffect, useState } from 'react';
import { Bot, Zap, Brain, Sparkles } from 'lucide-react';

export interface RobotState {
  state: 'idle' | 'thinking' | 'responding' | 'error';
  message?: string;
}

interface RobotCharacterProps {
  state: RobotState;
  className?: string;
}

export function RobotCharacter({ state, className = "" }: RobotCharacterProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (state.state === 'thinking' || state.state === 'responding') {
      setPulseAnimation(true);
    } else {
      setPulseAnimation(false);
    }
  }, [state.state]);

  const getStateIcon = () => {
    switch (state.state) {
      case 'thinking':
        return <Brain className="w-6 h-6 animate-pulse" />;
      case 'responding':
        return <Sparkles className="w-6 h-6 animate-spin" />;
      case 'error':
        return <Zap className="w-6 h-6 text-red-500" />;
      default:
        return <Bot className="w-6 h-6" />;
    }
  };

  const getStateColor = () => {
    switch (state.state) {
      case 'thinking':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-600';
      case 'responding':
        return 'bg-green-500/10 border-green-500/50 text-green-600';
      case 'error':
        return 'bg-red-500/10 border-red-500/50 text-red-600';
      default:
        return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        className={`
          relative flex items-center justify-center
          w-16 h-16 rounded-full border-2 transition-all duration-300
          ${getStateColor()}
          ${pulseAnimation ? 'animate-pulse' : ''}
        `}
      >
        {getStateIcon()}

        {/* Animated rings for active states */}
        {(state.state === 'thinking' || state.state === 'responding') && (
          <>
            <div className="absolute inset-0 rounded-full border border-current opacity-20 animate-ping" />
            <div
              className="absolute inset-0 rounded-full border border-current opacity-10 animate-ping"
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}
      </div>

      {/* Status message */}
      {state.message && (
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {state.message}
          </p>
          {state.state === 'thinking' && (
            <p className="text-xs text-muted-foreground mt-1">
              Analyzing your request...
            </p>
          )}
          {state.state === 'responding' && (
            <p className="text-xs text-muted-foreground mt-1">
              Generating insights...
            </p>
          )}
        </div>
      )}
    </div>
  );
}