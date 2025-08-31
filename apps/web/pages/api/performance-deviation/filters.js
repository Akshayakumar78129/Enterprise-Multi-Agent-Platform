// apps/web/pages/api/performance-deviation/filters.js
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "apps", "web", "Customer", "database", "customers.db");

export default function handler(req, res) {
  try {
    let productGroups = ["RETAIL","WHOLESALE","ONLINE"]; // sensible defaults
    let customerSegments = ["All","SMB","Mid-Market","Enterprise","Loyal","At-Risk"]; // fallback
    if (fs.existsSync(DB_PATH)) {
      const db = new Database(DB_PATH, { readonly: true });
      // discover table and column names
      const tables = db.prepare("select name from sqlite_master where type='table'").all().map(r=>r.name);
      const table = ["dbo_F_Sales","Sales","F_Sales","sales","fact_sales"].find(t => tables.some(n => String(n).toLowerCase() === String(t).toLowerCase())) || "dbo_F_Sales";
      const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c=>c.name);
      const pgCol = ["Product Posting Group","Product Group","Item Category Code","product_group","product_category"].find(c => cols.includes(c)) || "Product Posting Group";
      const segCol = ["Customer Segment","Segment","segment","customer_segment"].find(c => cols.includes(c)) || null;

      const rows = db.prepare(`SELECT DISTINCT "${pgCol}" AS g FROM "${table}" WHERE "${pgCol}" IS NOT NULL ORDER BY 1`).all();
      const vals = rows.map(r => String(r.g)).filter(Boolean);
      if (vals.length) productGroups = vals;

      if (segCol) {
        const segRows = db.prepare(`SELECT DISTINCT "${segCol}" AS s FROM "${table}" WHERE "${segCol}" IS NOT NULL ORDER BY 1`).all();
        const segVals = segRows.map(r => String(r.s)).filter(Boolean);
        if (segVals.length) customerSegments = segVals;
      }
    }
    res.status(200).json({
      success: true,
      productGroups,
      customerSegments
    });
  } catch {
    res.status(200).json({
      success: true,
      productGroups: ["RETAIL","WHOLESALE","ONLINE"],
      customerSegments: ["All","SMB","Mid-Market","Enterprise","Loyal","At-Risk"]
    });
  }
}
