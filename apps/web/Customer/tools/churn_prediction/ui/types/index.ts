export type ChurnRiskLevel = 'Low' | 'Medium' | 'High' | 'Very High';

export interface ChurnCustomer {
  customer_id: number;
  name: string;
  rfm: number;
  last_purchase_date: string;
  frequency: number;
  avg_order_value: number;
  churn_probability: number;
  risk_level: ChurnRiskLevel;
}

export interface ChurnKPI {
  overallRisk: number;
  highRiskCount: number;
  modelConfidence: number;
  topFactor: string;
  riskTransition: number;
}

export interface ChurnFilters {
  riskLevel?: ChurnRiskLevel;
  search?: string;
} 