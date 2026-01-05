# Quick Status Check - Shows live apps and build progress
# Run this anytime to see current deployment status

$COOLIFY_API = "http://31.220.58.212:8000/api/v1"
$TOKEN = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"
$headers = @{ "Authorization" = "Bearer $TOKEN" }

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          COOLIFY DEPLOYMENT STATUS - $(Get-Date -Format 'HH:mm:ss')                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

try {
    # Get apps
    $apps = (Invoke-RestMethod -Uri "$COOLIFY_API/applications" -Headers $headers -TimeoutSec 10)
    $running = @($apps | Where-Object { $_.status -like "*running*" })
    $exited = @($apps | Where-Object { $_.status -like "*exited*" })
    
    # Get deployments
    $deployments = (Invoke-RestMethod -Uri "$COOLIFY_API/deployments" -Headers $headers -TimeoutSec 10)
    $depList = @($deployments.Values)
    $queued = @($depList | Where-Object { $_.status -eq 'queued' }).Count
    $building = @($depList | Where-Object { $_.status -eq 'in_progress' }).Count
    $completed = @($depList | Where-Object { $_.status -eq 'finished' }).Count
    
    # Display stats
    Write-Host ""
    Write-Host "📊 DEPLOYMENT STATS" -ForegroundColor White
    Write-Host "  Live Apps:        $($running.Count) / 97" -ForegroundColor Green
    Write-Host "  Now Building:     $building apps" -ForegroundColor Yellow
    Write-Host "  Queued:           $queued apps" -ForegroundColor Cyan
    Write-Host "  Completed:        $completed apps" -ForegroundColor Green
    Write-Host "  Still Unhealthy:  $($exited.Count) apps" -ForegroundColor Red
    
    # Show running apps
    Write-Host ""
    Write-Host "✓ WORKING URLS ($($running.Count) LIVE):" -ForegroundColor Green
    if ($running.Count -gt 0) {
        $running | Sort-Object name | ForEach-Object {
            Write-Host "  $($_.fqdn)" -ForegroundColor Cyan
        }
    }
    
    # Show what's building
    if ($building -gt 0) {
        Write-Host ""
        Write-Host "⚙️ CURRENTLY BUILDING:" -ForegroundColor Yellow
        $building_apps = @($depList | Where-Object { $_.status -eq 'in_progress' })
        $building_apps | ForEach-Object {
            Write-Host "  - $($_.application_name)" -ForegroundColor Yellow
        }
    }
    
    # Progress estimate
    Write-Host ""
    Write-Host "⏱️  PROGRESS ESTIMATE" -ForegroundColor Gray
    if ($queued -gt 0) {
        $est_time_min = [math]::Ceiling($queued / 2 * 2.5)
        Write-Host "  Est. completion: ~$est_time_min minutes" -ForegroundColor Gray
    } else {
        Write-Host "  Almost done!" -ForegroundColor Green
    }
    
    if ($queued -eq 0 -and $building -eq 0) {
        Write-Host ""
        Write-Host "🎉 ALL DEPLOYMENTS COMPLETE!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "Error connecting to Coolify: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
