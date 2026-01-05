#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$token = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"
$baseUrl = "http://31.220.58.212:8000/api/v1"

# Get all apps
$appsJson = curl.exe -s -H "Authorization: Bearer $token" "$baseUrl/applications"
$apps = $appsJson | ConvertFrom-Json

Write-Host "Total apps: $($apps.Count)" -ForegroundColor Cyan

# Find running apps
$running = $apps | Where-Object { $_.status -like "*running*" }
Write-Host "Running apps: $($running.Count)" -ForegroundColor Green

# Show first few running apps
$running | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.name): $($_.build_pack) => $($_.status)"
}

# Check deployment status
Write-Host "`nChecking pauli-comic-funnel..." -ForegroundColor Yellow
$pauliApp = $apps | Where-Object { $_.name -eq "pauli-comic-funnel" }
if ($pauliApp) {
    Write-Host "  Status: $($pauliApp.status)"
    Write-Host "  Build Pack: $($pauliApp.build_pack)"
    Write-Host "  Destination ID: $($pauliApp.destination_id)"
}

# Check latest deployment
Write-Host "`nLatest deployment status:" -ForegroundColor Yellow
$deployJson = curl.exe -s -H "Authorization: Bearer $token" "$baseUrl/deployments/v84os84ckw4o8o44swo4cw4c"
$deploy = $deployJson | ConvertFrom-Json
Write-Host "  Status: $($deploy.status)"
Write-Host "  Created: $($deploy.created_at)"
Write-Host "  Server: $($deploy.server_name)"
