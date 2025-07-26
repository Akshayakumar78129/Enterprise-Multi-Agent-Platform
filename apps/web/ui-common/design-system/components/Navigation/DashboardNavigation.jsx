import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ChartBarSquareIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon,
  UserCircleIcon,
  ArrowTrendingUpIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArrowPathIcon,
  GlobeAmericasIcon,
  CalendarDaysIcon,
  SparklesIcon,
  FireIcon,
  AdjustmentsHorizontalIcon,
  CubeTransparentIcon,
  ScaleIcon,
  TruckIcon,
  ChartPieIcon,
  BanknotesIcon,
  EyeIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  LightBulbIcon,
  FunnelIcon,
  TagIcon,
  RocketLaunchIcon,
  DocumentChartBarIcon,
  ComputerDesktopIcon,
  PuzzlePieceIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

// Safe Icon Wrapper Component
const SafeIcon = ({ IconComponent, style, fallbackIcon: FallbackIcon = AdjustmentsHorizontalIcon }) => {
  if (!IconComponent || typeof IconComponent !== 'function') {
    console.warn('Icon component is undefined, using fallback');
    return <FallbackIcon style={style} />;
  }
  return <IconComponent style={style} />;
};

const DashboardNavigation = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [expandedDomains, setExpandedDomains] = useState({});
  const [hoveredTool, setHoveredTool] = useState(null);

  // Enterprise IQ Design Tokens
  const colors = {
    midnightNavy: '#0a1224',
    electricCyan: '#00e0ff',
    signalMagenta: '#e930ff',
    graphite: '#232a36',
    graphiteLight: '#3a4459',
    cloudWhite: '#f7f9fb',
    lighterCyan: '#5fd4d6',
    teal: '#43cad0',
    overlay50: 'rgba(10, 18, 36, 0.5)',
    overlay20: 'rgba(10, 18, 36, 0.2)',
  };

  const toggleDomain = (domain) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  const navigateTo = (path) => {
    try {
      router.push(path);
      onClose?.();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const dashboards = {
    customer: {
      title: 'Customer Analytics',
      icon: UsersIcon,
      color: colors.electricCyan,
      tools: [
        { name: 'Transaction Patterns', path: '/customers/transaction-patterns', icon: ChartBarSquareIcon, description: 'Analyze transaction patterns and temporal trends' },
        { name: 'Churn Prediction', path: '/customers/churn', icon: ShieldExclamationIcon, description: 'Predict customer churn with ML models' },
        { name: 'Customer Behavior', path: '/customers/behaviour', icon: UserCircleIcon, description: 'Deep dive into customer behavior patterns' },
        { name: 'Customer Segmentation', path: '/customers/segmentation', icon: FunnelIcon, description: 'Segment customers using advanced clustering' },
        { name: 'Lifetime Value', path: '/customers/customer-lifetime-value', icon: CurrencyDollarIcon, description: 'Calculate and predict customer LTV' },
        { name: 'Purchase Frequency', path: '/customers/purchase-frequency', icon: ClockIcon, description: 'Analyze customer purchase frequency patterns' },
        { name: 'Anomaly Detection', path: '/customers/anomaly', icon: MagnifyingGlassIcon, description: 'Detect anomalous customer behavior' },
        { name: 'Engagement Classifier', path: '/customers/engagement', icon: FireIcon, description: 'Classify customer engagement levels' },
        { name: 'Next Purchase', path: '/customers/next-purchase', icon: ShoppingCartIcon, description: 'Predict next purchase timing and products' },
        { name: 'Retention Planner', path: '/customers/retention-planner', icon: UserPlusIcon, description: 'Plan customer retention strategies' },
        { name: 'Performance Deviation', path: '/customers/performance-deviation', icon: ArrowTrendingUpIcon, description: 'Analyze KPI performance deviations' }
      ]
    },
    sales: {
      title: 'Sales Analytics',
      icon: RocketLaunchIcon,
      color: colors.signalMagenta,
      tools: [
        { name: 'Product Performance', path: '/sales/product-performance', icon: TagIcon, description: 'Analyze product sales and margin performance' },
        { name: 'Sales Performance', path: '/sales/sales-performance', icon: DocumentChartBarIcon, description: 'Multi-dimensional sales performance analysis' },
        { name: 'Regional Sales', path: '/sales/regional-sales-analyzer', icon: GlobeAmericasIcon, description: 'Geographic sales performance insights' },
        { name: 'Sales Trends', path: '/sales/sales-trends', icon: ChartBarSquareIcon, description: 'Time-series sales trend analysis' },
        { name: 'Demand Forecast', path: '/sales/demand-forecast', icon: LightBulbIcon, description: 'Predictive demand forecasting' },
        { name: 'Performance Utils', path: '/sales/performance-utils', icon: AdjustmentsHorizontalIcon, description: 'Core sales performance utilities' }
      ]
    },
    inventory: {
      title: 'Inventory Management',
      icon: BuildingStorefrontIcon,
      color: colors.lighterCyan,
      tools: [
        { name: 'Inventory Levels', path: '/inventory/inventory-level-analyzer', icon: EyeIcon, description: 'Monitor and analyze inventory levels' },
        { name: 'Holding Costs', path: '/inventory/holding-cost-analyzer', icon: BanknotesIcon, description: 'Analyze inventory holding costs' },
        { name: 'Slow Moving Stock', path: '/inventory/slow-moving-analyzer', icon: ClockIcon, description: 'Identify slow-moving inventory' },
        { name: 'Stock Optimization', path: '/inventory/stock-optimization', icon: TruckIcon, description: 'Optimize stock levels and reorder points' },
        { name: 'Optimization Hub', path: '/inventory/optimization-analyzer', icon: PuzzlePieceIcon, description: 'Comprehensive inventory optimization' }
      ]
    },
    finance: {
      title: 'Financial Analysis',
      icon: CurrencyDollarIcon,
      color: colors.teal,
      tools: [
        { name: 'Financial Dashboard', path: '/finance/financial-tool', icon: BanknotesIcon, description: 'Cash flow and financial KPI analysis' }
      ]
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.overlay50,
          zIndex: 300
        }}
        onClick={onClose}
      />
      
      {/* Navigation Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '380px',
        backgroundColor: colors.midnightNavy,
        zIndex: 350,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflowY: 'auto',
        fontFamily: "'Inter', sans-serif"
      }}>
        
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          backgroundColor: colors.midnightNavy,
          borderBottom: `1px solid ${colors.graphiteLight}`,
          padding: '20px 24px',
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: colors.cloudWhite,
                lineHeight: 1.2
              }}>
                Enterprise IQ
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: colors.cloudWhite,
                opacity: 0.7
              }}>
                Dashboard Navigation
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: colors.cloudWhite,
                opacity: 0.7,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.graphite;
                e.currentTarget.style.opacity = '1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.opacity = '0.7';
              }}
            >
              <SafeIcon IconComponent={XMarkIcon} style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Navigation Content */}
        <div style={{ padding: '16px 20px 24px 20px' }}>
          
          {/* AI Canvas Link */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => navigateTo('/')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: colors.electricCyan,
                border: 'none',
                borderRadius: '12px',
                color: colors.midnightNavy,
                fontWeight: 600,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: `0 0 20px ${colors.electricCyan}40`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 25px ${colors.electricCyan}60`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 0 20px ${colors.electricCyan}40`;
              }}
            >
              <SafeIcon IconComponent={SparklesIcon} style={{ width: '24px', height: '24px' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>AI Canvas</div>
                <div style={{ 
                  fontSize: '12px', 
                  opacity: 0.8,
                  marginTop: '2px' 
                }}>
                  Conversational Analytics
                </div>
              </div>
            </button>
          </div>

          {/* Domain Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(dashboards).map(([domain, config]) => {
              const isExpanded = expandedDomains[domain];
              const DomainIcon = config.icon;
              
              return (
                <div key={domain}>
                  {/* Domain Header */}
                  <button
                    onClick={() => toggleDomain(domain)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: colors.graphite,
                      border: `1px solid ${colors.graphiteLight}`,
                      borderRadius: '8px',
                      color: colors.cloudWhite,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = colors.graphiteLight;
                      e.currentTarget.style.borderColor = config.color;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = colors.graphite;
                      e.currentTarget.style.borderColor = colors.graphiteLight;
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px' 
                    }}>
                      <SafeIcon 
                        IconComponent={DomainIcon}
                        style={{ 
                          width: '20px', 
                          height: '20px',
                          color: config.color
                        }}
                      />
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>
                        {config.title}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: colors.graphiteLight,
                        color: colors.cloudWhite,
                        padding: '2px 6px',
                        borderRadius: '10px',
                        opacity: 0.8
                      }}>
                        {config.tools.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <SafeIcon 
                        IconComponent={ChevronDownIcon}
                        style={{ 
                          width: '16px', 
                          height: '16px',
                          color: config.color
                        }}
                      />
                    ) : (
                      <SafeIcon 
                        IconComponent={ChevronRightIcon}
                        style={{ 
                          width: '16px', 
                          height: '16px',
                          opacity: 0.7
                        }}
                      />
                    )}
                  </button>

                  {/* Tools List */}
                  {isExpanded && (
                    <div style={{ 
                      marginTop: '8px',
                      marginLeft: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {config.tools.map((tool) => {
                        const ToolIcon = tool.icon;
                        const toolKey = `${domain}-${tool.name}`;
                        const isHovered = hoveredTool === toolKey;
                        
                        return (
                          <button
                            key={tool.path}
                            onClick={() => navigateTo(tool.path)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              padding: '10px 12px',
                              backgroundColor: isHovered ? colors.graphite : 'transparent',
                              border: 'none',
                              borderRadius: '6px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={() => setHoveredTool(toolKey)}
                            onMouseLeave={() => setHoveredTool(null)}
                          >
                            <SafeIcon 
                              IconComponent={ToolIcon}
                              style={{ 
                                width: '16px', 
                                height: '16px',
                                marginTop: '2px',
                                color: colors.cloudWhite,
                                opacity: 0.7,
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div 
                                style={{
                                  fontWeight: 500,
                                  fontSize: '13px',
                                  color: isHovered ? config.color : colors.cloudWhite,
                                  transition: 'color 0.2s ease'
                                }}
                              >
                                {tool.name}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: colors.cloudWhite,
                                opacity: 0.6,
                                lineHeight: 1.4,
                                marginTop: '2px'
                              }}>
                                {tool.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: colors.midnightNavy,
          borderTop: `1px solid ${colors.graphiteLight}`,
          padding: '16px 24px',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            fontSize: '11px',
            color: colors.cloudWhite,
            opacity: 0.5
          }}>
            Enterprise IQ Business Intelligence Platform
          </p>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '11px',
            color: colors.cloudWhite,
            opacity: 0.4
          }}>
            {Object.values(dashboards).reduce((total, domain) => total + domain.tools.length, 0)} Dashboards Available
          </p>
        </div>
      </div>
    </>
  );
};

export default DashboardNavigation; 