import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb, buildWhere } from './_utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = openDb();
  const { where, params, joinSql } = buildWhere(req.query as any);

  // Compute KPIs strictly from sales_agent.db with correct definitions:
  // - total_revenue: SUM(Net Sales Amount)
  // - total_units: SUM(Net Sales Quantity)
  // - total_orders: COUNT(DISTINCT Sales Txn Number)
  // - avg_order_value (AOV): total_revenue / total_orders (0 if no orders)
  // - margin_percentage: ((SUM(Net Sales Amount) - SUM(Cost Amount)) / SUM(Net Sales Amount)) * 100 (0 if revenue 0)
  const sql = `
    SELECT
      SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS total_revenue,
      SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") AS total_units,
      COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number") AS total_orders,
      CASE 
        WHEN COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number") > 0 THEN 
          SUM("dbo_F_Sales_Transaction"."Net Sales Amount") * 1.0 / COUNT(DISTINCT "dbo_F_Sales_Transaction"."Sales Txn Number")
        ELSE 0
      END AS avg_order_value,
      CASE 
        WHEN SUM("dbo_F_Sales_Transaction"."Net Sales Amount") > 0 THEN 
          ((SUM("dbo_F_Sales_Transaction"."Net Sales Amount") - SUM(COALESCE("dbo_F_Sales_Transaction"."Cost Amount", 0))) 
            / SUM("dbo_F_Sales_Transaction"."Net Sales Amount")) * 100.0
        ELSE 0
      END AS margin_percentage
    FROM "dbo_F_Sales_Transaction"
    ${joinSql}
    ${where}
  `;

  db.get(sql, params, (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    return res.status(200).json({ filters: req.query, kpis: row || {} });
  });
}