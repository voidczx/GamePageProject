[CmdletBinding()]
param(
    [string]$InputRoot = ''
)

$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$inputRoot = if ([string]::IsNullOrWhiteSpace($InputRoot)) { $projectRoot } else { [System.IO.Path]::GetFullPath($InputRoot) }
$sourceRoot = Join-Path $inputRoot 'r6\scripts\CyberwareLoadouts'
$manifestPath = Join-Path $inputRoot 'mod-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$version = [string]$manifest.version
$distRoot = Join-Path $projectRoot 'dist'
$stageRoot = Join-Path $projectRoot 'build\package'
$archivePath = Join-Path $distRoot ("CyberwareLoadouts-{0}.zip" -f $version)
$hashPath = Join-Path $distRoot ("CyberwareLoadouts-{0}.zip.sha256" -f $version)

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

Assert-ProjectChildPath -Path $distRoot
Assert-ProjectChildPath -Path $stageRoot
Assert-ProjectChildPath -Path $archivePath
Assert-ProjectChildPath -Path $hashPath
if ($inputRoot -ne $projectRoot) {
    Assert-ProjectChildPath -Path $inputRoot
}
Assert-NoReparsePoint -Path $inputRoot
Assert-NoReparsePoint -Path $distRoot
Assert-NoReparsePoint -Path $stageRoot

if ($version -notmatch '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$') {
    throw "Manifest version must be a release SemVer (x.y.z): $version"
}
if ([System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($archivePath)) -ne [System.IO.Path]::GetFullPath($distRoot)) {
    throw 'Release archive must stay directly inside dist.'
}

$expectedScripts = @(
    'CyberwareLoadouts.Data.reds',
    'CyberwareLoadouts.Equipment.reds',
    'CyberwareLoadouts.Logging.reds',
    'CyberwareLoadouts.System.reds',
    'CyberwareLoadouts.UI.reds',
    'CyberwareLoadouts.ZBatch.reds'
)
$sourceFiles = @(Get-ChildItem -LiteralPath $sourceRoot -File)
if ($sourceFiles.Count -ne $expectedScripts.Count -or @($sourceFiles.Name | Where-Object { $_ -notin $expectedScripts }).Count -ne 0) {
    throw 'Source directory must contain exactly the six whitelisted redscript files.'
}
Assert-NoReparsePoint -Path $sourceRoot
Assert-NoReparsePoint -Path $manifestPath
foreach ($sourceFile in $sourceFiles) {
    Assert-NoReparsePoint -Path $sourceFile.FullName
}
foreach ($file in @('README.md', 'CHANGELOG.md', 'LICENSE')) {
    Assert-NoReparsePoint -Path (Join-Path $inputRoot $file)
}

if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
New-Item -ItemType Directory -Path $distRoot -Force | Out-Null

$stageScripts = Join-Path $stageRoot 'r6\scripts\CyberwareLoadouts'
New-Item -ItemType Directory -Path $stageScripts -Force | Out-Null
foreach ($script in $expectedScripts) {
    Copy-Item -LiteralPath (Join-Path $sourceRoot $script) -Destination (Join-Path $stageScripts $script) -Force
}
foreach ($file in @('README.md', 'CHANGELOG.md', 'LICENSE', 'mod-manifest.json')) {
    Copy-Item -LiteralPath (Join-Path $inputRoot $file) -Destination (Join-Path $stageRoot $file) -Force
}

$releaseArtifacts = @(Get-ChildItem -LiteralPath $distRoot -File | Where-Object {
    $_.Name -match '^CyberwareLoadouts-(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.zip(?:\.sha256)?$'
})
foreach ($artifact in $releaseArtifacts) {
    if ([System.IO.Path]::GetDirectoryName($artifact.FullName) -ne [System.IO.Path]::GetFullPath($distRoot)) {
        throw "Refusing to remove a release artifact outside dist: $($artifact.FullName)"
    }
    Assert-ProjectChildPath -Path $artifact.FullName
    Assert-NoReparsePoint -Path $artifact.FullName
    Remove-Item -LiteralPath $artifact.FullName -Force
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$packageEntries = @()
foreach ($script in $expectedScripts) {
    $packageEntries += [pscustomobject]@{
        Source = Join-Path $stageScripts $script
        Name = "r6/scripts/CyberwareLoadouts/$script"
    }
}
foreach ($file in @('README.md', 'CHANGELOG.md', 'LICENSE', 'mod-manifest.json')) {
    $packageEntries += [pscustomobject]@{
        Source = Join-Path $stageRoot $file
        Name = $file
    }
}
$archive = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($packageEntry in $packageEntries) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive,
            $packageEntry.Source,
            $packageEntry.Name,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
}
finally {
    $archive.Dispose()
}

$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    $fileEntries = @($archive.Entries | Where-Object { -not [string]::IsNullOrEmpty($_.Name) })
    $entries = @($fileEntries | ForEach-Object { $_.FullName.Replace('\', '/') })
    $allowedEntries = @(
        'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.Data.reds',
        'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.Equipment.reds',
        'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.Logging.reds',
        'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.System.reds',
        'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.UI.reds',
        'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.ZBatch.reds',
        'README.md',
        'CHANGELOG.md',
        'LICENSE',
        'mod-manifest.json'
    )
    $scriptEntry = 'r6/scripts/CyberwareLoadouts/CyberwareLoadouts.System.reds'
    if ($entries -notcontains $scriptEntry) {
        throw "Package does not contain $scriptEntry"
    }
    if ($entries | Where-Object { $_ -match '^CyberwareLoadouts-[^/]+/' }) {
        throw 'Package has an unexpected wrapper directory and is not Vortex-rooted.'
    }
    if ($entries | Where-Object { $_ -match '(^/|\.\.|\\)' }) {
        throw 'Package contains an unsafe path.'
    }
    $unexpected = @($entries | Where-Object { $_ -notin $allowedEntries })
    if ($unexpected.Count -ne 0 -or $entries.Count -ne $allowedEntries.Count) {
        throw "Package contains non-whitelisted files: $($unexpected -join ', ')"
    }
}
finally {
    $archive.Dispose()
}

$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
[System.IO.File]::WriteAllText($hashPath, "$hash  $([System.IO.Path]::GetFileName($archivePath))`n")
Write-Host "Built $archivePath"
Write-Host "SHA256 $hash"
