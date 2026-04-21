param(
  [int]$BridgePort = 9223,
  [string]$ListenAddress = "0.0.0.0"
)

$ErrorActionPreference = "Stop"

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    return $false
  }
  return $true
}

if (-not (Assert-Admin)) {
  $argList = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "`"$PSCommandPath`"",
    "-BridgePort",
    "$BridgePort"
  )

  try {
    Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $argList | Out-Null
    Write-Host "Elevation prompt opened. Approve UAC to continue bridge removal."
    exit 0
  } catch {
    throw "Administrator privileges are required. Re-run from an elevated PowerShell window or approve the UAC prompt."
  }
}

$listenAddress = $ListenAddress.Trim()
if ([string]::IsNullOrWhiteSpace($listenAddress)) {
  $listenAddress = "0.0.0.0"
}

& netsh interface portproxy delete v4tov4 listenaddress=$listenAddress listenport=$BridgePort | Out-Null

$ruleName = "CaptionArc CDP Bridge $BridgePort"
$rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($rule) {
  Remove-NetFirewallRule -DisplayName $ruleName | Out-Null
}

Write-Host "WSL CDP bridge removed for port $BridgePort."
