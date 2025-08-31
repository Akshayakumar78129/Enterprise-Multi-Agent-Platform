// Time periods and metrics
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type Metric = 'revenue' | 'units' | 'aov' | 'margin';
export type Dimension = 'product' | 'category' | 'channel' | 'region' | 'customer' | null;

// Filter state interface
export interface FilterState {
  startDate: string;
  endDate: string;
  timePeriod: TimePeriod;
  metric: Metric;
  dimension: Dimension;
  topN?: number;
}

// Main data interfaces
export interface SalesDataPoint {
  period: string;
  revenue: number;
  units: number;
  orders: number;
  dimension_id?: string;
  dimension_name?: string;
}

export interface KPIData {
  total_revenue: number;
  total_units: number;
  total_orders: number;
  avg_order_value: number;
  margin_percentage: number;
}

export interface SeasonalityDataPoint {
  period: string;
  year: string;
  month: string;
  revenue: number;
}

export interface GrowthRateDataPoint {
  period: string;
  revenue: number;
  growth_rate: number;
  avg_growth_rate: number;
  min_growth_rate: number;
  max_growth_rate: number;
}

// API response interfaces
export interface APIMetadata {
  timePeriod: TimePeriod;
  metric: Metric;
  dimension: Dimension;
  startDate: string;
  endDate: string;
}

export interface APIResponse {
  success: boolean;
  data?: {
    mainData: SalesDataPoint[];
    kpis: KPIData;
    seasonality: SeasonalityDataPoint[];
    growthRates: GrowthRateDataPoint[];
    metadata: APIMetadata;
  };
  error?: string;
  message?: string;
}

// Multi-selection interfaces
export interface SelectedDataPoint {
  id: string;
  chartType: 'timeseries' | 'seasonal' | 'growth' | 'kpi';
  metricName: string;
  date: string;
  value: number;
  previousValue?: number;
  percentChange?: number;
  period?: string;
  year?: string;
  month?: string;
  isAverage?: boolean;
  displayName: string;
  timestamp: number;
}

// Component prop interfaces
export interface TimeSeriesExplorerProps {
  data: SalesDataPoint[];
  isLoading?: boolean;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onDataPointClick?: (point: SalesDataPoint, event?: any) => void;
  onInfoIconClick?: (event: React.MouseEvent) => void;
  selectedPoints?: Set<string>;
}

export interface SeasonalPatternAnalyzerProps {
  data: SeasonalityDataPoint[];
  isLoading?: boolean;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  onDataPointClick?: (point: SeasonalityDataPoint, event?: any) => void;
  onInfoIconClick?: (event: React.MouseEvent) => void;
  selectedPoints?: Set<string>;
}

export interface GrowthRateVisualizerProps {
  data: GrowthRateDataPoint[];
  isLoading?: boolean;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  onDataPointClick?: (point: GrowthRateDataPoint, event?: any) => void;
  onInfoIconClick?: (event: React.MouseEvent) => void;
  selectedPoints?: Set<string>;
}

export interface KPITileProps {
  data: KPIData;
  isLoading?: boolean;
  previousPeriodData?: KPIData;
}

export interface KPITilesProps extends KPITileProps {
  selectedMetric?: string;
  onMetricSelect?: (metric: string) => void;
  onInfoIconClick?: (event: React.MouseEvent, chartType: string) => void;
}

// Dashboard state interface
export interface DashboardState {
  filters: FilterState;
  data: {
    mainData: SalesDataPoint[];
    kpis: KPIData;
    seasonality: SeasonalityDataPoint[];
    growthRates: GrowthRateDataPoint[];
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Modern Glass Morphism Theme
export const THEME = {
  colors: {
    // Glass Morphism Backgrounds
    glassBackground: 'rgba(44, 51, 65, 0.95)', // container background #2c3341
    glassBackgroundDark: 'rgba(10, 18, 36, 0.6)', // interactive bg #0a1224 with opacity
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    
    // Primary Gradients
    primaryGradient: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
    primaryGradientHover: 'linear-gradient(135deg, #19ecff 0%, #ff53ff 100%)',
    
    // Base Colors (accents)
    primary: '#00e0ff', // Electric Cyan
    primaryDark: '#00b7d1',
    secondary: '#e930ff', // Signal Magenta
    secondaryDark: '#c020e2',
    
    // Categorical Palette (7 distinct, complementary colors)
    categorical: [
      '#00e0ff', // cyan
      '#e930ff', // magenta
      '#22c55e', // green
      '#f59e0b', // orange
      '#a78bfa', // purple
      '#f43f5e', // rose
      '#14b8a6'  // teal
    ],

    // State/Semantic + Disabled
    disabled: 'rgba(247, 249, 251, 0.3)',

    // Risk/State Color System
    risk: {
      red: '#ef4444',
      orange: '#f59e0b',
      yellow: '#fbbf24',
      green: '#22c55e'
    },
    
    // Opacity Variations (based on primary/secondary)
    primary20: 'rgba(0, 224, 255, 0.2)',
    primary40: 'rgba(0, 224, 255, 0.4)',
    secondary20: 'rgba(233, 48, 255, 0.2)',
    secondary40: 'rgba(233, 48, 255, 0.4)',
    
    // Text Colors (dark UI)
    text: {
      primary: '#f7f9fb', // Cloud White
      secondary: 'rgba(247, 249, 251, 0.75)',
      white: '#ffffff',
      gradient: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)'
    },
    
    // Legacy/back-compat helpers
    midnightNavy: '#0a1224',
    electricCyan: '#00e0ff',
    signalMagenta: '#e930ff',
    cloudWhite: '#f7f9fb',
    graphite: '#232a36', // base background
    lightGraphite: 'rgba(247, 249, 251, 0.15)', // subtle grid lines on dark
    energyYellow: '#eab308'
  },
  
  // Glass Morphism Effects
  glass: {
    background: 'rgba(44, 51, 65, 0.95)', // container bg
    backgroundDark: 'rgba(10, 18, 36, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: `
      0 8px 24px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.05)
    `
  },
  
  // Animation System
  animations: {
    // Entrance Animations
    fadeInUp: 'fadeInUp 0.6s ease-out',
    scaleIn: 'scaleIn 0.5s ease-out',
    slideInFromLeft: 'slideInFromLeft 0.6s ease-out',
    slideInFromRight: 'slideInFromRight 0.6s ease-out',
    
    // Hover Effects
    hoverLift: 'transform: translateY(-4px); box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);',
    hoverScale: 'transform: scale(1.02);',
    
    // Floating Animation
    float: 'float 6s ease-in-out infinite',
    
    // Transitions
    smooth: 'all 0.3s ease',
    smoothSlow: 'all 0.5s ease',
    spring: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  
  // Typography System
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px'
    }
  },
  
  // Responsive Breakpoints
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1400px'
  },
  
  // Component Dimensions
  dimensions: {
    timeSeriesExplorer: { width: '100%', height: 480 },
    seasonalPatternAnalyzer: { width: '100%', height: 460 },
    growthRateVisualizer: { width: '100%', height: 420 },
    kpiTile: { minWidth: 200, height: 140 }
  }
} as const;

// Animation Keyframes (to be added to global CSS)
export const KEYFRAMES = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 30px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translate3d(-30px, 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translate3d(30px, 0, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`; 