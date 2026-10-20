
package com.maritima.logistica.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.service.secret}")
    private String serviceSecretKey;

    private static final long EXPIRACION_MS = 60 * 60 * 1000;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
    }

    private Key getServiceSigningKey() {
        return Keys.hmacShaKeyFor(
                serviceSecretKey.getBytes(StandardCharsets.UTF_8)
        );
    }



    public String generarToken(String email, String rol) {

        String autoridad = convertirRolAAutoridad(rol);

        return Jwts.builder()
                .setSubject(email)
                .addClaims(Map.of(
                        "roles", List.of(autoridad)
                ))
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + EXPIRACION_MS)
                )
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private String convertirRolAAutoridad(String rol) {

        if (rol == null) {
            throw new IllegalArgumentException("Rol no definido");
        }

        return switch (rol.trim().toUpperCase()) {
            case "ADMIN" -> "ROLE_ADMIN";
            case "NAVIERA" -> "ROLE_NAVIERA";
            case "PUERTO" -> "ROLE_PUERTO";
            case "ADUANAS", "OFICIAL_ADUANAS" -> "ROLE_OFICIAL_ADUANAS";
            case "EXPORTADOR" -> "ROLE_EXPORTADOR";
            default -> throw new IllegalArgumentException(
                    "Rol no autorizado: " + rol
            );
        };
    }


    public String generarTokenServicio() {

        return Jwts.builder()
                .setSubject("servicio-logistica")
                .addClaims(Map.of(
                        "roles", List.of("ROLE_SERVICIO_LOGISTICA"),
                        "tipo", "SERVICIO"
                ))
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + 5 * 60 * 1000)
                )
                .signWith(
                        getServiceSigningKey(),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

   
}
