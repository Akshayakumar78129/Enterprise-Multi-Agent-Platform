# Azure Enterprise Deployment Guide - Multi-Agent Agency

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Azure Services Required](#azure-services-required)
3. [Security Best Practices](#security-best-practices)
4. [Infrastructure Setup](#infrastructure-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Observability](#monitoring--observability)
7. [Cost Optimization](#cost-optimization)
8. [Disaster Recovery](#disaster-recovery)

---

## Architecture Overview

### Application Components (Excluding `web` folder)
```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Front Door / CDN                    │
│                  (Global Load Balancer + WAF)                │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐            ┌────────▼────────┐
│  Frontend App   │            │  API Gateway    │
│  (App Service)  │            │  (APIM)         │
│  Next.js        │            └────────┬────────┘
└─────────────────┘                     │
                              ┌─────────┴─────────┐
                              │                   │
                    ┌─────────▼──────┐  ┌────────▼────────┐
                    │ Middleware API │  │   ADK AI API    │
                    │ (App Service)  │  │ (Container App) │
                    │ apps/server    │  │  apps/adk       │
                    └────────┬───────┘  └────────┬────────┘
                             │                   │
                    ┌────────┴───────────────────┴────┐
                    │                                  │
           ┌────────▼──────┐              ┌──────────▼────────┐
           │ PostgreSQL DB │              │  Azure Redis      │
           │ (Flexible)    │              │  (Premium)        │
           └───────────────┘              └───────────────────┘
```

---

## Azure Services Required

### 1. **Compute Services**

#### A. **Azure Container Apps** (Recommended for ADK API)
- **Why**: Serverless container hosting, auto-scaling, built-in ingress
- **Service**: `apps/adk` (AI Agent API with ML models)
- **Pricing Tier**: Consumption or Dedicated (for production)

#### B. **Azure App Service** (For Frontend & Middleware)
- **Frontend**: `apps/frontend` (Next.js)
  - Plan: Premium V3 (P1V3 minimum for production)
  - Features: Auto-scaling, deployment slots, SSL
- **Middleware**: `apps/server` (FastAPI proxy)
  - Plan: Premium V3 (P1V3)

**Alternative**: Use Azure Kubernetes Service (AKS) for all services if you need more control

### 2. **Database & Caching**

#### A. **Azure Database for PostgreSQL - Flexible Server**
- **Tier**: General Purpose or Memory Optimized
- **Features Required**:
  - Private Endpoint (VNET integration)
  - Automated backups (7-35 days retention)
  - Point-in-time restore
  - TLS 1.2+ enforcement
  - Azure AD authentication
  - Geo-redundancy (for HA)

#### B. **Azure Cache for Redis - Premium**
- **Tier**: Premium (for VNET support & data persistence)
- **Features**:
  - VNET injection
  - TLS encryption
  - Data persistence (AOF/RDB)
  - Zone redundancy

### 3. **Storage**

#### **Azure Blob Storage** (For ML models, logs, artifacts)
- **Account Type**: StorageV2 (General Purpose v2)
- **Redundancy**: ZRS (Zone-redundant) or GRS (Geo-redundant)
- **Features**:
  - Private Endpoints
  - Soft delete enabled
  - Versioning enabled
  - Lifecycle management
  - Encryption at rest (Microsoft-managed or Customer-managed keys)

### 4. **Networking & Security**

#### A. **Azure Virtual Network (VNet)**
```
VNet: 10.0.0.0/16
├── Subnet: Frontend (10.0.1.0/24)
├── Subnet: Backend (10.0.2.0/24)
├── Subnet: Database (10.0.3.0/24)
├── Subnet: Redis (10.0.4.0/24)
└── Subnet: Private Endpoints (10.0.5.0/24)
```

#### B. **Azure Private Link / Private Endpoints**
- PostgreSQL database
- Redis cache
- Blob Storage
- Key Vault

#### C. **Azure Application Gateway** (Optional but recommended)
- Web Application Firewall (WAF) v2
- SSL termination
- URL-based routing

#### D. **Azure Front Door** (Global CDN + WAF)
- DDoS protection
- Web Application Firewall
- SSL/TLS termination
- Global load balancing

### 5. **API Management**

#### **Azure API Management (APIM)**
- **Tier**: Developer (dev/test) or Premium (production)
- **Features**:
  - Rate limiting & throttling
  - API versioning
  - OAuth 2.0 / JWT validation
  - Request/response transformation
  - Backend service mocking
  - Developer portal

### 6. **Security Services**

#### A. **Azure Key Vault** (Critical)
Store all secrets:
- Database connection strings
- Redis connection strings
- API keys (Google Gemini, Deepgram, etc.)
- SSL certificates
- Service Principal credentials

#### B. **Azure Active Directory (Entra ID)**
- Managed Identities for Azure resources
- App registrations for OAuth
- Conditional Access policies
- Multi-Factor Authentication (MFA)

#### C. **Azure DDoS Protection Standard**
- Network-level DDoS protection
- Real-time attack metrics

#### D. **Microsoft Defender for Cloud**
- Security posture management
- Vulnerability assessment
- Just-in-time VM access

### 7. **Monitoring & Logging**

#### A. **Azure Monitor**
- Application Insights (APM)
- Log Analytics Workspace
- Metrics & alerts

#### B. **Azure Log Analytics**
- Centralized logging
- KQL queries
- Custom dashboards

### 8. **DevOps & CI/CD**

#### **Azure DevOps** or **GitHub Actions**
- Build pipelines
- Release pipelines
- Infrastructure as Code (IaC)

---

## Security Best Practices

### 1. **Network Security**

#### ✅ Implement Zero Trust Architecture
```yaml
Network Isolation:
  - Use VNet integration for all services
  - Enable Private Endpoints for PaaS services
  - Disable public access to databases
  - Use Network Security Groups (NSGs)
  - Implement Application Security Groups (ASGs)
```

#### ✅ NSG Rules Example
```
Inbound Rules:
  - Allow HTTPS (443) from Azure Front Door only
  - Allow HTTPS (443) from APIM to backend services
  - Deny all other inbound traffic

Outbound Rules:
  - Allow HTTPS to Azure services (Service Tags)
  - Allow PostgreSQL port to DB subnet
  - Allow Redis port to cache subnet
  - Explicit deny all by default
```

### 2. **Identity & Access Management (IAM)**

#### ✅ Use Managed Identities
```python
# apps/adk/database/connection.py
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

# Use Managed Identity instead of connection strings in code
credential = DefaultAzureCredential()
key_vault_url = "https://<your-keyvault>.vault.azure.net/"
client = SecretClient(vault_url=key_vault_url, credential=credential)

# Retrieve secrets
db_connection_string = client.get_secret("postgresql-connection-string").value
redis_connection_string = client.get_secret("redis-connection-string").value
```

#### ✅ Role-Based Access Control (RBAC)
```yaml
Assignments:
  - App Service -> Key Vault Secrets User
  - Container Apps -> Key Vault Secrets User
  - DevOps Pipeline -> Contributor (scoped to resource group)
  - PostgreSQL -> Azure AD authentication only
  - Developers -> Reader (production), Contributor (dev/staging)
```

#### ✅ Principle of Least Privilege
- Grant minimum permissions required
- Use custom roles where built-in roles are too broad
- Regular access reviews (quarterly)

### 3. **Data Protection**

#### ✅ Encryption at Rest
- **Azure Disk Encryption** for VM disks
- **Transparent Data Encryption (TDE)** for PostgreSQL
- **Server-side encryption** for Blob Storage
- Consider **Customer-Managed Keys (CMK)** for sensitive data

#### ✅ Encryption in Transit
- **TLS 1.2+** for all connections
- Disable older protocols (SSL 3.0, TLS 1.0, TLS 1.1)
- Enforce HTTPS redirect

```python
# apps/adk/main.py - Add security headers
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com", "*.azurewebsites.net"])

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

#### ✅ Secrets Management
```bash
# NEVER commit secrets to git
# Use Key Vault references in App Service Configuration

# App Service Application Settings
@Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/<secret-name>/)
```

### 4. **Application Security**

#### ✅ Input Validation & Sanitization
```python
# Add input validation middleware
from pydantic import BaseModel, validator, Field

class SecureQueryRequest(BaseModel):
    user_query: str = Field(..., max_length=5000)
    session_id: str = Field(..., regex=r'^[a-zA-Z0-9\-_]{1,100}$')
    
    @validator('user_query')
    def sanitize_query(cls, v):
        # Prevent injection attacks
        if any(char in v for char in ['<script>', 'javascript:', 'onerror=']):
            raise ValueError('Invalid input detected')
        return v
```

#### ✅ Rate Limiting & Throttling
```python
# Use Azure APIM policies or FastAPI middleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/run_sse")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def run_agent(request: Request, req: SimpleQueryRequest):
    # ... existing code
```

#### ✅ CORS Configuration
```python
# Restrict CORS to specific domains (NO "*" in production!)
ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://app.yourdomain.com",
    "https://*.azurewebsites.net"  # Only for staging
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # NO "*" in production
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Restrict methods
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600
)
```

#### ✅ API Authentication & Authorization
```python
# Implement OAuth 2.0 / JWT authentication
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            key=JWT_SECRET,  # From Key Vault
            algorithms=["RS256"],
            audience="your-api-audience"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/run_sse")
async def run_agent(req: SimpleQueryRequest, user=Depends(verify_token)):
    # Only authenticated users can access
    pass
```

### 5. **Compliance & Governance**

#### ✅ Azure Policy
- Enforce tagging standards
- Require encryption for storage accounts
- Restrict allowed VM sizes
- Require diagnostic settings

#### ✅ Compliance Standards
- **ISO 27001** - Information security management
- **SOC 2 Type II** - Security, availability, confidentiality
- **GDPR** - Data protection (if serving EU users)
- **HIPAA** - Healthcare data (if applicable)

#### ✅ Data Residency
- Choose Azure region based on compliance requirements
- Enable geo-replication cautiously (check data sovereignty laws)

### 6. **Vulnerability Management**

#### ✅ Container Security
```dockerfile
# Use minimal base images
FROM python:3.11-slim-bullseye  # Not 'latest'

# Run as non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Scan images with Azure Defender for Container Registries
```

#### ✅ Dependency Scanning
```bash
# Add to CI/CD pipeline
pip install safety
safety check --json

# Or use Azure DevOps vulnerability scanning
```

#### ✅ Regular Patching
- Enable auto-patching for App Services
- Regular PostgreSQL minor version updates
- Keep Python dependencies up to date

---

## Infrastructure Setup

### Step 1: Create Resource Group
```bash
#!/bin/bash
# Set variables
RESOURCE_GROUP="rg-multiagent-prod"
LOCATION="eastus"  # Or your preferred region
ENVIRONMENT="production"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=$ENVIRONMENT Project=MultiAgent
```

### Step 2: Create Virtual Network
```bash
# Create VNet
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name vnet-multiagent \
  --address-prefix 10.0.0.0/16 \
  --location $LOCATION

# Create subnets
az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --name subnet-frontend \
  --address-prefix 10.0.1.0/24

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --name subnet-backend \
  --address-prefix 10.0.2.0/24

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --name subnet-database \
  --address-prefix 10.0.3.0/24 \
  --service-endpoints Microsoft.Sql

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --name subnet-redis \
  --address-prefix 10.0.4.0/24

az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --name subnet-privateendpoints \
  --address-prefix 10.0.5.0/24
```

### Step 3: Create Key Vault
```bash
KEYVAULT_NAME="kv-multiagent-$RANDOM"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization true \
  --enable-purge-protection true \
  --retention-days 90 \
  --network-acls-default-action Deny

# Create private endpoint for Key Vault
az network private-endpoint create \
  --name pe-keyvault \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --subnet subnet-privateendpoints \
  --private-connection-resource-id $(az keyvault show -n $KEYVAULT_NAME -g $RESOURCE_GROUP --query id -o tsv) \
  --connection-name keyvault-connection \
  --group-id vault
```

### Step 4: Create PostgreSQL Database
```bash
DB_SERVER_NAME="psql-multiagent-$RANDOM"
DB_ADMIN_USER="azureadmin"
DB_ADMIN_PASSWORD="<strong-password>"  # Use Key Vault in production

az postgres flexible-server create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD \
  --sku-name Standard_D4s_v3 \
  --tier GeneralPurpose \
  --version 15 \
  --storage-size 128 \
  --backup-retention 30 \
  --geo-redundant-backup Enabled \
  --high-availability ZoneRedundant \
  --vnet vnet-multiagent \
  --subnet subnet-database \
  --private-dns-zone-arguments zone-name=privatelink.postgres.database.azure.com

# Configure firewall (allow Azure services initially)
az postgres flexible-server firewall-rule create \
  --name $DB_SERVER_NAME \
  --resource-group $RESOURCE_GROUP \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Enable Azure AD authentication
az postgres flexible-server ad-admin create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --display-name "Azure AD Admin" \
  --object-id "<your-azure-ad-user-object-id>"

# Store connection string in Key Vault
DB_CONNECTION_STRING="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/postgres?sslmode=require"
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "postgresql-connection-string" \
  --value "$DB_CONNECTION_STRING"
```

### Step 5: Create Redis Cache
```bash
REDIS_NAME="redis-multiagent-$RANDOM"

az redis create \
  --name $REDIS_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Premium \
  --vm-size P1 \
  --enable-non-ssl-port false \
  --minimum-tls-version 1.2 \
  --redis-version 6 \
  --zones 1 2 3 \
  --replicas-per-primary 1

# Get Redis connection string
REDIS_CONNECTION_STRING=$(az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query primaryKey -o tsv)
REDIS_HOST="${REDIS_NAME}.redis.cache.windows.net"

# Store in Key Vault
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "redis-connection-string" \
  --value "rediss://:${REDIS_CONNECTION_STRING}@${REDIS_HOST}:6380"
```

### Step 6: Create Container Registry (for Docker images)
```bash
ACR_NAME="acrmultiagent$RANDOM"

az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Premium \
  --admin-enabled false \
  --public-network-enabled false

# Create private endpoint
az network private-endpoint create \
  --name pe-acr \
  --resource-group $RESOURCE_GROUP \
  --vnet-name vnet-multiagent \
  --subnet subnet-privateendpoints \
  --private-connection-resource-id $(az acr show -n $ACR_NAME -g $RESOURCE_GROUP --query id -o tsv) \
  --connection-name acr-connection \
  --group-id registry
```

### Step 7: Create Container Apps Environment
```bash
CONTAINERAPPS_ENV="cae-multiagent"

# Create Log Analytics workspace
LOG_ANALYTICS_WORKSPACE="law-multiagent"
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name $LOG_ANALYTICS_WORKSPACE \
  --location $LOCATION

WORKSPACE_ID=$(az monitor log-analytics workspace show -n $LOG_ANALYTICS_WORKSPACE -g $RESOURCE_GROUP --query customerId -o tsv)
WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys -n $LOG_ANALYTICS_WORKSPACE -g $RESOURCE_GROUP --query primarySharedKey -o tsv)

# Create Container Apps Environment
az containerapp env create \
  --name $CONTAINERAPPS_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --logs-workspace-id $WORKSPACE_ID \
  --logs-workspace-key $WORKSPACE_KEY \
  --enable-workload-profiles
```

### Step 8: Create App Service Plan (for Frontend & Middleware)
```bash
APP_SERVICE_PLAN="asp-multiagent"

az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku P1V3 \
  --is-linux
```

### Step 9: Create Storage Account
```bash
STORAGE_ACCOUNT="stmultiagent$RANDOM"

az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_ZRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --enable-hierarchical-namespace false

# Enable soft delete
az storage blob service-properties delete-policy update \
  --account-name $STORAGE_ACCOUNT \
  --enable true \
  --days-retained 30

# Create containers
az storage container create \
  --account-name $STORAGE_ACCOUNT \
  --name ml-models \
  --auth-mode login

az storage container create \
  --account-name $STORAGE_ACCOUNT \
  --name logs \
  --auth-mode login
```

---

## Application Deployment

### 1. Deploy ADK API (Container App)

#### Create Dockerfile (if not exists)
```dockerfile
# apps/adk/Dockerfile
FROM python:3.11-slim-bullseye

# Security: Run as non-root user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership to appuser
RUN chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Build and Push Docker Image
```bash
cd apps/adk

# Build image
docker build -t $ACR_NAME.azurecr.io/adk-api:latest .

# Login to ACR (using managed identity or service principal)
az acr login --name $ACR_NAME

# Push image
docker push $ACR_NAME.azurecr.io/adk-api:latest
```

#### Deploy Container App
```bash
# Create managed identity for the container app
IDENTITY_NAME="id-adk-api"
az identity create \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP

IDENTITY_ID=$(az identity show -n $IDENTITY_NAME -g $RESOURCE_GROUP --query id -o tsv)
IDENTITY_CLIENT_ID=$(az identity show -n $IDENTITY_NAME -g $RESOURCE_GROUP --query clientId -o tsv)

# Grant ACR pull permission
ACR_ID=$(az acr show -n $ACR_NAME -g $RESOURCE_GROUP --query id -o tsv)
az role assignment create \
  --assignee $IDENTITY_CLIENT_ID \
  --role AcrPull \
  --scope $ACR_ID

# Grant Key Vault access
KEYVAULT_ID=$(az keyvault show -n $KEYVAULT_NAME -g $RESOURCE_GROUP --query id -o tsv)
az role assignment create \
  --assignee $IDENTITY_CLIENT_ID \
  --role "Key Vault Secrets User" \
  --scope $KEYVAULT_ID

# Create container app
az containerapp create \
  --name ca-adk-api \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINERAPPS_ENV \
  --image $ACR_NAME.azurecr.io/adk-api:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-identity $IDENTITY_ID \
  --user-assigned $IDENTITY_ID \
  --target-port 8000 \
  --ingress external \
  --min-replicas 2 \
  --max-replicas 10 \
  --cpu 2 \
  --memory 4Gi \
  --secrets \
    postgresql-connection-string=keyvaultref:https://${KEYVAULT_NAME}.vault.azure.net/secrets/postgresql-connection-string,identityref:$IDENTITY_ID \
    redis-connection-string=keyvaultref:https://${KEYVAULT_NAME}.vault.azure.net/secrets/redis-connection-string,identityref:$IDENTITY_ID \
  --env-vars \
    POSTGRESQL_CONNECTION_STRING=secretref:postgresql-connection-string \
    REDIS_CONNECTION_STRING=secretref:redis-connection-string \
    AZURE_KEYVAULT_URL=https://${KEYVAULT_NAME}.vault.azure.net/ \
    ENVIRONMENT=production
```

### 2. Deploy Middleware API (App Service)

```bash
cd apps/server

# Create App Service
az webapp create \
  --name app-middleware-api \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "PYTHON:3.11"

# Configure managed identity
az webapp identity assign \
  --name app-middleware-api \
  --resource-group $RESOURCE_GROUP

MIDDLEWARE_IDENTITY=$(az webapp identity show -n app-middleware-api -g $RESOURCE_GROUP --query principalId -o tsv)

# Grant Key Vault access
az role assignment create \
  --assignee $MIDDLEWARE_IDENTITY \
  --role "Key Vault Secrets User" \
  --scope $KEYVAULT_ID

# Configure app settings
ADK_API_URL=$(az containerapp show -n ca-adk-api -g $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)

az webapp config appsettings set \
  --name app-middleware-api \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AGENT_BASE_URL="https://${ADK_API_URL}" \
    AZURE_KEYVAULT_URL="https://${KEYVAULT_NAME}.vault.azure.net/" \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy code
zip -r ../server.zip .
az webapp deployment source config-zip \
  --name app-middleware-api \
  --resource-group $RESOURCE_GROUP \
  --src ../server.zip
```

### 3. Deploy Frontend (App Service)

```bash
cd apps/frontend

# Create App Service for Next.js
az webapp create \
  --name app-multiagent-frontend \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts"

# Configure managed identity
az webapp identity assign \
  --name app-multiagent-frontend \
  --resource-group $RESOURCE_GROUP

# Configure app settings
MIDDLEWARE_URL=$(az webapp show -n app-middleware-api -g $RESOURCE_GROUP --query defaultHostName -o tsv)

az webapp config appsettings set \
  --name app-multiagent-frontend \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NEXT_PUBLIC_API_URL="https://${MIDDLEWARE_URL}" \
    NODE_ENV=production \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy code
npm run build
zip -r ../frontend.zip .next package.json node_modules
az webapp deployment source config-zip \
  --name app-multiagent-frontend \
  --resource-group $RESOURCE_GROUP \
  --src ../frontend.zip
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: rg-multiagent-prod
  ACR_NAME: acrmultiagent
  FRONTEND_APP: app-multiagent-frontend
  MIDDLEWARE_APP: app-middleware-api
  CONTAINER_APP: ca-adk-api

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build-and-push-adk:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Build and push Docker image
        run: |
          az acr login --name ${{ env.ACR_NAME }}
          cd apps/adk
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/adk-api:${{ github.sha }} .
          docker push ${{ env.ACR_NAME }}.azurecr.io/adk-api:${{ github.sha }}
      
      - name: Deploy to Container App
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/adk-api:${{ github.sha }}

  deploy-middleware:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.MIDDLEWARE_APP }}
          package: apps/server

  deploy-frontend:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Build Next.js app
        run: |
          cd apps/frontend
          npm ci
          npm run build
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.FRONTEND_APP }}
          package: apps/frontend
```

---

## Monitoring & Observability

### Application Insights Configuration

```python
# apps/adk/main.py - Add at the top
from azure.monitor.opentelemetry import configure_azure_monitor
import logging

# Configure Azure Monitor
configure_azure_monitor(
    connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add custom telemetry
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

tracer_provider = TracerProvider()
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)

@app.post("/run_sse")
async def run_agent(req: SimpleQueryRequest):
    with tracer.start_as_current_span("agent_execution"):
        # Track custom metrics
        logger.info(f"Agent query started", extra={
            "user_id": req.user_id,
            "session_id": req.session_id,
            "query_length": len(req.user_query)
        })
        # ... existing code
```

### Alerts Configuration

```bash
# Create action group for notifications
az monitor action-group create \
  --name ag-critical-alerts \
  --resource-group $RESOURCE_GROUP \
  --short-name CritAlerts \
  --email-receiver \
    name=DevTeam \
    email-address=devteam@yourcompany.com \
  --sms-receiver \
    name=OnCall \
    country-code=1 \
    phone-number=1234567890

# CPU alert
az monitor metrics alert create \
  --name alert-high-cpu \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az containerapp show -n ca-adk-api -g $RESOURCE_GROUP --query id -o tsv) \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action ag-critical-alerts

# Memory alert
az monitor metrics alert create \
  --name alert-high-memory \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az containerapp show -n ca-adk-api -g $RESOURCE_GROUP --query id -o tsv) \
  --condition "avg WorkingSetBytes > 3500000000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action ag-critical-alerts

# Error rate alert
az monitor metrics alert create \
  --name alert-high-error-rate \
  --resource-group $RESOURCE_GROUP \
  --scopes $(az webapp show -n app-multiagent-frontend -g $RESOURCE_GROUP --query id -o tsv) \
  --condition "total Http5xx > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action ag-critical-alerts
```

---

## Cost Optimization

### 1. **Auto-scaling Configuration**
```bash
# Container App auto-scaling
az containerapp update \
  --name ca-adk-api \
  --resource-group $RESOURCE_GROUP \
  --min-replicas 1 \  # Scale down to 1 in off-peak
  --max-replicas 10 \
  --scale-rule-name http-scaling \
  --scale-rule-type http \
  --scale-rule-http-concurrency 10

# App Service auto-scaling
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource app-multiagent-frontend \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-frontend \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

### 2. **Cost Management**
- Use **Azure Cost Management + Billing**
- Set up **budget alerts** (e.g., alert at 80%, 90%, 100%)
- Use **Azure Advisor** recommendations
- Consider **Reserved Instances** for stable workloads (up to 72% savings)

### 3. **Estimated Monthly Costs** (Prod Environment)
```
Component                          SKU/Tier          Monthly Cost (USD)
------------------------------------------------------------------------
Container Apps (ADK API)           Consumption       ~$150-300
App Service Plan (P1V3)            2 instances       ~$200
PostgreSQL Flexible Server         General Purpose   ~$150-300
Redis Premium (P1)                 Zone-redundant    ~$350
Azure Storage (ZRS)                100 GB            ~$5
Application Insights               15 GB/month       ~$30
Key Vault                          Standard          ~$3
VNet + Private Endpoints           5 endpoints       ~$10
Azure Front Door                   Standard          ~$50-100
------------------------------------------------------------------------
TOTAL                                                ~$950-1,500/month
```

---

## Disaster Recovery

### 1. **Backup Strategy**

#### PostgreSQL Backups
```bash
# Automated backups (configured during creation)
# Retention: 30 days
# Geo-redundant: Enabled

# Manual backup
az postgres flexible-server backup create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --backup-name manual-backup-$(date +%Y%m%d)
```

#### Redis Backups
```bash
# Export Redis data (Premium tier)
az redis export \
  --name $REDIS_NAME \
  --resource-group $RESOURCE_GROUP \
  --container-uri "https://${STORAGE_ACCOUNT}.blob.core.windows.net/redis-backups" \
  --prefix backup-$(date +%Y%m%d)
```

### 2. **Disaster Recovery Plan**

```yaml
Recovery Objectives:
  RPO (Recovery Point Objective): 1 hour
  RTO (Recovery Time Objective): 4 hours

DR Strategy:
  - Use Azure Site Recovery for VM-based services
  - Geo-replicated database backups
  - Multi-region deployment (Active-Passive)
  - Regular DR drills (quarterly)

Failover Procedure:
  1. Detect outage (automated monitoring)
  2. Promote standby database to primary
  3. Update DNS/Front Door to point to DR region
  4. Scale up DR services
  5. Verify functionality
  6. Notify stakeholders
```

### 3. **Multi-Region Setup** (Optional for HA)

```bash
# Create resources in secondary region
SECONDARY_REGION="westus"
SECONDARY_RG="rg-multiagent-dr"

# Deploy all resources to secondary region
# Configure geo-replication for PostgreSQL
az postgres flexible-server replica create \
  --replica-name psql-multiagent-replica \
  --resource-group $SECONDARY_RG \
  --source-server $(az postgres flexible-server show -n $DB_SERVER_NAME -g $RESOURCE_GROUP --query id -o tsv) \
  --location $SECONDARY_REGION

# Configure Azure Front Door for multi-region routing
az afd profile create \
  --profile-name afd-multiagent \
  --resource-group $RESOURCE_GROUP \
  --sku Premium_AzureFrontDoor

az afd origin-group create \
  --origin-group-name og-multiagent \
  --profile-name afd-multiagent \
  --resource-group $RESOURCE_GROUP \
  --probe-path /health \
  --probe-protocol Https \
  --probe-request-type GET \
  --probe-interval-in-seconds 30

# Add both regions as origins
az afd origin create \
  --origin-group-name og-multiagent \
  --origin-name origin-primary \
  --profile-name afd-multiagent \
  --resource-group $RESOURCE_GROUP \
  --host-name app-multiagent-frontend.azurewebsites.net \
  --priority 1 \
  --weight 100 \
  --enabled-state Enabled

az afd origin create \
  --origin-group-name og-multiagent \
  --origin-name origin-dr \
  --profile-name afd-multiagent \
  --resource-group $RESOURCE_GROUP \
  --host-name app-multiagent-frontend-dr.azurewebsites.net \
  --priority 2 \
  --weight 100 \
  --enabled-state Enabled
```

---

## Checklist Before Go-Live

### Security
- [ ] All secrets moved to Key Vault
- [ ] Managed identities configured for all services
- [ ] Private endpoints enabled for all PaaS services
- [ ] NSG rules configured and tested
- [ ] WAF enabled on Application Gateway/Front Door
- [ ] SSL/TLS certificates configured
- [ ] CORS restricted to specific domains
- [ ] API authentication implemented
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Vulnerability scanning automated in CI/CD
- [ ] Azure Policy compliance verified

### Compliance
- [ ] Data encryption at rest enabled
- [ ] Data encryption in transit enforced (TLS 1.2+)
- [ ] Audit logging enabled
- [ ] Data residency requirements met
- [ ] GDPR compliance verified (if applicable)
- [ ] Backup retention configured
- [ ] Disaster recovery plan documented and tested

### Monitoring
- [ ] Application Insights configured
- [ ] Custom metrics and logs implemented
- [ ] Alerts configured for critical events
- [ ] Action groups created for notifications
- [ ] Dashboards created for operations team
- [ ] SLA targets defined

### Performance
- [ ] Auto-scaling rules configured
- [ ] Load testing completed
- [ ] CDN configured for static assets
- [ ] Database query optimization completed
- [ ] Caching strategy implemented

### Operations
- [ ] CI/CD pipeline tested
- [ ] Blue-green deployment strategy implemented
- [ ] Rollback procedure documented
- [ ] Runbooks created for common issues
- [ ] On-call rotation established
- [ ] Documentation updated

---

## Additional Resources

### Documentation
- [Azure Well-Architected Framework](https://learn.microsoft.com/azure/well-architected/)
- [Azure Security Best Practices](https://learn.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Azure App Service Best Practices](https://learn.microsoft.com/azure/app-service/app-service-best-practices)

### Tools
- [Azure CLI](https://learn.microsoft.com/cli/azure/)
- [Azure Portal](https://portal.azure.com)
- [Azure Resource Manager (ARM) Templates](https://learn.microsoft.com/azure/azure-resource-manager/templates/)
- [Terraform for Azure](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Bicep (Azure IaC)](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)

---

## Support

For Azure-specific issues:
- Azure Support: https://azure.microsoft.com/support/
- Azure Status: https://status.azure.com/

For application issues:
- Create internal support tickets
- Escalate to development team based on severity

