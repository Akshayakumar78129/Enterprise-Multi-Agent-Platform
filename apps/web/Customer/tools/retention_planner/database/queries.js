const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class RetentionPlannerQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async getCustomerData(filters = {}) {
    return new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(this.dbPath);
      
      // Build segment filter if segments provided
      let segmentFilter = "";
      if (filters.customer_segments && filters.customer_segments.length > 0) {
        const segmentsStr = filters.customer_segments.map(s => `'${s}'`).join(", ");
        segmentFilter = `AND cl."Loyalty Status" IN (${segmentsStr})`;
      }

      // Build date filter if provided
      let dateFilter = "";
      if (filters.dateRange) {
        dateFilter = `AND cl."Last Activity Date" >= '${filters.dateRange.start}' AND cl."Last Activity Date" <= '${filters.dateRange.end}'`;
      }

      const query = `
        WITH CustomerData AS (
          SELECT 
            c."Customer Key",
            c."Customer Number",
            c."Customer Name",
            c."Customer City",
            c."Customer State/Prov",
            cl."Loyalty Status",
            cl."RFM Score",
            cl."Recency Band",
            cl."Frequency Band", 
            cl."Monetary Band",
            cl."Days Since Last Activity",
            cl."Number Sales Txns",
            cl."Avg Sales Amount",
            cl."LTD Sales Amount",
            cl."Last Activity Date",
            cl."At Risk Customer Count",
            cl."Lost Customer Count",
            CASE 
              WHEN cl."Days Since Last Activity" > 90 THEN 1
              ELSE 0
            END as churn_indicator,
            CASE 
              WHEN cl."RFM Score" >= 8 THEN 'High'
              WHEN cl."RFM Score" >= 5 THEN 'Medium'
              ELSE 'Low'
            END as customer_value,
            CASE
              WHEN cl."Days Since Last Activity" > 90 THEN 'Inactive'
              WHEN cl."At Risk Customer Count" > 0 THEN 'At Risk'
              ELSE 'Engaged'
            END as churn_cause
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Entity Key" IS NOT NULL
            ${segmentFilter}
            ${dateFilter}
        )
        SELECT * FROM CustomerData
        ORDER BY "RFM Score" DESC, "Days Since Last Activity" ASC
      `;

      conn.all(query, [], (err, rows) => {
        conn.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getKPIData(filters = {}) {
    return new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(this.dbPath);
      
      let segmentFilter = "";
      if (filters.customer_segments && filters.customer_segments.length > 0) {
        const segmentsStr = filters.customer_segments.map(s => `'${s}'`).join(", ");
        segmentFilter = `AND cl."Loyalty Status" IN (${segmentsStr})`;
      }

      const query = `
        WITH CustomerData AS (
          SELECT 
            cl."Entity Key",
            cl."Loyalty Status",
            cl."RFM Score",
            cl."Days Since Last Activity",
            cl."Number Sales Txns",
            cl."Avg Sales Amount",
            cl."At Risk Customer Count",
            CASE 
              WHEN cl."Days Since Last Activity" > 90 THEN 1
              ELSE 0
            END as churn_indicator,
            CASE 
              WHEN cl."RFM Score" >= 8 THEN 'High'
              WHEN cl."RFM Score" >= 5 THEN 'Medium'
              ELSE 'Low'
            END as customer_value
          FROM 
            dbo_F_Customer_Loyalty cl
          WHERE 
            cl."Entity Key" IS NOT NULL
            ${segmentFilter}
        )
        SELECT 
          COUNT(*) as total_customers,
          SUM(CASE WHEN churn_indicator = 1 OR "At Risk Customer Count" > 0 THEN 1 ELSE 0 END) as high_risk_count,
          AVG(CASE WHEN churn_indicator = 1 THEN 0.8 ELSE 0.2 END) as avg_churn_risk,
          COUNT(DISTINCT customer_value) as segments_count,
          AVG("RFM Score") as avg_rfm_score,
          SUM("Avg Sales Amount") as total_value
        FROM CustomerData
      `;

      conn.get(query, [], (err, row) => {
        conn.close();
        if (err) {
          reject(err);
        } else {
          const highRiskPercentage = row.total_customers > 0 ? (row.high_risk_count / row.total_customers) * 100 : 0;
          resolve({
            totalCustomers: row.total_customers || 0,
            highRiskCount: row.high_risk_count || 0,
            highRiskPercentage: Math.round(highRiskPercentage),
            avgChurnRisk: Math.round((row.avg_churn_risk || 0) * 100) / 100,
            avgRfmScore: Math.round((row.avg_rfm_score || 0) * 10) / 10,
            totalValue: row.total_value || 0
          });
        }
      });
    });
  }

  async getRetentionActionsData(filters = {}) {
    return new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(this.dbPath);
      
      let segmentFilter = "";
      if (filters.customer_segments && filters.customer_segments.length > 0) {
        const segmentsStr = filters.customer_segments.map(s => `'${s}'`).join(", ");
        segmentFilter = `AND cl."Loyalty Status" IN (${segmentsStr})`;
      }

      const query = `
        WITH CustomerData AS (
          SELECT 
            cl."Entity Key",
            cl."Loyalty Status",
            cl."RFM Score",
            cl."Days Since Last Activity",
            cl."At Risk Customer Count",
            CASE 
              WHEN cl."Days Since Last Activity" > 90 THEN 1
              ELSE 0
            END as churn_indicator,
            CASE 
              WHEN cl."RFM Score" >= 8 THEN 'High'
              WHEN cl."RFM Score" >= 5 THEN 'Medium'
              ELSE 'Low'
            END as customer_value,
            CASE
              WHEN cl."Days Since Last Activity" > 90 THEN 'Inactive'
              WHEN cl."At Risk Customer Count" > 0 THEN 'At Risk'
              ELSE 'Engaged'
            END as churn_cause
          FROM 
            dbo_F_Customer_Loyalty cl
          WHERE 
            cl."Entity Key" IS NOT NULL
            ${segmentFilter}
        ),
        ActionsData AS (
          SELECT 
            customer_value,
            churn_cause,
            churn_indicator,
            "At Risk Customer Count",
            "Days Since Last Activity",
            CASE 
              WHEN churn_indicator = 0 AND "At Risk Customer Count" = 0 THEN 'No action needed'
              WHEN customer_value = 'High' AND "Days Since Last Activity" > 90 THEN 'Premium package'
              WHEN customer_value = 'High' AND "Days Since Last Activity" <= 90 THEN 'Loyalty upgrade'
              WHEN customer_value = 'Medium' AND "Days Since Last Activity" > 90 THEN 'Standard package'
              WHEN customer_value = 'Medium' AND "Days Since Last Activity" <= 90 THEN 'Targeted discount'
              WHEN customer_value = 'Low' AND churn_indicator = 1 AND "At Risk Customer Count" > 0 THEN 'Basic offer'
              ELSE 'Standard comm'
            END as recommended_action
          FROM CustomerData
        )
        SELECT 
          customer_value,
          recommended_action,
          COUNT(*) as customer_count,
          AVG(CASE 
            WHEN recommended_action = 'Premium package' THEN 0.85
            WHEN recommended_action = 'Loyalty upgrade' THEN 0.75
            WHEN recommended_action = 'Standard package' THEN 0.65
            WHEN recommended_action = 'Targeted discount' THEN 0.60
            WHEN recommended_action = 'Basic offer' THEN 0.45
            WHEN recommended_action = 'Standard comm' THEN 0.30
            ELSE 1.00
          END) as expected_effectiveness
        FROM ActionsData
        GROUP BY customer_value, recommended_action
        ORDER BY customer_value DESC, customer_count DESC
      `;

      conn.all(query, [], (err, rows) => {
        conn.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getSegmentPlaybooks(filters = {}) {
    return new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(this.dbPath);
      
      let segmentFilter = "";
      if (filters.customer_segments && filters.customer_segments.length > 0) {
        const segmentsStr = filters.customer_segments.map(s => `'${s}'`).join(", ");
        segmentFilter = `AND cl."Loyalty Status" IN (${segmentsStr})`;
      }

      const query = `
        WITH CustomerData AS (
          SELECT 
            cl."Loyalty Status",
            cl."RFM Score",
            cl."Days Since Last Activity",
            cl."At Risk Customer Count",
            CASE
              WHEN cl."Days Since Last Activity" > 90 THEN 'Inactive'
              WHEN cl."At Risk Customer Count" > 0 THEN 'At Risk'
              ELSE 'Engaged'
            END as churn_cause,
            CASE 
              WHEN cl."Days Since Last Activity" > 90 OR cl."At Risk Customer Count" > 0 THEN 1
              ELSE 0
            END as churn_indicator,
            CASE 
              WHEN cl."RFM Score" >= 8 THEN 'High'
              WHEN cl."RFM Score" >= 5 THEN 'Medium'
              ELSE 'Low'
            END as customer_value
          FROM 
            dbo_F_Customer_Loyalty cl
          WHERE 
            cl."Entity Key" IS NOT NULL
            ${segmentFilter}
        ),
        ActionsData AS (
          SELECT 
            "Loyalty Status",
            churn_cause,
            customer_value,
            churn_indicator,
            "Days Since Last Activity",
            "At Risk Customer Count",
            CASE 
              WHEN churn_indicator = 0 THEN 'No action needed'
              WHEN customer_value = 'High' AND "Days Since Last Activity" > 90 THEN 'Premium package'
              WHEN customer_value = 'High' AND "Days Since Last Activity" <= 90 THEN 'Loyalty upgrade'
              WHEN customer_value = 'Medium' AND "Days Since Last Activity" > 90 THEN 'Standard package'
              WHEN customer_value = 'Medium' AND "Days Since Last Activity" <= 90 THEN 'Targeted discount'
              WHEN customer_value = 'Low' AND churn_indicator = 1 THEN 'Basic offer'
              ELSE 'Standard comm'
            END as recommended_action
          FROM CustomerData
        )
        SELECT 
          "Loyalty Status" as segment,
          churn_cause,
          recommended_action,
          COUNT(*) as customer_count,
          AVG(CASE WHEN churn_indicator = 1 THEN 0.8 ELSE 0.2 END) as avg_churn_risk,
          AVG(CASE 
            WHEN recommended_action = 'Premium package' THEN 0.85
            WHEN recommended_action = 'Loyalty upgrade' THEN 0.75
            WHEN recommended_action = 'Standard package' THEN 0.65
            WHEN recommended_action = 'Targeted discount' THEN 0.60
            WHEN recommended_action = 'Basic offer' THEN 0.45
            WHEN recommended_action = 'Standard comm' THEN 0.30
            ELSE 1.00
          END) as avg_effectiveness
        FROM ActionsData
        GROUP BY "Loyalty Status", churn_cause, recommended_action
        ORDER BY "Loyalty Status", churn_cause, customer_count DESC
      `;

      conn.all(query, [], (err, rows) => {
        conn.close();
        if (err) {
          reject(err);
        } else {
          // Group results by segment and cause
          const playbooks = {};
          rows.forEach(row => {
            if (!playbooks[row.segment]) {
              playbooks[row.segment] = {};
            }
            if (!playbooks[row.segment][row.churn_cause]) {
              playbooks[row.segment][row.churn_cause] = {
                customer_count: 0,
                avg_churn_risk: 0,
                recommended_actions: []
              };
            }
            
            playbooks[row.segment][row.churn_cause].customer_count += row.customer_count;
            playbooks[row.segment][row.churn_cause].avg_churn_risk = row.avg_churn_risk;
            playbooks[row.segment][row.churn_cause].recommended_actions.push({
              action: row.recommended_action,
              count: row.customer_count,
              avg_effectiveness: row.avg_effectiveness
            });
          });
          
          resolve(playbooks);
        }
      });
    });
  }

  async getRoiProjectionData(filters = {}) {
    return new Promise((resolve, reject) => {
      const costBenefit = {
        'Premium package': { cost: 500, benefit: 5000 },
        'Loyalty upgrade': { cost: 200, benefit: 3000 },
        'Standard package': { cost: 100, benefit: 1500 },
        'Targeted discount': { cost: 50, benefit: 800 },
        'Basic offer': { cost: 25, benefit: 400 },
        'Standard comm': { cost: 10, benefit: 100 },
        'No action needed': { cost: 0, benefit: 0 }
      };

      this.getRetentionActionsData(filters).then(actionsData => {
        const roiData = actionsData.map(action => {
          const metrics = costBenefit[action.recommended_action] || { cost: 0, benefit: 0 };
          const totalCost = action.customer_count * metrics.cost;
          const totalBenefit = action.customer_count * metrics.benefit * action.expected_effectiveness;
          const roi = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0;
          
          return {
            action: action.recommended_action,
            customer_count: action.customer_count,
            total_cost: totalCost,
            total_benefit: totalBenefit,
            roi_percentage: Math.round(roi * 100) / 100,
            expected_effectiveness: action.expected_effectiveness
          };
        });

        resolve(roiData);
      }).catch(reject);
    });
  }
}

module.exports = { RetentionPlannerQueries }; 