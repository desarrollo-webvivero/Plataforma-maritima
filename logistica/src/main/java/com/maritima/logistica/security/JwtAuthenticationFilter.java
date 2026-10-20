
package com.maritima.logistica.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String secretKey;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7);

            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(
                                secretKey.getBytes(StandardCharsets.UTF_8)
                        ))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                String email = claims.getSubject();

                if (email != null
                        && !email.isBlank()
                        && claims.getExpiration() != null
                        && SecurityContextHolder.getContext()
                                .getAuthentication() == null) {

                    Object rolesClaim = claims.get("roles");

                    if (rolesClaim instanceof List<?> roles
                            && !roles.isEmpty()
                            && roles.stream().allMatch(
                                    r -> r instanceof String
                                            && ((String) r).startsWith("ROLE_")
                            )) {

                        List<SimpleGrantedAuthority> authorities =
                                roles.stream()
                                        .map(r -> new SimpleGrantedAuthority(
                                                (String) r
                                        ))
                                        .collect(Collectors.toList());

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        email,
                                        null,
                                        authorities
                                );

                        SecurityContextHolder.getContext()
                                .setAuthentication(authentication);
                    }
                }

            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
