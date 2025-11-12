"use client";

import React from 'react';
import { AppLayout } from 'components/index';
import { InventoryOptimizationProvider } from './context';

export default function InventoryOptimizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <InventoryOptimizationProvider>
      <AppLayout
        title="Inventory Optimization"
        description="Comprehensive inventory optimization combining holding cost analysis and stock level recommendations"
      >
        {children}
      </AppLayout>
    </InventoryOptimizationProvider>
  );
}
