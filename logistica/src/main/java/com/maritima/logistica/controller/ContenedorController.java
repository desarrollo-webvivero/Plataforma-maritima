package com.maritima.logistica.controller;

import com.maritima.logistica.dto.ContenedorDTO;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.CargaSeca;
import com.maritima.logistica.model.CargaRefrigerada;
import com.maritima.logistica.model.CargaPeligrosa;
import com.maritima.logistica.dto.ReservaRequest;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import com.maritima.logistica.service.ReservaContenedorService;
import com.maritima.logistica.service.OperacionesPuertoService;
import com.maritima.logistica.client.AduanaClient;
import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.model.Muelle;
import com.maritima.logistica.repository.MuelleRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contenedores")
//@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ContenedorController {

    @Autowired
    private ContenedorRepository repository;

    @Autowired
    private UsuarioExportadorRepository usuarioRepository;

    @Autowired
    private ReservaContenedorService reservaService;

    @Autowired
    private OperacionesPuertoService operacionesService;

    @Autowired
    private MuelleRepository muelleRepository;

    @Autowired
    private AduanaClient aduanaClient;

    // Un EXPORTADOR solo ve SUS contenedores; el personal (puerto, naviera, admin) ve todos.
    @GetMapping
    @Transactional(readOnly = true)
    public List<Contenedor> obtenerContenedores(Authentication authentication) {

        boolean esExportador = authentication != null
                && authentication.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_EXPORTADOR"));

        List<Contenedor> lista;

        if (esExportador) {
            lista = usuarioRepository.findByEmail(authentication.getName())
                    .map(u -> repository.findByCodigoExportador(u.getCodigoExportador()))
                    .orElse(List.of());
        } else {
            lista = repository.findAll();
        }

        agregarUbicacion(lista);
        return lista;
    }

    // Completa muelleId / muelleNombre para que el panel del puerto muestre la ubicación real.
    private void agregarUbicacion(List<Contenedor> lista) {
        Map<Long, String> nombres = new HashMap<>();
        for (Muelle m : muelleRepository.findAll()) {
            nombres.put(m.getId(), m.getNombre());
        }
        for (Contenedor c : lista) {
            if (c.getMuelle() != null) {
                Long id = c.getMuelle().getId(); // el id está en el proxy: no genera consulta extra
                c.setMuelleId(id);
                c.setMuelleNombre(nombres.get(id));
            }
        }
    }

    // El exportador reserva: el servidor calcula precio y TEUs, cobra, descuenta el
    // espacio del buque y crea el contenedor a su nombre, todo en una transacción.
    @PostMapping("/reservar")
    public ResponseEntity<Contenedor> reservar(
            @RequestBody ReservaRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
            reservaService.reservar(authentication.getName(), request)
        );
    }

    @PostMapping
    public ResponseEntity<?> crearContenedor(@RequestBody ContenedorDTO dto) {
        
        Contenedor nuevoContenedor;
        
        // 1. Instanciamos la clase hija correcta basándonos en el DTO de React
        if (dto.getTipo() != null) {
            String tipo = dto.getTipo().toLowerCase();
            if (tipo.contains("refrigerada")) {
                nuevoContenedor = new CargaRefrigerada();
            } else if (tipo.contains("peligrosa")) {
                nuevoContenedor = new CargaPeligrosa();
            } else {
                nuevoContenedor = new CargaSeca(); // Por defecto será carga seca
            }
        } else {
            nuevoContenedor = new CargaSeca();
        }
        
        // 2. Llenamos los datos principales usando los Setters de la clase abstracta
        nuevoContenedor.setCodigo(dto.getCodigo());
        nuevoContenedor.setEstado(dto.getEstado());
        
        if (dto.getPeso() != null) {
            nuevoContenedor.setPeso(dto.getPeso());
        } else {
            nuevoContenedor.setPeso(new java.math.BigDecimal("0.0"));
        }
        
        // 3. Guardamos en la base de datos de PostgreSQL
        Contenedor guardado = repository.save(nuevoContenedor);
        
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstadoPortuario(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> payload) {
        return repository.findById(id).map(contenedor -> {
            if (payload.containsKey("estado")) {
                contenedor.setEstado(payload.get("estado").toString());
            }
            if (payload.containsKey("muelleId")) {
                // Como muelle es una entidad ManyToOne o campo Integer según la entidad,
                // guardamos la fecha de actualización automáticamente por @PreUpdate
            }
            contenedor.setFechaActualizacion(java.time.LocalDateTime.now());
            return ResponseEntity.ok(repository.save(contenedor));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- Operaciones de patio (rol PUERTO / ADMIN, validado en SecurityConfig) ----

    // Cambia la ubicación (muelle) de un contenedor. Solo se recibe el ID del muelle.
    @PutMapping("/{id}/muelle")
    public ResponseEntity<?> asignarMuelle(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        Long muelleId = leerLong(payload == null ? null : payload.get("muelleId"));

        Contenedor c = operacionesService.asignarMuelle(id, muelleId, authentication.getName());

        return ResponseEntity.ok(Map.of(
            "id", c.getId(),
            "muelleId", muelleId
        ));
    }

    // Recibe el contenedor en el patio (antes Gate-In). El estado lo decide el servidor.
    @PostMapping("/{id}/ingreso-patio")
    public ResponseEntity<?> registrarIngresoPatio(
            @PathVariable Long id,
            Authentication authentication) {

        Contenedor c = operacionesService.registrarIngresoPatio(id, authentication.getName());

        return ResponseEntity.ok(Map.of(
            "id", c.getId(),
            "estado", c.getEstado()
        ));
    }

    // ---- Dictamen del semáforo aduanero (rol OFICIAL_ADUANAS / ADMIN) ----

    @PutMapping("/{id}/dictamen")
    public ResponseEntity<?> emitirDictamen(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        if (payload == null) {
            throw new NegocioException("Solicitud inválida.");
        }

        // 1. Se guarda primero en Logística (fuente de verdad para el bloqueo de salida)
        Contenedor c = operacionesService.aplicarDictamen(
            id,
            payload.get("dictamen"),
            payload.get("motivo"),
            authentication.getName()
        );

        // 2. Se informa al microservicio de Aduana (fuera de la transacción)
        boolean sincronizado = aduanaClient.sincronizarDictamen(
            c.getCodigo(),
            c.getDictamenAduanero(),
            c.getMotivoDictamen(),
            authorization
        );

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("id", c.getId());
        respuesta.put("dictamen", c.getDictamenAduanero());
        respuesta.put("motivo", c.getMotivoDictamen());
        respuesta.put("retenidoPorAduana", c.isRetenidoPorAduana());
        respuesta.put("sincronizadoAduana", sincronizado);

        return ResponseEntity.ok(respuesta);
    }

    private Long leerLong(Object valor) {
        if (valor == null) {
            return null;
        }
        try {
            return Long.valueOf(valor.toString().trim());
        } catch (NumberFormatException ex) {
            throw new NegocioException("Identificador no válido.");
        }
    }
}
