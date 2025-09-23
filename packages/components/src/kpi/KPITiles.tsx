import React from "react";
import { KPIRow, KPIData } from "./KPIRow";

export interface KPITilesProps {
  data?: KPIData[] | { kpis?: KPIData[]; tiles?: KPIData[]; metrics?: KPIData[] };
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  animationDelay?: number;
  onKPIClick?: (kpi: KPIData, event: React.MouseEvent) => void;
  className?: string;
}

export const KPITiles: React.FC<KPITilesProps> = ({
  data,
  columns = 4,
  animationDelay = 100,
  onKPIClick,
  className = "",
}) => {
  // Handle different data structures
  let kpiData: KPIData[] = [];

  if (Array.isArray(data)) {
    // Ensure each item has an id
    kpiData = data.map((item, index) => ({
      ...item,
      id: item.id || `kpi-${index}`
    }));
  } else if (data && typeof data === 'object') {
    // Try different field names
    const rawData = data.kpis || data.tiles || data.metrics || [];
    // Ensure each item has an id
    kpiData = rawData.map((item: any, index: number) => ({
      ...item,
      id: item.id || `kpi-${index}`
    }));
  }

  // Handle empty data case
  if (!kpiData || kpiData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10l3-3m-3 3l-3-3m13 3V7m0 10l3-3m-3 3l-3-3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-4m-8 0H4" />
          </svg>
          <p className="text-sm">No KPI data available</p>
          <p className="text-xs mt-1">Metrics will appear when data is available</p>
        </div>
      </div>
    );
  }

  return (
    <KPIRow
      kpis={kpiData}
      columns={columns}
      animationDelay={animationDelay}
      onKPIClick={onKPIClick}
      className={className}
    />
  );
};