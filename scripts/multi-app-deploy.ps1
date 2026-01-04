#!/usr/bin/env pwsh
<#
PAULI Multi-App Coolify Manager
Manage deployment of all apps to self-hosted Coolify infrastructure
#>

param(
    [ValidateSet("scan", "create-all", "deploy-all", "sync-secrets", "status", "setup")]
    [string]$Action = "status"
)

# Configuration - load from environment variables
$COOLIFY_URL = $env:COOLIFY_URL ?? "http://31.220.58.212:8000"
$COOLIFY_API = $env:COOLIFY_API_TOKEN
$GITHUB_TOKEN = $env:GITHUB_TOKEN
$GITHUB_ORG = $env:GITHUB_ORG ?? "executiveusa"

if (!$COOLIFY_API -or !$GITHUB_TOKEN) {
    Write-Host "ERROR: Required environment variables not set" -ForegroundColor Red
    Write-Host "Required: COOLIFY_API_TOKEN, GITHUB_TOKEN" -ForegroundColor Yellow
    exit 1
}
$CONFIG_DIR = ".\config"
$INVENTORY_FILE = "$CONFIG_DIR\app-inventory.json"
$SECRETS_FILE = "$CONFIG_DIR\secrets.json"

if (!(Test-Path $CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $CONFIG_DIR -Force | Out-Null
}

function Write-Title {
    param([string]$text)
    Write-Host ""
    Write-Host $text -ForegroundColor Cyan
    Write-Host ("=" * $text.Length) -ForegroundColor Cyan
    Write-Host ""
}

function Scan-Repos {
    Write-Title "Scanning GitHub Organization"
    
    $headers = @{
        "Authorization" = "Bearer $GITHUB_TOKEN"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $repos = @()
    $page = 1
    
    do {
        $url = "https://api.github.com/users/$GITHUB_ORG/repos?per_page=100&page=$page&type=owner&sort=updated"
        $response = Invoke-RestMethod -Uri $url -Headers $headers -ErrorAction SilentlyContinue
        if ($response.Count -eq 0) { break }
        $repos += $response
        Write-Host "  Fetched page $page ($($repos.Count) total)..." -ForegroundColor Gray
        $page++
    } while ($response.Count -eq 100)
    
    Write-Host "Found $($repos.Count) repositories" -ForegroundColor Green
    return $repos
}

function Create-Services {
    param([array]$repos)
    
    Write-Title "Creating Coolify Services"
    
    $headers = @{
        "Authorization" = "Bearer $COOLIFY_API"
        "Content-Type" = "application/json"
    }
    
    $inventory = @{
        timestamp = Get-Date -Format "o"
        total = $repos.Count
        apps = @()
    }
    
    $count = 0
    foreach ($repo in $repos) {
        Write-Host "  Creating: $($repo.name)..." -NoNewline
        
        $service = @{
            name = $repo.name
            description = $repo.description -or "Auto-deployed"
            source = @{
                type = "github"
                repository = $repo.clone_url
                branch = "main"
            }
            domains = @("$($repo.name).srv1099662.hstgr.cloud")
            auto_deploy = $true
            webhook = $true
        } | ConvertTo-Json -Depth 10
        
        try {
            $result = Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/services" `
                -Headers $headers -Method Post -Body $service `
                -ErrorAction SilentlyContinue
            
            if ($result -and $result.id) {
                Write-Host " [OK]" -ForegroundColor Green
                $inventory.apps += @{
                    name = $repo.name
                    service_id = $result.id
                    status = "created"
                }
                $count++
            } else {
                Write-Host " [SKIP]" -ForegroundColor Yellow
            }
        } catch {
            Write-Host " [ERROR]" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    $inventory | ConvertTo-Json | Set-Content $INVENTORY_FILE
    Write-Host ""
    Write-Host "Created $count services" -ForegroundColor Green
}

function Deploy-All {
    Write-Title "Deploying All Services"
    
    if (!(Test-Path $INVENTORY_FILE)) {
        Write-Host "No inventory found" -ForegroundColor Red
        return
    }
    
    $inv = Get-Content $INVENTORY_FILE | ConvertFrom-Json
    $headers = @{
        "Authorization" = "Bearer $COOLIFY_API"
        "Content-Type" = "application/json"
    }
    
    $count = 0
    foreach ($app in $inv.apps) {
        Write-Host "  Deploying: $($app.name)..." -NoNewline
        
        try {
            Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/services/$($app.service_id)/deploy" `
                -Headers $headers -Method Post -Body '{}' `
                -ErrorAction SilentlyContinue | Out-Null
            
            Write-Host " [OK]" -ForegroundColor Green
            $count++
        } catch {
            Write-Host " [ERROR]" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Host "Deployed $count apps" -ForegroundColor Green
}

function Sync-Secrets {
    Write-Title "Syncing Secrets to All Services"
    
    if (!(Test-Path $SECRETS_FILE)) {
        Write-Host "Secrets file not found" -ForegroundColor Red
        return
    }
    
    if (!(Test-Path $INVENTORY_FILE)) {
        Write-Host "Inventory file not found" -ForegroundColor Red
        return
    }
    
    $secrets = Get-Content $SECRETS_FILE | ConvertFrom-Json
    $inv = Get-Content $INVENTORY_FILE | ConvertFrom-Json
    
    $headers = @{
        "Authorization" = "Bearer $COOLIFY_API"
        "Content-Type" = "application/json"
    }
    
    $count = 0
    foreach ($app in $inv.apps) {
        Write-Host "  Syncing: $($app.name)..." -NoNewline
        
        $payload = @{
            environment_variables = @{}
        }
        
        $secrets | Get-Member -MemberType NoteProperty | ForEach-Object {
            if (!$_.Name.StartsWith("_")) {
                $payload.environment_variables[$_.Name] = $secrets.($_.Name)
            }
        }
        
        try {
            Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/services/$($app.service_id)" `
                -Headers $headers -Method Patch -Body ($payload | ConvertTo-Json -Depth 10) `
                -ErrorAction SilentlyContinue | Out-Null
            
            Write-Host " [OK]" -ForegroundColor Green
            $count++
        } catch {
            Write-Host " [ERROR]" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host ""
    Write-Host "Synced to $count services" -ForegroundColor Green
}

function Show-Status {
    Write-Title "Deployment Status"
    
    if (!(Test-Path $INVENTORY_FILE)) {
        Write-Host "No inventory found" -ForegroundColor Yellow
        return
    }
    
    $inv = Get-Content $INVENTORY_FILE | ConvertFrom-Json
    
    Write-Host "Total apps: $($inv.total)"
    Write-Host "Created: $($inv.apps.Count)"
    Write-Host "Last update: $($inv.timestamp)"
    Write-Host ""
    Write-Host "First 10 apps:" -ForegroundColor Cyan
    
    $inv.apps | Select-Object -First 10 | ForEach-Object {
        Write-Host "  - $($_.name) [$($_.status)]"
    }
    
    Write-Host ""
}

function Setup {
    Write-Title "Multi-App Setup"
    
    if (!(Test-Path $SECRETS_FILE)) {
        Write-Host "Creating secrets vault..."
        @{
            "ANTHROPIC_API_KEY" = "your-key"
            "OPENAI_API_KEY" = "your-key"
            "NODE_ENV" = "production"
            "GITHUB_TOKEN" = $GITHUB_TOKEN
            "COOLIFY_API" = $COOLIFY_API
        } | ConvertTo-Json | Set-Content $SECRETS_FILE
        Write-Host "Created $SECRETS_FILE" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Edit $SECRETS_FILE with your API keys"
    Write-Host "2. Run: .\multi-app-deploy.ps1 -Action scan"
    Write-Host "3. Run: .\multi-app-deploy.ps1 -Action create-all"
    Write-Host "4. Run: .\multi-app-deploy.ps1 -Action sync-secrets"
    Write-Host "5. Run: .\multi-app-deploy.ps1 -Action deploy-all"
    Write-Host ""
}

switch ($Action) {
    "scan" { $repos = Scan-Repos; $repos | ConvertTo-Json | Set-Content "$CONFIG_DIR\repos.json" }
    "create-all" {
        $repos = if (Test-Path "$CONFIG_DIR\repos.json") {
            Get-Content "$CONFIG_DIR\repos.json" | ConvertFrom-Json
        } else {
            Scan-Repos
        }
        Create-Services -repos $repos
    }
    "deploy-all" { Deploy-All }
    "sync-secrets" { Sync-Secrets }
    "status" { Show-Status }
    "setup" { Setup }
}

Write-Host "Done" -ForegroundColor Green
Write-Host ""
