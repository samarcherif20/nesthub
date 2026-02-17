@echo off
echo ========================================
echo   CONFIGURATION COMPLETE DU PROJET
echo ========================================

REM Structure app
cd app
if not exist "[locale]" mkdir "[locale]"
cd "[locale]"

mkdir "(public)"
mkdir "(auth)\login"
mkdir "(auth)\register"
mkdir "(dashboard)\dashboard"
mkdir "(dashboard)\profile"
mkdir "(dashboard)\verification"
mkdir "admin"
mkdir "admin\users"
mkdir "admin\verifications"

cd ..\..

REM API Routes
mkdir "api\webhook\clerk"
mkdir "api\users"
mkdir "api\verifications"

REM Components
cd ..
mkdir "components\locale"
mkdir "components\ui"
mkdir "components\forms"
mkdir "components\admin"
mkdir "components\dashboard"

REM Lib
mkdir "lib\utils"
mkdir "lib\validators"

REM Public
mkdir "public\images"
mkdir "public\icons"

REM Messages (traductions)
mkdir "messages"

REM Prisma
if not exist "prisma" mkdir "prisma"

echo.
echo ========================================
echo   Structure creee avec succes!
echo ========================================
pause