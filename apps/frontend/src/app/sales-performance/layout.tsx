import React from 'react';
import { SalesPerformanceProvider } from './context';

export default function SalesPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalesPerformanceProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Sales Performance</h1>
          <p className="text-muted-foreground mt-2">
            Track sales metrics and team performance
          </p>
        </div>
        {children}
      </div>
    </SalesPerformanceProvider>
  );
}