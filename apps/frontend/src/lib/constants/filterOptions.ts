/**
 * Centralized Filter Options
 *
 * This file defines standardized filter options used across all dashboards.
 * Using centralized options ensures consistency in filter dropdowns and prevents
 * mismatches between dashboards showing the same data.
 *
 * CRITICAL: All dashboards MUST import from this file instead of defining their own options.
 * This ensures cross-dashboard consistency as required by the implementation guide.
 */

// ===== CUSTOMER SEGMENT OPTIONS =====
// Used for business customer type classification
export const CUSTOMER_SEGMENT_OPTIONS = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'mid_market', label: 'Mid-Market' },
  { value: 'small_business', label: 'Small Business' },
  { value: 'startup', label: 'Startup' },
  { value: 'individual', label: 'Individual' }
] as const;

// ===== RFM SEGMENT OPTIONS =====
// Used for RFM (Recency, Frequency, Monetary) segmentation analysis
export const RFM_SEGMENT_OPTIONS = [
  { value: 'champions', label: 'Champions' },
  { value: 'loyal_customers', label: 'Loyal Customers' },
  { value: 'potential_loyalists', label: 'Potential Loyalists' },
  { value: 'new_customers', label: 'New Customers' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'cant_lose_them', label: "Can't Lose Them" },
  { value: 'hibernating', label: 'Hibernating' },
  { value: 'lost', label: 'Lost' }
] as const;

// ===== REGION OPTIONS =====
// Standardized geographic regions
export const REGION_OPTIONS = [
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
  { value: 'latin_america', label: 'Latin America' },
  { value: 'middle_east_africa', label: 'Middle East & Africa' }
] as const;

// ===== VALUE CATEGORY OPTIONS =====
// Customer value tier classifications
export const VALUE_CATEGORY_OPTIONS = [
  { value: 'high_value', label: 'High Value' },
  { value: 'medium_high_value', label: 'Medium-High Value' },
  { value: 'medium_value', label: 'Medium Value' },
  { value: 'medium_low_value', label: 'Medium-Low Value' },
  { value: 'low_value', label: 'Low Value' }
] as const;

// ===== RISK LEVEL OPTIONS =====
// Churn risk classifications
// IMPORTANT: Values must match ML predictor output format (see ml_predictor.py get_risk_level)
export const RISK_LEVEL_OPTIONS = [
  { value: 'Very High', label: 'Very High' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
] as const;

// ===== BEHAVIOR TYPE OPTIONS =====
// Customer behavior pattern classifications
export const BEHAVIOR_TYPE_OPTIONS = [
  { value: 'frequent_purchasers', label: 'Frequent Purchasers' },
  { value: 'regular_purchasers', label: 'Regular Purchasers' },
  { value: 'occasional_purchasers', label: 'Occasional Purchasers' },
  { value: 'rare_purchasers', label: 'Rare Purchasers' },
  { value: 'new_purchasers', label: 'New Purchasers' },
  { value: 'inactive', label: 'Inactive' }
] as const;

// ===== ENGAGEMENT LEVEL OPTIONS =====
// Customer engagement level classifications for engagement dashboard
export const ENGAGEMENT_LEVEL_OPTIONS = [
  { value: 'High', label: 'High Engagement' },
  { value: 'Medium', label: 'Medium Engagement' },
  { value: 'Low', label: 'Low Engagement' }
] as const;

// ===== LOYALTY STATUS OPTIONS =====
// Customer loyalty status classifications for engagement dashboard
export const LOYALTY_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Active, Loyal', label: 'Active, Loyal' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Active, New', label: 'Active, New' },
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Lost', label: 'Lost' }
] as const;

// ===== DEFAULT DATE RANGE =====
// Standardized default date range matching dataset timeframe
export const DEFAULT_DATE_RANGE = {
  startDate: '2017-01-01',
  endDate: '2021-12-31'
} as const;

// ===== TYPE EXPORTS FOR TYPESCRIPT =====
export type CustomerSegmentValue = typeof CUSTOMER_SEGMENT_OPTIONS[number]['value'];
export type RfmSegmentValue = typeof RFM_SEGMENT_OPTIONS[number]['value'];
export type RegionValue = typeof REGION_OPTIONS[number]['value'];
export type ValueCategoryValue = typeof VALUE_CATEGORY_OPTIONS[number]['value'];
export type RiskLevelValue = typeof RISK_LEVEL_OPTIONS[number]['value'];
export type BehaviorTypeValue = typeof BEHAVIOR_TYPE_OPTIONS[number]['value'];
export type EngagementLevelValue = typeof ENGAGEMENT_LEVEL_OPTIONS[number]['value'];
export type LoyaltyStatusValue = typeof LOYALTY_STATUS_OPTIONS[number]['value'];
