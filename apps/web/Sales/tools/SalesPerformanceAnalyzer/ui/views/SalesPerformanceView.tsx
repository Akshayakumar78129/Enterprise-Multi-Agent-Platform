import { type FC, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../pages/index.page';
import { Card } from '../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../ui-common/design-system/theme';
import { Grid, GridItem } from '../../../../../ui-common/design-system/components/Grid';
import { KpiTileRow } from '../components/kpi/KpiTileRow';
import { PerformanceOverview } from '../components/visualizations/PerformanceOverview';
import { TimeSeriesExplorer } from '../components/visualizations/TimeSeriesExplorer';
import { PerformanceDistributionAnalyzer } from '../components/visualizations/PerformanceDistributionAnalyzer';
import { ComparativePerformanceGrid } from '../components/visualizations/ComparativePerformanceGrid';
import { PerformanceCorrelationMatrix } from '../components/visualizations/PerformanceCorrelationMatrix';
import { PerformanceDriverAnalysis } from '../components/visualizations/PerformanceDriverAnalysis';
import { FilterControls } from '../components/controls/FilterControls';
import {
  fetchSalesPerformance,
  setDateRange,
  setSelectedDimension,
  setSelectedMetric,
  resetFilters,
} from '../state/salesPerformanceSlice';
import { SalesKpiData, SalesPerformanceState, DimensionOption, MetricOption, SalesData } from '../types';

const AVAILABLE_DIMENSIONS: DimensionOption[] = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'channel', label: 'Channel' },
  { value: 'region', label: 'Region' },
  { value: 'customer', label: 'Customer' },
  { value: 'time', label: 'Time' },
];

const AVAILABLE_METRICS: MetricOption[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'units_sold', label: 'Units Sold' },
  { value: 'averageOrderValue', label: 'Avg. Order Value' },
  { value: 'grossMargin', label: 'Profit Margin' },
];

export const SalesPerformanceView: FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const {
    loading,
    error,
    dateRange,
    selectedDimension,
    selectedMetric,
    analysisResult,
  } = useSelector((state: { salesPerformance: SalesPerformanceState }) => state.salesPerformance);

  const [overviewChartType, setOverviewChartType] = useState<'bar' | 'line' | 'area'>('bar');

  useEffect(() => {
    dispatch(fetchSalesPerformance());
  }, [dispatch, dateRange, selectedDimension, selectedMetric]);

  const handleDateRangeChange = (newDateRange: { startDate: string; endDate: string }) => {
    dispatch(setDateRange(newDateRange));
  };

  const handleDimensionChange = (dimension: string) => {
    dispatch(setSelectedDimension(dimension));
  };

  const handleMetricChange = (metric: string) => {
    dispatch(setSelectedMetric(metric));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  const kpiData: SalesKpiData = useMemo(() => 
    analysisResult?.status === 'success' && analysisResult.results?.kpiData ? 
    analysisResult.results.kpiData : 
    {
      totalRevenue: { value: 0, trend: 0, direction: 'neutral' },
      averageOrderValue: { value: 0, trend: 0, direction: 'neutral' },
      totalUnitsSold: { value: 0, trend: 0, direction: 'neutral' },
      topPerformingRegion: { value: 'N/A', percentage: 0 },
      conversionRate: { value: 0, trend: 0, direction: 'neutral' }, 
    }
  , [analysisResult]);

  const chartData: SalesData[] | undefined = useMemo(() => {
    if (analysisResult?.status === 'success' && analysisResult.results?.chartData) {
      return analysisResult.results.chartData.map(item => ({
        ...item,
      }));
    }
    return undefined;
  }, [analysisResult]);

  const overviewSummaryData = useMemo(() => {
    if (kpiData && selectedMetric && selectedDimension) {
        let totalValue: number | string = 'N/A';
        let topPerformerActualLabel = 'Top Performer';
        let topPerformerActualName = kpiData.topPerformingRegion.value || 'N/A';

        if (selectedMetric.toLowerCase().includes('revenue')) totalValue = kpiData.totalRevenue.value;
        else if (selectedMetric.toLowerCase().includes('unit')) totalValue = kpiData.totalUnitsSold.value;
        else if (selectedMetric.toLowerCase().includes('aov')) totalValue = kpiData.averageOrderValue.value;
        else if (selectedMetric.toLowerCase().includes('margin')) totalValue = kpiData.conversionRate.value;
        
        if (selectedDimension === 'region') topPerformerActualLabel = "Top Region";
        else if (selectedDimension === 'product') topPerformerActualLabel = "Top Product";
        else if (selectedDimension === 'category') topPerformerActualLabel = "Top Category";

        return {
            total: typeof totalValue === 'number' ? 
                   (selectedMetric.toLowerCase().includes('revenue') || selectedMetric.toLowerCase().includes('aov') ? `$${totalValue.toLocaleString()}` : 
                   selectedMetric.toLowerCase().includes('margin') ? `${(totalValue * 100).toFixed(1)}%` : totalValue.toLocaleString()) 
                   : totalValue,
            periodComparison: '+0% vs LY',
            contribution: '20%',
            topPerformerLabel: topPerformerActualLabel,
            topPerformerName: topPerformerActualName,
        };
    }
    return undefined;
  }, [kpiData, selectedMetric, selectedDimension]);

  if (error) {
    return (
      <div style={{ color: theme.colors.error, padding: theme.spacing[4] }}>Error: {error}</div>
    );
  }

  return (
    <div style={{ padding: theme.spacing[4], background: theme.colors.midnight }}>
      <Grid columns={12} gap="lg">
        <GridItem colSpan={12}>
          <Card elevation="md" style={{ background: theme.colors.graphiteDark, border: `1px solid ${theme.colors.graphite}`, borderRadius: '12px', padding: theme.spacing[3] }}>
            <FilterControls
              dateRange={dateRange}
              selectedDimension={selectedDimension}
              selectedMetric={selectedMetric}
              availableDimensions={AVAILABLE_DIMENSIONS}
              availableMetrics={AVAILABLE_METRICS}
              onDateRangeChange={handleDateRangeChange}
              onDimensionChange={handleDimensionChange}
              onMetricChange={handleMetricChange}
              onResetFilters={handleResetFilters}
            />
          </Card>
        </GridItem>

        <GridItem colSpan={12}>
          <KpiTileRow data={kpiData} loading={loading} />
        </GridItem>

        <GridItem colSpan={7}>
          <PerformanceOverview 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
            summaryData={overviewSummaryData}
            chartType={overviewChartType}
            onChartTypeChange={setOverviewChartType}
          />
        </GridItem>
        
        <GridItem colSpan={5}>
          <TimeSeriesExplorer 
            data={chartData} 
            loading={loading} 
            selectedMetric={selectedMetric} 
          />
        </GridItem>

        <GridItem colSpan={12}>
          <PerformanceDistributionAnalyzer 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
          />
        </GridItem>

        <GridItem colSpan={12}>
          <ComparativePerformanceGrid 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
            dateRange={dateRange}
          />
        </GridItem>

        <GridItem colSpan={6}>
          <PerformanceCorrelationMatrix 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            dateRange={dateRange}
          />
        </GridItem>

        <GridItem colSpan={6}>
          <PerformanceDriverAnalysis 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
            dateRange={dateRange}
          />
        </GridItem>
      </Grid>
    </div>
  );
};

export default SalesPerformanceView; 