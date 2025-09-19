import { configureStore } from '@reduxjs/toolkit';
import canvasReducer from './slices/canvasSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    conversation: conversationReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;