import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Low Risk', value: 400, fill: '#22c55e' },
  { name: 'Medium Risk', value: 300, fill: '#eab308' },
  { name: 'High Risk', value: 200, fill: '#f97316' },
  { name: 'Very High Risk', value: 100, fill: '#ef4444' },
];

export default function TestRecharts() {
  return (
    <div style={{ 
      width: '100%', 
      height: 400, 
      background: 'white', 
      padding: 20, 
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginBottom: 20, color: '#1e293b' }}>Test Recharts Component</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}