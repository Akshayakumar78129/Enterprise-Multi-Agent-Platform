import { useEffect, useState, useMemo, useRef } from "react";

function getDashboardClient(dashboardType: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  return {
    fetchSummary: async (params: any, options?: RequestInit) => {
      // Mock data for stock levels
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            inventoryOverview: {
              total_items: 15847,
              total_value: 2850000,
              low_stock_items: 234,
              out_of_stock_items: 12,
              overstock_items: 89
            },
            stockAlerts: {
              critical: 12,
              warning: 234,
              normal: 15601,
              alerts: [
                { item: 'Widget A', level: 5, reorder: 50, status: 'critical' },
                { item: 'Component B', level: 15, reorder: 25, status: 'warning' },
                { item: 'Part C', level: 8, reorder: 20, status: 'warning' }
              ]
            },
            categoryStock: {
              categories: [
                { category: 'Electronics', stock_value: 950000, items: 4250 },
                { category: 'Components', stock_value: 720000, items: 6800 },
                { category: 'Accessories', stock_value: 580000, items: 3200 },
                { category: 'Tools', stock_value: 600000, items: 1597 }
              ]
            },
            turnoverRates: {
              average_turnover: 8.5,
              by_category: [
                { category: 'Electronics', turnover: 12.3 },
                { category: 'Components', turnover: 8.7 },
                { category: 'Accessories', turnover: 6.2 },
                { category: 'Tools', turnover: 4.8 }
              ]
            },
            stockMovement: {
              daily_movement: [
                { date: '2021-06-01', inbound: 120, outbound: 180, net: -60 },
                { date: '2021-06-02', inbound: 95, outbound: 145, net: -50 },
                { date: '2021-06-03', inbound: 200, outbound: 165, net: 35 },
                { date: '2021-06-04', inbound: 150, outbound: 190, net: -40 },
                { date: '2021-06-05', inbound: 180, outbound: 155, net: 25 }
              ]
            },
            lowStockItems: [
              {
                item_id: 'I001',
                item_name: 'Premium Widget A',
                stock_level: 5,
                reorder_point: 50,
                turnover_rate: 12.5,
                category: 'Electronics',
                supplier: 'TechCorp'
              },
              {
                item_id: 'I002',
                item_name: 'Component B-Plus',
                stock_level: 15,
                reorder_point: 25,
                turnover_rate: 8.2,
                category: 'Components',
                supplier: 'ComponentCo'
              },
              {
                item_id: 'I003',
                item_name: 'Assembly Part C',
                stock_level: 8,
                reorder_point: 20,
                turnover_rate: 6.8,
                category: 'Components',
                supplier: 'PartsInc'
              }
            ]
          });
        }, 1000);
      });
    }
  };
}

interface StockFilters {
  timePeriod: string;
  warehouseId: string | null;
  categories: string[];
  stockStatus: string[];
  minQuantity: number;
  suppliers: string[];
}

export function useStockData(filters: StockFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const lastGoodDataRef = useRef<any>(null);
  const [inventoryOverview, setInventoryOverview] = useState<any>(null);
  const [stockAlerts, setStockAlerts] = useState<any>(null);
  const [categoryStock, setCategoryStock] = useState<any>(null);
  const [turnoverRates, setTurnoverRates] = useState<any>(null);
  const [stockMovement, setStockMovement] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const client = useMemo(() => getDashboardClient("stock-levels"), []);

  function normalizeSummary(summary: any) {
    const s = summary || {};

    return {
      inventoryOverview: s.inventoryOverview || s.inventory_overview || {},
      stockAlerts: s.stockAlerts || s.stock_alerts || {},
      categoryStock: s.categoryStock || s.category_stock || {},
      turnoverRates: s.turnoverRates || s.turnover_rates || {},
      stockMovement: s.stockMovement || s.stock_movement || {},
      lowStockItems: s.lowStockItems || s.low_stock_items || [],
    };
  }

  const emptyData = useMemo(() => ({
    inventoryOverview: {},
    stockAlerts: {},
    categoryStock: {},
    turnoverRates: {},
    stockMovement: {},
    lowStockItems: [],
  }), []);

  useEffect(() => {
    let isMounted = true;

    // Abort previous request if exists
    if (abortControllerRef.current) abortControllerRef.current.abort('Filter changed');

    // Create new AbortController for this request
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filterParams: Record<string, any> = {
          time_period: filters.timePeriod,
          warehouse_id: filters.warehouseId,
          categories: filters.categories.length > 0 ? filters.categories : undefined,
          stock_status: filters.stockStatus.length > 0 ? filters.stockStatus : undefined,
          min_quantity: filters.minQuantity || 0,
          suppliers: filters.suppliers.length > 0 ? filters.suppliers : undefined,
        };

        console.log('[useStockData] Fetching with params:', filterParams);
        const summaryResponse = await client.fetchSummary(filterParams, { signal: ac.signal } as any);
        console.log('[useStockData] Response received:', summaryResponse);

        const effective = summaryResponse ? normalizeSummary(summaryResponse) : emptyData;

        const isEmpty = !effective.lowStockItems || effective.lowStockItems.length === 0;
        setHasNoData(isEmpty);

        setData(effective);
        lastGoodDataRef.current = effective;

        // Process all stock data
        setInventoryOverview(effective.inventoryOverview);
        setStockAlerts(effective.stockAlerts);
        setCategoryStock(effective.categoryStock);
        setTurnoverRates(effective.turnoverRates);
        setStockMovement(effective.stockMovement);

        // Process low stock items
        setLowStockItems(effective.lowStockItems.map((item: any) => ({
          ...item,
          id: item.itemId || item.item_id,
          name: item.itemName || item.item_name || `Item ${item.itemId || item.item_id}`,
          stockLevel: item.stockLevel || item.stock_level || 0,
          reorderPoint: item.reorderPoint || item.reorder_point || 0,
          turnoverRate: item.turnoverRate || item.turnover_rate || 0,
          category: item.category || 'Unknown',
          supplier: item.supplier || 'Unknown',
        })));

      } catch (err: any) {
        // Check if it's an abort error
        const isAbortError =
          err?.name === "AbortError" ||
          err?.code === 20 ||
          err?.message === "Filter changed" ||
          err?.message === "Cleanup" ||
          err?.message?.includes("abort") ||
          err?.message?.includes("cancelled");

        if (isAbortError) {
          console.log("[useStockData] Request cancelled (expected behavior)");
          return;
        }
        console.error("Error fetching stock data:", err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          if (lastGoodDataRef.current) {
            const stable = lastGoodDataRef.current;
            setData(stable);
            setHasNoData(!stable.lowStockItems || stable.lowStockItems.length === 0);
          } else {
            setData(emptyData);
            setInventoryOverview(null);
            setStockAlerts(null);
            setCategoryStock(null);
            setTurnoverRates(null);
            setStockMovement(null);
            setLowStockItems([]);
            setHasNoData(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Cleanup');
      }
      abortControllerRef.current = null;
    };
  }, [filters, client, emptyData]);

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    if (!data || hasNoData) {
      return {
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        avgTurnover: 0,
        criticalAlerts: 0,
      };
    }

    const totalItems = inventoryOverview?.total_items || 0;
    const totalValue = inventoryOverview?.total_value || 0;
    const lowStockCount = inventoryOverview?.low_stock_items || 0;
    const avgTurnover = turnoverRates?.average_turnover || 0;
    const criticalAlerts = stockAlerts?.critical || 0;

    return {
      totalItems: totalItems.toLocaleString(),
      totalValue: totalValue.toLocaleString(),
      lowStockCount: lowStockCount.toString(),
      avgTurnover: avgTurnover.toFixed(1),
      criticalAlerts: criticalAlerts.toString(),
    };
  }, [data, inventoryOverview, turnoverRates, stockAlerts, hasNoData]);

  return {
    loading,
    error,
    data,
    inventoryOverview,
    stockAlerts,
    categoryStock,
    turnoverRates,
    stockMovement,
    lowStockItems,
    hasNoData,
    kpiMetrics,
    client
  };
}