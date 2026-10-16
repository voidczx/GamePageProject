[CmdletBinding()]
param(
    [string]$GameDir = '',
    [switch]$SkipCompile
)

$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceRoot = Join-Path $projectRoot 'r6\scripts\CyberwareLoadouts'
$buildRoot = Join-Path $projectRoot 'build\verify'
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'mod-manifest.json') -Raw | ConvertFrom-Json
$version = [string]$manifest.version
if ($version -notmatch '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$') {
    throw "Manifest version must be a release SemVer (x.y.z): $version"
}
$distRoot = Join-Path $projectRoot 'dist'
$archivePath = Join-Path $distRoot ("CyberwareLoadouts-{0}.zip" -f $version)
$hashPath = "$archivePath.sha256"
$snapshotRoot = Join-Path $buildRoot 'release-input'
$snapshotSourceRoot = Join-Path $snapshotRoot 'r6\scripts\CyberwareLoadouts'
$releaseFiles = @(
    'r6\scripts\CyberwareLoadouts\CyberwareLoadouts.Data.reds',
    'r6\scripts\CyberwareLoadouts\CyberwareLoadouts.Equipment.reds',
    'r6\scripts\CyberwareLoadouts\CyberwareLoadouts.Logging.reds',
    'r6\scripts\CyberwareLoadouts\CyberwareLoadouts.System.reds',
    'r6\scripts\CyberwareLoadouts\CyberwareLoadouts.UI.reds',
    'r6\scripts\CyberwareLoadouts\CyberwareLoadouts.ZBatch.reds',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'mod-manifest.json'
)

function Assert-True {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )
    if (-not $Condition) {
        throw $Message
    }
    Write-Host "PASS: $Message"
}

function Assert-ProjectChildPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolvedProject = $projectRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $resolvedTarget = [System.IO.Path]::GetFullPath($Path)
    if (-not $resolvedTarget.StartsWith($resolvedProject, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to modify a path outside the project: $resolvedTarget"
    }
}

function Assert-NoReparsePoint {
    param([Parameter(Mandatory = $true)][string]$Path)

    $cursor = [System.IO.Path]::GetFullPath($Path)
    while (-not (Test-Path -LiteralPath $cursor)) {
        $cursor = [System.IO.Path]::GetDirectoryName($cursor)
    }
    while ($cursor.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        if (((Get-Item -LiteralPath $cursor -Force).Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Refusing to use a reparse-point path: $cursor"
        }
        if ($cursor -eq $projectRoot) { break }
        $cursor = [System.IO.Path]::GetDirectoryName($cursor)
    }
}

function Get-ReleaseHashes {
    param([Parameter(Mandatory = $true)][string]$Root)

    $hashes = @{}
    foreach ($relativePath in $releaseFiles) {
        $fullPath = Join-Path $Root $relativePath
        if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            throw "Missing release input: $fullPath"
        }
        $hashes[$relativePath] = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    return $hashes
}

function Assert-ReleaseHashesEqual {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Expected,
        [Parameter(Mandatory = $true)][hashtable]$Actual,
        [Parameter(Mandatory = $true)][string]$Message
    )

    foreach ($relativePath in $releaseFiles) {
        if ($Expected[$relativePath] -ne $Actual[$relativePath]) {
            if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
            if (Test-Path -LiteralPath $hashPath) { Remove-Item -LiteralPath $hashPath -Force }
            throw "$Message changed file: $relativePath"
        }
    }
    Write-Host "PASS: $Message"
}

function Copy-DirectoryContents {
    param(
        [Parameter(Mandatory = $true)][string]$Source,
        [Parameter(Mandatory = $true)][string]$Destination
    )

    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Destination -Recurse -Force
}

function Invoke-RedscriptCompile {
    param(
        [Parameter(Mandatory = $true)][string]$Compiler,
        [Parameter(Mandatory = $true)][string]$BaseCache,
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][hashtable]$Sources
    )

    $matrixRoot = Join-Path $buildRoot $Label
    $matrixSources = Join-Path $matrixRoot 'scripts'
    New-Item -ItemType Directory -Path $matrixSources -Force | Out-Null
    foreach ($name in $Sources.Keys) {
        Copy-DirectoryContents -Source $Sources[$name] -Destination (Join-Path $matrixSources $name)
    }

    $output = Join-Path $matrixRoot 'compiled.redscripts'
    & $Compiler -compile $matrixSources -outputCacheFile $output $BaseCache
    if ($LASTEXITCODE -ne 0) {
        throw "$Label redscript compilation failed with exit code $LASTEXITCODE"
    }
    Assert-True -Condition (Test-Path -LiteralPath $output) -Message "$Label redscript compilation"
}

$sourceFiles = @(Get-ChildItem -LiteralPath $sourceRoot -Filter '*.reds' -File)
Assert-True -Condition ($sourceFiles.Count -eq 6) -Message 'exactly six redscript source files are present'

$source = ($sourceFiles | Get-Content -Raw) -join "`n"
$systemSource = Get-Content -LiteralPath (Join-Path $sourceRoot 'CyberwareLoadouts.System.reds') -Raw
$readmeSource = Get-Content -LiteralPath (Join-Path $projectRoot 'README.md') -Raw
$v3ModuleCount = @($sourceFiles | Where-Object { (Get-Content -LiteralPath $_.FullName -TotalCount 1) -eq 'module CyberwareLoadoutsV3' }).Count
$resolveOffset = $systemSource.IndexOf('result = playerData.CWL_ResolveEntries(player, preset.entries, current, s"apply.preflight.preset\(index)", resolvedTarget)')
$noOpOffset = $systemSource.IndexOf('if this.EntriesMatch(current, resolvedTarget)')
$preflightOffset = $systemSource.IndexOf('result = this.ValidatePreset(player, playerData, resolvedTarget, current)')
$currentCaptureOffset = $systemSource.IndexOf('result = playerData.CWL_CaptureCyberware(player, current)')
$captureOffset = $systemSource.IndexOf('public func CapturePreset')
$captureResultOffset = $systemSource.IndexOf('result = playerData.CWL_CaptureCyberware(player, snapshot)', $captureOffset)
$captureCheckOffset = $systemSource.IndexOf('if !result.IsSuccess()', $captureResultOffset)
$emptyCaptureOffset = $systemSource.IndexOf('if ArraySize(snapshot) == 0', $captureOffset)
Assert-True -Condition ($systemSource -match 'preset0Initialized: Bool' -and $systemSource -match 'preset2Initialized: Bool') -Message 'three flat preset initialization flags are persisted'
Assert-True -Condition ($v3ModuleCount -eq $sourceFiles.Count) -Message 'all scripts use the fresh V3 module identity'
Assert-True -Condition ($systemSource -match 'CyberwareLoadoutsV3\.CyberwareLoadoutSystem' -and $systemSource -notmatch 'CyberwareLoadoutsV2\.CyberwareLoadoutSystem' -and $systemSource -notmatch 'CyberwareLoadouts\.CyberwareLoadoutSystem') -Message 'the ScriptableSystem does not reuse a prior persistent identity'
Assert-True -Condition ($systemSource -match 'persistent let storedEntryItemIDs: array<ItemID>' -and $systemSource -match 'persistent let storedEntryRecords: array<TweakDBID>' -and $systemSource -match 'persistent let storedPartIDs: array<ItemID>' -and $systemSource -match 'persistent let storedPartSlots: array<TweakDBID>') -Message 'exact items, stable records, programs, and slots use flat value arrays'
Assert-True -Condition ($source -notmatch 'persistent let presets: array<ref<' -and $source -notmatch 'persistent let entries: array<ref<' -and $source -notmatch 'public persistent let') -Message 'no custom object or nested ref graph is persisted'
Assert-True -Condition ($resolveOffset -ge 0 -and $noOpOffset -ge 0 -and $preflightOffset -ge 0 -and $resolveOffset -lt $noOpOffset -and $noOpOffset -lt $preflightOffset) -Message 'runtime identities resolve before no-op and mutating preflight'
Assert-True -Condition ($source -match 'transactionSystem\.HasItem' -and $source -match 'IsEquippable' -and $source -match 'CWL_IsSlotAvailable') -Message 'ownership, equippability, and exact slots are preflighted'
Assert-True -Condition ($source -match 'HumanityTotalMaxValue' -and $source -notmatch 'HumanityOverallocationPossible' -and $source -match 'CapacityBoosterHumanity' -and $source -match 'ConflictingCyberware') -Message 'native total capacity, capacity booster, and cyberware-type conflicts are preflighted'
Assert-True -Condition ($source -match 'new UnequipRequest' -and $source -match 'unequipRequest\.force = false' -and $source -match 'new GameplayEquipRequest') -Message 'native non-forced equipment requests are queued'
Assert-True -Condition ($source -notmatch '\.UnequipItem\(' -and $source -notmatch '\.EquipItem\(') -Message 'private direct equipment mutation APIs are not called'
Assert-True -Condition ($source -notmatch 'CWL_MapCapturedSideUpgrade' -and $source -notmatch 'RPGManager\.CyberwareHasSideUpgrade' -and $source -notmatch 'DuplicateRandomSeedWithOffset' -and $source -notmatch 'GetOriginalItemIDFromSideUpgrade' -and $source -notmatch 'candidateShard' -and $source -notmatch 'sideShard') -Message 'capture and resolution do not call transient side-upgrade identity APIs'
Assert-True -Condition ($source -match 'CWL_IsSideUpgradeBacking' -and $source -match 'itemRecord\.SideUpgradeItem\(\)' -and $source -match 'ItemIdentityMatches' -and $systemSource -match 'StorePreset\(index, resolvedTarget\)' -and $systemSource -match 'StorePreset\(this\.activePresetIndex, request\.expected\)') -Message 'explicit Apply resolves static side-to-backing identity and persists the stable expected target'
Assert-True -Condition ($source -notmatch 'persistent let schemaVersion' -and $source -match 'CyberwareLoadoutPreset extends IScriptable\s*\{\s*public let initialized: Bool;\s*public let entries: array<ref<CyberwareLoadoutEntry>>;\s*\}') -Message 'runtime preset objects are transient only'
Assert-True -Condition ($systemSource -notmatch 'HasCurrentPresetSchema' -and $systemSource -notmatch 'ResetLegacyPresets' -and $systemSource -notmatch 'RESAVE' -and $systemSource -notmatch 'lastAppliedPreset >= 1000') -Message 'preset schema detection, migration, and automatic clearing are absent'
Assert-True -Condition ($systemSource -notmatch 'lastAppliedPreset') -Message 'the fresh system has no legacy version-marker field'
Assert-True -Condition ($systemSource -match 'IsFlatStorageConsistent' -and $systemSource -match 'StorePreset' -and $systemSource -match 'storedPartEntryOrdinals') -Message 'flat storage validates parallel arrays and reconstructs runtime entries'
Assert-True -Condition ($captureResultOffset -ge 0 -and $captureCheckOffset -gt $captureResultOffset -and $emptyCaptureOffset -gt $captureCheckOffset) -Message 'capture identity failures are returned before a preset is overwritten'
Assert-True -Condition ($source -match 'CWL_IsSideUpgradeBacking' -and $source -notmatch 'RETAIN_SAVED_ITEM' -and $source -notmatch 'transactionSystem\.GiveItems') -Message 'Apply resolves transient side records without generating inventory objects'
Assert-True -Condition ($source -match 'CWL_RestoreParts' -and $source -match 'AddPart' -and $source -match 'ApplyEquipGLPs' -and $source -match 'partSlots') -Message 'cyberdeck programs are restored to exact slots with native GLP effects'
Assert-True -Condition ($source -match 'CWL_BuildCandidateIDs' -and $source -match 'CWL_ResolveCandidateID' -and $source -match 'CWL_ResolveEntries' -and $source -match 'AmbiguousItem') -Message 'stale item identities use exact-first unambiguous runtime resolution'
Assert-True -Condition ($source -match 'reserved: array<ItemID>' -and $source -match '!ArrayContains\(reserved, candidate\)') -Message 'valid exact identities are reserved before fallback resolution'
Assert-True -Condition ($source -match 'postRemoval' -and $source -match 'CWL_TargetProgramsAvailable' -and $source -match 'complete\.expected = expected') -Message 'items resolve again after detach and completion carries authoritative expected identities'
Assert-True -Condition ($source -match 'CWL_ResolveEntries\(player, transitionTarget, postRemoval, s"\\\(direction\)\.postDetach", resolvedTarget\)' -and $source -match 'CWL_ResolveEntries\(player, resolvedTarget, finalObserved, s"\\\(direction\)\.final", expected\)') -Message 'each transaction phase inherits the previous authoritative binding'
Assert-True -Condition ($source -notmatch 'native func LogChannel' -and $source -notmatch 'CWL_Diag\(' -and $source -notmatch 'GetItemDataByTDBID') -Message 'temporary native diagnostics and stale-item introspection are absent from the release'
Assert-True -Condition ($source -match 'CyberwareLoadoutBatchRequest' -and $source -match 'OnCyberwareLoadoutBatchCompleteRequest' -and $source -notmatch 'DelayScriptableSystemRequest') -Message 'one serialized EquipmentSystem batch emits an authoritative completion request'
Assert-True -Condition ($source -notmatch '@addMethod\(EquipmentSystem\)' -and $source -match 'class CyberwareLoadoutBatchSystem extends ScriptableSystem' -and $source -match 'private func OnCyberwareLoadoutBatchRequest') -Message 'custom batches run in an isolated ScriptableSystem'
Assert-True -Condition ($source -match 'activeBefore' -and $source -match 'RollbackFailed' -and $source -match 'QueueTransition\(this\.activePlayer, current, this\.activeBefore, true\)') -Message 'failed switching queues a verified rollback snapshot'
Assert-True -Condition ($source -match 'player\.IsInCombat\(\)' -and $source -match 'gamePSMCombat\.InCombat') -Message 'combat switching is blocked through player and PSM state'
Assert-True -Condition ($source -match 'gamePSMSwimming\.Default' -and $source -match 'definitions\.Swimming' -and $source -match 'gamePSMTimeDilation\.Default' -and $source -match 'ObjectHasStatusEffectOfType\(player, gamedataStatusEffectType\.Sandevistan\)' -and $source -match 'CamoActiveOnPlayer' -and $source -match 'ObjectHasStatusEffectWithTag\(player, n"OpticalCamoSlideCoolPerk"\)') -Message 'swimming, time dilation, and active cyberware effects are blocked'
Assert-True -Condition ($source -match 'gamePSMHighLevel\.SceneTier1' -and $source -notmatch 'LockInHubMenu') -Message 'normal gameplay and hub navigation are not mistaken for unsafe scene state'
Assert-True -Condition ($source -notmatch 'SandevistanCooldown' -and $source -notmatch 'BerserkCooldown' -and $source -notmatch 'OpticalCamo_Cool_40_Cooldown') -Message 'unverified cooldown status IDs are not hard-coded'
Assert-True -Condition ($source -match 'ArraySize\(snapshot\) == 0' -and $source -match 'EmptyCapture') -Message 'empty captures cannot become remove-all loadouts'
Assert-True -Condition ($source -match 'SetFitToContent\(false\)' -and $source -match 'Vector2\(260\.0, 72\.0\)' -and $source -match 'Vector2\(280\.0, 72\.0\)' -and $source -match 'CWL_OnSwitchFinished') -Message 'large fixed UI hit targets and asynchronous completion refresh are present'
Assert-True -Condition ($source -notmatch 'm_cwlPresetLabels: array' -and $source -match 'm_cwlPresetLabel0: wref<inkText>' -and $source -match 'm_cwlPresetLabel2: wref<inkText>') -Message 'native UI controller extensions avoid mutable array fields'
Assert-True -Condition ($source -notmatch 'RipperDeck') -Message 'RipperDeck remains a source-level optional dependency'

Assert-ProjectChildPath -Path $buildRoot
Assert-ProjectChildPath -Path $distRoot
Assert-ProjectChildPath -Path $archivePath
Assert-ProjectChildPath -Path $hashPath
if ([System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($archivePath)) -ne [System.IO.Path]::GetFullPath($distRoot)) {
    throw 'Release archive must stay directly inside dist.'
}
Assert-NoReparsePoint -Path $buildRoot
Assert-NoReparsePoint -Path $distRoot
foreach ($relativePath in $releaseFiles) {
    Assert-NoReparsePoint -Path (Join-Path $projectRoot $relativePath)
}
$initialReleaseHashes = Get-ReleaseHashes -Root $projectRoot
if (Test-Path -LiteralPath $buildRoot) {
    Remove-Item -LiteralPath $buildRoot -Recurse -Force
}
if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
}
if (Test-Path -LiteralPath $hashPath) {
    Remove-Item -LiteralPath $hashPath -Force
}
New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
foreach ($relativePath in $releaseFiles) {
    $snapshotPath = Join-Path $snapshotRoot $relativePath
    New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($snapshotPath)) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $projectRoot $relativePath) -Destination $snapshotPath -Force
}
$snapshotReleaseHashes = Get-ReleaseHashes -Root $snapshotRoot
Assert-ReleaseHashesEqual -Expected $initialReleaseHashes -Actual $snapshotReleaseHashes -Message 'immutable release snapshot matches the working source'

if ($SkipCompile) {
    Write-Host 'SKIP: redscript compile matrix explicitly disabled with -SkipCompile'
}
else {
    if ([string]::IsNullOrWhiteSpace($GameDir)) {
        throw 'Release verification requires -GameDir. Use -SkipCompile only for an explicit package-only check.'
    }

    $gameRoot = [System.IO.Path]::GetFullPath($GameDir)
    $compiler = Join-Path $gameRoot 'engine\tools\scc.exe'
    $gameBaseCache = Join-Path $gameRoot 'r6\cache\final.redscripts'
    $gameExe = Join-Path $gameRoot 'bin\x64\Cyberpunk2077.exe'
    Assert-True -Condition (Test-Path -LiteralPath $compiler) -Message 'redscript compiler exists in the game installation'
    Assert-True -Condition (Test-Path -LiteralPath $gameBaseCache) -Message 'base final.redscripts exists in the game installation'
    Assert-True -Condition (Test-Path -LiteralPath $gameExe) -Message 'game executable exists'
    $gameVersion = (Get-Item -LiteralPath $gameExe).VersionInfo.ProductVersion
    Assert-True -Condition ($gameVersion -eq [string]$manifest.testedGameVersion) -Message "game executable matches tested version $gameVersion"
    $baseCacheHash = (Get-FileHash -LiteralPath $gameBaseCache -Algorithm SHA256).Hash.ToLowerInvariant()
    $compilerHash = (Get-FileHash -LiteralPath $compiler -Algorithm SHA256).Hash.ToLowerInvariant()
    Assert-True -Condition ($baseCacheHash -eq [string]$manifest.verification.baseFinalRedscriptsSha256) -Message 'base final.redscripts matches the pinned clean 2.31 cache'
    Assert-True -Condition ($compilerHash -eq [string]$manifest.verification.redscriptCompilerSha256) -Message 'redscript compiler matches the pinned 0.5.31 test artifact'
    $vortexDeployment = Join-Path $gameRoot 'vortex.deployment.json'
    if (Test-Path -LiteralPath $vortexDeployment) {
        $deploymentText = Get-Content -LiteralPath $vortexDeployment -Raw
        Assert-True -Condition ($deploymentText -match [regex]::Escape([string]$manifest.verification.redscriptPackage)) -Message 'Vortex deployment identifies the redscript 0.5.31 package'
    }
    else {
        Write-Host 'INFO: Vortex deployment metadata is absent; pinned compiler hash remains authoritative for this verification.'
    }

    $baseCache = Join-Path $buildRoot 'base.redscripts'
    Copy-Item -LiteralPath $gameBaseCache -Destination $baseCache -Force

    $ripperDeckSource = Join-Path $gameRoot 'r6\scripts\RipperDeck'
    $cyberwareExSource = Join-Path $gameRoot 'r6\scripts\CyberwareEx'
    $codewareSource = Join-Path $gameRoot 'red4ext\plugins\Codeware\Scripts'
    $tweakXLSource = Join-Path $gameRoot 'red4ext\plugins\TweakXL\Scripts'
    foreach ($optionalSource in @($ripperDeckSource, $cyberwareExSource, $codewareSource, $tweakXLSource)) {
        Assert-True -Condition (Test-Path -LiteralPath $optionalSource) -Message "compatibility source exists: $optionalSource"
    }

    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $ripperDeckSource 'RipperDeck.reds') -TotalCount 1) -eq '// RipperDeck 1.1.0') -Message 'RipperDeck source identifies version 1.1.0'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $cyberwareExSource 'CyberwareEx.reds') -TotalCount 1) -eq '// CyberwareEx 1.5.6') -Message 'Cyberware-EX source identifies version 1.5.6'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $codewareSource 'Codeware.reds') -TotalCount 1) -eq '// Codeware 1.20.3') -Message 'Codeware source identifies version 1.20.3'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $tweakXLSource 'TweakXL.reds') -TotalCount 1) -eq '// TweakXL 1.11.4') -Message 'TweakXL source identifies version 1.11.4'

    Invoke-RedscriptCompile -Compiler $compiler -BaseCache $baseCache -Label 'base' -Sources @{
        CyberwareLoadouts = $snapshotSourceRoot
    }
    Invoke-RedscriptCompile -Compiler $compiler -BaseCache $baseCache -Label 'ripperdeck' -Sources @{
        CyberwareLoadouts = $snapshotSourceRoot
        RipperDeck = $ripperDeckSource
    }
    Invoke-RedscriptCompile -Compiler $compiler -BaseCache $baseCache -Label 'cyberware-ex' -Sources @{
        CyberwareLoadouts = $snapshotSourceRoot
        CyberwareEx = $cyberwareExSource
        Codeware = $codewareSource
        TweakXL = $tweakXLSource
    }
    Invoke-RedscriptCompile -Compiler $compiler -BaseCache $baseCache -Label 'full-compat' -Sources @{
        CyberwareLoadouts = $snapshotSourceRoot
        RipperDeck = $ripperDeckSource
        CyberwareEx = $cyberwareExSource
        Codeware = $codewareSource
        TweakXL = $tweakXLSource
    }
}

Assert-ReleaseHashesEqual -Expected $initialReleaseHashes -Actual (Get-ReleaseHashes -Root $projectRoot) -Message 'working source stayed unchanged during compilation'
& (Join-Path $PSScriptRoot 'Build.ps1') -InputRoot $snapshotRoot
Assert-True -Condition (Test-Path -LiteralPath $archivePath) -Message 'release ZIP is produced after compilation checks'
Assert-True -Condition (Test-Path -LiteralPath $hashPath) -Message 'release SHA256 sidecar is produced'
$releaseArtifacts = @(Get-ChildItem -LiteralPath $distRoot -File | Where-Object {
    $_.Name -match '^CyberwareLoadouts-(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.zip(?:\.sha256)?$'
})
Assert-True -Condition ($releaseArtifacts.Count -eq 2 -and $releaseArtifacts.FullName -contains $archivePath -and $releaseArtifacts.FullName -contains $hashPath) -Message 'dist contains only the current release ZIP and sidecar'

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    $entries = @($archive.Entries | Where-Object { -not [string]::IsNullOrEmpty($_.Name) } | ForEach-Object { $_.FullName.Replace('\', '/') })
    Assert-True -Condition ($entries -contains 'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.Data.reds') -Message 'ZIP is rooted at the game directory for Vortex'
    Assert-True -Condition (-not ($entries | Where-Object { $_ -match '^CyberwareLoadouts-[^/]+/' })) -Message 'ZIP has no wrapper directory'
    Assert-True -Condition (-not ($entries | Where-Object { $_ -match '(^|/)(logs|cache)(/|$)' })) -Message 'ZIP contains no generated logs or cache'
    Assert-True -Condition ($entries.Count -eq 10) -Message 'ZIP contains exactly six scripts and four documentation files'
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        foreach ($relativePath in $releaseFiles) {
            $entryName = $relativePath.Replace('\', '/')
            $entry = $archive.GetEntry($entryName)
            Assert-True -Condition ($null -ne $entry) -Message "ZIP contains snapshot entry $entryName"
            $stream = $entry.Open()
            try {
                $entryHash = ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
            }
            finally {
                $stream.Dispose()
            }
            if ($entryHash -ne $snapshotReleaseHashes[$relativePath]) {
                throw "ZIP entry differs from the compiled release snapshot: $entryName"
            }
        }
        Write-Host 'PASS: every ZIP entry matches the compiled immutable release snapshot'
    }
    finally {
        $sha256.Dispose()
    }
}
finally {
    $archive.Dispose()
}

$expectedHash = ((Get-Content -LiteralPath $hashPath -Raw).Trim() -split '\s+')[0]
$actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
Assert-True -Condition ($expectedHash -eq $actualHash) -Message 'SHA256 sidecar matches the release ZIP'
Assert-ReleaseHashesEqual -Expected $initialReleaseHashes -Actual (Get-ReleaseHashes -Root $projectRoot) -Message 'working source stayed unchanged through packaging'

Write-Host 'All verification checks passed.'
