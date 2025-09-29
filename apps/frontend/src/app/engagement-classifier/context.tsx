"use client";

import React, { createContext, useContext, useState } from 'react';

interface EngagementFilters {
  startDate?: string;
  endDate?: string;
  engagementLevels?: string[];
  loyaltyStatus?: string[];
  minTransactions?: number;
  minLTVAmount?: number;
  rfmScoreMin?: number;
  rfmScoreMax?: number;
}

interface EngagementClassifierContextType {
  filters: EngagementFilters;
  setFilters: (filters: EngagementFilters) => void;
  engagementData: any[];
  setEngagementData: (data: any[]) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isBIModalOpen: boolean;
  setIsBIModalOpen: (open: boolean) => void;
  selectedPoints: any[];
  selectionManager: {
    addPoint: (point: any) => void;
    removePoint: (point: any) => void;
    clearAll: () => void;
    hasPoint: (point: any) => boolean;
  };
  timeRange: string;
}

const EngagementClassifierContext = createContext<EngagementClassifierContextType | undefined>(undefined);

export function EngagementClassifierProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<EngagementFilters>({});
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);

  const timeRange = filters.startDate && filters.endDate
    ? `${filters.startDate} to ${filters.endDate}`
    : "All time";

  const selectionManager = {
    addPoint: (point: any) => {
      setSelectedPoints(prev => {
        if (!prev.find(p => p.id === point.id)) {
          return [...prev, point];
        }
        return prev;
      });
    },
    removePoint: (point: any) => {
      setSelectedPoints(prev => prev.filter(p => p.id !== point.id));
    },
    clearAll: () => {
      setSelectedPoints([]);
    },
    hasPoint: (point: any) => {
      return selectedPoints.some(p => p.id === point.id);
    }
  };

  return (
    <EngagementClassifierContext.Provider
      value={{
        filters,
        setFilters,
        engagementData,
        setEngagementData,
        isChatOpen,
        setIsChatOpen,
        isBIModalOpen,
        setIsBIModalOpen,
        selectedPoints,
        selectionManager,
        timeRange,
      }}
    >
      {children}
    </EngagementClassifierContext.Provider>
  );
}

export function useEngagementClassifierContext() {
  const context = useContext(EngagementClassifierContext);
  if (context === undefined) {
    throw new Error('useEngagementClassifierContext must be used within a EngagementClassifierProvider');
  }
  return context;
}