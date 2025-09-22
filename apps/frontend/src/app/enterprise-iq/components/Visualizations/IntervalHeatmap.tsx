"use client";

import React from 'react';

interface IntervalHeatmapProps {
  data?: any;
  title?: string;
}

export default function IntervalHeatmap(props: IntervalHeatmapProps) {
  // Handle both direct props and data-wrapped props
  const actualData = props.data || props;
  const { title = "Activity Heatmap", days: propDays, hours: propHours, values: propValues } = actualData as any;

  // Process real data from backend
  const { days, hours, values } = (() => {
    // First check if days, hours, values are passed directly as props
    if (propDays && propHours && propValues) {
      console.log('IntervalHeatmap: Using direct days, hours, values props');
      return {
        days: propDays,
        hours: propHours,
        values: propValues
      };
    }

    // If actualData is properly structured with days, hours, and values
    if (actualData && actualData.days && actualData.hours && actualData.values) {
      console.log('IntervalHeatmap: Using actualData.days, actualData.hours, actualData.values');
      return {
        days: actualData.days,
        hours: actualData.hours,
        values: actualData.values
      };
    }

    // If actualData is a 2D array (rows = days, columns = hours)
    if (actualData && Array.isArray(actualData) && actualData.length > 0 && Array.isArray(actualData[0])) {
      return {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, actualData.length),
        hours: Array.from({ length: actualData[0].length }, (_, i) => i),
        values: actualData
      };
    }

    // If actualData is an object with day keys
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      const dayKeys = Object.keys(actualData).filter(k => k !== 'title' && k !== 'data');
      if (dayKeys.length > 0) {
        const firstDayData = actualData[dayKeys[0]];
        const hourCount = Array.isArray(firstDayData) ? firstDayData.length : 24;

        return {
          days: dayKeys,
          hours: Array.from({ length: hourCount }, (_, i) => i),
          values: dayKeys.map(day => {
            const dayData = actualData[day];
            return Array.isArray(dayData) ? dayData : Array(hourCount).fill(0);
          })
        };
      }
    }

    // No valid data - show empty state
    console.warn('IntervalHeatmap: No valid data provided', actualData);
    return {
      days: ['No Data'],
      hours: [0],
      values: [[0]]
    };
  })();

  // Calculate max value for intensity scaling
  const maxValue = Math.max(...values.flat(), 1);

  return (
    <div className="w-full h-full flex flex-col p-2">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      <div className="flex-1 overflow-auto">
        <div className="grid gap-1 text-xs" style={{ gridTemplateColumns: `auto repeat(${hours.length}, 1fr)` }}>
          <div></div>
          {hours.map(h => (
            <div key={h} className="text-center text-gray-500">
              {h}h
            </div>
          ))}
          {days.map((day, dayIndex) => (
            <React.Fragment key={day}>
              <div className="text-gray-500 pr-2">{day}</div>
              {hours.map((hour, hourIndex) => {
                const value = values[dayIndex]?.[hourIndex] ?? 0;
                const intensity = maxValue > 0 ? value / maxValue : 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: value > 0 ? `rgba(0, 224, 255, ${intensity})` : 'rgba(128, 128, 128, 0.1)',
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