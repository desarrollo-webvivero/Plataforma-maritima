
package com.maritima.aduana.security;

import io.jsonwebtoken.Claims;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtTokenFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        SecurityContextHolder.clearContext();

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7).trim();

            try {
                Claims claims;

                boolean consultaServicio =
                        "GET".equals(request.getMethod())
                        && request.getServletPath()
                                .startsWith("/api/aduanas/verificar/");

                if (consultaServicio) {

                    // Validación exclusiva para Logística
                    claims = jwtUtils.validarTokenServicio(token);

                } else {

                    // Validación normal para usuarios
                    if (!jwtUtils.validateToken(token)) {
                        throw new SecurityException(
                                "Token de usuario inválido"
                        );
                    }

                    claims = jwtUtils.extractAllClaims(token);
                }

                String username = claims.getSubject();
                Object rolesClaim = claims.get("roles");

                if (username != null
                        && !username.isBlank()
                        && rolesClaim instanceof List<?> roles
                        && !roles.isEmpty()
                        && roles.stream().allMatch(
                                role -> role instanceof String
                                        && !((String) role).isBlank())) {

                    List<SimpleGrantedAuthority> authorities =
                            roles.stream()
                                    .map(role ->
                                            new SimpleGrantedAuthority(
                                                    (String) role
                                            )
                                    )
                                    .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    null,
                                    authorities
                            );

                    SecurityContextHolder.getContext()
                            .setAuthentication(auth);
                }

            } catch (RuntimeException ex) {

                // Ante cualquier error, no autenticar
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
