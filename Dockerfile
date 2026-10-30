FROM eclipse-temurin:21-jre-nanoserver-ltsc2022
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
