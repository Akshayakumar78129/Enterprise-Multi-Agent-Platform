# API Gateway Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the Enterprise Data Connector API Gateway. Issues are organized by category with step-by-step resolution procedures.

## Quick Diagnostics

### Health Check Commands

```bash
# Basic health check
curl http://localhost:3001/health

# Detailed system health
curl http://localhost:3001/health/detailed

# Connector health
curl http://localhost:3001/health/connectors

# System metrics
curl http://localhost:3001/metrics
```

### Log Analysis

```bash
# View recent logs
tail -f api-gateway/logs/app.log

# Search for errors
grep -i "error" api-gateway/logs/app.log | tail -20

# Filter by request ID
grep "req-123456" api-gateway/logs/app.log
```

## Connection Issues

### Problem: API Gateway Won't Start

**Symptoms:**
- Server fails to start
- Port binding errors
- Module loading errors

**Diagnostic Steps:**

1. **Check Port Availability**
```bash
# Check if port 3001 is in use
lsof -i :3001
netstat -tulpn | grep :3001

# Kill process using port (if needed)
kill -9 <PID>
```

2. **Verify Dependencies**
```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Install missing dependencies
npm install

# Check for vulnerabilities
npm audit
```

3. **Check Environment Configuration**
```bash
# Verify .env file exists
ls -la api-gateway/.env

# Check required environment variables
grep -E "PORT|NODE_ENV|JWT_SECRET" api-gateway/.env
```

**Solutions:**

1. **Port in Use**
```bash
# Change port in .env file
PORT=3002

# Or kill existing process
sudo kill -9 $(lsof -ti:3001)
```

2. **Missing Dependencies**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Install specific missing modules
npm install express winston sqlite3
```

3. **Permission Issues**
```bash
# Fix file permissions
chmod +x api-gateway/server.js
chown -R $USER:$USER api-gateway/

# Run with sudo (not recommended for production)
sudo npm start
```

### Problem: Database Connection Failures

**Symptoms:**
- Database connection timeout
- Authentication failures
- Connection pool exhaustion

**Diagnostic Steps:**

1. **Test Database Connectivity**
```bash
# SQLite database
ls -la ../Customer/database/customers.db
sqlite3 ../Customer/database/customers.db ".schema"

# Test file permissions
touch ../Customer/database/test.db && rm ../Customer/database/test.db
```

2. **Check Database Health**
```bash
# Via API
curl http://localhost:3001/health/connectors

# Via logs
grep -i "database\|connection" api-gateway/logs/app.log
```

**Solutions:**

1. **SQLite Database Issues**
```bash
# Check database file exists
ls -la ../Customer/database/customers.db

# Fix permissions
chmod 664 ../Customer/database/customers.db
chmod 755 ../Customer/database/

# Test database integrity
sqlite3 ../Customer/database/customers.db "PRAGMA integrity_check;"
```

2. **Connection Pool Issues**
```javascript
// Increase pool size in config
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=60000
```

3. **Path Issues**
```bash
# Use absolute paths in .env
DATABASE_PATH=/absolute/path/to/database/customers.db
```

### Problem: Frontend Cannot Connect to API Gateway

**Symptoms:**
- CORS errors in browser
- Connection refused errors
- 404 errors for API endpoints

**Diagnostic Steps:**

1. **Verify API Gateway is Running**
```bash
# Check process
ps aux | grep node | grep server

# Check port binding
netstat -tulpn | grep :3001

# Test direct connection
curl http://localhost:3001/health
```

2. **Check CORS Configuration**
```bash
# Test CORS headers
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-API-Key" \
     -X OPTIONS http://localhost:3001/api/v1/customer/segmentation
```

**Solutions:**

1. **Start API Gateway**
```bash
cd api-gateway
npm start

# Or with PM2
pm2 start ecosystem.config.js
```

2. **Fix CORS Issues**
```javascript
// In server.js, ensure CORS is properly configured
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
```

3. **Update Frontend API Calls**
```javascript
// Ensure correct headers in frontend
const response = await fetch('http://localhost:3001/api/v1/customer/segmentation', {
  method: 'GET',
  headers: {
    'X-API-Key': 'frontend-api-key',
    'Content-Type': 'application/json'
  }
});
```

## Authentication & Authorization Issues

### Problem: Invalid API Key / Authentication Failures

**Symptoms:**
- 401 Unauthorized responses
- Invalid API key errors
- JWT token validation failures

**Diagnostic Steps:**

1. **Check API Key Configuration**
```bash
# Verify API keys in .env
grep "VALID_API_KEYS" .env

# Check authentication middleware logs
grep -i "auth\|token\|key" api-gateway/logs/app.log
```

2. **Test Authentication**
```bash
# Test with valid API key
curl -H "X-API-Key: frontend-api-key" http://localhost:3001/api/v1/customer/segmentation

# Test without authentication (should fail)
curl http://localhost:3001/api/v1/customer/segmentation
```

**Solutions:**

1. **Fix API Key Configuration**
```bash
# Add missing API key to .env
echo "VALID_API_KEYS=dev-token,test-token,frontend-api-key" >> .env

# Restart server
npm run dev
```

2. **Update Frontend Headers**
```javascript
// Correct header format
headers: {
  'X-API-Key': 'frontend-api-key'  // Not 'Authorization: Bearer'
}
```

3. **JWT Token Issues**
```bash
# Generate new JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET" >> .env
```

### Problem: Rate Limiting Issues

**Symptoms:**
- 429 Too Many Requests errors
- Rate limit exceeded messages
- Slow API responses

**Diagnostic Steps:**

1. **Check Rate Limit Configuration**
```bash
grep "RATE_LIMIT" .env
curl -I http://localhost:3001/api/v1/customer/segmentation
```

2. **Monitor Rate Limit Headers**
```bash
# Check rate limit headers in response
curl -v -H "X-API-Key: frontend-api-key" \
  http://localhost:3001/api/v1/customer/segmentation
```

**Solutions:**

1. **Adjust Rate Limits**
```bash
# Increase rate limits in .env
API_RATE_LIMIT_REQUESTS=1000
API_RATE_LIMIT_WINDOW=900000  # 15 minutes
```

2. **Implement Client-Side Rate Limiting**
```javascript
// Add delay between requests
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function makeApiCall() {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (error.status === 429) {
      await delay(1000);  // Wait 1 second
      return makeApiCall();  // Retry
    }
    throw error;
  }
}
```

## Performance Issues

### Problem: Slow API Response Times

**Symptoms:**
- Response times > 5 seconds
- Timeout errors
- High CPU/memory usage

**Diagnostic Steps:**

1. **Check Performance Metrics**
```bash
# Get performance metrics
curl http://localhost:3001/metrics

# Monitor system resources
top -p $(pgrep -f "node.*server")
```

2. **Analyze Slow Queries**
```bash
# Check for slow database queries
grep -i "slow\|timeout" api-gateway/logs/app.log

# Check database performance
sqlite3 database.db "EXPLAIN QUERY PLAN SELECT * FROM large_table LIMIT 10;"
```

**Solutions:**

1. **Database Optimization**
```sql
-- Add indexes to frequently queried columns
CREATE INDEX idx_customer_key ON dbo_F_Sales_Transaction(Customer_Key);
CREATE INDEX idx_txn_date ON dbo_F_Sales_Transaction(Txn_Date);

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM dbo_F_Sales_Transaction 
WHERE Customer_Key = 'CUST001' ORDER BY Txn_Date DESC LIMIT 10;
```

2. **Enable Caching**
```bash
# Configure Redis caching
REDIS_URL=redis://localhost:6379
REDIS_TTL=300

# Or increase memory cache
MEMORY_CACHE_SIZE=500
```

3. **Optimize Queries**
```javascript
// Limit result sets
const defaultLimit = 50;
const maxLimit = 1000;
const limit = Math.min(queryConfig.limit || defaultLimit, maxLimit);

// Add database indexes
// Use pagination for large datasets
// Implement query result caching
```

### Problem: Memory Leaks

**Symptoms:**
- Gradually increasing memory usage
- Out of memory errors
- Server crashes

**Diagnostic Steps:**

1. **Monitor Memory Usage**
```bash
# Check memory usage over time
watch -n 5 'ps aux | grep node | grep server'

# Get detailed memory info
curl http://localhost:3001/metrics | jq '.memory'
```

2. **Analyze Memory Patterns**
```bash
# Check for memory leaks in logs
grep -i "memory\|heap\|gc" api-gateway/logs/app.log
```

**Solutions:**

1. **Optimize Database Connections**
```javascript
// Ensure connections are properly closed
try {
  const result = await connector.query(queryConfig);
  return result;
} finally {
  if (connection) {
    await connection.release();
  }
}
```

2. **Configure Garbage Collection**
```bash
# Add GC flags to start script
node --max-old-space-size=2048 --expose-gc server.js

# Or in package.json
"start": "node --max-old-space-size=2048 server.js"
```

3. **Implement Connection Pooling**
```javascript
// Configure proper pool limits
const poolConfig = {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 100
};
```

## Data Issues

### Problem: Incorrect or Missing Data

**Symptoms:**
- Empty result sets
- Data type errors
- Inconsistent data formats

**Diagnostic Steps:**

1. **Verify Database Content**
```bash
# Check table structure
sqlite3 database.db ".schema table_name"

# Sample data
sqlite3 database.db "SELECT * FROM table_name LIMIT 5;"

# Count records
sqlite3 database.db "SELECT COUNT(*) FROM table_name;"
```

2. **Test Query Directly**
```bash
# Test query in database
sqlite3 database.db "SELECT * FROM dbo_F_Sales_Transaction 
WHERE Customer_Key = 'CUST001' LIMIT 5;"
```

**Solutions:**

1. **Fix Database Schema Issues**
```sql
-- Check column names and types
.schema dbo_F_Sales_Transaction

-- Fix column name mismatches
ALTER TABLE dbo_F_Sales_Transaction 
RENAME COLUMN "Sales Txn Key" TO "Sales_Txn_Key";
```

2. **Update Query Logic**
```javascript
// Handle column name variations
const fieldMappings = {
  'Sales Txn Key': 'Sales_Txn_Key',
  'Customer Key': 'Customer_Key',
  'Txn Date': 'Txn_Date'
};

// Apply field mappings in queries
const mappedFields = fields.map(field => fieldMappings[field] || field);
```

3. **Add Data Validation**
```javascript
// Validate query results
function validateQueryResult(result) {
  if (!result || !Array.isArray(result.rows)) {
    throw new Error('Invalid query result format');
  }
  
  if (result.rows.length === 0) {
    logger.warn('Query returned no results', { query: queryConfig });
  }
  
  return result;
}
```

### Problem: Data Type Conversion Errors

**Symptoms:**
- JSON parsing errors
- Date format issues
- Number conversion failures

**Solutions:**

1. **Implement Data Transformation**
```javascript
function transformRowData(row) {
  const transformed = {};
  
  for (const [key, value] of Object.entries(row)) {
    // Handle dates
    if (key.includes('Date') && value) {
      transformed[key] = new Date(value).toISOString();
    }
    // Handle numbers
    else if (key.includes('Amount') || key.includes('Quantity')) {
      transformed[key] = parseFloat(value) || 0;
    }
    // Handle booleans
    else if (typeof value === 'string' && (value === 'true' || value === 'false')) {
      transformed[key] = value === 'true';
    }
    else {
      transformed[key] = value;
    }
  }
  
  return transformed;
}
```

2. **Add Type Checking**
```javascript
function validateDataTypes(data, schema) {
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    if (value !== null && typeof value !== expectedType) {
      logger.warn(`Type mismatch for field ${field}`, {
        expected: expectedType,
        actual: typeof value,
        value: value
      });
    }
  }
}
```

## Monitoring & Logging Issues

### Problem: Missing or Incomplete Logs

**Symptoms:**
- No log files generated
- Missing request logs
- Log rotation not working

**Solutions:**

1. **Fix Log Configuration**
```javascript
// Ensure log directory exists
const fs = require('fs');
const logDir = './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
```

2. **Check File Permissions**
```bash
# Ensure log directory is writable
chmod 755 api-gateway/logs/
touch api-gateway/logs/test.log && rm api-gateway/logs/test.log
```

3. **Verify Winston Configuration**
```javascript
// Check Winston logger setup
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: './logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: './logs/app.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Problem: Monitoring Endpoints Not Working

**Symptoms:**
- 404 errors for /health endpoints
- Metrics endpoints returning errors
- Monitoring data missing

**Solutions:**

1. **Verify Route Registration**
```javascript
// Ensure monitoring routes are registered
const { monitoringSystem } = require('./monitoring');
const router = express.Router();
monitoringSystem.createRoutes(router);
app.use('/', router);  // Routes should be at root level
```

2. **Check Monitoring System Initialization**
```javascript
// Initialize monitoring system
await monitoringSystem.initialize({
  enableTracing: true,
  enableAlerting: true,
  enableCircuitBreakers: true
});
```

## Environment & Configuration Issues

### Problem: Environment Variables Not Loading

**Symptoms:**
- Default values being used
- Configuration errors on startup
- Missing environment-specific settings

**Solutions:**

1. **Verify .env File Loading**
```javascript
// Ensure dotenv is loaded early
require('dotenv').config({ path: './api-gateway/.env' });

// Check if variables are loaded
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
```

2. **Fix .env File Format**
```bash
# Correct format (no spaces around =)
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key

# Incorrect format
# PORT = 3001  (spaces cause issues)
# NODE_ENV="development"  (quotes unnecessary for simple values)
```

3. **Environment-Specific Configuration**
```javascript
// Load environment-specific config
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });
require('dotenv').config({ path: '.env' });  // Fallback to default
```

## Deployment Issues

### Problem: PM2 Process Management

**Symptoms:**
- PM2 processes not starting
- Application crashes on startup
- Load balancing not working

**Solutions:**

1. **Fix PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api-gateway',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

2. **PM2 Commands**
```bash
# Start application
pm2 start ecosystem.config.js

# Restart application
pm2 restart api-gateway

# View logs
pm2 logs api-gateway

# Monitor performance
pm2 monit

# Save PM2 configuration
pm2 save
pm2 startup
```

## Common Error Messages

### "ECONNREFUSED" Errors

**Cause:** Service not running or wrong port
**Solution:**
```bash
# Check service status
pm2 status
# Start service
npm start
# Check port configuration
grep PORT .env
```

### "Cannot find module" Errors

**Cause:** Missing dependencies
**Solution:**
```bash
npm install
# Or install specific module
npm install missing-module-name
```

### "Permission denied" Errors

**Cause:** File/directory permissions
**Solution:**
```bash
chmod +x server.js
chown -R $USER:$USER api-gateway/
```

### "Port already in use" Errors

**Cause:** Port conflict
**Solution:**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
# Or change port in .env
PORT=3002
```

## Debug Mode

### Enable Debug Logging

```bash
# Set debug environment
export DEBUG=api-gateway:*
export LOG_LEVEL=debug

# Start with debug output
npm run dev
```

### Debug Specific Components

```bash
# Database queries
export DEBUG=api-gateway:database

# Authentication
export DEBUG=api-gateway:auth

# Performance
export DEBUG=api-gateway:performance
```

## Getting Help

### Log Analysis

```bash
# Recent errors
tail -100 api-gateway/logs/error.log

# Request tracking
grep "req-12345" api-gateway/logs/app.log

# Performance issues
grep -i "slow\|timeout\|performance" api-gateway/logs/app.log
```

### System Information

```bash
# Generate system report
curl http://localhost:3001/status > system-report.json

# Health check report
curl http://localhost:3001/health/detailed > health-report.json

# Performance metrics
curl http://localhost:3001/metrics > metrics-report.json
```

### Contact Information

For additional support:
- Check API documentation
- Review GitHub issues
- Contact system administrators
- Escalate to development team

## Prevention

### Best Practices

1. **Regular Health Checks**: Monitor `/health` endpoints
2. **Log Monitoring**: Set up log aggregation and alerting
3. **Performance Monitoring**: Track response times and error rates
4. **Backup Strategy**: Regular database and configuration backups
5. **Testing**: Comprehensive testing before deployment
6. **Documentation**: Keep runbooks and documentation updated

### Monitoring Setup

```bash
# Set up automated health checks
*/5 * * * * curl -f http://localhost:3001/health || echo "API Gateway down"

# Log rotation
*/10 * * * * find ./logs -name "*.log" -size +100M -exec logrotate {} \;

# Performance monitoring
*/1 * * * * curl -s http://localhost:3001/metrics >> /var/log/api-metrics.log
```