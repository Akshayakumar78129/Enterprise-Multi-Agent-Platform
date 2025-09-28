'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DealpipelineContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const DealpipelineContext = createContext<DealpipelineContextType | undefined>(undefined);

export function DealpipelineProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <DealpipelineContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </DealpipelineContext.Provider>
  );
}

export function useDealpipelineContext() {
  const context = useContext(DealpipelineContext);
  if (context === undefined) {
    throw new Error('useDealpipelineContext must be used within DealpipelineProvider');
  }
  return context;
}