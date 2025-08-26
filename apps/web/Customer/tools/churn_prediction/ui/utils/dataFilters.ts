import { ChurnCustomer } from '../types';

export interface FilterState {
  dateRange: {
    type: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    startDate: Date;
    endDate: Date;
  };
  segments: string[];
  productCategories: string[];
  riskLevels: string[];
  selectedCustomerIds?: number[];
}

/**
 * Apply filters to customer data
 */
export function applyFilters(
  customers: ChurnCustomer[],
  filters: FilterState | null
): ChurnCustomer[] {
  if (!filters || !customers) return customers;

  let filteredCustomers = [...customers];

  // Apply date range filter
  if (filters.dateRange) {
    filteredCustomers = filteredCustomers.filter(customer => {
      // Check if customer has a date field (last_purchase_date, created_at, etc.)
      if (customer.last_purchase_date) {
        const customerDate = new Date(customer.last_purchase_date);
        return customerDate >= filters.dateRange.startDate && 
               customerDate <= filters.dateRange.endDate;
      }
      // If no date field, include the customer (don't filter out)
      return true;
    });
  }

  // Apply segment filter
  if (filters.segments && filters.segments.length > 0) {
    filteredCustomers = filteredCustomers.filter(customer => {
      // Map customer characteristics to segments
      const customerSegment = getCustomerSegment(customer);
      return filters.segments.includes(customerSegment);
    });
  }

  // Apply product category filter
  if (filters.productCategories && filters.productCategories.length > 0) {
    filteredCustomers = filteredCustomers.filter(customer => {
      // Map customer product usage to categories
      const customerCategory = getCustomerProductCategory(customer);
      return filters.productCategories.some(cat => 
        customerCategory.includes(cat)
      );
    });
  }

  // Apply risk level filter
  if (filters.riskLevels && filters.riskLevels.length > 0) {
    filteredCustomers = filteredCustomers.filter(customer => 
      filters.riskLevels.includes(customer.risk_level)
    );
  }

  // Apply individual customer selection filter
  if (filters.selectedCustomerIds && filters.selectedCustomerIds.length > 0) {
    filteredCustomers = filteredCustomers.filter(customer => 
      filters.selectedCustomerIds!.includes(customer.customer_id)
    );
  }

  return filteredCustomers;
}

/**
 * Determine customer segment based on their characteristics
 */
function getCustomerSegment(customer: ChurnCustomer): string {
  const clv = customer.customer_lifetime_value || 0;
  const totalSpent = customer.total_spent || 0;
  const frequency = customer.frequency || 0;
  
  // Enterprise: High CLV, high spending
  if (clv > 50000 || totalSpent > 30000) {
    return 'Enterprise';
  }
  
  // Mid-Market: Medium CLV and spending
  if (clv > 20000 || totalSpent > 10000) {
    return 'Mid-Market';
  }
  
  // Startup: Low CLV but high frequency (growing)
  if (clv < 10000 && frequency > 20) {
    return 'Startup';
  }
  
  // Government: Specific pattern (you can add more logic)
  if (customer.name?.toLowerCase().includes('gov') || 
      customer.name?.toLowerCase().includes('department')) {
    return 'Government';
  }
  
  // Non-Profit: Specific pattern
  if (customer.name?.toLowerCase().includes('foundation') || 
      customer.name?.toLowerCase().includes('charity')) {
    return 'Non-Profit';
  }
  
  // Default to Small Business
  return 'Small Business';
}

/**
 * Determine customer's primary product categories
 */
function getCustomerProductCategory(customer: ChurnCustomer): string[] {
  const categories: string[] = [];
  const avgOrderValue = customer.avg_order_value || 0;
  const frequency = customer.frequency || 0;
  const monetary = customer.monetary || 0;
  
  // Core Platform users (regular, consistent usage)
  if (frequency > 10) {
    categories.push('Core Platform');
  }
  
  // Analytics Suite (high-value transactions)
  if (avgOrderValue > 300) {
    categories.push('Analytics Suite');
  }
  
  // API Services (frequent small transactions)
  if (frequency > 30 && avgOrderValue < 100) {
    categories.push('API Services');
  }
  
  // Professional Services (high monetary value)
  if (monetary > 10000) {
    categories.push('Professional Services');
  }
  
  // Support Packages (medium frequency, medium value)
  if (frequency > 5 && frequency < 20 && avgOrderValue > 100) {
    categories.push('Support Packages');
  }
  
  // Add-ons (any customer can have these)
  if (frequency > 0) {
    categories.push('Add-ons');
  }
  
  return categories.length > 0 ? categories : ['Core Platform'];
}

/**
 * Calculate aggregated metrics for filtered data
 */
export function calculateFilteredMetrics(
  customers: ChurnCustomer[],
  allCustomers: ChurnCustomer[]
) {
  const filtered = customers.length;
  const total = allCustomers.length;
  const percentage = total > 0 ? (filtered / total) * 100 : 0;
  
  const avgChurnProb = customers.length > 0
    ? customers.reduce((sum, c) => sum + (c.churn_probability || 0), 0) / customers.length
    : 0;
    
  const highRiskCount = customers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length;
  
  const totalRevenue = customers.reduce((sum, c) => 
    sum + (c.customer_lifetime_value || 0), 0
  );
  
  return {
    totalCustomers: filtered,
    percentageOfTotal: percentage,
    avgChurnProbability: avgChurnProb,
    highRiskCustomers: highRiskCount,
    totalRevenueAtRisk: totalRevenue,
    filterImpact: {
      customersExcluded: total - filtered,
      percentageExcluded: total > 0 ? ((total - filtered) / total) * 100 : 0
    }
  };
}

/**
 * Get available segments from customer data
 */
export function getAvailableSegments(customers: ChurnCustomer[]): string[] {
  const segments = new Set<string>();
  customers.forEach(customer => {
    segments.add(getCustomerSegment(customer));
  });
  return Array.from(segments).sort();
}

/**
 * Get available product categories from customer data
 */
export function getAvailableCategories(customers: ChurnCustomer[]): string[] {
  const categories = new Set<string>();
  customers.forEach(customer => {
    getCustomerProductCategory(customer).forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}