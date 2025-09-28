"use client";

import React, { createContext, useContext, useState } from 'react';

interface RetentionPlannerContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  retentionData: any[];
  setRetentionData: (data: any[]) => void;
}

const RetentionPlannerContext = createContext<RetentionPlannerContextType | undefined>(undefined);

export function RetentionPlannerProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [retentionData, setRetentionData] = useState<any[]>([]);

  return (
    <RetentionPlannerContext.Provider
      value={{
        filters,
        setFilters,
        retentionData,
        setRetentionData,
      }}
    >
      {children}
    </RetentionPlannerContext.Provider>
  );
}

export function useRetentionPlannerContext() {
  const context = useContext(RetentionPlannerContext);
  if (context === undefined) {
    throw new Error('useRetentionPlannerContext must be used within a RetentionPlannerProvider');
  }
  return context;
}