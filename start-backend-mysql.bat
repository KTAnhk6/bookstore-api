@echo off
cd /d "%~dp0"
rem Requires installed JDK 21 and environment listed in README_MERGE.md
call mvnw.cmd spring-boot:run
pause
