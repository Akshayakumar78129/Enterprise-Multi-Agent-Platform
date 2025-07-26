// This is a Next.js API route that proxies to the actual implementation
// in the purchase_frequency tool directory

import { PurchaseFrequencyQueries } from "../../../Customer/tools/purchase_frequency/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new PurchaseFrequencyQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Fetch all required data
    const [
      mainData,
      kpis,
      frequencyDistribution,
      intervalHeatmap,
      customerSegments,
      valueSegments
    ] = await Promise.all([
      queries.getMainData(filters),
      queries.getKPIData(filters),
      queries.getFrequencyDistribution(filters),
      queries.getIntervalHeatmap(filters),
      queries.getCustomerSegments(filters),
      queries.getValueSegments(filters)
    ]);

    // Calculate additional metrics for the response
    const totalCustomers = mainData.length;
    const activeCustomers = mainData.filter(customer => customer.recency_status === 'Active').length;
    const avgFrequency = mainData.reduce((sum, customer) => sum + customer.total_purchases, 0) / totalCustomers;
    
    // Process frequency distribution for visualization
    const frequencyData = frequencyDistribution.map(bin => ({
      bin: bin.frequency_bin,
      count: bin.customer_count,
      percentage: (bin.customer_count / totalCustomers * 100).toFixed(1)
    }));

    // Process interval heatmap data
    const heatmapData = intervalHeatmap.map(item => ({
      dayOfWeek: parseInt(item.day_of_week),
      weekNumber: parseInt(item.week_number),
      date: item.transaction_date,
      transactionCount: item.transaction_count,
      totalSales: item.total_sales,
      avgTransactionValue: item.avg_transaction_value
    }));

    // Process customer segments for quadrant visualization
    const segmentData = customerSegments.map(customer => ({
      customerId: customer['Customer Key'],
      customerName: customer['Customer Name'],
      frequency: customer.frequency,
      monetaryValue: customer.monetary_value,
      recencyDays: customer.recency_days,
      segment: customer.segment,
      avgTransactionValue: customer.avg_transaction_value
    }));

    // Structure response
    const response = {
      success: true,
      data: {
        mainData: mainData,
        kpis: {
          totalCustomers: Math.round(kpis.total_customers || 0),
          avgPurchaseFrequency: parseFloat((kpis.avg_purchase_frequency || 0).toFixed(2)),
          avgDaysBetween: parseFloat((kpis.avg_days_between_purchases || 0).toFixed(1)),
          activeCustomerPercentage: parseFloat((kpis.active_customer_percentage || 0).toFixed(1)),
          highValuePercentage: parseFloat((kpis.high_value_percentage || 0).toFixed(1)),
          avgCustomerValue: parseFloat((kpis.avg_customer_value || 0).toFixed(2))
        },
        frequencyDistribution: frequencyData,
        intervalHeatmap: heatmapData,
        customerSegments: segmentData,
        valueSegments: valueSegments.map(segment => ({
          segment: segment.segment,
          customerCount: segment.customer_count,
          avgValue: parseFloat((segment.avg_value || 0).toFixed(2)),
          totalValue: parseFloat((segment.total_segment_value || 0).toFixed(2)),
          avgPurchases: parseFloat((segment.avg_purchases || 0).toFixed(1)),
          percentage: (segment.customer_count / totalCustomers * 100).toFixed(1)
        })),
        metadata: {
          totalCustomers: totalCustomers,
          activeCustomers: activeCustomers,
          avgFrequency: parseFloat(avgFrequency.toFixed(2)),
          dataUpdated: new Date().toISOString(),
          filters: filters
        }
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in purchase-frequency API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
} 