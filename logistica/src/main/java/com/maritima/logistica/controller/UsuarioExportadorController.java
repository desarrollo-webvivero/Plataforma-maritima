package com.maritima.logistica.controller;

import com.maritima.logistica.security.JwtService;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;

import com.maritima.logistica.dto.RegistroRequest;
import com.maritima.logistica.dto.SolicitarCodigoRequest;
import com.maritima.logistica.service.BrevoEmailService;
import com.maritima.logistica.service.RegistroUsuarioService;
import com.maritima.logistica.service.VerificacionEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@RestController
@RequestMapping({"/usuarios", "/api/logistica/usuarios"})
public class UsuarioExportadorController {

    @Autowired
    private UsuarioExportadorRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RegistroUsuarioService registroService;

    @Autowired
    private VerificacionEmailService verificacionEmailService;

    @Autowired
    private BrevoEmailService brevoEmailService;

    private static final Logger log =
        LoggerFactory.getLogger(UsuarioExportadorController.class);

    private static final Pattern EMAIL_REGEX =
        Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final Set<Double> SALDOS_PERMITIDOS =
        Set.of(5000.0, 10000.0, 25000.0, 50000.0);

    // Inicializa cuentas base en PostgreSQL si aún no existen


    @GetMapping
    public List<UsuarioExportador> listarTodos() {
        return usuarioRepository.findAll();
    }

    // ---------------------------------------------------------------
    // PASO 1 del registro: solicitar código de verificación por correo
    // ---------------------------------------------------------------
    @PostMapping("/registro/codigo")
    public ResponseEntity<?> solicitarCodigo(@RequestBody SolicitarCodigoRequest req) {

        String email = normalizarEmail(req.email());

        if (!emailValido(email)) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Ingresa un correo electrónico válido.")
            );
        }

        try {
            // Si el correo ya existe NO se envía nada, pero la respuesta
            // es idéntica: así nadie puede averiguar qué correos están registrados.
            if (usuarioRepository.findByEmail(email).isEmpty()) {
                verificacionEmailService.generarCodigo(email)
                    .ifPresent(codigo -> brevoEmailService.enviarCodigoAsync(email, codigo));
            }
        } catch (Exception e) {
            log.error("Error generando código de verificación: {}", e.getClass().getSimpleName());
        }

        return ResponseEntity.ok(Map.of(
            "mensaje", "Si el correo es válido, recibirás un código de verificación en unos instantes."
        ));
    }

    // ---------------------------------------------------------------
    // PASO 2 del registro: crear la cuenta con el código recibido
    // ---------------------------------------------------------------
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody RegistroRequest req) {

        String email = normalizarEmail(req.email());

        String errorValidacion = validarRegistro(req, email);
        if (errorValidacion != null) {
            return ResponseEntity.badRequest().body(Map.of("error", errorValidacion));
        }

        // El saldo inicial solo puede ser uno de los montos del formulario.
        // Nunca se confía en un valor arbitrario enviado por el cliente.
        double saldo = req.saldoInicial() == null ? 10000.00 : req.saldoInicial();
        if (!SALDOS_PERMITIDOS.contains(saldo)) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Monto de apertura de billetera no válido.")
            );
        }

        try {
            RegistroUsuarioService.Resultado resultado =
                registroService.registrar(req, email, saldo);

            return switch (resultado.estado()) {
                case OK -> ResponseEntity.ok(resultado.usuario());

                case CODIGO_INVALIDO -> ResponseEntity.badRequest().body(
                    Map.of("error", "Código de verificación inválido o vencido.")
                );

                case EMAIL_DUPLICADO -> ResponseEntity.status(409).body(
                    Map.of("error", "No fue posible completar el registro con estos datos.")
                );
            };

        } catch (DataIntegrityViolationException e) {
            // Carrera entre dos registros simultáneos: el detalle SQL va al log, no al cliente
            log.warn("Conflicto de integridad al registrar usuario");
            return ResponseEntity.status(409).body(
                Map.of("error", "No fue posible completar el registro con estos datos.")
            );

        } catch (Exception e) {
            log.error("Error inesperado al registrar usuario", e);
            return ResponseEntity.status(500).body(
                Map.of("error", "No se pudo completar el registro. Intenta nuevamente.")
            );
        }
    }

    private static String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static boolean emailValido(String email) {
        return email.length() <= 254 && EMAIL_REGEX.matcher(email).matches();
    }

    private static boolean longitudValida(String valor, int min, int max) {
        if (valor == null) return false;
        int len = valor.trim().length();
        return len >= min && len <= max;
    }

    private String validarRegistro(RegistroRequest req, String email) {

        if (!emailValido(email)) {
            return "Ingresa un correo electrónico válido.";
        }

        if (!longitudValida(req.empresa(), 2, 120)) {
            return "La razón social debe tener entre 2 y 120 caracteres.";
        }
        if (!longitudValida(req.nit(), 3, 30)) {
            return "El NIT debe tener entre 3 y 30 caracteres.";
        }
        if (!longitudValida(req.representante(), 2, 120)) {
            return "El nombre del representante debe tener entre 2 y 120 caracteres.";
        }
        if (!longitudValida(req.telefono(), 5, 30)) {
            return "El teléfono debe tener entre 5 y 30 caracteres.";
        }

        String password = req.password();
        if (password == null || password.length() < 12) {
            return "La contraseña debe tener al menos 12 caracteres.";
        }
        // BCrypt solo procesa 72 bytes
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            return "La contraseña no puede superar 72 caracteres.";
        }

        return null;
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales) {

        String email = credenciales.getOrDefault("email", "")
            .trim().toLowerCase();

        String password = credenciales.getOrDefault("password", "");

        String rolSolicitado = credenciales.getOrDefault("rol", "")
            .trim().toUpperCase();

        Optional<UsuarioExportador> usuarioOpt =
            usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Correo o contraseña incorrectos.")
            );
        }

        UsuarioExportador usuario = usuarioOpt.get();

        String hashGuardado = usuario.getPassword();

        if (hashGuardado == null ||
            !hashGuardado.matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$") ||
            !passwordEncoder.matches(password, hashGuardado)) {

            return ResponseEntity.status(401).body(
                Map.of("error", "Correo o contraseña incorrectos.")
            );
        }

        if (!rolSolicitado.isEmpty() &&
            !usuario.getRol().equalsIgnoreCase(rolSolicitado)) {

            return ResponseEntity.status(403).body(
                Map.of("error", "El rol seleccionado no corresponde a esta cuenta.")
            );
        }


        String token = jwtService.generarToken(
                usuario.getEmail(),
                usuario.getRol()
        );

        return ResponseEntity.ok(Map.of(
                "mensaje", "Inicio de sesión exitoso",
                "token", token,
                "tipo", "Bearer",
                "expiraEn", 3600,
                "usuario", usuario
        ));

    }
    // Consultar el saldo real en PostgreSQL de un usuario específico
    @GetMapping("/{id}/saldo")
    public ResponseEntity<?> obtenerSaldoUsuario(
            @PathVariable Long id,
            Authentication authentication) {

        Optional<UsuarioExportador> usuarioOpt =
                usuarioRepository.findById(id);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UsuarioExportador usuario = usuarioOpt.get();

        boolean esAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean esPropietario = usuario.getEmail()
                .equalsIgnoreCase(authentication.getName());

        if (!esAdmin && !esPropietario) {
            return ResponseEntity.status(403).body(
                    Map.of("error", "No tienes permiso para consultar este saldo.")
            );
        }

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "codigoExportador", usuario.getCodigoExportador(),
                "empresa", usuario.getEmpresa(),
                "saldo", usuario.getSaldoInicial() != null
                        ? usuario.getSaldoInicial()
                        : 0.0
        ));
    }



    // Actualizar (descontar o recargar) el saldo en PostgreSQL de un usuario específico
    @PutMapping("/{id}/saldo")
    public ResponseEntity<?> actualizarSaldoUsuario(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return usuarioRepository.findById(id).map(u -> {
            double saldoActual = u.getSaldoInicial() != null ? u.getSaldoInicial() : 0.0;

            if (payload.containsKey("nuevoSaldo")) {
                saldoActual = Double.parseDouble(payload.get("nuevoSaldo").toString());
            } else if (payload.containsKey("descontar")) {
                double descuento = Double.parseDouble(payload.get("descontar").toString());
                if (saldoActual < descuento) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Saldo insuficiente en la cuenta del exportador."));
                }
                saldoActual -= descuento;
            } else if (payload.containsKey("recargar")) {
                double recarga = Double.parseDouble(payload.get("recargar").toString());
                saldoActual += recarga;
            }

            u.setSaldoInicial(Math.max(0.0, saldoActual));
            UsuarioExportador guardado = usuarioRepository.save(u);
            return ResponseEntity.ok(guardado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario eliminado correctamente"));
    }
}
