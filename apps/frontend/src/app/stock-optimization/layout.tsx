import React from 'react';
import { StockoptimizationProvider } from './context';

export default function StockoptimizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StockoptimizationProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Stock Optimization</h1>
          <p className="text-muted-foreground mt-2">
            Optimize reorder points and safety stock
          </p>
        </div>
        {children}
      </div>
    </StockoptimizationProvider>
  );
}