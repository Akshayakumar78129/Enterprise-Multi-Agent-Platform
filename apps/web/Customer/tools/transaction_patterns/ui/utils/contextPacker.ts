/**
 * Context Packer Utilities
 * Handles packaging dashboard context for cross-agent queries
 */

// Local type definitions for Transaction Patterns dashboard
export interface TransactionCustomer {
  customer_id: number;
  name: string;
  transaction_count: number;
  total_amount: number;
  avg_order_value: number;
  last_transaction_date: string;
  frequency_score?: number;
  monetary_score?: number;
  recency_score?: number;
  segment?: string;
  risk_level?: string;
}

export interface ChartContext {
  chartType: string;
  chartName: string;
  clickedElement: string;
  selectedData?: any;
  timestamp: string;
}

export interface TransactionPatternsState {
  customers: TransactionCustomer[];
  filters: {
    segment?: string;
    dateRange?: { start: string; end: string };
    search?: string;
  };
  chatContext?: ChartContext;
  kpis?: {
    total_revenue?: number;
    total_transactions?: number;
    avg_transaction_value?: number;
    unique_customers?: number;
  };
}

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
  active_customer?: TransactionCustomer;
  total_customers: number;
  high_value_customers: number;
  avg_transaction_value: number;
  customer_list?: TransactionCustomer[];
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
  total_transactions: number;
  total_revenue: number;
  avg_transaction_value: number;
  high_value_count?: number;
  medium_value_count?: number;
  low_value_count?: number;
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
  state: TransactionPatternsState,
  additionalContext?: Partial<DashboardContext>
): DashboardContext => {
  const { customers, filters, chatContext, kpis } = state;
  
  // Calculate customer statistics
  const totalCustomers = customers.length;
  const highValueCustomers = customers.filter(c => 
    c.avg_order_value > 1000 || c.segment === 'VIP'
  ).length;
  const avgTransactionValue = totalCustomers > 0 
    ? customers.reduce((sum, c) => sum + c.avg_order_value, 0) / totalCustomers 
    : 0;

  // Determine active customer from chart context or recent interaction
  let activeCustomer: TransactionCustomer | undefined;
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
    high_value_customers: highValueCustomers,
    avg_transaction_value: avgTransactionValue,
    // Include customer list for complex queries (limit to prevent payload bloat)
    customer_list: customers.slice(0, 100) // Top 100 customers
  };

  // Pack filter context
  const appliedFilters: string[] = [];
  if (filters.segment) appliedFilters.push(`Segment: ${filters.segment}`);
  if (filters.search) appliedFilters.push(`Search: ${filters.search}`);
  if (filters.dateRange) appliedFilters.push(`Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}`);

  const filterContext: FilterContext = {
    search: filters.search,
    applied_filters: appliedFilters,
    filter_count: appliedFilters.length
  };

  // Pack KPI context
  const kpiContext: KPIContext = {
    total_customers: totalCustomers,
    total_transactions: kpis?.total_transactions || 0,
    total_revenue: kpis?.total_revenue || 0,
    avg_transaction_value: kpis?.avg_transaction_value || avgTransactionValue,
    high_value_count: highValueCustomers
  };

  // Pack session context
  const sessionContext: SessionContext = {
    last_chart_interaction: chatContext?.chartName,
    conversation_history_count: 0, // This would be tracked separately
    active_features: ['transaction_patterns', 'temporal_analysis', 'product_analysis'],
    user_focus_area: chatContext?.chartType
  };

  const context: DashboardContext = {
    source_dashboard: 'transaction_patterns',
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
            total_amount: c.total_amount,
            transaction_count: c.transaction_count
          } as TransactionCustomer));
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
    summary.push(`Customers: ${context.customer_context.total_customers} total, ${context.customer_context.high_value_customers} high-value`);
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