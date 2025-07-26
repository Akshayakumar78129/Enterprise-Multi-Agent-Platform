# Enterprise Data Connector Migration Plan

## 📋 Project Overview

**CRITICAL REQUIREMENT**: All backend data access must be via APIs using data connectors to flow data from real enterprise systems. NO direct SQL queries or database connections are allowed in the final architecture.

**Current State**: Direct database connections scattered across tools
**Target State**: Centralized API Gateway with pluggable enterprise data connectors

---

## 🎯 Migration Strategy

### Phase 1: API Gateway Foundation (Priority: CRITICAL)

### Phase 2: Core Data Connectors (Priority: HIGH)

### Phase 3: Tool Migration (Priority: HIGH)

### Phase 4: Advanced Features (Priority: MEDIUM)

---

## 📁 Required Directory Structure

```
api-gateway/
├── connectors/              # Data connector implementations
│   ├── base/               # Base connector interface
│   ├── database/           # Database connectors (SQLite, PostgreSQL, etc.)
│   ├── api/                # REST API connectors (Salesforce, SAP, etc.)
│   ├── file/               # File-based connectors (CSV, Excel, etc.)
│   └── stream/             # Real-time stream connectors
├── middleware/             # Gateway middleware
│   ├── auth/               # Authentication & authorization
│   ├── rate-limit/         # Rate limiting
│   ├── logging/            # Request/response logging
│   └── cache/              # Caching layer
├── routes/                 # API route definitions
│   ├── customer/           # Customer domain routes
│   ├── sales/              # Sales domain routes
│   ├── inventory/          # Inventory domain routes
│   └── finance/            # Finance domain routes
├── schemas/                # Data validation schemas
├── config/                 # Configuration management
├── utils/                  # Utility functions
└── tests/                  # Comprehensive test suite
```

---

## ✅ Phase 1: API Gateway Foundation

### TODO 1.1: Create Base API Gateway Infrastructure

- [ ] **Create `api-gateway/` directory** in project root
- [ ] **Install required dependencies**:

  ```bash
  # Core dependencies
  npm install express cors helmet morgan
  npm install express-rate-limit express-validator
  npm install redis ioredis node-cache
  npm install axios dotenv
  npm install winston

  # Development dependencies
  npm install -D nodemon jest supertest
  ```

- [ ] **Create `api-gateway/package.json`** with proper configuration
- [ ] **Create `api-gateway/server.js`** as main entry point
- [ ] **Set up Express.js server** with middleware stack
- [ ] **Configure CORS** for frontend integration
- [ ] **Add security headers** using Helmet
- [ ] **Set up request logging** with Winston
- [ ] **Configure environment-based settings**

### TODO 1.2: Implement Base Connector Interface

- [ ] **Create `api-gateway/connectors/base/BaseConnector.js`**:
  ```javascript
  class BaseConnector {
    constructor(config) {
      /* Implementation required */
    }
    async connect() {
      /* Implementation required */
    }
    async query(queryConfig) {
      /* Implementation required */
    }
    async disconnect() {
      /* Implementation required */
    }
    async healthCheck() {
      /* Implementation required */
    }
    getSchema() {
      /* Implementation required */
    }
  }
  ```
- [ ] **Create `api-gateway/connectors/base/ConnectorInterface.js`** defining required methods
- [ ] **Create `api-gateway/connectors/ConnectorRegistry.js`** for managing connectors
- [ ] **Implement connector lifecycle management** (connect, query, disconnect)
- [ ] **Add connector health monitoring** capabilities
- [ ] **Create connector configuration validation**

### TODO 1.3: Set Up Authentication & Authorization

- [ ] **Create `api-gateway/middleware/auth/authMiddleware.js`**
- [ ] **Implement JWT token validation**
- [ ] **Create role-based access control (RBAC)**
- [ ] **Add API key authentication** for service-to-service calls
- [ ] **Configure OAuth 2.0 integration** for enterprise SSO
- [ ] **Create user permission matrix** for domain access
- [ ] **Implement audit logging** for all authentication events

### TODO 1.4: Implement Caching Layer

- [ ] **Create `api-gateway/middleware/cache/cacheMiddleware.js`**
- [ ] **Configure Redis connection** for distributed caching
- [ ] **Implement in-memory fallback** using node-cache
- [ ] **Create cache key generation strategy**
- [ ] **Add cache invalidation patterns**
- [ ] **Configure TTL policies** per data type
- [ ] **Implement cache warming strategies** for frequent queries

### TODO 1.5: Set Up Rate Limiting & Security

- [ ] **Create `api-gateway/middleware/rate-limit/rateLimitMiddleware.js`**
- [ ] **Configure per-user rate limits**
- [ ] **Implement per-endpoint rate limits**
- [ ] **Add IP-based rate limiting**
- [ ] **Create rate limit bypass** for internal services
- [ ] **Implement request validation** using express-validator
- [ ] **Add SQL injection protection**
- [ ] **Configure request size limits**

---

## ✅ Phase 2: Core Data Connectors

### TODO 2.1: Implement Database Connector

- [ ] **Create `api-gateway/connectors/database/SQLiteConnector.js`**:
  ```javascript
  class SQLiteConnector extends BaseConnector {
    constructor(config) {
      super(config);
      this.dbPath = config.dbPath;
      this.connection = null;
    }

    async connect() {
      /* Implementation required */
    }
    async query(queryConfig) {
      /* Implementation required */
    }
    // ... other required methods
  }
  ```
- [ ] **Implement connection pooling** for SQLite databases
- [ ] **Add query optimization** and prepared statements
- [ ] **Create transaction support**
- [ ] **Implement read-only query enforcement**
- [ ] **Add query timeout handling**
- [ ] **Create backup database failover**

### TODO 2.2: Create PostgreSQL Connector

- [ ] **Create `api-gateway/connectors/database/PostgreSQLConnector.js`**
- [ ] **Configure connection pooling** using pg-pool
- [ ] **Implement SSL connection support**
- [ ] **Add connection retry logic**
- [ ] **Create schema validation**
- [ ] **Implement bulk query operations**

### TODO 2.3: Implement Generic REST API Connector

- [ ] **Create `api-gateway/connectors/api/RestApiConnector.js`**
- [ ] **Add OAuth 2.0 authentication** support
- [ ] **Implement API key authentication**
- [ ] **Add request/response transformation** layers
- [ ] **Configure retry policies** with exponential backoff
- [ ] **Implement circuit breaker pattern**
- [ ] **Add response caching** for static data

### TODO 2.4: Create File-Based Connectors

- [ ] **Create `api-gateway/connectors/file/CsvConnector.js`**
- [ ] **Create `api-gateway/connectors/file/ExcelConnector.js`**
- [ ] **Add file watching** for automatic updates
- [ ] **Implement streaming** for large files
- [ ] **Add data validation** and type inference
- [ ] **Create file archiving** after processing

---

## ✅ Phase 3: API Gateway Routes

### TODO 3.1: Design Unified API Schema

- [ ] **Create `api-gateway/schemas/ApiSchema.js`** defining standard API response format:
  ```javascript
  const standardResponse = {
    success: Boolean,
    data: Object,
    metadata: {
      timestamp: String,
      requestId: String,
      source: String,
      cache: Boolean,
    },
    pagination: Object, // if applicable
    errors: Array, // if applicable
  };
  ```
- [ ] **Define standard error responses**
- [ ] **Create pagination schema** for large datasets
- [ ] **Implement data transformation** standards
- [ ] **Add response compression**

### TODO 3.2: Customer Domain Routes

- [ ] **Create `api-gateway/routes/customer/transactionPatterns.js`**:
  ```javascript
  // Route: GET/POST /api/v1/customer/transaction-patterns
  router.post("/transaction-patterns", async (req, res) => {
    const connector = ConnectorRegistry.get("customer-db");
    const query = QueryBuilder.buildTransactionPatternsQuery(req.body);
    const data = await connector.query(query);
    res.json(standardResponse(data));
  });
  ```
- [ ] **Create `api-gateway/routes/customer/churnPrediction.js`**
- [ ] **Create `api-gateway/routes/customer/segmentation.js`**
- [ ] **Create `api-gateway/routes/customer/lifetimeValue.js`**
- [ ] **Create `api-gateway/routes/customer/behavior.js`**
- [ ] **Create `api-gateway/routes/customer/retention.js`**
- [ ] **Create `api-gateway/routes/customer/engagement.js`**
- [ ] **Create `api-gateway/routes/customer/anomaly.js`**
- [ ] **Create `api-gateway/routes/customer/nextPurchase.js`**
- [ ] **Create `api-gateway/routes/customer/purchaseFrequency.js`**
- [ ] **Create `api-gateway/routes/customer/performanceDeviation.js`**

### TODO 3.3: Sales Domain Routes

- [ ] **Create `api-gateway/routes/sales/productPerformance.js`**
- [ ] **Create `api-gateway/routes/sales/salesPerformance.js`**
- [ ] **Create `api-gateway/routes/sales/salesTrends.js`**
- [ ] **Create `api-gateway/routes/sales/regionalSales.js`**
- [ ] **Create `api-gateway/routes/sales/demandForecast.js`**

### TODO 3.4: Inventory Domain Routes

- [ ] **Create `api-gateway/routes/inventory/levelAnalyzer.js`**
- [ ] **Create `api-gateway/routes/inventory/holdingCost.js`**
- [ ] **Create `api-gateway/routes/inventory/optimization.js`**
- [ ] **Create `api-gateway/routes/inventory/slowMoving.js`**
- [ ] **Create `api-gateway/routes/inventory/stockOptimization.js`**

### TODO 3.5: Finance Domain Routes

- [ ] **Create `api-gateway/routes/finance/financial.js`**

---

## ✅ Phase 4: Query Builder System

### TODO 4.1: Create Unified Query Builder

- [ ] **Create `api-gateway/utils/QueryBuilder.js`**:
  ```javascript
  class QueryBuilder {
    static buildTransactionPatternsQuery(filters) {
      return {
        table: "dbo_F_Sales_Transaction",
        fields: ["Sales Txn Key", "Customer Key", "Item Number" /* ... */],
        where: this.buildWhereClause(filters),
        orderBy: ["Txn Date DESC", "Posting Time DESC"],
        limit: filters.limit || 10000,
      };
    }

    static buildWhereClause(filters) {
      /* Implementation required */
    }
    static buildDateFilter(dateRange) {
      /* Implementation required */
    }
    static buildSegmentFilter(segments) {
      /* Implementation required */
    }
  }
  ```
- [ ] **Implement filter standardization** across all tools
- [ ] **Add query optimization** hints
- [ ] **Create parameterized query support**
- [ ] **Implement query validation**
- [ ] **Add query performance monitoring**

### TODO 4.2: Data Transformation Layer

- [ ] **Create `api-gateway/utils/DataTransformer.js`**
- [ ] **Implement field mapping** between enterprise schemas and internal formats
- [ ] **Add data type conversion** utilities
- [ ] **Create aggregation functions**
- [ ] **Implement data filtering** and sorting
- [ ] **Add data validation** rules

---

## ✅ Phase 5: Tool Migration (CRITICAL PHASE)

### TODO 5.1: Create API Client Library

- [ ] **Create `ui-common/utils/api/ApiClient.js`**:
  ```javascript
  class ApiClient {
    constructor(baseUrl = "/api/v1") {
      this.baseUrl = baseUrl;
      this.defaultHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      };
    }

    async get(endpoint, params = {}) {
      /* Implementation required */
    }
    async post(endpoint, data = {}) {
      /* Implementation required */
    }
    // ... other HTTP methods
  }
  ```
- [ ] **Add request/response interceptors**
- [ ] **Implement automatic retry logic**
- [ ] **Add request caching** for GET requests
- [ ] **Create error handling** utilities
- [ ] **Add request timeout** configuration

### TODO 5.2: Transaction Patterns Tool Migration

- [ ] **BACKUP current implementation**:
  - [ ] Copy `Customer/tools/transaction_patterns/database/queries.js` → `Customer/tools/transaction_patterns/database/queries.js.backup`
  - [ ] Copy `pages/api/transaction-patterns/data.js` → `pages/api/transaction-patterns/data.js.backup`
- [ ] **Update `pages/api/transaction-patterns/data.js`**:

  ```javascript
  // REPLACE database queries with API Gateway calls
  import { ApiClient } from "../../../ui-common/utils/api/ApiClient.js";

  export default async function handler(req, res) {
    const apiClient = new ApiClient();
    const filters = req.method === "POST" ? req.body : req.query;

    try {
      const response = await apiClient.post(
        "/customer/transaction-patterns",
        filters
      );
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  ```

- [ ] **DELETE `Customer/tools/transaction_patterns/database/queries.js`**
- [ ] **Test transaction patterns tool** functionality
- [ ] **Verify all visualizations** work correctly
- [ ] **Check performance** compared to previous implementation

### TODO 5.3: Customer Segmentation Tool Migration

- [ ] **BACKUP current implementation**:
  - [ ] Copy `Customer/tools/customer_segmentation/database/queries.js` → backup
  - [ ] Copy `pages/api/customer-segmentation/data.js` → backup
- [ ] **Update API endpoint** to use API Gateway
- [ ] **Remove direct database access**
- [ ] **Test tool functionality**
- [ ] **Verify UI components** work correctly

### TODO 5.4: Churn Prediction Tool Migration

- [ ] **BACKUP current implementation**
- [ ] **Update API integration**
- [ ] **Remove direct database queries**
- [ ] **Test ML functionality** works through API
- [ ] **Verify prediction accuracy** maintained

### TODO 5.5: Continue All Customer Tools

- [ ] **Customer Lifetime Value Migration**
- [ ] **Customer Behavior Migration**
- [ ] **Retention Planner Migration**
- [ ] **Engagement Classifier Migration**
- [ ] **Anomaly Detection Migration**
- [ ] **Next Purchase Migration**
- [ ] **Purchase Frequency Migration**
- [ ] **Performance Deviation Migration**

### TODO 5.6: Sales Tools Migration

- [ ] **Product Performance Analyzer Migration**
- [ ] **Sales Performance Analyzer Migration**
- [ ] **Sales Trend Analyzer Migration**
- [ ] **Regional Sales Analyzer Migration**
- [ ] **Demand Forecast Engine Migration**

### TODO 5.7: Inventory Tools Migration

- [ ] **Inventory Level Analyzer Migration**
- [ ] **Inventory Holding Cost Migration**
- [ ] **Slow Moving Inventory Migration**
- [ ] **Stock Optimization Migration**

### TODO 5.8: Finance Tools Migration

- [ ] **Financial Tool Migration**

---

## ✅ Phase 6: Configuration & Deployment

### TODO 6.1: Environment Configuration

- [ ] **Create `api-gateway/.env.example`**:

  ```bash
  # Database Configuration
  DATABASE_TYPE=sqlite
  DATABASE_PATH=../Customer/database/customers.db
  SALES_DATABASE_PATH=../Sales/database/sales_agent.db
  INVENTORY_DATABASE_PATH=../Inventory/database/inventory.db

  # Redis Configuration
  REDIS_URL=redis://localhost:6379
  REDIS_TTL=3600

  # API Configuration
  PORT=3001
  JWT_SECRET=your-jwt-secret
  API_RATE_LIMIT=100

  # External Connectors
  SALESFORCE_CLIENT_ID=
  SALESFORCE_CLIENT_SECRET=
  SAP_API_URL=
  SAP_API_KEY=
  ```

- [ ] **Create environment-specific configs**
- [ ] **Add configuration validation**
- [ ] **Create secrets management**

### TODO 6.2: Process Management

- [ ] **Create `api-gateway/ecosystem.config.js`** for PM2:
  ```javascript
  module.exports = {
    apps: [
      {
        name: "api-gateway",
        script: "server.js",
        instances: "max",
        exec_mode: "cluster",
        env: {
          NODE_ENV: "production",
          PORT: 3001,
        },
      },
    ],
  };
  ```
- [ ] **Create startup scripts**
- [ ] **Add health check endpoints**
- [ ] **Configure log rotation**

### TODO 6.3: Frontend Integration Updates

- [ ] **Update `pages/_app.js`** to use new API base URL
- [ ] **Configure API Gateway proxy** in Next.js:
  ```javascript
  // next.config.js
  module.exports = {
    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: "http://localhost:3001/api/v1/:path*",
        },
      ];
    },
  };
  ```
- [ ] **Update all frontend API calls** to use new endpoints
- [ ] **Add error boundary** for API failures
- [ ] **Implement loading states** for API calls

---

## ✅ Phase 7: Testing & Validation

### TODO 7.1: Unit Testing

- [ ] **Create `api-gateway/tests/connectors/`** test suite
- [ ] **Test all connector implementations**
- [ ] **Test query builder functionality**
- [ ] **Test data transformation**
- [ ] **Test authentication middleware**
- [ ] **Test rate limiting**
- [ ] **Test caching behavior**

### TODO 7.2: Integration Testing

- [ ] **Create `api-gateway/tests/integration/`** test suite
- [ ] **Test end-to-end data flow**
- [ ] **Test all API endpoints**
- [ ] **Test error handling**
- [ ] **Test performance** under load
- [ ] **Test failover scenarios**

### TODO 7.3: Tool Validation

- [ ] **Test each migrated tool** individually
- [ ] **Compare data accuracy** before/after migration
- [ ] **Verify UI functionality** unchanged
- [ ] **Check visualization rendering**
- [ ] **Test filters and interactions**
- [ ] **Validate KPI calculations**

### TODO 7.4: Performance Testing

- [ ] **Benchmark API response times**
- [ ] **Test concurrent user load**
- [ ] **Monitor memory usage**
- [ ] **Test cache effectiveness**
- [ ] **Validate query optimization**

---

## ✅ Phase 8: Enterprise Connector Extensions

### TODO 8.1: Salesforce Connector

- [ ] **Create `api-gateway/connectors/api/SalesforceConnector.js`**
- [ ] **Implement Salesforce REST API** integration
- [ ] **Add OAuth 2.0 authentication** flow
- [ ] **Map Salesforce objects** to internal schema
- [ ] **Implement bulk data operations**
- [ ] **Add real-time webhook** support

### TODO 8.2: SAP Connector

- [ ] **Create `api-gateway/connectors/api/SapConnector.js`**
- [ ] **Implement SAP OData API** integration
- [ ] **Add SAP authentication** (Basic/OAuth)
- [ ] **Map SAP business objects**
- [ ] **Implement batch processing**

### TODO 8.3: Microsoft SQL Server Connector

- [ ] **Create `api-gateway/connectors/database/SqlServerConnector.js`**
- [ ] **Add Windows authentication** support
- [ ] **Implement connection pooling**
- [ ] **Add stored procedure** execution
- [ ] **Create bulk import** capabilities

### TODO 8.4: Oracle Database Connector

- [ ] **Create `api-gateway/connectors/database/OracleConnector.js`**
- [ ] **Implement Oracle-specific features**
- [ ] **Add PL/SQL support**
- [ ] **Configure TNS connections**

---

## ✅ Phase 9: Monitoring & Observability

### TODO 9.1: Logging & Metrics

- [ ] **Create `api-gateway/monitoring/logger.js`**
- [ ] **Implement structured logging**
- [ ] **Add performance metrics** collection
- [ ] **Create dashboard** for monitoring
- [ ] **Set up alerting** for errors
- [ ] **Add request tracing**

### TODO 9.2: Health Monitoring

- [ ] **Create health check endpoints**:
  - [ ] `/health` - Basic service health
  - [ ] `/health/connectors` - Connector status
  - [ ] `/health/cache` - Cache system status
  - [ ] `/metrics` - Performance metrics
- [ ] **Implement circuit breakers**
- [ ] **Add dependency monitoring**

---

## ✅ Phase 10: Documentation & Cleanup

### TODO 10.1: API Documentation

- [ ] **Create comprehensive API documentation**
- [ ] **Document all endpoints** with examples
- [ ] **Create connector development guide**
- [ ] **Add troubleshooting guide**
- [ ] **Document configuration options**

### TODO 10.2: Code Cleanup

- [ ] **Remove all backup files** after validation
- [ ] **Delete unused database connector files**:
  - [ ] `Customer/database/connector.js`
  - [ ] `Sales/database/connector.py`
  - [ ] `Finance/database/connector.py`
  - [ ] `Inventory/database/connector.py`
- [ ] **Clean up import statements**
- [ ] **Remove redundant code**
- [ ] **Update README files**

---

## 🚨 Critical Success Criteria

### Data Integrity Requirements

- [ ] **ALL data must flow through API Gateway** (no direct database access)
- [ ] **Data accuracy must be maintained** (100% match with previous implementation)
- [ ] **API response times** must be acceptable (<500ms for typical queries)
- [ ] **All UI functionality** must work unchanged
- [ ] **All visualizations** must render correctly

### Security Requirements

- [ ] **Authentication required** for all API endpoints
- [ ] **Role-based access control** implemented
- [ ] **API rate limiting** active
- [ ] **SQL injection protection** in place
- [ ] **Audit logging** for all data access

### Performance Requirements

- [ ] **Caching implemented** for frequently accessed data
- [ ] **Connection pooling** configured for databases
- [ ] **Query optimization** active
- [ ] **Load testing passed** for expected user volumes

---

## 🔧 Implementation Commands

### Start Implementation

```bash
# Create API Gateway structure
mkdir api-gateway
cd api-gateway
npm init -y

# Install dependencies
npm install express cors helmet morgan express-rate-limit express-validator redis ioredis node-cache axios dotenv winston
npm install -D nodemon jest supertest

# Create directory structure
mkdir -p connectors/{base,database,api,file,stream}
mkdir -p middleware/{auth,rate-limit,logging,cache}
mkdir -p routes/{customer,sales,inventory,finance}
mkdir -p schemas config utils tests

# Start development server
npm run dev
```

### Testing Commands

```bash
# Run connector tests
npm test -- connectors

# Run integration tests
npm test -- integration

# Run performance tests
npm run test:performance

# Check API health
curl http://localhost:3001/health
```

---

## 📈 Success Metrics

### Technical Metrics

- **API Response Time**: <500ms average
- **Cache Hit Rate**: >80%
- **Uptime**: >99.9%
- **Error Rate**: <0.1%

### Business Metrics

- **Tool Functionality**: 100% preserved
- **Data Accuracy**: 100% match
- **User Experience**: No degradation
- **Performance**: Equivalent or better

---

## ⚠️ Risk Mitigation

### Major Risks

1. **Data Loss**: Comprehensive backups and testing required
2. **Performance Degradation**: Thorough performance testing needed
3. **API Failures**: Circuit breakers and fallbacks required
4. **Security Issues**: Security review and penetration testing needed

### Mitigation Strategies

- **Staged rollout** (tool by tool)
- **Comprehensive testing** at each phase
- **Rollback procedures** for each migration step
- **Monitoring and alerting** for early issue detection

---

## 📅 Estimated Timeline

- **Phase 1-2**: 2-3 weeks (API Gateway + Core Connectors)
- **Phase 3-4**: 2 weeks (Routes + Query Builder)
- **Phase 5**: 4-6 weeks (Tool Migration)
- **Phase 6-7**: 1-2 weeks (Deployment + Testing)
- **Phase 8-10**: 2-3 weeks (Enterprise Connectors + Cleanup)

**Total Estimated Time**: 11-16 weeks

---

## 🎯 Next Immediate Actions

1. **START with Phase 1.1** - Create API Gateway infrastructure
2. **Focus on Transaction Patterns tool** as the first migration (most complex)
3. **Establish testing protocols** early
4. **Set up monitoring** from day one
5. **Document everything** as you go

---

**Remember**: This migration is CRITICAL for enterprise readiness. Every step must be thoroughly tested and validated before proceeding to the next phase.
