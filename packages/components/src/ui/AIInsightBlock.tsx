"use client";

import React, { useState } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface AIInsightBlockProps {
  title: string;
  breakdown?: string;
  insights?: string[];
  actionPlan?: string[];
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  revenue?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  timestamp?: string;
  visualizations?: React.ReactNode[];
  className?: string;
}

export const AIInsightBlock: React.FC<AIInsightBlockProps> = ({
  title,
  breakdown,
  insights = [],
  actionPlan = [],
  riskLevel,
  revenue,
  trend,
  timestamp,
  visualizations = [],
  className = ""
}) => {
  const [expanded, setExpanded] = useState(true);

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {title}
              {getTrendIcon()}
            </h3>

            {/* Risk and Revenue Badges */}
            <div className="flex items-center gap-2 mt-2">
              {riskLevel && (
                <Badge variant={getRiskColor()} className="flex items-center gap-1">
                  {getRiskIcon()}
                  <span className="capitalize">{riskLevel} Risk</span>
                </Badge>
              )}

              {revenue && (
                <Badge variant="default" suppressHydrationWarning>
                  Revenue Impact: ${revenue.toLocaleString('en-US')}
                </Badge>
              )}

              {timestamp && (
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {new Date(timestamp).toLocaleString('en-US')}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="ml-2"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Breakdown */}
          {breakdown && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Analysis Breakdown</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{breakdown}</p>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Key Insights</h4>
              <ul className="space-y-1">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Plan */}
          {actionPlan.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Recommended Actions</h4>
              <ul className="space-y-1">
                {actionPlan.map((action, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start">
                    <span className="text-primary mr-2">{index + 1}.</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Visualizations */}
          {visualizations.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Visualizations</h4>
              {visualizations.map((viz, index) => (
                <div key={index}>{viz}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gradient overlay for visual appeal */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            ${riskLevel === 'critical' ? 'rgba(239, 68, 68, 0.3)' :
              riskLevel === 'high' ? 'rgba(249, 115, 22, 0.3)' :
              riskLevel === 'medium' ? 'rgba(234, 179, 8, 0.3)' :
              'rgba(34, 197, 94, 0.3)'} 0%,
            transparent 100%)`
        }}
      />
    </Card>
  );
};