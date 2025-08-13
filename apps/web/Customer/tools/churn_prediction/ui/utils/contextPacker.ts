/**
 * Context Packer Utilities
 * Handles packaging dashboard context for cross-agent queries
 */

import { ChurnCustomer, ChartContext, ChurnPredictionState } from '../state/churnPredictionSlice';

export interface DashboardContext {
  source_dashboard: string;
  timestamp: string;
  customer_context?: CustomerContext;
  chart_context?: ChartContext;
  filters: FilterContext;
  date_range?: DateRangeContext;
  kpis?: KPIContext;
  session_context?: SessionContext;
}

export interface CustomerContext {
  active_customer_id?: number;
  active_customer?: ChurnCustomer;
  total_customers: number;
  high_risk_customers: number;
  avg_churn_probability: number;
  customer_list?: ChurnCustomer[];
}

export interface FilterContext {
  risk_level?: string;
  search?: string;
  applied_filters: string[];
  filter_count: number;
}

export interface DateRangeContext {
  start_date?: string;
  end_date?: string;
  period?: string;
  is_custom_range: boolean;
}

export interface KPIContext {
  total_customers: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_churn_probability: number;
  retention_rate?: number;
  revenue_at_risk?: number;
}

export interface SessionContext {
  last_chart_interaction?: string;
  conversation_history_count: number;
  active_features: string[];
  user_focus_area?: string;
}

export interface AgentQueryPayload {
  context: DashboardContext;
  query: string;
  mentioned_agent: string;
  request_id: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Pack current dashboard state into context for agent queries
 */
export const packDashboardContext = (
  state: ChurnPredictionState,
  additionalContext?: Partial<DashboardContext>
): DashboardContext => {
  const { customers, filters, chatContext, kpis } = state;
  
  // Calculate customer statistics
  const totalCustomers = customers.length;
  const highRiskCustomers = customers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length;
  const mediumRiskCustomers = customers.filter(c => c.risk_level === 'Medium').length;
  const lowRiskCustomers = customers.filter(c => c.risk_level === 'Low').length;
  const avgChurnProb = totalCustomers > 0 
    ? customers.reduce((sum, c) => sum + c.churn_probability, 0) / totalCustomers 
    : 0;

  // Determine active customer from chart context or recent interaction
  let activeCustomer: ChurnCustomer | undefined;
  let activeCustomerId: number | undefined;
  
  if (chatContext?.selectedData?.customer_id) {
    activeCustomerId = chatContext.selectedData.customer_id;
    activeCustomer = customers.find(c => c.customer_id === activeCustomerId);
  }

  // Pack customer context
  const customerContext: CustomerContext = {
    active_customer_id: activeCustomerId,
    active_customer: activeCustomer,
    total_customers: totalCustomers,
    high_risk_customers: highRiskCustomers,
    avg_churn_probability: avgChurnProb,
    // Include customer list for complex queries (limit to prevent payload bloat)
    customer_list: customers.slice(0, 100) // Top 100 customers
  };

  // Pack filter context
  const appliedFilters: string[] = [];
  if (filters.riskLevel) appliedFilters.push(`Risk Level: ${filters.riskLevel}`);
  if (filters.search) appliedFilters.push(`Search: ${filters.search}`);

  const filterContext: FilterContext = {
    risk_level: filters.riskLevel,
    search: filters.search,
    applied_filters: appliedFilters,
    filter_count: appliedFilters.length
  };

  // Pack KPI context
  const kpiContext: KPIContext = {
    total_customers: totalCustomers,
    high_risk_count: highRiskCustomers,
    medium_risk_count: mediumRiskCustomers,
    low_risk_count: lowRiskCustomers,
    avg_churn_probability: avgChurnProb,
    retention_rate: kpis?.retention_rate,
    revenue_at_risk: kpis?.revenue_at_risk
  };

  // Pack session context
  const sessionContext: SessionContext = {
    last_chart_interaction: chatContext?.chartName,
    conversation_history_count: 0, // This would be tracked separately
    active_features: ['churn_prediction', 'risk_analysis'],
    user_focus_area: chatContext?.chartType
  };

  const context: DashboardContext = {
    source_dashboard: 'churn_prediction',
    timestamp: new Date().toISOString(),
    customer_context: customerContext,
    chart_context: chatContext || undefined,
    filters: filterContext,
    kpis: kpiContext,
    session_context: sessionContext,
    ...additionalContext
  };

  return context;
};

/**
 * Create agent query payload
 */
export const createAgentQueryPayload = (
  context: DashboardContext,
  query: string,
  mentionedAgent: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): AgentQueryPayload => {
  return {
    context,
    query: query.trim(),
    mentioned_agent: mentionedAgent,
    request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    priority
  };
};

/**
 * Extract relevant context based on query type
 */
export const optimizeContextForQuery = (
  context: DashboardContext,
  query: string,
  agentType: string
): DashboardContext => {
  const lowerQuery = query.toLowerCase();
  const optimizedContext = { ...context };

  // Optimize based on agent type and query content
  switch (agentType) {
    case 'sales_agent':
      // Sales agents need customer details and revenue context
      if (!lowerQuery.includes('customer') && !lowerQuery.includes('revenue')) {
        // Remove detailed customer list if not needed
        if (optimizedContext.customer_context) {
          optimizedContext.customer_context.customer_list = undefined;
        }
      }
      break;

    case 'support_agent':
      // Support agents need customer details and risk context
      break;

    case 'marketing_agent':
      // Marketing agents need segmentation and engagement context
      break;

    case 'finance_agent':
      // Finance agents need revenue and payment context
      if (optimizedContext.customer_context) {
        // Include only financial metrics
        optimizedContext.customer_context.customer_list = 
          optimizedContext.customer_context.customer_list?.map(c => ({
            ...c,
            // Keep only financial fields
            name: c.name,
            customer_id: c.customer_id,
            avg_order_value: c.avg_order_value,
            churn_probability: c.churn_probability,
            risk_level: c.risk_level
          } as ChurnCustomer));
      }
      break;

    default:
      // Keep full context for unknown agents
      break;
  }

  return optimizedContext;
};

/**
 * Validate context completeness
 */
export const validateContext = (context: DashboardContext): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} => {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!context.source_dashboard) missingFields.push('source_dashboard');
  if (!context.timestamp) missingFields.push('timestamp');

  // Check context completeness
  if (!context.customer_context) {
    warnings.push('No customer context available');
  } else if (context.customer_context.total_customers === 0) {
    warnings.push('No customers in current context');
  }

  if (!context.filters) {
    warnings.push('No filter context available');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
};

/**
 * Create context summary for logging/debugging
 */
export const createContextSummary = (context: DashboardContext): string => {
  const summary = [];
  
  summary.push(`Dashboard: ${context.source_dashboard}`);
  
  if (context.customer_context) {
    summary.push(`Customers: ${context.customer_context.total_customers} total, ${context.customer_context.high_risk_customers} high-risk`);
    if (context.customer_context.active_customer) {
      summary.push(`Active Customer: ${context.customer_context.active_customer.name} (ID: ${context.customer_context.active_customer.customer_id})`);
    }
  }
  
  if (context.filters.filter_count > 0) {
    summary.push(`Filters: ${context.filters.applied_filters.join(', ')}`);
  }
  
  if (context.chart_context) {
    summary.push(`Chart Context: ${context.chart_context.chartName} - ${context.chart_context.clickedElement}`);
  }
  
  return summary.join(' | ');
};