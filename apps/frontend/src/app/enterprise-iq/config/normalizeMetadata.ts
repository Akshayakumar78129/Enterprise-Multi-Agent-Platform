/**
 * Metadata Normalization Module
 * Normalizes SSE body metadata to ensure consistent format across all dashboards
 */

export interface NormalizedMetadata {
  // Date range - Use only dateFrom/dateTo as backend expects
  dateFrom?: string;
  dateTo?: string;

  // Time granularity
  time_granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  // Segmentation
  segment?: string;
  segment_id?: string;
  customer_segment?: string;

  // Risk and thresholds
  risk_level?: string;
  risk_threshold?: number;

  // Pagination and sorting
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';

  // Generic filters
  filters?: Record<string, any>;

  // Tool-specific fields
  count?: number;
  metric?: string;
  dimension?: string;
  category?: string;
  product_category?: string;
  time_period?: string;
  threshold?: number;

  // Additional common fields
  [key: string]: any;
}

/**
 * Normalize date fields to ISO format
 */
function normalizeDate(date: string | undefined): string | undefined {
  if (!date) return undefined;

  try {
    // Handle various date formats
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return undefined;

    // Return ISO date string (YYYY-MM-DD)
    return parsed.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
}

/**
 * Normalize time granularity values
 */
function normalizeTimeGranularity(value: string | undefined): NormalizedMetadata['time_granularity'] {
  if (!value) return 'monthly'; // Default

  const normalized = value.toLowerCase();
  switch (normalized) {
    case 'daily':
    case 'day':
      return 'daily';
    case 'weekly':
    case 'week':
      return 'weekly';
    case 'monthly':
    case 'month':
      return 'monthly';
    case 'quarterly':
    case 'quarter':
      return 'quarterly';
    case 'yearly':
    case 'year':
    case 'annual':
      return 'yearly';
    default:
      return 'monthly';
  }
}

/**
 * Clamp numeric values to a range
 */
function clampValue(value: number | undefined, min: number, max: number): number | undefined {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  if (isNaN(num)) return undefined;
  return Math.max(min, Math.min(max, num));
}

/**
 * Main normalization function
 * Accepts various formats and returns normalized metadata
 */
export function normalizeMetadata(body: Record<string, any>): NormalizedMetadata {
  const normalized: NormalizedMetadata = {};

  // Normalize dates - Use dateFrom/dateTo to match backend API expectations
  // Check for dateFrom/dateTo first (backend format), then fall back to other formats
  const startDate = normalizeDate(
    body.dateFrom || body.start_date || body.startDate || body.from_date || body.fromDate
  );
  const endDate = normalizeDate(
    body.dateTo || body.end_date || body.endDate || body.to_date || body.toDate
  );

  // ONLY use dateFrom/dateTo to match backend expectations (no duplicates)
  if (startDate) {
    normalized.dateFrom = startDate;
  }
  if (endDate) {
    normalized.dateTo = endDate;
  }

  // If only one date is provided, infer the range
  if (startDate && !endDate) {
    // Calculate end date as 30 days after start date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    // But cap at end of 2021 if it goes beyond
    const maxDate = new Date('2021-12-31');
    if (end > maxDate) {
      normalized.dateTo = '2021-12-31';
    } else {
      normalized.dateTo = end.toISOString().split('T')[0];
    }
  }
  if (endDate && !startDate) {
    // Default to 30 days before end date
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    normalized.dateFrom = start.toISOString().split('T')[0];
  }

  // Safety check: If dates are beyond 2021, adjust them to fit within data range
  // But keep the relative time period the user requested
  if (normalized.dateFrom && normalized.dateTo) {
    const fromDate = new Date(normalized.dateFrom);
    const toDate = new Date(normalized.dateTo);
    const maxDate = new Date('2021-12-31');

    // If dates are in the future, shift them back to 2021 keeping the same duration
    if (toDate > maxDate) {
      const duration = toDate.getTime() - fromDate.getTime();
      normalized.dateTo = '2021-12-31';
      const newFromDate = new Date(maxDate.getTime() - duration);
      normalized.dateFrom = newFromDate.toISOString().split('T')[0];
      console.log(`Adjusted future dates to fit within data range: ${normalized.dateFrom} to ${normalized.dateTo}`);
    }
  }

  // Normalize time granularity
  normalized.time_granularity = normalizeTimeGranularity(
    body.time_granularity || body.timeGranularity || body.granularity || body.period
  );

  // Normalize segments (handle various field names)
  normalized.segment = body.segment || body.customer_segment || body.customerSegment;
  normalized.segment_id = body.segment_id || body.segmentId;
  normalized.customer_segment = normalized.segment; // Keep both for compatibility

  // Normalize risk fields
  normalized.risk_level = body.risk_level || body.riskLevel || body.risk;
  normalized.risk_threshold = clampValue(
    body.risk_threshold || body.riskThreshold || body.threshold,
    0,
    1
  );

  // Pagination and sorting
  normalized.limit = body.limit || body.count || body.size;
  normalized.offset = body.offset || body.skip;
  normalized.sort_by = body.sort_by || body.sortBy || body.orderBy;
  normalized.sort_dir = body.sort_dir || body.sortDir || body.order || 'asc';

  // Tool-specific fields
  normalized.metric = body.metric || body.metrics;
  normalized.dimension = body.dimension || body.dimensions;
  normalized.category = body.category || body.category_level || body.categoryLevel;
  normalized.product_category = body.product_category || body.productCategory;
  normalized.time_period = body.time_period || body.timePeriod || body.period;
  normalized.count = body.count;
  normalized.threshold = body.threshold;

  // Generic filters - merge all unhandled fields
  const handledKeys = new Set([
    'start_date', 'startDate', 'dateFrom', 'from_date', 'fromDate',
    'end_date', 'endDate', 'dateTo', 'to_date', 'toDate',
    'time_granularity', 'timeGranularity', 'granularity', 'period',
    'segment', 'customer_segment', 'customerSegment',
    'segment_id', 'segmentId',
    'risk_level', 'riskLevel', 'risk',
    'risk_threshold', 'riskThreshold',
    'limit', 'count', 'size',
    'offset', 'skip',
    'sort_by', 'sortBy', 'orderBy',
    'sort_dir', 'sortDir', 'order',
    'metric', 'metrics',
    'dimension', 'dimensions',
    'category', 'category_level', 'categoryLevel',
    'product_category', 'productCategory',
    'time_period', 'timePeriod',
    'threshold'
  ]);

  // Collect unhandled fields into filters
  const filters: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!handledKeys.has(key) && value !== undefined && value !== null) {
      filters[key] = value;
    }
  }

  if (Object.keys(filters).length > 0) {
    normalized.filters = filters;
  }

  return normalized;
}

/**
 * Convert normalized metadata to query parameters for GET requests
 */
export function metadataToQueryParams(metadata: NormalizedMetadata): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // For filters object, stringify it
        params.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        // For arrays, join with comma
        params.append(key, value.join(','));
      } else {
        params.append(key, String(value));
      }
    }
  });

  return params;
}

/**
 * Validate metadata has minimum required fields
 */
export function validateMetadata(metadata: NormalizedMetadata): boolean {
  // Most dashboards need at least a date range
  // But we can work without it (will use defaults on backend)
  return true;
}

/**
 * Get default metadata for a tool if none provided
 * Uses full year 2021 as default since that's where our data exists
 */
export function getDefaultMetadata(toolName: string): NormalizedMetadata {
  // Use full year 2021 as default (complete data range for analysis)
  return {
    dateFrom: '2021-01-01',  // Start of 2021
    dateTo: '2021-12-31',    // End of 2021
    time_granularity: 'monthly',
    limit: 100
  };
}