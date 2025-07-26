import { configureStore } from '@reduxjs/toolkit';
import productPerformanceReducer from './productPerformanceSlice';

export const store = configureStore({
  reducer: {
    productPerformance: productPerformanceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 