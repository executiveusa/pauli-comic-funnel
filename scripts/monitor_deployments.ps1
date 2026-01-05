# Deployment Monitor Script
# Run this to check deployment progress

$COOLIFY_API = "http://31.220.58.212:8000/api/v1"
$COOLIFY_TOKEN = "3|BiVHECItXMwX4dhaltCLyKbWS0RkxzgRRPsn6dFY450b6881"

$headers = @{
    "Authorization" = "Bearer $COOLIFY_TOKEN"
}

Write-Host "=== Coolify Deployment Monitor ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n"

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    # Get deployments
    try {
        $deployments = Invoke-RestMethod -Uri "$COOLIFY_API/deployments" -Headers $headers -Method Get
        
        $queued = 0
        $inProgress = 0
        $finished = 0
        $failed = 0
        
        foreach ($key in $deployments.PSObject.Properties.Name) {
            $status = $deployments.$key.status
            switch ($status) {
                "queued" { $queued++ }
                "in_progress" { $inProgress++ }
                "finished" { $finished++ }
                "failed" { $failed++ }
            }
        }
        
        # Get apps status
        $apps = Invoke-RestMethod -Uri "$COOLIFY_API/applications" -Headers $headers -Method Get
        
        $running = 0
        $exited = 0
        $other = 0
        
        foreach ($app in $apps) {
            $status = $app.status
            if ($status -like "*running*") { $running++ }
            elseif ($status -like "*exited*") { $exited++ }
            else { $other++ }
        }
        
        Write-Host "[$timestamp] Deployments: " -NoNewline
        Write-Host "In Progress: $inProgress" -ForegroundColor Yellow -NoNewline
        Write-Host " | Queued: $queued" -ForegroundColor Cyan -NoNewline
        Write-Host " | Finished: $finished" -ForegroundColor Green -NoNewline
        Write-Host " | Failed: $failed" -ForegroundColor Red
        
        Write-Host "[$timestamp] Applications: " -NoNewline
        Write-Host "Running: $running" -ForegroundColor Green -NoNewline
        Write-Host " | Exited: $exited" -ForegroundColor Red -NoNewline
        Write-Host " | Other: $other" -ForegroundColor Gray
        
        if ($queued -eq 0 -and $inProgress -eq 0) {
            Write-Host "`n=== ALL DEPLOYMENTS COMPLETE ===" -ForegroundColor Green
            Write-Host "Running apps: $running / $($apps.Count)" -ForegroundColor Green
            break
        }
        
    } catch {
        Write-Host "[$timestamp] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 10
}
