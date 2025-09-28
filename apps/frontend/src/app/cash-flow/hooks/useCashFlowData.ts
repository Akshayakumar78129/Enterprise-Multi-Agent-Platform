import { useEffect, useState, useMemo, useRef } from "react";

function getDashboardClient(dashboardType: string) {
  return {
    fetchSummary: async (params: any, options?: RequestInit) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            cashFlowTrends: {
              monthly: [
                { month: 'Jan', operating: 250000, investing: -50000, financing: -25000, net: 175000 },
                { month: 'Feb', operating: 280000, investing: -30000, financing: -40000, net: 210000 },
                { month: 'Mar', operating: 320000, investing: -75000, financing: -20000, net: 225000 },
                { month: 'Apr', operating: 290000, investing: -40000, financing: -35000, net: 215000 },
                { month: 'May', operating: 310000, investing: -60000, financing: -30000, net: 220000 },
                { month: 'Jun', operating: 340000, investing: -45000, financing: -25000, net: 270000 }
              ]
            },
            operatingCashFlow: {
              revenue_collections: 1850000,
              expense_payments: -1320000,
              tax_payments: -85000,
              net_operating: 445000,
              breakdown: [
                { category: 'Sales Collections', amount: 1850000 },
                { category: 'Operating Expenses', amount: -1200000 },
                { category: 'Payroll', amount: -120000 },
                { category: 'Taxes', amount: -85000 }
              ]
            },
            investmentCashFlow: {
              equipment_purchases: -180000,
              asset_sales: 25000,
              investments: -45000,
              net_investment: -200000,
              breakdown: [
                { category: 'Equipment', amount: -180000 },
                { category: 'Asset Sales', amount: 25000 },
                { category: 'Investments', amount: -45000 }
              ]
            },
            financingCashFlow: {
              loan_proceeds: 100000,
              loan_payments: -80000,
              dividend_payments: -45000,
              net_financing: -25000,
              breakdown: [
                { category: 'Loan Proceeds', amount: 100000 },
                { category: 'Loan Payments', amount: -80000 },
                { category: 'Dividends', amount: -45000 }
              ]
            },
            cashFlowProjection: {
              projected: [
                { month: 'Jul', operating: 350000, investing: -55000, financing: -30000, net: 265000 },
                { month: 'Aug', operating: 360000, investing: -40000, financing: -35000, net: 285000 },
                { month: 'Sep', operating: 370000, investing: -50000, financing: -25000, net: 295000 }
              ],
              scenarios: {
                optimistic: 320000,
                realistic: 285000,
                pessimistic: 240000
              }
            },
            cashFlowItems: [
              {
                item_id: 'CF001',
                item_name: 'Q2 Operating Cash Flow',
                net_cash_flow: 265000,
                operating_cf: 310000,
                investment_cf: -45000,
                financing_cf: -30000,
                category: 'Operating'
              },
              {
                item_id: 'CF002',
                item_name: 'Equipment Investment',
                net_cash_flow: -180000,
                operating_cf: 0,
                investment_cf: -180000,
                financing_cf: 0,
                category: 'Investment'
              }
            ]
          });
        }, 1000);
      });
    }
  };
}

interface CashFlowFilters {
  timePeriod: string;
  cashFlowType: string;
  departments: string[];
  projects: string[];
  minAmount: number;
  includeProjections: boolean;
}

export function useCashFlowData(filters: CashFlowFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [cashFlowTrends, setCashFlowTrends] = useState<any>(null);
  const [operatingCashFlow, setOperatingCashFlow] = useState<any>(null);
  const [investmentCashFlow, setInvestmentCashFlow] = useState<any>(null);
  const [financingCashFlow, setFinancingCashFlow] = useState<any>(null);
  const [cashFlowProjection, setCashFlowProjection] = useState<any>(null);
  const [cashFlowItems, setCashFlowItems] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const client = useMemo(() => getDashboardClient("cash-flow"), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await client.fetchSummary({});
        const effective = response || {};
        setData(effective);
        setCashFlowTrends(effective.cashFlowTrends || {});
        setOperatingCashFlow(effective.operatingCashFlow || {});
        setInvestmentCashFlow(effective.investmentCashFlow || {});
        setFinancingCashFlow(effective.financingCashFlow || {});
        setCashFlowProjection(effective.cashFlowProjection || {});
        setCashFlowItems(effective.cashFlowItems || []);
        setHasNoData(!effective.cashFlowItems || effective.cashFlowItems.length === 0);
      } catch (err) {
        setError("Failed to fetch cash flow data");
        setHasNoData(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, client]);

  const kpiMetrics = useMemo(() => {
    if (!data || hasNoData) {
      return { netCashFlow: 0, operatingCF: 0, investmentCF: 0, financingCF: 0, cashRatio: 0 };
    }
    const netCashFlow = operatingCashFlow?.net_operating || 0;
    const opCF = operatingCashFlow?.net_operating || 0;
    const invCF = investmentCashFlow?.net_investment || 0;
    const finCF = financingCashFlow?.net_financing || 0;
    const cashRatio = opCF > 0 ? ((opCF + invCF + finCF) / opCF * 100) : 0;

    return {
      netCashFlow: netCashFlow.toLocaleString(),
      operatingCF: opCF.toLocaleString(),
      investmentCF: invCF.toLocaleString(),
      financingCF: finCF.toLocaleString(),
      cashRatio: cashRatio.toFixed(1),
    };
  }, [data, operatingCashFlow, investmentCashFlow, financingCashFlow, hasNoData]);

  return {
    loading, error, data, cashFlowTrends, operatingCashFlow, investmentCashFlow,
    financingCashFlow, cashFlowProjection, cashFlowItems, hasNoData, kpiMetrics, client
  };
}