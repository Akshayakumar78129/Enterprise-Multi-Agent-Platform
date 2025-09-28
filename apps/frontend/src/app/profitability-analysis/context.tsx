'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfitabilityanalysisContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const ProfitabilityanalysisContext = createContext<ProfitabilityanalysisContextType | undefined>(undefined);

export function ProfitabilityanalysisProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <ProfitabilityanalysisContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </ProfitabilityanalysisContext.Provider>
  );
}

export function useProfitabilityanalysisContext() {
  const context = useContext(ProfitabilityanalysisContext);
  if (context === undefined) {
    throw new Error('useProfitabilityanalysisContext must be used within ProfitabilityanalysisProvider');
  }
  return context;
}