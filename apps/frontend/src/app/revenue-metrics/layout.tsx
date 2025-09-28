import React from 'react';
import { RevenuemetricsProvider } from './context';

export default function RevenuemetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RevenuemetricsProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Revenue Metrics</h1>
          <p className="text-muted-foreground mt-2">
            Track MRR, ARR, and growth rates
          </p>
        </div>
        {children}
      </div>
    </RevenuemetricsProvider>
  );
}