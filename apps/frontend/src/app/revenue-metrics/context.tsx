'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RevenuemetricsContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const RevenuemetricsContext = createContext<RevenuemetricsContextType | undefined>(undefined);

export function RevenuemetricsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <RevenuemetricsContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </RevenuemetricsContext.Provider>
  );
}

export function useRevenuemetricsContext() {
  const context = useContext(RevenuemetricsContext);
  if (context === undefined) {
    throw new Error('useRevenuemetricsContext must be used within RevenuemetricsProvider');
  }
  return context;
}