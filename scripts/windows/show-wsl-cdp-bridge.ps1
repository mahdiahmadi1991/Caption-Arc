param(
  [int]$BridgePort = 9223
)

$ErrorActionPreference = "Stop"

Write-Host "Portproxy entries for port ${BridgePort}:"
$lines = @(& netsh interface portproxy show v4tov4)
$matches = @($lines | Select-String -Pattern "\s+$BridgePort\s+" -SimpleMatch:$false)
if ($matches.Count -gt 0) {
  $matches | ForEach-Object { $_.ToString() }
} else {
  Write-Host "(none)"
}

Write-Host ""
Write-Host "Firewall rules matching 'CaptionArc CDP Bridge':"
Get-NetFirewallRule -DisplayName "CaptionArc CDP Bridge *" -ErrorAction SilentlyContinue |
  Select-Object DisplayName, Enabled, Direction, Action |
  Format-Table -AutoSize
