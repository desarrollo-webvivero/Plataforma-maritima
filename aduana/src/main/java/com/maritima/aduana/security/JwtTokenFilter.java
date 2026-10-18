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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String header = request.getHeader("Authorization");

        // 1. Verificamos si la petición trae la cabecera Authorization con formato Bearer
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            // 2. Validamos el token con nuestra utilidad
            if (jwtUtils.validateToken(token)) {
                Claims claims = jwtUtils.extractAllClaims(token);
                String username = claims.getSubject();

                // 3. Extraemos los roles incrustados en el token (ej: "roles": ["ROLE_OFICIAL_ADUANAS"])
                List<String> roles = claims.get("roles", List.class);
                
                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                // 4. Creamos la credencial de autenticación para Spring Security
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        username, null, authorities
                );

                // 5. Establecemos la autenticación en el contexto global del servidor
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        // Continuar con la cadena de filtros de la aplicación
        filterChain.doFilter(request, response);
    }
}