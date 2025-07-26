# API Gateway Configuration Guide

## Overview

The Enterprise Data Connector API Gateway uses environment variables and configuration files to manage settings across different deployment environments. This guide covers all available configuration options, their purposes, and recommended values.

## Configuration Files

### Environment Files

The API Gateway supports multiple environment-specific configuration files:

```
api-gateway/
├── .env                    # Default environment variables
├── .env.development        # Development-specific overrides
├── .env.production         # Production-specific overrides
├── .env.test              # Test environment configuration
└── .env.example           # Template with all available options
```

### Loading Order

Environment variables are loaded in the following priority order (highest to lowest):

1. System environment variables
2. `.env.{NODE_ENV}` (environment-specific)
3. `.env` (default)
4. `.env.example` (template only)

## Core Server Configuration

### Basic Server Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | No |
| `PORT` | Server port number | `3001` | No |
| `HOST` | Server host address | `localhost` | No |
| `API_VERSION` | API version prefix | `v1` | No |
| `SERVER_NAME` | Server identifier | `api-gateway` | No |

**Example:**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
API_VERSION=v1
SERVER_NAME=api-gateway-prod
```

### CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000,http://localhost:3001` | No |
| `CORS_CREDENTIALS` | Allow credentials | `true` | No |
| `CORS_METHODS` | Allowed HTTP methods | `GET,POST,PUT,DELETE,OPTIONS` | No |
| `CORS_HEADERS` | Allowed headers | `Content-Type,Authorization,X-API-Key,X-Request-ID` | No |

**Example:**
```bash
CORS_ORIGIN=https://app.company.com,https://admin.company.com
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-API-Key,X-Request-ID,X-Correlation-ID
```

## Authentication & Security

### JWT Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | None | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | `24h` | No |
| `JWT_ALGORITHM` | Signing algorithm | `HS256` | No |
| `JWT_ISSUER` | Token issuer | `api-gateway` | No |
| `JWT_AUDIENCE` | Token audience | `api-users` | No |

**Example:**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=8h
JWT_ALGORITHM=HS256
JWT_ISSUER=company-api-gateway
JWT_AUDIENCE=company-applications
```

### API Key Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VALID_API_KEYS` | Valid API keys (comma-separated) | `dev-token,test-token,frontend-api-key` | Yes |
| `API_KEY_HEADER` | API key header name | `X-API-Key` | No |
| `API_KEY_QUERY_PARAM` | API key query parameter | `apikey` | No |

**Example:**
```bash
VALID_API_KEYS=dev-key-123,frontend-key-456,mobile-key-789,admin-key-000
API_KEY_HEADER=X-API-Key
API_KEY_QUERY_PARAM=apikey
```

### Security Headers

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECURITY_HEADERS_ENABLED` | Enable security headers | `true` | No |
| `CONTENT_SECURITY_POLICY` | CSP header value | `default-src 'self'` | No |
| `HSTS_MAX_AGE` | HSTS max age (seconds) | `31536000` | No |
| `X_FRAME_OPTIONS` | X-Frame-Options header | `DENY` | No |

**Example:**
```bash
SECURITY_HEADERS_ENABLED=true
CONTENT_SECURITY_POLICY=default-src 'self'; script-src 'self' 'unsafe-inline'
HSTS_MAX_AGE=31536000
X_FRAME_OPTIONS=DENY
```

## Database Configuration

### Primary Database Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_TYPE` | Database type | `sqlite` | No |
| `DATABASE_PATH` | SQLite database file path | `../Customer/database/customers.db` | Yes |
| `DATABASE_POOL_MIN` | Minimum pool connections | `2` | No |
| `DATABASE_POOL_MAX` | Maximum pool connections | `10` | No |
| `DATABASE_TIMEOUT` | Query timeout (ms) | `30000` | No |
| `DATABASE_RETRY_ATTEMPTS` | Connection retry attempts | `3` | No |
| `DATABASE_RETRY_DELAY` | Retry delay (ms) | `1000` | No |

**Example:**
```bash
DATABASE_TYPE=sqlite
DATABASE_PATH=/data/databases/customers.db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=25
DATABASE_TIMEOUT=45000
DATABASE_RETRY_ATTEMPTS=5
DATABASE_RETRY_DELAY=2000
```

### Multi-Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SALES_DATABASE_PATH` | Sales database path | `../Sales/database/sales_agent.db` | Yes |
| `INVENTORY_DATABASE_PATH` | Inventory database path | `../Inventory/database/inventory.db` | Yes |
| `FINANCE_DATABASE_PATH` | Finance database path | `../Finance/database/finance.db` | Yes |

**Example:**
```bash
SALES_DATABASE_PATH=/data/databases/sales.db
INVENTORY_DATABASE_PATH=/data/databases/inventory.db
FINANCE_DATABASE_PATH=/data/databases/finance.db
```

### Database Connection Pooling

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_POOL_ACQUIRE_TIMEOUT` | Pool acquire timeout (ms) | `30000` | No |
| `DB_POOL_CREATE_TIMEOUT` | Pool create timeout (ms) | `30000` | No |
| `DB_POOL_DESTROY_TIMEOUT` | Pool destroy timeout (ms) | `5000` | No |
| `DB_POOL_IDLE_TIMEOUT` | Pool idle timeout (ms) | `300000` | No |
| `DB_POOL_REAP_INTERVAL` | Pool reap interval (ms) | `1000` | No |

**Example:**
```bash
DB_POOL_ACQUIRE_TIMEOUT=45000
DB_POOL_CREATE_TIMEOUT=45000
DB_POOL_DESTROY_TIMEOUT=10000
DB_POOL_IDLE_TIMEOUT=600000
DB_POOL_REAP_INTERVAL=2000
```

## Cache Configuration

### Redis Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | No |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `REDIS_PORT` | Redis port | `6379` | No |
| `REDIS_PASSWORD` | Redis password | None | No |
| `REDIS_DB` | Redis database number | `0` | No |
| `REDIS_TTL` | Default TTL (seconds) | `300` | No |
| `REDIS_PREFIX` | Key prefix | `api-gateway:` | No |

**Example:**
```bash
REDIS_URL=redis://user:password@redis.company.com:6379/0
REDIS_HOST=redis.company.com
REDIS_PORT=6379
REDIS_PASSWORD=secure-redis-password
REDIS_DB=1
REDIS_TTL=600
REDIS_PREFIX=prod-api-gateway:
```

### Memory Cache Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MEMORY_CACHE_ENABLED` | Enable memory cache | `true` | No |
| `MEMORY_CACHE_SIZE` | Max cache entries | `1000` | No |
| `MEMORY_CACHE_TTL` | Default TTL (seconds) | `300` | No |
| `MEMORY_CACHE_CHECK_PERIOD` | Cleanup interval (seconds) | `60` | No |

**Example:**
```bash
MEMORY_CACHE_ENABLED=true
MEMORY_CACHE_SIZE=5000
MEMORY_CACHE_TTL=900
MEMORY_CACHE_CHECK_PERIOD=120
```

## Rate Limiting

### Request Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` | No |
| `RATE_LIMIT_REQUESTS` | Max requests per window | `1000` | No |
| `RATE_LIMIT_WINDOW` | Time window (ms) | `900000` | No |
| `RATE_LIMIT_SKIP_SUCCESSFUL` | Skip successful requests | `false` | No |
| `RATE_LIMIT_SKIP_FAILED` | Skip failed requests | `false` | No |

**Example:**
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=5000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_SKIP_SUCCESSFUL=false
RATE_LIMIT_SKIP_FAILED=true
```

### Per-Endpoint Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_CUSTOMER_REQUESTS` | Customer endpoint limit | `500` | No |
| `RATE_LIMIT_SALES_REQUESTS` | Sales endpoint limit | `300` | No |
| `RATE_LIMIT_INVENTORY_REQUESTS` | Inventory endpoint limit | `200` | No |
| `RATE_LIMIT_FINANCE_REQUESTS` | Finance endpoint limit | `100` | No |

**Example:**
```bash
RATE_LIMIT_CUSTOMER_REQUESTS=1000
RATE_LIMIT_SALES_REQUESTS=800
RATE_LIMIT_INVENTORY_REQUESTS=600
RATE_LIMIT_FINANCE_REQUESTS=400
```

## Logging Configuration

### Basic Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level | `info` | No |
| `LOG_FORMAT` | Log format | `json` | No |
| `LOG_TIMESTAMP` | Include timestamps | `true` | No |
| `LOG_MAX_SIZE` | Max log file size | `50MB` | No |
| `LOG_MAX_FILES` | Max log files to keep | `10` | No |
| `LOG_DIRECTORY` | Log directory path | `./logs` | No |

**Example:**
```bash
LOG_LEVEL=warn
LOG_FORMAT=json
LOG_TIMESTAMP=true
LOG_MAX_SIZE=100MB
LOG_MAX_FILES=20
LOG_DIRECTORY=/var/log/api-gateway
```

### Advanced Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_CONSOLE_ENABLED` | Enable console logging | `true` | No |
| `LOG_FILE_ENABLED` | Enable file logging | `true` | No |
| `LOG_HTTP_ENABLED` | Enable HTTP request logging | `true` | No |
| `LOG_DATABASE_ENABLED` | Enable database query logging | `false` | No |
| `LOG_PERFORMANCE_ENABLED` | Enable performance logging | `true` | No |

**Example:**
```bash
LOG_CONSOLE_ENABLED=false
LOG_FILE_ENABLED=true
LOG_HTTP_ENABLED=true
LOG_DATABASE_ENABLED=true
LOG_PERFORMANCE_ENABLED=true
```

## Monitoring Configuration

### Health Checks

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HEALTH_CHECK_ENABLED` | Enable health checks | `true` | No |
| `HEALTH_CHECK_INTERVAL` | Check interval (ms) | `30000` | No |
| `HEALTH_CHECK_TIMEOUT` | Check timeout (ms) | `5000` | No |
| `HEALTH_CHECK_RETRIES` | Number of retries | `3` | No |

**Example:**
```bash
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=15000
HEALTH_CHECK_TIMEOUT=10000
HEALTH_CHECK_RETRIES=5
```

### Metrics Collection

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `METRICS_ENABLED` | Enable metrics collection | `true` | No |
| `METRICS_SAMPLING_RATE` | Sampling rate (0.0-1.0) | `1.0` | No |
| `METRICS_CLEANUP_INTERVAL` | Cleanup interval (ms) | `300000` | No |
| `METRICS_MAX_HISTORY` | Max metrics history | `10000` | No |

**Example:**
```bash
METRICS_ENABLED=true
METRICS_SAMPLING_RATE=0.8
METRICS_CLEANUP_INTERVAL=600000
METRICS_MAX_HISTORY=50000
```

### Request Tracing

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TRACING_ENABLED` | Enable request tracing | `true` | No |
| `TRACE_SAMPLING_RATE` | Trace sampling rate (0.0-1.0) | `1.0` | No |
| `TRACE_MAX_SPANS` | Max spans per trace | `1000` | No |
| `TRACE_TIMEOUT` | Trace timeout (ms) | `300000` | No |
| `ENABLE_DB_TRACING` | Enable database tracing | `true` | No |

**Example:**
```bash
TRACING_ENABLED=true
TRACE_SAMPLING_RATE=0.1
TRACE_MAX_SPANS=5000
TRACE_TIMEOUT=600000
ENABLE_DB_TRACING=true
```

## Alerting Configuration

### Basic Alerting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ALERTING_ENABLED` | Enable alerting system | `true` | No |
| `ALERT_CHECK_INTERVAL` | Alert check interval (ms) | `60000` | No |
| `ALERT_SUPPRESSION_DURATION` | Suppression duration (ms) | `300000` | No |
| `ALERT_ESCALATION_DELAY` | Escalation delay (ms) | `900000` | No |

**Example:**
```bash
ALERTING_ENABLED=true
ALERT_CHECK_INTERVAL=30000
ALERT_SUPPRESSION_DURATION=600000
ALERT_ESCALATION_DELAY=1800000
```

### Notification Channels

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ALERT_WEBHOOK_URL` | Webhook URL for notifications | None | No |
| `ALERT_EMAIL_ENABLED` | Enable email alerts | `false` | No |
| `ALERT_EMAIL_FROM` | Email sender address | None | No |
| `ALERT_EMAIL_TO` | Email recipient addresses | None | No |
| `ALERT_SLACK_ENABLED` | Enable Slack notifications | `false` | No |
| `ALERT_SLACK_WEBHOOK` | Slack webhook URL | None | No |

**Example:**
```bash
ALERT_WEBHOOK_URL=https://hooks.company.com/alerts
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_FROM=alerts@company.com
ALERT_EMAIL_TO=admin@company.com,ops@company.com
ALERT_SLACK_ENABLED=true
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## Circuit Breaker Configuration

### Basic Circuit Breaker

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CIRCUIT_BREAKER_ENABLED` | Enable circuit breakers | `true` | No |
| `CB_FAILURE_THRESHOLD` | Failure threshold | `5` | No |
| `CB_SUCCESS_THRESHOLD` | Success threshold | `2` | No |
| `CB_TIMEOUT` | Circuit breaker timeout (ms) | `60000` | No |
| `CB_MONITORING_PERIOD` | Monitoring period (ms) | `10000` | No |

**Example:**
```bash
CIRCUIT_BREAKER_ENABLED=true
CB_FAILURE_THRESHOLD=10
CB_SUCCESS_THRESHOLD=5
CB_TIMEOUT=120000
CB_MONITORING_PERIOD=20000
```

### Dependency Monitoring

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEPENDENCY_MONITORING_ENABLED` | Enable dependency monitoring | `true` | No |
| `DEPENDENCY_CHECK_INTERVAL` | Check interval (ms) | `30000` | No |
| `DEPENDENCY_TIMEOUT` | Dependency timeout (ms) | `5000` | No |
| `DEPENDENCY_RETRIES` | Number of retries | `3` | No |

**Example:**
```bash
DEPENDENCY_MONITORING_ENABLED=true
DEPENDENCY_CHECK_INTERVAL=15000
DEPENDENCY_TIMEOUT=10000
DEPENDENCY_RETRIES=5
```

## Performance Configuration

### Request Processing

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REQUEST_TIMEOUT` | Request timeout (ms) | `30000` | No |
| `MAX_REQUEST_SIZE` | Max request size (bytes) | `10485760` | No |
| `KEEP_ALIVE_TIMEOUT` | Keep-alive timeout (ms) | `5000` | No |
| `HEADERS_TIMEOUT` | Headers timeout (ms) | `60000` | No |

**Example:**
```bash
REQUEST_TIMEOUT=60000
MAX_REQUEST_SIZE=52428800
KEEP_ALIVE_TIMEOUT=10000
HEADERS_TIMEOUT=120000
```

### Compression

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `COMPRESSION_ENABLED` | Enable response compression | `true` | No |
| `COMPRESSION_LEVEL` | Compression level (1-9) | `6` | No |
| `COMPRESSION_THRESHOLD` | Min size for compression | `1024` | No |

**Example:**
```bash
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=8
COMPRESSION_THRESHOLD=2048
```

## External Services Configuration

### Email Service

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP server host | None | No |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_SECURE` | Use SSL/TLS | `false` | No |
| `SMTP_USER` | SMTP username | None | No |
| `SMTP_PASS` | SMTP password | None | No |

**Example:**
```bash
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=api-gateway@company.com
SMTP_PASS=smtp-password
```

### Webhook Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WEBHOOK_TIMEOUT` | Webhook timeout (ms) | `10000` | No |
| `WEBHOOK_RETRIES` | Webhook retry attempts | `3` | No |
| `WEBHOOK_RETRY_DELAY` | Retry delay (ms) | `1000` | No |

**Example:**
```bash
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRIES=5
WEBHOOK_RETRY_DELAY=2000
```

## Development Configuration

### Development Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment name | `development` | No |
| `DEBUG` | Debug namespace | None | No |
| `HOT_RELOAD` | Enable hot reload | `true` | No |
| `API_DOCS_ENABLED` | Enable API documentation | `true` | No |

**Example:**
```bash
NODE_ENV=development
DEBUG=api-gateway:*
HOT_RELOAD=true
API_DOCS_ENABLED=true
```

### Testing Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TEST_DATABASE_PATH` | Test database path | `:memory:` | No |
| `TEST_PORT` | Test server port | `3002` | No |
| `TEST_TIMEOUT` | Test timeout (ms) | `30000` | No |

**Example:**
```bash
TEST_DATABASE_PATH=/tmp/test.db
TEST_PORT=3002
TEST_TIMEOUT=60000
```

## Production Configuration

### Production Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment name | `production` | Yes |
| `CLUSTER_WORKERS` | Number of worker processes | `0` (CPU count) | No |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | Shutdown timeout (ms) | `30000` | No |
| `HEALTH_CHECK_GRACE_PERIOD` | Health check grace period (ms) | `10000` | No |

**Example:**
```bash
NODE_ENV=production
CLUSTER_WORKERS=4
GRACEFUL_SHUTDOWN_TIMEOUT=45000
HEALTH_CHECK_GRACE_PERIOD=15000
```

### SSL/TLS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HTTPS_ENABLED` | Enable HTTPS | `false` | No |
| `SSL_CERT_PATH` | SSL certificate path | None | No |
| `SSL_KEY_PATH` | SSL private key path | None | No |
| `SSL_CA_PATH` | SSL CA certificate path | None | No |

**Example:**
```bash
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/api-gateway.crt
SSL_KEY_PATH=/etc/ssl/private/api-gateway.key
SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt
```

## Configuration Validation

### Environment Validation Schema

```javascript
// config/validation.js
const Joi = require('joi');

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  JWT_SECRET: Joi.string().min(32).required(),
  DATABASE_PATH: Joi.string().required(),
  REDIS_URL: Joi.string().uri().optional(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  RATE_LIMIT_REQUESTS: Joi.number().positive().default(1000),
  RATE_LIMIT_WINDOW: Joi.number().positive().default(900000)
});

// Validate configuration
const { error, value } = configSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: false
});

if (error) {
  throw new Error(`Configuration validation failed: ${error.message}`);
}
```

## Configuration Examples

### Development Environment (.env.development)

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=localhost

# Authentication
JWT_SECRET=development-jwt-secret-change-in-production
VALID_API_KEYS=dev-token,test-token,frontend-api-key

# Database
DATABASE_PATH=../Customer/database/customers.db
SALES_DATABASE_PATH=../Sales/database/sales_agent.db
INVENTORY_DATABASE_PATH=../Inventory/database/inventory.db

# Cache
REDIS_URL=redis://localhost:6379
MEMORY_CACHE_ENABLED=true

# Logging
LOG_LEVEL=debug
LOG_CONSOLE_ENABLED=true
LOG_FILE_ENABLED=true

# Monitoring
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
TRACING_ENABLED=true
ALERTING_ENABLED=false

# Development Features
HOT_RELOAD=true
API_DOCS_ENABLED=true
DEBUG=api-gateway:*
```

### Production Environment (.env.production)

```bash
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
CLUSTER_WORKERS=max

# Authentication
JWT_SECRET=super-secure-production-jwt-secret-minimum-64-characters-long
JWT_EXPIRES_IN=8h
VALID_API_KEYS=prod-frontend-key,prod-mobile-key,prod-admin-key

# Database
DATABASE_PATH=/data/databases/customers.db
SALES_DATABASE_PATH=/data/databases/sales.db
INVENTORY_DATABASE_PATH=/data/databases/inventory.db
DATABASE_POOL_MAX=25
DATABASE_TIMEOUT=45000

# Cache
REDIS_URL=redis://redis.company.com:6379/0
REDIS_PASSWORD=secure-redis-password
REDIS_TTL=600

# Security
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/api-gateway.crt
SSL_KEY_PATH=/etc/ssl/private/api-gateway.key
SECURITY_HEADERS_ENABLED=true

# Logging
LOG_LEVEL=warn
LOG_CONSOLE_ENABLED=false
LOG_FILE_ENABLED=true
LOG_DIRECTORY=/var/log/api-gateway
LOG_MAX_SIZE=100MB

# Monitoring
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true
TRACING_ENABLED=true
TRACE_SAMPLING_RATE=0.1
ALERTING_ENABLED=true

# Alerting
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_FROM=alerts@company.com
ALERT_EMAIL_TO=ops@company.com,admin@company.com
ALERT_SLACK_ENABLED=true
ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Performance
REQUEST_TIMEOUT=30000
COMPRESSION_ENABLED=true
RATE_LIMIT_REQUESTS=5000
```

### Test Environment (.env.test)

```bash
# Server
NODE_ENV=test
PORT=3002
HOST=localhost

# Authentication
JWT_SECRET=test-jwt-secret
VALID_API_KEYS=test-token

# Database
DATABASE_PATH=:memory:
SALES_DATABASE_PATH=:memory:
INVENTORY_DATABASE_PATH=:memory:

# Cache
REDIS_URL=redis://localhost:6379/15
MEMORY_CACHE_ENABLED=true

# Logging
LOG_LEVEL=error
LOG_CONSOLE_ENABLED=false
LOG_FILE_ENABLED=false

# Monitoring (disabled for tests)
HEALTH_CHECK_ENABLED=false
METRICS_ENABLED=false
TRACING_ENABLED=false
ALERTING_ENABLED=false

# Test Settings
TEST_TIMEOUT=30000
```

## Configuration Management

### Environment Detection

```javascript
// config/index.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: path.join(__dirname, `../.env.${env}`) });

const config = {
  env,
  port: parseInt(process.env.PORT, 10) || 3001,
  host: process.env.HOST || 'localhost',
  
  // Database configuration
  database: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    path: process.env.DATABASE_PATH,
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DATABASE_POOL_MAX, 10) || 10
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    validApiKeys: (process.env.VALID_API_KEYS || '').split(',').filter(Boolean)
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: process.env.METRICS_ENABLED === 'true',
    healthCheck: {
      enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000
    }
  }
};

module.exports = config;
```

### Configuration Validation

```javascript
// config/validator.js
function validateConfig(config) {
  const required = [
    'JWT_SECRET',
    'DATABASE_PATH',
    'VALID_API_KEYS'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate database paths
  if (process.env.NODE_ENV !== 'test') {
    const fs = require('fs');
    const path = require('path');
    
    const dbPath = path.resolve(process.env.DATABASE_PATH);
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      throw new Error(`Database directory does not exist: ${dbDir}`);
    }
  }
  
  return true;
}

module.exports = { validateConfig };
```

## Best Practices

### Security

1. **Never commit secrets**: Use `.env` files and exclude them from version control
2. **Use strong JWT secrets**: Minimum 32 characters, preferably 64+
3. **Rotate API keys regularly**: Implement key rotation strategy
4. **Use environment-specific configs**: Different secrets for dev/staging/prod
5. **Validate configuration**: Validate all config values on startup

### Performance

1. **Optimize pool sizes**: Balance between performance and resource usage
2. **Configure timeouts**: Set appropriate timeouts for all operations
3. **Enable compression**: Reduce bandwidth usage for large responses
4. **Use appropriate cache TTLs**: Balance freshness with performance
5. **Monitor resource usage**: Track memory, CPU, and connection usage

### Reliability

1. **Set reasonable defaults**: Provide sensible defaults for all optional settings
2. **Enable health checks**: Monitor system health continuously
3. **Configure alerting**: Set up proactive alerting for issues
4. **Use circuit breakers**: Prevent cascade failures
5. **Plan for graceful shutdown**: Handle shutdown signals properly

### Maintainability

1. **Document all variables**: Provide clear descriptions and examples
2. **Group related settings**: Organize configuration logically
3. **Use consistent naming**: Follow naming conventions
4. **Validate on startup**: Catch configuration errors early
5. **Provide examples**: Include complete example configurations