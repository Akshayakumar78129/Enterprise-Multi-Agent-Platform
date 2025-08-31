// apps/web/pages/api/performance-deviation/data.js
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

// ---- config (allow bigger JSON just in case) ----
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

// ---- tiny utils -------------------------------------------------------------
const log = (...a) => console.log("[PD:data]", ...a);
const safeNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const cap = (arr, n = 3650) => (Array.isArray(arr) && arr.length > n ? arr.slice(-n) : arr);

// locate the demo/customer sqlite db shipped with the app
function resolveDbPath() {
  const candidates = [
    path.join(process.cwd(), "apps", "web", "Customer", "database", "customers.db"),
    path.join(process.cwd(), "Customer", "database", "customers.db"),
    path.resolve(process.cwd(), "apps/web/Customer/database/customers.db"),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return candidates[0];
}
function openDb() {
  const DB_PATH = resolveDbPath();
  log("opening SQLite:", DB_PATH);
  if (!fs.existsSync(DB_PATH)) throw new Error(`DB not found at ${DB_PATH}`);
  return new Database(DB_PATH, { readonly: true });
}
function tableExists(db, name) {
  const r = db.prepare(`select 1 from sqlite_master where type='table' and lower(name)=lower(?)`).get(name);
  return !!r;
}
function columnsOf(db, name) {
  try { return db.prepare(`PRAGMA table_info(${name})`).all().map((c) => c.name); }
  catch { return []; }
}
function pick(firstExisting, list) { for (const k of list) if (firstExisting.includes(k)) return k; return null; }
function firstExistingTable(db, candidates) { for (const t of candidates) if (tableExists(db, t)) return t; return null; }
function movingAvg(arr, w = 7) { const out=[]; let s=0; for (let i=0;i<arr.length;i++){ s+=arr[i]; if(i>=w) s-=arr[i-w]; out.push(i>=w-1? s/w : s/(i+1)); } return out; }
function pearson(x, y){ const n=Math.min(x.length,y.length); if(n<3) return 0; let sx=0,sy=0,sxx=0,syy=0,sxy=0,m=0; for(let i=0;i<n;i++){ const xi=Number(x[i]); const yi=Number(y[i]); if(!Number.isFinite(xi)||!Number.isFinite(yi)) continue; m++; sx+=xi; sy+=yi; sxx+=xi*xi; syy+=yi*yi; sxy+=xi*yi; } if(m<3) return 0; const cov=sxy-(sx*sy)/m; const vx=sxx-(sx*sx)/m; const vy=syy-(sy*sy)/m; const denom=Math.sqrt(vx*vy)||1; return cov/denom; }

// ---- GET+POST tolerant payload reader --------------------------------------
function readInput(req) {
  const def = { startDate:"2018-01-01", endDate:"2020-12-31", customerIds:[], productGroups:[] };
  if (req.method === "GET") {
    const q = req.query || {};
    const parseList = (v) => (Array.isArray(v) ? v : (typeof v === "string" && v.length) ? v.split(",").map(s=>s.trim()).filter(Boolean) : []);
    return {
      startDate: q.startDate || def.startDate,
      endDate: q.endDate || def.endDate,
      customerIds: parseList(q.customerIds),
      productGroups: parseList(q.productGroups),
      customerSegments: parseList(q.customerSegments),
    };
  }
  const b = req.body || {};
  return {
    startDate: b.startDate || def.startDate,
    endDate: b.endDate || def.endDate,
    customerIds: Array.isArray(b.customerIds) ? b.customerIds : [],
    productGroups: Array.isArray(b.productGroups) ? b.productGroups : [],
    customerSegments: Array.isArray(b.customerSegments) ? b.customerSegments : [],
  };
}

// ---- API handler ------------------------------------------------------------
export default function handler(req, res) {
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      res.status(405).json({ success:false, error:"Use GET (query) or POST (JSON)" });
      return;
    }

    const { startDate, endDate, customerIds, productGroups, customerSegments } = readInput(req);

    log("range", {
      startDate, endDate,
      customerIds_len: Array.isArray(customerIds) ? customerIds.length : 0,
      productGroups_len: Array.isArray(productGroups) ? productGroups.length : 0,
    });

    let db; try { db = openDb(); } catch (e) { log("DB open error", e.message); }

    // ---- discover table/columns -------------------------------------------
    let rows = [];
    let discovered = null;

    if (db) {
      const table = firstExistingTable(db, [
        "Sales","FactSales","F_Sales","SalesLedger","Orders","Transactions","dbo_F_Sales",
        "dbo_Fact_Sales","dbo_Sales","fact_sales","sales"
      ]);
      if (table) {
        const cols = columnsOf(db, table);
        const dateCol = pick(cols, ['Posting Date','Post Date','Order Date','Date','TxnDate','doc_date','posting_date','order_date','date']);
        const amountCol = pick(cols, ['Amount','Revenue','Net Amount','Line Amount','Amount Including VAT','amount','net_amount','revenue']);
        const qtyCol = pick(cols, ['Quantity','Qty','qty','quantity']);
        const customerCol = pick(cols, ['Customer Key','Customer_No','Customer No_','Customer ID','CustomerID','customer_id','customer_key']);
        const productCol = pick(cols, ['Product Posting Group','Product Group','Category','ProductCategory','Item Category Code','product_group','product_category']);

        if (dateCol && amountCol) {
          const dayExpr = `strftime('%Y-%m-%d', "${dateCol}")`;
          const where = [
            `date("${dateCol}") BETWEEN date(?) AND date(?)`,
            (customerIds?.length && customerCol) ? `"${customerCol}" IN (${customerIds.map(()=>"?").join(",")})` : null,
            (productGroups?.length && productCol) ? `"${productCol}" IN (${productGroups.map(()=>"?").join(",")})` : null,
            // optional customer segment filter if a suitable column exists
            (Array.isArray(customerSegments) && customerSegments.length>0) ? (()=>{
              const segCol = pick(cols, ['Customer Segment','Segment','customer_segment','segment']);
              return segCol ? `"${segCol}" IN (${customerSegments.map(()=>"?").join(",")})` : null;
            })() : null,
          ].filter(Boolean).join(" AND ");
          const segParams = (Array.isArray(customerSegments) ? customerSegments : []);
          const params = [startDate, endDate, ...(customerIds || []), ...(productGroups || []), ...segParams];

          const sql = `
            SELECT
              ${dayExpr} AS day,
              SUM("${amountCol}") AS revenue,
              ${qtyCol ? `SUM("${qtyCol}")` : "COUNT(*)"} AS qty
            FROM "${table}"
            WHERE ${where}
            GROUP BY day
            ORDER BY day
          `;
          rows = db.prepare(sql).all(...params) || [];
          discovered = { table, dateCol, amountCol, qtyCol, customerCol, productCol };
        }
      }
    }

    // ---- fallback demo rows if nothing discovered --------------------------
    if (!rows.length) {
      rows = demoSeries(startDate, endDate);
      discovered = discovered || { table: "(demo)" };
    }

    // ---- build canonical series for the visualisations ---------------------
    const days = rows.map(r => r.day);
    const revenue = rows.map(r => safeNum(r.revenue));
    const qty = rows.map(r => safeNum(r.qty, 0));
    const predicted = movingAvg(revenue, 7);
    const deviation = revenue.map((v, i) => v - (predicted[i] ?? v));
    const aov = revenue.map((v, i) => (qty[i] ? v / qty[i] : 0));

    const perfExplorer = {
      daily_revenue: cap(days.map((d, i) => ({ date: d, actual: revenue[i], predicted: predicted[i], deviation: deviation[i], function: "sales" })) ),
      daily_orders: cap(days.map((d, i) => ({ date: d, actual: qty[i],     predicted: movingAvg(qty, 7)[i], deviation: qty[i] - movingAvg(qty,7)[i], function: "customer" })) ),
      avg_order_value: cap(days.map((d, i) => ({ date: d, actual: aov[i],  predicted: movingAvg(aov,7)[i], deviation: aov[i] - movingAvg(aov,7)[i], function: "finance" })) ),
    };

    const ts = days.map((d) => new Date(d));
    const values = revenue;
    // Build feature set for driver importance from actual DB-derived signals
    // Time drivers
    const factors = {
      day_of_week: ts.map(d => d.getDay()),
      month: ts.map(d => d.getMonth()+1),
      weekend: ts.map(d => ([0,6].includes(d.getDay()) ? 1 : 0)),
      end_of_month: ts.map(d => { const eom = new Date(d.getFullYear(), d.getMonth()+1, 0); return Number(d.getDate() === eom.getDate()); })
    };
    // Price driver: average order value (unit price proxy)
    // We avoid division by zero; when qty is zero we carry forward last known AOV
    const aovSeries = [];
    let lastAov = 0;
    for (let i = 0; i < revenue.length; i++) {
      const q = qty[i] || 0;
      if (q > 0) {
        lastAov = revenue[i] / q;
      }
      aovSeries.push(lastAov);
    }
    factors.order_value = aovSeries;

    // Product/Category driver: top category share (if a product/category column exists)
    if (db && discovered && discovered.productCol) {
      try {
        const dayExpr = `strftime('%Y-%m-%d', "${discovered.dateCol}")`;
        const where = [
          `date("${discovered.dateCol}") BETWEEN date(?) AND date(?)`,
          (customerIds?.length && discovered.customerCol) ? `"${discovered.customerCol}" IN (${customerIds.map(()=>"?").join(",")})` : null,
          (productGroups?.length && discovered.productCol) ? `"${discovered.productCol}" IN (${productGroups.map(()=>"?").join(",")})` : null,
          (Array.isArray(customerSegments) && customerSegments.length>0 && discovered.table) ? (()=>{
            const cols = columnsOf(db, discovered.table);
            const segCol = pick(cols, ['Customer Segment','Segment','customer_segment','segment']);
            return segCol ? `"${segCol}" IN (${customerSegments.map(()=>"?").join(",")})` : null;
          })() : null,
        ].filter(Boolean).join(" AND ");
        const params = [startDate, endDate, ...(customerIds || []), ...(productGroups || []), ...(customerSegments||[])];
        const sqlCat = `
          SELECT ${dayExpr} AS day, "${discovered.productCol}" AS cat, SUM("${discovered.amountCol}") AS rev
          FROM "${discovered.table}"
          WHERE ${where}
          GROUP BY day, cat
          ORDER BY day
        `;
        const rowsCat = db.prepare(sqlCat).all(...params) || [];
        const byDay = {};
        for (const r of rowsCat) {
          const k = r.day;
          byDay[k] = byDay[k] || { total: 0, max: 0 };
          const v = safeNum(r.rev, 0);
          byDay[k].total += v;
          if (v > byDay[k].max) byDay[k].max = v;
        }
        const topCategoryShare = days.map((d) => {
          const s = byDay[d];
          if (!s || s.total <= 0) return 0;
          return s.max / s.total;
        });
        factors.top_category_share = topCategoryShare;
      } catch (e) {
        log("category share compute failed", e.message);
      }
    }

    // Customer/Segment driver: repeat customer share (if a customer column exists)
    if (db && discovered && discovered.customerCol) {
      try {
        const dayExpr = `strftime('%Y-%m-%d', "${discovered.dateCol}")`;
        const where = [
          `date("${discovered.dateCol}") BETWEEN date(?) AND date(?)`,
          (customerIds?.length && discovered.customerCol) ? `"${discovered.customerCol}" IN (${customerIds.map(()=>"?").join(",")})` : null,
          (productGroups?.length && discovered.productCol) ? `"${discovered.productCol}" IN (${productGroups.map(()=>"?").join(",")})` : null,
          (Array.isArray(customerSegments) && customerSegments.length>0 && discovered.table) ? (()=>{
            const cols = columnsOf(db, discovered.table);
            const segCol = pick(cols, ['Customer Segment','Segment','customer_segment','segment']);
            return segCol ? `"${segCol}" IN (${customerSegments.map(()=>"?").join(",")})` : null;
          })() : null,
        ].filter(Boolean).join(" AND ");
        const params = [startDate, endDate, ...(customerIds || []), ...(productGroups || []), ...(customerSegments||[])];
        const sqlCust = `
          SELECT ${dayExpr} AS day,
                 COUNT(*) AS txns,
                 COUNT(DISTINCT "${discovered.customerCol}") AS custs
          FROM "${discovered.table}"
          WHERE ${where}
          GROUP BY day
          ORDER BY day
        `;
        const rowsCust = db.prepare(sqlCust).all(...params) || [];
        const map = Object.fromEntries(rowsCust.map(r => [r.day, { txns: safeNum(r.txns,0), custs: safeNum(r.custs,0) }]));
        const repeatShare = days.map((d) => {
          const r = map[d];
          if (!r) return 0;
          const tx = Math.max(1, r.txns);
          const unique = Math.min(tx, r.custs);
          return Math.max(0, (tx - unique) / tx);
        });
        factors.repeat_customer_share = repeatShare;
      } catch (e) {
        log("repeat customer compute failed", e.message);
      }
    }

    // Inventory/Supply driver: stockout proxy from order shortfall vs 7d average
    const qtyMA7 = movingAvg(qty, 7);
    const stockoutProxy = qty.map((qv, i) => {
      const baseline = qtyMA7[i] || 0;
      if (baseline <= 0) return 0;
      return clamp01(Math.max(0, (baseline - qv) / baseline));
    });
    factors.stockout_proxy = stockoutProxy;

    // Marketing driver: campaign activity proxy from orders up and AOV down
    const diff = (arr) => arr.map((v, i) => (i === 0 ? 0 : v - (arr[i-1] || 0)));
    const qtyMA5 = movingAvg(qty, 5);
    const aovMA5 = movingAvg(aovSeries, 5);
    const dq = diff(qtyMA5).map(v => Math.max(0, v));
    const dAov = diff(aovMA5).map(v => Math.max(0, -v)); // negative aov change
    const campaignProxy = dq.map((v, i) => clamp01((v / (Math.abs(qtyMA5[i]) + 1e-6)) * (dAov[i] / (Math.abs(aovMA5[i]) + 1e-6))));
    factors.campaign_activity_proxy = campaignProxy;

    // External driver: holiday flag (basic US holiday approximations)
    function isUsHoliday(date) {
      const y = date.getFullYear();
      const m = date.getMonth()+1;
      const d = date.getDate();
      const dow = date.getDay();
      const nthDow = Math.floor((d - 1) / 7) + 1;
      const lastDow = (dayOfWeek) => {
        const lastDay = new Date(y, m, 0).getDate();
        for (let dd = lastDay; dd >= lastDay-6; dd--) {
          const t = new Date(y, m-1, dd);
          if (t.getDay() === dayOfWeek) return dd;
        }
        return lastDay;
      };
      // Fixed-date
      if ((m===1 && d===1) || (m===7 && d===4) || (m===12 && d===25)) return 1; // New Year, Independence, Christmas
      // Labor Day: first Monday of September
      if (m===9 && dow===1 && nthDow===1) return 1;
      // Memorial Day: last Monday of May
      if (m===5 && d===lastDow(1)) return 1;
      // Thanksgiving: fourth Thursday of November
      if (m===11 && dow===4 && nthDow===4) return 1;
      return 0;
    }
    const holidayFlag = ts.map(t => isUsHoliday(t));
    factors.holiday_flag = holidayFlag;
    const corr = Object.fromEntries(Object.entries(factors).map(([k, arr]) => [k, Math.abs(pearson(arr, values))]));
    const corrSum = Object.values(corr).reduce((s,x)=>s+x,0) || 1;
    const aggFI = Object.entries(corr).map(([feature,v]) => ({ feature, avg_importance: v/corrSum }));

    const featureImportance = {
      aggregated: aggFI,
      byKPI: {
        // For revenue, include full strength of drivers derived from DB
        daily_revenue:   { feature_importance: aggFI.map(x => ({ feature: x.feature, importance: x.avg_importance })) },
        // For orders, time drivers tend to dominate; keep slightly reduced weight
        daily_orders:    { feature_importance: aggFI.map(x => ({ feature: x.feature, importance: clamp01(x.avg_importance * 0.8) })) },
        // For AOV itself, de-emphasize purely time features and emphasize price proxy
        avg_order_value: { feature_importance: aggFI.map(x => ({ feature: x.feature, importance: x.feature === 'order_value' ? clamp01(x.avg_importance) : clamp01(x.avg_importance * 0.6) })) },
      }
    };

    const vdWeights = [
      { name: "Seasonality",         share: clamp01((corr.month + corr.day_of_week) / (2 * corrSum)) },
      { name: "Promotions / Events", share: 0.18 },
      { name: "Customer Mix",        share: 0.22 },
      { name: "Price / AOV",         share: 0.19 },
      { name: "Noise / Unexplained", share: 0.41 },
    ];
    const totalVD = vdWeights.reduce((s,c)=>s+c.share,0) || 1;
    const varianceDecomposition = { components: vdWeights.map(c => ({ name: c.name, share: c.share/totalVD })) };

    const radar = {
      sales:   [{t:"Predictability", v: 0.7},{t:"Growth", v:0.65},{t:"Volatility", v:0.45},{t:"Seasonality", v:0.60}],
      ar:      [{t:"Predictability", v: 0.62},{t:"Growth", v:0.40},{t:"Volatility", v:0.35},{t:"Seasonality", v:0.55}],
      loyalty: [{t:"Predictability", v: 0.50},{t:"Growth", v:0.72},{t:"Volatility", v:0.30},{t:"Seasonality", v:0.42}],
    };
    const businessFunctionComparison = { radar };

    const factorCorrelations = { series: { daily_revenue: perfExplorer.daily_revenue } };

    const patterns = [];
    const calendar = {};
    for (let i = 0; i < days.length; i++) {
      const d = new Date(days[i]);
      const mag = deviation[i] / (Math.abs(predicted[i]) + 1e-6);
      const year = d.getFullYear(), mon = d.getMonth()+1, day = d.getDate();
      calendar[year] = calendar[year] || {};
      calendar[year][mon] = calendar[year][mon] || [];
      calendar[year][mon].push({ day, date: days[i], magnitude: mag });
      if (Math.abs(mag) >= 0.25) {
        patterns.push({ date: days[i], year, deviation_magnitude: mag, pattern_type: mag>0?"positive_anomaly":"negative_anomaly", is_significant: true });
      }
    }
    const monthlyStats = {};
    days.forEach((d,i) => {
      const key = d.slice(0,7);
      monthlyStats[key] = monthlyStats[key] || { totalDeviations: 0, significantDeviations: 0, averageMagnitude: 0 };
      monthlyStats[key].totalDeviations++;
      monthlyStats[key].averageMagnitude += Math.abs(deviation[i]);
      if (Math.abs(deviation[i]) >= 0.25 * (Math.abs(predicted[i]) + 1e-6)) monthlyStats[key].significantDeviations++;
    });
    for (const k of Object.keys(monthlyStats)) {
      const m = monthlyStats[k];
      m.averageMagnitude = m.averageMagnitude / Math.max(1, m.totalDeviations);
    }
    const deviationPatterns = { calendar, monthlyStats, patterns };

    const totalRevenue = revenue.reduce((s,x)=>s+x,0);
    const absDev = deviation.map(Math.abs);
    const kpis = {
      averageDeviation: (absDev.reduce((s,x)=>s+x,0) / Math.max(1,totalRevenue)) || 0,
      anomalyCount: patterns.length,
      topFactor: aggFI.sort((a,b)=>b.avg_importance-a.avg_importance)[0]?.feature || "day_of_week",
      explanationPower: clamp01(1 - (absDev.reduce((s,x)=>s+x,0) / (absDev.length ? absDev.length * (Math.max(...absDev)+1e-6) : 1))),
      forecastTrend: deviation.slice(-14).every(v => Math.abs(v) < 1e-6) ? "stable" : "volatile",
    };

    const metadata = {
      discovered,
      totalDataPoints: days.length,
      businessFunctions: ["sales", "customer", "finance"],
      lastUpdated: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: {
        kpis,
        metadata,
        risk: { customers: [] },
        visualizationData: {
          performanceExplorer: perfExplorer,
          featureImportance,
          varianceDecomposition,
          businessFunctionComparison,
          factorCorrelations,
          deviationPatterns,
        }
      }
    });
  } catch (err) {
    log("error", err);
    // Return 200 with {success:false} so UI doesn’t hard-crash
    res.status(200).json({ success: false, error: err.message || String(err) });
  }
}

// ---- demo series ------------------------------------------------------------
function demoSeries(start, end) {
  const out = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
    const dow = d.getDay();
    const month = d.getMonth()+1;
    const base = 800 + (month*10) + (dow===0||dow===6 ? 120 : 0);
    const noise = Math.sin(d.getTime()/8.64e7)*40 + (Math.random()*30-15);
    out.push({
      day: d.toISOString().slice(0,10),
      revenue: Math.max(0, base + noise),
      qty: Math.round(25 + month*0.8 + (dow===0||dow===6?12:0) + Math.random()*6)
    });
  }
  return out;
}
