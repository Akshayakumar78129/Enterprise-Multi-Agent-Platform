"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  Share2,
  Maximize2,
  Lightbulb
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/Button";

export interface InsightData {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  insights?: string[];
  details?: Record<string, any>;
  source?: string;
}

export interface InsightCardProps {
  data: InsightData;
  position?: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  onDrillDown?: () => void;
  onExport?: () => void;
  className?: string;
}

export function InsightCard({
  data,
  position,
  isVisible,
  onClose,
  onDrillDown,
  onExport,
  className
}: InsightCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible && !isAnimating) return null;

  // Ensure card appears below header and stays within viewport
  const cardStyle = position
    ? {
        position: "fixed" as const,
        left: `${Math.min(Math.max(160, position.x), window.innerWidth - 160)}px`,
        top: `${Math.max(position.y + 20, 150)}px`, // Increased minimum top to avoid header
        transform: "translate(-50%, 0)",
        zIndex: 99999 // Even higher z-index
      }
    : {};

  return (
    <>
      {/* Backdrop overlay */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          style={{ zIndex: 99998 }}
          onClick={onClose}
        />
      )}

      {/* Insight Card */}
      <div
      className={cn(
        "w-80 bg-background rounded-lg shadow-2xl border",
        "transition-all duration-300",
        isVisible
          ? "animate-in fade-in slide-in-from-bottom-2"
          : "animate-out fade-out slide-out-to-bottom-2",
        className
      )}
      style={{ ...cardStyle, zIndex: 99999 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{data.title}</h3>
          {data.source && (
            <p className="text-xs text-muted-foreground mt-1">{data.source}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 -mt-1 -mr-1"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Value */}
      <div className="p-4">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold">{data.value}</span>
          {data.change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              data.change > 0 ? "text-success" : "text-destructive"
            )}>
              {data.change > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {Math.abs(data.change)}%
              </span>
              {data.changeLabel && (
                <span className="text-muted-foreground">
                  {data.changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {data.subtitle && (
          <p className="text-sm text-muted-foreground mt-2">
            {data.subtitle}
          </p>
        )}
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium">Key Insights</span>
          </div>
          <ul className="space-y-1">
            {data.insights.map((insight, index) => (
              <li
                key={index}
                className="text-xs text-muted-foreground leading-relaxed flex gap-2"
              >
                <span className="text-primary">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Details */}
      {data.details && Object.keys(data.details).length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {Object.entries(data.details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          {onDrillDown && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDrillDown}
              className="text-xs"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Drill Down
            </Button>
          )}
          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => {
            // Share functionality
            if (navigator.share) {
              navigator.share({
                title: data.title,
                text: `${data.title}: ${data.value}`
              });
            }
          }}
        >
          <Share2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
    </>
  );
}