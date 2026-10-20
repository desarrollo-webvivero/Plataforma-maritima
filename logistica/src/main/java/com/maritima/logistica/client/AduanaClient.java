
package com.maritima.logistica.client;

import com.maritima.logistica.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AduanaClient {

    private final RestClient restClient;
    private final JwtService jwtService;

    public AduanaClient(
            @Value("${aduana.api.url}") String aduanaUrl,
            JwtService jwtService) {

        this.restClient = RestClient.builder()
                .baseUrl(aduanaUrl)
                .build();

        this.jwtService = jwtService;
    }

    public boolean tieneBloqueoActivo(String codigoContenedor) {

        try {
            String tokenServicio = jwtService.generarTokenServicio();

            Boolean isBlocked = restClient.get()
                    .uri("/api/aduanas/verificar/{codigo}",
                            codigoContenedor)
                    .headers(headers ->
                            headers.setBearerAuth(tokenServicio))
                    .retrieve()
                    .body(Boolean.class);

            if (isBlocked == null) {
                throw new RuntimeException(
                        "Aduanas no devolvió una respuesta válida."
                );
            }

            return isBlocked;

        } catch (Exception e) {
            throw new RuntimeException(
                    "Error de comunicación con Aduanas. " +
                    "Por seguridad, el Gate-Out queda denegado.",
                    e
            );
        }
    }
}
