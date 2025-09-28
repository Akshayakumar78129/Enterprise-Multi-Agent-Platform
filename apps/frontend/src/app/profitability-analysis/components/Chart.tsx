import React from 'react';

export default function ProfitabilityanalysisChart({ data, loading }: any) {
  if (loading) return <div>Loading Chart...</div>;
  return <div>Chart Component</div>;
}