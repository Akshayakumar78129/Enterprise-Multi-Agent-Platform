import dynamic from 'next/dynamic';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import engagementClassifierReducer from '../../Customer/tools/engagement_classifier/ui/state/engagementClassifierSlice';

// Configure Redux store for engagement classifier
const store = configureStore({
  reducer: {
    engagementClassifier: engagementClassifierReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Dynamically import the EngagementDashboard with no SSR
const EngagementDashboard = dynamic(
  () => import('../../Customer/tools/engagement_classifier/ui/views/EngagementDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading Engagement Classifier...</div>
      </div>
    )
  }
);

export default function EngagementClassifierPage() {
  return (
    <Provider store={store}>
      <EngagementDashboard />
    </Provider>
  );
}