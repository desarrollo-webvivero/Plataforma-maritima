package com.maritima.aduana.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica a TODOS los endpoints (/contenedores, /buques, etc.)
                .allowedOrigins("http://localhost:3000") // El puerto exacto de tu React
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600); // El navegador cachea esta política por 1 hora para ahorrar peticiones OPTIONS
    }
}