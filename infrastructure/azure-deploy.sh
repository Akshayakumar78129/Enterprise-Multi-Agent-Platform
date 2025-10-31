#!/bin/bash

# ============================================================================
# Azure Multi-Agent Platform - Infrastructure Deployment Script
# ============================================================================
# This script creates all required Azure resources for the application
# Run this ONCE for initial setup
# ============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (EDIT THESE VALUES)
RESOURCE_GROUP="rg-multiagent-prod"
LOCATION="eastus"  # Change if needed (e.g., westus, centralus, etc.)
ACR_NAME="acrmultiagentprod"
POSTGRES_SERVER_NAME="multiagent-prod-db"
KEY_VAULT_NAME="kv-multiagent-prod"
STORAGE_ACCOUNT_NAME="stmultiagentprod"
LOG_WORKSPACE_NAME="law-multiagent-prod"
APP_INSIGHTS_NAME="ai-multiagent-prod"
CONTAINER_APP_ENV="cae-multiagent-prod"

# Container App names
FRONTEND_APP="ca-multiagent-frontend"
ADK_BACKEND_APP="ca-multiagent-adk"

# Database configuration
DB_ADMIN_USER="enterpriseiq"
DB_NAME="enterpriseiq"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Azure Multi-Agent Platform - Infrastructure Deployment${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI is installed${NC}"

# Check if logged in
echo ""
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Azure. Please login first.${NC}"
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Logged in to Azure${NC}"
echo -e "   Subscription: ${SUBSCRIPTION_NAME}"
echo -e "   ID: ${SUBSCRIPTION_ID}"

# Prompt for secrets
echo ""
echo -e "${YELLOW}============================================================================${NC}"
echo -e "${YELLOW}Please enter your API keys and database password:${NC}"
echo -e "${YELLOW}============================================================================${NC}"
read -sp "Google API Key (for Gemini): " GOOGLE_API_KEY
echo ""
read -sp "Deepgram API Key: " DEEPGRAM_API_KEY
echo ""
read -sp "PostgreSQL Admin Password: " DB_ADMIN_PASSWORD
echo ""
echo ""

# ============================================================================
# Step 1: Create Resource Group
# ============================================================================
echo -e "${BLUE}[Step 1/12] Creating Resource Group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Resource group already exists, skipping...${NC}"
else
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION \
        --output none
    echo -e "${GREEN}✅ Resource group created${NC}"
fi

# ============================================================================
# Step 2: Create Container Registry (ACR)
# ============================================================================
echo ""
echo -e "${BLUE}[Step 2/12] Creating Azure Container Registry...${NC}"
if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  ACR already exists, skipping...${NC}"
else
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true \
        --output none
    echo -e "${GREEN}✅ Container Registry created${NC}"
fi

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# ============================================================================
# Step 3: Create Key Vault
# ============================================================================
echo ""
echo -e "${BLUE}[Step 3/12] Creating Azure Key Vault...${NC}"
if az keyvault show --name $KEY_VAULT_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Key Vault already exists, skipping...${NC}"
else
    az keyvault create \
        --name $KEY_VAULT_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --enable-rbac-authorization false \
        --output none
    echo -e "${GREEN}✅ Key Vault created${NC}"
fi

# ============================================================================
# Step 4: Store Secrets in Key Vault
# ============================================================================
echo ""
echo -e "${BLUE}[Step 4/12] Storing secrets in Key Vault...${NC}"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "google-api-key" --value "$GOOGLE_API_KEY" --output none
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "deepgram-api-key" --value "$DEEPGRAM_API_KEY" --output none
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "db-admin-password" --value "$DB_ADMIN_PASSWORD" --output none
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "db-user" --value "$DB_ADMIN_USER" --output none
echo -e "${GREEN}✅ Secrets stored in Key Vault${NC}"

# ============================================================================
# Step 5: Create Storage Account
# ============================================================================
echo ""
echo -e "${BLUE}[Step 5/12] Creating Storage Account...${NC}"
if az storage account show --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Storage Account already exists, skipping...${NC}"
else
    az storage account create \
        --name $STORAGE_ACCOUNT_NAME \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_LRS \
        --kind StorageV2 \
        --output none
    echo -e "${GREEN}✅ Storage Account created${NC}"
fi

# Create blob container for databases
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT_NAME --query '[0].value' -o tsv)
az storage container create \
    --name databases \
    --account-name $STORAGE_ACCOUNT_NAME \
    --account-key $STORAGE_KEY \
    --output none || true
echo -e "${GREEN}✅ Blob container 'databases' created${NC}"

# ============================================================================
# Step 6: Create Log Analytics Workspace
# ============================================================================
echo ""
echo -e "${BLUE}[Step 6/12] Creating Log Analytics Workspace...${NC}"
if az monitor log-analytics workspace show --resource-group $RESOURCE_GROUP --workspace-name $LOG_WORKSPACE_NAME &> /dev/null; then
    echo -e "${YELLOW}⚠️  Log Analytics Workspace already exists, skipping...${NC}"
else
    az monitor log-analytics workspace create \
        --resource-group $RESOURCE_GROUP \
        --workspace-name $LOG_WORKSPACE_NAME \
        --location $LOCATION \
        --output none
    echo -e "${GREEN}✅ Log Analytics Workspace created${NC}"
fi

LOG_WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_WORKSPACE_NAME \
    --query customerId -o tsv)

LOG_WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_WORKSPACE_NAME \
    --query primarySharedKey -o tsv)

# ============================================================================
# Step 7: Create Application Insights
# ============================================================================
echo ""
echo -e "${BLUE}[Step 7/12] Creating Application Insights...${NC}"
if az monitor app-insights component show --app $APP_INSIGHTS_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Application Insights already exists, skipping...${NC}"
else
    az monitor app-insights component create \
        --app $APP_INSIGHTS_NAME \
        --location $LOCATION \
        --resource-group $RESOURCE_GROUP \
        --workspace $LOG_WORKSPACE_ID \
        --output none
    echo -e "${GREEN}✅ Application Insights created${NC}"
fi

# ============================================================================
# Step 8: Create PostgreSQL Flexible Server
# ============================================================================
echo ""
echo -e "${BLUE}[Step 8/12] Creating PostgreSQL Flexible Server...${NC}"
echo -e "${YELLOW}⚠️  This may take 5-10 minutes...${NC}"
if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL server already exists, skipping...${NC}"
else
    az postgres flexible-server create \
        --resource-group $RESOURCE_GROUP \
        --name $POSTGRES_SERVER_NAME \
        --location $LOCATION \
        --admin-user $DB_ADMIN_USER \
        --admin-password "$DB_ADMIN_PASSWORD" \
        --sku-name Standard_B1ms \
        --tier Burstable \
        --version 15 \
        --storage-size 32 \
        --public-access 0.0.0.0-255.255.255.255 \
        --output none
    echo -e "${GREEN}✅ PostgreSQL server created${NC}"
fi

# Create database
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER_NAME \
    --database-name $DB_NAME \
    --output none || true

POSTGRES_HOST=$(az postgres flexible-server show \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER_NAME \
    --query fullyQualifiedDomainName -o tsv)

# Store database host in Key Vault
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "db-host" --value "$POSTGRES_HOST" --output none
echo -e "${GREEN}✅ Database created: $DB_NAME${NC}"

# ============================================================================
# Step 9: Create Container Apps Environment
# ============================================================================
echo ""
echo -e "${BLUE}[Step 9/12] Creating Container Apps Environment...${NC}"
if az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Container Apps Environment already exists, skipping...${NC}"
else
    az containerapp env create \
        --name $CONTAINER_APP_ENV \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --logs-workspace-id $LOG_WORKSPACE_ID \
        --logs-workspace-key $LOG_WORKSPACE_KEY \
        --output none
    echo -e "${GREEN}✅ Container Apps Environment created${NC}"
fi

# ============================================================================
# Step 10: Create ADK Backend Container App
# ============================================================================
echo ""
echo -e "${BLUE}[Step 10/12] Creating ADK Backend Container App...${NC}"
if az containerapp show --name $ADK_BACKEND_APP --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  ADK Backend Container App already exists, skipping...${NC}"
else
    # Create with placeholder image (will be replaced by CI/CD)
    az containerapp create \
        --name $ADK_BACKEND_APP \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_APP_ENV \
        --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
        --target-port 8000 \
        --ingress external \
        --min-replicas 0 \
        --max-replicas 4 \
        --cpu 1.0 \
        --memory 2.0Gi \
        --registry-server $ACR_NAME.azurecr.io \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --output none
    echo -e "${GREEN}✅ ADK Backend Container App created${NC}"
fi

# ============================================================================
# Step 11: Create Frontend Container App
# ============================================================================
echo ""
echo -e "${BLUE}[Step 11/12] Creating Frontend Container App...${NC}"
if az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}⚠️  Frontend Container App already exists, skipping...${NC}"
else
    az containerapp create \
        --name $FRONTEND_APP \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_APP_ENV \
        --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
        --target-port 3000 \
        --ingress external \
        --min-replicas 0 \
        --max-replicas 3 \
        --cpu 0.5 \
        --memory 1.0Gi \
        --registry-server $ACR_NAME.azurecr.io \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --output none
    echo -e "${GREEN}✅ Frontend Container App created${NC}"
fi

# ============================================================================
# Step 12: Display Summary
# ============================================================================
echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✅ Infrastructure deployment completed successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${BLUE}Resource Summary:${NC}"
echo -e "  📁 Resource Group: ${YELLOW}$RESOURCE_GROUP${NC}"
echo -e "  📦 Container Registry: ${YELLOW}$ACR_NAME.azurecr.io${NC}"
echo -e "  🗄️  PostgreSQL Server: ${YELLOW}$POSTGRES_HOST${NC}"
echo -e "  🔐 Key Vault: ${YELLOW}$KEY_VAULT_NAME${NC}"
echo -e "  💾 Storage Account: ${YELLOW}$STORAGE_ACCOUNT_NAME${NC}"
echo -e "  📊 Log Analytics: ${YELLOW}$LOG_WORKSPACE_NAME${NC}"
echo -e "  📈 App Insights: ${YELLOW}$APP_INSIGHTS_NAME${NC}"
echo ""
echo -e "${BLUE}Container Apps (placeholder images):${NC}"
echo -e "  🚀 Frontend: ${YELLOW}$FRONTEND_APP${NC}"
echo -e "  ⚙️  ADK Backend: ${YELLOW}$ADK_BACKEND_APP${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Upload customers.db to Azure Blob Storage:"
echo -e "     ${GREEN}az storage blob upload --account-name $STORAGE_ACCOUNT_NAME --container-name databases --name customers.db --file apps/adk/orchestration_agent/database/customers.db${NC}"
echo ""
echo -e "  2. Configure GitHub Secrets for CI/CD:"
echo -e "     ${GREEN}ACR_USERNAME:${NC} $ACR_USERNAME"
echo -e "     ${GREEN}ACR_PASSWORD:${NC} (Copy from Azure Portal)"
echo -e "     ${GREEN}AZURE_CREDENTIALS:${NC} (Run az ad sp create-for-rbac command)"
echo ""
echo -e "  3. Migrate PostgreSQL database from Google Cloud to Azure"
echo ""
echo -e "  4. Push code to 'prod' branch to trigger deployment"
echo ""
echo -e "${BLUE}============================================================================${NC}"
