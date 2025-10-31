# 🚀 Azure Deployment - Quick Start Summary

## ⏰ WHEN TO LOGIN TO AZURE

**You need to login NOW to start the deployment!**

---

## 📋 What Was Created

All deployment files are ready:

- ✅ **Dockerfiles** (Frontend + ADK Backend) - `apps/*/Dockerfile`
- ✅ **Docker Compose** for local testing - `docker-compose.yml`
- ✅ **GitHub Actions CI/CD** - `.github/workflows/deploy-prod.yml`
- ✅ **Azure Deployment Script** - `infrastructure/azure-deploy.sh`
- ✅ **Complete Documentation** - `AZURE_DEPLOYMENT_GUIDE.md`

---

## 🎯 Deployment Steps (30-Minute Setup)

### Step 1: Login to Azure (DO THIS NOW!)

```bash
az login
```

### Step 2: Run Azure Infrastructure Script

```bash
cd multiagent-agency
./infrastructure/azure-deploy.sh
```

**What this creates:**
- Resource Group
- Container Registry
- PostgreSQL Database
- Key Vault (with API keys)
- Storage Account
- Monitoring (Logs + Insights)
- 2 Container Apps

**Time: 15-20 minutes**

You'll be asked for:
- ✅ Google API Key
- ✅ Deepgram API Key
- ✅ PostgreSQL Password

### Step 3: Upload customers.db

```bash
az storage blob upload \
  --account-name stmultiagentprod \
  --container-name databases \
  --name customers.db \
  --file apps/adk/orchestration_agent/database/customers.db
```

### Step 4: Configure GitHub Secrets

Get ACR credentials:
```bash
az acr credential show --name acrmultiagentprod
```

Create Service Principal:
```bash
az ad sp create-for-rbac \
  --name "github-actions-multiagent" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUB_ID/resourceGroups/rg-multiagent-prod \
  --sdk-auth
```

Add to GitHub → Settings → Secrets:
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_CREDENTIALS` (entire JSON output)

### Step 5: Deploy!

```bash
git add .
git commit -m "feat: initial Azure deployment"
git push origin prod
```

**GitHub Actions automatically deploys in 3-5 minutes!**

---

## 💰 Monthly Cost: ~$70-85

| Service | Cost |
|---------|------|
| Container Apps (2x with scale-to-zero) | $25-40 |
| PostgreSQL Burstable B1ms | $28-32 |
| Storage + Registry + Key Vault | $7-8 |
| Monitoring | $8-10 |
| **TOTAL** | **$68-90** |

---

## 🔄 Future Deployments (3-5 Minutes Each)

```bash
# 1. Make code changes
# 2. Test locally
# 3. Push to prod
git push origin prod

# ✨ Auto-deploys in 3-5 minutes!
```

---

## 📊 Architecture Deployed

```
Frontend (Next.js)
    ↓ HTTPS
ADK Backend (FastAPI + Google ADK)
    ↓ Private Endpoint
PostgreSQL Database
```

**2 containers only** (server/gateway not needed!)

---

## 🔗 Get Your Application URLs

After deployment:

```bash
# Frontend URL
az containerapp show \
  --name ca-multiagent-frontend \
  --resource-group rg-multiagent-prod \
  --query properties.configuration.ingress.fqdn

# Backend URL
az containerapp show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --query properties.configuration.ingress.fqdn
```

---

## 🛠️ Common Operations

### Update API Keys
```bash
# Update in Key Vault
az keyvault secret set \
  --vault-name kv-multiagent-prod \
  --name google-api-key \
  --value "NEW_KEY"

# Restart container
az containerapp restart \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod
```

### View Logs
```bash
az containerapp logs show \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod \
  --follow
```

### Rollback
```bash
# List revisions
az containerapp revision list \
  --name ca-multiagent-adk \
  --resource-group rg-multiagent-prod

# Activate previous revision
az containerapp revision activate \
  --revision PREVIOUS_REVISION_NAME \
  --resource-group rg-multiagent-prod
```

---

## ✅ What Works Automatically

- ✅ **Auto-scaling** (0-4 replicas based on load)
- ✅ **Scale-to-zero** (saves cost when idle)
- ✅ **HTTPS/SSL** (free managed certificates)
- ✅ **Zero-downtime deployments** (blue-green)
- ✅ **Health checks** (automatic restart if unhealthy)
- ✅ **Automated backups** (PostgreSQL 7-day retention)
- ✅ **Secrets management** (Key Vault integration)
- ✅ **Monitoring** (Application Insights + Logs)

---

## 📚 Full Documentation

See `AZURE_DEPLOYMENT_GUIDE.md` for:
- Complete step-by-step guide
- Troubleshooting
- Maintenance procedures
- Cost management
- Rollback procedures

---

## 🎉 Summary

**You're ready to deploy!**

1. **Now:** Login to Azure (`az login`)
2. **Next:** Run `./infrastructure/azure-deploy.sh` (15-20 min)
3. **Then:** Configure GitHub Secrets
4. **Finally:** `git push origin prod` (3-5 min)

**Total time: ~30 minutes for first deployment**

**Future deployments: Just `git push` (3-5 minutes)** 🚀

---

**Questions?** Check `AZURE_DEPLOYMENT_GUIDE.md` or Azure Monitor logs!
