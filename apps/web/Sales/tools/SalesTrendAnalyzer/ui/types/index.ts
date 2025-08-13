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

// Component prop interfaces
export interface TimeSeriesExplorerProps {
  data: SalesDataPoint[];
  isLoading?: boolean;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onDataPointClick?: (point: SalesDataPoint, event?: any) => void;
  onInfoIconClick?: (event: React.MouseEvent) => void;
}

export interface SeasonalPatternAnalyzerProps {
  data: SeasonalityDataPoint[];
  isLoading?: boolean;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  onDataPointClick?: (point: SeasonalityDataPoint, event?: any) => void;
  onInfoIconClick?: (event: React.MouseEvent) => void;
}

export interface GrowthRateVisualizerProps {
  data: GrowthRateDataPoint[];
  isLoading?: boolean;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  onDataPointClick?: (point: GrowthRateDataPoint, event?: any) => void;
  onInfoIconClick?: (event: React.MouseEvent) => void;
}

export interface KPITileProps {
  data: KPIData;
  isLoading?: boolean;
  previousPeriodData?: KPIData;
}

export interface KPITilesProps extends KPITileProps {
  selectedMetric?: string;
  onMetricSelect?: (metric: string) => void;
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
    glassBackground: 'rgba(255, 255, 255, 0.95)',
    glassBackgroundDark: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(59, 130, 246, 0.1)',
    
    // Primary Gradients
    primaryGradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    primaryGradientHover: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    
    // Base Colors
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#8b5cf6',
    secondaryDark: '#7c3aed',
    
    // Risk Color System
    risk: {
      red: '#ef4444',
      orange: '#f97316', 
      yellow: '#eab308',
      green: '#22c55e'
    },
    
    // Opacity Variations
    primary20: 'rgba(59, 130, 246, 0.2)',
    primary40: 'rgba(59, 130, 246, 0.4)',
    secondary20: 'rgba(139, 92, 246, 0.2)',
    secondary40: 'rgba(139, 92, 246, 0.4)',
    
    // Text Colors
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      white: '#ffffff',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
    },
    
    // Legacy colors (for backward compatibility)
    midnightNavy: 'rgba(15, 23, 42, 0.95)',
    electricCyan: '#00e0ff',
    signalMagenta: '#e930ff',
    cloudWhite: '#f7f9fb',
    graphite: 'rgba(255, 255, 255, 0.05)',
    lightGraphite: 'rgba(59, 130, 246, 0.1)',
    energyYellow: '#eab308'
  },
  
  // Glass Morphism Effects
  glass: {
    background: 'rgba(255, 255, 255, 0.95)',
    backgroundDark: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(59, 130, 246, 0.1)',
    backdropFilter: 'blur(20px)',
    boxShadow: `
      0 8px 32px 0 rgba(59, 130, 246, 0.1),
      0 2px 16px 0 rgba(0, 0, 0, 0.05),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.4)
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