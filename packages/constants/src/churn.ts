export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export const CHURN_ENDPOINTS = {
  SUMMARY: `${API_BASE}/api/churn/summary`,
};

export const CHURN_THRESHOLDS = {
  VERY_HIGH_DAYS: 180,
  HIGH_DAYS: 90,
  MEDIUM_DAYS: 30,
};

export type TimePreset = "last_30_days" | "last_90_days" | "last_180_days" | "last_year" | "custom";

export const TIME_PRESETS: { label: string; value: TimePreset }[] = [
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 days", value: "last_90_days" },
  { label: "Last 180 days", value: "last_180_days" },
  { label: "Last year", value: "last_year" },
];
