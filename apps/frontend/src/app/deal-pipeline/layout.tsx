import React from 'react';
import { DealpipelineProvider } from './context';

export default function DealpipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DealpipelineProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Deal Pipeline</h1>
          <p className="text-muted-foreground mt-2">
            Monitor deal stages and conversion rates
          </p>
        </div>
        {children}
      </div>
    </DealpipelineProvider>
  );
}