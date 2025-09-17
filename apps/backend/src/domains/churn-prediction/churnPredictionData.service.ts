import { pool } from "../../config/db";
import { database } from "../../config/database.factory";
import { applyFilters } from "../../filter-engine/filterEngine";
import { churnSchema } from "./churnPrediction.schema";

export class ChurnDataService {
  static async getCustomers(filters: Record<string, any> = {}) {
    const { tables, aliases, customer, transaction, loyalty } = churnSchema;

    const sql = `
      SELECT
        ${customer.refs.id}           AS ${customer.outputAliases.id},
        ${customer.refs.name}          AS ${customer.outputAliases.name},
        ${customer.refs.status}        AS ${customer.outputAliases.status},
        ${customer.refs.region}        AS ${customer.outputAliases.region},
        ${customer.refs.type}          AS ${customer.outputAliases.type},
        ${customer.refs.creditLimit}   AS ${customer.outputAliases.creditLimit}
      FROM ${tables.customer} ${aliases.customer}
      LEFT JOIN ${tables.transaction} ${aliases.transaction}
        ON ${transaction.refs.customerId} = ${customer.refs.id}
      LEFT JOIN ${tables.loyalty} ${aliases.loyalty}
        ON ${loyalty.refs.customerId} = ${customer.refs.id}
      WHERE 1=1
    `;

    console.log('[ChurnDataService.getCustomers] Generated SQL:', sql.substring(0, 300));

    const { text, values } = applyFilters(sql, filters);
    console.log('[ChurnDataService.getCustomers] After filters:', text.substring(0, 300));
    console.log('[ChurnDataService.getCustomers] Filter values:', values);

    // Use database factory for dual database support
    return database.query(text, values);
  }

  static async getTransactions(filters: Record<string, any> = {}) {
    const { tables, aliases, customer, transaction, loyalty } = churnSchema;

    const sql = `
      SELECT
        ${transaction.refs.customerId}    AS ${transaction.outputAliases.customerId},
        ${transaction.refs.txnId}          AS ${transaction.outputAliases.txnId},
        ${transaction.refs.date}           AS ${transaction.outputAliases.date},
        ${transaction.refs.netAmount}      AS ${transaction.outputAliases.netAmount},
        ${transaction.refs.grossAmount}    AS ${transaction.outputAliases.grossAmount},
        ${transaction.refs.returnAmount}   AS ${transaction.outputAliases.returnAmount},
        ${transaction.refs.itemNumber}     AS ${transaction.outputAliases.itemNumber},
        ${transaction.refs.document}       AS ${transaction.outputAliases.document}
      FROM ${tables.transaction} ${aliases.transaction}
      LEFT JOIN ${tables.customer} ${aliases.customer}
        ON ${customer.refs.id} = ${transaction.refs.customerId}
      LEFT JOIN ${tables.loyalty} ${aliases.loyalty}
        ON ${loyalty.refs.customerId} = ${transaction.refs.customerId}
      WHERE 1=1
    `;

    console.log('[ChurnDataService.getTransactions] Generated SQL:', sql.substring(0, 300));

    const { text, values } = applyFilters(sql, filters);
    console.log('[ChurnDataService.getTransactions] After filters:', text.substring(0, 300));

    // Use database factory for dual database support
    return database.query(text, values);
  }

  static async getLoyalty(filters: Record<string, any> = {}) {
    const { tables, aliases, customer, transaction, loyalty } = churnSchema;

    const sql = `
      SELECT
        ${loyalty.refs.customerId}                AS ${loyalty.outputAliases.customerId},
        ${loyalty.refs.customerNumber}            AS ${loyalty.outputAliases.customerNumber},
        ${loyalty.refs.loyaltyStatus}             AS ${loyalty.outputAliases.loyaltyStatus},
        ${loyalty.refs.rfmScore}                  AS ${loyalty.outputAliases.rfmScore},
        ${loyalty.refs.daysSinceLastActivity}     AS ${loyalty.outputAliases.daysSinceLastActivity},
        ${loyalty.refs.lifetimeSales}             AS ${loyalty.outputAliases.lifetimeSales},
        ${loyalty.refs.lastActivityDate}          AS ${loyalty.outputAliases.lastActivityDate}
      FROM ${tables.loyalty} ${aliases.loyalty}
      LEFT JOIN ${tables.customer} ${aliases.customer}
        ON ${customer.refs.id} = ${loyalty.refs.customerId}
      LEFT JOIN ${tables.transaction} ${aliases.transaction}
        ON ${transaction.refs.customerId} = ${loyalty.refs.customerId}
      WHERE 1=1
    `;
    const { text, values } = applyFilters(sql, filters);
    return database.query(text, values);
  }
}
