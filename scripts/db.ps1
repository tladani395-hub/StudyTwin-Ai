# PowerShell script for Database Operations on Windows
param (
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("up", "migrate", "seed", "test", "backup", "restore")]
    [string]$Action,
    [Parameter(Mandatory=$false, Position=1)]
    [string]$FilePath
)

$backendDir = Join-Path $PSScriptRoot "..\backend"
$python = Join-Path $backendDir "venv\Scripts\python.exe"

switch ($Action) {
    "up" {
        Write-Host "Ensuring PostgreSQL service is online..." -ForegroundColor Cyan
        wsl -d Ubuntu -u root -e bash -c "service postgresql status || service postgresql start"
        Write-Host "PostgreSQL is running on localhost:5432." -ForegroundColor Green
    }
    "migrate" {
        Write-Host "Running Alembic migrations..." -ForegroundColor Cyan
        Push-Location $backendDir
        & $python -m alembic upgrade head
        Pop-Location
    }
    "seed" {
        Write-Host "Seeding database with authentic data..." -ForegroundColor Cyan
        Push-Location $backendDir
        & $python scripts/seed.py
        Pop-Location
    }
    "test" {
        Write-Host "Running tenant isolation tests..." -ForegroundColor Cyan
        Push-Location $backendDir
        & $python -m pytest tests/test_tenant_isolation.py -v
        Pop-Location
    }
    "backup" {
        $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
        $backupDir = Join-Path $PSScriptRoot "..\backups"
        if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
        $target = Join-Path $backupDir "studytwin_backup_$timestamp.dump"
        Write-Host "Creating backup at $target..." -ForegroundColor Cyan
        wsl -d Ubuntu -e bash -c "PGPASSWORD=studytwin_password pg_dump -h 127.0.0.1 -p 5431 -U studytwin -d studytwin_db -F c -b -v -f /mnt/d/StudyTwin-AI/backups/studytwin_backup_$timestamp.dump"
        Write-Host "Backup created successfully!" -ForegroundColor Green
    }
    "restore" {
        if (!$FilePath) {
            Write-Error "Please specify backup file path. Example: .\scripts\db.ps1 restore .\backups\studytwin_backup_xyz.dump"
            return
        }
        Write-Host "Restoring database from $FilePath..." -ForegroundColor Cyan
        $wslPath = $FilePath -replace "\\", "/" -replace "D:", "/mnt/d"
        wsl -d Ubuntu -e bash -c "PGPASSWORD=studytwin_password pg_restore -h 127.0.0.1 -p 5431 -U studytwin -d studytwin_db -v -c $wslPath"
        Write-Host "Database restored successfully!" -ForegroundColor Green
    }
}
