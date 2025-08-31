// Next.js API route: live drill-down queries (better-sqlite3 + schema introspection)
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

let db, schema = null;

function resolveDbPath() {
  // Prefer env; fall back to the repo-relative known path
  const configured = process.env.SQLITE_PATH;
  const candidate = configured
    ? path.resolve(configured) // absolute if given absolute; otherwise resolve against CWD
    : path.resolve(process.cwd(), "Customer", "database", "customers.db");

  return candidate;
}

function getDB() {
  if (!db) {
    const file = resolveDbPath();
    console.log("🔌 [PD:drilldown] opening SQLite:", file);

    if (!fs.existsSync(file)) {
      throw new Error(`SQLite file not found at ${file}. Set SQLITE_PATH in .env.local.`);
    }
    const size = fs.statSync(file).size;
    console.log(`📦 [PD:drilldown] SQLite size: ${size} bytes`);

    db = new Database(file, { readonly: true, fileMustExist: true });
    schema = introspectSchema(db);
  }
  return db;
}

function introspectSchema(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name.toLowerCase());
  console.log("📋 Tables found:", tables);

  const has = (name) => tables.includes(String(name).toLowerCase());
  const columns = (t) => {
    try { return db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name); }
    catch { return []; }
  };
  const pick = (candidates) => candidates.find((x) => has(x));

  const map = {
    customers: pick(["customers", "customer", "customer_dim", "dim_customers", "clients", "users"]),
    orders: pick(["orders", "sales", "transactions", "order_header"]),
    order_items: pick(["order_items", "order_lines", "transaction_items", "sales_items"]),
    products: pick(["products", "product", "items", "sku", "catalog"]),
    returns: pick(["returns", "product_returns", "rma"]),
  };

  const cols = {};
  if (map.customers) {
    const cs = columns(map.customers).map(s => s.toLowerCase());
    cols.c = {
      id: match(cs, ["customer_id", "id", "cust_id"]),
      name: match(cs, ["customer_name", "name", "full_name"]),
      region: match(cs, ["region", "state", "territory", "geo"]),
      segment: match(cs, ["segment", "tier", "category", "type"]),
      churn: match(cs, ["churn_probability", "churn_prob", "churn_score", "risk_score"]),
      joined: match(cs, ["joined_at", "created_at", "signup_date", "join_date", "first_order_date"]),
      ltv: match(cs, ["lifetime_value", "ltv", "total_spend", "lifetime_spend"])
    };
  }
  if (map.orders) {
    const cs = columns(map.orders).map(s => s.toLowerCase());
    cols.o = {
      id: match(cs, ["order_id", "id"]),
      customer_id: match(cs, ["customer_id", "cust_id", "user_id"]),
      amount: match(cs, ["amount", "total_amount", "order_total", "revenue", "price", "value"]),
      date: match(cs, ["order_date", "created_at", "date"])
    };
  }
  if (map.order_items) {
    const cs = columns(map.order_items).map(s => s.toLowerCase());
    cols.oi = {
      order_id: match(cs, ["order_id", "header_id"]),
      product_id: match(cs, ["product_id", "sku_id", "item_id"]),
      quantity: match(cs, ["quantity", "qty"]),
      price: match(cs, ["price", "unit_price", "amount"])
    };
  }
  if (map.products) {
    const cs = columns(map.products).map(s => s.toLowerCase());
    cols.p = {
      id: match(cs, ["product_id", "sku_id", "id"]),
      name: match(cs, ["product_name", "name", "title"]),
      category: match(cs, ["category", "dept", "group"]),
      subcategory: match(cs, ["subcategory", "sub_category", "class"]),
      cost: match(cs, ["cost", "unit_cost"]),
      on_hand: match(cs, ["on_hand", "stock", "inventory"]),
      monthly_demand: match(cs, ["monthly_demand", "demand"])
    };
  }
  if (map.returns) {
    const cs = columns(map.returns).map(s => s.toLowerCase());
    cols.r = {
      product_id: match(cs, ["product_id", "sku_id", "item_id"]),
      quantity: match(cs, ["quantity", "qty"])
    };
  }

  console.log("🗺️  Schema mapping:", map);
  console.log("🔤 Column mapping:", cols);
  return { tables: map, cols };
}

function match(allCols, candidates) {
  return candidates.find((c) => allCols.includes(c)) || null;
}

function all(sql, params = []) {
  return getDB().prepare(sql).all(...params);
}

const SAFE = new Set([
  "customer:region", "customer:value", "customer:revenue", "customer:risk", "customer:tenure", "customer:lifetime_value",
  "product:category", "product:subcategory", "product:profit", "product:returns", "product:inventory_risk",
]);

export default function handler(req, res) {
  try {
    const group = String(req.query.group || "customer");
    const by = String(req.query.by || "region");
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

    const key = `${group}:${by}`;
    if (!SAFE.has(key)) return res.status(400).json({ error: "Unsupported group/by" });

    const { tables: t, cols } = schema || getDB() || { tables: {}, cols: {} };
    const need = (cond, message) => { if (!cond) throw new Error(message); };

    let sql = "";

    switch (key) {
      case "customer:region": {
        need(t.customers, "customers table not found");
        const c = cols.c;
        need(c.id && c.name && c.region, "customers columns missing (id/name/region)");
        if (t.orders && cols.o.customer_id && cols.o.amount) {
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, c.${c.region} AS group_label,
                   'Revenue' AS metric, SUM(o.${cols.o.amount}) AS value
            FROM ${t.customers} c
            JOIN ${t.orders} o ON o.${cols.o.customer_id} = c.${c.id}
            GROUP BY c.${c.id}, c.${c.name}, c.${c.region}
            ORDER BY SUM(o.${cols.o.amount}) DESC
            LIMIT ?`;
        } else if (c.ltv) {
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, c.${c.region} AS group_label,
                   'LTV' AS metric, c.${c.ltv} AS value
            FROM ${t.customers} c
            ORDER BY c.${c.ltv} DESC
            LIMIT ?`;
        } else {
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, c.${c.region} AS group_label,
                   'Customers' AS metric, 1 AS value
            FROM ${t.customers} c
            ORDER BY 4 DESC
            LIMIT ?`;
        }
        break;
      }

      case "customer:risk": {
        need(t.customers, "customers table not found");
        const c = cols.c;
        need(c.id && c.name, "customers columns missing (id/name)");
        if (!c.churn) throw new Error("No churn/risk column found on customers table.");
        sql = `
          SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                 'Churn Risk' AS metric, c.${c.churn} AS value
          FROM ${t.customers} c
          ORDER BY c.${c.churn} DESC
          LIMIT ?`;
        break;
      }

      case "customer:value": {
        need(t.customers, "customers table not found");
        const c = cols.c;
        if (t.orders && cols.o.customer_id && cols.o.amount) {
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                   'Avg Order Value' AS metric, AVG(o.${cols.o.amount}) AS value
            FROM ${t.customers} c
            JOIN ${t.orders} o ON o.${cols.o.customer_id} = c.${c.id}
            GROUP BY c.${c.id}, c.${c.name}, c.${c.segment}
            ORDER BY AVG(o.${cols.o.amount}) DESC
            LIMIT ?`;
        } else {
          need(c.ltv, "orders not available and lifetime_value column not found");
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                   'LTV' AS metric, c.${c.ltv} AS value
            FROM ${t.customers} c
            ORDER BY c.${c.ltv} DESC
            LIMIT ?`;
        }
        break;
      }

      case "customer:revenue": {
        need(t.customers, "customers table not found");
        const c = cols.c;
        if (t.orders && cols.o.customer_id && cols.o.amount) {
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                   'Total Revenue' AS metric, SUM(o.${cols.o.amount}) AS value
            FROM ${t.customers} c
            JOIN ${t.orders} o ON o.${cols.o.customer_id} = c.${c.id}
            GROUP BY c.${c.id}, c.${c.name}, c.${c.segment}
            ORDER BY SUM(o.${cols.o.amount}) DESC
            LIMIT ?`;
        } else {
          need(c.ltv, "orders not available and lifetime_value column not found");
          sql = `
            SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                   'LTV' AS metric, c.${c.ltv} AS value
            FROM ${t.customers} c
            ORDER BY c.${c.ltv} DESC
            LIMIT ?`;
        }
        break;
      }

      case "customer:tenure": {
        need(t.customers, "customers table not found");
        const c = cols.c;
        need(c.joined, "customers.joined_at/created_at column not found");
        sql = `
          SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                 'Tenure (months)' AS metric,
                 CAST((julianday('now') - julianday(c.${c.joined})) / 30.0 AS INTEGER) AS value
          FROM ${t.customers} c
          ORDER BY 4 DESC
          LIMIT ?`;
        break;
      }

      case "customer:lifetime_value": {
        need(t.customers, "customers table not found");
        const c = cols.c;
        need(c.ltv, "customers.lifetime_value/ltv column not found");
        sql = `
          SELECT c.${c.id} AS id, c.${c.name} AS name, COALESCE(c.${c.segment}, '–') AS group_label,
                 'LTV' AS metric, c.${c.ltv} AS value
          FROM ${t.customers} c
          ORDER BY c.${c.ltv} DESC
          LIMIT ?`;
        break;
      }

      case "product:category": {
        need(t.products, "products table not found");
        const p = cols.p;
        if (t.orders && t.order_items && cols.oi.product_id && cols.oi.order_id && cols.o.id && cols.o.amount) {
          sql = `
            SELECT p.${p.id} AS id, p.${p.name} AS name, p.${p.category} AS group_label,
                   'Revenue' AS metric, SUM(o.${cols.o.amount}) AS value
            FROM ${t.products} p
            JOIN ${t.order_items} oi ON oi.${cols.oi.product_id} = p.${p.id}
            JOIN ${t.orders} o ON o.${cols.o.id} = oi.${cols.oi.order_id}
            GROUP BY p.${p.id}, p.${p.name}, p.${p.category}
            ORDER BY SUM(o.${cols.o.amount}) DESC
            LIMIT ?`;
        } else if (t.order_items && cols.oi.quantity && cols.oi.price) {
          sql = `
            SELECT p.${p.id} AS id, p.${p.name} AS name, p.${p.category} AS group_label,
                   'Revenue' AS metric, SUM(oi.${cols.oi.quantity} * oi.${cols.oi.price}) AS value
            FROM ${t.products} p
            JOIN ${t.order_items} oi ON oi.${cols.oi.product_id} = p.${p.id}
            GROUP BY p.${p.id}, p.${p.name}, p.${p.category}
            ORDER BY SUM(oi.${cols.oi.quantity} * oi.${cols.oi.price}) DESC
            LIMIT ?`;
        } else {
          throw new Error("No revenue source for products (need orders+order_items or order_items with price*quantity).");
        }
        break;
      }

      case "product:subcategory": {
        need(t.products && t.order_items, "products/order_items tables not found");
        const p = cols.p, oi = cols.oi;
        need(oi.quantity && oi.price, "order_items quantity/price columns not found");
        sql = `
          SELECT p.${p.id} AS id, p.${p.name} AS name, p.${p.subcategory} AS group_label,
                 'Revenue' AS metric, SUM(oi.${oi.quantity} * oi.${oi.price}) AS value
          FROM ${t.products} p
          JOIN ${t.order_items} oi ON oi.${oi.product_id} = p.${p.id}
          GROUP BY p.${p.id}, p.${p.name}, p.${p.subcategory}
          ORDER BY SUM(oi.${oi.quantity} * oi.${oi.price}) DESC
          LIMIT ?`;
        break;
      }

      case "product:profit": {
        need(t.products && t.order_items, "products/order_items tables not found");
        const p = cols.p, oi = cols.oi;
        need(p.cost, "products.cost column not found");
        need(oi.quantity && oi.price, "order_items quantity/price columns not found");
        sql = `
          SELECT p.${p.id} AS id, p.${p.name} AS name, COALESCE(p.${p.category}, '–') AS group_label,
                 'Profit' AS metric, SUM((oi.${oi.price} - p.${p.cost}) * oi.${oi.quantity}) AS value
          FROM ${t.products} p
          JOIN ${t.order_items} oi ON oi.${oi.product_id} = p.${p.id}
          GROUP BY p.${p.id}, p.${p.name}, p.${p.category}
          ORDER BY SUM((oi.${oi.price} - p.${p.cost}) * oi.${oi.quantity}) DESC
          LIMIT ?`;
        break;
      }

      case "product:returns": {
        need(t.products && t.order_items, "products/order_items tables not found");
        const p = cols.p, oi = cols.oi;
        need(oi.quantity, "order_items.quantity column not found");
        const returnsAvail = t.returns && cols.r.product_id && cols.r.quantity;
        const returnsJoin = returnsAvail
          ? `LEFT JOIN ${t.returns} r ON r.${cols.r.product_id} = p.${p.id}`
          : `LEFT JOIN (SELECT ${oi.product_id} AS product_id, 0 AS ${oi.quantity} FROM ${t.order_items} GROUP BY ${oi.product_id}) r ON r.product_id = p.${p.id}`;

        sql = `
          SELECT p.${p.id} AS id, p.${p.name} AS name, COALESCE(p.${p.category}, '–') AS group_label,
                 'Return Rate' AS metric,
                 COALESCE(100.0 * SUM(r.${returnsAvail ? cols.r.quantity : oi.quantity}) / NULLIF(SUM(oi.${oi.quantity}),0), 0) AS value
          FROM ${t.products} p
          JOIN ${t.order_items} oi ON oi.${oi.product_id} = p.${p.id}
          ${returnsJoin}
          GROUP BY p.${p.id}, p.${p.name}, p.${p.category}
          ORDER BY 4 DESC
          LIMIT ?`;
        break;
      }

      case "product:inventory_risk": {
        need(t.products, "products table not found");
        const p = cols.p;
        need(p.on_hand && p.monthly_demand, "products.on_hand/monthly_demand columns not found");
        sql = `
          SELECT p.${p.id} AS id, p.${p.name} AS name, COALESCE(p.${p.category}, '–') AS group_label,
                 'Stockout Risk' AS metric,
                 COALESCE(100.0 * p.${p.monthly_demand} / NULLIF(p.${p.on_hand},0), 0) AS value
          FROM ${t.products} p
          ORDER BY 4 DESC
          LIMIT ?`;
        break;
      }

      default:
        sql = "SELECT 1 WHERE 1=0";
    }

    const rows = all(sql, [limit]).map((r) => ({
      ...r,
      value_display: formatMetric(r.metric, r.value),
    }));

    res.json({ rows });
  } catch (e) {
    console.error("drilldown api error:", e);
    res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}

function formatMetric(metric, v) {
  const val = Number(v || 0);
  const m = String(metric || "").toLowerCase();
  if (m.includes("revenue") || m.includes("profit") || m.includes("ltv")) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  }
  if (m.includes("rate") || m.includes("risk")) return `${val.toFixed(1)}%`;
  return new Intl.NumberFormat().format(val);
}
