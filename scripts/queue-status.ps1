#!/usr/bin/env pwsh
# Find all queued deployments and check queue health

$token = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"
$baseUrl = "http://31.220.58.212:8000/api/v1"

Write-Host "=== COOLIFY QUEUE STATUS ===" -ForegroundColor Cyan

# Check all apps for recent deployments  
$apps = curl.exe -s -H "Authorization: Bearer $token" "$baseUrl/applications" | ConvertFrom-Json

Write-Host "`nTotal applications: $($apps.Count)"
Write-Host "Running: $(($apps | Where-Object { $_.status -like '*running*' }).Count)"
Write-Host "Unhealthy: $(($apps | Where-Object { $_.status -like '*unhealthy*' }).Count)"
Write-Host "Building: $(($apps | Where-Object { $_.status -like '*building*' }).Count)"

# Get our specific deployment
Write-Host "`n=== PAULI DEPLOYMENT ===" -ForegroundColor Yellow
$deploy = curl.exe -s -H "Authorization: Bearer $token" "$baseUrl/deployments/vc4wcg8wo8o04csogkcwc8c0" | ConvertFrom-Json
Write-Host "Status: $($deploy.status)"
Write-Host "Created: $($deploy.created_at)"
Write-Host "Horizon Job ID: $($deploy.horizon_job_id)"
Write-Host "Server: $($deploy.server_name)"

# Check localhost server
Write-Host "`n=== LOCALHOST SERVER ===" -ForegroundColor Yellow
$servers = curl.exe -s -H "Authorization: Bearer $token" "$baseUrl/servers" | ConvertFrom-Json
$localhost = $servers | Where-Object { $_.name -eq "localhost" }
if ($localhost) {
    Write-Host "UUID: $($localhost.uuid)"
    Write-Host "Reachable: $($localhost.settings.is_reachable)"
    Write-Host "Usable: $($localhost.settings.is_usable)"
    Write-Host "Concurrent Builds: $($localhost.settings.concurrent_builds)"
}
