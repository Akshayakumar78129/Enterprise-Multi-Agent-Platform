export const churnSchema = {
  tables: {
    customer: `public.dbo_d_customer`,          
    transaction: `public.dbo_f_sales_transaction`, 
    loyalty: `public.dbo_f_customer_loyalty`,   
  },

  customer: {
    id: 'c."Customer Key"',
    name: 'c."Customer Name"',
    status: 'c."Customer Status"',
    region: 'c."Customer State/Prov"',
    type: 'c."Customer Type Desc"',
    creditLimit: 'c."Credit Limit Amount"',
  },

  transaction: {
    customerId: 't."Customer Key"',
    txnId: 't."Sales Txn Key"',
    date: 't."Txn Date"',                      
    netAmount: 't."Net Sales Amount"',        
    grossAmount: 't."Sales Amount"',           
    returnAmount: 't."Return Amount"',        
    itemNumber: 't."Item Number"',
    document: 't."Sales Txn Document"',
  },

  loyalty: {
    customerId: 'cl."Entity Key"',            
    customerNumber: 'cl."Customer Number"',
    loyaltyStatus: 'cl."Loyalty Status"',
    rfmScore: 'cl."RFM Score"',
    daysSinceLastActivity: 'cl."Days Since Last Activity"',
    lifetimeSales: 'cl."LTD Sales Amount"',
    lastActivityDate: 'cl."Last Activity Date"',
  },
};
