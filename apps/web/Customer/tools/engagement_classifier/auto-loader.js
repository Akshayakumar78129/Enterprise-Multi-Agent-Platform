/**
 * Auto-loader for Engagement Classifier
 * This creates a symlink in node_modules to auto-load the chatbot
 */

const fs = require('fs');
const path = require('path');

function createAutoLoader() {
  try {
    // Find the node_modules directory
    const possibleNodeModulesPaths = [
      path.join(process.cwd(), 'node_modules'),
      path.join(process.cwd(), 'apps', 'web', 'node_modules'),
      path.join(process.cwd(), '..', '..', 'node_modules'),
    ];

    let nodeModulesPath = null;
    for (const possiblePath of possibleNodeModulesPaths) {
      if (fs.existsSync(possiblePath)) {
        nodeModulesPath = possiblePath;
        break;
      }
    }

    if (!nodeModulesPath) {
      console.log('⚠️ [Auto-Loader] Could not find node_modules directory');
      return false;
    }

    const symlinkPath = path.join(nodeModulesPath, 'engagement-classifier-auto');
    const targetPath = __dirname;

    // Check if symlink already exists
    if (fs.existsSync(symlinkPath)) {
      console.log('✅ [Auto-Loader] Auto-loader symlink already exists');
      return true;
    }

    // Create symlink
    fs.symlinkSync(targetPath, symlinkPath, 'dir');
    console.log('✅ [Auto-Loader] Created auto-loader symlink in node_modules');
    
    // Create a simple index.js in the symlinked directory
    const indexPath = path.join(symlinkPath, 'index.js');
    const indexContent = `// Auto-generated index for engagement classifier
require('./auto-init.js');
module.exports = {};`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ [Auto-Loader] Created auto-loader index.js');
    
    return true;

  } catch (error) {
    console.log('⚠️ [Auto-Loader] Could not create auto-loader:', error.message);
    return false;
  }
}

// Try to create auto-loader when this module is imported
if (typeof window === 'undefined') {
  createAutoLoader();
}

module.exports = { createAutoLoader };