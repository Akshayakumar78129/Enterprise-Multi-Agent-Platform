# Multi-Agent Orchestration with Google ADK

This repository contains a multi-agent system built using Google's Agent Development Kit (ADK).

## Setup Instructions

### 1. Set up Virtual Environment

```bash
# Create a virtual environment
python3 -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\bin\activate
# On macOS/Linux:
source .venv/bin/activate
```

### 2. Install Required Packages

```bash
# Install all dependencies from requirements.txt
pip3 install -r requirements.txt
```

### 3. Set up Database Files

The application requires specific database files to function properly. We've stored these files on Google Drive for easy access.

```bash
# Run the database setup script to download required files
python3 setup_db.py
```

This script will:
- Download database files from Google Drive (customers.db, financial_agent.db, and sales_agent.db)
- Place them in the correct location in the project structure
- Clean up any temporary files

### 4. Configure Environment Variables

Create a `.env` file in the `orchestration_agent` directory with the following content:

```
GOOGLE_GENAI_USE_VERTEXAI="False"
GOOGLE_API_KEY="Gemini_api_key"
```

Replace the placeholder values with your actual API keys.

## Running the Application

Once the setup is complete, you can run the orchestration agent:

```bash
adk web
```

Then visit http://localhost:8000 to interact with the agent. 
