import React from 'react';

export default function DealpipelineChart({ data, loading }: any) {
  if (loading) return <div>Loading Chart...</div>;
  return <div>Chart Component</div>;
}