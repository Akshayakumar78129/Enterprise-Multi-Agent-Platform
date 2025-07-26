import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { start_date, end_date, customer_segments } = req.body;

    // Path to Python script
    const scriptPath = path.resolve(process.cwd(), 'Project/Customer/tools/purchase_frequency/purchase_frequency.py');
    
    // Command to execute Python script
    let command = `python3 "${scriptPath}" --start-date "${start_date}" --end-date "${end_date}"`;
    
    if (customer_segments && customer_segments.length > 0) {
      command += ` --segments "${customer_segments.join(',')}"`;
    }

    // Execute Python script
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('Error executing Python script:', stderr);
      return res.status(500).json({ message: 'Error processing purchase frequency data', error: stderr });
    }

    // Parse the output from the Python script
    // Assuming the Python script returns a JSON string
    const rawResult = JSON.parse(stdout);
    
    if (rawResult.status === 'error') {
      return res.status(500).json({ message: rawResult.report });
    }

    // Process the text-based report into visualization-ready data
    // This is a placeholder transformation - in production, the Python script
    // would return structured data directly
    const result = processRawOutput(rawResult.report, start_date, end_date);
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// Function to process the text-based output from the Python script
// into structured data for visualizations
function processRawOutput(report: string, startDate: string, endDate: string) {
  // This is a placeholder function that simulates parsing the text output
  // In a real implementation, the Python script would be modified to return
  // structured JSON data directly

  const lines = report.split('\n');
  
  // Extract basic metrics
  const totalCustomersMatch = lines.find(line => line.includes('Total Customers'))?.match(/(\d+)/);
  const avgPurchaseMatch = lines.find(line => line.includes('Average Purchases per Customer'))?.match(/(\d+\.\d+)/);
  const avgIntervalMatch = lines.find(line => line.includes('Average Days Between Purchases'))?.match(/(\d+\.\d+)/);
  
  // Extract segment information
  const highFreqMatch = lines.find(line => line.includes('High Frequency Customers'))?.match(/(\d+) \((\d+\.\d+)%\)/);
  const lowFreqMatch = lines.find(line => line.includes('Low Frequency Customers'))?.match(/(\d+) \((\d+\.\d+)%\)/);
  const activeCustomersMatch = lines.find(line => line.includes('Active Customers'))?.match(/(\d+) \((\d+\.\d+)%\)/);
  const highValueMatch = lines.find(line => line.includes('High Value Customers'))?.match(/(\d+) \((\d+\.\d+)%\)/);
  
  // Extract thresholds
  const highThresholdMatch = lines.find(line => line.includes('High Frequency Customers'))?.match(/>(\d+\.\d+)/);
  const lowThresholdMatch = lines.find(line => line.includes('Low Frequency Customers'))?.match(/<(\d+\.\d+)/);

  // Basic metrics
  const totalCustomers = totalCustomersMatch ? parseInt(totalCustomersMatch[1]) : 0;
  const avgPurchaseFrequency = avgPurchaseMatch ? parseFloat(avgPurchaseMatch[1]) : 0;
  const avgIntervalDays = avgIntervalMatch ? parseFloat(avgIntervalMatch[1]) : 0;
  
  // Active and high value percentages
  const activeCustomersPercentage = activeCustomersMatch ? parseFloat(activeCustomersMatch[2]) : 0;
  const highValueCustomersPercentage = highValueMatch ? parseFloat(highValueMatch[2]) : 0;
  
  // Generate frequency distribution data (simulated)
  const highThreshold = highThresholdMatch ? parseFloat(highThresholdMatch[1]) : avgPurchaseFrequency * 1.5;
  const lowThreshold = lowThresholdMatch ? parseFloat(lowThresholdMatch[1]) : avgPurchaseFrequency * 0.5;
  
  // Create simulated frequency distribution
  const frequencyDistribution = generateFrequencyDistribution(avgPurchaseFrequency, totalCustomers);
  
  // Create simulated interval data
  const intervalData = generateIntervalData(startDate, endDate);
  
  // Create simulated customer segments
  const customerSegments = generateCustomerSegments(totalCustomers, avgPurchaseFrequency);
  
  // Create simulated regularity data
  const regularityData = generateRegularityData();
  
  // Create simulated value segments
  const valueSegments = generateValueSegments(totalCustomers);

  return {
    // Basic KPI data
    total_customers: totalCustomers,
    avg_purchase_frequency: avgPurchaseFrequency,
    avg_interval_days: avgIntervalDays,
    active_customers_percentage: activeCustomersPercentage,
    high_value_customers_percentage: highValueCustomersPercentage,
    
    // Thresholds
    high_frequency_threshold: highThreshold,
    low_frequency_threshold: lowThreshold,
    
    // Visualization data
    frequency_distribution: frequencyDistribution,
    interval_data: intervalData,
    customer_segments: customerSegments,
    regularity_data: regularityData,
    value_segments: valueSegments,
    
    // Time range
    date_range: {
      start: startDate,
      end: endDate
    }
  };
}

// Helper function to generate simulated frequency distribution
function generateFrequencyDistribution(mean: number, totalCustomers: number) {
  const maxBin = Math.ceil(mean * 3);
  const distribution = [];
  
  // Normal-ish distribution around mean
  for (let bin = 1; bin <= maxBin; bin++) {
    const distance = Math.abs(bin - mean);
    let count = Math.floor(totalCustomers * (1 / (distance + 1)) * 0.5);
    
    // Ensure the mean bin has the highest count
    if (bin === Math.round(mean)) {
      count = Math.floor(totalCustomers * 0.25);
    }
    
    distribution.push({
      bin,
      count: Math.max(1, count)
    });
  }
  
  return distribution;
}

// Helper function to generate simulated interval data
function generateIntervalData(startDate: string, endDate: string) {
  const data = [];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate 4 weeks of data for each hour
  for (let week = 0; week < 4; week++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let hour = 8; hour < 20; hour++) { // Business hours
        data.push({
          day: daysOfWeek[dayIndex],
          hour,
          density: Math.random() * (hour > 11 && hour < 14 ? 1 : 0.5), // Higher density during lunch hours
          transaction_count: Math.floor(Math.random() * 50) + 1,
          avg_transaction_value: Math.floor(Math.random() * 100) + 20
        });
      }
    }
  }
  
  return data;
}

// Helper function to generate simulated customer segments
function generateCustomerSegments(totalCustomers: number, avgFrequency: number) {
  const segments = [];
  
  for (let i = 0; i < totalCustomers; i++) {
    // Random values centered around 1.0 with variation
    const frequency = Math.max(0.1, (Math.random() * 2) * avgFrequency);
    const recency = Math.random() * 2; // 0 to 2, with 1 being average
    const monetary = Math.random() * 2; // 0 to 2, with 1 being average
    
    segments.push({
      customer_id: `CUST${i.toString().padStart(5, '0')}`,
      frequency,
      recency,
      monetary
    });
  }
  
  return segments;
}

// Helper function to generate simulated regularity data
function generateRegularityData() {
  const timeframes = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Yearly'];
  
  return timeframes.map(timeframe => ({
    timeframe,
    percentage: Math.floor(Math.random() * 100)
  }));
}

// Helper function to generate simulated value segments
function generateValueSegments(totalCustomers: number) {
  // Define segments and their proportions
  const segmentDefs = [
    { segment: 'premium', proportion: 0.1 },
    { segment: 'standard', proportion: 0.3 },
    { segment: 'budget', proportion: 0.4 },
    { segment: 'occasional', proportion: 0.2 }
  ];
  
  return segmentDefs.map(def => {
    const count = Math.floor(totalCustomers * def.proportion);
    return {
      segment: def.segment,
      count,
      percentage: def.proportion * 100,
      avg_value: def.segment === 'premium' ? 200 :
                  def.segment === 'standard' ? 100 :
                  def.segment === 'budget' ? 50 : 25
    };
  });
} 