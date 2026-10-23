package com.maritima.logistica.config;

import com.maritima.logistica.security.JwtAuthenticationFilter;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }
    
@Bean
public CorsConfigurationSource corsConfigurationSource() {

    CorsConfiguration configuration = new CorsConfiguration();

    // Dominio autorizado del frontend en AWS Amplify
    configuration.setAllowedOrigins(List.of(
        "https://main.d3aj0rfwtp97hr.amplifyapp.com"
    ));

    // Métodos HTTP permitidos
    configuration.setAllowedMethods(List.of(
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
    ));

    // Encabezados permitidos
    configuration.setAllowedHeaders(List.of(
        "Authorization",
        "Content-Type"
    ));

    // El frontend enviará JWT en Authorization
    configuration.setAllowCredentials(false);

    // Tiempo de almacenamiento de la respuesta preflight
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

    source.registerCorsConfiguration("/**", configuration);

    return source;
}


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())

            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, error) ->
                    response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Autenticación requerida"
                    )
                )
                .accessDeniedHandler((request, response, error) ->
                    response.sendError(
                        HttpServletResponse.SC_FORBIDDEN,
                        "Acceso denegado"
                    )
                )
            )

            .authorizeHttpRequests(auth -> auth
                // Los errores internos deben verse como 500 y no como un 401 engañoso
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Ping público para mantener el servicio despierto.
                // Ruta exacta, solo GET/HEAD, sin comodines.
                // Debe ir ANTES de las reglas de /api/logistica/usuarios/**
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/logistica/ping"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.HEAD,
                    "/api/logistica/ping"
                ).permitAll()

                // Resumen público de la página de inicio (sin sesión).
                // Ruta exacta, solo GET, devuelve datos mínimos (ver PublicoController).
                // Debe ir ANTES de las reglas de /api/logistica/usuarios/**
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/logistica/publico/resumen"
                ).permitAll()

                
                .requestMatchers(
                    HttpMethod.GET,
                    "/usuarios/*/saldo",
                    "/api/logistica/usuarios/*/saldo"
                ).hasAnyRole("EXPORTADOR", "ADMIN")



                // Registro e inicio de sesión públicos
                .requestMatchers(
                    HttpMethod.POST,
                    "/usuarios/login",
                    "/usuarios/registro",
                    "/usuarios/registro/codigo",
                    "/api/logistica/usuarios/login",
                    "/api/logistica/usuarios/registro",
                    "/api/logistica/usuarios/registro/codigo"
                ).permitAll()
                // Administración de usuarios
                .requestMatchers(
                    "/usuarios/**",
                    "/api/logistica/usuarios/**"
                ).hasRole("ADMIN")

                // Operaciones de billetera
                // Restricción temporal hasta validar propiedad de cuenta
                
                .requestMatchers(
                    HttpMethod.GET,
                    "/billetera/saldo"
                ).hasAnyRole("EXPORTADOR", "ADMIN")

                .requestMatchers(
                    HttpMethod.POST,
                    "/billetera/recargar"
                ).hasRole("EXPORTADOR")

                .requestMatchers(
                    HttpMethod.POST,
                    "/billetera/descontar"
                ).hasRole("ADMIN")

                // Operaciones portuarias
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/operaciones/gate-out/**"
                ).hasAnyRole("PUERTO", "ADMIN")

                .requestMatchers("/api/operaciones/**")
                .hasAnyRole("PUERTO", "ADMIN")

                // Crear y modificar buques
                .requestMatchers(HttpMethod.POST, "/buques")
                .hasAnyRole("NAVIERA", "ADMIN")

                .requestMatchers(HttpMethod.PUT, "/buques/**")
                .hasAnyRole("NAVIERA", "ADMIN")

                // Reserva de contenedor: el exportador paga y se crea a su nombre
                .requestMatchers(HttpMethod.POST, "/contenedores/reservar")
                .hasRole("EXPORTADOR")

                // Crear y modificar contenedores
                .requestMatchers(HttpMethod.POST, "/contenedores")
                .hasAnyRole("PUERTO", "ADMIN")

                // Semáforo aduanero: solo el oficial de Aduanas (y ADMIN) emite dictámenes.
                // El puerto NO puede liberar ni retener (separación de funciones).
                .requestMatchers(HttpMethod.PUT, "/contenedores/*/dictamen")
                .hasAnyRole("OFICIAL_ADUANAS", "ADMIN")

                // Operaciones de patio
                .requestMatchers(HttpMethod.PUT, "/contenedores/*/muelle")
                .hasAnyRole("PUERTO", "ADMIN")

                .requestMatchers(HttpMethod.POST, "/contenedores/*/ingreso-patio")
                .hasAnyRole("PUERTO", "ADMIN")

                // Cambio manual de estado con texto libre: solo ADMIN
                .requestMatchers(HttpMethod.PUT, "/contenedores/*/estado")
                .hasRole("ADMIN")

                .requestMatchers(HttpMethod.PUT, "/contenedores/**")
                .hasAnyRole("PUERTO", "ADMIN")

                // Licitaciones
                .requestMatchers(HttpMethod.POST, "/licitaciones")
                .hasAnyRole("NAVIERA", "ADMIN")

                .requestMatchers(
                    HttpMethod.POST,
                    "/licitaciones/*/pujar"
                ).hasRole("EXPORTADOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/licitaciones/*/cerrar"
                ).hasAnyRole("NAVIERA", "ADMIN")

                // Consultas generales
                .requestMatchers(
                    HttpMethod.GET,
                    "/buques",
                    "/contenedores",
                    "/licitaciones"
                ).authenticated()

                // Cualquier otra ruta requiere autenticación
                // y no se concede acceso automáticamente
                .anyRequest().denyAll()
            )

            .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}