#!/usr/bin/env node

/**
 * Phase 4 Migration Testing Script
 * Tests all migrated tools for functionality with API Gateway integration
 */

// Using built-in fetch (Node.js 18+)
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000', // Next.js frontend URL
  apiGatewayUrl: 'http://localhost:3001', // API Gateway URL
  timeout: 30000,
  retries: 3
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
  startTime: new Date(),
  endTime: null
};

// Color console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '', duration = 0) {
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const durationText = duration > 0 ? ` (${duration}ms)` : '';
  log(`  ${status === 'PASS' ? '✅' : '❌'} ${testName}${durationText}`, statusColor);
  if (details) {
    log(`     ${details}`, 'yellow');
  }
  
  testResults.tests.push({
    name: testName,
    status,
    details,
    duration
  });
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        ...options.headers
      }
    });
    
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function testTransactionPatterns() {
  log('\n📊 Testing Transaction Patterns Tool', 'blue');
  
  const testCases = [
    {
      name: 'GET request with basic parameters',
      url: `${TEST_CONFIG.baseUrl}/api/transaction-patterns/data?limit=10`,
      method: 'GET'
    },
    {
      name: 'POST request with date filters',
      url: `${TEST_CONFIG.baseUrl}/api/transaction-patterns/data`,
      method: 'POST',
      body: JSON.stringify({
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        },
        limit: 50
      })
    },
    {
      name: 'POST request with customer filter',
      url: `${TEST_CONFIG.baseUrl}/api/transaction-patterns/data`,
      method: 'POST',
      body: JSON.stringify({
        customerId: 'CUST001',
        limit: 25
      })
    }
  ];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    try {
      const response = await makeRequest(testCase.url, {
        method: testCase.method,
        body: testCase.body
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.success) {
        // Validate response structure
        const hasTransactions = data.data?.transactions !== undefined;
        const hasKPIs = data.data?.kpis !== undefined;
        const hasMigrationInfo = data.migration?.phase === 4;
        const hasAPIGatewaySource = data.source === 'api-gateway';
        
        if (hasTransactions && hasKPIs && hasMigrationInfo && hasAPIGatewaySource) {
          logTest(testCase.name, 'PASS', `${data.data.transactions.length} transactions returned`, duration);
        } else {
          logTest(testCase.name, 'FAIL', 'Response structure validation failed', duration);
        }
      } else {
        logTest(testCase.name, 'FAIL', `API error: ${data.error || response.statusText}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(testCase.name, 'FAIL', `Request failed: ${error.message}`, duration);
    }
  }
}

async function testCustomerSegmentation() {
  log('\n👥 Testing Customer Segmentation Tool', 'blue');
  
  const testCases = [
    {
      name: 'Basic segmentation request',
      url: `${TEST_CONFIG.baseUrl}/api/customer-segmentation/data?segmentType=value&limit=100`,
      method: 'GET'
    },
    {
      name: 'Segmentation with metrics disabled',
      url: `${TEST_CONFIG.baseUrl}/api/customer-segmentation/data?includeMetrics=false`,
      method: 'GET'
    },
    {
      name: 'Segmentation with pagination',
      url: `${TEST_CONFIG.baseUrl}/api/customer-segmentation/data?page=1&limit=50`,
      method: 'GET'
    }
  ];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    try {
      const response = await makeRequest(testCase.url, {
        method: testCase.method
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.success) {
        // Validate response structure
        const hasSegmentData = data.data?.segment_data !== undefined;
        const hasKPIData = data.data?.kpi_data !== undefined;
        const hasDistribution = data.data?.segment_distribution !== undefined;
        const hasMigrationInfo = data.migration?.phase === 4;
        const hasAPIGatewaySource = data.source === 'api-gateway';
        
        if (hasSegmentData && hasKPIData && hasDistribution && hasMigrationInfo && hasAPIGatewaySource) {
          logTest(testCase.name, 'PASS', `${data.data.segment_data.length} customers segmented`, duration);
        } else {
          logTest(testCase.name, 'FAIL', 'Response structure validation failed', duration);
        }
      } else {
        logTest(testCase.name, 'FAIL', `API error: ${data.error || response.statusText}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(testCase.name, 'FAIL', `Request failed: ${error.message}`, duration);
    }
  }
}

async function testChurnPrediction() {
  log('\n⚠️  Testing Churn Prediction Tool', 'blue');
  
  const testCases = [
    {
      name: 'Basic churn prediction request',
      url: `${TEST_CONFIG.baseUrl}/api/churn-prediction/data?riskLevel=all&limit=50`,
      method: 'GET'
    },
    {
      name: 'High-risk customers only',
      url: `${TEST_CONFIG.baseUrl}/api/churn-prediction/data?riskLevel=high&includeFeatures=true`,
      method: 'GET'
    },
    {
      name: 'Latest model version with pagination',
      url: `${TEST_CONFIG.baseUrl}/api/churn-prediction/data?modelVersion=latest&page=1&limit=25`,
      method: 'GET'
    }
  ];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    try {
      const response = await makeRequest(testCase.url, {
        method: testCase.method
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (response.ok && data.status === 'success') {
        // Validate response structure
        const hasCustomers = data.customers !== undefined;
        const hasProbabilities = data.probabilities !== undefined;
        const hasFeatureImportance = data.feature_importance !== undefined;
        const hasInsights = data.insights !== undefined;
        const hasMigrationInfo = data.migration?.phase === 4;
        const hasAPIGatewaySource = data.source === 'api-gateway';
        
        if (hasCustomers && hasProbabilities && hasFeatureImportance && hasInsights && hasMigrationInfo && hasAPIGatewaySource) {
          logTest(testCase.name, 'PASS', `${data.customers.length} customers analyzed for churn risk`, duration);
        } else {
          logTest(testCase.name, 'FAIL', 'Response structure validation failed', duration);
        }
      } else {
        logTest(testCase.name, 'FAIL', `API error: ${data.message || response.statusText}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(testCase.name, 'FAIL', `Request failed: ${error.message}`, duration);
    }
  }
}

async function testAPIGatewayHealth() {
  log('\n🏥 Testing API Gateway Health', 'blue');
  
  const healthEndpoints = [
    '/health',
    '/api/v1/health',
    '/api/v1/customer/health'
  ];
  
  for (const endpoint of healthEndpoints) {
    const startTime = Date.now();
    try {
      const response = await makeRequest(`${TEST_CONFIG.apiGatewayUrl}${endpoint}`);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        logTest(`API Gateway health check: ${endpoint}`, 'PASS', `Status: ${data.status || 'healthy'}`, duration);
      } else {
        logTest(`API Gateway health check: ${endpoint}`, 'FAIL', `HTTP ${response.status}`, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(`API Gateway health check: ${endpoint}`, 'FAIL', `Connection failed: ${error.message}`, duration);
    }
  }
}

async function testEnterpriseConnectors() {
  log('\n🔗 Testing Enterprise Connectors', 'blue');
  
  // Test connector files exist and are properly structured
  const connectorPaths = [
    '/Users/tanav/Projects/adk-frontend/api-gateway/connectors/api/SalesforceConnector.js',
    '/Users/tanav/Projects/adk-frontend/api-gateway/connectors/api/SapConnector.js'
  ];
  
  for (const connectorPath of connectorPaths) {
    const startTime = Date.now();
    try {
      if (fs.existsSync(connectorPath)) {
        const content = fs.readFileSync(connectorPath, 'utf8');
        const duration = Date.now() - startTime;
        
        // Check for key methods and patterns
        const hasConnectMethod = content.includes('async connect()');
        const hasQueryMethod = content.includes('async query(') || content.includes('async safeQuery(');
        const hasCircuitBreaker = content.includes('circuitBreaker');
        const hasHealthCheck = content.includes('async healthCheck()');
        
        if (hasConnectMethod && hasQueryMethod && hasCircuitBreaker && hasHealthCheck) {
          const connectorName = path.basename(connectorPath, '.js');
          logTest(`${connectorName} structure validation`, 'PASS', 'All required methods present', duration);
        } else {
          logTest(`${connectorName} structure validation`, 'FAIL', 'Missing required methods', duration);
        }
      } else {
        logTest(`Connector file: ${path.basename(connectorPath)}`, 'FAIL', 'File not found', Date.now() - startTime);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(`Connector validation: ${path.basename(connectorPath)}`, 'FAIL', error.message, duration);
    }
  }
}

async function testBackupIntegrity() {
  log('\n💾 Testing Backup Integrity', 'blue');
  
  const backupFiles = [
    '/Users/tanav/Projects/adk-frontend/migration-backups/phase4/transaction_patterns_api_backup.js',
    '/Users/tanav/Projects/adk-frontend/migration-backups/phase4/customer_segmentation_api_backup.js',
    '/Users/tanav/Projects/adk-frontend/migration-backups/phase4/churn_prediction_api_backup.js'
  ];
  
  for (const backupPath of backupFiles) {
    const startTime = Date.now();
    try {
      if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        const duration = Date.now() - startTime;
        
        if (stats.size > 0) {
          logTest(`Backup integrity: ${path.basename(backupPath)}`, 'PASS', `${stats.size} bytes`, duration);
        } else {
          logTest(`Backup integrity: ${path.basename(backupPath)}`, 'FAIL', 'Empty file', duration);
        }
      } else {
        logTest(`Backup file: ${path.basename(backupPath)}`, 'FAIL', 'File not found', Date.now() - startTime);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logTest(`Backup check: ${path.basename(backupPath)}`, 'FAIL', error.message, duration);
    }
  }
}

async function generateTestReport() {
  testResults.endTime = new Date();
  const duration = testResults.endTime - testResults.startTime;
  
  log('\n📋 Test Report Summary', 'bold');
  log('='.repeat(50), 'blue');
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : '0.0';
  
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
  log(`Duration: ${duration}ms`);
  
  // Write detailed report to file
  const reportPath = path.join(process.cwd(), 'phase4-test-report.json');
  const report = {
    summary: {
      totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: parseFloat(successRate),
      duration,
      timestamp: testResults.endTime.toISOString()
    },
    tests: testResults.tests,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');
  
  return successRate >= 90;
}

async function runAllTests() {
  log('🚀 Starting Phase 4 Migration Testing', 'bold');
  log('='.repeat(50), 'blue');
  
  try {
    await testAPIGatewayHealth();
    await testTransactionPatterns();
    await testCustomerSegmentation();
    await testChurnPrediction();
    await testEnterpriseConnectors();
    await testBackupIntegrity();
    
    const success = await generateTestReport();
    
    if (success) {
      log('\n🎉 Phase 4 Migration Testing Completed Successfully!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Phase 4 Migration Testing Completed with Issues', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n⏹️  Test execution interrupted', 'yellow');
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testTransactionPatterns,
  testCustomerSegmentation,
  testChurnPrediction,
  testAPIGatewayHealth,
  testEnterpriseConnectors,
  testBackupIntegrity
};