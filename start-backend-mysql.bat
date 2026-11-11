@echo off
title BookNest Backend API (MySQL Mode)
cd /d "%~dp0"
set "JAVA_HOME=%~dp0.tools\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "SPRING_DATASOURCE_PASSWORD=redd262"
echo ========================================================
echo   Khoi dong Backend Spring Boot API (Ket noi MySQL)
echo ========================================================
.\mvnw.cmd spring-boot:run
pause
