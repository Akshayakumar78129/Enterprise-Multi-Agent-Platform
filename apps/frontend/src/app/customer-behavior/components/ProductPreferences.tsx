"use client";

import React, { useState, useEffect } from "react";
import { Card, Skeleton, getShiftClickManager } from "components/index";
import { useBehaviorContext } from "../context";
import dynamic from 'next/dynamic';
import { Bar } from "react-chartjs-2";

// Dynamic import of Plotly to prevent SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ProductPreferencesProps {
  data: any;
  loading: boolean;
}

export function ProductPreferences({ data, loading }: ProductPreferencesProps) {
  const { selectionManager } = useBehaviorContext();
  const shiftClickManager = getShiftClickManager();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (loading) {
    return (
      <Card>
        <Skeleton className="h-80" />
      </Card>
    );
  }

  const topCategories = data?.topCategories || data?.top_categories || [];

  if (!data || topCategories.length === 0) {
    return (
      <Card className="glass-card">
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">No product preference data available</p>
            <p className="text-xs mt-1">Check filters or data source</p>
          </div>
        </div>
      </Card>
    );
  }

  const categoryData = {
    labels: topCategories.slice(0, 5).map((c: any) => `Category ${c.category || c.name || 'Unknown'}`),
    datasets: [
      {
        label: 'Total Sales',
        data: topCategories.slice(0, 5).map((c: any) => c.total_sales || c.totalSales || c.purchase_count || 0),
        backgroundColor: [
          '#00e0ff',
          '#5fd4d6',
          '#5891cb',
          '#aa45dd',
          '#e930ff'
        ]
      }
    ]
  };

  const productData = data.top_products ? {
    labels: data.top_products.slice(0, 10).map((p: any) => p.product_name),
    datasets: [
      {
        label: 'Units Sold',
        data: data.top_products.slice(0, 10).map((p: any) => p.quantity),
        backgroundColor: 'rgba(233, 48, 255, 0.8)',
        borderColor: '#e930ff',
        borderWidth: 1
      }
    ]
  } : null;

  const handleCategoryClick = (elements: any, event: any) => {
    if (elements.length > 0) {
      const element = elements[0];
      const label = categoryData.labels[element.index];
      const value = categoryData.datasets[0].data[element.index];

      selectionManager.addPoint({
        label: `Category: ${label}`,
        value: `${value} purchases`,
        source: 'Product Preferences',
        metadata: {
          type: 'category',
          category: label,
          count: value
        }
      }, event?.native?.shiftKey || false);
    }
  };

  // Prepare treemap data
  const treemapData = topCategories.length > 0 ? [{
    type: 'treemap',
    labels: topCategories.map((c: any) => c.category || c.name || 'Unknown'),
    parents: topCategories.map(() => ''),
    values: topCategories.map((c: any) => c.total_sales || c.totalSales || c.purchase_count || 0),
    text: topCategories.map((c: any) => {
      const value = c.total_sales || c.totalSales || c.purchase_count || 0;
      return `$${(value/1000).toFixed(1)}K`;
    }),
    textposition: 'middle center',
    marker: {
      colors: [
        '#8b5cf6', '#d8b4fe', '#c084fc', '#a78bfa',
        '#e8d4e6', '#f3e8ff', '#e9d5ff', '#c4b5fd'
      ],
      line: {
        color: '#e8d4e6',
        width: 2
      }
    },
    hovertemplate: '<b>%{label}</b><br>Sales: $%{value:,.0f}<br>%{text}<extra></extra>',
    textfont: {
      size: 14,
      color: 'white'
    }
  }] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Category Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">Top product categories by sales</p>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Category Distribution",
                value: `Top product categories by sales`,
                source: 'Behavior Dashboard - Category Distribution'
              }, event.nativeEvent);
            }}>
          <div className="h-80 p-4">
            <Bar
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                onClick: handleCategoryClick,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const label = context.label || '';
                        const value = context.parsed.y;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: $${(value/1000).toFixed(1)}K (${percentage}%)`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: {
                      color: '#8b5cf6',
                      callback: function(value: any) {
                        return '$' + (value/1000).toFixed(0) + 'K';
                      }
                    }
                  },
                  x: {
                    grid: { display: false },
                    ticks: {
                      color: '#8b5cf6',
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }}
            />
          </div>
          </Card>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Category Treemap</h3>
          <p className="text-sm text-muted-foreground mb-4">Hierarchical view of product categories</p>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Category Treemap",
                value: `Hierarchical view of product categories`,
                source: 'Behavior Dashboard - Treemap'
              }, event.nativeEvent);
            }}>
          <div className="h-80">
            {isClient && treemapData.length > 0 ? (
              <Plot
                data={treemapData}
                layout={{
                  margin: { t: 0, r: 0, b: 0, l: 0 },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: {
                    family: 'Inter, system-ui, -apple-system',
                    color: '#8b5cf6'
                  },
                  height: 320,
                  width: undefined,
                  autosize: true,
                }}
                config={{
                  displayModeBar: false,
                  displaylogo: false
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <p className="text-sm">No treemap data available</p>
                </div>
              </div>
            )}
          </div>
          </Card>
        </div>
      </div>

      {productData && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Top Products</h3>
          <p className="text-sm text-muted-foreground mb-4">Best selling products</p>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Top Products",
                value: `Best selling products`,
                source: 'Behavior Dashboard - Top Products'
              }, event.nativeEvent);
            }}>
          <div className="h-64 p-4">
            <Bar
              data={productData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y' as const,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(232, 212, 230, 0.1)' },
                    ticks: { color: '#8b5cf6' }
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: '#8b5cf6' }
                  }
                }
              }}
            />
          </div>
          </Card>
        </div>
      )}
    </div>
  );
}