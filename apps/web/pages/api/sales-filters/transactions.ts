import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb, buildWhere } from './_utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = openDb();
  const grain = (req.query.grain as string) || 'month';
  const { where, params, joinSql } = buildWhere(req.query as any);

  const periodExpr =
    grain === 'day' ? 'strftime("%Y-%m-%d", "dbo_F_Sales_Transaction"."Txn Date")' :
    grain === 'week' ? 'strftime("%Y-W%W", "dbo_F_Sales_Transaction"."Txn Date")' :
    grain === 'quarter' ? 'printf("%s-Q%s", strftime("%Y","dbo_F_Sales_Transaction"."Txn Date"), ((cast(strftime("%m","dbo_F_Sales_Transaction"."Txn Date") as integer)-1)/3 + 1))' :
    grain === 'year' ? 'strftime("%Y", "dbo_F_Sales_Transaction"."Txn Date")' :
    'strftime("%Y-%m", "dbo_F_Sales_Transaction"."Txn Date")';

  const sql = `
    SELECT
      ${periodExpr} AS period,
      SUM("dbo_F_Sales_Transaction"."Net Sales Amount") AS revenue,
      SUM("dbo_F_Sales_Transaction"."Net Sales Quantity") AS units
    FROM "dbo_F_Sales_Transaction"
    ${joinSql}
    ${where}
    GROUP BY period
    ORDER BY period
  `;

  db.all(sql, params, (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    return res.status(200).json({ grain, filters: req.query, data: rows || [] });
  });
}