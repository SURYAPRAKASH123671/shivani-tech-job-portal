package com.shivanitech.jobportal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JobPortalApplication {

    private static final Logger log = LoggerFactory.getLogger(JobPortalApplication.class);

    public static void main(String[] args) {
        // Logged before the Spring context starts, so this always appears in the deploy logs
        // even if the app then fails while building the datasource/entityManagerFactory -
        // the #1 cause of "Unable to determine Dialect" on a fresh Render deploy is DB_URL/
        // DB_USERNAME/DB_PASSWORD not being set, silently falling back to the localhost default.
        log.info("Startup config check: DB_URL={}, DB_USERNAME set={}, DB_PASSWORD set={}, PORT={}",
                System.getenv().getOrDefault("DB_URL", "NOT SET (falling back to localhost default - this will fail outside local dev)"),
                System.getenv("DB_USERNAME") != null,
                System.getenv("DB_PASSWORD") != null,
                System.getenv().getOrDefault("PORT", "not set (using SERVER_PORT/default)"));
        SpringApplication.run(JobPortalApplication.class, args);
    }
}
