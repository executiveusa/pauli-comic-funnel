#!/usr/bin/env pwsh
<#
PAULI Multi-App Coolify Manager
Manage deployment of 200+ apps to self-hosted Coolify infrastructure
Replaces GoDaddy + external hosting with single control plane
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

# Ensure config dir exists
if (!(Test-Path $CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $CONFIG_DIR -Force | Out-Null
}

function Write-Header {
    param([string]$text)
    Write-Host "`n$text`n" -ForegroundColor Cyan -BackgroundColor Black
    Write-Host ("=" * $text.Length) -ForegroundColor Cyan
}

function Scan-GitHubOrg {
    Write-Header "Scanning GitHub Organization: $GITHUB_ORG"
    
    $headers = @{
        "Authorization" = "Bearer $GITHUB_TOKEN"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $all_repos = @()
    $page = 1
    
    do {
        $url = "https://api.github.com/orgs/$GITHUB_ORG/repos?per_page=100&page=$page&type=owner"
        try {
            $response = Invoke-RestMethod -Uri $url -Headers $headers -ErrorAction Stop
            if ($response.Count -eq 0) { break }
            $all_repos += $response
            $page++
        } catch {
            Write-Host "❌ Error fetching repos: $_" -ForegroundColor Red
            break
        }
    } while ($response.Count -eq 100)
    
    Write-Host "`n✅ Found $($all_repos.Count) repositories`n" -ForegroundColor Green
    return $all_repos
}

function Create-CoolifyServices {
    param([array]$repos)
    
    Write-Header "Creating Coolify Services for All Apps"
    
    $headers = @{
        "Authorization" = "Bearer $COOLIFY_API"
        "Content-Type" = "application/json"
    }
    
    $inventory = @{
        timestamp = Get-Date -Format "o"
        total_apps = $repos.Count
        apps = @()
    }
    
    $created_count = 0
    
    foreach ($repo in $repos) {
        $app_name = $repo.name
        $repo_url = $repo.clone_url
        
        Write-Host "  Creating service for: $app_name..." -ForegroundColor Yellow -NoNewline
        
        $service_config = @{
            name = $app_name
            description = $repo.description -or "Auto-deployed from GitHub"
            source = @{
                type = "github"
                repository = $repo_url
                branch = "main"
            }
            domains = @("$app_name.srv1099662.hstgr.cloud")
            auto_deploy = $true
            webhook = $true
        } | ConvertTo-Json -Depth 10
        
        try {
            $response = Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/services" `
                -Headers $headers `
                -Method Post `
                -Body $service_config `
                -ErrorAction SilentlyContinue
            
            if ($response -and $response.id) {
                Write-Host " [OK]" -ForegroundColor Green
                $inventory.apps += @{
                    name = $app_name
                    repo_url = $repo_url
                    service_id = $response.id
                    status = "created"
                    created_at = Get-Date -Format "o"
                }
                $created_count++
            } else {
                Write-Host " [FAIL]" -ForegroundColor Red
            }
        } catch {
            Write-Host " [ERROR: $_]" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 500  # Rate limiting
    }
    
    # Save inventory
    $inventory | ConvertTo-Json -Depth 10 | Set-Content $INVENTORY_FILE
    Write-Host "`n✅ Created $created_count services | Inventory saved to $INVENTORY_FILE`n" -ForegroundColor Green
    
    return $inventory
}

function Deploy-AllServices {
    param([object]$inventory)
    
    Write-Header "Deploying All Services to Coolify"
    
    if (!(Test-Path $INVENTORY_FILE)) {
        Write-Host "❌ Inventory file not found. Run 'create-all' first." -ForegroundColor Red
        return
    }
    
    $inventory = Get-Content $INVENTORY_FILE | ConvertFrom-Json
    $headers = @{
        "Authorization" = "Bearer $COOLIFY_API"
        "Content-Type" = "application/json"
    }
    
    $deployed_count = 0
    
    foreach ($app in $inventory.apps) {
        if (!$app.service_id) { continue }
        
        Write-Host "  Deploying: $($app.name)..." -ForegroundColor Yellow -NoNewline
        
        try {
            Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/services/$($app.service_id)/deploy" `
                -Headers $headers `
                -Method Post `
                -Body '{}' `
                -ErrorAction SilentlyContinue | Out-Null
            
            Write-Host " [OK]" -ForegroundColor Green
            $deployed_count++
        } catch {
            Write-Host " [ERROR]" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 2  # Rate limiting
    }
    
    Write-Host "`n✅ Deployment complete: $deployed_count/$($inventory.apps.Count) services deployed`n" -ForegroundColor Green
}

function Sync-SecretsToAll {
    param([object]$inventory)
    
    Write-Header "Syncing Secrets to All Services"
    
    if (!(Test-Path $SECRETS_FILE)) {
        Write-Host "❌ Secrets file not found: $SECRETS_FILE" -ForegroundColor Red
        return
    }
    
    $secrets = Get-Content $SECRETS_FILE | ConvertFrom-Json
    $inventory = Get-Content $INVENTORY_FILE | ConvertFrom-Json
    
    $headers = @{
        "Authorization" = "Bearer $COOLIFY_API"
        "Content-Type" = "application/json"
    }
    
    $synced_count = 0
    
    foreach ($app in $inventory.apps) {
        if (!$app.service_id) { continue }
        
        Write-Host "  Syncing secrets to: $($app.name)..." -ForegroundColor Yellow -NoNewline
        
        $env_payload = @{
            environment_variables = @{}
        }
        
        foreach ($secret in ($secrets | Get-Member -MemberType NoteProperty)) {
            if (!$secret.Name.StartsWith("_")) {
                $env_payload.environment_variables[$secret.Name] = $secrets.($secret.Name)
            }
        }
        
        try {
            Invoke-RestMethod -Uri "$COOLIFY_URL/api/v1/services/$($app.service_id)" `
                -Headers $headers `
                -Method Patch `
                -Body ($env_payload | ConvertTo-Json -Depth 10) `
                -ErrorAction SilentlyContinue | Out-Null
            
            Write-Host " [OK]" -ForegroundColor Green
            $synced_count++
        } catch {
            Write-Host " [ERROR]" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host "`n✅ Synced secrets to $synced_count services`n" -ForegroundColor Green
}

function Show-Status {
    if (!(Test-Path $INVENTORY_FILE)) {
        Write-Host "❌ No inventory found. Run 'scan' or 'create-all' first." -ForegroundColor Red
        return
    }
    
    Write-Header "COOLIFY MULTI-APP STATUS"
    
    $inventory = Get-Content $INVENTORY_FILE | ConvertFrom-Json
    
    Write-Host "📊 INVENTORY SUMMARY:" -ForegroundColor Cyan
    Write-Host "  Total Apps: $($inventory.apps.Count)"
    Write-Host "  Created: $(($inventory.apps | Where-Object { $_.status -eq 'created' }).Count)"
    Write-Host "  Deployed: $(($inventory.apps | Where-Object { $_.status -eq 'deployed' }).Count)"
    Write-Host "  Last Updated: $($inventory.timestamp)"
    
    Write-Host "`n📋 RECENT APPS (first 10):" -ForegroundColor Cyan
    $inventory.apps | Select-Object -First 10 | ForEach-Object {
        Write-Host "  • $($_.name) [$($_.status)] - $($_.repo_url)"
    }
    
    Write-Host "`n✅ Full inventory saved to: $INVENTORY_FILE`n" -ForegroundColor Green
}

function Setup-FirstTime {
    Write-Header "COOLIFY MULTI-APP SETUP"
    
    Write-Host "🔧 Initializing deployment system..." -ForegroundColor Yellow
    
    # Create secrets file if missing
    if (!(Test-Path $SECRETS_FILE)) {
        Write-Host "  Creating secrets vault..." -ForegroundColor Gray
        @{
            "ANTHROPIC_API_KEY" = "your-key-here"
            "OPENAI_API_KEY" = "your-key-here"
            "GOOGLE_API_KEY" = "your-key-here"
            "NODE_ENV" = "production"
            "COOLIFY_API_TOKEN" = $COOLIFY_API
            "GITHUB_TOKEN" = $GITHUB_TOKEN
            "_COMMENT" = "Edit this file with your actual API keys. Add config/secrets.json to .gitignore"
        } | ConvertTo-Json | Set-Content $SECRETS_FILE
        Write-Host "  ✅ Created $SECRETS_FILE" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Setup complete!" -ForegroundColor Green
    Write-Host "`nNext steps:"
    Write-Host "  1. Edit $SECRETS_FILE with your actual API keys"
    Write-Host "  2. Run: .\coolify-multi-app-manager.ps1 -Action scan"
    Write-Host "  3. Run: .\coolify-multi-app-manager.ps1 -Action create-all"
    Write-Host "  4. Run: .\coolify-multi-app-manager.ps1 -Action sync-secrets"
    Write-Host "  5. Run: .\coolify-multi-app-manager.ps1 -Action deploy-all`n"
}

# Main execution
switch ($Action) {
    "scan" {
        $repos = Scan-GitHubOrg
        $repos | ConvertTo-Json | Set-Content "$CONFIG_DIR\repos.json"
        Write-Host "OK: Scan results saved to $CONFIG_DIR\repos.json`n" -ForegroundColor Green
    }
    "create-all" {
        $repos = if (Test-Path "$CONFIG_DIR\repos.json") {
            Get-Content "$CONFIG_DIR\repos.json" | ConvertFrom-Json
        } else {
            Scan-GitHubOrg
        }
        Create-CoolifyServices -repos $repos
    }
    "deploy-all" {
        Deploy-AllServices
    }
    "sync-secrets" {
        Sync-SecretsToAll
    }
    "status" {
        Show-Status
    }
    "setup" {
        Setup-FirstTime
    }
}

Write-Host "Done!`n" -ForegroundColor Green
