import path from 'path';
import sqlite3 from 'sqlite3';
import fs from 'fs';

// Resolve strictly to apps/web/Sales/database/sales_agent.db under the project root
// Using process.cwd() (Next server working dir is apps/web) ensures the exact path:
// E:\multiagent-agency\apps\web\Sales\database\sales_agent.db
export const DB_PATH = path.resolve(process.cwd(), 'Sales', 'database', 'sales_agent.db');

export function openDb() {
  console.log('[sales-filters] DB_PATH', DB_PATH);
  if (!fs.existsSync(DB_PATH)) {
    console.error('[sales-filters] Database not found at', DB_PATH);
  }
  sqlite3.verbose();
  return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
}

// Filters applied across endpoints
// date_from, date_to apply to Txn Date (fact)
// customer_category maps to Customer Type Desc (in customer dim)
// customer_region maps to Customer Country or State/Prov (in customer dim)
// item_name maps to Item Desc in item dim
// txn_type maps to Sales Txn Type in fact
const FILTERS: Record<string, { sql: string; join?: 'customer' | 'item' } > = {
  date_from: { sql: '"dbo_F_Sales_Transaction"."Txn Date" >= ?' },
  date_to: { sql: '"dbo_F_Sales_Transaction"."Txn Date" <= ?' },
  customer_category: { sql: '"dbo_D_Customer"."Customer Type Desc" = ?', join: 'customer' },
  // If only one country exists in data, we interpret region as State/Prov; otherwise Country
  customer_region: { sql: ' ( COALESCE(TRIM("dbo_D_Customer"."Customer State/Prov"), TRIM("dbo_D_Customer"."Customer Country")) = ? OR TRIM("dbo_D_Customer"."Customer Country") = ? )', join: 'customer' },
  item_name: { sql: 'TRIM("dbo_D_Item"."Item Desc") = ?', join: 'item' },
};

export function buildWhere(query: Record<string, any>) {
  const clauses: string[] = [];
  const params: any[] = [];
  const joins = new Set<string>();

  for (const [k, cfg] of Object.entries(FILTERS)) {
    const v = (query as any)[k];
    if (v === undefined || v === '') continue;
    if (cfg.join) joins.add(cfg.join);
    // For customer_region with dual fallback (state or country), bind twice
    if (k === 'customer_region') {
      clauses.push(cfg.sql);
      params.push(v, v);
    } else {
      clauses.push(cfg.sql);
      params.push(v);
    }
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const joinSqlParts: string[] = [];
  if (joins.has('customer')) {
    joinSqlParts.push('LEFT JOIN "dbo_D_Customer" ON "dbo_D_Customer"."Customer Key" = "dbo_F_Sales_Transaction"."Customer Key"');
  }
  if (joins.has('item')) {
    joinSqlParts.push('LEFT JOIN "dbo_D_Item" ON "dbo_D_Item"."Item Key" = "dbo_F_Sales_Transaction"."Item Key"');
  }
  const joinSql = joinSqlParts.join('\n');

  return { where, params, joinSql };
}