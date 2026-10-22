package com.maritima.logistica.service;

import com.maritima.logistica.dto.ReservaRequest;
import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.model.*;
import com.maritima.logistica.repository.BuqueRepository;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Locale;

@Service
public class ReservaContenedorService {

    private static final BigDecimal PESO_MIN = new BigDecimal("100");
    private static final BigDecimal PESO_MAX = new BigDecimal("32000");
    private static final String[] PREFIJOS = {"MAEU", "MSCU", "CMAU", "HLCU"};

    private final UsuarioExportadorRepository usuarioRepository;
    private final BuqueRepository buqueRepository;
    private final ContenedorRepository contenedorRepository;
    private final BilleteraService billeteraService;
    private final SecureRandom random = new SecureRandom();

    public ReservaContenedorService(
            UsuarioExportadorRepository usuarioRepository,
            BuqueRepository buqueRepository,
            ContenedorRepository contenedorRepository,
            BilleteraService billeteraService) {

        this.usuarioRepository = usuarioRepository;
        this.buqueRepository = buqueRepository;
        this.contenedorRepository = contenedorRepository;
        this.billeteraService = billeteraService;
    }

    /**
     * Cobro + descuento de TEUs + creación del contenedor en UNA sola transacción:
     * o se hace todo o no se hace nada. Orden de bloqueos: buque -> billetera.
     */
    @Transactional
    public Contenedor reservar(String email, ReservaRequest req) {

        UsuarioExportador usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Usuario no encontrado."));

        validar(req);

        int teus = req.tamanoTeu() == 40 ? 2 : 1;
        String naturaleza = req.naturaleza().trim();
        BigDecimal precio = calcularPrecio(req.tamanoTeu(), naturaleza, req.pesoKg());

        Buque buque = buqueRepository.buscarParaActualizar(req.buqueId())
                .orElseThrow(() -> new NegocioException("El buque seleccionado no existe."));

        int libres = buque.getTeuDisponibles() != null ? buque.getTeuDisponibles() : 0;
        if (libres < teus) {
            throw new NegocioException(
                "El buque seleccionado no tiene espacio suficiente para esta unidad."
            );
        }

        // 1. Cobro (solo con saldo realmente disponible)
        billeteraService.cobrar(usuario, precio);

        // 2. Descuento de espacio en el buque
        buque.setTeuDisponibles(libres - teus);
        buqueRepository.save(buque);

        // 3. Contenedor a nombre del exportador autenticado
        Contenedor contenedor = crearSegunNaturaleza(naturaleza);
        contenedor.setCodigo(generarCodigo());
        contenedor.setPeso(req.pesoKg());
        contenedor.setBuque(buque);
        contenedor.setCodigoExportador(usuario.getCodigoExportador());
        contenedor.setEstado(construirEstado("Embarcado (" + teus + " TEU - ", buque.getNombre(), precio));

        return contenedorRepository.save(contenedor);
    }

    private void validar(ReservaRequest req) {
        if (req == null || req.buqueId() == null) {
            throw new NegocioException("Selecciona un buque disponible.");
        }
        if (req.tamanoTeu() == null || (req.tamanoTeu() != 20 && req.tamanoTeu() != 40)) {
            throw new NegocioException("El tamaño del contenedor no es válido.");
        }
        if (req.naturaleza() == null || req.naturaleza().isBlank() || req.naturaleza().length() > 60) {
            throw new NegocioException("La naturaleza de la carga no es válida.");
        }
        if (req.pesoKg() == null
                || req.pesoKg().compareTo(PESO_MIN) < 0
                || req.pesoKg().compareTo(PESO_MAX) > 0) {
            throw new NegocioException("El peso debe estar entre 100 y 32,000 kg.");
        }
    }

    // Misma tarifa que muestra el formulario, pero calculada en el servidor
    private BigDecimal calcularPrecio(int tamanoTeu, String naturaleza, BigDecimal peso) {
        String nat = naturaleza.toLowerCase(Locale.ROOT);
        int base = tamanoTeu == 40 ? 1450 : 950;
        if (nat.contains("refrigerada")) base += 450;
        if (nat.contains("peligrosa")) base += 600;
        if (peso.compareTo(new BigDecimal("20000")) > 0) base += 250;
        return BigDecimal.valueOf(base);
    }

    private Contenedor crearSegunNaturaleza(String naturaleza) {
        String nat = naturaleza.toLowerCase(Locale.ROOT);
        if (nat.contains("refrigerada")) return new CargaRefrigerada();
        if (nat.contains("peligrosa")) return new CargaPeligrosa();
        return new CargaSeca();
    }

    private String generarCodigo() {
        String codigo;
        do {
            codigo = PREFIJOS[random.nextInt(PREFIJOS.length)]
                    + "-" + (100000 + random.nextInt(900000));
        } while (contenedorRepository.existsByCodigo(codigo));
        return codigo;
    }

    /**
     * La columna "estado" admite 50 caracteres: se recorta el nombre del buque
     * para que el texto " | $precio" (que leen los demás paneles) nunca se pierda.
     */
    static String construirEstado(String prefijo, String nombreBuque, BigDecimal monto) {
        String cola = ") | $" + monto.stripTrailingZeros().toPlainString();
        String nombre = nombreBuque != null ? nombreBuque : "";
        int espacio = 50 - prefijo.length() - cola.length();
        if (nombre.length() > espacio) {
            nombre = nombre.substring(0, Math.max(0, espacio));
        }
        return prefijo + nombre + cola;
    }
}
