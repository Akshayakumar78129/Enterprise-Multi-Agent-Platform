/**
 * Setup Script - Automated setup and verification for the Intelligent Chatbot
 * Checks dependencies, creates embeddings, tests connections
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Embedder from './embedder.js';
import DatabaseManager from './db.js';
import IntelligentChatbot from './chatbot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

class SetupManager {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.steps = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'step': '🔄'
    }[type] || '📋';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    } else if (type === 'step') {
      this.steps.push(message);
    }
  }

  async checkEnvironment() {
    this.log('Checking environment configuration...', 'step');
    
    // Check .env file
    try {
      await fs.access(path.join(__dirname, '.env'));
      this.log('Found .env file', 'success');
    } catch {
      this.log('.env file not found', 'error');
      return false;
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      this.log('GEMINI_API_KEY not configured in .env', 'error');
      return false;
    } else {
      this.log('Gemini API key configured', 'success');
    }

    // Check database path
    const dbPath = process.env.DATABASE_PATH || '../database/customers.db';
    const fullDbPath = path.resolve(__dirname, dbPath);
    
    try {
      await fs.access(fullDbPath);
      this.log(`Database found at: ${fullDbPath}`, 'success');
    } catch {
      this.log(`Database not found at: ${fullDbPath}`, 'error');
      return false;
    }

    return true;
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'step');
    
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'), 'utf-8'));
      const dependencies = Object.keys(packageJson.dependencies || {});
      
      this.log(`Found ${dependencies.length} dependencies in package.json`, 'success');
      
      // Check if node_modules exists
      try {
        await fs.access(path.join(__dirname, 'node_modules'));
        this.log('node_modules directory found', 'success');
      } catch {
        this.log('node_modules not found - run "npm install"', 'error');
        return false;
      }
      
      return true;
    } catch (error) {
      this.log(`Error checking dependencies: ${error.message}`, 'error');
      return false;
    }
  }

  async checkDashboardExplanations() {
    this.log('Checking dashboard explanations file...', 'step');
    
    try {
      const filePath = path.join(__dirname, 'dashboard_explanations.txt');
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (content.length < 1000) {
        this.log('dashboard_explanations.txt seems too short', 'warning');
      } else {
        this.log(`Dashboard explanations loaded (${content.length} characters)`, 'success');
      }
      
      return true;
    } catch (error) {
      this.log(`dashboard_explanations.txt not found: ${error.message}`, 'error');
      return false;
    }
  }

  async testDatabase() {
    this.log('Testing database connection...', 'step');
    
    try {
      const dbPath = process.env.DATABASE_PATH || '../database/customers.db';
      const db = new DatabaseManager(dbPath);
      
      const success = await db.testConnection();
      
      if (success) {
        this.log('Database connection test passed', 'success');
        return true;
      } else {
        this.log('Database connection test failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Database test error: ${error.message}`, 'error');
      return false;
    }
  }

  async setupEmbeddings() {
    this.log('Setting up embeddings...', 'step');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const embedder = new Embedder(apiKey);
      
      // Check if embeddings already exist
      const embeddingsExist = await embedder.checkEmbeddingsIndex();

      // If exists, verify it contains tag-aware chunks; otherwise, regenerate
      if (embeddingsExist) {
        try {
          const data = await embedder.loadEmbeddings();
          const hasSales = data.embeddings.some(e => (e.tag || 'general') === 'sales_agent');
          const hasInventory = data.embeddings.some(e => (e.tag || 'general') === 'inventory_agent');
          if (hasSales && hasInventory) {
            this.log('Embeddings index exists and includes tag-aware knowledge (sales_agent, inventory_agent)', 'success');
            return true;
          } else {
            this.log('Embeddings index found but missing tag-aware knowledge. Regenerating...', 'warning');
          }
        } catch (e) {
          this.log('Failed to validate existing embeddings. Regenerating...', 'warning');
        }
      }
      
      this.log('Creating embeddings index (this may take a few minutes)...', 'step');
      await embedder.createEmbeddingsIndex();
      
      this.log('Embeddings created successfully', 'success');
      return true;
      
    } catch (error) {
      this.log(`Embeddings setup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testChatbot() {
    this.log('Testing chatbot functionality...', 'step');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const chatbot = new IntelligentChatbot(apiKey);
      
      await chatbot.initialize();
      
      // Test a simple question
      const testQuestion = "What are KPI tiles?";
      this.log(`Testing with question: "${testQuestion}"`, 'step');
      
      const result = await chatbot.processQuestion(testQuestion);
      
      if (result.response && result.response.length > 50) {
        this.log('Chatbot test passed - received intelligent response', 'success');
      } else {
        this.log('Chatbot test failed - response too short or empty', 'error');
        return false;
      }
      
      await chatbot.cleanup();
      return true;
      
    } catch (error) {
      this.log(`Chatbot test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async createStartupScripts() {
    this.log('Creating startup scripts...', 'step');
    
    try {
      // Create a simple startup script for Windows
      const startScript = `@echo off
echo Starting Intelligent Chatbot System...
echo.

echo Checking if API server is running...
curl -s http://localhost:3001/health > nul 2>&1
if %errorlevel% neq 0 (
    echo Starting API server...
    start "Chatbot API" cmd /k "cd /d ${__dirname} && npm run server"
    timeout /t 5 > nul
) else (
    echo API server is already running
)

echo.
echo Starting CLI interface...
npm start

pause
`;

      await fs.writeFile(path.join(__dirname, 'start.bat'), startScript);
      this.log('Created start.bat for Windows', 'success');
      
      // Create a startup script for Unix/Mac
      const startShScript = `#!/bin/bash
echo "Starting Intelligent Chatbot System..."
echo

echo "Checking if API server is running..."
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "Starting API server..."
    npm run server &
    sleep 5
else
    echo "API server is already running"
fi

echo
echo "Starting CLI interface..."
npm start
`;

      await fs.writeFile(path.join(__dirname, 'start.sh'), startShScript);
      await fs.chmod(path.join(__dirname, 'start.sh'), '755');
      this.log('Created start.sh for Unix/Mac', 'success');
      
      return true;
    } catch (error) {
      this.log(`Failed to create startup scripts: ${error.message}`, 'warning');
      return false;
    }
  }

  async generateReport() {
    this.log('Generating setup report...', 'step');
    
    const report = `
# Intelligent Chatbot Setup Report
Generated: ${new Date().toLocaleString()}

## Setup Steps Completed
${this.steps.map(step => `✅ ${step}`).join('\n')}

## Warnings
${this.warnings.length > 0 ? this.warnings.map(warning => `⚠️ ${warning}`).join('\n') : 'None'}

## Errors
${this.errors.length > 0 ? this.errors.map(error => `❌ ${error}`).join('\n') : 'None'}

## Next Steps
${this.errors.length === 0 ? `
🎉 Setup completed successfully! You can now:

1. Start the API server: \`npm run server\`
2. Start the CLI interface: \`npm start\`
3. Or use the startup scripts: \`start.bat\` (Windows) or \`./start.sh\` (Unix/Mac)

The chatbot is ready to answer both data queries and UI questions!
` : `
❌ Setup incomplete. Please fix the errors above and run setup again.

Common fixes:
- Add your Gemini API key to .env file
- Ensure the customer database exists
- Run \`npm install\` to install dependencies
- Check internet connection for API calls
`}

## Configuration
- API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}
- Database: ${process.env.DATABASE_PATH || '../database/customers.db'}
- Embeddings: ${await this.checkEmbeddingsExist() ? '✅ Ready' : '❌ Missing'}

## Support
If you encounter issues:
1. Check the troubleshooting section in README.md
2. Run \`npm test\` to test embeddings
3. Verify your API key and database path
4. Check the console for detailed error messages
`;

    try {
      await fs.writeFile(path.join(__dirname, 'setup-report.md'), report);
      this.log('Setup report saved to setup-report.md', 'success');
    } catch (error) {
      this.log(`Failed to save setup report: ${error.message}`, 'warning');
    }

    return report;
  }

  async checkEmbeddingsExist() {
    try {
      await fs.access(path.join(__dirname, 'embeddings_index.json'));
      return true;
    } catch {
      return false;
    }
  }

  async runFullSetup() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 INTELLIGENT CHATBOT SETUP');
    console.log('='.repeat(60));
    
    const checks = [
      { name: 'Environment', fn: () => this.checkEnvironment() },
      { name: 'Dependencies', fn: () => this.checkDependencies() },
      { name: 'Dashboard Explanations', fn: () => this.checkDashboardExplanations() },
      { name: 'Database', fn: () => this.testDatabase() },
      { name: 'Embeddings', fn: () => this.setupEmbeddings() },
      { name: 'Chatbot', fn: () => this.testChatbot() },
      { name: 'Startup Scripts', fn: () => this.createStartupScripts() }
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const passed = await check.fn();
        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        this.log(`${check.name} check failed: ${error.message}`, 'error');
        allPassed = false;
      }
      console.log(''); // Add spacing between checks
    }

    // Generate report
    const report = await this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 SETUP COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log('Your intelligent chatbot is ready to use.');
      console.log('\nQuick start:');
      console.log('1. npm run server  (start API server)');
      console.log('2. npm start       (start CLI interface)');
    } else {
      console.log('❌ SETUP INCOMPLETE');
      console.log('='.repeat(60));
      console.log(`Found ${this.errors.length} errors and ${this.warnings.length} warnings.`);
      console.log('Please check setup-report.md for details.');
    }
    console.log('='.repeat(60) + '\n');

    return allPassed;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new SetupManager();
  setup.runFullSetup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export default SetupManager;