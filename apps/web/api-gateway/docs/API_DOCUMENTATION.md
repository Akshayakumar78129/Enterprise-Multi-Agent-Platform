# Enterprise Data Connector API Gateway - API Documentation

## Overview

The Enterprise Data Connector API Gateway provides a unified, secure, and scalable interface for accessing enterprise data across multiple databases and systems. This documentation covers all available endpoints, authentication methods, and usage examples.

## Base URL

```
Production: https://api.yourcompany.com
Development: http://localhost:3001
```

## Authentication

The API Gateway supports multiple authentication methods:

### API Key Authentication
```http
X-API-Key: your-api-key-here
```

### JWT Bearer Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Response Format

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
    "requestId": "123e4567-e89b-12d3-a456-426614174000",
    "source": "api-gateway",
    "cache": false,
    "executionTime": 152,
    "version": "1.0.0"
  },
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 50,
    "totalItems": 1000,
    "totalPages": 20,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  },
  "errors": null
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Invalid request parameters",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "limit",
      "reason": "Must be a positive integer"
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Data API Endpoints

### Customer Data

#### Get Transaction Patterns

Retrieve customer transaction patterns with optional filtering and aggregation.

**Endpoint:** `POST /api/v1/customer/transaction-patterns`

**Request Body:**
```json
{
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "customerId": "CUST001",
  "minAmount": 100,
  "maxAmount": 1000,
  "productCategory": "Electronics",
  "limit": 50,
  "offset": 0,
  "orderBy": ["Txn Date DESC", "Total Amount DESC"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "Sales Txn Key": 12345,
        "Customer Key": "CUST001",
        "Item Number": "ITEM001",
        "Txn Date": "2024-01-15",
        "Posting Time": "10:30:00",
        "Total Amount": 299.99,
        "Sales Quantity": 2,
        "Txn Number": "TXN001"
      }
    ],
    "rowCount": 1,
    "executionTime": 145,
    "connector": "customer-db",
    "fromCache": false
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123456",
    "source": "api-gateway"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/v1/customer/transaction-patterns \
  -H "Content-Type: application/json" \
  -H "X-API-Key: frontend-api-key" \
  -d '{
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "limit": 10
  }'
```

#### Get Customer Segmentation

Retrieve customer segmentation data for analytics and targeting.

**Endpoint:** `GET /api/v1/customer/segmentation`

**Query Parameters:**
- `segmentType` (string): Type of segmentation (value, behavior, demographic)
- `includeMetrics` (boolean): Include detailed metrics
- `limit` (integer): Number of records to return
- `page` (integer): Page number for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "customerId": "CUST001",
        "customerName": "John Doe",
        "customerType": "Premium",
        "status": "Active",
        "registrationDate": "2023-01-15",
        "segment": "High Value",
        "lifetimeValue": 15000,
        "avgOrderValue": 250,
        "transactionCount": 60
      }
    ],
    "segmentType": "value",
    "summary": {
      "totalCustomers": 1,
      "currentPage": 1
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123457"
  }
}
```

#### Get Churn Prediction

Retrieve customer churn prediction analysis.

**Endpoint:** `GET /api/v1/customer/churn-prediction`

**Query Parameters:**
- `riskThreshold` (float): Minimum churn risk score (0.0-1.0)
- `limit` (integer): Number of records to return
- `includeFactors` (boolean): Include churn risk factors

**Response:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "customerId": "CUST001",
        "customerName": "John Doe",
        "churnProbability": 0.75,
        "riskLevel": "High",
        "lastActivity": "2024-01-01",
        "daysSinceLastActivity": 30,
        "riskFactors": [
          "Decreased transaction frequency",
          "Lower average order value",
          "No recent engagement"
        ]
      }
    ],
    "summary": {
      "totalAnalyzed": 1000,
      "highRisk": 150,
      "mediumRisk": 300,
      "lowRisk": 550
    }
  }
}
```

### Sales Data

#### Get Product Performance

Retrieve sales performance data by product.

**Endpoint:** `GET /api/v1/sales/product-performance`

**Query Parameters:**
- `dateRange` (object): Date range filter
- `productId` (string): Specific product ID
- `category` (string): Product category filter
- `limit` (integer): Number of records

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "PROD001",
        "productName": "Premium Widget",
        "category": "Electronics",
        "totalSales": 25000,
        "unitsSold": 100,
        "avgPrice": 250,
        "margin": 0.35,
        "growth": 0.15
      }
    ],
    "summary": {
      "totalRevenue": 25000,
      "totalUnits": 100,
      "avgMargin": 0.35
    }
  }
}
```

#### Get Sales Trends

Retrieve sales trend analysis over time.

**Endpoint:** `GET /api/v1/sales/sales-trends`

**Query Parameters:**
- `period` (string): Aggregation period (daily, weekly, monthly, yearly)
- `dateRange` (object): Date range for analysis
- `metrics` (array): Metrics to include (revenue, units, orders)

### Inventory Data

#### Get Inventory Levels

Retrieve current inventory levels and stock information.

**Endpoint:** `GET /api/v1/inventory/levels`

**Query Parameters:**
- `warehouseId` (string): Specific warehouse filter
- `productId` (string): Specific product filter
- `lowStock` (boolean): Only show low stock items
- `limit` (integer): Number of records

**Response:**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "productId": "PROD001",
        "productName": "Premium Widget",
        "warehouseId": "WH001",
        "currentStock": 150,
        "reorderLevel": 50,
        "maxStock": 500,
        "stockStatus": "Adequate",
        "daysOfStock": 30,
        "lastRestocked": "2024-01-01"
      }
    ],
    "summary": {
      "totalProducts": 1000,
      "lowStockAlerts": 25,
      "outOfStock": 5
    }
  }
}
```

#### Get Inventory Movements

Track inventory movements and changes over time.

**Endpoint:** `GET /api/v1/inventory/movements`

**Query Parameters:**
- `days` (integer): Number of days to look back
- `movementType` (string): Type of movement (in, out, transfer, adjustment)
- `productId` (string): Specific product filter

### Finance Data

#### Get Financial Reports

Retrieve financial reporting data and metrics.

**Endpoint:** `GET /api/v1/finance/reports`

**Query Parameters:**
- `reportType` (string): Type of report (summary, detailed, p&l, balance)
- `period` (string): Reporting period
- `format` (string): Response format (json, csv)

**Response:**
```json
{
  "success": true,
  "data": {
    "report": {
      "reportType": "summary",
      "period": "2024-Q1",
      "revenue": 1000000,
      "expenses": 750000,
      "profit": 250000,
      "margin": 0.25,
      "accounts": [
        {
          "accountId": "ACC001",
          "accountName": "Revenue",
          "balance": 1000000,
          "type": "Revenue"
        }
      ]
    },
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "currency": "USD"
    }
  }
}
```

## Monitoring & Health Endpoints

### Health Checks

#### Basic Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": "45MB",
    "heapTotal": "25MB",
    "heapUsed": "18MB"
  },
  "version": "1.0.0",
  "environment": "production"
}
```

#### Detailed Health Check

**Endpoint:** `GET /health/detailed`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "system": {
    "memory": {
      "total": "8GB",
      "free": "2GB",
      "used": "6GB"
    },
    "cpu": {
      "usage": 45.2,
      "loadAverage": [1.5, 1.2, 1.0]
    },
    "platform": "linux"
  },
  "components": {
    "connectors": {
      "status": "healthy",
      "total": 5,
      "healthy": 5,
      "unhealthy": 0
    },
    "cache": {
      "status": "healthy",
      "hitRatio": 85.5
    },
    "logging": {
      "status": "healthy",
      "level": "info"
    }
  }
}
```

#### Connector Health

**Endpoint:** `GET /health/connectors`

**Response:**
```json
{
  "status": "healthy",
  "summary": {
    "total": 5,
    "healthy": 5,
    "unhealthy": 0,
    "healthPercent": 100
  },
  "connectors": {
    "customer-db": {
      "status": "healthy",
      "lastHealthCheck": "2024-01-01T00:00:00.000Z",
      "connected": true,
      "type": "sqlite",
      "latency": 15
    },
    "sales-db": {
      "status": "healthy",
      "lastHealthCheck": "2024-01-01T00:00:00.000Z",
      "connected": true,
      "type": "sqlite",
      "latency": 12
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Performance Metrics

#### System Metrics

**Endpoint:** `GET /metrics`

**Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 47185920,
    "heapTotal": 26214400,
    "heapUsed": 18845696,
    "heapUsedPercent": 71.9
  },
  "cpu": {
    "user": 156250,
    "system": 46875
  },
  "system": {
    "loadAverage": [1.5, 1.2, 1.0],
    "freeMemory": 2147483648,
    "totalMemory": 8589934592
  },
  "requests": {
    "total": 1000,
    "successful": 950,
    "failed": 50,
    "byStatusCode": {
      "200": 900,
      "400": 30,
      "404": 10,
      "500": 10
    }
  },
  "performance": {
    "responseTime": {
      "avg": 145,
      "min": 10,
      "max": 2000,
      "p50": 120,
      "p90": 300,
      "p95": 500,
      "p99": 1200
    }
  }
}
```

#### Metrics Summary

**Endpoint:** `GET /metrics/summary`

**Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "60m",
  "requests": {
    "total": 1000,
    "successful": 950,
    "failed": 50,
    "errorRate": "5.0%"
  },
  "performance": {
    "avgResponseTime": "145ms",
    "p95ResponseTime": "500ms",
    "slowQueries": 5,
    "cacheHitRatio": "85%"
  },
  "system": {
    "memoryUsage": "72%",
    "heapUsed": "18MB",
    "uptime": "60m"
  },
  "connectors": {
    "total": 5,
    "healthy": 5,
    "unhealthy": 0
  }
}
```

### Alerting & Monitoring

#### Active Alerts

**Endpoint:** `GET /alerts`

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-123",
      "rule": "high_error_rate",
      "severity": "high",
      "message": "High error rate detected: 10.5%",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "active",
      "acknowledgedBy": null
    }
  ],
  "count": 1
}
```

#### Alert History

**Endpoint:** `GET /alerts/history?limit=50`

#### Request Traces

**Endpoint:** `GET /traces?limit=100&operation=GET%20/api/v1/customer`

**Response:**
```json
{
  "traces": [
    {
      "traceId": "trace-123",
      "operationName": "GET /api/v1/customer/segmentation",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "duration": 145,
      "spanCount": 3,
      "status": "finished"
    }
  ],
  "count": 1
}
```

#### Specific Trace Details

**Endpoint:** `GET /traces/{traceId}`

**Response:**
```json
{
  "traceId": "trace-123",
  "operationName": "GET /api/v1/customer/segmentation",
  "startTime": "2024-01-01T00:00:00.000Z",
  "duration": 145,
  "status": "finished",
  "spans": {
    "span-1": {
      "spanId": "span-1",
      "parentId": null,
      "operationName": "GET /api/v1/customer/segmentation",
      "startTime": "2024-01-01T00:00:00.000Z",
      "duration": 145,
      "tags": {
        "http.method": "GET",
        "http.status_code": 200
      },
      "logs": []
    }
  }
}
```

## Error Codes

| Code | Description | HTTP Status | Resolution |
|------|-------------|-------------|------------|
| `AUTHENTICATION_REQUIRED` | No authentication provided | 401 | Provide API key or JWT token |
| `INVALID_TOKEN` | Invalid or expired token | 401 | Refresh or obtain new token |
| `INVALID_API_KEY` | Invalid API key | 401 | Check API key value |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 | Wait before retrying |
| `VALIDATION_ERROR` | Invalid request parameters | 400 | Check request format |
| `NOT_FOUND` | Endpoint not found | 404 | Check endpoint URL |
| `METHOD_NOT_ALLOWED` | HTTP method not allowed | 405 | Use correct HTTP method |
| `INTERNAL_ERROR` | Server error | 500 | Check server logs |
| `DATABASE_ERROR` | Database connection issue | 503 | Check database connectivity |
| `CIRCUIT_BREAKER_OPEN` | Circuit breaker protection | 503 | Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting to ensure fair usage and system stability:

- **Default Limit**: 1000 requests per 15-minute window
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Caching

The API Gateway implements intelligent caching:

- **Cache Headers**: Responses include cache-related headers
- **Cache Control**: Use `Cache-Control: no-cache` to bypass cache
- **TTL**: Default cache TTL is 5 minutes for data endpoints

## Data Formats

### Date Formats
All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Numeric Formats
- Monetary values: Decimal numbers (e.g., 299.99)
- Percentages: Decimal between 0 and 1 (e.g., 0.15 for 15%)
- Counts: Integers

### Pagination
```json
{
  "currentPage": 1,
  "itemsPerPage": 50,
  "totalItems": 1000,
  "totalPages": 20,
  "hasNextPage": true,
  "hasPreviousPage": false,
  "nextPage": 2,
  "previousPage": null
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const ApiClient = require('./api-client');

const client = new ApiClient({
  baseURL: 'http://localhost:3001',
  apiKey: 'your-api-key'
});

// Get transaction patterns
const transactions = await client.getTransactionPatterns({
  dateRange: {
    start: '2024-01-01',
    end: '2024-01-31'
  },
  limit: 50
});

// Get customer segmentation
const segments = await client.getCustomerSegmentation({
  segmentType: 'value',
  limit: 100
});
```

### Python

```python
import requests

class ApiGatewayClient:
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
client = ApiGatewayClient('http://localhost:3001', 'your-api-key')
data = client.get_transaction_patterns({
    'dateRange': {
        'start': '2024-01-01',
        'end': '2024-01-31'
    },
    'limit': 50
})
```

## Best Practices

### Request Optimization
1. **Use appropriate page sizes**: Don't request more data than needed
2. **Implement caching**: Cache responses on the client side when appropriate
3. **Use filters**: Apply server-side filtering to reduce data transfer
4. **Batch requests**: Combine multiple related requests when possible

### Error Handling
1. **Check response status**: Always check the `success` field
2. **Handle rate limits**: Implement exponential backoff for 429 responses
3. **Log request IDs**: Use the `requestId` for debugging
4. **Implement retries**: Retry failed requests with appropriate delays

### Security
1. **Protect API keys**: Never expose API keys in client-side code
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate responses**: Validate all API responses before using data
4. **Monitor usage**: Track API usage and monitor for anomalies

## Support

For technical support and questions:
- **Documentation**: Check this documentation first
- **Troubleshooting**: See the troubleshooting guide
- **Issues**: Report issues through the appropriate channels
- **Updates**: Monitor for API updates and deprecations