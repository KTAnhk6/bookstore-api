@echo off
title BookNest Backend API (H2 In-Memory Mode)
cd /d "%~dp0"
set "JAVA_HOME=%~dp0.tools\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo ========================================================
echo   Khoi dong Backend Spring Boot API (H2 In-Memory)
echo ========================================================
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.useTestClasspath=true" "-Dspring-boot.run.arguments=--spring.datasource.url=jdbc:h2:mem:demo;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1 --spring.datasource.username=sa --spring.datasource.password= --spring.datasource.driver-class-name=org.h2.Driver --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect --spring.jpa.hibernate.ddl-auto=create-drop"
pause

