package com.maritima.logistica.repository;

import com.maritima.logistica.model.Billetera;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BilleteraRepository extends JpaRepository<Billetera, Long> {

    Optional<Billetera> findByExportadorId(String exportadorId);

    // Bloqueo de fila: evita que dos operaciones simultáneas gasten el mismo saldo
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Billetera b where b.exportadorId = :id")
    Optional<Billetera> buscarParaActualizar(@Param("id") String id);
}
