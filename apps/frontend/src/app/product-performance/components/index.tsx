import React from 'react';
import { AnimatedKPITile } from 'components/index';
import { DollarSign, Package, TrendingUp, Percent, Tag, ShoppingCart } from 'lucide-react';

export function ProductKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const kpis = [
    {
      title: 'Total Sales',
      value: metrics?.totalRevenue ? `$${(metrics.totalRevenue / 1000000).toFixed(1)}M` : '$0',
      subtitle: 'All products',
      icon: DollarSign,
      trend: metrics?.revenueGrowth || 0,
      color: '#8b5cf6' as const
    },
    {
      title: 'Total Units',
      value: metrics?.totalUnits?.toLocaleString() || '0',
      subtitle: 'Units sold',
      icon: ShoppingCart,
      color: '#10b981' as const
    },
    {
      title: 'Avg Price',
      value: metrics?.avgPrice ? `$${metrics.avgPrice.toFixed(2)}` : '$0',
      subtitle: 'Per unit',
      icon: Tag,
      color: '#f59e0b' as const
    },
    {
      title: 'Avg Margin',
      value: metrics?.avgMargin ? `${metrics.avgMargin.toFixed(1)}%` : '0%',
      subtitle: 'Profit margin',
      icon: Percent,
      color: '#ef4444' as const
    },
    {
      title: 'Top Category',
      value: metrics?.topCategory?.name || 'N/A',
      subtitle: metrics?.topCategory?.revenue ? `$${(metrics.topCategory.revenue / 1000).toFixed(0)}k` : 'Revenue',
      icon: TrendingUp,
      color: '#3b82f6' as const
    },
    {
      title: 'Total Products',
      value: metrics?.totalProducts?.toLocaleString() || '0',
      subtitle: 'In catalog',
      icon: Package,
      color: '#ec4899' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, index) => (
        <AnimatedKPITile key={index} {...kpi} loading={loading} />
      ))}
    </div>
  );
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