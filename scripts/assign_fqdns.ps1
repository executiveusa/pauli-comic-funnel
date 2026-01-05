# FQDN Assignment Script for Coolify Apps
# Sets domain for all apps and triggers redeploy

$COOLIFY_API = "http://31.220.58.212:8000/api/v1"
$COOLIFY_TOKEN = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"
$BASE_DOMAIN = "31.220.58.212.sslip.io"

$headers = @{
    "Authorization" = "Bearer $COOLIFY_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "=== FQDN Assignment Script ===" -ForegroundColor Cyan
Write-Host "Base Domain: $BASE_DOMAIN" -ForegroundColor Gray

# Get all applications
Write-Host "`nFetching all applications..." -ForegroundColor Yellow
$appsResponse = Invoke-RestMethod -Uri "$COOLIFY_API/applications" -Headers $headers -Method Get
$apps = $appsResponse

Write-Host "Found $($apps.Count) applications" -ForegroundColor Green

$updated = 0
$skipped = 0
$failed = 0
$deployQueued = 0

foreach ($app in $apps) {
    $uuid = $app.uuid
    $name = $app.name
    $currentFqdn = $app.fqdn
    
    # Skip if already has FQDN
    if ($currentFqdn -and $currentFqdn -ne $null -and $currentFqdn -ne "") {
        Write-Host "  [SKIP] $name - already has FQDN: $currentFqdn" -ForegroundColor DarkGray
        $skipped++
        continue
    }
    
    # Generate FQDN based on app name
    $safeName = $name -replace '[^a-zA-Z0-9-]', '-' -replace '--+', '-' -replace '^-|-$', ''
    $safeName = $safeName.ToLower()
    $newFqdn = "http://$safeName.$BASE_DOMAIN"
    
    Write-Host "  [SET] $name -> $newFqdn" -ForegroundColor White
    
    # Update the app with the new domain
    $body = @{ domains = $newFqdn } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-RestMethod -Uri "$COOLIFY_API/applications/$uuid" -Headers $headers -Method Patch -Body $body
        $updated++
        
        # Queue a deployment
        try {
            $deployResponse = Invoke-RestMethod -Uri "$COOLIFY_API/deploy?uuid=$uuid&force=true" -Headers $headers -Method Get
            $deployQueued++
            Write-Host "       -> Deployment queued" -ForegroundColor Green
        } catch {
            Write-Host "       -> Deploy failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Small delay to avoid rate limiting
        Start-Sleep -Milliseconds 200
        
    } catch {
        Write-Host "       -> Update failed: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Apps: $($apps.Count)" -ForegroundColor White
Write-Host "Updated: $updated" -ForegroundColor Green
Write-Host "Skipped (had FQDN): $skipped" -ForegroundColor Yellow
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Deployments Queued: $deployQueued" -ForegroundColor Cyan

Write-Host "`nNote: Deployments will process with concurrency limit of 2" -ForegroundColor Gray
Write-Host "Monitor progress at: http://31.220.58.212:8000" -ForegroundColor Gray
