package com.maritima.logistica.controller;

import com.maritima.logistica.security.JwtService;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/usuarios", "/api/logistica/usuarios"})
public class UsuarioExportadorController {

    @Autowired
    private UsuarioExportadorRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // Inicializa cuentas base en PostgreSQL si aún no existen


    @GetMapping
    public List<UsuarioExportador> listarTodos() {
        return usuarioRepository.findAll();
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody UsuarioExportador nuevo) {
        try {
            String emailLimpio = nuevo.getEmail() != null ? nuevo.getEmail().trim().toLowerCase() : "";

            if (emailLimpio.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El correo electrónico es obligatorio."));
            }

            if (usuarioRepository.findByEmail(emailLimpio).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Este correo electrónico ya está registrado en PostgreSQL."));
            }
            String password = nuevo.getPassword();
            if (password == null || password.length() < 12) {
              return ResponseEntity.badRequest().body(
                Map.of("error", "La contraseña debe tener al menos 12 caracteres.")
              );
            }

            String rolAsignado = "EXPORTADOR";

            String prefijoRol = switch (rolAsignado) {
                case "NAVIERA" -> "NAV";
                case "PUERTO" -> "PTO";
                case "ADUANAS" -> "ADU";
                case "ADMIN" -> "ADM";
                default -> "EXP";
            };

            long siguienteNumero = usuarioRepository.count() + 1;
            String codigoGenerado = String.format("%s-%03d", prefijoRol, siguienteNumero);

            nuevo.setCodigoExportador(codigoGenerado);
            nuevo.setEmail(emailLimpio);
            nuevo.setRol(rolAsignado);

            if (nuevo.getSaldoInicial() == null) {
                nuevo.setSaldoInicial(rolAsignado.equals("EXPORTADOR") ? 10000.00 : 0.00);
            }
            nuevo.setFechaRegistro(LocalDateTime.now());

            nuevo.setPassword(passwordEncoder.encode(password));
            UsuarioExportador guardado = usuarioRepository.save(nuevo);
            return ResponseEntity.ok(guardado);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "Error al guardar usuario en PostgreSQL: " + e.getMessage())
            );
        }
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
