package com.maritima.logistica.service;

import com.maritima.logistica.dto.RegistroRequest;
import com.maritima.logistica.model.UsuarioExportador;
import com.maritima.logistica.repository.UsuarioExportadorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RegistroUsuarioService {

    public enum Estado { OK, CODIGO_INVALIDO, EMAIL_DUPLICADO }

    public record Resultado(Estado estado, UsuarioExportador usuario) {}

    private final UsuarioExportadorRepository usuarioRepository;
    private final VerificacionEmailService verificacionService;
    private final PasswordEncoder passwordEncoder;
    private final BilleteraService billeteraService;

    public RegistroUsuarioService(
            UsuarioExportadorRepository usuarioRepository,
            VerificacionEmailService verificacionService,
            PasswordEncoder passwordEncoder,
            BilleteraService billeteraService) {

        this.usuarioRepository = usuarioRepository;
        this.verificacionService = verificacionService;
        this.passwordEncoder = passwordEncoder;
        this.billeteraService = billeteraService;
    }

    /**
     * Todo en UNA transacción: si algo falla al guardar el usuario,
     * el código de verificación NO queda consumido.
     * Los datos ya vienen validados y normalizados desde el controlador.
     */
    @Transactional
    public Resultado registrar(RegistroRequest datos, String email, double saldo) {

        // 1. Primero el código: sin correo verificado no se revela nada más
        if (!verificacionService.validarYConsumir(email, datos.codigoVerificacion())) {
            return new Resultado(Estado.CODIGO_INVALIDO, null);
        }

        if (usuarioRepository.findByEmail(email).isPresent()) {
            return new Resultado(Estado.EMAIL_DUPLICADO, null);
        }

        UsuarioExportador usuario = new UsuarioExportador();
        usuario.setEmpresa(datos.empresa().trim());
        usuario.setNit(datos.nit().trim());
        usuario.setRepresentante(datos.representante().trim());
        usuario.setTelefono(datos.telefono().trim());
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(datos.password()));
        usuario.setRol("EXPORTADOR");
        usuario.setSaldoInicial(saldo);
        usuario.setFechaRegistro(LocalDateTime.now());

        // Código temporal único (la columna es NOT NULL y UNIQUE)
        usuario.setCodigoExportador("TMP-" + UUID.randomUUID());

        // saveAndFlush hace el INSERT ya y nos da el id definitivo
        usuario = usuarioRepository.saveAndFlush(usuario);

        // El código público se deriva del id, que NUNCA se repite
        // (a diferencia de count()+1, que se repite al borrar usuarios)
        usuario.setCodigoExportador(String.format("EXP-%03d", usuario.getId()));
        usuario = usuarioRepository.save(usuario);

        // La billetera nace junto con la cuenta, con el saldo de apertura elegido
        billeteraService.obtenerOCrear(usuario);

        return new Resultado(Estado.OK, usuario);
    }
}
