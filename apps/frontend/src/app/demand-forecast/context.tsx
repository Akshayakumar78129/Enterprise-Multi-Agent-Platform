'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemandforecastContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const DemandforecastContext = createContext<DemandforecastContextType | undefined>(undefined);

export function DemandforecastProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <DemandforecastContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </DemandforecastContext.Provider>
  );
}

export function useDemandforecastContext() {
  const context = useContext(DemandforecastContext);
  if (context === undefined) {
    throw new Error('useDemandforecastContext must be used within DemandforecastProvider');
  }
  return context;
}