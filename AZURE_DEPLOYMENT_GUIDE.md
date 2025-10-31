# Azure Deployment Guide - Multi-Agent Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Deployment](#initial-deployment)
4. [Post-Deployment Setup](#post-deployment-setup)
5. [CI/CD Configuration](#cicd-configuration)
6. [Redeployment & Updates](#redeployment--updates)
7. [Maintenance & Operations](#maintenance--operations)
8. [Troubleshooting](#troubleshooting)
9. [Cost Management](#cost-management)
10. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Architecture

```
User's Browser
    ↓ HTTPS
Azure Container Apps (Frontend)
    ↓ HTTPS (internal)
Azure Container Apps (ADK Backend)
    ↓ Private Endpoint
Azure PostgreSQL Flexible Server
```

### Services Deployed

| Service | Purpose | Monthly Cost |
|---------|---------|--------------|
| Azure Container Apps (2x) | Frontend + ADK Backend | $25-40 |
| PostgreSQL Flexible Server | Database | $28-32 |
| Container Registry | Docker images | $5 |
| Storage Account | customers.db file | $2-3 |
| Key Vault | Secrets management | $1-2 |
| Monitoring (Logs + Insights) | Observability | $8-10 |
| **TOTAL** | | **$69-91/month** |

**For <10 users with scale-to-zero enabled: ~$70-80/month**

---

## Prerequisites

### Required Tools
- **Azure CLI** ([Install](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- **Git**
- **Docker** (for local testing)
- **GitHub account** (for CI/CD)

### Required Accounts & Keys
- **Azure subscription** with Owner or Contributor role
- **Google Gemini API key** ([Get here](https://makersuite.google.com/app/apikey))
- **Deepgram API key** ([Sign up](https://deepgram.com/))
- **GitHub repository** with this code

### Check Prerequisites
```bash
# Verify Azure CLI
az --version

# Verify Docker
docker --version

# Verify Git
git --version
```

---

## Initial Deployment

### Step 1: Login to Azure

**⏰ LOGIN NOW!** This is when you need to login to Azure.

```bash
# Open terminal and login
az login

# Verify you're logged in
az account show

# (Optional) Set a specific subscription if you have multiple
az account list --output table
az account set --subscription "Your Subscription Name"
```

### Step 2: Run Infrastructure Deployment Script

This creates all Azure resources (Resource Group, Container Registry, PostgreSQL, Key Vault, etc.)

```bash
# Navigate to project root
cd multiagent-agency

# Make script executable (Mac/Linux)
chmod +x infrastructure/azure-deploy.sh

# Run the deployment script
./infrastructure/azure-deploy.sh

# On Windows, use Git Bash or WSL to run the script
```

**What this script does:**
1. Creates Resource Group
2. Creates Azure Container Registry (ACR)
3. Creates Key Vault and stores API keys
4. Creates Storage Account
5. Creates Log Analytics + Application Insights
6. Creates PostgreSQL Flexible Server
7. Creates Container Apps Environment
8. Creates 2 Container Apps (with placeholder images)

**Time: ~15-20 minutes**

You'll be prompted to enter:
- Google API Key
- Deepgram API Key
- PostgreSQL Admin Password

### Step 3: Upload customers.db to Azure Storage

```bash
# Get your storage account name (from script output)
STORAGE_ACCOUNT_NAME="stmultiagentprod"

# Upload the database file
az storage blob upload \
  --account-name $STORAGE_ACCOUNT_NAME \
  --container-name databases \
  --name customers.db \
  --file apps/adk/orchestration_agent/database/customers.db

# Verify upload
az storage blob list \
  --account-name $STORAGE_ACCOUNT_NAME \
  --container-name databases \
  --output table
```

### Step 4: Migrate PostgreSQL Database (Optional)

If you want to use Azure PostgreSQL instead of SQLite:

```bash
# Step 1: Backup existing Google Cloud PostgreSQL
pg_dump -h 34.14.132.152 -U enterpriseiq -d enterpriseiq > backup.sql

# Step 2: Get Azure PostgreSQL hostname
POSTGRES_HOST=$(az postgres flexible-server show \
  --resource-group rg-multiagent-prod \
  --name multiagent-prod-db \
  --query fullyQualifiedDomainName -o tsv)

# Step 3: Restore to Azure PostgreSQL
psql -h $POSTGRES_HOST -U enterpriseiq -d enterpriseiq < backup.sql
```

---

## Post-Deployment Setup

### Step 1: Get ACR Credentials

```bash
# Get ACR username
az acr credential show \
  --name acrmultiagentprod \
  --query username \
  --output tsv

# Get ACR password
az acr credential show \
  --name acrmultiagentprod \
  --query passwords[0].value \
  --output tsv
```

**Save these credentials for GitHub Secrets!**

### Step 2: Create Azure Service Principal for GitHub Actions

```bash
# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name "github-actions-multiagent" \
  --role contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/rg-multiagent-prod \
  --sdk-auth

# Copy the entire JSON output
```

**Output will look like:**
```json
{
  "clientId": "xxx",
  "clientSecret": "xxx",
  "subscriptionId": "xxx",
  "tenantId": "xxx",
  ...
}
```

**Copy this entire JSON - you'll need it for GitHub Secrets!**

---

## CI/CD Configuration

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Click "New repository secret" and add:

| Secret Name | Value | How to Get |
|-------------|-------|-----------|
| `ACR_USERNAME` | Container registry username | From Step 1 above |
| `ACR_PASSWORD` | Container registry password | From Step 1 above |
| `AZURE_CREDENTIALS` | Service principal JSON | From Step 2 above (entire JSON) |

### Step 2: Verify GitHub Workflow File

The workflow file is already created at `.github/workflows/deploy-prod.yml`

It will automatically:
- Build Docker images
- Push to Azure Container Registry
- Deploy to Azure Container Apps
- Run health checks

### Step 3: Test CI/CD Pipeline

```bash
# Make a small change (e.g., edit README)
echo "# Deployed to Azure" >> README.md

# Commit and push to prod branch
git add .
git commit -m "test: trigger Azure deployment"
git push origin prod
```

**Watch deployment:**
- Go to GitHub → Actions tab
- You'll see the deployment running
- Takes 3-5 minutes

### Step 4: Get Application URLs

After deployment completes:

```bash
# Get Frontend URL
az containerapp show \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --query properties.configuration.ingress.fqdn \
  --output tsv

# Get ADK Backend URL
az containerapp show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

**Open the Frontend URL in your browser! 🎉**

---

## Redeployment & Updates

### Automatic Redeployment (Recommended)

Simply push code to the `prod` branch:

```bash
# 1. Make your changes locally
# Edit files in apps/frontend or apps/adk

# 2. Test locally
cd apps/frontend && pnpm dev
# OR
cd apps/adk && python main.py

# 3. Commit changes
git add .
git commit -m "feat: add new dashboard"

# 4. Push to prod branch
git push origin prod

# ✨ GitHub Actions automatically deploys in 3-5 minutes!
```

### Manual Redeployment (If CI/CD fails)

**Build and push images manually:**

```bash
# Login to ACR
az acr login --name acrmultiagentprod

# Build and push Frontend
docker build -t acrmultiagentprod.azurecr.io/frontend:latest ./apps/frontend
docker push acrmultiagentprod.azurecr.io/frontend:latest

# Build and push ADK Backend
docker build -t acrmultiagentprod.azurecr.io/adk-backend:latest ./apps/adk
docker push acrmultiagentprod.azurecr.io/adk-backend:latest

# Update Container Apps
az containerapp update \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --image acrmultiagentprod.azurecr.io/frontend:latest

az containerapp update \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --image acrmultiagentprod.azurecr.io/adk-backend:latest
```

### Update Environment Variables

**Update API keys or configuration:**

```bash
# Update Google API key in Key Vault
az keyvault secret set \
  --vault-name kv-multiagent-prod \
  --name google-api-key \
  --value "NEW_API_KEY_HERE"

# Restart container app to pick up new key
az containerapp revision restart \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod
```

**Update other environment variables:**

```bash
# Update ADK backend environment variable
az containerapp update \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --set-env-vars MODEL=gemini-2.0-flash

# Update frontend environment variable
az containerapp update \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --set-env-vars NEXT_PUBLIC_API_URL=https://new-url.com/api
```

---

## Maintenance & Operations

### Monitor Application Health

**View logs:**

```bash
# Stream ADK backend logs
az containerapp logs show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --follow

# Stream frontend logs
az containerapp logs show \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --follow
```

**Check application health:**

```bash
# Get ADK backend URL
ADK_URL=$(az containerapp show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

# Check health endpoint
curl https://$ADK_URL/health
```

**View Application Insights:**

```bash
# Open in browser
az monitor app-insights component show \
  --app ai-multiagent-prod \
  --resource-group rg-multiagent-prod \
  --query appId -o tsv

# View in Azure Portal
az portal
```

### Scale Container Apps

**Manual scaling:**

```bash
# Scale ADK backend to 3 replicas
az containerapp update \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --min-replicas 1 \
  --max-replicas 6

# Scale down to save costs
az containerapp update \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --min-replicas 0 \
  --max-replicas 2
```

### Backup Database

**Manual backup:**

```bash
# Get PostgreSQL hostname
POSTGRES_HOST=$(az postgres flexible-server show \
  --resource-group rg-multiagent-prod \
  --name multiagent-prod-db \
  --query fullyQualifiedDomainName -o tsv)

# Backup database
pg_dump -h $POSTGRES_HOST \
  -U enterpriseiq \
  -d enterpriseiq \
  > backup_$(date +%Y%m%d).sql
```

**Automated backups are enabled by default (7-day retention)**

### Update Dependencies

**Update Python dependencies:**

```bash
# Edit apps/adk/requirements.txt
# Add or update packages

# Commit and push (triggers auto-deployment)
git add apps/adk/requirements.txt
git commit -m "chore: update dependencies"
git push origin prod
```

**Update Node dependencies:**

```bash
# Update package.json
cd apps/frontend
pnpm update

# Commit and push
git add package.json pnpm-lock.yaml
git commit -m "chore: update frontend dependencies"
git push origin prod
```

---

## Troubleshooting

### Application Not Starting

**Check container logs:**

```bash
az containerapp logs show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --tail 100
```

**Check revision status:**

```bash
az containerapp revision list \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --output table
```

### Database Connection Issues

**Test database connectivity:**

```bash
# Get database hostname
POSTGRES_HOST=$(az postgres flexible-server show \
  --resource-group rg-multiagent-prod \
  --name multiagent-prod-db \
  --query fullyQualifiedDomainName -o tsv)

# Test connection
psql -h $POSTGRES_HOST -U enterpriseiq -d enterpriseiq -c "SELECT version();"
```

**Check firewall rules:**

```bash
az postgres flexible-server firewall-rule list \
  --resource-group rg-multiagent-prod \
  --name multiagent-prod-db \
  --output table
```

### High Costs

**Check current costs:**

```bash
# View cost analysis
az costmanagement query \
  --type ActualCost \
  --dataset-filter "{\"and\":[{\"dimensions\":{\"name\":\"ResourceGroupName\",\"operator\":\"In\",\"values\":[\"rg-multiagent-prod\"]}}]}" \
  --timeframe MonthToDate
```

**Reduce costs:**

1. Scale down minimum replicas to 0
2. Reduce PostgreSQL tier to Burstable
3. Reduce log retention to 7 days
4. Delete unused resources

### CI/CD Pipeline Failing

**Check GitHub Actions logs:**
1. Go to GitHub → Actions tab
2. Click on the failed workflow
3. Expand each step to see errors

**Common issues:**
- **ACR credentials wrong:** Update GitHub secrets
- **Azure login failed:** Regenerate service principal
- **Image build failed:** Check Dockerfile syntax

---

## Cost Management

### Set Budget Alerts

```bash
az consumption budget create \
  --budget-name multiagent-monthly-budget \
  --amount 100 \
  --time-grain Monthly \
  --start-date 2025-01-01 \
  --end-date 2026-01-01 \
  --resource-group rg-multiagent-prod
```

### Monitor Costs

**View daily costs:**

```bash
az costmanagement query \
  --type ActualCost \
  --timeframe MonthToDate \
  --dataset-filter "{\"and\":[{\"dimensions\":{\"name\":\"ResourceGroupName\",\"operator\":\"In\",\"values\":[\"rg-multiagent-prod\"]}}]}"
```

### Cost-Saving Tips

1. **Enable scale-to-zero** (already enabled)
2. **Use Burstable PostgreSQL tier** (already using)
3. **Delete dev/test environments** when not in use
4. **Use Azure Reservations** for 1-3 year commitments (save 30-50%)
5. **Review logs retention** (default 30 days → reduce to 7 days)

---

## Rollback Procedures

### Rollback to Previous Container Image

**List all revisions:**

```bash
az containerapp revision list \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --output table
```

**Activate previous revision:**

```bash
# Get previous revision name
PREV_REVISION="ca-multiagent-adk--abc123"

# Activate it
az containerapp revision activate \
  --revision $PREV_REVISION \
  --resource-group rg-multiagent-prod
```

**Instant rollback (30 seconds!)**

### Rollback Database

**Restore from automated backup:**

```bash
# List available backups
az postgres flexible-server backup list \
  --resource-group rg-multiagent-prod \
  --name multiagent-prod-db \
  --output table

# Restore from specific backup
az postgres flexible-server restore \
  --resource-group rg-multiagent-prod \
  --name multiagent-prod-db-restored \
  --source-server multiagent-prod-db \
  --restore-time "2025-01-15T10:00:00Z"
```

### Rollback Code via Git

```bash
# Revert last commit
git revert HEAD
git push origin prod

# GitHub Actions automatically deploys the reverted version
```

---

## Quick Reference Commands

### Deployment Status
```bash
# Get all app URLs
az containerapp list \
  --resource-group rg-multiagent-prod \
  --query "[].{Name:name, URL:properties.configuration.ingress.fqdn}" \
  --output table
```

### Restart All Services
```bash
az containerapp restart --name ca-multiagent-frontend --resource-group rg-multiagent-prod
az containerapp restart --name ca-multiagent-adk --resource-group rg-multiagent-prod
```

### Delete Everything (⚠️ Dangerous!)
```bash
# Delete entire resource group (use with caution!)
az group delete --name rg-multiagent-prod --yes
```

---

## Support & Resources

- **Azure Documentation:** https://docs.microsoft.com/en-us/azure/
- **Container Apps Docs:** https://docs.microsoft.com/en-us/azure/container-apps/
- **PostgreSQL Docs:** https://docs.microsoft.com/en-us/azure/postgresql/
- **Azure CLI Reference:** https://docs.microsoft.com/en-us/cli/azure/

---

## Summary

### Initial Setup (One-time, ~30 minutes)
1. ✅ Run `azure-deploy.sh` script
2. ✅ Upload customers.db to Blob Storage
3. ✅ Configure GitHub Secrets
4. ✅ Push to `prod` branch

### Day-to-Day Updates (3-5 minutes each)
1. ✅ Make code changes locally
2. ✅ Test locally
3. ✅ `git push origin prod`
4. ✅ Wait 3-5 minutes for auto-deployment

### Maintenance (Monthly)
1. ✅ Review costs in Azure Portal
2. ✅ Check Application Insights for errors
3. ✅ Update dependencies if needed
4. ✅ Review and rotate API keys (quarterly)

---

**Congratulations! Your Multi-Agent Platform is deployed to Azure!** 🎉

For questions or issues, refer to the troubleshooting section or check Azure Monitor logs.
