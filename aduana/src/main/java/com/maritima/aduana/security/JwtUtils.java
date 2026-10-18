package com.maritima.aduana.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtils {

    // Inyectamos la clave secreta directamente desde application.properties de forma segura
    @Value("${jwt.secret}")
    private String secretKey;

    // Generamos la llave criptográfica a partir de los bytes de la clave leída
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    // Método para extraer el username/email del token
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Método para validar si el token es legítimo y no ha expirado
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // Si el token fue alterado, expiró o la firma no coincide, se rechaza de forma segura
            return false;
        }
    }

    // Extraer todos los datos guardados dentro del Token (Claims y Roles)
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}