export interface BehaviourPattern {
  customer_id: string;
  last_purchase_date: string;
  frequency: number;
  avg_order_value: number;
  quantity: number;
  diversity: number;
  loyalty: number;
  recency: number;
  churn_risk: 'low' | 'medium' | 'high';
}

export interface CategoryAffinity {
  category: string;
  count: number;
  spend: number;
}

export interface ChannelUsage {
  channel: string;
  count: number;
  spend: number;
}

export interface KPI {
  avgPurchaseInterval: number;
  avgOrderValue: number;
  categoryDiversity: number;
  dominantChannel: string;
  dominantChannelPct: number;
  churnRiskPct: number;
} 