#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Pauli Effect to Coolify
.DESCRIPTION
    Configures environment variables and triggers deployment
.NOTES
    Run this script after setting up your .env file
#>

param(
    [switch]$SetEnvVars,
    [switch]$Deploy,
    [switch]$Status,
    [switch]$Logs
)

# Configuration
$COOLIFY_URL = $env:COOLIFY_URL ?? "http://31.220.58.212:8000"
$COOLIFY_API = $env:COOLIFY_API_TOKEN
$APP_UUID = "g800kgwows44ww8ss0gggcow"  # pauli-comic-funnel

if (-not $COOLIFY_API) {
    Write-Host "ERROR: COOLIFY_API_TOKEN not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:COOLIFY_API_TOKEN = 'your-token'" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $COOLIFY_API"
    "Content-Type" = "application/json"
}

function Get-AppStatus {
    Write-Host "`n📊 Application Status" -ForegroundColor Cyan
    $app = Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/applications/$APP_UUID" -Headers $headers -Method Get
    Write-Host "  Name: $($app.name)"
    Write-Host "  Status: $($app.status)"
    Write-Host "  URL: $($app.fqdn)"
    Write-Host "  Branch: $($app.git_branch)"
    Write-Host ""
}

function Set-EnvironmentVariables {
    Write-Host "`n🔧 Setting Environment Variables" -ForegroundColor Cyan
    
    # Load from .env file if exists
    $envFile = Join-Path $PSScriptRoot ".." ".env"
    if (Test-Path $envFile) {
        Write-Host "  Loading from .env file..." -ForegroundColor Gray
    }
    
    # Core environment variables to set in Coolify
    $envVars = @{
        "NODE_ENV" = "production"
        "PORT" = "3001"
        "DATABASE_URL" = $env:DATABASE_URL
        "ANTHROPIC_API_KEY" = $env:ANTHROPIC_API_KEY
        "NOTION_API_KEY" = $env:NOTION_API_KEY
        "GITHUB_TOKEN" = $env:GITHUB_TOKEN
        "VITE_API_URL" = "/api"
    }
    
    # Filter out null values
    $filtered = @{}
    foreach ($key in $envVars.Keys) {
        if ($envVars[$key]) {
            $filtered[$key] = $envVars[$key]
        }
    }
    
    if ($filtered.Count -eq 0) {
        Write-Host "  WARNING: No environment variables set. Configure .env first." -ForegroundColor Yellow
        return
    }
    
    $body = @{
        "env" = ($filtered.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "`n"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/applications/$APP_UUID/envs" -Headers $headers -Method Patch -Body $body
        Write-Host "  ✅ Environment variables updated ($($filtered.Count) vars)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to update env vars: $_" -ForegroundColor Red
    }
}

function Start-Deployment {
    Write-Host "`n🚀 Triggering Deployment" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/applications/$APP_UUID/restart" -Headers $headers -Method Post
        Write-Host "  ✅ Deployment queued: $($response.deployment_uuid)" -ForegroundColor Green
        Write-Host "  Monitor at: $COOLIFY_URL/project/$APP_UUID/deployments" -ForegroundColor Gray
    } catch {
        Write-Host "  ❌ Deployment failed: $_" -ForegroundColor Red
    }
}

function Get-Logs {
    Write-Host "`n📜 Recent Logs" -ForegroundColor Cyan
    try {
        $logs = Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/applications/$APP_UUID/logs" -Headers $headers -Method Get
        $logs | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }
    } catch {
        Write-Host "  ❌ Could not fetch logs: $_" -ForegroundColor Red
    }
}

# Main execution
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PAULI EFFECT - Coolify Deployment    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

if ($Status -or (-not $SetEnvVars -and -not $Deploy -and -not $Logs)) {
    Get-AppStatus
}

if ($SetEnvVars) {
    Set-EnvironmentVariables
}

if ($Deploy) {
    Start-Deployment
}

if ($Logs) {
    Get-Logs
}

Write-Host "`n✅ Done" -ForegroundColor Green
Write-Host "Live URL: http://pauli-comic-funnel.31.220.58.212.sslip.io" -ForegroundColor Cyan
