
package com.maritima.aduana.config;

import com.maritima.aduana.security.JwtTokenFilter;

import jakarta.servlet.http.HttpServletResponse;

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
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

                // Solo oficiales y administradores
                // pueden crear bloqueos aduaneros.
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/aduanas/bloquear"
                ).hasAnyRole("OFICIAL_ADUANAS", "ADMIN")

                // Solo el servicio Logística puede
                // consultar bloqueos de contenedores.
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/aduanas/verificar/**"
                ).hasRole("SERVICIO_LOGISTICA")

                // Denegar las rutas no autorizadas
                // explícitamente.
                .anyRequest().denyAll()
            )

            .addFilterBefore(
                jwtTokenFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
