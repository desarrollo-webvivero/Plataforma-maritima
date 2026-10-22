package com.maritima.logistica.service;

import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.model.Buque;
import com.maritima.logistica.model.CargaSeca;
import com.maritima.logistica.model.Contenedor;
import com.maritima.logistica.model.Licitacion;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.BuqueRepository;
import com.maritima.logistica.repository.ContenedorRepository;
import com.maritima.logistica.repository.LicitacionRepository;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;

/**
 * Pujas y cierre de subastas.
 * - Al pujar NO se cobra: se RETIENE el dinero (queda bloqueado mientras la puja sea la ganadora).
 * - Al cerrar, se cobra al ganador y se le crea su contenedor.
 * Orden de bloqueos (evita deadlocks): licitación -> buque -> billetera.
 */
@Service
public class SubastaService {

    private static final BigDecimal MONTO_MAXIMO = new BigDecimal("10000000");

    public record Cierre(Licitacion licitacion, String contenedorCodigo, BigDecimal monto) {}

    private final LicitacionRepository licitacionRepository;
    private final BuqueRepository buqueRepository;
    private final ContenedorRepository contenedorRepository;
    private final UsuarioExportadorRepository usuarioRepository;
    private final BilleteraService billeteraService;
    private final SecureRandom random = new SecureRandom();

    public SubastaService(
            LicitacionRepository licitacionRepository,
            BuqueRepository buqueRepository,
            ContenedorRepository contenedorRepository,
            UsuarioExportadorRepository usuarioRepository,
            BilleteraService billeteraService) {

        this.licitacionRepository = licitacionRepository;
        this.buqueRepository = buqueRepository;
        this.contenedorRepository = contenedorRepository;
        this.usuarioRepository = usuarioRepository;
        this.billeteraService = billeteraService;
    }

    @Transactional
    public Licitacion pujar(String email, Long licitacionId, BigDecimal monto) {

        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new NegocioException("La puja debe ser mayor a cero.");
        }
        if (monto.stripTrailingZeros().scale() > 2 || monto.compareTo(MONTO_MAXIMO) > 0) {
            throw new NegocioException("El monto de la puja no es válido.");
        }

        UsuarioExportador usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Usuario no encontrado."));
        String codigo = usuario.getCodigoExportador();

        Licitacion lic = licitacionRepository.buscarParaActualizar(licitacionId)
                .orElseThrow(() -> new NegocioException("La subasta no existe."));

        if (!"ACTIVA".equalsIgnoreCase(lic.getEstado())) {
            throw new NegocioException("La subasta ya no está activa.");
        }

        BigDecimal actual = lic.getPujaActual() != null ? lic.getPujaActual() : lic.getPrecioBase();
        if (actual == null) {
            throw new NegocioException("La subasta no tiene un precio base válido.");
        }
        if (monto.compareTo(actual) <= 0) {
            throw new NegocioException("Tu puja debe superar la oferta actual.");
        }

        // Dinero gastable = saldo - retenido en OTRAS subastas.
        // Si ya eres el mejor postor aquí, tu retención actual se reemplaza por la nueva puja.
        var billetera = billeteraService.bloquear(usuario);
        BigDecimal retenido = billeteraService.bloqueadoPor(codigo);
        if (codigo.equals(lic.getMejorPostor()) && lic.getPujaActual() != null) {
            retenido = retenido.subtract(lic.getPujaActual());
        }
        BigDecimal disponible = billetera.getSaldoDisponible().subtract(retenido);

        if (disponible.compareTo(monto) < 0) {
            throw new NegocioException(
                "Saldo insuficiente. Recarga tu Billetera Virtual para pujar."
            );
        }

        lic.setPujaActual(monto);
        lic.setMejorPostor(codigo);
        return licitacionRepository.save(lic);
    }

    @Transactional
    public Cierre cerrar(Long licitacionId) {

        Licitacion lic = licitacionRepository.buscarParaActualizar(licitacionId)
                .orElseThrow(() -> new NegocioException("La subasta no existe."));

        if (!"ACTIVA".equalsIgnoreCase(lic.getEstado())) {
            throw new NegocioException("La subasta ya fue cerrada.");
        }
        if (lic.getMejorPostor() == null || lic.getPujaActual() == null) {
            throw new NegocioException("No hay pujas registradas: no se puede adjudicar.");
        }

        UsuarioExportador ganador = usuarioRepository.findByCodigoExportador(lic.getMejorPostor())
                .orElseThrow(() -> new NegocioException("No se encontró al exportador ganador."));

        int teus = lic.getEspaciosTeu() != null ? lic.getEspaciosTeu() : 0;
        BigDecimal monto = lic.getPujaActual();

        // 1. Capacidad del buque
        Buque buqueEncontrado = null;
        if (lic.getBuque() != null) {
            List<Buque> buques = buqueRepository.buscarPorNombreParaActualizar(lic.getBuque());
            if (!buques.isEmpty()) {
                buqueEncontrado = buques.get(0);
                int capacidad = buqueEncontrado.getTeuDisponibles() != null
                        ? buqueEncontrado.getTeuDisponibles() : 0;
                buqueEncontrado.setTeuDisponibles(Math.max(0, capacidad - teus));
                buqueRepository.save(buqueEncontrado);
            }
        }

        // 2. Cobro al ganador (su puja ya estaba retenida)
        billeteraService.cobrarGanador(ganador, monto);

        // 3. Contenedor a nombre del ganador
        Contenedor contenedor = new CargaSeca();
        contenedor.setCodigo(generarCodigo(lic.getBuque()));
        contenedor.setPeso(new BigDecimal("14500"));
        contenedor.setBuque(buqueEncontrado);
        contenedor.setCodigoExportador(ganador.getCodigoExportador());
        contenedor.setEstado(ReservaContenedorService.construirEstado(
                "Adjudicado (" + (teus > 0 ? teus : 10) + " TEUs - ", lic.getBuque(), monto));
        contenedorRepository.save(contenedor);

        // 4. Cierre
        lic.setEstado("ADJUDICADA");
        licitacionRepository.save(lic);

        return new Cierre(lic, contenedor.getCodigo(), monto);
    }

    private String generarCodigo(String nombreBuque) {
        String limpio = (nombreBuque == null ? "" : nombreBuque)
                .replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        String prefijo = (limpio + "XXX").substring(0, 3) + "U";

        String codigo;
        do {
            codigo = prefijo + "-" + (100000 + random.nextInt(900000));
        } while (contenedorRepository.existsByCodigo(codigo));
        return codigo;
    }
}
