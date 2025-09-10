
interface FilterResult {
  text: string;
  values: any[];
}

export function applyFilters(query: string, filters: Record<string, any>): FilterResult {
  if (!filters || Object.keys(filters).length === 0) {
    return { text: query, values: [] };
  }

  const whereClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [field, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      whereClauses.push(`${field} = ANY($${paramIndex})`);
      values.push(value);
    } else {
      whereClauses.push(`${field} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  }

  const hasWhere = query.toLowerCase().includes("where");
  const filterClause = whereClauses.join(" AND ");
  const text = hasWhere ? `${query} AND ${filterClause}` : `${query} WHERE ${filterClause}`;

  return { text, values };
}
