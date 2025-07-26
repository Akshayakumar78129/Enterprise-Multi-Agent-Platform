import { type FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../state/store';
import { Card } from '../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../ui-common/design-system/theme';
import { Grid, GridItem } from '../../../../../ui-common/design-system/components/Grid';
import { KpiTileRow } from '../components/kpi/KpiTileRow';
import { SalesPerformanceExplorer } from '../components/visualizations/SalesPerformanceExplorer';
import { MarginAnalysisVisualizer } from '../components/visualizations/MarginAnalysisVisualizer';
import { PriceBandDistribution } from '../components/visualizations/PriceBandDistribution';
import { FilterControls } from '../components/controls/FilterControls';
import { fetchProductPerformance, setDateRange, setSelectedCategory, setSelectedSubcategory, setMinSalesThreshold, resetFilters } from '../state/productPerformanceSlice';
import { ProductKpiData, ProductPerformanceState } from '../types';

/**
 * Main Product Performance Dashboard View
 * Integrates all components into a unified dashboard experience
 */
export const ProductPerformanceView: FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    data, 
    loading, 
    error, 
    dateRange, 
    selectedCategory, 
    selectedSubcategory, 
    categories, 
    subcategories,
    analysisResult,
    scatterPlotData,
    priceBandChartData
  } = useSelector((state: { productPerformance: ProductPerformanceState }) => state.productPerformance);

  useEffect(() => {
    dispatch(fetchProductPerformance());
  }, [dispatch, dateRange, selectedCategory, selectedSubcategory]);

  const handleDateRangeChange = (dateRange: { startDate: string; endDate: string }) => {
    dispatch(setDateRange(dateRange));
  };

  const handleCategoryChange = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  const handleSubcategoryChange = (subcategory: string) => {
    dispatch(setSelectedSubcategory(subcategory));
  };

  const handleThresholdChange = (threshold: number) => {
    dispatch(setMinSalesThreshold(threshold));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  const kpiData: ProductKpiData = analysisResult?.status === 'success' && analysisResult.results?.kpi ? {
    totalSales: analysisResult.results.kpi.totalSales,
    averageMargin: analysisResult.results.kpi.averageMargin,
    totalUnits: analysisResult.results.kpi.totalUnits,
    topCategory: analysisResult.results.kpi.topCategory,
    priceDistribution: analysisResult.results.kpi.priceDistribution,
  } : {
    totalSales: { value: 0, trend: 0, direction: 'neutral' },
    averageMargin: { value: 0, trend: 0, direction: 'neutral' },
    totalUnits: { value: 0, trend: 0, direction: 'neutral' },
    topCategory: { value: 'Loading...', percentage: 0 },
    priceDistribution: { dominant: 'Loading...', percentage: 0 },
  };

  if (error) {
    return (
      <div style={{ 
        color: theme.colors.signalMagenta,
        padding: theme.spacing[4],
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing[4] }}>
      <Grid columns={12} gap="md">
        {/* Filter Controls */}
        <GridItem colSpan={12}>
          <Card
            elevation="md"
            style={{
              background: theme.colors.midnight,
              border: `1px solid ${theme.colors.graphite}`,
              borderRadius: '12px',
              padding: theme.spacing[4],
            }}
          >
            <FilterControls
              dateRange={dateRange}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              categories={categories}
              subcategories={subcategories}
              minSalesThreshold={0}
              onDateRangeChange={handleDateRangeChange}
              onCategoryChange={handleCategoryChange}
              onSubcategoryChange={handleSubcategoryChange}
              onMinSalesThresholdChange={handleThresholdChange}
              onResetFilters={handleResetFilters}
            />
          </Card>
        </GridItem>

        {/* KPI Tiles */}
        <GridItem colSpan={12}>
          <KpiTileRow data={kpiData} loading={loading} />
        </GridItem>

        {/* Sales Performance Explorer */}
        <GridItem colSpan={8}>
          <SalesPerformanceExplorer data={data} loading={loading} />
        </GridItem>

        {/* Margin Analysis Visualizer */}
        <GridItem colSpan={4}>
          <MarginAnalysisVisualizer 
            data={scatterPlotData}
            loading={loading} 
            kpiAverageMargin={kpiData.averageMargin.value}
          />
        </GridItem>

        {/* Price Band Distribution */}
        <GridItem colSpan={12}>
          <PriceBandDistribution 
            loading={loading} 
            bands={priceBandChartData?.bands}
            distribution={priceBandChartData?.distribution}
          />
        </GridItem>
      </Grid>
    </div>
  );
};

export default ProductPerformanceView; 