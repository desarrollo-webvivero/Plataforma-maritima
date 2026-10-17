package com.maritima.logistica.repository;

import com.maritima.logistica.model.UsuarioExportador;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioExportadorRepository extends JpaRepository<UsuarioExportador, Long> {
    Optional<UsuarioExportador> findByEmail(String email);
    Optional<UsuarioExportador> findByEmailAndPassword(String email, String password);
}
