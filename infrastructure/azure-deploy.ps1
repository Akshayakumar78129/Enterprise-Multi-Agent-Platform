# ============================================================================
# Azure Multi-Agent Platform - Infrastructure Deployment Script (PowerShell)
# ============================================================================
# This script creates all required Azure resources for the application
# Run this ONCE for initial setup
# ============================================================================

# Color output functions
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Configuration
$RESOURCE_GROUP = "rg-multiagent-prod"
$LOCATION = "eastus"
$ACR_NAME = "acrmultiagentprod"
$POSTGRES_SERVER_NAME = "multiagent-prod-db"
$KEY_VAULT_NAME = "kv-multiagent-prod"
$STORAGE_ACCOUNT_NAME = "stmultiagentprod"
$LOG_WORKSPACE_NAME = "law-multiagent-prod"
$APP_INSIGHTS_NAME = "ai-multiagent-prod"
$CONTAINER_APP_ENV = "cae-multiagent-prod"
$FRONTEND_APP = "ca-multiagent-frontend"
$ADK_BACKEND_APP = "ca-multiagent-adk"
$DB_ADMIN_USER = "enterpriseiq"
$DB_NAME = "enterpriseiq"

Write-Info "============================================================================"
Write-Info "Azure Multi-Agent Platform - Infrastructure Deployment"
Write-Info "============================================================================"
Write-Host ""

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Success "✅ Azure CLI is installed"
} catch {
    Write-Error "❌ Azure CLI is not installed. Please install it first."
    Write-Host "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in
Write-Host ""
Write-Warning "Checking Azure login status..."
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if ($null -eq $account) {
        throw "Not logged in"
    }
    Write-Success "✅ Logged in to Azure"
    Write-Host "   Subscription: $($account.name)"
    Write-Host "   ID: $($account.id)"
} catch {
    Write-Error "❌ Not logged in to Azure. Please login first."
    az login
}

# Prompt for secrets
Write-Host ""
Write-Warning "============================================================================"
Write-Warning "Please enter your API keys and database password:"
Write-Warning "============================================================================"

$GOOGLE_API_KEY = Read-Host "Google API Key (from .env file)"
$DEEPGRAM_API_KEY = Read-Host "Deepgram API Key (from .env file)"
$DB_ADMIN_PASSWORD = Read-Host "PostgreSQL Admin Password (create a new one)" -AsSecureString
$DB_ADMIN_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_ADMIN_PASSWORD))

Write-Host ""

# ============================================================================
# Step 1: Create Resource Group
# ============================================================================
Write-Info "[Step 1/12] Creating Resource Group..."
try {
    az group show --name $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  Resource group already exists, skipping..."
} catch {
    az group create --name $RESOURCE_GROUP --location $LOCATION --output none
    Write-Success "✅ Resource group created"
}

# ============================================================================
# Step 2: Create Container Registry (ACR)
# ============================================================================
Write-Host ""
Write-Info "[Step 2/12] Creating Azure Container Registry..."
try {
    az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  ACR already exists, skipping..."
} catch {
    az acr create `
        --resource-group $RESOURCE_GROUP `
        --name $ACR_NAME `
        --sku Basic `
        --admin-enabled true `
        --output none
    Write-Success "✅ Container Registry created"
}

# Get ACR credentials
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

# ============================================================================
# Step 3: Create Key Vault
# ============================================================================
Write-Host ""
Write-Info "[Step 3/12] Creating Azure Key Vault..."
try {
    az keyvault show --name $KEY_VAULT_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  Key Vault already exists, skipping..."
} catch {
    az keyvault create `
        --name $KEY_VAULT_NAME `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --enable-rbac-authorization false `
        --output none
    Write-Success "✅ Key Vault created"
}

# ============================================================================
# Step 4: Store Secrets in Key Vault
# ============================================================================
Write-Host ""
Write-Info "[Step 4/12] Storing secrets in Key Vault..."
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "google-api-key" --value $GOOGLE_API_KEY --output none
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "deepgram-api-key" --value $DEEPGRAM_API_KEY --output none
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "db-admin-password" --value $DB_ADMIN_PASSWORD_PLAIN --output none
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "db-user" --value $DB_ADMIN_USER --output none
Write-Success "✅ Secrets stored in Key Vault"

# ============================================================================
# Step 5: Create Storage Account
# ============================================================================
Write-Host ""
Write-Info "[Step 5/12] Creating Storage Account..."
try {
    az storage account show --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  Storage Account already exists, skipping..."
} catch {
    az storage account create `
        --name $STORAGE_ACCOUNT_NAME `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --sku Standard_LRS `
        --kind StorageV2 `
        --output none
    Write-Success "✅ Storage Account created"
}

# Create blob container for databases
$STORAGE_KEY = az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT_NAME --query '[0].value' -o tsv
az storage container create `
    --name databases `
    --account-name $STORAGE_ACCOUNT_NAME `
    --account-key $STORAGE_KEY `
    --output none 2>$null
Write-Success "✅ Blob container 'databases' created"

# ============================================================================
# Step 6: Create Log Analytics Workspace
# ============================================================================
Write-Host ""
Write-Info "[Step 6/12] Creating Log Analytics Workspace..."
try {
    az monitor log-analytics workspace show --resource-group $RESOURCE_GROUP --workspace-name $LOG_WORKSPACE_NAME 2>$null | Out-Null
    Write-Warning "⚠️  Log Analytics Workspace already exists, skipping..."
} catch {
    az monitor log-analytics workspace create `
        --resource-group $RESOURCE_GROUP `
        --workspace-name $LOG_WORKSPACE_NAME `
        --location $LOCATION `
        --output none
    Write-Success "✅ Log Analytics Workspace created"
}

$LOG_WORKSPACE_ID = az monitor log-analytics workspace show `
    --resource-group $RESOURCE_GROUP `
    --workspace-name $LOG_WORKSPACE_NAME `
    --query customerId -o tsv

$LOG_WORKSPACE_KEY = az monitor log-analytics workspace get-shared-keys `
    --resource-group $RESOURCE_GROUP `
    --workspace-name $LOG_WORKSPACE_NAME `
    --query primarySharedKey -o tsv

# ============================================================================
# Step 7: Create Application Insights
# ============================================================================
Write-Host ""
Write-Info "[Step 7/12] Creating Application Insights..."
try {
    az monitor app-insights component show --app $APP_INSIGHTS_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  Application Insights already exists, skipping..."
} catch {
    az monitor app-insights component create `
        --app $APP_INSIGHTS_NAME `
        --location $LOCATION `
        --resource-group $RESOURCE_GROUP `
        --workspace $LOG_WORKSPACE_ID `
        --output none
    Write-Success "✅ Application Insights created"
}

# ============================================================================
# Step 8: Create PostgreSQL Flexible Server
# ============================================================================
Write-Host ""
Write-Info "[Step 8/12] Creating PostgreSQL Flexible Server..."
Write-Warning "⚠️  This may take 5-10 minutes..."

try {
    az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME 2>$null | Out-Null
    Write-Warning "⚠️  PostgreSQL server already exists, skipping..."
} catch {
    az postgres flexible-server create `
        --resource-group $RESOURCE_GROUP `
        --name $POSTGRES_SERVER_NAME `
        --location $LOCATION `
        --admin-user $DB_ADMIN_USER `
        --admin-password $DB_ADMIN_PASSWORD_PLAIN `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --version 15 `
        --storage-size 32 `
        --public-access 0.0.0.0-255.255.255.255 `
        --output none
    Write-Success "✅ PostgreSQL server created"
}

# Create database
az postgres flexible-server db create `
    --resource-group $RESOURCE_GROUP `
    --server-name $POSTGRES_SERVER_NAME `
    --database-name $DB_NAME `
    --output none 2>$null

$POSTGRES_HOST = az postgres flexible-server show `
    --resource-group $RESOURCE_GROUP `
    --name $POSTGRES_SERVER_NAME `
    --query fullyQualifiedDomainName -o tsv

# Store database host in Key Vault
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "db-host" --value $POSTGRES_HOST --output none
Write-Success "✅ Database created: $DB_NAME"

# ============================================================================
# Step 9: Create Container Apps Environment
# ============================================================================
Write-Host ""
Write-Info "[Step 9/12] Creating Container Apps Environment..."
try {
    az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  Container Apps Environment already exists, skipping..."
} catch {
    az containerapp env create `
        --name $CONTAINER_APP_ENV `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION `
        --logs-workspace-id $LOG_WORKSPACE_ID `
        --logs-workspace-key $LOG_WORKSPACE_KEY `
        --output none
    Write-Success "✅ Container Apps Environment created"
}

# ============================================================================
# Step 10: Create ADK Backend Container App
# ============================================================================
Write-Host ""
Write-Info "[Step 10/12] Creating ADK Backend Container App..."
try {
    az containerapp show --name $ADK_BACKEND_APP --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  ADK Backend Container App already exists, skipping..."
} catch {
    az containerapp create `
        --name $ADK_BACKEND_APP `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_APP_ENV `
        --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
        --target-port 8000 `
        --ingress external `
        --min-replicas 0 `
        --max-replicas 4 `
        --cpu 1.0 `
        --memory 2.0Gi `
        --registry-server "$ACR_NAME.azurecr.io" `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --output none
    Write-Success "✅ ADK Backend Container App created"
}

# ============================================================================
# Step 11: Create Frontend Container App
# ============================================================================
Write-Host ""
Write-Info "[Step 11/12] Creating Frontend Container App..."
try {
    az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP 2>$null | Out-Null
    Write-Warning "⚠️  Frontend Container App already exists, skipping..."
} catch {
    az containerapp create `
        --name $FRONTEND_APP `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_APP_ENV `
        --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
        --target-port 3000 `
        --ingress external `
        --min-replicas 0 `
        --max-replicas 3 `
        --cpu 0.5 `
        --memory 1.0Gi `
        --registry-server "$ACR_NAME.azurecr.io" `
        --registry-username $ACR_USERNAME `
        --registry-password $ACR_PASSWORD `
        --output none
    Write-Success "✅ Frontend Container App created"
}

# ============================================================================
# Step 12: Display Summary
# ============================================================================
Write-Host ""
Write-Success "============================================================================"
Write-Success "✅ Infrastructure deployment completed successfully!"
Write-Success "============================================================================"
Write-Host ""
Write-Info "Resource Summary:"
Write-Host "  📁 Resource Group: " -NoNewline; Write-Warning $RESOURCE_GROUP
Write-Host "  📦 Container Registry: " -NoNewline; Write-Warning "$ACR_NAME.azurecr.io"
Write-Host "  🗄️  PostgreSQL Server: " -NoNewline; Write-Warning $POSTGRES_HOST
Write-Host "  🔐 Key Vault: " -NoNewline; Write-Warning $KEY_VAULT_NAME
Write-Host "  💾 Storage Account: " -NoNewline; Write-Warning $STORAGE_ACCOUNT_NAME
Write-Host ""
Write-Info "Container Apps (placeholder images):"
Write-Host "  🚀 Frontend: " -NoNewline; Write-Warning $FRONTEND_APP
Write-Host "  ⚙️  ADK Backend: " -NoNewline; Write-Warning $ADK_BACKEND_APP
Write-Host ""
Write-Warning "============================================================================"
Write-Warning "⚠️  SAVE THESE CREDENTIALS FOR GITHUB SECRETS:"
Write-Warning "============================================================================"
Write-Host "ACR_USERNAME: " -NoNewline; Write-Host $ACR_USERNAME -ForegroundColor Cyan
Write-Host "ACR_PASSWORD: " -NoNewline; Write-Host $ACR_PASSWORD -ForegroundColor Cyan
Write-Host ""
Write-Info "Next Steps:"
Write-Host "  1. Upload customers.db to Azure Blob Storage"
Write-Host "  2. Configure GitHub Secrets (ACR_USERNAME, ACR_PASSWORD, AZURE_CREDENTIALS)"
Write-Host "  3. Push code to 'prod' branch to trigger deployment"
Write-Host ""
Write-Success "============================================================================"
Write-Host ""
