"use client";

import React, { createContext, useContext, useState } from 'react';

interface EngagementClassifierContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  engagementData: any[];
  setEngagementData: (data: any[]) => void;
}

const EngagementClassifierContext = createContext<EngagementClassifierContextType | undefined>(undefined);

export function EngagementClassifierProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [engagementData, setEngagementData] = useState<any[]>([]);

  return (
    <EngagementClassifierContext.Provider
      value={{
        filters,
        setFilters,
        engagementData,
        setEngagementData,
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