package com.maritima.logistica.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AduanaClient {

    private final RestClient restClient;

    public AduanaClient(@Value("${aduana.api.url}") String aduanaUrl) {
        this.restClient = RestClient.builder().baseUrl(aduanaUrl).build();
    }

    public boolean tieneBloqueoActivo(Long contenedorId) {
        try {
            // Consulta síncrona al microservicio de Aduanas
            Boolean isBlocked = restClient.get()
                    .uri("/api/bloqueos/contenedor/{id}", contenedorId)
                    .retrieve()
                    .body(Boolean.class);
            
            return Boolean.TRUE.equals(isBlocked);
            
        } catch (Exception e) {
            // Política de seguridad estricta: Si Aduanas no responde o está caído, nadie sale.
            throw new RuntimeException("Error de comunicación con Aduanas. Por seguridad, el Gate-out queda denegado.");
        }
    }
}