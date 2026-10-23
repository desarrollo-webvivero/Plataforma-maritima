package com.maritima.logistica.service;

import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.HistorialContenedor;
import com.maritima.logistica.model.Muelle;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.HistorialContenedorRepository;
import com.maritima.logistica.repository.MuelleRepository;
import com.maritima.logistica.repository.UsuarioExportadorRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Operaciones del patio y del semáforo aduanero.
 *
 * Reglas de seguridad:
 *  - El cliente solo envía IDs y valores de una lista cerrada; nunca texto libre de estado.
 *  - El operador se toma del JWT (email), jamás del cuerpo de la petición.
 *  - Toda operación queda registrada en el historial de auditoría.
 */
@Service
public class OperacionesPuertoService {

    private static final Logger log = LoggerFactory.getLogger(OperacionesPuertoService.class);

    public static final String ESTADO_GATE_OUT = "GATE_OUT";
    public static final String ESTADO_PATIO = "En Patio Portuario (Recepcionado)";
    private static final int MAX_ESTADO = 50; // longitud de la columna "estado"

    public static final Set<String> DICTAMENES = Set.of("VERDE", "AMARILLO", "ROJO");

    // Lista cerrada: el frontend solo puede elegir uno de estos motivos.
    public static final Set<String> MOTIVOS_RETENCION = Set.of(
            "Inspección No Intrusiva (Rayos X)",
            "Discrepancia de Peso Declarado vs Báscula",
            "Auditoría de Póliza DUCA / Bill of Lading",
            "Inspección Física Antinarcóticos (SGAIA)",
            "Control Fitosanitario y Cuarentena (MAGA)"
    );

    private static final List<String> MUELLES_INICIALES = List.of(
            "Muelle #1 (Grúa Pórtico A)",
            "Muelle #2 (Grúa Pórtico B)",
            "Muelle #3 (Terminal Granelera)",
            "Patio Fiscal #4 (Zona Refrigerada)"
    );

    private final ContenedorRepository contenedorRepository;
    private final MuelleRepository muelleRepository;
    private final HistorialContenedorRepository historialRepository;
    private final UsuarioExportadorRepository usuarioRepository;

    public OperacionesPuertoService(
            ContenedorRepository contenedorRepository,
            MuelleRepository muelleRepository,
            HistorialContenedorRepository historialRepository,
            UsuarioExportadorRepository usuarioRepository) {
        this.contenedorRepository = contenedorRepository;
        this.muelleRepository = muelleRepository;
        this.historialRepository = historialRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Crea los muelles base si la tabla está vacía (así el selector del puerto siempre tiene opciones). */
    @EventListener(ApplicationReadyEvent.class)
    public void sembrarMuelles() {
        try {
            if (muelleRepository.count() == 0) {
                for (String nombre : MUELLES_INICIALES) {
                    Muelle m = new Muelle();
                    m.setNombre(nombre);
                    m.setEstadoDisponibilidad("DISPONIBLE");
                    muelleRepository.save(m);
                }
            }
        } catch (Exception e) {
            log.warn("No se pudieron sembrar los muelles iniciales: {}", e.getClass().getSimpleName());
        }
    }

    @Transactional(readOnly = true)
    public List<Muelle> listarMuelles() {
        return muelleRepository.findAll(Sort.by("id"));
    }

    // ---------------------------------------------------------------- Muelle

    @Transactional
    public Contenedor asignarMuelle(Long contenedorId, Long muelleId, String emailOperador) {
        if (muelleId == null) {
            throw new NegocioException("Debes indicar el muelle.");
        }

        Integer operador = idOperador(emailOperador);
        Contenedor c = obtener(contenedorId);

        if (ESTADO_GATE_OUT.equalsIgnoreCase(c.getEstado())) {
            throw new NegocioException("El contenedor ya salió del puerto.");
        }

        Muelle muelle = muelleRepository.findById(muelleId)
                .orElseThrow(() -> new NegocioException("El muelle indicado no existe."));

        Long anterior = c.getMuelle() != null ? c.getMuelle().getId() : null;

        c.setMuelle(muelle);
        c.setActualizadoPor(operador);
        contenedorRepository.save(c);

        auditar(c, c.getEstado(), "CAMBIO_MUELLE", anterior, muelle.getId(), operador);
        return c;
    }

    // ---------------------------------------------------------- Ingreso patio

    @Transactional
    public Contenedor registrarIngresoPatio(Long contenedorId, String emailOperador) {
        Integer operador = idOperador(emailOperador);
        Contenedor c = obtener(contenedorId);

        if (ESTADO_GATE_OUT.equalsIgnoreCase(c.getEstado())) {
            throw new NegocioException("El contenedor ya salió del puerto.");
        }
        if (estaRetenido(c)) {
            throw new NegocioException(
                    "Operación bloqueada: este contenedor tiene una retención activa de Aduanas.");
        }
        if (c.getEstado() != null && c.getEstado().startsWith(ESTADO_PATIO)) {
            return c; // ya estaba recibido: la operación es idempotente
        }

        String anterior = c.getEstado();
        Long muelleAnterior = c.getMuelle() != null ? c.getMuelle().getId() : null;

        c.setEstado(conservarSufijoPrecio(anterior, ESTADO_PATIO));

        // Si todavía no tiene ubicación, se le asigna el primer muelle disponible
        if (c.getMuelle() == null) {
            muelleRepository.findAll(Sort.by("id")).stream().findFirst().ifPresent(c::setMuelle);
        }

        c.setActualizadoPor(operador);
        contenedorRepository.save(c);

        Long muelleNuevo = c.getMuelle() != null ? c.getMuelle().getId() : null;
        auditar(c, anterior, "INGRESO_PATIO", muelleAnterior, muelleNuevo, operador);
        return c;
    }

    // ------------------------------------------------------ Dictamen aduanero

    @Transactional
    public Contenedor aplicarDictamen(Long contenedorId, String dictamen, String motivo, String emailOficial) {
        String d = dictamen == null ? "" : dictamen.trim().toUpperCase(Locale.ROOT);
        if (!DICTAMENES.contains(d)) {
            throw new NegocioException("Dictamen aduanero no válido.");
        }

        String motivoFinal = null;
        if ("ROJO".equals(d)) {
            if (motivo == null || !MOTIVOS_RETENCION.contains(motivo.trim())) {
                throw new NegocioException("Debes seleccionar un motivo de retención válido.");
            }
            motivoFinal = motivo.trim();
        }

        Integer oficial = idOperador(emailOficial);
        Contenedor c = obtener(contenedorId);

        if (ESTADO_GATE_OUT.equalsIgnoreCase(c.getEstado())) {
            throw new NegocioException("El contenedor ya salió del puerto; no admite nuevos dictámenes.");
        }

        String anterior = c.getDictamenAduanero() == null ? "VERDE" : c.getDictamenAduanero();

        c.setDictamenAduanero(d);
        c.setMotivoDictamen(motivoFinal);
        c.setActualizadoPor(oficial);
        contenedorRepository.save(c);

        Long muelle = c.getMuelle() != null ? c.getMuelle().getId() : null;
        auditar(c, "DICTAMEN_" + anterior, "DICTAMEN_" + d, muelle, muelle, oficial);
        return c;
    }

    // ---------------------------------------------------------------- Helpers

    /** Un contenedor está retenido por el dictamen ROJO o por registros antiguos con texto "retenido". */
    public static boolean estaRetenido(Contenedor c) {
        if (c.isRetenidoPorAduana()) {
            return true;
        }
        String estado = c.getEstado() == null ? "" : c.getEstado().toLowerCase(Locale.ROOT);
        return estado.contains("retenid");
    }

    private Contenedor obtener(Long id) {
        return contenedorRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Contenedor no encontrado."));
    }

    private Integer idOperador(String email) {
        if (email == null || email.isBlank()) {
            throw new NegocioException("Usuario no válido.");
        }
        return usuarioRepository.findByEmail(email)
                .map(u -> {
                    try {
                        return Math.toIntExact(u.getId());
                    } catch (ArithmeticException ex) {
                        throw new NegocioException("Usuario no válido.");
                    }
                })
                .orElseThrow(() -> new NegocioException("Usuario no válido."));
    }

    /** Mantiene el valor pagado ("| $2500") al cambiar el estado, si cabe en la columna. */
    private String conservarSufijoPrecio(String estadoActual, String nuevoBase) {
        if (estadoActual != null) {
            int i = estadoActual.indexOf(" | $");
            if (i >= 0) {
                String conSufijo = nuevoBase + estadoActual.substring(i);
                if (conSufijo.length() <= MAX_ESTADO) {
                    return conSufijo;
                }
            }
        }
        return nuevoBase;
    }

    private void auditar(Contenedor c, String estadoAnterior, String estadoNuevo,
                         Long muelleAnterior, Long muelleNuevo, Integer usuarioId) {
        HistorialContenedor h = new HistorialContenedor();
        h.setContenedor(c);
        h.setEstadoAnterior(recortar(estadoAnterior));
        h.setEstadoNuevo(recortar(estadoNuevo));
        h.setMuelleIdAnterior(muelleAnterior);
        h.setMuelleIdNuevo(muelleNuevo);
        h.setCambiadoPor(usuarioId);
        historialRepository.save(h);
    }

    private String recortar(String texto) {
        if (texto == null) return null;
        return texto.length() <= MAX_ESTADO ? texto : texto.substring(0, MAX_ESTADO);
    }
}
