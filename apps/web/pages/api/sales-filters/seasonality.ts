import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb, buildWhere } from './_utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = openDb();
  const { where, params, joinSql } = buildWhere(req.query as any);

  const sql = `
    SELECT
      strftime('%Y', "dbo_F_Sales_Transaction"."Txn Date") AS year,
      strftime('%m', "dbo_F_Sales_Transaction"."Txn Date") AS month,
      SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS revenue
    FROM "dbo_F_Sales_Transaction"
    ${joinSql}
    ${where}
    GROUP BY year, month
    ORDER BY year, month
  `;

  db.all(sql, params, (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    return res.status(200).json({ filters: req.query, seasonality: rows || [] });
  });
}