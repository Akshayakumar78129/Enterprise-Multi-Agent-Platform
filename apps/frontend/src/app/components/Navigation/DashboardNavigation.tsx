import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  X,
  BarChart3,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  UserCircle,
  ShieldAlert,
  Clock,
  RefreshCw,
  Globe,
  Calendar,
  Sparkles,
  Flame,
  Settings2,
  Box,
  Scale,
  Truck,
  PieChart,
  Banknote,
  Eye,
  Beaker,
  Search,
  UserPlus,
  ShoppingCart,
  Lightbulb,
  Filter,
  Tag,
  Rocket,
  FileBarChart,
  Monitor,
  Puzzle,
  Package,
  Activity,
  GitBranch
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  description?: string;
  isNew?: boolean;
  children?: NavigationItem[];
}

interface DashboardNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const navigationItems: NavigationItem[] = [
    {
      name: 'Conversational Canvas',
      href: '/',
      icon: Sparkles,
      description: 'AI-Powered Interactive Workspace',
    },
    {
      name: 'Customer Analytics',
      icon: Users,
      children: [
        {
          name: 'Churn Prediction',
          href: '/churn-prediction',
          icon: ShieldAlert,
          description: 'Predict customer churn risk',
        },
        {
          name: 'Customer Segmentation',
          href: '/customer-segmentation',
          icon: UserCircle,
          description: 'Segment customers by behavior',
        },
        {
          name: 'Customer Behavior',
          href: '/customer-behavior',
          icon: TrendingUp,
          description: 'Analyze customer patterns',
        },
        {
          name: 'Customer LTV',
          href: '/customer-lifetime-value',
          icon: DollarSign,
          description: 'Lifetime value analysis',
        },
        {
          name: 'Anomaly Detection',
          href: '/anomaly-detection',
          icon: ShieldAlert,
          description: 'Detect unusual patterns',
          isNew: true,
        },
        {
          name: 'Performance Deviation',
          href: '/performance-deviation',
          icon: Activity,
          description: 'Analyze performance variations',
          isNew: true,
        },
        {
          name: 'Purchase Frequency',
          href: '/purchase-frequency',
          icon: Clock,
          description: 'Purchase frequency patterns',
          isNew: true,
        },
        {
          name: 'Transaction Patterns',
          href: '/transaction-patterns',
          icon: GitBranch,
          description: 'Transaction pattern analysis',
          isNew: true,
        },
        {
          name: 'Engagement Classifier',
          href: '/engagement-classifier',
          icon: UserPlus,
          description: 'Customer engagement levels',
          isNew: true,
        },
        {
          name: 'Next Purchase',
          href: '/next-purchase',
          icon: ShoppingCart,
          description: 'Predict next purchases',
          isNew: true,
        },
        {
          name: 'Retention Planner',
          href: '/retention-planner',
          icon: Scale,
          description: 'Retention strategy planning',
          isNew: true,
        },
      ],
    },
    {
      name: 'Sales Analytics',
      icon: BarChart3,
      children: [
        {
          name: 'Revenue Analysis',
          href: '/sales-performance',
          icon: TrendingUp,
          description: 'Track sales metrics',
        },
        {
          name: 'Sales Forecast',
          href: '/sales-forecast',
          icon: Rocket,
          description: 'Predict future sales trends',
          isNew: true,
        },
        {
          name: 'Sales Team',
          href: '/sales-team',
          icon: Users,
          description: 'Team performance metrics',
          isNew: true,
        },
        {
          name: 'Market Insights',
          href: '/market-insights',
          icon: Globe,
          description: 'Market trends analysis',
          isNew: true,
        },
        {
          name: 'Product Performance',
          href: '/product-performance',
          icon: Package,
          description: 'Analyze product sales',
        },
      ],
    },
    {
      name: 'Inventory Analytics',
      icon: Box,
      children: [
        {
          name: 'Inventory Levels',
          href: '/inventory-level',
          icon: Package,
          description: 'Monitor current stock levels',
          isNew: true,
        },
        {
          name: 'Stock Optimization',
          href: '/stock-optimization',
          icon: Settings2,
          description: 'Optimize reorder points',
          isNew: true,
        },
        {
          name: 'Demand Forecast',
          href: '/demand-forecast',
          icon: TrendingUp,
          description: 'Predict future demand',
          isNew: true,
        },
        {
          name: 'Supplier Performance',
          href: '/supplier-performance',
          icon: Truck,
          description: 'Track vendor metrics',
          isNew: true,
        },
        {
          name: 'Warehouse Analytics',
          href: '/warehouse-analytics',
          icon: Building2,
          description: 'Storage optimization',
          isNew: true,
        },
        {
          name: 'Stock Levels',
          href: '/stock-levels',
          icon: Package,
          description: 'Monitor inventory',
        },
        {
          name: 'Demand Forecasting',
          href: '/demand-forecasting',
          icon: TrendingUp,
          description: 'Predict demand',
        },
      ],
    },
    {
      name: 'Finance Analytics',
      icon: DollarSign,
      children: [
        {
          name: 'Revenue Metrics',
          href: '/revenue-metrics',
          icon: TrendingUp,
          description: 'MRR, ARR, growth rates',
          isNew: true,
        },
        {
          name: 'Expense Analysis',
          href: '/expense-analysis',
          icon: PieChart,
          description: 'Cost and budget variance',
          isNew: true,
        },
        {
          name: 'Profitability Analysis',
          href: '/profitability-analysis',
          icon: Banknote,
          description: 'Margin analysis',
          isNew: true,
        },
        {
          name: 'Cash Flow',
          href: '/cash-flow',
          icon: RefreshCw,
          description: 'Cash flow analysis',
        },
        {
          name: 'Profitability',
          href: '/profitability',
          icon: TrendingUp,
          description: 'Profit analysis',
        },
      ],
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const Icon = item.icon;

    return (
      <div key={item.name} className="mb-1">
        <div
          className={`
            flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all
            ${level === 0 ? 'hover:bg-accent/10' : 'hover:bg-accent/5'}
            ${item.href ? 'group' : ''}
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.name);
            } else if (item.href) {
              handleNavigation(item.href);
            }
          }}
        >
          {hasChildren && (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          )}
          
          <Icon className="w-5 h-5 mr-3 text-accent" />
          
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-sm font-medium text-foreground group-hover:text-accent">
                {item.name}
              </span>
              {item.isNew && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full">
                  NEW
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Navigation Panel */}
      <div className="relative z-10 w-80 h-full bg-surface border-r border-border shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
            <p className="text-sm text-muted-foreground">Enterprise Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center text-sm text-muted-foreground">
            <Settings2 className="w-4 h-4 mr-2" />
            <span>Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavigation;
