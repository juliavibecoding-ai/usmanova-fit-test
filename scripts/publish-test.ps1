$ErrorActionPreference = "Stop"
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$repo = "juliavibecoding-ai/usmanova-fit-test"
$repoUrl = "https://github.com/$repo.git"
$pagesUrl = "https://juliavibecoding-ai.github.io/usmanova-fit-test/"
$logDir = Join-Path $projectRoot "output"
$logPath = Join-Path $logDir "publish.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Start-Transcript -Path $logPath -Force | Out-Null

try {
  Set-Location $projectRoot

  Write-Host "== Git status =="
  git status --short

  Write-Host "== Commit final submission files =="
  git add js/app.js README.md .nojekyll docs/screenshots scripts/publish-test.ps1
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    git commit -m "docs: prepare public test submission"
  } else {
    Write-Host "No staged changes to commit."
  }

  Write-Host "== Create or reuse GitHub repository =="
  gh repo create $repo --public --description "Тестовое задание: копия трёх экранов лендинга Usmanova Fit" --confirm
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Repository may already exist or creation failed. Continuing to remote setup..."
  }

  Write-Host "== Configure origin =="
  git remote get-url origin *> $null
  if ($LASTEXITCODE -eq 0) {
    git remote set-url origin $repoUrl
  } else {
    git remote add origin $repoUrl
  }

  Write-Host "== Push to main =="
  git push -u origin HEAD:main

  Write-Host "== Enable GitHub Pages =="
  gh api "repos/$repo/pages" *> $null
  if ($LASTEXITCODE -eq 0) {
    gh api -X PUT "repos/$repo/pages" -F "source[branch]=main" -F "source[path]=/" | Out-Host
  } else {
    gh api -X POST "repos/$repo/pages" -F "source[branch]=main" -F "source[path]=/" | Out-Host
  }

  Write-Host ""
  Write-Host "DONE"
  Write-Host "Repository: https://github.com/$repo"
  Write-Host "Demo:       $pagesUrl"
  Write-Host "Log:        $logPath"
} catch {
  Write-Host ""
  Write-Host "FAILED"
  Write-Host $_
  exit 1
} finally {
  Stop-Transcript | Out-Null
}

Read-Host "Press Enter to close"
