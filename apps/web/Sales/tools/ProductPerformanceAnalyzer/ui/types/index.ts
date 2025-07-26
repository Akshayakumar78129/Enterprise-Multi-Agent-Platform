export interface Product {
  product_name: string;
  sales_amount: number;
  quantity: number;
  category?: string;
  subcategory?: string;
  margin_pct?: number;
  avg_price?: number;
  date?: string;
}

export interface PriceBandInfo {
  count: number;
  total_sales: number;
  avg_price: number;
}

export interface ChartPoint {
  x?: string | number;
  y?: string | number;
  pointIndex?: number;
  [key: string]: any;
}

export interface ProductPerformanceState {
  loading: boolean;
  error: string | null;
  data: Product[];
  scatterPlotData: Product[];
  priceBandChartData: {
    bands: string[];
    distribution: Record<string, {
      count: number;
      total_sales: number;
      avg_price: number;
    }>;
  } | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  minSalesThreshold: number | null;
  selectedMetrics: ("sales" | "units" | "margin" | "price_bands")[];
  categoryLevel: "product" | "category" | "subcategory";
  timeGranularity: 'daily' | 'weekly' | 'monthly';
  analysisResult: ProductAnalysisResult | null;
  categories: CategoryOption[];
  subcategories: Record<string, CategoryOption[]>;
}

export interface ProductAnalysisResult {
  status: 'success' | 'error';
  message?: string;
  period?: {
    start: string;
    end: string;
  };
  results?: {
    daily_summary?: {
      date: string;
      sales: number;
      quantity: number;
    }[];
    sales?: {
      total_sales: number;
      average_sales: number;
      top_products: {
        product_name: string;
        sales_amount: number;
        category?: string;
        date?: string;
      }[];
      category_distribution: Record<string, number>;
    };
    units?: {
      total_units: number;
      average_units: number;
      top_products: {
        product_name: string;
        quantity: number;
        category?: string;
        date?: string;
      }[];
      category_distribution: Record<string, number>;
    };
    margin?: {
      average_margin: number;
      margin_distribution: Record<string, number>;
      top_margin_products: {
        product_name: string;
        margin_pct: number;
        category?: string;
        date?: string;
      }[];
    };
    price_bands?: {
      bands: string[];
      distribution: Record<string, {
        count: number;
        total_sales: number;
        avg_price: number;
      }>;
    };
    subcategories?: Record<string, Record<string, number>>;
    kpi?: ProductKpiData;
    product_scatter_data?: Product[];
  };
}

export interface QuadrantData {
  name: string;
  products: Product[];
  description: string;
  recommendation: string;
}

export interface ProductKpiData {
  totalSales: {
    value: number;
    trend: number;
    direction: 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'neutral';
  };
  averageMargin: {
    value: number;
    trend: number;
    direction: 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'neutral';
  };
  totalUnits: {
    value: number;
    trend: number;
    direction: 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'neutral';
  };
  topCategory: {
    value: string;
    percentage: number;
  };
  priceDistribution: {
    dominant: string;
    percentage: number;
  };
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface StyleProps {
  [key: string]: string | number;
}

export interface GridProps {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  spacing?: number;
  style?: StyleProps;
}

export interface CardProps {
  elevation?: 'sm' | 'md' | 'lg';
  style?: StyleProps;
} 