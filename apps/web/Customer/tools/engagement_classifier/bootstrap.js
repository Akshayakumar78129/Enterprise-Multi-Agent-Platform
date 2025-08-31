/**
 * Bootstrap file for Engagement Classifier
 * This file automatically loads when Node.js starts
 * Place this in engagement_classifier folder - it will auto-run
 */

// Only run on server-side and in development/production
if (typeof window === 'undefined' && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production')) {
  
  console.log('🔧 [Bootstrap] Engagement Classifier loading...');
  
  // Check if we're in a Next.js environment
  const isNextJS = process.argv.some(arg => arg.includes('next')) || 
                   process.env.npm_lifecycle_event === 'dev' ||
                   process.env.npm_lifecycle_event === 'start' ||
                   process.env.npm_lifecycle_event === 'build';
  
  if (isNextJS) {
    console.log('🎯 [Bootstrap] Next.js environment detected');
    
    // Auto-load the initialization
    try {
      require('./auto-init.js');
      console.log('✅ [Bootstrap] Engagement Classifier auto-initialization loaded');
    } catch (error) {
      console.error('❌ [Bootstrap] Failed to load auto-initialization:', error);
    }
  }
}

// Export empty object to make this a valid module
module.exports = {};