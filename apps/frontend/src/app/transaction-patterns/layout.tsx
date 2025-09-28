import React from 'react';
import { TransactionPatternsProvider } from './context';

export default function TransactionPatternsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransactionPatternsProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Transaction Pattern Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze transaction patterns and detect anomalies
          </p>
        </div>
        {children}
      </div>
    </TransactionPatternsProvider>
  );
}