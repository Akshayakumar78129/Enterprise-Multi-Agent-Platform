import React from 'react';
import { PurchaseFrequencyProvider } from './context';

export default function PurchaseFrequencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PurchaseFrequencyProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Purchase Frequency Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze customer purchase patterns and frequency behaviors
          </p>
        </div>
        {children}
      </div>
    </PurchaseFrequencyProvider>
  );
}