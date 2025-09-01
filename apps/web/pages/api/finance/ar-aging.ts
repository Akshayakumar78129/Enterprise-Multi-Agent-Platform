import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

interface AgingBucket {
  range: string;
  amount: number;
  npvAdjustedAmount: number;
  count: number;
  percentOfTotal: number;
  valueErosion: number;
  color: string;
}

interface CustomerRisk {
  customerId: string;
  customerName: string;
  outstandingAmount: number;
  daysPastDue: number;
  riskScore: number;
  clv: number;
  paymentRiskScore: number;
  profitability: number;
  collectionProbability: number;
  segment: 'Strategic Partners' | 'Growth Opportunities' | 'Efficiency Targets' | 'Value Destroyers';
}

interface KPIMetric {
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  benchmark?: number;
  status: 'good' | 'warning' | 'critical';
}

async function getDatabaseConnection() {
  const dbPath = path.join(process.cwd(), 'apps', 'web', 'Finance', 'database', 'financial_agent.db');
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

function calculateNPVAdjustment(amount: number, daysPastDue: number, wacc: number = 10): number {
  const discountRate = wacc / 100 / 365; // Daily discount rate
  return amount / (1 + discountRate * daysPastDue);
}

function generateMockCustomerData(salesData: any[]): CustomerRisk[] {
  const customers: CustomerRisk[] = [];
  const customerMap = new Map();

  // Aggregate sales by customer
  salesData.forEach(row => {
    const customerId = row['Customer Key']?.toString() || 'Unknown';
    const amount = parseFloat(row['Net Sales Amount'] || 0);
    
    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        customerId,
        customerName: `Customer ${customerId}`,
        totalSales: 0,
        count: 0
      });
    }
    
    const customer = customerMap.get(customerId);
    customer.totalSales += amount;
    customer.count += 1;
  });

  // Convert to CustomerRisk format with simulated AR data
  Array.from(customerMap.values()).forEach((customer, index) => {
    if (customer.totalSales > 10000) { // Only include significant customers
      const daysPastDue = Math.floor(Math.random() * 90);
      const outstandingRatio = 0.15 + Math.random() * 0.25; // 15-40% of sales as outstanding
      const outstandingAmount = customer.totalSales * outstandingRatio;
      
      const riskScore = Math.min(100, daysPastDue + Math.random() * 30);
      const clv = customer.totalSales * (1.5 + Math.random() * 2); // 1.5x to 3.5x of sales
      const paymentRiskScore = riskScore + Math.random() * 20;
      
      let segment: CustomerRisk['segment'];
      if (clv > 500000 && paymentRiskScore < 50) segment = 'Strategic Partners';
      else if (clv > 500000 && paymentRiskScore >= 50) segment = 'Growth Opportunities';
      else if (clv <= 500000 && paymentRiskScore < 50) segment = 'Efficiency Targets';
      else segment = 'Value Destroyers';

      customers.push({
        customerId: customer.customerId,
        customerName: customer.customerName,
        outstandingAmount,
        daysPastDue,
        riskScore,
        clv,
        paymentRiskScore,
        profitability: customer.totalSales * (0.1 + Math.random() * 0.3),
        collectionProbability: Math.max(10, 100 - paymentRiskScore),
        segment
      });
    }
  });

  return customers.sort((a, b) => b.outstandingAmount - a.outstandingAmount).slice(0, 50);
}

function generateAgingBuckets(customers: CustomerRisk[], wacc: number): AgingBucket[] {
  const buckets = [
    { range: '0-30 days', min: 0, max: 30, color: '#00e0ff' },
    { range: '31-45 days', min: 31, max: 45, color: '#5fd4d6' },
    { range: '46-60 days', min: 46, max: 60, color: '#ffc145' },
    { range: '61-90 days', min: 61, max: 90, color: '#e930ff' },
    { range: '90+ days', min: 91, max: 999, color: '#e930ff' }
  ];

  const totalAmount = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);

  return buckets.map(bucket => {
    const customersInBucket = customers.filter(c => 
      c.daysPastDue >= bucket.min && c.daysPastDue <= bucket.max
    );
    
    const amount = customersInBucket.reduce((sum, c) => sum + c.outstandingAmount, 0);
    const avgDays = bucket.min + (bucket.max - bucket.min) / 2;
    const npvAdjustedAmount = calculateNPVAdjustment(amount, avgDays, wacc);
    const valueErosion = amount - npvAdjustedAmount;

    return {
      range: bucket.range,
      amount,
      npvAdjustedAmount,
      count: customersInBucket.length,
      percentOfTotal: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      valueErosion,
      color: bucket.color
    };
  });
}

function calculateKPIs(customers: CustomerRisk[], agingBuckets: AgingBucket[]): Record<string, KPIMetric> {
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);
  const totalValueLost = agingBuckets.reduce((sum, b) => sum + b.valueErosion, 0);
  
  const avgDSO = customers.length > 0 
    ? customers.reduce((sum, c) => sum + c.daysPastDue, 0) / customers.length 
    : 0;

  const concentrationRisk = customers.slice(0, 3)
    .reduce((sum, c) => sum + c.outstandingAmount, 0) / totalOutstanding * 100;

  return {
    workingCapitalROI: {
      value: 12.5,
      change: -2.1,
      trend: 'down',
      benchmark: 15,
      status: 'warning'
    },
    economicValueLost: {
      value: totalValueLost,
      change: 8.3,
      trend: 'up',
      status: 'critical'
    },
    cashVelocityScore: {
      value: Math.max(0, 100 - avgDSO * 2),
      change: -5.2,
      trend: 'down',
      benchmark: 75,
      status: avgDSO < 35 ? 'good' : avgDSO < 50 ? 'warning' : 'critical'
    },
    concentrationRisk: {
      value: Math.round(concentrationRisk * concentrationRisk), // HHI approximation
      change: 3.1,
      trend: 'up',
      status: concentrationRisk < 30 ? 'good' : concentrationRisk < 50 ? 'warning' : 'critical'
    },
    collectionROI: {
      value: 18.5,
      change: 2.3,
      trend: 'up',
      benchmark: 20,
      status: 'good'
    }
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDatabaseConnection();
    
    // Fetch sales transaction data to derive AR information
    const salesData = await db.all(`
      SELECT 
        "Customer Key",
        "Net Sales Amount",
        "Posting Date",
        "Sales Txn Number"
      FROM "dbo_F_Sales_Transaction" 
      WHERE "Net Sales Amount" > 0
      ORDER BY "Posting Date" DESC 
      LIMIT 1000
    `);

    await db.close();

    // Generate mock customer data based on actual sales
    const customers = generateMockCustomerData(salesData);
    
    // Calculate aging buckets with NPV adjustments
    const wacc = 10; // Default WACC
    const agingBuckets = generateAgingBuckets(customers, wacc);
    
    // Calculate KPIs
    const kpis = calculateKPIs(customers, agingBuckets);

    const response = {
      agingBuckets,
      customerRisks: customers,
      kpis,
      metadata: {
        totalCustomers: customers.length,
        totalOutstanding: customers.reduce((sum, c) => sum + c.outstandingAmount, 0),
        generatedAt: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('AR Aging API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AR aging data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}