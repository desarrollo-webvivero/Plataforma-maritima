package com.maritima.logistica.client;

import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.security.JwtService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class AduanaClient {

    private static final Logger log = LoggerFactory.getLogger(AduanaClient.class);

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
                throw new IllegalStateException("Respuesta vacía de Aduanas");
            }

            return isBlocked;

        } catch (Exception e) {
            // Falla cerrada: si no se puede consultar a Aduanas, no se autoriza la salida.
            log.warn("No se pudo verificar el bloqueo aduanero: {}", e.getClass().getSimpleName());
            throw new NegocioException(
                    "Error de comunicación con Aduanas. " +
                    "Por seguridad, el Gate-Out queda denegado."
            );
        }
    }

    /**
     * Informa al microservicio de Aduana del dictamen emitido por el oficial.
     * Se reenvía el JWT del propio oficial (ambos servicios comparten la clave de usuarios),
     * de modo que Aduana valida que quien bloquea/libera tiene rol OFICIAL_ADUANAS o ADMIN.
     *
     * @return true si Aduana quedó sincronizada; false si no (el dictamen sigue guardado en Logística).
     */
    public boolean sincronizarDictamen(
            String codigoContenedor,
            String dictamen,
            String motivo,
            String authorizationUsuario) {

        if (authorizationUsuario == null || !authorizationUsuario.startsWith("Bearer ")) {
            return false;
        }

        try {
            if ("ROJO".equals(dictamen)) {
                restClient.post()
                        .uri("/api/aduanas/bloquear")
                        .header(HttpHeaders.AUTHORIZATION, authorizationUsuario)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of(
                                "codigoContenedor", codigoContenedor,
                                "motivo", motivo == null ? "Retención aduanera" : motivo))
                        .retrieve()
                        .toBodilessEntity();
            } else {
                restClient.post()
                        .uri("/api/aduanas/liberar")
                        .header(HttpHeaders.AUTHORIZATION, authorizationUsuario)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("codigoContenedor", codigoContenedor))
                        .retrieve()
                        .toBodilessEntity();
            }
            return true;

        } catch (Exception e) {
            log.warn("No se pudo sincronizar el dictamen con Aduanas: {}", e.getClass().getSimpleName());
            return false;
        }
    }
}
