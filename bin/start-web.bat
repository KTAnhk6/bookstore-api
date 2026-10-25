@echo off
title BookNest Web App Server
echo ========================================================
echo    🚀 Khoi dong BookNest Web App (Frontend Bookstore)
echo ========================================================
echo Dang mo website tren trinh duyet...
start http://localhost:3000
echo Server dang chay tai: http://localhost:3000
echo (Nhan Ctrl + C de dung server)
node frontend\server.js
pause
