import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from './_utils';

// Return dropdown options for top-panel filters
const LIMIT = 200;

type Row = Record<string, any>;
const mapVal = (rows: Row[]) => rows.map(r => r.val as string);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = openDb();

  const all = (sql: string, params: any[] = []) => new Promise<Row[]>((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });

  const safeAll = async (label: string, sql: string, params: any[] = []) => {
    try {
      return await all(sql, params);
    } catch (err: any) {
      console.error(`[sales-filters/options] ${label} query failed:`, err?.message || err);
      return [] as Row[];
    }
  };

  (async () => {
    try {
      // Periods remain global (not scoped to dims)
      const periodsRows = await safeAll(
        'periods',
        `SELECT DISTINCT strftime('%Y-%m', "dbo_F_Sales_Transaction"."Txn Date") AS period
         FROM "dbo_F_Sales_Transaction"
         WHERE "dbo_F_Sales_Transaction"."Txn Date" IS NOT NULL AND TRIM("dbo_F_Sales_Transaction"."Txn Date") <> ''
         ORDER BY period`
      );

      // Customer Category options (use Customer Type Desc from customer dim)
      const catRows = await safeAll(
        'customer_category',
        `SELECT DISTINCT TRIM(CAST("Customer Type Desc" AS TEXT)) AS val
         FROM "dbo_D_Customer"
         WHERE "Customer Type Desc" IS NOT NULL AND TRIM(CAST("Customer Type Desc" AS TEXT)) <> ''
         ORDER BY val
         LIMIT ${LIMIT}`
      );

      // Customer Region options: use State/Prov when only one Country exists; otherwise Country
      const countryRows = await safeAll(
        'country_probe',
        `SELECT DISTINCT TRIM(CAST("Customer Country" AS TEXT)) AS val
         FROM "dbo_D_Customer"
         WHERE "Customer Country" IS NOT NULL AND TRIM(CAST("Customer Country" AS TEXT)) <> ''
         ORDER BY val`
      );
      let regionRows: Row[] = [];
      if (countryRows.length <= 1) {
        // Use states/provinces as regions
        regionRows = await safeAll(
          'customer_region_states',
          `SELECT DISTINCT TRIM(CAST("Customer State/Prov" AS TEXT)) AS val
           FROM "dbo_D_Customer"
           WHERE "Customer State/Prov" IS NOT NULL AND TRIM(CAST("Customer State/Prov" AS TEXT)) <> ''
           ORDER BY val
           LIMIT ${LIMIT}`
        );
      } else {
        // Use countries as regions
        regionRows = countryRows.slice(0, LIMIT);
      }

      // Item and Transaction Type options
      const itemRows = await safeAll(
        'item_name',
        `SELECT DISTINCT TRIM(CAST("Item Desc" AS TEXT)) AS val
         FROM "dbo_D_Item"
         WHERE "Item Desc" IS NOT NULL AND TRIM(CAST("Item Desc" AS TEXT)) <> ''
         ORDER BY val
         LIMIT ${LIMIT}`
      );
      res.status(200).json({
        options: {
          periods: periodsRows.map(r => r.period as string),
          salesperson: [],
          territory: [],
          customer_category: mapVal(catRows),
          customer_region: mapVal(regionRows),
          item_name: mapVal(itemRows)
        }
      });
    } catch (err: any) {
      console.error('[sales-filters/options] fatal error:', err?.message || err);
      res.status(200).json({
        options: { periods: [], salesperson: [], territory: [], customer_category: [], customer_region: [] },
        error: err?.message || String(err)
      });
    } finally {
      db.close();
    }
  })();
}