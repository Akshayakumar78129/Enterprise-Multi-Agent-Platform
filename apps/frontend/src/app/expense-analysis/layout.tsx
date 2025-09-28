import React from 'react';
import { ExpenseanalysisProvider } from './context';

export default function ExpenseanalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExpenseanalysisProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Expense Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Analyze costs and budget variance
          </p>
        </div>
        {children}
      </div>
    </ExpenseanalysisProvider>
  );
}