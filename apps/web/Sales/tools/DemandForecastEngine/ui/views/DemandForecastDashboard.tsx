import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  DashboardLayout, 
  KPICard 
} from '../../../../../ui-common/theme';
import ChartCard from '../../../../../ui-common/theme/ChartCard';
import { 
  UniversalChatbot, 
  ChatbotButton 
} from '../../../../../ui-common/chatbot';
import AIInsightsPopup from '../../../../../ui-common/insights/AIInsightsPopup';
import { 
  UniversalDashboardFilters, 
  FilterConfig 
} from '../../../../../ui-common/filters';
import DemandForecastBIAgent, { BusinessIntelligenceTrigger } from '../components/DemandForecastBIAgent';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart
} from 'recharts';

// Calculate date ranges - using actual database range 2017-2021
const getDateRange = (days: number) => {
  // Database has data from 2017-01-20 to 2021-06-24
  const end = new Date('2021-06-24'); // Latest date in database
  const start = new Date('2021-06-24');
  start.setDate(start.getDate() - days);
  
  // Ensure start date is not before the earliest data
  const earliestDate = new Date('2017-01-20');
  if (start < earliestDate) {
    return {
      start: earliestDate.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const demandForecastFilters: FilterConfig[] = [
  {
    type: 'date',
    label: 'Historical Period',
    key: 'historicalPeriod',
    defaultValue: getDateRange(180) // Show 6 months of historical data by default
  },
  {
    type: 'select',
    label: 'Forecast Horizon',
    key: 'forecast_horizon',
    options: [
      { value: 'week', label: 'Weekly (7 days)' },
      { value: 'month', label: 'Monthly (30 days)' },
      { value: 'quarter', label: 'Quarterly (90 days)' },
      { value: 'year', label: 'Yearly (365 days)' }
    ],
    defaultValue: 'month'
  },
  {
    type: 'select',
    label: 'Product Category',
    key: 'product_category',
    options: [
      { value: 'all', label: 'All Categories' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'furniture', label: 'Furniture' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'food', label: 'Food & Beverages' }
    ],
    defaultValue: 'all'
  },
  {
    type: 'select',
    label: 'Sales Region',
    key: 'region',
    options: [
      { value: '', label: 'All Regions' },
      { value: '1', label: 'North America' },
      { value: '2', label: 'Europe' },
      { value: '3', label: 'Asia Pacific' },
      { value: '4', label: 'South America' }
    ],
    defaultValue: ''
  },
  {
    type: 'select',
    label: 'Forecast Model',
    key: 'model_type',
    options: [
      { value: 'ma', label: 'Moving Average' },
      { value: 'exp', label: 'Exponential Smoothing' },
      { value: 'arima', label: 'ARIMA' },
      { value: 'ml', label: 'Machine Learning' }
    ],
    defaultValue: 'ma'
  },
  {
    type: 'range',
    label: 'Confidence Level (%)',
    key: 'confidence_level',
    min: 50,
    max: 99,
    defaultValue: { min: 95, max: 95 }
  },
  {
    type: 'toggle',
    label: 'Include Seasonality',
    key: 'include_seasonality',
    defaultValue: true
  }
];

interface ForecastData {
  date: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
  revenue?: number;
  actualRevenue?: number;
  forecastRevenue?: number;
}

interface ScenarioData {
  id: string;
  name: string;
  color: string;
  data: ForecastData[];
  parameters: {
    growth: number;
    seasonality: number;
    price: number;
  };
  visible: boolean;
}

export default function DemandForecastDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBIOpen, setIsBIOpen] = useState(false);
  const [showInsights, setShowInsights] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<'quantity' | 'revenue'>('quantity');
  const [selectedHorizon, setSelectedHorizon] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedChartPoints, setSelectedChartPoints] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // API Data States
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<any[]>([]);
  const [demandDrivers, setDemandDrivers] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalVolume: 0,
    totalRevenue: 0,
    growthRate: 0,
    avgDaily: 0,
    accuracy: 95.3,
    trend: 'Stable',
    seasonalImpact: 25
  });
  
  const [filters, setFilters] = useState({
    historicalPeriod: getDateRange(180), // Show 6 months of historical data by default
    forecast_horizon: 'month',
    product_category: 'all',
    region: '',
    model_type: 'ma',
    confidence_level: 95,
    include_seasonality: true
  });

  // Fetch data from API
  const fetchForecastData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/demand-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: filters.historicalPeriod.start,
          end_date: filters.historicalPeriod.end,
          forecast_horizon: filters.forecast_horizon,
          product_category: filters.product_category !== 'all' ? filters.product_category : undefined,
          region: filters.region || undefined,
          model_type: filters.model_type,
          confidence_level: filters.confidence_level,
          include_seasonality: filters.include_seasonality
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setForecastData(result.data.forecastData || []);
          setModelPerformance(result.data.modelPerformance || []);
          setSeasonalPatterns(result.data.seasonalPatterns || []);
          setDemandDrivers(result.data.demandDrivers || []);
          setKpis(result.data.kpis || kpis);
        }
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [filters.historicalPeriod, filters.forecast_horizon, filters.region]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      historicalPeriod: newFilters.historicalPeriod || prev.historicalPeriod,
      forecast_horizon: newFilters.forecast_horizon || prev.forecast_horizon,
      confidence_level: newFilters.confidence_level?.min || prev.confidence_level
    }));
    
    if (newFilters.forecast_horizon) {
      setSelectedHorizon(newFilters.forecast_horizon);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      historicalPeriod: getDateRange(180), // Reset to 6 months of historical data
      forecast_horizon: 'month',
      product_category: 'all',
      region: '',
      model_type: 'ma',
      confidence_level: 95,
      include_seasonality: true
    });
    setSelectedHorizon('month');
  };

  const handleKPIClick = (kpi: any) => {
    setShowInsights({
      title: kpi.label,
      type: 'kpi',
      value: kpi.value,
      insights: [
        `Current ${kpi.label}: ${kpi.value}`,
        'Trend analysis shows steady improvement',
        'Forecast confidence is high based on historical patterns'
      ],
      recommendations: [
        'Monitor daily for variance',
        'Set up alerts for significant deviations',
        'Review forecast assumptions weekly'
      ]
    });
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload) {
      const point = data.activePayload[0].payload;
      
      // Check if shift key is pressed
      const event = data?.event || window.event;
      if (event && event.shiftKey) {
        // Shift+click: add point to chatbot context and open chatbot
        setSelectedChartPoints(prev => [...prev, point]);
        setIsChatOpen(true);
        console.log('Sending to chatbot:', point);
      } else {
        // Regular click: show AI insights for this specific point
        setShowInsights({
          title: 'Forecast Point Analysis',
          type: 'chart',
          value: `${point.forecast || point.actual} units`,
          insights: [
            `Date: ${point.date}`,
            `Forecast: ${point.forecast ? point.forecast.toFixed(0) : 'N/A'} units`,
            `Confidence Interval: ${point.lowerBound?.toFixed(0)} - ${point.upperBound?.toFixed(0)}`,
            `Revenue Impact: $${((point.forecast || point.actual || 0) * 25).toFixed(2)}`
          ],
          recommendations: [
            'Consider inventory adjustments',
            'Review production capacity',
            'Validate against market trends'
          ]
        });
      }
    }
  };

  const handleShiftClick = (points: any[]) => {
    // Legacy handler for ChartCard compatibility
    // Now handled directly in handleChartClick
    setSelectedChartPoints(prev => [...prev, ...points]);
    setIsChatOpen(true);
  };

  const handleSendToChat = (data: any) => {
    setIsChatOpen(true);
    console.log('Sending insights to chat:', data);
  };

  const createScenario = (name: string, parameters: any) => {
    const scenarioData = forecastData.map(d => {
      if (d.forecast) {
        const adjustedForecast = d.forecast * (1 + parameters.growth / 100) * 
                                 (1 + parameters.seasonality / 100) *
                                 (1 + parameters.price / 100);
        const errorMargin = adjustedForecast * 0.1;
        return {
          ...d,
          forecast: adjustedForecast,
          lowerBound: adjustedForecast - errorMargin,
          upperBound: adjustedForecast + errorMargin
        };
      }
      return d;
    });

    const colors = ['#e930ff', '#5fd4d6', '#aa45dd', '#447799'];
    const newScenario: ScenarioData = {
      id: Date.now().toString(),
      name,
      color: colors[scenarios.length % colors.length],
      data: scenarioData,
      parameters,
      visible: true
    };

    setScenarios([...scenarios, newScenario]);
  };

  // Format currency with 2 decimal places
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatLargeCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return formatCurrency(value);
  };

  return (
    <ThemeProvider>
      <DashboardLayout
        title="Demand Forecast Engine"
        subtitle="AI-powered demand prediction and planning"
        icon="📈"
      >
        <UniversalDashboardFilters
          filters={demandForecastFilters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          title="Forecast Configuration"
          customStyles={{
            container: {
              background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
              border: '1px solid rgba(0, 224, 255, 0.2)'
            },
            label: {
              color: '#00e0ff',
              fontSize: '12px',
              fontWeight: 500
            },
            input: {
              background: 'rgba(10, 18, 36, 0.6)',
              border: '1px solid rgba(0, 224, 255, 0.3)',
              color: '#f7f9fb'
            },
            select: {
              background: 'rgba(10, 18, 36, 0.6)',
              border: '1px solid rgba(0, 224, 255, 0.3)',
              color: '#f7f9fb'
            }
          }}
        />

        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            color: '#00e0ff'
          }}>
            Loading forecast data...
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <KPICard
                value={kpis.totalVolume.toLocaleString()}
                label="Total Forecast Volume"
                icon="📦"
                trend={{
                  direction: kpis.growthRate > 0 ? 'up' : 'down',
                  value: `${Math.abs(kpis.growthRate).toFixed(1)}%`,
                  isPositive: kpis.growthRate > 0
                }}
                color="info"
                onClick={() => handleKPIClick({ label: 'Total Forecast Volume', value: kpis.totalVolume.toLocaleString() })}
              />
              <KPICard
                value={formatLargeCurrency(kpis.totalRevenue)}
                label="Forecast Revenue"
                icon="💰"
                trend={{
                  direction: 'up',
                  value: '+12%',
                  isPositive: true
                }}
                color="success"
                onClick={() => handleKPIClick({ label: 'Forecast Revenue', value: formatLargeCurrency(kpis.totalRevenue) })}
              />
              <KPICard
                value={`${kpis.accuracy.toFixed(1)}%`}
                label="Forecast Accuracy"
                icon="🎯"
                trend={{
                  direction: 'up',
                  value: '+2.1%',
                  isPositive: true
                }}
                color="info"
                onClick={() => handleKPIClick({ label: 'Forecast Accuracy', value: `${kpis.accuracy.toFixed(1)}%` })}
              />
              <KPICard
                value={kpis.trend}
                label="Demand Trend"
                icon="📊"
                trend={{
                  direction: kpis.trend === 'Increasing' ? 'up' : kpis.trend === 'Decreasing' ? 'down' : 'up',
                  value: 'Steady',
                  isPositive: kpis.trend !== 'Decreasing'
                }}
                color="warning"
                onClick={() => handleKPIClick({ label: 'Demand Trend', value: kpis.trend })}
              />
              <KPICard
                value={`${kpis.seasonalImpact.toFixed(0)}%`}
                label="Seasonal Impact"
                icon="🌊"
                trend={{
                  direction: 'up',
                  value: 'Strong',
                  isPositive: false
                }}
                color="info"
                onClick={() => handleKPIClick({ label: 'Seasonal Impact', value: `${kpis.seasonalImpact.toFixed(0)}%` })}
              />
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '2.5rem',
              marginTop: '2rem',
              paddingBottom: '2rem'
            }}>
              <ChartCard
                title="Forecast Horizon Explorer"
                subtitle="Click for insights, Shift+Click to select multiple points"
                icon="📈"
                onChartClick={handleChartClick}
                onShiftClick={handleShiftClick}
                onRequestInsights={() => setShowInsights({
                  title: 'Forecast Analysis',
                  type: 'chart',
                  value: 'Complete Forecast',
                  insights: [
                    'Demand is trending upward with seasonal peaks',
                    'Confidence intervals widen further into the future',
                    'Holiday season shows strongest demand patterns'
                  ],
                  recommendations: [
                    'Increase inventory for peak periods',
                    'Monitor early indicators for forecast adjustments',
                    'Prepare capacity for seasonal surge'
                  ]
                })}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {['week', 'month', 'quarter', 'year'].map(horizon => (
                      <button
                        key={horizon}
                        onClick={() => {
                          setSelectedHorizon(horizon as any);
                          handleFilterChange({ forecast_horizon: horizon });
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          border: 'none',
                          background: selectedHorizon === horizon ? '#00e0ff' : '#232a36',
                          color: selectedHorizon === horizon ? '#0a1224' : '#f7f9fb',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          fontWeight: selectedHorizon === horizon ? 600 : 400,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {horizon === 'week' ? 'Weekly' : 
                         horizon === 'month' ? 'Monthly' :
                         horizon === 'quarter' ? 'Quarterly' : 'Yearly'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['quantity', 'revenue'].map(metric => (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric as any)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          border: 'none',
                          background: selectedMetric === metric ? '#00e0ff' : '#232a36',
                          color: selectedMetric === metric ? '#0a1224' : '#f7f9fb',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          fontWeight: selectedMetric === metric ? 600 : 400,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {metric === 'quantity' ? '📦 Quantity' : '💰 Revenue'}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={550}>
                  <ComposedChart data={forecastData} onClick={handleChartClick}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#f7f9fb"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      stroke="#f7f9fb"
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: selectedMetric === 'quantity' ? 'Units' : 'Revenue ($)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: '#f7f9fb' }
                      }}
                      tickFormatter={(value) => selectedMetric === 'revenue' ? formatLargeCurrency(value) : value}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e2738',
                        border: '1px solid #00e0ff',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#f7f9fb' }}
                      formatter={(value: any) => selectedMetric === 'revenue' ? formatCurrency(value) : value}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#f7f9fb' }}
                    />
                    
                    {selectedMetric === 'quantity' ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="#00e0ff"
                          strokeWidth={3}
                          dot={false}
                          name="Historical"
                        />
                        <Area
                          type="monotone"
                          dataKey="upperBound"
                          stackId="1"
                          stroke="transparent"
                          fill="#e930ff"
                          fillOpacity={0.15}
                          name="Upper Bound"
                        />
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          stackId="2"
                          stroke="#e930ff"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          fill="transparent"
                          name="Forecast"
                        />
                        <Area
                          type="monotone"
                          dataKey="lowerBound"
                          stackId="3"
                          stroke="transparent"
                          fill="#e930ff"
                          fillOpacity={0.15}
                          name="Lower Bound"
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          type="monotone"
                          dataKey="actualRevenue"
                          stroke="#00ff88"
                          strokeWidth={3}
                          dot={false}
                          name="Historical Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="forecastRevenue"
                          stroke="#e930ff"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Forecast Revenue"
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: '500px' }}>
                <ChartCard
                  title="Model Performance Analyzer"
                  subtitle="Forecast accuracy metrics"
                  icon="🎯"
                  onChartClick={handleChartClick}
                  onShiftClick={handleShiftClick}
                  onRequestInsights={() => setShowInsights({
                    title: 'Model Performance',
                    type: 'performance',
                    value: `${kpis.accuracy.toFixed(1)}% Accuracy`,
                    insights: [
                      'Model accuracy exceeds benchmark by 2.3%',
                      'Error metrics show consistent improvement',
                      'MAPE below 5% indicates strong predictive power'
                    ],
                    recommendations: [
                      'Continue with current model configuration',
                      'Consider ensemble methods for further improvement',
                      'Monitor for seasonal pattern changes'
                    ]
                  })}
                >
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={modelPerformance} onClick={handleChartClick}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                      <XAxis dataKey="metric" stroke="#f7f9fb" />
                      <YAxis stroke="#f7f9fb" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e2738',
                          border: '1px solid #00e0ff',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#00e0ff" radius={[8, 8, 0, 0]}>
                        {modelPerformance.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.value < entry.benchmark ? '#00ff88' : '#e930ff'} 
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="benchmark" fill="#3a4459" fillOpacity={0.5} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#232a36', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {modelPerformance.map((metric) => (
                        <div key={metric.metric}>
                          <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>{metric.metric}</div>
                          <div style={{ fontSize: '20px', color: '#00e0ff', fontWeight: 600 }}>
                            {metric.value.toFixed(2)} {metric.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Seasonal Pattern Detector"
                  subtitle="Monthly seasonality index"
                  icon="🌊"
                  onChartClick={handleChartClick}
                  onShiftClick={handleShiftClick}
                  onRequestInsights={() => setShowInsights({
                    title: 'Seasonal Patterns',
                    type: 'seasonality',
                    value: 'Strong Seasonality',
                    insights: [
                      'Peak demand in November-December (30% above average)',
                      'Lowest demand in January-February (15% below average)',
                      'Summer months show moderate increase (10-20% above average)'
                    ],
                    recommendations: [
                      'Plan inventory buildup before Q4',
                      'Adjust staffing for seasonal peaks',
                      'Consider promotional activities during low seasons'
                    ]
                  })}
                >
                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={seasonalPatterns} onClick={handleChartClick}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                      <XAxis dataKey="month" stroke="#f7f9fb" />
                      <YAxis stroke="#f7f9fb" domain={[0.7, 1.4]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e2738',
                          border: '1px solid #00e0ff',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="index"
                        stroke="#00e0ff"
                        strokeWidth={3}
                        fill="#00e0ff"
                        fillOpacity={0.3}
                        name="Seasonal Index"
                      />
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        stroke="#f7f9fb"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Baseline (1.0)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#232a36', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>Pattern Strength</div>
                        <div style={{ fontSize: '24px', color: '#00e0ff', fontWeight: 600 }}>85%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>Peak Season</div>
                        <div style={{ fontSize: '16px', color: '#e930ff', fontWeight: 600 }}>December</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.7 }}>Low Season</div>
                        <div style={{ fontSize: '16px', color: '#5fd4d6', fontWeight: 600 }}>January</div>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', minHeight: '500px' }}>
                <ChartCard
                  title="Forecast Scenario Builder"
                  subtitle="Create and compare what-if scenarios"
                  icon="🔮"
                  onChartClick={handleChartClick}
                  onShiftClick={handleShiftClick}
                  onRequestInsights={() => setShowInsights({
                    title: 'Scenario Analysis',
                    type: 'scenarios',
                    value: `${scenarios.length} Scenarios`,
                    insights: [
                      'Optimistic scenario shows 25% revenue increase',
                      'Pessimistic scenario maintains baseline volume',
                      'Most likely scenario aligns with current forecast'
                    ],
                    recommendations: [
                      'Prepare contingency plans for each scenario',
                      'Monitor leading indicators for scenario triggers',
                      'Update scenarios based on market changes'
                    ]
                  })}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <button
                      onClick={() => createScenario('Optimistic', { growth: 20, seasonality: 10, price: 5 })}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#00e0ff',
                        color: '#0a1224',
                        cursor: 'pointer',
                        fontWeight: 600,
                        marginRight: '0.5rem'
                      }}
                    >
                      + Add Optimistic Scenario
                    </button>
                    <button
                      onClick={() => createScenario('Pessimistic', { growth: -10, seasonality: -5, price: -5 })}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#e930ff',
                        color: '#f7f9fb',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      + Add Pessimistic Scenario
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={forecastData} onClick={handleChartClick}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" opacity={0.2} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#f7f9fb"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis stroke="#f7f9fb" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e2738',
                          border: '1px solid #00e0ff',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#00e0ff"
                        strokeWidth={3}
                        dot={false}
                        name="Baseline"
                      />
                      
                      {scenarios.filter(s => s.visible).map((scenario) => (
                        <Line
                          key={scenario.id}
                          type="monotone"
                          data={scenario.data}
                          dataKey="forecast"
                          stroke={scenario.color}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name={scenario.name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ChartCard
                    title="Demand Drivers"
                    subtitle="Factor contribution analysis"
                    icon="🎛️"
                    onChartClick={handleChartClick}
                    onShiftClick={handleShiftClick}
                    onRequestInsights={() => setShowInsights({
                      title: 'Demand Drivers Analysis',
                      type: 'drivers',
                      value: 'Factor Breakdown',
                      insights: [
                        'Base demand accounts for 45% of total volume',
                        'Seasonal effects contribute 25% impact on demand',
                        'Promotional activities drive 15% of sales volume',
                        'Price elasticity shows 10% influence on demand'
                      ],
                      recommendations: [
                        'Focus on maintaining strong base demand',
                        'Leverage seasonal patterns for inventory planning',
                        'Optimize promotional calendar for maximum impact',
                        'Consider price optimization strategies'
                      ]
                    })}
                  >
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={demandDrivers} layout="horizontal" onClick={handleChartClick}>
                        <XAxis type="number" stroke="#f7f9fb" />
                        <YAxis type="category" dataKey="driver" stroke="#f7f9fb" width={100} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e2738',
                            border: '1px solid #00e0ff',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => `${value}%`}
                        />
                        <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                          {demandDrivers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            </div>
          </>
        )}

        <ChatbotButton 
          onClick={() => setIsChatOpen(!isChatOpen)}
          isOpen={isChatOpen}
        />
        
        <BusinessIntelligenceTrigger
          onClick={() => setIsBIOpen(true)}
          count={selectedChartPoints.length}
        />
        
        {isChatOpen && (
          <UniversalChatbot
            defaultAgent="sales"
            onClose={() => setIsChatOpen(false)}
            dashboardContext={{
              source_dashboard: 'demand_forecast',
              metrics: kpis,
              selectedPoints: selectedChartPoints,
              forecastHorizon: selectedHorizon,
              scenarios: scenarios.map(s => ({ name: s.name, parameters: s.parameters }))
            }}
          />
        )}
        
        {isBIOpen && (
          <DemandForecastBIAgent
            forecastData={forecastData}
            metrics={kpis}
            isVisible={isBIOpen}
            onClose={() => setIsBIOpen(false)}
          />
        )}
        
        {showInsights && (
          <AIInsightsPopup
            data={showInsights}
            position={{ x: window.innerWidth / 2 - 200, y: 100 }}
            onClose={() => setShowInsights(null)}
            onSendToChat={handleSendToChat}
          />
        )}
      </DashboardLayout>
    </ThemeProvider>
  );
}