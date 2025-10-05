import React from 'react';

interface ProductData {
  productCategory: string;
  transactionCount: number;
  totalRevenue: number;
  avgPrice: number;
  growthRate?: number;
}

interface ProductMatrixProps {
  data: ProductData[];
  loading?: boolean;
  onProductClick?: (product: ProductData, event: React.MouseEvent) => void;
}

export const ProductMatrix: React.FC<ProductMatrixProps> = ({
  data = [],
  loading = false,
  onProductClick
}) => {
  if (loading) {
    return (
      <div className="h-96 animate-pulse">
        <div className="h-full bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  // Sort products by revenue for better visualization
  const validData = data.filter(d => d && d.totalRevenue !== undefined && d.transactionCount !== undefined);
  const sortedData = [...validData].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
  const topProducts = sortedData.slice(0, 10); // Show top 10 products

  if (topProducts.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No product data available
      </div>
    );
  }

  const maxRevenue = Math.max(...topProducts.map(p => p.totalRevenue || 0), 1);
  const maxCount = Math.max(...topProducts.map(p => p.transactionCount || 0), 1);

  return (
    <div className="space-y-3">
        {topProducts.map((product, index) => {
          const revenueWidth = (product.totalRevenue / maxRevenue) * 100;
          const countWidth = (product.transactionCount / maxCount) * 100;

          return (
            <div
              key={product.productCategory}
              className="group cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
              onClick={(e) => onProductClick?.(product, e)}
            >
              {/* Product Name and Stats */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-sm">{product.productCategory || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {(product.transactionCount || 0).toLocaleString()} transactions •
                    Avg: ${(product.avgPrice || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    ${((product.totalRevenue || 0) / 1000).toFixed(1)}K
                  </div>
                  {product.growthRate !== undefined && (
                    <div className={`text-xs ${product.growthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {product.growthRate > 0 ? '+' : ''}{(product.growthRate || 0).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Dual Progress Bars */}
              <div className="space-y-1">
                {/* Revenue Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Revenue</span>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300"
                      style={{ width: `${revenueWidth}%` }}
                    />
                  </div>
                </div>

                {/* Transaction Count Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">Volume</span>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-300"
                      style={{ width: `${countWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {data.length > 10 && (
          <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border/50">
            Showing top 10 of {data.length} product categories
          </div>
        )}
    </div>
  );
};