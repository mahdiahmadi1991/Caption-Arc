param(
  [Parameter(Mandatory = $true)]
  [string]$ExtensionPath,

  [int]$RemoteDebuggingPort = 9222,

  [string]$RemoteDebuggingAddress = "0.0.0.0",

  [string]$ProfileDir = "",

  [string]$StagedExtensionDir = "$env:LOCALAPPDATA\CaptionArc\extension\development",

  [ValidateSet("auto", "manual")]
  [string]$ExtensionLoadMode = "auto",

  [ValidateSet("auto", "cft-only", "system-only")]
  [string]$ChromeRuntimeMode = "system-only",

  [string]$ChromeExecutablePath = "",

  [string]$StartUrl = "about:blank",

  [int]$WaitMs = 7000,

  [string]$ExtensionIdCachePath = "$env:LOCALAPPDATA\CaptionArc\chrome-cdp-extension-id.txt",

  [string]$AutoProvisionChromeForTesting = "true",

  [string]$ChromeForTestingRoot = "$env:LOCALAPPDATA\CaptionArc\chrome-for-testing",

  [string]$ChromeForTestingMetadataUrl = "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_STABLE",

  [int]$ChromeForTestingDownloadTimeoutMs = 180000
)

$ErrorActionPreference = "Stop"

function Parse-BoolLike {
  param(
    [string]$Value,
    [bool]$Default = $true
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $Default
  }

  $normalized = $Value.Trim().ToLowerInvariant()
  if ($normalized -in @("1", "true", "yes", "y", "on")) {
    return $true
  }
  if ($normalized -in @("0", "false", "no", "n", "off")) {
    return $false
  }

  return $Default
}

function Normalize-FullPath {
  param([string]$PathValue)
  if (-not $PathValue) {
    return ""
  }

  try {
    return ([System.IO.Path]::GetFullPath($PathValue)).TrimEnd('\')
  } catch {
    return $PathValue.TrimEnd('\')
  }
}

function Is-PathUnderRoot {
  param(
    [string]$PathValue,
    [string]$RootPath
  )

  $normalizedPath = Normalize-FullPath $PathValue
  $normalizedRoot = Normalize-FullPath $RootPath

  if (-not $normalizedPath -or -not $normalizedRoot) {
    return $false
  }

  return $normalizedPath.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase)
}

function Ensure-Directory {
  param([string]$PathValue)
  if (-not (Test-Path $PathValue)) {
    New-Item -ItemType Directory -Path $PathValue -Force | Out-Null
  }
}

function Resolve-ProfileDirectory {
  if ($ProfileDir) {
    return $ProfileDir
  }

  if ($env:CHROME_DEBUG_PROFILE_DIR_WIN) {
    return $env:CHROME_DEBUG_PROFILE_DIR_WIN
  }

  if ($env:CAPTIONARC_CHROME_DEBUG_PROFILE_DIR_WIN) {
    return $env:CAPTIONARC_CHROME_DEBUG_PROFILE_DIR_WIN
  }

  $preferredProfile = Join-Path $env:USERPROFILE ".google\ChromeDebugProfile"
  if (Test-Path $preferredProfile) {
    return $preferredProfile
  }

  return "$env:LOCALAPPDATA\CaptionArc\chrome-cdp-profile"
}

function Get-ManagedDebugProfileDirectory {
  return "$env:LOCALAPPDATA\CaptionArc\chrome-cdp-profile"
}

function Resolve-ChromePath {
  param([string]$OverridePath = "")

  if ($OverridePath) {
    if (Test-Path $OverridePath) {
      return (Resolve-Path $OverridePath).ProviderPath
    }
    throw "Configured Chrome executable path was not found: $OverridePath"
  }

  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) {
      return $path
    }
  }

  throw "Google Chrome executable was not found in standard locations."
}

function Stage-Extension {
  param(
    [string]$SourcePath,
    [string]$DestinationPath
  )

  $resolvedSourcePath = (Resolve-Path $SourcePath).ProviderPath
  $resolvedDestinationPath = [System.IO.Path]::GetFullPath($DestinationPath)
  Ensure-Directory $resolvedDestinationPath

  $null = & robocopy.exe $resolvedSourcePath $resolvedDestinationPath /MIR /NFL /NDL /NJH /NJS /NP /R:2 /W:1
  if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed while staging the extension (exit code $LASTEXITCODE)."
  }

  return @{
    Source = $resolvedSourcePath
    Destination = $resolvedDestinationPath
  }
}

function Stop-DebugChromeProcesses {
  param([string]$ProfileDirectory)

  $existing = @(
    Get-CimInstance Win32_Process -Filter "name='chrome.exe'" |
      Where-Object { $_.CommandLine -and $_.CommandLine.Contains($ProfileDirectory) }
  )

  if ($existing.Count -gt 0) {
    foreach ($proc in $existing) {
      try {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
      } catch {
        # Process may already have exited.
      }
    }
    Start-Sleep -Milliseconds 250
  }
}

function Get-DebugChromeProcesses {
  param([string]$ProfileDirectory)

  return @(
    Get-CimInstance Win32_Process -Filter "name='chrome.exe'" |
      Where-Object { $_.CommandLine -and $_.CommandLine.Contains($ProfileDirectory) }
  )
}

function Build-ChromeArguments {
  param(
    [int]$Port,
    [string]$Address,
    [string]$ProfileDirectory,
    [string]$LoadMode,
    [string]$ExtensionDirectory,
    [string]$InitialUrl,
    [bool]$UseDisableExtensionsExcept = $true
  )

  $args = @(
    "--remote-debugging-port=$Port"
    "--remote-debugging-address=$Address"
    "--user-data-dir=$ProfileDirectory"
    "--no-first-run"
    "--no-default-browser-check"
    $InitialUrl
  )

  if ($LoadMode -eq "auto") {
    $args += @(
      "--enable-unsafe-extension-debugging"
      "--load-extension=$ExtensionDirectory"
    )
    if ($UseDisableExtensionsExcept) {
      $args += @("--disable-extensions-except=$ExtensionDirectory")
    }
  }

  return $args
}

function Wait-ForCdpReady {
  param(
    [int]$Port,
    [int]$TimeoutMs
  )

  $baseUrl = "http://127.0.0.1:$Port/json/version"
  $deadline = [DateTime]::UtcNow.AddMilliseconds([Math]::Max(0, $TimeoutMs))
  $lastError = ""

  while ([DateTime]::UtcNow -lt $deadline) {
    try {
      $null = Invoke-RestMethod -Method Get -Uri $baseUrl -TimeoutSec 2
      return
    } catch {
      $lastError = $_.Exception.Message
      Start-Sleep -Milliseconds 350
    }
  }

  throw "Chrome launch verification failed. CDP endpoint is not reachable at $baseUrl. Last error: $lastError"
}

function Test-CdpReady {
  param([int]$Port)

  $baseUrl = "http://127.0.0.1:$Port/json/version"
  try {
    $null = Invoke-RestMethod -Method Get -Uri $baseUrl -TimeoutSec 2
    return $true
  } catch {
    return $false
  }
}

function Resolve-LoadedExtensionId {
  param(
    [string]$ProfileDirectory,
    [string]$StagedPath,
    [int]$TimeoutMs = 5000
  )

  $prefsPath = Join-Path $ProfileDirectory "Default\Preferences"
  $targetPath = Normalize-FullPath $StagedPath
  $deadline = [DateTime]::UtcNow.AddMilliseconds([Math]::Max(0, $TimeoutMs))

  while ([DateTime]::UtcNow -lt $deadline) {
    if (-not (Test-Path $prefsPath)) {
      Start-Sleep -Milliseconds 250
      continue
    }

    try {
      $raw = Get-Content -Path $prefsPath -Raw -Encoding UTF8
      if ([string]::IsNullOrWhiteSpace($raw)) {
        Start-Sleep -Milliseconds 250
        continue
      }

      $prefs = $raw | ConvertFrom-Json -Depth 100
      $settings = $prefs.extensions.settings
      if (-not $settings) {
        Start-Sleep -Milliseconds 250
        continue
      }

      foreach ($property in $settings.PSObject.Properties) {
        $entry = $property.Value
        $entryPath = Normalize-FullPath ([string]$entry.path)
        if (-not $entryPath) {
          continue
        }

        if ($entryPath -ieq $targetPath) {
          return [string]$property.Name
        }
      }
    } catch {
      # Preferences file may be mid-write; retry.
    }

    Start-Sleep -Milliseconds 250
  }

  return $null
}

function Resolve-LoadedExtensionIdFromCdp {
  param(
    [int]$Port,
    [int]$TimeoutMs = 3000
  )

  $baseUrl = "http://127.0.0.1:$Port/json/list"
  $deadline = [DateTime]::UtcNow.AddMilliseconds([Math]::Max(0, $TimeoutMs))
  $fallbackCandidates = @()

  while ([DateTime]::UtcNow -lt $deadline) {
    try {
      $targets = Invoke-RestMethod -Method Get -Uri $baseUrl -TimeoutSec 2
      if (-not $targets) {
        Start-Sleep -Milliseconds 250
        continue
      }

      foreach ($target in $targets) {
        $url = [string]$target.url
        $idMatch = [regex]::Match($url, "^chrome-extension://([a-z]{32})/")
        if (-not $idMatch.Success) {
          continue
        }

        $id = [string]$idMatch.Groups[1].Value
        if ($url -match "/background\.js(?:$|\?)") {
          return $id
        }

        $fallbackCandidates += $id
      }

      $uniqueFallbacks = $fallbackCandidates | Select-Object -Unique
      if ($uniqueFallbacks.Count -eq 1) {
        return [string]$uniqueFallbacks[0]
      }
    } catch {
      # CDP may still be starting, retry.
    }

    Start-Sleep -Milliseconds 250
  }

  return $null
}

function Write-ExtensionIdCache {
  param(
    [string]$ExtensionId,
    [string]$CachePath
  )

  if (-not $ExtensionId) {
    return
  }

  $cacheDir = Split-Path -Parent $CachePath
  if ($cacheDir) {
    Ensure-Directory $cacheDir
  }
  Set-Content -Path $CachePath -Value $ExtensionId -Encoding UTF8
}

function Ensure-ChromeForTesting {
  param(
    [string]$InstallRoot,
    [string]$VersionUrl,
    [int]$DownloadTimeoutMs
  )

  $finalDir = Join-Path $InstallRoot "chrome-win64"
  $finalExe = Join-Path $finalDir "chrome.exe"
  if (Test-Path $finalExe) {
    return $finalExe
  }

  Ensure-Directory $InstallRoot

  $version = (Invoke-RestMethod -Method Get -Uri $VersionUrl -TimeoutSec 30).ToString().Trim()
  if (-not ($version -match '^\d+\.\d+\.\d+\.\d+$')) {
    throw "Could not resolve a valid Chrome-for-Testing stable version from $VersionUrl."
  }

  $downloadUrl = "https://storage.googleapis.com/chrome-for-testing-public/$version/win64/chrome-win64.zip"

  $zipPath = Join-Path $InstallRoot "chrome-win64.zip"
  $extractRoot = Join-Path $InstallRoot "extract"

  if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
  }
  if (Test-Path $extractRoot) {
    Remove-Item -Path $extractRoot -Recurse -Force
  }

  Download-FileWithTimeout -Url $downloadUrl -OutputPath $zipPath -TimeoutMs $DownloadTimeoutMs
  Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

  $candidateExe = Join-Path $extractRoot "chrome-win64\chrome.exe"
  if (-not (Test-Path $candidateExe)) {
    $candidateExe = Get-ChildItem -Path $extractRoot -Recurse -Filter "chrome.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match "chrome-win64" } |
      Select-Object -First 1 -ExpandProperty FullName
  }

  if (-not $candidateExe -or -not (Test-Path $candidateExe)) {
    throw "Chrome-for-Testing archive extraction succeeded but chrome.exe was not found."
  }

  $candidateDir = Split-Path -Parent $candidateExe
  if (Test-Path $finalDir) {
    Remove-Item -Path $finalDir -Recurse -Force
  }
  Move-Item -Path $candidateDir -Destination $finalDir -Force

  if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
  }
  if (Test-Path $extractRoot) {
    Remove-Item -Path $extractRoot -Recurse -Force
  }

  if (-not (Test-Path $finalExe)) {
    throw "Chrome-for-Testing setup finished but executable was not found at $finalExe"
  }

  return $finalExe
}

function Download-FileWithTimeout {
  param(
    [string]$Url,
    [string]$OutputPath,
    [int]$TimeoutMs = 180000
  )

  try {
    Add-Type -AssemblyName "System.Net.Http" -ErrorAction Stop
  } catch {
    Invoke-WebRequest -Method Get -Uri $Url -OutFile $OutputPath -TimeoutSec ([Math]::Max(5, [int]($TimeoutMs / 1000)))
    return
  }

  $handler = [System.Net.Http.HttpClientHandler]::new()
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromMilliseconds([Math]::Max(1000, $TimeoutMs))

  try {
    $response = $client.GetAsync(
      $Url,
      [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
    ).GetAwaiter().GetResult()
    $response.EnsureSuccessStatusCode()

    $inputStream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
    $fileStream = [System.IO.File]::Open(
      $OutputPath,
      [System.IO.FileMode]::Create,
      [System.IO.FileAccess]::Write,
      [System.IO.FileShare]::None
    )

    try {
      $inputStream.CopyTo($fileStream)
    } finally {
      $fileStream.Dispose()
      $inputStream.Dispose()
      $response.Dispose()
    }
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Launch-DebugChrome {
  param(
    [string]$ExecutablePath,
    [string[]]$Arguments,
    [string]$ProfileDirectory,
    [int]$Port,
    [int]$StartupWaitMs
  )

  if (Test-CdpReady -Port $Port) {
    return @{
      ReusedExisting = $true
      Relaunched = $false
      ExistingProcessCount = (Get-DebugChromeProcesses -ProfileDirectory $ProfileDirectory).Count
      ReuseReason = "cdp-port-already-ready"
    }
  }

  $existingProcesses = Get-DebugChromeProcesses -ProfileDirectory $ProfileDirectory

  if ($existingProcesses.Count -gt 0) {
    Stop-DebugChromeProcesses -ProfileDirectory $ProfileDirectory
  }

  Start-Process -FilePath $ExecutablePath -ArgumentList $Arguments | Out-Null
  Wait-ForCdpReady -Port $Port -TimeoutMs $StartupWaitMs
  return @{
    ReusedExisting = $false
    Relaunched = $true
    ExistingProcessCount = $existingProcesses.Count
    ReuseReason = $null
  }
}

if (-not (Test-Path $ExtensionPath)) {
  throw "Extension path not found: $ExtensionPath"
}

$ProfileDir = Resolve-ProfileDirectory
$managedProfileDir = Get-ManagedDebugProfileDirectory
$useManagedProfileExtensionLoad = (Normalize-FullPath $ProfileDir) -ieq (Normalize-FullPath $managedProfileDir)
$staged = Stage-Extension -SourcePath $ExtensionPath -DestinationPath $StagedExtensionDir
$resolvedExtensionPath = $staged.Source
$resolvedStagedExtensionDir = $staged.Destination
Ensure-Directory $ProfileDir

$autoProvisionCftEnabled = Parse-BoolLike -Value $AutoProvisionChromeForTesting -Default $false
$runtimeMode = "system-only"
if ($ChromeRuntimeMode -ne "system-only") {
  Write-Warning "ChromeRuntimeMode='$ChromeRuntimeMode' is ignored. Forcing single-path mode: system-only."
}
$effectiveExtensionLoadMode = $(if ($useManagedProfileExtensionLoad) { "auto" } else { "manual" })
if ($ExtensionLoadMode -ne $effectiveExtensionLoadMode) {
  Write-Warning "ExtensionLoadMode='$ExtensionLoadMode' is ignored. Using '$effectiveExtensionLoadMode' for this profile."
}
if ($autoProvisionCftEnabled) {
  Write-Warning "AutoProvisionChromeForTesting is ignored. Deterministic runtime now uses Windows Google Chrome directly."
}
$effectiveChromePath = Resolve-ChromePath -OverridePath $ChromeExecutablePath
$usingCft = $false

$chromeArgs = Build-ChromeArguments `
  -Port $RemoteDebuggingPort `
  -Address $RemoteDebuggingAddress `
  -ProfileDirectory $ProfileDir `
  -LoadMode $effectiveExtensionLoadMode `
  -ExtensionDirectory $resolvedStagedExtensionDir `
  -InitialUrl $StartUrl `
  -UseDisableExtensionsExcept $useManagedProfileExtensionLoad

$launchResult = Launch-DebugChrome `
  -ExecutablePath $effectiveChromePath `
  -Arguments $chromeArgs `
  -ProfileDirectory $ProfileDir `
  -Port $RemoteDebuggingPort `
  -StartupWaitMs $WaitMs

$resolvedExtensionId = Resolve-LoadedExtensionId -ProfileDirectory $ProfileDir -StagedPath $resolvedStagedExtensionDir
if (-not $resolvedExtensionId) {
  $resolvedExtensionId = Resolve-LoadedExtensionIdFromCdp -Port $RemoteDebuggingPort
}

if ($launchResult.ReusedExisting) {
  Write-Host "Chrome debug instance reused."
} else {
  Write-Host "Chrome started with remote debugging."
}
Write-Host "Port: $RemoteDebuggingPort"
Write-Host "Address: $RemoteDebuggingAddress"
Write-Host "Chrome executable: $effectiveChromePath"
Write-Host "Chrome flavor: $(if ($usingCft) { 'chrome-for-testing' } else { 'google-chrome' })"
Write-Host "Extension source: $resolvedExtensionPath"
Write-Host "Extension staged: $resolvedStagedExtensionDir"
Write-Host "Extension load mode: $effectiveExtensionLoadMode"
Write-Host "Chrome runtime mode: $runtimeMode"
Write-Host "Profile: $ProfileDir"
Write-Host "Profile extension strategy: $(if ($useManagedProfileExtensionLoad) { 'managed-profile-auto-load' } else { 'profile-managed-install' })"
Write-Host "Launch mode: $(if ($launchResult.ReusedExisting) { 'reuse-existing' } else { 'fresh-launch' })"
if ($launchResult.ReusedExisting -and $launchResult.ReuseReason) {
  Write-Host "Reuse reason: $($launchResult.ReuseReason)"
}

if ($resolvedExtensionId) {
  try {
    Write-ExtensionIdCache -ExtensionId $resolvedExtensionId -CachePath $ExtensionIdCachePath
    Write-Host "Extension ID: $resolvedExtensionId"
    Write-Host "Extension ID cache: $ExtensionIdCachePath"
  } catch {
    Write-Warning "Extension ID resolved ($resolvedExtensionId) but cache write failed: $($_.Exception.Message)"
  }
} else {
  if ($effectiveExtensionLoadMode -eq "auto") {
    Write-Warning "Could not resolve loaded extension ID from profile preferences or CDP targets."
    Write-Warning "If this repeats, open extension popup/options once and rerun."
  } else {
    Write-Warning "No installed CaptionArc runtime detected yet for the selected profile."
    Write-Warning "Use the profile-managed unpacked install bootstrap if CaptionArc is missing from chrome://extensions."
  }
}
