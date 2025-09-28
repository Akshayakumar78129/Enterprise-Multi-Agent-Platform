import React from 'react';

export default function ExpenseanalysisKPIs({ metrics, loading }: any) {
  if (loading) return <div>Loading KPIs...</div>;
  return <div>KPIs Component</div>;
}