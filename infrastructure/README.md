# Infrastructure Deployment Scripts

This directory contains all infrastructure-as-code and deployment scripts for Azure.

## Files

### `azure-deploy.sh`
Main deployment script that creates all Azure resources.

**Usage:**
```bash
./azure-deploy.sh
```

**What it creates:**
- Resource Group: `rg-multiagent-prod`
- Container Registry: `acrmultiagentprod`
- PostgreSQL Server: `multiagent-prod-db`
- Key Vault: `kv-multiagent-prod`
- Storage Account: `stmultiagentprod`
- Log Analytics: `law-multiagent-prod`
- Application Insights: `ai-multiagent-prod`
- Container Apps Environment: `cae-multiagent-prod`
- Frontend Container App: `ca-multiagent-frontend`
- ADK Backend Container App: `ca-multiagent-adk`

**Prerequisites:**
- Azure CLI installed
- Logged in to Azure (`az login`)
- Contributor or Owner role on subscription

**Time:** 15-20 minutes

## Configuration

Edit these variables in `azure-deploy.sh` if you want different names:

```bash
RESOURCE_GROUP="rg-multiagent-prod"
LOCATION="eastus"
ACR_NAME="acrmultiagentprod"
POSTGRES_SERVER_NAME="multiagent-prod-db"
# ... etc
```

## Cost Estimate

**Monthly cost for deployed infrastructure:** ~$70-90

| Resource | SKU/Tier | Monthly Cost |
|----------|----------|--------------|
| Container Apps (2x) | Consumption with scale-to-zero | $25-40 |
| PostgreSQL | Burstable B1ms | $28-32 |
| Container Registry | Basic | $5 |
| Storage Account | Standard LRS | $2-3 |
| Key Vault | Standard | $1-2 |
| Monitoring | 2-5 GB logs | $8-10 |

## Secrets Stored

The script stores these secrets in Azure Key Vault:
- `google-api-key` - Google Gemini API key
- `deepgram-api-key` - Deepgram API key for voice
- `db-admin-password` - PostgreSQL admin password
- `db-user` - PostgreSQL username
- `db-host` - PostgreSQL hostname

## Post-Deployment Steps

1. **Upload customers.db:**
   ```bash
   az storage blob upload \
     --account-name stmultiagentprod \
     --container-name databases \
     --name customers.db \
     --file ../apps/adk/orchestration_agent/database/customers.db
   ```

2. **Configure GitHub Secrets** for CI/CD

3. **Push to prod branch** to trigger deployment

## Cleanup

To delete all resources:

```bash
az group delete --name rg-multiagent-prod --yes
```

⚠️ **WARNING:** This deletes EVERYTHING including databases and backups!

## Support

For detailed documentation, see:
- `../AZURE_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `../DEPLOYMENT_SUMMARY.md` - Quick reference
