import { pool } from "../../config/db";
import { applyFilters } from "../../filter-engine/filterEngine";

export class ChurnDataService {
  static async getCustomers(filters: Record<string, any> = {}) {
    const sql = `
      SELECT
        c."Customer Key"           AS customer_id,
        c."Customer Name"          AS customer_name,
        c."Customer Status"        AS customer_status,
        c."Customer State/Prov"    AS region,
        c."Customer Type Desc"     AS customer_type,
        c."Credit Limit Amount"    AS credit_limit
      FROM public.dbo_d_customer c
      LEFT JOIN public.dbo_f_sales_transaction t 
        ON t."Customer Key" = c."Customer Key"
      LEFT JOIN public.dbo_f_customer_loyalty cl 
        ON cl."Entity Key" = c."Customer Key"
      WHERE 1=1
    `;
    const { text, values } = applyFilters(sql, filters);
    return pool.query(text, values);
  }

  static async getTransactions(filters: Record<string, any> = {}) {
    const sql = `
      SELECT
        t."Customer Key"         AS customer_id,
        t."Sales Txn Key"        AS txn_id,
        t."Txn Date"             AS txn_date,
        t."Net Sales Amount"     AS net_sales_amount,
        t."Sales Amount"         AS sales_amount,
        t."Return Amount"        AS return_amount,
        t."Item Number"          AS item_number,
        t."Sales Txn Document"   AS sales_txn_document
      FROM public.dbo_f_sales_transaction t
      LEFT JOIN public.dbo_d_customer c
        ON c."Customer Key" = t."Customer Key"
      LEFT JOIN public.dbo_f_customer_loyalty cl
        ON cl."Entity Key" = t."Customer Key"
      WHERE 1=1
    `;
    const { text, values } = applyFilters(sql, filters);
    return pool.query(text, values);
  }

  static async getLoyalty(filters: Record<string, any> = {}) {
    const sql = `
      SELECT
        cl."Entity Key"                AS customer_id,           -- join to Customer Key
        cl."Customer Number"           AS customer_number,
        cl."Loyalty Status"            AS loyalty_status,
        cl."RFM Score"                 AS rfm_score,
        cl."Days Since Last Activity"  AS days_since_last_activity,
        cl."LTD Sales Amount"          AS lifetime_sales,
        cl."Last Activity Date"        AS last_activity_date
      FROM public.dbo_f_customer_loyalty cl
      LEFT JOIN public.dbo_d_customer c
        ON c."Customer Key" = cl."Entity Key"
      LEFT JOIN public.dbo_f_sales_transaction t
        ON t."Customer Key" = cl."Entity Key"
      WHERE 1=1
    `;
    const { text, values } = applyFilters(sql, filters);
    return pool.query(text, values);
  }
}
