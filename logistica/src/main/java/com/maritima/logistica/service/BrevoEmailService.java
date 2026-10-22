package com.maritima.logistica.service;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Envía el código por la API transaccional de Brevo.
 * La API key viene SOLO de variables de entorno.
 */
@Service
public class BrevoEmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);
    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestClient restClient;
    private final String apiKey;
    private final String remitenteEmail;
    private final String remitenteNombre;

    // Hilos "daemon": no bloquean el apagado del servicio
    private final ExecutorService ejecutor = Executors.newFixedThreadPool(2, r -> {
        Thread t = new Thread(r, "brevo-envio");
        t.setDaemon(true);
        return t;
    });

    public BrevoEmailService(
            @Value("${brevo.api.key:}") String apiKey,
            @Value("${brevo.sender.email:}") String remitenteEmail,
            @Value("${brevo.sender.name:Port Logistics}") String remitenteNombre) {

        this.apiKey = apiKey;
        this.remitenteEmail = remitenteEmail;
        this.remitenteNombre = remitenteNombre;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    /**
     * Envío en segundo plano: la respuesta al usuario no depende de Brevo,
     * así no se puede deducir si un correo está registrado por el tiempo
     * de respuesta ni por fallos de Brevo.
     */
    public void enviarCodigoAsync(String destino, String codigo) {
        try {
            ejecutor.execute(() -> enviarCodigo(destino, codigo));
        } catch (RuntimeException e) {
            log.error("No se pudo encolar el envío del código de verificación");
        }
    }

    private void enviarCodigo(String destino, String codigo) {

        if (apiKey.isBlank() || remitenteEmail.isBlank()) {
            log.error("Brevo no está configurado (BREVO_API_KEY / BREVO_SENDER_EMAIL).");
            return;
        }

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
                  <h2 style="color:#1e3a8a;margin:0 0 12px">Port Logistics</h2>
                  <p>Tu código de verificación para crear tu cuenta es:</p>
                  <p style="font-size:34px;font-weight:bold;letter-spacing:8px;margin:16px 0">%s</p>
                  <p style="color:#555">Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje.</p>
                  <p style="color:#555">Nunca compartas este código con nadie.</p>
                </div>
                """.formatted(codigo);

        Map<String, Object> cuerpo = Map.of(
                "sender", Map.of("name", remitenteNombre, "email", remitenteEmail),
                "to", List.of(Map.of("email", destino)),
                "subject", "Tu código de verificación",
                "htmlContent", html
        );

        try {
            restClient.post()
                    .uri(BREVO_URL)
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(cuerpo)
                    .retrieve()
                    .toBodilessEntity();

        } catch (RestClientResponseException e) {
            // Solo el código HTTP: nunca el cuerpo, el código ni el correo
            log.error("Brevo rechazó el envío. HTTP {}", e.getStatusCode().value());
        } catch (Exception e) {
            log.error("Error de comunicación con Brevo: {}", e.getClass().getSimpleName());
        }
    }

    @PreDestroy
    void cerrar() {
        ejecutor.shutdown();
    }
}
