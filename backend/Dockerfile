# --- Build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# --- Run stage ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# -TieredStopAtLevel=1: skip the C2 JIT compiler entirely - it burns CPU compiling hot methods
# for long-term throughput we don't need here, at the direct expense of startup time. On a
# CPU-throttled host (e.g. Render's free tier, a fraction of one vCPU) that trade is reversed:
# C2's background compilation competes with the app for the same starved CPU budget and measurably
# delays when Tomcat opens its port. SerialGC has far less bookkeeping overhead than the default
# G1 collector, which is tuned for multi-core hosts and does more harm than good on a single
# throttled core. -Xmx caps heap explicitly rather than trusting container-memory autodetection.
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-Xmx384m", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
