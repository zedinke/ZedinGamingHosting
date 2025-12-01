@echo off
echo ========================================
echo ZedinGamingHosting SaaS Telepites
echo ========================================
echo.

REM Ellenorizzuk, hogy Node.js telepítve van-e
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HIBA: Node.js nincs telepítve!
    echo Kérjük, telepítsd a Node.js-t: https://nodejs.org/
    pause
    exit /b 1
)

REM Ellenorizzuk, hogy npm telepítve van-e
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HIBA: npm nincs telepítve!
    pause
    exit /b 1
)

echo [1/6] Node.js verzio ellenorzese...
node --version
npm --version
echo.

echo [2/6] Fuggosegek telepitese...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo HIBA: A fuggosegek telepitese sikertelen!
    pause
    exit /b 1
)
echo.

echo [3/6] Adatbazis mappa letrehozasa...
if not exist "data" mkdir data
echo.

echo [4/6] Prisma client generalasa...
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo HIBA: Prisma client generalasa sikertelen!
    pause
    exit /b 1
)
echo.

echo [5/6] Adatbazis inicializalasa...
call npm run db:push
if %ERRORLEVEL% NEQ 0 (
    echo HIBA: Adatbazis inicializalasa sikertelen!
    pause
    exit /b 1
)
echo.

echo [6/6] Admin felhasznalo letrehozasa...
echo.
set /p ADMIN_EMAIL="Admin email cim: "
set /p ADMIN_PASSWORD="Admin jelszo: "

call npm run setup:admin -- --email "%ADMIN_EMAIL%" --password "%ADMIN_PASSWORD%"
if %ERRORLEVEL% NEQ 0 (
    echo HIBA: Admin felhasznalo letrehozasa sikertelen!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Telepites sikeresen befejezodott!
echo ========================================
echo.
echo Inditas: npm run dev
echo Production build: npm run build && npm start
echo.
pause

