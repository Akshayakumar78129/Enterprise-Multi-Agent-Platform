/**
 * Component Prop Mappers
 * Maps summary API responses to component props
 * Each mapper transforms the backend data structure to what the component expects
 */

/**
 * Type definitions for common component props
 */
export interface RiskPyramidProps {
  customers?: any[];
  data?: Array<{
    level: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
}

export interface FeatureImportanceProps {
  features?: Array<{
    name: string;
    importance: number;
    impact?: number;
  }>;
  data?: Array<{
    name: string;
    importance: number;
    impact?: number;
  }>;
}

export interface SegmentMatrixProps {
  segmentMatrix?: any[];
  data?: any[];
}

export interface ProbabilityHistogramProps {
  probabilities?: number[] | Array<{ bin: string; count: number }>;
  data?: any[];
}

export interface KPITilesProps {
  summary?: any;
  kpis?: any[];
  metrics?: any;
}

/**
 * Mapper type definition
 */
type ComponentPropMapper = (summaryData: any) => any;

/**
 * Registry of component prop mappers
 * Format: 'toolname.componentName' -> mapper function
 */
export const componentPropMappers: Record<string, ComponentPropMapper> = {
  // =============================
  // Churn Prediction Components
  // =============================
  'churn-prediction.riskPyramid': (summary) => {
    // Map customers array or risk_distribution to pyramid data
    const props: RiskPyramidProps = {};

    // Check for the actual API response structure
    const customerStats = summary.customerStats || summary.customers || [];

    if (summary.risk_distribution) {
      props.data = summary.risk_distribution;
    } else if (customerStats && customerStats.length > 0) {
      // Calculate risk distribution from customerStats
      const riskCounts: Record<string, number> = {
        'Very High': 0,
        'High': 0,
        'Medium': 0,
        'Low': 0
      };

      customerStats.forEach((customer: any) => {
        const risk = customer.riskLevel || customer.risk_level || 'Low';
        if (risk in riskCounts) {
          riskCounts[risk]++;
        }
      });

      const total = customerStats.length || 1;
      props.data = [
        { level: 'Very High', count: riskCounts['Very High'], percentage: (riskCounts['Very High'] / total) * 100, color: '#ef4444' },
        { level: 'High', count: riskCounts['High'], percentage: (riskCounts['High'] / total) * 100, color: '#f59e0b' },
        { level: 'Medium', count: riskCounts['Medium'], percentage: (riskCounts['Medium'] / total) * 100, color: '#eab308' },
        { level: 'Low', count: riskCounts['Low'], percentage: (riskCounts['Low'] / total) * 100, color: '#10b981' }
      ];
    } else {
      // If no customer data, return empty pyramid structure with zero values
      props.data = [
        { level: 'Very High', count: 0, percentage: 0, color: '#ef4444' },
        { level: 'High', count: 0, percentage: 0, color: '#f59e0b' },
        { level: 'Medium', count: 0, percentage: 0, color: '#eab308' },
        { level: 'Low', count: 0, percentage: 0, color: '#10b981' }
      ];
    }

    // Also include customers if available
    if (customerStats && customerStats.length > 0) {
      props.customers = customerStats;
    }

    return props;
  },

  'churn-prediction.featureImportance': (summary) => {
    const props: FeatureImportanceProps = {};

    // Handle the actual API response structure
    const features = summary.featureImportance || summary.feature_importance || [];

    if (features && features.length > 0) {
      props.data = features.map((feature: any) => ({
        name: feature.feature || feature.name || 'Unknown',
        importance: feature.importance || 0,
        impact: feature.impact || feature.importance || 0
      }));
    } else {
      // Return default feature importance if no data
      props.data = [
        { name: 'Recency', importance: 0, impact: 0 },
        { name: 'Frequency', importance: 0, impact: 0 },
        { name: 'Monetary', importance: 0, impact: 0 }
      ];
    }

    return props;
  },

  'churn-prediction.probabilityHistogram': (summary) => {
    // ProbabilityHistogram expects { data: number[] } where numbers are the probability values

    // Handle the actual API response structure
    const distribution = summary.probabilityDistribution || summary.probability_distribution || [];

    if (distribution && distribution.length > 0) {
      // Check if it's already an array of numbers
      if (typeof distribution[0] === 'number') {
        return { data: distribution };
      } else if (distribution[0] && typeof distribution[0] === 'object') {
        // If it's an object array, extract the values
        const values = distribution.map((item: any) =>
          item.value || item.probability || item.count || 0
        );
        return { data: values };
      }
    }

    // Fallback: Generate probability distribution from customer stats
    if (summary.customerStats && summary.customerStats.length > 0) {
      // Use risk percentages as probability values
      const riskPercentages = summary.customerStats
        .map((c: any) => c.riskPercentage || 0)
        .filter((v: number) => v > 0); // Filter out zero values for better visualization

      if (riskPercentages.length > 0) {
        return { data: riskPercentages };
      }
    }

    // Return empty array if no data
    return { data: [] };
  },

  'churn-prediction.segmentMatrix': (summary) => {
    const props: SegmentMatrixProps = {};

    console.log('[segmentMatrix mapper] Full summary data keys:', Object.keys(summary));

    // Handle the actual API response structure
    const segmentRiskData = summary.segmentRisk || summary.segment_risk || [];

    // The SegmentComparisonMatrix expects data in format: {segment, riskLevel, count, percentage}
    // The API returns segmentRisk in format: {segment, low, medium, high, very_high}

    const matrixData: any[] = [];

    console.log('[segmentMatrix mapper] segmentRiskData:', segmentRiskData);

    if (segmentRiskData && segmentRiskData.length > 0) {
      // Transform segmentRisk data to component format
      segmentRiskData.forEach((segmentInfo: any) => {
        // Convert each segment's risk counts to the expected format
        const segment = segmentInfo.segment;

        // Add entry for each risk level
        if (segmentInfo.low !== undefined) {
          matrixData.push({
            segment,
            riskLevel: 'Low',
            count: segmentInfo.low || 0,
            percentage: 0 // Can be calculated if total is known
          });
        }
        if (segmentInfo.medium !== undefined) {
          matrixData.push({
            segment,
            riskLevel: 'Medium',
            count: segmentInfo.medium || 0,
            percentage: 0
          });
        }
        if (segmentInfo.high !== undefined) {
          matrixData.push({
            segment,
            riskLevel: 'High',
            count: segmentInfo.high || 0,
            percentage: 0
          });
        }
        if (segmentInfo.very_high !== undefined || segmentInfo['very_high'] !== undefined) {
          matrixData.push({
            segment,
            riskLevel: 'Very High',
            count: segmentInfo.very_high || segmentInfo['very_high'] || 0,
            percentage: 0
          });
        }
      });

      props.data = matrixData;
    } else if (summary.customerStats && summary.customerStats.length > 0) {
      // Generate segment matrix from customer stats
      const segmentRiskMap: Record<string, Record<string, number>> = {};

      summary.customerStats.forEach((customer: any) => {
        const segment = customer.segment || 'Unknown';
        const risk = customer.riskLevel || 'Low';

        if (!segmentRiskMap[segment]) {
          segmentRiskMap[segment] = {
            'Low': 0,
            'Medium': 0,
            'High': 0,
            'Very High': 0
          };
        }

        if (risk in segmentRiskMap[segment]) {
          segmentRiskMap[segment][risk]++;
        }
      });

      // Convert to component format
      Object.entries(segmentRiskMap).forEach(([segment, risks]) => {
        Object.entries(risks).forEach(([riskLevel, count]) => {
          matrixData.push({
            segment,
            riskLevel,
            count,
            percentage: 0
          });
        });
      });

      props.data = matrixData;
    } else {
      // Return empty data with default structure
      const defaultSegments = ['Enterprise', 'Mid-Market', 'SMB'];
      const defaultRiskLevels = ['Very High', 'High', 'Medium', 'Low'];

      defaultSegments.forEach(segment => {
        defaultRiskLevels.forEach(riskLevel => {
          matrixData.push({
            segment,
            riskLevel,
            count: 0,
            percentage: 0
          });
        });
      });

      props.data = matrixData;
    }

    // Extract unique segments and risk levels from the data
    const uniqueSegments = Array.from(new Set(matrixData.map((d: any) => d.segment)));
    const uniqueRiskLevels = ['Very High', 'High', 'Medium', 'Low']; // Keep standard order

    // Pass the actual segments and risk levels to the component
    if (uniqueSegments.length > 0) {
      props.segments = uniqueSegments;
      props.riskLevels = uniqueRiskLevels;
    }

    // Also set segmentMatrix for backward compatibility
    props.segmentMatrix = matrixData;

    console.log('[segmentMatrix mapper] Final props:', {
      dataLength: matrixData.length,
      segments: props.segments,
      riskLevels: props.riskLevels,
      sampleData: matrixData.slice(0, 3)
    });

    return props;
  },

  'churn-prediction.temporalRisk': (summary) => {
    // Handle temporal risk (monthly risk trends over time)
    // This should return data for a LineChart component
    const monthlyRisk = summary.monthlyRisk || summary.monthly_risk || [];

    if (monthlyRisk && monthlyRisk.length > 0) {
      // Format monthly risk data for LineChart visualization
      const labels = monthlyRisk.map((m: any) => {
        // Format month label
        const month = m.month || m.date || '';
        // If it's a date, format it nicely
        if (month.includes('-')) {
          const [year, monthNum] = month.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames[parseInt(monthNum) - 1] || month;
        }
        return month;
      });

      // Create datasets for different risk levels
      const datasets = [
        {
          label: 'Very High Risk',
          data: monthlyRisk.map((m: any) => m.very_high_risk || m.very_high || 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2
        },
        {
          label: 'High Risk',
          data: monthlyRisk.map((m: any) => m.high_risk || m.high || 0),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2
        },
        {
          label: 'Medium Risk',
          data: monthlyRisk.map((m: any) => m.medium_risk || m.medium || 0),
          borderColor: '#eab308',
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          borderWidth: 2
        },
        {
          label: 'Low Risk',
          data: monthlyRisk.map((m: any) => m.low_risk || m.low || 0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2
        }
      ];

      return {
        data: {
          labels,
          datasets
        },
        title: 'Risk Trends Over Time'
      };
    }

    // Fallback: Generate from customerStats if available
    if (summary.customerStats && summary.customerStats.length > 0) {
      // Group by month if dates are available
      const monthlyData: Record<string, Record<string, number>> = {};

      summary.customerStats.forEach((customer: any) => {
        if (customer.last_purchase_date) {
          const date = new Date(customer.last_purchase_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              'Very High': 0,
              'High': 0,
              'Medium': 0,
              'Low': 0
            };
          }

          const risk = customer.riskLevel || 'Low';
          if (risk in monthlyData[monthKey]) {
            monthlyData[monthKey][risk]++;
          }
        }
      });

      const sortedMonths = Object.keys(monthlyData).sort();

      if (sortedMonths.length > 0) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const labels = sortedMonths.map(month => {
          const [year, monthNum] = month.split('-');
          return monthNames[parseInt(monthNum) - 1] || month;
        });

        return {
          data: {
            labels,
            datasets: [
              {
                label: 'Very High Risk',
                data: sortedMonths.map(m => monthlyData[m]['Very High']),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2
              },
              {
                label: 'High Risk',
                data: sortedMonths.map(m => monthlyData[m]['High']),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2
              },
              {
                label: 'Medium Risk',
                data: sortedMonths.map(m => monthlyData[m]['Medium']),
                borderColor: '#eab308',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderWidth: 2
              },
              {
                label: 'Low Risk',
                data: sortedMonths.map(m => monthlyData[m]['Low']),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2
              }
            ]
          },
          title: 'Risk Trends Over Time'
        };
      }
    }

    // Final fallback: empty line chart data
    return {
      data: {
        labels: [],
        datasets: []
      },
      title: 'Risk Trends Over Time'
    };
  },

  'churn-prediction.kpiTiles': (summary) => {
    const props: KPITilesProps = {};

    if (summary.summary) {
      props.summary = summary.summary;
    } else if (summary.kpis) {
      props.kpis = summary.kpis;
    } else {
      // Build KPIs from available data
      const kpis = [];

      // Calculate KPIs from customerStats if available
      if (summary.customerStats && summary.customerStats.length > 0) {
        const totalCustomers = summary.customerStats.length;
        const highRiskCustomers = summary.customerStats.filter((c: any) =>
          c.riskLevel === 'High' || c.riskLevel === 'Very High'
        ).length;
        const avgRiskPercentage = summary.customerStats.reduce((sum: number, c: any) =>
          sum + (c.riskPercentage || 0), 0
        ) / totalCustomers;

        kpis.push({
          label: 'Total Customers',
          value: totalCustomers,
          trend: 'stable'
        });

        kpis.push({
          label: 'High Risk',
          value: highRiskCustomers,
          trend: highRiskCustomers > totalCustomers * 0.2 ? 'up' : 'down'
        });

        kpis.push({
          label: 'Avg Risk Score',
          value: `${avgRiskPercentage.toFixed(1)}%`,
          trend: avgRiskPercentage > 50 ? 'up' : 'down'
        });

        kpis.push({
          label: 'Churn Rate',
          value: `${((highRiskCustomers / totalCustomers) * 100).toFixed(1)}%`,
          trend: highRiskCustomers > totalCustomers * 0.15 ? 'up' : 'down'
        });
      } else {
        // Default KPIs if no data
        kpis.push(
          { label: 'Total Customers', value: 0, trend: 'stable' },
          { label: 'High Risk', value: 0, trend: 'stable' },
          { label: 'Avg Risk Score', value: '0%', trend: 'stable' },
          { label: 'Churn Rate', value: '0%', trend: 'stable' }
        );
      }

      props.kpis = kpis;
    }

    return props;
  },

  // =============================
  // Sales Performance Components
  // =============================
  'sales-performance.kpis': (summary) => {
    // Map from backend structure: { kpiMetrics, mainData }
    return {
      metrics: summary.kpiMetrics || summary.kpis || {},
      loading: false
    };
  },

  'sales-performance.performanceOverview': (summary) => {
    // Map from mainData.productPerformance or mainData.regionPerformance
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.timeSeriesExplorer': (summary) => {
    // Map from mainData.salesTrends
    const data = summary.mainData?.salesTrends || summary.revenueTrends || summary.timeSeries || [];
    return {
      data: data,
      loading: false,
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.distributionAnalyzer': (summary) => {
    // Map from mainData.productPerformance or categoryPerformance
    const data = summary.mainData?.productPerformance || summary.mainData?.categoryPerformance || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.comparativeGrid': (summary) => {
    // Map from mainData.productPerformance
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.correlationMatrix': (summary) => {
    // Map from mainData.productPerformance
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product'
    };
  },

  'sales-performance.driverAnalysis': (summary) => {
    // Map from mainData.productPerformance
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  // Short aliases for agent compatibility
  'sales-performance.overview': (summary) => {
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.timeSeries': (summary) => {
    const data = summary.mainData?.salesTrends || summary.revenueTrends || summary.timeSeries || [];
    return {
      data: data,
      loading: false,
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.distribution': (summary) => {
    const data = summary.mainData?.productPerformance || summary.mainData?.categoryPerformance || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.comparative': (summary) => {
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  'sales-performance.correlation': (summary) => {
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product'
    };
  },

  'sales-performance.drivers': (summary) => {
    const data = summary.mainData?.productPerformance || summary.mainData?.products || summary.topProducts || [];
    return {
      data: data,
      loading: false,
      selectedDimension: summary.dimension || 'product',
      selectedMetric: summary.metric || 'revenue'
    };
  },

  // =============================
  // Customer Segmentation Components
  // =============================
  'customer-segmentation.distributionMap': (summary) => {
    // SegmentDistributionMap expects Customer[] data
    const segmentData = summary.mainData?.segmentData || [];
    return {
      data: segmentData,
      selectedSegments: [],
      width: 760,
      height: 500,
      loading: false
    };
  },

  'customer-segmentation.profileCards': (summary) => {
    // SegmentProfileCards expects segmentDistribution and segmentComparison
    return {
      segmentDistribution: summary.mainData?.segmentDistribution || [],
      segmentComparison: summary.mainData?.segmentComparison || [],
      loading: false
    };
  },

  'customer-segmentation.metricComparison': (summary) => {
    // SegmentMetricComparison expects data array of segments
    return {
      data: summary.mainData?.segmentDistribution || [],
      loading: false
    };
  },

  'customer-segmentation.kpiTiles': (summary) => {
    const kpis = summary.kpiMetrics || {};
    return {
      tiles: [
        {
          title: 'Total Segments',
          value: kpis.totalSegments || 0,
          unit: 'segments',
          color: '#8b5cf6'
        },
        {
          title: 'Largest Segment',
          value: kpis.largestSegmentSize || 0,
          unit: 'customers',
          color: '#10b981'
        },
        {
          title: 'Avg Segment Value',
          value: kpis.avgSegmentValue || 0,
          unit: '$',
          format: 'currency',
          color: '#f59e0b'
        },
        {
          title: 'Segmentation Quality',
          value: Math.round(kpis.segmentationQuality || 0),
          unit: '%',
          color: '#ef4444'
        }
      ],
      loading: false
    };
  },

  // =============================
  // Customer Behaviour Components
  // =============================
  'customer-behaviour.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'customer-behaviour.patterns': (summary) => {
    return {
      data: summary.mainData?.purchasePatterns || {},
      loading: false
    };
  },

  'customer-behaviour.overview': (summary) => {
    return {
      data: summary.mainData?.purchasePatterns || {},
      loading: false
    };
  },

  'customer-behaviour.purchasePatterns': (summary) => {
    return {
      data: summary.mainData?.purchasePatterns || {},
      loading: false
    };
  },

  'customer-behaviour.engagement': (summary) => {
    return {
      data: summary.mainData?.engagementMetrics || {},
      loading: false
    };
  },

  'customer-behaviour.engagementMetrics': (summary) => {
    return {
      data: summary.mainData?.engagementMetrics || {},
      loading: false
    };
  },

  'customer-behaviour.segments': (summary) => {
    return {
      data: summary.mainData?.customerSegments || [],
      loading: false
    };
  },

  'customer-behaviour.customerSegments': (summary) => {
    return {
      data: summary.mainData?.customerSegments || [],
      loading: false
    };
  },

  'customer-behaviour.table': (summary) => {
    return {
      data: summary.mainData?.topCustomers || [],
      loading: false
    };
  },

  // =============================
  // Customer Behavior Components (alternate name without hyphen)
  // =============================
  'customer-behavior.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'customer-behavior.patterns': (summary) => {
    return {
      data: summary.mainData?.purchasePatterns || {},
      loading: false
    };
  },

  'customer-behavior.overview': (summary) => {
    return {
      data: summary.mainData?.purchasePatterns || {},
      loading: false
    };
  },

  'customer-behavior.purchasePatterns': (summary) => {
    return {
      data: summary.mainData?.purchasePatterns || {},
      loading: false
    };
  },

  'customer-behavior.engagement': (summary) => {
    return {
      data: summary.mainData?.engagementMetrics || {},
      loading: false
    };
  },

  'customer-behavior.engagementMetrics': (summary) => {
    return {
      data: summary.mainData?.engagementMetrics || {},
      loading: false
    };
  },

  'customer-behavior.segments': (summary) => {
    return {
      data: summary.mainData?.customerSegments || [],
      loading: false
    };
  },

  'customer-behavior.customerSegments': (summary) => {
    return {
      data: summary.mainData?.customerSegments || [],
      loading: false
    };
  },

  'customer-behavior.table': (summary) => {
    return {
      data: summary.mainData?.topCustomers || [],
      loading: false
    };
  },

  // =============================
  // Engagement Classifier Components
  // =============================
  'engagement-classifier.kpiTiles': (summary) => {
    return {
      metrics: summary.kpiMetrics || summary.data?.kpis || {},
      loading: false
    };
  },

  'engagement-classifier.pyramid': (summary) => {
    return {
      data: summary.engagementDistribution || summary.data?.distribution || [],
      loading: false
    };
  },

  'engagement-classifier.timeline': (summary) => {
    return {
      data: summary.data?.timeline || summary.timeline || [],
      loading: false
    };
  },

  'engagement-classifier.opportunityFinder': (summary) => {
    return {
      data: summary.data?.opportunities || summary.opportunities || [],
      loading: false
    };
  },

  'engagement-classifier.customerClassification': (summary) => {
    return {
      data: summary.customerClassification || summary.data?.rfm_analysis || [],
      loading: false
    };
  },

  'engagement-classifier.engagementDistribution': (summary) => {
    return {
      data: summary.engagementDistribution || summary.data?.distribution || [],
      loading: false
    };
  },

  'engagement-classifier.engagementScore': (summary) => {
    return {
      data: summary.engagementScore || {
        current: summary.data?.kpis?.avg_engagement_score || 0,
        previous: summary.data?.kpis?.prev_engagement_score || 0,
        trend: summary.data?.kpis?.engagement_trend === 'Improving' ? 'up' : 'down'
      },
      loading: false
    };
  },

  'engagement-classifier.actionableInsights': (summary) => {
    return {
      data: summary.actionableInsights || summary.data?.opportunities || [],
      loading: false
    };
  },

  'engagement-classifier.engagementTrends': (summary) => {
    return {
      data: summary.data?.timeline || summary.timeline || [],
      loading: false
    };
  },

  'engagement-classifier.customerSearchAnalytics': (summary) => {
    return {
      onCustomerSelect: (customer: any) => console.log('Customer selected:', customer)
    };
  },

  'engagement-classifier.customerDetailModal': (summary) => {
    return {
      isOpen: false,
      onClose: () => {},
      customers: summary.customers || [],
      engagementLevel: null,
      title: 'Customer Details'
    };
  },

  // =============================
  // Performance Deviation Components
  // =============================
  'performance-deviation.kpiTiles': (summary) => {
    return {
      metrics: summary.kpi_metrics || summary.deviation_metrics || [],
      summary: summary
    };
  },

  'performance-deviation.performanceExplorer': (summary) => {
    return {
      data: summary.performance_data || summary.deviations || [],
      dimensions: summary.dimensions
    };
  },

  'performance-deviation.featureImportance': (summary) => {
    return {
      features: summary.deviation_drivers || summary.feature_importance || [],
      data: summary.importance_data
    };
  },

  'performance-deviation.varianceDecomposition': (summary) => {
    return {
      variance: summary.variance_decomposition || summary.variance_data || [],
      categories: summary.categories
    };
  },

  'performance-deviation.deviationPatterns': (summary) => {
    return {
      patterns: summary.deviation_patterns || summary.patterns || [],
      timeline: summary.timeline
    };
  },

  // =============================
  // Customer Lifetime Value Components
  // =============================
  'customer-lifetime-value.kpiTiles': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'customer-lifetime-value.ltvDistribution': (summary) => {
    return {
      data: summary.mainData?.ltvDistribution || [],
      loading: false
    };
  },

  'customer-lifetime-value.customerExplorer': (summary) => {
    return {
      data: summary.mainData?.topCustomers || [],
      loading: false
    };
  },

  'customer-lifetime-value.predictionAccuracy': (summary) => {
    return {
      data: summary.mainData?.predictionData || [],
      loading: false
    };
  },

  'customer-lifetime-value.segmentAnalysis': (summary) => {
    return {
      data: summary.mainData?.segmentAnalysis || [],
      loading: false
    };
  },

  'customer-lifetime-value.ltvTrends': (summary) => {
    return {
      data: summary.mainData?.ltvTrends || [],
      loading: false
    };
  },

  'customer-lifetime-value.valueContribution': (summary) => {
    return {
      data: summary.mainData?.valueContribution || [],
      loading: false
    };
  },

  // Short aliases for LTV components (agent compatibility)
  'customer-lifetime-value.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'customer-lifetime-value.distribution': (summary) => {
    return {
      data: summary.mainData?.ltvDistribution || [],
      loading: false
    };
  },

  'customer-lifetime-value.customers': (summary) => {
    return {
      data: summary.mainData?.topCustomers || [],
      loading: false
    };
  },

  'customer-lifetime-value.accuracy': (summary) => {
    return {
      data: summary.mainData?.predictionData || [],
      loading: false
    };
  },

  'customer-lifetime-value.segments': (summary) => {
    return {
      data: summary.mainData?.segmentAnalysis || [],
      loading: false
    };
  },

  'customer-lifetime-value.trends': (summary) => {
    return {
      data: summary.mainData?.ltvTrends || [],
      loading: false
    };
  },

  'customer-lifetime-value.contribution': (summary) => {
    return {
      data: summary.mainData?.valueContribution || [],
      loading: false
    };
  },

  // =============================
  // Product Performance Components
  // =============================
  'product-performance.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'product-performance.overview': (summary) => {
    return {
      data: {
        revenue: summary.mainData?.topProducts?.map(p => p.revenue) || [],
        units: summary.mainData?.topProducts?.map(p => p.unitsSold) || [],
        margin: summary.mainData?.topProducts?.map(p => p.marginPercent) || [],
        labels: summary.mainData?.topProducts?.map(p => p.productName) || []
      },
      loading: false
    };
  },

  'product-performance.topProducts': (summary) => {
    return {
      data: summary.mainData?.topProducts || [],
      loading: false
    };
  },

  'product-performance.categoryAnalysis': (summary) => {
    return {
      data: summary.mainData?.categoryPerformance || [],
      loading: false
    };
  },

  'product-performance.marginAnalysis': (summary) => {
    return {
      data: summary.mainData?.marginAnalysis || [],
      loading: false
    };
  },

  'product-performance.priceBands': (summary) => {
    return {
      data: summary.mainData?.priceBandDistribution || [],
      loading: false
    };
  },

  // =============================
  // Sales Trends Components
  // =============================
  'sales-trends.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'sales-trends.kpiTiles': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'sales-trends.overview': (summary) => {
    return {
      data: summary.mainData?.timeSeries || [],
      loading: false,
      selectedMetric: summary.filters?.metric || 'revenue'
    };
  },

  'sales-trends.timeSeries': (summary) => {
    return {
      data: summary.mainData?.timeSeries || [],
      loading: false,
      selectedMetric: summary.filters?.metric || 'revenue'
    };
  },

  'sales-trends.timeSeriesExplorer': (summary) => {
    return {
      data: summary.mainData?.timeSeries || [],
      loading: false,
      selectedMetric: summary.filters?.metric || 'revenue'
    };
  },

  'sales-trends.seasonality': (summary) => {
    return {
      data: summary.mainData?.seasonality || [],
      loading: false
    };
  },

  'sales-trends.seasonalPatternAnalyzer': (summary) => {
    return {
      data: summary.mainData?.seasonality || [],
      loading: false
    };
  },

  'sales-trends.growthRates': (summary) => {
    return {
      data: summary.mainData?.growthRates || [],
      loading: false
    };
  },

  'sales-trends.growthRateVisualizer': (summary) => {
    return {
      data: summary.mainData?.growthRates || [],
      loading: false
    };
  },

  'sales-trends.topPerformers': (summary) => {
    return {
      data: summary.mainData?.topPerformers || [],
      loading: false,
      dimension: summary.filters?.dimension || 'product'
    };
  },

  // =============================
  // Cash Flow Components
  // =============================
  'cash-flow.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'cash-flow.trends': (summary) => {
    return {
      data: summary.mainData?.trends || [],
      loading: false
    };
  },

  'cash-flow.operating': (summary) => {
    return {
      data: summary.mainData?.operating || [],
      loading: false
    };
  },

  'cash-flow.investing': (summary) => {
    return {
      data: summary.mainData?.investing || [],
      loading: false
    };
  },

  'cash-flow.financing': (summary) => {
    return {
      data: summary.mainData?.financing || [],
      loading: false
    };
  },

  'cash-flow.projection': (summary) => {
    return {
      data: summary.mainData?.projection || [],
      loading: false
    };
  },

  'cash-flow.table': (summary) => {
    return {
      data: summary.mainData?.transactions || [],
      loading: false
    };
  },

  'cash-flow.fcf-bridge': (summary) => {
    return {
      data: summary.mainData?.fcfBridge || [],
      loading: false
    };
  },

  'cash-flow.liquidity-timeline': (summary) => {
    return {
      data: summary.mainData?.liquidityTimeline || [],
      loading: false
    };
  },

  'cash-flow.capital-allocation': (summary) => {
    return {
      data: summary.mainData?.capitalAllocation || [],
      loading: false
    };
  },

  // =============================
  // AR Aging Analysis Components
  // =============================
  'ar-aging-analysis.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'ar-aging-analysis.overview': (summary) => {
    return {
      data: summary.mainData?.agingBuckets || [],
      npvSummary: summary.mainData?.npvSummary || {},
      loading: false
    };
  },

  'ar-aging-analysis.customerMatrix': (summary) => {
    return {
      data: summary.mainData?.customerInsights || [],
      loading: false
    };
  },

  'ar-aging-analysis.forecast': (summary) => {
    return {
      data: summary.mainData?.collectionForecast || [],
      loading: false
    };
  },

  'ar-aging-analysis.riskHeatmap': (summary) => {
    return {
      customers: summary.mainData?.customerInsights || [],
      agingBuckets: summary.mainData?.agingBuckets || [],
      loading: false
    };
  },

  'ar-aging-analysis.agingBreakdown': (summary) => {
    return {
      data: summary.mainData?.agingTable || [],
      loading: false
    };
  },

  // =============================
  // Inventory Components
  // =============================
  'inventory-level-analyzer.healthMatrix': (summary) => {
    return {
      matrix: summary.health_matrix || summary.inventory_health || [],
      categories: summary.categories
    };
  },

  'inventory-level-analyzer.itemAnalyzer': (summary) => {
    return {
      items: summary.items || summary.inventory_items || [],
      metrics: summary.item_metrics
    };
  },

  'inventory-holding-cost-analyzer.costBreakdown': (summary) => {
    return {
      breakdown: summary.cost_breakdown || summary.costs || [],
      total: summary.total_cost
    };
  },

  // =============================
  // Retention Planner Components
  // =============================
  // Retention Planner
  // =============================
  'retention-planner.kpis': (summary) => ({
    data: summary.kpiMetrics || {},
    loading: false
  }),

  'retention-planner.overview': (summary) => ({
    data: summary.mainData?.riskDistributionData || [],
    loading: false
  }),

  'retention-planner.riskDistribution': (summary) => ({
    data: summary.mainData?.riskDistributionData || [],
    loading: false
  }),

  'retention-planner.valueRiskMatrix': (summary) => ({
    data: summary.mainData?.valueRiskMatrixData || [],
    loading: false
  }),

  'retention-planner.interventionROI': (summary) => ({
    data: summary.mainData?.interventionroiData || [],
    loading: false
  }),

  'retention-planner.lifecycleStages': (summary) => ({
    data: summary.mainData?.customerLifecycleData || [],
    loading: false
  }),

  // =============================
  // Generic/Fallback Mappers
  // =============================
  'visualization.barchart': (summary) => {
    return {
      labels: summary.labels || [],
      datasets: summary.datasets || [{
        label: 'Data',
        data: summary.data || [],
        backgroundColor: 'rgba(0, 224, 255, 0.8)'
      }]
    };
  },

  'visualization.linechart': (summary) => {
    return {
      labels: summary.labels || [],
      datasets: summary.datasets || [{
        label: 'Data',
        data: summary.data || [],
        borderColor: 'rgba(0, 224, 255, 1)',
        backgroundColor: 'rgba(0, 224, 255, 0.1)'
      }]
    };
  },

  'visualization.histogram': (summary) => {
    return {
      data: summary.histogram || summary.distribution || summary.data || [],
      bins: summary.bins
    };
  },

  'visualization.heatmap': (summary) => {
    return {
      data: summary.heatmap || summary.matrix || summary.data || [],
      xAxis: summary.x_labels || summary.xAxis,
      yAxis: summary.y_labels || summary.yAxis
    };
  },

  // ============================================================================
  // NEXT PURCHASE PREDICTOR MAPPERS
  // ============================================================================
  'next-purchase.overview': (summary) => {
    return {
      data: summary.mainData?.predictions || [],
      loading: false
    };
  },

  'next-purchase.kpiTiles': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'next-purchase.kpis': (summary) => {
    return {
      metrics: summary.kpiMetrics || {},
      loading: false
    };
  },

  'next-purchase.predictions': (summary) => {
    return {
      data: summary.mainData?.predictions || [],
      loading: false
    };
  },

  'next-purchase.customerJourney': (summary) => {
    return {
      data: summary.mainData?.predictions || [],
      loading: false
    };
  },

  'next-purchase.probability': (summary) => {
    return {
      data: summary.mainData?.probabilityDistribution || {},
      loading: false
    };
  },

  'next-purchase.timing': (summary) => {
    return {
      data: summary.mainData?.timingForecast || [],
      loading: false
    };
  },

  'next-purchase.products': (summary) => {
    return {
      data: summary.mainData?.recommendedProducts || [],
      loading: false
    };
  },

  'next-purchase.affinity': (summary) => {
    return {
      data: summary.mainData?.affinityNetwork || { nodes: [], links: [] },
      loading: false
    };
  },

  'next-purchase.affinityNetwork': (summary) => {
    return {
      data: summary.mainData?.affinityNetwork || { nodes: [], links: [] },
      loading: false
    };
  },

  'next-purchase.confidence': (summary) => {
    return {
      data: summary.mainData?.confidenceMatrix || { matrix: [], products: [], segments: [] },
      loading: false
    };
  },

  'next-purchase.confidenceMatrix': (summary) => {
    return {
      data: summary.mainData?.confidenceMatrix || { matrix: [], products: [], segments: [] },
      loading: false
    };
  },

  'next-purchase.purchaseTiming': (summary) => {
    return {
      data: summary.mainData?.purchaseTimingData || summary.mainData?.purchaseTiming || [],
      loading: false
    };
  },

  'next-purchase.categoryPerformance': (summary) => {
    return {
      data: summary.mainData?.categoryPerformance || [],
      loading: false
    };
  },

  // =============================
  // Purchase Frequency Components
  // =============================
  'purchase-frequency.kpis': (summary) => {
    return {
      data: summary.kpiMetrics || {
        total_customers: 0,
        avg_frequency: 0,
        high_frequency_customers: 0,
        medium_frequency_customers: 0,
        low_frequency_customers: 0,
        total_revenue: 0
      },
      loading: false
    };
  },

  'purchase-frequency.overview': (summary) => {
    // Overview shows frequency distribution chart
    return {
      data: summary.frequencyDistribution || [],
      loading: false
    };
  },

  'purchase-frequency.distribution': (summary) => {
    return {
      data: summary.frequencyDistribution || [],
      loading: false
    };
  },

  'purchase-frequency.segmentation': (summary) => {
    return {
      data: summary.customerSegmentation || [],
      loading: false
    };
  },

  'purchase-frequency.intervals': (summary) => {
    return {
      data: summary.purchaseIntervals || [],
      loading: false
    };
  },

  'purchase-frequency.lifecycle': (summary) => {
    return {
      data: summary.lifecycleStages || [],
      loading: false
    };
  },

  'purchase-frequency.table': (summary) => {
    return {
      data: summary.customerDetails || [],
      loading: false
    };
  }
};

/**
 * Get mapper for a specific tool and component
 */
export function getComponentPropMapper(toolName: string, componentName: string): ComponentPropMapper | undefined {
  const key = `${toolName}.${componentName}`;
  return componentPropMappers[key];
}

/**
 * Map summary data to component props
 */
export function mapSummaryToProps(
  toolName: string,
  componentName: string,
  summaryData: any
): any {
  const mapper = getComponentPropMapper(toolName, componentName);

  if (!mapper) {
    console.warn(`No prop mapper found for ${toolName}.${componentName}, returning raw data`);
    return summaryData;
  }

  try {
    const mappedProps = mapper(summaryData);
    console.log(`[PropMapper] Mapped ${toolName}.${componentName}:`, mappedProps);
    return mappedProps;
  } catch (error) {
    console.error(`Error mapping props for ${toolName}.${componentName}:`, error);
    return summaryData; // Return raw data as fallback
  }
}

/**
 * Check if a mapper exists for a tool/component combination
 */
export function hasPropMapper(toolName: string, componentName: string): boolean {
  return `${toolName}.${componentName}` in componentPropMappers;
}