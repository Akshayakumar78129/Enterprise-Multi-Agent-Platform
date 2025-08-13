# PowerShell script to start the churn dashboard with agent integration
# Run this from the churn_prediction directory

Write-Host "🚀 Starting Churn Dashboard with Agent Integration" -ForegroundColor Green
Write-Host "=" * 60

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the churn_prediction directory." -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️ Warning: .env.local not found. Creating default configuration..." -ForegroundColor Yellow
    
    $envContent = @"
# Churn Dashboard Configuration
NEXT_PUBLIC_USE_MOCK_AGENTS=false
NEXT_PUBLIC_FORCE_REAL_AGENTS=true
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3002
NEXT_PUBLIC_API_GATEWAY_TOKEN=your_api_gateway_token
NODE_ENV=development
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Created .env.local with default settings" -ForegroundColor Green
}

# Display current configuration
Write-Host "`n📋 Current Configuration:" -ForegroundColor Cyan
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        Write-Host "   $($matches[1]): $($matches[2])" -ForegroundColor White
    }
}

# Check if API Gateway is running
Write-Host "`n🔍 Checking API Gateway connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $health = $response.Content | ConvertFrom-Json
        Write-Host "✅ API Gateway is healthy (uptime: $($health.uptime)s)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API Gateway not responding. Make sure it's running on http://localhost:3002" -ForegroundColor Red
    Write-Host "   You can start it with: cd ../../../api-gateway && npm start" -ForegroundColor Yellow
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Run the test suite
Write-Host "`n🧪 Running agent integration tests..." -ForegroundColor Cyan
if (Test-Path "test-agent-integration.js") {
    node test-agent-integration.js
} else {
    Write-Host "⚠️ Test suite not found, skipping tests" -ForegroundColor Yellow
}

# Start the development server
Write-Host "`n🌐 Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "   The churn dashboard will be available at: http://localhost:3000" -ForegroundColor White
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""

# Start the server
npm run dev