#!/usr/bin/env pwsh
<#
PAULI Deployment to Coolify
Requires: COOLIFY_URL, COOLIFY_API_TOKEN, SERVICE_ID environment variables
#>

# Load from environment or .env file
$COOLIFY_URL = $env:COOLIFY_URL ?? "http://31.220.58.212:8000"
$COOLIFY_API = $env:COOLIFY_API_TOKEN
$SERVICE_ID = $env:COOLIFY_SERVICE_ID

if (!$COOLIFY_API) {
    Write-Host "ERROR: COOLIFY_API_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:COOLIFY_API_TOKEN = 'your-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nPAULI DEPLOYMENT TO COOLIFY`n" -ForegroundColor Cyan

Write-Host "[1/3] Testing connection..." -ForegroundColor Yellow
$test = curl.exe -s -k "$COOLIFY_URL/api/v1/settings" -H "Authorization: Bearer $COOLIFY_API"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Coolify online`n" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Connection error`n" -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] Setting environment variables..." -ForegroundColor Yellow
# Load env vars from secrets file or environment
$env_vars = @{
    "ANTHROPIC_API_KEY"=$env:ANTHROPIC_API_KEY
    "OPENAI_API_KEY"=$env:OPENAI_API_KEY
    "GOOGLE_API_KEY"=$env:GOOGLE_API_KEY
    "NEXT_PUBLIC_SUPABASE_URL"=$env:NEXT_PUBLIC_SUPABASE_URL
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"=$env:NEXT_PUBLIC_SUPABASE_ANON_KEY
    "SUPABASE_SERVICE_ROLE_KEY"=$env:SUPABASE_SERVICE_ROLE_KEY
    "GH_PAT"=$env:GITHUB_TOKEN
    "NEXT_PUBLIC_API_BASE_URL"=$env:NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
    "NODE_ENV"="production"
    "NEXT_PUBLIC_BASE_URL"=$env:NEXT_PUBLIC_BASE_URL ?? $COOLIFY_URL
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"=$env:STRIPE_PUBLISHABLE_KEY
    "STRIPE_SECRET_KEY"=$env:STRIPE_SECRET_KEY
}

$body = @{"environment_variables"=$env_vars} | ConvertTo-Json -Depth 10

Write-Host "  Setting $($env_vars.Count) variables..." -ForegroundColor Gray
curl.exe -s -k -X PATCH "$COOLIFY_URL/api/v1/services/$SERVICE_ID" `
    -H "Authorization: Bearer $COOLIFY_API" `
    -H "Content-Type: application/json" `
    -d $body | Out-Null
Write-Host "  [OK] Environment configured`n" -ForegroundColor Green

Write-Host "[3/3] Triggering deployment..." -ForegroundColor Yellow
curl.exe -s -k -X POST "$COOLIFY_URL/api/v1/services/$SERVICE_ID/deploy" `
    -H "Authorization: Bearer $COOLIFY_API" `
    -H "Content-Type: application/json" `
    -d '{}' | Out-Null
Write-Host "  [OK] Deployment started!`n" -ForegroundColor Green

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  PAULI Live: https://srv1099662.hstgr.cloud" -ForegroundColor Green
Write-Host "  Coolify:    $COOLIFY_URL" -ForegroundColor Green
Write-Host "  Lovable:    https://pauli-comic-funnel.lovable.app" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Cyan
Write-Host "Deployment in progress (2-5 minutes)...`n" -ForegroundColor Yellow
