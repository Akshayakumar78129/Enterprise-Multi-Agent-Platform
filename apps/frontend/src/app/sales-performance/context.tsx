"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

interface SalesPerformanceContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

const SalesPerformanceContext = createContext<SalesPerformanceContextType | undefined>(undefined);

export function SalesPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ filters, setFilters }), [filters]);

  return (
    <SalesPerformanceContext.Provider value={value}>
      {children}
    </SalesPerformanceContext.Provider>
  );
}

export function useSalesPerformanceContext() {
  const context = useContext(SalesPerformanceContext);
  if (context === undefined) {
    throw new Error('useSalesPerformanceContext must be used within a SalesPerformanceProvider');
  }
  return context;
}