/**
 * Summary API Client
 * Generic fetcher for dashboard summary endpoints with error handling and caching
 */

import { NormalizedMetadata, metadataToQueryParams } from '../config/normalizeMetadata';

export interface SummaryClientOptions {
  cache?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface SummaryResponse<T = any> {
  data: T;
  cache?: {
    hit: boolean;
    key?: string;
    ttl?: number;
  };
  error?: string;
}

// Simple in-memory cache for summary responses
const summaryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

/**
 * Generate cache key from endpoint and metadata
 */
function getCacheKey(endpoint: string, metadata: NormalizedMetadata): string {
  const sortedMetadata = Object.keys(metadata)
    .sort()
    .reduce((acc, key) => {
      if (metadata[key] !== undefined && metadata[key] !== null) {
        acc[key] = metadata[key];
      }
      return acc;
    }, {} as Record<string, any>);

  return `${endpoint}:${JSON.stringify(sortedMetadata)}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(timestamp: number, ttl: number = CACHE_TTL): boolean {
  return Date.now() - timestamp < ttl;
}

/**
 * Clear expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of summaryCache.entries()) {
    if (!isCacheValid(value.timestamp)) {
      summaryCache.delete(key);
    }
  }
}

/**
 * Main summary client function
 * Fetches data from summary endpoints with caching and error handling
 */
export async function summaryClient<T = any>(
  endpoint: string,
  metadata: NormalizedMetadata,
  method: 'GET' | 'POST' = 'POST',
  options: SummaryClientOptions = {}
): Promise<SummaryResponse<T>> {
  const {
    cache = true,
    timeout = 30000,
    retries = 2,
    retryDelay = 1000
  } = options;

  // Construct full URL if needed
  // Use NEXT_PUBLIC_BACKEND_AI_URL or fallback to localhost:8000
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://localhost:8000';
  const fullEndpoint = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;

  // Check cache first
  if (cache) {
    const cacheKey = getCacheKey(fullEndpoint, metadata);
    const cached = summaryCache.get(cacheKey);

    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`[SummaryClient] Cache hit for ${fullEndpoint}`);
      return {
        data: cached.data,
        cache: { hit: true, key: cacheKey }
      };
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
      cleanupCache();
    }
  }

  // Prepare request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;
  let attempt = 0;

  // Retry logic
  while (attempt <= retries) {
    try {
      console.log(`[SummaryClient] Fetching ${fullEndpoint} (attempt ${attempt + 1}/${retries + 1})`);

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      };

      // Add body for POST, query params for GET
      let requestUrl = fullEndpoint;
      if (method === 'POST') {
        requestOptions.body = JSON.stringify(metadata);
      } else {
        const params = metadataToQueryParams(metadata);
        requestUrl = `${fullEndpoint}?${params.toString()}`;
      }

      const response = await fetch(requestUrl, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful response
      if (cache) {
        const cacheKey = getCacheKey(fullEndpoint, metadata);
        summaryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        console.log(`[SummaryClient] Cached response for ${fullEndpoint}`);
      }

      return {
        data,
        cache: { hit: false }
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`[SummaryClient] Attempt ${attempt + 1} failed:`, error);

      if (attempt < retries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
      attempt++;
    }
  }

  clearTimeout(timeoutId);

  // All retries failed
  console.error(`[SummaryClient] All attempts failed for ${fullEndpoint}`);
  return {
    data: null as any,
    error: lastError?.message || 'Failed to fetch summary data'
  };
}

/**
 * Batch fetch multiple summaries in parallel
 */
export async function batchSummaryClient(
  requests: Array<{
    endpoint: string;
    metadata: NormalizedMetadata;
    method?: 'GET' | 'POST';
  }>,
  options?: SummaryClientOptions
): Promise<SummaryResponse[]> {
  const promises = requests.map(req =>
    summaryClient(
      req.endpoint,
      req.metadata,
      req.method || 'POST',
      options
    )
  );

  return Promise.all(promises);
}

/**
 * Clear the summary cache
 */
export function clearSummaryCache(endpoint?: string): void {
  if (endpoint) {
    // Clear specific endpoint
    for (const key of summaryCache.keys()) {
      if (key.startsWith(endpoint)) {
        summaryCache.delete(key);
      }
    }
  } else {
    // Clear all
    summaryCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(summaryCache.entries()).map(([key, value]) => ({
    key,
    age: now - value.timestamp
  }));

  return {
    size: summaryCache.size,
    entries
  };
}