/**
 * Customer Insight Redux Store Configuration
 * Centralized store for customer engagement and insight data
 */

import { configureStore } from '@reduxjs/toolkit';
import customerInsightReducer from './customerInsightSlice';
// Import the refactored churn prediction reducer for backward compatibility
import churnPredictionReducer from '../../churn_prediction/ui/state/churnPredictionSlice';

export const store = configureStore({
  reducer: {
    customerInsight: customerInsightReducer,
    churnPrediction: churnPredictionReducer, // For backward compatibility
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store instance for direct access if needed
export default store;