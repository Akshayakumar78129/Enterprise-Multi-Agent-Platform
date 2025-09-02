import React from 'react';
import { KpiTileRow } from './KpiTileRow';
import { SalesKpiData } from '../../types';

interface KpiTileRowWithInsightsProps {
  data: SalesKpiData;
  loading: boolean;
  onKpiClick: (data: any, type: string) => void;
}

export const KpiTileRowWithInsights: React.FC<KpiTileRowWithInsightsProps> = ({
  data,
  loading,
  onKpiClick
}) => {
  // Add click handlers for each KPI
  const handleKpiClick = (kpiType: string, kpiData: any) => {
    onKpiClick({
      ...kpiData,
      chartType: `kpi_${kpiType}`,
    }, `kpi_${kpiType}`);
  };

  // Wrap the existing KpiTileRow with enhanced functionality
  return (
    <div 
      style={{ 
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      <KpiTileRow data={data} loading={loading} />
      
      {/* Overlay click areas for each KPI tile */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          pointerEvents: 'none'
        }}
      >
        {/* Total Revenue Click Area */}
        <div
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleKpiClick('totalRevenue', data.totalRevenue)}
          title="Click for AI insights on Total Revenue"
        />
        
        {/* Average Order Value Click Area */}
        <div
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleKpiClick('averageOrderValue', data.averageOrderValue)}
          title="Click for AI insights on Average Order Value"
        />
        
        {/* Total Units Sold Click Area */}
        <div
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleKpiClick('totalUnitsSold', data.totalUnitsSold)}
          title="Click for AI insights on Total Units Sold"
        />
        
        {/* Top Performing Region Click Area */}
        <div
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleKpiClick('topPerformingRegion', data.topPerformingRegion)}
          title="Click for AI insights on Top Performing Region"
        />
        
        {/* Conversion Rate Click Area */}
        <div
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleKpiClick('conversionRate', data.conversionRate)}
          title="Click for AI insights on Conversion Rate"
        />
      </div>
      
      {/* AI Badge indicator */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 224, 255, 0.1)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          borderRadius: '12px',
          padding: '4px 8px',
          fontSize: '11px',
          color: '#00e0ff',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          pointerEvents: 'none'
        }}
      >
        <span>🤖</span>
        <span>AI-Powered</span>
      </div>
    </div>
  );
};