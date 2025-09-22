/**
 * Utility functions for determining product categories based on customer behavior
 * Matches the logic from web folder implementation
 */

interface CustomerData {
  avg_order_value?: number;
  frequency?: number;
  monetary?: number;
  total_spent?: number;
  lifetime_value?: number;
}

/**
 * Determine customer's primary product categories based on behavior patterns
 * This mimics how a SaaS/B2B company would categorize customer product usage
 */
export function getCustomerProductCategories(customer: CustomerData): string[] {
  const categories: string[] = [];
  const avgOrderValue = customer.avg_order_value || 0;
  const frequency = customer.frequency || 0;
  const monetary = customer.monetary || customer.total_spent || 0;
  const lifetimeValue = customer.lifetime_value || 0;

  // Core Platform users (regular, consistent usage)
  // High frequency indicates regular platform usage
  if (frequency > 10) {
    categories.push("Core Platform");
  }

  // Analytics Suite (high-value transactions)
  // Higher order values indicate advanced feature usage
  if (avgOrderValue > 300 || lifetimeValue > 20000) {
    categories.push("Analytics Suite");
  }

  // API Services (frequent small transactions)
  // Many small transactions indicate API usage
  if (frequency > 30 && avgOrderValue < 100) {
    categories.push("API Services");
  }

  // Professional Services (high monetary value)
  // High spending indicates professional service engagement
  if (monetary > 10000 || lifetimeValue > 50000) {
    categories.push("Professional Services");
  }

  // Support Packages (medium frequency, medium value)
  // Moderate usage with consistent value indicates support needs
  if (frequency > 5 && frequency < 20 && avgOrderValue > 100) {
    categories.push("Support Packages");
  }

  // Add-ons (any customer can have these)
  // All active customers likely have some add-ons
  if (frequency > 0) {
    categories.push("Add-ons");
  }

  // Default to Core Platform if no categories match
  return categories.length > 0 ? categories : ["Core Platform"];
}

/**
 * Determine if a customer matches a product category filter
 */
export function customerMatchesCategory(
  customer: CustomerData,
  filterCategories: string[]
): boolean {
  if (!filterCategories || filterCategories.length === 0) {
    return true; // No filter applied
  }

  const customerCategories = getCustomerProductCategories(customer);

  // Check if customer has any of the filtered categories
  return filterCategories.some(filterCat =>
    customerCategories.includes(filterCat)
  );
}

/**
 * Get category insights based on customer data
 */
export function getCategoryInsights(customer: CustomerData): {
  primary: string;
  usage: string;
  recommendation: string;
} {
  const categories = getCustomerProductCategories(customer);
  const avgOrderValue = customer.avg_order_value || 0;
  const frequency = customer.frequency || 0;

  let primary = categories[0] || "Core Platform";
  let usage = "Standard";
  let recommendation = "Maintain current service level";

  // Determine usage level
  if (frequency > 30 && avgOrderValue > 500) {
    usage = "Power User";
    recommendation = "Offer premium features and dedicated support";
  } else if (frequency > 15 || avgOrderValue > 300) {
    usage = "Active User";
    recommendation = "Encourage feature adoption and usage expansion";
  } else if (frequency < 5) {
    usage = "Light User";
    recommendation = "Increase engagement through training and onboarding";
  }

  // Adjust primary category based on highest value contribution
  if (categories.includes("Professional Services") && (customer.monetary || 0) > 10000) {
    primary = "Professional Services";
  } else if (categories.includes("Analytics Suite") && avgOrderValue > 300) {
    primary = "Analytics Suite";
  } else if (categories.includes("API Services") && frequency > 30) {
    primary = "API Services";
  }

  return {
    primary,
    usage,
    recommendation
  };
}

/**
 * Calculate category-based risk factors
 */
export function getCategoryRiskFactor(categories: string[]): number {
  let riskFactor = 1.0;

  // Different categories have different churn risk profiles
  if (categories.includes("Core Platform") && categories.length === 1) {
    riskFactor = 1.2; // Single product users have higher churn risk
  }

  if (categories.includes("Professional Services")) {
    riskFactor *= 0.7; // Professional services users are stickier
  }

  if (categories.includes("API Services")) {
    riskFactor *= 0.8; // API integration creates lock-in
  }

  if (categories.length >= 3) {
    riskFactor *= 0.85; // Multi-product users have lower churn
  }

  return riskFactor;
}