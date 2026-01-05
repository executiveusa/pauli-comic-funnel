# Real-Time Deployment Monitor with Working URLs
# Shows apps as they come online and are verified working

param(
    [int]$CheckInterval = 15,  # Check every 15 seconds
    [int]$MaxConcurrent = 10   # Test up to 10 URLs at once
)

$COOLIFY_API = "http://31.220.58.212:8000/api/v1"
$COOLIFY_TOKEN = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"
$OutputFile = "E:\DESKTOP BACKUP FILES\THE PAULI EFFECT\pauli-comic-funnel-main\_JCP\working_urls.txt"

$headers = @{
    "Authorization" = "Bearer $COOLIFY_TOKEN"
}

$WorkingApps = @()
$TestedApps = @{}
$LastQueuedCount = 999
$StartTime = Get-Date

Write-Host "=== Real-Time App Deployment Monitor ===" -ForegroundColor Cyan
Write-Host "Started: $StartTime" -ForegroundColor Gray
Write-Host "Output: $OutputFile" -ForegroundColor Gray
Write-Host ""

while ($true) {
    try {
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        # Get all apps
        $apps = Invoke-RestMethod -Uri "$COOLIFY_API/applications" -Headers $headers -Method Get
        $deployments = Invoke-RestMethod -Uri "$COOLIFY_API/deployments" -Headers $headers -Method Get
        
        # Count deployment statuses
        $depItems = if ($deployments -is [array]) { $deployments } else { @($deployments.Values) }
        $queuedCount = @($depItems | Where-Object { $_.status -eq "queued" }).Count
        $inProgressCount = @($depItems | Where-Object { $_.status -eq "in_progress" }).Count
        $finishedCount = @($depItems | Where-Object { $_.status -eq "finished" }).Count
        
        # Find running apps
        $runningApps = @($apps | Where-Object { $_.status -like "*running*" })
        
        # Test new apps for HTTP 200
        $newWorkingApps = @()
        foreach ($app in $runningApps) {
            $appKey = $app.uuid
            
            if (-not $TestedApps.ContainsKey($appKey)) {
                $fqdn = $app.fqdn
                try {
                    $response = curl.exe -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 "$fqdn" 2>$null
                    
                    if ($response -eq "200") {
                        $TestedApps[$appKey] = @{
                            name = $app.name
                            url = $fqdn
                            time = $timestamp
                        }
                        $newWorkingApps += @{
                            name = $app.name
                            url = $fqdn
                        }
                        
                        Write-Host "[$timestamp] ✓ " -ForegroundColor Green -NoNewline
                        Write-Host "$($app.name)" -ForegroundColor White -NoNewline
                        Write-Host " => " -ForegroundColor Gray -NoNewline
                        Write-Host "$fqdn" -ForegroundColor Cyan
                        
                    } else {
                        Write-Host "[$timestamp] ⏳ " -ForegroundColor Yellow -NoNewline
                        Write-Host "$($app.name)" -ForegroundColor White -NoNewline
                        Write-Host " (HTTP $response)" -ForegroundColor Gray
                    }
                } catch {
                    # Still loading
                }
            }
        }
        
        # Print status line
        if ($queuedCount -ne $LastQueuedCount) {
            Write-Host ""
            Write-Host "[$timestamp] Status: " -NoNewline -ForegroundColor Gray
            Write-Host "In Progress: $inProgressCount" -ForegroundColor Yellow -NoNewline
            Write-Host " | Queued: $queuedCount" -ForegroundColor Cyan -NoNewline
            Write-Host " | Finished: $finishedCount" -ForegroundColor Green -NoNewline
            Write-Host " | Working: $($TestedApps.Count)" -ForegroundColor Green
            $LastQueuedCount = $queuedCount
            Write-Host ""
        }
        
        # Save working URLs to file
        if ($TestedApps.Count -gt 0) {
            $content = "# Working Deployed Apps`n"
            $content += "# Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
            $content += "# Total: $($TestedApps.Count) apps verified working`n`n"
            
            foreach ($key in $TestedApps.Keys | Sort-Object) {
                $app = $TestedApps[$key]
                $content += "$($app.url)`n"
            }
            
            Set-Content -Path $OutputFile -Value $content -Force
        }
        
        if ($queuedCount -eq 0 -and $inProgressCount -eq 0) {
            Write-Host ""
            Write-Host "=== ALL DEPLOYMENTS COMPLETE ===" -ForegroundColor Green
            Write-Host "Total apps verified working: $($TestedApps.Count)" -ForegroundColor Green
            Write-Host "Time elapsed: $((Get-Date) - $StartTime)" -ForegroundColor Green
            break
        }
        
    } catch {
        Write-Host "[$timestamp] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds $CheckInterval
}

Write-Host ""
Write-Host "Final report saved to: $OutputFile" -ForegroundColor Cyan
