"use client";

import React from 'react';
import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

interface AIResponse {
  text: string;
  visualisation?: any;
  audio?: {
    mime_type: string;
    data: string;
  };
}

interface AIResponseDashboardProps {
  responses: AIResponse[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function AIResponseDashboard({
  responses,
  loading = false,
  error = null,
  className = ""
}: AIResponseDashboardProps) {
  // Parse and render visualization if it's a component reference
  const renderVisualization = (viz: any) => {
    if (!viz) return null;

    // If it's already a React element, render it
    if (React.isValidElement(viz)) {
      return viz;
    }

    // If it's a string with component info, parse it
    if (typeof viz === 'string') {
      try {
        const parsed = JSON.parse(viz);
        return (
          <div className="p-4 bg-background rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Visualization: {parsed.type || 'Chart'}
            </p>
            {parsed.data && (
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(parsed.data, null, 2)}
              </pre>
            )}
          </div>
        );
      } catch {
        return (
          <div className="p-4 bg-background rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">{viz}</p>
          </div>
        );
      }
    }

    // If it's an object with component data
    if (typeof viz === 'object') {
      return (
        <div className="p-4 bg-background rounded-lg border border-border">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(viz, null, 2)}
          </pre>
        </div>
      );
    }

    return null;
  };

  const renderResponse = (response: AIResponse, index: number) => {
    const hasAudio = response.audio && response.audio.data;

    return (
      <div
        key={index}
        className="p-6 bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Response Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Info className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">AI Response</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generated insight #{index + 1}
            </p>
          </div>
        </div>

        {/* Response Text */}
        {response.text && (
          <div className="prose prose-sm max-w-none text-foreground">
            <div
              dangerouslySetInnerHTML={{
                __html: response.text.replace(/\n/g, '<br />')
              }}
            />
          </div>
        )}

        {/* Visualization */}
        {response.visualisation && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Visualization
            </h4>
            {renderVisualization(response.visualisation)}
          </div>
        )}

        {/* Audio Player */}
        {hasAudio && (
          <div className="mt-4 p-3 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Audio Response</p>
            <audio
              controls
              className="w-full"
              src={`data:${response.audio!.mime_type};base64,${response.audio!.data}`}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 ${className}`}>
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && responses.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="text-muted-foreground">Processing your request...</p>
        </div>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Responses Yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Ask a question to get started with AI-powered insights
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {responses.map((response, index) => renderResponse(response, index))}

      {loading && (
        <div className="p-4 bg-surface rounded-xl border border-border animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
            <div className="h-3 bg-muted rounded w-4/6"></div>
          </div>
        </div>
      )}
    </div>
  );
}