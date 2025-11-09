/**
 * Purchase Frequency Data Hook
 * React Query hook for fetching purchase frequency data
 */

import { useQuery } from '@tanstack/react-query';
import {
  getPurchaseFrequencySummary,
  PurchaseFrequencyFilters,
  PurchaseFrequencySummary,
} from '../services/purchaseFrequencyService';

export function usePurchaseFrequencyData(filters: PurchaseFrequencyFilters) {
  return useQuery<PurchaseFrequencySummary, Error>({
    queryKey: ['purchase-frequency', filters],
    queryFn: () => getPurchaseFrequencySummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
