"use client";

import React from 'react';

interface IntervalHeatmapProps {
  data?: any;
  title?: string;
}

export default function IntervalHeatmap({ data, title = "Activity Heatmap" }: IntervalHeatmapProps) {
  // Generate sample heatmap data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const generateValue = () => Math.floor(Math.random() * 100);
  
  return (
    <div className="w-full h-full flex flex-col p-2">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-25 gap-1 text-xs">
          <div></div>
          {hours.map(h => (
            <div key={h} className="text-center text-gray-500">
              {h}h
            </div>
          ))}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="text-gray-500 pr-2">{day}</div>
              {hours.map(hour => {
                const value = generateValue();
                const intensity = value / 100;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: `rgba(0, 224, 255, ${intensity})`,
                    }}
                    title={`${day} ${hour}:00 - ${value}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}