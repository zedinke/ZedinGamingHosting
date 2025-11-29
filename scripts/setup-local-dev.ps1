# Lokális Fejlesztői Környezet Beállítása
# Ez a script létrehozza a .env.local fájlt az élő szerverekre kapcsolódáshoz

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Lokális Fejlesztői Környezet Beállítása" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ellenőrzés: Van-e már .env.local fájl?
if (Test-Path ".env.local") {
    Write-Host "FIGYELEM: A .env.local fájl már létezik!" -ForegroundColor Yellow
    $overwrite = Read-Host "Felül szeretnéd írni? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Művelet megszakítva." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "Kérlek add meg az élő szerver adatait:" -ForegroundColor Green
Write-Host ""

# Adatbázis beállítások
$dbType = Read-Host "Adatbázis típus (mysql/postgresql) [mysql]"
if ([string]::IsNullOrWhiteSpace($dbType)) { $dbType = "mysql" }

$dbHost = Read-Host "Adatbázis szerver IP vagy hostname"

# Alapértelmezett port meghatározása
if ($dbType -eq 'mysql') {
    $defaultPort = '3306'
} else {
    $defaultPort = '5432'
}

$dbPort = Read-Host "Adatbázis port [$defaultPort]"
if ([string]::IsNullOrWhiteSpace($dbPort)) { 
    $dbPort = $defaultPort
}

$dbUser = Read-Host "Adatbázis felhasználó"
$dbPass = Read-Host "Adatbázis jelszó" -AsSecureString
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass)
)
$dbName = Read-Host "Adatbázis név [zedingaming]"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "zedingaming" }

# NextAuth beállítások
Write-Host ""
Write-Host "NextAuth beállítások:" -ForegroundColor Green
$nextAuthSecret = Read-Host "NEXTAUTH_SECRET (nyomj Enter-t, ha generálni szeretnél)"
if ([string]::IsNullOrWhiteSpace($nextAuthSecret)) {
    # Generálás PowerShell-lel
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $nextAuthSecret = [Convert]::ToBase64String($bytes)
    Write-Host "Generált secret: $nextAuthSecret" -ForegroundColor Yellow
}

# SMTP beállítások
Write-Host ""
Write-Host "SMTP beállítások:" -ForegroundColor Green
$smtpHost = Read-Host "SMTP host [$dbHost]"
if ([string]::IsNullOrWhiteSpace($smtpHost)) { $smtpHost = $dbHost }

$smtpPort = Read-Host "SMTP port [587]"
if ([string]::IsNullOrWhiteSpace($smtpPort)) { $smtpPort = "587" }

$smtpUser = Read-Host "SMTP felhasználó [noreply@zedgaminghosting.hu]"
if ([string]::IsNullOrWhiteSpace($smtpUser)) { $smtpUser = "noreply@zedgaminghosting.hu" }

$smtpPass = Read-Host "SMTP jelszó" -AsSecureString
$smtpPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass)
)

$smtpFrom = Read-Host "SMTP FROM cím [$smtpUser]"
if ([string]::IsNullOrWhiteSpace($smtpFrom)) { $smtpFrom = $smtpUser }

# Ollama (opcionális)
Write-Host ""
Write-Host "Ollama beállítások (opcionális, nyomj Enter-t a kihagyáshoz):" -ForegroundColor Green
$ollamaUrl = Read-Host "Ollama URL [http://$dbHost:11434]"
if ([string]::IsNullOrWhiteSpace($ollamaUrl)) { $ollamaUrl = "http://$dbHost:11434" }

# .env.local fájl létrehozása
# DATABASE_URL string összeállítása (escape-eljük a speciális karaktereket)
$databaseUrl = "$dbType" + "://" + $dbUser + ":" + $dbPassPlain + "@" + $dbHost + ":" + $dbPort + "/" + $dbName

$envContent = @"
# ============================================
# LOKÁLIS FEJLESZTŐI KÖRNYEZET - ÉLŐ SZERVEREKRE KAPCSOLÓDÁS
# ============================================
# Ez a fájl NEM kerül git-be (.gitignore-ban van)
# Csak lokális fejlesztéshez használd!

# ============================================
# ADATBÁZIS - ÉLŐ SZERVER
# ============================================
DATABASE_URL="$databaseUrl"

# ============================================
# NEXTAUTH - LOKÁLIS FEJLESZTÉS
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$nextAuthSecret"

# ============================================
# EMAIL - ÉLŐ SZERVER SMTP
# ============================================
SMTP_HOST=$smtpHost
SMTP_PORT=$smtpPort
SMTP_SECURE=false
SMTP_USER=$smtpUser
SMTP_PASSWORD=$smtpPassPlain
SMTP_FROM=$smtpFrom

# ============================================
# STRIPE (Fizetési rendszer - opcionális)
# ============================================
# Fejlesztéshez használd a test kulcsokat:
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...

# ============================================
# OLLAMA (AI Chat - opcionális)
# ============================================
OLLAMA_URL=$ollamaUrl
OLLAMA_MODEL=llama3.2:3b

# ============================================
# Opcionális beállítások
# ============================================
NODE_ENV=development
"@

# Fájl mentése
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ .env.local fájl létrehozva!" -ForegroundColor Green
Write-Host ""
Write-Host "Következő lépések:" -ForegroundColor Cyan
Write-Host "1. npm install" -ForegroundColor Yellow
Write-Host "2. npm run db:generate" -ForegroundColor Yellow
Write-Host "3. npm run dev" -ForegroundColor Yellow
Write-Host ""

