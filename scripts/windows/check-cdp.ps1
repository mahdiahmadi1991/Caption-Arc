param(
  [int]$RemoteDebuggingPort = 9222,
  [int]$WaitMs = 6000,
  [int]$RetryIntervalMs = 400
)

$ErrorActionPreference = "Stop"

$baseUrl = "http://127.0.0.1:$RemoteDebuggingPort"

function Invoke-Json {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  return Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 3
}

$version = $null
$targets = $null
$deadline = [DateTime]::UtcNow.AddMilliseconds([Math]::Max(0, $WaitMs))

while ([DateTime]::UtcNow -lt $deadline) {
  try {
    $version = Invoke-Json -Url "$baseUrl/json/version"
    $targets = @(Invoke-Json -Url "$baseUrl/json/list")
    break
  } catch {
    Start-Sleep -Milliseconds ([Math]::Max(50, $RetryIntervalMs))
  }
}

if (-not $version -or -not $targets) {
  try {
    $version = Invoke-Json -Url "$baseUrl/json/version"
    $targets = @(Invoke-Json -Url "$baseUrl/json/list")
  } catch {
    Write-Error "CDP check failed on Windows endpoint $baseUrl. $($_.Exception.Message)"
    exit 1
  }
}

$targetSummary = $targets |
  Group-Object -Property type |
  Sort-Object -Property Name |
  ForEach-Object { "$($_.Name):$($_.Count)" }

$extensionWorkers = @(
  $targets | Where-Object {
    $_.type -eq "service_worker" -and
    $_.url -is [string] -and
    $_.url.StartsWith("chrome-extension://")
  }
)

Write-Host "CDP is reachable (Windows)."
Write-Host "Base URL: $baseUrl"
Write-Host "Browser: $($version.Browser)"
Write-Host "Protocol: $($version.'Protocol-Version')"
Write-Host "WebSocket: $($version.webSocketDebuggerUrl)"
Write-Host "Targets: $($targets.Count) ($($targetSummary -join ', '))"
Write-Host "Extension service workers: $($extensionWorkers.Count)"

if ($extensionWorkers.Count -gt 0) {
  $extensionWorkers | ForEach-Object { Write-Host "- $($_.url)" }
} else {
  Write-Host "No extension service worker detected yet."
  Write-Host "Open extension popup/options once, then run the check again."
}
