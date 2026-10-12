package com.maritima.aduana.config;

import com.maritima.aduana.security.JwtTokenFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtTokenFilter jwtTokenFilter;

    public SecurityConfig(JwtTokenFilter jwtTokenFilter) {
        this.jwtTokenFilter = jwtTokenFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilitar CSRF ya que usamos una API REST Stateless con JWT
            .csrf(csrf -> csrf.disable())
            // Indicar que no se crearán sesiones HTTP en memoria (Stateless puro)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Configurar las reglas de acceso por URL y Roles
            .authorizeHttpRequests(auth -> auth
                // Endpoints protegidos para Aduanas: Solo el oficial de aduanas puede manipular bloqueos
                .requestMatchers("/api/bloqueos/**").hasRole("OFICIAL_ADUANAS")
                // Resto de endpoints que requieran autenticación general
                .anyRequest().authenticated()
            )
            // Añadir nuestro filtro JWT antes del filtro estándar de usuario/contraseña de Spring
            .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}