package com.maritima.logistica.service;

import com.maritima.logistica.exception.NegocioException;
import com.maritima.logistica.model.Billetera;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.BilleteraRepository;
import com.maritima.logistica.repository.LicitacionRepository;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * ÚNICA fuente de verdad del dinero de cada exportador.
 * Todo el saldo vive en la tabla "billeteras"; el campo saldoInicial del usuario
 * solo sirve para sembrar la billetera la primera vez.
 */
@Service
public class BilleteraService {

    private static final BigDecimal RECARGA_MAXIMA = new BigDecimal("1000000");

    /**
     * saldoTotal      = dinero en la cuenta
     * bloqueado       = retenido por pujas ganadoras en subastas activas
     * saldoDisponible = lo que realmente se puede gastar (total - bloqueado)
     */
    public record Resumen(
            String exportadorId,
            BigDecimal saldoTotal,
            BigDecimal bloqueado,
            BigDecimal saldoDisponible) {}

    private final BilleteraRepository repository;
    private final UsuarioExportadorRepository usuarioRepository;
    private final LicitacionRepository licitacionRepository;

    public BilleteraService(
            BilleteraRepository repository,
            UsuarioExportadorRepository usuarioRepository,
            LicitacionRepository licitacionRepository) {

        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
        this.licitacionRepository = licitacionRepository;
    }

    // ---------------------------------------------------------------
    // Usuario autenticado (siempre sale del JWT, nunca del cliente)
    // ---------------------------------------------------------------
    public UsuarioExportador usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Sin sesión.");
        }

        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Usuario no encontrado."));
    }

    // ---------------------------------------------------------------
    // Consultas
    // ---------------------------------------------------------------
    @Transactional
    public Resumen resumenActual() {
        return resumenDe(usuarioActual());
    }

    @Transactional
    public Resumen resumenDe(UsuarioExportador usuario) {
        return resumen(obtenerOCrear(usuario));
    }

    @Transactional
    public Billetera obtenerOCrear(UsuarioExportador usuario) {
        String codigo = usuario.getCodigoExportador();

        return repository.findByExportadorId(codigo).orElseGet(() -> {
            Billetera nueva = new Billetera();
            nueva.setExportadorId(codigo);
            // Se siembra con el saldo de apertura elegido al registrarse
            double semilla = usuario.getSaldoInicial() != null ? usuario.getSaldoInicial() : 0.0;
            nueva.setSaldoDisponible(
                BigDecimal.valueOf(semilla).setScale(2, RoundingMode.HALF_UP)
            );
            return repository.save(nueva);
        });
    }

    // ---------------------------------------------------------------
    // Operaciones (todas bloquean la fila de la billetera)
    // ---------------------------------------------------------------
    @Transactional
    public Resumen recargar(BigDecimal monto) {
        validarMonto(monto);
        if (monto.compareTo(RECARGA_MAXIMA) > 0) {
            throw new NegocioException("El monto máximo por recarga es de 1,000,000.");
        }

        Billetera billetera = bloquear(usuarioActual());
        billetera.setSaldoDisponible(billetera.getSaldoDisponible().add(monto));
        return resumen(repository.save(billetera));
    }

    /** Cobro administrativo sobre la billetera del usuario autenticado (uso interno ADMIN). */
    @Transactional
    public Resumen descontar(BigDecimal monto) {
        validarMonto(monto);
        Billetera billetera = bloquear(usuarioActual());

        if (disponible(billetera).compareTo(monto) < 0) {
            throw new NegocioException("Fondos insuficientes en la billetera virtual.");
        }
        billetera.setSaldoDisponible(billetera.getSaldoDisponible().subtract(monto));
        return resumen(repository.save(billetera));
    }

    /**
     * Cobra un gasto normal (ej. reservar un contenedor).
     * Solo se puede gastar el saldo DISPONIBLE, no el retenido en pujas.
     */
    @Transactional
    public void cobrar(UsuarioExportador usuario, BigDecimal monto) {
        validarMonto(monto);
        Billetera billetera = bloquear(usuario);

        if (disponible(billetera).compareTo(monto) < 0) {
            throw new NegocioException(
                "Saldo insuficiente en tu Billetera Virtual para cubrir esta operación."
            );
        }
        billetera.setSaldoDisponible(billetera.getSaldoDisponible().subtract(monto));
        repository.save(billetera);
    }

    /**
     * Cobra al ganador de una subasta. Su puja ya estaba retenida,
     * así que solo se verifica que el saldo total alcance.
     */
    @Transactional
    public void cobrarGanador(UsuarioExportador ganador, BigDecimal monto) {
        Billetera billetera = bloquear(ganador);

        if (billetera.getSaldoDisponible().compareTo(monto) < 0) {
            throw new NegocioException("El ganador ya no cuenta con fondos suficientes.");
        }
        billetera.setSaldoDisponible(billetera.getSaldoDisponible().subtract(monto));
        repository.save(billetera);
    }

    /** Saldo gastable de una billetera ya bloqueada (total menos retenido en pujas). */
    public BigDecimal disponible(Billetera billetera) {
        return billetera.getSaldoDisponible().subtract(bloqueadoPor(billetera.getExportadorId()));
    }

    public BigDecimal bloqueadoPor(String codigoExportador) {
        BigDecimal suma = licitacionRepository.sumarBloqueado(codigoExportador);
        return suma != null ? suma : BigDecimal.ZERO;
    }

    /** Obtiene la billetera con bloqueo de fila (creándola si no existe). */
    @Transactional
    public Billetera bloquear(UsuarioExportador usuario) {
        obtenerOCrear(usuario);
        return repository.buscarParaActualizar(usuario.getCodigoExportador())
                .orElseThrow(() -> new NegocioException("No se encontró la billetera."));
    }

    private Resumen resumen(Billetera billetera) {
        BigDecimal total = billetera.getSaldoDisponible();
        BigDecimal bloqueado = bloqueadoPor(billetera.getExportadorId());
        BigDecimal disponible = total.subtract(bloqueado).max(BigDecimal.ZERO);
        return new Resumen(billetera.getExportadorId(), total, bloqueado, disponible);
    }

    private void validarMonto(BigDecimal monto) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new NegocioException("El monto debe ser mayor a cero.");
        }
        if (monto.stripTrailingZeros().scale() > 2) {
            throw new NegocioException("El monto admite máximo 2 decimales.");
        }
        if (monto.compareTo(new BigDecimal("10000000")) > 0) {
            throw new NegocioException("El monto excede el límite permitido.");
        }
    }
}
