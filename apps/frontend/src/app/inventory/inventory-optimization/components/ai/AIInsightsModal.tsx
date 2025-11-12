"use client";

import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdingCostInsights: string[];
  stockOptInsights: string[];
  loading?: boolean;
}

export function AIInsightsModal({
  isOpen,
  onClose,
  holdingCostInsights = [],
  stockOptInsights = [],
  loading = false
}: AIInsightsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'cost' | 'optimization'>('all');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const allInsights = [...holdingCostInsights, ...stockOptInsights];

  const getInsightsForTab = () => {
    switch (activeTab) {
      case 'cost':
        return holdingCostInsights;
      case 'optimization':
        return stockOptInsights;
      default:
        return allInsights;
    }
  };

  const getIconForInsight = (insight: string, index: number) => {
    if (insight.toLowerCase().includes('critical') || insight.toLowerCase().includes('warning')) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    } else if (insight.toLowerCase().includes('opportunity') || insight.toLowerCase().includes('savings')) {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    } else if (insight.toLowerCase().includes('action') || insight.toLowerCase().includes('implement')) {
      return <Target className="h-5 w-5 text-blue-500" />;
    }
    return <Lightbulb className="h-5 w-5 text-yellow-500" />;
  };

  const currentInsights = getInsightsForTab();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] m-4 bg-surface border border-border rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">AI-Powered Insights</h2>
              <p className="text-sm text-muted-foreground">Strategic recommendations for inventory optimization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 p-4 border-b border-border">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-accent text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All Insights ({allInsights.length})
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'cost'
                ? 'bg-accent text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Holding Cost ({holdingCostInsights.length})
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'optimization'
                ? 'bg-accent text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Optimization ({stockOptInsights.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          ) : currentInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No insights available</p>
              <p className="text-sm text-muted-foreground">Check back later for AI-generated recommendations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted/30 border border-border rounded-lg hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {getIconForInsight(insight, index)}
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {activeTab === 'all'
                            ? index < holdingCostInsights.length ? 'Holding Cost' : 'Optimization'
                            : activeTab === 'cost' ? 'Holding Cost' : 'Optimization'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Gemini 2.0 Flash</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
