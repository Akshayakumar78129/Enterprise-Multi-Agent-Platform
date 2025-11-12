import React from 'react';

interface HeatmapData {
  day: string;
  hour: number;
  transactionCount: number;
  avgAmount?: number;
}

interface TemporalHeatmapProps {
  data: HeatmapData[];
  loading?: boolean;
  onCellClick?: (day: string, hour: number, event: React.MouseEvent) => void;
}

export const TemporalHeatmap: React.FC<TemporalHeatmapProps> = ({
  data = [],
  loading = false,
  onCellClick
}) => {
  if (loading) {
    return (
      <div className="h-96 animate-pulse">
        <div className="h-full bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Find max value for color scaling
  const maxCount = Math.max(...data.map(d => d.transactionCount || 0), 1);

  // Create a map for quick lookup
  const dataMap = new Map(
    data.map(d => [`${d.day}-${d.hour}`, d])
  );

  const getColor = (count: number) => {
    if (count === 0) return 'rgba(156, 163, 175, 0.1)';  // Gray for zero

    const intensity = count / maxCount;
    // Blue → Purple → Pink gradient for better visual distinction
    if (intensity < 0.2) return 'rgba(59, 130, 246, 0.4)';    // Blue
    if (intensity < 0.4) return 'rgba(96, 165, 250, 0.6)';    // Light blue
    if (intensity < 0.6) return 'rgba(139, 92, 246, 0.75)';   // Purple
    if (intensity < 0.8) return 'rgba(192, 132, 252, 0.85)';  // Light purple
    if (intensity < 0.95) return 'rgba(236, 72, 153, 0.9)';   // Pink
    return 'rgba(219, 39, 119, 1)';                            // Deep pink
  };

  return (
    <div className="overflow-x-auto min-h-[400px] flex items-center">
      <div className="min-w-[600px] w-full">
          {/* Hour labels on top */}
          <div className="flex mb-2">
            <div className="w-24"></div>
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map(day => (
            <div key={day} className="flex mb-1">
              {/* Day label */}
              <div className="w-24 pr-2 text-sm font-medium text-muted-foreground flex items-center justify-end">
                {day.slice(0, 3)}
              </div>

              {/* Hour cells */}
              {hours.map(hour => {
                const cellData = dataMap.get(`${day}-${hour}`);
                const count = cellData?.transactionCount || 0;
                const avgAmount = cellData?.avgAmount;

                return (
                  <div
                    key={`${day}-${hour}`}
                    className="flex-1 aspect-square mx-0.5 rounded-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    style={{
                      backgroundColor: getColor(count),
                      minHeight: '20px'
                    }}
                    onClick={(e) => onCellClick?.(day, hour, e)}
                    title={`${day} ${hour}:00 - ${count} transactions${avgAmount ? `, Avg: $${avgAmount.toFixed(2)}` : ''}`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend - Match actual gradient */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex gap-1">
              <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }} />
              <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'rgba(96, 165, 250, 0.6)' }} />
              <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'rgba(139, 92, 246, 0.75)' }} />
              <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'rgba(192, 132, 252, 0.85)' }} />
              <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'rgba(236, 72, 153, 0.9)' }} />
              <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'rgba(219, 39, 119, 1)' }} />
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
      </div>
    </div>
  );
};