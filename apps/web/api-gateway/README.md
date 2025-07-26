# Enterprise Data Connector API Gateway

## Overview

The Enterprise Data Connector API Gateway is a high-performance, secure, and scalable gateway that provides unified access to enterprise data sources. Built with Node.js and Express, it implements enterprise-grade features including authentication, rate limiting, caching, monitoring, circuit breakers, and comprehensive observability.

## Features

### 🔐 Security & Authentication
- **Multi-Method Authentication**: JWT tokens and API key validation
- **Role-Based Access Control**: Granular permissions and access control
- **Rate Limiting**: Configurable per-user and per-endpoint limits
- **Input Validation**: Comprehensive request validation and sanitization
- **Security Headers**: CORS, CSP, HSTS, and other security headers

### 🚀 Performance & Scalability
- **Connection Pooling**: Efficient database connection management
- **Multi-Level Caching**: Redis and in-memory caching strategies
- **Request Compression**: Automatic response compression
- **Circuit Breakers**: Automatic failover for external dependencies
- **Clustering Support**: PM2-based horizontal scaling

### 📊 Monitoring & Observability
- **Health Checks**: Multi-level health monitoring (basic, detailed, connectors)
- **Metrics Collection**: Comprehensive performance and business metrics
- **Request Tracing**: Full request lifecycle tracking with correlation IDs
- **Alerting System**: Multi-channel alerting with intelligent suppression
- **Structured Logging**: Winston-based logging with multiple transports

### 🔧 Data Connectivity
- **Multi-Database Support**: SQLite, PostgreSQL, MySQL connectors
- **REST API Integration**: Generic REST API connector with OAuth support
- **File Processing**: CSV and Excel file connectors
- **Extensible Architecture**: Plugin-based connector system

## Quick Start

### Prerequisites

- Node.js 16.0 or higher
- npm or yarn package manager
- SQLite databases (included in project)
- Redis (optional, for distributed caching)

### Installation

1. **Navigate to API Gateway directory**
```bash
cd api-gateway
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start

# With PM2 clustering
npm run start:cluster
```

5. **Verify installation**
```bash
curl http://localhost:3001/health
```

## Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters-long
VALID_API_KEYS=dev-token,test-token,frontend-api-key

# Database Configuration
DATABASE_PATH=../Customer/database/customers.db
SALES_DATABASE_PATH=../Sales/database/sales_agent.db
INVENTORY_DATABASE_PATH=../Inventory/database/inventory.db
FINANCE_DATABASE_PATH=../Finance/database/finance.db

# Cache Configuration
REDIS_URL=redis://localhost:6379
MEMORY_CACHE_ENABLED=true
MEMORY_CACHE_SIZE=1000

# Rate Limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=900000

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
TRACING_ENABLED=true
ALERTING_ENABLED=true
```

For complete configuration options, see [`docs/CONFIGURATION_GUIDE.md`](docs/CONFIGURATION_GUIDE.md).

## API Documentation

### Authentication

The API Gateway supports two authentication methods:

**API Key Authentication**
```bash
curl -H "X-API-Key: your-api-key" http://localhost:3001/api/v1/customer/segmentation
```

**JWT Token Authentication**
```bash
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3001/api/v1/sales/performance
```

### Core Endpoints

#### Data Endpoints

**Customer Data**
- `GET /api/v1/customer/segmentation` - Customer segmentation data
- `POST /api/v1/customer/transaction-patterns` - Transaction pattern analysis
- `GET /api/v1/customer/churn-prediction` - Churn prediction analysis

**Sales Data**
- `GET /api/v1/sales/product-performance` - Product performance metrics
- `GET /api/v1/sales/sales-trends` - Sales trend analysis
- `GET /api/v1/sales/regional-performance` - Regional sales data

**Inventory Data**
- `GET /api/v1/inventory/levels` - Current inventory levels
- `GET /api/v1/inventory/movements` - Inventory movement history
- `GET /api/v1/inventory/optimization` - Optimization recommendations

**Finance Data**
- `GET /api/v1/finance/reports` - Financial reports and statements

#### Monitoring Endpoints

**Health Checks**
- `GET /health` - Basic health status
- `GET /health/detailed` - Comprehensive system health
- `GET /health/connectors` - Database connector health

**Metrics & Performance**
- `GET /metrics` - Detailed system metrics
- `GET /metrics/summary` - Performance summary
- `GET /traces` - Request trace history
- `GET /alerts` - Active system alerts

### Request/Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": {
    "rows": [...],
    "rowCount": 10,
    "executionTime": 150,
    "connector": "customer-db",
    "fromCache": false
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123456",
    "source": "api-gateway",
    "version": "1.0.0"
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "hasNextPage": true
  }
}
```

For complete API documentation, see [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

## Architecture

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│   Client Apps   │    │   API Gateway    │    │   Data Sources    │
│                 │◄──►│                  │◄──►│                   │
│  - Frontend     │    │  ┌─────────────┐ │    │  - SQLite DBs     │
│  - Mobile       │    │  │ Auth Layer  │ │    │  - REST APIs      │
│  - External     │    │  └─────────────┘ │    │  - File Sources   │
└─────────────────┘    │  ┌─────────────┐ │    └───────────────────┘
                       │  │Rate Limiting│ │
                       │  └─────────────┘ │
                       │  ┌─────────────┐ │
                       │  │   Caching   │ │
                       │  └─────────────┘ │
                       │  ┌─────────────┐ │
                       │  │ Monitoring  │ │
                       │  └─────────────┘ │
                       └──────────────────┘
```

### Component Architecture

```
api-gateway/
├── middleware/           # Request processing middleware
│   ├── auth/            # Authentication and authorization
│   ├── rate-limit/      # Rate limiting implementation
│   ├── cache/           # Caching middleware
│   └── logging/         # Request logging
├── routes/              # API route definitions
│   ├── customer/        # Customer domain routes
│   ├── sales/           # Sales domain routes
│   ├── inventory/       # Inventory domain routes
│   └── finance/         # Finance domain routes
├── connectors/          # Data source connectors
│   ├── base/            # Base connector interface
│   ├── database/        # Database connectors
│   ├── api/             # REST API connectors
│   └── file/            # File-based connectors
├── monitoring/          # Monitoring and observability
│   ├── logger.js        # Structured logging
│   ├── metrics.js       # Metrics collection
│   ├── healthChecks.js  # Health monitoring
│   ├── alerting.js      # Alert management
│   ├── tracing.js       # Request tracing
│   └── circuitBreaker.js# Circuit breaker pattern
└── utils/               # Utility functions
    ├── QueryBuilder.js  # SQL query builder
    └── logger.js        # Logging utilities
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- connectors/SQLiteConnector.test.js
```

### Development Scripts

```bash
# Start in development mode with hot reload
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

### Adding New Features

#### Creating a New Connector

1. **Create connector class**
```javascript
// connectors/database/CustomConnector.js
const BaseConnector = require('../base/BaseConnector');

class CustomConnector extends BaseConnector {
  async connect() {
    // Implementation
  }

  async query(queryConfig) {
    // Implementation
  }

  async healthCheck() {
    // Implementation
  }
}
```

2. **Register connector**
```javascript
// utils/initializeConnectors.js
const CustomConnector = require('../connectors/database/CustomConnector');

registry.registerConnector('custom-db', CustomConnector, {
  // Configuration
});
```

3. **Add tests**
```javascript
// tests/unit/connectors/CustomConnector.test.js
describe('CustomConnector', () => {
  // Test cases
});
```

#### Adding New Routes

1. **Create route file**
```javascript
// routes/domain/endpoint.js
const express = require('express');
const router = express.Router();

router.get('/endpoint', async (req, res) => {
  // Implementation
});

module.exports = router;
```

2. **Register route**
```javascript
// routes/domain/index.js
const endpoint = require('./endpoint');
router.use('/endpoint', endpoint);
```

For detailed development guides, see [`docs/CONNECTOR_DEVELOPMENT_GUIDE.md`](docs/CONNECTOR_DEVELOPMENT_GUIDE.md).

## Production Deployment

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs api-gateway

# Restart application
pm2 restart api-gateway
```

### Docker Deployment

```bash
# Build Docker image
docker build -t api-gateway .

# Run container
docker run -p 3001:3001 \
  -v /path/to/databases:/data \
  -e NODE_ENV=production \
  api-gateway
```

### Environment-Specific Configuration

Create environment-specific configuration files:

- `.env.development` - Development settings
- `.env.staging` - Staging environment
- `.env.production` - Production configuration

### Health Checks

Set up monitoring for production:

```bash
# Basic health check
curl -f http://localhost:3001/health || exit 1

# Detailed health with timeout
timeout 10 curl -s http://localhost:3001/health/detailed
```

## Monitoring & Observability

### Health Monitoring

**Basic Health Check**
```bash
curl http://localhost:3001/health
```

**Detailed System Health**
```bash
curl http://localhost:3001/health/detailed
```

**Database Connector Health**
```bash
curl http://localhost:3001/health/connectors
```

### Performance Metrics

**System Metrics**
```bash
curl http://localhost:3001/metrics
```

**Performance Summary**
```bash
curl http://localhost:3001/metrics/summary
```

### Request Tracing

**Recent Traces**
```bash
curl http://localhost:3001/traces?limit=10
```

**Specific Trace**
```bash
curl http://localhost:3001/traces/trace-id-123
```

### Alerting

**Active Alerts**
```bash
curl http://localhost:3001/alerts
```

**Alert History**
```bash
curl http://localhost:3001/alerts/history?limit=50
```

### Log Analysis

```bash
# View recent application logs
tail -f logs/app.log

# Filter error logs
grep "ERROR" logs/app.log

# Search by request ID
grep "req-123456" logs/app.log

# Monitor performance logs
grep "responseTime" logs/app.log | tail -20
```

## Security

### Authentication Setup

**JWT Configuration**
```bash
# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET" >> .env
```

**API Key Management**
```bash
# Configure valid API keys
VALID_API_KEYS=frontend-key,mobile-key,admin-key
```

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Rotate API keys regularly**
4. **Enable HTTPS** in production
5. **Configure security headers**
6. **Monitor authentication failures**
7. **Implement proper CORS** policies

### Rate Limiting

Configure rate limits to prevent abuse:

```bash
# Global rate limit
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=900000  # 15 minutes

# Per-endpoint limits
RATE_LIMIT_CUSTOMER_REQUESTS=500
RATE_LIMIT_SALES_REQUESTS=300
```

## Troubleshooting

### Common Issues

**Server Won't Start**
```bash
# Check port availability
lsof -i :3001

# Verify environment configuration
node -e "require('dotenv').config(); console.log(process.env.PORT)"

# Check logs
tail -f logs/error.log
```

**Database Connection Errors**
```bash
# Verify database files exist
ls -la ../Customer/database/customers.db

# Test database connectivity
sqlite3 ../Customer/database/customers.db ".schema"

# Check connector health
curl http://localhost:3001/health/connectors
```

**Authentication Failures**
```bash
# Verify API keys
grep "VALID_API_KEYS" .env

# Test authentication
curl -H "X-API-Key: frontend-api-key" http://localhost:3001/health
```

**Performance Issues**
```bash
# Check system metrics
curl http://localhost:3001/metrics

# Monitor response times
grep "responseTime" logs/app.log | tail -10

# Check cache hit ratio
curl http://localhost:3001/metrics/summary | jq '.cacheHitRatio'
```

For comprehensive troubleshooting, see [`docs/TROUBLESHOOTING_GUIDE.md`](docs/TROUBLESHOOTING_GUIDE.md).

## Performance Optimization

### Caching Strategies

**Redis Caching**
```bash
# Configure Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=300

# Monitor cache performance
curl http://localhost:3001/metrics | jq '.cacheHitRatio'
```

**Memory Caching**
```bash
# Configure in-memory cache
MEMORY_CACHE_ENABLED=true
MEMORY_CACHE_SIZE=5000
MEMORY_CACHE_TTL=300
```

### Database Optimization

**Connection Pooling**
```bash
# Optimize connection pools
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=25
DATABASE_TIMEOUT=30000
```

**Query Optimization**
- Use appropriate indexes on frequently queried columns
- Limit result sets with pagination
- Implement query result caching
- Monitor slow queries

### Performance Monitoring

```bash
# Monitor response times
curl http://localhost:3001/metrics | jq '.performance.responseTime'

# Check database performance
curl http://localhost:3001/metrics | jq '.performance.databaseQueries'

# System resource usage
curl http://localhost:3001/metrics | jq '.system'
```

## Documentation

### Available Documentation

- [`API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) - Complete API reference
- [`ENDPOINTS.md`](docs/ENDPOINTS.md) - Detailed endpoint documentation
- [`CONFIGURATION_GUIDE.md`](docs/CONFIGURATION_GUIDE.md) - Configuration options
- [`TROUBLESHOOTING_GUIDE.md`](docs/TROUBLESHOOTING_GUIDE.md) - Common issues
- [`CONNECTOR_DEVELOPMENT_GUIDE.md`](docs/CONNECTOR_DEVELOPMENT_GUIDE.md) - Custom connectors

### API Examples

**JavaScript/Node.js**
```javascript
const fetch = require('node-fetch');

const apiClient = {
  baseURL: 'http://localhost:3001',
  apiKey: 'your-api-key',
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return response.json();
  }
};

// Get customer segmentation
const segments = await apiClient.request('/api/v1/customer/segmentation');
```

**Python**
```python
import requests

class APIGatewayClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {'X-API-Key': api_key}
    
    def get_transaction_patterns(self, filters):
        response = requests.post(
            f'{self.base_url}/api/v1/customer/transaction-patterns',
            json=filters,
            headers=self.headers
        )
        return response.json()

# Usage
client = APIGatewayClient('http://localhost:3001', 'your-api-key')
data = client.get_transaction_patterns({
    'dateRange': {'start': '2024-01-01', 'end': '2024-01-31'},
    'limit': 50
})
```

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit pull request

### Code Standards

- **ESLint**: Airbnb JavaScript style guide
- **Prettier**: Code formatting
- **JSDoc**: Function documentation
- **Testing**: Jest for unit and integration tests

### Pull Request Guidelines

- Clear description of changes
- Tests for new functionality
- Documentation updates
- Performance impact assessment

## Changelog

### v2.0.0 - Enterprise API Gateway
- ✅ Complete API Gateway architecture
- ✅ Multi-database connector support
- ✅ Enterprise authentication and authorization
- ✅ Comprehensive monitoring and observability
- ✅ Circuit breakers and failover mechanisms
- ✅ Request tracing and correlation
- ✅ Multi-channel alerting system
- ✅ Performance optimization features

### v1.1.0 - Enhanced Monitoring
- ✅ Advanced health checks
- ✅ Metrics collection and aggregation
- ✅ Request tracing implementation
- ✅ Alerting system with notifications

### v1.0.0 - Initial Release
- ✅ Basic API Gateway functionality
- ✅ SQLite database connectors
- ✅ Authentication middleware
- ✅ Rate limiting implementation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

### Getting Help

- **Documentation**: Comprehensive docs in `/docs/` directory
- **Health Checks**: Monitor system at `/health/detailed`
- **Logs**: Check `logs/` directory for detailed information
- **Metrics**: Performance data at `/metrics`
- **Issues**: Report bugs via GitHub issues

### Performance Monitoring

Use the built-in monitoring endpoints to track system performance:

- Response times and percentiles
- Database query performance
- Cache hit ratios
- Error rates and patterns
- System resource utilization

The API Gateway provides enterprise-grade observability out of the box, making it easy to monitor, debug, and optimize your data access layer.