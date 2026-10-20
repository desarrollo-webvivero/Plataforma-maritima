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

    @Value("${jwt.service.secret}")
    private String serviceSecretKey;

    // Generamos la llave criptográfica a partir de los bytes de la clave leída
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    private Key getServiceSigningKey() {
        return Keys.hmacShaKeyFor(
                serviceSecretKey.getBytes(
                        java.nio.charset.StandardCharsets.UTF_8
                )
        );
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


    public Claims validarTokenServicio(String token) {

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getServiceSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        // Verificar la identidad del microservicio
        if (!"servicio-logistica".equals(claims.getSubject())) {
            throw new SecurityException(
                    "Identidad de servicio no autorizada"
            );
        }

        // Verificar que sea un token interno
        if (!"SERVICIO".equals(claims.get("tipo", String.class))) {
            throw new SecurityException(
                    "Tipo de token no autorizado"
            );
        }

        // Verificar el rol exclusivo de Logística
        Object roles = claims.get("roles");

        if (!(roles instanceof java.util.List<?> lista)
                || lista.size() != 1
                || !"ROLE_SERVICIO_LOGISTICA".equals(lista.get(0))) {

            throw new SecurityException(
                    "Permisos de servicio no autorizados"
            );
        }

        return claims;
    }

}