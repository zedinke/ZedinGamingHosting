# SSH Kulcs Beállítása Webszerverhez
# Használat: .\scripts\setup-ssh-key.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔑 SSH Kulcs Beállítása Webszerverhez" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$serverIP = "116.203.226.140"
$serverUser = "root"
$serverPassword = "Gele007ta..."
$keyPath = "$env:USERPROFILE\.ssh\webserver_key"
$pubKeyPath = "$keyPath.pub"

# 1. Ellenőrzés: Van-e már webserver_key?
if (Test-Path $keyPath) {
    Write-Host "✅ webserver_key már létezik: $keyPath" -ForegroundColor Green
} else {
    Write-Host "📝 webserver_key létrehozása..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "webserver-key" -f $keyPath -N '""' -q
    Write-Host "✅ webserver_key létrehozva" -ForegroundColor Green
}

# 2. Publikus kulcs kiolvasása
$pubKey = Get-Content $pubKeyPath -Raw
$pubKey = $pubKey.Trim()

Write-Host ""
Write-Host "📋 Publikus kulcs:" -ForegroundColor Yellow
Write-Host $pubKey -ForegroundColor Gray
Write-Host ""

# 3. Publikus kulcs másolása a szerverre
Write-Host "📤 Publikus kulcs másolása a szerverre..." -ForegroundColor Yellow
Write-Host "   (Jelszó szükséges: $serverPassword)" -ForegroundColor Gray
Write-Host ""

# SSH parancs a kulcs hozzáadásához
$command = @"
mkdir -p ~/.ssh && 
echo '$pubKey' >> ~/.ssh/authorized_keys && 
chmod 700 ~/.ssh && 
chmod 600 ~/.ssh/authorized_keys && 
echo 'SSH kulcs sikeresen hozzáadva!'
"@

# Jelszó átadása SSH-nak (Windows-on nincs sshpass, ezért manuálisan kell)
Write-Host "⚠️  Figyelem: A következő lépésben meg kell adnod a jelszót: $serverPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Futtatandó parancs:" -ForegroundColor Cyan
Write-Host "ssh $serverUser@$serverIP `"$command`"" -ForegroundColor White
Write-Host ""

$response = Read-Host "Szeretnéd most futtatni? (i/n)"
if ($response -eq "i" -or $response -eq "I") {
    ssh $serverUser@$serverIP $command
} else {
    Write-Host ""
    Write-Host "📝 Manuális lépések:" -ForegroundColor Yellow
    Write-Host "1. Kapcsolódj a szerverhez: ssh $serverUser@$serverIP" -ForegroundColor White
    Write-Host "2. Futtasd: mkdir -p ~/.ssh" -ForegroundColor White
    Write-Host "3. Futtasd: echo '$pubKey' >> ~/.ssh/authorized_keys" -ForegroundColor White
    Write-Host "4. Futtasd: chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
    Write-Host ""
}

# 4. Tesztelés
Write-Host ""
Write-Host "🧪 SSH kulcs tesztelése..." -ForegroundColor Yellow
Write-Host "   (Ha működik, nem kér jelszót)" -ForegroundColor Gray
Write-Host ""

$testResponse = Read-Host "Szeretnéd most tesztelni? (i/n)"
if ($testResponse -eq "i" -or $testResponse -eq "I") {
    Write-Host "Kapcsolódás tesztelése..." -ForegroundColor Cyan
    ssh -i $keyPath -o ConnectTimeout=5 $serverUser@$serverIP "echo '✅ SSH kulcs működik!' && hostname"
} else {
    Write-Host ""
    Write-Host "📝 Tesztelés később:" -ForegroundColor Yellow
    Write-Host "ssh -i $keyPath $serverUser@$serverIP" -ForegroundColor White
    Write-Host ""
}

Write-Host "✅ Kész!" -ForegroundColor Green

