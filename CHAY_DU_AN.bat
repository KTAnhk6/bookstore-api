@echo off
title Khoi Dong BookNest Bookstore
cd /d "%~dp0"
set "TARGET_DIR=%~dp0bookstore-api-main6"
if not exist "%TARGET_DIR%\pom.xml" set "TARGET_DIR=%~dp0"

echo ========================================================
echo    KHOI DONG HE THONG BOOKNEST BOOKSTORE (FULL 100 SACH)
echo ========================================================
echo [1/2] Dang mo Backend API (Spring Boot - MySQL)...
start "BookNest-Backend-API" cmd /c "call "%TARGET_DIR%\start-backend-mysql.bat""

echo [2/2] Dang mo Frontend Web App (Node.js)...
start "BookNest-Frontend-Web" cmd /c "call "%TARGET_DIR%\start-web.bat""

echo.
echo ========================================================
echo  Giao dien web: http://localhost:3000
echo  API Backend:   http://localhost:8080/api
echo ========================================================
timeout /t 5 >nul
