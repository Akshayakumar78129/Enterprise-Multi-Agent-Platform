# Enterprise Multi-Agent Platform - Onboarding Guide

Welcome to the Enterprise Multi-Agent Platform! This guide will help you get up to speed quickly as a new developer joining the project.

---

## Table of Contents

1. [Welcome & Project Overview](#1-welcome--project-overview)
2. [Architecture Deep Dive](#2-architecture-deep-dive)
3. [Technology Stack](#3-technology-stack)
4. [Folder Structure](#4-folder-structure)
5. [Local Development Setup](#5-local-development-setup)
6. [Running the Application](#6-running-the-application)
7. [Project Structure Details](#7-project-structure-details)
8. [Development Workflow](#8-development-workflow)
9. [Key Concepts](#9-key-concepts)
10. [Next Steps & Resources](#10-next-steps--resources)

---

## 1. Welcome & Project Overview

### What is the Enterprise Multi-Agent Platform?

The Enterprise Multi-Agent Platform is an **AI-powered business intelligence and data analytics system** that revolutionizes how organizations interact with their data. Unlike traditional BI dashboards, this platform features:

- **AI-Driven Interface**: Natural language queries that generate interactive visualizations on demand
- **Multi-Agent Architecture**: Specialized AI agents for different business domains (Customer, Sales, Finance, Inventory)
- **Real-Time Insights**: Streaming responses with Server-Sent Events (SSE)
- **ML-Powered Analytics**: Advanced machine learning models for predictions and anomaly detection
- **Domain-Specific Tools**: 30+ analytical tools covering customer behavior, sales forecasting, inventory optimization, and financial analysis

### How It Works

1. **User asks a question** in natural language (text or voice)
2. **Orchestration Agent** decomposes the query into subtasks
3. **Specialized Agents** process subtasks using domain-specific tools and ML models
4. **Backend processes** data from SQLite/PostgreSQL databases
5. **Frontend displays** interactive dashboards with real-time streaming updates
6. **AI narrates insights** while spawning visualizations dynamically

### Key Features

- **Multi-Agent Orchestration**: Google ADK-powered agent system with intelligent task delegation
- **30+ Analytics Dashboards**: Pre-built dashboards for various business metrics
- **Machine Learning Models**: Churn prediction, anomaly detection, customer segmentation, demand forecasting
- **Real-Time Streaming**: SSE-based communication for live AI responses
- **Voice Interface**: Speech-to-text and text-to-speech integration
- **Dynamic Visualizations**: AI-controlled component spawning on interactive canvas
- **Domain-Driven Design**: Organized around 4 key business domains

### Target Users

- **Business Analysts**: Explore data through natural language queries
- **Data Scientists**: Leverage ML models and analytical tools
- **Executives**: Get quick insights and forecasts
- **Operations Teams**: Monitor real-time metrics and anomalies

---

## 2. Architecture Deep Dive

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  Next.js 15.5 + React 19 + Redux + TailwindCSS                 │
│  - 30+ Dashboard Routes                                          │
│  - Dynamic Component System                                      │
│  - Real-time SSE Event Handling                                  │
└─────────────┬───────────────────────────────────────────────────┘
              │ HTTP/SSE (Port 3000 → 8000)
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
│  FastAPI + Uvicorn (Python 3.8+)                                │
│  - AI Agent Endpoints (/run_sse)                                │
│  - Dashboard APIs (/api/*)                                       │
│  - SSE Streaming                                                 │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Agent Orchestration                     │
│  Google ADK (Agent Development Kit)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Orchestration Agent (Root)                               │  │
│  │  - Decomposes user queries                                │  │
│  │  - Routes to specialized agents                           │  │
│  │  - Aggregates responses                                   │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     ↓                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Specialized Sub-Agents                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │  Customer   │  │   Sales     │  │  Financial  │      │  │
│  │  │  Insights   │  │  Analyst    │  │   Agent     │ ...  │  │
│  │  │  Agent      │  │   Agent     │  │             │      │  │
│  │  │  (12 tools) │  │  (5 tools)  │  │  (2 tools)  │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                                │
│  Processing Services + ML Models                                 │
│  - ChurnProcessingService                                        │
│  - AnomalyProcessingService                                      │
│  - CustomerBehaviorProcessingService                             │
│  - SalesPerformanceProcessingService                             │
│  - 15+ more domain-specific services                             │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  SQLite Databases (4 domain-specific DBs)                        │
│  - customers.db        (Customer data)                           │
│  - sales_agent.db      (Sales transactions)                      │
│  - financial_agent.db  (Financial metrics)                       │
│  - inventory.db        (Stock levels)                            │
│                                                                   │
│  PostgreSQL (Optional, for production)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Query Flow (User → AI → Dashboard)**:

```
1. User enters query in frontend
   ↓
2. Frontend sends POST to /run_sse endpoint
   ↓
3. FastAPI receives request, forwards to Orchestration Agent
   ↓
4. Orchestration Agent analyzes query, delegates to sub-agents
   ↓
5. Sub-agents execute tools, query databases, run ML models
   ↓
6. Results stream back via SSE (Server-Sent Events)
   ↓
7. Frontend parses SSE events, spawns visualizations
   ↓
8. User sees interactive dashboard with AI narration
```

**Dashboard Flow (Direct API)**:

```
1. Dashboard component loads
   ↓
2. Fetches data from /api/{domain}/{endpoint}
   ↓
3. FastAPI router calls ProcessingService
   ↓
4. Service queries database, processes data, applies ML if needed
   ↓
5. Returns JSON response with summary, insights, data
   ↓
6. Dashboard renders KPIs, charts, tables
```

### Multi-Agent System

The platform uses **Google's Agent Development Kit (ADK)** to implement a sophisticated multi-agent architecture:

**Orchestration Agent (Root)**:

- Receives all user queries
- Decomposes complex requests into subtasks
- Routes subtasks to appropriate specialized agents
- Aggregates responses from multiple agents
- Maintains conversation context

**Specialized Sub-Agents**:

1. **Customer Insights Agent** (12 tools)
   - Customer segmentation
   - Churn prediction
   - Lifetime value calculation
   - Engagement analysis
   - Behavior pattern detection
   - Transaction analysis
   - Anomaly detection
   - Next purchase prediction
   - Retention planning

2. **Sales Analyst Agent** (5 tools)
   - Regional sales analysis
   - Product performance
   - Sales trends
   - Demand forecasting
   - Performance metrics

3. **Financial Agent** (2 tools)
   - Cash flow analysis
   - Revenue forecasting

4. **Inventory Manager Agent** (4 tools)
   - Holding cost analysis
   - Inventory level monitoring
   - Slow-moving inventory detection
   - Stock optimization

### Technology Integration Points

- **Google Gemini 2.5**: AI model for agent reasoning and natural language understanding
- **Deepgram API**: Speech-to-text and text-to-speech for voice interface
- **LiteLLM**: Support for alternative models (Groq, Cerebras)
- **Redis** (optional): Caching layer for ML models and dashboard data
- **PostgreSQL**: Production database option
- **SQLite**: Development and demo databases

---

## 3. Technology Stack

### Frontend Technologies

| Technology        | Version | Purpose                                              |
| ----------------- | ------- | ---------------------------------------------------- |
| **Next.js**       | 15.5.3  | React framework with App Router, SSR, and API routes |
| **React**         | 19.1.1  | UI library for building interactive components       |
| **TypeScript**    | 5.8.3   | Type-safe JavaScript for better DX                   |
| **Redux Toolkit** | 1.9.7   | State management for complex data flows              |
| **TailwindCSS**   | 3.4.1   | Utility-first CSS framework                          |
| **Recharts**      | 3.1.2   | Chart library for data visualizations                |
| **Lucide React**  | 0.542.0 | Icon library                                         |
| **UUID**          | 11.1.0  | Unique identifier generation                         |

### Backend Technologies

| Technology          | Version | Purpose                                   |
| ------------------- | ------- | ----------------------------------------- |
| **Python**          | 3.8+    | Backend programming language              |
| **FastAPI**         | Latest  | Modern API framework with OpenAPI support |
| **Uvicorn**         | Latest  | ASGI server for async Python              |
| **Google ADK**      | 1.6.1   | Multi-agent orchestration framework       |
| **Pandas**          | Latest  | Data manipulation and analysis            |
| **NumPy**           | Latest  | Numerical computing                       |
| **scikit-learn**    | Latest  | Machine learning algorithms               |
| **XGBoost**         | Latest  | Gradient boosting for ML models           |
| **LightGBM**        | Latest  | Gradient boosting framework               |
| **PyTorch**         | Latest  | Deep learning framework                   |
| **Plotly**          | 5.13.0+ | Interactive visualizations                |
| **Pydantic**        | Latest  | Data validation with type hints           |
| **aiosqlite**       | 0.19.0+ | Async SQLite client                       |
| **psycopg2-binary** | 2.9.9+  | PostgreSQL adapter                        |

### AI/ML Technologies

| Technology            | Purpose                              |
| --------------------- | ------------------------------------ |
| **Google Gemini 2.5** | Primary AI model for agents          |
| **LiteLLM**           | Multi-model support (Groq, Cerebras) |
| **Deepgram**          | Voice interface (STT/TTS)            |
| **AgentOps**          | Agent monitoring and observability   |
| **Isolation Forest**  | Anomaly detection                    |
| **Random Forest**     | Various ML predictions               |
| **XGBoost**           | Advanced gradient boosting           |
| **K-Means**           | Customer segmentation                |

### Build & Development Tools

| Tool          | Purpose                            |
| ------------- | ---------------------------------- |
| **Turborepo** | Monorepo build system with caching |
| **pnpm**      | Fast, efficient package manager    |
| **ESLint**    | JavaScript/TypeScript linting      |
| **Prettier**  | Code formatting                    |
| **pytest**    | Python testing framework           |

### Database Technologies

- **SQLite**: Development databases (4 domain-specific DBs)
- **PostgreSQL**: Production database option
- **Redis**: Caching layer (optional)

---

## 4. Folder Structure

### High-Level Structure

```
Enterprise-Multi-Agent-Platform/
├── apps/                          # Main applications
│   ├── adk/                       # ✅ ACTIVE - Python backend with AI agents
│   ├── frontend/                  # ✅ ACTIVE - Next.js frontend
│   ├── server/                    # ⚠️  LEGACY - Being migrated to adk
│   └── web/                       # ⚠️  LEGACY - Being migrated to frontend
├── packages/                      # Shared packages
│   ├── components/                # Shared React components
│   └── constants/                 # Shared constants
├── onboarding/                    # 📘 YOU ARE HERE
├── node_modules/                  # Node.js dependencies
├── .git/                          # Git repository
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── turbo.json                    # Turborepo configuration
├── README.md                     # Main README
└── AI_DOCS.md                    # AI system documentation
```

### Active Development: `/apps/adk` (Backend)

**Purpose**: Python-based backend with FastAPI, multi-agent AI system, ML models, and domain processing services.

```
apps/adk/
├── .env                          # Environment variables (API keys, DB config)
├── .venv/                        # Python virtual environment
├── main.py                       # 🚀 FastAPI application entry point
├── requirements.txt              # Python dependencies
├── dev.sh                        # Development startup script
├── start.sh                      # Production startup script
├── setup_db.py                   # Database initialization script
│
├── api/                          # FastAPI routers for dashboard APIs
│   └── routers/
│       ├── churn_router.py
│       ├── anomaly_router.py
│       ├── customer_behavior_router.py
│       ├── sales_performance_router.py
│       ├── product_performance_router.py
│       ├── inventory_level_router.py
│       ├── cash_flow_router.py
│       └── ... (20+ more routers)
│
├── domains/                      # Domain-specific business logic
│   ├── churn_prediction/
│   │   ├── processing_service.py  # Main service logic
│   │   ├── data_service.py        # Data access layer
│   │   ├── ml_predictor.py        # ML model
│   │   ├── models.py              # Data models
│   │   └── schema.py              # API schemas
│   ├── anomaly_detection/
│   ├── customer_behavior/
│   ├── customer_segmentation/
│   ├── sales_performance/
│   ├── product_performance/
│   ├── cash_flow/
│   ├── inventory_level/
│   └── ... (30+ domain folders)
│
├── database/                     # Database files and utilities
│   ├── connector.py              # Database connection management
│   ├── filter_engine.py          # Query filtering
│   └── customers.db              # SQLite database
│
├── orchestration_agent/          # Multi-agent system
│   ├── agent.py                  # Root orchestration agent
│   ├── prompt.py                 # Agent instructions
│   ├── tools/                    # Agent tools
│   └── database/                 # Agent-specific databases
│       ├── customers.db
│       ├── sales_agent.db
│       ├── financial_agent.db
│       └── inventory.db
│
├── customer/                     # Customer domain agent
│   ├── agent.py
│   └── prompt.py
│
├── sales/                        # Sales domain agent
│   ├── agent.py
│   └── prompt.py
│
├── finance/                      # Finance domain agent
│   ├── agent.py
│   └── prompt.py
│
├── inventory/                    # Inventory domain agent
│   ├── agent.py
│   └── prompt.py
│
└── lib/                          # Shared utilities
    └── utils.py                  # Helper functions
```

**Key Files**:

- `main.py` (580 lines): FastAPI app, SSE streaming, agent orchestration, API routers
- `dev.sh`: Sets up venv, installs deps, copies databases, starts uvicorn on port 8000
- `.env`: Contains API keys (GOOGLE_API_KEY, DEEPGRAM_API_KEY), database config

### Active Development: `/apps/frontend` (Frontend)

**Purpose**: Next.js 15 application with App Router, TypeScript, TailwindCSS, and 30+ dashboard routes.

```
apps/frontend/
├── .env                          # Environment variables
├── .next/                        # Next.js build output
├── node_modules/                 # Node.js dependencies
├── package.json                  # Frontend dependencies
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # TailwindCSS configuration
├── postcss.config.mjs            # PostCSS configuration
│
└── src/
    ├── app/                      # Next.js App Router
    │   ├── layout.tsx            # Root layout with providers
    │   ├── page.tsx              # Home page (redirects to /enterprise-iq)
    │   ├── globals.css           # Global styles
    │   │
    │   ├── providers/            # React context providers
    │   │   └── ReduxProvider.tsx
    │   │
    │   ├── components/           # Shared components
    │   │
    │   ├── enterprise-iq/        # Main dashboard entry
    │   │
    │   ├── churn-prediction/     # Churn prediction dashboard
    │   ├── anomaly-detection/    # Anomaly detection dashboard
    │   ├── customer-behavior/    # Customer behavior dashboard
    │   ├── customer-segmentation/ # Segmentation dashboard
    │   ├── customer-lifetime-value/
    │   ├── purchase-frequency/
    │   ├── transaction-patterns/
    │   ├── engagement-classifier/
    │   ├── next-purchase/
    │   ├── retention-planner/
    │   ├── customer-insights/
    │   ├── sales-performance/
    │   ├── product-performance/
    │   ├── sales-forecast/
    │   ├── revenue-analysis/
    │   ├── inventory-level/
    │   ├── cash-flow/
    │   ├── financial-overview/
    │   ├── expense-analysis/
    │   ├── profitability/
    │   └── ... (30+ dashboard routes)
    │
    └── store/                    # Redux store configuration
        └── index.ts
```

**Key Files**:

- `src/app/layout.tsx`: Root layout with Redux provider and theme provider
- `src/app/page.tsx`: Redirects to `/enterprise-iq`
- `.env`: Contains `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- Each dashboard folder typically contains `page.tsx` and components

### Legacy Folders (Being Migrated)

⚠️ **Important**: These folders are being phased out. New development should NOT go here.

- `/apps/server`: Legacy Python backend → Migrating to `/apps/adk`
- `/apps/web`: Legacy Next.js frontend → Migrating to `/apps/frontend`

Once migration is complete, these folders will be removed.

### Shared Packages: `/packages`

```
packages/
├── components/              # Shared React component library
│   ├── src/
│   │   ├── components/     # Component implementations
│   │   ├── styles.css      # Shared styles
│   │   └── index.ts        # Exports
│   ├── package.json
│   └── tsconfig.json
│
└── constants/               # Shared constants and types
    ├── src/
    │   └── index.ts
    └── package.json
```

These packages are imported in the frontend with `"components"` and `"constants"`.

---

## 5. Local Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **Python**: v3.8 or higher
- **pnpm**: v9.0.0 (required for monorepo)
- **Git**: For version control

**Check your versions**:

```bash
node --version    # Should be >= 18.0.0
python --version  # Should be >= 3.8
pnpm --version    # Should be >= 9.0.0
```

**Install pnpm** (if not installed):

```bash
npm install -g pnpm@9.0.0
```

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/Enterprise-Multi-Agent-Platform.git
cd Enterprise-Multi-Agent-Platform
```

### Step 2: Backend Setup (adk)

#### 2.1 Navigate to Backend Directory

```bash
cd apps/adk
```

#### 2.2 Create Python Virtual Environment

**On Windows (Git Bash/MINGW64)**:

```bash
python -m venv .venv
source .venv/Scripts/activate
```

**On macOS/Linux**:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

You should see `(.venv)` in your terminal prompt.

#### 2.3 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install 40+ packages including:

- FastAPI, Uvicorn
- Google ADK (google_adk==1.6.1)
- ML libraries (scikit-learn, XGBoost, LightGBM, PyTorch)
- Data processing (pandas, numpy, plotly)
- Database clients (aiosqlite, psycopg2-binary)
- AI integrations (litellm, agentops, google-genai, deepgram-sdk)

#### 2.4 Set Up Database Files

Run the database setup script:

```bash
python setup_db.py
```

This will:

- Download or initialize database files
- Create 4 domain-specific SQLite databases:
  - `orchestration_agent/database/customers.db`
  - `orchestration_agent/database/sales_agent.db`
  - `orchestration_agent/database/financial_agent.db`
  - `orchestration_agent/database/inventory.db`

#### 2.5 Configure Environment Variables

Create a `.env` file in `apps/adk/`:

```bash
# apps/adk/.env

# Google AI Configuration
GOOGLE_GENAI_USE_VERTEXAI=False
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Model Configuration (optional)
MODEL=gemini-2.5-flash
MODEL_PROVIDER=gemini

# Deepgram API (for voice features)
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# PostgreSQL Configuration (optional, for production)
DB_USER=enterpriseiq
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enterpriseiq
SSL_MODE=disable

# Server Configuration
PORT=8000
```

**Get API Keys**:

- **Google Gemini API Key**: [Get from Google AI Studio](https://makersuite.google.com/app/apikey)
- **Deepgram API Key**: [Sign up at Deepgram](https://deepgram.com/)

#### 2.6 Verify Backend Setup

You can test if the backend is ready:

```bash
python -c "from main import app; print('Backend setup successful!')"
```

### Step 3: Frontend Setup

#### 3.1 Navigate to Project Root

```bash
cd ../..  # Back to project root
```

#### 3.2 Install All Node Dependencies

```bash
pnpm install
```

This installs dependencies for:

- Root workspace
- `/apps/frontend`
- `/packages/components`
- `/packages/constants`

#### 3.3 Configure Frontend Environment Variables

Create `.env` in `apps/frontend/`:

```bash
# apps/frontend/.env

# Backend API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_AI_URL=http://localhost:8000
```

#### 3.4 Verify Frontend Setup

```bash
cd apps/frontend
pnpm build
```

If successful, you'll see a `.next` build folder.

### Step 4: Verify Complete Setup

From the project root:

```bash
# Check if all workspaces are properly linked
pnpm list

# Check Turborepo configuration
cat turbo.json
```

You should see all workspaces listed, including `apps/frontend`, `packages/components`, and `packages/constants`.

---

## 6. Running the Application

### Run Backend and Frontend Separately (Recommended for Development)

#### Terminal 1 - Backend (Port 8000)

```bash
cd apps/adk

# Activate virtual environment
source .venv/Scripts/activate  # Windows Git Bash
# OR
source .venv/bin/activate      # macOS/Linux

# Run development server
python main.py
# OR manually:
uvicorn main:app --host 0.0.0.0 --reload --port 8000
```

**Expected Output**:

```
[Main Server] Training ML models on startup...
[Main Server] Churn ML model training complete
[Main Server] Anomaly ML model training complete
[Main Server] Dashboard caching enabled
[Main Server] All services initialized
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Verify backend is running:

```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","adk_enabled":true}
```

#### Terminal 2 - Frontend (Port 3000)

```bash
cd apps/frontend

# Run development server
pnpm dev
```

**Expected Output**:

```
   ▲ Next.js 15.5.3
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.x:3000

 ✓ Ready in 3.2s
```

**Access the Application**:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
  From the project root:

### Accessing the Application

Once both servers are running:

1. **Open browser**: http://localhost:3000
2. **You'll be redirected to**: http://localhost:3000/enterprise-iq
3. **Explore dashboards**:
   - Customer Churn: http://localhost:3000/churn-prediction
   - Anomaly Detection: http://localhost:3000/anomaly-detection
   - Customer Behavior: http://localhost:3000/customer-behavior
   - Sales Performance: http://localhost:3000/sales-performance
   - Product Performance: http://localhost:3000/product-performance
   - Cash Flow: http://localhost:3000/cash-flow
   - And 20+ more dashboards...

### Stopping the Application

**Backend**:

```bash
# Press CTRL+C in the backend terminal
```

**Frontend**:

```bash
# Press CTRL+C in the frontend terminal
```

---

## 7. Project Structure Details

### Monorepo Setup with pnpm Workspaces

This project uses a **monorepo** structure managed by **pnpm workspaces** and **Turborepo**.

#### pnpm Workspaces Configuration

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

This tells pnpm to treat each folder in `apps/` and `packages/` as a separate workspace.

**Benefits**:

- Share dependencies across workspaces
- Link local packages without publishing to npm
- Efficient disk usage (dependencies are deduplicated)
- Fast installation and updates

#### Turborepo Configuration

`turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**What Turborepo Does**:

- **Parallel Execution**: Runs tasks across workspaces in parallel
- **Smart Caching**: Caches build outputs to speed up subsequent builds
- **Task Orchestration**: Manages task dependencies (e.g., build packages before apps)
- **Remote Caching**: Optional remote cache for team collaboration

#### Workspace Dependencies

Frontend workspace (`apps/frontend/package.json`) can depend on packages:

```json
{
  "dependencies": {
    "components": "*", // Links to packages/components
    "constants": "*" // Links to packages/constants
  }
}
```

When you run `pnpm install`, pnpm automatically links these local packages.

### Shared Packages

#### `packages/components`

Shared React component library used by frontend:

- Theme provider
- Common UI components
- Shared styles

**Usage in frontend**:

```typescript
import { ThemeProvider } from "components/index";
```

#### `packages/constants`

Shared constants and types:

- API endpoints
- Configuration constants
- Shared TypeScript types

### Domain-Driven Design

The backend (`apps/adk/domains/`) is organized by **business domains**:

```
domains/
├── churn_prediction/         # Customer domain
├── anomaly_detection/        # Customer domain
├── customer_behavior/        # Customer domain
├── customer_segmentation/    # Customer domain
├── sales_performance/        # Sales domain
├── product_performance/      # Sales domain
├── inventory_level/          # Inventory domain
├── cash_flow/                # Finance domain
└── ...
```

Each domain folder follows a consistent structure:

```
domain_name/
├── processing_service.py     # Main service logic
├── data_service.py           # Database access layer
├── ml_predictor.py           # ML model (if applicable)
├── models.py                 # Pydantic data models
├── schema.py                 # API request/response schemas
└── sync_processing_service.py # Synchronous version
```

**Why Domain-Driven Design?**

- Clear separation of concerns
- Easy to locate functionality
- Parallel development by different teams
- Modular and maintainable

---

## 8. Development Workflow

### Making Changes to Backend

#### 1. Activate Virtual Environment

```bash
cd apps/adk
source .venv/Scripts/activate  # Windows
# OR
source .venv/bin/activate      # macOS/Linux
```

#### 2. Make Your Changes

Edit Python files in:

- `domains/` - Business logic and ML models
- `api/routers/` - API endpoints
- `orchestration_agent/` - AI agent logic
- `database/` - Database utilities

#### 3. Test Your Changes

```bash
# Run specific domain tests
pytest domains/churn_prediction/tests/

# Run all tests
pytest

# Test specific endpoint
curl -X POST http://localhost:8000/api/churn/summary \
  -H "Content-Type: application/json" \
  -d '{"filters": {}}'
```

#### 4. Restart Backend

With `--reload` flag, changes are auto-reloaded. If not:

```bash
# Stop (CTRL+C) and restart
uvicorn main:app --host 0.0.0.0 --reload --port 8000
```

### Making Changes to Frontend

#### 1. Navigate to Frontend

```bash
cd apps/frontend
```

#### 2. Make Your Changes

Edit files in:

- `src/app/` - Pages and layouts
- `src/store/` - Redux state
- `src/components/` - Shared components

#### 3. Next.js Auto-Reload

Next.js automatically reloads on file changes (Hot Module Replacement). You'll see changes instantly in the browser.

#### 4. Verify Build

```bash
pnpm build
```

This ensures your changes don't break the production build.

### Making Changes to Shared Packages

#### 1. Edit Package

```bash
cd packages/components  # or packages/constants
# Make your changes
```

#### 2. Rebuild Package

```bash
pnpm build
```

#### 3. Frontend Will Auto-Update

Because packages are linked via pnpm workspaces, the frontend will automatically use the updated package.

### Adding a New Dashboard

#### Backend (API Endpoint)

1. Create domain folder:

```bash
mkdir -p apps/adk/domains/my_new_dashboard
```

2. Create files:

```
my_new_dashboard/
├── processing_service.py
├── data_service.py
├── models.py
└── schema.py
```

3. Create API router:

```python
# apps/adk/api/routers/my_new_dashboard_router.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/my-new-dashboard", tags=["My Dashboard"])

@router.post("/data")
async def get_data(filters: dict = {}):
    # Implementation
    return {"status": "success", "data": []}
```

4. Register router in `main.py`:

```python
from api.routers.my_new_dashboard_router import router as my_dashboard_router
app.include_router(my_dashboard_router)
```

#### Frontend (Dashboard Page)

1. Create dashboard folder:

```bash
mkdir -p apps/frontend/src/app/my-new-dashboard
```

2. Create `page.tsx`:

```tsx
// apps/frontend/src/app/my-new-dashboard/page.tsx
export default function MyNewDashboard() {
  return (
    <div>
      <h1>My New Dashboard</h1>
      {/* Your components */}
    </div>
  );
}
```

3. Access at: http://localhost:3000/my-new-dashboard

### Common Commands

```bash
# Root-level commands
pnpm install          # Install all dependencies
pnpm dev              # Run all workspaces in dev mode
pnpm build            # Build all workspaces
pnpm lint             # Lint all workspaces

# Frontend-specific
cd apps/frontend
pnpm dev              # Run frontend dev server
pnpm build            # Build frontend for production
pnpm start            # Start production server
pnpm lint             # Lint frontend code

# Backend-specific
cd apps/adk
pip install -r requirements.txt  # Install Python deps
python main.py        # Run backend manually
pytest                # Run tests
```

---

## 9. Key Concepts

### Multi-Agent Architecture

The platform uses **Google's Agent Development Kit (ADK)** to implement a multi-agent system.

**Core Principles**:

- **Orchestration**: Root agent decomposes queries into subtasks
- **Specialization**: Each agent has domain expertise and specific tools
- **Autonomy**: Agents make decisions independently
- **Collaboration**: Agents can invoke each other and share context
- **Never-Ask Philosophy**: Agents use defaults instead of asking users for parameters

**Agent Communication Flow**:

```
User: "Show me at-risk customers and their expected churn date"
    ↓
Orchestration Agent:
  1. Identifies need for Customer Insights Agent
  2. Decomposes into: [analyze_churn, predict_next_purchase]
    ↓
Customer Insights Agent:
  1. Executes churn prediction tool
  2. Executes next purchase prediction tool
  3. Aggregates results
    ↓
Orchestration Agent:
  1. Receives results from customer agent
  2. Formats response for frontend
  3. Generates visualization specs
    ↓
Response: {
  "text": "I found 45 at-risk customers...",
  "visualization_output": [{
    "toolname": "churn-prediction",
    "componentName": "riskPyramid",
    "body": {...}
  }]
}
```

### Domain Processing Services

Each domain has a **ProcessingService** that handles:

- Data fetching from databases
- Data transformation and aggregation
- ML model inference
- Caching and optimization
- Error handling

**Example**: `ChurnProcessingService`

```python
class ChurnProcessingService:
    def __init__(self):
        self.ml_model = None
        self.cache = {}

    async def get_summary(self, filters):
        # Fetch data
        data = await self.data_service.fetch_customers(filters)
        # Run ML prediction
        predictions = await self.ml_model.predict(data)
        # Aggregate results
        summary = self.aggregate(predictions)
        return summary
```

**Benefits**:

- Separation of concerns (API ↔ Service ↔ Data)
- Reusable business logic
- Testable components
- Async/await for performance

### Machine Learning Model Training

ML models are trained on server startup (`main.py`):

```python
@app.on_event("startup")
async def startup_event():
    # Train churn prediction model
    await churn_service._train_ml_model()
    print("[Main Server] Churn ML model training complete")

    # Train anomaly detection model
    await anomaly_service._train_ml_model()
    print("[Main Server] Anomaly ML model training complete")
```

**Models Used**:

- **Isolation Forest**: Anomaly detection
- **Random Forest Classifier**: Churn prediction
- **XGBoost**: Product performance, demand forecasting
- **K-Means**: Customer segmentation

**Model Caching**:
Models are cached in memory after training to avoid retraining on every request:

```python
from domains.common.ml_model_cache import ml_model_cache

# Cache model
ml_model_cache.set("churn_model", trained_model)

# Retrieve model
model = ml_model_cache.get("churn_model")
```

### SSE (Server-Sent Events) Streaming

The platform uses **SSE** for real-time AI responses.

**Why SSE?**

- One-way server-to-client communication
- Built on standard HTTP
- Auto-reconnection
- Perfect for streaming AI responses

**Backend Implementation** (`main.py`):

```python
@app.post("/run_sse")
async def run_agent(req: SimpleQueryRequest):
    async def event_generator():
        async for event in runner.run_async(...):
            # Stream partial responses
            yield f"data: {json.dumps(response_data)}\n\n"

        # Signal completion
        yield f"data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

**Frontend Consumption**:

```typescript
const eventSource = new EventSource("http://localhost:8000/run_sse");

eventSource.onmessage = (event) => {
  if (event.data === "[DONE]") {
    eventSource.close();
    return;
  }
  const data = JSON.parse(event.data);
  console.log(data.text); // Display AI response
};
```

### Dashboard Caching

To improve performance, dashboard data is cached:

```python
from domains.common.simple_cache import dashboard_cache_manager

# Enable caching on startup
dashboard_cache_manager.enable()

# Use in processing service
@dashboard_cache_manager.cached(ttl=300)  # Cache for 5 minutes
async def get_summary(self, filters):
    # Expensive operation
    return summary
```

**Cache Invalidation**:

- Time-based: TTL (Time To Live)
- Manual: Call `dashboard_cache_manager.clear()`

### Voice Interface

The platform supports voice interactions using **Deepgram API**:

**Speech-to-Text** (User speaks):

```typescript
// Frontend captures audio
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  // Send to backend
};
```

**Text-to-Speech** (AI speaks):

```python
# Backend (lib/utils.py)
async def get_audio_deepgram(text: str):
    # Call Deepgram TTS API
    audio_data = await deepgram_client.synthesize(text)
    return {"data": base64.b64encode(audio_data)}
```

```typescript
// Frontend plays audio
const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
audio.play();
```

---

## 10. Next Steps & Resources

### What to Explore Next

Now that you're set up, here are recommended next steps:

#### For Frontend Developers:

1. **Explore Dashboard Components**
   - Browse `apps/frontend/src/app/` to see different dashboards
   - Study component structure and data fetching patterns
   - Examine Redux state management in `src/store/`

2. **Understand API Integration**
   - See how dashboards fetch data from backend APIs
   - Study the SSE streaming implementation
   - Learn the visualization spawning system

3. **Work on UI/UX**
   - Improve dashboard layouts
   - Add new visualizations using Recharts
   - Enhance responsive design

#### For Backend Developers:

1. **Study Domain Services**
   - Pick a domain (e.g., `churn_prediction`)
   - Understand the service → data → ML flow
   - Explore database queries

2. **Explore Multi-Agent System**
   - Read `orchestration_agent/agent.py`
   - Study agent instructions in `prompt.py`
   - Understand tool registration

3. **Work on ML Models**
   - Improve model accuracy
   - Add new features to predictions
   - Optimize model training time

#### For Full-Stack Developers:

1. **Build a Complete Feature**
   - Add a new dashboard end-to-end
   - Implement backend API + frontend UI
   - Integrate with the agent system

2. **Improve Performance**
   - Optimize database queries
   - Implement better caching strategies
   - Reduce bundle sizes

3. **Enhance AI Capabilities**
   - Add new agent tools
   - Improve agent instructions
   - Integrate additional AI models

### Important Documentation

**Internal Docs** (in this repository):

- `AI_DOCS.md` - Comprehensive AI system documentation (1300+ lines)
- `apps/README.md` - Applications overview
- `apps/adk/README.md` - Backend setup guide
- `apps/adk/tool_list.md` - List of all agent tools
- `DASHBOARD_IMPLEMENTATION_GUIDE.md` - Dashboard development guide
- `PRODUCT_PERFORMANCE_IMPLEMENTATION_SUMMARY.md` - Feature example

**External Resources**:

- [Google ADK Documentation](https://developers.google.com/assistant/adk) - Multi-agent framework
- [FastAPI Documentation](https://fastapi.tiangolo.com/) - API framework
- [Next.js Documentation](https://nextjs.org/docs) - Frontend framework
- [Turborepo Documentation](https://turbo.build/repo/docs) - Monorepo tooling
- [pnpm Workspaces](https://pnpm.io/workspaces) - Package manager

### Common Tasks for New Developers

#### Task 1: Add a New API Endpoint

1. Create router in `apps/adk/api/routers/my_router.py`
2. Implement processing service in `apps/adk/domains/my_domain/`
3. Register router in `apps/adk/main.py`
4. Test with curl or Postman

#### Task 2: Create a New Dashboard

1. Create folder `apps/frontend/src/app/my-dashboard/`
2. Create `page.tsx` with your components
3. Add API fetching logic
4. Style with TailwindCSS

#### Task 3: Add an Agent Tool

1. Create tool function in `apps/adk/orchestration_agent/tools/`
2. Register tool with appropriate agent
3. Update agent instructions to mention the tool
4. Test with a query: "Use my new tool to analyze..."

#### Task 4: Improve an ML Model

1. Navigate to `apps/adk/domains/[domain]/ml_predictor.py`
2. Modify model training code
3. Add new features or hyperparameter tuning
4. Retrain on startup and verify improvements

### Getting Help

**When you're stuck**:

1. **Check existing documentation**: Search AI_DOCS.md and other READMEs
2. **Read the code**: Most services follow similar patterns
3. **Check logs**: Backend logs to terminal, frontend to browser console
4. **Ask the team**: Use your team's communication channel

**Debugging Tips**:

- **Backend**: Add `print()` statements or use Python debugger (`pdb`)
- **Frontend**: Use React DevTools and browser console
- **API**: Test endpoints with curl or Postman before integrating
- **Database**: Use DB Browser for SQLite to inspect data

### Contributing Guidelines

**Before making changes**:

1. Pull latest code: `git pull origin prod`
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following existing patterns
4. Test thoroughly (backend + frontend)
5. Commit with descriptive messages
6. Push and create a pull request

**Code Quality**:

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Use strict mode, avoid `any`
- **Naming**: Use descriptive names (no single letters except loops)
- **Comments**: Explain "why", not "what"

### Migration Status

**Current State** (as of October 2025):

- ✅ `apps/adk` - Active backend development
- ✅ `apps/frontend` - Active frontend development
- ⚠️ `apps/server` - Legacy, DO NOT add new code here
- ⚠️ `apps/web` - Legacy, DO NOT add new code here

**Migration Progress**:

- Most ML models and processing services migrated to `adk`
- 30+ dashboards created in new `frontend`
- API endpoints migrated to FastAPI routers
- Legacy folders will be removed once 100% migration complete

**If you need code from legacy folders**:

- Reference for learning, don't modify
- Copy patterns to new structure
- Update imports and dependencies

---

## Congratulations!

You've completed the onboarding guide. You should now have:

- ✅ Understanding of the platform's purpose and architecture
- ✅ Local development environment set up
- ✅ Backend and frontend running successfully
- ✅ Knowledge of key concepts and workflows
- ✅ Resources for continued learning

**Welcome to the team! Happy coding!**

---

_Last Updated: October 2025_
_Maintained by: Engineering Team_
_Questions or Updates: Please submit a PR or contact the team_
