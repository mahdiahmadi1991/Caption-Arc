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

function Invoke-JsonArray {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $result = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 3
  foreach ($item in @($result)) {
    $item
  }
}

function Get-ExtensionServiceWorkers {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$Targets
  )

  return @(
    $Targets | Where-Object {
      $_.type -eq "service_worker" -and
      $_.url -is [string] -and
      $_.url.StartsWith("chrome-extension://")
    }
  )
}

function Get-ExtensionIdsFromTargets {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$Targets
  )

  $ids = New-Object System.Collections.ArrayList

  foreach ($target in $Targets) {
    $url = [string]($target.url)
    if (-not $url.StartsWith("chrome-extension://")) {
      continue
    }

    $match = [regex]::Match($url, '^chrome-extension://([a-z]{32})/', 'IgnoreCase')
    if (-not $match.Success) {
      continue
    }

    $id = $match.Groups[1].Value.ToLowerInvariant()
    if (-not $ids.Contains($id)) {
      [void]$ids.Add($id)
    }
  }

  return @($ids)
}

function Read-ExtensionIdCache {
  $cachePath = Join-Path $env:LOCALAPPDATA "CaptionArc\chrome-cdp-extension-id.txt"
  if (-not (Test-Path $cachePath)) {
    return $null
  }

  $raw = [string](Get-Content -Path $cachePath -Raw -ErrorAction SilentlyContinue)
  $value = $raw.Trim().ToLowerInvariant()
  if ($value -match '^[a-z]{32}$') {
    return $value
  }

  return $null
}

function Open-CdpTarget {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $escapedUrl = [System.Uri]::EscapeDataString($Url)

  try {
    $null = Invoke-RestMethod -Method Put -Uri "$BaseUrl/json/new?$escapedUrl" -TimeoutSec 3
    return $true
  } catch {
    return $false
  }
}

$version = $null
$targets = $null
$deadline = [DateTime]::UtcNow.AddMilliseconds([Math]::Max(0, $WaitMs))

while ([DateTime]::UtcNow -lt $deadline) {
  try {
    $version = Invoke-Json -Url "$baseUrl/json/version"
    $targets = @(Invoke-JsonArray -Url "$baseUrl/json/list")
    break
  } catch {
    Start-Sleep -Milliseconds ([Math]::Max(50, $RetryIntervalMs))
  }
}

if (-not $version -or -not $targets) {
  try {
    $version = Invoke-Json -Url "$baseUrl/json/version"
    $targets = @(Invoke-JsonArray -Url "$baseUrl/json/list")
  } catch {
    Write-Error "CDP check failed on Windows endpoint $baseUrl. $($_.Exception.Message)"
    exit 1
  }
}

$extensionWorkers = @(Get-ExtensionServiceWorkers -Targets $targets)
$materializedExtensionRuntime = $false

if ($extensionWorkers.Count -eq 0) {
  $candidateExtensionIds = @(Get-ExtensionIdsFromTargets -Targets $targets)
  $cachedExtensionId = Read-ExtensionIdCache
  if ($cachedExtensionId -and -not ($candidateExtensionIds -contains $cachedExtensionId)) {
    $candidateExtensionIds += $cachedExtensionId
  }

  foreach ($extensionId in $candidateExtensionIds) {
    if (-not (Open-CdpTarget -BaseUrl $baseUrl -Url "chrome-extension://$extensionId/options.html")) {
      continue
    }

    Start-Sleep -Milliseconds 450

    try {
      $targets = @(Invoke-JsonArray -Url "$baseUrl/json/list")
    } catch {
      continue
    }

    $extensionWorkers = @(Get-ExtensionServiceWorkers -Targets $targets)
    if ($extensionWorkers.Count -gt 0) {
      $materializedExtensionRuntime = $true
      break
    }
  }
}

$targetSummary = $targets |
  Group-Object -Property type |
  Sort-Object -Property Name |
  ForEach-Object { "$($_.Name):$($_.Count)" }

Write-Host "CDP is reachable (Windows)."
Write-Host "Base URL: $baseUrl"
Write-Host "Browser: $($version.Browser)"
Write-Host "Protocol: $($version.'Protocol-Version')"
Write-Host "WebSocket: $($version.webSocketDebuggerUrl)"
Write-Host "Targets: $($targets.Count) ($($targetSummary -join ', '))"
Write-Host "Extension service workers: $($extensionWorkers.Count)"

if ($extensionWorkers.Count -gt 0) {
  if ($materializedExtensionRuntime) {
    Write-Host "Extension runtime materialized via extension options target."
  }
  $extensionWorkers | ForEach-Object { Write-Host "- $($_.url)" }
} else {
  Write-Host "No extension service worker detected yet."
  Write-Host "Open extension popup/options once, then run the check again."
}
