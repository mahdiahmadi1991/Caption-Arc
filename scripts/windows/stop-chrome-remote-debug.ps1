param(
  [string]$ProfileMarker = "chrome-cdp-profile"
)

$ErrorActionPreference = "Stop"

$processes = @(
  Get-CimInstance Win32_Process -Filter "name='chrome.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($ProfileMarker) }
)

$count = $processes.Count

if ($count -gt 0) {
  foreach ($proc in $processes) {
    try {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    } catch {
      # Process may already have exited; ignore and continue.
    }
  }
}

Write-Host "Stopped debug Chrome processes: $count"
