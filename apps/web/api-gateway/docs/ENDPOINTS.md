# API Gateway Endpoints Reference

## Data Endpoints

### Customer Domain (`/api/v1/customer/`)

#### Transaction Patterns
Retrieve and analyze customer transaction patterns with advanced filtering capabilities.

**Endpoint:** `POST /api/v1/customer/transaction-patterns`

**Authentication:** Required (API Key or JWT)

**Request Headers:**
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body Schema:**
```json
{
  "dateRange": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "customerId": "string",
  "minAmount": "number",
  "maxAmount": "number",
  "productCategory": "string",
  "itemNumber": "string",
  "transactionType": "string",
  "limit": "number (1-1000)",
  "offset": "number",
  "orderBy": ["string"]
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3001/api/v1/customer/transaction-patterns" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: frontend-api-key" \
  -d '{
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "customerId": "CUST001",
    "minAmount": 100,
    "limit": 10,
    "orderBy": ["Txn Date DESC"]
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "Sales Txn Key": 12345,
        "Customer Key": "CUST001",
        "Item Number": "ITEM001",
        "Txn Date": "2024-01-15T00:00:00.000Z",
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
    "source": "api-gateway",
    "cache": false,
    "executionTime": 147,
    "version": "1.0.0"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid date range",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "dateRange.start",
      "reason": "Start date must be before end date"
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123456"
  }
}
```

---

#### Customer Segmentation
Retrieve customer segmentation data for marketing and analytics purposes.

**Endpoint:** `GET /api/v1/customer/segmentation`

**Query Parameters:**
```
segmentType: string (value|behavior|demographic) - Default: value
includeMetrics: boolean - Default: true
limit: number (1-500) - Default: 50
page: number - Default: 1
segment: string - Filter by specific segment
sortBy: string (lifetimeValue|transactionCount|lastActivity) - Default: lifetimeValue
sortOrder: string (asc|desc) - Default: desc
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/customer/segmentation?segmentType=value&limit=5&includeMetrics=true" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
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
        "registrationDate": "2023-01-15T00:00:00.000Z",
        "segment": "High Value",
        "segmentId": 1,
        "lifetimeValue": 15000.50,
        "avgOrderValue": 250.75,
        "transactionCount": 60,
        "lastActivity": "2024-01-01T00:00:00.000Z",
        "churnRisk": 0.15,
        "loyaltyScore": 8.5
      }
    ],
    "segmentType": "value",
    "summary": {
      "totalCustomers": 1,
      "currentPage": 1,
      "segmentDistribution": {
        "High Value": 25,
        "Medium Value": 45,
        "Low Value": 30
      }
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123457",
    "source": "api-gateway",
    "cache": true,
    "executionTime": 89
  },
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 5,
    "totalItems": 1000,
    "totalPages": 200,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

---

#### Churn Prediction
Analyze customer churn risk and predict which customers are likely to leave.

**Endpoint:** `GET /api/v1/customer/churn-prediction`

**Query Parameters:**
```
riskThreshold: number (0.0-1.0) - Minimum churn risk score
riskLevel: string (low|medium|high) - Filter by risk level
limit: number (1-500) - Default: 50
includeFactors: boolean - Include detailed risk factors
sortBy: string (churnProbability|lastActivity|customerValue) - Default: churnProbability
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/customer/churn-prediction?riskThreshold=0.7&includeFactors=true&limit=10" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "customerId": "CUST001",
        "customerName": "John Doe",
        "churnProbability": 0.85,
        "riskLevel": "High",
        "confidenceScore": 0.92,
        "lastActivity": "2023-12-01T00:00:00.000Z",
        "daysSinceLastActivity": 45,
        "lifetimeValue": 5000,
        "avgOrderValue": 150,
        "transactionFrequency": 0.5,
        "riskFactors": [
          "Decreased transaction frequency (60% drop)",
          "Lower average order value (25% decrease)",
          "No recent engagement with promotions",
          "Reduced customer service interactions"
        ],
        "recommendations": [
          "Send personalized retention offer",
          "Schedule customer success call",
          "Provide loyalty rewards"
        ]
      }
    ],
    "summary": {
      "totalAnalyzed": 1000,
      "highRisk": 150,
      "mediumRisk": 300,
      "lowRisk": 550,
      "avgChurnRate": 0.35,
      "modelAccuracy": 0.89
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req-123458",
    "modelVersion": "v2.1",
    "lastTrained": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Sales Domain (`/api/v1/sales/`)

#### Product Performance
Analyze sales performance by product with detailed metrics.

**Endpoint:** `GET /api/v1/sales/product-performance`

**Query Parameters:**
```
dateRange[start]: string (YYYY-MM-DD)
dateRange[end]: string (YYYY-MM-DD)
productId: string - Specific product filter
category: string - Product category filter
subcategory: string - Product subcategory filter
region: string - Sales region filter
limit: number (1-500)
sortBy: string (revenue|units|margin|growth)
sortOrder: string (asc|desc)
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/sales/product-performance?dateRange[start]=2024-01-01&dateRange[end]=2024-01-31&category=Electronics&limit=5" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productId": "PROD001",
        "productName": "Premium Smartphone",
        "category": "Electronics",
        "subcategory": "Mobile Devices",
        "sku": "PHONE-001",
        "totalRevenue": 125000.00,
        "unitsSold": 250,
        "avgSellingPrice": 500.00,
        "grossMargin": 0.35,
        "netMargin": 0.28,
        "growth": {
          "revenue": 0.15,
          "units": 0.12,
          "margin": 0.03
        },
        "performance": {
          "rank": 1,
          "percentile": 95,
          "trend": "increasing"
        },
        "inventory": {
          "currentStock": 150,
          "turnoverRate": 8.5,
          "daysOfStock": 42
        }
      }
    ],
    "summary": {
      "totalRevenue": 125000.00,
      "totalUnits": 250,
      "avgMargin": 0.35,
      "topPerformer": "PROD001",
      "categoryGrowth": 0.18
    },
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31",
      "days": 31
    }
  }
}
```

---

#### Sales Trends
Analyze sales trends over time with various aggregation options.

**Endpoint:** `GET /api/v1/sales/sales-trends`

**Query Parameters:**
```
period: string (daily|weekly|monthly|quarterly|yearly) - Required
dateRange[start]: string (YYYY-MM-DD)
dateRange[end]: string (YYYY-MM-DD)
metrics: array (revenue|units|orders|customers) - Default: all
region: string - Filter by region
category: string - Filter by category
breakdown: string (product|category|region|channel)
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/sales/sales-trends?period=monthly&dateRange[start]=2023-01-01&dateRange[end]=2023-12-31&metrics[]=revenue&metrics[]=units" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2023-01",
        "periodStart": "2023-01-01T00:00:00.000Z",
        "periodEnd": "2023-01-31T23:59:59.999Z",
        "revenue": 850000.00,
        "units": 1250,
        "orders": 420,
        "customers": 380,
        "avgOrderValue": 2023.81,
        "growth": {
          "revenue": 0.08,
          "units": 0.05,
          "orders": 0.12
        }
      }
    ],
    "summary": {
      "totalRevenue": 10200000.00,
      "totalUnits": 15000,
      "totalOrders": 5040,
      "avgMonthlyGrowth": 0.09,
      "seasonality": "Q4 peak",
      "forecast": {
        "nextPeriod": 920000.00,
        "confidence": 0.85
      }
    },
    "analytics": {
      "trendDirection": "increasing",
      "volatility": "low",
      "correlation": {
        "revenueToUnits": 0.95,
        "seasonalIndex": 1.15
      }
    }
  }
}
```

---

### Inventory Domain (`/api/v1/inventory/`)

#### Inventory Levels
Monitor current inventory levels and stock status across warehouses.

**Endpoint:** `GET /api/v1/inventory/levels`

**Query Parameters:**
```
warehouseId: string - Filter by warehouse
productId: string - Filter by product
category: string - Filter by product category
stockStatus: string (adequate|low|critical|out) - Filter by stock status
lowStock: boolean - Show only low stock items
limit: number (1-1000)
sortBy: string (stock|turnover|value|reorderLevel)
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/inventory/levels?lowStock=true&limit=10" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "productId": "PROD001",
        "productName": "Premium Widget",
        "sku": "WIDGET-001",
        "category": "Electronics",
        "warehouseId": "WH001",
        "warehouseName": "Main Warehouse",
        "currentStock": 25,
        "reorderLevel": 50,
        "maxStock": 500,
        "safetyStock": 20,
        "stockValue": 12500.00,
        "unitCost": 500.00,
        "stockStatus": "Critical",
        "daysOfStock": 8,
        "turnoverRate": 12.5,
        "lastRestocked": "2023-12-15T00:00:00.000Z",
        "nextReorderDate": "2024-01-05T00:00:00.000Z",
        "supplier": {
          "id": "SUP001",
          "name": "Tech Supplies Inc",
          "leadTime": 7
        },
        "alerts": [
          "Stock below reorder level",
          "High demand product"
        ]
      }
    ],
    "summary": {
      "totalProducts": 1000,
      "totalValue": 5000000.00,
      "lowStockAlerts": 25,
      "criticalStock": 8,
      "outOfStock": 3,
      "avgTurnover": 8.2,
      "topCategories": ["Electronics", "Apparel", "Home"]
    },
    "warehouses": {
      "WH001": {
        "name": "Main Warehouse",
        "totalProducts": 750,
        "totalValue": 3750000.00,
        "utilization": 0.85
      }
    }
  }
}
```

---

#### Inventory Movements
Track inventory movements and changes over time for audit and analysis.

**Endpoint:** `GET /api/v1/inventory/movements`

**Query Parameters:**
```
days: number (1-365) - Number of days to look back
movementType: string (in|out|transfer|adjustment) - Movement type filter
productId: string - Filter by product
warehouseId: string - Filter by warehouse
reasonCode: string - Filter by reason code
limit: number (1-1000)
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/inventory/movements?days=7&movementType=out&limit=20" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "movementId": "MOV001",
        "productId": "PROD001",
        "productName": "Premium Widget",
        "warehouseId": "WH001",
        "movementType": "out",
        "quantity": 10,
        "unitCost": 500.00,
        "totalValue": 5000.00,
        "reasonCode": "SALE",
        "reason": "Customer Order",
        "referenceNumber": "ORD12345",
        "timestamp": "2024-01-01T10:30:00.000Z",
        "performedBy": "system",
        "stockBefore": 35,
        "stockAfter": 25,
        "notes": "Auto fulfillment for order #12345"
      }
    ],
    "summary": {
      "totalMovements": 150,
      "inboundQuantity": 500,
      "outboundQuantity": 400,
      "netChange": 100,
      "totalValue": 125000.00,
      "byType": {
        "in": 45,
        "out": 85,
        "transfer": 15,
        "adjustment": 5
      },
      "topProducts": ["PROD001", "PROD002", "PROD003"]
    },
    "period": {
      "start": "2023-12-25T00:00:00.000Z",
      "end": "2024-01-01T23:59:59.999Z",
      "days": 7
    }
  }
}
```

---

### Finance Domain (`/api/v1/finance/`)

#### Financial Reports
Generate comprehensive financial reports with various formats and filters.

**Endpoint:** `GET /api/v1/finance/reports`

**Query Parameters:**
```
reportType: string (summary|detailed|pnl|balance|cashflow) - Required
period: string (monthly|quarterly|yearly) - Default: monthly
dateRange[start]: string (YYYY-MM-DD)
dateRange[end]: string (YYYY-MM-DD)
format: string (json|csv|pdf) - Default: json
accountType: string (revenue|expense|asset|liability) - Filter by account type
currency: string (USD|EUR|GBP) - Default: USD
includeComparison: boolean - Include period comparison
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/v1/finance/reports?reportType=summary&period=monthly&dateRange[start]=2024-01-01&dateRange[end]=2024-01-31" \
  -H "X-API-Key: frontend-api-key"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "reportType": "summary",
      "period": "2024-01",
      "periodStart": "2024-01-01T00:00:00.000Z",
      "periodEnd": "2024-01-31T23:59:59.999Z",
      "currency": "USD",
      "financials": {
        "revenue": {
          "total": 1000000.00,
          "growth": 0.15,
          "breakdown": {
            "product_sales": 850000.00,
            "services": 150000.00
          }
        },
        "expenses": {
          "total": 750000.00,
          "growth": 0.08,
          "breakdown": {
            "cost_of_goods": 500000.00,
            "operating": 200000.00,
            "marketing": 50000.00
          }
        },
        "profit": {
          "gross": 500000.00,
          "net": 250000.00,
          "margin": {
            "gross": 0.50,
            "net": 0.25
          }
        },
        "cashFlow": {
          "operating": 300000.00,
          "investing": -50000.00,
          "financing": -25000.00,
          "net": 225000.00
        }
      },
      "accounts": [
        {
          "accountId": "ACC001",
          "accountName": "Product Revenue",
          "accountType": "Revenue",
          "balance": 850000.00,
          "change": 127500.00,
          "changePercent": 0.15
        }
      ],
      "kpis": {
        "revenueGrowth": 0.15,
        "profitMargin": 0.25,
        "operatingMargin": 0.30,
        "returnOnRevenue": 0.25,
        "burnRate": -75000.00
      },
      "comparison": {
        "previousPeriod": {
          "revenue": 870000.00,
          "profit": 217500.00,
          "margin": 0.25
        },
        "yearOverYear": {
          "revenue": 0.18,
          "profit": 0.22,
          "margin": 0.01
        }
      }
    },
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "generatedBy": "api-gateway",
      "reportVersion": "1.0",
      "dataQuality": {
        "completeness": 98.5,
        "accuracy": 99.2,
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

---

## Monitoring Endpoints

### Health Endpoints

#### Basic Health Check
Quick health status check for load balancers and monitoring systems.

**Endpoint:** `GET /health`

**Authentication:** None required

**Example Request:**
```bash
curl -X GET "http://localhost:3001/health"
```

**Response (200):**
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

**Unhealthy Response (503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "issues": [
    "Database connection failed",
    "High memory usage"
  ],
  "version": "1.0.0"
}
```

---

#### Detailed System Health
Comprehensive health check with component-level status.

**Endpoint:** `GET /health/detailed`

**Authentication:** API Key recommended

**Example Request:**
```bash
curl -X GET "http://localhost:3001/health/detailed" \
  -H "X-API-Key: frontend-api-key"
```

**Response (200):**
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
      "used": "6GB",
      "percentage": 75.0
    },
    "cpu": {
      "usage": 45.2,
      "loadAverage": [1.5, 1.2, 1.0]
    },
    "disk": {
      "total": "100GB",
      "free": "25GB",
      "usage": 75.0
    },
    "platform": "linux",
    "nodeVersion": "18.17.0"
  },
  "components": {
    "connectors": {
      "status": "healthy",
      "total": 5,
      "healthy": 5,
      "unhealthy": 0,
      "details": "All database connectors operational"
    },
    "cache": {
      "status": "healthy",
      "hitRatio": 85.5,
      "size": "128MB",
      "maxSize": "512MB"
    },
    "logging": {
      "status": "healthy",
      "level": "info",
      "logSize": "45MB"
    },
    "monitoring": {
      "status": "healthy",
      "activeTraces": 12,
      "activeAlerts": 0
    }
  },
  "configuration": {
    "port": 3001,
    "authEnabled": true,
    "rateLimitEnabled": true,
    "tracingEnabled": true,
    "cacheEnabled": true
  }
}
```

---

### Performance Metrics

#### System Metrics
Detailed performance and system metrics.

**Endpoint:** `GET /metrics`

**Authentication:** API Key required

**Example Request:**
```bash
curl -X GET "http://localhost:3001/metrics" \
  -H "X-API-Key: frontend-api-key"
```

**Response (200):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 47185920,
    "heapTotal": 26214400,
    "heapUsed": 18845696,
    "heapUsedPercent": 71.9,
    "external": 1234567
  },
  "cpu": {
    "user": 156250,
    "system": 46875,
    "percent": 15.2
  },
  "system": {
    "loadAverage": [1.5, 1.2, 1.0],
    "freeMemory": 2147483648,
    "totalMemory": 8589934592,
    "cpus": 4
  },
  "requests": {
    "total": 10000,
    "successful": 9500,
    "failed": 500,
    "errorRate": 5.0,
    "byStatusCode": {
      "200": 9000,
      "201": 300,
      "400": 200,
      "401": 150,
      "404": 100,
      "500": 50
    },
    "byEndpoint": {
      "/api/v1/customer/transaction-patterns": 3000,
      "/api/v1/customer/segmentation": 2500,
      "/health": 2000
    },
    "byMethod": {
      "GET": 7000,
      "POST": 2500,
      "PUT": 300,
      "DELETE": 200
    }
  },
  "performance": {
    "responseTime": {
      "count": 10000,
      "total": 1450000,
      "avg": 145,
      "min": 10,
      "max": 5000,
      "percentiles": {
        "p50": 120,
        "p90": 300,
        "p95": 500,
        "p99": 1200
      }
    },
    "databaseQueries": {
      "count": 8500,
      "totalTime": 850000,
      "avgTime": 100,
      "slowQueries": 25,
      "byConnector": {
        "customer-db": {
          "count": 4000,
          "avgTime": 95,
          "slowQueries": 10
        },
        "sales-db": {
          "count": 3000,
          "avgTime": 110,
          "slowQueries": 8
        }
      }
    }
  },
  "business": {
    "dataVolume": {
      "totalRecords": 500000,
      "byDataSource": {
        "customer-db": 200000,
        "sales-db": 180000,
        "inventory-db": 120000
      }
    },
    "cacheHitRatio": 85.5,
    "errorRate": 5.0
  },
  "security": {
    "authenticationAttempts": 1500,
    "authenticationFailures": 45,
    "rateLimitHits": 23,
    "blockedRequests": 12
  }
}
```

---

## Rate Limiting Headers

All API responses include rate limiting information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 900
Retry-After: 300
```

## Common HTTP Status Codes

| Status | Meaning | Description |
|--------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Endpoint or resource not found |
| 405 | Method Not Allowed | HTTP method not supported |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Request/Response Headers

### Common Request Headers
```http
Content-Type: application/json
X-API-Key: your-api-key
Authorization: Bearer jwt-token
X-Request-ID: unique-request-id
X-Correlation-ID: correlation-id
Cache-Control: no-cache
```

### Common Response Headers
```http
Content-Type: application/json
X-Request-ID: unique-request-id
X-Correlation-ID: correlation-id
X-Trace-ID: trace-id
Cache-Control: public, max-age=300
ETag: "abc123"
Last-Modified: Wed, 01 Jan 2024 00:00:00 GMT
```