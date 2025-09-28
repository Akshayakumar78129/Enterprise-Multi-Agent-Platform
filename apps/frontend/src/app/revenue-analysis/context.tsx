'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RevenueanalysisContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const RevenueanalysisContext = createContext<RevenueanalysisContextType | undefined>(undefined);

export function RevenueanalysisProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <RevenueanalysisContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </RevenueanalysisContext.Provider>
  );
}

export function useRevenueanalysisContext() {
  const context = useContext(RevenueanalysisContext);
  if (context === undefined) {
    throw new Error('useRevenueanalysisContext must be used within RevenueanalysisProvider');
  }
  return context;
}