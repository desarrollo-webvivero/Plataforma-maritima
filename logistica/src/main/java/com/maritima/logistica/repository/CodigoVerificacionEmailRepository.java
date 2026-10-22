package com.maritima.logistica.repository;

import com.maritima.logistica.model.CodigoVerificacionEmail;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CodigoVerificacionEmailRepository
        extends JpaRepository<CodigoVerificacionEmail, Long> {

    // Bloqueo de fila: evita que dos peticiones simultáneas
    // salten el límite de intentos.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CodigoVerificacionEmail c where c.email = :email")
    Optional<CodigoVerificacionEmail> buscarParaActualizar(@Param("email") String email);
}
