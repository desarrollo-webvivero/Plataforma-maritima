package com.maritima.logistica.controller;

import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/usuarios", "/api/logistica/usuarios"})
public class UsuarioExportadorController {

    @Autowired
    private UsuarioExportadorRepository usuarioRepository;

    // Inicializa cuentas base en PostgreSQL si aún no existen
    @PostConstruct
    public void inicializarUsuariosOperativos() {
        crearSiNoExiste("ADM-001", "Administración Central Port Logistics", "1000001-K", "Administrador IAM", "admin@portlogistics.com", "admin123", "+502 2222-0000", "ADMIN", 0.0);
        crearSiNoExiste("NAV-001", "Mediterranean Shipping Co. (MSC)", "2000002-K", "Jefe de Operaciones Naviera", "operaciones@naviera.com", "naviera123", "+502 2333-1111", "NAVIERA", 0.0);
        crearSiNoExiste("PTO-001", "Terminal Portuaria Quetzal", "3000003-K", "Control de Patio y Muelle", "control@puertoquetzal.com", "puerto123", "+502 7888-2222", "PUERTO", 0.0);
        crearSiNoExiste("ADU-001", "Intendencia de Aduanas SAT", "4000004-K", "Inspector Fiscal Aduanero", "fiscalizacion@sat.gob.gt", "aduana123", "+502 2444-3333", "ADUANAS", 0.0);
    }

    private void crearSiNoExiste(String prefijo, String empresa, String nit, String rep, String email, String pass, String tel, String rol, Double saldo) {
        try {
            if (usuarioRepository.findByEmail(email.toLowerCase()).isEmpty()) {
                UsuarioExportador u = new UsuarioExportador();
                u.setCodigoExportador(prefijo);
                u.setEmpresa(empresa);
                u.setNit(nit);
                u.setRepresentante(rep);
                u.setEmail(email.toLowerCase());
                u.setPassword(pass);
                u.setTelefono(tel);
                u.setRol(rol);
                u.setSaldoInicial(saldo);
                u.setFechaRegistro(LocalDateTime.now());
                usuarioRepository.save(u);
            }
        } catch (Exception ignored) {}
    }

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

            String rolAsignado = (nuevo.getRol() == null || nuevo.getRol().isEmpty())
                    ? "EXPORTADOR"
                    : nuevo.getRol().trim().toUpperCase();

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
        String email = credenciales.getOrDefault("email", "").trim().toLowerCase();
        String password = credenciales.getOrDefault("password", "");
        String rolSolicitado = credenciales.getOrDefault("rol", "").trim().toUpperCase();

        Optional<UsuarioExportador> usuarioOpt = usuarioRepository.findByEmailAndPassword(email, password);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Correo o contraseña incorrectos. Verifica tus credenciales.")
            );
        }

        UsuarioExportador usuario = usuarioOpt.get();

        // Validar que el usuario pertenezca al rol que seleccionó en la pantalla de Login
        if (!rolSolicitado.isEmpty() && !usuario.getRol().equalsIgnoreCase(rolSolicitado)) {
            return ResponseEntity.status(403).body(
                Map.of("error", "Esta cuenta pertenece al rol [" + usuario.getRol() + "], no a [" + rolSolicitado + "]. Selecciona el rol correcto arriba.")
            );
        }

        return ResponseEntity.ok(usuario);
    }

    // Consultar el saldo real en PostgreSQL de un usuario específico
    @GetMapping("/{id}/saldo")
    public ResponseEntity<?> obtenerSaldoUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(u -> ResponseEntity.ok(Map.of(
                        "id", u.getId(),
                        "codigoExportador", u.getCodigoExportador(),
                        "empresa", u.getEmpresa(),
                        "saldo", u.getSaldoInicial() != null ? u.getSaldoInicial() : 0.0
                )))
                .orElse(ResponseEntity.notFound().build());
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
