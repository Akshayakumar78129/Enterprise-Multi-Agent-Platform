import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalesTrendDashboard from '../ui/views/SalesTrendDashboard';
import TimeSeriesExplorer from '../ui/components/visualizations/TimeSeriesExplorer';
import SeasonalPatternAnalyzer from '../ui/components/visualizations/SeasonalPatternAnalyzer';
import GrowthRateVisualizer from '../ui/components/visualizations/GrowthRateVisualizer';
import KPITiles from '../ui/components/kpi/KPITiles';

// Mock data
const mockData = {
  mainData: [
    { period: '2023-01', revenue: 100000, units: 1000, orders: 500 },
    { period: '2023-02', revenue: 120000, units: 1200, orders: 600 }
  ],
  kpis: {
    total_revenue: 220000,
    total_units: 2200,
    total_orders: 1100,
    avg_order_value: 200,
    margin_percentage: 35
  },
  seasonality: [
    { period: '2023-01', year: '2023', month: '01', revenue: 100000 },
    { period: '2023-02', year: '2023', month: '02', revenue: 120000 }
  ],
  growthRates: [
    { period: '2023-02', revenue: 120000, growth_rate: 20, avg_growth_rate: 20, min_growth_rate: 20, max_growth_rate: 20 }
  ]
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: mockData })
  })
);

describe('SalesTrendDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SalesTrendDashboard />);
    expect(screen.getByText('Sales Trend Analysis')).toBeInTheDocument();
  });

  it('fetches and displays data', async () => {
    render(<SalesTrendDashboard />);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Total Revenue')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));
    render(<SalesTrendDashboard />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});

describe('TimeSeriesExplorer', () => {
  const mockProps = {
    data: mockData.mainData,
    isLoading: false,
    filters: {
      startDate: '2023-01-01',
      endDate: '2023-02-28',
      timePeriod: 'monthly',
      metric: 'revenue',
      dimension: null
    },
    onFilterChange: jest.fn(),
    onDataPointClick: jest.fn()
  };

  it('renders without crashing', () => {
    render(<TimeSeriesExplorer {...mockProps} />);
    expect(screen.getByText('Time Series Explorer')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<TimeSeriesExplorer {...mockProps} isLoading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe('KPITiles', () => {
  it('renders all KPIs', () => {
    render(<KPITiles data={mockData.kpis} isLoading={false} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Units')).toBeInTheDocument();
    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByText('Margin')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<KPITiles data={null} isLoading={true} />);
    expect(screen.getAllByText(/loading/i)).toHaveLength(4);
  });
});

describe('SeasonalPatternAnalyzer', () => {
  const mockProps = {
    data: mockData.seasonality,
    isLoading: false,
    timePeriod: 'monthly',
    onTimePeriodChange: jest.fn()
  };

  it('renders without crashing', () => {
    render(<SeasonalPatternAnalyzer {...mockProps} />);
    expect(screen.getByText('Seasonal Pattern Analyzer')).toBeInTheDocument();
  });

  it('displays no data message when empty', () => {
    render(<SeasonalPatternAnalyzer {...mockProps} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});

describe('GrowthRateVisualizer', () => {
  const mockProps = {
    data: mockData.growthRates,
    isLoading: false,
    timePeriod: 'monthly',
    onTimePeriodChange: jest.fn()
  };

  it('renders without crashing', () => {
    render(<GrowthRateVisualizer {...mockProps} />);
    expect(screen.getByText('Growth Rate Analysis')).toBeInTheDocument();
  });

  it('displays metrics', () => {
    render(<GrowthRateVisualizer {...mockProps} />);
    expect(screen.getByText('Average Growth')).toBeInTheDocument();
    expect(screen.getByText('Highest Growth')).toBeInTheDocument();
    expect(screen.getByText('Lowest Growth')).toBeInTheDocument();
  });
}); 