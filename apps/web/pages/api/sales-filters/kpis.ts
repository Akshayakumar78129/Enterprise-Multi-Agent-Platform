import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb, buildWhere } from './_utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = openDb();
  const { where, params, joinSql } = buildWhere(req.query as any);

  const sql = `
    SELECT
      SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS total_revenue,
      SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") AS total_units,
      CASE WHEN SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") = 0 THEN 0
           ELSE SUM("dbo_F_Sales_Transaction"."Net Sales Amount") / SUM("dbo_F_Sales_Transaction"."Net Sales Quantity")
      END AS avg_order_value
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