#!/bin/bash

# =============================================================================
# API Gateway Startup Script
# Phase 6: Configuration & Deployment
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Starting API Gateway...${NC}"
echo -e "${BLUE}Project Directory: ${PROJECT_DIR}${NC}"

# Change to project directory
cd "$PROJECT_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 1  # Port is occupied
    else
        return 0  # Port is available
    fi
}

# Check dependencies
echo -e "${YELLOW}📋 Checking dependencies...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example${NC}"
        cp .env.example .env
        echo -e "${YELLOW}📝 Please configure .env file with your settings${NC}"
    else
        echo -e "${RED}❌ No .env or .env.example file found${NC}"
        exit 1
    fi
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default port if not specified
PORT=${PORT:-3001}

# Check if port is available
if ! check_port $PORT; then
    echo -e "${RED}❌ Port $PORT is already in use${NC}"
    echo -e "${YELLOW}💡 You can change the port in your .env file${NC}"
    exit 1
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}📁 Creating logs directory...${NC}"
    mkdir -p logs
fi

# Check database files exist (for SQLite)
if [ "$DATABASE_TYPE" = "sqlite" ]; then
    echo -e "${YELLOW}🗄️  Checking database files...${NC}"
    
    if [ ! -z "$DATABASE_PATH" ] && [ ! -f "$DATABASE_PATH" ]; then
        echo -e "${YELLOW}⚠️  Database file not found: $DATABASE_PATH${NC}"
    fi
    
    if [ ! -z "$SALES_DATABASE_PATH" ] && [ ! -f "$SALES_DATABASE_PATH" ]; then
        echo -e "${YELLOW}⚠️  Sales database file not found: $SALES_DATABASE_PATH${NC}"
    fi
    
    if [ ! -z "$INVENTORY_DATABASE_PATH" ] && [ ! -f "$INVENTORY_DATABASE_PATH" ]; then
        echo -e "${YELLOW}⚠️  Inventory database file not found: $INVENTORY_DATABASE_PATH${NC}"
    fi
fi

# Choose startup method
STARTUP_MODE=${1:-development}

case $STARTUP_MODE in
    "development" | "dev")
        echo -e "${GREEN}🔧 Starting in development mode...${NC}"
        if command_exists nodemon; then
            echo -e "${BLUE}Using nodemon for auto-restart${NC}"
            npm run dev
        else
            echo -e "${BLUE}Starting with node (install nodemon for auto-restart)${NC}"
            node server.js
        fi
        ;;
    
    "production" | "prod")
        echo -e "${GREEN}🚀 Starting in production mode...${NC}"
        if command_exists pm2; then
            echo -e "${BLUE}Using PM2 for process management${NC}"
            pm2 start ecosystem.config.js --env production
            pm2 logs api-gateway
        else
            echo -e "${YELLOW}PM2 not found, starting with node${NC}"
            NODE_ENV=production node server.js
        fi
        ;;
    
    "pm2")
        echo -e "${GREEN}🔄 Starting with PM2...${NC}"
        if ! command_exists pm2; then
            echo -e "${RED}❌ PM2 is not installed${NC}"
            echo -e "${YELLOW}Install with: npm install -g pm2${NC}"
            exit 1
        fi
        
        pm2 start ecosystem.config.js
        pm2 save
        echo -e "${GREEN}✅ API Gateway started with PM2${NC}"
        echo -e "${BLUE}💡 Use 'pm2 logs api-gateway' to view logs${NC}"
        echo -e "${BLUE}💡 Use 'pm2 status' to check status${NC}"
        ;;
    
    "cluster")
        echo -e "${GREEN}🔀 Starting in cluster mode...${NC}"
        NODE_ENV=production node --experimental-worker server.js
        ;;
        
    "debug")
        echo -e "${GREEN}🐛 Starting in debug mode...${NC}"
        DEBUG_ENABLED=true LOG_LEVEL=debug node --inspect server.js
        ;;
    
    *)
        echo -e "${RED}❌ Unknown startup mode: $STARTUP_MODE${NC}"
        echo -e "${YELLOW}Available modes: development, production, pm2, cluster, debug${NC}"
        exit 1
        ;;
esac