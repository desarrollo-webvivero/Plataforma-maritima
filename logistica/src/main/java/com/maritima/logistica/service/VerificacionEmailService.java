package com.maritima.logistica.service;

import com.maritima.logistica.model.CodigoVerificacionEmail;
import com.maritima.logistica.repository.CodigoVerificacionEmailRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class VerificacionEmailService {

    private static final int EXPIRA_MINUTOS = 10;
    private static final int MAX_INTENTOS = 5;
    private static final int COOLDOWN_SEGUNDOS = 60;
    private static final int MAX_ENVIOS_POR_CORREO_HORA = 5;
    // Tope global para no agotar la cuota gratuita de Brevo (300/día)
    private static final int MAX_ENVIOS_GLOBAL_HORA = 100;

    private final CodigoVerificacionEmailRepository repository;
    private final SecretKeySpec claveHmac;
    private final SecureRandom random = new SecureRandom();

    private final AtomicInteger contadorGlobal = new AtomicInteger(0);
    private final AtomicLong inicioVentanaGlobal =
            new AtomicLong(System.currentTimeMillis());

    public VerificacionEmailService(
            CodigoVerificacionEmailRepository repository,
            @Value("${jwt.secret}") String secreto) {

        this.repository = repository;
        // La clave del HMAC se deriva del secreto del servidor:
        // si se filtra la tabla, los hashes no se pueden revertir
        // probando los 1.000.000 de combinaciones.
        this.claveHmac = new SecretKeySpec(
                ("verificacion-email:" + secreto).getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );
    }

    /**
     * Genera y guarda un código nuevo.
     * Devuelve el código en claro SOLO para enviarlo por correo,
     * o vacío si se superó algún límite (el llamador no debe avisar al cliente).
     */
    @Transactional
    public Optional<String> generarCodigo(String email) {

        LocalDateTime ahora = LocalDateTime.now();

        CodigoVerificacionEmail registro = repository
                .buscarParaActualizar(email)
                .orElseGet(() -> {
                    CodigoVerificacionEmail nuevo = new CodigoVerificacionEmail();
                    nuevo.setEmail(email);
                    return nuevo;
                });

        // 1. Espera mínima entre envíos al mismo correo
        if (registro.getUltimoEnvio() != null
                && registro.getUltimoEnvio()
                        .plusSeconds(COOLDOWN_SEGUNDOS).isAfter(ahora)) {
            return Optional.empty();
        }

        // 2. Máximo de códigos por correo en una hora
        if (registro.getVentanaInicio() == null
                || registro.getVentanaInicio().plusHours(1).isBefore(ahora)) {
            registro.setVentanaInicio(ahora);
            registro.setEnviosVentana(0);
        }
        if (registro.getEnviosVentana() >= MAX_ENVIOS_POR_CORREO_HORA) {
            return Optional.empty();
        }

        // 3. Tope global del servicio
        if (!permitirGlobal()) {
            return Optional.empty();
        }

        String codigo = String.format("%06d", random.nextInt(1_000_000));

        registro.setCodigoHash(hash(email, codigo));
        registro.setExpiraEn(ahora.plusMinutes(EXPIRA_MINUTOS));
        registro.setIntentos(0);
        registro.setUltimoEnvio(ahora);
        registro.setEnviosVentana(registro.getEnviosVentana() + 1);

        repository.save(registro);

        return Optional.of(codigo);
    }

    /**
     * Valida el código. Si es correcto, queda consumido (un solo uso).
     * Nunca lanza excepción por un código incorrecto: así el contador de
     * intentos se guarda aunque el código sea erróneo.
     */
    @Transactional
    public boolean validarYConsumir(String email, String codigo) {

        if (codigo == null || !codigo.matches("^\\d{6}$")) {
            return false;
        }

        Optional<CodigoVerificacionEmail> opt =
                repository.buscarParaActualizar(email);

        if (opt.isEmpty()) {
            return false;
        }

        CodigoVerificacionEmail registro = opt.get();

        if (registro.getCodigoHash() == null
                || registro.getExpiraEn() == null
                || registro.getExpiraEn().isBefore(LocalDateTime.now())
                || registro.getIntentos() >= MAX_INTENTOS) {
            return false;
        }

        registro.setIntentos(registro.getIntentos() + 1);

        // Comparación en tiempo constante
        boolean correcto = MessageDigest.isEqual(
                hash(email, codigo).getBytes(StandardCharsets.UTF_8),
                registro.getCodigoHash().getBytes(StandardCharsets.UTF_8)
        );

        if (correcto) {
            registro.setCodigoHash(null);
            registro.setExpiraEn(null);
        }

        repository.save(registro);
        return correcto;
    }

    private String hash(String email, String codigo) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(claveHmac);
            byte[] resultado = mac.doFinal(
                    (email + ":" + codigo).getBytes(StandardCharsets.UTF_8)
            );
            return HexFormat.of().formatHex(resultado);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo calcular el hash", e);
        }
    }

    private boolean permitirGlobal() {
        long ahora = System.currentTimeMillis();
        long inicio = inicioVentanaGlobal.get();

        if (ahora - inicio >= 3_600_000L
                && inicioVentanaGlobal.compareAndSet(inicio, ahora)) {
            contadorGlobal.set(0);
        }
        return contadorGlobal.incrementAndGet() <= MAX_ENVIOS_GLOBAL_HORA;
    }
}
