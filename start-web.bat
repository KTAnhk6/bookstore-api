@echo off
title BookNest Web App Server
cd /d "%~dp0"
echo ========================================================
echo    🚀 Khoi dong BookNest Web App (Frontend Bookstore)
echo ========================================================
echo Dang mo website tren trinh duyet...
start http://localhost:3000
echo Server dang chay tai: http://localhost:3000
echo (Nhan Ctrl + C de dung server)
if exist "src\main\resources\frontend\server.js" (
    node src\main\resources\frontend\server.js
) else if exist "src\frontend\server.js" (
    node src\frontend\server.js
) else (
    node frontend\server.js
)
pause
