<#
================================================================================
 Deploy the new site to samratkumardey/samratkumardey.github.io

 What this does, in order:
   1. Checks git is installed and you are signed in.
   2. Clones your repo into a temp folder (your Desktop folder is never touched).
   3. Pushes the CURRENT live site to a branch called archive/old-site,
      so the old version is preserved and recoverable forever.
   4. Clears the working tree and copies the new site in.
   5. Shows you exactly what will change, and asks before pushing anything.

 Nothing is pushed to main until you type YES at the confirmation prompt.

 To run it:  right-click this file -> "Run with PowerShell"
        or:  open PowerShell, then
             cd "$HOME\OneDrive - University of Missouri\Desktop\SKD website"
             powershell -ExecutionPolicy Bypass -File .\deploy.ps1
================================================================================
#>

$ErrorActionPreference = 'Stop'

$Owner      = 'samratkumardey'
$Repo       = 'samratkumardey.github.io'
$Branch     = 'main'
$ArchiveRef = 'archive/old-site'
$SourceDir  = $PSScriptRoot
$WorkDir    = Join-Path $env:TEMP 'skd-deploy'

function Say  ($m) { Write-Host "  $m" }
function Step ($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok   ($m) { Write-Host "  OK  $m" -ForegroundColor Green }
function Warn ($m) { Write-Host "  !   $m" -ForegroundColor Yellow }
function Die  ($m) { Write-Host "`nSTOPPED: $m" -ForegroundColor Red; Read-Host "`nPress Enter to close"; exit 1 }

Write-Host ""
Write-Host "  Deploying to https://$Owner.github.io/" -ForegroundColor White
Write-Host "  Source: $SourceDir"

# ---------------------------------------------------------------- 1. checks
Step "Checking prerequisites"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Die "git is not installed. Install it from https://git-scm.com/download/win, reopen PowerShell, and run this again."
}
Ok (git --version)

if (-not (Test-Path (Join-Path $SourceDir 'index.html'))) {
    Die "index.html not found next to this script. Run the script from inside the 'SKD website' folder."
}
if (-not (Test-Path (Join-Path $SourceDir 'data\site.json'))) {
    Die "data\site.json not found. The site folder looks incomplete."
}
$fileCount = (Get-ChildItem $SourceDir -Recurse -File).Count
Ok "Found $fileCount files to publish"

# ------------------------------------------------------------- 2. get repo
Step "Cloning $Owner/$Repo"

if (Test-Path $WorkDir) { Remove-Item $WorkDir -Recurse -Force }
git clone "https://github.com/$Owner/$Repo.git" $WorkDir 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
    Die "Clone failed. If you were asked to sign in and it did not work, run 'git credential-manager github login' first, or install GitHub Desktop and sign in there once."
}
Push-Location $WorkDir
Ok "Cloned into $WorkDir"

try {
    # -------------------------------------------------- 3. archive old site
    Step "Archiving the current live site to branch '$ArchiveRef'"

    $existing = git ls-remote --heads origin $ArchiveRef
    if ($existing) {
        Warn "Branch '$ArchiveRef' already exists on GitHub - keeping it as it is."
    } else {
        git branch $ArchiveRef $Branch 2>&1 | Out-Host
        git push origin $ArchiveRef 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) { Die "Could not push the archive branch. Nothing has been changed on main." }
        Ok "Old site preserved at https://github.com/$Owner/$Repo/tree/$ArchiveRef"
    }

    git checkout $Branch 2>&1 | Out-Null

    # ------------------------------------------------------ 4. swap content
    Step "Replacing the working tree with the new site"

    Get-ChildItem -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
    Copy-Item -Path (Join-Path $SourceDir '*') -Destination . -Recurse -Force

    # Housekeeping: these belong on your machine, not in the repo.
    Remove-Item 'deploy.ps1' -Force -ErrorAction SilentlyContinue
    Remove-Item 'DEPLOY.md'  -Force -ErrorAction SilentlyContinue
    Ok "New site staged"

    # --------------------------------------------------------- 5. review
    Step "Review the change"

    git add -A
    $stat = git diff --cached --shortstat
    $added    = (git diff --cached --name-status --diff-filter=A).Count
    $deleted  = (git diff --cached --name-status --diff-filter=D).Count
    $modified = (git diff --cached --name-status --diff-filter=M).Count

    if (-not $stat) { Warn "No differences found - your repo already matches this folder."; Pop-Location; Read-Host "`nPress Enter to close"; exit 0 }

    Say "Files added:    $added"
    Say "Files removed:  $deleted   (all recoverable from $ArchiveRef)"
    Say "Files modified: $modified"
    Write-Host ""
    Say "New files being added:"
    git diff --cached --name-only --diff-filter=A | Select-Object -First 20 | ForEach-Object { Write-Host "      + $_" }
    if ($added -gt 20) { Write-Host "      ... and $($added - 20) more" }

    Write-Host ""
    Write-Host "  This will replace the live site at https://$Owner.github.io/" -ForegroundColor Yellow
    $answer = Read-Host "  Type YES to publish, anything else to cancel"

    if ($answer -ne 'YES') {
        Pop-Location
        Write-Host "`nCancelled. Nothing was pushed to $Branch." -ForegroundColor Yellow
        Write-Host "The prepared copy is still at: $WorkDir"
        Read-Host "`nPress Enter to close"; exit 0
    }

    # ---------------------------------------------------------- 6. publish
    Step "Publishing"

    git commit -m "Rebuild site: JSON content layer, dark mode, admin panel" 2>&1 | Out-Host
    git push origin $Branch 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { Die "Push failed. Your commit is safe in $WorkDir - you can retry with 'git push origin $Branch' from there." }

    Pop-Location

    Write-Host ""
    Write-Host "  Published." -ForegroundColor Green
    Write-Host ""
    Say "Live site:     https://$Owner.github.io/         (allow ~1 minute)"
    Say "Admin panel:   https://$Owner.github.io/admin/"
    Say "Old site kept: https://github.com/$Owner/$Repo/tree/$ArchiveRef"
    Write-Host ""
    Say "Next: open the admin panel and create your GitHub token"
    Say "      (README.md, section 3 has the exact steps)."
    Write-Host ""
}
catch {
    Pop-Location -ErrorAction SilentlyContinue
    Die $_.Exception.Message
}

Read-Host "Press Enter to close"
