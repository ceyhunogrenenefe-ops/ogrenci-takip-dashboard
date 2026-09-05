# Supabase connection string'lerini tum .env dosyalarina yazar, sonra schema + seed calistirir.
# Kullanim:
#   .\scripts\use-supabase.ps1 -DatabaseUrl "postgresql://...:6543/postgres?pgbouncer=true" -DirectUrl "postgresql://...:5432/postgres"
# Opsiyonel:
#   -JwtSecret "uzun-gizli-anahtar"

param(
  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,
  [Parameter(Mandatory = $true)]
  [string]$DirectUrl,
  [string]$JwtSecret = "onlinevip-crm-dev-secret-change-me",
  [string]$WhatsAppApiUrl = "https://ogrenci-takip-dashboard.vercel.app/api/send-message",
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Write-EnvFile([string]$Path, [hashtable]$Pairs) {
  $lines = @()
  foreach ($k in $Pairs.Keys) {
    $lines += "$k=`"$($Pairs[$k])`""
  }
  $dir = Split-Path $Path -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  Set-Content -Path $Path -Value ($lines -join "`n") -Encoding UTF8
  Write-Host "  wrote $Path" -ForegroundColor DarkGray
}

Write-Host "==> crm-saas: $root" -ForegroundColor Cyan
Write-Host "==> Writing Supabase env files..." -ForegroundColor Green

Write-EnvFile "$root\.env" @{
  DATABASE_URL          = $DatabaseUrl
  DIRECT_URL            = $DirectUrl
  JWT_SECRET            = $JwtSecret
  WHATSAPP_API_URL      = $WhatsAppApiUrl
  NEXT_PUBLIC_API_URL   = "http://localhost:3001"
  API_CORS_ORIGIN       = "http://localhost:3000"
  NEXT_PUBLIC_APP_NAME  = "Online VIP CRM"
}

Write-EnvFile "$root\packages\db\.env" @{
  DATABASE_URL = $DatabaseUrl
  DIRECT_URL   = $DirectUrl
}

Write-EnvFile "$root\apps\api\.env" @{
  DATABASE_URL     = $DatabaseUrl
  DIRECT_URL       = $DirectUrl
  JWT_SECRET       = $JwtSecret
  WHATSAPP_API_URL = $WhatsAppApiUrl
  API_CORS_ORIGIN  = "http://localhost:3000"
}

Write-EnvFile "$root\apps\web\.env.local" @{
  NEXT_PUBLIC_API_URL  = "http://localhost:3001"
  NEXT_PUBLIC_APP_NAME = "Online VIP CRM"
}

Write-Host "==> Prisma generate / db push..." -ForegroundColor Green
npm run db:generate
npm run db:push

if (-not $SkipSeed) {
  Write-Host "==> Seed..." -ForegroundColor Green
  npm run db:seed
}

Write-Host ""
Write-Host "TAMAM. Lokal calistir:" -ForegroundColor Green
Write-Host "  npm run dev"
Write-Host "Login: admin@onlinevipdershane.com / demo1234"
Write-Host ""
Write-Host "Sonraki adim: GitHub'a push + Vercel'de 2 proje (web + api) ve ayni env'leri ekle." -ForegroundColor Cyan
