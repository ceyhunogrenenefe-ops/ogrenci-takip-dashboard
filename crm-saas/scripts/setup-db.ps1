# CRM SaaS — DB kurulum yardımcı scripti
# Yönetici PowerShell'de çalıştır:  Right-click → Run as Administrator
# Önkoşul: PostgreSQL veya Docker Desktop kurulu olmalı

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path "$root\package.json")) {
  $root = "C:\Users\ceyhu\Projects\ogrenci-takip-dashboard\crm-saas"
}
Set-Location $root

Write-Host "==> crm-saas: $root" -ForegroundColor Cyan

# 1) Docker varsa container aç
$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "==> Docker bulundu, postgres container baslatiliyor..." -ForegroundColor Green
  docker compose -f docker/docker-compose.yml up -d
  Start-Sleep -Seconds 5
} else {
  Write-Host "==> Docker yok. Yerel PostgreSQL'in localhost:5432'de calistigini varsayiyorum." -ForegroundColor Yellow
  Write-Host "    Yoksa once Docker Desktop veya PostgreSQL kur." -ForegroundColor Yellow
}

# 2) DB olustur (psql varsa)
$psql = Get-Command psql -ErrorAction SilentlyContinue
if ($psql) {
  Write-Host "==> Veritabani/kullanici kontrol..." -ForegroundColor Green
  $env:PGPASSWORD = "crm"
  # Docker compose user/db zaten crm/crm_saas; yerel kurulumda elle gerekebilir
}

Write-Host "==> Prisma generate / push / seed..." -ForegroundColor Green
npm run db:generate
npm run db:push
npm run db:seed

Write-Host ""
Write-Host "TAMAM. Simdi su komutu calistir:" -ForegroundColor Green
Write-Host "  cd $root"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "UI:  http://localhost:3000"
Write-Host "API: http://localhost:3001"
Write-Host "Login: admin@onlinevipdershane.com / demo1234"
