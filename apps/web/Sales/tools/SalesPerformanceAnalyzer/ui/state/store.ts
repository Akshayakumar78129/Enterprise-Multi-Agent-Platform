import { configureStore } from '@reduxjs/toolkit';
import salesPerformanceReducer from './salesPerformanceSlice';

export const store = configureStore({
  reducer: {
    salesPerformance: salesPerformanceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;