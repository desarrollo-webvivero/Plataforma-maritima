# Etapa 1: Construcción (Build)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Compila el proyecto saltándose las pruebas para que sea más rápido
RUN mvn clean package -DskipTests 

# Etapa 2: Ejecución (Run)
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
# Copia el archivo .jar generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]