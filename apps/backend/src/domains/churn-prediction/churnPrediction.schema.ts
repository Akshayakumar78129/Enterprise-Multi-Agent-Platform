type TableKey = 'customer' | 'transaction' | 'loyalty';
type CustomerColumns = 'id' | 'name' | 'status' | 'region' | 'type' | 'creditLimit';
type TransactionColumns = 'customerId' | 'txnId' | 'date' | 'netAmount' | 'grossAmount' | 'returnAmount' | 'itemNumber' | 'document';
type LoyaltyColumns = 'customerId' | 'customerNumber' | 'loyaltyStatus' | 'rfmScore' | 'daysSinceLastActivity' | 'lifetimeSales' | 'lastActivityDate';

export const churnSchema = {
  tables: {
    customer: 'dbo_D_Customer',
    transaction: 'dbo_F_Sales_Transaction',
    loyalty: 'dbo_F_Customer_Loyalty',
  },

  aliases: {
    customer: 'c',
    transaction: 't',
    loyalty: 'cl',
  },

  customer: {
    columns: {
      id: '"Customer Key"',
      name: '"Customer Name"',
      status: '"Customer Status"',
      region: '"Customer State/Prov"',
      type: '"Customer Type Desc"',
      creditLimit: '"Credit Limit Amount"',
    },
    refs: {
      id: 'c."Customer Key"',
      name: 'c."Customer Name"',
      status: 'c."Customer Status"',
      region: 'c."Customer State/Prov"',
      type: 'c."Customer Type Desc"',
      creditLimit: 'c."Credit Limit Amount"',
    },
    outputAliases: {
      id: 'customer_id',
      name: 'customer_name',
      status: 'customer_status',
      region: 'region',
      type: 'customer_type',
      creditLimit: 'credit_limit',
    },
  },

  transaction: {
    columns: {
      customerId: '"Customer Key"',
      txnId: '"Sales Txn Key"',
      date: '"Txn Date"',
      netAmount: '"Net Sales Amount"',
      grossAmount: '"Sales Amount"',
      returnAmount: '"Return Amount"',
      itemNumber: '"Item Number"',
      document: '"Sales Txn Document"',
    },
    refs: {
      customerId: 't."Customer Key"',
      txnId: 't."Sales Txn Key"',
      date: 't."Txn Date"',
      netAmount: 't."Net Sales Amount"',
      grossAmount: 't."Sales Amount"',
      returnAmount: 't."Return Amount"',
      itemNumber: 't."Item Number"',
      document: 't."Sales Txn Document"',
    },
    outputAliases: {
      customerId: 'customer_id',
      txnId: 'txn_id',
      date: 'txn_date',
      netAmount: 'net_sales_amount',
      grossAmount: 'sales_amount',
      returnAmount: 'return_amount',
      itemNumber: 'item_number',
      document: 'sales_txn_document',
    },
  },

  loyalty: {
    columns: {
      customerId: '"Entity Key"',
      customerNumber: '"Customer Number"',
      loyaltyStatus: '"Loyalty Status"',
      rfmScore: '"RFM Score"',
      daysSinceLastActivity: '"Days Since Last Activity"',
      lifetimeSales: '"LTD Sales Amount"',
      lastActivityDate: '"Last Activity Date"',
    },
    refs: {
      customerId: 'cl."Entity Key"',
      customerNumber: 'cl."Customer Number"',
      loyaltyStatus: 'cl."Loyalty Status"',
      rfmScore: 'cl."RFM Score"',
      daysSinceLastActivity: 'cl."Days Since Last Activity"',
      lifetimeSales: 'cl."LTD Sales Amount"',
      lastActivityDate: 'cl."Last Activity Date"',
    },
    outputAliases: {
      customerId: 'customer_id',
      customerNumber: 'customer_number',
      loyaltyStatus: 'loyalty_status',
      rfmScore: 'rfm_score',
      daysSinceLastActivity: 'days_since_last_activity',
      lifetimeSales: 'lifetime_sales',
      lastActivityDate: 'last_activity_date',
    },
  },

  helpers: {
    buildSelect(table: TableKey, fields: string[]): string {
      const tableSchema = (churnSchema as any)[table];
      const alias = (churnSchema as any).aliases[table];
      const cols = tableSchema.columns as Record<string, string>;
      const outs = tableSchema.outputAliases as Record<string, string>;

      return fields
        .map((field) => {
          const column = cols[field];
          const outputAlias = outs[field];
          return `${alias}.${column} AS ${outputAlias}`;
        })
        .join(',\n        ');
    },

    buildJoin(leftTable: string, leftColumn: string, rightTable: string, rightColumn: string): string {
      return `${leftTable}.${leftColumn} = ${rightTable}.${rightColumn}`;
    },
  },
};
