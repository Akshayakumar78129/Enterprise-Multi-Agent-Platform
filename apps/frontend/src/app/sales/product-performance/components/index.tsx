import React, { useMemo } from 'react';
import { KPIRow, Skeleton, MetricsRow, getShiftClickManager } from 'components/index';

export function ProductKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    if (!metrics) {
      return [
        {
          id: "total-revenue",
          title: "Total Revenue",
          value: 0,
          format: "currency" as const,
          color: "#8b5cf6",
        },
        {
          id: "total-units",
          title: "Total Units",
          value: 0,
          format: "number" as const,
          color: "#10b981",
        },
        {
          id: "avg-price",
          title: "Avg Price",
          value: 0,
          format: "currency" as const,
          color: "#f59e0b",
        },
        {
          id: "avg-margin",
          title: "Avg Margin",
          value: 0,
          format: "percentage" as const,
          color: "#ef4444",
        },
        {
          id: "top-category",
          title: "Top Category",
          value: "N/A",
          format: "text" as const,
          color: "#3b82f6",
        },
        {
          id: "total-products",
          title: "Total Products",
          value: 0,
          format: "number" as const,
          color: "#ec4899",
        },
      ];
    }

    return [
      {
        id: "total-revenue",
        title: "Total Revenue",
        value: metrics.totalRevenue || 0,
        format: "currency" as const,
        color: "#8b5cf6",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Revenue",
            value: `$${(metrics.totalRevenue || 0).toLocaleString()}`,
            source: "Product Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "total-units",
        title: "Total Units",
        value: metrics.totalUnits || 0,
        format: "number" as const,
        color: "#10b981",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Units",
            value: `${(metrics.totalUnits || 0).toLocaleString()} units`,
            source: "Product Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "avg-price",
        title: "Avg Price",
        value: metrics.avgPrice || 0,
        format: "currency" as const,
        color: "#f59e0b",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Avg Price",
            value: `$${(metrics.avgPrice || 0).toFixed(2)}`,
            source: "Product Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "avg-margin",
        title: "Avg Margin",
        value: metrics.avgMargin || 0,
        format: "percentage" as const,
        color: "#ef4444",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Avg Margin",
            value: `${(metrics.avgMargin || 0).toFixed(1)}%`,
            source: "Product Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "top-category",
        title: "Top Category",
        value: metrics.topCategory?.name || "N/A",
        format: "text" as const,
        color: "#3b82f6",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Top Category",
            value: `${metrics.topCategory?.name || 'N/A'} ($${((metrics.topCategory?.revenue || 0) / 1000).toFixed(0)}K)`,
            source: "Product Performance - KPIs"
          }, event.nativeEvent);
        }
      },
      {
        id: "total-products",
        title: "Total Products",
        value: metrics.totalProducts || 0,
        format: "number" as const,
        color: "#ec4899",
        onShiftClick: (event: React.MouseEvent) => {
          shiftClickManager.addPoint({
            label: "Total Products",
            value: `${(metrics.totalProducts || 0).toLocaleString()} products`,
            source: "Product Performance - KPIs"
          }, event.nativeEvent);
        }
      },
    ];
  }, [metrics, shiftClickManager]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return <KPIRow kpis={kpis} columns={6} animationDelay={50} />;
}

export function ProductOverview({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Product Overview</CardTitle></CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Product overview metrics would go here</div>
      </CardContent>
    </Card>
  );
}

export function TopProducts({ data, loading }: { data: any[]; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Top products list would go here</div>
      </CardContent>
    </Card>
  );
}

export function CategoryAnalysis({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Category Analysis</CardTitle></CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Category analysis would go here</div>
      </CardContent>
    </Card>
  );
}

export function InventoryStatus({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Inventory Status</CardTitle></CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Inventory status would go here</div>
      </CardContent>
    </Card>
  );
}

export function ProductTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  return (
    <Card>
      <CardHeader><CardTitle>Product Trends</CardTitle></CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Product trends visualization would go here</div>
      </CardContent>
    </Card>
  );
}

// Export filters
export { ProductFilters } from './ProductFilters';

// Export visualization components
export {
  ProductPerformanceOverview,
  TopProductsTable,
  CategoryPerformanceChart,
  MarginAnalysisScatter,
  PriceBandDistribution,
  ProductTrendsTimeSeries
} from './visualizations';