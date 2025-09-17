
import { churnSchema } from "../domains/churn-prediction/churnPrediction.schema";

interface FilterResult {
  text: string;
  values: any[];
}

export function applyFilters(query: string, filters: Record<string, any>): FilterResult {
  if (!filters || Object.keys(filters).length === 0) {
    console.log('[FilterEngine] No filters provided, returning original query');
    return { text: query, values: [] };
  }

  const whereClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  console.log('[FilterEngine] Applying filters:', JSON.stringify(filters, null, 2));

  // Get schema references
  const { transaction, customer, loyalty } = churnSchema;

  for (const [field, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue; // Skip empty values
    }

    // Handle special date range filters using schema references
    if (field === 'dateFrom' && value) {
      whereClauses.push(`${transaction.refs.date} >= $${paramIndex}`);
      values.push(value);
      paramIndex++;
    } else if (field === 'dateTo' && value) {
      whereClauses.push(`${transaction.refs.date} <= $${paramIndex}`);
      values.push(value);
      paramIndex++;
    } else if (field === 'datefrom' && value) {
      whereClauses.push(`${transaction.refs.date} >= $${paramIndex}`);
      values.push(value);
      paramIndex++;
    } else if (field === 'dateto' && value) {
      whereClauses.push(`${transaction.refs.date} <= $${paramIndex}`);
      values.push(value);
      paramIndex++;
    } else if (field === 'segment' && value) {
      // Map segment filter to customer type using schema
      whereClauses.push(`${customer.refs.type} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    } else if (field === 'riskLevel' && value) {

      const riskToLoyaltyMap: Record<string, string[]> = {
        'Low': ['Active', 'Highly Active', 'New Customer'],
        'Medium': ['Occasional', 'Returning'],
        'High': ['Dormant', 'At Risk'],
        'Very High': ['Churned', 'Very Inactive']
      };

      const loyaltyStatuses = riskToLoyaltyMap[value];
      if (loyaltyStatuses && loyaltyStatuses.length > 0) {
        const placeholders = loyaltyStatuses.map(() => `$${paramIndex++}`).join(', ');
        whereClauses.push(`${loyalty.refs.loyaltyStatus} IN (${placeholders})`);
        values.push(...loyaltyStatuses);
      }
    } else if (field === 'timeRange') {
  
      const daysMap: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      const days = daysMap[value as string];
      if (days) {
        whereClauses.push(`${transaction.refs.date} >= date('now', '-${days} days')`);
      }
    } else {
      // Log unhandled filters for debugging
      console.log(`Unhandled filter: ${field} = ${value}`);
      continue;
    }
  }

  if (whereClauses.length === 0) {
    console.log('[FilterEngine] No valid filter clauses generated, returning original query');
    return { text: query, values: [] };
  }

  const hasWhere = query.toLowerCase().includes("where");
  const filterClause = whereClauses.join(" AND ");
  const text = hasWhere ? `${query} AND ${filterClause}` : `${query} WHERE ${filterClause}`;

  console.log('[FilterEngine] Generated filter clause:', filterClause);
  console.log('[FilterEngine] Total filter values:', values.length);

  return { text, values };
}
