'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExpenseanalysisContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const ExpenseanalysisContext = createContext<ExpenseanalysisContextType | undefined>(undefined);

export function ExpenseanalysisProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <ExpenseanalysisContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </ExpenseanalysisContext.Provider>
  );
}

export function useExpenseanalysisContext() {
  const context = useContext(ExpenseanalysisContext);
  if (context === undefined) {
    throw new Error('useExpenseanalysisContext must be used within ExpenseanalysisProvider');
  }
  return context;
}