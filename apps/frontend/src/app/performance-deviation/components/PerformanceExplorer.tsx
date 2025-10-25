import React from 'react';
import {
  LineChart,
  Skeleton
} from 'components';
import { CustomTooltip } from './CustomTooltip';

interface PerformanceExplorerProps {
  data: any;
  selectedKPI: string;
  onKPISelect: (kpi: string) => void;
  loading?: boolean;
}

export function PerformanceExplorer({
  data,
  selectedKPI,
  onKPISelect,
  loading
}: PerformanceExplorerProps) {
  // Use local state for tooltip instead of the hook
  const [localTooltipData, setLocalTooltipData] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    title?: string;
    items: any[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    items: []
  });

  const showTooltip = (x: number, y: number, title: string, items: any[]) => {
    console.log('showTooltip called, setting visible to true');
    setLocalTooltipData({ visible: true, x, y, title, items });
  };

  const hideTooltip = () => {
    console.log('hideTooltip called, setting visible to false');
    setLocalTooltipData(prev => ({ ...prev, visible: false }));
  };

  // Get available KPIs with fallback to default options
  const availableKPIs = Object.keys(data || {}).length > 0
    ? Object.keys(data)
    : ['daily_revenue', 'daily_orders', 'avg_order_value'];
  const currentData = data?.[selectedKPI] || [];

  // Transform data for LineChart - MUST be called before any conditional returns
  const chartData = React.useMemo(() => {
    if (!currentData.length) return { labels: [], datasets: [] };

    return {
      labels: currentData.map((d: any) => d.date),
      datasets: [
        {
          label: 'Actual',
          data: currentData.map((d: any) => d.actual),
          borderColor: 'rgb(0, 224, 255)',
          backgroundColor: 'rgba(0, 224, 255, 0.1)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Predicted',
          data: currentData.map((d: any) => d.predicted),
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false
        },
        {
          label: 'Deviation',
          data: currentData.map((d: any) => d.deviation),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          type: 'bar' as any
        }
      ]
    };
  }, [currentData]);

  const chartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        enabled: false, // We'll use custom tooltip
        external: (context: any) => {
          console.log('Tooltip external called:', context);
          const { chart, tooltip } = context;
          if (!tooltip || tooltip.opacity === 0) {
            console.log('Hiding tooltip');
            hideTooltip();
            return;
          }

          const position = chart.canvas.getBoundingClientRect();
          const x = position.left + window.pageXOffset + tooltip.caretX;
          const y = position.top + window.pageYOffset + tooltip.caretY;

          // Extract data from dataPoints
          const items = tooltip.dataPoints?.map((point: any) => ({
            label: point.dataset.label || '',
            value: typeof point.raw === 'number' ? point.raw.toFixed(2) : point.raw,
            color: point.dataset.borderColor || point.dataset.backgroundColor || 'rgb(0, 224, 255)'
          })) || [];

          console.log('Showing tooltip with:', { x, y, title: tooltip.title?.[0], items });
          showTooltip(x, y, tooltip.title?.[0] || '', items);
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Value'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        border: {
          display: false
        }
      }
    }
  }), [showTooltip, hideTooltip]);

  // Log state changes - AFTER all hooks
  React.useEffect(() => {
    console.log('localTooltipData updated:', localTooltipData);
  }, [localTooltipData]);

  // Loading state - AFTER all hooks
  if (loading) {
    return <Skeleton className="h-96" />;
  }


  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Performance Explorer</h3>
        <select
          value={selectedKPI}
          onChange={(e) => onKPISelect(e.target.value)}
          className="px-3 py-1.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {availableKPIs.map(kpi => (
            <option key={kpi} value={kpi}>
              {kpi.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
      <div className="h-96">
        <LineChart
          data={chartData}
          options={chartOptions}
          height={350}
        />
      </div>

      {/* Custom Tooltip */}
      <CustomTooltip
        x={localTooltipData.x}
        y={localTooltipData.y}
        title={localTooltipData.title}
        items={localTooltipData.items}
        visible={localTooltipData.visible}
      />
    </div>
  );
}