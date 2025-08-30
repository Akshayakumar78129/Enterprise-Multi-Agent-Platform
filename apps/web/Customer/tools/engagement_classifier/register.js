/**
 * Registration hook for Engagement Classifier
 * This file registers the engagement classifier to auto-load
 */

const path = require('path');
const fs = require('fs');

// Only register in Next.js environments
if (typeof window === 'undefined') {
  
  // Check if we're in the right directory structure
  const currentDir = __dirname;
  const isInEngagementClassifier = currentDir.includes('engagement_classifier');
  
  if (isInEngagementClassifier) {
    console.log('🔧 [Register] Registering Engagement Classifier auto-loader...');
    
    // Try to find and modify the main Next.js entry point
    const possibleNextConfigPaths = [
      path.join(process.cwd(), 'next.config.js'),
      path.join(process.cwd(), 'next.config.mjs'),
      path.join(process.cwd(), 'apps', 'web', 'next.config.js'),
      path.join(process.cwd(), '..', '..', 'next.config.js'),
    ];
    
    // Look for package.json to inject a require hook
    const possiblePackageJsonPaths = [
      path.join(process.cwd(), 'package.json'),
      path.join(process.cwd(), 'apps', 'web', 'package.json'),
      path.join(process.cwd(), '..', '..', 'package.json'),
    ];
    
    // Try to auto-load via environment variable
    if (!process.env.ENGAGEMENT_CLASSIFIER_LOADED) {
      process.env.ENGAGEMENT_CLASSIFIER_LOADED = 'true';
      
      // Load the bootstrap
      try {
        require('./bootstrap.js');
        console.log('✅ [Register] Engagement Classifier registered successfully');
      } catch (error) {
        console.error('❌ [Register] Failed to register:', error);
      }
    }
  }
}

module.exports = {};