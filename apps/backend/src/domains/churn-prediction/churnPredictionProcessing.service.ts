import { ChurnDataService } from "./churnPredictionData.service";


export class ChurnProcessingService {
 static async getDashboardSummary(filters: any) {
    const [stats, segmentRisk, monthlyRisk] = await Promise.all([
      this.getCustomerStats(filters),
      this.getSegmentRisk(filters),
      this.getMonthlyRisk(filters),
    ]);

    return {
      stats,         
      segmentRisk,
      monthlyRisk,
    };
  }

  static async getCustomerStats(filters: Record<string, any> = {}) {
    const [txnsRes, loyaltyRes] = await Promise.all([
      ChurnDataService.getTransactions(filters),
      ChurnDataService.getLoyalty(filters),
    ]);

    const loyaltyByCustomer = new Map<string, any>(
      loyaltyRes.rows.map((r: any) => [String(r.customer_id), r])
    );

    const agg: Record<string, {
      customer_id: string;
      total_amount: number;
      txn_count: number;
      last_purchase_date: string | null;
    }> = {};

    for (const row of txnsRes.rows) {
      const id = String(row.customer_id);
      const amount =
        row.net_sales_amount != null ? Number(row.net_sales_amount) :
        row.sales_amount != null ? Number(row.sales_amount) : 0;

      if (!agg[id]) {
        agg[id] = {
          customer_id: id,
          total_amount: 0,
          txn_count: 0,
          last_purchase_date: row.txn_date ?? null,
        };
      }

      agg[id].total_amount += amount;
      agg[id].txn_count += 1;

      if (row.txn_date && (!agg[id].last_purchase_date ||
          new Date(row.txn_date) > new Date(agg[id].last_purchase_date))) {
        agg[id].last_purchase_date = row.txn_date;
      }
    }

    return Object.values(agg).map((c) => {
      const l = loyaltyByCustomer.get(c.customer_id);
      return {
        customer_id: c.customer_id,
        last_purchase_date: c.last_purchase_date,
        frequency: c.txn_count,
        avg_order_value: c.txn_count ? Number((c.total_amount / c.txn_count).toFixed(2)) : 0,
        rfm_score: l?.rfm_score ?? null,
        loyalty_status: l?.loyalty_status ?? null,
        lifetime_sales: l?.lifetime_sales ?? null,
      };
    });
  }

  static async getSegmentRisk(filters: Record<string, any> = {}) {
    const txnsRes = await ChurnDataService.getTransactions(filters);

    const spend: Record<string, number> = {};
    const lastDate: Record<string, string | null> = {};

    for (const row of txnsRes.rows) {
      const id = String(row.customer_id);
      const amount =
        row.net_sales_amount != null ? Number(row.net_sales_amount) :
        row.sales_amount != null ? Number(row.sales_amount) : 0;

      spend[id] = (spend[id] ?? 0) + amount;

      const dt: string | null = row.txn_date ?? null;
      if (dt && (!lastDate[id] || new Date(dt) > new Date(lastDate[id]!))) {
        lastDate[id] = dt;
      }
    }

    const now = new Date();
    const daysSince = (d: string | null) =>
      d ? Math.floor((now.getTime() - new Date(d).getTime()) / 86400000) : Number.MAX_SAFE_INTEGER;

    const buckets: Record<string, { low: number; medium: number; high: number; very_high: number }> = {
      Enterprise: { low: 0, medium: 0, high: 0, very_high: 0 },
      "Mid-Market": { low: 0, medium: 0, high: 0, very_high: 0 },
      SMB: { low: 0, medium: 0, high: 0, very_high: 0 },
      Consumer: { low: 0, medium: 0, high: 0, very_high: 0 },
    };

    for (const [id, total] of Object.entries(spend)) {
      let segment: keyof typeof buckets = "Consumer";
      if (total > 20000)      segment = "Enterprise";
      else if (total > 10000) segment = "Mid-Market";
      else if (total > 2000)  segment = "SMB";

      const d = daysSince(lastDate[id] ?? null);
      let risk: keyof (typeof buckets)["Enterprise"];
      if (d > 180)      risk = "very_high";
      else if (d > 90)  risk = "high";
      else if (d > 30)  risk = "medium";
      else              risk = "low";

      buckets[segment][risk] += 1;
    }

    return Object.entries(buckets).map(([segment, counts]) => ({ segment, ...counts }));
  }

  /** Monthly risk trend */
  static async getMonthlyRisk(filters: Record<string, any> = {}) {
    const txnsRes = await ChurnDataService.getTransactions(filters);

    type MonthBucket = { customers: Set<string>; lastByCustomer: Record<string, string> };
    const byMonth: Record<string, MonthBucket> = {};

    for (const row of txnsRes.rows) {
      if (!row.txn_date) continue;
      const month = String(row.txn_date).slice(0, 7);
      const cid = String(row.customer_id);

      byMonth[month] ??= { customers: new Set(), lastByCustomer: {} };
      byMonth[month].customers.add(cid);

      const current = byMonth[month].lastByCustomer[cid];
      if (!current || new Date(row.txn_date) > new Date(current)) {
        byMonth[month].lastByCustomer[cid] = row.txn_date;
      }
    }

    const now = new Date();
    const daysSince = (d: string) => Math.floor((now.getTime() - new Date(d).getTime()) / 86400000);

    const results = Object.entries(byMonth).map(([month, data]) => {
      let low = 0, medium = 0, high = 0, very_high = 0;
      for (const cid of data.customers) {
        const d = daysSince(data.lastByCustomer[cid]);
        if (d < 30)          low++;
        else if (d <= 90)    medium++;
        else if (d <= 180)   high++;
        else                 very_high++;
      }
      return {
        month,
        total_customers: data.customers.size,
        low_risk: low,
        medium_risk: medium,
        high_risk: high,
        very_high_risk: very_high,
      };
    });

    results.sort((a, b) => (a.month < b.month ? 1 : -1)); 
    return results;
  }
}
