/**
 * One-time setup script for Engagement Classifier Auto-Start
 * Run this once: node setup-auto-start.js
 * Then just use: npm run dev (and chatbot auto-starts)
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Engagement Classifier Auto-Start...\n');

async function setupAutoStart() {
  try {
    // Find the main package.json
    const possiblePackageJsonPaths = [
      path.join(process.cwd(), '..', '..', '..', 'package.json'),
      path.join(process.cwd(), '..', '..', 'package.json'),
      path.join(process.cwd(), 'package.json'),
    ];

    let mainPackageJsonPath = null;
    for (const possiblePath of possiblePackageJsonPaths) {
      if (fs.existsSync(possiblePath)) {
        console.log('📦 Checking:', possiblePath);
        const packageJson = JSON.parse(fs.readFileSync(possiblePath, 'utf8'));
        if (packageJson.scripts && packageJson.scripts.dev) {
          mainPackageJsonPath = possiblePath;
          console.log('✅ Found main package.json with dev script');
          break;
        }
      }
    }

    if (!mainPackageJsonPath) {
      console.log('❌ Could not find main package.json with dev script');
      console.log('📝 Manual setup required - see INTEGRATION_INSTRUCTIONS.md');
      return;
    }

    // Read the package.json
    const packageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));
    
    // Get the relative path to the auto-init script
    const autoInitPath = path.relative(path.dirname(mainPackageJsonPath), path.join(__dirname, 'auto-init.js'));
    const normalizedPath = autoInitPath.replace(/\\/g, '/');
    
    console.log('🎯 Auto-init script path:', normalizedPath);

    // Modify the dev script to include our auto-init
    const originalDevScript = packageJson.scripts.dev;
    const newDevScript = `node "${normalizedPath}" && ${originalDevScript}`;
    
    // Check if already modified
    if (originalDevScript.includes('auto-init.js')) {
      console.log('✅ Dev script already includes auto-init');
      return;
    }

    // Update the package.json
    packageJson.scripts.dev = newDevScript;
    
    // Write back the package.json
    fs.writeFileSync(mainPackageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('✅ Updated package.json dev script');
    console.log('📝 Original:', originalDevScript);
    console.log('📝 New:', newDevScript);
    
    console.log('\n🎉 Setup complete!');
    console.log('🚀 Now when you run "npm run dev", the chatbot will auto-start');
    console.log('🎯 Chatbot will be available at: http://localhost:3001/chat');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📝 Manual setup instructions:');
    console.log('1. Add this to your main package.json dev script:');
    console.log(`   node "Customer/tools/engagement_classifier/auto-init.js" && your-existing-dev-command`);
    console.log('2. Or see INTEGRATION_INSTRUCTIONS.md for other options');
  }
}

setupAutoStart();