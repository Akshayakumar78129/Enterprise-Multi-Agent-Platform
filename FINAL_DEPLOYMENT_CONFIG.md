# Final Deployment Configuration

## Resource Names (Updated with actual deployed names)

**NOTE:** Names have changed from original plan due to global naming conflicts

| Original Name | Actual Deployed Name | Reason |
|---------------|---------------------|---------|
| `acrmultiagentprod` | `acrmultiagent5678` | Original globally taken |
| `kv-multiagent-prod` | `kv-multiagent5678` | Original globally taken |
| `stmultiagentprod` | `stmultiagent5678` | Matching pattern |
| `multiagent-prod-db` | `multiagent-prod-db5678` | Matching pattern |

## Update Required Files

### 1. Update `.github/workflows/deploy-prod.yml`

Change these lines (around line 11-13):

```yaml
env:
  AZURE_RESOURCE_GROUP: rg-multiagent-prod
  AZURE_LOCATION: eastus
  ACR_NAME: acrmultiagent5678  # ← CHANGED from acrmultiagentprod
  CONTAINER_APP_ENV: cae-multiagent-prod
```

### 2. Update `infrastructure/azure-deploy.ps1`

Change these variables (lines 25-32):

```powershell
$ACR_NAME = "acrmultiagent5678"  # ← CHANGED
$POSTGRES_SERVER_NAME = "multiagent-prod-db5678"  # ← CHANGED
$KEY_VAULT_NAME = "kv-multiagent5678"  # ← CHANGED
$STORAGE_ACCOUNT_NAME = "stmultiagent5678"  # ← CHANGED
```

## Environment Variables for Container Apps

### ADK Backend Environment Variables:

```bash
GOOGLE_API_KEY=secretref:google-api-key
DEEPGRAM_API_KEY=secretref:deepgram-api-key
DB_USER=secretref:db-user
DB_PASSWORD=secretref:db-admin-password
DB_HOST=secretref:db-host
DB_PORT=5432
DB_NAME=enterpriseiq
SSL_MODE=require
PORT=8000
MODEL=gemini-2.5-flash
GOOGLE_GENAI_USE_VERTEXAI=False
```

### Frontend Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io/api
NEXT_PUBLIC_BACKEND_AI_URL=https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io
NEXT_PUBLIC_ADK_URL=https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io
NODE_ENV=production
```

## GitHub Secrets to Configure

Go to: GitHub → Settings → Secrets and variables → Actions

Add these secrets:

```
ACR_USERNAME: acrmultiagent5678
ACR_PASSWORD: <Retrieve from: az acr credential show --name acrmultiagent5678>
AZURE_CREDENTIALS: <Service Principal JSON - see below>
```

### Create Service Principal for GitHub:

```bash
az ad sp create-for-rbac \
  --name "github-actions-multiagent" \
  --role contributor \
  --scopes /subscriptions/139b835b-00c6-4f1a-9b2e-049b2b5003a6/resourceGroups/rg-multiagent-prod \
  --sdk-auth
```

Copy the entire JSON output and paste as `AZURE_CREDENTIALS` secret.

## Deployment Commands

### Manual Build and Deploy (if CI/CD not set up):

```bash
# Build images in Azure (no local Docker needed)
cd apps/adk
az acr build --registry acrmultiagent5678 --image adk-backend:latest .

cd ../frontend
az acr build --registry acrmultiagent5678 --image frontend:latest .

# Deploy to Container Apps
az containerapp update \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --image acrmultiagent5678.azurecr.io/adk-backend:latest \
  --set-env-vars \
    GOOGLE_API_KEY=secretref:google-api-key \
    DEEPGRAM_API_KEY=secretref:deepgram-api-key \
    DB_USER=secretref:db-user \
    DB_PASSWORD=secretref:db-admin-password \
    DB_HOST=secretref:db-host \
    DB_PORT=5432 \
    DB_NAME=enterpriseiq \
    SSL_MODE=require \
    PORT=8000 \
    MODEL=gemini-2.5-flash \
    GOOGLE_GENAI_USE_VERTEXAI=False

az containerapp update \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --image acrmultiagent5678.azurecr.io/frontend:latest \
  --set-env-vars \
    NEXT_PUBLIC_API_URL=https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io/api \
    NEXT_PUBLIC_BACKEND_AI_URL=https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io \
    NEXT_PUBLIC_ADK_URL=https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io \
    NODE_ENV=production
```

### Auto-Deploy via GitHub Actions:

Once GitHub Secrets are configured:

```bash
git add .
git commit -m "deploy: update with correct Azure resource names"
git push origin prod
```

## URLs

- **Frontend:** https://ca-multiagent-frontend.redstone-8a8a7ba1.eastus.azurecontainerapps.io/
- **ADK Backend:** https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io/
- **PostgreSQL:** multiagent-prod-db5678.postgres.database.azure.com:5432
- **Database Name:** enterpriseiq

## Important Notes

1. **PostgreSQL is in West US 2** (not East US) due to regional restrictions
2. **customers.db uploaded** to Azure Blob Storage in container `databases`
3. **All secrets stored** in Key Vault `kv-multiagent5678`
4. **Scale-to-zero enabled** to save costs when idle
5. **Auto-scaling configured** 0-4 replicas for ADK, 0-3 for Frontend

## Cost Monitoring

```bash
# View current month costs
az costmanagement query \
  --type ActualCost \
  --timeframe MonthToDate \
  --dataset-filter "{\"and\":[{\"dimensions\":{\"name\":\"ResourceGroupName\",\"operator\":\"In\",\"values\":[\"rg-multiagent-prod\"]}}]}"
```

## Health Checks

```bash
# Check ADK Backend
curl https://ca-multiagent-adk.redstone-8a8a7ba1.eastus.azurecontainerapps.io/health

# Check Frontend
curl https://ca-multiagent-frontend.redstone-8a8a7ba1.eastus.azurecontainerapps.io/
```

## Logs

```bash
# ADK Backend logs
az containerapp logs show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --follow

# Frontend logs
az containerapp logs show \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --follow
```
